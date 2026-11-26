/* Les Échoués de Kalua — la construction : catalogue des bâtiments et leurs dessins (version 2, soignée).
 * Vue de trois quarts. Tout est dessiné en « unités de carte » : draw() met le contexte à l'échelle s (pixels par unité).
 * Origine = milieu du bord avant, au sol. Lumière venant du haut à gauche.
 * Dans le jeu, chaque bâtiment est rendu une fois dans une image en cache (pas redessiné à chaque image). */
"use strict";

const BUILD = (() => {
  const TAU = Math.PI * 2;
  // ================================================================ boîte à outils
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const sh = (h, k) => { const [r, g, b] = hex(h); const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const rgba = (h, a) => { const [r, g, b] = hex(h); return `rgba(${r},${g},${b},${a})`; };
  const OUT = "rgba(60,38,34,.55)", LW = .16;
  let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const lin = (c, x0, y0, x1, y1, stops) => { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; };
  const poly = (c, pts) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); };
  const fill = (c, f, stroke = OUT, lw = LW) => { c.fillStyle = f; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw; c.lineJoin = "round"; c.stroke(); } };
  const rect = (c, x, y, w, h, f, stroke) => { c.beginPath(); c.rect(x, y, w, h); fill(c, f, stroke); };
  const rrect = (c, x, y, w, h, r, f, stroke) => { c.beginPath(); c.roundRect(x, y, w, h, r); fill(c, f, stroke); };
  const ell = (c, x, y, rx, ry, f, stroke) => { c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU); fill(c, f, stroke); };
  const line = (c, pts, col, w = .15) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.stroke(); };
  const shadow = (c, w, d) => { const g = c.createRadialGradient(w * .06, -d * .2, 0, w * .06, -d * .2, w * .62); g.addColorStop(0, "rgba(40,50,30,.28)"); g.addColorStop(1, "rgba(40,50,30,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(w * .06, -d * .2, w * .64, d * .42, 0, 0, TAU); c.fill(); };

  // ---- murs (face avant) avec textures
  function wall(c, x, y, w, h, col, tex = "plaster", o = {}) {
    c.save(); c.beginPath(); c.rect(x, y - h, w, h); c.clip();
    c.fillStyle = lin(c, x, y - h, x, y, [[0, sh(col, 1.08)], [1, sh(col, .9)]]); c.fillRect(x, y - h, w, h);
    seed = Math.round(x * 13 + h * 7 + w) + 3;
    if (tex === "planks") { for (let yy = y - h + 1.1; yy < y; yy += 1.1) { line(c, [[x, yy], [x + w, yy]], sh(col, .78), .12); for (let k = 0; k < w / 6; k++) { const kx = x + rnd() * w; line(c, [[kx, yy - 1.1], [kx, yy]], sh(col, .82), .08); } } }
    if (tex === "logs") { for (let yy = y - h + .6; yy < y; yy += 1.2) { c.fillStyle = sh(col, .88); c.fillRect(x, yy + .6, w, .25); ell(c, x + .5, yy, .55, .55, sh(col, 1.1), sh(col, .7)); ell(c, x + w - .5, yy, .55, .55, sh(col, 1.1), sh(col, .7)); } }
    if (tex === "stone") { for (let r = 0, yy = y; yy > y - h; r++, yy -= 1.25) { let xx = x - (r % 2) * .9; while (xx < x + w) { const bw = 1.4 + rnd() * 1.2; rrect(c, xx + .07, yy - 1.18, bw - .14, 1.1, .3, sh(col, .92 + rnd() * .14), sh(col, .72)); xx += bw; } } }
    if (tex === "brick") { for (let r = 0, yy = y; yy > y - h; r++, yy -= .7) { for (let xx = x - (r % 2) * .8; xx < x + w; xx += 1.6) rect(c, xx + .06, yy - .64, 1.48, .58, sh(col, .94 + rnd() * .1), null); } }
    if (tex === "plaster") { for (let k = 0; k < w * h / 4; k++) ell(c, x + rnd() * w, y - rnd() * h, .12, .08, sh(col, .93), null); }
    if (tex === "timber") { const bc = o.beam || "#6b4428"; rect(c, x, y - h, w, .45, bc, null); rect(c, x, y - .45, w, .45, bc, null); const n = Math.max(2, Math.round(w / 3.2)); for (let i = 0; i <= n; i++) { const xx = x + i * (w - .45) / n; rect(c, xx, y - h, .45, h, bc, null); if (i < n) { const x2 = x + (i + 1) * (w - .45) / n; line(c, i % 2 ? [[xx + .4, y - h + .4], [x2, y - .4]] : [[xx + .4, y - .4], [x2, y - h + .4]], bc, .38); } } }
    if (tex === "shingle") { for (let r = 0, yy = y - h; yy < y; r++, yy += .9) for (let xx = x - (r % 2) * .5; xx < x + w; xx += 1) rrect(c, xx + .05, yy, .9, .95, [0, 0, .3, .3], sh(col, .95 + rnd() * .08), sh(col, .78)); }
    // volume : la droite un peu dans l'ombre, l'avant-toit qui fait de l'ombre en haut, l'herbe qui assombrit le pied
    c.fillStyle = lin(c, x + w * .78, 0, x + w, 0, [[0, "rgba(40,20,30,0)"], [1, "rgba(40,20,30,.18)"]]); c.fillRect(x + w * .78, y - h, w * .22, h);
    if (!o.noEave) { c.fillStyle = lin(c, 0, y - h, 0, y - h + 1.6, [[0, "rgba(40,20,30,.35)"], [1, "rgba(40,20,30,0)"]]); c.fillRect(x, y - h, w, 1.6); }
    c.fillStyle = lin(c, 0, y - .9, 0, y, [[0, "rgba(40,30,20,0)"], [1, "rgba(40,30,20,.22)"]]); c.fillRect(x, y - .9, w, .9);
    c.restore(); c.beginPath(); c.rect(x, y - h, w, h); c.strokeStyle = OUT; c.lineWidth = LW; c.stroke();
    if (o.base) { const bh = o.base; c.save(); c.beginPath(); c.rect(x - .2, y - bh, w + .4, bh); c.clip(); for (let xx = x - .2, k = 0; xx < x + w + .2; k++) { const bw = .9 + ((k * 7) % 5) * .2; rrect(c, xx, y - bh + .05, bw - .08, bh - .1, .25, sh(o.baseCol || "#b8b0a8", .9 + (k % 3) * .06), sh(o.baseCol || "#b8b0a8", .7)); xx += bw; } c.restore(); }
  }
  // ---- toits : pan avant en trapèze, rangs de tuiles / ardoises / chaume / bardeaux
  function roof(c, x, y, w, h, col, kind = "tiles", o = {}) {
    const ov = o.over ?? 1.2, ins = o.inset ?? w * .16, top = y - h;
    const pts = [[x - ov, y], [x + ins, top], [x + w - ins, top], [x + w + ov, y]];
    c.save(); poly(c, pts); c.fillStyle = lin(c, 0, top, 0, y, [[0, sh(col, 1.12)], [1, sh(col, .86)]]); c.fill(); c.clip();
    const rows = Math.max(3, Math.round(h / (kind === "thatch" ? 1.4 : 1)));
    for (let r = 0; r < rows; r++) {
      const yy = top + (r + 1) * h / rows, k = (r + 1) / rows, lx = x + ins - (ins + ov) * k, rx = x + w - ins + (ins + ov) * k, dark = sh(col, .72 + (r % 2) * .04);
      if (kind === "tiles") { const tw = 1.1; for (let xx = lx; xx < rx; xx += tw) { c.beginPath(); c.arc(xx + tw / 2, yy - .1, tw / 2, 0, Math.PI); c.fillStyle = sh(col, .92 - (r % 2) * .05); c.fill(); c.strokeStyle = dark; c.lineWidth = .1; c.stroke(); } }
      if (kind === "slate") { line(c, [[lx, yy], [rx, yy]], dark, .12); for (let xx = lx + (r % 2) * .6; xx < rx; xx += 1.2) line(c, [[xx, yy], [xx, yy - h / rows]], dark, .08); }
      if (kind === "shingle") { for (let xx = lx + (r % 2) * .45; xx < rx; xx += .9) rrect(c, xx, yy - h / rows, .85, h / rows + .1, [0, 0, .3, .3], sh(col, .9 + ((xx * 3 | 0) % 3) * .05), dark); }
      if (kind === "thatch") { for (let xx = lx; xx < rx; xx += .32) line(c, [[xx, yy - h / rows - .2], [xx + .15, yy + .15]], sh(col, .78 + ((xx * 7 | 0) % 4) * .06), .14); }
      if (kind === "palm") { for (let xx = lx; xx < rx; xx += .9) { c.beginPath(); c.moveTo(xx, yy - h / rows); c.quadraticCurveTo(xx + .45, yy + .5, xx + .9, yy - h / rows); c.fillStyle = sh(col, .88 + (r % 2) * .1); c.fill(); } }
    }
    c.fillStyle = lin(c, 0, top, 0, top + h * .35, [[0, "rgba(255,255,255,.18)"], [1, "rgba(255,255,255,0)"]]); c.fillRect(x - ov, top, w + ov * 2, h * .35);
    c.restore(); poly(c, pts); c.strokeStyle = OUT; c.lineWidth = LW; c.stroke();
    rrect(c, x + ins - .3, top - .55, w - ins * 2 + .6, .7, .3, sh(col, .7), OUT); // faîtière
    if (kind === "thatch") { c.beginPath(); for (let xx = x - ov; xx <= x + w + ov; xx += .5) c.lineTo(xx, y + .25 + Math.sin(xx * 3) * .18); c.strokeStyle = sh(col, .7); c.lineWidth = .2; c.stroke(); }
  }
  // pignon / lucarne qui avance vers nous
  function gableFront(c, x, y, w, h, wallCol, roofCol, kind = "tiles", tex = "plaster") {
    poly(c, [[x, y], [x + w / 2, y - h * .78], [x + w, y]]); c.fillStyle = lin(c, 0, y - h, 0, y, [[0, sh(wallCol, 1.05)], [1, sh(wallCol, .92)]]); fill(c, c.fillStyle);
    if (tex === "timber") { line(c, [[x + w / 2, y - h * .76], [x + w / 2, y]], "#6b4428", .35); line(c, [[x + w * .25, y], [x + w / 2, y - h * .5]], "#6b4428", .3); line(c, [[x + w * .75, y], [x + w / 2, y - h * .5]], "#6b4428", .3); }
    const t = .9; poly(c, [[x - 1, y + .3], [x + w / 2, y - h], [x + w + 1, y + .3], [x + w + 1 - t, y + .3], [x + w / 2, y - h + t * 1.3], [x - 1 + t, y + .3]]); fill(c, sh(roofCol, .9));
  }
  // tour ronde (cylindre éclairé à gauche) et toit conique à tuiles
  function tower(c, x, y, r, h, wallCol, roofCol, t, o = {}) {
    ell(c, x, y, r, r * .32, sh(wallCol, .6), null);
    c.save(); c.beginPath(); c.rect(x - r, y - h, r * 2, h); c.clip();
    c.fillStyle = lin(c, x - r, 0, x + r, 0, [[0, sh(wallCol, 1.06)], [.35, sh(wallCol, 1.12)], [1, sh(wallCol, .72)]]); c.fillRect(x - r, y - h, r * 2, h + 1);
    seed = Math.round(x * 5 + h) + 11; for (let rr = 0, yy = y; yy > y - h; rr++, yy -= 1.2) for (let xx = x - r - (rr % 2) * .8; xx < x + r; xx += 1.6 + rnd() * .5) line(c, [[xx, yy], [xx, yy - 1.2]], "rgba(60,40,50,.13)", .1);
    for (let yy = y; yy > y - h; yy -= 1.2) line(c, [[x - r, yy], [x + r, yy]], "rgba(60,40,50,.12)", .1);
    c.restore(); c.beginPath(); c.rect(x - r, y - h, r * 2, h); c.strokeStyle = OUT; c.lineWidth = LW; c.stroke();
    for (let k = 0; k < (o.windows ?? 2); k++) win(c, x - r * .28, y - h * (.3 + k * .3) - r * .5, r * .56, r * .9, { arch: true, lit: true, frame: "#5a3a2a" });
    if (o.crenel) { const n = 5, cw = (r * 2 + .6) / (n * 2 - 1); rect(c, x - r - .3, y - h - .4, r * 2 + .6, .5, sh(wallCol, .95)); for (let i = 0; i < n; i++) rect(c, x - r - .3 + i * cw * 2, y - h - .4 - cw * .9, cw, cw * .9, sh(wallCol, i < 2 ? 1.05 : .9)); return; }
    const rh = o.roofH ?? r * 2.6, top = y - h - rh, ov = .6;
    c.save(); poly(c, [[x - r - ov, y - h + .2], [x, top], [x + r + ov, y - h + .2]]); c.fillStyle = lin(c, x - r, 0, x + r, 0, [[0, sh(roofCol, 1.15)], [.4, sh(roofCol, 1.05)], [1, sh(roofCol, .7)]]); c.fill(); c.clip();
    for (let yy = top + 1; yy < y - h + 1; yy += .9) { const k = (yy - top) / rh, half = (r + ov) * k; for (let xx = x - half; xx < x + half; xx += .9) { c.beginPath(); c.arc(xx + .45, yy, .45, 0, Math.PI); c.strokeStyle = sh(roofCol, .72); c.lineWidth = .08; c.stroke(); } }
    c.restore(); poly(c, [[x - r - ov, y - h + .2], [x, top], [x + r + ov, y - h + .2]]); c.strokeStyle = OUT; c.lineWidth = LW; c.stroke();
    ell(c, x, top + .2, .35, .35, "#e8c060", OUT); if (o.flag) flag(c, x, top, 3.4, o.flag, t);
  }
  // fenêtres : cadre, carreaux, reflet, lumière, volets, jardinière
  function win(c, x, y, w, h, o = {}) {
    const fr = o.frame || "#f4ecdc";
    if (o.shutters) { rrect(c, x - w * .55, y - .1, w * .5, h + .2, .15, o.shutters, OUT); rrect(c, x + w * 1.05, y - .1, w * .5, h + .2, .15, o.shutters, OUT); for (let k = 1; k < 4; k++) { line(c, [[x - w * .5, y + h * k / 4], [x - w * .1, y + h * k / 4]], sh(o.shutters, .75), .08); line(c, [[x + w * 1.1, y + h * k / 4], [x + w * 1.5, y + h * k / 4]], sh(o.shutters, .75), .08); } }
    const r = o.arch ? [w / 2, w / 2, .15, .15] : .2;
    rrect(c, x - .25, y - .25, w + .5, h + .5, o.arch ? [w / 2 + .25, w / 2 + .25, .2, .2] : .3, fr, OUT);
    const glass = o.lit === false ? lin(c, x, y, x + w, y + h, [[0, "#bfe0f4"], [1, "#7aa8cc"]]) : lin(c, x, y, x, y + h, [[0, "#fff3c4"], [1, "#ffcf6a"]]);
    rrect(c, x, y, w, h, r, glass, null);
    poly(c, [[x + w * .15, y + h * .8], [x + w * .45, y + h * .15], [x + w * .6, y + h * .15], [x + w * .3, y + h * .8]]); c.fillStyle = "rgba(255,255,255,.35)"; c.fill();
    line(c, [[x + w / 2, y + (o.arch ? w * .2 : 0)], [x + w / 2, y + h]], fr, .18); line(c, [[x, y + h * .55], [x + w, y + h * .55]], fr, .18);
    if (o.box) { rrect(c, x - .45, y + h + .2, w + .9, .8, .2, o.boxCol || "#a8703a", OUT); for (let k = 0; k < Math.max(3, w * 1.6); k++) { const fx = x - .2 + k * (w + .4) / Math.max(3, w * 1.6); ell(c, fx, y + h + .05, .35, .3, "#5aa05a", null); ell(c, fx + .1, y + h - .15, .22, .2, ["#ff7f9f", "#ffd23a", "#ffffff", "#b48aff", "#ff8a5a"][(k + (x | 0)) % 5], null); } }
  }
  function door(c, x, y, w, h, o = {}) {
    const col = o.col || "#7a4a2a", arch = o.arch !== false;
    if (o.steps) for (let i = 0; i < o.steps; i++) rrect(c, x - .6 - i * .4, y - .45 * (o.steps - i) + .45, w + 1.2 + i * .8, .5, .15, sh(o.stepCol || "#cfc6b8", 1 - i * .04), OUT);
    const by = y - (o.steps ? .45 * o.steps - .45 : 0);
    rrect(c, x - .35, by - h - .35, w + .7, h + .35, arch ? [w / 2 + .35, w / 2 + .35, 0, 0] : .2, o.frame || sh(col, .65), OUT);
    c.beginPath(); c.roundRect(x, by - h, w, h, arch ? [w / 2, w / 2, 0, 0] : .1); c.fillStyle = lin(c, x, 0, x + w, 0, [[0, sh(col, 1.1)], [1, sh(col, .85)]]); fill(c, c.fillStyle);
    if (o.double) line(c, [[x + w / 2, by - h + (arch ? w * .3 : 0)], [x + w / 2, by]], sh(col, .6), .14); else for (let k = 1; k < 3; k++) line(c, [[x + w * k / 3, by - h + (arch ? w * .35 : .2)], [x + w * k / 3, by - .2]], sh(col, .78), .1);
    ell(c, x + w * (o.double ? .42 : .8), by - h * .42, .18, .18, "#f0c860", null); if (o.double) ell(c, x + w * .58, by - h * .42, .18, .18, "#f0c860", null);
    if (o.lamp) { lanternWall(c, x - 1.1, by - h * .8); lanternWall(c, x + w + 1.1, by - h * .8); }
  }
  function lanternWall(c, x, y) { line(c, [[x, y - .2], [x, y - 1]], "#3a3a42", .14); rrect(c, x - .4, y - .2, .8, 1.1, .2, "#ffd870", "#3a3a42"); const g = c.createRadialGradient(x, y + .4, 0, x, y + .4, 2.4); g.addColorStop(0, "rgba(255,220,140,.35)"); g.addColorStop(1, "rgba(255,220,140,0)"); c.fillStyle = g; c.fillRect(x - 2.4, y - 2, 4.8, 4.8); }
  function awning(c, x, y, w, d, c1, c2 = "#ffffff") {
    const n = Math.max(4, Math.round(w / 1.3)), sw = w / n;
    for (let i = 0; i < n; i++) { poly(c, [[x + i * sw, y - d], [x + (i + 1) * sw, y - d], [x + (i + 1) * sw + .25, y], [x + i * sw - .25 + (i ? .5 : 0) * 0, y]]); c.fillStyle = lin(c, 0, y - d, 0, y, [[0, sh(i % 2 ? c2 : c1, 1.05)], [1, sh(i % 2 ? c2 : c1, .88)]]); c.fill(); c.beginPath(); c.arc(x + i * sw + sw / 2, y, sw / 2, 0, Math.PI); c.fillStyle = i % 2 ? sh(c2, .9) : sh(c1, .9); c.fill(); }
    c.beginPath(); c.rect(x, y - d, w, d); c.strokeStyle = OUT; c.lineWidth = LW; c.stroke();
    c.fillStyle = "rgba(40,20,30,.18)"; c.fillRect(x, y + .5, w, 1.1);
  }
  function sign(c, x, y, icon, bg = "#f4e4c4", txt) {
    line(c, [[x - 2.2, y - 1.6], [x + 2.2, y - 1.6]], "#3a3a42", .22); line(c, [[x - 1.4, y - 1.6], [x - 1.4, y - .9]], "#3a3a42", .1); line(c, [[x + 1.4, y - 1.6], [x + 1.4, y - .9]], "#3a3a42", .1);
    rrect(c, x - 2, y - .9, 4, 2.6, .5, bg, OUT); c.font = "1.7px 'Segoe UI Emoji','Apple Color Emoji',sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(icon, x, y + .4); c.textAlign = "left"; c.textBaseline = "alphabetic";
    if (txt) banner(c, x, y + 2.6, txt);
  }
  function banner(c, x, y, txt, bg = "#5a3a2a", fg = "#fff4d8") { c.font = "900 1.15px 'Segoe UI',sans-serif"; const w = c.measureText(txt).width + 1.2; rrect(c, x - w / 2, y - .85, w, 1.6, .4, bg, OUT); c.fillStyle = fg; c.textAlign = "center"; c.fillText(txt, x, y + .35); c.textAlign = "left"; }
  function chimney(c, x, y, w, h, col, t = 0) { wall(c, x, y, w, h, col, "brick", { noEave: true }); rect(c, x - .25, y - h - .45, w + .5, .5, sh(col, .7)); for (let k = 0; k < 4; k++) { const a = ((t * .35 + k / 4) % 1); ell(c, x + w / 2 + Math.sin(a * 6 + k) * .8, y - h - 1.2 - a * 6, .6 + a * 1.2, .5 + a, `rgba(240,240,245,${.55 * (1 - a)})`, null); } }
  function flag(c, x, y, h, col, t = 0) { line(c, [[x, y], [x, y - h]], "#5a4a3a", .18); const w = Math.sin(t * 4 + x) * .5; c.beginPath(); c.moveTo(x, y - h); c.quadraticCurveTo(x + 1.6, y - h + .3 + w, x + 3.2, y - h + .7); c.quadraticCurveTo(x + 1.6, y - h + 1.6 - w, x, y - h + 1.9); fill(c, col, OUT, .1); }
  function bush(c, x, y, r, col = "#5aa05a", flowers) { ell(c, x + r * .2, y + r * .1, r * 1.1, r * .45, "rgba(40,60,30,.2)", null); for (const [dx, dy, k] of [[-.6, -.4, .75], [.6, -.4, .75], [0, -.8, .85], [-.25, -.2, .8], [.35, -.15, .7]]) ell(c, x + dx * r, y + dy * r, r * k, r * k * .9, sh(col, .92 + dy * -.1), null); ell(c, x - r * .3, y - r * .95, r * .4, r * .3, "rgba(255,255,255,.18)", null); if (flowers) for (let k = 0; k < 6; k++) ell(c, x + Math.cos(k * 2.4) * r * .7, y - r * .5 + Math.sin(k * 2.4) * r * .4, r * .13, r * .12, flowers, null); }
  function pot(c, x, y, col = "#c86a4a", plant = "#5aa05a") { poly(c, [[x - .6, y - 1.1], [x + .6, y - 1.1], [x + .45, y], [x - .45, y]]); fill(c, col); bush(c, x, y - 1.1, .75, plant); }
  function lamp(c, x, y, h = 4.5) { rect(c, x - .12, y - h, .24, h, "#3a3a42", null); rrect(c, x - .5, y - h - 1.1, 1, 1.2, .25, "#ffe28a", "#3a3a42"); poly(c, [[x - .65, y - h - 1.05], [x, y - h - 1.6], [x + .65, y - h - 1.05]]); fill(c, "#3a3a42", null); const g = c.createRadialGradient(x, y - h - .5, 0, x, y - h - .5, 3); g.addColorStop(0, "rgba(255,220,140,.3)"); g.addColorStop(1, "rgba(255,220,140,0)"); c.fillStyle = g; c.fillRect(x - 3, y - h - 3.5, 6, 6); }
  function grass(c, x, w) { for (let k = 0; k < w * 1.4; k++) { const gx = x + k * w / (w * 1.4) + Math.sin(k) * .2; line(c, [[gx, 0], [gx - .15, -.6 - (k % 3) * .2]], "#4f9a4f", .12); line(c, [[gx + .2, 0], [gx + .35, -.5]], "#5aa85a", .12); } }
  function flowerBed(c, x, y, w) { rrect(c, x, y - .8, w, .9, .4, "#7a5232", OUT); for (let k = 0; k < w * 1.5; k++) { ell(c, x + .3 + k / 1.5, y - .9, .32, .28, "#5aa05a", null); ell(c, x + .35 + k / 1.5, y - 1.15, .2, .18, ["#ff7f9f", "#ffd23a", "#fff", "#b48aff"][k % 4], null); } }
  function parasolTable(c, x, y, col = "#ff7f9f", col2 = "#ffffff") { ell(c, x + .4, y + .2, 2.2, .7, "rgba(40,40,30,.2)", null); rrect(c, x - 1.2, y - 1.4, 2.4, .5, .2, "#f4ecdc", OUT); line(c, [[x, y - 1], [x, y]], "#8a8a92", .2); for (const dx of [-1.9, 1.9]) { rrect(c, x + dx - .5, y - 1, 1, .4, .15, "#a8703a", OUT); line(c, [[x + dx - .3, y - .6], [x + dx - .3, y]], "#6a4a2a", .12); } line(c, [[x, y - 1.4], [x, y - 5]], "#8a8a92", .18); for (let i = 0; i < 6; i++) { poly(c, [[x, y - 5.6], [x - 3 + i, y - 4.2 + (i % 2 ? .1 : 0)], [x - 2 + i, y - 4.2]]); fill(c, i % 2 ? col2 : col, OUT, .08); } }

  // ================================================================ la maison : 5 niveaux (cabane → château)
  const ROOMS = [5, 10, 15, 20, 25];
  const LEVELS = [
    { name: "Cabane", size: [12, 9], cost: { bois: 20, feuille: 12, corde: 3 } },
    { name: "Maison", size: [18, 12], cost: { bois: 45, pierre: 25, argile: 12, corde: 6 } },
    { name: "Grande maison", size: [24, 16], cost: { bois: 70, pierre: 60, argile: 25, fer: 8, laine: 6 } },
    { name: "Manoir", size: [32, 22], cost: { pierre: 120, bois: 80, fer: 25, silex: 15, coquillage: 20, perle: 2 } },
    { name: "Château", size: [44, 30], cost: { pierre: 220, fer: 50, obsidienne: 25, bois: 100, perle: 6, cristalFeu: 4 } },
  ];
  const HOUSE = [
    (c, t) => { // 1 · Cabane sur pilotis, palmes et bois flotté
      shadow(c, 12, 9); for (const x of [-4.6, -1.5, 1.5, 4.6]) rect(c, x - .3, -1.4, .6, 1.4, "#6b4a32");
      rrect(c, -6.4, -1.9, 12.8, .6, .2, "#a8784a"); wall(c, -5.5, -1.4, 11, 6, "#d9b07a", "planks"); door(c, -1.3, -1.4, 2.6, 4.2, { col: "#8a5232" }); win(c, 2.4, -5.6, 1.8, 1.8, { shutters: "#7ab4e8", box: true }); win(c, -4.4, -5.6, 1.8, 1.8, { shutters: "#7ab4e8" });
      roof(c, -5.5, -7.2, 11, 4.6, "#9bc46a", "palm", { over: 1.6 }); for (let i = 0; i < 3; i++) rrect(c, -2 - i * .5, -.9 + i * .45, 4 + i, .45, .15, "#b8885a", OUT);
      pot(c, -6.4, 0, "#c86a4a", "#6ab05a"); bush(c, 6.6, 0, 1, "#5aa05a", "#ff9fb8"); lanternWall(c, 2.2, -4.2);
    },
    (c, t) => { // 2 · Maison en bois sur soubassement de pierre, tuiles et porche
      shadow(c, 18, 12); chimney(c, -6.4, -9, 1.6, 4, "#c8806a", t);
      wall(c, -9, 0, 11, 7.5, "#f4e4c8", "planks", { base: 1.4 }); wall(c, 2, 0, 7, 6, "#e8d4b4", "planks", { base: 1.4 });
      roof(c, -9, -7.5, 11, 5, "#e8805a", "tiles"); roof(c, 2, -6, 7, 3.8, "#d8704a", "tiles", { over: 1 });
      win(c, -7.6, -5.4, 2, 2.2, { shutters: "#6aa0d0", box: true }); win(c, 3.4, -4.4, 1.8, 2, { shutters: "#6aa0d0", box: true }); win(c, 6.2, -4.4, 1.8, 2, { shutters: "#6aa0d0" });
      rect(c, -4.2, -6, 5.2, .5, "#a8704a"); rect(c, -4.2, -6, .45, 6, "#a8704a"); rect(c, .55, -6, .45, 6, "#a8704a"); roof(c, -4.6, -6, 6, 1.6, "#d8704a", "tiles", { over: .5, inset: .6 });
      door(c, -2.6, 0, 2.6, 4.4, { steps: 2, col: "#8a5232" }); lanternWall(c, .6, -4.2); flowerBed(c, -9, 0, 4); bush(c, 9.6, 0, 1.1, "#5aa05a", "#ffd23a");
    },
    (c, t) => { // 3 · Grande maison : rez en pierre, étage à colombages, balcon et tourelle
      shadow(c, 24, 16); tower(c, 9.4, 0, 3, 13, "#ece4d8", "#5a7ab0", t, { flag: "#ff7f9f", windows: 2 });
      chimney(c, -9, -15, 1.8, 4, "#a87a6a", t); chimney(c, 2, -15, 1.8, 4, "#a87a6a", t + 2);
      wall(c, -12, 0, 18.4, 6, "#d8cfc4", "stone"); wall(c, -12, -6, 18.4, 5.6, "#f6ecd8", "timber");
      roof(c, -12, -11.6, 18.4, 6, "#d8604a", "tiles"); gableFront(c, -5.6, -11.6, 6.6, 5.4, "#f6ecd8", "#c8503a", "tiles", "timber"); win(c, -3.1, -14.4, 1.6, 1.8, { arch: true });
      for (const x of [-10.8, -8, 1.6, 4.2]) { win(c, x, -4.6, 1.8, 2.6, { shutters: "#5a8ac0", box: true }); win(c, x, -10.4, 1.8, 2.4, { shutters: "#5a8ac0" }); }
      rect(c, -6.2, -6.4, 7.4, .6, "#6a4a3a"); for (let i = 0; i < 9; i++) rect(c, -6 + i * .85, -7.9, .22, 1.5, "#6a4a3a"); rect(c, -6.2, -8.1, 7.4, .3, "#6a4a3a");
      door(c, -4.4, 0, 3.6, 4.8, { steps: 2, double: true, col: "#6a3a22", lamp: true });
      flowerBed(c, -12, 0, 5); flowerBed(c, 1.5, 0, 4); bush(c, -12.6, 0, 1.2, "#4f9a4f"); pot(c, -5.4, 0); pot(c, -.4, 0);
    },
    (c, t) => { // 4 · Manoir : pierre claire, ardoises, deux tours, perron, haies
      shadow(c, 32, 22); rrect(c, -16.6, -1.4, 33.2, 1.4, .3, "#c8c0b4", OUT);
      chimney(c, -8.4, -17.6, 2, 4.4, "#9a8a7a", t); chimney(c, 6.6, -17.6, 2, 4.4, "#9a8a7a", t + 2);
      wall(c, -11.6, -1.2, 23.2, 11.5, "#ece4d8", "stone", { base: 1.2, baseCol: "#a8a098" });
      roof(c, -11.6, -12.7, 23.2, 6.4, "#55657e", "slate"); gableFront(c, -3.6, -12.7, 7.2, 7.6, "#ece4d8", "#4a5a72", "slate", "stone"); ell(c, 0, -16, 1.3, 1.3, "#e8c060", OUT); ell(c, 0, -16, .95, .95, "#9fcfe8", null);
      tower(c, -12.6, 0, 4.2, 16.5, "#e6ded2", "#4a5a72", t, { flag: "#ffd23a", windows: 3 }); tower(c, 12.6, 0, 4.2, 16.5, "#e6ded2", "#4a5a72", t, { flag: "#ff7f9f", windows: 3 });
      for (const x of [-9.4, -6.4, 4.4, 7.4]) { win(c, x, -6.4, 1.9, 3.1, { arch: true, box: true, frame: "#f8f2e8" }); win(c, x, -11.4, 1.9, 2.8, { arch: true, frame: "#f8f2e8" }); }
      door(c, -2.2, -1.2, 4.4, 6, { steps: 3, double: true, col: "#5a3020", lamp: true, stepCol: "#d8d0c4" });
      for (const x of [-16, 16]) { rect(c, x - .7, -3.4, 1.4, 2.2, "#c8c0b4"); pot(c, x, -3.4, "#c8c0b4", "#4f9a4f"); }
      for (let i = 0; i < 4; i++) { bush(c, -10 + i * 2.2, 0, .9, "#4f9a4f", i % 2 ? "#ffffff" : "#ff9fb8"); bush(c, 4 + i * 2.2, 0, .9, "#4f9a4f", i % 2 ? "#ffd23a" : "#ffffff"); }
    },
    (c, t) => { // 5 · Château : donjon, quatre tours, remparts crénelés, herse, bannières, jardins à la française
      shadow(c, 44, 30);
      wall(c, -7.5, -12, 15, 22, "#ece6f4", "stone"); const n = 7, cw = 15.6 / (n * 2 - 1); for (let i = 0; i < n; i++) rect(c, -7.8 + i * cw * 2, -34 - cw * .9, cw, cw * .9, "#ddd4e8", OUT);
      tower(c, -7.6, -12, 3, 29, "#efe9f6", "#6a5ab0", t, { flag: "#ffd23a", windows: 3 }); tower(c, 7.6, -12, 3, 29, "#efe9f6", "#6a5ab0", t, { flag: "#ff7f9f", windows: 3 });
      tower(c, 0, -24, 4.4, 20, "#f4eff9", "#7a6ad0", t, { flag: "#ffd23a", windows: 2 });
      for (const x of [-4.2, 2.4]) for (const y of [-19, -27]) win(c, x, y, 1.8, 3, { arch: true, frame: "#f8f2fc" });
      wall(c, -18, 0, 36, 11, "#e2dbea", "stone", { base: 1.2, baseCol: "#b8b0c4" }); const m = 15, cw2 = 36.6 / (m * 2 - 1); for (let i = 0; i < m; i++) rect(c, -18.3 + i * cw2 * 2, -11 - cw2 * .8, cw2, cw2 * .8, "#d4cce0", OUT);
      wall(c, -4.6, 0, 9.2, 13.5, "#e8e2f0", "stone", { noEave: true }); for (let i = 0; i < 4; i++) rect(c, -4.8 + i * 2.6, -14.4, 1.6, 1.2, "#d8d0e4", OUT);
      door(c, -3, 0, 6, 8.6, { col: "#3a2a3a", frame: "#b8b0c4" }); for (let i = 1; i < 6; i++) line(c, [[-3 + i, -6.6], [-3 + i, 0]], "#9a8a5a", .16); for (let i = 1; i < 5; i++) line(c, [[-3, -i * 1.7], [3, -i * 1.7]], "#9a8a5a", .16);
      for (const x of [-12.5, -9.2, 7.6, 10.9]) win(c, x, -8, 1.6, 3.2, { arch: true, frame: "#f8f2fc" });
      for (const x of [-7.2, 5]) { rect(c, x, -11.4, 2.2, 6.4, "#7a6ad0", OUT); poly(c, [[x, -5], [x + 1.1, -4], [x + 2.2, -5]]); fill(c, "#7a6ad0"); ell(c, x + 1.1, -8.4, .6, .6, "#ffd23a", null); }
      tower(c, -19, 0, 4.8, 18, "#ece6f4", "#6a5ab0", t, { flag: "#ffd23a", windows: 3 }); tower(c, 19, 0, 4.8, 18, "#ece6f4", "#6a5ab0", t, { flag: "#ff7f9f", windows: 3 });
      tower(c, -11.6, -.4, 3.2, 13.5, "#ece6f4", "#6a5ab0", t, { crenel: true, windows: 1 }); tower(c, 11.6, -.4, 3.2, 13.5, "#ece6f4", "#6a5ab0", t, { crenel: true, windows: 1 });
      poly(c, [[-3, 0], [3, 0], [4.4, 3], [-4.4, 3]]); fill(c, "#e8dcc4", null);
      for (const sx of [-1, 1]) { for (let i = 0; i < 4; i++) bush(c, sx * (7 + i * 3.4), 2.2, 1.2, "#4f9a4f", ["#ff9fb8", "#ffd23a", "#ffffff", "#b48aff"][i]); lamp(c, sx * 5, 2.6, 4); }
      for (let i = 0; i < 4; i++) { const a = (t * .25 + i * .25) % 1; ell(c, Math.sin(i * 7 + t * .5) * 12, -32 - a * 9, .3, .3, `rgba(255,230,150,${.8 * (1 - a)})`, null); }
    },
  ];

  // ================================================================ un commerce type (façade, vitrine, auvent, enseigne, terrasse)
  function shop(c, t, o) {
    const W = o.w || 14, H = o.h || 7, x = -W / 2;
    shadow(c, W + 4, 10);
    if (o.upper) { wall(c, x + .6, -H, W - 1.2, o.upper, o.upperCol || "#f4ecd8", o.upperTex || "plaster"); for (let k = 0; k < (o.upWins || 3); k++) win(c, x + 1.8 + k * (W - 3.6) / Math.max(1, (o.upWins || 3) - 1) - .9, -H - o.upper + 1.2, 1.8, 2.2, { shutters: o.shutters || "#6aa0d0", box: true }); }
    wall(c, x, 0, W, H, o.wall || "#f4e4c8", o.tex || "plaster", { base: .9, baseCol: "#b8b0a8" });
    const rh = o.upper ? o.upper : 0; roof(c, x - (o.upper ? -.6 : 0), -H - rh, W - (o.upper ? 1.2 : 0), o.roofH || 4.2, o.roof || "#d8704a", o.roofKind || "tiles");
    if (o.chimney) chimney(c, x + W - 3, -H - rh - 2.5, 1.4, 3.4, "#b8806a", t);
    // vitrine
    const vx = x + 1, vw = W * .55, vh = H * .52; rrect(c, vx - .3, -vh - 1.6, vw + .6, vh + .6, .3, "#f8f0e0", OUT); rrect(c, vx, -vh - 1.3, vw, vh, .2, lin(c, 0, -vh - 1.3, 0, -1.3, [[0, "#fff3c4"], [1, "#ffd27a"]]), null);
    if (o.display) o.display(c, vx, -1.3, vw, vh, t);
    poly(c, [[vx + vw * .1, -1.6], [vx + vw * .35, -vh - 1.2], [vx + vw * .45, -vh - 1.2], [vx + vw * .2, -1.6]]); c.fillStyle = "rgba(255,255,255,.3)"; c.fill();
    line(c, [[vx + vw / 2, -vh - 1.3], [vx + vw / 2, -1.3]], "#f8f0e0", .16);
    door(c, x + W - 3.6, 0, 2.4, 4.6, { col: o.doorCol || "#6a8ab0", arch: false });
    awning(c, x - .3, -H + 2.6 - (o.awnY || 0), W + .6, 1.8, o.aw || "#ff7f9f", o.aw2 || "#ffffff");
    if (o.name) banner(c, 0, -H - .2 - (o.upper || 0) + (o.upper ? o.upper - .4 : 0) - (o.upper ? 0 : 0), o.name, o.bannerBg || "#5a3a2a");
    if (o.icon) sign(c, x + W + .4, -H + 1.4, o.icon, o.signBg || "#f4e4c4");
    if (o.terrace) { parasolTable(c, x - 2.6, 2.4, o.aw || "#ff7f9f"); parasolTable(c, x + W + 2.8, 2.4, o.aw || "#ff7f9f"); }
    pot(c, x - .8, 0, "#c86a4a"); if (!o.terrace) bush(c, x + W + 1.4, 0, 1, "#5aa05a", "#ff9fb8");
    if (o.extra) o.extra(c, t, x, W, H);
  }

  // ================================================================ tous les bâtiments
  const D = {};
  // --- animaux, nourriture, production (refaits)
  D.potager = (c) => { shadow(c, 14, 8); rrect(c, -7, -7, 14, 7, .6, "#8a5a3a", OUT); for (let r = 0; r < 3; r++) { rrect(c, -6.4, -6.5 + r * 2.1, 12.8, 1.7, .6, "#6a4a2a", null); for (let k = 0; k < 7; k++) { const x = -5.6 + k * 1.85, y = -5.6 + r * 2.1; ell(c, x, y, .8, .55, "#5aa05a", null); ell(c, x - .3, y - .3, .45, .4, "#6ab86a", null); ell(c, x + .2, y - .5, .3, .28, ["#ff7a4a", "#ffd23a", "#ff6a8a"][r], null); } } for (const x of [-7.5, 7.5]) { rect(c, x - .2, -3.6, .4, 3.6, "#8a5a3a"); } line(c, [[-7.5, -3.2], [7.5, -3.2]], "#c8a070", .12); rrect(c, 5.4, -1.2, 2, 1.2, .3, "#5ac8c0", OUT); };
  D.enclos = (c) => { rrect(c, -9, -10, 18, 10, .5, "#b8e09a", null); for (let k = 0; k < 30; k++) ell(c, -8 + (k * 37 % 160) / 10, -9 + (k * 23 % 90) / 10, .15, .1, "#8ac070", null); rrect(c, 5, -3, 3, 1.6, .3, "#7ab4e8", OUT); rect(c, -7.5, -9, 3, .6, "#e8c870"); const post = (x, y) => { rect(c, x - .3, y - 1.8, .6, 1.8, "#8a5a3a", OUT); }; for (let i = 0; i <= 9; i++) { post(-9 + i * 2, -9.6); if (i !== 4 && i !== 5) post(-9 + i * 2, 0); } for (let k = 0; k <= 5; k++) { post(-9, -9.6 + k * 1.92); post(9, -9.6 + k * 1.92); } line(c, [[-9, -10.8], [9, -10.8]], "#c8986a", .3); line(c, [[-9, -1.2], [-1, -1.2]], "#c8986a", .3); line(c, [[1, -1.2], [9, -1.2]], "#c8986a", .3); line(c, [[-9, -.6], [-1, -.6]], "#c8986a", .3); line(c, [[1, -.6], [9, -.6]], "#c8986a", .3); };
  D.poulailler = (c, t) => { shadow(c, 9, 7); for (const x of [-3.4, 3.4]) rect(c, x - .3, -1.6, .6, 1.6, "#6b4a32", OUT); wall(c, -4, -1.6, 8, 4.2, "#e8b070", "planks"); roof(c, -4, -5.8, 8, 3.2, "#c8503a", "shingle", { over: .8 }); ell(c, 0, -3.6, .9, 1, "#3a2a1a", OUT); poly(c, [[-.8, -1.6], [.8, -1.6], [2.2, 0], [-2.2, 0]]); fill(c, "#a8784a"); for (let i = 0; i < 4; i++) line(c, [[-1.4 + i * .8, -.3], [-.9 + i * .7, -1.4]], "#7a5232", .1); ell(c, 4.6, -.6, .9, .7, "#fff", OUT); ell(c, 5.3, -1.2, .45, .45, "#fff", OUT); poly(c, [[5.7, -1.2], [6.2, -1.1], [5.7, -1]]); fill(c, "#ffa040", null); ell(c, 5.2, -1.7, .2, .25, "#e8304a", null); };
  D.etable = (c, t) => { shadow(c, 14, 9); wall(c, -7, 0, 14, 7, "#c8503a", "planks"); roof(c, -7, -7, 14, 4.6, "#6a5a5a", "shingle"); gableFront(c, -3, -7, 6, 4, "#c8503a", "#5a4a4a", "shingle"); rrect(c, -1, -9.6, 2, 1.4, .2, "#fff", OUT); rrect(c, -2.8, -5.2, 5.6, 5.2, .1, "#a8402a", OUT); c.strokeStyle = "#fff"; c.lineWidth = .3; c.strokeRect(-2.6, -5, 5.2, 5); line(c, [[-2.6, -5], [2.6, 0]], "#fff", .3); line(c, [[2.6, -5], [-2.6, 0]], "#fff", .3); win(c, -5.8, -5, 1.8, 1.6, { lit: false, frame: "#fff" }); win(c, 4, -5, 1.8, 1.6, { lit: false, frame: "#fff" }); ell(c, -8.4, -.8, 1.4, 1, "#e8c870", OUT); for (let k = 0; k < 6; k++) line(c, [[-9.4 + k * .4, -1.4], [-9.2 + k * .4, -.2]], "#c8a050", .1); };
  D.ruche = (c) => { shadow(c, 5, 4); rect(c, -1.8, -.8, 3.6, .8, "#8a5a3a", OUT); for (let i = 0; i < 4; i++) rrect(c, -2 + i * .2, -1.9 - i * 1.15, 4 - i * .4, 1.2, .5, i % 2 ? "#f0c050" : "#e0a830", OUT); ell(c, 0, -2.4, .4, .32, "#5a3a1a", null); for (let k = 0; k < 3; k++) { ell(c, 2.4 + k * .7, -4 + Math.sin(k * 2) * .8, .25, .2, "#ffd23a", "#3a2a1a"); } };
  D.moulin = (c, t) => { shadow(c, 10, 9); poly(c, [[-4.8, 0], [-2.8, -15], [2.8, -15], [4.8, 0]]); fill(c, lin(c, -4.8, 0, 4.8, 0, [[0, "#f8f2e8"], [.6, "#efe6da"], [1, "#c8bcae"]])); for (let k = 1; k < 9; k++) line(c, [[-4.8 + k * .2, -k * 1.65], [4.8 - k * .2, -k * 1.65]], "rgba(120,100,80,.12)", .1); door(c, -1.2, 0, 2.4, 3.6, { col: "#7a4a2a" }); win(c, -.8, -8, 1.6, 1.8, { arch: true }); poly(c, [[-3.6, -14.6], [0, -19.5], [3.6, -14.6]]); fill(c, lin(c, -3.6, 0, 3.6, 0, [[0, "#d8705a"], [1, "#a8503a"]])); c.save(); c.translate(0, -14); c.rotate(t * 1.1); for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); rect(c, -.3, 0, .6, 9, "#7a5232", OUT); rect(c, .3, 2, 2.4, 6.6, "rgba(248,244,236,.95)", OUT); for (let k = 1; k < 4; k++) line(c, [[.3, 2 + k * 1.65], [2.7, 2 + k * 1.65]], "#c8b8a0", .08); } c.restore(); ell(c, 0, -14, .8, .8, "#5a3a22", OUT); for (let i = 0; i < 2; i++) rrect(c, 4.6 + i * 1.6, -1.4, 1.4, 1.4, .3, "#e8dcc4", OUT); };
  D.four = (c, t) => { shadow(c, 8, 7); ell(c, 0, -3.2, 4.2, 3.6, lin(c, -4, 0, 4, 0, [[0, "#e8b080"], [1, "#b8784a"]]), OUT); rect(c, -4.2, -3.2, 8.4, 3.2, "#d8a070", null); line(c, [[-4.2, -3.2], [-4.2, 0]], OUT, LW); line(c, [[4.2, -3.2], [4.2, 0]], OUT, LW); for (let k = 0; k < 5; k++) line(c, [[-4, -1 - k * .9], [4, -1 - k * .9]], "rgba(120,60,30,.15)", .1); rrect(c, -1.7, -3.8, 3.4, 3.8, [1.7, 1.7, 0, 0], "#3a2014", OUT); ell(c, 0, -.9, 1.3, .6, "#ff8a3a", null); ell(c, 0, -1, .8, .35, "#ffd870", null); chimney(c, 1.8, -5.6, 1.2, 2, "#b8805a", t); for (let k = 0; k < 3; k++) rrect(c, 4.6 + k * .2, -1 - k * .7, 2.2, .6, .3, "#d8a050", OUT); };
  D.cuisine = (c, t) => { shadow(c, 9, 7); for (const x of [-4, 3.6]) rect(c, x, -5.4, .4, 5.4, "#6b4a32", OUT); roof(c, -4.6, -5.2, 9.2, 2.2, "#d8a060", "thatch", { over: .6 }); rrect(c, -3.4, -2.2, 6.8, 2.2, .2, "#a8784a", OUT); ell(c, -1.4, -2.6, 1.2, .6, "#4a4a52", OUT); ell(c, 1.6, -2.4, .9, .45, "#e8e0d0", OUT); for (let k = 0; k < 3; k++) { const a = (t * .5 + k / 3) % 1; ell(c, -1.4 + Math.sin(a * 5) * .5, -3.2 - a * 3.6, .5 + a, .4 + a * .6, `rgba(255,255,255,${.5 * (1 - a)})`, null); } for (let k = 0; k < 4; k++) line(c, [[-3 + k * 1.6, -4.6], [-3 + k * 1.6, -3.6]], "#8a8a92", .1); };
  D.forge = (c, t) => { shadow(c, 11, 9); for (const x of [-5, 4.6]) rect(c, x, -7.4, .6, 7.4, "#5a3a22", OUT); roof(c, -5.6, -7.2, 11.2, 3, "#6a5a5a", "slate", { over: .6 }); wall(c, -4.4, 0, 4, 3.8, "#8a8078", "stone", { noEave: true }); ell(c, -2.4, -2, 1.2, .8, `rgb(255,${130 + Math.sin(t * 8) * 40},40)`, null); const g = c.createRadialGradient(-2.4, -2, 0, -2.4, -2, 3.5); g.addColorStop(0, "rgba(255,140,60,.35)"); g.addColorStop(1, "rgba(255,140,60,0)"); c.fillStyle = g; c.fillRect(-6, -5.5, 7.2, 7); rrect(c, 1, -2.4, 3.4, 1, .2, "#3a3a44", OUT); rect(c, 2, -1.4, 1.3, 1.4, "#3a3a44", OUT); line(c, [[3.6, -3.6], [4.8, -2.4]], "#8a5a3a", .25); rect(c, 3.2, -4, 1.2, .6, "#6a6a72", OUT); rrect(c, 5.4, -1.6, 1.6, 1.6, .3, "#5a7a9a", OUT); };
  D.atelier = (c) => { shadow(c, 11, 8); wall(c, -5.5, 0, 11, 5.4, "#e0c8a0", "planks"); roof(c, -5.5, -5.4, 11, 3.6, "#8aa060", "shingle"); rrect(c, -4.2, -4.2, 8.4, 2.4, .2, "#3a2a1a", OUT); for (let k = 0; k < 5; k++) { rect(c, -3.8 + k * 1.6, -4, .2, 1.4, "#a8784a"); ell(c, -3.7 + k * 1.6, -3.9, .35, .35, ["#c0c0c8", "#e8c060", "#8a5a3a", "#c0c0c8", "#5a8ac0"][k], null); } rrect(c, -4.6, -1.7, 9.2, .8, .2, "#a8784a", OUT); rect(c, -4, -.9, .4, .9, "#6a4a2a"); rect(c, 3.6, -.9, .4, .9, "#6a4a2a"); rrect(c, -2, -2.4, 2.4, .7, .1, "#d8b07a", OUT); };
  D.entrepot = (c) => { shadow(c, 13, 9); wall(c, -6.5, 0, 13, 6.6, "#c8a070", "planks"); roof(c, -6.5, -6.6, 13, 3.6, "#a85a3a", "shingle"); rrect(c, -2.6, -5, 5.2, 5, .1, "#8a5a3a", OUT); line(c, [[-2.6, -5], [2.6, 0]], "#5a3a22", .3); line(c, [[2.6, -5], [-2.6, 0]], "#5a3a22", .3); for (let k = 0; k < 3; k++) rrect(c, 3.6 + (k % 2) * 1.2, -1.6 - Math.floor(k / 2) * 1.6, 1.6, 1.6, .15, "#d8b070", OUT); ell(c, -4.4, -.9, .9, .9, "#a8703a", OUT); banner(c, 0, -7.4, "ENTREPÔT"); };
  D.serre = (c) => { shadow(c, 11, 8); rrect(c, -5.5, -.8, 11, .8, .2, "#d8d0c4", OUT); c.save(); poly(c, [[-5.5, -.8], [-5.5, -5.4], [-3, -8.6], [3, -8.6], [5.5, -5.4], [5.5, -.8]]); c.fillStyle = "rgba(200,240,255,.55)"; c.fill(); c.clip(); for (let i = 0; i < 6; i++) { bush(c, -4.2 + i * 1.7, -1, .9, "#5aa05a", ["#ff9fb8", "#ffd23a", "#b48aff"][i % 3]); } c.fillStyle = "rgba(255,255,255,.25)"; c.fillRect(-5.5, -8.6, 3, 8); c.restore(); poly(c, [[-5.5, -.8], [-5.5, -5.4], [-3, -8.6], [3, -8.6], [5.5, -5.4], [5.5, -.8]]); c.strokeStyle = "#f8fcf8"; c.lineWidth = .3; c.stroke(); for (let i = 1; i < 5; i++) line(c, [[-5.5 + i * 2.2, -.8], [-5.5 + i * 2.2, -5.4 - (i === 2 || i === 3 ? 3.2 : 1.8)]], "#f8fcf8", .2); line(c, [[-5.5, -5.4], [5.5, -5.4]], "#f8fcf8", .2); };
  D.puits = (c) => { shadow(c, 6, 5); ell(c, 0, -1.7, 2.8, 1.1, "#8a8278", OUT); wall(c, -2.8, -.2, 5.6, 1.6, "#b8b0a8", "stone", { noEave: true }); ell(c, 0, -1.8, 2.1, .75, "#2a4a6a", null); for (const x of [-2.4, 2]) rect(c, x, -6.2, .4, 4.6, "#6b4a32", OUT); roof(c, -2.8, -6, 5.6, 2, "#c8503a", "shingle", { over: .5, inset: .6 }); line(c, [[0, -5.6], [0, -3]], "#a8784a", .1); rrect(c, -.5, -3.2, 1, .9, .15, "#8a5a3a", OUT); rect(c, -2, -5.6, 4, .25, "#5a3a22"); };
  D.feu = (c, t) => { ell(c, 0, -.8, 3, 1.2, "rgba(60,40,30,.25)", null); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; ell(c, Math.cos(a) * 2, -1 + Math.sin(a) * .8, .6, .45, sh("#9a948c", .9 + (i % 3) * .08), OUT); } line(c, [[-1.4, -.8], [1.4, -1.6]], "#6b4a32", .45); line(c, [[-1.4, -1.6], [1.4, -.8]], "#6b4a32", .45); const f = 1 + Math.sin(t * 9) * .1; poly(c, [[-1.2, -1.2], [-.6, -3.4 * f], [0, -4.6 * f], [.6, -3.2 * f], [1.2, -1.2]]); fill(c, "#ff8a3a", null); poly(c, [[-.6, -1.2], [0, -3.2 * f], [.6, -1.2]]); fill(c, "#ffe07a", null); const g = c.createRadialGradient(0, -2, 0, 0, -2, 5); g.addColorStop(0, "rgba(255,180,80,.3)"); g.addColorStop(1, "rgba(255,180,80,0)"); c.fillStyle = g; c.fillRect(-5, -7, 10, 10); for (const x of [-3.6, 3.6]) rrect(c, x - 1, -.9, 2, .6, .25, "#8a5a3a", OUT); };
  D.ponton = (c) => { for (let i = 0; i < 7; i++) rrect(c, -2.2, -i * 1.5 - 1.4, 4.4, 1.3, .15, i % 2 ? "#c8986a" : "#b8885a", OUT); for (const x of [-2.4, 2.1]) for (let i = 0; i < 3; i++) rrect(c, x - .1, -i * 3.6 - 2, .5, 2.4, .2, "#6b4a32", OUT); rrect(c, -1.2, -9.4, 1.6, 1, .3, "#5a8ac0", OUT); line(c, [[1.4, -9.8], [3.6, -12]], "#8a5a3a", .15); line(c, [[3.6, -12], [3.8, -8]], "rgba(255,255,255,.6)", .05); };
  D.tourGuet = (c, t) => { shadow(c, 7, 6); for (const x of [-2.8, 2.4]) rect(c, x, -13, .5, 13, "#7a5232", OUT); for (let i = 0; i < 4; i++) line(c, [[-2.6, -i * 3.2], [2.6, -(i + 1) * 3.2]], "#8a6242", .3); for (let i = 0; i < 12; i++) rect(c, -.8, -1 - i * 1.05, 1.6, .2, "#a8784a"); rrect(c, -3.6, -14.4, 7.2, 1.3, .2, "#a8784a", OUT); for (let i = 0; i < 7; i++) rect(c, -3.4 + i * 1.1, -16.2, .25, 1.8, "#8a5a3a"); rect(c, -3.6, -16.4, 7.2, .35, "#8a5a3a"); roof(c, -3.6, -17.6, 7.2, 2.6, "#8aa060", "thatch", { over: .6, inset: 1.2 }); flag(c, 0, -20.6, 3, "#ff7f9f", t); };
  D.autel = (c, t) => { shadow(c, 7, 5); rrect(c, -3.4, -.6, 6.8, .6, .2, "#c8c0d6", OUT); rrect(c, -2.8, -2.6, 5.6, 2, .3, "#e0d8ec", OUT); for (let k = 0; k < 3; k++) line(c, [[-2 + k * 2, -2.3], [-1.4 + k * 2, -1]], "#b8a8d8", .1); const cols = ["#ff7a2a", "#5adf6a", "#3aa0ff", "#d8f4ff", "#ffe45a", "#b06aff"]; cols.forEach((col, i) => { const a = t * 1.1 + i / 6 * TAU; ell(c, Math.cos(a) * 2.6, -5.4 + Math.sin(a) * 1, .5, .5, col, "rgba(255,255,255,.6)"); }); const g = c.createRadialGradient(0, -5.4, 0, 0, -5.4, 4); g.addColorStop(0, "rgba(255,240,190,.55)"); g.addColorStop(1, "rgba(255,240,190,0)"); c.fillStyle = g; c.fillRect(-4, -9.4, 8, 8); ell(c, 0, -5.4, 1, 1, "#fff8dc", null); };
  D.pont = (c) => { c.fillStyle = "#6ab0d8"; c.fillRect(-7, -4.6, 14, 5); for (let i = 0; i < 9; i++) rrect(c, -6.6 + i * 1.47, -3.4, 1.37, 3.2, .1, i % 2 ? "#c8986a" : "#b8885a", OUT); for (const y of [-4.2, -.2]) { rrect(c, -6.8, y - .2, 13.6, .5, .2, "#8a5a3a", OUT); for (let i = 0; i <= 5; i++) rect(c, -6.8 + i * 2.7, y - 1.8, .4, 1.8, "#7a4a2a", OUT); line(c, [[-6.8, y - 1.6], [6.8, y - 1.6]], "#7a4a2a", .3); } };
  // --- déco extérieure de base
  D.cloture = (c) => { for (let i = 0; i < 5; i++) { rect(c, -4.6 + i * 2.2, -2.8, .7, 2.8, "#e8d8c0", OUT); poly(c, [[-4.6 + i * 2.2, -2.8], [-4.25 + i * 2.2, -3.4], [-3.9 + i * 2.2, -2.8]]); fill(c, "#e8d8c0"); } rect(c, -4.8, -2.2, 9.8, .4, "#d8c8b0", OUT); rect(c, -4.8, -1, 9.8, .4, "#d8c8b0", OUT); };
  D.dalles = (c) => { for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) rrect(c, -3 + k * 2.05 - r * .4, -2.8 + r * 1.45, 1.9, 1.3, .35, ["#d8d0c4", "#cfc6b8", "#e0d8cc"][(r + k) % 3], "rgba(120,100,90,.35)"); };
  D.lanterne = (c) => lamp(c, 0, 0, 5);
  D.fontaine = (c, t) => { shadow(c, 9, 7); ell(c, 0, -1.6, 4.4, 1.7, "#c8c0b4", OUT); wall(c, -4.4, -.1, 8.8, 1.5, "#bcb4a8", "stone", { noEave: true }); ell(c, 0, -1.7, 3.6, 1.3, lin(c, 0, -3, 0, -.4, [[0, "#9fd8f4"], [1, "#5aa0d0"]]), null); rect(c, -.5, -5.4, 1, 3.8, "#d8d0c4", OUT); ell(c, 0, -5.4, 1.8, .6, "#d8d0c4", OUT); ell(c, 0, -6.6, .7, .7, "#e0d8cc", OUT); for (let i = 0; i < 10; i++) { const a = (t * 1.4 + i / 10) % 1, s = i % 2 ? 1 : -1; ell(c, s * a * 2.6, -6.6 + a * a * 5, .22, .28, "#cfeeff", null); } };
  D.arche = (c) => { for (const x of [-3.2, 2.6]) rect(c, x, -6.4, .6, 6.4, "#8a5a3a", OUT); c.beginPath(); c.arc(0, -6.4, 2.9, Math.PI, 0); c.strokeStyle = "#8a5a3a"; c.lineWidth = .6; c.stroke(); for (let i = 0; i < 16; i++) { const a = Math.PI + i / 15 * Math.PI; ell(c, Math.cos(a) * 3, -6.4 + Math.sin(a) * 3, .65, .6, i % 2 ? "#5aa05a" : "#6ab86a", null); ell(c, Math.cos(a) * 3, -6.6 + Math.sin(a) * 3, .3, .28, ["#ff9fb8", "#fff", "#ffb0c8"][i % 3], null); } for (const x of [-2.9, 2.9]) for (let k = 0; k < 4; k++) ell(c, x + (k % 2 ? .3 : -.3), -1 - k * 1.3, .45, .4, "#5aa05a", null); };
  D.banc = (c) => { ell(c, .3, 0, 3.6, .7, "rgba(40,50,30,.2)", null); for (const x of [-2.8, 2.4]) rect(c, x, -1.2, .4, 1.2, "#3a3a42", OUT); rrect(c, -3.2, -1.8, 6.4, .7, .2, "#b8885a", OUT); for (let k = 0; k < 2; k++) rrect(c, -3.2, -3.6 + k * .9, 6.4, .6, .2, "#a8784a", OUT); rect(c, -2.9, -3.8, .35, 2.2, "#3a3a42"); rect(c, 2.55, -3.8, .35, 2.2, "#3a3a42"); };
  D.statue = (c, t) => { shadow(c, 6, 5); wall(c, -2.6, 0, 5.2, 2.2, "#cfc6b8", "stone", { noEave: true }); rrect(c, -3, -2.8, 6, .7, .2, "#bcb4a8", OUT); ell(c, 0, -5.4, 2.1, 2.7, lin(c, -2, 0, 2, 0, [[0, "#ece6f4"], [1, "#b8b0c8"]]), OUT); ell(c, 0, -8.8, 1.5, 1.4, "#e8e2f0", OUT); poly(c, [[-1.3, -9.6], [-.7, -11.2], [0, -9.9], [.7, -11.2], [1.3, -9.6]]); fill(c, "#e0d8ec"); ell(c, -.5, -9, .2, .2, "#6a5a8a", null); ell(c, .5, -9, .2, .2, "#6a5a8a", null); ell(c, 0, -5, .7, .7, "#ffd23a", OUT); };
  D.totem = (c) => { shadow(c, 4, 3); ["#c86a4a", "#5aa0a0", "#d8a040", "#8a6ad0"].forEach((col, i) => { wall(c, -1.5, -i * 2.3, 3, 2.3, col, "plaster", { noEave: true }); ell(c, -.6, -(i + .55) * 2.3, .35, .4, "#fff", OUT); ell(c, .6, -(i + .55) * 2.3, .35, .4, "#fff", OUT); ell(c, -.6, -(i + .5) * 2.3, .15, .2, "#2a2a2a", null); ell(c, .6, -(i + .5) * 2.3, .15, .2, "#2a2a2a", null); line(c, [[-.6, -(i + .25) * 2.3], [.6, -(i + .25) * 2.3]], "#2a2a2a", .15); }); poly(c, [[-2.8, -9.2], [0, -10.8], [2.8, -9.2], [0, -9.6]]); fill(c, "#ffd23a"); };
  D.fleurs = (c) => { ell(c, 0, -2, 4.4, 2.2, "#5aa05a", OUT); seed = 5; for (let i = 0; i < 22; i++) { const a = i * 2.4, r = (i % 5) * .8; ell(c, Math.cos(a) * r * 1.5, -2 + Math.sin(a) * r * .6, .55, .5, ["#ff9fb8", "#ffd23a", "#fff", "#b48aff", "#ff7f5f"][i % 5], "rgba(0,0,0,.15)"); ell(c, Math.cos(a) * r * 1.5, -2 + Math.sin(a) * r * .6, .18, .18, "#ffe27a", null); } };

  // --- les 22 bâtiments du quotidien (nouveaux)
  const goods = (cols) => (c, x, y, w, h) => { for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) ell(c, x + .8 + k * (w - 1.6) / 4, y - .6 - r * h * .45, .6, .5, cols[(k + r) % cols.length], "rgba(0,0,0,.15)"); rect(c, x, y - h * .45 + .3, w, .2, "#a8784a"); };
  D.piscine = (c, t) => { rrect(c, -10, -12, 20, 12, 1.2, "#e8e0d4", OUT); rrect(c, -8.6, -10.8, 17.2, 9.4, .8, lin(c, 0, -10.8, 0, -1.4, [[0, "#7ad8f0"], [1, "#3aa8d8"]]), "#b8d8e8"); for (let k = 0; k < 6; k++) line(c, [[-8 + k * 3, -9 + Math.sin(t * 2 + k) * .3], [-6.5 + k * 3, -8.6 + Math.sin(t * 2 + k) * .3]], "rgba(255,255,255,.7)", .2); for (const y of [-4, -7]) line(c, [[-8.6, y], [8.6, y]], "#ff7f9f", .15); rect(c, 7.4, -11.6, .3, 2.4, "#c0c0c8"); rect(c, 8.6, -11.6, .3, 2.4, "#c0c0c8"); for (let k = 0; k < 3; k++) rect(c, 7.4, -11.2 + k * .7, 1.5, .15, "#c0c0c8"); ell(c, -5, -6, 1.2, .9, "#ffd23a", OUT); ell(c, -5, -6, .5, .35, "#7ad8f0", null); for (const x of [-13, 12]) { rrect(c, x - 1, -5, 2.2, 4.6, .3, "#ffffff", OUT); for (let k = 0; k < 4; k++) rect(c, x - 1, -4.6 + k, 2.2, .45, "#7ab4e8"); } parasolTable(c, -13, -6, "#ffd23a", "#ffffff"); };
  D.jeux = (c, t) => { shadow(c, 16, 10); rrect(c, -8, -8, 16, 8, 1, "#f0dca8", null); for (const x of [-7, -3]) { line(c, [[x, 0], [x + .8, -6]], "#e8605a", .35); line(c, [[x + 1.6, 0], [x + .8, -6]], "#e8605a", .35); } line(c, [[-6.4, -6], [-1.6, -6]], "#e8605a", .4); const sw = Math.sin(t * 2) * .6; line(c, [[-5.2, -6], [-5.2 + sw, -2.2]], "#8a8a92", .08); line(c, [[-4.2, -6], [-4.2 + sw, -2.2]], "#8a8a92", .08); rrect(c, -5.5 + sw, -2.3, 1.6, .4, .1, "#ffd23a", OUT); rect(c, 1.4, -6, 2, 6, "#7ab4e8", OUT); for (let k = 0; k < 5; k++) rect(c, 1.4, -1 - k * 1.1, 2, .2, "#ffffff"); rrect(c, 1, -6.6, 2.8, .8, .2, "#5aa0d8", OUT); poly(c, [[3.4, -6], [7.6, -.4], [6.6, 0], [3.4, -4.6]]); fill(c, "#ffd23a"); rrect(c, -2, -1.6, 3, 1.6, .6, "#e8c87a", OUT); for (let k = 0; k < 6; k++) ell(c, -1.5 + k * .4, -1.4, .2, .15, "#d8b060", null); };
  D.cafe = (c, t) => shop(c, t, { w: 13, h: 7, wall: "#f4e4cc", roof: "#5a8a7a", aw: "#3a8a6a", aw2: "#f4ecdc", name: "CAFÉ", icon: "☕", terrace: true, display: goods(["#8a5a3a", "#e8c080", "#ffb0c8"]) });
  D.boulangerie = (c, t) => shop(c, t, { w: 13, h: 7, wall: "#f8ecd4", roof: "#c8704a", aw: "#e8a040", aw2: "#fff4dc", name: "BOULANGERIE", icon: "🥖", chimney: true, display: goods(["#e0a850", "#c88a3a", "#f0c070"]) });
  D.glacier = (c, t) => shop(c, t, { w: 11, h: 6.4, wall: "#fff0f4", roof: "#ff9fb8", aw: "#ff7f9f", aw2: "#ffffff", name: "GLACIER", icon: "🍦", terrace: true, display: goods(["#ffb0c8", "#fff4d0", "#a8e0c0", "#8a5a3a"]) });
  D.creperie = (c, t) => shop(c, t, { w: 13, h: 7, wall: "#f4ecdc", tex: "timber", roof: "#5a6a7a", roofKind: "slate", aw: "#3a5a9a", aw2: "#ffffff", name: "CRÊPERIE", icon: "🥞", terrace: true, display: goods(["#e8c070", "#c8803a"]) });
  D.pizzeria = (c, t) => shop(c, t, { w: 14, h: 7, wall: "#f0c8a0", roof: "#c8503a", aw: "#3aa050", aw2: "#ffffff", name: "PIZZERIA", icon: "🍕", chimney: true, terrace: true, display: (c2, x, y, w, h) => { ell(c2, x + w / 2, y - h / 2, w * .35, h * .35, "#3a2014", null); ell(c2, x + w / 2, y - h * .35, w * .2, h * .12, "#ff8a3a", null); } });
  D.grill = (c, t) => shop(c, t, { w: 15, h: 6.6, wall: "#d8b088", tex: "planks", roof: "#9bc46a", roofKind: "palm", aw: "#2a7ab0", aw2: "#f4ecdc", name: "GRILL DU PORT", icon: "🐟", terrace: true, chimney: true, display: goods(["#7ab4e8", "#ff8a6a", "#e8c070"]) });
  D.salonThe = (c, t) => shop(c, t, { w: 12, h: 6.6, wall: "#f4f0e8", roof: "#7a6ad0", roofKind: "slate", aw: "#b48aff", aw2: "#ffffff", name: "SALON DE THÉ", icon: "🫖", upper: 4, upperCol: "#ece4f4", upWins: 3, shutters: "#b48aff", display: goods(["#ffb0c8", "#fff", "#c8a0e8"]) });
  D.marche = (c, t) => { shadow(c, 18, 12); for (const x of [-8.4, -2.8, 2.8, 8.4]) rect(c, x - .35, -7.4, .7, 7.4, "#7a5232", OUT); roof(c, -9.4, -7.2, 18.8, 4.6, "#d8704a", "tiles", { over: 1 }); banner(c, 0, -12.6, "MARCHÉ COUVERT"); [["#e8605a", "#ffd23a", "#8fd18a"], ["#7ab4e8", "#e0e8f0", "#ff8a6a"], ["#ff9fb8", "#fff", "#b48aff"]].forEach((cols, i) => { const x = -8 + i * 5.6; rrect(c, x, -2.6, 4.6, 2.6, .2, "#a8784a", OUT); for (let k = 0; k < 6; k++) ell(c, x + .6 + (k % 3) * 1.6, -2.8 - Math.floor(k / 3) * .7, .55, .45, cols[k % 3], "rgba(0,0,0,.15)"); awning(c, x - .2, -5.2, 5, 1, ["#e8605a", "#5a8ad0", "#ff7f9f"][i]); }); };
  D.fleuriste = (c, t) => shop(c, t, { w: 11, h: 6.6, wall: "#eef6e8", roof: "#6aa070", aw: "#ff9fb8", aw2: "#ffffff", name: "FLEURISTE", icon: "💐", display: goods(["#ff7f9f", "#ffd23a", "#fff", "#b48aff"]), extra: (c2, t2, x, W) => { for (let k = 0; k < 3; k++) bush(c2, x + W + 1.4 + k * .6, -k * .2, .8, "#5aa05a", ["#ff7f9f", "#ffd23a", "#b48aff"][k]); } });
  D.epicerie = (c, t) => shop(c, t, { w: 13, h: 7, wall: "#f4e4c8", tex: "planks", roof: "#a85a3a", roofKind: "shingle", aw: "#e8c040", aw2: "#ffffff", name: "ÉPICERIE", icon: "🧺", display: goods(["#e8605a", "#ffd23a", "#8fd18a", "#e8c080"]), extra: (c2, t2, x, W) => { for (let k = 0; k < 3; k++) rrect(c2, x + W + .6, -1.2 - k * 1.1, 1.6, 1, .2, ["#e8605a", "#8fd18a", "#ffd23a"][k], OUT); } });
  D.bibliotheque = (c, t) => { shadow(c, 18, 11); wall(c, -9, 0, 18, 9, "#e8e0d4", "stone", { base: 1, baseCol: "#b8b0a4" }); roof(c, -9, -9, 18, 4.4, "#5a6a8a", "slate"); gableFront(c, -4, -9, 8, 4.6, "#efe8de", "#4a5a7a", "slate", "plaster"); ell(c, 0, -11.2, 1.1, 1.1, "#fff3c4", OUT); for (const x of [-7.6, -5, 3, 5.6]) win(c, x, -6.8, 2, 4, { arch: true, frame: "#f8f4ec" }); for (const x of [-2.6, 2.2]) { rect(c, x, -8.6, .8, 8.6, "#f4f0e8", OUT); } door(c, -1.4, 0, 2.8, 5, { steps: 2, double: true, col: "#6a3a2a" }); banner(c, 0, -8.4, "BIBLIOTHÈQUE", "#4a5a7a"); pot(c, -9.8, 0); pot(c, 9.8, 0); };
  D.ecole = (c, t) => { shadow(c, 18, 11); wall(c, -9, 0, 18, 7.5, "#f8e8c8", "brick"); roof(c, -9, -7.5, 18, 4.4, "#c8503a", "tiles"); rect(c, -1.4, -14.4, 2.8, 3.2, "#f8e8c8", OUT); poly(c, [[-2, -14.4], [0, -16.6], [2, -14.4]]); fill(c, "#c8503a"); ell(c, 0, -12.7, .9, .9, "#ffd23a", OUT); for (const x of [-7.6, -4.8, 3, 5.8]) win(c, x, -5.6, 2.2, 2.8, { frame: "#ffffff", box: true }); door(c, -1.3, 0, 2.6, 4.6, { steps: 1, col: "#5a8ac0" }); banner(c, 0, -8.4, "ÉCOLE DE KALUA", "#c8503a"); rrect(c, 10, -3, .4, 3, .1, "#8a8a92", null); rrect(c, 8.6, -5.4, 3.2, 2.4, .3, "#e8605a", OUT); };
  D.soins = (c, t) => shop(c, t, { w: 13, h: 7, wall: "#f4fbf6", roof: "#5aa080", aw: "#5aa080", aw2: "#ffffff", name: "SOINS", icon: "🌿", display: (c2, x, y, w, h) => { rect(c2, x + w / 2 - .4, y - h * .8, .8, h * .6, "#e8605a"); rect(c2, x + w / 2 - 1.4, y - h * .55, 2.8, .8, "#e8605a"); }, extra: (c2) => { bush(c2, -8.4, 0, 1, "#6ab070", "#ffffff"); } });
  D.poste = (c, t) => shop(c, t, { w: 12, h: 7, wall: "#fff8e0", roof: "#3a6ab0", roofKind: "slate", aw: "#ffd23a", aw2: "#3a6ab0", name: "LA POSTE", icon: "✉️", display: goods(["#d8b070", "#fff", "#e8c890"]), extra: (c2, t2, x, W) => { rrect(c2, x + W + .8, -3.4, 1.6, 2.2, .5, "#ffd23a", OUT); rect(c2, x + W + 1.4, -1.2, .4, 1.2, "#3a3a42"); rect(c2, x + W + 1, -2.8, 1.2, .25, "#3a3a42"); } });
  D.kiosque = (c, t) => { shadow(c, 12, 9); ell(c, 0, -1.2, 6, 2, "#e0d8cc", OUT); rect(c, -6, -1.2, 12, 1.2, "#cfc6b8", OUT); for (let i = 0; i < 6; i++) { const x = -5.4 + i * 2.16; rect(c, x - .2, -7.4, .4, 6.2, "#ffffff", OUT); } for (let i = 0; i < 12; i++) line(c, [[-5.4 + i * .98, -2.6], [-5.4 + i * .98, -1.4]], "#ffffff", .12); line(c, [[-5.6, -2.6], [5.6, -2.6]], "#ffffff", .2); c.beginPath(); c.moveTo(-6.6, -7.2); c.quadraticCurveTo(0, -13.4, 6.6, -7.2); c.closePath(); fill(c, lin(c, 0, -12, 0, -7, [[0, "#6ab0a0"], [1, "#3a8a7a"]])); for (let i = 0; i < 13; i++) { c.beginPath(); c.arc(-6 + i, -7.1, .5, 0, Math.PI); fill(c, "#ffffff", null); } ell(c, 0, -10.6, .5, .5, "#ffd23a", OUT); flag(c, 0, -10.8, 2.4, "#ff7f9f", t); for (let k = 0; k < 2; k++) { const a = (t * .4 + k * .5) % 1; c.font = "1.4px serif"; c.fillStyle = `rgba(90,60,120,${1 - a})`; c.fillText("♪", -1 + k * 2 + Math.sin(a * 4), -4 - a * 4); } };
  D.bains = (c, t) => { shadow(c, 16, 11); wall(c, -8, -4, 16, 6, "#7a5a4a", "planks"); roof(c, -8.6, -10, 17.2, 3.6, "#3a3a4a", "slate", { over: 1.6 }); for (const x of [-6, 4]) win(c, x, -8.4, 2, 2.4, { frame: "#3a2a2a" }); door(c, -1.4, -4, 2.8, 4, { col: "#c83a3a", arch: false }); for (const x of [-3, 2.2]) { rrect(c, x, -9.4, .8, 3.2, .3, "#e8604a", OUT); ell(c, x + .4, -9.4, .5, .3, "#e8604a", null); } rrect(c, -9, -3.8, 18, 3.8, 1.6, "#9a948c", OUT); rrect(c, -8, -3.2, 16, 2.8, 1.2, lin(c, 0, -3, 0, -.4, [[0, "#a8e0e8"], [1, "#6ab8d0"]]), null); for (let k = 0; k < 5; k++) { const a = (t * .3 + k / 5) % 1; ell(c, -6 + k * 3, -2.4 - a * 5, .6 + a, .45 + a * .6, `rgba(255,255,255,${.45 * (1 - a)})`, null); } for (let k = 0; k < 6; k++) ell(c, -8.6 + k * 3.4, -.2, .7, .5, "#7a746c", OUT); };
  D.cinema = (c, t) => { shadow(c, 18, 12); for (const x of [-8, 8]) rect(c, x - .3, -12, .6, 12, "#3a3a42", OUT); rrect(c, -7.6, -12, 15.2, 7.4, .3, "#f8f8fc", OUT); c.save(); c.beginPath(); c.rect(-7.2, -11.6, 14.4, 6.6); c.clip(); c.fillStyle = lin(c, -7, -11, 7, -5, [[0, "#ffb080"], [1, "#7a6ad0"]]); c.fillRect(-7.2, -11.6, 14.4, 6.6); ell(c, 2, -7, 2, 2, "#ffe07a", null); poly(c, [[-7.2, -5], [-3, -8.4], [0, -5]]); fill(c, "#5a4a7a", null); c.restore(); for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) { rrect(c, -6.6 + k * 2.8, -2.6 + r * 1.8, 2.2, 1, .3, ["#e8605a", "#5a8ad0", "#ffd23a"][(k + r) % 3], OUT); } rrect(c, 8.6, -3.4, 3, 3.4, .3, "#e8605a", OUT); c.font = "1.6px 'Segoe UI Emoji'"; c.fillText("🍿", 9.3, -1.2); banner(c, 0, -13.2, "CINÉMA SOUS LES ÉTOILES", "#3a3a5a"); };
  D.terrain = (c, t) => { rrect(c, -11, -12, 22, 12, .6, "#6ab86a", OUT); c.strokeStyle = "#ffffff"; c.lineWidth = .25; c.strokeRect(-10, -11, 20, 10); line(c, [[0, -11], [0, -1]], "#ffffff", .25); c.beginPath(); c.ellipse(0, -6, 2, 1.6, 0, 0, TAU); c.stroke(); for (const x of [-10, 10]) { c.strokeRect(x > 0 ? x - 2.4 : x, -8.4, 2.4, 4.8); rect(c, x - .2, -8, .4, 4, "rgba(255,255,255,.4)"); } ell(c, 2 + Math.sin(t) * 2, -5.6, .5, .5, "#ffffff", OUT); };
  D.couture = (c, t) => shop(c, t, { w: 12, h: 7, wall: "#fbeef0", tex: "timber", roof: "#b86a8a", aw: "#ffb0c8", aw2: "#ffffff", name: "COUTURE", icon: "🧵", display: (c2, x, y, w, h) => { for (let k = 0; k < 2; k++) { const mx = x + w * (.3 + k * .4); ell(c2, mx, y - h * .82, .5, .5, "#e8d8c0", null); poly(c2, [[mx - 1, y - h * .7], [mx + 1, y - h * .7], [mx + 1.3, y - h * .2], [mx - 1.3, y - h * .2]]); fill(c2, k ? "#7ab4e8" : "#ff9fb8", null); line(c2, [[mx, y - h * .2], [mx, y]], "#6a4a3a", .15); } } });
  D.auberge = (c, t) => { shadow(c, 20, 13); chimney(c, -7, -15.4, 1.8, 3.6, "#a87a6a", t); wall(c, -10, 0, 20, 6.4, "#e8dccc", "stone", { base: 1 }); wall(c, -9.4, -6.4, 18.8, 5.4, "#f4e8d4", "timber"); roof(c, -9.4, -11.8, 18.8, 5, "#8a5a3a", "shingle"); for (const x of [-8.2, -5, 3.2, 6.4]) { win(c, x, -4.8, 1.9, 2.6, { shutters: "#3a7a5a", box: true }); win(c, x, -10.2, 1.9, 2.4, { shutters: "#3a7a5a", box: true }); } door(c, -1.6, 0, 3.2, 4.8, { double: true, steps: 1, col: "#6a3a22", lamp: true }); sign(c, 3, -6.4, "🍺", "#f4e4c4"); banner(c, 0, -12.6, "AUBERGE DE LA MOUETTE"); parasolTable(c, -12.8, 2.4, "#3a7a5a"); bush(c, 11, 0, 1.2, "#4f9a4f", "#ffd23a"); };
  // --- bâtiments propres au village de base
  D.mairie = (c, t) => { shadow(c, 30, 18); rrect(c, -15.6, -1.2, 31.2, 1.2, .3, "#d8d0c4", OUT);
    wall(c, -14, -1.2, 9, 10, "#f4ecdc", "stone", { base: 1, baseCol: "#b8b0a4" }); wall(c, 5, -1.2, 9, 10, "#f4ecdc", "stone", { base: 1, baseCol: "#b8b0a4" }); roof(c, -14, -11.2, 9, 4, "#4a5a7a", "slate"); roof(c, 5, -11.2, 9, 4, "#4a5a7a", "slate");
    wall(c, -5.4, -1.2, 10.8, 13, "#f8f2e6", "stone", { base: 1, baseCol: "#b8b0a4" }); poly(c, [[-6.4, -14.2], [0, -18.8], [6.4, -14.2]]); fill(c, lin(c, 0, -18.8, 0, -14, [[0, "#f8f2e6"], [1, "#e8dccc"]])); ell(c, 0, -15.8, .9, .9, "#e8c060", OUT);
    wall(c, -2.6, -18.6, 5.2, 6, "#f8f2e6", "stone", { noEave: true }); ell(c, 0, -21.6, 2, 2, "#ffffff", OUT); ell(c, 0, -21.6, 1.7, 1.7, "#fff8e8", null); line(c, [[0, -21.6], [0, -22.9]], "#3a2a2a", .18); line(c, [[0, -21.6], [.9, -21.6]], "#3a2a2a", .14); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ell(c, Math.cos(a) * 1.45, -21.6 + Math.sin(a) * 1.45, .08, .08, "#3a2a2a", null); }
    poly(c, [[-3.2, -24.6], [0, -29], [3.2, -24.6]]); fill(c, lin(c, -3, 0, 3, 0, [[0, "#5a6a8a"], [1, "#3a4a6a"]])); flag(c, 0, -29, 3.6, "#ffd23a", t);
    for (const x of [-4.6, -1.8, 1.4, 4]) { rect(c, x - .1, -12.4, 1, 11.2, lin(c, x, 0, x + 1, 0, [[0, "#ffffff"], [1, "#d8d0c4"]]), OUT); rect(c, x - .3, -12.6, 1.4, .5, "#e8e0d4", OUT); } rect(c, -5.4, -13.4, 10.8, 1, "#e8e0d4", OUT);
    for (const x of [-12.4, -9, 6.6, 10]) { win(c, x, -6.2, 2, 3.6, { arch: true, box: true, frame: "#ffffff", boxCol: "#4a5a7a" }); }
    door(c, -1.5, -1.2, 3, 6, { steps: 3, double: true, col: "#4a5a7a", stepCol: "#e0d8cc" }); banner(c, 0, -14.2, "MAIRIE DE KALUA", "#4a5a7a");
    for (const x of [-15.2, 15.2]) { lamp(c, x, 0, 5); } for (let i = 0; i < 3; i++) { bush(c, -13 + i * 3, 1.4, 1, "#4f9a4f", ["#ff9fb8", "#fff", "#ffd23a"][i]); bush(c, 7 + i * 3, 1.4, 1, "#4f9a4f", ["#ffd23a", "#fff", "#ff9fb8"][i]); }
    for (const x of [-5.8, 5.8]) { line(c, [[x, -13.4], [x, -17.4]], "#5a4a3a", .15); rect(c, x - .9, -17.4, 1.8, 2.4, x < 0 ? "#3a6ab0" : "#e8605a", OUT); } };
  D.vetements = (c, t) => { shadow(c, 22, 13);
    wall(c, -11, -7.4, 22, 6.6, "#fbeef2", "plaster"); roof(c, -11, -14, 22, 5, "#b86a8a", "slate"); for (const x of [-9.4, -6, -2.6, 1, 4.4, 7.8]) win(c, x, -12.6, 1.8, 3, { arch: true, shutters: "#ff9fb8", box: true, frame: "#ffffff" });
    gableFront(c, -4, -14, 8, 5, "#fbeef2", "#a85a7a", "slate"); ell(c, 0, -16, 1.2, 1.2, "#ffd23a", OUT); c.font = "1.4px 'Segoe UI Emoji'"; c.textAlign = "center"; c.fillText("🧵", 0, -15.5); c.textAlign = "left";
    wall(c, -11, 0, 22, 7.4, "#f8e4ea", "plaster", { base: 1, baseCol: "#c8b0b8" });
    for (const [vx, w] of [[-10.2, 7.6], [2.6, 7.6]]) { rrect(c, vx - .3, -6.6, w + .6, 5.6, .3, "#ffffff", OUT); rrect(c, vx, -6.3, w, 5, .2, lin(c, 0, -6.3, 0, -1.3, [[0, "#fff8ec"], [1, "#ffe4d0"]]), null); for (let k = 0; k < 3; k++) { const mx = vx + 1.3 + k * 2.5, cols = [["#ff9fb8", "#7ab4e8"], ["#ffd23a", "#3a3a5a"], ["#b48aff", "#ffffff"]][k]; ell(c, mx, -5.5, .5, .5, "#f0dcc8", null); poly(c, [[mx - 1, -4.9], [mx + 1, -4.9], [mx + 1.2, -3], [mx - 1.2, -3]]); fill(c, cols[0], null); poly(c, [[mx - 1.1, -3], [mx + 1.1, -3], [mx + 1.3, -1.9], [mx - 1.3, -1.9]]); fill(c, cols[1], null); line(c, [[mx, -1.9], [mx, -1.3]], "#6a4a3a", .15); } poly(c, [[vx + .5, -1.6], [vx + 2.4, -6.1], [vx + 3, -6.1], [vx + 1.1, -1.6]]); c.fillStyle = "rgba(255,255,255,.3)"; c.fill(); }
    door(c, -1.8, 0, 3.6, 5.2, { double: true, col: "#b86a8a", arch: true, steps: 1, stepCol: "#e8d8dc" }); awning(c, -11.3, -7.2, 22.6, 1.8, "#ff7f9f", "#ffffff"); banner(c, 0, -8.6, "LE FIL D'OR · VÊTEMENTS", "#8a3a5a"); sign(c, 12, -6, "👗", "#ffe4ee");
    for (const x of [-12.4, 12.4]) lamp(c, x, 0, 4.6); pot(c, -11.6, 0, "#ffffff", "#5aa05a"); pot(c, 11.6, 0, "#ffffff", "#5aa05a"); };
  D.restaurant = (c, t) => { shadow(c, 22, 13); chimney(c, 6, -14.4, 1.8, 3.4, "#a87a6a", t);
    wall(c, -11, 0, 22, 7, "#f4e4c4", "stone", { base: 1 }); wall(c, -10.4, -7, 20.8, 5, "#fff4e0", "timber", { beam: "#7a4a2a" }); roof(c, -10.4, -12, 20.8, 4.8, "#c8503a", "tiles");
    for (const x of [-9, -5.6, 3.8, 7.2]) win(c, x, -11, 1.8, 2.6, { shutters: "#3a7a5a", box: true }); for (const x of [-9.4, 5.4]) { rrect(c, x - .2, -6.2, 4.4, 4.4, .3, "#ffffff", OUT); rrect(c, x, -6, 4, 4, .2, lin(c, 0, -6, 0, -2, [[0, "#fff3c4"], [1, "#ffcf6a"]]), null); for (let k = 0; k < 2; k++) { ell(c, x + 1 + k * 2, -2.8, .9, .3, "#ffffff", null); ell(c, x + 1 + k * 2, -3.6, .25, .5, "#ffe27a", null); } }
    door(c, -1.6, 0, 3.2, 5, { double: true, col: "#6a3a22", lamp: true, steps: 1 }); awning(c, -11.3, -6.8, 22.6, 1.6, "#c8304a", "#fff4e0"); banner(c, 0, -13, "LA MARMITE DE KALUA", "#7a2a2a"); sign(c, 11.6, -5, "🍲", "#f4e4c4");
    for (let i = 0; i < 2; i++) parasolTable(c, -14.4 + i * 28.8, 2.6, "#c8304a", "#fff4e0"); for (let i = 0; i < 3; i++) bush(c, -6 + i * 6, 1.2, .9, "#4f9a4f", "#ff9fb8"); };
  D.place = (c, t) => { ell(c, 0, -6, 16, 7, "#e8dcc4", OUT); for (let r = 1; r < 4; r++) { c.beginPath(); c.ellipse(0, -6, r * 4, r * 1.75, 0, 0, TAU); c.strokeStyle = "rgba(160,140,110,.35)"; c.lineWidth = .15; c.stroke(); } for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; line(c, [[Math.cos(a) * 4, -6 + Math.sin(a) * 1.75], [Math.cos(a) * 16, -6 + Math.sin(a) * 7]], "rgba(160,140,110,.25)", .12); } c.save(); c.translate(0, -3.4); D.fontaine(c, t); c.restore(); c.save(); c.translate(0, -7.4); ell(c, 0, -4.6, 1.2, 1.2, "#fff4c0", "#e8c060"); const g = c.createRadialGradient(0, -4.6, 0, 0, -4.6, 4); g.addColorStop(0, "rgba(255,240,180,.5)"); g.addColorStop(1, "rgba(255,240,180,0)"); c.fillStyle = g; c.fillRect(-4, -8.6, 8, 8); c.restore(); for (const [x, y] of [[-12, -6], [12, -6], [-7, -1], [7, -1], [-7, -11], [7, -11]]) lamp(c, x, y, 4.4); for (const [x, y] of [[-10, -2.4], [10, -2.4]]) { c.save(); c.translate(x, y); D.banc(c); c.restore(); } for (const [x, y] of [[-14, -9], [14, -9], [-14, -3], [14, -3]]) bush(c, x, y, 1.4, "#4f9a4f", "#ff9fb8"); };

  // ================================================================ le catalogue
  const B = (id, name, cat, size, cost, desc, use, o = {}) => Object.assign({ id, name, cat, size, cost, desc, use }, o);
  const CATALOG = [
    B("maison", "Maison", "Habitat", LEVELS[0].size, LEVELS[0].cost, "Votre foyer. Améliorable 4 fois, jusqu'au château (25 pièces).", "Entrer, décorer"),
    B("auberge", "Auberge", "Habitat", [20, 13], { bois: 80, pierre: 50, laine: 10, corde: 8 }, "Des chambres pour les visiteurs : de nouveaux habitants viennent s'installer.", "Entrer"),
    B("potager", "Potager", "Nourriture", [14, 8], { bois: 8, argile: 6, herbe: 4 }, "Planter, arroser, récolter : légumes, fruits et herbes.", "Récolter"),
    B("serre", "Serre", "Nourriture", [11, 8], { bambou: 20, sable: 20, bois: 10 }, "Les plantes rares poussent toute l'année.", "Récolter"),
    B("ruche", "Ruche", "Nourriture", [5, 4], { bois: 6, roseau: 6, gelee: 2 }, "Du miel qui soigne 2 cœurs.", "Récolter"),
    B("four", "Four à pain", "Nourriture", [8, 7], { argile: 20, pierre: 10 }, "Pain, tartes, gâteaux.", "Cuire"),
    B("cuisine", "Cuisine d'été", "Nourriture", [9, 7], { bois: 16, pierre: 8, fer: 2 }, "Ragoûts et brochettes plus nourrissants.", "Cuisiner"),
    B("enclos", "Enclos", "Animaux", [18, 11], { bois: 30, corde: 6 }, "Les animaux adoptés y vivent : lait, laine.", "Adopter"),
    B("poulailler", "Poulailler", "Animaux", [9, 7], { bois: 14, feuille: 8, roseau: 6 }, "Un œuf par poule et par jour.", "Ramasser"),
    B("etable", "Étable", "Animaux", [14, 9], { bois: 40, pierre: 10, corde: 4 }, "Le cheval adopté y dort ; on le selle ici.", "Seller"),
    B("moulin", "Moulin", "Production", [10, 9], { bois: 40, pierre: 20, laine: 4 }, "Farine pour le four et les restaurants.", "Moudre"),
    B("forge", "Forge du village", "Production", [11, 9], { pierre: 30, fer: 10, bois: 12 }, "Répare et améliore les outils.", "Forger"),
    B("atelier", "Grand atelier", "Production", [11, 8], { bois: 30, silex: 6, corde: 4 }, "Toutes les recettes avancées.", "Fabriquer"),
    B("entrepot", "Entrepôt", "Production", [13, 9], { bois: 36, corde: 6 }, "Coffre commun : 100 places.", "Déposer"),
    B("couture", "Atelier de couture", "Production", [12, 9], { bois: 24, laine: 12, fil: 10 }, "Teindre et retoucher ses vêtements à volonté.", "Coudre"),
    B("cafe", "Café", "Commerces", [13, 10], { bois: 30, pierre: 20, coquillage: 6 }, "Un café chaud : +vitesse pendant 3 minutes.", "Commander"),
    B("boulangerie", "Boulangerie", "Commerces", [13, 10], { pierre: 30, bois: 20, argile: 10 }, "Croissants et pains : 2 cœurs.", "Acheter"),
    B("glacier", "Glacier", "Commerces", [11, 10], { bois: 20, sable: 10, coquillage: 8 }, "Glaces de fruits de l'île.", "Commander"),
    B("creperie", "Crêperie", "Restaurants", [13, 10], { bois: 30, pierre: 20, fer: 2 }, "Crêpes au miel, à la banane, au coco.", "S'attabler"),
    B("pizzeria", "Pizzeria du Volcan", "Restaurants", [14, 10], { pierre: 40, argile: 20, bois: 20 }, "Pizzas cuites au feu du volcan.", "S'attabler"),
    B("grill", "Grill du port", "Restaurants", [15, 10], { bois: 40, feuille: 20, corde: 6 }, "Poissons grillés : grosse régénération.", "S'attabler"),
    B("salonThe", "Salon de thé", "Restaurants", [12, 9], { bois: 30, pierre: 20, lotus: 2 }, "Thés aux herbes : recharge des chants.", "S'attabler"),
    B("marche", "Marché couvert", "Commerces", [19, 12], { bois: 50, pierre: 20, corde: 10 }, "Les habitants y échangent leurs produits.", "Échanger"),
    B("fleuriste", "Fleuriste", "Commerces", [11, 9], { bois: 20, herbe: 10, lotus: 2 }, "Graines et bouquets pour les jardins.", "Acheter"),
    B("epicerie", "Épicerie", "Commerces", [13, 10], { bois: 30, pierre: 10 }, "Ingrédients pour cuisiner.", "Acheter"),
    B("poste", "Bureau de poste", "Services", [12, 10], { bois: 20, pierre: 20, plume: 2 }, "Lettres des habitants et colis-surprises.", "Courrier"),
    B("bibliotheque", "Bibliothèque", "Services", [18, 11], { pierre: 60, bois: 30, fil: 6 }, "Tous les livres du lore, rangés et relus.", "Lire"),
    B("ecole", "École", "Services", [18, 11], { pierre: 40, bois: 30, argile: 20 }, "Les enfants de l'île apprennent les chants.", "Visiter"),
    B("soins", "Maison des soins", "Services", [13, 10], { bois: 20, herbe: 20, pierre: 10 }, "Soigne tout gratuitement, une fois par jour.", "Se soigner"),
    B("piscine", "Piscine", "Loisirs", [22, 13], { pierre: 60, sable: 30, coquillage: 10 }, "Nager, plonger, bronzer.", "Nager"),
    B("jeux", "Aire de jeux", "Loisirs", [16, 10], { bois: 30, corde: 8, fer: 4 }, "Balançoires et toboggan.", "Jouer"),
    B("kiosque", "Kiosque à musique", "Loisirs", [12, 9], { bois: 30, pierre: 10, fer: 4 }, "Concerts le soir : les habitants viennent danser.", "Jouer"),
    B("bains", "Bains chauds", "Loisirs", [18, 11], { pierre: 50, bois: 20, soufre: 6 }, "Eau du volcan : soigne et détend.", "Se baigner"),
    B("cinema", "Cinéma en plein air", "Loisirs", [20, 12], { bois: 30, laine: 10, fer: 6 }, "Revoir les cinématiques de l'aventure.", "Regarder"),
    B("terrain", "Terrain de sport", "Loisirs", [22, 13], { herbe: 10, bois: 10 }, "Match à deux (ou contre le compagnon).", "Jouer"),
    B("puits", "Puits", "Utile", [6, 5], { pierre: 16, bois: 4, corde: 2 }, "Une gorgée rend 1 cœur, une fois par jour.", "Boire"),
    B("feu", "Feu de camp", "Utile", [6, 4], { pierre: 6, bois: 4 }, "Se reposer jusqu'au matin.", "S'asseoir"),
    B("ponton", "Ponton de pêche", "Utile", [5, 13], { bois: 18, corde: 4 }, "Se pose au bord de l'eau : pêche rare.", "Pêcher"),
    B("tourGuet", "Tour de guet", "Utile", [7, 6], { bois: 30, corde: 6 }, "Révèle les environs sur la carte.", "Monter"),
    B("pont", "Pont de bois", "Utile", [14, 5], { bois: 24, corde: 4 }, "Le seul bâtiment qui se pose sur une rivière.", "Traverser"),
    B("autel", "Autel des chants", "Magie", [7, 5], { pierre: 20, cristalFeu: 1, lotus: 2 }, "Les chants se rechargent plus vite.", "Méditer"),
    B("fontaine", "Fontaine", "Déco", [9, 7], { pierre: 30, coquillage: 6 }, "L'eau chante.", "—"),
    B("statue", "Statue de Gardien", "Déco", [6, 5], { pierre: 25, obsidienne: 2 }, "Débloquée en libérant un Gardien.", "—"),
    B("totem", "Totem lume", "Déco", [4, 3], { bois: 10, plume: 2 }, "Sculpté de spirales.", "—"),
    B("arche", "Arche fleurie", "Déco", [7, 2], { bois: 6, liane: 6, herbe: 4 }, "Une entrée de jardin.", "—"),
    B("fleurs", "Massif de fleurs", "Déco", [9, 5], { herbe: 3, lotus: 1 }, "Des fleurs de toute l'île.", "—"),
    B("banc", "Banc", "Déco", [7, 2], { bois: 5 }, "S'asseoir à deux.", "S'asseoir"),
    B("cloture", "Clôture", "Déco", [10, 2], { bois: 3 }, "Pour dessiner les jardins.", "—"),
    B("dalles", "Dalles de pierre", "Déco", [7, 3], { pierre: 2 }, "Un chemin pavé.", "—"),
    B("lanterne", "Lanterne", "Déco", [2, 2], { fer: 1, gelee: 1 }, "S'allume à la nuit.", "—"),
  ];
  // bâtiments du village de base (déjà construits au début, pas dans le catalogue)
  const VILLAGE = [
    B("mairie", "Mairie de Kalua", "Village", [30, 18], null, "Projets du village, nom de l'île, registre des habitants, fêtes.", "Entrer"),
    B("vetements", "Le Fil d'Or", "Village", [22, 13], null, "Le magasin de vêtements : 15 types × 200 modèles, tous modifiables.", "Entrer"),
    B("restaurant", "La Marmite de Kalua", "Village", [22, 13], null, "Le grand restaurant : plats qui soignent et donnent des bonus.", "S'attabler"),
    B("place", "Place de l'Étoile", "Village", [32, 15], null, "Le cœur du village : fontaine, Étoile, bancs, fêtes de saison.", "—"),
  ];
  const ROOM_NAMES = [
    ["Entrée", "Pièce à vivre", "Chambre", "Cuisine", "Réserve"],
    ["Chambre d'amis", "Salle de bain", "Atelier", "Grenier", "Véranda"],
    ["Bibliothèque", "Salle des trophées", "Salle de musique", "Jardin d'hiver", "Cave"],
    ["Salle à manger", "Grand salon", "Bureau des cartes", "Observatoire", "Galerie des portraits"],
    ["Salle du trône", "Salle de bal", "Chapelle des Lumes", "Armurerie", "Chambre du donjon"],
  ];
  const DRAW = { maison: (c, t, lvl = 1) => HOUSE[Math.max(0, Math.min(4, lvl - 1))](c, t), ...D };
  return {
    CATALOG, VILLAGE, LEVELS, ROOMS, ROOM_NAMES,
    draw(id, c, s, t = 0, lvl = 1) { const f = DRAW[id]; if (!f) return; c.save(); c.scale(s, s); f(c, t, lvl); c.restore(); },
    kit: { wall, roof, gableFront, tower, win, door, awning, sign, banner, chimney, flag, bush, pot, lamp, grass, flowerBed, parasolTable, shadow, sh, lin, rrect, ell, rect, poly, fill, line, OUT },
  };
})();
if (typeof module !== "undefined") module.exports = BUILD;
