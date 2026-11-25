/* Watchers — interface : dialogues, choix, menus, équipe, sac, carnet, quêtes, carte, boutique. */
"use strict";
const ICONS_SVG = {
  team: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="6" cy="9" r="2.2"/><circle cx="10" cy="5.5" r="2.2"/><circle cx="14" cy="5.5" r="2.2"/><circle cx="18" cy="9" r="2.2"/><path d="M12 11c-3.2 0-6 3.6-6 6.2 0 1.8 1.6 2.3 3 1.8 1.2-.4 2-.7 3-.7s1.8.3 3 .7c1.4.5 3 0 3-1.8 0-2.6-2.8-6.2-6-6.2z"/></svg>',
  bag: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h12l-1 12H7z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  dex: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M9 8h6"/></svg>',
  quest: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11"/><circle cx="5" cy="18" r="1.3"/></svg>',
  map: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14M15 6v14"/></svg>',
  save: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/></svg>',
  att: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/></svg>',
  run: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="4.5" r="1.8" fill="#fff"/><path d="m7 21 3-6 3 2v5M10 15l1.5-6 4 3 3 1M8.5 10.5l3-1.5"/></svg>',
};
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pill = (t) => `<span class="pill" style="background:${TYPE_UI[t]}">${t}</span>`;
const hpColor = (a, b) => (a / b > .5 ? "#4ec26a" : a / b > .2 ? "#e8c830" : "#ff453a");

function monCanvas(mon, flip) {
  const sp = SPECIES[mon.species];
  const c = CREATURE_ART.draw({ seed: sp.seed, type: sp.types[0], type2: sp.types[1], shape: sp.shape, stage: sp.stage, shiny: mon.shiny });
  if (!flip) return c;
  const f = document.createElement("canvas"); f.width = f.height = 40; const g = f.getContext("2d"); g.translate(40, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return f;
}
function itemCanvas(id) { const src = ITEM_ART.icon(ITEM_ICON[id] || id); const c = document.createElement("canvas"); c.width = c.height = 16; c.getContext("2d").drawImage(src, 0, 0); return c; }
function fillIcons(root) { root.querySelectorAll("[data-ic]").forEach((s) => { const c = itemCanvas(s.dataset.ic); if (s.dataset.big) c.style.cssText = "width:52px;height:52px;image-rendering:pixelated"; s.replaceWith(c); }); }

const UI = {
  root: null,
  init(root) { this.root = root; },
  add(node) { this.root.append(node); return node; },

  banner(text) {
    this.root.querySelector(".hud-banner")?.remove();
    const b = this.add(el(`<div class="hud-banner">${esc(text)}</div>`));
    setTimeout(() => { b.style.opacity = 0; setTimeout(() => b.remove(), 700); }, 2200);
  },
  toast(text) { const t = this.add(el(`<div class="toast">${esc(text)}</div>`)); setTimeout(() => t.remove(), 2500); },
  fade(fn) {
    const f = this.add(el('<div class="fade"></div>')); G.busy = true;
    requestAnimationFrame(() => f.classList.add("on"));
    setTimeout(() => { fn(); f.classList.remove("on"); setTimeout(() => { f.remove(); G.busy = false; }, 260); }, 260);
  },
  exclaim(npc) {
    return new Promise((res) => {
      const S = Game.scale; const r = Game.toScreen(npc.x, npc.y);
      const e = this.add(el(`<div class="exclaim" style="left:${r.x + 3 * S}px;top:${r.y - 14 * S}px">!</div>`));
      setTimeout(() => { e.remove(); res(); }, 700);
    });
  },

  // Dialogue : texte (ou liste de textes), nom facultatif
  async say(name, text, opts = {}) {
    const pages = Array.isArray(text) ? text : [text];
    const wasBusy = G.busy; G.busy = true;
    for (const p of pages) await this._page(name, p);
    G.busy = wasBusy;
  },
  _page(name, text) {
    return new Promise((res) => {
      const d = this.add(el(`<div class="dlg">${name ? `<div class="who">${esc(name)}</div>` : ""}<span class="tx"></span><div class="arrow" hidden>▼</div></div>`));
      const tx = d.querySelector(".tx"), arrow = d.querySelector(".arrow");
      let i = 0, done = false;
      const timer = setInterval(() => { i += 2; tx.textContent = text.slice(0, i); if (i >= text.length) finish(); }, 22);
      function finish() { clearInterval(timer); tx.textContent = text; done = true; arrow.hidden = false; }
      const next = () => { if (!done) { finish(); Input.aListeners.push(next); return; } SFX.play("tap"); d.remove(); res(); };
      d.addEventListener("click", () => { const k = Input.aListeners.indexOf(next); if (k >= 0) Input.aListeners.splice(k, 1); next(); });
      Input.aListeners.push(next);
    });
  },
  ask(question, options, name) {
    return new Promise(async (res) => {
      const d = this.add(el(`<div class="dlg">${name ? `<div class="who">${esc(name)}</div>` : ""}${esc(question)}</div>`));
      const c = this.add(el(`<div class="choices">${options.map((o, i) => `<button data-i="${i}">${esc(o)}</button>`).join("")}</div>`));
      const wasBusy = G.busy; G.busy = true;
      const pick = (i) => { d.remove(); c.remove(); G.busy = wasBusy; Input.aListeners = Input.aListeners.filter((f) => f !== a0); Input.bListeners = Input.bListeners.filter((f) => f !== bl); SFX.play("tap"); res(i); };
      const a0 = () => pick(0), bl = () => pick(options.length - 1);
      Input.aListeners.push(a0); Input.bListeners.push(bl);
      c.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) pick(+b.dataset.i); });
    });
  },

  // Écran plein (menus) — renvoie une promesse résolue à la fermeture
  screen(title, back, body, onMount) {
    return new Promise((res) => {
      const s = this.add(el(`<div class="screen"><div class="top"><button class="back">‹ ${esc(back)}</button><h1>${esc(title)}</h1></div><div class="body"></div></div>`));
      const close = (v) => { s.remove(); Input.bListeners = Input.bListeners.filter((f) => f !== bl); res(v); };
      const bl = () => close();
      Input.bListeners.push(bl);
      s.querySelector(".back").onclick = () => close();
      const render = () => { s.querySelector(".body").innerHTML = typeof body === "function" ? body() : body; fillIcons(s); onMount && onMount(s, close, render); };
      render();
    });
  },

  // ------------------------------------------------ Menu principal (grille)
  menu() {
    G.busy = true;
    const p = G.save;
    const dim = this.add(el('<div class="dim"></div>'));
    const items = [["team", "#30d158", "Équipe", `${p.party.length} / 6`], ["bag", "#ff9f0a", "Sac", ""], ["dex", "#bf5af2", "Carnet", `${p.caughtL.length} capturés`],
      ["quest", "#0a84ff", "Quêtes", `${Object.values(p.quests).filter((q) => !q.done).length} en cours`], ["map", "#64d2ff", "Carte", ""], ["save", "#8e8e93", "Sauver", ""]];
    const sh = this.add(el(`<div class="sheet"><div class="grab"></div><h2>Menu</h2><div class="grid">${items.map(([k, c, l, v]) => `<button class="gi" data-k="${k}"><span class="gic" style="background:${c}">${ICONS_SVG[k]}</span><b>${l}</b><small>${v}</small></button>`).join("")}</div></div>`));
    const close = () => { dim.remove(); sh.remove(); G.busy = false; Input.bListeners = Input.bListeners.filter((f) => f !== close); };
    Input.bListeners.push(close);
    dim.onclick = close;
    sh.onclick = async (e) => {
      const b = e.target.closest("[data-k]"); if (!b) return;
      SFX.play("tap"); close(); G.busy = true;
      const k = b.dataset.k;
      if (k === "team") await this.team();
      if (k === "bag") await this.bag();
      if (k === "dex") await this.dex();
      if (k === "quest") await this.quests();
      if (k === "map") await this.worldMap();
      if (k === "save") { G.write(); SFX.play("item"); await this.say(null, "Partie sauvegardée."); }
      G.busy = false;
    };
  },

  // ------------------------------------------------ Équipe
  monCard(m, i, cls = "") {
    const sp = SPECIES[m.species];
    return `<button class="card ${cls} ${m.hp <= 0 ? "ko" : ""}" data-i="${i}"><div class="av" data-mon="${i}">${m.shiny ? '<span class="star">★</span>' : ""}</div><div class="inf">
      <div class="nm">${esc(m.species)}<small>Nv ${m.level}</small></div><div class="tp">${sp.types.map(pill).join("")}${m.status ? `<span class="pill" style="background:${STATUS[m.status].color}">${STATUS[m.status].short}</span>` : ""}${m.hp <= 0 ? '<span class="pill" style="background:#555">K.O.</span>' : ""}</div>
      <div class="hpb"><span style="width:${(m.hp / m.stats.hp) * 100}%;background:${hpColor(m.hp, m.stats.hp)}"></span></div><div class="hpn"><span>PV</span><span>${m.hp} / ${m.stats.hp}</span></div></div></button>`;
  },
  mountMons(s, list) { s.querySelectorAll("[data-mon]").forEach((d) => d.prepend(monCanvas(list[+d.dataset.mon]))); },
  // mode : "view" (menu), "pick" (choisir un Watcher, renvoie l'index)
  team(mode = "view", opts = {}) {
    let swap = null;
    return this.screen(opts.title || "Équipe", opts.back || "Menu", () => {
      const p = G.save.party;
      return `<div class="sub">${opts.hint || (swap === null ? `${p.length} / 6 · Touche un Watcher pour le voir` : "Touche un autre Watcher pour échanger leurs places")}</div>${p.map((m, i) => this.monCard(m, i, (i === 0 ? "lead " : "") + (swap === i ? "sel" : ""))).join("")}
        ${p.length < 6 ? `<div style="margin:14px 14px 0;border:2px dashed rgba(255,255,255,.12);border-radius:16px;padding:18px;text-align:center;font-size:10px;color:#6b6575">Emplacement libre ×${6 - p.length}</div>` : ""}
        ${mode === "view" && G.save.box.length ? `<div class="btns" style="margin-top:14px"><button class="btn" data-box>Réserve (${G.save.box.length})</button></div>` : ""}`;
    }, (s, close, render) => {
      this.mountMons(s, G.save.party);
      s.querySelector("[data-box]")?.addEventListener("click", async () => { await this.box(); render(); });
      s.querySelectorAll(".card").forEach((c) => c.onclick = async () => {
        const i = +c.dataset.i;
        if (mode === "pick") { if (opts.filter && !opts.filter(G.save.party[i])) return; return close(i); }
        if (swap !== null) { if (swap !== i) { const p = G.save.party;[p[swap], p[i]] = [p[i], p[swap]]; } swap = null; return render(); }
        const r = await this.monDetail(G.save.party[i], true);
        if (r === "move") { swap = i; } render();
      });
    });
  },
  box() {
    return this.screen("Réserve", "Équipe", () => `<div class="sub">Touche un Watcher pour l'envoyer dans l'équipe</div>${G.save.box.map((m, i) => this.monCard(m, i)).join("") || '<div class="sub">La réserve est vide.</div>'}`,
      (s, close, render) => {
        this.mountMons(s, G.save.box);
        s.querySelectorAll(".card").forEach((c) => c.onclick = async () => {
          const i = +c.dataset.i, m = G.save.box[i];
          if (G.save.party.length < 6) { G.save.box.splice(i, 1); G.save.party.push(m); UI.toast(m.species + " rejoint l'équipe"); return render(); }
          const j = await this.team("pick", { title: "Échanger avec…", back: "Réserve", hint: "L'équipe est pleine : choisis qui part en réserve" });
          if (j == null) return;
          G.save.box[i] = G.save.party[j]; G.save.party[j] = m; render();
        });
      });
  },
  monDetail(m, canMove) {
    const sp = SPECIES[m.species];
    const st = (k, col) => `<div class="stat"><b>${STAT_NAMES[k]}</b><i>${m.stats[k]}</i><div class="sb"><span style="width:${Math.min(100, m.stats[k] / (m.level * 3.2 + 20) * 100)}%;background:${col}"></span></div></div>`;
    const next = m.level >= MAX_LEVEL ? "MAX" : `${m.xp - xpForLevel(m.level)} / ${xpForLevel(m.level + 1) - xpForLevel(m.level)}`;
    return this.screen("", "Retour", `<div style="text-align:center;margin:-6px 0 8px"><div class="av" id="big" style="width:150px;height:150px;margin:0 auto;border-radius:30px;background:radial-gradient(circle,${TYPE_UI[sp.types[0]]}40,rgba(255,255,255,.03))">${m.shiny ? '<span class="star" style="font-size:20px;top:4px;right:8px">★</span>' : ""}</div>
      <div style="font-size:19px;font-weight:700;margin-top:10px">${esc(m.species)}</div>${m.shiny ? '<div style="font-size:10px;color:#f7d77a;margin:3px 0">CHROMATIQUE</div>' : ""}<div class="tp" style="justify-content:center">${sp.types.map(pill).join("")}</div></div>
      ${sp.lore ? `<div class="sub" style="line-height:1.6;margin:4px 24px 12px">${esc(sp.lore)}</div>` : ""}
      <div class="grp"><div class="row"><span>Niveau</span><span>${m.level}</span></div><div class="row"><span>Expérience</span><span>${next}</span></div>${sp.evolveTo ? `<div class="row"><span>Évolue</span><span>au niveau ${sp.evolveAt}</span></div>` : ""}<div class="row"><span>Capturé</span><span>${esc(m.caughtIn || "—")}</span></div></div>
      <div class="lbl">STATISTIQUES</div><div class="grp" style="padding:6px 0">${st("hp", "#4ec26a")}${st("atk", "#ff9f0a")}${st("def", "#0a84ff")}${st("spa", "#bf5af2")}${st("sdf", "#64d2ff")}${st("spd", "#ff375f")}</div>
      <div class="lbl">ATTAQUES</div><div class="grp">${m.moves.map((mv) => { const M = MOVES[mv.name]; const t = moveType(M, m); return `<div class="mvr"><span class="dot" style="background:${TYPE_UI[t]}"></span><span class="n">${esc(mv.name)}</span><span class="pp">${M.power ? "PUI " + M.power + " · " : ""}PP ${mv.pp}/${M.pp}</span></div>`; }).join("")}</div>
      ${canMove ? '<div class="btns"><button class="btn" data-mv>Déplacer</button></div>' : ""}`,
      (s, close) => { const c = monCanvas(m); c.style.cssText = "width:130px;height:130px;image-rendering:pixelated"; s.querySelector("#big").append(c); s.querySelector("[data-mv]")?.addEventListener("click", () => close("move")); });
  },

  // ------------------------------------------------ Sac
  bag(mode = "view") {
    // mode "battle" : renvoie { item, target } ; "view" : utiliser hors combat
    let tab = "Soins";
    return this.screen("Sac", mode === "battle" ? "Combat" : "Menu", () => {
      const ids = Object.keys(G.save.bag).filter((k) => ITEMS[k] && ITEMS[k].tab === tab && G.save.bag[k] > 0);
      return `<div class="wallet"><span data-ic="eclat"></span> ${G.save.money.toLocaleString("fr-FR")} Éclats</div>
        <div class="seg">${["Soins", "Lanternes", "Divers", "Quête"].map((t) => `<button class="${t === tab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}</div>
        <div class="grp">${ids.map((id) => `<button class="it" data-id="${id}"><span data-ic="${id}"></span><div class="t"><b>${esc(ITEMS[id].name)}</b><small>${esc(ITEMS[id].desc)}</small></div><span class="q">×${G.save.bag[id]}</span></button>`).join("") || '<div class="row"><span>Rien ici.</span></div>'}</div>`;
    }, (s, close, render) => {
      s.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      s.querySelectorAll("[data-id]").forEach((b) => b.onclick = async () => {
        const id = b.dataset.id, it = ITEMS[id];
        if (it.kind === "lantern") { if (mode === "battle") return close({ item: id }); return this.say(null, "Les Lanternes s'utilisent pendant un combat contre un Watcher sauvage."); }
        if (it.kind === "trade" || it.kind === "key") return this.say(null, it.desc + ".");
        const i = await this.team("pick", { title: "Utiliser sur…", back: "Sac", hint: it.name, filter: (m) => canUse(id, m) });
        if (i == null) return;
        if (mode === "battle") return close({ item: id, target: i });
        await useItem(id, G.save.party[i]); render();
      });
    });
  },

  // ------------------------------------------------ Carnet
  dex() {
    let reg = 1;
    return this.screen("Carnet", "Menu", () => {
      const list = DEX.filter((n) => (reg === 6 ? false : reg === 5 ? SPECIES[n].legend && !SPECIES[n].secret : SPECIES[n].region === reg && !SPECIES[n].legend));
      const all = DEX.filter((n) => !SPECIES[n].secret);
      return `<div class="cnt"><span>Vus <b>${G.save.seenL.length}</b></span><span>Capturés <b>${G.save.caughtL.length}</b></span><span>Total <b>${all.length}</b></span></div>
      <div class="seg">${["Brumes", "Marées", "Givre", "Couronne", "Légendes"].map((t, i) => `<button class="${reg === i + 1 ? "on" : ""}" data-r="${i + 1}">${t}</button>`).join("")}</div>
      <div class="dex">${list.map((n) => { const k = DEX.indexOf(n); const st = G.save.caughtL.includes(n) ? "cap" : G.save.seenL.includes(n) ? "seen" : "none"; return `<button class="dc" data-n="${esc(n)}" data-s="${st}"><span class="no">#${String(k + 1).padStart(3, "0")}</span>${st === "cap" ? '<span class="cap"></span>' : ""}${st === "none" ? '<span class="q">?</span>' : ""}</button>`; }).join("")}</div>`;
    }, (s, close, render) => {
      s.querySelectorAll("[data-r]").forEach((b) => b.onclick = () => { reg = +b.dataset.r; render(); });
      s.querySelectorAll(".dc").forEach((d) => {
        if (d.dataset.s === "none") return;
        const sp = SPECIES[d.dataset.n];
        const cv = CREATURE_ART.draw({ seed: sp.seed, type: sp.types[0], type2: sp.types[1], shape: sp.shape, stage: sp.stage });
        if (d.dataset.s === "seen") { const g = cv.getContext("2d"); g.globalCompositeOperation = "source-in"; g.fillStyle = "#2a2636"; g.fillRect(0, 0, 40, 40); }
        d.append(cv);
        d.onclick = () => this.say(d.dataset.s === "cap" ? d.dataset.n : "???", d.dataset.s === "cap" ? `${sp.types.join(" / ")}. ${sp.lore || "Habite la région " + ["", "des Brumes", "des Marées", "des Givres", "de la Couronne", ""][sp.region] + "."}` : "Tu l'as aperçu, mais tu ne l'as pas encore capturé.");
      });
    });
  },

  // ------------------------------------------------ Quêtes
  quests() {
    const Q = (id) => {
      const q = G.save.quests[id], def = QUESTS[id];
      const step = def.steps[Math.min(q.step, def.steps.length - 1)];
      const tag = q.done ? ["Terminée", "#30d158"] : def.main ? ["Chapitre " + (q.step + 1), "#7c3aed"] : q.step === 0 ? ["Nouvelle", "#ff9f0a"] : ["En cours", "#0a84ff"];
      const pg = q.done ? 100 : Math.round((q.step / def.steps.length) * 100);
      return `<div class="qt ${q.done ? "done" : ""}"><span data-face="${id}"></span><div style="flex:1"><div class="h">${esc(def.title)}<span class="tag" style="background:${tag[1]}">${tag[0]}</span></div><p>${esc(q.done ? def.end : step)}</p><div class="pg"><span style="width:${pg}%"></span></div></div></div>`;
    };
    const ids = Object.keys(G.save.quests);
    const main = ids.filter((i) => QUESTS[i].main), side = ids.filter((i) => !QUESTS[i].main).sort((a, b) => G.save.quests[a].done - G.save.quests[b].done);
    return this.screen("Quêtes", "Menu", `<div class="lbl">QUÊTE PRINCIPALE</div><div class="grp">${main.map(Q).join("") || '<div class="row"><span>—</span></div>'}</div>
      <div class="lbl">QUÊTES SECONDAIRES</div><div class="grp">${side.map(Q).join("") || '<div class="row"><span>Parle aux habitants pour en découvrir.</span></div>'}</div>`,
      (s) => s.querySelectorAll("[data-face]").forEach((f) => { const n = npcSprite({ look: QUESTS[f.dataset.face].face || {} }); const c = document.createElement("canvas"); c.width = c.height = 10; c.getContext("2d").drawImage(n, -3, -1); f.replaceWith(c); }));
  },

  // ------------------------------------------------ Carte
  worldMap() {
    const here = WORLD_MAP.PLACES.find((p) => p.id === MAPS[G.save.map].place) || WORLD_MAP.PLACES[0];
    const names = ["Vallée des Brumes", "Archipel des Marées", "Pics de Givre", "Couronne Éteinte"];
    return this.screen("Carte", "Menu", `<div class="sub">Région actuelle : ${esc(names[MAPS[G.save.map].region - 1] || "Cœur du soleil")}</div><div class="mapw" id="mw"></div>
      <div class="grp" style="margin-top:12px">${names.map((n, i) => { const open = G.save.regions.includes(i + 1); return `<div class="row"><span style="display:flex;align-items:center;gap:8px;color:${open ? "#fff" : "#6b6575"}"><i style="width:10px;height:10px;border-radius:3px;background:${open ? ["#4e9a4a", "#3b7dd8", "#8fd0e8", "#a3123a"][i] : "#3a3546"}"></i>${open || i < 3 ? n : "???"}</span><span>${open ? `${G.bossCount(i + 1)} / ${BOSSES[i + 1].length} boss` : "Verrouillée"}</span></div>`; }).join("")}</div>`,
      (s) => {
        const mw = s.querySelector("#mw"); mw.append(WORLD_MAP.draw(G.save.regions));
        mw.insertAdjacentHTML("beforeend", WORLD_MAP.PLACES.filter((p) => G.save.regions.includes(p.region)).map((p) => `<span class="pin" style="left:${p.x / WORLD_MAP.W * 100}%;top:${p.y / WORLD_MAP.H * 100}%">${esc(p.name)}</span>`).join("") + `<span class="you" style="left:${here.x / WORLD_MAP.W * 100}%;top:${here.y / WORLD_MAP.H * 100}%"></span>`);
      });
  },

  // ------------------------------------------------ Boutique
  shop(cfg) {
    let tab = "Acheter";
    return this.screen("Boutique", "Quitter", () => {
      let list = "";
      if (tab === "Acheter") list = cfg.stock.map((id) => `<div class="it"><span data-ic="${id}"></span><div class="t"><b>${esc(ITEMS[id].name)}</b><small>${esc(ITEMS[id].desc)} · ×${G.save.bag[id] || 0}</small></div><span class="price"><span data-ic="eclat"></span>${ITEMS[id].price}</span><button class="buy" data-buy="${id}" ${G.save.money < ITEMS[id].price ? "disabled" : ""}>+</button></div>`).join("");
      if (tab === "Vendre") list = Object.keys(G.save.bag).filter((id) => ITEMS[id] && ITEMS[id].kind !== "key" && G.save.bag[id] > 0).map((id) => { const p = ITEMS[id].sell || Math.floor((ITEMS[id].price || 0) / 2); return `<div class="it"><span data-ic="${id}"></span><div class="t"><b>${esc(ITEMS[id].name)}</b><small>×${G.save.bag[id]}</small></div><span class="price"><span data-ic="eclat"></span>${p}</span><button class="buy" data-sell="${id}" ${p ? "" : "disabled"}>−</button></div>`; }).join("") || '<div class="row"><span>Rien à vendre.</span></div>';
      if (tab === "Échanger") list = (cfg.trades || TRADES).map(([a, qa, b, qb], i) => `<div class="it"><span data-ic="${a}"></span><span style="font-size:10px">×${qa}</span><span style="flex:1;text-align:center;color:#5ee0c6">→</span><span data-ic="${b}"></span><span style="font-size:10px">×${qb}</span><button class="buy" data-tr="${i}" ${G.has(a, qa) ? "" : "disabled"}>Échanger</button></div>`).join("");
      return `<div class="wallet"><span data-ic="eclat"></span> ${G.save.money.toLocaleString("fr-FR")} Éclats</div>
        <div class="merchant"><span id="npcpic"></span>« ${esc(cfg.line)} »</div>
        <div class="seg">${["Acheter", "Vendre", "Échanger"].map((t) => `<button class="${t === tab ? "on" : ""}" data-tab="${t}">${t}</button>`).join("")}</div><div class="grp">${list}</div>
        ${tab === "Échanger" ? '<div class="sub">Les baies et les cristaux se trouvent en explorant</div>' : ""}`;
    }, (s, close, render) => {
      const pic = npcSprite({ look: cfg.look || {} }); const c = document.createElement("canvas"); c.width = c.height = 16; c.getContext("2d").drawImage(pic, 0, 0); s.querySelector("#npcpic").replaceWith(c);
      s.querySelectorAll("[data-tab]").forEach((b) => b.onclick = () => { tab = b.dataset.tab; render(); });
      s.querySelectorAll("[data-buy]").forEach((b) => b.onclick = () => { const id = b.dataset.buy; if (G.save.money < ITEMS[id].price) return; G.save.money -= ITEMS[id].price; G.give(id, 1, true); SFX.play("item"); render(); });
      s.querySelectorAll("[data-sell]").forEach((b) => b.onclick = () => { const id = b.dataset.sell; G.save.money += ITEMS[id].sell || Math.floor((ITEMS[id].price || 0) / 2); G.take(id); SFX.play("item"); render(); });
      s.querySelectorAll("[data-tr]").forEach((b) => b.onclick = () => { const [a, qa, x, qx] = (cfg.trades || TRADES)[+b.dataset.tr]; if (!G.has(a, qa)) return; G.take(a, qa); G.give(x, qx); render(); });
    });
  },

  // Remplacer une attaque (4 maximum)
  async learnMove(mon, move) {
    if (mon.moves.some((m) => m.name === move)) return;
    if (mon.moves.length < 4) { mon.moves.push({ name: move, pp: MOVES[move].pp }); return this.say(null, `${mon.species} apprend ${move} !`); }
    const i = await this.ask(`${mon.species} veut apprendre ${move}. Oublier une attaque ?`, [...mon.moves.map((m) => "Oublier " + m.name), "Ne pas apprendre"]);
    if (i < 4) { const old = mon.moves[i].name; mon.moves[i] = { name: move, pp: MOVES[move].pp }; await this.say(null, `${mon.species} oublie ${old} et apprend ${move} !`); }
    else await this.say(null, `${mon.species} n'apprend pas ${move}.`);
  },
};

function canUse(id, m) {
  const it = ITEMS[id];
  if (it.kind === "heal") return m.hp > 0 && m.hp < m.stats.hp;
  if (it.kind === "revive") return m.hp <= 0;
  if (it.kind === "cure") return m.hp > 0 && it.cures.includes(m.status);
  return false;
}
async function useItem(id, m) {
  const it = ITEMS[id];
  if (!canUse(id, m)) return UI.say(null, "Ça n'aurait aucun effet.");
  G.take(id); SFX.play("heal");
  if (it.kind === "heal") { const before = m.hp; m.hp = Math.min(m.stats.hp, m.hp + it.amount); return UI.say(null, `${m.species} récupère ${m.hp - before} PV.`); }
  if (it.kind === "revive") { m.hp = Math.max(1, Math.floor(m.stats.hp * it.amount)); m.status = null; return UI.say(null, `${m.species} se relève !`); }
  if (it.kind === "cure") { m.status = null; return UI.say(null, `${m.species} va mieux.`); }
}
