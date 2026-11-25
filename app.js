/* Von — lanceur de jeux installables (appli web pour iPhone). */
"use strict";

const VERSION = "1.0";
const NEW_DAYS = 7;
const $ = (sel, root = document) => root.querySelector(sel);
const view = $("#view");

// ---------------------------------------------------------------- stockage
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("von:" + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("von:" + key, JSON.stringify(value)); } catch { /* stockage indisponible */ }
  },
  del(key) {
    try { localStorage.removeItem("von:" + key); } catch { /* ignore */ }
  },
};

// installed: { [id]: { version, size, installedAt } } — played: { [id]: timestamp }
const state = {
  catalog: [],
  catalogLoaded: false,
  installed: store.get("installed", {}),
  played: store.get("played", {}),
  installing: {}, // id -> { progress, abort }
  filter: { q: "", cat: "Tous" },
  current: null, // jeu en cours
};

const saveInstalled = () => store.set("installed", state.installed);
const best = (id) => store.get("best:" + id, null);
const soundOn = () => store.get("sound", true);

// ---------------------------------------------------------------- utilitaires
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const gameBase = (g) => `games/${encodeURIComponent(g.id)}/`;
const isInstalled = (id) => Boolean(state.installed[id]);
const byId = (id) => state.catalog.find((g) => g.id === id) || null;

function formatSize(bytes) {
  if (!bytes) return "0 Ko";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} Mo`;
}

function playedLabel(id) {
  const t = state.played[id];
  if (!t) return "jamais joué";
  const min = Math.floor((Date.now() - t) / 60000);
  if (min < 1) return "joué à l'instant";
  if (min < 60) return `joué il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `joué il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "joué hier";
  return `joué il y a ${d} j`;
}

function isNew(g) {
  if (!g.addedAt) return false;
  const added = new Date(g.addedAt).getTime();
  return Date.now() - added < NEW_DAYS * 86400000;
}

function iconHTML(g) {
  if (g.icon) return `<div class="icon"><img src="${gameBase(g)}${esc(g.icon)}" alt="" loading="lazy"></div>`;
  return `<div class="icon" style="background:${esc(g.color || "#232329")}">${esc(g.emoji || "🎮")}</div>`;
}

const SVG = {
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  pad: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="4"/><path d="M7 12h3M8.5 10.5v3"/><circle cx="16" cy="11" r=".8" fill="currentColor"/><circle cx="17.5" cy="13" r=".8" fill="currentColor"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  share: `<svg class="share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>`,
};

function progressHTML(id) {
  const p = state.installing[id]?.progress ?? 0;
  const off = 94.2 * (1 - p);
  return `<button class="progress-btn" data-act="cancel" data-id="${esc(id)}" aria-label="Annuler l'installation">
    <svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="#2f2f37" stroke-width="3"/>
    <circle cx="18" cy="18" r="15" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="94.2" stroke-dashoffset="${off}" stroke-linecap="round"/></svg>
    <span class="stop"></span></button>`;
}

function actionHTML(g) {
  if (state.installing[g.id]) return progressHTML(g.id);
  if (isInstalled(g.id)) return `<button class="btn" data-act="play" data-id="${esc(g.id)}">Jouer</button>`;
  return `<button class="btn ghost" data-act="install" data-id="${esc(g.id)}">Installer</button>`;
}

// ---------------------------------------------------------------- catalogue
async function loadCatalog() {
  try {
    const res = await fetch("games/catalog.json", { cache: "no-store" });
    const data = await res.json();
    state.catalog = Array.isArray(data.games) ? data.games : [];
    store.set("catalog", state.catalog);
  } catch {
    // Hors connexion : dernière liste connue
    state.catalog = store.get("catalog", []);
  }
  state.catalogLoaded = true;
}

// ---------------------------------------------------------------- installation
async function installGame(id) {
  const g = byId(id);
  if (!g || state.installing[id]) return;
  const files = Array.from(new Set(["index.html", ...(g.files || [])]));
  const abort = new AbortController();
  state.installing[id] = { progress: 0, abort };
  render();
  const cacheName = "von-game-" + id;
  try {
    await caches.delete(cacheName);
    const cache = await caches.open(cacheName);
    let size = 0;
    for (let i = 0; i < files.length; i++) {
      const url = gameBase(g) + files[i];
      const res = await fetch(url, { cache: "no-store", signal: abort.signal });
      if (!res.ok) throw new Error(`Fichier introuvable : ${files[i]}`);
      const blob = await res.clone().blob();
      size += blob.size;
      await cache.put(url, res);
      state.installing[id].progress = (i + 1) / files.length;
      updateProgress(id);
    }
    state.installed[id] = { version: g.version || "1.0", size, installedAt: Date.now() };
    saveInstalled();
    try { navigator.storage?.persist?.(); } catch { /* ignore */ }
  } catch (err) {
    await caches.delete(cacheName);
    if (err.name !== "AbortError") {
      alertBox({ title: "Installation impossible", text: "Vérifie ta connexion internet puis réessaie.", buttons: [{ label: "OK", bold: true }] });
    }
  } finally {
    delete state.installing[id];
    render();
  }
}

function updateProgress(id) {
  const p = state.installing[id]?.progress ?? 0;
  document.querySelectorAll(`.progress-btn[data-id="${CSS.escape(id)}"] circle:last-child`).forEach((c) => {
    c.setAttribute("stroke-dashoffset", String(94.2 * (1 - p)));
  });
  document.querySelectorAll(`[data-pct="${CSS.escape(id)}"]`).forEach((el) => { el.textContent = `${Math.round(p * 100)} %`; });
}

async function uninstallGame(id) {
  await caches.delete("von-game-" + id);
  delete state.installed[id];
  delete state.played[id];
  saveInstalled();
  store.set("played", state.played);
}

// ---------------------------------------------------------------- partie
const player = $("#player");
const frame = $("#game-frame");

function playGame(id) {
  const g = byId(id) || { id, name: id };
  state.current = g;
  state.played[id] = Date.now();
  store.set("played", state.played);
  frame.src = gameBase(g) + "index.html";
  player.hidden = false;
}

function quitGame() {
  frame.src = "about:blank";
  player.hidden = true;
  state.current = null;
  render();
}

const toGame = (msg) => { try { frame.contentWindow?.postMessage({ von: msg }, location.origin); } catch { /* ignore */ } };

$("#pause-btn").addEventListener("click", () => {
  if (!state.current) return;
  toGame("pause");
  actionSheet({
    title: `${state.current.name} · en pause`,
    items: [
      { label: "Reprendre", run: () => toGame("resume") },
      { label: "Recommencer", run: () => toGame("restart") },
      { label: "Quitter le jeu", run: quitGame },
    ],
    onCancel: () => toGame("resume"),
  });
});

// Messages envoyés par les jeux (via games/von-sdk.js)
window.addEventListener("message", (e) => {
  if (e.origin !== location.origin || !state.current || e.source !== frame.contentWindow) return;
  const msg = e.data || {};
  if (msg.von === "score" && Number.isFinite(msg.value)) {
    const id = state.current.id;
    const prev = best(id);
    if (prev === null || msg.value > prev) store.set("best:" + id, msg.value);
  } else if (msg.von === "quit") {
    quitGame();
  }
});

// ---------------------------------------------------------------- menus et fenêtres
const overlay = $("#overlay");

function closeOverlay() { overlay.innerHTML = ""; }

function actionSheet({ title, items, onCancel }) {
  overlay.innerHTML = `<div class="dim" data-x="cancel"></div>
    <div class="sheet" style="pointer-events:auto"><div class="grp">${title ? `<div class="t">${esc(title)}</div>` : ""}
    ${items.map((it, i) => `<button data-i="${i}">${esc(it.label)}</button>`).join("")}</div>
    <div class="grp"><button class="bold" data-x="cancel">Annuler</button></div></div>`;
  overlay.onclick = (e) => {
    const t = e.target.closest("[data-i],[data-x]");
    if (!t) return;
    closeOverlay();
    if (t.dataset.x === "cancel") onCancel?.();
    else items[Number(t.dataset.i)].run();
  };
}

function alertBox({ title, text, buttons }) {
  return new Promise((resolve) => {
    overlay.innerHTML = `<div class="dim"></div><div class="alert-wrap"><div class="alert">
      <h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ""}
      <div class="acts">${buttons.map((b, i) => `<button data-i="${i}" class="${b.danger ? "d" : b.bold ? "b" : ""}">${esc(b.label)}</button>`).join("")}</div>
    </div></div>`;
    overlay.onclick = (e) => {
      const t = e.target.closest("[data-i]");
      if (!t) return;
      closeOverlay();
      resolve(buttons[Number(t.dataset.i)].value);
    };
  });
}

const confirmBox = (title, text, action) =>
  alertBox({ title, text, buttons: [{ label: "Annuler", value: false }, { label: action, danger: true, value: true }] });

// ---------------------------------------------------------------- écrans
function route() {
  const [, page = "library", id = "", from = ""] = (location.hash || "#/library").split("/");
  return { page, id: decodeURIComponent(id), from };
}

function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

function libraryView() {
  const ids = Object.keys(state.installed).sort((a, b) => (state.played[b] || 0) - (state.played[a] || 0));
  const n = ids.length;
  const tip = !isStandalone() && !store.get("tipClosed", false)
    ? `<div class="install-tip"><img src="icons/icon-180.png" alt=""><div><b>Installe Von sur ton iPhone</b>
       Dans Safari, touche ${SVG.share} puis « Sur l'écran d'accueil ».</div><button class="close" data-act="close-tip" aria-label="Fermer">✕</button></div>`
    : "";
  if (!n) {
    return `${tip}<div class="header"><h1>Bibliothèque</h1></div>
      <div class="empty"><div class="big">${SVG.pad}</div><h2>Aucun jeu installé</h2>
      <p>Va dans le Catalogue pour installer ton premier jeu. Il marchera ensuite même sans connexion.</p>
      <a class="btn" href="#/catalog">Ouvrir le Catalogue</a></div>`;
  }
  const rows = ids.map((id) => {
    const g = byId(id) || { id, name: id, category: "" };
    const sub = [g.category, playedLabel(id)].filter(Boolean).join(" · ");
    return `<div class="row" data-open="${esc(id)}">${iconHTML(g)}<div class="info"><div class="name">${esc(g.name)}</div>
      <div class="sub">${esc(sub)}</div></div><button class="btn" data-act="play" data-id="${esc(id)}">Jouer</button></div>`;
  }).join("");
  return `${tip}<div class="header"><h1>Bibliothèque</h1><p>${n} jeu${n > 1 ? "x" : ""} installé${n > 1 ? "s" : ""}</p></div>
    <div class="section-title">Récemment joués</div><div class="list">${rows}</div>`;
}

function catalogView() {
  const cats = ["Tous", ...new Set(state.catalog.map((g) => g.category).filter(Boolean))];
  if (!cats.includes(state.filter.cat)) state.filter.cat = "Tous";
  const q = state.filter.q.trim().toLowerCase();
  const list = state.catalog
    .filter((g) => state.filter.cat === "Tous" || g.category === state.filter.cat)
    .filter((g) => !q || g.name.toLowerCase().includes(q))
    .sort((a, b) => (b.addedAt || "").localeCompare(a.addedAt || ""));
  const n = state.catalog.length;
  let body;
  if (!state.catalogLoaded) body = "";
  else if (!n) {
    body = `<div class="empty small"><div class="big">${SVG.pad}</div><h2>Aucun jeu pour l'instant</h2>
      <p>Les jeux qu'on créera ensemble apparaîtront ici.</p></div>`;
  } else if (!list.length) {
    body = `<div class="empty small"><p>Aucun jeu ne correspond.</p></div>`;
  } else {
    body = `<div class="list">${list.map((g) => {
      const status = state.installing[g.id]
        ? `installation… <span data-pct="${esc(g.id)}">${Math.round(state.installing[g.id].progress * 100)} %</span>`
        : isInstalled(g.id) ? "installé" : esc(formatSize(g.size));
      return `<div class="row" data-open="${esc(g.id)}">${iconHTML(g)}<div class="info">
        <div class="name">${esc(g.name)}${isNew(g) ? '<span class="badge-new">NOUVEAU</span>' : ""}</div>
        <div class="sub">${g.category ? esc(g.category) + " · " : ""}${status}</div></div>${actionHTML(g)}</div>`;
    }).join("")}</div>`;
  }
  return `<div class="header"><h1>Catalogue</h1><p>${state.catalogLoaded ? `${n} jeu${n > 1 ? "x" : ""} disponible${n > 1 ? "s" : ""}` : "Chargement…"}</p></div>
    ${n ? `<label class="search">${SVG.search}<input id="q" type="search" placeholder="Rechercher un jeu" value="${esc(state.filter.q)}" autocomplete="off"></label>
    <div class="chips">${cats.map((c) => `<button class="chip ${c === state.filter.cat ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>` : ""}
    ${body}`;
}

function detailView(id, from) {
  const g = byId(id) || (isInstalled(id) ? { id, name: id } : null);
  const backTo = from === "catalog" ? "catalog" : "library";
  const back = `<a class="navbar" href="#/${backTo}">${SVG.back}${backTo === "catalog" ? "Catalogue" : "Bibliothèque"}</a>`;
  if (!g) return `${back}<div class="empty small"><p>Ce jeu n'existe plus dans le catalogue.</p></div>`;
  const inst = state.installed[id];
  const sub = [g.category, g.players].filter(Boolean).join(" · ");
  const shots = (g.screenshots || []).length
    ? `<div class="shots">${g.screenshots.map((s) => `<div class="shot"><img src="${gameBase(g)}${esc(s)}" alt="" loading="lazy"></div>`).join("")}</div>`
    : "";
  const b = best(id);
  return `${back}
    <div class="hero-g">${iconHTML(g)}<div class="meta"><h1>${esc(g.name)}</h1><div class="sub">${esc(sub)}</div>${actionHTML(g)}</div></div>
    ${shots}
    ${g.description ? `<p class="desc">${esc(g.description)}</p>` : ""}
    <div class="infos">
      <div class="info-row"><span>Version</span><span>${esc(inst?.version || g.version || "1.0")}</span></div>
      <div class="info-row"><span>Taille</span><span>${esc(formatSize(inst?.size || g.size))}</span></div>
      ${g.controls ? `<div class="info-row"><span>Commandes</span><span>${esc(g.controls)}</span></div>` : ""}
      <div class="info-row"><span>Meilleur score</span><span>${b === null ? "—" : esc(b)}</span></div>
    </div>
    ${inst ? `<button class="danger-btn" data-act="uninstall" data-id="${esc(id)}">Désinstaller</button>` : ""}`;
}

let usedBytes = 0;
function settingsView() {
  const total = Object.values(state.installed).reduce((s, x) => s + (x.size || 0), 0);
  usedBytes = total;
  const has = Object.keys(state.installed).length > 0;
  return `<div class="header"><h1>Réglages</h1></div>
    <div class="group-title">Jeux</div>
    <div class="group"><button class="cell" data-act="sound"><span class="ic">${SVG.sound}</span><span class="lbl">Son</span>
      <span class="toggle ${soundOn() ? "on" : ""}"></span></button></div>
    <div class="group-title">Stockage</div>
    <div class="group">
      <div class="cell"><span class="lbl">Espace utilisé</span><span class="val">${formatSize(total)}</span></div>
      <div class="bar"><span id="space-bar" style="width:2%"></span></div>
      <button class="cell" data-act="updates" ${has ? "" : "disabled"}><span class="lbl">Rechercher des mises à jour</span><span class="chev">›</span></button>
    </div>
    <div class="group-title">Données</div>
    <div class="group">
      <button class="cell red" data-act="clear-scores">Effacer les scores</button>
      <button class="cell red" data-act="uninstall-all" ${has ? "" : "disabled"}>Tout désinstaller</button>
    </div>
    <div class="foot">Von · version ${VERSION}</div>`;
}

// La barre « Espace utilisé » compare les jeux à l'espace disponible pour Von.
async function fillSpaceBar() {
  const bar = $("#space-bar");
  if (!bar) return;
  let quota = 50 * 1024 * 1024;
  try { const est = await navigator.storage?.estimate?.(); if (est?.quota) quota = Math.min(est.quota, 500 * 1024 * 1024); } catch { /* ignore */ }
  bar.style.width = `${Math.min(100, Math.max(2, (usedBytes / quota) * 100))}%`;
}

function render() {
  const { page, id, from } = route();
  const tab = page === "game" ? (from === "catalog" ? "catalog" : "library") : page;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  const focused = document.activeElement?.id === "q";
  const caret = focused ? document.activeElement.selectionStart : null;
  let html;
  if (page === "catalog") html = catalogView();
  else if (page === "settings") html = settingsView();
  else if (page === "game") html = detailView(id, from);
  else html = libraryView();
  view.innerHTML = `<div class="${state.samePage ? "" : "page"}">${html}</div>`;
  if (focused) { const q = $("#q"); q?.focus(); if (caret !== null) q?.setSelectionRange(caret, caret); }
  if (page === "settings") fillSpaceBar();
}

// ---------------------------------------------------------------- interactions
view.addEventListener("click", async (e) => {
  const act = e.target.closest("[data-act]");
  if (act) {
    e.stopPropagation();
    const id = act.dataset.id;
    switch (act.dataset.act) {
      case "play": return playGame(id);
      case "install": return installGame(id);
      case "cancel": return state.installing[id]?.abort.abort();
      case "close-tip": store.set("tipClosed", true); return render();
      case "uninstall": {
        const g = byId(id);
        if (await confirmBox(`Désinstaller ${g?.name || "ce jeu"} ?`, "Le jeu sera supprimé du téléphone. Ton meilleur score est conservé.", "Désinstaller")) {
          await uninstallGame(id);
          const { from } = route();
          location.hash = from === "catalog" ? `#/game/${encodeURIComponent(id)}/catalog` : "#/library";
          render();
        }
        return;
      }
      case "sound": store.set("sound", !soundOn()); return render();
      case "updates": return checkUpdates();
      case "clear-scores":
        if (await confirmBox("Effacer les scores ?", "Tous tes meilleurs scores seront remis à zéro.", "Effacer")) {
          state.catalog.concat(Object.keys(state.installed).map((id) => ({ id }))).forEach((g) => store.del("best:" + g.id));
        }
        return;
      case "uninstall-all":
        if (await confirmBox("Tout désinstaller ?", "Tous les jeux seront supprimés du téléphone. Tes meilleurs scores sont conservés.", "Tout désinstaller")) {
          for (const id of Object.keys(state.installed)) await uninstallGame(id);
          render();
        }
        return;
    }
  }
  const chip = e.target.closest("[data-cat]");
  if (chip) { state.filter.cat = chip.dataset.cat; return render(); }
  const row = e.target.closest("[data-open]");
  if (row) {
    const { page } = route();
    location.hash = `#/game/${encodeURIComponent(row.dataset.open)}/${page === "catalog" ? "catalog" : "library"}`;
  }
});

view.addEventListener("input", (e) => {
  if (e.target.id === "q") { state.filter.q = e.target.value; state.samePage = true; render(); state.samePage = false; }
});

async function checkUpdates() {
  await loadCatalog();
  const outdated = Object.entries(state.installed).filter(([id, inst]) => {
    const g = byId(id);
    return g && g.version && g.version !== inst.version;
  });
  if (!outdated.length) {
    await alertBox({ title: "Tout est à jour", text: "Tes jeux ont tous la dernière version.", buttons: [{ label: "OK", bold: true }] });
    return render();
  }
  for (const [id] of outdated) await installGame(id);
  const n = outdated.length;
  await alertBox({ title: `${n} jeu${n > 1 ? "x" : ""} mis à jour`, text: outdated.map(([id]) => byId(id).name).join(", "), buttons: [{ label: "OK", bold: true }] });
  render();
}

window.addEventListener("hashchange", () => { closeOverlay(); window.scrollTo(0, 0); render(); });

// ---------------------------------------------------------------- démarrage
async function start() {
  const splash = $("#splash");
  requestAnimationFrame(() => splash.classList.add("play"));
  const minDelay = new Promise((r) => setTimeout(r, 1800));
  render();
  await loadCatalog();
  render();
  await minDelay;
  splash.classList.add("out");
  setTimeout(() => splash.remove(), 400);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

start();
