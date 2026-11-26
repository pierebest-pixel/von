/* Les Échoués de Kalua — l'intérieur des maisons : une pièce à la fois, chargée en passant sa porte.
 * Les pièces sont rangées en grille de 5 de large : portes à gauche / à droite (pièce voisine), au fond (rangée suivante)
 * et devant (rangée précédente ; la pièce 0 donne sur l'extérieur). La déco est commune aux deux joueurs (Village.S.rooms). */
"use strict";

const House = (() => {
  const T = 48, RW = 11, RH = 8, WALL = 3.2; // taille d'une case, de la pièce (en cases), hauteur du mur du fond
  const H = { bid: null, b: null, room: 0, n: 5, deco: { on: false, sel: null, flip: false, x: 0, y: 0, ok: true }, fade: 0, sit: null };
  const names = (b) => (b.id === "auberge" ? ["Hall", "Salle commune", "Chambre 1", "Chambre 2", "Cuisine", "Chambre 3", "Chambre 4", "Salle de bain", "Grenier", "Terrasse"] : BUILD.ROOM_NAMES.flat());
  const count = (b) => (b.id === "auberge" ? 10 : BUILD.ROOMS[Math.max(0, (b.lvl || 1) - 1)]);
  // style de chaque pièce : papier peint, sol
  const STYLE = { "Entrée": ["#f4e4cc", "wood"], "Pièce à vivre": ["#eef4e6", "wood"], "Chambre": ["#fbe6ee", "wood"], "Cuisine": ["#fff4dc", "tiles"], "Réserve": ["#e8dcc8", "stone"], "Chambre d'amis": ["#e6eefb", "wood"], "Salle de bain": ["#dff2f4", "tiles"], "Atelier": ["#efe4d4", "stone"], "Grenier": ["#e8d4b8", "wood"], "Véranda": ["#eaf6e2", "tiles"],
    "Bibliothèque": ["#e8dccc", "wood"], "Salle des trophées": ["#e6e0f0", "stone"], "Salle de musique": ["#f4e8f4", "wood"], "Jardin d'hiver": ["#e2f4e4", "tiles"], "Cave": ["#d8ccc0", "stone"], "Salle à manger": ["#f4ecdc", "wood"], "Grand salon": ["#f0e4e8", "wood"], "Bureau des cartes": ["#ece4d4", "wood"], "Observatoire": ["#dcd8f0", "stone"], "Galerie des portraits": ["#f4ece4", "wood"],
    "Salle du trône": ["#e8e0f0", "royal"], "Salle de bal": ["#f4eaf4", "royal"], "Chapelle des Lumes": ["#ece8f8", "stone"], "Armurerie": ["#e0dcd8", "stone"], "Chambre du donjon": ["#efe4f4", "royal"] };
  // un peu de mobilier de départ (tant que la pièce n'a jamais été décorée)
  const START = { "Entrée": [["tapis_rondrose", 4, 3.5], ["console", 4.5, .4], ["fougere", .4, .4], ["horlogeComtoise", 9.4, .3]], "Pièce à vivre": [["canape_vertsauge", 3.8, 3], ["tableBasseBois", 4.4, 4.6], ["chemineeBrique", 4.5, 0], ["fauteuil_fleuri", 1.2, 3.2]],
    "Chambre": [["litDouble_rose", 1, .6], ["chevetClair", 4.2, .6], ["lampeChevet_rose", 4.2, .4], ["armoireBois", 8, .3], ["tapis_rondrose", 4, 4.4]], "Cuisine": [["fourneau", 1, .3], ["evier", 3.2, .3], ["planTravail", 5.4, .3], ["tableCuisine", 4.4, 3.6], ["chaiseBois", 3.4, 4.2]],
    "Réserve": [["tonneau", .6, .4], ["caisse", 1.8, .4], ["sacFarine", 3, .5], ["etagere", 7, .3]], "Salle de bain": [["baignoire", 1, .5], ["lavabo", 5, .3], ["miroirMural", 5, 0], ["tapisBain", 5, 3]], "Chambre d'amis": [["litSimple_bleu", 1, .6], ["chevetFonce", 3.2, .6], ["commodeClaire", 7.6, .3]] };
  const key = () => "r" + H.room;
  function items() { const R = (Village.S.rooms || {})[H.bid] || {}; const r = R[key()]; if (r === undefined) { const st = START[names(H.b)[H.room]]; if (!st) return {}; return Object.fromEntries(st.map(([id, x, y], i) => ["s" + i, { id, x, y }])); } return r || {}; }
  function setItems(obj) { Village.save(`rooms/${H.bid}/${key()}`, Object.keys(obj).length ? obj : 0); }
  // ---------------------------------------------------------------- entrer, changer de pièce, sortir
  function enter(b) {
    const bid = b.bid || "base"; H.bid = bid; H.b = b; H.n = count(b); G.prevMode = "world"; G.houseOut = { x: G.p.x, y: G.p.y + 24 };
    Game.fade(() => { G.mode = "house"; G.zone = "h" + bid; load(0, "front"); Act.clear(); });
  }
  function load(room, from) {
    H.room = room; H.deco.on = false; H.deco.sel = null; DecoUI.hide(); H.sit = null;
    const p = G.p; const W = RW * T, D = RH * T;
    p.x = from === "front" ? W / 2 : from === "back" ? W / 2 : from === "left" ? T * .9 : from === "right" ? W - T * .9 : W / 2;
    p.y = from === "front" ? D - T * .7 : from === "back" ? T * 1.1 : D / 2;
    p.dir = from === "front" ? "up" : from === "back" ? "down" : from === "left" ? "right" : "left"; p.kx = p.ky = 0;
    G.zone = `h${H.bid}:${room}`; Game.camSnap();
  }
  function leave() { DecoUI.hide(); H.deco.on = false; Game.fade(() => { G.mode = "world"; G.zone = "w"; G.p.x = G.houseOut.x; G.p.y = G.houseOut.y; G.p.dir = "down"; Act.setEnv(worldEnv()); Game.camSnap(); ambience(true); }); }
  const nb = (r) => ({ left: r % 5 > 0 ? r - 1 : -1, right: r % 5 < 4 && r + 1 < H.n ? r + 1 : -1, back: r + 5 < H.n ? r + 5 : -1, front: r >= 5 ? r - 5 : r === 0 ? "out" : -1 });
  // ---------------------------------------------------------------- collisions et déplacement
  function solidAt(x, y) {
    const W = RW * T, D = RH * T; if (x < T * .45 || x > W - T * .45 || y < T * .55 || y > D - T * .25) return true;
    for (const it of Object.values(items())) { const d = DECOR.get(it.id); if (!d || d.layer !== "sol" || /^tapis|^tapisBain|^tapisNoel/.test(it.id)) continue; const x0 = it.x * T, y0 = it.y * T, x1 = x0 + d.size[0] * T, y1 = y0 + d.size[1] * T * .8; if (x > x0 + 6 && x < x1 - 6 && y > y0 + 4 && y < y1) return true; }
    return false;
  }
  function move(x, y, nx, ny) { if (!solidAt(nx, ny)) return { x: nx, y: ny }; if (!solidAt(nx, y)) return { x: nx, y }; if (!solidAt(x, ny)) return { x, y: ny }; return { x, y }; }
  function update(dt) {
    if (H.fade > 0) return; const p = G.p, W = RW * T, D = RH * T, n = nb(H.room);
    // les portes
    if (p.y > D - T * .45 && Math.abs(p.x - W / 2) < T * .9 && n.front !== -1 && p.dir === "down") { if (n.front === "out") return leave(); return Game.fade(() => load(n.front, "back")); }
    if (p.y < T * .9 && Math.abs(p.x - W / 2) < T * .9 && n.back !== -1 && p.dir === "up") return Game.fade(() => load(n.back, "front"));
    if (p.x < T * .75 && Math.abs(p.y - D / 2) < T && n.left !== -1 && p.dir === "left") return Game.fade(() => load(n.left, "right"));
    if (p.x > W - T * .75 && Math.abs(p.y - D / 2) < T && n.right !== -1 && p.dir === "right") return Game.fade(() => load(n.right, "left"));
    if (H.deco.on && H.deco.sel) { const f = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir]; const d = DECOR.get(H.deco.sel); const layer = d.layer;
      let gx = Math.round((p.x / T + f[0] * 1.4 - d.size[0] / 2) * 2) / 2, gy = layer === "mur" ? 0 : Math.round((p.y / T + f[1] * 1.2 - d.size[1] / 2) * 2) / 2;
      gx = Math.max(.3, Math.min(RW - d.size[0] - .3, gx)); gy = Math.max(.3, Math.min(RH - d.size[1] - .2, gy)); H.deco.x = gx; H.deco.y = gy; H.deco.ok = true; DecoUI.status(d.name); }
  }
  // ---------------------------------------------------------------- dessin de la pièce
  function render(ctx, vw, vh) {
    const W = RW * T, D = RH * T, z = Math.min(vw / (W + T * 1.2), (vh - 140) / (D + WALL * T + T * 1.2), 1.4);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.fillStyle = "#211a28"; ctx.fillRect(0, 0, vw, vh);
    ctx.save(); ctx.translate(vw / 2, vh / 2 + 20); ctx.scale(z, z); ctx.translate(-W / 2, -(D - WALL * T) / 2);
    const nm = names(H.b)[H.room], [wallCol, floor] = STYLE[nm] || ["#f4e8d8", "wood"], n = nb(H.room), t = G.t;
    // mur du fond
    ctx.fillStyle = wallCol; ctx.fillRect(0, -WALL * T, W, WALL * T);
    ctx.fillStyle = "rgba(0,0,0,.04)"; for (let x = 0; x < W; x += 24) ctx.fillRect(x, -WALL * T, 12, WALL * T);
    ctx.fillStyle = BUILD.kit.sh("#a8784a", .9); ctx.fillRect(0, -T * .35, W, T * .35);
    for (const wx of [T * 1.6, W - T * 3]) if (Math.abs(wx + T * .7 - W / 2) > T * 1.6) { ctx.fillStyle = "#f8f2e8"; ctx.fillRect(wx - 6, -WALL * T + T * .55 - 6, T * 1.4 + 12, T * 1.5 + 12); const g = ctx.createLinearGradient(0, -WALL * T + T * .55, 0, -WALL * T + T * 2); const night = NPC.hourAt(Net.now()); g.addColorStop(0, night >= 20 || night < 6 ? "#2a3a6a" : "#9fd3ef"); g.addColorStop(1, night >= 20 || night < 6 ? "#4a4a8a" : "#d8f0ff"); ctx.fillStyle = g; ctx.fillRect(wx, -WALL * T + T * .55, T * 1.4, T * 1.5); ctx.fillStyle = "#f8f2e8"; ctx.fillRect(wx + T * .68, -WALL * T + T * .55, 4, T * 1.5); }
    // sol
    ctx.fillStyle = floor === "tiles" ? "#f0ece4" : floor === "stone" ? "#c8c0b8" : floor === "royal" ? "#d8c8e0" : "#d8b088"; ctx.fillRect(0, 0, W, D);
    ctx.strokeStyle = "rgba(0,0,0,.08)"; ctx.lineWidth = 2;
    if (floor === "wood") for (let y = 0; y < D; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (y / 22 % 2) * 60; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 22); ctx.stroke(); } }
    else for (let y = 0; y < D; y += T / 2) for (let x = 0; x < W; x += T / 2) if (((x + y) / (T / 2)) % 2 === 0) { ctx.fillStyle = floor === "royal" ? "rgba(120,80,160,.08)" : "rgba(0,0,0,.05)"; ctx.fillRect(x, y, T / 2, T / 2); }
    const sh = ctx.createLinearGradient(0, 0, 0, T); sh.addColorStop(0, "rgba(40,20,30,.22)"); sh.addColorStop(1, "rgba(40,20,30,0)"); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, T);
    // murs de côté et plinthe avant
    ctx.fillStyle = "#8a6a4a"; ctx.fillRect(-14, -WALL * T, 14, D + WALL * T); ctx.fillRect(W, -WALL * T, 14, D + WALL * T); ctx.fillRect(-14, D, W + 28, 12);
    // portes
    const door = (x, y, w, h, label, side) => { ctx.fillStyle = "#6a3a22"; ctx.beginPath(); ctx.roundRect(x, y, w, h, side === "back" ? [w / 2, w / 2, 0, 0] : 4); ctx.fill(); ctx.fillStyle = "#e8c060"; ctx.beginPath(); ctx.arc(x + w * .78, y + h * .55, 3, 0, 7); ctx.fill(); signTag(ctx, x + w / 2, y - 10, label); };
    if (n.back !== -1) door(W / 2 - T * .6, -T * 1.9, T * 1.2, T * 1.9, "🚪 " + names(H.b)[n.back], "back");
    if (n.left !== -1) { ctx.fillStyle = "#5a3a22"; ctx.fillRect(-14, D / 2 - T, 14, T * 2); signTag(ctx, T * .9, D / 2 - T * 1.25, "← " + names(H.b)[n.left]); }
    if (n.right !== -1) { ctx.fillStyle = "#5a3a22"; ctx.fillRect(W, D / 2 - T, 14, T * 2); signTag(ctx, W - T * .9, D / 2 - T * 1.25, names(H.b)[n.right] + " →"); }
    if (n.front !== -1) { ctx.fillStyle = n.front === "out" ? "#ffe9a8" : "#5a3a22"; ctx.fillRect(W / 2 - T, D - 2, T * 2, 14); signTag(ctx, W / 2, D + 26, n.front === "out" ? "🌴 Sortir" : "↓ " + names(H.b)[n.front]); }
    // objets, personnages (triés de haut en bas)
    const list = [];
    for (const [iid, it] of Object.entries(items())) { const d = DECOR.get(it.id); if (!d) continue; const yy = d.layer === "mur" ? -1 : d.layer === "sol" && /^tapis/.test(it.id) ? -.5 : it.y + d.size[1]; list.push({ y: yy * T, f: () => { ctx.save(); ctx.translate(it.x * T, (d.layer === "mur" ? -T * .2 : it.y * T)); if (it.flip) { ctx.translate(d.size[0] * T, 0); ctx.scale(-1, 1); } DECOR.draw(it.id, ctx, T / 16, t); ctx.restore(); } }); }
    list.push({ y: G.p.y, f: () => drawCharacter(ctx, G.p, avatar, true) });
    for (const o of G.others.values()) if (o.has && o.avatar && o.zone === G.zone) list.push({ y: o.y, f: () => drawCharacter(ctx, o, o.avatar, false) });
    if (H.deco.on && H.deco.sel) { const d = DECOR.get(H.deco.sel); list.push({ y: 1e9, f: () => { ctx.save(); ctx.globalAlpha = .7; ctx.translate(H.deco.x * T, d.layer === "mur" ? -T * .2 : H.deco.y * T); if (H.deco.flip) { ctx.translate(d.size[0] * T, 0); ctx.scale(-1, 1); } DECOR.draw(H.deco.sel, ctx, T / 16, t); ctx.restore(); ctx.strokeStyle = "#3aa05a"; ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.strokeRect(H.deco.x * T, (d.layer === "mur" ? -T * 1.4 : H.deco.y * T), d.size[0] * T, d.layer === "mur" ? T * 1.2 : d.size[1] * T); ctx.setLineDash([]); } }); }
    list.sort((a, b) => a.y - b.y).forEach((it) => it.f());
    // bulle d'aide
    const u = usable(); if (u && !H.deco.on) hintBubble(ctx, u.cx, u.cy - T * 1.6, "⚡ " + DECOR.get(u.it.id).use);
    if (SET.names) nameTag(ctx, G.p.x, G.p.y - 72, me.name);
    // la nuit, la pièce est plus sombre et les lampes brillent
    const h = NPC.hourAt(Net.now()), night = h >= 20 || h < 6 ? .35 : h >= 18 ? (h - 18) / 2 * .35 : 0;
    if (night > 0) { ctx.fillStyle = `rgba(20,20,60,${night})`; ctx.fillRect(-20, -WALL * T, W + 40, D + WALL * T + 20); }
    ctx.restore();
    ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.font = "800 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(`🏠 ${nm} · ${H.room + 1}/${H.n}`, vw / 2, 92); ctx.textAlign = "left";
  }
  function signTag(c, x, y, txt) { c.font = "800 13px system-ui"; const w = c.measureText(txt).width + 14; c.fillStyle = "rgba(255,255,255,.92)"; c.beginPath(); c.roundRect(x - w / 2, y - 11, w, 22, 11); c.fill(); c.fillStyle = "#5a3a3a"; c.textAlign = "center"; c.fillText(txt, x, y + 5); c.textAlign = "left"; }
  // ---------------------------------------------------------------- objets utilisables
  function usable() {
    const p = G.p; let best = null, bd = T * 1.5;
    for (const [iid, it] of Object.entries(items())) { const d = DECOR.get(it.id); if (!d || !d.use) continue; const cx = (it.x + d.size[0] / 2) * T, cy = d.layer === "mur" ? T * .3 : (it.y + d.size[1] / 2) * T; const dist = Math.hypot(p.x - cx, (p.y - cy) * 1.2); if (dist < bd) { bd = dist; best = { iid, it, cx, cy }; } }
    return best;
  }
  function interact(p) {
    if (H.deco.on) return true; const u = usable(); if (!u) return false; const d = DECOR.get(u.it.id), act = d.use;
    if (act === "Dormir") { burst(u.cx, u.cy - 20, "love", 6); Services.sleep(); return true; }
    if (/S'asseoir|S'allonger|Se balancer/.test(act)) { p.x = u.cx; p.y = Math.min(RH * T - T * .4, u.cy + T * .4); burst(u.cx, u.cy - 40, "love", 5); toast(act === "S'asseoir" ? "😌 Tu t'assois." : act === "S'allonger" ? "😌 Tu t'allonges un moment." : "😄 Wiii !", null, 1400); return true; }
    if (/Jouer|Écouter/.test(act)) { Music.jingle(["item", "quest", "secret"][Math.floor(Math.random() * 3)]); burst(u.cx, u.cy - 40, "spark", 8); toast("🎵 ♪ ♫"); return true; }
    if (/Allumer|Illuminer|Libérer/.test(act)) { burst(u.cx, u.cy - 40, "spark", 12); toast("✨ " + act + " !"); return true; }
    if (act === "Lire") { openJournal(); return true; }
    if (/^armoire|^penderie|^commode|^malle/.test(u.it.id)) { Shop.wardrobe(); return true; }
    if (act === "Cuisiner" || act === "Cuire") { Quests.craft(); return true; }
    if (act === "Se baigner" || act === "Se doucher") { if (Services.once("bain" + H.bid)) { Prog.heal(2); toast("🛁 Quel bonheur ! +2 ❤"); } else toast("🛁 Quel bonheur !"); return true; }
    if (act === "Ouvrir" && /^cadeau/.test(u.it.id)) { if (Services.once("cadeauIn" + H.bid + u.iid)) { Prog.give(["coquillage", "perle", "plume", "lotus", "banane"][Math.floor(Math.random() * 5)], 1); toast("🎁 Une surprise !"); } else toast("Déjà ouvert aujourd'hui."); return true; }
    burst(u.cx, u.cy - 30, "spark", 6); toast(act + " ✨", null, 1200); return true;
  }
  // ---------------------------------------------------------------- décorer
  function startDeco(id) { H.deco.on = true; H.deco.sel = id; H.deco.flip = false; DecoUI.show(); }
  function placeDeco() { if (!H.deco.sel) return; const obj = Object.assign({}, items()); obj["i" + Date.now().toString(36) + Math.floor(Math.random() * 999)] = { id: H.deco.sel, x: H.deco.x, y: H.deco.y, flip: H.deco.flip || undefined }; setItems(obj); Music.sfx("pickup"); }
  function removeNearest() { const p = G.p; let best = null, bd = T * 2.2; for (const [iid, it] of Object.entries(items())) { const d = DECOR.get(it.id); if (!d) continue; const cx = (it.x + d.size[0] / 2) * T, cy = d.layer === "mur" ? T * .3 : (it.y + d.size[1] / 2) * T, dist = Math.hypot(p.x - cx, p.y - cy); if (dist < bd) { bd = dist; best = iid; } } if (!best) { toast("Rien à ranger tout près."); return null; } const obj = Object.assign({}, items()), it = obj[best]; delete obj[best]; setItems(obj); toast("🧺 " + DECOR.get(it.id).name + " rangé."); return it; }
  function stopDeco() { H.deco.on = false; H.deco.sel = null; DecoUI.hide(); }
  function openDecoMenu(cat) {
    G.menuOpen = true; cat = cat || DECOR.CATS[0];
    const d = panel(`<h3>🛋️ Décorer · ${esc(names(H.b)[H.room])}</h3><div class="psub">Tout est gratuit · ${DECOR.LIST.length} objets</div>
      <div class="chips">${DECOR.CATS.map((c) => `<button class="chip ${c === cat ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div><div class="bgrid" id="dgrid"></div>
      <button class="item" data-rm><i style="background:#ffe8ec">🧺</i>Ranger l'objet le plus proche<span class="chev">›</span></button>
      <button class="item" data-mv><i style="background:#e0f2fb">📦</i>Déplacer l'objet le plus proche<span class="chev">›</span></button>
      <button class="item main center" data-close>Fermer</button>`, "build");
    const grid = d.querySelector("#dgrid");
    for (const it of DECOR.LIST.filter((x) => x.cat === cat)) {
      if (/^trophee_/.test(it.id)) { const map = { roiCrabe: "B1", kraken: "B2", gorille: "B3", serpent: "B4", gardienTemple: "B5", grenouille: "B6", esprit: "B7", belier: "B8", aigle: "B9", gargouille: "B10", dragonnet: "B11", phenix: "B12" }; if (!Prog.P.bosses[map[it.id.slice(8)]]) continue; }
      const el = document.createElement("button"); el.className = "bcard sm"; el.dataset.pick = it.id; const cv = document.createElement("canvas"), dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = 84 * dpr; cv.height = 66 * dpr; cv.style.width = "84px"; cv.style.height = "66px"; const g = cv.getContext("2d"); g.scale(dpr, dpr); const k = Math.min(1.7, 60 / (Math.max(it.size[0], it.size[1]) * 16 + 14)); g.translate(42 - it.size[0] * 8 * k, it.layer === "mur" ? 56 : 60 - it.size[1] * 16 * k); DECOR.draw(it.id, g, k, 1); el.appendChild(cv);
      const nm = document.createElement("div"); nm.className = "bn"; nm.textContent = it.name; el.appendChild(nm); if (it.use) { const u = document.createElement("div"); u.className = "bc"; u.textContent = "⚡ " + it.use; el.appendChild(u); } grid.appendChild(el);
    }
    d.querySelector(".panel").addEventListener("click", (e) => {
      const t = e.target.closest("[data-cat],[data-pick],[data-rm],[data-mv],[data-close]"); if (!t) return; buzz();
      if (t.dataset.close !== undefined) { G.menuOpen = false; return; }
      if (t.dataset.cat) return openDecoMenu(t.dataset.cat);
      if (t.dataset.pick) { closePanel(); G.menuOpen = false; startDeco(t.dataset.pick); toast("Marche pour placer, ✔ pour poser.", null, 2000); return; }
      if (t.dataset.rm !== undefined) { closePanel(); G.menuOpen = false; removeNearest(); return; }
      if (t.dataset.mv !== undefined) { closePanel(); G.menuOpen = false; const it = removeNearest(); if (it) startDeco(it.id); return; }
    });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  return { T, enter, leave, move, update, render, interact, openDecoMenu, placeDeco, stopDeco, removeNearest, get H() { return H; }, flip() { H.deco.flip = !H.deco.flip; } };
})();

// barre de décoration (comme celle de construction)
const DecoUI = (() => {
  let bar = null;
  function show() { if (!bar) { bar = document.createElement("div"); bar.className = "buildbar"; bar.innerHTML = `<div class="bb-status" id="dbs">…</div><div class="bb-row"><button data-b="flip">↔️</button><button data-b="ok" class="ok">✔</button><button data-b="cat">📖</button><button data-b="no" class="no">✕</button></div>`; bar.addEventListener("click", (e) => { const t = e.target.closest("[data-b]"); if (!t) return; buzz(); if (t.dataset.b === "flip") House.flip(); if (t.dataset.b === "ok") House.placeDeco(); if (t.dataset.b === "cat") House.openDecoMenu(); if (t.dataset.b === "no") House.stopDeco(); }); document.body.appendChild(bar); } bar.hidden = false; }
  function hide() { if (bar) bar.hidden = true; }
  function status(name) { if (bar) bar.querySelector("#dbs").textContent = "🛋️ " + name + " · ✔ pour poser (gratuit)"; }
  return { show, hide, status };
})();
