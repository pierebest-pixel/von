/* Les Échoués de Kalua — boss et mini-boss en temps réel (grottes 1, 3, 5, 6, 7).
 * Chaque boss suit une suite d'actions (une « partition ») qui change selon sa vie (phases).
 * Règle de conception : jamais « taper en continu ». Il faut esquiver des attaques annoncées,
 * trouver le moment où il est vulnérable, et souvent utiliser un chant précis. */
"use strict";

const RTBoss = (() => {
  const TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
  let A = null; // arène { x0, y0, x1, y1, cx, cy }

  // fait tourner une suite d'étapes { a: action(e,p), w: attente }
  function brainOf(def) {
    return (e, dt, p) => {
      e.t += dt; e.anim = (e.anim || 0) + dt;
      const ph = phaseOf(e, def); if (ph !== e.phase) { e.phase = ph; e.q = []; e.qw = 0; if (def.onPhase) def.onPhase(e, ph, p); }
      if (def.move) def.move(e, dt, p);
      e.qw -= dt;
      if (e.qw <= 0) { if (!e.q || !e.q.length) e.q = def.pattern(e, e.phase, p).slice(); const st = e.q.shift(); if (st.a) st.a(e, p); e.qw = st.w || 0; }
    };
  }
  const phaseOf = (e, def) => { const k = e.hp / e.max; let ph = 0; (def.phases || [1]).forEach((th, i) => { if (k <= th) ph = i; }); return ph; };

  // ---------------------------------------------------------------- petites attaques réutilisables
  const Z = (o) => Act.zone(o);
  const lines = (e, p, n, spread, len = 520, w = 40, delay = .9) => { const a0 = ang(e, p); for (let k = 0; k < n; k++) Z({ shape: "line", x: e.x, y: e.y - 10, ang: a0 + (k - (n - 1) / 2) * spread, len, w, delay, dur: .3, dmg: 1, col: "140,90,50", snd: "root" }); };
  const rain = (n, r = 40, delay = 1, col = "255,90,60", dmg = 1) => { for (let k = 0; k < n; k++) Z({ shape: "circle", x: rnd(A.x0 + 40, A.x1 - 40), y: rnd(A.y0 + 40, A.y1 - 40), r, delay: delay + rnd(0, .5), dur: .2, dmg, col }); };
  const aimed = (n, r, delay, p, col) => { for (let k = 0; k < n; k++) Z({ shape: "circle", x: p.x + rnd(-50, 50), y: p.y + rnd(-40, 40), r, delay: delay + k * .25, dur: .2, dmg: 1, col }); };
  const ring = (e, r, delay = 1, col = "255,90,60") => Z({ shape: "ring", x: e.x, y: e.y, r, delay, dur: .25, dmg: 1, col });
  const burst = (e, n, sp = 170, o = {}) => { for (let k = 0; k < n; k++) Act.shot(e.x, e.y - (o.h || 40), (k / n) * TAU + (o.off || 0), sp, o); };
  const fan = (e, p, n, spread, sp = 200, o = {}) => { const a0 = ang(e, p); for (let k = 0; k < n; k++) Act.shot(e.x, e.y - (o.h || 40), a0 + (k - (n - 1) / 2) * spread, sp, o); };
  const summon = (type, n, near) => { for (let k = 0; k < n; k++) { const x = near ? near.x + rnd(-120, 120) : rnd(A.x0 + 60, A.x1 - 60), y = near ? near.y + rnd(-80, 80) : rnd(A.y0 + 60, A.y1 - 60); if (!Act.env.solid(x, y, 14, false)) { Act.addFx("poof", x, y); Act.spawn(type, Math.max(A.x0 + 40, Math.min(A.x1 - 40, x)), Math.max(A.y0 + 40, Math.min(A.y1 - 40, y))); } } };
  const open = (e, sec) => { e.guard = false; e.core = true; e.openT = sec; };
  const close = (e) => { e.guard = true; e.core = false; };
  const minions = () => Act.enemies.filter((x) => x.alive && !x.boss).length;
  const teleport = (e, x, y) => { Act.addFx("poof", e.x, e.y - 30); e.x = x; e.y = y; Act.addFx("poof", e.x, e.y - 30); };
  const toward = (e, p, sp, dt) => { const a = ang(e, p); Act.tryMove(e, e.x + Math.cos(a) * sp * dt, e.y + Math.sin(a) * sp * dt); e.dir = p.x < e.x ? "left" : "right"; };
  const say = (txt) => { if (Act.env && Act.env.hint) Act.env.hint(txt); };

  // ================================================================ les boss
  const DEF = {
    // ---------------------------------------------------------- Grotte 1 : Mère-Racine
    mereRacine: { name: "Mère-Racine", hp: 36, r: 60, draw: "mereRacine", scale: .75, music: "bossc1", guard: true, still: true, phases: [1, .6, .3],
      guardHint: "Son écorce est trop dure… Attends qu'elle ouvre la bouche, ou brise ses quatre racines-veines !",
      intro: "La Mère-Racine se réveille. Les tombes tremblent.",
      onSpawn(e) { e.nodes = 0; const pts = [[A.x0 + 80, A.y0 + 120], [A.x1 - 80, A.y0 + 120], [A.x0 + 80, A.y1 - 70], [A.x1 - 80, A.y1 - 70]]; for (const [x, y] of pts) { const n = Act.spawn("node", x, y, { def: { hp: 3, spd: 0, dmg: 0, r: 16, ai: "still", draw: "racineSerpent" }, harmless: true, owner: e }); n.onDie = () => { e.nodes++; }; } },
      move(e, dt) { if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) close(e); } if (e.nodes >= 4 && e.guard) { e.nodes = 0; say("Les racines-veines sont brisées : la Mère-Racine est sans défense !"); open(e, 6); } },
      pattern(e, ph, p) {
        const fast = ph >= 1 ? .7 : 1;
        const base = [
          { a: (e, p) => lines(e, p, ph >= 2 ? 5 : 3, .32), w: 1.6 * fast },
          { a: () => rain(ph >= 1 ? 7 : 4, 34, 1, "120,200,90"), w: 1.4 * fast },
          { a: (e) => { Z({ shape: "circle", x: e.x, y: e.y + 60, r: 140, delay: 1.1, dur: .3, dmg: 1, col: "140,90,50", snd: "boom" }); }, w: 1.5 },
          { a: (e) => { open(e, ph >= 2 ? 2.2 : 3); Music.sfx("roar", .7); say("Sa bouche est ouverte : frappe le cœur !"); }, w: ph >= 2 ? 2.2 : 3 },
        ];
        if (ph >= 1 && minions() < 3) base.unshift({ a: () => summon("racineSerpent", 2), w: 1 });
        if (ph >= 2) base.splice(2, 0, { a: (e) => { for (let k = 1; k <= 3; k++) ring(e, 90 * k, .8 + k * .35, "140,90,50"); }, w: 2.2 });
        return base;
      } },
    // ---------------------------------------------------------- Grotte 3 : le Geôlier sans visage
    geolier: { name: "Le Geôlier sans visage", hp: 42, r: 40, draw: "geolier", scale: .7, music: "bossc3", guard: true, phases: [1, .65, .3],
      guardHint: "Dans le noir, tes coups le traversent. Allume la Lueur, et frappe-le quand il est étourdi après ses chaînes.",
      intro: "« Encore une prisonnière qui s'échappe ? Non… Pas cette fois. »",
      move(e, dt, p) { if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) close(e); } e.vis = Act.env.light ? 1 : .18; if (e.st === "walk") toward(e, p, 60, dt); },
      onPhase(e, ph) { if (ph === 1) { e.mask = true; say("Le Geôlier a retrouvé un visage… celui de son dernier prisonnier."); } if (ph === 2) { say("Il se dédouble ! Le vrai garde ses chaînes qui tintent."); for (let k = 0; k < 2; k++) { const s = Act.spawn("ombre", rnd(A.x0 + 80, A.x1 - 80), rnd(A.y0 + 80, A.y1 - 80), { def: { hp: 1, spd: 70, dmg: 1, r: 30, ai: "chase", draw: "geolier" }, scale: .7 }); s.fake = true; } } },
      pattern(e, ph, p) {
        const cells = [[A.x0 + 90, A.y0 + 100], [A.x1 - 90, A.y0 + 100], [A.x0 + 90, A.y1 - 80], [A.x1 - 90, A.y1 - 80]];
        const c = cells[Math.floor(Math.random() * 4)];
        const steps = [
          { a: (e) => { teleport(e, c[0], c[1]); e.st = "walk"; }, w: .8 },
          { a: (e, p) => fan(e, p, ph >= 1 ? 5 : 3, .25, 190, { col: "#c0c0c8", r: 7, kind: "key", homing: ph >= 1 }), w: 1.2 },
          { a: (e, p) => { e.st = "swing"; const a0 = ang(e, p); for (let k = 0; k < 6; k++) Z({ shape: "line", x: e.x, y: e.y - 10, ang: a0 - .9 + k * .36, len: 300, w: 34, delay: .7 + k * .12, dur: .15, dmg: 1, col: "150,150,170", snd: "trap" }); }, w: 1.8 },
          { a: (e) => { e.st = "dizzy"; open(e, 2.6); e.stun = 2.6; Music.sfx("bell", .4); say("Il est étourdi par ses propres chaînes !"); }, w: 2.6 },
          { a: (e, p) => { Z({ shape: "rect", x: p.x, y: p.y, w: 120, h: 120, delay: 1, dur: .3, dmg: 1, col: "120,120,160", snd: "door" }); }, w: 1.1 },
        ];
        if (ph >= 1 && minions() < 3) steps.splice(1, 0, { a: () => summon("squelette", 1), w: .6 });
        return steps;
      } },
    // ---------------------------------------------------------- Grotte 5 : la Reine Cendrée (trois temps)
    reineCendree: { name: "La Reine Cendrée", hp: 90, r: 50, draw: "reineCendree", scale: .7, music: "final", guard: true, phases: [1, .66, .33],
      guardHint: "Un voile de cendre la protège. Disperse-le avec la Bourrasque !",
      intro: "« Deux cœurs… Enfin. Donnez-les-moi, et je vivrai pour toujours. »",
      onSpawn(e) { const nG = Object.keys(Prog.P.bosses).filter((k) => /^B\d+$/.test(k)).length; e.max = e.hp = Prog.foeHp(Math.max(50, 90 - nG * 3)); }, // chaque Gardien libéré affaiblit la Reine
      move(e, dt, p) {
        if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) { close(e); e.veil = true; } }
        if (e.phase === 2) { e.fly = (e.fly || 0) + dt; e.x = A.cx + Math.cos(e.fly * .5) * (A.x1 - A.x0) * .3; e.y = A.cy - 30 + Math.sin(e.fly) * 40; }
      },
      onSpell(e, sp, p) { // les chants qui comptent contre la Reine
        if (sp === "bourrasque" && e.guard && Math.hypot(p.x - e.x, p.y - e.y) < 260) { open(e, e.phase >= 1 ? 3 : 4); Act.addFx("gust", e.x, e.y - 40, { ang: 0, max: .6 }); say("Le voile de cendre se déchire !"); }
        if (sp === "lueur" && e.phase === 2) { for (const x of Act.enemies) if (x.fake) { x.vis = .2; } say("La Lueur montre le vrai Cœur."); }
      },
      onPhase(e, ph) {
        if (ph === 1) { say("Deuxième temps : le Cœur brûle. Les chevaliers de cendre se lèvent !"); summon("cendreux", 2); }
        if (ph === 2) { say("Troisième temps : la Reine s'envole. Trouve la vraie parmi ses reflets !"); for (let k = 0; k < 2; k++) { const s = Act.spawn("reflet", rnd(A.x0 + 100, A.x1 - 100), A.cy, { def: { hp: 2, spd: 50, dmg: 1, r: 40, ai: "chase", draw: "reineCendree" }, scale: .7 }); s.fake = true; s.harmless = true; } }
      },
      pattern(e, ph, p) {
        if (ph === 0) return [
          { a: (e) => { for (let k = 1; k <= 3; k++) ring(e, 80 * k, .9 + k * .3); }, w: 2 },
          { a: (e, p) => fan(e, p, 5, .22, 180, { col: "#ff8a5a", r: 8, homing: true }), w: 1.4 },
          { a: () => rain(6, 44, 1.1), w: 1.8 },
          { a: (e, p) => aimed(3, 50, .9, p, "255,90,60"), w: 1.4 },
        ];
        if (ph === 1) return [
          { a: (e) => { const a0 = Math.random() * TAU; for (let k = 0; k < 4; k++) Z({ shape: "line", x: e.x, y: e.y - 40, ang: a0 + k * TAU / 4, len: 700, w: 46, delay: 1.1, dur: .5, dmg: 1, col: "255,120,40", snd: "fire" }); }, w: 1.8 },
          { a: () => { Z({ shape: "rect", x: A.x0 + 60, y: A.cy, w: 120, h: A.y1 - A.y0, delay: 1.2, dur: 1.5, dmg: 1, col: "255,80,30" }); Z({ shape: "rect", x: A.x1 - 60, y: A.cy, w: 120, h: A.y1 - A.y0, delay: 1.2, dur: 1.5, dmg: 1, col: "255,80,30" }); }, w: 1.6 },
          { a: (e) => burst(e, 14, 160, { col: "#ff8a5a", r: 7 }), w: 1.4 },
          { a: (e) => { if (minions() < 2) summon("braise", 2, e); }, w: .8 },
          { a: (e, p) => aimed(4, 46, .8, p, "255,90,60"), w: 1.6 },
        ];
        return [
          { a: () => rain(10, 40, .9), w: 1.4 },
          { a: (e, p) => { fan(e, p, 7, .18, 220, { col: "#ff8a5a", r: 7 }); }, w: 1.2 },
          { a: (e) => { for (let k = 1; k <= 4; k++) ring(e, 70 * k, .8 + k * .25); }, w: 1.8 },
          { a: (e, p) => aimed(5, 40, .7, p, "255,90,60"), w: 1.5 },
        ];
      } },
    // ---------------------------------------------------------- mini-boss
    verRacine: { name: "Ver-Racine", hp: 18, r: 34, draw: "verRacine", scale: .7, music: "miniboss", phases: [1, .5],
      guardHint: "Il est sous terre : attends qu'il sorte !",
      move(e, dt, p) { if (e.st === "under") { e.up = Math.max(0, e.up - dt * 3); e.guard = true; toward(e, p, 150, dt); } else { e.up = Math.min(1, e.up + dt * 3); } },
      pattern(e, ph) { return [
        { a: (e) => { e.st = "under"; }, w: ph ? 1.6 : 2.2 },
        { a: (e) => { e.st = "pop"; e.guard = false; for (let k = 1; k <= (ph ? 3 : 2); k++) ring(e, 60 * k, .3 + k * .25, "140,90,50"); Music.sfx("boom", .6); }, w: .8 },
        { a: (e, p) => lines(e, p, 1, 0, 260, 60, .7), w: 2.4 },
      ]; } },
    champiRoi: { name: "Champignon-Roi", hp: 20, r: 36, draw: "champiRoi", scale: .7, music: "miniboss", phases: [1, .5], guard: true, still: true,
      guardHint: "Son chapeau le protège… Frappe-le quand il souffle, épuisé. Le feu lui fait très mal !",
      move(e, dt) { if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) close(e); } },
      onHit(e, dmg, kind) { if (kind === "fire") { e.hp -= dmg; } },
      pattern(e, ph) { return [
        { a: (e) => { for (let k = 0; k < 3; k++) setTimeout(() => burst(e, 10, 140, { col: "#d0a0e0", r: 7, off: k * .3 }), k * 260); }, w: 1.6 },
        { a: () => rain(5, 50, 1, "200,120,220"), w: 1.4 },
        { a: () => { if (minions() < 3) summon("champi", ph ? 2 : 1); }, w: .8 },
        { a: (e) => { open(e, 2.8); e.phase2Tired = true; say("Le Champignon-Roi est essoufflé !"); }, w: 2.8 },
      ]; } },
    crapaudGeole: { name: "Crapaud-Geôle", hp: 22, r: 40, draw: "crapaudGeole", scale: .7, music: "miniboss", phases: [1, .5],
      pattern(e, ph, p) { return [
        { a: (e, p) => { e.jump = { x: p.x, y: p.y }; Z({ shape: "circle", x: p.x, y: p.y, r: 80, delay: 1, dur: .25, dmg: 1, col: "90,140,60", snd: "boom" }); e.invuln = true; }, w: 1 },
        { a: (e) => { e.x = e.jump.x; e.y = e.jump.y; e.invuln = false; ring(e, 150, .5, "90,140,60"); }, w: 1 },
        { a: (e, p) => { e.tongue = 1; lines(e, p, ph ? 3 : 1, .4, 320, 30, .7); }, w: 1.4 },
        { a: () => { for (let k = 0; k < (ph ? 4 : 2); k++) Z({ shape: "rect", x: rnd(A.x0 + 60, A.x1 - 60), y: A.cy, w: 40, h: A.y1 - A.y0, delay: 1.1, dur: .3, dmg: 1, col: "120,120,140", snd: "door" }); }, w: 1.6 },
        { a: (e) => { e.stun = 1.8; say("Il reprend son souffle !"); }, w: 1.8 },
      ]; } },
    lanternier: { name: "Le Lanternier", hp: 18, r: 30, draw: "lanternier", scale: .8, music: "miniboss", phases: [1, .5], guard: true,
      guardHint: "Sa lanterne l'aveugle de lumière. Vise la lanterne (Flamme) ou éclaire la salle avec la Lueur !",
      move(e, dt, p) { if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) close(e); } if (!e.stun || e.stun <= 0) toward(e, p, 50, dt); if (Act.env.light && e.guard && !e.lit) { e.lit = true; open(e, 4); say("La Lueur l'éblouit !"); } if (!Act.env.light) e.lit = false; },
      onHit(e, dmg, kind) { if (kind === "fire" && e.guard) { open(e, 4); e.stun = 3; say("La lanterne est tombée ! Il est aveugle !"); return false; } },
      pattern(e, ph, p) { return [
        { a: (e, p) => fan(e, p, 3, .3, 170, { col: "#8ad0ff", r: 8, homing: true }), w: 1.6 },
        { a: (e) => { if (minions() < 3) summon("follet", 1, e); }, w: 1 },
        { a: (e) => ring(e, 120, .9, "120,180,255"), w: 1.5 },
      ]; } },
    golemMagma: { name: "Golem de magma", hp: 26, r: 44, draw: "golemMagma", scale: .6, music: "miniboss", phases: [1, .5], guard: true,
      guardHint: "La lave le rend invulnérable. Refroidis-le avec la Marée (tout près de lui) !",
      move(e, dt, p) { if (e.cool > 0) { e.cool -= dt; if (e.cool <= 0) { close(e); e.cool = 0; } } else toward(e, p, 40, dt); },
      onSpell(e, sp, p) { if (sp === "maree" && Math.hypot(p.x - e.x, p.y - e.y) < 180) { e.cool = 5; open(e, 5); e.stun = 1; say("Le golem se fige : il est vulnérable !"); } },
      pattern(e, ph, p) { return [
        { a: (e) => { for (let k = 1; k <= 2; k++) ring(e, 80 * k, .8 + k * .3); }, w: 1.6 },
        { a: () => rain(ph ? 6 : 4, 46, 1), w: 1.6 },
        { a: (e, p) => lines(e, p, 2, .5, 400, 40, .9), w: 1.6 },
      ]; } },
    chevaliers: { name: "Les Chevaliers de cendre", hp: 1, r: 1, draw: "chevalierCendre", invisible: true, music: "miniboss", phases: [1],
      onSpawn(e) { e.hp = e.max = 2; e.harmless = true; e.invuln = true; e.vis = 0; e.twins = [0, 1].map((k) => { const s = Act.spawn("cendreux", A.cx + (k ? 140 : -140), A.cy, { scale: 1.6, def: { hp: 12, spd: 85, dmg: 1, r: 24, ai: "duelist", draw: "chevalierCendre" }, variant: k }); s.twin = k; return s; }); },
      move(e, dt) { const [a, b] = e.twins; const dead = e.twins.filter((s) => !s.alive);
        if (dead.length === 1) { e.rev = (e.rev || 0) + dt; if (e.rev > 8) { const d = dead[0]; d.alive = true; d.hp = Prog.foeHp(6); Act.enemies.push(d); Act.addFx("poof", d.x, d.y); say("Le chevalier se relève ! Il faut les abattre presque en même temps."); e.rev = 0; } else if (Math.floor(e.rev) !== Math.floor(e.rev - dt)) say(`Vite ! L'autre chevalier se relève dans ${Math.ceil(8 - e.rev)}…`); }
        if (dead.length === 2) { e.hp = 0; Act.kill(e); } },
      pattern() { return [{ w: 1 }]; } },
    salamandreMere: { name: "Salamandre-Mère", hp: 24, r: 40, draw: "salamandreMere", scale: .55, music: "miniboss", phases: [1, .5],
      guardHint: "Elle se cache dans la lave ! Refroidis la mare avec la Marée.",
      move(e, dt, p) { if (e.st === "lava") { e.guard = true; e.vis = .25; } else { e.vis = 1; e.guard = false; toward(e, p, 70, dt); } },
      onSpell(e, sp, p) { if (sp === "maree" && e.st === "lava" && Math.hypot(p.x - e.x, p.y - e.y) < 200) { e.st = "out"; e.stun = 3; say("La mare se fige ! La Salamandre-Mère est coincée !"); } },
      pattern(e, ph, p) { return [
        { a: (e) => { e.st = "out"; }, w: .5 },
        { a: (e, p) => lines(e, p, 1, 0, 340, 60, .8), w: 1.4 },
        { a: (e) => { if (minions() < 3) summon("salamandre", ph ? 2 : 1, e); }, w: 1 },
        { a: (e) => { e.st = "lava"; ring(e, 130, 1.2); }, w: 2.6 },
        { a: (e) => { e.st = "out"; burst(e, 10, 150, { col: "#ff8a3a", r: 7 }); }, w: 1.4 },
      ]; } },
    grandBernard: { name: "Grand Bernard", hp: 22, r: 44, draw: "grandBernard", scale: .6, music: "miniboss", phases: [1, .5], guard: true,
      guardHint: "Il est rentré dans sa coquille. Renverse-le avec une Bourrasque ou une Onde !",
      move(e, dt, p) { if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) close(e); } else toward(e, p, 45, dt); },
      onSpell(e, sp, p) { if ((sp === "bourrasque" || sp === "onde") && Math.hypot(p.x - e.x, p.y - e.y) < 220) { open(e, 4); e.stun = 4; say("Le Grand Bernard est sur le dos !"); } },
      pattern(e, ph, p) { return [
        { a: (e, p) => lines(e, p, 2, .4, 260, 40, .8), w: 1.4 },
        { a: (e, p) => { e.rolling = true; Z({ shape: "line", x: e.x, y: e.y, ang: ang(e, p), len: 500, w: 90, delay: 1, dur: .5, dmg: 1, col: "255,170,120" }); }, w: 1.6 },
        { a: () => rain(ph ? 5 : 3, 36, 1, "200,200,255"), w: 1.4 },
      ]; } },
    meduseReine: { name: "Méduse-Reine", hp: 20, r: 40, draw: "meduseReine", scale: .55, music: "miniboss", phases: [1, .5], guard: true,
      guardHint: "Son électricité la protège. Attends qu'elle recharge (elle brille)… et protège-toi avec la Marée.",
      move(e, dt, p) { if (e.openT > 0) { e.openT -= dt; if (e.openT <= 0) close(e); } e.x += Math.sin(e.anim * .7) * 40 * dt; e.y += Math.cos(e.anim * .5) * 30 * dt; },
      pattern(e, ph) { return [
        { a: (e) => { for (let k = 1; k <= 3; k++) ring(e, 70 * k, .7 + k * .3, "200,160,255"); }, w: 1.8 },
        { a: (e) => { if (minions() < 4) summon("meduse", 2, e); }, w: .8 },
        { a: (e) => burst(e, 12, 150, { col: "#e0b0ff", r: 7 }), w: 1.4 },
        { a: (e) => { open(e, 3); say("Elle recharge : c'est le moment !"); }, w: 3 },
      ]; } },
    automateGardien: { name: "Automate-Gardien", hp: 24, r: 36, draw: "automateGardien", scale: .6, music: "miniboss", phases: [1, .5],
      guardHint: "Son blindage est devant. Frappe le rouage dans son dos !",
      move(e, dt, p) { e.spin = (e.spin || 0) + dt * .8; const front = Math.cos(e.spin) > 0 ? "right" : "left"; e.dir = front; e.guard = (front === "right" && p.x > e.x) || (front === "left" && p.x < e.x); },
      pattern(e, ph, p) { return [
        { a: (e) => { for (let k = 0; k < 16; k++) setTimeout(() => Act.shot(e.x, e.y - 50, k * .5 + e.anim, 160, { col: "#c9a05a", r: 7, kind: "gear" }), k * 90); }, w: 2 },
        { a: (e, p) => fan(e, p, 3, .3, 220, { col: "#c9a05a", r: 7, kind: "gear" }), w: 1.2 },
        { a: (e, p) => { Z({ shape: "line", x: e.x, y: e.y - 20, ang: ang(e, p), len: 600, w: 30, delay: 1.1, dur: .4, dmg: 1, col: "120,220,255", snd: "light" }); }, w: 1.6 },
      ]; } },
    goelandSpectre: { name: "Goéland-Spectre", hp: 18, r: 34, draw: "goelandSpectre", scale: .6, music: "miniboss", phases: [1, .5],
      move(e, dt, p) { e.vis = Act.env.light ? 1 : .35; if (e.st !== "dive") { e.orb = (e.orb || 0) + dt; e.x = A.cx + Math.cos(e.orb) * 200; e.y = A.cy + Math.sin(e.orb) * 110; } },
      pattern(e, ph, p) { return [
        { a: (e, p) => { e.st = "aim"; e.ta = ang(e, p); Z({ shape: "line", x: e.x, y: e.y, ang: e.ta, len: 600, w: 54, delay: 1, dur: .3, dmg: 1, col: "180,200,255" }); }, w: 1 },
        { a: (e) => { e.st = "dive"; const L = 360; e.x += Math.cos(e.ta) * L; e.y += Math.sin(e.ta) * L; e.x = Math.max(A.x0 + 40, Math.min(A.x1 - 40, e.x)); e.y = Math.max(A.y0 + 40, Math.min(A.y1 - 40, e.y)); e.stun = 1.6; }, w: 1.8 },
        { a: (e, p) => { e.st = "fly"; fan(e, p, ph ? 5 : 3, .25, 200, { col: "#cfe0ff", r: 6 }); }, w: 1.4 },
      ]; } },
  };

  // ---------------------------------------------------------------- création dans une arène
  function make(id, x, y, arena) {
    A = arena; const def = DEF[id];
    const e = Act.spawn(id, x, y, { def: { hp: def.hp, spd: 0, dmg: 1, r: def.r, ai: "boss", draw: def.draw }, boss: true, name: def.name, scale: def.scale || 1, guard: Boolean(def.guard), guardHint: def.guardHint, phase: 0, q: [], qw: 1.2, keep: false, onHit: def.onHit });
    e.brain = brainOf(def); e.defId = id;
    if (def.invisible) { e.vis = 0; e.bar = false; }
    if (def.onSpawn) def.onSpawn(e);
    return e;
  }
  function onSpell(sp, p) { for (const e of Act.enemies) if (e.alive && e.boss && DEF[e.defId] && DEF[e.defId].onSpell) DEF[e.defId].onSpell(e, sp, p); }
  return { DEF, make, onSpell, setArena(a) { A = a; } };
})();
