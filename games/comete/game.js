/* Comète — moteur du jeu : ascension infinie, armes, bonus, boss en arène. */
(function () {
  "use strict";
  const { S, capsules, hudIcons, PICK } = window.Sprites;
  const T = window.PixFont.text, measure = window.PixFont.measure, wrap = window.PixFont.wrap;
  const BL = window.Bosses;
  const sfx = window.Sfx.sfx;

  const cv = document.getElementById("game");
  const ctx = cv.getContext("2d");
  let W = 180, H = 320, scale = 2, hudTop = 4, pauseBottom = 24;

  // ---------------------------------------------------------------- stockage
  const store = {
    get(k, d) { try { const v = localStorage.getItem("comete:" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("comete:" + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
  };
  let best = store.get("best", 0);
  let codex = new Set(store.get("codex", []));
  let seen = new Set(store.get("seen", []));
  let bestAlt = store.get("bestAlt", 0);
  let tutoDone = store.get("tuto", false);

  // ---------------------------------------------------------------- écran
  function insetTop() {
    let v = 0;
    const probe = (doc) => {
      const d = doc.createElement("div");
      d.style.cssText = "position:fixed;top:0;left:0;width:1px;height:env(safe-area-inset-top);visibility:hidden;pointer-events:none";
      doc.body.appendChild(d); const h = d.getBoundingClientRect().height; d.remove(); return h;
    };
    try { v = probe(document); } catch (e) { /* ignore */ }
    try { if (window.parent !== window) v = Math.max(v, probe(window.parent.document)); } catch (e) { /* ignore */ }
    return v || 0;
  }
  function resize() {
    const iw = window.innerWidth, ih = window.innerHeight;
    W = 180;
    H = Math.round(Math.min(400, Math.max(300, (W * ih) / iw)));
    scale = Math.min(iw / W, ih / H);
    cv.width = W; cv.height = H;
    cv.style.width = Math.floor(W * scale) + "px";
    cv.style.height = Math.floor(H * scale) + "px";
    ctx.imageSmoothingEnabled = false;
    const st = insetTop();
    const offTop = (ih - H * scale) / 2; // bande noire éventuelle au-dessus du jeu
    hudTop = Math.max(4, Math.ceil((st - offTop + 6) / scale));
    pauseBottom = Math.ceil((st - offTop + 52) / scale);
    if (scene === "title") layoutTitle();
  }

  // ---------------------------------------------------------------- outils
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  function wpick(table) { let s = 0; for (const k in table) s += table[k]; let r = Math.random() * s; for (const k in table) { r -= table[k]; if (r <= 0) return k; } return Object.keys(table)[0]; }
  function pixLine(x0, y0, x1, y1, col) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy; ctx.fillStyle = col;
    for (let n = 0; n < 400; n++) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  function disc(x, y, r, col) {
    ctx.fillStyle = col; x = Math.round(x); y = Math.round(y);
    for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j + r * 0.6)); ctx.fillRect(x - w, y + j, w * 2 + 1, 1); }
  }
  const fmt = (n) => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // ---------------------------------------------------------------- étoiles & décor
  const stars = [];
  for (let i = 0; i < 90; i++) stars.push({ x: Math.random() * 180, y: Math.random() * 400, z: Math.random() < 0.6 ? 0 : Math.random() < 0.7 ? 1 : 2, c: pick(["#f4f4f4", "#94b0c2", "#73eff7", "#ffcd75"]) });
  let decor = [], decorT = 3, nebT = 1;
  function updateBackground(dt, spd) {
    for (const s of stars) {
      s.y += (spd * (0.12 + s.z * 0.3) + 3 + s.z * 3) * dt;
      if (s.y > H + 2) { s.y -= H + 6; s.x = Math.random() * W; }
    }
    if (spd > 0) {
      decorT -= dt * (0.4 + spd / 120); nebT -= dt * (0.4 + spd / 120);
      if (decorT <= 0) { decorT = rnd(30, 55); const img = pick(S.planets); decor.push({ img, x: rnd(-img.width * 0.3, W - img.width * 0.7), y: -img.height, f: rnd(0.05, 0.1), back: false }); }
      if (nebT <= 0) { nebT = rnd(14, 26); const img = pick(S.nebulas); decor.unshift({ img, x: rnd(-40, W - 60), y: -img.height, f: 0.04, back: true }); }
    }
    for (const d of decor) d.y += (spd * d.f + 1.5) * dt;
    decor = decor.filter((d) => d.y < H + 10);
  }
  function drawBackground(spd, warp) {
    ctx.fillStyle = "#0b0c14"; ctx.fillRect(0, 0, W, H);
    for (const d of decor) ctx.drawImage(d.img, Math.round(d.x), Math.round(d.y));
    const streak = Math.min(14, spd / 30 + (warp || 0));
    for (const s of stars) {
      ctx.fillStyle = s.z === 0 ? "#333c57" : s.z === 1 ? "#566c86" : s.c;
      const len = s.z === 2 ? 1 + Math.floor(streak) : s.z === 1 ? 1 + Math.floor(streak * 0.5) : 1;
      ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, len);
    }
  }
  // Arène de boss : décor fixe
  let arenaArt = null;
  function makeArena(boss) {
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d");
    const pal = boss.f.pals[boss.def.pal];
    x.fillStyle = "#08070d"; x.fillRect(0, 0, W, H);
    const neb = pick(S.nebulas);
    x.globalAlpha = 1; x.drawImage(neb, W / 2 - neb.width / 2, H * 0.15); x.drawImage(neb, -30, H * 0.55);
    // nébuleuse de la couleur de la faction
    for (let j = 0; j < H; j += 1) for (let i = 0; i < W; i += 1) {
      const d = Math.hypot(i - W / 2, (j - H * 0.3) * 1.3) / (W * 0.7);
      if (d < 1 && ((i + j * 3) % 4 === 0) && Math.random() < (1 - d) * 0.45) { x.fillStyle = pal[0]; x.fillRect(i, j, 1, 1); }
    }
    for (let k = 0; k < 70; k++) { x.fillStyle = pick(["#333c57", "#566c86", "#94b0c2", "#f4f4f4"]); x.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1); }
    // piliers de l'arène
    for (const side of [0, 1]) {
      const px = side ? W - 5 : 0;
      x.fillStyle = "#1a1c2c"; x.fillRect(px, 0, 5, H);
      x.fillStyle = "#333c57"; x.fillRect(px + (side ? 1 : 0), 0, 4, H);
      x.fillStyle = "#566c86"; x.fillRect(px + (side ? 1 : 3), 0, 1, H);
      for (let j = 8; j < H; j += 24) { x.fillStyle = "#1a1c2c"; x.fillRect(px, j, 5, 3); x.fillStyle = pal[4]; x.fillRect(px + 2, j + 1, 1, 1); }
    }
    return c;
  }
  function drawArena(t) {
    ctx.drawImage(arenaArt, 0, 0);
    // champ de force qui pulse sur les côtés
    const col = R.boss ? R.boss.glow : "#73eff7";
    ctx.fillStyle = col;
    for (let j = 0; j < H; j += 6) {
      if (((j / 6) + Math.floor(t * 8)) % 5 === 0) { ctx.globalAlpha = 0.6; ctx.fillRect(5, j, 1, 3); ctx.fillRect(W - 6, j, 1, 3); }
    }
    ctx.globalAlpha = 1;
    for (const s of stars) if (s.z === 2 && (s.x | 0) % 3 === 0) { ctx.fillStyle = (Math.sin(t * 3 + s.x) > 0.6) ? "#f4f4f4" : "#566c86"; ctx.fillRect(s.x | 0, s.y | 0, 1, 1); }
  }

  // ---------------------------------------------------------------- partie
  let scene = "title", R = null, sceneT = 0;
  const WEAPON_TIME = 16;
  const WEAPONS = ["canon", "spread", "foudre", "missiles", "rayon", "onde"];
  const WEAPON_W = { canon: 4, spread: 2, foudre: 2, missiles: 2, rayon: 2, onde: 2 };

  function newRun() {
    R = {
      t: 0, scroll: 28, dist: 0, score: 0, hp: 100, maxHp: 100, x: W / 2, y: H - 50, inv: 0, dead: false,
      weapon: "laser", wlvl: 1, wtime: 0, laserLvl: 1, dmgMul: 1, fireT: 0, droneT: 0, beamTick: 0, beamOn: false,
      buffs: { bouclier: 0, drones: 0, aimant: 0, chrono: 0, surchauffe: 0, orbitales: 0 },
      bullets: [], ebs: [], enemies: [], picks: [], gems: [], parts: [], floats: [], beams: [], zaps: [], banners: [],
      mode: "ascent", modeT: 0, boss: null, arena: false, nextBoss: 2000, lastBossAt: 0, bossCount: 0, bossesRun: [],
      spawnT: 1.5, weaponT: rnd(9, 13), healT: rnd(14, 20), bonusT: rnd(16, 22), waveT: 12,
      kills: 0, shake: 0, pull: null, hurtFlash: 0, orbitA: 0, combo: 0, comboT: 0,
    };
    decor = []; decorT = 4; nebT = 1;
  }
  function startRun() {
    newRun(); scene = "play"; sceneT = 0;
    window.Sfx.music("ascent");
    if (!tutoDone) { R.tuto = 5; tutoDone = true; store.set("tuto", true); }
  }

  // ---------------------------------------------------------------- particules & textes
  function burst(x, y, n, cols, spd, life, size) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = rnd(spd * 0.2, spd);
      R.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(life * 0.5, life), max: life, col: pick(cols), size: size || (Math.random() < 0.3 ? 2 : 1) });
    }
  }
  function explosion(x, y, big) {
    burst(x, y, big ? 40 : 14, ["#ffcd75", "#ef7d57", "#b13e53", "#f4f4f4"], big ? 90 : 60, big ? 0.8 : 0.45, big ? 2 : 0);
    R.parts.push({ x, y, ring: true, r: 1, vr: big ? 90 : 60, life: 0.25, max: 0.25, col: "#ffcd75" });
  }
  function float(x, y, txt, col, dur) { R.floats.push({ x, y, txt, col: col || "#f4f4f4", t: dur || 0.9, max: dur || 0.9 }); }
  function banner(txt, col, dur, sub) { R.banners.push({ txt, col, t: dur, max: dur, sub }); }

  // ---------------------------------------------------------------- ennemis
  const ET = {
    dart: { spr: S.dart, hp: 6, pts: 15, r: 5 },
    swoop: { spr: S.swoop, hp: 9, pts: 25, r: 5 },
    jelly: { spr: S.jelly[0], hp: 16, pts: 30, r: 6 },
    turret: { spr: S.turret, hp: 34, pts: 60, r: 7 },
    kamikaze: { spr: S.kamikaze, hp: 10, pts: 35, r: 5 },
    tank: { spr: S.tank, hp: 110, pts: 200, r: 11 },
    splitter: { spr: S.splitter, hp: 26, pts: 45, r: 6 },
    mini: { spr: S.splitMini, hp: 5, pts: 10, r: 3 },
    mine: { spr: S.mine, hp: 6, pts: 20, r: 4 },
    larva: { spr: S.larva, hp: 5, pts: 10, r: 3 },
    asteroid: { spr: null, hp: 20, pts: 20, r: 6 },
  };
  function hpMul() { return 1 + R.t / 170 + R.bossCount * 0.35; }
  function spawnEnemy(type, x, y, o) {
    const d = ET[type];
    const e = Object.assign({ type, x, y, vx: 0, vy: 0, t: 0, hp: d.hp * hpMul(), r: d.r, spr: d.spr, pts: d.pts, flash: 0, shootT: rnd(0.8, 1.8) }, o || {});
    e.maxHp = e.hp;
    if (type === "asteroid") {
      const k = o && o.size != null ? o.size : (Math.random() * 3) | 0;
      e.spr = S.asteroids[k * 3 + ((Math.random() * 3) | 0)];
      e.size = k; e.r = 4 + k * 3; e.hp = (14 + k * 22) * hpMul(); e.maxHp = e.hp; e.pts = 15 + k * 15;
      e.vy = rnd(18, 34); e.vx = rnd(-8, 8);
    }
    R.enemies.push(e);
    return e;
  }
  function spawnWave() {
    const t = R.t;
    const table = { dart: 5, asteroid: 2.2 };
    if (t > 12) table.swoop = 3;
    if (t > 22) table.jelly = 3;
    if (t > 35) table.kamikaze = 2.2;
    if (t > 50) table.turret = 2.2;
    if (t > 70) table.splitter = 2;
    if (t > 90) table.mine = 1.6;
    if (t > 110) table.tank = 0.9 + Math.min(1.5, t / 400);
    const type = wpick(table);
    const x = rnd(14, W - 14);
    if (type === "dart") {
      const n = Math.random() < Math.min(0.6, t / 150) ? 3 + ((Math.random() * 3) | 0) : 1;
      for (let i = 0; i < n; i++) spawnEnemy("dart", clamp(x + (i - (n - 1) / 2) * 13, 8, W - 8), -10 - Math.abs(i - (n - 1) / 2) * 9, { vy: rnd(55, 75) });
    } else if (type === "swoop") {
      const side = Math.random() < 0.5 ? -1 : 1, n = 4 + ((Math.random() * 2) | 0), y0 = rnd(-10, 40);
      for (let i = 0; i < n; i++) spawnEnemy("swoop", side < 0 ? -10 - i * 14 : W + 10 + i * 14, y0 - i * 4, { dir: -side, y0: y0 - i * 4, delay: i * 0.18 });
    } else if (type === "jelly") spawnEnemy("jelly", x, -10, { x0: x });
    else if (type === "turret") spawnEnemy("turret", x, -12, { stopY: rnd(hudTop + 45, H * 0.4), vy: 55 });
    else if (type === "kamikaze") spawnEnemy("kamikaze", x, -10, { vy: 30 });
    else if (type === "tank") spawnEnemy("tank", clamp(x, 20, W - 20), -16, { vy: 16 });
    else if (type === "splitter") spawnEnemy("splitter", x, -10, { vy: 34, x0: x });
    else if (type === "mine") { for (let i = 0; i < 3; i++) spawnEnemy("mine", rnd(12, W - 12), -10 - i * 20, { vy: rnd(8, 16) }); }
    else spawnEnemy("asteroid", x, -14, {});
  }
  function enemyDmg() { return 8 + Math.min(10, R.t / 60) + R.bossCount * 1.2; }
  function eb(x, y, vx, vy, o) {
    const b = Object.assign({ x, y, vx, vy, r: 2, kind: "orb", col: "#ff5a6e", life: 12, dmg: enemyDmg() }, o || {});
    if (b.kind === "big") b.r = 3;
    if (b.kind === "needle") b.r = 1.5;
    if (b.kind === "missile") b.r = 3;
    if (b.kind === "mine") b.r = 3;
    R.ebs.push(b);
    return b;
  }
  function aimAt(x, y, s) { const a = Math.atan2(R.y - y, R.x - x); return [Math.cos(a) * s, Math.sin(a) * s]; }

  function updateEnemy(e, dt, sc) {
    e.t += dt;
    const fall = sc * 0.55;
    switch (e.type) {
      case "dart": e.y += (e.vy + fall) * dt; e.x += e.vx * dt; break;
      case "swoop": {
        if (e.t < e.delay) break;
        const k = e.t - e.delay;
        e.x += e.dir * 85 * dt; e.y = e.y0 + Math.sin(k * 2.4) * 22 + k * (18 + fall * 0.8);
        if (!e.shot && k > 0.9 && e.y > 0) { e.shot = true; const [vx, vy] = aimAt(e.x, e.y, 80); eb(e.x, e.y, vx, vy); }
        if ((e.dir > 0 && e.x > W + 20) || (e.dir < 0 && e.x < -20)) e.gone = true;
        break;
      }
      case "jelly": {
        e.y += (22 + fall) * dt; e.x = e.x0 + Math.sin(e.t * 1.6) * 18;
        e.spr = S.jelly[(e.t * 3 | 0) % 2];
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 0 && e.y < H * 0.7) { e.shootT = 2.2; const [vx, vy] = aimAt(e.x, e.y, 55); eb(e.x, e.y + 4, vx, vy, { col: "#73eff7" }); }
        break;
      }
      case "turret": {
        if (e.y < e.stopY && e.t < 8) e.y += e.vy * dt; else e.y += (e.t > 8 ? 50 : sc * 0.12) * dt;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 10 && e.t < 8.5) {
          e.shootT = 1.7;
          for (let k = 0; k < 3; k++) setTimeoutGame(k * 0.12, () => { if (e.hp > 0) { const [vx, vy] = aimAt(e.x, e.y + 6, 95); eb(e.x, e.y + 6, vx, vy, { kind: "needle", col: "#ffcd75" }); } });
          sfx("eshot");
        }
        break;
      }
      case "kamikaze": {
        if (e.t < 0.9) { e.y += (e.vy + fall * 0.5) * dt; }
        else {
          if (!e.lock) { e.lock = aimAt(e.x, e.y, 1); e.sp = 60; sfx("charge"); }
          e.sp = Math.min(220 + R.t * 0.3, e.sp + 300 * dt);
          e.x += e.lock[0] * e.sp * dt; e.y += e.lock[1] * e.sp * dt;
          if (Math.random() < 0.6) R.parts.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.25, max: 0.25, col: pick(["#ef7d57", "#ffcd75"]), size: 1 });
        }
        break;
      }
      case "tank": {
        e.y += (e.vy + fall * 0.4) * dt;
        e.shootT -= dt;
        if (e.shootT <= 0 && e.y > 5) {
          e.shootT = 2.3;
          const n = 5, a0 = Math.atan2(R.y - e.y, R.x - e.x);
          for (let k = 0; k < n; k++) { const a = a0 - 0.5 + k * 0.25; eb(e.x, e.y + 8, Math.cos(a) * 65, Math.sin(a) * 65, { kind: "big", col: "#ef7d57" }); }
          sfx("eshot2");
        }
        break;
      }
      case "splitter": e.y += (e.vy + fall) * dt; e.x = e.x0 + Math.sin(e.t * 2.5) * 14; break;
      case "mini": e.x += e.vx * dt; e.y += (e.vy + fall * 0.5) * dt; e.vx *= 1 - dt; break;
      case "mine":
        e.y += (e.vy + fall * 0.9) * dt;
        if (Math.hypot(e.x - R.x, e.y - R.y) < 24 && !R.dead) { e.hp = 0; killEnemy(e, true); }
        break;
      case "larva": { const [vx, vy] = aimAt(e.x, e.y, 42); e.x += vx * dt; e.y += (vy + fall * 0.3) * dt; break; }
      case "asteroid": e.x += e.vx * dt; e.y += (e.vy + fall * 1.1) * dt; break;
    }
    if (e.fromBoss && e.type === "turret" && e.t > 6) e.y += 60 * dt;
  }
  // petites minuteries de jeu (mises en pause avec le jeu)
  let gTimers = [];
  function setTimeoutGame(d, fn) { gTimers.push({ t: d, fn }); }

  function killEnemy(e, silent) {
    e.dead = true;
    R.kills++;
    R.combo++; R.comboT = 1.6;
    const mult = 1 + Math.min(4, Math.floor(R.combo / 10)) * 0.25;
    const pts = Math.round(e.pts * mult * (1 + R.bossCount * 0.2));
    R.score += pts;
    explosion(e.x, e.y, e.type === "tank");
    if (e.type === "tank") { R.shake = Math.max(R.shake, 4); sfx("boom"); } else sfx("explode");
    // cristaux
    const g = e.type === "tank" ? 6 : e.type === "asteroid" ? 1 + e.size : e.type === "mini" || e.type === "larva" ? 0 : Math.random() < 0.6 ? 1 : 0;
    for (let i = 0; i < g; i++) dropGem(e.x, e.y, e.type === "tank" && i < 2 ? 2 : Math.random() < 0.25 ? 1 : 0);
    if (e.type === "splitter") for (let i = 0; i < 3; i++) spawnEnemy("mini", e.x, e.y, { vx: (i - 1) * 50, vy: 40 + Math.random() * 20 });
    if (e.type === "mine") { const c = 8 + Math.min(6, R.bossCount); for (let i = 0; i < c; i++) { const a = Math.PI * 2 * i / c; eb(e.x, e.y, Math.cos(a) * 60, Math.sin(a) * 60, { col: "#ffcd75" }); } }
    if (e.type === "asteroid" && e.size > 0) for (let i = 0; i < 2; i++) spawnEnemy("asteroid", e.x + (i ? 4 : -4), e.y, { size: e.size - 1 }).vx = i ? 25 : -25;
    if (e.type === "tank") spawnPick(pickWeapon(), e.x, e.y);
    else if (!e.fromBoss && Math.random() < 0.035) spawnPick(pickBonus(), e.x, e.y);
    else if (!e.fromBoss && Math.random() < 0.02) spawnPick("soin", e.x, e.y);
    if (silent) return;
  }
  function damageEnemy(e, dmg, showNum) {
    if (e.dead) return;
    e.hp -= dmg; e.flash = 0.06;
    if (showNum) float(e.x + rnd(-4, 4), e.y - 6, String(Math.round(dmg)), "#a7f070", 0.5);
    if (e.hp <= 0) killEnemy(e);
    else sfx("hit");
  }
  function damageBoss(dmg, showNum, x, y) {
    const b = R.boss;
    if (!b || b.dead || b.entering > 0 || b.fade < 0.5) return false;
    b.hp -= dmg; if (b.flashCd <= 0) { b.flash = 0.04; b.flashCd = 0.14; }
    R.score += Math.round(dmg * 0.25);
    if (showNum) float((x || b.x) + rnd(-5, 5), (y || b.y) - 4, String(Math.round(dmg)), "#a7f070", 0.6);
    if (b.hp <= 0) bossDefeated();
    return true;
  }
  function bossHit(x, y, r) {
    const b = R.boss;
    if (!b || b.dead || b.entering > 0 || b.fade < 0.5) return false;
    return Math.abs(x - b.x) < b.w * 0.42 + r && Math.abs(y - b.y) < b.h * 0.42 + r;
  }

  // ---------------------------------------------------------------- bonus
  function pickWeapon() { return wpick(WEAPON_W); }
  function pickBonus() {
    const t = { bouclier: 3, drones: 3, bombe: 2, aimant: 3, chrono: 2, surchauffe: 3, orbitales: 2.5 };
    if (R.laserLvl < 4) t.puissance = 2.5;
    return wpick(t);
  }
  function spawnPick(kind, x, y) { R.picks.push({ kind, x: clamp(x, 10, W - 10), y, t: 0, vy: R.arena ? 18 : 0 }); }
  function dropGem(x, y, size) {
    const a = Math.random() * Math.PI * 2, s = rnd(20, 60);
    R.gems.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, size, t: 0 });
  }
  function collect(p) {
    const k = p.kind, info = PICK[k];
    if (info.weapon) {
      if (R.weapon === k) { R.wlvl = Math.min(3, R.wlvl + 1); float(R.x, R.y - 14, info.name + " NIV." + R.wlvl, info.col, 1.2); }
      else { R.weapon = k; R.wlvl = 1; float(R.x, R.y - 14, info.name + " !", info.col, 1.2); }
      R.wtime = WEAPON_TIME; sfx("power");
      banner(info.name + (R.wlvl > 1 ? " NIV." + R.wlvl : ""), info.col, 1.4);
      return;
    }
    switch (k) {
      case "soin": R.hp = Math.min(R.maxHp, R.hp + 25); sfx("heal"); burst(R.x, R.y, 12, ["#ff5a6e", "#f4f4f4"], 40, 0.5); break;
      case "grandsoin": R.hp = Math.min(R.maxHp, R.hp + 60); sfx("heal"); burst(R.x, R.y, 20, ["#ffcd75", "#ff5a6e", "#f4f4f4"], 50, 0.6); break;
      case "bouclier": R.buffs.bouclier = 9; sfx("shield"); break;
      case "drones": R.buffs.drones = 20; sfx("power"); break;
      case "aimant": R.buffs.aimant = 15; sfx("pickup"); break;
      case "chrono": R.buffs.chrono = 7; sfx("pickup"); break;
      case "surchauffe": R.buffs.surchauffe = 10; sfx("power"); break;
      case "orbitales": R.buffs.orbitales = 15; sfx("power"); break;
      case "puissance": R.laserLvl = Math.min(4, R.laserLvl + 1); sfx("power"); break;
      case "bombe": nova(); break;
    }
    float(R.x, R.y - 14, info.name + (k === "puissance" ? " (" + R.laserLvl + "/4)" : ""), info.col, 1.2);
  }
  function nova() {
    sfx("nova"); R.shake = 8; R.novaT = 0.6;
    R.parts.push({ x: R.x, y: R.y, ring: true, r: 2, vr: 420, life: 0.6, max: 0.6, col: "#ffcd75" });
    for (const e of R.enemies) if (!e.dead) { e.hp = 0; killEnemy(e, true); }
    for (const b of R.ebs) burst(b.x, b.y, 1, ["#ffcd75"], 20, 0.3);
    R.ebs = [];
    if (R.boss) damageBoss(220 * R.dmgMul, true);
  }

  // ---------------------------------------------------------------- tirs du joueur
  function pb(x, y, vx, vy, o) { R.bullets.push(Object.assign({ x, y, vx, vy, r: 2, dmg: 4, kind: "laser", life: 2 }, o || {})); }
  function targets() {
    const list = R.enemies.filter((e) => !e.dead && e.y > -5 && e.y < H);
    if (R.boss && !R.boss.dead && R.boss.entering <= 0 && R.boss.fade > 0.5) list.push({ x: R.boss.x, y: R.boss.y, boss: true });
    return list;
  }
  function nearest(x, y, maxD, exclude) {
    let best = null, bd = maxD;
    for (const e of targets()) {
      if (exclude && exclude.has(e.boss ? "boss" : e)) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  function fire() {
    const m = R.dmgMul, x = R.x, y = R.y - 7, L = R.wlvl;
    switch (R.weapon) {
      case "laser": {
        const l = R.laserLvl;
        const offs = l === 1 ? [[0, 0]] : l === 2 ? [[-3, 0], [3, 0]] : l === 3 ? [[-4, -0.07], [0, 0], [4, 0.07]] : [[-5, -0.1], [-2, 0], [2, 0], [5, 0.1]];
        for (const [ox, a] of offs) pb(x + ox, y, Math.sin(a) * 330, -Math.cos(a) * 330, { dmg: 4 * m, kind: "laser" });
        sfx("shot");
        return 0.085;
      }
      case "canon": {
        pb(x, y - 2, 0, -190, { dmg: (34 + L * 14) * m, r: 3 + L, kind: "canon", splash: 14 + L * 5 });
        if (L === 3) { pb(x - 6, y, -30, -180, { dmg: 26 * m, r: 3, kind: "canon", splash: 12 }); pb(x + 6, y, 30, -180, { dmg: 26 * m, r: 3, kind: "canon", splash: 12 }); }
        sfx("canon");
        return 0.34 - L * 0.04;
      }
      case "spread": {
        const n = 3 + L * 2, spr = 0.35 + L * 0.18;
        for (let k = 0; k < n; k++) { const a = -spr / 2 + spr * k / (n - 1); pb(x, y, Math.sin(a) * 290, -Math.cos(a) * 290, { dmg: 3.2 * m, kind: "needle", r: 1.5 }); }
        sfx("shot");
        return 0.13;
      }
      case "foudre": {
        const hits = new Set(); let from = { x, y }, cur = nearest(x, y, 260);
        const pts = [[x, y]];
        const jumps = 2 + L * 2;
        for (let j = 0; j < jumps && cur; j++) {
          pts.push([cur.x, cur.y]);
          hits.add(cur.boss ? "boss" : cur);
          if (cur.boss) damageBoss((14 + L * 5) * m, false); else damageEnemy(cur, (14 + L * 5) * m);
          from = cur; cur = nearest(from.x, from.y, 70, hits);
        }
        if (pts.length === 1) pts.push([x + rnd(-10, 10), y - 50]);
        R.zaps.push({ pts, t: 0.09 });
        sfx("zap");
        return 0.2 - L * 0.02;
      }
      case "missiles": {
        const n = 1 + L;
        for (let k = 0; k < n; k++) { const s = k % 2 ? 1 : -1; pb(x + s * 5, y + 3, s * (50 + k * 10), -60, { dmg: (16 + L * 3) * m, kind: "missile", r: 2, homing: true, spd: 210, life: 2.6, splash: 10 }); }
        sfx("missile");
        return 0.36;
      }
      case "rayon": return 0.05;
      case "onde": {
        pb(x, y, 0, -170, { dmg: (12 + L * 4) * m, kind: "onde", r: 4, w: 10 + L * 6, pierce: true, hit: new Set(), life: 2 });
        sfx("wave");
        return 0.3 - L * 0.03;
      }
    }
    return 0.1;
  }
  function splash(x, y, rad, dmg) {
    for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - x, e.y - y) < rad + e.r) damageEnemy(e, dmg);
    if (R.boss && bossHit(x, y, rad * 0.5)) damageBoss(dmg * 0.5, false);
  }

  // ---------------------------------------------------------------- dégâts au joueur
  function hurt(d) {
    if (R.inv > 0 || R.dead || R.mode === "warpIn" || R.mode === "warpOut") return;
    if (R.buffs.bouclier > 0) { R.buffs.bouclier = Math.max(0, R.buffs.bouclier - 1.5); R.inv = 0.4; sfx("shield"); burst(R.x, R.y, 8, ["#73eff7", "#f4f4f4"], 50, 0.3); return; }
    R.hp -= d; R.inv = 1; R.shake = Math.max(R.shake, 5); R.hurtFlash = 0.25; R.combo = 0;
    sfx("hurt"); burst(R.x, R.y, 10, ["#ff5a6e", "#f4f4f4", "#ffcd75"], 60, 0.4);
    if (R.hp <= 0) { R.hp = 0; die(); }
  }
  function die() {
    R.dead = true; R.mode = "dying"; R.modeT = 0;
    explosion(R.x, R.y, true); burst(R.x, R.y, 40, ["#41a6f6", "#73eff7", "#f4f4f4"], 80, 1.2, 2);
    sfx("bigboom"); R.shake = 10;
    window.Sfx.music(null);
  }

  // ---------------------------------------------------------------- boss
  const G = {
    get W() { return W; }, get H() { return H; },
    get player() { return R; },
    eb: (x, y, vx, vy, o) => eb(x, y, vx, vy, Object.assign({ dmg: 10 + R.bossCount * 1.2 }, o || {})),
    beam: (o) => { R.beams.push(Object.assign({ t: 0 }, o)); sfx("beamwarn"); },
    minion: (kind, x, y) => {
      const o = { fromBoss: true, vy: 55, x0: x };
      if (kind === "swoop") Object.assign(o, { dir: x < W / 2 ? 1 : -1, y0: y, delay: 0 });
      if (kind === "turret") Object.assign(o, { stopY: y + 30, vy: 40 });
      const e = spawnEnemy(kind, x, y, o);
      e.hp *= 0.7; e.pts = Math.round(e.pts / 2);
    },
    sfx: (n) => sfx(n),
    shake: (n) => { R.shake = Math.max(R.shake, n); },
    pull: (b, dur, str) => { R.pull = { b, t: dur, str }; },
    bossPhase: (b) => { sfx("phase"); R.shake = 6; banner(b.phase === 3 ? "FUREUR ULTIME !" : "IL S'ÉNERVE !", "#ff5a6e", 1.4); burst(b.x, b.y, 30, [b.glow, "#f4f4f4"], 90, 0.7); },
  };
  function chooseBoss() {
    if (window.__forceBoss != null) { const d = BL.LIST[window.__forceBoss]; window.__forceBoss = null; return d; }
    const all = BL.LIST.filter((d) => !R.bossesRun.includes(d.id));
    const fresh = all.filter((d) => !codex.has(d.id));
    const pool = fresh.length && Math.random() < 0.7 ? fresh : all.length ? all : BL.LIST;
    return pick(pool);
  }
  function triggerBoss() {
    R.mode = "alert"; R.modeT = 0;
    sfx("alarm");
    window.Sfx.music(null);
  }
  function enterArena() {
    const def = chooseBoss();
    R.bossesRun.push(def.id);
    seen.add(def.id); store.set("seen", [...seen]);
    const b = BL.create(def, R.bossCount, G);
    b.homeY = hudTop + 46 + def.h / 2;
    b.homeX = W / 2;
    R.boss = b; R.arena = true;
    arenaArt = makeArena(b);
    // on nettoie le terrain
    for (const e of R.enemies) burst(e.x, e.y, 4, ["#94b0c2"], 30, 0.3);
    R.enemies = []; R.ebs = []; R.beams = [];
    R.picks = R.picks.filter((p) => p.y > 0 && p.y < H);
    R.y = H - 50;
    R.bossIntro = 3.2;
  }
  function bossDefeated() {
    const b = R.boss;
    b.dead = true; b.timers = [];
    R.mode = "bossdie"; R.modeT = 0;
    R.ebs = []; R.beams = []; R.pull = null;
    for (const e of R.enemies) if (!e.dead) { e.hp = 0; killEnemy(e, true); }
    sfx("boom"); window.Sfx.music(null);
  }
  function bossReward() {
    const b = R.boss, def = b.def;
    const bonus = 1000 * (R.bossCount + 1) + def.rank * 150;
    R.score += bonus;
    R.bossCount++;
    R.dmgMul += 0.12;
    const firstTime = !codex.has(def.id);
    codex.add(def.id); store.set("codex", [...codex]);
    R.hp = Math.min(R.maxHp, R.hp + 40);
    banner("VICTOIRE !", "#ffcd75", 3, (firstTime ? "NOUVEAU DANS LE CODEX · " : "") + "+" + fmt(bonus) + " PTS");
    sfx("victory");
    spawnPick(pickWeapon(), W / 2 - 18, H * 0.45);
    spawnPick(pickBonus(), W / 2 + 18, H * 0.45);
    for (let i = 0; i < 14; i++) dropGem(b.x + rnd(-10, 10), b.y + rnd(-6, 6), i < 4 ? 2 : 1);
  }

  // ---------------------------------------------------------------- mise à jour
  function update(dt) {
    sceneT += dt;
    // minuteries
    if (scene === "play") {
      for (const tm of gTimers) tm.t -= dt;
      const due = gTimers.filter((tm) => tm.t <= 0); gTimers = gTimers.filter((tm) => tm.t > 0);
      due.forEach((tm) => tm.fn());
    }
    if (scene !== "play") { updateBackground(dt, scene === "title" ? 40 : 15); return; }
    R.t += R.mode === "ascent" ? dt : 0;
    R.modeT += dt;
    if (R.tuto) R.tuto -= dt;

    // vitesse d'ascension : douce au début, puis de plus en plus rapide, sans limite
    const base = 28 + 70 * (1 - Math.exp(-R.t / 160)) + R.t * 0.12;
    let sc = R.arena ? 0 : base;
    if (R.mode === "alert") sc = base * (1 + R.modeT * 0.4);
    if (R.mode === "warpIn") sc = base + R.modeT * 900;
    if (R.mode === "warpOut") sc = Math.max(base, 900 - R.modeT * 700);
    R.scroll = sc;
    updateBackground(dt, R.arena && R.mode !== "warpOut" ? 0 : sc);
    if (!R.arena) { R.dist += sc * dt; R.score += sc * dt / 9; }

    // modes
    if (R.mode === "ascent") {
      R.spawnT -= dt;
      if (R.spawnT <= 0) { R.spawnT = Math.max(0.22, 1.25 / (1 + R.t / 65)) * rnd(0.7, 1.3); spawnWave(); }
      R.weaponT -= dt; R.healT -= dt; R.bonusT -= dt;
      if (R.weaponT <= 0) { R.weaponT = rnd(13, 19); spawnPick(pickWeapon(), rnd(16, W - 16), -8); }
      if (R.healT <= 0) { R.healT = rnd(12, 20) * (R.hp < 50 ? 0.7 : 1); spawnPick(Math.random() < 0.18 ? "grandsoin" : "soin", rnd(16, W - 16), -8); }
      if (R.bonusT <= 0) { R.bonusT = rnd(15, 24); spawnPick(pickBonus(), rnd(16, W - 16), -8); }
      if (R.score >= R.nextBoss) triggerBoss();
    } else if (R.mode === "alert") {
      if (R.modeT > 2.6) { R.mode = "warpIn"; R.modeT = 0; sfx("warp"); }
    } else if (R.mode === "warpIn") {
      if (R.modeT > 1.1 && !R.arena) { enterArena(); }
      if (R.modeT > 1.5) { R.mode = "boss"; R.modeT = 0; window.Sfx.music("boss"); }
    } else if (R.mode === "boss") {
      if (R.bossIntro > 0) R.bossIntro -= dt;
      R.boss.update(dt);
    } else if (R.mode === "bossdie") {
      const b = R.boss;
      if (Math.random() < dt * 14) { explosion(b.x + rnd(-b.w / 2, b.w / 2), b.y + rnd(-b.h / 2, b.h / 2), Math.random() < 0.3); sfx("explode"); R.shake = Math.max(R.shake, 3); }
      b.t += dt; b.flash = (R.modeT * 10 | 0) % 2 ? 0.05 : 0;
      if (R.modeT > 2.2 && !R.rewarded) {
        R.rewarded = true;
        explosion(b.x, b.y, true); burst(b.x, b.y, 80, [b.glow, b.light, "#f4f4f4", "#ffcd75"], 130, 1.4, 2);
        sfx("bigboom"); R.shake = 12; R.whiteT = 0.3;
        bossReward();
      }
      if (R.modeT > 5.4) { R.mode = "warpOut"; R.modeT = 0; sfx("warp"); R.whiteT = 0.5; }
    } else if (R.mode === "warpOut") {
      if (R.modeT > 0.2 && R.arena) {
        R.arena = false; R.boss = null; R.rewarded = false;
        R.nextBoss = R.score + 3500 + R.bossCount * 1200;
        R.lastBossAt = R.score;
        R.spawnT = 2.5;
      }
      if (R.modeT > 1.2) { R.mode = "ascent"; R.modeT = 0; window.Sfx.music("ascent"); banner("ALTITUDE " + altKm() + " KM", "#73eff7", 1.6); }
    } else if (R.mode === "dying") {
      if (R.modeT > 2) gameOver();
    }

    // joueur
    const slow = R.buffs.chrono > 0 ? 0.4 : 1;
    if (!R.dead) {
      if (keys.size) {
        const sp = 150 * dt;
        if (keys.has("ArrowLeft") || keys.has("a") || keys.has("q")) R.x -= sp;
        if (keys.has("ArrowRight") || keys.has("d")) R.x += sp;
        if (keys.has("ArrowUp") || keys.has("w") || keys.has("z")) R.y -= sp;
        if (keys.has("ArrowDown") || keys.has("s")) R.y += sp;
      }
      if (R.pull && R.pull.t > 0) {
        R.pull.t -= dt;
        const a = Math.atan2(R.pull.b.y - R.y, R.pull.b.x - R.x);
        R.x += Math.cos(a) * R.pull.str * dt; R.y += Math.sin(a) * R.pull.str * dt;
      }
      R.x = clamp(R.x, 6, W - 6); R.y = clamp(R.y, hudTop + 30, H - 9);
      if (R.inv > 0) R.inv -= dt;
      for (const k in R.buffs) if (R.buffs[k] > 0) R.buffs[k] = Math.max(0, R.buffs[k] - dt);
      if (R.weapon !== "laser") { R.wtime -= dt; if (R.wtime <= 0) { R.weapon = "laser"; R.wlvl = 1; float(R.x, R.y - 14, "ARME TERMINÉE", "#94b0c2", 1); } }
      // tir automatique
      const canShoot = R.mode !== "warpIn" && R.mode !== "warpOut";
      R.beamOn = R.weapon === "rayon" && canShoot;
      R.fireT -= dt * (R.buffs.surchauffe > 0 ? 1.8 : 1);
      if (canShoot && R.fireT <= 0) R.fireT += fire();
      if (R.fireT < -0.2) R.fireT = 0;
      // rayon continu
      if (R.beamOn) {
        R.beamTick -= dt;
        if (R.beamTick <= 0) {
          R.beamTick = 0.06;
          const bw = (5 + R.wlvl * 3) / 2, d = (5 + R.wlvl * 2.5) * R.dmgMul;
          for (const e of R.enemies) if (!e.dead && e.y < R.y && e.y > -10 && Math.abs(e.x - R.x) < bw + e.r) damageEnemy(e, d);
          if (R.boss && R.boss.y < R.y && Math.abs(R.boss.x - R.x) < R.boss.w * 0.42 + bw) damageBoss(d, false);
        }
      }
      // drones
      if (R.buffs.drones > 0) {
        R.droneT -= dt;
        if (R.droneT <= 0) { R.droneT = 0.16; for (const s of [-1, 1]) pb(R.x + s * 14, R.y - 2, 0, -300, { dmg: 3 * R.dmgMul, kind: "laser" }); }
      }
      // orbitales
      if (R.buffs.orbitales > 0) {
        R.orbitA += dt * 5;
        for (let k = 0; k < 3; k++) {
          const a = R.orbitA + k * Math.PI * 2 / 3, ox = R.x + Math.cos(a) * 18, oy = R.y + Math.sin(a) * 18;
          for (const e of R.enemies) if (!e.dead && Math.hypot(e.x - ox, e.y - oy) < e.r + 4) damageEnemy(e, 45 * dt * R.dmgMul * 3);
          for (const b of R.ebs) if (Math.hypot(b.x - ox, b.y - oy) < b.r + 4) b.dead = true;
          if (R.boss && bossHit(ox, oy, 3)) damageBoss(25 * dt * R.dmgMul, false);
        }
      }
    }
    if (R.comboT > 0) { R.comboT -= dt; if (R.comboT <= 0) R.combo = 0; }

    // balles du joueur
    for (const b of R.bullets) {
      b.life -= dt;
      if (b.homing) {
        const tg = nearest(b.x, b.y, 200);
        let a = Math.atan2(b.vy, b.vx);
        if (tg) { const want = Math.atan2(tg.y - b.y, tg.x - b.x); let d = want - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; a += clamp(d, -7 * dt, 7 * dt); }
        const s = Math.min(b.spd, Math.hypot(b.vx, b.vy) + 400 * dt);
        b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s;
        if (Math.random() < 0.7) R.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.2, max: 0.2, col: pick(["#94b0c2", "#ef7d57"]), size: 1 });
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y < -10 || b.x < -10 || b.x > W + 10 || b.life <= 0) { b.dead = true; continue; }
      const hw = b.kind === "onde" ? b.w / 2 : b.r;
      for (const e of R.enemies) {
        if (e.dead || e.y < -6) continue;
        if (Math.abs(e.x - b.x) < e.r + hw && Math.abs(e.y - b.y) < e.r + b.r) {
          if (b.pierce) { if (b.hit.has(e)) continue; b.hit.add(e); damageEnemy(e, b.dmg); continue; }
          damageEnemy(e, b.dmg, b.kind === "canon");
          if (b.splash) { splash(b.x, b.y, b.splash, b.dmg * 0.5); bulletPop(b); }
          b.dead = true; break;
        }
      }
      if (!b.dead && R.boss && bossHit(b.x, b.y, hw)) {
        if (b.pierce) { if (!b.hit.has("boss")) { b.hit.add("boss"); damageBoss(b.dmg, false); } }
        else { damageBoss(b.dmg, b.kind === "canon", b.x, b.y); if (b.splash) bulletPop(b); else burst(b.x, b.y, 2, ["#f4f4f4", "#73eff7"], 30, 0.15); b.dead = true; }
      }
    }
    R.bullets = R.bullets.filter((b) => !b.dead);

    // ennemis
    for (const e of R.enemies) {
      if (e.dead) continue;
      if (e.flash > 0) e.flash -= dt;
      updateEnemy(e, dt * slow, sc);
      if (e.y > H + 30 || e.y < -80 || e.x < -60 || e.x > W + 60) e.gone = true;
      if (!R.dead && !e.dead && Math.hypot(e.x - R.x, e.y - R.y) < e.r + 3) {
        hurt(e.type === "kamikaze" ? 28 : e.type === "tank" ? 30 : 18);
        if (e.type !== "tank") { e.hp = 0; killEnemy(e); } else damageEnemy(e, 20);
      }
    }
    R.enemies = R.enemies.filter((e) => !e.dead && !e.gone);
    if (R.boss && !R.boss.dead && R.boss.entering <= 0 && !R.dead && R.boss.fade > 0.5 && Math.abs(R.boss.x - R.x) < R.boss.w * 0.38 && Math.abs(R.boss.y - R.y) < R.boss.h * 0.38) hurt(25);

    // balles ennemies
    for (const b of R.ebs) {
      const bd = dt * slow;
      b.life -= bd;
      if (b.upd) b.upd(b, bd);
      if (b.kind === "missile" && b.homing) {
        let a = Math.atan2(b.vy, b.vx); const want = Math.atan2(R.y - b.y, R.x - b.x); let d = want - a;
        while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
        a += clamp(d, -b.homing * bd, b.homing * bd);
        const s = Math.min(b.spd, Math.hypot(b.vx, b.vy) + 120 * bd);
        b.vx = Math.cos(a) * s; b.vy = Math.sin(a) * s;
        if (Math.random() < 0.5) R.parts.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.25, max: 0.25, col: "#566c86", size: 1 });
      }
      if (b.drag) { b.vx *= 1 - b.drag * bd; b.vy *= 1 - b.drag * bd; }
      if (!b.upd) b.x += b.vx * bd;
      b.y += b.vy * bd;
      if (b.life <= 0) { b.dead = true; if (b.onEnd) b.onEnd(b); continue; }
      if (b.y > H + 8 || b.y < -30 || b.x < -10 || b.x > W + 10) { b.dead = true; continue; }
      // balles destructibles (missiles, mines)
      if (b.hp) {
        for (const p of R.bullets) if (!p.dead && Math.abs(p.x - b.x) < b.r + 3 && Math.abs(p.y - b.y) < b.r + 4) { b.hp -= p.dmg; if (!p.pierce) p.dead = true; if (b.hp <= 0) break; }
        if (R.beamOn && b.y < R.y && Math.abs(b.x - R.x) < 6) b.hp -= 1;
        if (b.hp <= 0) { b.dead = true; explosion(b.x, b.y, false); R.score += 10; if (b.onEnd && b.kind === "mine") { /* mine détruite : pas d'éclats */ } continue; }
      }
      if (!R.dead && Math.hypot(b.x - R.x, b.y - R.y) < b.r + 2.5) { b.dead = true; hurt(b.dmg); }
    }
    R.ebs = R.ebs.filter((b) => !b.dead);

    // rayons des boss
    for (const bm of R.beams) {
      bm.t += dt;
      if (bm.t > bm.warn && !bm.fired) { bm.fired = true; sfx("beam"); R.shake = Math.max(R.shake, 3); }
      if (bm.fired && bm.t < bm.warn + bm.dur && !R.dead && Math.abs(R.x - bm.x) < bm.w / 2 + 2 && R.y > bm.y0) hurt(22 + R.bossCount);
    }
    R.beams = R.beams.filter((bm) => bm.t < bm.warn + bm.dur && (!R.boss || !R.boss.dead));

    // bonus
    const mag = R.buffs.aimant > 0;
    for (const p of R.picks) {
      p.t += dt;
      const d = Math.hypot(p.x - R.x, p.y - R.y);
      if (!R.dead && (mag && d < 90 || d < 20) && p.t > 0.3) { const a = Math.atan2(R.y - p.y, R.x - p.x); p.x += Math.cos(a) * 160 * dt; p.y += Math.sin(a) * 160 * dt; }
      else { p.y += (R.arena ? 14 : 18 + sc * 0.45) * dt; p.x += Math.sin(p.t * 2) * 8 * dt; }
      if (!R.dead && d < 10) { p.dead = true; collect(p); }
      if (p.y > H + 12) p.dead = true;
    }
    R.picks = R.picks.filter((p) => !p.dead);
    for (const g of R.gems) {
      g.t += dt;
      const d = Math.hypot(g.x - R.x, g.y - R.y);
      if (!R.dead && g.t > 0.35 && (mag || d < 26)) {
        const a = Math.atan2(R.y - g.y, R.x - g.x), s = mag ? 220 : 140;
        g.vx = Math.cos(a) * s; g.vy = Math.sin(a) * s;
      } else { g.vx *= 1 - 2 * dt; g.vy += (40 + sc * 0.3 - g.vy) * dt * 2; }
      g.x += g.vx * dt; g.y += g.vy * dt;
      if (!R.dead && d < 7) { g.dead = true; R.score += [5, 15, 50][g.size]; sfx("gem"); }
      if (g.y > H + 6) g.dead = true;
    }
    R.gems = R.gems.filter((g) => !g.dead);

    // particules, textes
    for (const p of R.parts) { p.life -= dt; if (p.ring) p.r += p.vr * dt; else { p.x += p.vx * dt; p.y += p.vy * dt + sc * 0.2 * dt; p.vx *= 1 - 2 * dt; p.vy *= 1 - 2 * dt; } }
    R.parts = R.parts.filter((p) => p.life > 0);
    if (R.parts.length > 500) R.parts.splice(0, R.parts.length - 500);
    for (const f of R.floats) { f.t -= dt; f.y -= 18 * dt; }
    R.floats = R.floats.filter((f) => f.t > 0);
    for (const z of R.zaps) z.t -= dt;
    R.zaps = R.zaps.filter((z) => z.t > 0);
    for (const bn of R.banners) bn.t -= dt;
    R.banners = R.banners.filter((bn) => bn.t > 0);
    if (R.shake > 0) R.shake = Math.max(0, R.shake - dt * 25);
    if (R.hurtFlash > 0) R.hurtFlash -= dt;
    if (R.whiteT > 0) R.whiteT -= dt;
    if (R.novaT > 0) R.novaT -= dt;
  }
  function bulletPop(b) {
    burst(b.x, b.y, b.kind === "canon" ? 12 : 6, b.kind === "canon" ? ["#a7f070", "#38b764", "#f4f4f4"] : ["#ef7d57", "#ffcd75"], 60, 0.35);
    R.parts.push({ x: b.x, y: b.y, ring: true, r: 1, vr: (b.splash || 10) * 4, life: 0.2, max: 0.2, col: b.kind === "canon" ? "#a7f070" : "#ffcd75" });
  }
  const altKm = () => (R.dist / 100).toFixed(1).replace(".", ",");

  function gameOver() {
    scene = "over"; sceneT = 0;
    const s = Math.floor(R.score);
    R.newBest = s > best;
    if (R.newBest) { best = s; store.set("best", best); }
    if (R.dist > bestAlt) { bestAlt = R.dist; store.set("bestAlt", bestAlt); }
    try { window.Von && Von.score(s); } catch (e) { /* ignore */ }
    sfx("gameover");
    window.Sfx.music("title");
    layoutOver();
  }

  // ---------------------------------------------------------------- dessin du jeu
  function drawPlayer() {
    if (R.dead) return;
    if (R.inv > 0 && ((R.inv * 20) | 0) % 2 === 0) return;
    const x = Math.round(R.x), y = Math.round(R.y);
    // flammes des réacteurs
    const fl = 2 + ((performance.now() / 50) | 0) % 3 + Math.min(4, R.scroll / 60 | 0);
    ctx.fillStyle = "#ef7d57"; ctx.fillRect(x - 2, y + 6, 1, fl); ctx.fillRect(x + 1, y + 6, 1, fl);
    ctx.fillStyle = "#ffcd75"; ctx.fillRect(x - 2, y + 6, 1, fl - 2); ctx.fillRect(x + 1, y + 6, 1, fl - 2);
    ctx.drawImage(S.player, x - 6, y - 7);
    if (R.buffs.bouclier > 0) {
      const blink = R.buffs.bouclier < 2 && ((R.buffs.bouclier * 8) | 0) % 2;
      if (!blink) {
        ctx.globalAlpha = 0.65;
        for (let a = 0; a < Math.PI * 2; a += 0.2) { ctx.fillStyle = (a * 5 + performance.now() / 80 | 0) % 3 ? "#73eff7" : "#f4f4f4"; ctx.fillRect(Math.round(x + Math.cos(a) * 11), Math.round(y + Math.sin(a) * 11), 1, 1); }
        ctx.globalAlpha = 1;
      }
    }
    if (R.buffs.drones > 0) for (const s of [-1, 1]) ctx.drawImage(S.drone, x + s * 14 - 2, y - 3 + Math.round(Math.sin(performance.now() / 200 + s) * 1.5));
    if (R.buffs.orbitales > 0) for (let k = 0; k < 3; k++) { const a = R.orbitA + k * Math.PI * 2 / 3; disc(x + Math.cos(a) * 18, y + Math.sin(a) * 18, 2, "#41a6f6"); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(Math.round(x + Math.cos(a) * 18), Math.round(y + Math.sin(a) * 18) - 1, 1, 1); }
    // rayon
    if (R.beamOn) {
      const bw = 5 + R.wlvl * 3, flick = ((performance.now() / 40) | 0) % 2;
      ctx.fillStyle = "#5d275d"; ctx.fillRect(x - (bw >> 1) - 1, 0, bw + 2, y - 7);
      ctx.fillStyle = "#c070ff"; ctx.fillRect(x - (bw >> 1), 0, bw, y - 7);
      ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x - Math.max(1, bw >> 2) + flick, 0, Math.max(1, bw >> 1), y - 7);
      disc(x, y - 9, 2 + R.wlvl, "#f4f4f4");
    }
  }
  function drawBullets() {
    for (const b of R.bullets) {
      const x = Math.round(b.x), y = Math.round(b.y);
      if (b.kind === "laser") { ctx.fillStyle = "#41a6f6"; ctx.fillRect(x - 1, y - 3, 2, 6); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x, y - 3, 1, 5); }
      else if (b.kind === "needle") { ctx.fillStyle = "#ffcd75"; ctx.fillRect(x, y - 2, 1, 4); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x, y - 2, 1, 1); }
      else if (b.kind === "canon") {
        const pulse = ((performance.now() / 60) | 0) % 2;
        disc(x, y, b.r + 1, "#257179"); disc(x, y, b.r, "#38b764"); disc(x, y, b.r - 1, "#a7f070");
        ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x - 1, y - 1 - pulse, 2, 2);
        if (Math.random() < 0.6) R.parts.push({ x: b.x + rnd(-2, 2), y: b.y + b.r, vx: 0, vy: 20, life: 0.25, max: 0.25, col: pick(["#a7f070", "#38b764"]), size: 1 });
      } else if (b.kind === "missile") { ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x - 1, y - 2, 2, 4); ctx.fillStyle = "#ef7d57"; ctx.fillRect(x - 1, y - 2, 2, 1); }
      else if (b.kind === "onde") {
        const hw = b.w >> 1;
        for (let i = -hw; i <= hw; i++) { const yy = y + Math.round((i * i) / (hw * 1.6)); ctx.fillStyle = Math.abs(i) > hw - 2 ? "#257179" : "#73eff7"; ctx.fillRect(x + i, yy, 1, 2); ctx.fillStyle = "#f4f4f4"; if (Math.abs(i) < hw - 2) ctx.fillRect(x + i, yy, 1, 1); }
      }
    }
    for (const z of R.zaps) {
      for (let i = 0; i < z.pts.length - 1; i++) {
        const [x0, y0] = z.pts[i], [x1, y1] = z.pts[i + 1];
        const mx = (x0 + x1) / 2 + rnd(-6, 6), my = (y0 + y1) / 2 + rnd(-6, 6);
        pixLine(x0, y0, mx, my, "#73eff7"); pixLine(mx, my, x1, y1, "#73eff7");
        pixLine(x0 + 1, y0, mx + 1, my, "#f4f4f4");
      }
    }
  }
  function drawEnemyBullets() {
    for (const b of R.ebs) {
      const x = Math.round(b.x), y = Math.round(b.y);
      if (b.kind === "needle") { ctx.fillStyle = "#0b0c14"; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = b.col; ctx.fillRect(x - 1, y - 1, 2, 2); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x - 1, y - 1, 1, 1); }
      else if (b.kind === "missile") { ctx.fillStyle = "#0b0c14"; ctx.fillRect(x - 2, y - 3, 5, 6); ctx.fillStyle = "#b13e53"; ctx.fillRect(x - 1, y - 2, 3, 4); ctx.fillStyle = "#ffcd75"; ctx.fillRect(x, y + ((performance.now() / 80 | 0) % 2), 1, 1); }
      else if (b.kind === "mine") { disc(x, y, 4, "#0b0c14"); disc(x, y, 3, "#b13e53"); ctx.fillStyle = ((performance.now() / 120) | 0) % 2 ? "#ffcd75" : "#f4f4f4"; ctx.fillRect(x - 1, y - 1, 2, 2); }
      else if (b.kind === "big") { disc(x, y, 4, "#0b0c14"); disc(x, y, 3, b.rim || b.col); disc(x, y, 2, b.col); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x - 1, y - 1, 1, 1); }
      else { ctx.fillStyle = "#0b0c14"; ctx.fillRect(x - 2, y - 1, 5, 3); ctx.fillRect(x - 1, y - 2, 3, 5); ctx.fillStyle = b.col; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x, y, 1, 1); }
    }
  }
  function drawEnemies() {
    for (const e of R.enemies) {
      const s = e.spr;
      let x = Math.round(e.x - s.width / 2), y = Math.round(e.y - s.height / 2);
      if (e.type === "kamikaze" && !e.lock && ((e.t * 12) | 0) % 2) { ctx.drawImage(s.flash, x, y); continue; }
      ctx.drawImage(e.flash > 0 ? s.flash : s, x, y);
      if ((e.type === "tank" || e.type === "turret") && e.hp < e.maxHp) {
        ctx.fillStyle = "#1a1c2c"; ctx.fillRect(x, y - 3, s.width, 2);
        ctx.fillStyle = "#ff5a6e"; ctx.fillRect(x, y - 3, Math.round(s.width * Math.max(0, e.hp / e.maxHp)), 2);
      }
    }
  }
  function drawPicks() {
    for (const p of R.picks) {
      const bob = Math.round(Math.sin(p.t * 5)), c = capsules[p.kind];
      const x = Math.round(p.x - 6), y = Math.round(p.y - 6 + bob);
      if (((p.t * 6) | 0) % 6 === 0) { ctx.globalAlpha = 0.5; disc(p.x, p.y + bob, 9, PICK[p.kind].col); ctx.globalAlpha = 1; }
      ctx.drawImage(c, x, y);
    }
    for (const g of R.gems) { const s = S.gem[g.size]; ctx.drawImage(s, Math.round(g.x - s.width / 2), Math.round(g.y - s.height / 2)); }
  }
  function drawBeams() {
    for (const bm of R.beams) {
      const x = Math.round(bm.x), y0 = Math.round(bm.y0);
      if (bm.t < bm.warn) {
        if (((bm.t * 14) | 0) % 2) { ctx.fillStyle = bm.col; ctx.globalAlpha = 0.7; ctx.fillRect(x, y0, 1, H - y0); ctx.fillRect(x - (bm.w >> 1), y0, 1, H - y0); ctx.fillRect(x + (bm.w >> 1), y0, 1, H - y0); ctx.globalAlpha = 1; }
      } else {
        const k = (bm.t - bm.warn) / bm.dur, w = Math.round(bm.w * (k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1));
        ctx.fillStyle = "#0b0c14"; ctx.fillRect(x - (w >> 1) - 1, y0, w + 2, H - y0);
        ctx.fillStyle = bm.col; ctx.fillRect(x - (w >> 1), y0, w, H - y0);
        ctx.fillStyle = "#f4f4f4"; ctx.fillRect(x - (w >> 2), y0, Math.max(1, w >> 1), H - y0);
        disc(x, y0, (w >> 1) + 2, bm.col);
      }
    }
  }
  function drawParts() {
    for (const p of R.parts) {
      const a = p.life / p.max;
      if (p.ring) {
        ctx.fillStyle = p.col; ctx.globalAlpha = a;
        const n = Math.max(12, p.r * 1.5 | 0);
        for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; ctx.fillRect(Math.round(p.x + Math.cos(t) * p.r), Math.round(p.y + Math.sin(t) * p.r), 1, 1); }
        ctx.globalAlpha = 1; continue;
      }
      ctx.fillStyle = a < 0.3 ? "#5d275d" : p.col;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }
  }
  function bar(x, y, w, h, k, col, back) {
    ctx.fillStyle = "#0b0c14"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = back || "#333c57"; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col; ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), h);
    ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(x, y, Math.round(w * clamp(k, 0, 1)), 1);
  }
  function drawHUD() {
    const m = hudTop;
    // vie
    const k = R.hp / R.maxHp;
    const col = k > 0.5 ? "#38b764" : k > 0.25 ? "#ffcd75" : "#ff5a6e";
    const low = k <= 0.25 && ((performance.now() / 200) | 0) % 2;
    T(ctx, "♥", 4, m, low ? "#f4f4f4" : "#ff5a6e", { outline: "#0b0c14" });
    bar(12, m, 56, 5, k, col);
    T(ctx, String(Math.ceil(R.hp)), 72, m, "#f4f4f4", { outline: "#0b0c14" });
    // score
    T(ctx, fmt(R.score), 4, m + 9, "#ffcd75", { outline: "#0b0c14" });
    if (R.combo >= 10) T(ctx, "×" + (1 + Math.min(4, Math.floor(R.combo / 10)) * 0.25).toFixed(2).replace(".", ","), 6 + measure(fmt(R.score)) + 3, m + 9, "#ef7d57", { outline: "#0b0c14" });
    // progression vers le boss
    if (!R.arena) {
      const span = R.nextBoss - R.lastBossAt, kb = (R.score - R.lastBossAt) / span;
      T(ctx, "BOSS", 4, m + 17, "#b13e53", { outline: "#0b0c14" });
      bar(22, m + 18, 40, 2, kb, kb > 0.85 && ((performance.now() / 150) | 0) % 2 ? "#f4f4f4" : "#b13e53", "#1a1c2c");
    }
    // altitude (sous le bouton pause)
    T(ctx, altKm() + " KM", W - 4, Math.max(m, pauseBottom), "#73eff7", { align: "right", outline: "#0b0c14" });
    // arme + bonus actifs
    let ix = 4; const iy = m + (R.arena ? 17 : 24);
    const items = [];
    if (R.weapon !== "laser") items.push([R.weapon, R.wtime / WEAPON_TIME, R.wlvl]);
    else items.push(["puissance", 1, R.laserLvl]);
    for (const b of ["bouclier", "drones", "aimant", "chrono", "surchauffe", "orbitales"]) if (R.buffs[b] > 0) items.push([b, R.buffs[b] / ({ bouclier: 9, drones: 20, aimant: 15, chrono: 7, surchauffe: 10, orbitales: 15 })[b]]);
    for (const [kk, f, lv] of items) {
      ctx.drawImage(hudIcons[kk], ix, iy);
      ctx.fillStyle = "#0b0c14"; ctx.fillRect(ix, iy + 8, 7, 2);
      ctx.fillStyle = PICK[kk].col; ctx.fillRect(ix, iy + 8, Math.round(7 * clamp(f, 0, 1)), 1);
      if (lv) T(ctx, String(lv), ix + 8, iy + 1, "#f4f4f4", { outline: "#0b0c14" });
      ix += lv ? 14 : 10;
    }
    // boss
    if (R.boss && (R.mode === "boss" || R.mode === "bossdie")) {
      const b = R.boss, y = m + 30;
      T(ctx, b.def.name, W / 2, y, "#f4f4f4", { align: "center", outline: "#0b0c14" });
      const bw = W - 24;
      bar(12, y + 8, bw, 4, b.hp / b.maxHp, b.phase > 1 ? "#ff5a6e" : b.glow, "#1a1c2c");
      ctx.fillStyle = "#0b0c14"; ctx.fillRect(12 + (bw >> 1), y + 8, 1, 4);
    }
  }
  function drawBanners() {
    let y = H * 0.36;
    for (const bn of R.banners) {
      const k = bn.t / bn.max, a = Math.min(1, bn.t * 4, (bn.max - bn.t) * 6);
      ctx.globalAlpha = a;
      const s = bn.txt.length > 12 ? 2 : 3;
      T(ctx, bn.txt, W / 2, y, bn.col, { align: "center", scale: s, outline: "#0b0c14" });
      if (bn.sub) T(ctx, bn.sub, W / 2, y + 7 * s, "#f4f4f4", { align: "center", outline: "#0b0c14" });
      ctx.globalAlpha = 1;
      y += 26; void k;
    }
  }
  function drawPlay() {
    const warp = R.mode === "warpIn" ? R.modeT * 12 : R.mode === "warpOut" ? Math.max(0, 12 - R.modeT * 14) : 0;
    ctx.save();
    if (R.shake > 0) ctx.translate(Math.round(rnd(-R.shake, R.shake) * 0.5), Math.round(rnd(-R.shake, R.shake) * 0.5));
    if (R.arena && R.mode !== "warpIn") drawArena(R.modeT + R.t); else drawBackground(R.scroll, warp);
    drawBeams();
    drawPicks();
    drawEnemies();
    if (R.boss) { if (R.mode !== "warpOut" && (R.mode !== "bossdie" || !R.rewarded)) R.boss.draw(ctx, G); }
    drawBullets();
    drawPlayer();
    drawEnemyBullets();
    drawParts();
    for (const f of R.floats) { ctx.globalAlpha = Math.min(1, f.t / f.max * 2); T(ctx, f.txt, f.x, f.y, f.col, { align: "center", outline: "#0b0c14" }); }
    ctx.globalAlpha = 1;
    ctx.restore();
    // voile rouge quand on est touché
    if (R.hurtFlash > 0) { ctx.fillStyle = "#b13e53"; ctx.globalAlpha = R.hurtFlash * 1.6; ctx.fillRect(0, 0, W, 3); ctx.fillRect(0, H - 3, W, 3); ctx.fillRect(0, 0, 3, H); ctx.fillRect(W - 3, 0, 3, H); ctx.globalAlpha = 1; }
    if (R.novaT > 0) { ctx.fillStyle = "#ffcd75"; ctx.globalAlpha = R.novaT * 0.6; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (R.whiteT > 0) { ctx.fillStyle = "#f4f4f4"; ctx.globalAlpha = Math.min(1, R.whiteT * 2.5); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    if (R.mode === "warpIn" && R.modeT > 0.8) { ctx.fillStyle = "#f4f4f4"; ctx.globalAlpha = Math.max(0, 1 - Math.abs(R.modeT - 1.15) * 3); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    drawHUD();
    drawBanners();
    // alerte boss
    if (R.mode === "alert") {
      const on = ((R.modeT * 4) | 0) % 2 === 0;
      ctx.fillStyle = "#b13e53"; ctx.globalAlpha = on ? 0.25 : 0.1; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      const y = H * 0.4;
      ctx.fillStyle = "#0b0c14"; ctx.fillRect(0, y - 6, W, 30);
      for (let i = -2; i < W / 8 + 2; i++) { const x = i * 8 + ((R.modeT * 30) | 0) % 8; ctx.fillStyle = "#ffcd75"; ctx.fillRect(x, y - 6, 4, 2); ctx.fillRect(x - 3, y + 22, 4, 2); }
      if (on) T(ctx, "ALERTE", W / 2, y, "#ff5a6e", { align: "center", scale: 3 });
      T(ctx, "BOSS EN APPROCHE", W / 2, y + 15, "#f4f4f4", { align: "center" });
    }
    // présentation du boss
    if (R.mode === "boss" && R.bossIntro > 0 && R.boss) {
      const b = R.boss, a = Math.min(1, R.bossIntro * 2, (3.2 - R.bossIntro) * 3);
      ctx.globalAlpha = a;
      const y = H * 0.55;
      ctx.fillStyle = "#0b0c14"; ctx.fillRect(0, y - 8, W, 40);
      ctx.fillStyle = b.glow; ctx.fillRect(0, y - 8, W, 1); ctx.fillRect(0, y + 31, W, 1);
      T(ctx, "BOSS N°" + String(b.def.id + 1).padStart(3, "0") + "/100", W / 2, y - 4, b.glow, { align: "center" });
      const s = measure(b.def.name) * 2 > W - 10 ? 1 : 2;
      T(ctx, b.def.name, W / 2, y + 4, "#f4f4f4", { align: "center", scale: s });
      T(ctx, b.def.title, W / 2, y + 4 + 6 * s + 2, "#94b0c2", { align: "center" });
      T(ctx, "« " + b.f.motto + " »", W / 2, y + 24, "#ffcd75", { align: "center" });
      ctx.globalAlpha = 1;
    }
    if (R.tuto > 0 && R.mode === "ascent") {
      ctx.globalAlpha = Math.min(1, R.tuto);
      T(ctx, "GLISSE TON DOIGT POUR PILOTER", W / 2, H * 0.62, "#f4f4f4", { align: "center", outline: "#0b0c14" });
      T(ctx, "LE VAISSEAU TIRE TOUT SEUL !", W / 2, H * 0.62 + 9, "#73eff7", { align: "center", outline: "#0b0c14" });
      T(ctx, "RAMASSE LES CAPSULES", W / 2, H * 0.62 + 18, "#ffcd75", { align: "center", outline: "#0b0c14" });
      ctx.globalAlpha = 1;
    }
  }

  // ---------------------------------------------------------------- menus (boutons dessinés)
  let buttons = [];
  function btn(label, x, y, w, h, fn, col) { buttons.push({ label, x, y, w, h, fn, col: col || "#3b5dc9", down: false }); }
  function drawButtons() {
    for (const b of buttons) {
      const press = b.down ? 1 : 0;
      ctx.fillStyle = "#0b0c14"; ctx.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 3);
      ctx.fillStyle = "#1a1c2c"; ctx.fillRect(b.x, b.y + 2, b.w, b.h);
      ctx.fillStyle = b.col; ctx.fillRect(b.x, b.y + press, b.w, b.h);
      ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect(b.x + 1, b.y + press + 1, b.w - 2, 1);
      T(ctx, b.label, b.x + b.w / 2, b.y + press + Math.floor((b.h - 5) / 2), "#f4f4f4", { align: "center", shadow: "#0b0c14" });
    }
  }
  function layoutTitle() {
    buttons = [];
    btn("DÉCOLLER", W / 2 - 50, H * 0.62, 100, 17, () => { sfx("select"); startRun(); }, "#b13e53");
    btn("CODEX DES BOSS  " + codex.size + "/100", W / 2 - 60, H * 0.62 + 26, 120, 15, () => { sfx("select"); scene = "codex"; codexSel = null; layoutCodex(); }, "#29366f");
  }
  function layoutOver() {
    buttons = [];
    btn("REJOUER", W / 2 - 45, H * 0.7, 90, 17, () => { sfx("select"); startRun(); }, "#b13e53");
    btn("MENU", W / 2 - 45, H * 0.7 + 25, 90, 15, () => { sfx("select"); toTitle(); }, "#29366f");
  }
  let codexSel = null, codexTop = 40;
  function layoutCodex() {
    buttons = [];
    btn("RETOUR", 6, H - 22, 52, 15, () => { sfx("select"); toTitle(); }, "#29366f");
  }
  function toTitle() { scene = "title"; sceneT = 0; layoutTitle(); window.Sfx.music("title"); }

  // logo « COMÈTE » en grosses lettres pixel 5×7
  const LOGO = {
    C: [".###.", "#...#", "#....", "#....", "#....", "#...#", ".###."],
    O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
    M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
    E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
    T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  };
  let logoArt = null;
  function makeLogo() {
    const word = ["C", "O", "M", "E", "T", "E"], px = 4, gap = 1;
    const cols = ["#f4f4f4", "#ffcd75", "#ffcd75", "#ef7d57", "#ef7d57", "#b13e53", "#b13e53"];
    const lw = word.length * (5 + gap) - gap, lh = 7 + 3;
    const c = document.createElement("canvas"); c.width = (lw + 2) * px + 2 * px; c.height = (lh + 2) * px + 2 * px;
    const x = c.getContext("2d");
    const cells = [];
    word.forEach((ch, k) => LOGO[ch].forEach((r, j) => { for (let i = 0; i < 5; i++) if (r[i] === "#") cells.push([k * (5 + gap) + i, j + 3, cols[j]]); }));
    // accent grave sur le E de COMÈTE
    const ea = 3 * (5 + gap);
    cells.push([ea + 1, 0, "#f4f4f4"], [ea + 2, 1, "#ffcd75"]);
    const P = (i, j, col) => { x.fillStyle = col; x.fillRect((i + 1) * px, (j + 1) * px, px, px); };
    const all = cells.concat(cells.map(([i, j]) => [i, j + 1]));
    for (const [i, j] of all) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) P(i + dx, j + dy, "#0b0c14");
    for (const [i, j] of cells) P(i, j + 1, "#5d275d");
    for (const [i, j, col] of cells) P(i, j, col);
    // reflets
    for (const [i, j] of cells) if (j === 4) { x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect((i + 1) * px, (j + 1) * px, px, 1); }
    return c;
  }
  function drawLogo(cx, y) {
    if (!logoArt) logoArt = makeLogo();
    ctx.drawImage(logoArt, Math.round(cx - logoArt.width / 2), Math.round(y));
    // petite comète qui traverse
    const t = (sceneT * 0.35) % 1.6;
    if (t < 1) {
      const kx = cx - 90 + t * 200, ky = y + 2 + t * 10;
      for (let i = 0; i < 14; i++) { ctx.fillStyle = i < 2 ? "#f4f4f4" : i < 6 ? "#73eff7" : "#41a6f6"; ctx.globalAlpha = 1 - i / 14; ctx.fillRect(Math.round(kx - i * 2), Math.round(ky - i * 0.16 * 2), 2, 1); }
      ctx.globalAlpha = 1;
    }
  }
  function drawTitle() {
    drawBackground(40, 0);
    const t = sceneT;
    // logo
    const ly = Math.max(hudTop + 30, H * 0.17);
    drawLogo(W / 2, ly - 16);
    T(ctx, "ASCENSION INFINIE", W / 2, ly + 44, "#73eff7", { align: "center", outline: "#0b0c14" });
    // vaisseau qui flotte
    const sx = W / 2 + Math.sin(t * 1.3) * 20, sy = H * 0.46 + Math.sin(t * 2.1) * 4;
    const fl = 3 + ((t * 20) | 0) % 3;
    ctx.fillStyle = "#ef7d57"; ctx.fillRect(Math.round(sx) - 2, Math.round(sy) + 6, 1, fl + 2); ctx.fillRect(Math.round(sx) + 1, Math.round(sy) + 6, 1, fl + 2);
    ctx.fillStyle = "#ffcd75"; ctx.fillRect(Math.round(sx) - 2, Math.round(sy) + 6, 1, fl); ctx.fillRect(Math.round(sx) + 1, Math.round(sy) + 6, 1, fl);
    ctx.save(); ctx.translate(Math.round(sx), Math.round(sy)); ctx.scale(2, 2); ctx.drawImage(S.player, -6, -7); ctx.restore();
    // tirs décoratifs
    for (let k = 0; k < 4; k++) { const yy = sy - 18 - ((t * 200 + k * 30) % 120); ctx.fillStyle = "#41a6f6"; ctx.fillRect(Math.round(sx) - 1, Math.round(yy), 2, 6); ctx.fillStyle = "#f4f4f4"; ctx.fillRect(Math.round(sx), Math.round(yy), 1, 5); }
    drawButtons();
    const by = H * 0.62 + 50;
    T(ctx, "RECORD  " + fmt(best), W / 2, by, "#ffcd75", { align: "center", outline: "#0b0c14" });
    if (bestAlt > 0) T(ctx, "ALTITUDE MAX  " + (bestAlt / 100).toFixed(1).replace(".", ",") + " KM", W / 2, by + 9, "#73eff7", { align: "center", outline: "#0b0c14" });
    T(ctx, "100 BOSS DE LA GALAXIE T'ATTENDENT", W / 2, H - 14, "#566c86", { align: "center" });
  }
  function drawOver() {
    drawBackground(15, 0);
    ctx.fillStyle = "rgba(11,12,20,.55)"; ctx.fillRect(0, 0, W, H);
    const y = Math.max(hudTop + 24, H * 0.16);
    T(ctx, "VAISSEAU", W / 2, y, "#ff5a6e", { align: "center", scale: 3, outline: "#0b0c14" });
    T(ctx, "DÉTRUIT", W / 2, y + 20, "#ff5a6e", { align: "center", scale: 3, outline: "#0b0c14" });
    const rows = [
      ["SCORE", fmt(R.score), "#ffcd75"],
      ["ALTITUDE", altKm() + " KM", "#73eff7"],
      ["BOSS VAINCUS", String(R.bossCount), "#ff5a6e"],
      ["ENNEMIS DÉTRUITS", fmt(R.kills), "#a7f070"],
      ["RECORD", fmt(best), "#f4f4f4"],
    ];
    let ry = y + 50;
    for (const [a, b, c] of rows) { T(ctx, a, 22, ry, "#94b0c2"); T(ctx, b, W - 22, ry, c, { align: "right" }); ry += 11; }
    if (R.newBest && ((sceneT * 3) | 0) % 2 === 0) T(ctx, "NOUVEAU RECORD !", W / 2, ry + 4, "#ffcd75", { align: "center", scale: 2, outline: "#0b0c14" });
    drawButtons();
  }
  function codexCell() { const cell = 16, gx = Math.floor((W - cell * 10) / 2); return { cell, gx, gy: codexTop }; }
  function drawCodex() {
    drawBackground(8, 0);
    ctx.fillStyle = "rgba(11,12,20,.6)"; ctx.fillRect(0, 0, W, H);
    codexTop = hudTop + 22;
    T(ctx, "CODEX DES BOSS", 6, hudTop + 2, "#ffcd75", { scale: 2, outline: "#0b0c14" });
    T(ctx, codex.size + "/100 VAINCUS", 6, hudTop + 14, "#94b0c2");
    const { cell, gx, gy } = codexCell();
    for (let i = 0; i < 100; i++) {
      const def = BL.LIST[i], cx = gx + (i % 10) * cell, cy = gy + Math.floor(i / 10) * cell;
      ctx.fillStyle = (Math.floor(i / 10) % 2) ? "#1a1c2c" : "#141522"; ctx.fillRect(cx, cy, cell - 1, cell - 1);
      if (codexSel === i) { ctx.fillStyle = "#ffcd75"; ctx.fillRect(cx - 1, cy - 1, cell + 1, 1); ctx.fillRect(cx - 1, cy + cell - 1, cell + 1, 1); ctx.fillRect(cx - 1, cy, 1, cell - 1); ctx.fillRect(cx + cell - 1, cy, 1, cell - 1); }
      const spr = BL.sprite(def);
      const k = Math.min((cell - 3) / spr.width, (cell - 3) / spr.height);
      const w = spr.width * k, h = spr.height * k;
      ctx.imageSmoothingEnabled = false;
      if (codex.has(i)) ctx.drawImage(spr, Math.round(cx + (cell - 1 - w) / 2), Math.round(cy + (cell - 1 - h) / 2), Math.round(w), Math.round(h));
      else if (seen.has(i)) { ctx.globalAlpha = 0.6; ctx.drawImage(spr.dark, Math.round(cx + (cell - 1 - w) / 2), Math.round(cy + (cell - 1 - h) / 2), Math.round(w), Math.round(h)); ctx.globalAlpha = 1; T(ctx, "!", cx + 7, cy + 5, "#ff5a6e"); }
      else T(ctx, "?", cx + 7, cy + 5, "#333c57", { align: "center" });
    }
    // fiche du boss sélectionné
    const py = gy + cell * 10 + 6;
    if (codexSel != null) {
      const def = BL.LIST[codexSel], f = BL.FACTIONS[def.faction], spr = BL.sprite(def);
      const known = codex.has(codexSel), met = seen.has(codexSel);
      const bh = Math.min(H - py - 30, 64);
      const k = Math.min(2, Math.floor(Math.min(70 / spr.width, bh / spr.height) * 2) / 2 || 1);
      ctx.save(); ctx.translate(W - 6 - spr.width * k, py + 2); ctx.scale(k, k);
      ctx.drawImage(known ? spr : spr.dark, 0, 0); ctx.restore();
      T(ctx, "N°" + String(codexSel + 1).padStart(3, "0"), 6, py, "#566c86");
      const nameLines = wrap(known || met ? def.name : "??????", W - 20 - spr.width * k);
      let ty = py + 9;
      for (const l of nameLines) { T(ctx, l, 6, ty, known ? "#f4f4f4" : "#94b0c2"); ty += 8; }
      for (const l of wrap(f.name, W - 20 - spr.width * k)) { T(ctx, l, 6, ty, "#73eff7"); ty += 8; }
      T(ctx, known ? "VAINCU" : met ? "RENCONTRÉ, PAS ENCORE VAINCU" : "JAMAIS RENCONTRÉ", 6, ty + 2, known ? "#a7f070" : "#ff5a6e");
    } else {
      for (const [i, l] of wrap("TOUCHE UNE CASE POUR VOIR UN BOSS. CHAQUE LIGNE EST UNE FACTION DE LA GALAXIE.", W - 12).entries()) T(ctx, l, 6, py + i * 8, "#94b0c2");
    }
    drawButtons();
  }

  // ---------------------------------------------------------------- boucle
  let paused = false, pausedBy = null, lastT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.033, (now - lastT) / 1000 || 0);
    lastT = now;
    if (!paused) update(dt);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (scene === "title") drawTitle();
    else if (scene === "codex") drawCodex();
    else if (scene === "over") drawOver();
    else drawPlay();
    if (paused && scene === "play") {
      ctx.fillStyle = "rgba(11,12,20,.6)"; ctx.fillRect(0, 0, W, H);
      T(ctx, "PAUSE", W / 2, H * 0.42, "#f4f4f4", { align: "center", scale: 3, outline: "#0b0c14" });
      if (pausedBy !== "von") T(ctx, "TOUCHE POUR REPRENDRE", W / 2, H * 0.42 + 22, "#94b0c2", { align: "center" });
    }
  }

  // ---------------------------------------------------------------- commandes
  const keys = new Set();
  window.addEventListener("keydown", (e) => {
    window.Sfx.unlock();
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys.add(k);
    if (k === "p" || k === "Escape") { if (scene === "play") setPause(!paused, "key"); }
    if ((k === "Enter" || k === " ") && scene !== "play") { if (scene === "codex") toTitle(); else startRun(); }
    if (k.startsWith("Arrow") || k === " ") e.preventDefault();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
  let drag = null;
  const toGame = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / (r.width / W), (e.clientY - r.top) / (r.height / H)]; };
  function hitButton(x, y) { return buttons.find((b) => x >= b.x - 3 && x <= b.x + b.w + 3 && y >= b.y - 3 && y <= b.y + b.h + 4); }
  window.addEventListener("pointerdown", (e) => {
    window.Sfx.unlock();
    const [x, y] = toGame(e);
    if (scene === "play") {
      if (paused) { if (pausedBy !== "von") setPause(false); return; }
      drag = { id: e.pointerId, sx: x, sy: y, px: R.x, py: R.y };
      return;
    }
    const b = hitButton(x, y);
    if (b) { b.down = true; drag = { id: e.pointerId, btn: b }; return; }
    if (scene === "codex") {
      const { cell, gx, gy } = codexCell();
      const i = Math.floor((x - gx) / cell), j = Math.floor((y - gy) / cell);
      if (i >= 0 && i < 10 && j >= 0 && j < 10) { codexSel = j * 10 + i; sfx("select"); }
    }
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId || scene !== "play" || !R || R.dead || paused) return;
    const [x, y] = toGame(e);
    const sens = 1.25;
    R.x = clamp(drag.px + (x - drag.sx) * sens, 6, W - 6);
    R.y = clamp(drag.py + (y - drag.sy) * sens, hudTop + 30, H - 9);
    // si on bute contre un bord, on recale l'origine pour garder un pilotage réactif
    if (R.x <= 6 || R.x >= W - 6) { drag.sx = x; drag.px = R.x; }
    if (R.y <= hudTop + 30 || R.y >= H - 9) { drag.sy = y; drag.py = R.y; }
  });
  const endDrag = (e) => {
    if (drag && drag.btn) {
      const [x, y] = toGame(e);
      const b = drag.btn; b.down = false;
      if (hitButton(x, y) === b) { drag = null; b.fn(); return; }
    }
    drag = null;
  };
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", () => { if (drag && drag.btn) drag.btn.down = false; drag = null; });
  ["touchstart", "touchmove", "gesturestart", "dblclick", "contextmenu"].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));

  function setPause(p, by) {
    if (p) { paused = true; pausedBy = by || pausedBy || "key"; window.Sfx.suspend(); drag = null; keys.clear(); }
    else { paused = false; pausedBy = null; window.Sfx.resume(); lastT = performance.now(); }
  }
  if (window.Von) {
    Von.onPause(() => setPause(true, "von"));
    Von.onResume(() => setPause(false));
    Von.onRestart(() => { setPause(false); startRun(); });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { if (scene === "play" && !paused) setPause(true, "hidden"); else window.Sfx.suspend(); }
    else if (scene !== "play") window.Sfx.resume();
  });

  window.addEventListener("resize", resize);
  resize();
  layoutTitle();
  window.Sfx.music("title");
  requestAnimationFrame(frame);

  // accès pour les tests
  window.__comete = { get R() { return R; }, startRun, get scene() { return scene; }, bossNow() { if (R) R.score = R.nextBoss; }, codex, BL, update, gameOver };
})();
