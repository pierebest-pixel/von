/* Les Échoués de Kalua — moteur des grottes.
 * Une grotte = des salles de 15 × 9 cases reliées par des portes (nord, sud, est, ouest).
 * Légende des cases (voir aussi caves-*.js) :
 *   #  mur            .  sol            ,  sol décoré       ~  eau profonde    _  trou        L  lave
 *   ^  pics fixes     s  pics alternés  S  pics alternés (en décalé)          =  pont         i  glace
 *   B  bloc à pousser H  bloc lourd (seulement la Bourrasque)                  P  plaque de pression
 *   T  torche éteinte t  torche allumée V  ronces (la Flamme les brûle)        C  mur fissuré (l'Onde le brise)
 *   X  jarre (à casser) K  petite clé    k  coffre          G  grand coffre    l  levier (à frapper)
 *   O  cristal (bascule rouge/bleu)      r  bloc rouge      b  bloc bleu       g  grille (s'ouvre quand l'énigme est résolue)
 *   F  ventilateur (la Bourrasque le lance)  w  courant d'air  I  pont invisible (visible avec la Lueur)
 *   c  sol qui s'effondre  *  stèle / statue (on lit, on répond à l'énigme)    h  cœur
 *   a  lance-flèches  D  porte (au milieu d'un bord)   1-9  ennemis (liste room.foes)   M  boss / mini-boss */
"use strict";

const Dungeon = (() => {
  const TS = 48, CW = 15, CH = 9, TAU = Math.PI * 2;
  let cave = null, R = null, n = 0, t = 0, low = null, lowc = null;
  const CAVES = {}; // rempli par caves-*.js : CAVES[n] = { name, style, music, pal, start, rooms: { id: {...} } }
  const rnd = (a, b) => a + Math.random() * (b - a);

  // ---------------------------------------------------------------- palettes (une identité par grotte)
  const PAL = {
    1: { wall: "#3a2a1e", wall2: "#4f3a28", top: "#6b8a3a", floor: "#5a4632", floor2: "#634e38", deco: "#7aa04a", water: "#2a5a6a", accent: "#9ad04a", dark: .78 },
    2: { wall: "#3a6a7a", wall2: "#4a7a8a", top: "#8ad0d0", floor: "#e8d8b0", floor2: "#f0e2c0", deco: "#f4a0b0", water: "#4aa0c8", accent: "#ffd0e0", dark: .5 },
    3: { wall: "#2a2e3a", wall2: "#363a48", top: "#5a6478", floor: "#3e4250", floor2: "#464a58", deco: "#6a7a8a", water: "#2a3a4a", accent: "#8ad0ff", dark: .9 },
    4: { wall: "#8a8aa0", wall2: "#9a9ab0", top: "#d0e0f0", floor: "#c8ccd8", floor2: "#d2d6e0", deco: "#ffffff", water: "#7ab0e0", accent: "#fff6a0", dark: .45 },
    5: { wall: "#2a1414", wall2: "#3a1c1a", top: "#7a2a1a", floor: "#3a2422", floor2: "#442a28", deco: "#ff7a3a", water: "#6a1a10", accent: "#ff9a4a", dark: .82 },
    6: { wall: "#5a7a4a", wall2: "#6a8a5a", top: "#a8d090", floor: "#e0d4a8", floor2: "#e8dcb4", deco: "#8ac070", water: "#58b0c0", accent: "#c0f0a0", dark: .5 },
    7: { wall: "#5a5a66", wall2: "#6a6a76", top: "#c0c0cc", floor: "#9a9aa8", floor2: "#a4a4b2", deco: "#e05050", water: "#3a5a8a", accent: "#fff6a0", dark: .7 },
    8: { wall: "#1a1a3a", wall2: "#22224a", top: "#4a4a8a", floor: "#2a2a50", floor2: "#30305a", deco: "#ffe08a", water: "#101030", accent: "#c9a3e8", dark: .85 },
  };

  // ---------------------------------------------------------------- chargement d'une salle
  const K = (x, y) => y * CW + x;
  function load(roomId, from) {
    const def = cave.rooms[roomId]; if (!def) { console.warn("salle inconnue", roomId); return; }
    const S = Prog.cave(n); S.room = roomId; S.seen[roomId] = true;
    const done = Boolean(S.done[roomId]);
    R = { id: roomId, def, tiles: [], blocks: [], torches: [], plates: [], crystal: 0, levers: [], chests: [], timers: {}, bridges: {}, cooled: {}, crumble: {}, lit: false, solved: done, foesLeft: 0, wanderers: [], entry: null, boss: null, msgShown: false, orderIdx: 0, simon: null, arrows: [] };
    Act.clear(); if (typeof Game !== "undefined") Game.bossBar(null);
    const rows = def.map;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      let ch = (rows[y] || "")[x] || "#";
      const key = roomId + ":" + x + "," + y;
      if (ch === "B" || ch === "H") { R.blocks.push({ x, y, heavy: ch === "H", ox: x, oy: y }); ch = "."; }
      else if (ch === "T" || ch === "t") { R.torches.push({ x, y, lit: ch === "t" || done, idx: R.torches.length }); }
      else if (ch === "P") R.plates.push({ x, y });
      else if (ch === "l") R.levers.push({ x, y, on: false });
      else if (ch === "k" || ch === "G") { R.chests.push({ x, y, big: ch === "G", open: Boolean(S.chests[key]), key, hidden: def.hiddenChest === `${x},${y}` && !done }); }
      else if (ch === "K" && S.chests[key]) ch = ".";
      else if (ch === "C" && S.chests[key]) ch = ",";
      else if (ch === "V" && done) ch = ".";
      else if (ch === "a") R.arrows.push({ x, y, t: rnd(0, 2) });
      else if (/[1-9]/.test(ch)) { if (!done || def.respawn) spawnFoe(def.foes[Number(ch) - 1], x, y); ch = "."; }
      else if (ch === "M") { R.bossAt = { x, y }; ch = "."; }
      R.tiles[K(x, y)] = ch;
    }
    if (done && def.gateOpen !== false) for (let i = 0; i < R.tiles.length; i++) if (R.tiles[i] === "g") R.tiles[i] = ".";
    // position d'arrivée
    const door = { n: [7, 0], s: [7, CH - 1], w: [0, 4], e: [CW - 1, 4] };
    let ex = 7, ey = 4;
    if (from && door[from]) { const [dx, dy] = door[from]; ex = dx + (from === "w" ? 1 : from === "e" ? -1 : 0); ey = dy + (from === "n" ? 1 : from === "s" ? -1 : 0); }
    else if (def.spawn) [ex, ey] = def.spawn;
    R.entry = { x: (ex + .5) * TS, y: (ey + .5) * TS + 6 };
    const p = Game.player; p.x = R.entry.x; p.y = R.entry.y; p.kx = p.ky = 0;
    Game.camSnap();
    // boss / mini-boss
    if (R.bossAt && !S.done[roomId]) setTimeout(() => startBoss(), 400);
    if (def.onEnter) def.onEnter(api(), first(S, roomId));
    if (def.text && !S.done[roomId + "_txt"]) { S.done[roomId + "_txt"] = true; Prog.changed(); setTimeout(() => Game.toast(def.text, 4200), 300); }
    else if (def.name) Game.toast("📍 " + def.name, 1800);
    lowSetup();
  }
  const first = (S, id) => !S.done[id + "_in"] && (S.done[id + "_in"] = true);
  function spawnFoe(f, x, y) {
    if (!f) return;
    const px = (x + .5) * TS, py = (y + .5) * TS + 8;
    if (cave.turn) { // grotte au tour par tour : l'ennemi rôde, le toucher lance le combat
      const group = Array.isArray(f) ? f : [f];
      const e = Act.spawn(group[0], px, py, { def: { hp: 99, spd: 45, dmg: 0, r: 18, ai: "chase", draw: (Battle.FOES[group[0]] || {}).draw || "slime" }, harmless: true, invuln: true, group });
      R.wanderers.push(e); R.foesLeft++;
    } else { const e = Act.spawn(f, px, py); if (e) R.foesLeft++; }
  }

  // ---------------------------------------------------------------- cases
  const tile = (x, y) => (x < 0 || y < 0 || x >= CW || y >= CH ? "#" : R.tiles[K(x, y)]);
  const setTile = (x, y, ch) => { R.tiles[K(x, y)] = ch; };
  const blockAt = (x, y) => R.blocks.find((b) => b.x === x && b.y === y);
  const doorDir = (x, y) => (y === 0 && x === 7 ? "n" : y === CH - 1 && x === 7 ? "s" : x === 0 && y === 4 ? "w" : x === CW - 1 && y === 4 ? "e" : null);
  function doorState(dir) {
    const S = Prog.cave(n), def = R.def, kind = (def.locks || {})[dir];
    if (!def.exits || !def.exits[dir]) return "wall";
    if (kind === "key" || kind === "boss") return S.open[R.id + dir] ? "open" : kind;
    if ((kind === "shut" || def.shut) && !R.solved) return "shut";
    if (R.boss && R.boss.alive) return "shut";
    return "open";
  }
  function solidTile(x, y, fly) {
    const ch = tile(x, y);
    if (ch === "D") return doorState(doorDir(x, y)) !== "open";
    if (blockAt(x, y)) return true;
    if (ch === "#" || ch === "C" || ch === "V" || ch === "T" || ch === "t" || ch === "*" || ch === "k" || ch === "G" || ch === "l" || ch === "O" || ch === "g" || ch === "X" || ch === "F" || ch === "a") {
      if (ch === "k" || ch === "G") { const c = R.chests.find((q) => q.x === x && q.y === y); if (c && c.hidden) return false; }
      return true;
    }
    if (ch === "r") return R.crystal === 0; if (ch === "b") return R.crystal === 1;
    if (ch === "~") return !fly;
    return false;
  }
  function solid(px, py, r = 10, fly = false) {
    const pts = [[px - r, py - r * .5], [px + r, py - r * .5], [px - r, py + r * .5], [px + r, py + r * .5]];
    for (const [x, y] of pts) { const tx = Math.floor(x / TS), ty = Math.floor(y / TS); if (solidTile(tx, ty, fly)) return true; }
    return false;
  }
  // le sol sous les pieds : y a-t-il un danger ?
  function floorAt(px, py) {
    const tx = Math.floor(px / TS), ty = Math.floor(py / TS), ch = tile(tx, ty), k = K(tx, ty);
    if (R.bridges[k] > 0) return "safe";
    if (ch === "_") return "pit"; if (ch === "c" && R.crumble[k] === -1) return "pit";
    if (ch === "L") return R.cooled[k] > 0 ? "safe" : "lava";
    if (ch === "^") return "spike"; if ((ch === "s" || ch === "S") && spikesUp(ch)) return "spike";
    if (ch === "w") return "wind"; if (ch === "i") return "ice"; if (ch === "c") return "crumble";
    if (ch === "P") return "plate"; if (ch === "K") return "key"; if (ch === "h") return "heart";
    return "safe";
  }
  const spikesUp = (ch) => ((t % 2.4) < 1.2) === (ch === "s");

  // ---------------------------------------------------------------- énigmes
  function platesPressed() { return R.plates.length > 0 && R.plates.every((pl) => blockAt(pl.x, pl.y) || (Math.floor(Game.player.x / TS) === pl.x && Math.floor(Game.player.y / TS) === pl.y) || R.def.plateHold === false && pl.done); }
  function checkSolve() {
    if (R.solved) return;
    const c = R.def.cond; let ok = false;
    if (!c) return;
    if (c === "kill") ok = Act.enemies.filter((e) => e.alive && !e.harmless).length === 0 && R.wanderers.every((w) => !w.alive);
    else if (c === "plates") ok = R.plates.length > 0 && R.plates.every((pl) => blockAt(pl.x, pl.y));
    else if (c === "platesAny") ok = platesPressed();
    else if (c === "torches") ok = R.torches.every((q) => q.lit);
    else if (c === "levers") ok = R.levers.every((l) => l.on);
    else if (c === "crystal") ok = R.crystal === (R.def.crystalGoal ?? 1);
    else if (typeof c === "function") ok = c(api());
    if (ok) solve();
  }
  function solve(silent) {
    if (R.solved) return; R.solved = true;
    const S = Prog.cave(n); S.done[R.id] = true; Prog.changed();
    for (let i = 0; i < R.tiles.length; i++) if (R.tiles[i] === "g") R.tiles[i] = ".";
    for (const c of R.chests) if (c.hidden) { c.hidden = false; Act.addFx("poof", (c.x + .5) * TS, (c.y + .5) * TS); }
    if (!silent) { Music.sfx("puzzle"); Music.jingle("secret"); Game.toast(R.def.solvedText || "✨ Un mécanisme s'est ouvert !", 2200); }
    if (R.def.onSolve) R.def.onSolve(api());
  }

  // ---------------------------------------------------------------- boss et mini-boss
  async function startBoss() {
    const d = R.def, A = { x0: TS, y0: TS, x1: (CW - 1) * TS, y1: (CH - 1) * TS, cx: CW * TS / 2, cy: CH * TS / 2 };
    const S = Prog.cave(n);
    if (d.before) { await d.before(api()); }
    if (d.boss) { // en temps réel
      const def = RTBoss.DEF[d.boss];
      R.boss = RTBoss.make(d.boss, (R.bossAt.x + .5) * TS, (R.bossAt.y + .5) * TS, A);
      Music.play(def.music || "miniboss", .6);
      Game.bossBar(R.boss);
      if (def.intro) Game.toast(def.intro, 3000);
    } else if (d.battle) { // au tour par tour
      Game.player.y = R.entry.y;
      const res = await Battle.start({ foes: Array.isArray(d.battle) ? d.battle : [d.battle], bg: d.bg || "cave", bgOpt: { col: PAL[n].wall, glow: "rgba(120,200,255,.25)" } });
      if (res === "win") bossDown(); else Game.caveDeath();
    }
  }
  async function bossDown() {
    const d = R.def, S = Prog.cave(n);
    Game.bossBar(null); R.boss = null; Act.clear();
    S.done[R.id] = true; R.solved = true; Prog.changed();
    Music.jingle("victory"); Music.play(cave.music, 2);
    if (d.reward) { Prog.give(d.reward, 1); }
    if (d.after) await d.after(api());
    for (const c of R.chests) c.hidden = false;
    if (d.final) { Prog.cave(n).cleared = true; Prog.set("cave" + n + "_done"); }
  }

  // ---------------------------------------------------------------- actions du joueur
  function interact(p) {
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1];
    const tx = Math.floor((p.x + f[0] * 34) / TS), ty = Math.floor((p.y - 8 + f[1] * 30) / TS), ch = tile(tx, ty);
    const S = Prog.cave(n);
    // coffre
    const c = R.chests.find((q) => q.x === tx && q.y === ty && !q.hidden);
    if (c) { if (c.open) { Game.toast("Le coffre est vide."); return true; } openChest(c); return true; }
    // stèle / énigme
    if (ch === "*") { readStele(tx, ty); return true; }
    // porte verrouillée
    const dd = doorDir(tx, ty);
    if (dd) { const st = doorState(dd);
      if (st === "key") { if (S.keys > 0) { S.keys--; S.open[R.id + dd] = true; Prog.changed(); Music.sfx("door"); Game.toast("🗝️ La porte s'ouvre."); } else Game.toast("🔒 Il faut une petite clé."); return true; }
      if (st === "boss") { if (Prog.has("cleBoss" + n) || S.bossKey) { S.open[R.id + dd] = true; Prog.changed(); Music.sfx("door"); Game.toast("🔑 La grande porte s'ouvre lentement…"); } else Game.toast("🔒 Une grande serrure. Il faut la Grande clé de cette grotte."); return true; }
      if (st === "shut") { Game.toast(R.def.shutText || "La porte est scellée par un mécanisme."); return true; } }
    if (ch === "l") { hitLever(tx, ty); return true; }
    return false;
  }
  function openChest(c) {
    const S = Prog.cave(n), def = R.def; c.open = true; S.chests[c.key] = true; Prog.changed(); Music.sfx("chest");
    const item = c.big ? (def.big || "cleBoss") : (def.chest || "cle");
    if (item === "cle") { S.keys++; Prog.changed(); Game.toast("🗝️ Tu trouves une petite clé !"); Music.jingle("item"); }
    else if (item === "cleBoss") { S.bossKey = true; Prog.changed(); Game.toast("🔑 La Grande clé de la grotte ! Elle ouvre la porte du gardien."); Music.jingle("secret"); }
    else if (item.startsWith("lore:")) { Prog.P.lore[item.slice(5)] = true; Prog.changed(); Music.jingle("secret"); Story.lore(item.slice(5)); }
    else { const [id, q] = item.split("*"); Prog.give(id, Number(q) || 1); Music.jingle("item"); }
  }
  async function readStele(x, y) {
    const def = R.def, st = (def.steles || {})[`${x},${y}`] || def.stele;
    if (!st) { Game.toast("Des spirales lumes, illisibles."); return; }
    Game.lockInput(true);
    try {
      if (st.lore) { Prog.P.lore[st.lore] = true; Prog.changed(); }
      if (st.text) await Dialog.lines({ name: st.who || "Stèle lume", icon: st.icon || "sceauFragment", color: "#7a6a9a" }, [].concat(st.text));
      if (st.riddle && !R.solved) {
        const r = st.riddle; const v = await Dialog.choose({ name: st.who || "Stèle lume", icon: "sceauFragment" }, r.q, r.opts.map((o, i) => [i, o]));
        if (v === r.a) { Music.sfx("puzzle"); solve(); } else { Music.sfx("trap"); Game.toast(r.wrong || "Mauvaise réponse… La stèle reste muette."); if (r.punish) { Act.spawn(r.punish, Game.player.x + 60, Game.player.y); } }
      }
      if (st.ask && !R.solved) { const ans = await Dialog.input({ name: st.who || "Stèle lume", icon: "sceauFragment" }, st.ask.q, "Ta réponse…"); const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
        if (st.ask.a.some((a) => norm(ans).includes(norm(a)))) { Music.sfx("puzzle"); solve(); } else if (ans) Game.toast("La stèle ne réagit pas."); }
      if (st.fn) await st.fn(api());
    } finally { Game.lockInput(false); }
  }
  function hitLever(x, y) { const l = R.levers.find((q) => q.x === x && q.y === y); if (!l) return; l.on = !l.on; Music.sfx("switch"); if (R.def.onLever) R.def.onLever(api(), l); checkSolve(); }
  function hitCrystal() { R.crystal = 1 - R.crystal; Music.sfx("switch"); if (R.def.onCrystal) R.def.onCrystal(api()); checkSolve(); }
  // le coup de « Taper » touche aussi le décor
  function hitWorld(p) {
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir] || [0, 1];
    const tx = Math.floor((p.x + f[0] * 34) / TS), ty = Math.floor((p.y - 8 + f[1] * 30) / TS), ch = tile(tx, ty);
    if (ch === "l") { hitLever(tx, ty); return true; }
    if (ch === "O") { hitCrystal(); Act.addFx("spark", (tx + .5) * TS, (ty + .5) * TS); return true; }
    if (ch === "X") { setTile(tx, ty, ","); Music.sfx("rock"); Act.addFx("poof", (tx + .5) * TS, (ty + .5) * TS); if (Math.random() < .4) setTile(tx, ty, "h"); return true; }
    if (ch === "C") { Act.addFx("spark", (tx + .5) * TS, (ty + .5) * TS); Game.toast("Ce mur sonne creux… Une onde le briserait."); return true; }
    if (ch === "V") { Game.toast("Les ronces sont trop épaisses. Le feu en viendrait à bout."); return true; }
    if (ch === "T" && Prog.has("torche")) { lightTorch(tx, ty); return true; }
    if (R.def.simon && ch === "*") { readStele(tx, ty); return true; }
    return false;
  }
  function lightTorch(x, y) {
    const tq = R.torches.find((q) => q.x === x && q.y === y); if (!tq || tq.lit) return;
    tq.lit = true; setTile(x, y, "t"); Music.sfx("fire", .6);
    if (R.def.order) { const want = R.def.order[R.orderIdx]; if (tq.idx !== want) { R.orderIdx = 0; Music.sfx("trap"); Game.toast(R.def.orderFail || "Les flammes s'éteignent… Ce n'était pas le bon ordre."); setTimeout(() => { for (const q of R.torches) { q.lit = false; setTile(q.x, q.y, "T"); } }, 500); return; } R.orderIdx++; }
    if (R.def.torchTimer) R.timers["torch" + tq.idx] = R.def.torchTimer;
    checkSolve();
  }

  // ---------------------------------------------------------------- les chants agissent sur le décor
  function onSpell(sp, px, py, dir) {
    const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 1];
    const ptx = Math.floor(px / TS), pty = Math.floor(py / TS);
    RTBoss.onSpell(sp, Game.player);
    if (sp === "racine") { // pont de lianes sur les trous devant soi (3 cases)
      let made = 0; for (let k = 1; k <= 4; k++) { const x = ptx + f[0] * k, y = pty + f[1] * k, ch = tile(x, y); if (ch === "_" || (ch === "c" && R.crumble[K(x, y)] === -1)) { R.bridges[K(x, y)] = 10; made++; } else if (made) break; }
      if (made) { Game.toast("🌱 Des lianes forment un pont !", 1500); } }
    if (sp === "maree") { for (let y = pty - 2; y <= pty + 2; y++) for (let x = ptx - 2; x <= ptx + 2; x++) if (tile(x, y) === "L") R.cooled[K(x, y)] = 7; for (const q of R.torches) if (Math.abs(q.x - ptx) <= 1 && Math.abs(q.y - pty) <= 1 && q.lit && R.def.waterTorches) { q.lit = false; setTile(q.x, q.y, "T"); } }
    if (sp === "bourrasque") { // pousse les blocs lourds et lance les ventilateurs
      for (let k = 1; k <= 3; k++) { const x = ptx + f[0] * k, y = pty + f[1] * k; const b = blockAt(x, y); if (b) { pushBlock(b, f[0], f[1], true); break; } if (tile(x, y) === "F") { if (R.def.onFan) R.def.onFan(api(), x, y); Music.sfx("wind"); break; } if (solidTile(x, y)) break; }
      for (const q of R.torches) if (Math.abs(q.x - ptx) + Math.abs(q.y - pty) <= 2 && q.lit && R.def.windTorches) { q.lit = false; setTile(q.x, q.y, "T"); } }
    if (sp === "onde") { for (let y = pty - 2; y <= pty + 2; y++) for (let x = ptx - 2; x <= ptx + 2; x++) if (tile(x, y) === "C") { setTile(x, y, ","); Prog.cave(n).chests[R.id + ":" + x + "," + y] = true; Prog.changed(); Act.addFx("poof", (x + .5) * TS, (y + .5) * TS); Music.jingle("secret"); Game.toast("💥 Le mur s'effondre : un passage secret !"); } }
    if (sp === "lueur") { R.lit = Act.env.light; if (R.lit && R.def.onLight) R.def.onLight(api()); }
    if (sp === "flamme") { /* la boule de feu allume les torches et brûle les ronces quand elle les touche (onShotWall) */ }
  }
  function onShotWall(s) {
    const tx = Math.floor(s.x / TS), ty = Math.floor(s.y / TS);
    for (const [x, y] of [[tx, ty], [tx + 1, ty], [tx - 1, ty], [tx, ty + 1], [tx, ty - 1]]) {
      const ch = tile(x, y);
      if (s.kind === "fire" && ch === "T") { lightTorch(x, y); return; }
      if (s.kind === "fire" && ch === "V") { burnVines(x, y); return; }
      if (ch === "O") { hitCrystal(); return; }
    }
  }
  function burnVines(x, y) { const stack = [[x, y]]; let n0 = 0; while (stack.length && n0 < 40) { const [a, b] = stack.pop(); if (tile(a, b) !== "V") continue; setTile(a, b, ","); n0++; Act.addFx("boom", (a + .5) * TS, (b + .5) * TS, { max: .4 }); stack.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } Music.sfx("fire"); checkSolve(); }
  function pushBlock(b, dx, dy, magic) {
    if (b.heavy && !magic) { Game.toast("Ce bloc est bien trop lourd… Une bourrasque pourrait le déplacer.", 1600); return false; }
    const nx = b.x + dx, ny = b.y + dy, ch = tile(nx, ny);
    if (solidTile(nx, ny) || ch === "D" || ch === "~" || ch === "L") return false;
    b.x = nx; b.y = ny; b.anim = .15; Music.sfx("rock", .7);
    if (ch === "_") { setTile(nx, ny, "="); R.blocks = R.blocks.filter((q) => q !== b); Game.toast("Le bloc comble le trou !", 1200); }
    checkSolve(); return true;
  }

  // ---------------------------------------------------------------- mise à jour
  let pushT = 0, lastHaz = 0;
  function update(dt) {
    t += dt; const p = Game.player;
    for (const k in R.bridges) if (R.bridges[k] > 0) R.bridges[k] -= dt;
    for (const k in R.cooled) if (R.cooled[k] > 0) R.cooled[k] -= dt;
    for (const k in R.timers) { if (R.timers[k] > 0) { R.timers[k] -= dt; if (R.timers[k] <= 0 && k.startsWith("torch") && !R.solved) { const q = R.torches[Number(k.slice(5))]; q.lit = false; setTile(q.x, q.y, "T"); Music.sfx("trap", .4); } } }
    for (const b of R.blocks) if (b.anim > 0) b.anim -= dt;
    // sol qui s'effondre
    for (const k in R.crumble) if (R.crumble[k] > 0) { R.crumble[k] -= dt; if (R.crumble[k] <= 0) { R.crumble[k] = -1; Music.sfx("rock", .4); } }
    // lance-flèches
    for (const a of R.arrows) { a.t += dt; if (a.t > (R.def.arrowRate || 2)) { a.t = 0; const dir = (R.def.arrowDir || {})[`${a.x},${a.y}`] || (a.x === 0 || tile(a.x - 1, a.y) === "#" ? 0 : a.x === CW - 1 || tile(a.x + 1, a.y) === "#" ? Math.PI : a.y === 0 ? Math.PI / 2 : -Math.PI / 2); Act.shot((a.x + .5) * TS + Math.cos(dir) * 26, (a.y + .5) * TS + Math.sin(dir) * 26, dir, 300, { col: "#c0a080", r: 5, kind: "arrow", max: 4 }); } }
    // plaques
    if (R.def.cond === "platesAny" || R.def.cond === "plates") checkSolve();
    // pousser un bloc en marchant dedans
    const v = Game.moveVec();
    if (v.x || v.y) {
      const dx = Math.abs(v.x) > Math.abs(v.y) ? Math.sign(v.x) : 0, dy = dx ? 0 : Math.sign(v.y);
      const tx = Math.floor((p.x + dx * 30) / TS), ty = Math.floor((p.y - 6 + dy * 26) / TS), b = blockAt(tx, ty);
      if (b) { pushT += dt; if (pushT > .28) { pushT = 0; pushBlock(b, dx, dy, false); } } else pushT = 0;
    } else pushT = 0;
    // dangers du sol
    const fl = floorAt(p.x, p.y);
    if (p.roll <= 0 || fl === "pit") {
      if (fl === "pit" || fl === "lava") { hazard(fl); }
      else if (fl === "spike") { if (Act.hurtPlayer(1, p.x, p.y - 20)) Music.sfx("trap"); }
      else if (fl === "wind") { const w = R.def.wind || [0, -1]; const nx = p.x + w[0] * 170 * dt, ny = p.y + w[1] * 170 * dt; if (!solid(nx, ny, 10)) { p.x = nx; p.y = ny; } }
      else if (fl === "crumble") { const k = K(Math.floor(p.x / TS), Math.floor(p.y / TS)); if (!(R.crumble[k] > 0) && R.crumble[k] !== -1) { R.crumble[k] = .55; Music.sfx("rock", .3); } }
    }
    if (fl === "key") { const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS); setTile(tx, ty, "."); const S = Prog.cave(n); S.keys++; S.chests[R.id + ":" + tx + "," + ty] = true; Prog.changed(); Music.jingle("item"); Game.toast("🗝️ Une petite clé !"); }
    if (fl === "heart") { const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS); setTile(tx, ty, "."); Prog.heal(1); Music.sfx("pickup"); }
    // les rôdeurs des grottes au tour par tour
    for (const w of R.wanderers) if (w.alive && Math.hypot(w.x - p.x, w.y - p.y) < 40 && !Game.busy()) { startWander(w); break; }
    // portes : sortir de la salle
    const tx = Math.floor(p.x / TS), ty = Math.floor(p.y / TS);
    if (tile(tx, ty) === "D") { const dd = doorDir(tx, ty); if (dd && doorState(dd) === "open") return leave(dd); }
    if (p.y < 4) leave("n"); else if (p.y > CH * TS - 4) leave("s"); else if (p.x < 4) leave("w"); else if (p.x > CW * TS - 4) leave("e");
    // boss vaincu ?
    if (R.boss && !R.boss.alive) bossDown();
    checkSolve();
    if (R.def.tick) R.def.tick(api(), dt);
  }
  async function startWander(w) {
    w.alive = false; const res = await Battle.start({ foes: w.group, bg: "cave", bgOpt: { col: PAL[n].wall, glow: "rgba(140,200,255,.2)" } });
    if (res === "win") { R.foesLeft--; Music.jingle("victory"); if (Math.random() < .35) Prog.give(pickDrop(), 1); checkSolve(); }
    else if (res === "flee") { w.alive = true; Act.enemies.push(w); w.x = w.hx; w.y = w.hy; Game.player.x = R.entry.x; Game.player.y = R.entry.y; }
    else Game.caveDeath();
  }
  const pickDrop = () => ["potion", "perle", "coquillage", "poisson", "herbe"][Math.floor(Math.random() * 5)];
  function hazard(kind) {
    const now = performance.now(); if (now - lastHaz < 700) return; lastHaz = now;
    const p = Game.player; Music.sfx(kind === "pit" ? "fall" : "fire");
    Game.toast(kind === "pit" ? "Tu tombes dans le vide !" : "Aïe, la lave !", 1200);
    p.x = R.entry.x; p.y = R.entry.y; Act.inv = 0;
    if (Prog.hurt(1)) Game.caveDeath(); else Act.inv = 1;
  }
  function leave(dir) {
    const to = R.def.exits && R.def.exits[dir]; if (!to) return;
    if (to === "out") return Game.exitCave(n);
    const back = { n: "s", s: "n", e: "w", w: "e" }[dir];
    Game.fade(() => load(to, back));
  }

  // ---------------------------------------------------------------- dessin
  function lowSetup() { if (!cave.pixel) { low = null; return; } if (!low) { low = document.createElement("canvas"); lowc = low.getContext("2d"); } }
  function drawTile(c, x, y, ch, P) {
    const X = x * TS, Y = y * TS, k = K(x, y);
    const floor = () => { c.fillStyle = (x + y) % 2 ? P.floor : P.floor2; c.fillRect(X, Y, TS, TS); };
    switch (ch) {
      case "#": c.fillStyle = P.wall; c.fillRect(X, Y, TS, TS); c.fillStyle = P.wall2; c.fillRect(X + 3, Y + 3, TS - 6, TS - 16); if (tile(x, y + 1) !== "#") { c.fillStyle = P.top; c.fillRect(X, Y, TS, 6); } break;
      case "C": c.fillStyle = P.wall; c.fillRect(X, Y, TS, TS); c.fillStyle = P.wall2; c.fillRect(X + 3, Y + 3, TS - 6, TS - 16); c.strokeStyle = "rgba(0,0,0,.6)"; c.lineWidth = 2; c.beginPath(); c.moveTo(X + 14, Y + 6); c.lineTo(X + 24, Y + 20); c.lineTo(X + 18, Y + 30); c.lineTo(X + 30, Y + 42); c.stroke(); break;
      case "~": c.fillStyle = P.water; c.fillRect(X, Y, TS, TS); c.strokeStyle = "rgba(255,255,255,.25)"; c.lineWidth = 2; c.beginPath(); c.moveTo(X + 6, Y + 20 + Math.sin(t * 2 + x) * 3); c.quadraticCurveTo(X + 24, Y + 14, X + 42, Y + 20 + Math.sin(t * 2 + x + 1) * 3); c.stroke(); break;
      case "_": case "I": {
        if (R.bridges[k] > 0) { floor(); c.fillStyle = "#5a8a3a"; for (let i = 0; i < 4; i++) c.fillRect(X + 4, Y + 6 + i * 11, TS - 8, 6); break; }
        c.fillStyle = "#07050a"; c.fillRect(X, Y, TS, TS); if (tile(x, y - 1) !== "_" && tile(x, y - 1) !== "I") { c.fillStyle = "rgba(0,0,0,.6)"; c.fillRect(X, Y, TS, 10); }
        if (ch === "I" && R.lit) { c.fillStyle = "rgba(255,250,200,.55)"; c.fillRect(X + 3, Y + 3, TS - 6, TS - 6); c.strokeStyle = "#fff6c8"; c.strokeRect(X + 4, Y + 4, TS - 8, TS - 8); } break; }
      case "L": if (R.cooled[k] > 0) { c.fillStyle = "#4a4a52"; c.fillRect(X, Y, TS, TS); c.fillStyle = "#5a5a62"; c.fillRect(X + 6, Y + 6, 14, 10); break; }
        c.fillStyle = "#c0401a"; c.fillRect(X, Y, TS, TS); c.fillStyle = "#ff8a3a"; c.beginPath(); c.arc(X + 14 + Math.sin(t + x) * 4, Y + 18, 8, 0, TAU); c.arc(X + 34, Y + 34 + Math.cos(t * 1.3 + y) * 4, 7, 0, TAU); c.fill(); break;
      case "^": case "s": case "S": floor(); { const up = ch === "^" || spikesUp(ch); c.fillStyle = up ? "#c8c8d0" : "#6a6a72"; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const sx = X + 8 + i * 14, sy = Y + 10 + j * 14; c.beginPath(); c.moveTo(sx, sy + 8); c.lineTo(sx + 4, up ? sy - 4 : sy + 4); c.lineTo(sx + 8, sy + 8); c.fill(); } } break;
      case "=": c.fillStyle = "#8a6a4a"; c.fillRect(X, Y, TS, TS); c.fillStyle = "#6a4a2a"; for (let i = 0; i < 4; i++) c.fillRect(X, Y + i * 12, TS, 2); break;
      case "i": c.fillStyle = "#cfeaf8"; c.fillRect(X, Y, TS, TS); c.fillStyle = "rgba(255,255,255,.7)"; c.fillRect(X + 8, Y + 8, 12, 3); break;
      case "P": floor(); c.fillStyle = blockAt(x, y) ? "#5a8a5a" : "#8a7a6a"; c.fillRect(X + 8, Y + 8, TS - 16, TS - 16); c.strokeStyle = "rgba(0,0,0,.3)"; c.strokeRect(X + 8, Y + 8, TS - 16, TS - 16); break;
      case "w": floor(); c.strokeStyle = "rgba(255,255,255,.45)"; c.lineWidth = 2; { const w = R.def.wind || [0, -1], o = (t * 40) % 16; for (let i = 0; i < 3; i++) { c.beginPath(); const cx = X + 24 + w[0] * (o + i * 16 - 16), cy = Y + 24 + w[1] * (o + i * 16 - 16); c.moveTo(cx - w[1] * 8 - w[0] * 4, cy - w[0] * 8 - w[1] * 4); c.lineTo(cx + w[0] * 4, cy + w[1] * 4); c.lineTo(cx + w[1] * 8 - w[0] * 4, cy + w[0] * 8 - w[1] * 4); c.stroke(); } } break;
      case "c": if (R.crumble[k] === -1) { c.fillStyle = "#07050a"; c.fillRect(X, Y, TS, TS); break; } floor(); c.strokeStyle = "rgba(0,0,0,.4)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X + 6, Y + 10); c.lineTo(X + 20, Y + 24); c.lineTo(X + 40, Y + 14); c.moveTo(X + 20, Y + 24); c.lineTo(X + 24, Y + 42); c.stroke(); if (R.crumble[k] > 0) { c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(X, Y, TS, TS); } break;
      case "D": { const st = doorState(doorDir(x, y)); floor(); if (st !== "open") { c.fillStyle = st === "key" ? "#8a6a3a" : st === "boss" ? "#5a2a5a" : "#4a4a52"; c.fillRect(X + 2, Y + 2, TS - 4, TS - 4); c.fillStyle = st === "key" ? "#ffd23a" : st === "boss" ? "#ff9ad0" : "#7a7a86"; c.beginPath(); c.arc(X + 24, Y + 24, st === "boss" ? 10 : 6, 0, TAU); c.fill(); if (st === "shut") { c.fillStyle = "#2a2a32"; for (let i = 0; i < 4; i++) c.fillRect(X + 6 + i * 11, Y + 2, 4, TS - 4); } } break; }
      case "g": floor(); c.fillStyle = "#3a3a42"; for (let i = 0; i < 4; i++) c.fillRect(X + 6 + i * 11, Y, 4, TS); c.fillRect(X, Y + 8, TS, 4); break;
      case "r": case "b": floor(); { const up = ch === "r" ? R.crystal === 0 : R.crystal === 1, col = ch === "r" ? "#e05a6a" : "#5a8ae0"; c.fillStyle = up ? col : "rgba(0,0,0,.2)"; c.fillRect(X + 4, Y + (up ? 2 : 14), TS - 8, up ? TS - 8 : TS - 20); if (up) { c.fillStyle = "rgba(255,255,255,.3)"; c.fillRect(X + 4, Y + 2, TS - 8, 8); } else { c.strokeStyle = col; c.strokeRect(X + 6, Y + 16, TS - 12, TS - 24); } } break;
      default: floor(); if (ch === ",") { c.fillStyle = P.deco; c.globalAlpha = .5; c.fillRect(X + 10 + (x * 7) % 20, Y + 12 + (y * 5) % 18, 6, 4); c.fillRect(X + 28 - (x * 3) % 12, Y + 30, 4, 4); c.globalAlpha = 1; }
    }
  }
  function drawObj(c, x, y, ch, P) {
    const X = x * TS, Y = y * TS, cx = X + TS / 2;
    if (ch === "T" || ch === "t") { c.fillStyle = "#5a4a3a"; c.fillRect(cx - 5, Y + 14, 10, 30); c.fillStyle = "#7a6a5a"; c.fillRect(cx - 9, Y + 10, 18, 8); if (ch === "t") { c.fillStyle = "rgba(255,170,60,.25)"; c.beginPath(); c.arc(cx, Y + 4, 26, 0, TAU); c.fill(); for (let i = 0; i < 3; i++) { c.fillStyle = ["#ff7a3a", "#ffb03a", "#ffe08a"][i]; c.beginPath(); c.arc(cx + Math.sin(t * 9 + i + x) * 2, Y + 6 - i * 5, 8 - i * 2, 0, TAU); c.fill(); } } }
    else if (ch === "V") { c.fillStyle = "#3a6a2a"; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(X + 8 + i * 8, Y + 24 + Math.sin(i * 2) * 8, 9, 0, TAU); c.fill(); } c.strokeStyle = "#2a4a1a"; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(X + 4 + i * 12, Y + 40); c.lineTo(X + 10 + i * 12, Y + 8); c.stroke(); } c.fillStyle = "#c0d0a0"; for (let i = 0; i < 6; i++) { c.fillRect(X + 6 + i * 7, Y + 14 + (i % 3) * 9, 2, 4); } }
    else if (ch === "*") { c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(X + 8, Y + 40, 32, 6); c.fillStyle = "#8a8a96"; c.beginPath(); c.roundRect(X + 10, Y + 4, 28, 40, [12, 12, 2, 2]); c.fill(); c.strokeStyle = P.accent; c.lineWidth = 2; c.beginPath(); for (let a = 0; a < 9; a += .3) c.lineTo(cx + Math.cos(a) * a * 1.1, Y + 22 + Math.sin(a) * a * 1.1); c.stroke(); }
    else if (ch === "l") { const l = R.levers.find((q) => q.x === x && q.y === y); c.fillStyle = "#6a6a72"; c.fillRect(cx - 10, Y + 30, 20, 12); c.strokeStyle = "#c9a05a"; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, Y + 32); c.lineTo(cx + (l && l.on ? 14 : -14), Y + 10); c.stroke(); c.fillStyle = l && l.on ? "#7ae07a" : "#e05a5a"; c.beginPath(); c.arc(cx + (l && l.on ? 14 : -14), Y + 10, 5, 0, TAU); c.fill(); }
    else if (ch === "O") { c.fillStyle = R.crystal ? "#5a8ae0" : "#e05a6a"; c.beginPath(); c.moveTo(cx, Y + 4); c.lineTo(cx + 14, Y + 22); c.lineTo(cx, Y + 42); c.lineTo(cx - 14, Y + 22); c.fill(); c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.moveTo(cx, Y + 8); c.lineTo(cx + 6, Y + 20); c.lineTo(cx, Y + 26); c.fill(); }
    else if (ch === "X") { c.fillStyle = "#b07a4a"; c.beginPath(); c.ellipse(cx, Y + 28, 14, 16, 0, 0, TAU); c.fill(); c.fillStyle = "#8a5a3a"; c.fillRect(cx - 9, Y + 8, 18, 6); }
    else if (ch === "F") { c.fillStyle = "#6a6a72"; c.beginPath(); c.arc(cx, Y + 24, 20, 0, TAU); c.fill(); c.save(); c.translate(cx, Y + 24); c.rotate(t * (R.fanOn ? 12 : .3)); c.fillStyle = "#c9c9d6"; for (let i = 0; i < 4; i++) { c.rotate(TAU / 4); c.beginPath(); c.ellipse(9, 0, 9, 4, 0, 0, TAU); c.fill(); } c.restore(); }
    else if (ch === "a") { c.fillStyle = P.wall; c.fillRect(X, Y, TS, TS); c.fillStyle = "#1a1a1a"; c.beginPath(); c.arc(cx, Y + 24, 6, 0, TAU); c.fill(); }
    else if (ch === "K") { ITEMS.draw(c, "cle", cx, Y + 22 - Math.abs(Math.sin(t * 3)) * 4, 30); }
    else if (ch === "h") { c.fillStyle = "#ff5a7a"; c.save(); c.translate(cx, Y + 24 - Math.abs(Math.sin(t * 3)) * 3); c.beginPath(); c.moveTo(0, 7); c.bezierCurveTo(-12, -3, -6, -12, 0, -5); c.bezierCurveTo(6, -12, 12, -3, 0, 7); c.fill(); c.restore(); }
  }
  function drawChest(c, ch) {
    if (ch.hidden) return; const X = ch.x * TS, Y = ch.y * TS, s = ch.big ? 1.25 : 1;
    c.save(); c.translate(X + TS / 2, Y + TS - 6); c.scale(s, s);
    c.fillStyle = "rgba(0,0,0,.25)"; c.fillRect(-18, -2, 36, 5);
    c.fillStyle = ch.big ? "#6a3a8a" : "#a8703f"; c.beginPath(); c.roundRect(-17, -22, 34, 22, 3); c.fill();
    if (!ch.open) { c.fillStyle = ch.big ? "#8a5aaa" : "#c98d5a"; c.beginPath(); c.roundRect(-17, -32, 34, 12, 5); c.fill(); c.fillStyle = "#ffd23a"; c.fillRect(-3, -24, 6, 8); }
    else { c.fillStyle = "#2a1a10"; c.fillRect(-15, -24, 30, 4); c.fillStyle = ch.big ? "#8a5aaa" : "#c98d5a"; c.beginPath(); c.roundRect(-17, -40, 34, 10, 4); c.fill(); }
    c.restore();
  }
  function drawBlock(c, b, P) { const X = b.x * TS, Y = b.y * TS; c.fillStyle = "rgba(0,0,0,.3)"; c.fillRect(X + 4, Y + TS - 8, TS - 8, 8); c.fillStyle = b.heavy ? "#5a5a66" : "#9a7a5a"; c.fillRect(X + 3, Y + 2, TS - 6, TS - 8); c.fillStyle = b.heavy ? "#6a6a78" : "#b08a6a"; c.fillRect(X + 3, Y + 2, TS - 6, 10); c.strokeStyle = "rgba(0,0,0,.3)"; c.strokeRect(X + 8, Y + 16, TS - 16, TS - 26); if (b.heavy) { c.fillStyle = P.accent; c.font = "900 16px system-ui"; c.textAlign = "center"; c.fillText("≋", X + TS / 2, Y + 34); } }

  function render(c, vw, vh) {
    const P = PAL[n] || PAL[1];
    const p = Game.player, roomW = CW * TS, roomH = CH * TS;
    const fit = Math.min(vw / roomW, (vh - 20) / roomH), z = Math.max(fit, Math.min(1, Math.min(vw, vh) / 430));
    let cx = Math.max(roomW / 2 - Math.max(0, (roomW - vw / z) / 2), Math.min(roomW / 2 + Math.max(0, (roomW - vw / z) / 2), p.x));
    let cy = Math.max(roomH / 2 - Math.max(0, (roomH - vh / z) / 2), Math.min(roomH / 2 + Math.max(0, (roomH - vh / z) / 2), p.y - 20));
    if (roomW * z <= vw) cx = roomW / 2; if (roomH * z <= vh) cy = roomH / 2;
    const sh = Game.shakeOffset();
    // en pixel art, on dessine dans une petite image, agrandie ensuite sans lissage
    const px = cave.pixel ? 3 : 1;
    let g = c, W = vw, H = vh;
    if (px > 1) { W = Math.ceil(vw / px); H = Math.ceil(vh / px); if (low.width !== W || low.height !== H) { low.width = W; low.height = H; } g = lowc; g.setTransform(1, 0, 0, 1, 0, 0); g.imageSmoothingEnabled = false; }
    g.fillStyle = "#050406"; g.fillRect(0, 0, W, H);
    g.save(); g.translate(W / 2 + sh.x / px, H / 2 + sh.y / px); g.scale(z / px, z / px); g.translate(-cx, -cy);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) drawTile(g, x, y, tile(x, y), P);
    // objets triés par profondeur
    const items = [];
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) { const ch = tile(x, y); if ("TtV*lOXFaKh".includes(ch)) items.push({ y: (y + 1) * TS - 2, f: () => drawObj(g, x, y, ch, P) }); }
    for (const ch of R.chests) items.push({ y: (ch.y + 1) * TS - 3, f: () => drawChest(g, ch) });
    for (const b of R.blocks) items.push({ y: (b.y + 1) * TS - 4, f: () => drawBlock(g, b, P) });
    Act.collect(items.length ? items : items);
    items.push({ y: p.y, f: () => Game.drawPlayer(g) });
    const partner = Game.partnerInCave(n, R.id); if (partner) items.push({ y: partner.y, f: () => Game.drawPartner(g, partner) });
    items.sort((a, b) => a.y - b.y);
    for (const it of items) { if (it.f) it.f(); else if (it.enemy) Act.drawEnemy(g, it.enemy, t); }
    Act.drawTop(g, t);
    g.restore();
    // obscurité
    const dark = R.def.dark && !R.lit;
    if (dark || P.dark > .6) {
      const sx = (p.x - cx) * z / px + W / 2, sy = (p.y - 24 - cy) * z / px + H / 2;
      const rad = (dark ? (Prog.has("torche") ? 120 : 80) : 260) * z / px, a = dark ? .93 : (P.dark - .55);
      const gr = g.createRadialGradient(sx, sy, rad * .3, sx, sy, rad); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, `rgba(0,0,0,${a})`);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      // les torches allumées éclairent aussi
      if (dark) { g.globalCompositeOperation = "destination-out"; for (const q of R.torches) if (q.lit) { const tx = ((q.x + .5) * TS - cx) * z / px + W / 2, ty = ((q.y + .3) * TS - cy) * z / px + H / 2, rr = 90 * z / px; const g2 = g.createRadialGradient(tx, ty, 2, tx, ty, rr); g2.addColorStop(0, "rgba(0,0,0,.9)"); g2.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = g2; g.fillRect(tx - rr, ty - rr, rr * 2, rr * 2); } g.globalCompositeOperation = "source-over"; }
    }
    if (px > 1) { c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.imageSmoothingEnabled = false; c.drawImage(low, 0, 0, W * px, H * px); c.restore(); c.imageSmoothingEnabled = true; }
  }

  // ---------------------------------------------------------------- outils donnés aux scripts des salles
  function api() {
    return {
      R, tile, setTile, solve, toast: Game.toast, spawn: (type, x, y) => Act.spawn(type, (x + .5) * TS, (y + .5) * TS), give: Prog.give, flag: Prog.flag, set: Prog.set,
      say: (sp, txt) => Dialog.say(typeof sp === "string" ? NPC.speaker(sp) : sp, txt), cut: (fn) => Cutscene.play(fn), cave: Prog.cave(n), n, TS,
      openTiles(ch, to = ".") { for (let i = 0; i < R.tiles.length; i++) if (R.tiles[i] === ch) R.tiles[i] = to; },
      get player() { return Game.player; },
    };
  }

  // ---------------------------------------------------------------- entrée / sortie
  function enter(num, roomId) {
    n = num; cave = CAVES[num]; if (!cave) { Game.toast("Cette grotte n'est pas encore ouverte."); return false; }
    const S = Prog.cave(num);
    t = 0; Act.setEnv(Game.caveEnv({ solid: (x, y, r, fly) => solid(x, y, r, fly), onSpell, onShotWall }));
    load(roomId || cave.start, null);
    Music.play(cave.music, 1.2);
    if (!S.done._visited) { S.done._visited = true; Prog.changed(); if (cave.intro) setTimeout(() => Game.toast(cave.intro, 4500), 600); }
    return true;
  }
  const respawn = () => { load(cave.start, null); };
  return { startBoss, CAVES, PAL, TS, CW, CH, enter, update, render, interact, hitWorld, respawn, solve, get room() { return R; }, get cave() { return cave; }, get n() { return n; } };
})();
