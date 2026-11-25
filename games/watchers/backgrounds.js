/* Watchers — décors de combat en pixel art, un par région (dessinés par code). */
"use strict";
const BATTLE_BG = (() => {
  function rnd(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const lerp = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`; };

  // Dégradé en bandes avec tramage (look pixel art)
  function bands(g, x0, y0, w, h, stops, steps = 8) {
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1) * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
      const q = Math.floor(f * steps) / steps, next = Math.min(1, q + 1 / steps);
      for (let x = 0; x < w; x++) {
        const dither = ((x + y) % 2 === 0) && (f * steps % 1) > .5;
        g.fillStyle = lerp(stops[i], stops[i + 1], dither ? next : q);
        g.fillRect(x0 + x, y0 + y, 1, 1);
      }
    }
  }
  // Silhouette de collines : fonction de hauteur bruitée
  function hills(g, w, baseY, amp, freq, color, seed) {
    const r = rnd(seed); const ph = r() * 10, ph2 = r() * 10;
    g.fillStyle = color;
    for (let x = 0; x < w; x++) {
      const y = baseY - Math.round(amp * (Math.sin(x * freq + ph) * .6 + Math.sin(x * freq * 2.3 + ph2) * .4));
      g.fillRect(x, y, 1, 400);
    }
  }
  const disc = (g, cx, cy, rad, color) => { g.fillStyle = color; for (let y = -rad; y <= rad; y++) { const hw = Math.floor(Math.sqrt(rad * rad - y * y)); g.fillRect(cx - hw, cy + y, hw * 2 + 1, 1); } };
  function roundTree(g, x, y, s, c1, c2, trunk) {
    g.fillStyle = trunk; g.fillRect(x - 1, y, 3, s);
    disc(g, x, y - s * .2, Math.round(s * .9), c1); disc(g, x - Math.round(s * .3), y - Math.round(s * .5), Math.round(s * .45), c2);
  }
  function pine(g, x, y, h, c, snow) {
    for (let i = 0; i < h; i++) { const hw = Math.floor(i * .45); g.fillStyle = (snow && i % 5 < 1) ? snow : c; g.fillRect(x - hw, y + i, hw * 2 + 1, 1); }
    g.fillStyle = "#3a2a20"; g.fillRect(x - 1, y + h, 3, 3);
  }
  function platform(g, cx, cy, rx, ry, top, side, edge) {
    const ell = (oy, col, shrink = 0) => { g.fillStyle = col; for (let y = -ry; y <= ry; y++) { const hw = Math.floor((rx - shrink) * Math.sqrt(1 - (y * y) / (ry * ry))); g.fillRect(cx - hw, cy + y + oy, hw * 2 + 1, 1); } };
    ell(3, side); ell(0, edge); ell(0, top, 2);
    g.fillStyle = edge; g.fillRect(cx - Math.round(rx * .5), cy - ry + 2, Math.round(rx * .4), 1);
  }

  const REGIONS = {
    // 1 — Vallée des Brumes : forêt enchantée au crépuscule, lucioles et champignons turquoise
    1(g, w, h) {
      bands(g, 0, 0, w, Math.round(h * .62), ["#2b1f4f", "#5a3d8a", "#c46fb0", "#f2a27a"]);
      disc(g, Math.round(w * .72), Math.round(h * .3), 14, "#ffd9a0"); disc(g, Math.round(w * .72), Math.round(h * .3), 11, "#fff1cf");
      hills(g, w, Math.round(h * .45), 6, .05, "#6b4a8f", 2);
      hills(g, w, Math.round(h * .52), 7, .07, "#4a3a78", 5);
      const r = rnd(9);
      for (let i = 0; i < 9; i++) roundTree(g, Math.round(i * w / 8 + r() * 8 - 4), Math.round(h * .56), 7 + Math.round(r() * 4), "#2d5a5a", "#3f7a6e", "#2a1f2a");
      bands(g, 0, Math.round(h * .62), w, h - Math.round(h * .62), ["#2f7a5a", "#245e48", "#1b4636"]);
      for (let i = 0; i < 40; i++) { const x = Math.floor(r() * w), y = Math.round(h * .64 + r() * h * .34); g.fillStyle = ["#f2a27a", "#c46fb0", "#9ff5e2"][i % 3]; g.fillRect(x, y, 1, 1); }
      for (let i = 0; i < 14; i++) { const x = Math.floor(r() * w), y = Math.floor(r() * h * .6); g.fillStyle = "#d9fff6"; g.fillRect(x, y, 1, 1); g.fillStyle = "rgba(94,224,198,.45)"; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
      for (const [x, y] of [[8, .9], [w - 12, .8]]) { g.fillStyle = "#e8fffa"; g.fillRect(x + 1, Math.round(h * y) + 3, 2, 3); g.fillStyle = "#5ee0c6"; g.fillRect(x - 1, Math.round(h * y), 6, 3); g.fillRect(x, Math.round(h * y) - 1, 4, 1); }
      return { top: "#3e9a6e", side: "#1b4636", edge: "#5fc08a" };
    },
    // 2 — Archipel des Marées : coucher de soleil tropical, mer scintillante, îles
    2(g, w, h) {
      bands(g, 0, 0, w, Math.round(h * .5), ["#3b2a7a", "#d6457a", "#ff9a4a", "#ffd26a"]);
      disc(g, Math.round(w * .5), Math.round(h * .48), 18, "#fff1a8");
      hills(g, Math.round(w * .3), Math.round(h * .47), 5, .2, "#5a2a5e", 3);
      g.save(); g.translate(Math.round(w * .75), 0); hills(g, Math.round(w * .25), Math.round(h * .46), 6, .25, "#5a2a5e", 7); g.restore();
      bands(g, 0, Math.round(h * .5), w, Math.round(h * .22), ["#ff8a5a", "#2f7fc0", "#1c5a9a"]);
      const r = rnd(4);
      for (let i = 0; i < 50; i++) { const y = Math.round(h * .5 + r() * h * .22), x = Math.floor(r() * w); g.fillStyle = r() > .5 ? "#ffe9a0" : "#8fd0ff"; g.fillRect(x, y, 2 + Math.floor(r() * 4), 1); }
      bands(g, 0, Math.round(h * .72), w, h - Math.round(h * .72), ["#f5d58a", "#e8b86a", "#c9944a"]);
      for (let i = 0; i < 30; i++) { g.fillStyle = "#fff0c0"; g.fillRect(Math.floor(r() * w), Math.round(h * .74 + r() * h * .25), 1, 1); }
      // palmier
      const px = 10, py = Math.round(h * .74);
      g.fillStyle = "#6b3f2a"; for (let i = 0; i < 26; i++) g.fillRect(px + Math.round(Math.sin(i / 9) * 3), py - i, 3, 1);
      g.fillStyle = "#2f8a4a"; for (const [dx, dy] of [[-10, 2], [10, 3], [-6, -3], [8, -2], [0, -4]]) for (let i = 0; i < 9; i++) g.fillRect(px + 3 + Math.round(dx * i / 9), py - 27 + Math.round(dy * i / 9 + (i * i) / 18), 3, 2);
      return { top: "#f0cf86", side: "#b07f3c", edge: "#fff0c0" };
    },
    // 3 — Pics de Givre : nuit étoilée, aurores boréales, sommets enneigés
    3(g, w, h) {
      bands(g, 0, 0, w, Math.round(h * .6), ["#0b1340", "#1f2f7a", "#2f5aa0"]);
      const r = rnd(12);
      for (let i = 0; i < 60; i++) { g.fillStyle = r() > .8 ? "#ffe9a0" : "#ffffff"; g.fillRect(Math.floor(r() * w), Math.floor(r() * h * .45), 1, 1); }
      for (let x = 0; x < w; x++) { const y = Math.round(h * .16 + Math.sin(x * .07) * 8 + Math.sin(x * .17) * 3);
        for (let k = 0; k < 14; k++) { g.fillStyle = k < 5 ? "rgba(120,255,190,.55)" : k < 10 ? "rgba(90,220,200,.35)" : "rgba(220,120,255,.3)"; g.fillRect(x, y + k, 1, 1); } }
      hills(g, w, Math.round(h * .42), 18, .045, "#c9d9f5", 21);
      hills(g, w, Math.round(h * .5), 12, .06, "#8aa6d8", 8);
      hills(g, w, Math.round(h * .58), 8, .09, "#5a78b8", 3);
      for (let i = 0; i < 8; i++) pine(g, Math.round(i * w / 7 + r() * 6), Math.round(h * .5 + r() * 6), 14 + Math.floor(r() * 6), "#1f4a5a", "#e8f4ff");
      bands(g, 0, Math.round(h * .62), w, h - Math.round(h * .62), ["#e8f4ff", "#c9def5", "#a8c4e8"]);
      for (let i = 0; i < 25; i++) { g.fillStyle = "#ffffff"; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); }
      return { top: "#f4faff", side: "#7a9ccc", edge: "#c9def5" };
    },
    // 4 — Couronne Éteinte : ciel pourpre, soleil noir à couronne de feu, ruines flottantes
    4(g, w, h) {
      bands(g, 0, 0, w, Math.round(h * .62), ["#12061e", "#4a0f3a", "#a3123a", "#ff5a3a"]);
      const cx = Math.round(w * .5), cy = Math.round(h * .3);
      disc(g, cx, cy, 22, "#ff9a4a"); disc(g, cx, cy, 20, "#ffd36b"); disc(g, cx, cy, 18, "#0a0410");
      const r = rnd(33);
      for (let i = 0; i < 24; i++) { const a = r() * Math.PI * 2, d = 21 + r() * 6; g.fillStyle = "#ffb04a"; g.fillRect(cx + Math.round(Math.cos(a) * d), cy + Math.round(Math.sin(a) * d), 1, 2); }
      // ruines
      const col = "#2a0f2a";
      for (const [x, ht, wd] of [[6, 40, 7], [22, 26, 5], [w - 30, 46, 8], [w - 12, 30, 5]]) { g.fillStyle = col; g.fillRect(x, Math.round(h * .62) - ht, wd, ht); g.fillStyle = "#3e1840"; g.fillRect(x, Math.round(h * .62) - ht, wd, 2); g.fillRect(x - 1, Math.round(h * .62) - ht - 2, wd + 2, 2); }
      for (const [x, y, s] of [[40, .2, 6], [w - 50, .14, 5], [w * .32, .45, 4]]) { g.fillStyle = "#3e1840"; g.fillRect(Math.round(x), Math.round(h * y), s * 2, s); g.fillStyle = "#ff5a3a"; g.fillRect(Math.round(x), Math.round(h * y) + s, s * 2, 1); }
      bands(g, 0, Math.round(h * .62), w, h - Math.round(h * .62), ["#3a1030", "#24081e", "#150512"]);
      g.fillStyle = "#ff5a3a"; for (let i = 0; i < 10; i++) { let x = Math.floor(r() * w), y = Math.round(h * .66 + r() * h * .3); for (let k = 0; k < 8; k++) { g.fillRect(x, y, 1, 1); x += r() > .5 ? 1 : -1; y += r() > .6 ? 1 : 0; } }
      for (let i = 0; i < 30; i++) { g.fillStyle = r() > .5 ? "#ffd36b" : "#ff5a3a"; g.fillRect(Math.floor(r() * w), Math.floor(r() * h), 1, 1); }
      return { top: "#4a1a40", side: "#1a0614", edge: "#a3123a" };
    },
  };

  // Dessine le décor complet (w×h en pixels d'art) avec les deux plateformes
  function draw(region, w, h, opts = {}) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d");
    const pal = REGIONS[region](g, w, h);
    if (opts.platforms === false) return c;
    platform(g, Math.round(w * .74), Math.round(h * .45), 28, 7, pal.top, pal.side, pal.edge);
    platform(g, Math.round(w * .28), Math.round(h * .88), 36, 9, pal.top, pal.side, pal.edge);
    return c;
  }
  return { draw };
})();
