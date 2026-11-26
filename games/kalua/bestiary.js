/* Les Échoués de Kalua — dessins des ennemis, mini-boss, boss des grottes et des 12 Gardiens.
 * Repère : (0,0) = au sol, sous la créature ; une créature normale mesure ~40 px, un boss 120 à 220 px.
 * draw(c, id, t, o) — o.hurt (0..1) fait clignoter en blanc, o.phase change l'apparence, o.dir = "left"/"right". */
"use strict";

const Bosses = (() => {
  const TAU = Math.PI * 2; let c;
  const f = (col) => { c.fillStyle = col; };
  const circle = (x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ell = (x, y, rx, ry, r = 0) => { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), r, 0, TAU); c.fill(); };
  const line = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const poly = (pts, col) => { f(col); c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
  const shadow = (rx, a = .2) => { f(`rgba(30,20,20,${a})`); ell(0, 2, rx, rx * .28); };
  const eyes = (x1, x2, y, r = 3, angry = true, col = "#2b2230") => { f("#fff"); circle(x1, y, r * 1.3); circle(x2, y, r * 1.3); f(col); circle(x1 + .5, y + .3, r * .8); circle(x2 + .5, y + .3, r * .8); f("#fff"); circle(x1 + 1, y - .6, r * .3); circle(x2 + 1, y - .6, r * .3);
    if (angry) { line([[x1 - r * 1.6, y - r * 2], [x1 + r * .9, y - r * 1.1]], r * .55, "#2b2230"); line([[x2 + r * 1.6, y - r * 2], [x2 - r * .9, y - r * 1.1]], r * .55, "#2b2230"); } };
  const glowEyes = (x1, x2, y, r, col) => { f(col); c.shadowColor = col; c.shadowBlur = 10; circle(x1, y, r); circle(x2, y, r); c.shadowBlur = 0; };
  const crown = (x, y, s, col = "#ffd23a") => poly([[x - 10 * s, y], [x - 10 * s, y - 8 * s], [x - 5 * s, y - 3 * s], [x, y - 10 * s], [x + 5 * s, y - 3 * s], [x + 10 * s, y - 8 * s], [x + 10 * s, y]], col);
  const ash = (t, n, r, y0 = -60) => { f("rgba(30,20,30,.6)"); for (let i = 0; i < n; i++) { const k = (t * .4 + i / n) % 1; circle(Math.sin(i * 7 + t) * r, y0 - k * 70, 2 + (i % 3)); } };

  const D = {
    // ============================================================ ennemis communs
    slime(t, o) { const sq = 1 + Math.sin(t * 6) * .1; shadow(16); f(o.col || "#7ad05a"); c.save(); c.scale(1 / sq, sq); c.beginPath(); c.moveTo(-18, 0); c.quadraticCurveTo(-18, -30, 0, -30); c.quadraticCurveTo(18, -30, 18, 0); c.fill(); c.restore(); f("rgba(255,255,255,.4)"); ell(-6, -20, 5, 3, -.5); eyes(-6, 6, -14, 2.4, true); },
    racineSerpent(t, o) { const up = o.up ?? 1; c.save(); c.translate(0, (1 - up) * 30); line([[0, 0], [Math.sin(t * 3) * 6, -18], [Math.sin(t * 3 + 1) * 8, -34]], 9, "#7a5a3a"); f("#8a6a4a"); circle(Math.sin(t * 3 + 1) * 8, -38, 9); glowEyes(Math.sin(t * 3 + 1) * 8 - 4, Math.sin(t * 3 + 1) * 8 + 4, -40, 2, "#ffd23a"); c.restore(); f("#5a3e2a"); ell(0, 0, 16, 5); },
    chauve(t) { const w = Math.sin(t * 16) * 10; f("#4a3a5a"); poly([[0, -30], [-26, -38 - w], [-18, -26], [-10, -30]], "#4a3a5a"); poly([[0, -30], [26, -38 - w], [18, -26], [10, -30]], "#4a3a5a"); circle(0, -30, 9); glowEyes(-3, 3, -31, 1.8, "#ff5a5a"); },
    champi(t, o) { shadow(14); f("#f0e6d0"); c.fillRect(-6, -18, 12, 18); f(o.puff ? "#ff7a9a" : "#c04a6a"); c.beginPath(); c.ellipse(0, -18, 20, 14, 0, Math.PI, TAU); c.fill(); f("#fff"); circle(-8, -24, 3); circle(6, -27, 2.4); circle(12, -20, 2); eyes(-4, 4, -10, 1.8); },
    scarabee(t, o) { shadow(16); f(o.col || "#3a5a8a"); ell(0, -10, 16, 11); line([[-12, -4], [-18, 2]], 2, "#2a2a3a"); line([[12, -4], [18, 2]], 2, "#2a2a3a"); line([[0, -21], [0, 0]], 1, "rgba(0,0,0,.3)"); f("#2a2a3a"); ell(-13, -14, 6, 5); glowEyes(-16, -11, -15, 1.4, "#ffe08a"); line([[-17, -18], [-24, -26]], 1.6, "#2a2a3a"); },
    follet(t) { const fl = Math.sin(t * 10) * 3; c.globalAlpha *= .9; f("rgba(120,200,255,.25)"); circle(0, -30, 22); f("#8ad0ff"); c.beginPath(); c.moveTo(-10, -24); c.quadraticCurveTo(-12, -40, 0, -52 - fl); c.quadraticCurveTo(12, -40, 10, -24); c.quadraticCurveTo(0, -14, -10, -24); c.fill(); f("#e8f8ff"); ell(0, -30, 5, 7); f("#1a2a4a"); circle(-3, -31, 1.4); circle(3, -31, 1.4); },
    squelette(t, o) { shadow(14); f("#e8e4d8"); c.fillRect(-2, -34, 4, 20); for (let i = 0; i < 3; i++) c.fillRect(-9, -32 + i * 5, 18, 2); line([[-3, -14], [-6, 0]], 3, "#e8e4d8"); line([[3, -14], [6, 0]], 3, "#e8e4d8"); circle(0, -42, 9); f("#2a2028"); circle(-3, -43, 2.4); circle(3, -43, 2.4); c.fillRect(-3, -37, 6, 2);
      if (o.shield !== false) { f("#7a6a5a"); c.beginPath(); c.roundRect(o.dir === "right" ? 6 : -18, -34, 12, 22, 4); c.fill(); f("#c9a05a"); circle(o.dir === "right" ? 12 : -12, -23, 3); } line([[o.dir === "right" ? -8 : 8, -26], [o.dir === "right" ? -14 : 14, -40]], 2, "#9a9aa8"); },
    fantome(t, o) { c.globalAlpha *= (o.vis ?? 1) * (.75 + .2 * Math.sin(t * 3)); f("#e8eef8"); c.beginPath(); c.moveTo(-16, -6); c.quadraticCurveTo(-18, -46, 0, -46); c.quadraticCurveTo(18, -46, 16, -6); for (let i = 0; i < 4; i++) c.lineTo(16 - i * 10 - 5, -6 + (i % 2 ? -6 : 4) + Math.sin(t * 6 + i) * 2); c.fill(); f("#2a2a4a"); ell(-6, -30, 3, 4); ell(6, -30, 3, 4); ell(0, -20, 3, 4); },
    crapaud(t, o) { shadow(18); f("#6a8a4a"); ell(0, -12, 20, 13); f("#8aaa5a"); ell(0, -8, 12, 7); f("#6a8a4a"); circle(-9, -24, 6); circle(9, -24, 6); f("#ffd23a"); circle(-9, -25, 3.6); circle(9, -25, 3.6); f("#2b2230"); ell(-9, -25, 1, 2.6); ell(9, -25, 1, 2.6); f("#c06a6a"); if (o.tongue) c.fillRect(0, -14, o.tongue, 4); },
    salamandre(t) { shadow(16); f("#ff7a3a"); ell(0, -8, 16, 6); line([[14, -8], [26, -4 + Math.sin(t * 8) * 4]], 5, "#ff7a3a"); f("#ffb03a"); for (let i = 0; i < 3; i++) circle(-8 + i * 8, -12, 2); f("#ff7a3a"); ell(-17, -10, 7, 5); glowEyes(-20, -15, -12, 1.6, "#2a1a1a"); f("rgba(255,180,60,.4)"); circle(0, -14, 10 + Math.sin(t * 9) * 2); },
    golemLave(t, o) { shadow(26); const cool = o.cool || 0; f(cool ? "#6a6a72" : "#4a2a2a"); c.beginPath(); c.roundRect(-24, -54, 48, 48, 12); c.fill(); c.beginPath(); c.roundRect(-36, -48, 14, 34, 6); c.roundRect(22, -48, 14, 34, 6); c.fill();
      if (!cool) { line([[-14, -46], [-4, -30], [-12, -16]], 3, "#ff8a3a"); line([[10, -50], [6, -34], [16, -20]], 3, "#ff8a3a"); } glowEyes(-8, 8, -42, 3, cool ? "#9ad0ff" : "#ffd23a"); },
    braise(t) { f("rgba(255,140,60,.3)"); circle(0, -30, 18 + Math.sin(t * 12) * 3); f("#ff8a3a"); circle(0, -30, 10); f("#ffe08a"); circle(0, -32, 5); f("#2a1a1a"); circle(-3, -31, 1.2); circle(3, -31, 1.2); },
    cendreux(t, o) { shadow(16); f("#3a3438"); c.beginPath(); c.roundRect(-12, -40, 24, 34, 6); c.fill(); line([[-6, -8], [-7, 0]], 5, "#3a3438"); line([[6, -8], [7, 0]], 5, "#3a3438"); f("#4a4448"); circle(0, -48, 11); f("#1a1418"); c.fillRect(-8, -50, 16, 4); glowEyes(-4, 4, -48, 1.8, "#ff6a3a");
      line([[o.dir === "right" ? 12 : -12, -30], [o.dir === "right" ? 26 : -26, -54]], 3, "#8a8a98"); ash(t, 4, 10, -40); },
    crabeSoldat(t) { shadow(20); f("#e0604a"); ell(0, -12, 18, 11); for (const s of [-1, 1]) { line([[s * 14, -10], [s * 22, -22]], 4, "#e0604a"); circle(s * 24, -26, 6); } f("#c0c0c8"); c.beginPath(); c.arc(0, -20, 10, Math.PI, TAU); c.fill(); eyes(-5, 5, -14, 2); },
    meduse(t) { c.globalAlpha *= .85; f("#d0a0f0"); c.beginPath(); c.arc(0, -36, 16, Math.PI, TAU); c.fill(); for (let i = -2; i <= 2; i++) line([[i * 6, -36], [i * 6 + Math.sin(t * 4 + i) * 4, -14]], 2, "#c08ae0"); f("#fff"); circle(-5, -42, 2); circle(5, -42, 2); },
    murene(t, o) { const s = o.scale || 1; line([[0, 0], [Math.sin(t * 2) * 10, -20 * s], [Math.sin(t * 2 + 1) * 14, -44 * s]], 12 * s, "#5a7a4a"); f("#6a8a5a"); ell(Math.sin(t * 2 + 1) * 14, -50 * s, 12 * s, 9 * s); f("#fffaf0"); for (let i = 0; i < 4; i++) poly([[Math.sin(t * 2 + 1) * 14 - 10 * s + i * 5 * s, -46 * s], [Math.sin(t * 2 + 1) * 14 - 8 * s + i * 5 * s, -41 * s], [Math.sin(t * 2 + 1) * 14 - 6 * s + i * 5 * s, -46 * s]], "#fffaf0"); glowEyes(Math.sin(t * 2 + 1) * 14 - 4 * s, Math.sin(t * 2 + 1) * 14 + 4 * s, -54 * s, 2 * s, "#ffd23a"); },
    harpie(t) { const w = Math.sin(t * 10) * 12; poly([[-6, -34], [-36, -48 - w], [-22, -28]], "#8a6aa8"); poly([[6, -34], [36, -48 - w], [22, -28]], "#8a6aa8"); f("#b08ac8"); ell(0, -30, 10, 14); f("#f0c8a8"); circle(0, -46, 8); f("#5a3a6a"); c.beginPath(); c.arc(0, -48, 9, Math.PI, TAU); c.fill(); eyes(-3, 3, -46, 1.6); line([[-4, -16], [-6, -8]], 2, "#ffc04a"); line([[4, -16], [6, -8]], 2, "#ffc04a"); },
    ventin(t) { c.globalAlpha *= .8; c.strokeStyle = "#cfe8ff"; c.lineWidth = 4; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -30 + i * 4, 18 - i * 5, t * 6 + i, t * 6 + i + 4); c.stroke(); } f("#fff"); circle(-4, -32, 2); circle(4, -32, 2); },
    caillou(t) { shadow(14); f("#9a9aa6"); c.beginPath(); c.roundRect(-14, -26, 28, 24, 9); c.fill(); f("#8a8a96"); circle(-14, -14, 6); circle(14, -14, 6); glowEyes(-5, 5, -18, 2, "#7ae0e0"); },
    ermite(t) { shadow(16); f("#ff9a6a"); ell(-10, -8, 8, 5); f("#ffe6d0"); circle(5, -16, 14); c.strokeStyle = "#e8b8a0"; c.lineWidth = 2; c.beginPath(); for (let a = 0; a < 12; a += .3) c.lineTo(5 + Math.cos(a) * a, -16 + Math.sin(a) * a); c.stroke(); f("#2b2230"); circle(-13, -14, 1.8); circle(-8, -14, 1.8); },
    tortuePierre(t) { shadow(22); f("#7a8a6a"); ell(-18, -8, 7, 5); f("#8a8a7a"); c.beginPath(); c.arc(0, -8, 20, Math.PI, TAU); c.fill(); f("#6a6a5a"); for (let i = -1; i <= 1; i++) circle(i * 9, -16, 4); eyes(-20, -16, -10, 1.3); },
    goeland(t) { const w = Math.sin(t * 12) * 8; poly([[0, -30], [-26, -36 - w], [-10, -26]], "#e8e8f0"); poly([[0, -30], [26, -36 - w], [10, -26]], "#d0d0dc"); f("#fff"); ell(0, -28, 10, 7); circle(-8, -34, 6); poly([[-13, -34], [-22, -32], [-13, -31]], "#ffc04a"); eyes(-9, -7, -36, 1.2); },
    spectreMarin(t) { D.fantome(t, { vis: 1 }); f("#3a6a8a"); c.fillRect(-10, -50, 20, 4); c.fillRect(-6, -58, 12, 8); },
    automate(t) { shadow(16); f("#c9a05a"); c.beginPath(); c.roundRect(-14, -44, 28, 34, 6); c.fill(); f("#8a6a3a"); c.save(); c.translate(0, -27); c.rotate(t * 3); for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.fillRect(-2, -10, 4, 5); } c.restore(); f("#a8804a"); c.beginPath(); c.roundRect(-10, -58, 20, 14, 4); c.fill(); glowEyes(-4, 4, -51, 2, "#7ae0ff"); line([[-6, -10], [-6, 0]], 4, "#8a6a3a"); line([[6, -10], [6, 0]], 4, "#8a6a3a"); },
    etoile(t) { f("rgba(255,240,180,.3)"); circle(0, -30, 20); c.save(); c.translate(0, -30); c.rotate(t); f("#ffe08a"); c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 6 : 14; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.restore(); f("#5a4a2a"); circle(-3, -31, 1.4); circle(3, -31, 1.4); },
    sanglier(t) { shadow(20); f("#5a3e30"); for (const i of [-10, -4, 4, 10]) c.fillRect(i - 2, -10, 4, 10); ell(0, -16, 20, 12); for (let i = -3; i <= 3; i++) poly([[i * 4 - 2, -26], [i * 4, -36 + Math.abs(i)], [i * 4 + 2, -26]], "#4a2e20"); f("#7a5440"); circle(-18, -18, 10); f("#d8a890"); ell(-26, -16, 5, 4); f("#fffaf0"); poly([[-23, -13], [-29, -15], [-27, -21], [-24, -15]], "#fffaf0"); glowEyes(-19, -15, -21, 1.8, "#ffd23a"); },
    croco(t) { shadow(26); f("#5a8a4a"); ell(4, -8, 22, 9); poly([[24, -8], [40, -6], [24, -3]], "#5a8a4a"); for (let i = 0; i < 5; i++) poly([[-6 + i * 6, -16], [-3 + i * 6, -22], [0 + i * 6, -16]], "#4a7a3a"); f("#5a8a4a"); ell(-20, -8, 13, 6); f("#fffaf0"); for (let i = 0; i < 5; i++) poly([[-30 + i * 3, -6], [-28.5 + i * 3, -2], [-27 + i * 3, -6]], "#fffaf0"); f("#ffd23a"); circle(-14, -15, 3); f("#2b2230"); ell(-14, -15, .7, 2.2); },
    condor(t) { const w = Math.sin(t * 8) * 10; poly([[0, -34], [-40, -46 - w], [-28, -30], [-10, -28]], "#3a3346"); poly([[0, -34], [40, -46 - w], [28, -30], [10, -28]], "#3a3346"); f("#3a3346"); ell(0, -28, 10, 14); f("#e0a090"); circle(0, -46, 7); poly([[-3, -44], [0, -36], [3, -44]], "#ffc04a"); glowEyes(-3, 3, -48, 1.4, "#ff5a5a"); },
    crabeGeant(t) { shadow(30); f("#c0392b"); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) line([[s * 12, -10 + i * 3], [s * 28, -6 + i * 4], [s * 32, 0]], 3, "#c0392b"); f("#e0503a"); ell(0, -14, 26, 16); for (const s of [-1, 1]) { line([[s * 18, -18], [s * 30, -32]], 6, "#e0503a"); circle(s * 34, -38, 11); } eyes(-7, 7, -22, 3); },
    // ============================================================ mini-boss
    verRacine(t, o) { const up = o.up ?? 1; c.save(); c.translate(0, (1 - up) * 70); for (let i = 0; i < 8; i++) { const y = -i * 14, x = Math.sin(t * 2 + i * .6) * 10 * (i / 8); f(i % 2 ? "#7a5a3a" : "#8a6a4a"); circle(x, y, 20 - i); } const hx = Math.sin(t * 2 + 4.8) * 10, hy = -112;
      f("#6a4a2a"); circle(hx, hy, 18); f("#2a1a10"); c.beginPath(); c.arc(hx, hy + 4, 10, 0, Math.PI); c.fill(); glowEyes(hx - 7, hx + 7, hy - 6, 3, "#ffd23a"); for (let i = -2; i <= 2; i++) line([[hx + i * 5, hy - 16], [hx + i * 8, hy - 30]], 3, "#5a8a3a"); c.restore(); f("#4a3020"); ell(0, 0, 30, 8); },
    champiRoi(t, o) { shadow(30); f("#f0e6d0"); c.fillRect(-14, -50, 28, 50); f(o.phase ? "#9a2a5a" : "#c04a6a"); c.beginPath(); c.ellipse(0, -50, 46, 32, 0, Math.PI, TAU); c.fill(); f("#fff"); for (const [x, y, r] of [[-20, -62, 7], [8, -72, 6], [26, -58, 5], [-6, -58, 4]]) circle(x, y, r); crown(0, -82, 1.4); eyes(-8, 8, -30, 3.4); },
    mureneGeante(t) { D.murene(t, { scale: 2.6 }); },
    capitaineCrabe(t) { D.crabeGeant(t); f("#2a2a3a"); poly([[-16, -30], [16, -30], [10, -42], [-10, -42]], "#2a2a3a"); f("#fff"); c.fillRect(-4, -40, 8, 6); line([[30, -34], [46, -60]], 3, "#c0c0c8"); },
    crapaudGeole(t, o) { c.save(); c.scale(2.4, 2.4); D.crapaud(t, o); c.restore(); f("#6a6a72"); for (let i = -2; i <= 2; i++) c.fillRect(i * 10 - 2, -70, 4, 20); c.fillRect(-26, -72, 52, 4); },
    lanternier(t) { shadow(20); f("#2a2a3a"); c.beginPath(); c.moveTo(-20, 0); c.lineTo(-14, -70); c.lineTo(14, -70); c.lineTo(20, 0); c.fill(); f("#1a1a2a"); circle(0, -80, 14); glowEyes(-5, 5, -80, 2.4, "#8ad0ff");
      const sw = Math.sin(t * 2) * 20; line([[16, -60], [30 + sw * .3, -40]], 2, "#6a6a6a"); f("rgba(140,200,255,.3)"); circle(30 + sw * .3, -32, 18); f("#8ad0ff"); c.beginPath(); c.roundRect(24 + sw * .3, -40, 12, 16, 3); c.fill(); },
    harpieReine(t) { c.save(); c.scale(1.9, 1.9); D.harpie(t); c.restore(); crown(0, -102, 1.2, "#c9a3e8"); },
    golemVent(t) { shadow(30); c.save(); c.scale(2.2, 2.2); D.caillou(t); c.restore(); c.globalAlpha *= .7; c.strokeStyle = "#cfe8ff"; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -36, 40 + i * 8, t * 3 + i, t * 3 + i + 2); c.stroke(); } },
    golemMagma(t, o) { c.save(); c.scale(2.2, 2.2); D.golemLave(t, o); c.restore(); f("rgba(255,120,40,.25)"); circle(0, -60, 70 + Math.sin(t * 4) * 6); },
    chevalierCendre(t, o) { c.save(); c.scale(1.8, 1.8); D.cendreux(t, o); c.restore(); poly([[-6, -112], [0, -126], [6, -112]], o.variant ? "#c0c0c8" : "#ff6a3a"); },
    salamandreMere(t) { c.save(); c.scale(3, 3); D.salamandre(t); c.restore(); crown(-50, -46, 1.2, "#ffb03a"); },
    grandBernard(t) { shadow(40); f("#ff9a6a"); ell(-30, -14, 22, 12); for (let i = 0; i < 3; i++) line([[-40 + i * 10, -6], [-44 + i * 10, 6]], 4, "#e86a4a"); f("#ffe6d0"); circle(12, -40, 40); c.strokeStyle = "#e8b8a0"; c.lineWidth = 4; c.beginPath(); for (let a = 0; a < 18; a += .25) c.lineTo(12 + Math.cos(a) * a * 2, -40 + Math.sin(a) * a * 2); c.stroke(); eyes(-40, -30, -30, 3.4); line([[-38, -16], [-60, -30]], 6, "#e86a4a"); circle(-62, -34, 9); },
    meduseReine(t) { c.save(); c.scale(2.6, 2.6); D.meduse(t); c.restore(); crown(0, -128, 1.3, "#ffd0f0"); },
    automateGardien(t) { c.save(); c.scale(2.4, 2.4); D.automate(t); c.restore(); f("rgba(120,220,255,.25)"); circle(0, -122, 20 + Math.sin(t * 6) * 4); },
    goelandSpectre(t) { c.globalAlpha *= .8; c.save(); c.scale(2.4, 2.4); D.goeland(t); c.restore(); f("rgba(160,200,255,.25)"); circle(0, -70, 60); },
    etoileFilante(t) { c.save(); c.scale(2.4, 2.4); D.etoile(t); c.restore(); for (let i = 1; i < 6; i++) { c.globalAlpha = .3 / i; f("#ffe08a"); circle(i * 16, -72 + i * 8, 20 - i * 2); } c.globalAlpha = 1; },
    gardienConstellation(t) { f("#0a0a2a"); c.globalAlpha *= .9; ell(0, -80, 50, 80); c.globalAlpha = 1; const pts = [[-30, -130], [0, -150], [30, -130], [24, -80], [-24, -80], [0, -40], [-36, -20], [36, -20]];
      c.strokeStyle = "rgba(200,220,255,.7)"; c.lineWidth = 1.5; c.beginPath(); [[0, 1], [1, 2], [2, 3], [3, 5], [5, 4], [4, 0], [5, 6], [5, 7]].forEach(([a, b]) => { c.moveTo(...pts[a]); c.lineTo(...pts[b]); }); c.stroke();
      for (const [x, y] of pts) { f("#fff"); circle(x, y, 2.6 + Math.sin(t * 3 + x) * .8); } glowEyes(-10, 10, -120, 3, "#9ad0ff"); },
    // ============================================================ boss des grottes
    mereRacine(t, o) { // Grotte 1 : l'arbre-tombeau
      shadow(90, .3); const ph = o.phase || 0;
      f("#5a3e2a"); c.beginPath(); c.moveTo(-60, 0); c.quadraticCurveTo(-40, -120, -70, -200); c.lineTo(70, -200); c.quadraticCurveTo(40, -120, 60, 0); c.fill();
      for (let i = 0; i < 5; i++) line([[-60 + i * 30, 0], [-90 + i * 45 + Math.sin(t + i) * 6, 20]], 10, "#4a3020");
      for (const [x, y, r] of [[-80, -230, 60], [70, -240, 66], [0, -280, 70]]) { f(ph >= 2 ? "#6a4a5a" : ph ? "#4f7a3a" : "#3f8a4a"); circle(x + Math.sin(t * .8 + x) * 3, y, r); }
      f("#1a0e08"); c.beginPath(); c.ellipse(0, -110, 30, 40 + Math.sin(t * 2) * 6, 0, 0, TAU); c.fill(); // la bouche-tombeau
      glowEyes(-26, 26, -160, 7, ph >= 2 ? "#ff4a4a" : "#ffd23a");
      f("#e8e4d8"); for (let i = 0; i < 4; i++) { circle(-18 + i * 12, -84 + (i % 2) * 4, 4); } // ossements dans la bouche
      if (o.core) { f("rgba(255,240,140,.6)"); circle(0, -110, 16 + Math.sin(t * 6) * 3); f("#ffe08a"); circle(0, -110, 9); }
    },
    amiralNacre(t, o) { // Grotte 2 : bernard géant dans la coque d'un navire lume
      shadow(100, .3); f("#e0b0a0"); for (let i = 0; i < 4; i++) line([[-70 + i * 14, -20], [-90 + i * 14, 10]], 7, "#d06a4a");
      f("#f4ecf8"); c.beginPath(); c.moveTo(-40, -10); c.lineTo(130, -10); c.lineTo(110, -90); c.quadraticCurveTo(40, -150, -30, -100); c.fill(); // coque de nacre
      c.strokeStyle = "rgba(200,170,230,.8)"; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-20 + i * 30, -14); c.quadraticCurveTo(10 + i * 30, -80, 40 + i * 25, -120); c.stroke(); }
      f("#ff8a6a"); ell(-60, -40, 30, 26); line([[-80, -50], [-120, -80 + Math.sin(t * 2) * 8]], 12, "#e86a4a"); circle(-128, -88 + Math.sin(t * 2) * 8, 20); poly([[-128, -88], [-160, -110], [-152, -80]], "#fdf6ec");
      eyes(-70, -52, -58, 5); poly([[-82, -76], [-58, -76], [-62, -92], [-78, -92]], "#2a2a3a"); f("#ffd23a"); circle(-70, -84, 4);
      if (o.shell === false) { f("rgba(255,255,255,.6)"); ell(40, -60, 60, 40); }
    },
    geolier(t, o) { // Grotte 3 : le Geôlier sans visage
      shadow(50, .3); const ph = o.phase || 0;
      f("#1e1a24"); c.beginPath(); c.moveTo(-50, 0); c.lineTo(-36, -150); c.lineTo(36, -150); c.lineTo(50, 0); c.fill();
      f("#2a2430"); for (let i = -1; i <= 1; i += 2) { line([[i * 36, -130], [i * 80, -80 + Math.sin(t * 2 + i) * 10]], 12, "#2a2430"); }
      f("#e8e4ec"); ell(0, -175, 26, 32); // le visage lisse… sans visage
      if (o.mask) { f("#c9a05a"); ell(0, -178, 20, 24); f("#1a1418"); ell(-8, -184, 4, 6); ell(8, -184, 4, 6); }
      if (ph >= 1) { glowEyes(-9, 9, -182, 4, "#8ad0ff"); }
      // les clés et les chaînes
      for (let i = 0; i < 5; i++) { const x = -40 + i * 20, y = -60 + Math.sin(t * 3 + i) * 4; f("#9a9aa8"); circle(x, y, 4); c.fillRect(x - 1, y, 2, 12); }
      c.strokeStyle = "#6a6a78"; c.lineWidth = 3; c.beginPath(); c.moveTo(-80, -80 + Math.sin(t * 2 - 1) * 10); c.quadraticCurveTo(-90, -20, -60, 0); c.stroke();
    },
    tempestaire(t, o) { // Grotte 4 : l'oiseau-orage fait de notes perdues
      const w = Math.sin(t * 5) * 20, ph = o.phase || 0;
      f("rgba(200,230,255,.25)"); circle(0, -110, 110);
      poly([[0, -110], [-150, -170 - w], [-120, -110], [-150, -60 + w * .3], [-40, -90]], ph ? "#4a5a8a" : "#6a8ac0");
      poly([[0, -110], [150, -170 - w], [120, -110], [150, -60 + w * .3], [40, -90]], ph ? "#4a5a8a" : "#6a8ac0");
      f("#8aaad8"); ell(0, -100, 30, 50); f("#cfe0ff"); circle(0, -160, 26); poly([[-8, -150], [0, -130], [8, -150]], "#ffc04a"); glowEyes(-9, 9, -165, 4, "#fff6a0");
      f("#fff"); c.font = "900 22px serif"; c.textAlign = "center"; for (let i = 0; i < 5; i++) c.fillText(["♪", "♫", "♩", "♬", "♪"][i], Math.cos(t + i * 1.3) * 90, -110 + Math.sin(t * 1.4 + i) * 70);
      if (ph) for (let i = 0; i < 3; i++) line([[-60 + i * 60, -230], [-50 + i * 60, -200], [-66 + i * 60, -190], [-54 + i * 60, -160]], 3, "#fff6a0");
    },
    reineCendree(t, o) { // Grotte 5 : Ilaïa fusionnée au Cœur
      const ph = o.phase || 0;
      f("rgba(255,90,50,.18)"); circle(0, -140, 150 + Math.sin(t * 2.6) * 8);
      // robe de cendre qui s'effiloche
      f("#2a1e24"); c.beginPath(); c.moveTo(-90, 0); for (let i = 0; i <= 12; i++) c.lineTo(-90 + i * 15, Math.sin(t * 3 + i) * 8); c.lineTo(40, -150); c.lineTo(-40, -150); c.fill();
      f("#3a2a30"); c.beginPath(); c.moveTo(-40, -150); c.quadraticCurveTo(-120, -200, -150 + Math.sin(t) * 10, -120); c.lineTo(-40, -120); c.fill(); c.beginPath(); c.moveTo(40, -150); c.quadraticCurveTo(120, -200, 150 + Math.sin(t + 1) * 10, -120); c.lineTo(40, -120); c.fill();
      // le Cœur fêlé dans sa poitrine
      const beat = 1 + .15 * Math.max(0, Math.sin(t * 2.6)) ** 8; f("#ff8a5a"); c.save(); c.translate(0, -120); c.scale(beat, beat); c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 9 : 20; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); line([[-3, -16], [3, -2], [-2, 8], [3, 16]], 3, "#1a0a0a"); c.restore();
      // visage de cendre et couronne
      f("#d8c8c8"); ell(0, -190, 22, 28); f("#1a0e10"); ell(-8, -194, 4, ph >= 2 ? 6 : 2); ell(8, -194, 4, ph >= 2 ? 6 : 2); if (ph >= 1) glowEyes(-8, 8, -194, 3, "#ff5a3a");
      f("#3a2a30"); c.beginPath(); c.moveTo(-26, -200); c.quadraticCurveTo(-40, -150, -30, -110); c.lineTo(-20, -190); c.fill(); c.beginPath(); c.moveTo(26, -200); c.quadraticCurveTo(40, -150, 30, -110); c.lineTo(20, -190); c.fill();
      crown(0, -214, 2, ph >= 2 ? "#5a4a4a" : "#c9a05a");
      ash(t, 14, 90, -100);
    },
    // ============================================================ les 12 Gardiens
    B1(t, o) { // Roi Crabe Corail
      shadow(80, .3); f("#e0503a"); for (const s of [-1, 1]) for (let i = 0; i < 3; i++) line([[s * 30, -20 + i * 6], [s * 70, -10 + i * 8], [s * 80, 4]], 7, "#c0392b");
      f("#ff6a4a"); ell(0, -40, 66, 40); f("#ff9a7a"); ell(-14, -54, 26, 12); for (const s of [-1, 1]) { line([[s * 48, -50], [s * 84, -90]], 14, "#ff6a4a"); circle(s * 92, -100, 26); poly([[s * 92, -100], [s * 130, -124], [s * 126, -88]], "#fdf6ec"); }
      for (let i = -3; i <= 3; i++) { f(["#ff9ac0", "#ffd0a0", "#c9a3e8"][(i + 3) % 3]); circle(i * 14, -82 + Math.abs(i) * 3, 6); } // corail
      crown(0, -96, 2.6); eyes(-16, 16, -58, 6);
    },
    B2(t, o) { // Petit Kraken
      f("rgba(90,160,220,.4)"); ell(0, 0, 110, 22);
      for (let i = 0; i < 6; i++) { const a = -Math.PI + i / 5 * Math.PI, x = Math.cos(a) * 60; line([[x * .5, -40], [x + Math.sin(t * 2 + i) * 20, -10 + Math.sin(t * 3 + i) * 10], [x * 1.6, -30 + Math.cos(t * 2 + i) * 20]], 12, "#9a6ad0"); }
      f("#b48ae8"); ell(0, -80, 56, 66); f("#c9a8f0"); for (let i = 0; i < 6; i++) circle(-30 + i * 12, -110 + (i % 2) * 8, 5);
      f("#fff"); circle(-20, -78, 16); circle(20, -78, 16); f("#2b2230"); circle(-18, -76, 9); circle(22, -76, 9); f("#fff"); circle(-15, -80, 3); circle(25, -80, 3); // gros yeux apeurés
      if (o.phase) line([[-36, -100], [-10, -92]], 4, "#2b2230"); f("#7a4ab0"); ell(0, -50, 8, 5);
    },
    B3(t, o) { // Grand Gorille Moussu
      shadow(70, .3); f("#3f5a3a"); line([[-50, -90], [-80, -20], [-70, 0]], 26, "#3f5a3a"); line([[50, -90], [80, -20], [70, 0]], 26, "#3f5a3a");
      ell(0, -80, 60, 66); f("#5a7a4a"); for (let i = 0; i < 9; i++) circle(Math.cos(i) * 50, -80 + Math.sin(i * 2) * 50, 16); // mousse
      f("#4a4048"); ell(0, -140, 30, 28); f("#7a6a6a"); ell(0, -128, 20, 14); f("#2b2230"); circle(-5, -126, 2.4); circle(5, -126, 2.4); eyes(-12, 12, -146, 4, true);
      f("#ff9ac0"); circle(22, -160, 7); f("#ffd23a"); circle(22, -160, 3); // une fleur dans la mousse (souvenir)
      if (o.phase >= 2) { f("rgba(255,60,60,.3)"); ell(0, -80, 70, 76); }
    },
    B4(t, o) { // Serpent-Liane
      for (let i = 0; i < 14; i++) { const a = i * .55 + t * .6, x = Math.cos(a) * (30 + i * 3), y = -20 - i * 12; f(i % 2 ? "#4a9a3a" : "#5aaa48"); circle(x, y, 16 - i * .3); if (i % 3 === 0) { f("#ffd23a"); circle(x, y - 4, 3); } }
      const hx = Math.cos(14 * .55 + t * .6) * 70, hy = -200; f("#5aaa48"); ell(hx, hy, 26, 18); eyes(hx - 10, hx + 10, hy - 6, 4); line([[hx - 24, hy + 6], [hx - 40, hy + 10 + Math.sin(t * 10) * 4]], 2, "#e0566b");
      f("#3a7a2a"); for (let i = 0; i < 4; i++) poly([[hx - 12 + i * 8, hy - 16], [hx - 8 + i * 8, hy - 30], [hx - 4 + i * 8, hy - 16]], "#3a7a2a");
    },
    B5(t, o) { // Gardien du Temple
      shadow(60, .3); f("#8a8a96"); c.beginPath(); c.roundRect(-50, -150, 100, 110, 14); c.fill(); c.beginPath(); c.roundRect(-80, -140, 26, 90, 10); c.roundRect(54, -140, 26, 90, 10); c.fill();
      f("#7a7a86"); c.fillRect(-36, -40, 28, 40); c.fillRect(8, -40, 28, 40); f("#9a9aa6"); c.beginPath(); c.roundRect(-34, -200, 68, 54, 12); c.fill();
      f("#5aa85a"); circle(-30, -200, 10); circle(30, -150, 8); f("rgba(80,220,220," + (.5 + .4 * Math.sin(t * 3)) + ")"); circle(0, -100, 22); f("#7ae0e0"); circle(0, -100, 12); // la pierre-œil
      glowEyes(-14, 14, -176, 5, o.phase ? "#ff6a6a" : "#7ae0e0"); line([[-20, -158], [20, -158]], 4, "#5a5a66");
      c.strokeStyle = "rgba(80,220,220,.5)"; c.lineWidth = 2; c.beginPath(); c.arc(0, -100, 34, t, t + 4); c.stroke();
    },
    B6(t, o) { // Reine Grenouille
      shadow(80, .3); f("#3a8a6a"); ell(0, 0, 100, 20); // le nénuphar
      f("#5fbf5a"); ell(0, -50, 70, 50); f("#bfe8a0"); ell(0, -36, 44, 28); for (const s of [-1, 1]) { f("#5fbf5a"); ell(s * 60, -14, 26, 12); }
      circle(-30, -100, 22); circle(30, -100, 22); f("#fff"); circle(-30, -102, 16); circle(30, -102, 16); f("#2b2230"); circle(-28, -100, 8); circle(32, -100, 8);
      crown(0, -126, 2.4, "#c9e08a"); f("#ff8a9a"); ell(-50, -60, 10, 6); ell(50, -60, 10, 6); f("#ff9ac0"); circle(56, -82, 9); // rouge à lèvres et fleur
      c.strokeStyle = "#2b5a2a"; c.lineWidth = 4; c.beginPath(); c.arc(0, -66, 24, .2 * Math.PI, .8 * Math.PI); c.stroke();
      if (o.tongue) { f("#e0566b"); c.fillRect(0, -60, o.tongue, 10); }
    },
    B7(t, o) { // Esprit des Brumes : toutes les âmes
      c.globalAlpha *= .85; f("rgba(220,235,245,.35)"); circle(0, -110, 110 + Math.sin(t) * 8);
      f("#e8eef8"); c.beginPath(); c.moveTo(-70, -30); c.quadraticCurveTo(-80, -220, 0, -220); c.quadraticCurveTo(80, -220, 70, -30); for (let i = 0; i < 7; i++) c.lineTo(70 - i * 23, -30 + (i % 2 ? -18 : 12) + Math.sin(t * 4 + i) * 6); c.fill();
      for (let i = 0; i < 6; i++) { const a = t * .6 + i, x = Math.cos(a) * 46, y = -120 + Math.sin(a * 1.3) * 50; f("rgba(150,170,210,.55)"); ell(x, y, 9, 12); f("#2a2a4a"); circle(x - 3, y - 2, 1.6); circle(x + 3, y - 2, 1.6); } // visages des noyés
      f("#2a2a4a"); ell(-22, -160, 10, 14); ell(22, -160, 10, 14); ell(0, -120, 12, 18);
      c.globalAlpha = 1;
    },
    B8(t, o) { // Bélier Tonnerre
      shadow(70, .3); f("#5a5a68"); for (const i of [-40, -16, 16, 40]) c.fillRect(i - 6, -40, 12, 40);
      f("#f4f4fa"); for (let i = 0; i < 12; i++) circle(Math.cos(i) * 56, -70 + Math.sin(i * 1.7) * 22, 26); // laine-nuage
      f("#3a3a48"); ell(-70, -80, 24, 28); c.strokeStyle = "#c9a060"; c.lineWidth = 10; c.beginPath(); c.arc(-80, -100, 22, 0, Math.PI * 1.6); c.stroke(); c.beginPath(); c.arc(-56, -104, 18, Math.PI, Math.PI * 2.4); c.stroke();
      glowEyes(-80, -64, -82, 3.4, "#fff6a0");
      if (o.charge || o.phase) { line([[20, -150], [10, -120], [26, -112], [12, -84]], 5, "#fff6a0"); line([[-20, -160], [-28, -130], [-14, -124], [-24, -96]], 4, "#fff6a0"); }
    },
    B9(t, o) { // Aigle-Roi
      const w = Math.sin(t * 4) * 18;
      poly([[0, -100], [-170, -150 - w], [-140, -100], [-160, -70 + w * .4], [-110, -70], [-40, -70]], "#8a5a3c");
      poly([[0, -100], [170, -150 - w], [140, -100], [160, -70 + w * .4], [110, -70], [40, -70]], "#8a5a3c");
      f("#7a4a2c"); ell(0, -80, 36, 56); f("#fff"); circle(0, -150, 30); poly([[-10, -144], [0, -116], [10, -144]], "#ffc04a"); eyes(-11, 11, -156, 4.4); crown(0, -180, 2);
      f("#ffd23a"); for (const s of [-1, 1]) { line([[s * 14, -28], [s * 18, -4]], 5, "#ffc04a"); }
    },
    B10(t, o) { // Gargouille des Ruines
      shadow(60, .3); const w = Math.sin(t * 3) * 10, stone = o.stone;
      poly([[-20, -120], [-110, -170 - w], [-90, -120], [-100, -80], [-30, -90]], stone ? "#8a8a90" : "#6a6a78"); poly([[20, -120], [110, -170 - w], [90, -120], [100, -80], [30, -90]], stone ? "#8a8a90" : "#6a6a78");
      f(stone ? "#9a9aa0" : "#7a7a88"); ell(0, -80, 34, 50); c.fillRect(-26, -40, 14, 40); c.fillRect(12, -40, 14, 40); circle(0, -144, 26);
      poly([[-22, -160], [-30, -190], [-10, -166]], "#5a5a68"); poly([[22, -160], [30, -190], [10, -166]], "#5a5a68"); glowEyes(-9, 9, -146, 4, stone ? "#9a9aa0" : "#ff4a4a");
      f("#4a4a58"); c.fillRect(-12, -132, 24, 4); f("#9ad0ff"); circle(0, -86, 6 + Math.sin(t * 4)); // pierre-lune
    },
    B11(t, o) { // Dragonnet de Lave
      shadow(60, .3); f("#4a2a2a"); ell(0, 0, 90, 16); f("#ff7a3a"); ell(0, -2, 70, 10);
      line([[40, -40], [90, -30], [110, -60 + Math.sin(t * 3) * 10]], 14, "#e0503a"); poly([[104, -66], [124, -64], [112, -50]], "#ffb03a");
      poly([[-10, -80], [-80, -140 - Math.sin(t * 4) * 14], [-50, -80]], "#c04a3a"); poly([[10, -80], [60, -150 - Math.sin(t * 4) * 14], [40, -80]], "#c04a3a");
      f("#e0503a"); ell(0, -60, 44, 36); f("#ffb070"); ell(0, -48, 26, 20); f("#e0503a"); circle(-40, -110, 30); poly([[-52, -134], [-60, -160], [-40, -136]], "#ffd23a"); poly([[-30, -138], [-26, -164], [-20, -136]], "#ffd23a");
      eyes(-50, -30, -114, 4.4); f("#2a1010"); ell(-56, -96, 3, 2); if (o.breath) { f("rgba(255,160,60,.7)"); c.beginPath(); c.moveTo(-70, -96); c.lineTo(-200, -130); c.lineTo(-200, -60); c.fill(); }
    },
    B12(t, o) { // Phénix Cendré
      const w = Math.sin(t * 5) * 22, dark = o.phase || 0;
      f(dark ? "rgba(120,60,80,.3)" : "rgba(255,170,60,.3)"); circle(0, -120, 120);
      for (const s of [-1, 1]) for (let i = 0; i < 5; i++) poly([[0, -110], [s * (60 + i * 26), -170 - w + i * 12], [s * (50 + i * 20), -100 + i * 6]], dark ? ["#6a3a4a", "#5a2a3a", "#7a4a5a"][i % 3] : ["#ff7a3a", "#ffb03a", "#ffd23a"][i % 3]);
      f(dark ? "#7a4a5a" : "#ffb03a"); ell(0, -100, 30, 44); for (let i = 0; i < 4; i++) line([[-6 + i * 4, -60], [-18 + i * 12 + Math.sin(t * 4 + i) * 8, 0]], 5, dark ? "#5a2a3a" : "#ff7a3a");
      f(dark ? "#8a5a6a" : "#ffd23a"); circle(0, -158, 22); poly([[-6, -152], [0, -136], [6, -152]], "#ffc04a"); glowEyes(-8, 8, -162, 3.4, dark ? "#ff3a3a" : "#fff"); poly([[0, -180], [-10, -210], [0, -196], [10, -214], [6, -180]], dark ? "#3a2030" : "#ff5a2a");
      ash(t, dark ? 12 : 4, 70, -80);
    },
    // ============================================================ créatures secrètes des îles
    tortue(t) { c.save(); c.scale(3, 3); Creatures.drawKind(c, "tortue"); c.restore(); },
    hibou(t) { c.save(); c.scale(3, 3); Creatures.drawKind(c, "hibou"); c.restore(); },
    renard(t) { c.save(); c.scale(3, 3); Creatures.drawKind(c, "renard"); c.restore(); },
  };

  function draw(ctx, id, t, o = {}) {
    c = ctx; const fn = D[id]; if (!fn) { f("#f0f"); circle(0, -20, 16); return; }
    c.save(); const s = o.scale || 1; c.scale(o.dir === "right" ? -s : s, s);
    if (o.hurt > 0 && Math.floor(t * 24) % 2) c.globalAlpha *= .35; // clignote quand il est touché
    fn(t, o);
    c.restore();
  }
  return { draw, ids: Object.keys(D) };
})();
