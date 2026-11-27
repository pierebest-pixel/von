/* Les Échoués de Kalua — adopter les animaux, et monter à cheval.
 *  · Caresser trois fois un animal de la ferme, un chien, un chat ou un cheval : il s'attache à toi et on peut l'adopter (lui donner un nom).
 *  · Les animaux adoptés sont communs aux deux joueurs (village : pets/{id}). Ils vivent à l'enclos, au poulailler, à l'étable
 *    ou à la maison (s'ils sont construits), ou te suivent partout (« Suis-moi »). Chaque jour, ils donnent quelque chose.
 *  · Le cheval adopté se monte (Ramasser près de lui) : on va presque deux fois plus vite. Menu ≡ → « Siffler mon cheval ». */
"use strict";

const Pets = (() => {
  const TAU = Math.PI * 2;
  const ADOPT = ["chien", "chat", "cheval", "vache", "cochon", "chevre", "mouton", "poule", "canard", "lapin"];
  const SIZE = { vache: 1.8, cochon: 1.5, chevre: 1.5, mouton: 1.5, poule: 1.2, canard: 1.2, cheval: 2, chien: 1.4, chat: 1.3, lapin: 1.1 };
  const HOME = { poule: "poulailler", canard: "poulailler", cheval: "etable", vache: "etable", cochon: "enclos", chevre: "enclos", mouton: "enclos", lapin: "enclos", chien: "maison", chat: "maison" };
  const GIFT = { vache: [["lait", 1]], chevre: [["lait", 1]], mouton: [["laine", 2]], poule: [["oeuf", 2]], canard: [["plumeMouette", 1]], cochon: [["champignon", 2]], lapin: [["herbe", 2]], chien: [["coquillage", 2]], chat: [], cheval: [] };
  const NAMES = { chien: ["Biscuit", "Filou", "Caramel", "Pépite"], chat: ["Moustache", "Minou", "Câline", "Choupette"], cheval: ["Tempête", "Éclair", "Cannelle", "Sirocco"], vache: ["Marguerite", "Noisette"], cochon: ["Rillette", "Pompon"], chevre: ["Biquette", "Blanchette"], mouton: ["Frisette", "Nuage"], poule: ["Cocotte", "Paillette"], canard: ["Coin-Coin", "Plouf"], lapin: ["Panpan", "Carotte"] };
  const all = () => Object.entries(Village.S.pets || {}).filter(([, p]) => p && ADOPT.includes(p.kind));
  const isAdopted = (wid) => all().some(([, p]) => p.wid === wid);
  const hash = (s) => { let h = 7; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 1000) / 1000; };
  const live = new Map(); // pid → { x, y, dir, moving, walk }

  // ================================================================ où vit chaque animal
  function homeOf(pid, p) {
    if (p.stay) return p.stay;
    const B = Village.all(), want = HOME[p.kind], h = hash(pid);
    const b = B.find((x) => x.id === want && !x.base) || B.find((x) => x.id === "enclos") || (p.kind === "chien" || p.kind === "chat" ? B.find((x) => x.id === "maison") : null);
    if (b) return { x: b.x + (h - .5) * 160, y: b.y + 70 + hash(pid + "y") * 50 };
    return { x: Village.CX + (h - .5) * 900, y: Village.CY + 230 + hash(pid + "y") * 180 };
  }
  function target(pid, p, T) {
    if (p.follow) { const o = p.follow === me.uid ? (G.mode === "world" ? G.p : null) : [...G.others.values()].find((x) => x.uid === p.follow && x.zone === "w"); if (o) return { x: o.x, y: o.y, follow: true }; }
    const h = homeOf(pid, p), ph = hash(pid) * 40, k = (T / 9 + ph), still = Math.sin(k * .7) > .4;
    return { x: h.x + Math.cos(k) * 60, y: h.y + Math.sin(k * 1.3) * 26, still };
  }
  // ================================================================ mise à jour (positions, cheval monté)
  function update(dt) {
    const T = Net.now();
    if (G.p && G.p.mount && G.mode !== "world") dismount(true);
    for (const [pid, p] of all()) {
      if (G.p && G.p.mount === pid) { live.set(pid, { x: G.p.x, y: G.p.y, dir: G.p.dir, moving: G.p.moving, walk: 0 }); continue; }
      let L = live.get(pid); const tg = target(pid, p, T);
      if (!L) { L = { x: tg.x, y: tg.y, dir: "down", moving: false, walk: 0 }; live.set(pid, L); }
      const dx = tg.x - L.x, dy = tg.y - L.y, d = Math.hypot(dx, dy);
      if (d > 1400) { L.x = tg.x - 40; L.y = tg.y + 10; continue; }
      const keep = tg.follow ? 56 : 4, sp = tg.follow ? Math.min(330, 120 + d * 1.2) : 45;
      if (d > keep && !tg.still) { const nx = L.x + dx / d * sp * dt, ny = L.y + dy / d * sp * dt; if (!Game.world || Game.world.walkable(nx, ny) || d > 300) { L.x = nx; L.y = ny; } L.moving = true; L.dir = dx < 0 ? "left" : "right"; }
      else L.moving = false;
    }
  }
  // ================================================================ dessin (dans le monde)
  function collect(items, view) {
    for (const [pid, p] of all()) {
      if (G.p && G.p.mount === pid) continue;
      const L = live.get(pid); if (!L || L.x < view.x0 - 100 || L.x > view.x1 + 100 || L.y < view.y0 - 100 || L.y > view.y1 + 120) continue;
      items.push({ y: L.y, draw: (c, t) => drawPet(c, p, L, t ?? G.t) });
    }
  }
  function drawPet(c, p, L, t) {
    const s = SIZE[p.kind] || 1.3; c.save(); c.translate(L.x, L.y);
    c.save(); c.translate(0, (L.moving ? -Math.abs(Math.sin(t * 12)) * 2.5 : 0) - 20 * s * .5); c.scale(L.dir === "right" ? -s : s, s); Creatures.drawKind(c, p.kind); c.restore();
    // collier et nom
    c.fillStyle = "#ff5a7a"; c.beginPath(); c.arc(0, -20 * s - 4, 3.4, 0, TAU); c.fill();
    c.font = "800 10px ui-rounded, system-ui"; c.textAlign = "center"; const w = c.measureText(p.name).width + 12, y = -44 * s - 12;
    c.fillStyle = "rgba(255,255,255,.88)"; c.beginPath(); c.roundRect(-w / 2, y - 9, w, 14, 7); c.fill(); c.fillStyle = "#c0506a"; c.fillText("♥ " + p.name, 0, y + 2);
    c.restore();
  }
  // le cheval sous le joueur (appelé par le dessin du personnage)
  function drawMount(c, o, t) {
    const pid = o === G.p ? G.p.mount : null, p = pid ? (Village.S.pets || {})[pid] : null, kind = p ? p.kind : "cheval";
    const right = o.dir === "right" || (o.dir !== "left" && o._lastRight); if (o.dir === "right") o._lastRight = true; if (o.dir === "left") o._lastRight = false;
    c.save(); c.translate(0, (o.moving ? -Math.abs(Math.sin(t * 9)) * 4 : 0) - 14); c.scale(right ? -2.3 : 2.3, 2.3); Creatures.drawKind(c, kind); c.restore();
  }
  // ================================================================ caresser, adopter
  async function onPet(a) {
    if (!ADOPT.includes(a.kind) || isAdopted(a.id)) return;
    const A = Prog.P.aff || (Prog.P.aff = {}), now = Date.now(), cur = A[a.id] || { n: 0, t: 0 };
    if (now - cur.t > 3500) { cur.n++; cur.t = now; A[a.id] = cur; Prog.changed(); }
    if (cur.n < 3) { if (cur.n === 2) Game.toast(`Le ${Creatures.NAMES[a.kind].toLowerCase()} se frotte contre toi. Il a l'air de t'aimer beaucoup…`, 2200); return; }
    if (all().length >= 14) { Game.toast("Vous avez déjà beaucoup d'animaux ! (14 au maximum)", 2000); return; }
    Game.lockInput(true);
    try {
      const nm = Creatures.NAMES[a.kind].toLowerCase(), sp = { name: "", color: "#c0506a" };
      const v = await Dialog.choose(sp, `Le ${nm} ne te quitte plus des yeux. Il voudrait rester avec toi… Veux-tu l'adopter ?`, [["oui", "❤️ Oui, je l'adopte !"], ["non", "Pas maintenant"]]);
      if (v !== "oui") { cur.n = 1; Prog.changed(); return; }
      const sugg = NAMES[a.kind] || ["Doudou"], def = sugg[Math.floor(Math.random() * sugg.length)];
      let name = await Dialog.input(sp, `Comment veux-tu l'appeler ? (Par exemple : ${sugg.join(", ")})`, def);
      name = (name || def).trim().slice(0, 16) || def;
      const pid = "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
      Village.save("pets/" + pid, { kind: a.kind, name, wid: a.id, by: me.uid, at: Date.now(), follow: a.kind === "chien" || a.kind === "chat" ? me.uid : null });
      const L = Creatures.nearest(G.p.x, G.p.y, Net.now(), Game.world, 200); if (L) live.set(pid, { x: L.p.x, y: L.p.y, dir: "down", moving: false, walk: 0 });
      delete A[a.id]; Prog.changed(); Music.jingle("secret");
      const where = HOME[a.kind] === "maison" ? "Il te suit partout." : `Il va vivre ${HOME[a.kind] === "poulailler" ? "au poulailler" : HOME[a.kind] === "etable" ? "à l'étable" : "à l'enclos"} (s'il est construit), ou au village.`;
      Game.toast(`🐾 ${name} fait maintenant partie de la famille ! ${where}`, 3600);
      Prog.note(`Nous avons adopté ${name} (${nm}).`);
    } finally { Game.lockInput(false); }
  }
  // ================================================================ s'occuper de son animal
  function nearest(px, py, reach = 70) { let best = null, bd = reach; for (const [pid, p] of all()) { if (G.p.mount === pid) continue; const L = live.get(pid); if (!L) continue; const d = Math.hypot(L.x - px, (L.y - py) * 1.2); if (d < bd) { bd = d; best = { pid, p, L }; } } return best; }
  const day = () => Math.floor(Net.now() / NPC.DAY);
  async function care(q) {
    const { pid, p } = q, nm = p.name, opts = [["pet", "❤️ Caresser"]];
    if (p.kind === "cheval") opts.unshift(["ride", "🐎 Monter"]);
    if ((GIFT[p.kind] || []).length) opts.push(["gift", "🧺 Récolter (une fois par jour)"]);
    opts.push(p.follow === me.uid ? ["home", "🏠 Rentre à la maison"] : ["follow", "🐾 Suis-moi !"]);
    opts.push(["rename", "✏️ Changer son nom"], ["bye", "Au revoir"]);
    Game.lockInput(true); let v;
    try { v = await Dialog.choose({ name: nm, color: "#c0506a" }, `${nm} (${Creatures.NAMES[p.kind].toLowerCase()}) te regarde, tout content.`, opts); }
    finally { Game.lockInput(false); }
    const L = live.get(pid);
    if (v === "pet") { burst(L.x, L.y - 30, "love", 10); Music.sfx("pickup", .4); const k = "pet:" + pid + ":" + day(); if (!Prog.P.flags[k]) { Prog.P.flags[k] = true; Prog.heal(1); Game.toast(`🥰 ${nm} adore ça. +1 ❤`, 1600); } else Game.toast(`🥰 ${nm} ferme les yeux de bonheur.`, 1400); }
    if (v === "gift") { const k = "gift:" + pid + ":" + day(); if (Prog.P.flags[k]) { Game.toast(`${nm} n'a plus rien aujourd'hui. Reviens demain !`, 1600); return; } Prog.P.flags[k] = true; Prog.changed(); for (const [id, n] of GIFT[p.kind]) Prog.give(id, n); if (p.kind === "chien" && Math.random() < .25) { Prog.give("perle", 1); Game.toast(`🐶 ${nm} a déterré une perle !`, 1800); } Music.jingle("item"); }
    if (v === "follow") { Village.save("pets/" + pid, Object.assign({}, p, { follow: me.uid, stay: null })); Game.toast(`🐾 ${nm} te suit !`, 1400); }
    if (v === "home") { Village.save("pets/" + pid, Object.assign({}, p, { follow: null, stay: null })); Game.toast(`🏠 ${nm} rentre à la maison.`, 1400); }
    if (v === "rename") { const n2 = await Dialog.input({ name: nm, color: "#c0506a" }, "Son nouveau nom :", nm); if (n2 && n2.trim()) Village.save("pets/" + pid, Object.assign({}, p, { name: n2.trim().slice(0, 16) })); }
    if (v === "ride") mount(pid);
  }
  function mount(pid) {
    const p = (Village.S.pets || {})[pid]; if (!p) return; const L = live.get(pid);
    if (L) { G.p.x = L.x; G.p.y = L.y; }
    G.p.mount = pid; Music.sfx("jump", .5); Game.toast(`🐎 En selle sur ${p.name} ! On galope deux fois plus vite. (Ramasser pour descendre)`, 2600);
    if (!Prog.flag("ride_first")) { Prog.set("ride_first"); Prog.note(`Première chevauchée sur ${p.name}.`); }
  }
  function dismount(quiet) {
    const pid = G.p && G.p.mount; if (!pid) return; const p = (Village.S.pets || {})[pid]; G.p.mount = null;
    const at = G.mode === "world" ? { x: G.p.x + 40, y: G.p.y + 6 } : (Prog.P.pos ? { x: Prog.P.pos.x + 40, y: Prog.P.pos.y } : null);
    if (p && at) { Village.save("pets/" + pid, Object.assign({}, p, { follow: null, stay: at })); live.set(pid, { x: at.x, y: at.y, dir: "left", moving: false, walk: 0 }); }
    if (!quiet && p) Game.toast(`${p.name} t'attend ici. (Menu ≡ → Siffler mon cheval pour l'appeler)`, 2400);
  }
  const myHorse = () => { const h = all().find(([, p]) => p.kind === "cheval"); return h ? h[0] : null; };
  function whistle() {
    const pid = myHorse(); if (!pid) return; const p = Village.S.pets[pid]; Music.sfx("wind", .6);
    if (G.mode !== "world") { Game.toast("Le cheval ne peut pas venir ici. Sors d'abord !", 1800); return; }
    const L = live.get(pid), q = Game.world.snap(G.p.x - 70, G.p.y + 20);
    if (L) { L.x = q.x - 300; L.y = q.y; } Village.save("pets/" + pid, Object.assign({}, p, { stay: { x: q.x, y: q.y }, follow: null }));
    Game.toast(`🎵 Fuiiit ! ${p.name} arrive au galop.`, 2000);
  }
  function panel() {
    G.menuOpen = true; const L = all();
    const d = window.panel(`<h3>🐾 Nos animaux</h3><div class="psub">Caresse 3 fois un animal de la ferme, un chien, un chat ou un cheval pour l'adopter</div>
      ${L.length ? L.map(([pid, p]) => `<div class="item" style="cursor:default"><i style="background:#ffe8ec">${{ chien: "🐶", chat: "🐱", cheval: "🐴", vache: "🐮", cochon: "🐷", chevre: "🐐", mouton: "🐑", poule: "🐔", canard: "🦆", lapin: "🐰" }[p.kind]}</i><span class="dish">${esc(p.name)}<small>${esc(Creatures.NAMES[p.kind])} · ${p.follow ? "suit " + (p.follow === me.uid ? "toi" : Game.partnerName() || "l'autre") : p.stay ? "attend dehors" : "à la maison"}</small></span></div>`).join("") : `<p class="pnote">Aucun animal pour l'instant.</p>`}
      ${myHorse() && G.mode === "world" ? `<button class="item" data-w><i style="background:#f4e8d8">🐎</i>Siffler mon cheval<span class="chev">›</span></button>` : ""}
      <button class="item main center" data-close>Fermer</button>`, "pets");
    d.querySelector(".panel").addEventListener("click", (e) => { const t = e.target.closest("[data-w],[data-close]"); if (!t) return; buzz(); closePanel(); G.menuOpen = false; if (t.dataset.w !== undefined) whistle(); });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  // ================================================================ branchements
  const origInteract = Village.interact;
  Village.interact = function (p) {
    if (G.p.mount) { dismount(false); return true; }
    const q = nearest(p.x + ({ left: -20, right: 20 }[p.dir] || 0), p.y + ({ up: -16, down: 16 }[p.dir] || 0));
    if (q) { care(q); return true; }
    return origInteract(p);
  };
  const origNearest = Creatures.nearest;
  Creatures.nearest = function (...args) { const r = origNearest(...args); return r && isAdopted(r.a.id) ? null : r; };
  const origCollect = Village.collect;
  Village.collect = function (items, view) { origCollect(items, view); collect(items, view); };
  return { update, onPet, isAdopted, drawMount, dismount, mount, whistle, myHorse, panel, all, live };
})();
