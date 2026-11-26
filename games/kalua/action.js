/* Les Échoués de Kalua — combat en temps réel (sur l'île et dans les grottes 1, 3, 5, 6, 7).
 * Ennemis et leurs comportements, projectiles, zones d'attaque annoncées (les boss préviennent avant de frapper),
 * coups du joueur, chants magiques. Pas d'endurance : seulement des temps de recharge sur les chants. */
"use strict";

const Act = (() => {
  const TAU = Math.PI * 2;
  let enemies = [], shots = [], zones = [], fx = [], env = null, inv = 0, uid = 1;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------------------------------------------------------------- types d'ennemis
  // hp, vitesse, dégâts, rayon, comportement, dessin, butin
  const E = {
    slime: { hp: 3, spd: 70, dmg: 1, r: 16, ai: "hop", draw: "slime" },
    slimeBleu: { hp: 4, spd: 80, dmg: 1, r: 16, ai: "hop", draw: "slime", col: "#6ab0f0", split: "slime" },
    racineSerpent: { hp: 3, spd: 90, dmg: 1, r: 14, ai: "burrow", draw: "racineSerpent" },
    chauve: { hp: 2, spd: 120, dmg: 1, r: 14, ai: "flyer", draw: "chauve", fly: true },
    champi: { hp: 4, spd: 0, dmg: 1, r: 16, ai: "turret", draw: "champi", shot: "spore" },
    scarabee: { hp: 4, spd: 70, dmg: 1, r: 16, ai: "charge", draw: "scarabee" },
    follet: { hp: 3, spd: 60, dmg: 1, r: 14, ai: "blink", draw: "follet", fly: true, shot: "flammeBleue" },
    squelette: { hp: 5, spd: 75, dmg: 1, r: 15, ai: "shield", draw: "squelette" },
    fantome: { hp: 4, spd: 55, dmg: 1, r: 16, ai: "ghost", draw: "fantome", fly: true },
    crapaud: { hp: 5, spd: 30, dmg: 1, r: 18, ai: "tongue", draw: "crapaud" },
    salamandre: { hp: 4, spd: 95, dmg: 1, r: 15, ai: "trail", draw: "salamandre" },
    golemLave: { hp: 8, spd: 40, dmg: 2, r: 24, ai: "tank", draw: "golemLave" },
    braise: { hp: 1, spd: 110, dmg: 2, r: 12, ai: "exploder", draw: "braise", fly: true },
    cendreux: { hp: 6, spd: 85, dmg: 1, r: 16, ai: "duelist", draw: "cendreux" },
    ermite: { hp: 4, spd: 60, dmg: 1, r: 16, ai: "shell", draw: "ermite" },
    meduse: { hp: 3, spd: 40, dmg: 1, r: 16, ai: "drift", draw: "meduse", fly: true, shock: true },
    tortuePierre: { hp: 6, spd: 45, dmg: 1, r: 20, ai: "shell", draw: "tortuePierre" },
    goeland: { hp: 2, spd: 140, dmg: 1, r: 14, ai: "dive", draw: "goeland", fly: true },
    spectreMarin: { hp: 5, spd: 60, dmg: 1, r: 16, ai: "ghost", draw: "spectreMarin", fly: true },
    automate: { hp: 6, spd: 60, dmg: 1, r: 16, ai: "shoot", draw: "automate", shot: "rouage" },
    // sur l'île
    sanglier: { hp: 4, spd: 90, dmg: 1, r: 18, ai: "charge", draw: "sanglier", drop: [["defense", 1], ["cuir", .5], ["viande", .6]] },
    croco: { hp: 6, spd: 70, dmg: 1, r: 22, ai: "chase", draw: "croco", drop: [["ecailleCroco", 1], ["viande", .5]] },
    condor: { hp: 4, spd: 130, dmg: 1, r: 16, ai: "dive", draw: "condor", fly: true, drop: [["plumeAigle", .5]] },
    golem: { hp: 9, spd: 45, dmg: 2, r: 24, ai: "tank", draw: "golemLave", drop: [["obsidienne", 1], ["cristalFeu", .3]] },
    crabeGeant: { hp: 6, spd: 60, dmg: 1, r: 24, ai: "chase", draw: "crabeGeant", drop: [["carapace", 1]] },
  };

  // ---------------------------------------------------------------- création
  function spawn(type, x, y, o = {}) {
    const d = o.def || E[type]; if (!d) return null;
    const e = Object.assign({ id: uid++, type, x, y, hx: x, hy: y, vx: 0, vy: 0, hp: Prog.foeHp(d.hp), max: Prog.foeHp(d.hp), d, st: "idle", t: rnd(0, 1), hurt: 0, stun: 0, dir: "left", up: 1, vis: 1, alive: true }, o);
    enemies.push(e); return e;
  }
  function clear() { enemies = []; shots = []; zones = []; fx = []; }

  // ---------------------------------------------------------------- environnement
  // env : { solid(x,y,r,fly) -> bool, player, onKill(e), onSpell(kind, x, y, dir), dark, scale, hurtPlayer }
  function setEnv(e) { env = e; }
  function tryMove(e, nx, ny) {
    const r = e.d ? e.d.r * .7 : 10, fly = e.d && (e.d.fly || e.st === "under");
    if (!env.solid(nx, ny, r, fly, e)) { e.x = nx; e.y = ny; return true; }
    if (!env.solid(nx, e.y, r, fly, e)) { e.x = nx; return true; }
    if (!env.solid(e.x, ny, r, fly, e)) { e.y = ny; return true; }
    return false;
  }

  // ---------------------------------------------------------------- tirs et zones
  function shot(x, y, ang, speed, o = {}) { shots.push(Object.assign({ x, y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: 8, dmg: 1, life: 0, max: 3, kind: "orb", col: "#ff7a9a", foe: true }, o)); }
  // zone annoncée : on voit où ça va frapper, puis ça frappe
  function zone(o) { zones.push(Object.assign({ t: 0, delay: .9, dur: .25, dmg: 1, shape: "circle", r: 60, col: "255,80,80", hit: false }, o)); }
  function addFx(kind, x, y, o = {}) { fx.push(Object.assign({ kind, x, y, t: 0, max: .5 }, o)); }
  const inZone = (z, p) => {
    if (z.shape === "circle") return Math.hypot(p.x - z.x, p.y - z.y) < z.r;
    if (z.shape === "ring") { const d = Math.hypot(p.x - z.x, p.y - z.y); return d > z.r - 26 && d < z.r + 6; }
    if (z.shape === "rect") return p.x > z.x - z.w / 2 && p.x < z.x + z.w / 2 && p.y > z.y - z.h / 2 && p.y < z.y + z.h / 2;
    if (z.shape === "line") { const dx = p.x - z.x, dy = p.y - z.y, c = Math.cos(z.ang), s = Math.sin(z.ang); const u = dx * c + dy * s, v = -dx * s + dy * c; return u > 0 && u < z.len && Math.abs(v) < z.w / 2; }
    return false;
  };

  // ---------------------------------------------------------------- le joueur est touché
  function hurtPlayer(n, fx0, fy0) {
    const p = env.player; if (inv > 0 || p.roll > 0 || env.cutscene) return false;
    if (p.shield > 0) { addFx("block", p.x, p.y - 30); Music.sfx("water", .6); return false; }
    inv = 1.1; const a = Math.atan2(p.y - fy0, p.x - fx0); p.kx = Math.cos(a) * 340; p.ky = Math.sin(a) * 340;
    Music.sfx("hurt"); if (navigator.vibrate) try { navigator.vibrate(60); } catch { /* ignore */ }
    if (env.shake) env.shake(6, .25);
    const dead = Prog.hurt(n);
    if (dead && env.onDeath) env.onDeath();
    return true;
  }

  // ---------------------------------------------------------------- comportements
  const AI = {
    chase(e, dt, p) { const d = dist(e, p); if (d < 340) { const a = Math.atan2(p.y - e.y, p.x - e.x); tryMove(e, e.x + Math.cos(a) * e.d.spd * dt, e.y + Math.sin(a) * e.d.spd * dt); e.dir = p.x < e.x ? "left" : "right"; e.aggro = true; } else wander(e, dt); },
    hop(e, dt, p) { e.t += dt; const ph = e.t % 1.1; if (ph < .45) { if (!e.hopA || ph < dt * 1.5) e.hopA = Math.atan2(p.y - e.y, p.x - e.x) + rnd(-.4, .4); if (dist(e, p) < 320) tryMove(e, e.x + Math.cos(e.hopA) * e.d.spd * 1.8 * dt, e.y + Math.sin(e.hopA) * e.d.spd * 1.8 * dt); e.bob = -Math.sin(ph / .45 * Math.PI) * 12; } else e.bob = 0; },
    charge(e, dt, p) {
      e.t += dt; const d = dist(e, p);
      if (e.st === "idle") { if (d < 300) { e.st = "wind"; e.t = 0; e.ca = Math.atan2(p.y - e.y, p.x - e.x); e.dir = p.x < e.x ? "left" : "right"; } else wander(e, dt); }
      else if (e.st === "wind") { e.shake = .5; if (e.t > .6) { e.st = "dash"; e.t = 0; } }
      else if (e.st === "dash") { if (!tryMove(e, e.x + Math.cos(e.ca) * 380 * dt, e.y + Math.sin(e.ca) * 380 * dt) || e.t > .55) { e.st = "tired"; e.t = 0; if (e.t < .5) addFx("dust", e.x, e.y); } }
      else if (e.st === "tired") { if (e.t > .9) { e.st = "idle"; e.t = 0; } }
    },
    flyer(e, dt, p) { e.t += dt; const a = Math.atan2(p.y - e.y, p.x - e.x) + Math.sin(e.t * 3) * 1.2; if (dist(e, p) < 360) tryMove(e, e.x + Math.cos(a) * e.d.spd * dt, e.y + Math.sin(a) * e.d.spd * dt); else wander(e, dt); },
    turret(e, dt, p) { e.t += dt; if (e.t > 2.6 && dist(e, p) < 360) { e.t = 0; e.puff = .3; const a0 = Math.atan2(p.y - e.y, p.x - e.x); for (let k = -1; k <= 1; k++) shot(e.x, e.y - 14, a0 + k * .35, 150, { col: "#d0a0e0", r: 7 }); Music.sfx("trap", .5); } e.puff = Math.max(0, (e.puff || 0) - dt); },
    burrow(e, dt, p) {
      e.t += dt;
      if (e.st === "idle" || e.st === "under") { e.st = "under"; e.up = Math.max(0, e.up - dt * 3); const a = Math.atan2(p.y - e.y, p.x - e.x); if (dist(e, p) > 40) tryMove(e, e.x + Math.cos(a) * e.d.spd * dt, e.y + Math.sin(a) * e.d.spd * dt); if (e.t > 2.2) { e.st = "pop"; e.t = 0; } }
      else if (e.st === "pop") { e.up = Math.min(1, e.up + dt * 4); if (e.t > .3 && !e.bit) { e.bit = true; if (dist(e, p) < 44) hurtPlayer(e.d.dmg, e.x, e.y); } if (e.t > 1.6) { e.st = "under"; e.t = 0; e.bit = false; } }
    },
    blink(e, dt, p) { e.t += dt; if (e.t > 2.4) { e.t = 0; addFx("poof", e.x, e.y); for (let k = 0; k < 8; k++) { const a = rnd(0, TAU), r = rnd(110, 170), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r; if (!env.solid(x, y, 10, true)) { e.x = x; e.y = y; break; } } addFx("poof", e.x, e.y); }
      if (Math.abs(e.t - 1.2) < dt) shot(e.x, e.y - 30, Math.atan2(p.y - e.y, p.x - e.x), 170, { col: "#8ad0ff", r: 8 }); },
    shield(e, dt, p) { AI.chase(e, dt * .9, p); },
    ghost(e, dt, p) { e.t += dt; e.vis = env.light ? 1 : (Math.sin(e.t * 1.4) > -.2 ? 1 : .12); const a = Math.atan2(p.y - e.y, p.x - e.x); e.x += Math.cos(a) * e.d.spd * dt; e.y += Math.sin(a) * e.d.spd * dt; e.dir = p.x < e.x ? "left" : "right"; },
    tongue(e, dt, p) { e.t += dt; e.dir = p.x < e.x ? "left" : "right"; if (e.st === "idle" && e.t > 2 && dist(e, p) < 160) { e.st = "aim"; e.t = 0; e.ta = Math.atan2(p.y - e.y, p.x - e.x); zone({ shape: "line", x: e.x, y: e.y - 10, ang: e.ta, len: 150, w: 26, delay: .7, dur: .2, dmg: 1 }); }
      else if (e.st === "aim") { e.tongue = e.t > .7 ? 150 * Math.sin(Math.min(1, (e.t - .7) / .4) * Math.PI) : 0; if (e.t > 1.2) { e.st = "idle"; e.t = 0; e.tongue = 0; } } else wander(e, dt * .5); },
    trail(e, dt, p) { AI.chase(e, dt, p); e.tr = (e.tr || 0) + dt; if (e.tr > .35) { e.tr = 0; zone({ shape: "circle", x: e.x, y: e.y, r: 14, delay: .05, dur: 1.6, dmg: 1, col: "255,140,40", quiet: true }); } },
    tank(e, dt, p) { AI.chase(e, dt, p); e.cool = Math.max(0, (e.cool || 0) - dt); },
    exploder(e, dt, p) { if (e.st === "fuse") { e.t += dt; e.shake = 1; if (e.t > .9) { zone({ shape: "circle", x: e.x, y: e.y, r: 70, delay: 0, dur: .15, dmg: e.d.dmg }); addFx("boom", e.x, e.y); Music.sfx("boom", .6); e.alive = false; } return; }
      AI.flyer(e, dt, p); if (dist(e, p) < 60) { e.st = "fuse"; e.t = 0; } },
    duelist(e, dt, p) { e.t += dt; const d = dist(e, p); e.dir = p.x < e.x ? "left" : "right";
      if (e.st === "idle") { if (d > 70) AI.chase(e, dt, p); else if (e.t > 1.2) { e.st = "slash"; e.t = 0; const a = Math.atan2(p.y - e.y, p.x - e.x); zone({ shape: "circle", x: e.x + Math.cos(a) * 40, y: e.y + Math.sin(a) * 40, r: 46, delay: .5, dur: .15, dmg: 1 }); } }
      else if (e.st === "slash" && e.t > .8) { e.st = "idle"; e.t = 0; } },
    shell(e, dt, p) { e.t += dt; if (e.st === "hide") { if (e.t > 2) { e.st = "idle"; e.t = 0; } return; } AI.chase(e, dt, p); },
    drift(e, dt, p) { e.t += dt; e.x += Math.sin(e.t * .7 + e.id) * 30 * dt; e.y += Math.cos(e.t * .5 + e.id) * 30 * dt; if (dist(e, p) < 220) { const a = Math.atan2(p.y - e.y, p.x - e.x); tryMove(e, e.x + Math.cos(a) * e.d.spd * dt, e.y + Math.sin(a) * e.d.spd * dt); } },
    dive(e, dt, p) { e.t += dt; if (e.st === "idle") { const a = e.t * 1.6 + e.id; e.x = p.x + Math.cos(a) * 160; e.y = p.y + Math.sin(a) * 90 - 20; if (e.t > 3) { e.st = "dive"; e.t = 0; e.ca = Math.atan2(p.y - e.y, p.x - e.x); } }
      else { e.x += Math.cos(e.ca) * 420 * dt; e.y += Math.sin(e.ca) * 420 * dt; if (e.t > .7) { e.st = "idle"; e.t = 0; } } e.dir = Math.cos(e.ca || 0) > 0 ? "right" : "left"; },
    shoot(e, dt, p) { e.t += dt; const d = dist(e, p), a = Math.atan2(p.y - e.y, p.x - e.x); if (d < 150) tryMove(e, e.x - Math.cos(a) * e.d.spd * dt, e.y - Math.sin(a) * e.d.spd * dt); else if (d > 260) tryMove(e, e.x + Math.cos(a) * e.d.spd * dt, e.y + Math.sin(a) * e.d.spd * dt);
      if (e.t > 1.8 && d < 400) { e.t = 0; shot(e.x, e.y - 26, a, 200, { col: "#c9a05a", r: 7, kind: "gear" }); } },
    still() {},
  };
  function wander(e, dt) { e.wt = (e.wt || 0) - dt; if (e.wt <= 0) { e.wt = rnd(1.5, 3.5); e.wa = rnd(0, TAU); e.wm = Math.random() < .6; } if (e.wm) { const nx = e.x + Math.cos(e.wa) * e.d.spd * .4 * dt, ny = e.y + Math.sin(e.wa) * e.d.spd * .4 * dt; if (Math.hypot(nx - e.hx, ny - e.hy) < 160) tryMove(e, nx, ny); else e.wa += Math.PI; e.dir = Math.cos(e.wa) < 0 ? "left" : "right"; } }

  // ---------------------------------------------------------------- coups du joueur
  // renvoie true si au moins un ennemi a été touché
  function playerHit(p, dmg, reach = 58) {
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1];
    const hx = p.x + f[0] * 30, hy = p.y - 16 + f[1] * 24; let any = false;
    for (const e of enemies) {
      if (!e.alive || e.st === "under" || e.invuln) continue;
      const d = Math.hypot(e.x - hx, (e.y - 16) - hy); if (d > reach + e.d.r * .6) continue;
      any = true;
      if (e.d.ai === "ghost" && e.vis < .5) { addFx("miss", e.x, e.y - 40); continue; }
      if (e.d.ai === "shield" && e.stun <= 0 && ((e.dir === "left" && p.x < e.x) || (e.dir === "right" && p.x > e.x))) { addFx("block", e.x, e.y - 30); Music.sfx("rock", .7); knock(e, p, 120); continue; }
      if (e.d.ai === "tank" && !(e.cool > 0)) { addFx("block", e.x, e.y - 30); Music.sfx("rock", .7); if (env.hint) env.hint("Sa carapace de lave est trop chaude… Refroidis-la avec la Marée !"); continue; }
      if (e.d.ai === "shell" && e.st === "hide") { addFx("block", e.x, e.y - 20); continue; }
      if (e.boss && e.guard) { addFx("block", e.x, e.y - 60); Music.sfx("rock", .7); if (env.hint && e.guardHint) env.hint(e.guardHint); continue; }
      damage(e, dmg, p);
      if (e.d.ai === "shell" && e.alive) { e.st = "hide"; e.t = 0; }
    }
    return any;
  }
  function knock(e, from, power) { if (e.boss) return; const a = Math.atan2(e.y - from.y, e.x - from.x); for (let i = 0; i < 6; i++) tryMove(e, e.x + Math.cos(a) * power / 30, e.y + Math.sin(a) * power / 30); }
  function damage(e, dmg, from, kind) {
    if (!e.alive) return;
    if (e.boss && e.onHit && e.onHit(e, dmg, kind) === false) return;
    e.hp -= dmg; e.hurt = .35; Music.sfx("hit"); addFx("hit", e.x + rnd(-8, 8), e.y - 24 - rnd(0, 20), { n: dmg });
    if (from) knock(e, from, 160);
    if (e.hp <= 0) kill(e);
  }
  function kill(e) {
    e.alive = false; Music.sfx("kill"); if (e.onDie) e.onDie(e); addFx("poof", e.x, e.y - 10); addFx("poof", e.x + 10, e.y - 20);
    if (e.d.split) for (let k = 0; k < 2; k++) spawn(e.d.split, e.x + rnd(-20, 20), e.y + rnd(-10, 10));
    // butin : petits cœurs et matériaux
    if (Math.random() < (e.boss ? 0 : .28)) addFx("heart", e.x, e.y, { max: 8, pick: "heart" });
    for (const [id, ch] of e.d.drop || []) if (Math.random() < ch) addFx("loot", e.x + rnd(-20, 20), e.y + rnd(-10, 10), { max: 20, pick: id });
    if (env.onKill) env.onKill(e);
  }

  // ---------------------------------------------------------------- chants (magie)
  const CD = { flamme: .7, racine: 4, maree: 6, bourrasque: 1.6, lueur: 1, onde: 3 };
  const cool = {};
  const cooldown = (sp) => Math.max(0, cool[sp] || 0);
  function cast(sp, p) {
    if (cooldown(sp) > 0) return false;
    cool[sp] = CD[sp];
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1], ang = Math.atan2(f[1], f[0]);
    if (sp === "flamme") { shot(p.x + f[0] * 20, p.y - 24 + f[1] * 10, ang, 360, { foe: false, kind: "fire", dmg: 2, r: 10, max: 1.2, col: "#ff8a3a" }); Music.sfx("fire", .7); }
    else if (sp === "racine") { for (const e of enemies) if (e.alive && dist(e, p) < 170 && !e.boss) { e.stun = 3; addFx("roots", e.x, e.y); } addFx("rootwave", p.x, p.y, { max: .6 }); Music.sfx("root"); }
    else if (sp === "maree") { p.shield = 3; addFx("bubble", p.x, p.y, { max: 3, follow: p }); for (const e of enemies) if (e.alive && dist(e, p) < 150 && e.d.ai === "tank") { e.cool = 5; addFx("steam", e.x, e.y); } Music.sfx("water"); }
    else if (sp === "bourrasque") { for (const e of enemies) { if (!e.alive || e.boss) continue; const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy); if (d < 190 && (dx * f[0] + dy * f[1]) / (d || 1) > .3) { e.stun = 1; for (let i = 0; i < 10; i++) tryMove(e, e.x + f[0] * 12, e.y + f[1] * 12); } }
      shots = shots.filter((s) => !(s.foe && Math.hypot(s.x - p.x, s.y - p.y) < 160)); addFx("gust", p.x, p.y - 20, { ang, max: .5 }); Music.sfx("wind"); }
    else if (sp === "lueur") { if (env) env.light = !env.light; addFx("flashlight", p.x, p.y, { max: .6 }); Music.sfx("light"); }
    else if (sp === "onde") { for (const e of enemies) if (e.alive && dist(e, p) < 120) { e.stun = 2; if (e.d.ai === "shield") e.stun = 3; damage(e, 1, p, "onde"); } addFx("shock", p.x, p.y, { max: .5 }); Music.sfx("boom", .5); if (env.shake) env.shake(4, .2); }
    if (env && env.onSpell) env.onSpell(sp, p.x, p.y, p.dir);
    return true;
  }

  // ---------------------------------------------------------------- mise à jour
  function update(dt) {
    if (!env) return;
    const p = env.player;
    inv = Math.max(0, inv - dt);
    for (const k in cool) cool[k] = Math.max(0, cool[k] - dt);
    if (p.shield > 0) p.shield = Math.max(0, p.shield - dt);
    for (const e of enemies) {
      if (!e.alive) continue;
      e.hurt = Math.max(0, e.hurt - dt); e.shake = Math.max(0, (e.shake || 0) - dt * 2);
      if (e.stun > 0) { e.stun -= dt; continue; }
      if (e.boss && e.brain) e.brain(e, dt, p); else (AI[e.d.ai] || AI.chase)(e, dt, p);
      // contact
      if (e.alive && e.st !== "under" && e.vis > .5 && !e.harmless && Math.hypot(e.x - p.x, (e.y - p.y) * 1.2) < e.d.r + 12) hurtPlayer(e.d.dmg, e.x, e.y);
    }
    enemies = enemies.filter((e) => e.alive || e.keep);
    // projectiles
    for (const s of shots) {
      s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.homing && s.foe) { const a = Math.atan2(p.y - 20 - s.y, p.x - s.x), sp = Math.hypot(s.vx, s.vy), cur = Math.atan2(s.vy, s.vx); let da = a - cur; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; const na = cur + Math.max(-1.5 * dt, Math.min(1.5 * dt, da)); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; }
      if (s.foe) { if (Math.hypot(s.x - p.x, s.y - (p.y - 20)) < s.r + 12) { if (hurtPlayer(s.dmg, s.x, s.y) || p.shield > 0) s.life = 99; } }
      else for (const e of enemies) if (e.alive && e.st !== "under" && Math.hypot(s.x - e.x, s.y - (e.y - 24)) < s.r + e.d.r) {
        s.life = 99;
        if (e.boss && e.guard && !(e.weak && e.weak === s.kind)) { addFx("block", e.x, e.y - 60); if (env.hint && e.guardHint) env.hint(e.guardHint); break; }
        if (e.d.ai === "tank" && s.kind === "fire" && !(e.cool > 0)) { addFx("block", e.x, e.y - 30); break; }
        damage(e, s.dmg, null, s.kind); if (s.kind === "fire" && e.d.ai === "shield") e.stun = 1;
        break;
      }
      if (env.solid(s.x, s.y, 2, true, null) && !s.ghost) { if (!s.foe && env.onShotWall) env.onShotWall(s); s.life = 99; addFx("spark", s.x, s.y); }
    }
    shots = shots.filter((s) => s.life < s.max);
    // zones annoncées
    for (const z of zones) { z.t += dt; if (z.t >= z.delay && !z.hit && inZone(z, p)) { if (hurtPlayer(z.dmg, z.x, z.y)) z.hit = true; } if (z.t >= z.delay && !z.boomed && !z.quiet) { z.boomed = true; if (z.sfx !== false) Music.sfx(z.snd || "rock", .5); } }
    zones = zones.filter((z) => z.t < z.delay + z.dur);
    // effets et butin
    for (const q of fx) { q.t += dt; if (q.follow) { q.x = q.follow.x; q.y = q.follow.y; }
      if (q.pick && q.t > .3 && Math.hypot(q.x - p.x, q.y - p.y) < 34) { q.t = q.max; if (q.pick === "heart") { Prog.heal(1); Music.sfx("pickup"); } else Prog.give(q.pick, 1); } }
    fx = fx.filter((q) => q.t < q.max);
  }

  // ---------------------------------------------------------------- dessin
  function collect(items) { for (const e of enemies) if (e.alive) items.push({ y: e.y, enemy: e }); }
  function drawEnemy(c, e, t) {
    c.save(); c.translate(e.x + (e.shake ? Math.sin(t * 60) * 2 : 0), e.y + (e.bob || 0));
    if (e.stun > 0) { c.fillStyle = "#ffe08a"; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; c.beginPath(); c.arc(Math.cos(a) * 14, -e.d.r * 2.6 + Math.sin(a) * 4, 3, 0, TAU); c.fill(); } }
    Bosses.draw(c, e.d.draw, t + e.id, { hurt: e.hurt, dir: e.dir, up: e.up, vis: e.vis, puff: e.puff, tongue: e.tongue, cool: e.cool, col: e.d.col, phase: e.phase, scale: e.scale || 1, shield: e.d.ai === "shield", shell: e.shell, core: e.core, mask: e.mask, breath: e.breath, charge: e.charge, stone: e.stone });
    if (e.st === "hide") { c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(0, -16, 18, 0, TAU); c.fill(); }
    c.restore();
    // barre de vie des boss et mini-boss
    if (e.boss && e.bar !== false) { /* dessinée dans le HUD */ }
    else if (e.hp < e.max && e.max > 2) { const w = 34; c.fillStyle = "rgba(0,0,0,.35)"; c.fillRect(e.x - w / 2, e.y - e.d.r * 3 - 12, w, 4); c.fillStyle = "#ff6a6a"; c.fillRect(e.x - w / 2, e.y - e.d.r * 3 - 12, w * e.hp / e.max, 4); }
  }
  function drawTop(c, t) {
    for (const z of zones) {
      const k = Math.min(1, z.t / Math.max(.01, z.delay)), on = z.t >= z.delay;
      c.save(); c.fillStyle = `rgba(${z.col},${on ? .55 : .12 + .2 * k})`; c.strokeStyle = `rgba(${z.col},.8)`; c.lineWidth = 2;
      if (z.shape === "circle") { c.beginPath(); c.arc(z.x, z.y, z.r, 0, TAU); c.fill(); if (!on) { c.beginPath(); c.arc(z.x, z.y, z.r * k, 0, TAU); c.stroke(); } }
      else if (z.shape === "ring") { c.lineWidth = 26; c.strokeStyle = `rgba(${z.col},${on ? .55 : .2})`; c.beginPath(); c.arc(z.x, z.y, z.r - 10, 0, TAU); c.stroke(); }
      else if (z.shape === "rect") { c.fillRect(z.x - z.w / 2, z.y - z.h / 2, z.w, z.h); }
      else if (z.shape === "line") { c.translate(z.x, z.y); c.rotate(z.ang); c.fillRect(0, -z.w / 2, z.len * (on ? 1 : k), z.w); }
      c.restore();
    }
    for (const s of shots) {
      if (s.kind === "fire") { c.fillStyle = "rgba(255,160,60,.35)"; c.beginPath(); c.arc(s.x, s.y, s.r * 1.8, 0, TAU); c.fill(); c.fillStyle = "#ff8a3a"; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); c.fillStyle = "#ffe08a"; c.beginPath(); c.arc(s.x, s.y, s.r * .5, 0, TAU); c.fill(); }
      else if (s.kind === "gear") { c.save(); c.translate(s.x, s.y); c.rotate(s.life * 10); c.fillStyle = s.col; for (let i = 0; i < 6; i++) { c.rotate(TAU / 6); c.fillRect(-2, -s.r - 2, 4, 5); } c.beginPath(); c.arc(0, 0, s.r * .8, 0, TAU); c.fill(); c.restore(); }
      else { c.fillStyle = s.col; c.globalAlpha = .35; c.beginPath(); c.arc(s.x, s.y, s.r * 1.7, 0, TAU); c.fill(); c.globalAlpha = 1; c.beginPath(); c.arc(s.x, s.y, s.r, 0, TAU); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.arc(s.x - s.r * .3, s.y - s.r * .3, s.r * .3, 0, TAU); c.fill(); }
    }
    for (const q of fx) {
      const k = q.t / q.max; c.save(); c.globalAlpha = Math.max(0, 1 - k);
      if (q.kind === "hit") { c.globalAlpha = 1 - k; c.fillStyle = "#fff"; c.font = "900 16px ui-rounded, system-ui"; c.textAlign = "center"; c.strokeStyle = "#a03040"; c.lineWidth = 3; c.strokeText("-" + q.n, q.x, q.y - k * 26); c.fillText("-" + q.n, q.x, q.y - k * 26); }
      else if (q.kind === "poof" || q.kind === "dust" || q.kind === "steam") { c.fillStyle = q.kind === "steam" ? "#e8f4ff" : "#f3e8dc"; for (let i = 0; i < 5; i++) { const a = i * 1.26; c.beginPath(); c.arc(q.x + Math.cos(a) * k * 26, q.y - 10 + Math.sin(a) * k * 14, 8 * (1 - k) + 2, 0, TAU); c.fill(); } }
      else if (q.kind === "spark" || q.kind === "block" || q.kind === "miss") { c.strokeStyle = q.kind === "block" ? "#cfe0ff" : "#ffe08a"; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * 1.05; c.beginPath(); c.moveTo(q.x + Math.cos(a) * 6, q.y + Math.sin(a) * 6); c.lineTo(q.x + Math.cos(a) * (8 + k * 14), q.y + Math.sin(a) * (8 + k * 14)); c.stroke(); } if (q.kind === "miss") { c.fillStyle = "#fff"; c.font = "800 12px system-ui"; c.textAlign = "center"; c.fillText("raté", q.x, q.y - 14); } }
      else if (q.kind === "boom") { c.fillStyle = `rgba(255,${160 - k * 100},60,${1 - k})`; c.beginPath(); c.arc(q.x, q.y - 10, 20 + k * 60, 0, TAU); c.fill(); }
      else if (q.kind === "heart") { c.globalAlpha = q.t > q.max - 2 ? (Math.floor(q.t * 8) % 2 ? .3 : 1) : 1; const b = Math.abs(Math.sin(q.t * 3)) * 4; c.fillStyle = "#ff5a7a"; c.translate(q.x, q.y - 10 - b); c.beginPath(); c.moveTo(0, 5); c.bezierCurveTo(-10, -4, -5, -11, 0, -5); c.bezierCurveTo(5, -11, 10, -4, 0, 5); c.fill(); }
      else if (q.kind === "loot") { c.globalAlpha = q.t > q.max - 3 ? (Math.floor(q.t * 8) % 2 ? .3 : 1) : 1; ITEMS.draw(c, q.pick, q.x, q.y - 12 - Math.abs(Math.sin(q.t * 3)) * 4, 22); }
      else if (q.kind === "roots") { c.strokeStyle = "#5a8a3a"; c.lineWidth = 4; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(q.x - 16 + i * 10, q.y); c.quadraticCurveTo(q.x - 20 + i * 12, q.y - 24 * Math.min(1, k * 4), q.x - 8 + i * 6, q.y - 36 * Math.min(1, k * 4)); c.stroke(); } }
      else if (q.kind === "rootwave" || q.kind === "shock" || q.kind === "flashlight") { c.strokeStyle = q.kind === "rootwave" ? "#6aaa4a" : q.kind === "shock" ? "#cfd8ff" : "#fff6c8"; c.lineWidth = 6 * (1 - k); c.beginPath(); c.ellipse(q.x, q.y - 6, 30 + k * (q.kind === "shock" ? 110 : 160), (30 + k * 140) * .55, 0, 0, TAU); c.stroke(); }
      else if (q.kind === "bubble") { c.globalAlpha = .5 + .2 * Math.sin(q.t * 8); c.strokeStyle = "#8ad0ff"; c.fillStyle = "rgba(140,210,255,.18)"; c.lineWidth = 3; c.beginPath(); c.arc(q.x, q.y - 26, 40, 0, TAU); c.fill(); c.stroke(); }
      else if (q.kind === "gust") { c.strokeStyle = "rgba(230,245,255,.9)"; c.lineWidth = 3; c.translate(q.x, q.y); c.rotate(q.ang); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(20 + k * 120, i * 14); c.quadraticCurveTo(50 + k * 140, i * 14 - 8, 80 + k * 150, i * 16); c.stroke(); } }
      c.restore();
    }
  }
  return { E, spawn, clear, setEnv, update, collect, drawEnemy, drawTop, playerHit, cast, cooldown, CD, shot, zone, addFx, damage, kill, hurtPlayer, tryMove,
    get enemies() { return enemies; }, get inv() { return inv; }, set inv(v) { inv = v; }, get env() { return env; } };
})();
