/* Watchers — monde : tuiles, carte, déplacements, mécaniques des régions, Watchers en liberté. */
"use strict";
const T = 16;

// ------------------------------------------------------------------ Tuiles par région
const TILESETS = {};
function tilesetFor(region) {
  if (TILESETS[region]) return TILESETS[region];
  const A = ART, R = region;
  const pal = [null, A.P1, A.P2, A.P3, A.P4, A.P4][R];
  const ground = [null, (s) => A.grass(s), (s) => A.sand(s), (s) => A.snow(s), (s) => A.ash(s), (s) => A.ash(s)][R];
  const pathT = R === 4 || R === 5 ? (s) => A.flagstone(s) : R === 3 ? (s) => A.path(s, A.P3) : R === 2 ? (s) => A.path(s, A.P2) : (s) => A.path(s);
  const ts = {
    ".": [ground(1), ground(2), ground(6)], ",": [ground(2)], p: [pathT(3), pathT(4)], '"': [A.tallGrass(pal)],
    w: [0, 1, 2, 3].map((f) => (R === 2 ? A.deep(f) : A.water(f, pal))), "~": [0, 1, 2, 3].map((f) => A.shallow(f)),
    f: [A.flowers(4, pal)], r: [R === 3 ? A.iceRock() : A.rock(pal)], F: [A.fence(pal)], S: [A.sign(pal)],
    m: [A.mushroom(pal)], i: [A.ice()], c: [A.campfire(0), A.campfire(1)], l: [0, 1, 2, 3].map((f) => A.lava(f)),
    b: [A.brazier(0), A.brazier(1)], k: [A.crystal()], "#": [A.ruinWall()], n: [A.planks()], s: [A.shell()],
    e: [A.flagstone(7)], R: [A.ruinWall()], h: [A.flagstone(5)], D: [pathT(3)], M: [ground(1)], o: [ground(1)], x: [ground(1)],
  };
  ts.big = { T: A.tree(pal), q: A.palm(), P: A.snowPine(), X: A.deadTree(), H: A.house() };
  ts.mush = A.mushroomSprite();
  return (TILESETS[region] = ts);
}
// Propriétés : bloquant, herbe, eau, glace…
const SOLID = new Set(["T", "q", "P", "X", "H", "r", "F", "S", "#", "R", "l", "b", "k", "c", "m", "M", "h"]);
const tileAt = (map, x, y) => (y < 0 || y >= map.rows.length || x < 0 || x >= map.rows[0].length ? "T" : map.rows[y][x]);

// ------------------------------------------------------------------ État du monde
const World = {
  map: null, px: 0, py: 0, dir: "down", moving: null, steps: 0, surfing: false,
  roamers: [], npcs: [], anim: 0, lastSafe: null, onStep: [],
};

function loadMap(id, x, y, dir) {
  const map = MAPS[id];
  World.map = map; World.px = x; World.py = y; World.dir = dir || World.dir; World.moving = null;
  World.surfing = tileAt(map, x, y) === "w";
  G.save.map = id; G.save.x = x; G.save.y = y;
  if (!G.save.visited.includes(id)) G.save.visited.push(id);
  if (!G.save.regions.includes(map.region)) G.save.regions.push(map.region);
  World.npcs = (map.npcs || []).filter((n) => !n.when || n.when(G)).map((n) => ({ ...n, sprite: npcSprite(n), dir: n.dir || "down" }));
  spawnRoamers();
  UI.banner(map.name);
  MUSIC.play(map.music || "region" + map.region);
  if (map.region === 3 && map.cold && G.save.cold == null) G.save.cold = 100;
  if (map.enter) map.enter(G);
}

const _npcCache = {};
function npcSprite(n) {
  const key = JSON.stringify(n.look || {});
  if (_npcCache[key]) return _npcCache[key];
  const L = n.look || {};
  // Petit sprite d'exploration 16×16 : réduction du portrait en pied
  const full = TRAINER_ART.draw(L.spec || { skin: L.skin, hair: L.hair || "#5e3420", hairStyle: L.hairStyle || "short", outfit: L.outfit || "coat", main: L.main || "#2c4f57", accent: L.accent || "#c9a84a", mask: L.mask, eyes: L.eyes, hat: L.hat });
  const c = document.createElement("canvas"); c.width = 16; c.height = 16;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false;
  g.drawImage(full, 4, 0, 24, 48, 2, 0, 12, 16);
  return (_npcCache[key] = c);
}

// ------------------------------------------------------------------ Watchers en liberté
const _miniCache = {};
function miniSprite(species, shiny) {
  const k = species + shiny;
  if (_miniCache[k]) return _miniCache[k];
  const sp = SPECIES[species];
  const full = CREATURE_ART.draw({ seed: sp.seed, type: sp.types[0], type2: sp.types[1], shape: sp.shape, stage: sp.stage, shiny });
  const c = document.createElement("canvas"); c.width = 20; c.height = 20;
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.drawImage(full, 0, 0, 40, 40, 0, 0, 20, 20);
  return (_miniCache[k] = c);
}
function spawnRoamers() {
  const map = World.map; World.roamers = [];
  const table = map.wild || [];
  if (!table.length) return;
  const cells = [];
  map.rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '"' || (ch === "w" && table.some((e) => e[3] === "w"))) cells.push([x, y, ch]); }));
  const n = Math.min(map.roamers || 6, Math.floor(cells.length / 5));
  for (let i = 0; i < n; i++) World.roamers.push(newRoamer(cells));
}
function newRoamer(cells) {
  const map = World.map;
  for (let tries = 0; tries < 30; tries++) {
    const [x, y, ch] = cells[Math.floor(Math.random() * cells.length)];
    if (Math.abs(x - World.px) + Math.abs(y - World.py) < 4) continue;
    const pool = map.wild.filter((e) => (e[3] || "g") === (ch === "w" ? "w" : "g"));
    if (!pool.length) continue;
    const total = pool.reduce((a, e) => a + (e[4] || 1), 0); let r = Math.random() * total, pick = pool[0];
    for (const e of pool) { r -= e[4] || 1; if (r <= 0) { pick = e; break; } }
    const level = pick[1] + Math.floor(Math.random() * (pick[2] - pick[1] + 1));
    return { x, y, fx: x, fy: y, species: pick[0], level, shiny: Math.random() < SHINY_CHANCE, cooldown: Math.random() * 2, habitat: ch === "w" ? "w" : '"', cells };
  }
  return null;
}
function updateRoamers(dt) {
  World.roamers = World.roamers.filter(Boolean);
  for (const r of World.roamers) {
    r.fx += (r.x - r.fx) * Math.min(1, dt * 5); r.fy += (r.y - r.fy) * Math.min(1, dt * 5);
    r.cooldown -= dt;
    if (r.cooldown <= 0) {
      r.cooldown = .8 + Math.random() * 2.2;
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      const nx = r.x + dx, ny = r.y + dy, t = tileAt(World.map, nx, ny);
      if (t === r.habitat && !World.roamers.some((o) => o !== r && o.x === nx && o.y === ny)) { r.x = nx; r.y = ny; }
    }
    if (r.x === World.px && r.y === World.py && !G.busy) { startWildBattle(r); return; }
  }
}
function startWildBattle(r) {
  World.roamers = World.roamers.filter((o) => o !== r);
  const mon = createMon(r.species, r.level, { shiny: r.shiny, caughtIn: World.map.name });
  G.seen(r.species);
  Battle.start({ wild: mon }).then(() => { setTimeout(() => { if (World.map && r.cells) { const nr = newRoamer(r.cells); if (nr) World.roamers.push(nr); } }, 6000); });
}

// ------------------------------------------------------------------ Mécaniques
function tideHigh() { return World.map.tide && Math.floor(G.save.tideSteps / 30) % 2 === 1; }
function isLit(map, x, y) {
  // Brume (M) : passable si un champignon allumé ou un cristal est à moins de 3 cases
  return (G.save.lit[map.id] || []).some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) <= 3);
}
function passable(x, y) {
  const map = World.map, t = tileAt(map, x, y);
  if (t === "M") return isLit(map, x, y);
  if (SOLID.has(t)) return false;
  if (t === "w" || (t === "~" && tideHigh())) return G.canSurf();
  if (World.npcs.some((n) => n.x === x && n.y === y && !n.ghost)) return false;
  if (activeLegend(map, x, y)) return false;
  return true;
}

function activeLegend(map, x, y) { return (map.legend || []).find((L) => L.x === x && L.y === y && !G.flag("legend:" + L.species) && (!L.when || L.when(G))); }
function tryMove(dir, run) {
  if (World.moving || G.busy) return;
  World.dir = dir;
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir];
  const nx = World.px + dx, ny = World.py + dy;
  const map = World.map;
  // Sortie de carte
  const mw = map.rows[0].length, mh = map.rows.length;
  const edge = map.exits?.find((e) => (e.side === "up" && ny < 0 && nx >= e.a && nx <= e.b) || (e.side === "down" && ny >= mh && nx >= e.a && nx <= e.b) || (e.side === "left" && nx < 0 && ny >= e.a && ny <= e.b) || (e.side === "right" && nx >= mw && ny >= e.a && ny <= e.b));
  if (edge) {
    if (edge.lock && !edge.lock(G)) { UI.say(null, edge.lockMsg || "Le chemin est bloqué."); return; }
    const T2 = MAPS[edge.map], tw = T2.rows[0].length, th = T2.rows.length;
    const tx = edge.x ?? (edge.side === "left" ? tw - 1 : edge.side === "right" ? 0 : nx + (edge.dx || 0));
    const ty = edge.y ?? (edge.side === "up" ? th - 1 : edge.side === "down" ? 0 : ny + (edge.dy || 0));
    UI.fade(() => loadMap(edge.map, tx, ty, dir)); return;
  }
  if (!passable(nx, ny)) {
    const t = tileAt(map, nx, ny);
    if ((t === "w" || t === "~") && !G.canSurf()) maybeHint("water");
    return;
  }
  const slide = tileAt(map, nx, ny) === "i";
  World.moving = { fx: World.px, fy: World.py, tx: nx, ty: ny, t: 0, speed: slide ? 9 : run ? 8 : 4.5, slide, dir };
}
let _hintShown = {};
function maybeHint(k) {
  if (_hintShown[k]) return; _hintShown[k] = true;
  if (k === "water") UI.say(null, "L'eau est profonde. Il te faudrait un Watcher de type Onde et quelqu'un pour t'apprendre à traverser.");
}

function arrive() {
  const m = World.moving; World.px = m.tx; World.py = m.ty; World.moving = null;
  const map = World.map, t = tileAt(map, World.px, World.py);
  World.surfing = t === "w" || (t === "~" && tideHigh());
  G.save.x = World.px; G.save.y = World.py; World.steps++;
  if (!World.surfing && t !== "i") World.lastSafe = [World.px, World.py];
  // Marées
  if (map.tide) {
    const before = tideHigh(); G.save.tideSteps++;
    if (tideHigh() !== before) {
      UI.toast(tideHigh() ? "La marée monte…" : "La marée descend.");
      if (tideHigh() && t === "~" && !G.canSurf() && World.lastSafe) { World.px = World.lastSafe[0]; World.py = World.lastSafe[1]; UI.say(null, "La marée t'a repoussé vers le rivage."); }
    }
  }
  // Froid
  if (map.cold) {
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => tileAt(map, World.px + a, World.py + b) === "c");
    if (near) { if (G.save.cold < 100) UI.toast("Tu te réchauffes au feu."); G.save.cold = 100; G.save.lastFire = [map.id, World.px, World.py]; }
    else if (World.steps % 2 === 0) G.save.cold = Math.max(0, (G.save.cold ?? 100) - 1);
    if (G.save.cold <= 0) {
      G.busy = true;
      UI.say(null, "Le froid te transperce… Tu t'effondres dans la neige.").then(() => {
        const [mid, fx, fy] = G.save.lastFire || [map.id, World.lastSafe[0], World.lastSafe[1]];
        G.save.cold = 100; G.busy = false; UI.fade(() => loadMap(mid, fx, fy + 1, "down"));
      });
    }
  }
  // Lumière
  if (map.dark) {
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => tileAt(map, World.px + a, World.py + b) === "b");
    if (near) { if ((G.save.light ?? 100) < 100) UI.toast("La flamme ravive ta lanterne."); G.save.light = 100; }
    else G.save.light = Math.max(8, (G.save.light ?? 100) - .6);
  }
  // Glissade sur la glace
  if (m.slide) {
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[m.dir];
    if (passable(World.px + dx, World.py + dy) && !map.exits?.some(() => false)) { World.moving = { fx: World.px, fy: World.py, tx: World.px + dx, ty: World.py + dy, t: 0, speed: 9, slide: tileAt(map, World.px + dx, World.py + dy) === "i", dir: m.dir }; return; }
  }
  // Portes / téléporteurs
  const warp = map.warps?.[World.px + "," + World.py];
  if (warp) {
    if (warp.lock && !warp.lock(G)) { UI.say(null, warp.lockMsg || "C'est fermé."); }
    else { UI.fade(() => loadMap(warp.to, warp.x, warp.y, warp.dir || World.dir)); return; }
  }
  // Objets au sol
  const it = (map.items || []).find((o) => o.x === World.px && o.y === World.py && !G.flag("item:" + map.id + ":" + o.x + "," + o.y));
  if (it) { G.setFlag("item:" + map.id + ":" + it.x + "," + it.y); G.give(it.item, it.qty || 1); }
  // Dresseurs qui te voient
  for (const n of World.npcs) if (n.trainer && !G.flag("beat:" + n.id) && seesPlayer(n)) { triggerNpc(n, true); return; }
  // Rencontre directe avec un Watcher sauvage
  const r = World.roamers.find((o) => o.x === World.px && o.y === World.py);
  if (r && !G.busy) startWildBattle(r);
}
function seesPlayer(n) {
  const range = n.sight ?? 4;
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[n.dir];
  for (let i = 1; i <= range; i++) {
    const x = n.x + dx * i, y = n.y + dy * i;
    if (x === World.px && y === World.py) return true;
    if (SOLID.has(tileAt(World.map, x, y))) return false;
  }
  return false;
}

// Bouton A : interagir avec ce qui est devant
function interact() {
  if (World.moving || G.busy) return;
  const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[World.dir];
  const x = World.px + dx, y = World.py + dy, map = World.map, t = tileAt(map, x, y);
  const npc = World.npcs.find((n) => n.x === x && n.y === y);
  if (npc) return triggerNpc(npc, false);
  const sign = map.signs?.[x + "," + y];
  if (sign) return UI.say(null, typeof sign === "function" ? sign(G) : sign);
  if (t === "m" || t === "k") {
    const lit = (G.save.lit[map.id] = G.save.lit[map.id] || []);
    if (lit.some(([a, b]) => a === x && b === y)) return UI.say(null, t === "m" ? "Le champignon brille doucement." : "Le cristal rayonne.");
    lit.push([x, y]); SFX.play("light");
    return UI.say(null, t === "m" ? "Tu effleures le champignon… Une lumière turquoise chasse la brume alentour !" : "Tu ranimes le cristal. Sa lumière repousse les ténèbres.");
  }
  if (t === "h") { SFX.play("heal"); G.healAll(); return UI.say(null, "Tu poses la main sur l'autel. Une chaleur douce soigne ton équipe."); }
  if (t === "c") { G.save.cold = 100; G.save.lastFire = [map.id, World.px, World.py]; return UI.say(null, "Tu te réchauffes au feu de camp."); }
  if (t === "b") { G.save.light = 100; return UI.say(null, "Tu ravives ta lanterne à la flamme du brasero."); }
  if ((t === "w" || t === "~") && G.canSurf()) return; // marcher dedans suffit
  const leg = (map.legend || []).find((L) => L.x === x && L.y === y && !G.flag("legend:" + L.species) && (!L.when || L.when(G)));
  if (leg) return legendEncounter(leg);
}
async function legendEncounter(L) {
  G.busy = true;
  await UI.say(null, L.text || "Une présence immense te fait face…");
  G.busy = false;
  const mon = createMon(L.species, SPECIES[L.species].level || 60, { caughtIn: World.map.name });
  G.seen(L.species);
  const res = await Battle.start({ wild: mon, legend: true });
  if (res === "caught" || res === "win") G.setFlag("legend:" + L.species);
}
async function triggerNpc(n, spotted) {
  if (G.busy) return;
  G.busy = true;
  // L'interlocuteur se tourne vers le joueur
  n.dir = { up: "down", down: "up", left: "right", right: "left" }[World.dir];
  if (spotted) { SFX.play("alert"); await UI.exclaim(n); }
  try { await n.talk(G, n); } finally { G.busy = false; }
}

// ------------------------------------------------------------------ Rendu
function drawWorld(g, W, H, dt) {
  const map = World.map; if (!map) return;
  const ts = tilesetFor(map.region);
  World.anim += dt;
  let px = World.px, py = World.py;
  if (World.moving) { const m = World.moving; px = m.fx + (m.tx - m.fx) * m.t; py = m.fy + (m.ty - m.fy) * m.t; }
  const mw = map.rows[0].length, mh = map.rows.length;
  let camX = px * T + 8 - W / 2, camY = py * T + 8 - H / 2;
  camX = Math.max(-8 * T, Math.min(mw * T - W + 8 * T, camX)); camY = Math.max(-8 * T, Math.min(mh * T - H + 8 * T, camY));
  camX = Math.round(camX); camY = Math.round(camY);
  g.fillStyle = map.void || "#0d140f"; g.fillRect(0, 0, W, H);
  const x0 = Math.floor(camX / T) - 2, y0 = Math.floor(camY / T) - 2, x1 = x0 + Math.ceil(W / T) + 4, y1 = y0 + Math.ceil(H / T) + 4;
  const frame = Math.floor(World.anim * 3) % 4;
  const high = tideHigh();
  const lit = G.save.lit[map.id] || [];
  const big = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    let t = tileAt(map, x, y);
    const outside = y < 0 || y >= mh || x < 0 || x >= mw;
    if (outside) t = map.outside || "T";
    if (t === "~" && high) t = "w";
    let set = ts[t];
    if (!set || ["T", "q", "P", "X", "H"].includes(t)) set = ts["."];
    const tile = set[(t === "w" || t === "~" || t === "l") ? frame : t === "c" || t === "b" ? frame % 2 : (x * 7 + y * 13 & 0xffff) % set.length];
    g.drawImage(tile, x * T - camX, y * T - camY);
    if (t === "m" && lit.some(([a, b]) => a === x && b === y)) { g.drawImage(ts.mush, x * T - camX, y * T - camY); }
    // Objets 2×2 / maisons 4×4 ancrés en haut à gauche
    if (["T", "q", "P", "X"].includes(t) && ((x % 2 + 2) % 2 === 0) && ((y % 2 + 2) % 2 === 0)) big.push({ img: ts.big[t], x: x * T - camX, y: y * T - camY - 4, base: y + 2 });
    if (t === "H" && tileAt(map, x - 1, y) !== "H" && tileAt(map, x, y - 1) !== "H") big.push({ img: ts.big.H, x: x * T - camX, y: y * T - camY - 2, base: y + 4 });
    // Objet ramassable : petit scintillement
    const it = !outside && (map.items || []).find((o) => o.x === x && o.y === y && !G.flag("item:" + map.id + ":" + x + "," + y));
    if (it && Math.floor(World.anim * 2 + x) % 3 !== 0) { g.fillStyle = "#fff3a0"; g.fillRect(x * T - camX + 7, y * T - camY + 6, 2, 2); g.fillRect(x * T - camX + 6, y * T - camY + 7, 4, 1); g.fillRect(x * T - camX + 7, y * T - camY + 5, 1, 4); }
  }
  // Watchers en liberté (cachés dans les herbes : seule l'herbe frémit)
  for (const r of World.roamers) {
    const sx = Math.round(r.fx * T - camX), sy = Math.round(r.fy * T - camY);
    if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
    const peek = Math.sin(World.anim * 1.3 + r.x * 3) > .82;
    if (peek || r.habitat === "w") big.push({ img: miniSprite(r.species, r.shiny), x: sx - 2, y: sy - (r.habitat === "w" ? 6 : 8), base: r.fy + .9, clipGrass: r.habitat !== "w" });
    const wob = Math.sin(World.anim * 14 + r.x) * 1.5;
    g.fillStyle = "#4f8a5c"; g.fillRect(sx + 4 + wob, sy + 2, 1, 4); g.fillRect(sx + 10 - wob, sy + 3, 1, 4); g.fillRect(sx + 7, sy + 1 + Math.abs(wob), 1, 3);
    if (r.shiny && Math.floor(World.anim * 3 + r.x) % 4 === 0) { g.fillStyle = "#fff3a0"; g.fillRect(sx + 7, sy - 4, 2, 2); g.fillRect(sx + 3, sy, 1, 1); g.fillRect(sx + 12, sy + 1, 1, 1); }
  }
  for (const L of map.legend || []) {
    if (!activeLegend(map, L.x, L.y)) continue;
    const lx = L.x * T - camX, ly = L.y * T - camY;
    big.push({ img: miniSprite(L.species, false), x: lx - 2, y: ly - 8 + Math.round(Math.sin(World.anim * 2) * 1.5), base: L.y + .95, glow: TYPE_UI[SPECIES[L.species].types[0]] });
  }
  for (const n of World.npcs) big.push({ img: n.sprite, x: n.x * T - camX, y: n.y * T - camY - 2, base: n.y + .99, flip: n.dir === "left" });
  const heroImg = ART.hero(World.dir === "up" ? "up" : "down");
  const bob = World.moving ? Math.floor(World.anim * 10) % 2 : 0;
  big.push({ img: heroImg, x: Math.round(px * T - camX), y: Math.round(py * T - camY) - 2 - bob, base: py + 1, flip: World.dir === "left", hero: true });
  big.sort((a, b) => a.base - b.base);
  for (const b of big) {
    if (b.glow) { const h = g.createRadialGradient(b.x + 10, b.y + 10, 2, b.x + 10, b.y + 10, 22); h.addColorStop(0, b.glow + "aa"); h.addColorStop(1, b.glow + "00"); g.fillStyle = h; g.fillRect(b.x - 14, b.y - 14, 48, 48); }
    if (b.flip) { g.save(); g.translate(b.x + b.img.width, b.y); g.scale(-1, 1); g.drawImage(b.img, 0, 0); g.restore(); }
    else if (b.clipGrass) g.drawImage(b.img, 0, 0, b.img.width, 12, b.x, b.y, b.img.width, 12);
    else g.drawImage(b.img, b.x, b.y);
    if (b.hero && World.surfing) { g.fillStyle = "rgba(190,230,255,.7)"; g.fillRect(b.x - 1, b.y + 13, 18, 2); }
  }
  // Ambiance : brume / nuit / obscurité selon la région
  const cx = px * T + 8 - camX, cy = py * T + 8 - camY;
  const fx = map.fx || {};
  let inner = fx.inner ?? 36, outer = fx.outer ?? 125, tint = fx.tint || "40,50,60", a1 = fx.a1 ?? .42, a2 = fx.a2 ?? .9;
  if (map.dark) { const L = (G.save.light ?? 100) / 100; inner = 18 + 30 * L; outer = 60 + 70 * L; }
  if (fx.none) return;
  const grd = g.createRadialGradient(cx, cy, inner, cx, cy, outer);
  grd.addColorStop(0, `rgba(${tint},0)`); grd.addColorStop(.5, `rgba(${tint},${a1})`); grd.addColorStop(1, `rgba(${tint},${a2})`);
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  const halo = (x, y, r, col) => { const h = g.createRadialGradient(x, y, 2, x, y, r); h.addColorStop(0, col); h.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = h; g.fillRect(x - r, y - r, r * 2, r * 2); };
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const t = tileAt(map, x, y), sx = x * T + 8 - camX, sy = y * T + 8 - camY;
    if (t === "m" && lit.some(([a, b]) => a === x && b === y)) halo(sx, sy, 46, "rgba(94,224,198,.55)");
    else if (t === "m") halo(sx, sy, 14, "rgba(94,224,198,.25)");
    if (t === "c") halo(sx, sy, 40, "rgba(255,150,60,.5)");
    if (t === "b") halo(sx, sy - 2, 34, "rgba(163,107,214,.5)");
    if (t === "l") halo(sx, sy, 16, "rgba(255,90,58,.25)");
    if (t === "k") halo(sx, sy, lit.some(([a, b]) => a === x && b === y) ? 50 : 18, "rgba(94,224,198,.45)");
    if (t === "h") halo(sx, sy, 22, "rgba(255,240,200,.3)");
  }
  // Brume dense (M) non dissipée
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (tileAt(map, x, y) === "M" && !isLit(map, x, y)) {
    g.fillStyle = "rgba(150,165,180,.85)"; g.fillRect(x * T - camX, y * T - camY, T, T);
    g.fillStyle = "rgba(200,210,220,.5)"; g.fillRect(x * T - camX + ((World.anim * 4 + y * 5) % 12), y * T - camY + 4, 6, 2);
  }
  // Neige / embruns / braises qui tombent
  if (fx.particles) {
    g.fillStyle = fx.particles;
    for (let i = 0; i < 40; i++) { const x = (i * 37 + World.anim * (8 + i % 5) * (fx.drift || 1)) % W, y = (i * 53 + World.anim * (14 + i % 7) * (fx.fall ?? 1)) % H; g.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
  }
}

function updateWorld(dt) {
  if (World.moving) {
    const m = World.moving; m.t += dt * m.speed;
    if (m.t >= 1) arrive();
  }
  if (!World.moving && !G.busy) {
    const d = Input.dir();
    if (d) tryMove(d, Input.run());
  }
  if (!G.busy) updateRoamers(dt);
}
