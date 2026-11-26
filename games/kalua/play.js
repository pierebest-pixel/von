/* Les Échoués de Kalua — le jeu : île, grottes, combats, cinématiques, PNJ, récolte, chasse, jour et nuit, HUD.
 * Modes : "world" (l'île), "cave" (une grotte), "battle" (tour par tour), "cut" (cinématique). */
"use strict";

const G = {
  on: false, session: null, world: null, t: 0, last: 0, mode: "world",
  p: null, others: new Map(), parts: [], cam: { x: 0, y: 0, z: 1.3 },
  input: { u: 0, d: 0, l: 0, r: 0, run: false, dpad: { x: 0, y: 0 } }, toastOnce: {},
  lock: 0, shakeT: 0, shakeA: 0, fadeA: 0, boss: null, harvest: new Map(), owSpawns: new Map(), place: "", music: null, objective: "",
};
function resize() {
  cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR);
  const land = innerWidth > innerHeight;
  G.cam.z = Math.max(land ? .5 : .72, Math.min(1.15, Math.min(innerWidth, innerHeight) / (land ? 620 : 450)));
}
addEventListener("resize", resize);
resize();

// ================================================================ l'API du jeu (utilisée par les autres modules)
const Game = {
  get player() { return G.p; }, get world() { return G.world; }, get mode() { return G.mode; },
  myAvatar: () => avatar || Avatar.DEFAULT,
  partnerAvatar: () => { const o = [...G.others.values()][0]; return (o && o.avatar) || Avatar.normalize(Object.assign({}, Avatar.DEFAULT, { hair: "long", hairColor: "#c96a3a", top: "robe", topColor: "#ffb0c8" })); },
  partnerName: () => { const o = [...G.others.values()][0]; return o ? o.name : ""; },
  moveVec: () => inputVector(),
  busy: () => G.lock > 0 || Dialog.open || G.menuOpen || G.mode === "battle" || G.mode === "cut" || Cutscene.active,
  lockInput(v) { G.lock = Math.max(0, G.lock + (v ? 1 : -1)); if (v) resetInput(); },
  toast: (m, ms) => toast(m, null, ms),
  shake(a = 6, t = .3) { G.shakeA = a; G.shakeT = t; },
  shakeOffset: () => (G.shakeT > 0 ? { x: (Math.random() - .5) * G.shakeA * 2, y: (Math.random() - .5) * G.shakeA * 2 } : { x: 0, y: 0 }),
  camSnap() { G.cam.x = G.p.x; G.cam.y = G.p.y; },
  fade(fn) { G.fadeA = 1; Music.sfx("step"); setTimeout(() => { fn(); setTimeout(() => { G.fadeA = 0; }, 60); }, 140); },
  pickup(id, n) { const nm = ITEMS.name(id); Music.sfx("pickup"); pickupToast(id, `+${n} ${nm}`); },
  bossBar(e) { G.boss = e; },
  drawPlayer: (c) => drawCharacter(c, G.p, avatar, true),
  drawPartner: (c, o) => drawCharacter(c, o, o.avatar, false),
  partnerInCave(n, room) { for (const o of G.others.values()) if (o.has && o.zone === `c${n}:${room}`) return o; return null; },
  caveEnv: (o) => Object.assign({ player: G.p, light: false, shake: (a, t) => Game.shake(a, t), hint: (t) => toast(t, "hint:" + t, 3200), onDeath: () => Game.caveDeath() }, o),
  enterCutscene() { G.prevMode = G.mode === "cut" ? G.prevMode : G.mode; G.mode = "cut"; hud.hidden = true; resetInput(); },
  leaveCutscene() { G.mode = G.prevMode || "world"; hud.hidden = false; G.p.kx = G.p.ky = 0; ambience(true); },
  enterBattle() { G.prevBattleMode = G.mode; G.mode = "battle"; hud.hidden = true; resetInput(); },
  leaveBattle(res) { G.mode = G.prevBattleMode || "world"; hud.hidden = false; ambience(true); if (res === "lose" && G.mode === "world") worldDeath(); },
  async exitCave(n) { G.boss = null; Game.fade(() => { G.mode = "world"; Act.clear(); Act.setEnv(worldEnv()); const cvx = KALUA.CAVES.find((c) => c.n === n); G.p.x = cvx.x * KALUA.K; G.p.y = cvx.y * KALUA.K + 110; G.p.dir = "down"; Game.camSnap(); G.zone = "w"; ambience(true); Prog.P.pos = { x: G.p.x, y: G.p.y }; Prog.save(); toast("📍 " + G.world.placeName(G.p.x, G.p.y)); }); },
  caveDeath() { if (G.dying) return; G.dying = true; resetInput(); setTimeout(() => { G.dying = false; Prog.P.hp = Prog.P.maxHp; Prog.changed(); Game.fade(() => { Dungeon.respawn(); toast("Tu t'évanouis… et tu te réveilles à l'entrée de la grotte."); }); }, 500); },
  enterCave(n, room) { if (!Dungeon.CAVES[n]) { toast("Cette grotte ne s'ouvre pas encore."); return; } Prog.P.pos = { x: G.p.x, y: G.p.y }; Game.fade(() => { G.mode = "cave"; G.zone = "c" + n; if (!Dungeon.enter(n, room)) { G.mode = "world"; Act.setEnv(worldEnv()); } }); },
  teleport(x, y) { G.p.x = x; G.p.y = y; Game.camSnap(); },
  objective(txt) { G.objective = txt || ""; },
};

// ================================================================ entrer sur l'île
async function play(id) {
  Music.stop(1.2);
  clearScreen(); showLoading();
  let s;
  try { s = await Net.enter(id, avatar); } catch (err) { console.warn(err); return showError(err.code === "gone" ? "gone" : "offline"); }
  bigMap(); // prépare l'image de la mini-carte pendant l'écran de chargement
  clearScreen();
  G.session = s; G.world = world();
  Prog.load(id, me.uid, s); Prog.merge(s.progress);
  const P = Prog.P;
  const sp = P.pos && G.world.walkable(P.pos.x, P.pos.y) ? P.pos : s.savedPos && G.world.walkable(s.savedPos.x, s.savedPos.y) ? s.savedPos : { x: G.world.spawn.x + (s.island.owner === me.uid ? -26 : 26), y: G.world.spawn.y };
  G.p = { x: sp.x, y: sp.y, dir: sp.d || "down", moving: false, walk: 0, swing: 0, roll: 0, rollV: [0, 0], cool: 0, a: "", at: 0, dust: 0, kx: 0, ky: 0, shield: 0 };
  G.mode = "world"; G.zone = "w"; Game.camSnap(); G.place = G.world.placeName(G.p.x, G.p.y); G.lastSave = Date.now();
  Act.clear(); Act.setEnv(worldEnv());
  G.others.clear(); G.parts = [];
  for (const uid of s.others) {
    const o = { uid, name: s.island.members[uid]?.name || "?", avatar: null, online: false, x: 0, y: 0, tx: 0, ty: 0, dir: "down", moving: false, walk: 0, swing: 0, roll: 0, seenAt: 0, has: false, zone: "w" };
    G.others.set(uid, o);
    s.watchPlayer(uid, (v) => { if (!v) return; o.name = v.name || o.name; o.avatar = v.avatar || o.avatar; o.online = v.online === true; updateBadge(); });
    s.watchPos(uid, (v) => {
      if (!v) return;
      const z = v.z || "w";
      if (z !== o.zone || !o.has || Math.hypot(o.x - v.x, o.y - v.y) > 400) { o.x = v.x; o.y = v.y; o.has = true; }
      o.zone = z; o.tx = v.x; o.ty = v.y; o.dir = v.d || o.dir; o.moving = Boolean(v.m);
      if (v.at && v.at !== o.seenAt) { const fresh = o.seenAt !== 0; o.seenAt = v.at; if (fresh && z === G.zone) remoteAction(o, v.a); }
    });
  }
  updateBadge();
  hud.hidden = false; applySettings(); refreshMagic();
  G.on = true; G.last = performance.now();
  sendPos(true);
  requestAnimationFrame(frame);
  if (!P.flags.intro_done) await Story.intro();
  else { setTimeout(() => toast("📍 " + G.place), 600); Story.resume && Story.resume(); }
  ambience(true);
}

async function leaveGame(next = showIslands) {
  closeMenu(); G.on = false; hud.hidden = true;
  if (G.mode === "world") Prog.P.pos = { x: G.p.x, y: G.p.y };
  Prog.save(true);
  const s = G.session; G.session = null;
  if (s) { sendPos(true, s); await s.leave(); }
  G.mode = "world"; Act.clear();
  next();
}
$("#menu-btn").addEventListener("click", () => openMenu());

function updateBadge() {
  const o = [...G.others.values()][0];
  $("#badge").innerHTML = o ? `<span class="dot ${o.online ? "on" : ""}"></span>${esc(o.name)} ${o.online ? "est sur l'île" : "n'est pas là"}` : "";
}

let toastTimer = 0;
function toast(msg, once, ms = 2600) {
  if (once) { if (G.toastOnce[once]) return; G.toastOnce[once] = true; }
  const el = $("#toast"); el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}
let pickT = 0;
function pickupToast(id, txt) {
  const box = $("#pickups"); if (!box) return;
  const d = document.createElement("div"); d.className = "pick"; d.innerHTML = `<img src="${ITEMS.img(id, 28)}" alt="">${esc(txt)}`; box.appendChild(d);
  setTimeout(() => d.remove(), 2200); while (box.children.length > 4) box.firstChild.remove();
}

function sendPos(force, s = G.session) {
  if (!s || !G.p) return;
  const p = G.p, z = G.mode === "cave" ? `c${Dungeon.n}:${Dungeon.room ? Dungeon.room.id : ""}` : "w";
  const k = `${Math.round(p.x)},${Math.round(p.y)},${p.dir},${p.moving},${p.at},${z}`;
  if (!force && k === G.lastKey && performance.now() - (G.lastSentT || 0) < 3000) return;
  G.lastKey = k; G.lastSentT = performance.now(); G.lastSave = Date.now();
  s.sendPos({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, d: p.dir, m: p.moving, a: p.a, at: p.at, z });
}

// ================================================================ actions
const FACING = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const HIT_KINDS = ["palm", "jtree", "rock", "bush", "mangrove", "lavarock", "deadtree"];
const GRAB_KINDS = ["shell", "mushroom", "flower", "reed", "lily"];
// ce que donne chaque élément du décor
const HARVEST = {
  palm: { hits: 3, give: [["bois", 1], ["feuille", 1], ["coco", .5]], fx: "wood", tool: "hache" }, jtree: { hits: 3, give: [["bois", 2], ["liane", .5], ["banane", .25]], fx: "wood", tool: "hache" },
  deadtree: { hits: 2, give: [["bois", 1], ["cendre", .3]], fx: "wood", tool: "hache" }, mangrove: { hits: 3, give: [["bois", 1], ["roseau", .5], ["gelee", .2]], fx: "wood", tool: "hache" },
  rock: { hits: 3, give: [["pierre", 1], ["silex", .4], ["fer", .3, "pioche"]], fx: "stone", tool: "pioche" }, lavarock: { hits: 3, give: [["pierre", 1], ["soufre", .3], ["obsidienne", .5, "pioche"]], fx: "stone", tool: "pioche" },
  bush: { hits: 1, give: [["banane", .3], ["herbe", .3], ["plume", .05]], fx: "leaf" },
};
const GRAB_GIVE = { shell: ["coquillage", 1], mushroom: ["champignon", 1], flower: ["herbe", .5], reed: ["roseau", .6], lily: ["lotus", .15] };
const HUNT = { vache: [["viande", 1], ["cuir", 1]], cochon: [["viande", 2], ["cuir", .5]], chevre: [["corne", 1], ["viande", .5]], mouton: [["laine", 2], ["viande", .5]], poule: [["plume", .5], ["viande", .5]], canard: [["plumeMouette", .5], ["viande", .5]],
  cheval: [["cuir", 2]], lapin: [["viande", 1]], crabe: [["carapace", 1]], mouette: [["plumeMouette", 1]], bernard: [["coquillage", 2], ["carapace", .4]], singe: [["banane", 1]], perroquet: [["plume", 1]], papillon: [["herbe", 1]],
  grenouille: [["gelee", 1]], libellule: [["gelee", .5]], heron: [["plumeMouette", 1]], bouquetin: [["corne", 1], ["cuir", .5]], lezard: [["ecaille", 1]], aigle: [["plumeAigle", 1]], salamandre: [["ecaille", 1], ["cristalFeu", .1]], scarabee: [["carapace", 1]], chauvesouris: [["cuir", .3]] };
const KIND_NO_HUNT = ["chien", "chat"];

function burst(x, y, kind, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 120;
    const col = { wood: ["#e0b48a", "#c9956b", "#f0cfa6"], stone: ["#d6d3e3", "#b9b5c9", "#fff"], leaf: ["#8fd18a", "#a6dc94", "#ff9fb8"], spark: ["#fff", "#ffe08a", "#ffc6d6"], dust: ["#f3dcb4"], love: ["#ff7f9f", "#ffb0c8"] }[kind];
    G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === "spark" || kind === "love" ? 40 : 90), g: kind === "spark" || kind === "love" ? 0 : 320, life: 0, max: .45 + Math.random() * .35,
      c: col[Math.floor(Math.random() * col.length)], s: kind === "dust" ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2.5, kind });
  }
}
const weaponDmg = () => (Prog.has("lameObsidienne") ? 3 : Prog.has("epeeCorail") ? 2 : 1);
const animalHidden = (a) => { const h = Prog.P.hunted[a.id]; return h && Date.now() < h; };
const goldenAnimal = (a) => { const day = Math.floor(Net.now() / NPC.DAY); return KALUA.hash(a.id * 13 + day, day * 7 + 3) < .025; };

function hitTarget(x, y, dir, local) {
  const f = FACING[dir] || [0, 1];
  const an = Creatures.nearest(x + f[0] * 20, y + f[1] * 16, Net.now(), G.world, 48);
  if (an) { an.a.hop = 1; burst(an.p.x, an.p.y - 20, "spark", 6); if (local) huntAnimal(an.a, an.p); return { kind: "animal", a: an.a }; }
  const o = G.world.nearest(x, y, dir, HIT_KINDS);
  if (!o) return null;
  o.shake = .5;
  const H = HARVEST[o.kind];
  if (H) burst(o.x + (x < o.x ? -6 : 6), o.y - (H.fx === "wood" ? 30 : 8), H.fx, 9);
  if (local && H) harvest(o, H);
  return o;
}
function harvest(o, H) {
  const k = Math.round(o.x) + "," + Math.round(o.y);
  const st = G.harvest.get(k) || { n: 0 }; st.n += (H.tool && Prog.has(H.tool)) ? 2 : 1; G.harvest.set(k, st);
  Music.sfx(H.fx === "stone" ? "rock" : "wood", .7);
  if (st.n < H.hits) return;
  G.harvest.set(k, { n: 0 });
  let got = false;
  for (const [id, ch, need] of H.give) { if (need && !Prog.has(need)) continue; if (Math.random() < ch) { Prog.give(id, 1); got = true; } }
  if (!got) Prog.give(H.give[0][0], 1);
  if (o.kind !== "bush") { o.gone = true; o.back = Date.now() + 90000; G.harvestGone = (G.harvestGone || []).concat(o); burst(o.x, o.y - 10, H.fx, 14); }
  Story.event && Story.event("harvest", o.kind);
}
function huntAnimal(a, p) {
  if (KIND_NO_HUNT.includes(a.kind)) { toast(`On ne chasse pas un ${Creatures.NAMES[a.kind].toLowerCase()} ! Il remue la queue.`, "nohunt"); burst(p.x, p.y - 26, "love", 6); return; }
  a.hp = (a.hp ?? 2) - weaponDmg(); Music.sfx("hit", .6);
  if (a.hp > 0) return;
  a.hp = undefined; Prog.P.hunted[a.id] = Date.now() + 240000; Prog.changed();
  for (const [id, ch] of HUNT[a.kind] || [["viande", 1]]) if (Math.random() < ch) Prog.give(id, 1);
  if (goldenAnimal(a)) { Prog.give("larmeDoree", 1); Music.jingle("secret"); toast("✨ Un animal doré ! Il laisse une Larme dorée."); }
  burst(p.x, p.y - 20, "dust", 10); Music.sfx("kill", .6);
  Story.event && Story.event("hunt", a.kind);
}

function doAction(a) {
  const p = G.p; if (!p || !G.on || Game.busy()) return;
  if (G.mode === "battle" || G.mode === "cut") return;
  if (a === "hit" && p.swing <= 0 && p.roll <= 0) {
    p.swing = .32; p.a = "hit"; p.at = Date.now(); Music.sfx("swing", .5);
    if (Act.playerHit(p, weaponDmg())) { sendPos(true); return; }
    if (G.mode === "cave") { Dungeon.hitWorld(p); sendPos(true); return; }
    if (Story.hit && Story.hit(p)) { sendPos(true); return; }
    hitTarget(p.x, p.y, p.dir, true);
    sendPos(true);
  } else if (a === "grab" && p.roll <= 0) {
    p.a = "grab"; p.at = Date.now(); p.swing = .2;
    if (G.mode === "cave") { Dungeon.interact(p); sendPos(true); return; }
    worldInteract(p);
    sendPos(true);
  } else if (a === "dodge" && p.roll <= 0 && p.cool <= 0) {
    const v = inputVector();
    const f = v.x || v.y ? [v.x, v.y] : FACING[p.dir];
    p.roll = .34; p.cool = .5; p.rollV = f; p.a = "roll"; p.at = Date.now(); Act.inv = Math.max(Act.inv, .34);
    sendPos(true);
  } else if (a === "magic") {
    const sp = Prog.P.spell; if (!sp) { toast("Tu ne connais encore aucun chant. Cherche les maîtres au point noir !", "nospell"); return; }
    if (Act.cast(sp, p)) { p.swing = .25; p.a = "cast"; p.at = Date.now(); sendPos(true); }
  } else if (a === "swap") {
    const L = Prog.P.spells; if (L.length < 2) { toast(L.length ? "Tu ne connais qu'un chant pour l'instant." : "Aucun chant appris.", "swap"); return; }
    Prog.P.spell = L[(L.indexOf(Prog.P.spell) + 1) % L.length]; Prog.changed(); refreshMagic(); toast(`${Battle.SPELLS[Prog.P.spell].icon} Chant : ${Battle.SPELLS[Prog.P.spell].name}`, null, 1200);
  }
}

// le bouton « Ramasser » sur l'île : parler, entrer, ramasser, caresser…
function worldInteract(p) {
  const T = Net.now();
  const n = NPC.nearest(p.x, p.y, T, 80);
  if (n) { const s = n.s; p.dir = Math.abs(s.x - p.x) > Math.abs(s.y - p.y) ? (s.x < p.x ? "left" : "right") : (s.y < p.y ? "up" : "down"); Story.talk(n.n.id); return; }
  if (Story.interact && Story.interact(p)) return;
  const cave = G.world.nearest(p.x, p.y, p.dir, ["cave"], 150);
  if (cave) { Story.caveDoor(cave.cave.n); return; }
  const o = G.world.nearest(p.x, p.y, p.dir, GRAB_KINDS, 46);
  if (o) { o.bob = 1; burst(o.x, o.y - 4, "spark", 8); const [id, ch] = GRAB_GIVE[o.kind]; if (Math.random() < ch) { Prog.give(id, 1); o.gone = true; o.back = Date.now() + 120000; G.harvestGone = (G.harvestGone || []).concat(o); } else toast("Rien d'utile ici.", null, 900); return; }
  const an = Creatures.nearest(p.x + FACING[p.dir][0] * 20, p.y + FACING[p.dir][1] * 16, T, G.world, 52);
  if (an && !animalHidden(an.a)) { an.a.hop = 1; burst(an.p.x, an.p.y - 30, "love", 8); Music.sfx("pickup", .4);
    if (goldenAnimal(an.a) && !Prog.P.flags["gold" + an.a.id + Math.floor(T / NPC.DAY)]) { Prog.P.flags["gold" + an.a.id + Math.floor(T / NPC.DAY)] = true; Prog.give("larmeDoree", 1); Music.jingle("secret"); toast(`✨ Le ${Creatures.NAMES[an.a.kind].toLowerCase()} doré se laisse caresser… et pleure une Larme dorée !`); }
    else toast(`Tu caresses le ${Creatures.NAMES[an.a.kind].toLowerCase()}. ${Creatures.DOMESTIC.includes(an.a.kind) ? "Il a l'air content." : "Il se laisse faire, surpris."}`, null, 1400);
    Story.event && Story.event("pet", an.a.kind); return; }
  toast("Rien à ramasser ici.", null, 900);
}

function remoteAction(o, a) {
  if (G.mode !== "world") { if (a === "hit") o.swing = .32; if (a === "roll") o.roll = .34; return; }
  if (a === "hit") { o.swing = .32; hitTarget(o.tx, o.ty, o.dir, false); }
  if (a === "grab") { o.swing = .2; const s = G.world.nearest(o.tx, o.ty, o.dir, GRAB_KINDS, 46); if (s) { s.bob = 1; burst(s.x, s.y - 4, "spark", 6); } }
  if (a === "roll") o.roll = .34;
  if (a === "cast") o.swing = .25;
}

// ================================================================ commandes
function inputVector() {
  const I = G.input;
  let x = (I.r - I.l) + I.dpad.x, y = (I.d - I.u) + I.dpad.y;
  x = Math.max(-1, Math.min(1, x)); y = Math.max(-1, Math.min(1, y));
  const n = Math.hypot(x, y); return n > 1 ? { x: x / n, y: y / n } : { x, y };
}
const KEYS = { ArrowUp: "u", KeyW: "u", KeyZ: "u", ArrowDown: "d", KeyS: "d", ArrowLeft: "l", KeyA: "l", KeyQ: "l", ArrowRight: "r", KeyD: "r" };
addEventListener("keydown", (e) => {
  if (!G.on || e.target.closest && e.target.closest("input,textarea")) return;
  if (KEYS[e.code]) { G.input[KEYS[e.code]] = 1; e.preventDefault(); }
  if (e.key === "Shift") G.input.run = true;
  if (e.repeat) return;
  if (e.code === "Space" || e.code === "KeyJ") doAction("hit");
  if (e.code === "KeyE" || e.code === "KeyK") doAction("grab");
  if (e.code === "KeyX" || e.code === "KeyL") doAction("dodge");
  if (e.code === "KeyF" || e.code === "KeyM") doAction("magic");
  if (e.code === "KeyR") doAction("swap");
  if (e.code === "Escape") { if (G.menuOpen) closeMenu(); else openMenu(); }
});
addEventListener("keyup", (e) => { if (KEYS[e.code]) G.input[KEYS[e.code]] = 0; if (e.key === "Shift") G.input.run = false; });
function resetInput() { G.input.u = G.input.d = G.input.l = G.input.r = 0; G.input.run = false; G.input.dpad = { x: 0, y: 0 }; document.querySelectorAll(".dpad b, .act").forEach((b) => b.classList.remove("on")); }
addEventListener("blur", resetInput);

const dpad = $("#dpad");
let dpadId = null;
function dpadAt(e) {
  const r = dpad.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const dx = e.clientX - cx, dy = e.clientY - cy, dead = r.width * .12;
  const x = Math.abs(dx) > dead ? Math.sign(dx) : 0, y = Math.abs(dy) > dead ? Math.sign(dy) : 0;
  G.input.dpad = { x, y };
  dpad.querySelectorAll("b[data-d]").forEach((b) => b.classList.toggle("on", (b.dataset.d === "l" && x < 0) || (b.dataset.d === "r" && x > 0) || (b.dataset.d === "u" && y < 0) || (b.dataset.d === "d" && y > 0)));
}
dpad.addEventListener("pointerdown", (e) => { dpadId = e.pointerId; dpad.setPointerCapture(e.pointerId); dpadAt(e); e.preventDefault(); });
dpad.addEventListener("pointermove", (e) => { if (e.pointerId === dpadId) dpadAt(e); });
const dpadEnd = (e) => { if (e.pointerId !== dpadId) return; dpadId = null; G.input.dpad = { x: 0, y: 0 }; dpad.querySelectorAll("b").forEach((b) => b.classList.remove("on")); };
dpad.addEventListener("pointerup", dpadEnd); dpad.addEventListener("pointercancel", dpadEnd);
document.querySelectorAll(".act").forEach((b) => {
  const a = b.dataset.a;
  b.addEventListener("pointerdown", (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); b.classList.add("on"); if (a === "run") G.input.run = true; else doAction(a); });
  const up = () => { b.classList.remove("on"); if (a === "run") G.input.run = false; };
  b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up);
});
addEventListener("contextmenu", (e) => e.preventDefault());
document.addEventListener("visibilitychange", () => { if (G.session) G.session.setOnline(!document.hidden); if (document.hidden) { resetInput(); Prog.save(true); } else if (G.on) ambience(true); });
if (window.Von) { Von.onPause(resetInput); }
function refreshMagic() {
  const b = $("#magic-btn"); if (!b) return; const sp = Prog.P.spell;
  b.querySelector("span").textContent = sp ? Battle.SPELLS[sp].icon : "✨";
  b.classList.toggle("off", !sp); $("#swap-btn").hidden = Prog.P.spells.length < 2;
}

// ================================================================ l'île : ennemis, environnement
function worldEnv() {
  return { player: G.p, light: false, shake: (a, t) => Game.shake(a, t), hint: (t) => toast(t, "hint:" + t, 3000),
    solid: (x, y, r, fly) => !fly && !G.world.walkable(x, y), onDeath: () => worldDeath(), onKill: (e) => { Story.event && Story.event("kill", e.type); },
    onSpell: (sp, x, y) => { Story.spell && Story.spell(sp, x, y); } };
}
// groupes de créatures agressives (unités carte) : on les fait apparaître quand on approche
const OW_GROUPS = [
  ["sanglier", 300, 520, 3], ["sanglier", 430, 600, 3], ["sanglier", 250, 640, 2],
  ["croco", 420, 180, 3], ["croco", 540, 240, 2], ["croco", 360, 260, 2],
  ["condor", 1220, 400, 2], ["condor", 1320, 560, 1],
  ["golem", 900, 260, 1], ["golem", 760, 240, 1], ["golem", 1000, 190, 1],
  ["crabeGeant", 1000, 880, 1], ["crabeGeant", 640, 905, 1],
];
function owSpawner() {
  const K = KALUA.K, p = G.p;
  OW_GROUPS.forEach((g, i) => {
    const gx = g[1] * K, gy = g[2] * K, d = Math.hypot(gx - p.x, gy - p.y), st = G.owSpawns.get(i);
    if (d < 1200 && !st) {
      const until = Prog.P.flags["ow" + i]; if (until && Date.now() < until) return;
      const list = []; for (let k = 0; k < g[3]; k++) { const x = gx + (Math.random() - .5) * 200, y = gy + (Math.random() - .5) * 140; if (G.world.walkable(x, y)) list.push(Act.spawn(g[0], x, y, { group: i })); }
      G.owSpawns.set(i, list);
    } else if (st && d > 1700) { for (const e of st) e.alive = false; G.owSpawns.delete(i); }
    else if (st && st.every((e) => !e.alive) && d < 1700) { Prog.P.flags["ow" + i] = Date.now() + 180000; G.owSpawns.set(i, []); }
  });
}
function worldDeath() {
  if (G.dying) return; G.dying = true; resetInput();
  setTimeout(async () => {
    G.dying = false; Act.clear(); G.owSpawns.clear();
    const home = Prog.flag("village_found") ? NPC.W("villageFeu") : NPC.W("plage");
    Prog.P.hp = Prog.P.maxHp; Prog.changed();
    Game.fade(() => { Game.teleport(home.x + 40, home.y + 30); });
    await new Promise((r) => setTimeout(r, 500));
    if (Prog.flag("intro_done") && !Prog.isDead("nalia")) await Dialog.say(NPC.speaker("nalia"), "Doucement… Je t'ai ramené(e) au village. Tu t'étais évanoui(e). Repose-toi un peu, puis repars.");
    else toast("Tu t'évanouis… et tu te réveilles, la tête qui tourne.");
  }, 600);
}

// ================================================================ mini-carte
const MINI = { cv: $("#minimap"), last: 0, w: 0, h: 0 };
MINI.cv.addEventListener("click", () => { if (G.on && !G.menuOpen && G.mode === "world") openMap(); });
function drawMinimap(now) {
  if (now - MINI.last < 120) return;
  MINI.last = now;
  const cvs = MINI.cv, W = cvs.clientWidth, H = cvs.clientHeight;
  if (!W) return;
  if (MINI.w !== W || MINI.h !== H) { MINI.w = W; MINI.h = H; cvs.width = W * DPR; cvs.height = H * DPR; }
  const c = cvs.getContext("2d"), k = W / KALUA.MW, TAU = Math.PI * 2;
  c.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (G.mode === "cave") { c.fillStyle = "#2a2430"; c.fillRect(0, 0, W, H); const D = Dungeon.cave, S = Prog.cave(Dungeon.n); c.fillStyle = "#fff"; c.font = "800 9px ui-rounded"; c.textAlign = "center"; c.fillText(D ? D.name : "", W / 2, 13); c.fillText(`🗝️ ${S.keys}${S.bossKey ? "  🔑" : ""}`, W / 2, 30); c.fillText(Dungeon.room ? Dungeon.room.def.name || "" : "", W / 2, 46); return; }
  c.drawImage(bigMap(), 0, 0, W, H);
  const dot = (o, col, r) => { const x = o.x / KALUA.K * k, y = o.y / KALUA.K * k; c.fillStyle = "#fff"; c.beginPath(); c.arc(x, y, r + 1.6, 0, TAU); c.fill(); c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const obj = Story.target && Story.target(); if (obj) { c.fillStyle = "#ffd23a"; c.beginPath(); const x = obj.x / KALUA.K * k, y = obj.y / KALUA.K * k; c.moveTo(x, y - 5); c.lineTo(x + 4, y); c.lineTo(x, y + 5); c.lineTo(x - 4, y); c.fill(); }
  for (const o of G.others.values()) if (o.has && o.zone === "w") dot(o, "#ff7f9f", 3);
  dot(G.p, "#3a8fc0", 3.4 + Math.sin(now / 260) * .5);
}

// ================================================================ boucle
function frame(now) {
  if (!G.on) return;
  const dt = Math.min(.05, (now - G.last) / 1000); G.last = now; G.t += dt;
  if (G.shakeT > 0) G.shakeT -= dt;
  try {
    if (G.mode === "world") { updateWorld(dt); renderWorld(); }
    else if (G.mode === "cave") { updateCave(dt); renderCave(); }
    else if (G.mode === "battle") { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); Battle.render(ctx, innerWidth, innerHeight, dt); }
    else if (G.mode === "cut") { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, innerWidth, innerHeight); Cutscene.render(ctx, innerWidth, innerHeight, dt); }
    if (G.mode === "world" || G.mode === "cave") drawHUD(dt);
    if (G.fadeA > 0) { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = `rgba(0,0,0,${G.fadeA})`; ctx.fillRect(0, 0, innerWidth, innerHeight); }
    drawMinimap(now);
  } catch (e) { console.error(e); }
  Prog.P.t += dt;
  requestAnimationFrame(frame);
}

function movePlayer(dt, moveFn) {
  const p = G.p, v = Game.busy() ? { x: 0, y: 0 } : inputVector();
  p.swing = Math.max(0, p.swing - dt); p.cool = Math.max(0, p.cool - dt);
  let vx = 0, vy = 0;
  if (p.roll > 0) { p.roll = Math.max(0, p.roll - dt); vx = p.rollV[0] * 380; vy = p.rollV[1] * 380; }
  else { const sp = G.input.run ? 260 : 150; vx = v.x * sp; vy = v.y * sp; if (v.x || v.y) p.dir = Math.abs(v.x) > Math.abs(v.y) + .01 ? (v.x < 0 ? "left" : "right") : (v.y < 0 ? "up" : "down"); }
  if (p.kx || p.ky) { vx += p.kx; vy += p.ky; p.kx *= Math.pow(.002, dt); p.ky *= Math.pow(.002, dt); if (Math.abs(p.kx) + Math.abs(p.ky) < 10) p.kx = p.ky = 0; }
  p.moving = Boolean(vx || vy) && p.roll <= 0;
  if (vx || vy) { const n = moveFn(p.x, p.y, p.x + vx * dt, p.y + vy * dt); p.x = n.x; p.y = n.y; p.walk = (p.walk + dt * (G.input.run ? 3.2 : 2.2)) % 1;
    if (G.input.run && p.roll <= 0 && p.moving) { p.dust -= dt; if (p.dust <= 0) { p.dust = .07; burst(p.x, p.y + 2, "dust", 1); } } }
}
function updateOthers(dt) {
  for (const o of G.others.values()) {
    const k = Math.min(1, dt * 10), d = Math.hypot(o.tx - o.x, o.ty - o.y);
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
    o.swing = Math.max(0, o.swing - dt); o.roll = Math.max(0, o.roll - dt);
    if (o.moving || d > 2) o.walk = (o.walk + dt * 2.2) % 1;
  }
  G.parts = G.parts.filter((q) => { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= .96; return q.life < q.max; });
}

function updateWorld(dt) {
  const p = G.p, W = G.world;
  movePlayer(dt, (x, y, nx, ny) => W.move(x, y, nx, ny));
  Act.update(dt);
  sendPos(false);
  updateOthers(dt);
  W.update(dt, G.view || { x0: p.x - 400, x1: p.x + 400, y0: p.y - 400, y1: p.y + 400 });
  for (const a of Creatures.list) if (a.hop > 0) a.hop = Math.max(0, a.hop - dt * 2.5);
  KALUA.work(9);
  G.spawnT = (G.spawnT || 0) - dt; if (G.spawnT <= 0) { G.spawnT = .7; owSpawner(); if (G.harvestGone) { const now = Date.now(); G.harvestGone = G.harvestGone.filter((o) => { if (now > o.back) { o.gone = false; return false; } return true; }); } }
  G.placeT = (G.placeT || 0) - dt;
  if (G.placeT <= 0) { G.placeT = .5; const pl = W.placeName(p.x, p.y); if (pl !== G.place) { G.place = pl; toast("📍 " + pl); Story.event && Story.event("place", pl); } ambience(); }
  if (Date.now() - G.lastSave > 5000) { G.lastSave = Date.now(); Prog.P.pos = { x: p.x, y: p.y }; Prog.save(); }
  if (Story.update) Story.update(dt);
  const k = Math.min(1, dt * 6);
  G.cam.x += (p.x - G.cam.x) * k; G.cam.y += (p.y - 20 - G.cam.y) * k;
}
function updateCave(dt) {
  movePlayer(dt, (x, y, nx, ny) => { let tx = nx, ty = ny; if (Dungeon.room && (Act.env.solid(tx, ty, 11, false))) { if (!Act.env.solid(nx, y, 11, false)) ty = y; else if (!Act.env.solid(x, ny, 11, false)) tx = x; else { tx = x; ty = y; } } return { x: tx, y: ty }; });
  if (G.fadeA <= 0) Dungeon.update(dt);
  Act.update(dt);
  sendPos(false);
  updateOthers(dt);
}

// ---------------------------------------------------------------- musique d'ambiance
function ambience(force) {
  if (!G.on || G.mode === "battle" || G.mode === "cut") return;
  let want;
  if (G.mode === "cave") want = (G.boss && G.boss.alive) ? Music.current : (Dungeon.cave ? Dungeon.cave.music : "caveDoux");
  else {
    const danger = Act.enemies.some((e) => e.alive && e.aggro && Math.hypot(e.x - G.p.x, e.y - G.p.y) < 420);
    const h = NPC.hourAt(Net.now()), night = h >= 21 || h < 5;
    const mx = G.p.x / KALUA.K, my = G.p.y / KALUA.K, isl = KALUA.isleAt(mx, my);
    if (Story.music && Story.music()) want = Story.music();
    else if (danger) want = "danger";
    else if (isl >= 0) want = "iles";
    else if (G.place === "Votre village") want = night ? "night" : "village";
    else if (night) want = "night";
    else want = { "Côte Dorée": "beach", "Jungle Émeraude": "jungle", "Marais des Brumes": "marais", "Falaises des Vents": "falaises", "Volcan de Kalua": "volcan" }[G.place] || "beach";
  }
  if (want && (force || want !== Music.current)) Music.play(want, 2.4);
}

// ================================================================ dessin
function drawCharacter(c, o, av, isMe) {
  const rolling = o.roll > 0;
  c.save(); c.translate(o.x, o.y);
  if (!isMe && !o.online) c.globalAlpha = .55;
  if (isMe && Act.inv > 0 && Math.floor(G.t * 20) % 2) c.globalAlpha = .45;
  c.save(); c.scale(SCALE, SCALE); c.translate(0, -14);
  if (rolling) { const pr = 1 - o.roll / .34; c.translate(0, 6); c.rotate(pr * Math.PI * 2 * ((o.rollV?.[0] ?? (o.dir === "left" ? -1 : 1)) < 0 ? -1 : 1)); c.scale(.85, .85); c.translate(0, -6); }
  Avatar.draw(c, av || Avatar.DEFAULT, { dir: o.dir, walk: (o.moving || (!isMe && Math.hypot(o.tx - o.x, o.ty - o.y) > 2)) && !rolling ? o.walk : null, swing: o.swing > 0 ? Math.sin((1 - o.swing / .32) * Math.PI) : 0, t: G.t });
  c.restore();
  if (isMe && o.shield > 0) { c.globalAlpha = .5; c.strokeStyle = "#8ad0ff"; c.lineWidth = 3; c.beginPath(); c.arc(0, -26, 40, 0, Math.PI * 2); c.stroke(); }
  if (isMe && Prog.flag("coco") && !Prog.isDead("coco") && G.mode === "world") { c.save(); c.translate(-26, -70 + Math.sin(G.t * 5) * 4); c.scale(.9, .9); Creatures.drawKind(c, "perroquet"); c.restore(); }
  c.restore();
}
function nameTag(c, x, y, txt) {
  c.font = "800 12px ui-rounded, -apple-system, system-ui"; c.textAlign = "center";
  const w = c.measureText(txt).width + 14;
  c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.roundRect(x - w / 2, y - 10, w, 20, 10); c.fill();
  c.fillStyle = "#6b5050"; c.fillText(txt, x, y + 4.5);
}
function hintBubble(c, x, y, txt) {
  c.font = "800 12px ui-rounded, -apple-system, system-ui"; c.textAlign = "center";
  const w = c.measureText(txt).width + 16;
  c.fillStyle = "rgba(255,255,255,.93)"; c.beginPath(); c.roundRect(x - w / 2, y - 11, w, 22, 11); c.fill();
  c.beginPath(); c.moveTo(x - 5, y + 10); c.lineTo(x, y + 16); c.lineTo(x + 5, y + 10); c.fill();
  c.fillStyle = "#6b5050"; c.fillText(txt, x, y + 4);
}
function hintFor(o) {
  if (o.kind === "cave") return `⛰️ ${o.cave.name} · Ramasser pour entrer`;
  return { palm: "Taper pour couper", jtree: "Taper pour couper", deadtree: "Taper pour couper", rock: "Taper pour casser", lavarock: "Taper pour casser", bush: "Taper pour secouer",
    mangrove: "Taper pour couper", shell: "Ramasser", mushroom: "Ramasser", flower: "Cueillir", reed: "Cueillir", lily: "Cueillir" }[o.kind];
}

function renderWorld() {
  const W = G.world, z = G.cam.z * (SET.zoom || 1), vw = innerWidth, vh = innerHeight, T = Net.now();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  W.drawWater(ctx, vw, vh, G.t);
  const sh = Game.shakeOffset();
  const view = { x0: G.cam.x - vw / 2 / z, x1: G.cam.x + vw / 2 / z, y0: G.cam.y - vh / 2 / z, y1: G.cam.y + vh / 2 / z }; G.view = view;
  ctx.save(); ctx.translate(vw / 2 + sh.x, vh / 2 + sh.y); ctx.scale(z, z); ctx.translate(-G.cam.x, -G.cam.y);
  W.drawGround(ctx, view, G.t);
  if (Story.drawGround) Story.drawGround(ctx, view, G.t);
  const items = W.visibleSolids(view, []).map((s) => ({ y: s.y, s }));
  const animals = Creatures.visible(view, T, W, []).filter((it) => !animalHidden(it.animal));
  items.push(...animals);
  NPC.visible(view, T, items);
  Act.collect(items);
  if (Story.collect) Story.collect(items, view);
  items.push({ y: G.p.y, me: true });
  for (const o of G.others.values()) if (o.has && o.avatar && o.zone === "w") items.push({ y: o.y, o });
  items.sort((a, b) => a.y - b.y);
  const near = NPC.nearest(G.p.x, G.p.y, T, 200);
  for (const it of items) {
    if (it.npc) NPC.draw(ctx, it.npc, it.s, G.t, near && near.n === it.npc);
    else if (it.s) { if (!it.s.gone) W.drawSolid(ctx, it.s, G.t); }
    else if (it.animal) { if (goldenAnimal(it.animal)) { ctx.save(); ctx.globalAlpha = .45 + .2 * Math.sin(G.t * 4); ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(it.p.x, it.p.y - 20, 30, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } Creatures.draw(ctx, it.animal, it.p, G.t); }
    else if (it.enemy) Act.drawEnemy(ctx, it.enemy, G.t);
    else if (it.draw) it.draw(ctx, G.t);
    else if (it.me) drawCharacter(ctx, G.p, avatar, true);
    else drawCharacter(ctx, it.o, it.o.avatar, false);
  }
  for (const q of G.parts) { ctx.globalAlpha = 1 - q.life / q.max; ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (q.kind === "dust" ? .5 + q.life / q.max : 1), 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  Act.drawTop(ctx, G.t);
  if (SET.names) { nameTag(ctx, G.p.x, G.p.y - 72, me.name); for (const o of G.others.values()) if (o.has && o.avatar && o.zone === "w") nameTag(ctx, o.x, o.y - 72, o.name); }
  // bulle d'aide
  if (G.p.roll <= 0 && !Game.busy()) {
    const n = NPC.nearest(G.p.x, G.p.y, T, 80);
    if (n) hintBubble(ctx, n.s.x, n.s.y - (n.n.tree ? 270 : 108), "💬 Ramasser pour parler");
    else {
      const sp = Story.hintAt && Story.hintAt(G.p);
      if (sp) hintBubble(ctx, sp.x, sp.y, sp.text);
      else { const o = W.nearest(G.p.x, G.p.y, G.p.dir, ["cave"], 150) || W.nearest(G.p.x, G.p.y, G.p.dir, GRAB_KINDS, 46) || W.nearest(G.p.x, G.p.y, G.p.dir, HIT_KINDS);
        if (o && !o.gone) { const hy = o.kind === "cave" ? o.y - 120 : o.kind === "palm" ? o.y - o.s * 22 : o.kind === "jtree" ? o.y - o.s * 26 : GRAB_KINDS.includes(o.kind) ? o.y - 18 : o.y - (o.r || 10) - 14; hintBubble(ctx, o.x, hy, hintFor(o)); } }
    }
  }
  ctx.restore();
  // jour et nuit
  const h = NPC.hourAt(T);
  const night = h >= 20 || h < 6 ? 1 : h >= 18 ? (h - 18) / 2 : h < 7 ? 1 - (h - 6) : 0;
  if (night > 0) { ctx.fillStyle = `rgba(20,24,70,${night * .45})`; ctx.fillRect(0, 0, vw, vh); if (h >= 18 && h < 20) { ctx.fillStyle = `rgba(255,120,60,${.12 * (1 - Math.abs(h - 19))})`; ctx.fillRect(0, 0, vw, vh); } }
  // flèche vers l'autre joueur
  for (const o of G.others.values()) {
    if (!o.has || o.zone !== "w") continue;
    const sx = (o.x - G.cam.x) * z + vw / 2, sy = (o.y - 30 - G.cam.y) * z + vh / 2, m = 44;
    if (sx > m && sx < vw - m && sy > m + 40 && sy < vh - m) continue;
    const cx = vw / 2, cy = vh / 2, dx = sx - cx, dy = sy - cy;
    const k = Math.min((vw / 2 - m) / Math.abs(dx || 1), (vh / 2 - m - 30) / Math.abs(dy || 1));
    const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx);
    ctx.save(); ctx.translate(ax, ay);
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(27, 0); ctx.lineTo(17, -7); ctx.lineTo(17, 7); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.clip();
    if (o.avatar) { ctx.scale(2.2, 2.2); ctx.translate(0, 3); Avatar.draw(ctx, o.avatar, { t: G.t }); }
    ctx.restore();
  }
}
function renderCave() { ctx.setTransform(DPR, 0, 0, DPR, 0, 0); Dungeon.render(ctx, innerWidth, innerHeight); }

// ---------------------------------------------------------------- HUD : cœurs, objectif, barre de boss, recharge du chant
function drawHUD() {
  const c = ctx, vw = innerWidth, vh = innerHeight; c.setTransform(DPR, 0, 0, DPR, 0, 0);
  const top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--st")) || 0;
  const y0 = (innerWidth <= 520 ? 54 : 14) + top;
  Battle.hearts(c, 12, y0, Math.min(20, vw / 22));
  if (G.objective && G.mode === "world") { c.font = "700 11px ui-rounded, system-ui"; const w = Math.min(vw - 140, c.measureText(G.objective).width + 18); c.fillStyle = "rgba(255,250,240,.88)"; c.beginPath(); c.roundRect(12, y0 + 26 + Math.floor((Prog.P.maxHp - 1) / 10) * 23, w, 20, 10); c.fill(); c.fillStyle = "#6b5050"; c.textAlign = "left"; c.fillText("★ " + G.objective, 20, y0 + 40 + Math.floor((Prog.P.maxHp - 1) / 10) * 23, w - 14); }
  const b = G.boss;
  if (b && b.alive && b.bar !== false && G.mode === "cave") { const w = Math.min(320, vw * .7), x = vw / 2 - w / 2, y = vh * .14 + top;
    c.fillStyle = "rgba(20,10,20,.6)"; c.beginPath(); c.roundRect(x - 6, y - 18, w + 12, 34, 10); c.fill();
    c.fillStyle = "#fff"; c.font = "800 12px ui-rounded"; c.textAlign = "center"; c.fillText(b.name + (b.guard ? " 🛡" : ""), vw / 2, y - 4);
    c.fillStyle = "#3a2a2a"; c.fillRect(x, y + 2, w, 8); c.fillStyle = b.phase >= 2 ? "#ff3a3a" : b.phase ? "#ff7a3a" : "#ff5a7a"; c.fillRect(x, y + 2, w * Math.max(0, b.hp) / b.max, 8); }
  const sp = Prog.P.spell, btn = $("#magic-btn");
  if (btn && sp) { const cd = Act.cooldown(sp), k = cd / Act.CD[sp]; btn.style.setProperty("--cd", k > 0 ? (k * 100).toFixed(0) + "%" : "0%"); }
}

// ================================================================ démarrage
(async function boot() {
  showLoading();
  try { me = await Net.init(); }
  catch (err) { console.warn(err); return showError(err.code); }
  avatar = store.get("avatar", null);
  if (avatar) avatar = Avatar.normalize(avatar);
  showTitle();
})();
