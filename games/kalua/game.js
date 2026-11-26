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
    // On vise le bouton (pas la vignette dessinée dedans, qui porte aussi data-val)
    const t = e.target.closest("[data-tab],[data-x],button[data-val]");
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

