/* Les Échoués de Kalua — le monde en jeu : décor par biome, villages, collisions et dessin.
 * Le décor est généré par morceaux (chunks) autour des joueurs, toujours identique pour tout le monde. */
"use strict";

function makeWorld() {
  const M = KALUA, K = M.K, TAU = Math.PI * 2;
  const WW = M.MW * K, WH = M.MH * K;
  const CH = 1024; // taille d'un morceau de monde
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const shade = Avatar.shade;
  const seeded = (a, b) => { let s = (Math.imul(a + 1013, 374761393) ^ Math.imul(b + 7919, 668265263)) >>> 0 || 1;
    return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  // ---------------------------------------------------------------- tracés en coordonnées monde
  const toW = (p) => [p[0] * K, p[1] * K];
  const RIV = M.RIVERS.map((s) => s.map(toW)), TRL = M.TRAILS.map((s) => s.map(toW));
  const RHALF = (M.RIVER_W * K) / 2;
  const BR = M.BRIDGES.map((b) => ({ x: b.x * K, y: b.y * K, ang: b.ang }));
  // grille de points pour savoir vite si on est près d'une rivière ou d'un sentier
  const near = new Map(); const NB = 128;
  const addNear = (x, y, kind) => { const k = Math.floor(x / NB) + "," + Math.floor(y / NB); if (!near.has(k)) near.set(k, []); near.get(k).push([x, y, kind]); };
  const dens = (s, kind) => { for (let i = 1; i < s.length; i++) { const [ax, ay] = s[i - 1], [bx, by] = s[i]; const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 30); for (let j = 0; j <= n; j++) addNear(ax + (bx - ax) * j / n, ay + (by - ay) * j / n, kind); } };
  RIV.forEach((s) => dens(s, "r")); TRL.forEach((s) => dens(s, "t"));
  function distTo(x, y, kind) {
    let best = 1e9; const cx = Math.floor(x / NB), cy = Math.floor(y / NB);
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const L = near.get((cx + i) + "," + (cy + j)); if (L) for (const p of L) if (p[2] === kind) { const d = Math.hypot(p[0] - x, p[1] - y); if (d < best) best = d; } }
    return best;
  }
  function onBridge(x, y) {
    for (const b of BR) { const dx = x - b.x, dy = y - b.y; if (dx * dx + dy * dy > 120 * 120) continue;
      const v = dx * Math.cos(b.ang) + dy * Math.sin(b.ang), u = -dx * Math.sin(b.ang) + dy * Math.cos(b.ang); if (Math.abs(u) < 82 && Math.abs(v) < 30) return true; }
    return false;
  }

  // ---------------------------------------------------------------- terrain franchissable
  function walkable(x, y) {
    const mx = x / K, my = y / K;
    if (M.mainD(mx, my) > .985 && M.isleAt(mx, my) < 0) return false; // la mer (les trois îles se rejoignent en bateau)
    if (Math.hypot(mx - M.VOL.x, (my - M.VOL.y) * 1.2) < 34) return false; // la lave du cratère
    if (distTo(x, y, "r") < RHALF + 4 && !onBridge(x, y)) return false; // la rivière
    return true;
  }

  // ---------------------------------------------------------------- lieux fixes
  const fixed = []; // objets placés à la main (villages, grottes, ponts…)
  const S = { hut: 5, stilt: 5, stone: 5, mill: 4, treehouse: 4.5, temple: 4, torch: 3, tent: 4.5, fire: 3.5, field: 5, crystal: 3, geyser: 3, ruin: 4, totem: 4, lantern: 3, tower: 4.5, pier: 5.5, wreck: 4 };
  const R = { hut: 34, stilt: 34, stone: 34, mill: 26, treehouse: 16, temple: 80, torch: 6, tent: 30, fire: 14, field: 0, crystal: 12, geyser: 14, ruin: 30, totem: 12, lantern: 4, tower: 26, pier: 0, wreck: 120 };
  for (const p of M.PLACES) { const [kind, x, y, extra] = p; fixed.push({ kind, x: x * K, y: y * K, s: S[kind], r: R[kind] || 0, extra, ground: kind === "field" || kind === "pier" }); }
  for (const cv of M.CAVES) fixed.push({ kind: "cave", x: cv.x * K, y: cv.y * K, s: 3.6, r: 60, cave: cv });
  for (const b of BR) fixed.push({ kind: "bridge", x: b.x, y: b.y, ang: b.ang, r: 0, ground: true });
  fixed.push({ kind: "sign", x: M.VILLAGE.x * K + 40, y: M.VILLAGE.y * K + 160, r: 8, text: "Votre village" });
  const avoid = fixed.filter((o) => o.kind !== "bridge").map((o) => [o.x, o.y, Math.max(70, (o.r || 0) + 50)]);
  avoid.push([M.VILLAGE.x * K, M.VILLAGE.y * K, 900]);

  // ---------------------------------------------------------------- génération par morceaux
  const chunks = new Map();
  const FLOWERS = ["#ff9fb8", "#c9b3ff", "#ffd27a", "#ffffff", "#9fd3ef"];
  function chunk(cx, cy) {
    const key = cx + "," + cy; let ch = chunks.get(key); if (ch) return ch;
    const rnd = seeded(cx, cy); ch = { solids: [], ground: [] }; chunks.set(key, ch);
    for (const o of fixed) if (Math.floor(o.x / CH) === cx && Math.floor(o.y / CH) === cy) (o.ground ? ch.ground : ch.solids).push(o);
    const STEP = 64;
    for (let gy = 0; gy < CH; gy += STEP) for (let gx = 0; gx < CH; gx += STEP) {
      const x = cx * CH + gx + rnd() * STEP, y = cy * CH + gy + rnd() * STEP, mx = x / K, my = y / K;
      if (x < 0 || y < 0 || x > WW || y > WH) continue;
      const r = M.info(mx, my);
      if (r.isl >= 0 && r.d < .9) { const q = rnd(); if (avoid.some(([ax, ay, ar]) => Math.hypot(ax - x, ay - y) < ar)) continue; // décor des îles
        if (r.isl === 0) { if (q < .08) ch.solids.push({ kind: "palm", x, y, r: 12, s: 3.6 + rnd() * .8, lean: (rnd() - .5) * .25 }); else if (q < .2) ch.ground.push({ kind: "flower", x, y, s: 2.4, c: "#ff9fb8" }); else if (q < .26) ch.ground.push({ kind: "shell", x, y, s: 3, c: "#ffc6d6" }); }
        else if (r.isl === 1) { if (q < .07) ch.solids.push({ kind: "rock", x, y, r: 13, s: 2.6 + rnd() }); else if (q < .2) ch.ground.push({ kind: "tuft", x, y, s: 2.2, c: "#a8b890" }); }
        else { if (q < .06) ch.solids.push({ kind: "jtree", x, y, r: 12, s: 2.6, c: "#9a8ad0" }); else if (q < .22) ch.ground.push({ kind: "flower", x, y, s: 2.2, c: rnd() < .5 ? "#e0d0ff" : "#fff6a0" }); else if (q < .3) ch.ground.push({ kind: "firefly", x, y, s: 1 }); }
        continue; }
      if (r.d > .97 || r.isl >= 0 || !r.w) continue;
      const t = distTo(x, y, "t"), rv = distTo(x, y, "r");
      if (rv < RHALF + 20) continue;
      if (avoid.some(([ax, ay, ar]) => Math.hypot(ax - x, ay - y) < ar)) { if (rnd() < .25 && t > 30) ch.ground.push({ kind: "flower", x, y, s: 2.4, c: FLOWERS[Math.floor(rnd() * 5)] }); continue; }
      const w = r.w, q = rnd(), clear = t > 46;
      if (w[1] > .55) { if (q < .5 && clear) ch.solids.push({ kind: "jtree", x, y, r: 16, s: 3 + rnd() * 1.4, c: rnd() < .5 ? "#3f8a4a" : "#56a65c" }); else if (q < .62) ch.ground.push({ kind: "flower", x, y, s: 2.2, c: rnd() < .5 ? "#ff7f9f" : "#ffd23a" }); else if (q < .7 && clear) ch.solids.push({ kind: "bush", x, y, r: 10, s: 2.4, flowers: rnd() < .5 }); else if (q < .8) ch.ground.push({ kind: "tuft", x, y, s: 2.4 }); }
      else if (w[0] > .6) { if (r.d > .9) { if (q < .1) ch.ground.push({ kind: "shell", x, y, s: 3, c: rnd() < .7 ? "#ffc6d6" : "#fff1d6" }); else if (q < .15) ch.ground.push({ kind: "speck", x, y, s: 2.5 }); }
        else if (q < .07 && clear) ch.solids.push({ kind: "palm", x, y, r: 12, s: 3.8 + rnd() * .8, lean: (rnd() - .5) * .25 }); else if (q < .1 && clear) ch.solids.push({ kind: "bush", x, y, r: 10, s: 2.2, flowers: rnd() < .6 });
        else if (q < .2) ch.ground.push({ kind: "flower", x, y, s: 2.4, c: FLOWERS[Math.floor(rnd() * 5)] }); else if (q < .3) ch.ground.push({ kind: "speck", x, y, s: 2.5 }); }
      else if (w[2] > .55) { if (q < .1 && clear) ch.solids.push({ kind: "mangrove", x, y, r: 14, s: 3.4 }); else if (q < .35) ch.ground.push({ kind: "reed", x, y, s: 3 }); else if (q < .42) ch.ground.push({ kind: "lily", x, y, s: 3 }); else if (q < .46) ch.ground.push({ kind: "mushroom", x, y, s: 3 }); else if (q < .5) ch.ground.push({ kind: "firefly", x, y, s: 1 }); }
      else if (w[3] > .6) { if (q < .08 && clear) ch.solids.push({ kind: "rock", x, y, r: 4.2 * 3.2, s: 2.6 + rnd() * 1.4 }); else if (q < .11 && clear) ch.solids.push({ kind: "jtree", x, y, r: 12, s: 2.2, c: "#8aa86a" }); else if (q < .25) ch.ground.push({ kind: "tuft", x, y, s: 2.2, c: "#a8b890" }); else if (q < .3) ch.ground.push({ kind: "flower", x, y, s: 2, c: "#ffffff" }); }
      else if (w[4] > .6) { if (q < .05 && clear) ch.solids.push({ kind: "lavarock", x, y, r: 14, s: 3 }); else if (q < .07 && clear) ch.solids.push({ kind: "deadtree", x, y, r: 8, s: 3.2 }); else if (q < .1) ch.ground.push({ kind: "ember", x, y, s: 2.6 }); else if (q < .13) ch.ground.push({ kind: "ash", x, y, s: 3 }); }
      else if (q < .1) ch.ground.push({ kind: "tuft", x, y, s: 2.2 });
    }
    ch.solids.sort((a, b) => a.y - b.y);
    return ch;
  }
  function around(x0, y0, x1, y1, fn) {
    for (let cy = Math.floor(y0 / CH); cy <= Math.floor(y1 / CH); cy++) for (let cx = Math.floor(x0 / CH); cx <= Math.floor(x1 / CH); cx++) fn(chunk(cx, cy));
  }

  // ---------------------------------------------------------------- déplacements
  function move(x, y, nx, ny, r = 10) {
    let tx = nx, ty = ny;
    if (!walkable(tx, ty)) { if (walkable(nx, y)) ty = y; else if (walkable(x, ny)) tx = x; else { tx = x; ty = y; } }
    around(tx - 200, ty - 200, tx + 200, ty + 200, (ch) => {
      for (const o of ch.solids) {
        if (!o.r) continue;
        const dx = tx - o.x, dy = (ty - o.y) * 1.4, d = Math.hypot(dx, dy), min = r + o.r;
        if (d < min && d > .001) { const k = (min - d) / d; const px = tx + dx * k, py = ty + (dy * k) / 1.4; if (walkable(px, py)) { tx = px; ty = py; } else { tx = x; ty = y; } }
      }
    });
    return { x: tx, y: ty };
  }
  function nearest(x, y, dir, kinds, reach = 60) {
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 1];
    const fx = x + f[0] * 18, fy = y + f[1] * 14;
    let best = null, bd = reach;
    around(x - 200, y - 200, x + 200, y + 200, (ch) => {
      for (const list of [ch.solids, ch.ground]) for (const o of list) {
        if (!kinds.includes(o.kind) || o.gone) continue;
        const d = Math.hypot(o.x - fx, (o.y - fy) * 1.2) - (o.r || 0) * .6;
        if (d < bd) { bd = d; best = o; }
      }
    });
    return best;
  }
  // point de départ : près de l'épave
  const spawn = { x: 790 * K, y: 900 * K };
  for (let k = 0; k < 60 && !walkable(spawn.x, spawn.y); k++) spawn.y -= 20;

  // ================================================================ dessin
  const shadowE = (c, x, y, rx, ry, a = .2) => { c.fillStyle = `rgba(40,50,30,${a})`; ell(c, x + rx * .25, y + ry * .3, rx, ry); };
  const roof = (c, x, y, w, h, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(x - w / 2 - 3, y); c.quadraticCurveTo(x, y - h, x + w / 2 + 3, y); c.closePath(); c.fill();
    c.fillStyle = "rgba(255,255,255,.2)"; c.beginPath(); c.moveTo(x - w / 2 - 3, y); c.quadraticCurveTo(x - w / 4, y - h * .8, x, y - h * .75); c.lineTo(x, y); c.fill(); };
  const D = {
    palm(c, o, t, sh) { const s = o.s; c.fillStyle = "rgba(40,50,30,.15)"; ell(c, 6 * s * .3 + 8, 0, 7 * s, 2 * s);
      c.save(); c.scale(s, s); c.rotate(o.lean + sh * .6 + Math.sin(t * .9 + o.x) * .012);
      c.strokeStyle = "#c9956b"; c.lineWidth = 2.4; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(3, -8, 0, -14); c.stroke();
      c.strokeStyle = "#b88560"; c.lineWidth = .4; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-1 + i * .25, -i * 3); c.lineTo(1.2 + i * .25, -i * 3 - .3); c.stroke(); }
      c.translate(0, -14); c.rotate(Math.sin(t * 1.1 + o.y) * .03 + sh);
      c.fillStyle = "#5fae5a"; for (let k = 0; k < 6; k++) { const a = -Math.PI / 2 + (k - 2.5) * .72; ell(c, Math.cos(a) * 6.5, Math.sin(a) * 3 + 3.5, 7.5, 2.4, a); }
      c.fillStyle = "#8fd18a"; for (let k = 0; k < 4; k++) { const a = -Math.PI / 2 + (k - 1.5) * .8; ell(c, Math.cos(a) * 5, Math.sin(a) * 2 + 2, 5, 1.6, a); }
      c.fillStyle = "#a8754f"; circle(c, -1, 2, 1.2); circle(c, 1.5, 2.3, 1.2); c.restore(); },
    jtree(c, o, t, sh) { const s = o.s, col = o.c; shadowE(c, 0, 2 * s, 11 * s, 4 * s, .22);
      c.fillStyle = "#7a5230"; c.fillRect(-2 * s, -6 * s, 4 * s, 8 * s);
      c.save(); c.translate(sh * 8, 0); c.translate(0, -8 * s);
      c.fillStyle = shade(col, -.18); circle(c, 2 * s, -4 * s, 9 * s); circle(c, -6 * s, 0, 7 * s); circle(c, 8 * s, 0, 7 * s);
      c.fillStyle = col; circle(c, 0, -7 * s, 9 * s); circle(c, -7 * s, -2 * s, 6.5 * s); circle(c, 7 * s, -2 * s, 6.5 * s);
      c.fillStyle = "rgba(255,255,255,.2)"; circle(c, -3 * s, -11 * s, 4 * s); c.restore(); },
    bush(c, o, t, sh) { c.translate(sh * 6, 0); c.scale(o.s, o.s); c.fillStyle = "rgba(40,50,30,.14)"; ell(c, 0, 2.6, 6, 1.6);
      c.fillStyle = "#8fcf80"; circle(c, -3, -.5, 3.4); circle(c, 2, -1.5, 3.8); circle(c, 5, .5, 2.8); c.fillStyle = "#a6dc94"; circle(c, -2, -1.6, 2); circle(c, 2.4, -2.8, 2);
      if (o.flowers) { c.fillStyle = "#ff9fb8"; circle(c, -2, -2, .8); circle(c, 3, -3, .8); circle(c, 5.4, -.4, .7); } },
    rock(c, o, t, sh) { c.translate(sh * 6, 0); c.scale(o.s, o.s); c.fillStyle = "rgba(40,50,30,.16)"; ell(c, .5, 1.6, 5, 1.6);
      c.fillStyle = "#b5aea8"; ell(c, 0, 0, 4.5, 3); c.fillStyle = "#d3cdc8"; ell(c, -.6, -.8, 3, 1.8); c.fillStyle = "#ece8e4"; ell(c, -1.3, -1.3, 1.3, .7); },
    mangrove(c, o, t, sh) { const s = o.s; shadowE(c, 0, 0, 11 * s, 4 * s); c.translate(sh * 6, 0); c.strokeStyle = "#5a4a3a"; c.lineWidth = 1.4 * s;
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 3 * s, 0); c.quadraticCurveTo(i * 2 * s, -5 * s, 0, -8 * s); c.stroke(); }
      c.fillStyle = "#3f5e3a"; circle(c, 1 * s, -12 * s, 8 * s); c.fillStyle = "#4f6e4a"; circle(c, 0, -13 * s, 8 * s); circle(c, -6 * s, -10 * s, 6 * s); circle(c, 6 * s, -10 * s, 6 * s); },
    lavarock(c, o, t, sh) { c.translate(sh * 6, 0); c.scale(o.s, o.s); c.fillStyle = "rgba(0,0,0,.18)"; ell(c, .5, 1.4, 5, 1.5); c.fillStyle = "#5a3e38"; ell(c, 0, 0, 4.6, 3);
      c.strokeStyle = `rgba(255,${120 + 40 * Math.sin(t * 2 + o.x)},60,.9)`; c.lineWidth = .5; c.beginPath(); c.moveTo(-2, -1); c.lineTo(0, .5); c.lineTo(2, -.5); c.stroke(); },
    deadtree(c, o, t, sh) { c.translate(sh * 5, 0); c.scale(o.s, o.s); c.strokeStyle = "#4a3630"; c.lineWidth = 1.6; c.lineCap = "round"; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -12); c.moveTo(0, -7); c.lineTo(-4, -11); c.moveTo(0, -9); c.lineTo(4, -14); c.stroke(); },
    hut(c, o) { const s = o.s; shadowE(c, 0, 4 * s, 13 * s, 4 * s); c.fillStyle = "#f0d2a8"; c.fillRect(-9 * s, -8 * s, 18 * s, 12 * s); c.fillStyle = "rgba(0,0,0,.1)"; c.fillRect(3 * s, -8 * s, 6 * s, 12 * s); c.fillStyle = "#7a4a2a"; c.fillRect(-2 * s, -3 * s, 4 * s, 7 * s); roof(c, 0, -7 * s, 18 * s, 15 * s, "#e8936a"); },
    stilt(c, o) { const s = o.s; c.strokeStyle = "#6b4a32"; c.lineWidth = 1.6 * s; for (const dx of [-7, 0, 7]) { c.beginPath(); c.moveTo(dx * s, 0); c.lineTo(dx * s, 8 * s); c.stroke(); }
      shadowE(c, 0, 8 * s, 13 * s, 3 * s); c.fillStyle = "#c9a878"; c.fillRect(-9 * s, -8 * s, 18 * s, 12 * s); c.fillStyle = "#7a4a2a"; c.fillRect(-2 * s, -3 * s, 4 * s, 7 * s); roof(c, 0, -7 * s, 18 * s, 15 * s, "#8a7a52"); },
    stone(c, o) { const s = o.s; shadowE(c, 0, 4 * s, 13 * s, 4 * s); c.fillStyle = "#d8d2cc"; c.fillRect(-9 * s, -9 * s, 18 * s, 13 * s); c.fillStyle = "#bcb4ae"; for (let i = 0; i < 3; i++) c.fillRect(-8 * s + i * 6 * s, -6 * s + (i % 2) * 4 * s, 4 * s, 2 * s);
      c.fillStyle = "#5a7a9a"; c.fillRect(-2 * s, -3 * s, 4 * s, 7 * s); c.fillStyle = "#8a6a5a"; c.beginPath(); c.moveTo(-12 * s, -8 * s); c.lineTo(0, -18 * s); c.lineTo(12 * s, -8 * s); c.fill(); },
    mill(c, o, t) { const s = o.s; shadowE(c, 0, 3 * s, 10 * s, 4 * s); c.fillStyle = "#efe6da"; c.beginPath(); c.moveTo(-7 * s, 3 * s); c.lineTo(-4 * s, -22 * s); c.lineTo(4 * s, -22 * s); c.lineTo(7 * s, 3 * s); c.fill();
      c.fillStyle = "#7a5230"; c.fillRect(-2 * s, -4 * s, 4 * s, 7 * s); c.fillStyle = "#b8604a"; c.beginPath(); c.moveTo(-6 * s, -21 * s); c.lineTo(0, -29 * s); c.lineTo(6 * s, -21 * s); c.fill();
      c.save(); c.translate(0, -20 * s); c.rotate(t * .8 + o.x); for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillStyle = "#fffaf0"; c.fillRect(-1.5 * s, -19 * s, 5 * s, 15 * s); c.fillStyle = "#8a6a4a"; c.fillRect(-.8 * s, -19 * s, 1.6 * s, 19 * s); } c.restore();
      c.fillStyle = "#6b4a32"; circle(c, 0, -20 * s, 1.8 * s); },
    treehouse(c, o) { const s = o.s; shadowE(c, 0, 0, 14 * s, 5 * s); c.fillStyle = "#7a5230"; c.fillRect(-2.5 * s, -20 * s, 5 * s, 22 * s);
      c.fillStyle = "#b8834f"; c.fillRect(-11 * s, -18 * s, 22 * s, 3 * s); c.save(); c.translate(0, -19 * s); c.scale(.75, .75);
      c.fillStyle = "#d8b07a"; c.fillRect(-9 * s, -8 * s, 18 * s, 12 * s); c.fillStyle = "#7a4a2a"; c.fillRect(-2 * s, -3 * s, 4 * s, 7 * s); roof(c, 0, -7 * s, 18 * s, 15 * s, "#a8683a"); c.restore();
      c.fillStyle = "#3f8a4a"; circle(c, -12 * s, -34 * s, 9 * s); circle(c, 12 * s, -36 * s, 8 * s); c.fillStyle = "#56a65c"; circle(c, 0, -40 * s, 10 * s);
      c.strokeStyle = "#8a6a4a"; c.lineWidth = .8 * s; c.beginPath(); c.moveTo(-6 * s, -16 * s); c.lineTo(-6 * s, 2 * s); c.stroke(); for (let i = 0; i < 5; i++) c.fillRect(-8 * s, (-14 + i * 3.5) * s, 4 * s, .7 * s); },
    temple(c, o) { const s = o.s; shadowE(c, 0, 3 * s, 30 * s, 8 * s); const st = o.y < 400 * K ? ["#c8a89a", "#b8968a", "#a8867a"] : ["#cfc6b8", "#bdb3a4", "#aaa092"];
      for (let i = 0; i < 3; i++) { c.fillStyle = st[i]; c.fillRect((-26 + i * 7) * s, (-6 - i * 9) * s, (52 - i * 14) * s, 10 * s); c.fillStyle = "rgba(0,0,0,.08)"; c.fillRect((-26 + i * 7) * s, (2 - i * 9) * s, (52 - i * 14) * s, 2 * s); }
      c.fillStyle = "#8a7a6a"; c.fillRect(-6 * s, -30 * s, 12 * s, 8 * s); c.fillStyle = "#3a2f2a"; c.fillRect(-3 * s, -4 * s, 6 * s, 8 * s);
      c.fillStyle = "#7aa86a"; ell(c, -24 * s, -4 * s, 5 * s, 2.6 * s); ell(c, 20 * s, -12 * s, 5 * s, 2.6 * s); },
    torch(c, o, t) { const s = o.s; c.fillStyle = "#6b4a32"; c.fillRect(-1 * s, -8 * s, 2 * s, 9 * s); const f = 1 + Math.sin(t * 9 + o.x) * .12;
      const g = c.createRadialGradient(0, -10 * s, 1, 0, -10 * s, 14 * s); g.addColorStop(0, "rgba(255,200,90,.7)"); g.addColorStop(1, "rgba(255,160,60,0)"); c.fillStyle = g; circle(c, 0, -10 * s, 14 * s);
      c.fillStyle = "#ff9a3a"; ell(c, 0, -10 * s, 2.2 * s * f, 3.6 * s * f); c.fillStyle = "#ffe08a"; ell(c, 0, -9.5 * s, 1.1 * s, 2 * s * f); },
    tent(c, o) { const s = o.s, col = o.extra || "#f4a6a0"; shadowE(c, 0, 3 * s, 10 * s, 3 * s); c.fillStyle = col; c.beginPath(); c.moveTo(-10 * s, 3 * s); c.lineTo(0, -11 * s); c.lineTo(10 * s, 3 * s); c.fill();
      c.fillStyle = "rgba(0,0,0,.25)"; c.beginPath(); c.moveTo(-2 * s, 3 * s); c.lineTo(0, -4 * s); c.lineTo(2 * s, 3 * s); c.fill(); },
    fire(c, o, t) { const s = o.s, f = 1 + Math.sin(t * 10 + o.x) * .15; const g = c.createRadialGradient(0, 0, 1, 0, 0, 22 * s); g.addColorStop(0, "rgba(255,190,90,.5)"); g.addColorStop(1, "rgba(255,190,90,0)"); c.fillStyle = g; circle(c, 0, 0, 22 * s);
      c.fillStyle = "#9a9088"; for (let k = 0; k < 7; k++) { const a = k * TAU / 7; ell(c, Math.cos(a) * 6 * s, Math.sin(a) * 3 * s, 1.8 * s, 1.2 * s); }
      c.fillStyle = "#7a5230"; c.fillRect(-5 * s, -.5 * s, 10 * s, 2 * s); c.fillStyle = "#ff9a3a"; ell(c, 0, -3 * s, 3 * s, 5 * s * f); c.fillStyle = "#ffe08a"; ell(c, 0, -2 * s, 1.5 * s, 2.6 * s * f); },
    crystal(c, o, t) { const s = o.s, col = o.extra || "#c9a3e8"; const g = c.createRadialGradient(0, -5 * s, 1, 0, -5 * s, 12 * s); g.addColorStop(0, col + "88"); g.addColorStop(1, col + "00"); c.fillStyle = g; circle(c, 0, -5 * s, 12 * s);
      c.fillStyle = col; c.beginPath(); c.moveTo(0, -10 * s); c.lineTo(3 * s, 0); c.lineTo(-3 * s, 0); c.fill(); c.beginPath(); c.moveTo(4 * s, -6 * s); c.lineTo(6 * s, 0); c.lineTo(2 * s, 0); c.fill();
      c.fillStyle = "rgba(255,255,255,.55)"; c.beginPath(); c.moveTo(0, -10 * s); c.lineTo(1 * s, -2 * s); c.lineTo(-1 * s, -2 * s); c.fill(); },
    geyser(c, o, t) { const s = o.s; c.fillStyle = "#6a4a42"; ell(c, 0, 0, 6 * s, 2.5 * s); const ph = (t * .6 + o.x * .001) % 1;
      for (let i = 0; i < 5; i++) { const p = (ph + i / 5) % 1; c.fillStyle = `rgba(255,255,255,${.8 * (1 - p)})`; circle(c, Math.sin(p * 6 + i) * 2 * s, -p * 30 * s, (2 + p * 4) * s); } },
    ruin(c, o) { const s = o.s; shadowE(c, 0, 0, 12 * s, 3 * s); c.fillStyle = "#bdb3a4"; c.fillRect(-10 * s, -14 * s, 5 * s, 15 * s); c.fillRect(4 * s, -9 * s, 5 * s, 10 * s); c.fillRect(-11 * s, -16 * s, 20 * s, 3 * s);
      c.fillStyle = "#7aa86a"; ell(c, -7 * s, -16 * s, 4 * s, 2 * s); ell(c, 7 * s, -1 * s, 4 * s, 2 * s); },
    totem(c, o) { const s = o.s; shadowE(c, 0, 0, 4 * s, 2 * s); ["#c0574a", "#e0b048", "#5fae6a"].forEach((col, i) => { c.fillStyle = col; c.fillRect(-3 * s, (-8 - i * 7) * s, 6 * s, 7 * s);
      c.fillStyle = "#2b2230"; c.fillRect(-2 * s, (-6 - i * 7) * s, 1.2 * s, 1.2 * s); c.fillRect(.8 * s, (-6 - i * 7) * s, 1.2 * s, 1.2 * s); }); },
    lantern(c, o, t) { const s = o.s; c.fillStyle = "#5a4a3a"; c.fillRect(-.6 * s, -10 * s, 1.2 * s, 10 * s); const g = c.createRadialGradient(0, -11 * s, .5, 0, -11 * s, 9 * s * (1 + Math.sin(t * 3 + o.x) * .1));
      g.addColorStop(0, "rgba(255,250,170,.95)"); g.addColorStop(1, "rgba(255,250,170,0)"); c.fillStyle = g; circle(c, 0, -11 * s, 9 * s); c.fillStyle = "#ffcf6a"; ell(c, 0, -11 * s, 1.8 * s, 2.4 * s); },
    tower(c, o) { const s = o.s; shadowE(c, 0, 2 * s, 8 * s, 3 * s); c.fillStyle = "#a8834f"; c.fillRect(-5 * s, -24 * s, 10 * s, 26 * s); c.fillStyle = "#8a6a4a"; c.fillRect(-7 * s, -28 * s, 14 * s, 5 * s);
      c.beginPath(); c.moveTo(-8 * s, -28 * s); c.lineTo(0, -36 * s); c.lineTo(8 * s, -28 * s); c.fill(); c.fillStyle = "#e0566b"; c.fillRect(0, -44 * s, 1.4 * s, 9 * s); c.beginPath(); c.moveTo(1.4 * s, -44 * s); c.lineTo(8 * s, -41 * s); c.lineTo(1.4 * s, -38 * s); c.fill(); },
    wreck(c, o) { const s = o.s; c.rotate(-.12); c.fillStyle = "rgba(0,0,0,.18)"; ell(c, 0, 12 * s, 44 * s, 8 * s); c.fillStyle = "#8a5a3c"; c.beginPath(); c.moveTo(-40 * s, 0); c.quadraticCurveTo(-28 * s, 18 * s, 18 * s, 16 * s); c.lineTo(36 * s, -3 * s); c.closePath(); c.fill();
      c.fillStyle = "#6f4628"; for (let i = 0; i < 4; i++) c.fillRect((-30 + i * 14) * s, 3 * s, 2 * s, 11 * s); c.strokeStyle = "#6b4a2a"; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(-4 * s, 0); c.lineTo(4 * s, -46 * s); c.stroke();
      c.fillStyle = "#fff7e6"; c.beginPath(); c.moveTo(6 * s, -44 * s); c.quadraticCurveTo(26 * s, -34 * s, 20 * s, -17 * s); c.lineTo(4 * s, -17 * s); c.fill(); },
    cave(c, o, t) { const s = o.s, cv = o.cave; const pal = cv.kind === "pix" ? ["#3d4a55", "#0e151b", "#2f6f86"] : ["#c9b8d8", "#5a4a6a", "#f49ab0"];
      c.fillStyle = "rgba(0,0,0,.22)"; ell(c, 4 * s, 13 * s, 26 * s, 6 * s); c.fillStyle = pal[0]; c.beginPath(); c.moveTo(-24 * s, 12 * s); c.quadraticCurveTo(-22 * s, -24 * s, 0, -26 * s); c.quadraticCurveTo(22 * s, -24 * s, 24 * s, 12 * s); c.closePath(); c.fill();
      c.fillStyle = "rgba(255,255,255,.18)"; ell(c, -8 * s, -14 * s, 8 * s, 5 * s, -.5); c.fillStyle = pal[1]; c.beginPath(); c.moveTo(-12 * s, 12 * s); c.quadraticCurveTo(-11 * s, -11 * s, 0, -12 * s); c.quadraticCurveTo(11 * s, -11 * s, 12 * s, 12 * s); c.closePath(); c.fill();
      if (cv.kind === "pix") { c.fillStyle = "#ffd15a"; const b = Math.sin(t * 1.3 + o.x) > .95 ? .2 : 1; ell(c, -4 * s, -2 * s, 2 * s, 2 * s * b); ell(c, 4 * s, -2 * s, 2 * s, 2 * s * b); }
      c.fillStyle = "#fff"; circle(c, 20 * s, -22 * s, 6.5 * s); c.fillStyle = pal[2]; circle(c, 20 * s, -22 * s, 5.5 * s); c.fillStyle = "#fff"; c.font = `900 ${7 * s}px ui-rounded, system-ui`; c.textAlign = "center"; c.fillText(cv.n, 20 * s, -19.4 * s); },
    sign(c, o) { c.fillStyle = "rgba(0,0,0,.18)"; ell(c, 2, 4, 14, 4); c.fillStyle = "#8a5a3c"; c.fillRect(-3, -40, 6, 44); c.fillStyle = "#d8a86a"; c.beginPath(); c.roundRect(-46, -58, 92, 26, 6); c.fill();
      c.fillStyle = "#6b4428"; c.font = "800 13px ui-rounded, system-ui"; c.textAlign = "center"; c.fillText(o.text, 0, -40); },
  };
  const G = {
    flower(c, o, t) { const sway = Math.sin(t * 1.6 + o.x * .05) * .08; c.rotate(sway); c.scale(o.s, o.s); c.fillStyle = o.c; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; circle(c, Math.cos(a) * 1.1, Math.sin(a) * 1.1, .8); } c.fillStyle = "#ffe08a"; circle(c, 0, 0, .6); },
    tuft(c, o) { c.strokeStyle = o.c || "#8fcf80"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, 0); c.lineTo(-4, -5); c.moveTo(0, 0); c.lineTo(0, -7); c.moveTo(3, 0); c.lineTo(4.5, -5); c.stroke(); },
    speck(c, o) { c.fillStyle = "#ecd09f"; circle(c, 0, 0, o.s * .5); },
    shell(c, o) { const b = o.bob > 0 ? Math.sin(o.bob * Math.PI) * 6 : 0; c.translate(0, -b); c.scale(o.s, o.s); c.fillStyle = "rgba(160,120,90,.15)"; ell(c, 0, 1.6, 1.8, .5);
      c.fillStyle = o.c; c.beginPath(); c.arc(0, 0, 1.6, Math.PI, 0); c.lineTo(0, 1.4); c.closePath(); c.fill(); c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = .25; c.beginPath(); c.moveTo(0, 1.2); c.lineTo(-.8, -1.2); c.moveTo(0, 1.2); c.lineTo(.8, -1.2); c.stroke(); },
    reed(c, o, t) { c.rotate(Math.sin(t * 1.2 + o.x) * .05); c.strokeStyle = "#5a7e4e"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(-1, -16); c.moveTo(4, 0); c.lineTo(6, -12); c.moveTo(-4, 0); c.lineTo(-6, -11); c.stroke(); c.fillStyle = "#7a5a3a"; ell(c, -1, -17, 1.6, 3.4); },
    lily(c, o) { c.scale(o.s, o.s); c.fillStyle = "#6fae6a"; c.beginPath(); c.arc(0, 0, 4, .3, TAU - .3); c.lineTo(0, 0); c.fill(); c.fillStyle = "#ffb0c8"; circle(c, 1, -1, 1.4); },
    mushroom(c, o) { c.scale(o.s, o.s); c.fillStyle = "#f4ead8"; c.fillRect(-.6, -2, 1.2, 2.4); c.fillStyle = "#e0566b"; c.beginPath(); c.arc(0, -2, 2, Math.PI, 0); c.fill(); c.fillStyle = "#fff"; circle(c, -.8, -2.8, .35); circle(c, .7, -3.2, .3); },
    firefly(c, o, t) { const x = Math.sin(t * .7 + o.x) * 14, y = Math.cos(t * .9 + o.y) * 8 - 20; const g = c.createRadialGradient(x, y, .5, x, y, 7); g.addColorStop(0, `rgba(255,250,170,${.6 + .4 * Math.sin(t * 4 + o.x)})`); g.addColorStop(1, "rgba(255,250,170,0)"); c.fillStyle = g; circle(c, x, y, 7); },
    ember(c, o, t) { c.fillStyle = `rgba(255,${130 + 50 * Math.sin(t * 3 + o.x)},60,.9)`; circle(c, 0, 0, o.s * .6); },
    ash(c, o) { c.fillStyle = "rgba(90,70,66,.35)"; ell(c, 0, 0, o.s * 2.4, o.s * 1.1); },
    field(c, o) { const s = o.s; c.rotate(-.08); c.fillStyle = "rgba(120,90,50,.25)"; c.fillRect(-20 * s + 4, -11 * s + 4, 40 * s, 22 * s); c.fillStyle = "#c9a46a"; c.fillRect(-20 * s, -11 * s, 40 * s, 22 * s);
      c.fillStyle = o.extra ? "#e8c048" : "#8fcf70"; for (let i = -20 * s + 6; i < 20 * s; i += 18) c.fillRect(i, -11 * s + 5, 10, 22 * s - 10); },
    pier(c, o) { const s = o.s, len = 40 * s; c.rotate(o.extra || 0); c.fillStyle = "rgba(20,60,90,.25)"; c.fillRect(6, -10, len, 28); c.fillStyle = "#c79a63"; c.fillRect(0, -14, len, 28); c.fillStyle = "#a87a48"; for (let i = 6; i < len; i += 16) c.fillRect(i, -14, 3, 28);
      c.fillStyle = "#7a5230"; for (let i = 0; i <= len; i += 50) { c.fillRect(i, -18, 7, 7); c.fillRect(i, 11, 7, 7); } },
    bridge(c, o) { c.rotate(o.ang + Math.PI / 2); const L = 170, Wd = 60; c.fillStyle = "rgba(30,40,30,.28)"; c.fillRect(-L / 2 + 6, -Wd / 2 + 8, L, Wd); c.fillStyle = "#c79a63"; c.fillRect(-L / 2, -Wd / 2, L, Wd);
      c.fillStyle = "#a87a48"; for (let i = -L / 2 + 4; i < L / 2; i += 13) c.fillRect(i, -Wd / 2, 3, Wd); c.fillStyle = "#7a5230"; c.fillRect(-L / 2, -Wd / 2 - 6, L, 6); c.fillRect(-L / 2, Wd / 2, L, 6);
      c.fillStyle = "#6b4428"; for (const [a, b] of [[-L / 2, -Wd / 2 - 9], [L / 2 - 9, -Wd / 2 - 9], [-L / 2, Wd / 2], [L / 2 - 9, Wd / 2], [-5, -Wd / 2 - 9], [-5, Wd / 2]]) c.fillRect(a, b, 9, 10); },
  };

  // ---------------------------------------------------------------- sol, eau, objets
  const waveCache = new Map();
  function drawWater(c, w, h) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#5aa8d0"); g.addColorStop(1, "#6ab8dc"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  function drawGround(c, view, t) {
    const T = M.TILE, ov = M.getOverview(), want = new Set();
    let missing = 0;
    for (let ty = Math.floor(view.y0 / T); ty <= Math.floor(view.y1 / T); ty++) for (let tx = Math.floor(view.x0 / T); tx <= Math.floor(view.x1 / T); tx++) if (!M.tile(tx, ty, true)) missing++;
    if (missing) M.work(40); // des trous à l'écran : on les comble tout de suite
    for (let ty = Math.floor(view.y0 / T); ty <= Math.floor(view.y1 / T); ty++) for (let tx = Math.floor(view.x0 / T); tx <= Math.floor(view.x1 / T); tx++) {
      const cv = M.tile(tx, ty, true); want.add(tx + "," + ty);
      if (cv) c.drawImage(cv, tx * T, ty * T, T + .5, T + .5);
      else { const k = ov.width / WW; c.drawImage(ov, tx * T * k, ty * T * k, T * k, T * k, tx * T, ty * T, T + .5, T + .5); }
    }
    // tuiles autour de l'écran à préparer en avance
    for (let ty = Math.floor(view.y0 / T) - 1; ty <= Math.floor(view.y1 / T) + 1; ty++) for (let tx = Math.floor(view.x0 / T) - 1; tx <= Math.floor(view.x1 / T) + 1; tx++) { want.add(tx + "," + ty); M.tile(tx, ty); }
    M.clearQueue(want);
    // vagues animées sur la mer
    c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 2.6; c.lineCap = "round";
    for (let y = Math.floor(view.y0 / 150) * 150; y < view.y1 + 150; y += 150) for (let x = Math.floor(view.x0 / 180) * 180; x < view.x1 + 180; x += 180) {
      const key = x + "," + y; let wv = waveCache.get(key);
      if (wv === undefined) { const jx = x + (M.hash(x, y) - .5) * 90, jy = y + (M.hash(y, x) - .5) * 70; wv = M.mainD(jx / K, jy / K) > 1.08 ? { x: jx, y: jy, p: M.hash(x * 3, y) * TAU } : null; waveCache.set(key, wv); }
      if (!wv) continue;
      const a = .5 + .5 * Math.sin(t * 1.3 + wv.p), ox = Math.sin(t * .8 + wv.p) * 8;
      c.globalAlpha = .3 + .5 * a; c.beginPath(); const X = wv.x + ox, Y = wv.y; c.moveTo(X, Y); c.quadraticCurveTo(X + 8, Y - 6, X + 16, Y); c.quadraticCurveTo(X + 24, Y + 6, X + 32, Y); c.stroke();
    }
    c.globalAlpha = 1;
    around(view.x0 - 260, view.y0 - 60, view.x1 + 260, view.y1 + 60, (ch) => {
      for (const o of ch.ground) { if (o.gone || o.x < view.x0 - 260 || o.x > view.x1 + 260 || o.y < view.y0 - 60 || o.y > view.y1 + 60) continue; c.save(); c.translate(o.x, o.y); G[o.kind](c, o, t); c.restore(); }
    });
  }
  function visibleSolids(view, out) {
    around(view.x0 - 300, view.y0 - 60, view.x1 + 300, view.y1 + 400, (ch) => {
      for (const o of ch.solids) if (o.x > view.x0 - 300 && o.x < view.x1 + 300 && o.y > view.y0 - 60 && o.y < view.y1 + 400) out.push(o);
    });
    return out;
  }
  function drawSolid(c, o, t) {
    const sh = o.shake > 0 ? Math.sin(o.shake * 40) * o.shake * .5 : 0;
    c.save(); c.translate(o.x, o.y); D[o.kind](c, o, t, sh); c.restore();
  }
  function update(dt, view) {
    around(view.x0 - 300, view.y0 - 300, view.x1 + 300, view.y1 + 300, (ch) => {
      for (const s of ch.solids) if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
      for (const g of ch.ground) if (g.bob > 0) g.bob = Math.max(0, g.bob - dt * 2.2);
    });
  }
  // lieu où l'on se trouve (pour l'écran et la carte)
  function placeName(x, y) {
    const mx = x / K, my = y / K;
    if (Math.hypot(mx - M.VILLAGE.x, (my - M.VILLAGE.y) * 1.25) < 120) return "Votre village";
    const w = M.weights(mx, my); let bi = 0; for (let i = 1; i < 5; i++) if (w[i] > w[bi]) bi = i; return M.BIOMES[bi].name;
  }
  function preview(c, size) { const ov = M.getOverview(); c.fillStyle = "#4a9ac8"; c.fillRect(0, 0, size, size); const k = size / ov.height * 1.6; c.drawImage(ov, (size - ov.width * k) / 2 + 10, (size - ov.height * k) / 2, ov.width * k, ov.height * k); }

  return { WW, WH, spawn, walkable, move, nearest, drawWater, drawGround, visibleSolids, drawSolid, update, placeName, preview, chunk, around };
}
