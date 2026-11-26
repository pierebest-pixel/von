/* Les Échoués de Kalua — écrans, commandes et boucle de jeu (étape 1 : l'île à deux). */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const ui = $("#ui"), hud = $("#hud"), cv = $("#world"), ctx = cv.getContext("2d");
const store = {
  get(k, f) { try { const v = localStorage.getItem("kalua:" + k); return v === null ? f : JSON.parse(v); } catch { return f; } },
  set(k, v) { try { localStorage.setItem("kalua:" + k, JSON.stringify(v)); } catch { /* ignore */ } },
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const SCALE = 3.4; // taille des personnages (unités avatar -> monde)

let me = null;
let avatar = null;
let cleanups = []; // abonnements de l'écran courant
const clearScreen = () => { cleanups.forEach((f) => { try { f(); } catch { /* ignore */ } }); cleanups = []; ui.innerHTML = ""; };

// ================================================================ petits écrans
function showMessage(title, text, button) {
  clearScreen(); hud.hidden = true;
  ui.innerHTML = `<div class="screen"><div class="center"><div class="logo">LES ÉCHOUÉS DE</div><h2>${esc(title)}</h2>
    ${text ? `<p>${esc(text)}</p>` : `<div class="spinner"></div>`}${button ? `<button class="big" id="msg-btn">${esc(button.label)}</button>` : ""}</div></div>`;
  if (button) $("#msg-btn").onclick = button.run;
}
const showLoading = () => showMessage("Kalua", "");

function showError(code) {
  if (code === "noconfig") return showMessage("Bientôt", "Le jeu à deux n'est pas encore activé dans Von.");
  if (code === "gone") return showMessage("Île introuvable", "Cette île n'existe plus.", { label: "Mes îles", run: showIslands });
  showMessage("Pas de connexion", "Kalua se joue à deux en ligne. Connecte-toi à internet puis réessaie.", { label: "Réessayer", run: () => location.reload() });
}

// ================================================================ créateur de personnage
function avatarCanvas(canvas, av, o) {
  const w = canvas.clientWidth || canvas.width, h = canvas.clientHeight || canvas.height;
  canvas.width = Math.round(w * DPR); canvas.height = Math.round(h * DPR);
  const c = canvas.getContext("2d"); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.clearRect(0, 0, w, h);
  c.save(); c.translate(w / 2, h * o.cy); c.scale(o.k, o.k); Avatar.draw(c, av, o); c.restore();
}

function showCreator(first, back = showIslands) {
  clearScreen(); hud.hidden = true;
  let av = Avatar.normalize(store.get("avatar", null) || Avatar.DEFAULT);
  let tab = "corps", view = 0, alive = true;
  const views = ["down", "right", "up", "left"];
  ui.innerHTML = `<div class="screen creator">
    <div class="top"><button class="round ${first ? "" : "show"}" data-x="cancel" aria-label="Retour">‹</button><h1>Crée ton personnage</h1><span class="round"></span></div>
    <div class="body">
      <div class="prev-wrap"><div class="prev"><canvas id="cprev" data-x="turn"></canvas><button class="round dice" data-x="dice" aria-label="Au hasard">🎲</button></div>
        <div class="pname">${esc(me.name)}</div></div>
      <div class="side"><div class="tabs">${Avatar.TABS.map((t) => `<button class="tab" data-tab="${t.id}">${esc(t.label)}</button>`).join("")}</div>
        <div class="opts" id="opts"></div>
        <button class="big" data-x="save">C'est moi !</button></div>
    </div></div>`;
  const opts = $("#opts"), prevCv = $("#cprev");

  function tileDraw() {
    opts.querySelectorAll("canvas[data-key]").forEach((c) => {
      const it = findItem(c.dataset.key), trial = { ...av, [c.dataset.key]: c.dataset.val };
      if (it.key === "aura" || it.key === "wings" || it.key === "tail" || it.zoom === "body") avatarCanvas(c, trial, { k: 2.3, cy: .5, t: 1 });
      else avatarCanvas(c, trial, { k: 4.6, cy: .62, t: 1 });
    });
  }
  const findItem = (key) => { for (const t of Avatar.TABS) for (const it of t.items) if (it.key === key) return it; return null; };

  function renderOpts() {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
    const t = Avatar.TABS.find((x) => x.id === tab);
    opts.innerHTML = t.items.map((it) => {
      const v = av[it.key];
      if (it.type === "choice") {
        return `<div class="opt"><div class="k">${esc(it.label)}<i>${it.values.length} choix</i></div><div class="row">${it.values.map(([val, lbl]) =>
          `<button class="tile ${v === val ? "on" : ""}" data-key="${it.key}" data-val="${esc(val)}"><canvas data-key="${it.key}" data-val="${esc(val)}"></canvas><span>${esc(lbl)}</span></button>`).join("")}</div></div>`;
      }
      if (it.type === "color") {
        const none = it.none ? `<button class="sw none ${!v ? "on" : ""}" data-key="${it.key}" data-val="" aria-label="${it.none === "auto" ? "Comme les cheveux" : "Aucun"}"></button>` : "";
        const sw = it.palette.map((col) => `<button class="sw ${v === col ? "on" : ""}" data-key="${it.key}" data-val="${col}" style="background:${col === "arcenciel" ? "conic-gradient(#f9c,#9cf,#cf9,#fd9,#f9c)" : col}"></button>`).join("");
        const custom = !it.palette.includes(v) && v && v !== "arcenciel";
        const wheel = it.key === "aura" ? "" : `<label class="sw wheel ${custom ? "on" : ""}" aria-label="Autre couleur"><input type="color" data-key="${it.key}" value="${/^#[0-9a-f]{6}$/i.test(v) ? v : "#ff9fc0"}"></label>`;
        return `<div class="opt"><div class="k">${esc(it.label)}${it.none === "auto" ? "<i>barré = comme les cheveux</i>" : ""}</div><div class="row">${none}${sw}${wheel}</div></div>`;
      }
      return `<div class="opt"><div class="k">${esc(it.label)}</div><div class="slider"><input type="range" min="0" max="100" value="${Math.round((Number(v) || 0) * 100)}" data-key="${it.key}"></div></div>`;
    }).join("");
    tileDraw();
  }
  function refresh() {
    opts.querySelectorAll("[data-key][data-val]").forEach((b) => { if (b.tagName !== "CANVAS") b.classList.toggle("on", String(av[b.dataset.key]) === b.dataset.val); });
    opts.querySelectorAll(".sw.wheel").forEach((l) => { const k = l.querySelector("input").dataset.key, it = findItem(k); l.classList.toggle("on", Boolean(av[k]) && !it.palette.includes(av[k])); });
    tileDraw();
  }
  ui.querySelector(".creator").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab],[data-x],[data-val]");
    if (!t) return;
    if (t.dataset.tab) { tab = t.dataset.tab; renderOpts(); opts.scrollTop = 0; return; }
    if (t.dataset.x === "dice") { av = Avatar.random(); renderOpts(); return; }
    if (t.dataset.x === "turn") { view = (view + 1) % 4; return; }
    if (t.dataset.x === "cancel") { alive = false; return back(); }
    if (t.dataset.x === "save") { store.set("avatar", av); avatar = av; alive = false; return back(); }
    if (t.dataset.val !== undefined && t.tagName !== "CANVAS") { av = { ...av, [t.dataset.key]: t.dataset.val }; refresh(); }
  });
  opts.addEventListener("input", (e) => {
    const k = e.target.dataset.key; if (!k) return;
    av = { ...av, [k]: e.target.type === "range" ? Number(e.target.value) / 100 : e.target.value };
    if (e.target.type === "range") return; // l'aperçu suffit, pas besoin de redessiner les vignettes
    refresh();
  });
  renderOpts();
  const t0 = performance.now();
  (function anim() {
    if (!alive || !prevCv.isConnected) return;
    const t = (performance.now() - t0) / 1000;
    avatarCanvas(prevCv, av, { k: 5.6, cy: .5, t, dir: views[view] });
    requestAnimationFrame(anim);
  })();
  cleanups.push(() => { alive = false; });
}

// ================================================================ mes îles
const hue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return h; };

function showIslands() {
  clearScreen(); hud.hidden = true; startMusic();
  ui.innerHTML = `<div class="screen islands">
    <div class="top"><button class="round" data-x="title" aria-label="Menu titre">‹</button><h1>Mes îles</h1><span class="round" style="visibility:hidden"></span></div><div class="sub">Les Échoués de Kalua</div>
    <div class="list" id="ilist"><div class="spinner"></div></div>
    <div class="me-row"><canvas id="mecv"></canvas><div class="info">${esc(me.name)}<small>Ton personnage</small></div><button class="go pink" data-x="edit">Modifier</button></div>
  </div>`;
  const list = $("#ilist");
  avatarCanvas($("#mecv"), avatar, { k: 2.5, cy: .5, t: 1 });
  const online = {};
  let islands = [];
  const watchers = new Map();

  function draw() {
    const cards = islands.map((x) => {
      const on = online[x.id];
      return `<div class="card"><canvas data-seed="${Number(x.seed) || 1}"></canvas><div class="info"><div class="t">Île avec ${esc(x.with)}</div>
        <div class="s"><span class="dot ${on ? "on" : ""}"></span>${esc(x.with)} ${on ? "est sur l'île" : "n'est pas là"}</div></div>
        <button class="more" data-more="${esc(x.id)}" aria-label="Options">⋯</button><button class="go" data-play="${esc(x.id)}">Jouer</button></div>`;
    }).join("");
    list.innerHTML = (islands.length ? cards : `<p class="empty-txt">Pas encore d'île.<br>Crée-en une et invite quelqu'un pour vous échouer à deux !</p>`)
      + `<button class="ghost" data-x="new">+ Nouvelle île</button>`;
    list.querySelectorAll("canvas[data-seed]").forEach((c) => {
      c.width = 62 * DPR; c.height = 62 * DPR; const g = c.getContext("2d"); g.scale(DPR, DPR);
      islandPreview(g, 62);
    });
  }
  const unsub = Net.watchMyIslands((l) => {
    islands = l;
    for (const x of l) if (!watchers.has(x.id) && x.withUid) watchers.set(x.id, Net.watchOnline(x.id, x.withUid, (v) => { online[x.id] = v; draw(); }));
    draw();
  });
  cleanups.push(unsub, () => watchers.forEach((u) => u()));

  ui.querySelector(".islands").addEventListener("click", async (e) => {
    const t = e.target.closest("[data-x],[data-play],[data-more],[data-invite],[data-leave],.dim");
    if (!t) return;
    if (t.dataset.x === "edit") return showCreator(false);
    if (t.dataset.x === "title") return showTitle();
    if (t.dataset.play) return play(t.dataset.play);
    if (t.dataset.x === "new") return friendSheet();
    if (t.dataset.more) {
      const x = islands.find((i) => i.id === t.dataset.more);
      return sheet(`<h3>Île avec ${esc(x.with)}</h3><button class="opt-btn red" data-leave="${esc(x.id)}">Retirer cette île de ma liste</button><button class="opt-btn" data-x="close">Annuler</button>`);
    }
    if (t.dataset.leave) { closeSheet(); await Net.leaveIsland(t.dataset.leave).catch(() => {}); return; }
    if (t.dataset.invite) {
      const f = Net.friends().find((x) => x.uid === t.dataset.invite);
      t.disabled = true; t.textContent = "…";
      try { const id = await Net.createIsland(f); closeSheet(); play(id); }
      catch (err) { console.warn(err); t.disabled = false; t.textContent = "Inviter"; toastScreen("Connexion impossible, réessaie."); }
      return;
    }
    if (t.classList.contains("dim") || t.dataset.x === "close") closeSheet();
  });

  function friendSheet() {
    const fr = Net.friends();
    const body = fr.length
      ? fr.map((f) => `<div class="card" style="margin:8px 16px"><div class="av" style="background:hsl(${hue(f.uid)} 50% 62%)">${esc((f.name || "?").charAt(0).toUpperCase())}</div>
          <div class="info"><div class="t">${esc(f.name)}</div><div class="s">#${esc(f.tag || "")}</div></div><button class="go pink" data-invite="${esc(f.uid)}">Inviter</button></div>`).join("")
      : `<p class="empty-txt">Tu n'as pas encore d'amis dans Von.<br>Quitte le jeu, va dans l'onglet <b>Amis</b> de Von et entre le tag de la personne.</p>`;
    sheet(`<h3>Avec qui ?</h3><div class="sub" style="margin-bottom:6px">Tes amis Von</div><div class="scroll">${body}</div>`);
  }
  function sheet(html) { closeSheet(); const d = document.createElement("div"); d.id = "sheet"; d.innerHTML = `<div class="dim"></div><div class="sheet"><div class="grab"></div>${html}</div>`; ui.querySelector(".islands").appendChild(d); }
  function closeSheet() { $("#sheet")?.remove(); }
  function toastScreen(msg) { const s = $(".sheet h3"); if (s) s.textContent = msg; }
}

// ================================================================ l'archipel
let WORLD = null;
function world() { if (!WORLD) { WORLD = makeWorld(); Creatures.init(WORLD); } return WORLD; }
function islandPreview(g, size) {
  const ov = KALUA.getOverview(); g.fillStyle = "#4a9ac8"; g.fillRect(0, 0, size, size);
  const k = size / 250 * 1.55; g.drawImage(ov, 0, 0, 400, 250, size / 2 - 200 * k * .95, size / 2 - 125 * k, 400 * k, 250 * k);
}

// ================================================================ en jeu
const G = {
  on: false, session: null, world: null, t: 0, last: 0,
  p: null, // joueur local
  others: new Map(),
  parts: [],
  cam: { x: 0, y: 0, z: 1.3 },
  input: { u: 0, d: 0, l: 0, r: 0, run: false, dpad: { x: 0, y: 0 } },
  toastOnce: {},
};

function resize() {
  cv.width = Math.round(innerWidth * DPR); cv.height = Math.round(innerHeight * DPR);
  G.cam.z = Math.max(1.05, Math.min(1.7, Math.min(innerWidth, innerHeight) / 300));
}
addEventListener("resize", resize);
resize();

async function play(id) {
  Music.stop(1.2);
  clearScreen(); showLoading();
  let s;
  try { s = await Net.enter(id, avatar); } catch (err) { console.warn(err); return showError(err.code === "gone" ? "gone" : "offline"); }
  clearScreen();
  G.session = s; G.world = world();
  const sp = s.savedPos && G.world.walkable(s.savedPos.x, s.savedPos.y) ? s.savedPos : { x: G.world.spawn.x + (s.island.owner === me.uid ? -26 : 26), y: G.world.spawn.y };
  G.p = { x: sp.x, y: sp.y, dir: sp.d || "down", moving: false, walk: 0, swing: 0, roll: 0, rollV: [0, 0], cool: 0, a: "", at: 0, dust: 0 };
  G.cam.x = G.p.x; G.cam.y = G.p.y; G.place = G.world.placeName(G.p.x, G.p.y); G.lastSave = Date.now();
  G.others.clear(); G.parts = [];
  for (const uid of s.others) {
    const o = { uid, name: s.island.members[uid]?.name || "?", avatar: null, online: false, x: 0, y: 0, tx: 0, ty: 0, dir: "down", moving: false, walk: 0, swing: 0, roll: 0, seenAt: 0, has: false };
    G.others.set(uid, o);
    s.watchPlayer(uid, (v) => { if (!v) return; o.name = v.name || o.name; o.avatar = v.avatar || o.avatar; o.online = v.online === true; updateBadge(); });
    s.watchPos(uid, (v) => {
      if (!v) return;
      o.tx = v.x; o.ty = v.y; o.dir = v.d || o.dir; o.moving = Boolean(v.m);
      if (!o.has || Math.hypot(o.x - v.x, o.y - v.y) > 400) { o.x = v.x; o.y = v.y; o.has = true; }
      if (v.at && v.at !== o.seenAt) { const fresh = o.seenAt !== 0; o.seenAt = v.at; if (fresh) remoteAction(o, v.a); }
    });
  }
  updateBadge();
  hud.hidden = false; applySettings();
  G.on = true; G.last = performance.now();
  setTimeout(() => toast("📍 " + G.place), 600);
  sendPos(true);
  requestAnimationFrame(frame);
}

async function leaveGame(next = showIslands) {
  closeMenu(); G.on = false; hud.hidden = true;
  const s = G.session; G.session = null;
  if (s) { sendPos(true, s); await s.leave(); }
  next();
}
$("#menu-btn").addEventListener("click", () => openMenu());

function updateBadge() {
  const o = [...G.others.values()][0];
  $("#badge").innerHTML = o ? `<span class="dot ${o.online ? "on" : ""}"></span>${esc(o.name)} ${o.online ? "est sur l'île" : "n'est pas là"}` : "";
}

let toastTimer = 0;
function toast(msg, once) {
  if (once) { if (G.toastOnce[once]) return; G.toastOnce[once] = true; }
  const el = $("#toast"); el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
}

function sendPos(force, s = G.session) {
  if (!s || !G.p) return;
  const p = G.p, k = `${Math.round(p.x)},${Math.round(p.y)},${p.dir},${p.moving},${p.at}`;
  if (!force && k === G.lastKey && performance.now() - (G.lastSentT || 0) < 3000) return;
  G.lastKey = k; G.lastSentT = performance.now(); G.lastSave = Date.now();
  s.sendPos({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10, d: p.dir, m: p.moving, a: p.a, at: p.at });
}

// ---------------------------------------------------------------- actions
const FACING = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const HIT_KINDS = ["palm", "jtree", "rock", "bush", "mangrove", "lavarock", "deadtree"];
const GRAB_KINDS = ["shell", "mushroom", "flower"];

function burst(x, y, kind, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 120;
    const col = { wood: ["#e0b48a", "#c9956b", "#f0cfa6"], stone: ["#d6d3e3", "#b9b5c9", "#fff"], leaf: ["#8fd18a", "#a6dc94", "#ff9fb8"], spark: ["#fff", "#ffe08a", "#ffc6d6"], dust: ["#f3dcb4"] }[kind];
    G.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === "spark" ? 40 : 90), g: kind === "spark" ? 0 : 320, life: 0, max: .45 + Math.random() * .35,
      c: col[Math.floor(Math.random() * col.length)], s: kind === "dust" ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2.5, kind });
  }
}

function hitTarget(x, y, dir) {
  const an = Creatures.nearest(x + (FACING[dir] || [0, 1])[0] * 20, y + (FACING[dir] || [0, 1])[1] * 16, Net.now(), G.world, 48);
  if (an) { an.a.hop = 1; burst(an.p.x, an.p.y - 20, "spark", 6); return { kind: "animal", a: an.a }; }
  const o = G.world.nearest(x, y, dir, HIT_KINDS);
  if (!o) return null;
  o.shake = .5;
  if (o.kind === "palm" || o.kind === "jtree" || o.kind === "deadtree") burst(o.x + (x < o.x ? -6 : 6), o.y - 30, "wood", 9);
  if (o.kind === "rock" || o.kind === "lavarock") burst(o.x, o.y - 6, "stone", 8);
  if (o.kind === "bush" || o.kind === "mangrove") burst(o.x, o.y - 10, "leaf", 10);
  if (o.kind === "jtree" || o.kind === "mangrove") burst(o.x, o.y - 50, "leaf", 6);
  return o;
}

function doAction(a) {
  const p = G.p; if (!p || !G.on) return;
  if (a === "hit" && p.swing <= 0 && p.roll <= 0) {
    p.swing = .32; p.a = "hit"; p.at = Date.now();
    const o = hitTarget(p.x, p.y, p.dir);
    if (o && o.kind === "animal") toast(`${Creatures.NAMES[o.a.kind]} : ${Creatures.DOMESTIC.includes(o.a.kind) ? "l'adoption et la chasse arrivent" : "la chasse arrive"} à l'étape 2 !`, "animal");
    else if (o) toast("La récolte (bois, pierres…) arrive à l'étape 2 !", "harvest");
    sendPos(true);
  } else if (a === "grab" && p.roll <= 0) {
    const o = G.world.nearest(p.x, p.y, p.dir, GRAB_KINDS, 46);
    p.a = "grab"; p.at = Date.now(); p.swing = .2;
    if (o) { o.bob = 1; burst(o.x, o.y - 4, "spark", 8); toast("L'inventaire arrive à l'étape 2 !", "inv"); }
    sendPos(true);
  } else if (a === "dodge" && p.roll <= 0 && p.cool <= 0) {
    const v = inputVector();
    const f = v.x || v.y ? [v.x, v.y] : FACING[p.dir];
    p.roll = .34; p.cool = .55; p.rollV = f; p.a = "roll"; p.at = Date.now();
    sendPos(true);
  }
}

function remoteAction(o, a) {
  if (a === "hit") { o.swing = .32; hitTarget(o.tx, o.ty, o.dir); }
  if (a === "grab") { o.swing = .2; const s = G.world.nearest(o.tx, o.ty, o.dir, GRAB_KINDS, 46); if (s) { s.bob = 1; burst(s.x, s.y - 4, "spark", 6); } }
  if (a === "roll") o.roll = .34;
}

// ---------------------------------------------------------------- commandes
function inputVector() {
  const I = G.input;
  let x = (I.r - I.l) + I.dpad.x, y = (I.d - I.u) + I.dpad.y;
  x = Math.max(-1, Math.min(1, x)); y = Math.max(-1, Math.min(1, y));
  const n = Math.hypot(x, y); return n > 1 ? { x: x / n, y: y / n } : { x, y };
}
const KEYS = { ArrowUp: "u", KeyW: "u", KeyZ: "u", ArrowDown: "d", KeyS: "d", ArrowLeft: "l", KeyA: "l", KeyQ: "l", ArrowRight: "r", KeyD: "r" };
addEventListener("keydown", (e) => {
  if (!G.on || e.target.tagName === "INPUT") return;
  if (KEYS[e.code]) { G.input[KEYS[e.code]] = 1; e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === "Space" || e.code === "KeyJ") { doAction("hit"); e.preventDefault(); }
  if (e.code === "KeyE" || e.code === "KeyK") doAction("grab");
  if (e.code === "KeyX" || e.code === "KeyL") doAction("dodge");
  if (e.key === "Shift") G.input.run = true;
});
addEventListener("keyup", (e) => { if (KEYS[e.code]) G.input[KEYS[e.code]] = 0; if (e.key === "Shift") G.input.run = false; });
const resetInput = () => { Object.assign(G.input, { u: 0, d: 0, l: 0, r: 0, run: false, dpad: { x: 0, y: 0 } }); document.querySelectorAll(".dpad b, .act").forEach((b) => b.classList.remove("on")); };
addEventListener("blur", resetInput);

// Flèches : on peut glisser le doigt d'une flèche à l'autre (et en diagonale entre deux)
const dpad = $("#dpad");
function dpadAt(e) {
  const r = dpad.getBoundingClientRect(), x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
  let v = { x: 0, y: 0 };
  if (Math.hypot(x, y) > 12) {
    const a = Math.atan2(y, x), sec = Math.round(a / (Math.PI / 4));
    v = { x: Math.round(Math.cos(sec * Math.PI / 4)), y: Math.round(Math.sin(sec * Math.PI / 4)) };
  }
  G.input.dpad = v;
  dpad.querySelector("[data-d=u]").classList.toggle("on", v.y < 0); dpad.querySelector("[data-d=d]").classList.toggle("on", v.y > 0);
  dpad.querySelector("[data-d=l]").classList.toggle("on", v.x < 0); dpad.querySelector("[data-d=r]").classList.toggle("on", v.x > 0);
}
let dpadId = null;
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

document.addEventListener("visibilitychange", () => { if (G.session) G.session.setOnline(!document.hidden); if (document.hidden) resetInput(); });
if (window.Von) { Von.onPause(resetInput); }

// ---------------------------------------------------------------- boucle
function frame(now) {
  if (!G.on) return;
  const dt = Math.min(.05, (now - G.last) / 1000); G.last = now; G.t += dt;
  update(dt); render();
  requestAnimationFrame(frame);
}

function update(dt) {
  const p = G.p, W = G.world, v = inputVector();
  p.swing = Math.max(0, p.swing - dt); p.cool = Math.max(0, p.cool - dt);
  let vx = 0, vy = 0;
  if (p.roll > 0) { p.roll = Math.max(0, p.roll - dt); vx = p.rollV[0] * 380; vy = p.rollV[1] * 380; }
  else {
    const sp = G.menuOpen ? 0 : G.input.run ? 260 : 150;
    vx = v.x * sp; vy = v.y * sp;
    if (v.x || v.y) p.dir = Math.abs(v.x) > Math.abs(v.y) + .01 ? (v.x < 0 ? "left" : "right") : (v.y < 0 ? "up" : "down");
  }
  p.moving = Boolean(vx || vy) && p.roll <= 0;
  if (vx || vy) {
    const n = W.move(p.x, p.y, p.x + vx * dt, p.y + vy * dt);
    p.x = n.x; p.y = n.y;
    p.walk = (p.walk + dt * (G.input.run ? 3.2 : 2.2)) % 1;
    if (G.input.run && p.roll <= 0) { p.dust -= dt; if (p.dust <= 0) { p.dust = .07; burst(p.x, p.y + 2, "dust", 1); } }
  }
  sendPos(false);
  // autres joueurs : on glisse doucement vers la dernière position reçue
  for (const o of G.others.values()) {
    const k = Math.min(1, dt * 10), d = Math.hypot(o.tx - o.x, o.ty - o.y);
    o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k;
    o.swing = Math.max(0, o.swing - dt); o.roll = Math.max(0, o.roll - dt);
    if (o.moving || d > 2) o.walk = (o.walk + dt * 2.2) % 1;
  }
  W.update(dt, G.view || { x0: p.x - 400, x1: p.x + 400, y0: p.y - 400, y1: p.y + 400 });
  for (const a of Creatures.list) if (a.hop > 0) a.hop = Math.max(0, a.hop - dt * 2.5);
  KALUA.work(9);
  // changement de lieu
  G.placeT = (G.placeT || 0) - dt;
  if (G.placeT <= 0) { G.placeT = .5; const pl = W.placeName(p.x, p.y); if (pl !== G.place) { G.place = pl; toast("📍 " + pl); } }
  if (Date.now() - G.lastSave > 5000) G.lastSave = Date.now();
  G.parts = G.parts.filter((q) => { q.life += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy += q.g * dt; q.vx *= .96; return q.life < q.max; });
  // caméra
  const k = Math.min(1, dt * 6);
  G.cam.x += (p.x - G.cam.x) * k; G.cam.y += (p.y - 20 - G.cam.y) * k;
}

function drawCharacter(c, o, av, isMe) {
  const rolling = o.roll > 0;
  c.save(); c.translate(o.x, o.y);
  if (!isMe && !o.online) c.globalAlpha = .55;
  c.save(); c.scale(SCALE, SCALE); c.translate(0, -14);
  if (rolling) { const pr = 1 - o.roll / .34; c.translate(0, 6); c.rotate(pr * Math.PI * 2 * ((o.rollV?.[0] ?? (o.dir === "left" ? -1 : 1)) < 0 ? -1 : 1)); c.scale(.85, .85); c.translate(0, -6); }
  Avatar.draw(c, av, { dir: o.dir, walk: (o.moving || (!isMe && Math.hypot(o.tx - o.x, o.ty - o.y) > 2)) && !rolling ? o.walk : null, swing: o.swing > 0 ? Math.sin((1 - o.swing / .32) * Math.PI) : 0, t: G.t });
  c.restore();
  if (!isMe && !o.online) {
    c.fillStyle = "#8a7471"; c.font = "800 14px ui-rounded, system-ui"; c.globalAlpha = .7;
    for (let i = 0; i < 3; i++) { const ph = (G.t * .6 + i / 3) % 1; c.globalAlpha = .7 * (1 - ph); c.fillText("z", 14 + ph * 16, -60 - ph * 26 - i * 2); }
    c.globalAlpha = .55;
  }
  c.restore();
}

function nameTag(c, x, y, txt) {
  c.font = "800 13px ui-rounded, -apple-system, system-ui"; c.textAlign = "center";
  const w = c.measureText(txt).width + 14;
  c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.roundRect(x - w / 2, y - 10, w, 20, 10); c.fill();
  c.fillStyle = "#6b5050"; c.fillText(txt, x, y + 4.5);
}

function hintFor(o) {
  if (o.kind === "cave") return `🔒 ${o.cave.name} · bientôt`;
  return { palm: "Taper pour couper", jtree: "Taper pour couper", deadtree: "Taper pour couper", rock: "Taper pour casser", lavarock: "Taper pour casser", bush: "Taper pour secouer",
    mangrove: "Taper pour couper", shell: "Ramasser", mushroom: "Ramasser", flower: "Cueillir" }[o.kind];
}

function render() {
  const W = G.world, z = G.cam.z * (SET.zoom || 1), vw = innerWidth, vh = innerHeight;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  W.drawWater(ctx, vw, vh, G.t);
  const view = { x0: G.cam.x - vw / 2 / z, x1: G.cam.x + vw / 2 / z, y0: G.cam.y - vh / 2 / z, y1: G.cam.y + vh / 2 / z }; G.view = view;
  ctx.save(); ctx.translate(vw / 2, vh / 2); ctx.scale(z, z); ctx.translate(-G.cam.x, -G.cam.y);
  W.drawGround(ctx, view, G.t);
  // objets et personnages triés par profondeur
  const items = W.visibleSolids(view, []).map((s) => ({ y: s.y, s }));
  Creatures.visible(view, Net.now(), W, items);
  items.push({ y: G.p.y, me: true });
  for (const o of G.others.values()) if (o.has && o.avatar) items.push({ y: o.y, o });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (it.s) W.drawSolid(ctx, it.s, G.t);
    else if (it.animal) Creatures.draw(ctx, it.animal, it.p, G.t);
    else if (it.me) drawCharacter(ctx, G.p, avatar, true);
    else drawCharacter(ctx, it.o, it.o.avatar, false);
  }
  for (const q of G.parts) { ctx.globalAlpha = 1 - q.life / q.max; ctx.fillStyle = q.c; ctx.beginPath(); ctx.arc(q.x, q.y, q.s * (q.kind === "dust" ? .5 + q.life / q.max : 1), 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = 1;
  // pseudos
  if (SET.names) {
    nameTag(ctx, G.p.x, G.p.y - 72, me.name);
    for (const o of G.others.values()) if (o.has && o.avatar) nameTag(ctx, o.x, o.y - 72, o.name);
  }
  // bulle d'aide sur l'objet devant soi
  const near = G.p.roll <= 0 && (W.nearest(G.p.x, G.p.y, G.p.dir, ["cave"], 150) || W.nearest(G.p.x, G.p.y, G.p.dir, GRAB_KINDS, 46) || W.nearest(G.p.x, G.p.y, G.p.dir, HIT_KINDS));
  if (near) {
    const hy = near.kind === "cave" ? near.y - 120 : near.kind === "palm" ? near.y - near.s * 22 : near.kind === "jtree" ? near.y - near.s * 26 : GRAB_KINDS.includes(near.kind) ? near.y - 18 : near.y - (near.r || 10) - 14;
    ctx.font = "800 12px ui-rounded, -apple-system, system-ui"; ctx.textAlign = "center";
    const txt = hintFor(near), w = ctx.measureText(txt).width + 16;
    ctx.fillStyle = "rgba(255,255,255,.93)"; ctx.beginPath(); ctx.roundRect(near.x - w / 2, hy - 11, w, 22, 11); ctx.fill();
    ctx.beginPath(); ctx.moveTo(near.x - 5, hy + 10); ctx.lineTo(near.x, hy + 16); ctx.lineTo(near.x + 5, hy + 10); ctx.fill();
    ctx.fillStyle = "#6b5050"; ctx.fillText(txt, near.x, hy + 4);
  }
  ctx.restore();
  // flèche vers l'autre joueur quand il est hors de l'écran
  for (const o of G.others.values()) {
    if (!o.has) continue;
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

// ================================================================ démarrage
(async function boot() {
  showLoading();
  try { me = await Net.init(); }
  catch (err) { console.warn(err); return showError(err.code); }
  avatar = store.get("avatar", null);
  if (avatar) avatar = Avatar.normalize(avatar);
  showTitle();
})();
