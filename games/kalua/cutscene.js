/* Les Échoués de Kalua — moteur de cinématiques.
 * Une cinématique est une fonction asynchrone qui met en scène des acteurs sur un décor animé :
 * déplacements, caméra, tremblements, éclairs, fondus, particules (pluie, braises, étincelles…), musique et dialogues.
 *   await Cutscene.play(async (S) => { S.bg("storm"); const b = S.add("bastien", { npc: "bastien", x: 300, y: 420 }); await S.move(b, 400, 420, 1.5); … });
 * Le joueur peut toujours passer la cinématique (bouton « Passer »). */
"use strict";

const Cutscene = (() => {
  const TAU = Math.PI * 2;
  let S = null; // scène en cours
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ================================================================ décors
  // Chaque décor dessine dans le repère de la scène (sol vers y = 420). v = zone visible {x0,x1,y0,y1}.
  const sky = (c, v, top, bot) => { const g = c.createLinearGradient(0, v.y0, 0, 420); g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); };
  const ground = (c, v, y, col) => { c.fillStyle = col; c.fillRect(v.x0, y, v.x1 - v.x0, v.y1 - y + 10); };
  const blob = (c, x, y, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  function waves(c, v, y, t, col, amp, len, speed) {
    c.fillStyle = col; c.beginPath(); c.moveTo(v.x0 - 10, v.y1 + 10);
    for (let x = v.x0 - 10; x <= v.x1 + 10; x += 10) c.lineTo(x, y + Math.sin(x / len + t * speed) * amp + Math.sin(x / (len * .37) - t * speed * 1.7) * amp * .35);
    c.lineTo(v.x1 + 10, v.y1 + 10); c.fill();
  }
  function palm(c, x, y, s, t, dark) {
    c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = dark ? "#2a2030" : "#8a6040"; c.lineWidth = 7; c.lineCap = "round";
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(10, -60, 4, -120); c.stroke();
    c.fillStyle = dark ? "#1e2a2a" : "#4f9a52";
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .55 + Math.sin(t * 1.5 + i) * .05; c.save(); c.translate(4, -120); c.rotate(a); c.beginPath(); c.ellipse(32, 0, 34, 7, 0, 0, TAU); c.fill(); c.restore(); }
    c.restore();
  }
  function tree(c, x, y, s, col, trunk = "#6b4a34") { c.fillStyle = trunk; c.fillRect(x - 6 * s, y - 50 * s, 12 * s, 50 * s); blob(c, x, y - 70 * s, 34 * s, col); blob(c, x - 22 * s, y - 52 * s, 22 * s, col); blob(c, x + 22 * s, y - 54 * s, 24 * s, col); }
  function stars(c, v, t, n = 60, a = 1) { for (let i = 0; i < n; i++) { const x = v.x0 + ((i * 197.3) % 1) * 0 + ((i * 7919) % 1000) / 1000 * (v.x1 - v.x0), y = v.y0 + ((i * 3571) % 1000) / 1000 * (300 - v.y0); c.globalAlpha = a * (.4 + .6 * Math.abs(Math.sin(t * .7 + i))); blob(c, x, y, i % 7 === 0 ? 2.2 : 1.2, "#fff"); } c.globalAlpha = 1; }
  function shipDraw(c, x, y, s, tilt, broken, t) {
    c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s, s);
    c.fillStyle = "#5a3a2a"; c.beginPath(); c.moveTo(-120, -10); c.lineTo(120, -10); c.lineTo(95, 30); c.lineTo(-100, 30); c.closePath(); c.fill();
    c.fillStyle = "#7a5038"; c.fillRect(-118, -16, 236, 8); c.fillStyle = "#c9a05a"; c.fillRect(-100, 4, 190, 3);
    for (let i = -80; i < 90; i += 30) blob(c, i, 14, 4, "#2a1a14");
    const masts = broken ? [[-40, 70], [40, 140]] : [[-50, 150], [10, 170], [70, 130]];
    for (const [mx, h] of masts) { c.fillStyle = "#4a3020"; c.fillRect(mx - 3, -10 - h, 6, h);
      c.fillStyle = broken ? "rgba(230,225,210,.6)" : "#f1ead8"; c.beginPath(); c.moveTo(mx + 3, -h); c.quadraticCurveTo(mx + 45 + Math.sin(t * 3) * 4, -h * .6, mx + 3, -18); c.fill(); }
    // la mouette d'argent peinte à la proue
    c.fillStyle = "#e6e9f0"; c.beginPath(); c.moveTo(100, 0); c.quadraticCurveTo(108, -6, 114, 0); c.quadraticCurveTo(108, -2, 100, 0); c.fill();
    c.restore();
  }
  function rockSpike(c, x, y, w, h, col) { c.fillStyle = col; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x - w * .3, y - h); c.lineTo(x + w * .2, y - h * .8); c.lineTo(x + w, y); c.closePath(); c.fill(); }

  const BG = {
    black(c, v) { c.fillStyle = "#000"; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); },
    storm(c, v, t, o) { // mer déchaînée la nuit
      sky(c, v, "#0b1022", "#26304a");
      c.globalAlpha = .5; for (let i = 0; i < 6; i++) blob(c, v.x0 + ((i * 263 + t * 30) % (v.x1 - v.x0 + 300)) - 150, 80 + (i % 3) * 40, 120, "#1a2238"); c.globalAlpha = 1;
      if (o.rocks) { rockSpike(c, 760, 430, 90, 210, "#141420"); rockSpike(c, 880, 440, 60, 150, "#1a1a28"); rockSpike(c, 120, 445, 70, 120, "#16161f"); }
      if (o.light) { // la silhouette lumineuse sur le rocher
        const a = o.light; c.globalAlpha = a; const g = c.createRadialGradient(780, 205, 2, 780, 205, 80); g.addColorStop(0, "rgba(220,240,255,.95)"); g.addColorStop(1, "rgba(220,240,255,0)"); c.fillStyle = g; c.fillRect(700, 120, 160, 170);
        c.fillStyle = "#eaf6ff"; c.beginPath(); c.ellipse(780, 212, 7, 20, 0, 0, TAU); c.fill(); blob(c, 780, 188, 7, "#eaf6ff"); c.globalAlpha = 1; }
      waves(c, v, 400, t, "#1c2c48", 16, 60, 1.4); waves(c, v, 425, t + 1, "#22385a", 22, 80, 1.9);
      if (o.ship) shipDraw(c, o.ship.x, o.ship.y + Math.sin(t * 1.6) * 10, o.ship.s || 1, o.ship.tilt + Math.sin(t * 1.3) * .06, o.ship.broken, t);
      waves(c, v, 450, t + 2, "#2a4a70", 26, 70, 2.3);
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 2; for (let x = Math.floor(v.x0 / 60) * 60; x < v.x1; x += 60) { const y = 452 + Math.sin(x / 70 + (t + 2) * 2.3) * 26; c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x + 20, y - 6); c.stroke(); }
    },
    deck(c, v, t, o) { // sur le pont, sous l'orage
      sky(c, v, "#0d1428", "#2a3550");
      waves(c, v, 330 + Math.sin(t) * 20, t, "#1c2c48", 14, 60, 1.6);
      c.save(); c.translate(500, 470); c.rotate(Math.sin(t * 1.3) * .05 + (o.tilt || 0));
      c.fillStyle = "#6b4630"; c.fillRect(-800, -40, 1600, 400); c.fillStyle = "#5a3a26"; for (let x = -800; x < 800; x += 46) c.fillRect(x, -40, 3, 400);
      c.fillStyle = "#4a3020"; c.fillRect(-800, -70, 1600, 14); for (let x = -760; x < 800; x += 80) c.fillRect(x, -70, 8, 34);
      c.fillStyle = "#3a2618"; c.fillRect(-30, -600, 26, 560); // grand mât
      c.fillStyle = "rgba(240,235,220,.85)"; c.beginPath(); c.moveTo(-4, -580); c.quadraticCurveTo(160 + Math.sin(t * 4) * 20, -420, -4, -260); c.fill();
      c.fillStyle = "#c9a05a"; blob(c, 260, -60, 26, "#8a6a3a"); c.strokeStyle = "#c9a05a"; c.lineWidth = 4; c.beginPath(); c.arc(260, -60, 26, 0, TAU); c.stroke(); // la barre
      c.restore();
    },
    beach(c, v, t, o) { // la plage au matin
      const night = o.dawn ? 1 : 0;
      sky(c, v, night ? "#f6b8a6" : "#9fd8ef", night ? "#ffe1b8" : "#e6f7ff");
      if (night) { c.globalAlpha = .7; blob(c, 700, 330, 60, "#fff1c8"); c.globalAlpha = 1; }
      waves(c, v, 330, t, "#7cc6e0", 4, 70, .6); waves(c, v, 345, t + 1, "#9ad6ea", 4, 50, .8);
      ground(c, v, 360, "#f3dcae"); c.fillStyle = "#f8e7c4"; c.fillRect(v.x0, 360, v.x1 - v.x0, 8);
      c.fillStyle = "rgba(255,255,255,.7)"; c.beginPath(); c.moveTo(v.x0, 362); for (let x = v.x0; x < v.x1; x += 20) c.lineTo(x, 362 + Math.sin(x / 40 + t * 2) * 3); c.lineTo(v.x1, 368); c.lineTo(v.x0, 368); c.fill();
      if (o.wreck !== false) { c.save(); c.translate(140, 375); c.rotate(-.18); c.fillStyle = "#6b4630"; c.fillRect(-90, -30, 170, 40); c.fillStyle = "#4a3020"; c.fillRect(-60, -110, 10, 90); c.fillStyle = "rgba(240,235,220,.8)"; c.beginPath(); c.moveTo(-50, -100); c.lineTo(10, -60); c.lineTo(-50, -40); c.fill(); c.restore();
        for (const [x, y, r] of [[300, 400, .3], [520, 430, -.4], [860, 405, .1]]) { c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = "#7a5038"; c.fillRect(-26, -4, 52, 9); c.restore(); } }
      palm(c, 920, 390, 1, t); palm(c, 60, 400, .8, t);
    },
    village(c, v, t, o) {
      sky(c, v, o.night ? "#1a2040" : "#a6dcf2", o.night ? "#3a3a6a" : "#eaf8ff"); if (o.night) stars(c, v, t);
      ground(c, v, 380, "#a8d890"); c.fillStyle = "#98cc80"; for (let x = v.x0; x < v.x1; x += 37) blob(c, x, 384, 10, "#98cc80");
      tree(c, 90, 385, 1, "#5aa85a"); tree(c, 920, 390, 1.2, "#4f9a52");
      for (const [x, s] of [[250, 1], [760, .9]]) { c.fillStyle = "#e8c48a"; c.fillRect(x - 46 * s, 330, 92 * s, 55); c.fillStyle = "#c97a4a"; c.beginPath(); c.moveTo(x - 60 * s, 335); c.lineTo(x, 280); c.lineTo(x + 60 * s, 335); c.fill(); c.fillStyle = "#6b4630"; c.fillRect(x - 10, 352, 20, 33); }
      // feu de camp
      c.fillStyle = "#6b4630"; c.fillRect(480, 410, 40, 6); for (let i = 0; i < 3; i++) { c.globalAlpha = .9; blob(c, 500 + Math.sin(t * 9 + i) * 3, 398 - i * 8, 10 - i * 3, ["#ff7a3a", "#ffb03a", "#ffe08a"][i]); } c.globalAlpha = 1;
    },
    jungle(c, v, t, o) {
      sky(c, v, "#5fa87a", "#bfe6b0");
      for (let i = 0; i < 9; i++) tree(c, v.x0 + i * 130 - 40, 380, 1.4 + (i % 3) * .2, i % 2 ? "#2f7a44" : "#3f8a4a", "#4a3626");
      ground(c, v, 380, "#4f8a4a"); for (let x = v.x0; x < v.x1; x += 24) { c.fillStyle = "#3f7a3f"; c.beginPath(); c.moveTo(x, 382); c.lineTo(x + 6, 366 + Math.sin(t * 2 + x) * 3); c.lineTo(x + 12, 382); c.fill(); }
      c.strokeStyle = "#3f7a3a"; c.lineWidth = 4; for (let i = 0; i < 6; i++) { const x = v.x0 + i * 180 + 60; c.beginPath(); c.moveTo(x, v.y0); c.quadraticCurveTo(x + 30 + Math.sin(t + i) * 10, 140, x + 10, 230); c.stroke(); }
      if (o.graves) for (let i = 0; i < 6; i++) { const x = 300 + i * 70; c.fillStyle = "#9a9a9a"; c.beginPath(); c.roundRect(x - 14, 360 - (i % 2) * 6, 28, 40, [12, 12, 0, 0]); c.fill(); c.fillStyle = "#777"; c.fillRect(x - 6, 372 - (i % 2) * 6, 12, 3); }
    },
    temple(c, v, t, o) {
      sky(c, v, "#2a2a3a", "#4a4a5a");
      c.fillStyle = "#6a6a78"; c.fillRect(v.x0, v.y0, v.x1 - v.x0, 400 - v.y0);
      c.fillStyle = "#5a5a68"; for (let y = 0; y < 400; y += 40) for (let x = Math.floor(v.x0 / 80) * 80 + (y % 80 ? 40 : 0); x < v.x1; x += 80) c.fillRect(x, y, 76, 36);
      for (const x of [150, 850]) { c.fillStyle = "#7a7a88"; c.fillRect(x - 30, 60, 60, 340); c.fillStyle = "#8a8a98"; c.fillRect(x - 40, 50, 80, 20); }
      // la porte de la crypte
      const op = o.door ?? 0; c.fillStyle = "#1a1420"; c.fillRect(420, 160, 160, 240); c.fillStyle = "#4a4a58"; c.fillRect(420, 160 - op * 220, 160, 240);
      c.strokeStyle = "rgba(120,240,230,.6)"; c.lineWidth = 3; c.beginPath(); c.arc(500, 280 - op * 220, 36, 0, TAU); c.stroke();
      for (const x of [380, 620]) { c.fillStyle = "#6b4630"; c.fillRect(x - 4, 300, 8, 100); for (let i = 0; i < 3; i++) blob(c, x + Math.sin(t * 8 + i) * 2, 296 - i * 7, 8 - i * 2, ["#ff7a3a", "#ffb03a", "#ffe08a"][i]); }
      ground(c, v, 400, "#4a4a56");
    },
    marsh(c, v, t, o) {
      sky(c, v, "#6a7a76", "#b8c8bc");
      for (let i = 0; i < 7; i++) { c.fillStyle = "#4a5a48"; const x = v.x0 + i * 170; c.fillRect(x, 220, 8, 170); blob(c, x + 4, 210, 40, "#5a6a50"); }
      ground(c, v, 390, "#5a6a58"); waves(c, v, 400, t, "#6a8478", 2, 60, .4);
      for (let i = 0; i < 5; i++) { const x = 150 + i * 190; c.fillStyle = "#7a5a3a"; c.fillRect(x - 3, 330, 6, 70); c.globalAlpha = .7 + .3 * Math.sin(t * 2 + i); blob(c, x, 326, 9, o.blue ? "#8ad0ff" : "#ffd27a"); c.globalAlpha = 1; }
      c.globalAlpha = .35; for (let i = 0; i < 5; i++) blob(c, ((i * 300 + t * 15) % (v.x1 - v.x0 + 400)) + v.x0 - 200, 360 + (i % 2) * 20, 140, "#e8f0ea"); c.globalAlpha = 1;
    },
    cliffs(c, v, t, o) {
      sky(c, v, o.sunset ? "#f4a07a" : "#9fd0ef", o.sunset ? "#ffe0a8" : "#f0fbff");
      c.globalAlpha = .7; for (let i = 0; i < 4; i++) blob(c, ((i * 330 + t * 20) % (v.x1 - v.x0 + 300)) + v.x0 - 150, 90 + i * 25, 50, "#fff"); c.globalAlpha = 1;
      c.fillStyle = "#b8aca0"; c.beginPath(); c.moveTo(v.x0, 300); c.lineTo(300, 250); c.lineTo(600, 280); c.lineTo(v.x1, 240); c.lineTo(v.x1, 420); c.lineTo(v.x0, 420); c.fill();
      ground(c, v, 390, "#a8b890");
      if (o.stones) for (let i = 0; i < (o.stones || 0); i++) { const x = 160 + i * 110, lit = i < (o.lit || 0); c.fillStyle = "#8a8a90"; c.beginPath(); c.roundRect(x - 16, 300, 32, 92, 10); c.fill(); if (lit) { c.globalAlpha = .6 + .4 * Math.sin(t * 3 + i); c.strokeStyle = "#9fe8ff"; c.lineWidth = 3; c.beginPath(); c.arc(x, 330, 9, 0, TAU); c.stroke(); c.globalAlpha = 1; } }
      for (let i = 0; i < 2; i++) { const x = 820 + i * 90; c.fillStyle = "#e8dcc8"; c.fillRect(x - 14, 300, 28, 90); c.save(); c.translate(x, 300); c.rotate(t * (o.wind ? 2.4 : .6) + i); c.fillStyle = "#c9b090"; for (let k = 0; k < 4; k++) { c.rotate(TAU / 4); c.fillRect(0, -4, 50, 8); } c.restore(); }
    },
    volcano(c, v, t, o) {
      sky(c, v, "#3a1a1a", "#a0503a");
      c.fillStyle = "#3a2a2a"; c.beginPath(); c.moveTo(200, 400); c.lineTo(440, 120); c.lineTo(560, 120); c.lineTo(800, 400); c.fill();
      c.globalAlpha = .5 + .3 * Math.sin(t * 2); blob(c, 500, 120, 60, "#ff7a3a"); c.globalAlpha = 1;
      c.fillStyle = "#ff7a3a"; c.beginPath(); c.moveTo(490, 125); c.lineTo(470, 300); c.lineTo(500, 260); c.lineTo(520, 400); c.lineTo(530, 128); c.fill();
      ground(c, v, 400, "#2a1e1e");
    },
    cave(c, v, t, o) {
      const col = o.col || "#2a2a3a"; c.fillStyle = col; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      c.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 12; i++) { const x = v.x0 + i * 100; c.beginPath(); c.moveTo(x, v.y0); c.lineTo(x + 30, 90 + (i % 3) * 30); c.lineTo(x + 60, v.y0); c.fill(); }
      ground(c, v, 400, "rgba(0,0,0,.35)");
      if (o.glow) { const g = c.createRadialGradient(500, 300, 10, 500, 300, 360); g.addColorStop(0, o.glow); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); }
    },
    heart(c, v, t, o) { // le Cœur de Kalua
      c.fillStyle = "#14080a"; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      const beat = 1 + .06 * Math.max(0, Math.sin(t * 2.6)) ** 8, pure = o.pure || 0;
      const g = c.createRadialGradient(500, 230, 10, 500, 230, 260 * beat); g.addColorStop(0, pure > .5 ? "rgba(255,250,220,1)" : "rgba(255,140,80,1)"); g.addColorStop(.4, pure > .5 ? "rgba(255,230,160,.6)" : "rgba(160,40,40,.6)"); g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      c.save(); c.translate(500, 230); c.scale(beat, beat); c.fillStyle = pure > .5 ? "#fff6d8" : "#ff8a5a"; c.beginPath();
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 34 : 70; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill();
      if (pure < 1) { c.strokeStyle = "#14080a"; c.lineWidth = 6 * (1 - pure); c.beginPath(); c.moveTo(-10, -60); c.lineTo(8, -10); c.lineTo(-6, 20); c.lineTo(10, 60); c.stroke(); }
      c.restore(); ground(c, v, 410, "#1e0e10");
    },
    sea(c, v, t, o) {
      sky(c, v, o.night ? "#101a3a" : "#8ed0ef", o.night ? "#2a3a6a" : "#e8f8ff"); if (o.night) stars(c, v, t);
      if (o.island) { c.fillStyle = o.island; c.beginPath(); c.ellipse(o.ix || 820, 345, 140, 40, 0, Math.PI, TAU); c.fill(); if (o.tower) { c.fillStyle = "#f0f0f0"; c.fillRect((o.ix || 820) - 10, 250, 20, 70); c.fillStyle = "#e05050"; c.fillRect((o.ix || 820) - 10, 270, 20, 10); c.globalAlpha = o.beam || 0; blob(c, o.ix || 820, 252, 30, "#fff6a0"); c.globalAlpha = 1; } }
      waves(c, v, 350, t, "#4aa0d0", 6, 60, .9);
      if (o.boat) { const b = o.boat; c.save(); c.translate(b.x, 360 + Math.sin(t * 1.5) * 6); c.rotate(Math.sin(t * 1.2) * .05);
        c.fillStyle = "#8a5a3a"; c.beginPath(); c.moveTo(-70, 0); c.lineTo(70, 0); c.lineTo(50, 22); c.lineTo(-55, 22); c.fill(); c.fillStyle = "#4a3020"; c.fillRect(-3, -110, 6, 110);
        c.fillStyle = "#f4ecd8"; c.beginPath(); c.moveTo(3, -105); c.quadraticCurveTo(60, -60, 3, -10); c.fill(); c.fillStyle = "#e05050"; c.fillRect(3, -112, 24, 10); c.restore(); }
      waves(c, v, 380, t + 1.4, "#3a8cc0", 9, 70, 1.3);
    },
    lighthouse(c, v, t, o) {
      sky(c, v, "#151a33", "#3a3f6a"); stars(c, v, t, 40);
      c.fillStyle = "#5a5a6a"; c.beginPath(); c.moveTo(300, 420); c.lineTo(420, 300); c.lineTo(640, 310); c.lineTo(760, 420); c.fill();
      c.fillStyle = "#e8e8ee"; c.beginPath(); c.moveTo(470, 310); c.lineTo(490, 90); c.lineTo(550, 90); c.lineTo(570, 310); c.fill(); for (let y = 120; y < 300; y += 60) { c.fillStyle = "#d05050"; c.fillRect(480, y, 80, 18); }
      c.fillStyle = "#333"; c.fillRect(485, 60, 70, 32); const on = o.beam || 0;
      if (on) { c.save(); c.globalAlpha = on * .5; c.translate(520, 76); c.rotate(Math.sin(t * .6) * .8); c.fillStyle = "#fff8b0"; c.beginPath(); c.moveTo(0, 0); c.lineTo(600, -60); c.lineTo(600, 60); c.fill(); c.restore(); blob(c, 520, 76, 16, "#fff8b0"); }
      waves(c, v, 410, t, "#20306a", 8, 60, 1);
    },
    stars(c, v, t, o) { c.fillStyle = "#070a1a"; c.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0); stars(c, v, t, 140, 1); if (o.aurora) { c.globalAlpha = .25; for (let i = 0; i < 3; i++) { c.fillStyle = ["#7ae0c0", "#a08ae0", "#7ac0ff"][i]; c.beginPath(); c.moveTo(v.x0, 120 + i * 30); for (let x = v.x0; x < v.x1; x += 30) c.lineTo(x, 120 + i * 30 + Math.sin(x / 90 + t * .5 + i) * 30); c.lineTo(v.x1, 0); c.lineTo(v.x0, 0); c.fill(); } c.globalAlpha = 1; } },
  };

  // ================================================================ particules
  function emit(kind, n) {
    for (let i = 0; i < n; i++) {
      const v = S.view;
      const p = { kind, x: rnd(v.x0, v.x1), y: rnd(v.y0, v.y1), vx: 0, vy: 0, life: 0, max: 3, s: 2 };
      if (kind === "rain") Object.assign(p, { y: v.y0 - 20, vx: -120, vy: 900, max: 1.2, s: 1 });
      else if (kind === "embers") Object.assign(p, { y: v.y1, vx: rnd(-20, 20), vy: rnd(-90, -40), max: 5, s: rnd(1.5, 3) });
      else if (kind === "ash") Object.assign(p, { y: v.y0, vx: rnd(-15, 15), vy: rnd(20, 50), max: 9, s: rnd(1.5, 3) });
      else if (kind === "sparkles") Object.assign(p, { vx: rnd(-20, 20), vy: rnd(-30, -10), max: 2, s: rnd(1.5, 3) });
      else if (kind === "leaves") Object.assign(p, { y: v.y0, x: rnd(v.x0, v.x1), vx: rnd(10, 40), vy: rnd(30, 60), max: 9, s: 4 });
      else if (kind === "bubbles") Object.assign(p, { y: v.y1, vx: 0, vy: rnd(-60, -30), max: 7, s: rnd(2, 5) });
      else if (kind === "fireflies") Object.assign(p, { vx: rnd(-10, 10), vy: rnd(-10, 10), max: 6, s: 2 });
      else if (kind === "light") Object.assign(p, { y: rnd(200, 420), vx: rnd(-10, 10), vy: rnd(-80, -40), max: 4, s: rnd(2, 4) });
      S.parts.push(p);
    }
  }
  function drawParts(c, dt) {
    for (const [kind, rate] of Object.entries(S.emitters)) { S.acc[kind] = (S.acc[kind] || 0) + rate * dt; const n = Math.floor(S.acc[kind]); if (n) { S.acc[kind] -= n; emit(kind, n); } }
    S.parts = S.parts.filter((p) => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.kind === "fireflies" || p.kind === "light") { p.vx += rnd(-30, 30) * dt; } return p.life < p.max; });
    for (const p of S.parts) {
      const a = Math.min(1, p.life * 3, (p.max - p.life) * 2);
      c.globalAlpha = a;
      if (p.kind === "rain") { c.strokeStyle = "rgba(180,200,255,.6)"; c.lineWidth = 1.4; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - 4, p.y + 22); c.stroke(); }
      else if (p.kind === "embers") blob(c, p.x, p.y, p.s, "#ff9a4a");
      else if (p.kind === "ash") blob(c, p.x, p.y, p.s, "#3a3438");
      else if (p.kind === "sparkles" || p.kind === "light") blob(c, p.x, p.y, p.s, "#fff6c8");
      else if (p.kind === "leaves") { c.save(); c.translate(p.x, p.y); c.rotate(p.life * 3); c.fillStyle = "#6fbf5a"; c.beginPath(); c.ellipse(0, 0, 5, 2.4, 0, 0, TAU); c.fill(); c.restore(); }
      else if (p.kind === "bubbles") { c.strokeStyle = "rgba(220,240,255,.8)"; c.lineWidth = 1; c.beginPath(); c.arc(p.x, p.y, p.s, 0, TAU); c.stroke(); }
      else if (p.kind === "fireflies") { blob(c, p.x, p.y, 5, "rgba(255,240,140,.25)"); blob(c, p.x, p.y, 1.8, "#fff6a0"); }
    }
    c.globalAlpha = 1;
  }

  // ================================================================ acteurs
  function drawActor(c, a, t) {
    if (a.alpha <= 0) return;
    c.save(); c.globalAlpha = a.alpha; c.translate(a.x, a.y + (a.bob || 0));
    if (a.glow) { const g = c.createRadialGradient(0, -40, 4, 0, -40, 90); g.addColorStop(0, a.glow); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(-100, -140, 200, 200); }
    if (a.rot) c.rotate(a.rot);
    const s = a.scale || 1;
    if (a.av) {
      c.fillStyle = "rgba(0,0,0,.18)"; c.beginPath(); c.ellipse(0, 2, 22 * s, 6 * s, 0, 0, TAU); c.fill();
      c.scale(4.2 * s, 4.2 * s); c.translate(0, -14);
      if (a.lying) { c.rotate(-Math.PI / 2); c.translate(10, 6); }
      Avatar.draw(c, a.av, { dir: a.dir || "down", walk: a.walking ? (t * 2.2) % 1 : null, swing: a.swing || 0, t });
    } else if (a.creature) { c.scale(s * 2.4, s * 2.4); c.translate(0, -10); if (a.dir === "right") c.scale(-1, 1); Creatures.drawKind(c, a.creature); }
    else if (a.boss) { if (typeof Bosses !== "undefined") Bosses.draw(c, a.boss, t, { scale: s, hurt: a.hurt || 0, phase: a.phase || 0, dir: a.dir }); }
    else if (a.item) ITEMS.draw(c, a.item, 0, -16, 32 * s);
    else if (a.draw) a.draw(c, t, a);
    c.restore();
    if (a.label) { c.save(); c.font = "800 14px ui-rounded, system-ui"; c.textAlign = "center"; c.fillStyle = "#fff"; c.strokeStyle = "rgba(0,0,0,.5)"; c.lineWidth = 3; c.strokeText(a.label, a.x, a.y - 100 * (a.scale || 1)); c.fillText(a.label, a.x, a.y - 100 * (a.scale || 1)); c.restore(); }
  }

  // ================================================================ boucle de la scène
  function render(c, vw, vh, dt) {
    if (!S) return;
    S.t += dt;
    for (const tw of S.tweens) tw.step(dt);
    S.tweens = S.tweens.filter((tw) => !tw.done);
    const cam = S.cam, sc = Math.min(vw / (cam.w * .78), vh / (cam.w * .58));
    let sx = 0, sy = 0; if (S.shakeT > 0) { S.shakeT -= dt; sx = rnd(-1, 1) * S.shakeA; sy = rnd(-1, 1) * S.shakeA; }
    S.view = { x0: cam.x - vw / 2 / sc, x1: cam.x + vw / 2 / sc, y0: cam.y - vh / 2 / sc, y1: cam.y + vh / 2 / sc };
    c.save(); c.translate(vw / 2 + sx, vh / 2 + sy); c.scale(sc, sc); c.translate(-cam.x, -cam.y);
    (BG[S.bgName] || BG.black)(c, S.view, S.t, S.bgOpt);
    const list = [...S.actors.values()].sort((a, b) => (a.z || 0) - (b.z || 0) || a.y - b.y);
    for (const a of list) drawActor(c, a, S.t);
    if (S.bgFront) S.bgFront(c, S.view, S.t);
    drawParts(c, dt);
    c.restore();
    // éclair / flash, nuit, fondu
    if (S.tint) { c.fillStyle = S.tint; c.fillRect(0, 0, vw, vh); }
    if (S.flashA > 0) { c.globalAlpha = S.flashA; c.fillStyle = S.flashC; c.fillRect(0, 0, vw, vh); c.globalAlpha = 1; S.flashA = Math.max(0, S.flashA - dt * 2.5); }
    if (S.fadeA > 0) { c.globalAlpha = S.fadeA; c.fillStyle = S.fadeC; c.fillRect(0, 0, vw, vh); c.globalAlpha = 1; }
    // bandes noires de cinéma
    const bar = Math.round(Math.min(vh * .09, 60) * S.bars); if (bar) { c.fillStyle = "#000"; c.fillRect(0, 0, vw, bar); c.fillRect(0, vh - bar, vw, bar); }
    // titre / sous-titre
    if (S.caption) { const k = S.caption; k.t += dt; const a = Math.min(1, k.t * 1.5, (k.dur - k.t) * 1.5); if (a > 0) { c.globalAlpha = a; c.textAlign = "center"; c.fillStyle = "#fff"; c.strokeStyle = "rgba(0,0,0,.6)"; c.lineWidth = 4;
      c.font = `900 ${Math.min(34, vw / 14)}px ui-rounded, system-ui`; c.strokeText(k.text, vw / 2, vh * .44); c.fillText(k.text, vw / 2, vh * .44);
      if (k.sub) { c.font = `700 ${Math.min(17, vw / 26)}px ui-rounded, system-ui`; c.strokeText(k.sub, vw / 2, vh * .44 + 34); c.fillText(k.sub, vw / 2, vh * .44 + 34); } c.globalAlpha = 1; } }
  }

  // ================================================================ outils de mise en scène
  function tween(dur, fn) {
    return new Promise((res) => {
      if (S.skipping || dur <= 0) { fn(1); return res(); }
      const tw = { t: 0, done: false, step(dt) { if (S.skipping) { fn(1); this.done = true; return res(); } this.t += dt; const k = Math.min(1, this.t / dur); fn(k); if (k >= 1) { this.done = true; res(); } } };
      S.tweens.push(tw);
    });
  }
  function makeApi() {
    const api = {
      get t() { return S.t; }, get skipping() { return S.skipping; },
      bg(name, opt = {}) { S.bgName = name; S.bgOpt = opt; },
      opt(o) { Object.assign(S.bgOpt, o); },
      // acteur : { npc:"id" | av:avatar | creature:"kind" | boss:"B3" | item:"id" | draw(c,t,a) , x, y, dir, scale }
      add(id, o) {
        const a = Object.assign({ id, x: 0, y: 400, alpha: 1, dir: "down", scale: 1 }, o);
        if (o.npc && typeof NPC !== "undefined") { const n = NPC.get(o.npc); a.av = n.avatar; a.name = n.name; }
        if (o.me) a.av = Game.myAvatar(); if (o.partner) a.av = Game.partnerAvatar();
        S.actors.set(id, a); return a;
      },
      get: (id) => S.actors.get(id), remove(id) { S.actors.delete(id); },
      async move(a, x, y, dur = 1, e = ease) { const x0 = a.x, y0 = a.y; if (a.av) { a.walking = true; if (Math.abs(x - x0) > Math.abs(y - y0)) a.dir = x > x0 ? "right" : "left"; else a.dir = y > y0 ? "down" : "up"; }
        await tween(dur, (k) => { const q = e(k); a.x = lerp(x0, x, q); a.y = lerp(y0, y, q); }); a.walking = false; },
      async hop(a, h = 30, dur = .4) { await tween(dur, (k) => { a.bob = -Math.sin(k * Math.PI) * h; }); a.bob = 0; },
      async fadeActor(a, to, dur = 1) { const f = a.alpha; await tween(dur, (k) => { a.alpha = lerp(f, to, k); }); },
      async scaleActor(a, to, dur = 1) { const f = a.scale; await tween(dur, (k) => { a.scale = lerp(f, to, ease(k)); }); },
      face(a, dir) { a.dir = dir; },
      async cam(x, y, w = S.cam.w, dur = 1) { const c0 = { ...S.cam }; await tween(dur, (k) => { const q = ease(k); S.cam.x = lerp(c0.x, x, q); S.cam.y = lerp(c0.y, y, q); S.cam.w = lerp(c0.w, w, q); }); },
      camNow(x, y, w) { S.cam = { x, y, w: w || S.cam.w }; },
      shake(a = 8, dur = .5) { if (S.skipping) return; S.shakeA = a; S.shakeT = dur; if (navigator.vibrate && a > 6) try { navigator.vibrate(Math.min(200, dur * 300)); } catch { /* ignore */ } },
      flash(col = "#fff", a = 1) { if (S.skipping) return; S.flashC = col; S.flashA = a; },
      async fade(to, dur = 1, col = "#000") { S.fadeC = col; const f = S.fadeA; await tween(dur, (k) => { S.fadeA = lerp(f, to, k); }); },
      tint(col) { S.tint = col; },
      async barsTo(v, dur = .6) { const f = S.bars; await tween(dur, (k) => { S.bars = lerp(f, v, k); }); },
      wait: (sec) => tween(sec, () => {}),
      async say(sp, text) { if (S.skipping) return; if (typeof sp === "string") sp = NPC.speaker(sp); Music.setDuck(.6); try { await Dialog.say(sp, text); } finally { Music.setDuck(1); } },
      async lines(sp, list) { for (const t of list) { if (S.skipping) return; await api.say(sp, t); } },
      async choose(sp, text, options) { if (S.skipping) return options[0][0]; if (typeof sp === "string") sp = NPC.speaker(sp); return Dialog.choose(sp, text, options); },
      async caption(text, sub, dur = 3) { S.caption = { text, sub, dur, t: 0 }; await tween(dur, () => {}); S.caption = null; },
      music(id, fade) { Music.play(id, fade); },
      sfx(name, v) { if (!S.skipping) Music.sfx(name, v); },
      fx(kind, rate) { if (rate) S.emitters[kind] = rate; else delete S.emitters[kind]; },
      burst(kind, n) { if (!S.skipping) emit(kind, n); },
      front(fn) { S.bgFront = fn; },
      async lightning(n = 1) { for (let i = 0; i < n; i++) { if (S.skipping) return; api.flash("#dfe8ff", .9); api.sfx("thunder", .8); api.shake(5, .3); await api.wait(rnd(.2, .5)); } },
    };
    return api;
  }

  // ================================================================ lancer une cinématique
  let skipBtn = null;
  async function play(script, opts = {}) {
    S = { t: 0, bgName: "black", bgOpt: {}, actors: new Map(), tweens: [], parts: [], emitters: {}, acc: {}, cam: { x: 500, y: 300, w: 900 }, shakeT: 0, shakeA: 0,
      flashA: 0, flashC: "#fff", fadeA: 1, fadeC: "#000", bars: 1, caption: null, tint: null, skipping: false, view: { x0: 0, x1: 1000, y0: 0, y1: 600 }, bgFront: null };
    const api = makeApi();
    if (typeof Game !== "undefined") Game.enterCutscene();
    if (!skipBtn) { skipBtn = document.createElement("button"); skipBtn.className = "skip-btn"; skipBtn.textContent = "Passer ⏭"; document.body.appendChild(skipBtn); }
    skipBtn.hidden = opts.noSkip === true;
    skipBtn.onclick = (e) => { e.stopPropagation(); if (S) { S.skipping = true; skipBtn.hidden = true; Dialog.abort(); } };
    try { await script(api); }
    catch (e) { console.warn("cinématique", e); }
    finally {
      skipBtn.hidden = true;
      const end = S; S = null;
      if (typeof Game !== "undefined") Game.leaveCutscene(end);
    }
  }
  return { play, render, get active() { return Boolean(S); }, BG };
})();
