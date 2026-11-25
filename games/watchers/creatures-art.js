/* Watchers — dessin procédural des créatures (pixel art 40×40, vue de profil, tournée vers la gauche). */
"use strict";
const CREATURE_ART = (() => {
  const N = 40;
  const TYPE_COLORS = {
    Flamme: ["#d9572b", "#f2b134", "#7a2614"],
    Onde: ["#3b7dd8", "#9fd3f5", "#1c3f7a"],
    Sève: ["#4e9a4a", "#c4e06a", "#24521f"],
    Roc: ["#8a7356", "#c9b38d", "#4a3a28"],
    Givre: ["#8fd0e8", "#ffffff", "#3f7d99"],
    Foudre: ["#e8c830", "#fff3a0", "#8a6f10"],
    Vent: ["#9ec9b4", "#eef8f2", "#4f7a66"],
    Ombre: ["#4b3a66", "#a36bd6", "#221a30"],
    Lumière: ["#f0d98a", "#ffffff", "#a8873a"],
    Esprit: ["#c46fb0", "#f3c1e6", "#6e2f61"],
  };

  function rnd(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  function shade(h, f) { const [r, g, b] = hex(h); return f > 0 ? toHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f) : toHex(r * (1 + f), g * (1 + f), b * (1 + f)); }
  function hueShift(h, deg) {
    let [r, g, b] = hex(h).map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let hh = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      hh = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh /= 6; }
    hh = (hh + deg / 360 + 1) % 1;
    const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    if (s === 0) return toHex(l * 255, l * 255, l * 255);
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    return toHex(f(p, q, hh + 1 / 3) * 255, f(p, q, hh) * 255, f(p, q, hh - 1 / 3) * 255);
  }

  /*
   * spec = { seed, type, type2?, shape: "beast"|"biped"|"bird"|"serpent"|"fish"|"spirit", stage: 1..3, shiny }
   */
  function draw(spec) {
    const r = rnd(spec.seed);
    let [base, accent, dark] = TYPE_COLORS[spec.type] || TYPE_COLORS.Roc;
    if (spec.type2 && TYPE_COLORS[spec.type2]) accent = TYPE_COLORS[spec.type2][0];
    if (spec.shiny) { const d = 140 + r() * 80; base = hueShift(base, d); accent = hueShift(accent, d); dark = hueShift(dark, d); }
    const stage = spec.stage || 1, shape = spec.shape || "beast";
    const sz = 0.72 + stage * 0.14;
    const grid = Array.from({ length: N }, () => Array(N).fill(null)); // couleur par pixel
    const set = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N) grid[y][x] = c; };
    const ellipse = (cx, cy, rx, ry, c, light = true) => {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry, d = dx * dx + dy * dy;
        if (d <= 1) set(x, y, !light ? c : (dx + dy < -0.7 ? shade(c, .25) : dy > .55 ? shade(c, -.22) : c));
      }
    };
    const tri = (x1, y1, x2, y2, x3, y3, c) => {
      const minx = Math.min(x1, x2, x3), maxx = Math.max(x1, x2, x3), miny = Math.min(y1, y2, y3), maxy = Math.max(y1, y2, y3);
      for (let y = Math.floor(miny); y <= maxy; y++) for (let x = Math.floor(minx); x <= maxx; x++) {
        const px = x + .5, py = y + .5;
        const a = (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1), b = (x3 - x2) * (py - y2) - (y3 - y2) * (px - x2), cc = (x1 - x3) * (py - y3) - (y1 - y3) * (px - x3);
        if ((a >= 0 && b >= 0 && cc >= 0) || (a <= 0 && b <= 0 && cc <= 0)) set(x, y, c);
      }
    };
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };

    // Proportions
    const bw = (7 + r() * 4) * sz, bh = (5 + r() * 3) * sz;
    let bx = 21, by = 26 - (stage - 1);
    let hx, hy, hr = (4 + r() * 2.5) * sz;
    const legH = Math.round((2 + r() * 3) * sz);

    // Queue (dessinée en premier, derrière)
    const tailKind = Math.floor(r() * 4);
    const tailCol = r() > .5 ? accent : base;
    const tail = (tx, ty) => {
      if (tailKind === 0) for (let i = 0; i < 8 * sz; i++) ellipse(tx + i * .9, ty - i * .8, 1.6, 1.6, tailCol);
      else if (tailKind === 1) { tri(tx, ty, tx + 9 * sz, ty - 9 * sz, tx + 3, ty + 3, tailCol); }
      else if (tailKind === 2) { ellipse(tx + 4 * sz, ty - 3 * sz, 4 * sz, 3 * sz, tailCol); }
      else { for (let i = 0; i < 3; i++) tri(tx, ty, tx + (6 + i * 2) * sz, ty - (6 - i * 3) * sz, tx + 2, ty + 2, i === 1 ? accent : tailCol); }
    };

    if (shape === "serpent") {
      by = 28;
      for (let i = 0; i < 26 * sz; i++) { const t = i / (26 * sz); ellipse(31 - i * .95, by - Math.sin(t * Math.PI * 1.6) * 4 - t * 6, (3.2 - t * .8) * sz + .5, (3.2 - t * .8) * sz + .5, base); }
      hx = 31 - 26 * sz * .95 - 1; hy = by - 6 - Math.sin(1.6 * Math.PI) * 4 - 3; hr *= .9;
      tail(33, by);
    } else if (shape === "fish") {
      ellipse(bx, by - 4, bw * 1.2, bh * 1.1, base);
      tri(bx + bw * 1.1, by - 4, bx + bw * 1.1 + 8 * sz, by - 12, bx + bw * 1.1 + 8 * sz, by + 4, accent);
      tri(bx - 2, by - 4 - bh, bx + 6, by - 4 - bh - 6 * sz, bx + 6, by - 4 - bh + 2, accent);
      hx = bx - bw * .9; hy = by - 5; hr = 0;
    } else if (shape === "bird") {
      by -= 2;
      tail(bx + bw * .8, by);
      ellipse(bx, by, bw * .9, bh, base);
      rect(Math.round(bx - 3), Math.round(by + bh - 1), 2, legH + 2, dark); rect(Math.round(bx + 2), Math.round(by + bh - 1), 2, legH + 2, dark);
      hx = bx - bw * .7; hy = by - bh - hr * .5;
    } else if (shape === "spirit") {
      by -= 4;
      for (let i = 0; i < 4; i++) ellipse(bx + 4 + i * 2.5, by + bh + i * 1.5, (4 - i) * sz, (2.5 - i * .4) * sz, i % 2 ? accent : base);
      ellipse(bx, by, bw * .85, bh * 1.1, base);
      hx = bx - bw * .5; hy = by - bh - hr * .3;
    } else {
      // beast / biped
      tail(bx + bw * .85, by - bh * .3);
      const biped = shape === "biped";
      if (biped) { bx -= 1; ellipse(bx, by - 3, bw * .7, bh * 1.3, base); }
      else ellipse(bx, by, bw, bh, base);
      const legs = biped ? [bx - 3, bx + 2] : [bx - bw * .6, bx - bw * .2, bx + bw * .25, bx + bw * .65];
      const ly = biped ? by - 3 + bh * 1.3 - 1 : by + bh - 2;
      legs.forEach((lx, i) => rect(Math.round(lx - 1), Math.round(ly), 3, legH, i % 2 && !biped ? shade(base, -.3) : shade(base, -.15)));
      if (biped) { rect(Math.round(bx - bw * .7 - 2), Math.round(by - 4), 3, 5, shade(base, -.1)); }
      hx = bx - (biped ? bw * .3 : bw * .85); hy = by - (biped ? bh * 1.3 + hr * .6 : bh + hr * .2);
    }

    // Tête
    if (hr > 0) {
      // ornements selon le type (derrière la tête)
      const t = spec.type, oc = accent;
      if (t === "Flamme") for (let i = 0; i < 3; i++) tri(hx - 2 + i * 3, hy - hr + 1, hx + i * 3 + 1, hy - hr - (5 + r() * 3) * sz, hx + 2 + i * 3, hy - hr + 1, i === 1 ? "#ffd36b" : oc);
      else if (t === "Sève") { ellipse(hx + 2, hy - hr - 2, 2.5 * sz, 4 * sz, oc); ellipse(hx - 2, hy - hr - 1, 2 * sz, 3 * sz, shade(oc, -.2)); }
      else if (t === "Givre" || t === "Roc") { tri(hx - 1, hy - hr + 2, hx + 1, hy - hr - 6 * sz, hx + 3, hy - hr + 2, oc); tri(hx + 3, hy - hr + 3, hx + 6, hy - hr - 3 * sz, hx + 6, hy - hr + 3, oc); }
      else if (t === "Foudre") { tri(hx + 1, hy - hr + 1, hx + 5, hy - hr - 6 * sz, hx + 3, hy - hr + 1, oc); tri(hx + 3, hy - hr - 3 * sz, hx + 7, hy - hr - 4 * sz, hx + 4, hy - hr - 1, oc); }
      else if (t === "Ombre" || t === "Esprit") { tri(hx - 3, hy - hr + 2, hx - 4, hy - hr - 5 * sz, hx, hy - hr + 1, oc); tri(hx + 2, hy - hr + 1, hx + 4, hy - hr - 5 * sz, hx + 5, hy - hr + 2, oc); }
      else { tri(hx - 2, hy - hr + 2, hx - 1, hy - hr - 4 * sz, hx + 2, hy - hr + 1, base); tri(hx + 2, hy - hr + 1, hx + 4, hy - hr - 4 * sz, hx + 5, hy - hr + 2, base); }
      ellipse(hx, hy, hr * 1.05, hr, base);
      // museau
      if (shape !== "bird") ellipse(hx - hr * .75, hy + hr * .25, hr * .5, hr * .4, shade(base, .15));
      else tri(hx - hr - 4, hy + 1, hx - hr + 1, hy - 1, hx - hr + 1, hy + 2, "#e0a63a");
    }
    // Œil
    const ex = Math.round(hr > 0 ? hx - hr * .35 : hx + 1), ey = Math.round(hr > 0 ? hy - hr * .15 : hy - 1);
    rect(ex - 1, ey - 1, 3, 3, "#ffffff"); rect(ex - 1, ey, 2, 2, "#120e18"); set(ex + 1, ey - 1, "#ffffff");
    // Motif (taches)
    const spots = Math.floor(r() * 3);
    for (let i = 0; i < spots; i++) { const sx = bx + (r() - .2) * bw, sy = by - bh * .3 + r() * bh * .4; if (grid[Math.round(sy)]?.[Math.round(sx)] && shape !== "serpent") ellipse(sx, sy, 1.5 * sz, 1.2 * sz, shade(accent, -.05), false); }

    // Contour
    const c = document.createElement("canvas"); c.width = c.height = N;
    const g = c.getContext("2d");
    const out = shade(dark, -.45);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let col = grid[y][x];
      if (!col && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => grid[y + dy]?.[x + dx])) col = out;
      if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
    }
    return c;
  }

  return { draw, TYPE_COLORS, N };
})();
