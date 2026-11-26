/* Les Échoués de Kalua — l'île : forme, décor, collisions et dessin (style doux).
 * Tout est tiré d'une graine : les deux joueurs voient exactement la même île. */
"use strict";

function makeWorld(seed) {
  let s = seed >>> 0 || 1;
  const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const range = (a, b) => a + rnd() * (b - a);
  const TAU = Math.PI * 2;

  const RX = 900, RY = 1150;
  const P = [rnd() * TAU, rnd() * TAU, rnd() * TAU, rnd() * TAU, rnd() * TAU];
  const shapeR = (a) => 1 + .08 * Math.sin(a * 3 + P[0]) + .05 * Math.sin(a * 7 + P[1]) + .03 * Math.sin(a * 11 + P[2]);
  const grassR = (a) => 1 + .1 * Math.sin(a * 2 + P[3]) + .06 * Math.sin(a * 5 + P[4]) + .03 * Math.sin(a * 9 + P[0]);
  const G = { x: -RX * .06, y: -RY * .12, k: .66 };

  const dist = (x, y) => { const dx = x / RX, dy = y / RY; return Math.hypot(dx, dy) / shapeR(Math.atan2(dy, dx)); };
  const grassDist = (x, y) => { const dx = (x - G.x) / (RX * G.k), dy = (y - G.y) / (RY * G.k); return Math.hypot(dx, dy) / grassR(Math.atan2(dy, dx)); };

  const path = (k, rf, cx = 0, cy = 0, rx = RX, ry = RY) => {
    const p = new Path2D();
    for (let i = 0; i <= 260; i++) { const a = (i / 260) * TAU, r = rf(a) * k; const x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r; i ? p.lineTo(x, y) : p.moveTo(x, y); }
    p.closePath(); return p;
  };
  const PATHS = {
    shallow: path(1.14, shapeR), shallow2: path(1.07, shapeR), foam: path(1.025, shapeR), sand: path(1, shapeR),
    wet: path(.985, shapeR), grass: path(1, grassR, G.x, G.y, RX * G.k, RY * G.k), grass2: path(.86, grassR, G.x + 10, G.y + 6, RX * G.k, RY * G.k),
  };

  const spawn = { x: 0, y: RY * .8 };
  // bord de plage le plus bas : on cherche le point le plus au sud qui reste sur le sable
  for (let y = RY * 1.1; y > 0; y -= 5) if (dist(0, y) < .9) { spawn.y = y; break; }

  // ------------------------------------------------------------ décor
  const solids = []; // objets avec collision, triés en profondeur
  const ground = []; // fleurs, coquillages, touffes (dessinés au sol)
  const free = (x, y, r) => Math.hypot(x - spawn.x, y - spawn.y) > 150 && solids.every((o) => Math.hypot(o.x - x, o.y - y) > r + o.r + 14);
  function place(n, test, make, tries = 40) {
    for (let i = 0; i < n; i++) for (let k = 0; k < tries; k++) {
      const x = range(-RX * 1.1, RX * 1.1), y = range(-RY * 1.1, RY * 1.1);
      if (test(x, y)) { make(x, y); break; }
    }
  }
  place(60, (x, y) => { const d = dist(x, y); return d > .25 && d < .9 && free(x, y, 40); }, (x, y) => solids.push({ kind: "palm", x, y, r: 12, s: range(3.8, 4.6), lean: range(-.12, .12), shake: 0 }));
  place(38, (x, y) => { const d = dist(x, y); return d < .93 && free(x, y, 24); }, (x, y) => { const sc = range(2.4, 3.8); solids.push({ kind: "rock", x, y, r: 4.2 * sc, s: sc, shake: 0 }); });
  place(45, (x, y) => grassDist(x, y) < .92 && free(x, y, 26), (x, y) => { const sc = range(2.2, 3); solids.push({ kind: "bush", x, y, r: 3.6 * sc, s: sc, flowers: rnd() < .6, shake: 0 }); });
  const FLOWERS = ["#ff9fb8", "#c9b3ff", "#ffd27a", "#ffffff", "#9fd3ef"];
  place(320, (x, y) => grassDist(x, y) < .95, (x, y) => ground.push({ kind: "flower", x, y, s: range(2, 2.8), c: FLOWERS[Math.floor(rnd() * FLOWERS.length)] }), 10);
  place(180, (x, y) => grassDist(x, y) < .97, (x, y) => ground.push({ kind: "tuft", x, y, s: range(2, 3) }), 10);
  place(260, (x, y) => dist(x, y) < .97 && grassDist(x, y) > 1.02, (x, y) => ground.push({ kind: "speck", x, y, s: range(1.5, 3) }), 10);
  place(50, (x, y) => { const d = dist(x, y); return d > .78 && d < .955; }, (x, y) => ground.push({ kind: "shell", x, y, s: range(2.6, 3.4), c: rnd() < .7 ? "#ffc6d6" : "#fff1d6", bob: 0 }));
  const WAVES = [];
  for (let y = -RY * 1.6; y < RY * 1.6; y += 120) for (let x = -RX * 1.6; x < RX * 1.6; x += 150) {
    const wx = x + range(-50, 50), wy = y + range(-40, 40);
    if (dist(wx, wy) > 1.18) WAVES.push({ x: wx, y: wy, p: rnd() * TAU });
  }

  // ------------------------------------------------------------ collisions
  const walkable = (x, y) => dist(x, y) < .975;
  function move(x, y, nx, ny, r = 10) {
    // On essaie le déplacement complet, puis chaque axe séparément (glisser le long du bord)
    const ok = (px, py) => walkable(px, py);
    let tx = nx, ty = ny;
    if (!ok(tx, ty)) { if (ok(nx, y)) ty = y; else if (ok(x, ny)) tx = x; else { tx = x; ty = y; } }
    for (const o of solids) {
      const dx = tx - o.x, dy = (ty - o.y) * 1.4, d = Math.hypot(dx, dy), min = r + o.r;
      if (d < min && d > .001) { const k = (min - d) / d; const px = tx + dx * k, py = ty + (dy * k) / 1.4; if (ok(px, py)) { tx = px; ty = py; } else { tx = x; ty = y; } }
    }
    return { x: tx, y: ty };
  }
  function nearest(x, y, dir, kinds, reach = 56) {
    // vise plutôt ce qui est devant le joueur
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 1];
    const fx = x + f[0] * 18, fy = y + f[1] * 14;
    let best = null, bd = reach;
    for (const list of [solids, ground]) for (const o of list) {
      if (!kinds.includes(o.kind) || o.gone) continue;
      const d = Math.hypot(o.x - fx, (o.y - fy) * 1.2) - (o.r || 0) * .6;
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  // ------------------------------------------------------------ dessin
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };

  function drawWater(c, w, h, t) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#9fdaf1"); g.addColorStop(1, "#b9e7f6");
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  function drawGround(c, view, t) {
    c.fillStyle = "rgba(255,255,255,.22)"; c.fill(PATHS.shallow);
    c.fillStyle = "rgba(215,243,251,.85)"; c.fill(PATHS.shallow2);
    // vagues
    c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2.6; c.lineCap = "round";
    for (const wv of WAVES) {
      if (wv.x < view.x0 - 40 || wv.x > view.x1 + 40 || wv.y < view.y0 - 20 || wv.y > view.y1 + 20) continue;
      const ox = Math.sin(t * .8 + wv.p) * 8, a = .5 + .5 * Math.sin(t * 1.3 + wv.p);
      c.globalAlpha = .35 + .5 * a; c.beginPath(); const x = wv.x + ox, y = wv.y;
      c.moveTo(x, y); c.quadraticCurveTo(x + 8, y - 6, x + 16, y); c.quadraticCurveTo(x + 24, y + 6, x + 32, y); c.stroke();
    }
    c.globalAlpha = 1;
    // écume qui respire
    c.save(); const k = 1 + .006 * Math.sin(t * 1.4); c.scale(k, k); c.fillStyle = "#fffaf0"; c.fill(PATHS.foam); c.restore();
    c.fillStyle = "#f3d9ad"; c.fill(PATHS.sand); c.fillStyle = "#fbe5bd"; c.fill(PATHS.wet);
    c.fillStyle = "#b9e3a0"; c.fill(PATHS.grass); c.fillStyle = "#c3e8ab"; c.fill(PATHS.grass2);
    for (const o of ground) {
      if (o.gone || o.x < view.x0 - 20 || o.x > view.x1 + 20 || o.y < view.y0 - 20 || o.y > view.y1 + 20) continue;
      c.save(); c.translate(o.x, o.y);
      switch (o.kind) {
        case "speck": c.fillStyle = "#ecd09f"; circle(c, 0, 0, o.s * .5); break;
        case "tuft": c.strokeStyle = "#9fd68f"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-4, -5); c.moveTo(0, 0); c.lineTo(0, -7); c.moveTo(3, 0); c.lineTo(4.5, -5); c.stroke(); break;
        case "flower": { const sway = Math.sin(t * 1.6 + o.x * .05) * .08; c.rotate(sway); c.scale(o.s, o.s); c.fillStyle = o.c;
          for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circle(c, Math.cos(a) * 1.1, Math.sin(a) * 1.1, .8); } c.fillStyle = "#ffe08a"; circle(c, 0, 0, .6); break; }
        case "shell": { const b = o.bob > 0 ? Math.sin(o.bob * Math.PI) * 6 : 0; c.translate(0, -b); c.scale(o.s, o.s);
          c.fillStyle = "rgba(160,120,90,.15)"; ell(c, 0, 1.6, 1.8, .5); c.fillStyle = o.c; c.beginPath(); c.arc(0, 0, 1.6, Math.PI, 0); c.lineTo(0, 1.4); c.closePath(); c.fill();
          c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = .25; c.beginPath(); c.moveTo(0, 1.2); c.lineTo(-.8, -1.2); c.moveTo(0, 1.2); c.lineTo(.8, -1.2); c.stroke(); break; }
      }
      c.restore();
    }
  }
  function drawSolid(c, o, t) {
    const sh = o.shake > 0 ? Math.sin(o.shake * 40) * o.shake * .5 : 0;
    c.save(); c.translate(o.x, o.y);
    switch (o.kind) {
      case "palm": {
        const s = o.s; c.fillStyle = "rgba(120,90,60,.15)"; ell(c, 4, 0, 7 * s, 2 * s);
        c.save(); c.scale(s, s); c.rotate(o.lean + sh * .6 + Math.sin(t * .9 + o.x) * .012);
        c.strokeStyle = "#c9956b"; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(3, -8, 0, -14); c.stroke();
        c.strokeStyle = "#b88560"; c.lineWidth = .4; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-1 + i * .25, -i * 3); c.lineTo(1.2 + i * .25, -i * 3 - .3); c.stroke(); }
        c.translate(0, -14); c.rotate(Math.sin(t * 1.1 + o.y) * .03 + sh);
        c.fillStyle = "#8fd18a"; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .75; ell(c, Math.cos(a) * 6, Math.sin(a) * 4 + 4, 7, 2.4, a); }
        c.fillStyle = "#7cc078"; ell(c, 0, 1, 3, 2); c.fillStyle = "#a8754f"; circle(c, -1, 2, 1.2); circle(c, 1.5, 2.3, 1.2);
        c.restore(); break;
      }
      case "rock": { c.translate(sh * 6, 0); c.scale(o.s, o.s); c.fillStyle = "rgba(120,90,60,.14)"; ell(c, .5, 1.6, 5, 1.6);
        c.fillStyle = "#cfcbdc"; ell(c, 0, 0, 4.5, 3); c.fillStyle = "#e3e1ec"; ell(c, -.6, -.8, 3, 1.8); c.fillStyle = "#f3f2f8"; ell(c, -1.3, -1.3, 1.3, .7); break; }
      case "bush": { c.translate(sh * 6, 0); c.scale(o.s, o.s); c.fillStyle = "rgba(120,90,60,.14)"; ell(c, 0, 2.6, 6, 1.6);
        c.fillStyle = "#8fcf80"; circle(c, -3, -.5, 3.4); circle(c, 2, -1.5, 3.8); circle(c, 5, .5, 2.8); c.fillStyle = "#a6dc94"; circle(c, -2, -1.6, 2); circle(c, 2.4, -2.8, 2);
        if (o.flowers) { c.fillStyle = "#ff9fb8"; circle(c, -2, -2, .8); circle(c, 3, -3, .8); circle(c, 5.4, -.4, .7); } break; }
    }
    c.restore();
  }

  function preview(c, size) { // vignette pour « Mes îles »
    const k = size / (RY * 2.5);
    c.save(); c.fillStyle = "#a9def3"; c.fillRect(0, 0, size, size); c.translate(size / 2, size / 2); c.scale(k, k);
    c.fillStyle = "#d7f3fb"; c.fill(PATHS.shallow2); c.fillStyle = "#fffaf0"; c.fill(PATHS.foam); c.fillStyle = "#fbe5bd"; c.fill(PATHS.sand); c.fillStyle = "#b9e3a0"; c.fill(PATHS.grass);
    for (const o of solids) if (o.kind === "palm") { c.fillStyle = "#7cc078"; circle(c, o.x, o.y - 60, 34); }
    c.restore();
  }

  return { RX, RY, spawn, solids, ground, walkable, move, nearest, drawWater, drawGround, drawSolid, preview, dist };
}
