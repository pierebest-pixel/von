/* Les Échoués de Kalua — ce que font les bâtiments, la barre de construction, le menu « Construire », la mairie,
 * l'entrepôt commun, les restaurants, les récoltes quotidiennes, le sommeil. */
"use strict";

// ================================================================ barre de construction (en bas de l'écran)
const BuildUI = (() => {
  let bar = null;
  function show() {
    if (!bar) {
      bar = document.createElement("div"); bar.className = "buildbar";
      bar.innerHTML = `<div class="bb-status" id="bbs">…</div><div class="bb-row"><button data-b="flip" aria-label="Retourner">↔️</button><button data-b="ok" class="ok" aria-label="Poser">✔</button><button data-b="no" class="no" aria-label="Annuler">✕</button></div>`;
      bar.addEventListener("click", (e) => { const t = e.target.closest("[data-b]"); if (!t) return; buzz(); if (t.dataset.b === "flip") Village.flip(); if (t.dataset.b === "ok") Village.confirmBuild(); if (t.dataset.b === "no") Village.stopBuild(); });
      document.body.appendChild(bar);
    }
    bar.hidden = false;
  }
  function hide() { if (bar) bar.hidden = true; }
  let last = "";
  function status(why) { if (!bar) return; const name = Village.build.kind === "b" ? (Village.infoOf(Village.build.sel) || {}).name : (OUTDOOR.get(Village.build.sel) || {}).name; const txt = why.length ? `❌ ${why[0]}` : `✔ ${name} : on peut poser ici`; if (txt !== last) { last = txt; const s = bar.querySelector("#bbs"); s.textContent = txt; s.classList.toggle("bad", why.length > 0); } }
  return { show, hide, status };
})();

// ================================================================ le menu « Construire »
const ICONS = { bois: "🪵", feuille: "🌿", corde: "🪢", pierre: "🪨", argile: "🟤", fer: "⛏️", laine: "🧶", silex: "🔪", coquillage: "🐚", perle: "⚪", obsidienne: "🖤", cristalFeu: "🔥", herbe: "🌱", roseau: "🌾", gelee: "🟢", bambou: "🎋", sable: "⏳", lotus: "🪷", liane: "〰️", plume: "🪶", fil: "🧵", soufre: "🟡" };
const costHtml = (cost) => Object.entries(cost || {}).map(([k, v]) => `<span class="${Prog.has(k, v) ? "have" : "miss"}">${ICONS[k] || "•"}${v}</span>`).join(" ");
function thumb(kind, id, w = 96, h = 74, lvl = 1) {
  const cv = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + "px"; cv.style.height = h + "px";
  const g = cv.getContext("2d"); g.scale(dpr, dpr); const size = kind === "b" ? Village.sizeOf({ id, lvl }) : OUTDOOR.get(id).size;
  const s = kind === "b" ? Math.min(4.4, (w - 8) / (size[0] + 4), (h - 8) / Math.max(size[0] * 1.1, size[1] * 2.4)) : Math.min(10, (w - 10) / (Math.max(size[0], 2) * 1.4), (h - 10) / (Math.max(size[0], 2) * 2));
  g.translate(w / 2, h - 6); try { if (kind === "b") BUILD.draw(id, g, s, 1, lvl); else OUTDOOR.draw(id, g, s, 1); } catch (e) { /* ignore */ }
  return cv;
}
function openBuild(tab = "b", cat = null) {
  if (G.mode !== "world") { toast("On construit dehors, sur l'île."); return; }
  G.menuOpen = true;
  const cats = tab === "b" ? [...new Set(BUILD.CATALOG.map((c) => c.cat))] : OUTDOOR.CATS;
  cat = cat || cats[0];
  const near = Village.nearestOwned(G.p);
  const d = panel(`<h3>🔨 Construire</h3><div class="psub">Partout sur l'île · le village est commun${Game.partnerName() ? " avec " + esc(Game.partnerName()) : ""}</div>
    <div class="tabs bt"><button class="tab ${tab === "b" ? "on" : ""}" data-tab="b">🏠 Bâtiments</button><button class="tab ${tab === "o" ? "on" : ""}" data-tab="o">🌸 Décorations</button><button class="tab ${tab === "m" ? "on" : ""}" data-tab="m">✏️ Modifier</button></div>
    ${tab !== "m" ? `<div class="chips">${cats.map((c) => `<button class="chip ${c === cat ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="bgrid" id="bgrid"></div>` : `<div id="bmod"></div>`}
    <button class="item main center" data-close>Fermer</button>`, "build");
  const pnl = d.querySelector(".panel");
  if (tab !== "m") {
    const grid = d.querySelector("#bgrid");
    const list = tab === "b" ? BUILD.CATALOG.filter((c) => c.cat === cat) : OUTDOOR.LIST.filter((c) => c.cat === cat);
    for (const it of list) {
      const el = document.createElement("button"); el.className = "bcard"; el.dataset.pick = it.id;
      el.appendChild(thumb(tab, it.id)); const nm = document.createElement("div"); nm.className = "bn"; nm.textContent = it.name; el.appendChild(nm);
      const cs = document.createElement("div"); cs.className = "bc"; cs.innerHTML = tab === "b" ? costHtml(it.cost) : "gratuit"; el.appendChild(cs);
      if (tab === "b") { const ds = document.createElement("div"); ds.className = "bd"; ds.textContent = it.desc; el.appendChild(ds); }
      if (tab === "b" && it.id === "statue" && !Object.keys(Prog.P.bosses || {}).some((k) => /^B\d+$/.test(k))) { el.classList.add("lock"); cs.textContent = "🔒 Libère d'abord un Gardien"; }
      grid.appendChild(el);
    }
  } else {
    const box = d.querySelector("#bmod");
    if (!near) box.innerHTML = `<p class="pnote">Approche-toi d'un bâtiment ou d'une décoration que vous avez construits pour le déplacer, le démonter ou l'améliorer.</p>`;
    else {
      const info = near.kind === "b" ? Village.infoOf(near.v.id) : OUTDOOR.get(near.v.id), site = near.kind === "b" ? Village.siteOf(near.key) : null;
      box.innerHTML = `<div class="modhead"></div><h4>${esc(info.name)}${near.v.id === "maison" ? " · " + BUILD.LEVELS[(near.v.lvl || 1) - 1].name : ""}</h4>
        ${site ? `<div class="site"><b>Agrandir en ${BUILD.LEVELS[site.next - 1].name}</b> (${BUILD.ROOMS[site.next - 1]} pièces)<br>${Object.entries(site.need).map(([k, v]) => `<div class="sr">${ICONS[k] || "•"} ${esc(ITEMS.name(k))}<span class="bar"><i style="width:${Math.min(100, (site.have[k] || 0) / v * 100)}%"></i></span>${site.have[k] || 0}/${v}</div>`).join("")}<button class="item main center" data-dep>📦 Déposer ce que j'ai</button></div>` : ""}
        <button class="item" data-mv><i style="background:#e0f2fb">📦</i>Déplacer<span class="chev">›</span></button>
        <button class="item" data-rm><i style="background:#ffe8ec">🔨</i>Démonter (tout est rendu)<span class="chev">›</span></button>`;
      box.querySelector(".modhead").appendChild(thumb(near.kind, near.v.id, 160, 120, near.v.lvl || 1));
    }
  }
  pnl.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab],[data-cat],[data-pick],[data-mv],[data-rm],[data-dep],[data-close]"); if (!t) return; buzz();
    if (t.dataset.close !== undefined) { G.menuOpen = false; return; }
    if (t.dataset.tab) return openBuild(t.dataset.tab);
    if (t.dataset.cat) return openBuild(tab, t.dataset.cat);
    if (t.dataset.pick) { if (t.classList.contains("lock")) { toast("Libère d'abord un Gardien pour sculpter sa statue."); return; } closePanel(); G.menuOpen = false; Village.startBuild(tab, t.dataset.pick); toast("Marche pour placer, puis ✔ pour poser.", null, 2400); return; }
    if (t.dataset.mv !== undefined) { closePanel(); G.menuOpen = false; Village.startBuild(near.kind, near.v.id, { key: near.key, flip: near.v.flip }, near.v.lvl || 1); Village.save((near.kind === "b" ? "b/" : "o/") + near.key, Object.assign({}, near.v, { x: -99999, y: -99999 })); Village.build.moving.orig = near.v; return; }
    if (t.dataset.rm !== undefined) { closePanel(); G.menuOpen = false; Village.remove(near.kind, near.key); return; }
    if (t.dataset.dep !== undefined) { Village.deposit(near.key); setTimeout(() => openBuild("m"), 350); }
  });
  d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
}

// ================================================================ ce que font les bâtiments
const Services = (() => {
  const day = () => Math.floor(Net.now() / NPC.DAY);
  const once = (key) => { const k = "svc:" + key + ":" + day(); if (Prog.P.flags[k]) return false; Prog.P.flags[k] = true; Prog.changed(); return true; };
  const healAll = () => Prog.heal(Prog.P.maxHp);
  const speak = (who, text) => Dialog.say(typeof who === "string" ? { name: who, color: "#8a5a7a" } : who, text);
  // repas des restaurants : chacun une fois par jour de jeu, ils soignent et donnent un bonus
  const MENUS = {
    restaurant: ["La Marmite de Kalua", [["ragout", "🍲 Ragoût de la Marmite", "Rend tous tes cœurs.", { heal: 99 }], ["poisson", "🐟 Poisson au lait de coco", "+3 cœurs et la course plus rapide (3 min).", { heal: 3, speed: 180 }], ["tarte", "🥧 Tarte à la banane", "+2 cœurs.", { heal: 2 }]]],
    cafe: ["Café", [["cafe", "☕ Café de l'île", "Tu cours plus vite pendant 3 minutes.", { speed: 180 }], ["chocolat", "🍫 Chocolat chaud", "+2 cœurs.", { heal: 2 }], ["cookie", "🍪 Biscuit coco", "+1 cœur.", { heal: 1 }]]],
    boulangerie: ["Boulangerie", [["croissant", "🥐 Croissant", "+2 cœurs.", { heal: 2 }], ["pain", "🥖 Pain chaud", "+2 cœurs.", { heal: 2 }], ["gateau", "🎂 Gâteau du jour", "+4 cœurs.", { heal: 4 }]]],
    glacier: ["Glacier", [["glaceMangue", "🍨 Glace mangue", "+2 cœurs, et la chaleur du volcan ne te dérange plus.", { heal: 2 }], ["sorbet", "🍧 Sorbet coco", "+2 cœurs.", { heal: 2 }], ["milkshake", "🥤 Milk-shake", "Course plus rapide (2 min).", { speed: 120 }]]],
    creperie: ["Crêperie", [["crepeMiel", "🥞 Crêpe au miel", "+3 cœurs.", { heal: 3 }], ["crepeBanane", "🍌 Crêpe banane-coco", "+3 cœurs.", { heal: 3 }], ["cidre", "🧃 Jus de pomme", "Course plus rapide (2 min).", { speed: 120 }]]],
    pizzeria: ["Pizzeria du Volcan", [["pizza", "🍕 Pizza du volcan", "Rend tous tes cœurs.", { heal: 99 }], ["calzone", "🥟 Calzone", "+3 cœurs.", { heal: 3 }], ["tiramisu", "🍮 Tiramisu", "+2 cœurs.", { heal: 2 }]]],
    grill: ["Grill du port", [["brochette", "🍢 Brochettes de poisson", "Rend tous tes cœurs.", { heal: 99 }], ["crabe", "🦀 Crabe grillé", "+3 cœurs.", { heal: 3 }], ["citronnade", "🍋 Citronnade", "Course plus rapide (3 min).", { speed: 180 }]]],
    salonThe: ["Salon de thé", [["theLotus", "🍵 Thé au lotus", "Tous tes chants sont prêts tout de suite.", { chants: true }], ["macaron", "🧁 Macarons", "+2 cœurs.", { heal: 2 }], ["theMenthe", "🌿 Thé à la menthe", "+1 cœur et course plus rapide.", { heal: 1, speed: 120 }]]],
    four: ["Four à pain", [["painFour", "🍞 Pain de campagne", "+2 cœurs.", { heal: 2 }], ["brioche", "🥯 Brioche", "+2 cœurs.", { heal: 2 }], ["tarteFour", "🥧 Tarte du four", "+3 cœurs.", { heal: 3 }]]],
    cuisine: ["Cuisine d'été", [["ragoutEte", "🍲 Ragoût", "+3 cœurs.", { heal: 3 }], ["brochetteEte", "🍢 Brochettes", "+2 cœurs.", { heal: 2 }], ["soupe", "🥣 Soupe d'herbes", "+2 cœurs.", { heal: 2 }]]],
  };
  function eat(fx, name) {
    if (fx.heal) Prog.heal(fx.heal);
    if (fx.speed) { G.buffSpeed = Date.now() + fx.speed * 1000; }
    if (fx.chants) Act.resetCool();
    Music.jingle("heart"); toast(`😋 ${name} : ${fx.heal >= 99 ? "tous tes cœurs sont revenus" : fx.heal ? "+" + fx.heal + " ❤" : ""}${fx.speed ? " · tu cours plus vite" : ""}${fx.chants ? " · chants prêts" : ""}`, null, 2400);
  }
  function restaurant(b) {
    const [title, list] = MENUS[b.id]; G.menuOpen = true;
    const d = panel(`<h3>${esc(title)}</h3><div class="psub">Chaque plat se commande une fois par jour</div>
      ${list.map(([id, nm, desc]) => { const done = Prog.P.flags["svc:" + b.id + id + ":" + day()]; return `<button class="item ${done ? "dim2" : ""}" data-eat="${id}"><span class="dish">${esc(nm)}<small>${esc(desc)}</small></span><span class="chev">${done ? "✓" : "›"}</span></button>`; }).join("")}
      <button class="item main center" data-close>Merci !</button>`, "resto");
    d.querySelector(".panel").addEventListener("click", (e) => { const t = e.target.closest("[data-eat],[data-close]"); if (!t) return; if (t.dataset.close !== undefined) { G.menuOpen = false; return; } const it = list.find((x) => x[0] === t.dataset.eat); if (!once(b.id + it[0])) { toast("Tu en as déjà mangé aujourd'hui. Reviens demain !"); return; } closePanel(); G.menuOpen = false; eat(it[3], it[1]); });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  // la mairie
  function mairie() {
    G.menuOpen = true; const S = Village.S, built = Object.keys(S.b || {}).length, deco = Object.keys(S.o || {}).length;
    const d = panel(`<h3>🏛️ Mairie de Kalua</h3><div class="psub">« Bienvenue, bienvenue ! Que puis-je pour vous ? »</div>
      <div class="stats"><b>${esc(S.name || "Kalua")}</b> · ${built} bâtiment${built > 1 ? "s" : ""} construit${built > 1 ? "s" : ""} · ${deco} décoration${deco > 1 ? "s" : ""}</div>
      <button class="item" data-a="name"><i style="background:#e0f2fb">✏️</i>Renommer l'île<span class="chev">›</span></button>
      <button class="item" data-a="fete"><i style="background:#fff1d9">🎉</i>${S.fete ? "Terminer la fête sur la place" : "Organiser une fête sur la place"}<span class="chev">›</span></button>
      <button class="item" data-a="projets"><i style="background:#e6f6ea">📋</i>Projets du village<span class="chev">›</span></button>
      <button class="item" data-a="registre"><i style="background:#f1ecfb">📖</i>Registre des habitants<span class="chev">›</span></button>
      <button class="item main center" data-close>Au revoir</button>`, "mairie");
    d.querySelector(".panel").addEventListener("click", async (e) => {
      const t = e.target.closest("[data-a],[data-close]"); if (!t) return; buzz(); if (t.dataset.close !== undefined) { G.menuOpen = false; return; }
      if (t.dataset.a === "name") { const n = prompt("Le nouveau nom de votre île :", S.name || "Kalua"); if (n && n.trim()) { Village.save("name", n.trim().slice(0, 28)); toast("🏝️ L'île s'appelle maintenant « " + n.trim().slice(0, 28) + " »"); } return mairie(); }
      if (t.dataset.a === "fete") { Village.save("fete", S.fete ? null : Date.now()); toast(S.fete ? "🎉 La fête commence sur la place !" : "La fête est finie."); return mairie(); }
      if (t.dataset.a === "projets") { closePanel(); G.menuOpen = false; return VillageLife.projects(); }
      if (t.dataset.a === "registre") { closePanel(); G.menuOpen = false; const names = NPC.list().filter((n) => !Prog.isDead(n.id)).map((n) => n.name); await speak("Le maire", `${names.length} habitants vivent sur l'île : ${names.slice(0, 18).join(", ")}${names.length > 18 ? "…" : "."}`); return; }
    });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  function projet() {
    const S = Village.S, has = (id) => Object.values(S.b || {}).some((b) => b && b.id === id);
    const todo = [["maison", "Construisez-vous une vraie maison ! La cabane deviendra château, un jour."], ["potager", "Un potager nourrirait tout le monde."], ["piscine", "Les enfants rêvent d'une piscine…"], ["kiosque", "Un kiosque à musique pour danser le soir !"], ["fontaine", "Une fontaine de plus, et ce serait parfait."], ["cinema", "Un cinéma sous les étoiles, quelle idée !"]].find(([id]) => !has(id));
    return todo ? todo[1] + " (Menu ≡ → Construire)" : "Le village est magnifique. Je n'ai plus rien à demander… à part une fête ?";
  }
  // l'entrepôt commun : un coffre partagé par les deux joueurs
  function chest() {
    G.menuOpen = true; const S = Village.S, box = S.chest || {};
    const mine = Object.entries(Prog.P.inv).filter(([k, v]) => v > 0 && ["res", "faune", "food"].includes(ITEMS.cat(k)));
    const d = panel(`<h3>📦 Entrepôt commun</h3><div class="psub">Ce que vous y mettez, l'autre peut le prendre</div>
      <h4>Dans l'entrepôt</h4><div class="chest">${Object.entries(box).filter(([, v]) => v > 0).map(([k, v]) => `<button class="ci" data-take="${k}">${ITEMS.icon ? "" : ""}${esc(ITEMS.name(k))} ×${v}</button>`).join("") || "<p class='pnote'>Vide.</p>"}</div>
      <h4>Dans ton sac</h4><div class="chest">${mine.map(([k, v]) => `<button class="ci" data-put="${k}">${esc(ITEMS.name(k))} ×${v}</button>`).join("") || "<p class='pnote'>Rien à déposer.</p>"}</div>
      <button class="item main center" data-close>Fermer</button>`, "chestp");
    d.querySelector(".panel").addEventListener("click", (e) => {
      const t = e.target.closest("[data-take],[data-put],[data-close]"); if (!t) return; buzz(); if (t.dataset.close !== undefined) { G.menuOpen = false; return; }
      if (t.dataset.put) { const k = t.dataset.put, n = Prog.count(k); if (n > 0 && Prog.take(k, n)) Village.save("chest/" + k, (box[k] || 0) + n); }
      if (t.dataset.take) { const k = t.dataset.take, n = box[k] || 0; if (n > 0) { Village.save("chest/" + k, null); Prog.give(k, n); } }
      chest();
    });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  // récoltes quotidiennes
  const HARVEST = { potager: [["banane", 2], ["champignon", 1], ["herbe", 2]], serre: [["lotus", 1], ["herbe", 2]], ruche: [["miel", 2]], poulailler: [["oeuf", 2]], enclos: [["lait", 1], ["laine", 2]], ponton: [["poisson", 2]], moulin: [["farine", 3]] };
  function harvest(b) { if (!once("h" + (b.bid || b.id))) { toast("Déjà récolté aujourd'hui. Ça repousse pour demain !"); return; } for (const [k, n] of HARVEST[b.id]) Prog.give(k, n); Music.jingle("item"); }
  // dormir (lit ou feu de camp) : à deux, il faut que les deux soient couchés
  function sleep() {
    const S = Village.S, solo = !G.others.size || [...G.others.values()].every((o) => o.bot), now = Date.now();
    if (!solo) {
      Village.save("bed/" + me.uid, now);
      const other = Object.entries(S.bed || {}).find(([u, t]) => u !== me.uid && now - t < 90000);
      if (!other) { toast(`💤 Tu te couches… Il faut que ${Game.partnerName() || "l'autre"} se couche aussi pour passer la nuit.`, null, 3200); return; }
    }
    const h = NPC.hourAt(Net.now()), wait = ((7 - h + 24) % 24 || 24) / 24 * NPC.DAY;
    Game.fade(() => { Village.save("clock", (S.clock || 0) + wait); Village.save("bed", null); healAll(); toast("☀️ Bonjour ! Une nouvelle journée commence. Tous tes cœurs sont revenus.", null, 3000); });
  }
  const LINES = { piscine: "Plouf ! L'eau est délicieuse.", jeux: "Wiii ! Tu glisses sur le toboggan.", kiosque: "♪ Une petite musique résonne, quelques habitants se mettent à danser.", cinema: "Sur l'écran, les images de votre aventure défilent sous les étoiles.", terrain: "Tu tires… BUT ! Personne ne garde la cage.", ecole: "Les enfants apprennent les chants des Lumes en chœur.", marche: "Les habitants échangent leurs produits. Ça sent les fruits mûrs.", fleuriste: "Les fleurs sentent si bon… Tu repars avec une herbe médicinale.", epicerie: "Tu trouves des ingrédients frais pour cuisiner.", tourGuet: "D'en haut, on voit toute l'île !", autel: "Les six lumières tournent autour de toi. Tes chants sont prêts.", pont: "Un pont bien solide.", statue: "Le Gardien, sculpté dans la pierre, veille sur le village.", fontaine: "L'eau chante doucement.", puits: "Une gorgée d'eau fraîche.", poste: "" };
  async function use(b) {
    const id = b.id;
    if (id === "maison" || id === "auberge") return House.enter(b);
    if (id === "vetements" || id === "couture") return Shop.open(id);
    if (id === "mairie") return mairie();
    if (MENUS[id]) return restaurant(b);
    if (HARVEST[id]) return harvest(b);
    if (id === "entrepot") return chest();
    if (id === "atelier" || id === "forge") return Quests.craft();
    if (id === "bibliotheque") return openJournal();
    if (id === "soins" || id === "bains") { if (!once(id)) { toast("Tu es déjà passé aujourd'hui. Reviens demain !"); return; } healAll(); Music.jingle("heart"); toast(id === "bains" ? "♨️ L'eau du volcan te détend : tous tes cœurs sont revenus." : "🌿 On te soigne : tous tes cœurs sont revenus.", null, 2600); return; }
    if (id === "puits") { if (once("puits" + (b.bid || ""))) { Prog.heal(1); toast("💧 Une gorgée d'eau fraîche : +1 ❤"); } else toast("Une gorgée d'eau fraîche."); return; }
    if (id === "feu") return sleep();
    if (id === "autel") { Act.resetCool(); toast("✨ " + LINES.autel); return; }
    if (id === "tourGuet") { toast("🔭 " + LINES.tourGuet); return openMap(); }
    if (id === "fleuriste" || id === "epicerie") { if (once(id)) Prog.give(id === "fleuriste" ? "herbe" : "banane", 2); toast(LINES[id]); return; }
    if (id === "poste") { const n = NPC.list().filter((x) => !Prog.isDead(x.id)); const who = n[day() % n.length]; await speak("📮 La Poste", `Une lettre de ${who.name} : « Merci d'être là, vous deux. L'île est plus belle depuis que vous y êtes. »`); if (once("poste")) Prog.give(["coquillage", "plume", "perle", "lotus"][day() % 4], 1); return; }
    if (id === "place") return;
    toast(LINES[id] || "✨");
  }
  async function useDeco(o) {
    const it = OUTDOOR.get(o.id), u = it.use;
    if (/S'asseoir|S'allonger/.test(u)) { burst(o.x, o.y - 30, "love", 6); toast(`😌 Tu ${u === "S'asseoir" ? "t'assois" : "t'allonges"} un moment. Il fait bon.`); return; }
    if (u === "Boire") { if (once("boire" + o.oid)) { Prog.heal(1); toast("💧 +1 ❤"); } else toast("Une gorgée d'eau fraîche."); return; }
    if (u === "Courrier") return use({ id: "poste" });
    if (u === "Fabriquer") return Quests.craft();
    if (u === "Illuminer" || u === "Allumer") { burst(o.x, o.y - 60, "spark", 14); Music.jingle("item"); toast("✨ Ça brille !"); return; }
    if (u === "Ouvrir" && /cadeau/i.test(o.id)) { if (once("cadeau" + o.oid)) { const g = ["coquillage", "perle", "plume", "lotus", "banane"][Math.floor(Math.random() * 5)]; Prog.give(g, 1); toast("🎁 Une surprise !"); } else toast("Il est vide… jusqu'à demain !"); return; }
    burst(o.x, o.y - 40, "spark", 8); toast(`${u} !`);
  }
  return { use, useDeco, sleep, once, MENUS };
})();
