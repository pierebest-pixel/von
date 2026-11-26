/* Planches supplémentaires : le village de base, le magasin de vêtements, les décorations d'extérieur. */
"use strict";

// ================================================================ planche : le village de base
function plancheVillage() {
  const el = $(`<div class="planche" id="pv"><h1>8 · Le village de base, entièrement reconstruit</h1><div class="sub">Une vraie place de village : mairie, magasin de vêtements, restaurant, café, boulangerie, marché, auberge… avec des habitants qui y vivent</div></div>`);
  const W = 1600, H = 1060, [c, g] = cv(W, H); el.appendChild(c);
  seed = 11; grass(g, W, H, "#a9d98a");
  // chemins pavés
  const pave = (pts, w) => { g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#cfc3ad"; g.lineWidth = w + 8; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.strokeStyle = "#e8dcc4"; g.lineWidth = w; g.stroke(); g.setLineDash([6, 8]); g.strokeStyle = "rgba(170,150,120,.35)"; g.lineWidth = w * .7; g.stroke(); g.setLineDash([]); };
  pave([[0, 640], [1600, 640]], 54); pave([[800, 0], [800, 1060]], 54); pave([[330, 640], [330, 420]], 38); pave([[1270, 640], [1270, 420]], 38); pave([[250, 640], [250, 900]], 34); pave([[1350, 640], [1350, 900]], 34);
  // la mer en bas
  const sea = g.createLinearGradient(0, 990, 0, 1060); sea.addColorStop(0, "#7ac8e0"); sea.addColorStop(1, "#4a98c8"); g.fillStyle = "#f0dcaa"; g.fillRect(0, 960, W, 40); g.fillStyle = sea; g.beginPath(); g.moveTo(0, 1000); for (let x = 0; x <= W; x += 40) g.quadraticCurveTo(x + 20, 990 + (x % 80 ? 8 : -4), x + 40, 1000); g.lineTo(W, H); g.lineTo(0, H); g.fill();
  const S = 8.4, items = [];
  const B = (id, x, y, lvl = 1, s = S) => items.push({ y, f: () => { g.save(); g.translate(x, y); BUILD.draw(id, g, s, 1.3, lvl); g.restore(); } });
  const O = (id, x, y, s = S) => items.push({ y, f: () => { g.save(); g.translate(x, y); OUTDOOR.draw(id, g, s, 1.3); g.restore(); } });
  const P = (x, y, av, name, dir = "down") => items.push({ y, f: () => person(g, x, y, av, name, 2.3, dir) });
  // rangée du fond
  B("auberge", 330, 400); B("mairie", 800, 330); B("bibliotheque", 1270, 400);
  // rangée du milieu
  B("restaurant", 330, 610); B("place", 800, 700, 1, 10); B("vetements", 1270, 610);
  // rangée de devant
  B("cafe", 120, 900); B("boulangerie", 430, 900); B("marche", 1110, 905); B("fleuriste", 1420, 900); B("glacier", 610, 960, 1, 7.2); B("ponton", 1000, 1040, 1, 6);
  // décor
  for (const [x, y] of [[560, 620], [1040, 620], [560, 690], [1040, 690], [800, 470], [190, 660], [1410, 660]]) O("lampadaire_0", x, y);
  for (const [x, y, id] of [[40, 380, "palmier"], [600, 300, "cerisier"], [1000, 300, "cerisier"], [1560, 380, "cocotier"], [40, 720, "oranger"], [1560, 730, "citronnier"], [70, 1000, "palmier"], [1530, 1000, "cocotier"], [620, 420, "saule"]]) O(id, x, y);
  for (const [x, y, k] of [[560, 500, 1], [1040, 500, 3], [180, 540, 2], [1420, 540, 4], [700, 900, 0], [930, 860, 5]]) O("massif_" + k, x, y);
  O("guinguette", 330, 700); O("parasol_0", 120, 950, 6); O("banc_0", 560, 760); O("banc_1", 1040, 760); O("etalFruits", 960, 960); O("charrette", 1240, 960); O("boiteLettres_0", 920, 420); O("panneauDirection", 860, 820); O("fanionsFete", 800, 560, 7);
  O("haieFleurie", 600, 380); O("haieFleurie", 1000, 380);
  for (const [x, y, id] of [[150, 470, "sapin"], [500, 520, "pommier"], [1110, 520, "pommier"], [1450, 470, "sapin"], [690, 1000, "bananier"], [1300, 1010, "palmier"], [40, 560, "cerisier"], [1560, 560, "cerisier"], [480, 760, "erable"], [1130, 770, "erable"]]) O(id, x, y);
  for (const [x, y, k] of [[620, 560, 6], [990, 560, 7], [100, 780, 1], [1500, 790, 2], [560, 860, 3], [1050, 860, 4]]) O("massif_" + k, x, y);
  for (const [x, y] of [[240, 760], [420, 760], [1180, 760], [1360, 760]]) O("haie", x, y, 6);
  for (const [x, y, id] of [[700, 640, "bordureFleurie"], [900, 640, "bordureFleurie"], [190, 830, "rosier_0"], [1410, 830, "rosier_1"], [970, 470, "lavande"], [630, 470, "lavande"], [1330, 1000, "parasolPlage"], [1420, 1012, "serviette_0"], [520, 1010, "chateauSable"], [860, 1010, "barque"], [420, 470, "tulipes_1"], [1180, 470, "tulipes_0"]]) O(id, x, y); O("tonneauExt_0", 1180, 700); O("caisses_1", 1220, 712);
  // habitants et joueurs
  P(760, 790, ME, "Pierre", "up"); P(810, 795, HER, "Zoé", "up");
  const npcAv = (o) => Avatar.normalize(Object.assign({}, Avatar.DEFAULT, o));
  P(300, 700, npcAv({ hair: "chignon", hairColor: "#f4f4f4", top: "robe", topColor: "#9fd3ef" }), "Mère Tikka");
  P(1240, 690, npcAv({ hair: "long", hairColor: "#2b2230", top: "chemise", topColor: "#ff9fc0" }), "Rosalie");
  P(150, 1010, npcAv({ hair: "court", hairColor: "#6b3f22", top: "tshirt", topColor: "#ffd27a", skin: "#c98d63" }), "Tim");
  P(1100, 990, npcAv({ hair: "queue", hairColor: "#c0392b", top: "salopette", topColor: "#5b8fd9" }), "Pipa");
  P(820, 470, npcAv({ hair: "chauve", beard: "longue", top: "veste", topColor: "#2b2230" }), "Le maire");
  items.sort((a, b) => a.y - b.y).forEach((it) => it.f());
  // lumière douce de fin d'après-midi
  const sun = g.createLinearGradient(0, 0, W, H); sun.addColorStop(0, "rgba(255,220,160,.16)"); sun.addColorStop(1, "rgba(255,150,120,.06)"); g.fillStyle = sun; g.fillRect(0, 0, W, H);
  el.appendChild($(`<div class="row" style="margin-top:16px">
    <div class="note" style="flex:1"><h3>🏛️ Mairie</h3>Le maire propose des <b>projets du village</b> (fêtes, nouveaux habitants, embellissements), tient le registre et laisse renommer l'île.</div>
    <div class="note" style="flex:1"><h3>🧵 Le Fil d'Or</h3>Le magasin de vêtements : <b>15 types × 200 modèles</b>, une cabine d'essayage, un miroir, la retouche des couleurs et des motifs.</div>
    <div class="note" style="flex:1"><h3>🍲 Restaurants</h3>La Marmite, le café, la boulangerie, le glacier : des plats qui <b>soignent</b> et donnent des <b>bonus</b> (vitesse, recharge des chants…).</div>
    <div class="note" style="flex:1"><h3>👥 Un vrai village</h3>Les habitants tiennent les commerces, se promènent sur la place, se parlent. Fêtes de saison (marché de Noël en décembre).</div></div>`));
  return el;
}

// ================================================================ planche : le magasin de vêtements
function wearer(it) { const map = { tshirt: "tshirt", debardeur: "debardeur", chemise: "chemise", pull: "pull", sweat: "pull", blouson: "veste", veste: "veste", manteau: "veste", robe: "robe" }, pat = ["rayures", "pois", "fleurs", "carreaux", "etoiles", "coeurs"].includes(it.pattern) ? it.pattern : it.pattern === "mariniere" ? "rayures" : "uni"; return Avatar.normalize(Object.assign({}, Avatar.DEFAULT, { top: map[it.type] || "tshirt", topColor: it.c1, topColor2: it.c2, pattern: pat, hair: "long", hairColor: "#c96a3a" })); }
function plancheVetements() {
  const el = $(`<div class="planche" id="pf"><h1>9 · Le Fil d'Or : 3 000 vêtements, modifiables presque à l'infini</h1><div class="sub">15 types × 200 modèles (20 coupes × 10 coloris) · puis 3 couleurs libres, 16 motifs et 24 imprimés pour chaque pièce · tout est gratuit</div><div class="row"></div></div>`);
  const row = el.querySelector(".row");
  // écran 1 : l'intérieur du magasin
  { const ph = $(`<div><div class="phone"></div><div class="cap">Dans le magasin<small>Rosalie tient la boutique. Les portants sont rangés par type.</small></div></div>`); const [c, g] = cv(370, 740); ph.querySelector(".phone").appendChild(c);
    g.fillStyle = "#2a2230"; g.fillRect(0, 0, 370, 740); room(g, 15, 100, 340, 600, "", "#e8d0d8", "#fbeef2", []);
    const rack = (x, y, type) => { g.fillStyle = "#c8a060"; g.fillRect(x, y, 130, 4); g.fillRect(x, y, 4, 70); g.fillRect(x + 126, y, 4, 70); CLOTHES.catalog(type).slice(0, 5).forEach((it, k) => { g.save(); g.translate(x + 6 + k * 24, y + 2); CLOTHES.drawFlat(g, it, 30); g.restore(); }); tag(g, x + 65, y - 12, CLOTHES.TYPES.find((t) => t.id === type).plural); };
    rack(30, 210, "tshirt"); rack(205, 210, "robe"); rack(30, 340, "pull"); rack(205, 340, "blouson");
    for (const [x, it] of [[70, CLOTHES.catalog("robe")[45]], [300, CLOTHES.catalog("chemise")[90]]]) { g.save(); g.translate(x, 560); g.scale(2.6, 2.6); Avatar.draw(g, wearer(it), { t: 1 }); g.restore(); g.fillStyle = "#c8a060"; g.fillRect(x - 10, 594, 20, 6); }
    g.fillStyle = "#c8a060"; g.beginPath(); g.ellipse(185, 175, 26, 34, 0, 0, 7); g.fill(); g.fillStyle = "#d8ecf8"; g.beginPath(); g.ellipse(185, 175, 21, 29, 0, 0, 7); g.fill(); tag(g, 185, 130, "🪞 Miroir");
    g.fillStyle = "#b86a8a"; g.fillRect(300, 430, 44, 90); g.fillStyle = "#ffb0c8"; g.fillRect(304, 434, 36, 86); tag(g, 322, 422, "Cabine");
    person(g, 185, 640, Avatar.normalize(Object.assign({}, Avatar.DEFAULT, { hair: "long", hairColor: "#2b2230", top: "chemise", topColor: "#ff9fc0" })), "Rosalie"); person(g, 130, 690, ME, "Pierre", 2.4, "up"); hud(g, 370); tag(g, 185, 70, "🧵 Le Fil d'Or");
    row.appendChild(ph); }
  // écran 2 : le catalogue d'un type
  { const ph = $(`<div><div class="phone"></div><div class="cap">Le catalogue : T-shirts (200)<small>20 coupes, chacune en 10 coloris. On fait défiler.</small></div></div>`); const [c, g] = cv(370, 740); ph.querySelector(".phone").appendChild(c);
    g.fillStyle = "#fff8f0"; g.fillRect(0, 0, 370, 740); g.fillStyle = "#5a3a3a"; g.font = "900 20px Segoe UI"; g.fillText("Le Fil d'Or", 20, 46); g.font = "800 12px Segoe UI"; g.fillStyle = "#b07ad0";
    const types = CLOTHES.TYPES.slice(0, 6).map((t) => t.plural); let tx = 20; types.forEach((n, i) => { const w = g.measureText(n).width + 16; g.fillStyle = i === 0 ? "#ff9fb8" : "#f0e4ec"; g.beginPath(); g.roundRect(tx, 62, w, 24, 12); g.fill(); g.fillStyle = i === 0 ? "#fff" : "#8a5a7a"; g.fillText(n, tx + 8, 79); tx += w + 6; });
    g.fillStyle = "#8a7a78"; g.font = "700 12px Segoe UI"; g.fillText("Coupe 3/20 · T-shirt tunisien manches longues oversize", 20, 108);
    const cat = CLOTHES.catalog("tshirt"); for (let k = 0; k < 24; k++) { const it = cat[k + 16], x = 18 + (k % 4) * 86, y = 120 + Math.floor(k / 4) * 100; g.fillStyle = k === 5 ? "#ffe0ea" : "#ffffff"; g.beginPath(); g.roundRect(x, y, 80, 94, 12); g.fill(); if (k === 5) { g.strokeStyle = "#ff7f9f"; g.lineWidth = 2; g.stroke(); } g.save(); g.translate(x + 8, y + 4); CLOTHES.drawFlat(g, it, 64); g.restore(); g.fillStyle = "#5a3a3a"; g.font = "700 9px Segoe UI"; g.textAlign = "center"; g.fillText(it.name.split(" · ")[1], x + 40, y + 84); g.textAlign = "left"; }
    row.appendChild(ph); }
  // écran 3 : la retouche
  { const ph = $(`<div><div class="phone"></div><div class="cap">La retouche<small>3 couleurs, 16 motifs, 24 imprimés : on essaie en direct.</small></div></div>`); const [c, g] = cv(370, 740); ph.querySelector(".phone").appendChild(c);
    const it = Object.assign({}, CLOTHES.catalog("sweat")[27], { c1: "#c9b3ff", c2: "#ffffff", c3: "#ffd27a", pattern: "etoiles", print: "deuxcoeurs" });
    g.fillStyle = "#fbeef2"; g.fillRect(0, 0, 370, 740); g.fillStyle = "#ffe4ee"; g.beginPath(); g.ellipse(110, 250, 90, 120, 0, 0, 7); g.fill();
    g.save(); g.translate(110, 330); g.scale(5.2, 5.2); Avatar.draw(g, wearer(it), { t: 1 }); g.restore();
    g.fillStyle = "#fff"; g.beginPath(); g.roundRect(215, 120, 140, 160, 16); g.fill(); g.save(); g.translate(225, 125); CLOTHES.drawFlat(g, it, 120); g.restore();
    g.fillStyle = "#5a3a3a"; g.font = "900 15px Segoe UI"; g.fillText("Sweat à oreilles zippé", 20, 46); g.font = "700 12px Segoe UI"; g.fillStyle = "#8a7a78"; g.fillText("Coloris : Lavande · retouché", 20, 66);
    panel(g, 10, 400, 350, 330); const lab = (t, y) => { g.fillStyle = "#5a3a3a"; g.font = "900 13px Segoe UI"; g.fillText(t, 24, y); };
    lab("Couleur 1 · 2 · 3", 428); CLOTHES.PALETTE.slice(0, 14).forEach((col, k) => { g.fillStyle = col; g.beginPath(); g.arc(34 + k * 23, 448, 9, 0, 7); g.fill(); g.strokeStyle = col === it.c1 ? "#ff7f9f" : "rgba(0,0,0,.12)"; g.lineWidth = col === it.c1 ? 3 : 1; g.stroke(); });
    const wheel = g.createConicGradient(0, 335, 448); ["#ff5a5a", "#ffd23a", "#5adf6a", "#3aa0ff", "#b06aff", "#ff5a5a"].forEach((col, k) => wheel.addColorStop(k / 5, col)); g.fillStyle = wheel; g.beginPath(); g.arc(335, 448, 10, 0, 7); g.fill();
    lab("Motif", 488); CLOTHES.PATTERNS.slice(0, 8).forEach(([p, n], k) => { const x = 22 + k * 42, y = 498; g.save(); g.beginPath(); g.roundRect(x, y, 36, 36, 8); g.clip(); g.translate(x, y); g.scale(.36, .36); const sample = { c1: "#ffe4ee", c2: "#b86a8a", pattern: p }; g.fillStyle = sample.c1; g.fillRect(0, 0, 100, 100); g.restore(); g.save(); g.beginPath(); g.roundRect(x, y, 36, 36, 8); g.clip(); g.translate(x, y); g.scale(.36, .36); CLOTHES.swatch(g, { c1: "#ffe4ee", c2: "#b86a8a", pattern: p }); g.restore(); g.strokeStyle = p === "etoiles" ? "#ff7f9f" : "#eadce4"; g.lineWidth = p === "etoiles" ? 3 : 1.5; g.beginPath(); g.roundRect(x, y, 36, 36, 8); g.stroke(); });
    lab("Imprimé", 562); CLOTHES.PRINTS.slice(1, 13).forEach(([p, s], k) => { const x = 24 + (k % 12) * 27, y = 578; g.fillStyle = p === "deuxcoeurs" ? "#ffe0ea" : "#fff"; g.beginPath(); g.arc(x + 8, y, 11, 0, 7); g.fill(); g.font = s.length > 2 ? "900 7px Segoe UI" : "13px Segoe UI Emoji"; g.fillStyle = "#5a3a3a"; g.textAlign = "center"; g.fillText(s, x + 8, y + 5); g.textAlign = "left"; });
    g.fillStyle = "#6cc287"; g.beginPath(); g.roundRect(24, 640, 150, 40, 20); g.fill(); g.fillStyle = "#fff"; g.font = "900 14px Segoe UI"; g.fillText("Porter", 76, 666); g.fillStyle = "#7ab4e8"; g.beginPath(); g.roundRect(186, 640, 160, 40, 20); g.fill(); g.fillStyle = "#fff"; g.fillText("Ranger dans l'armoire", 196, 666);
    row.appendChild(ph); }
  row.appendChild($(`<div class="note" style="width:300px"><h3>La garde-robe</h3>${CLOTHES.TYPES.map((t) => `<b>${t.name}</b> · 200`).join("<br>")}<br><br>• Chaque pièce : <b>3 couleurs</b> (28 pastilles + roue libre), <b>16 motifs</b>, <b>24 imprimés</b>.<br>• Tout est <b>gratuit</b> ; les pièces portées se rangent dans l'armoire de la maison.<br>• On voit les vêtements sur son personnage partout dans le jeu, y compris dans les cinématiques.</div>`));
  // toutes les familles, 10 modèles chacune
  const box = $(`<div class="deco" style="margin-top:20px;grid-template-columns:repeat(10,minmax(0,1fr))"></div>`); el.appendChild(box);
  CLOTHES.TYPES.forEach((t, ti) => { box.appendChild($(`<div class="ctitle">${t.plural} · 200 modèles (aperçu de 10)</div>`)); const cat = CLOTHES.catalog(t.id); for (let k = 0; k < 10; k++) { const it = cat[(k * 20 + ti * 7 + k * 3) % 200], d = $(`<div class="it"></div>`), [c, g] = cv(110, 90); g.save(); g.translate(10, -5); CLOTHES.drawFlat(g, it, 90); g.restore(); d.appendChild(c); d.appendChild($(`<div class="n">${it.name}</div>`)); box.appendChild(d); } });
  return el;
}

// ================================================================ planche : les décorations d'extérieur
function plancheExterieur() {
  const el = $(`<div class="planche" id="pe"><h1>10 · Décorations d'extérieur : ${OUTDOOR.LIST.length} éléments</h1><div class="sub">À poser partout sur l'île, comme les bâtiments · jardins, mobilier, lumières, eau, jeux, plage, fêtes et Noël</div><div class="deco"></div></div>`);
  const box = el.querySelector(".deco");
  for (const cat of OUTDOOR.CATS) {
    const items = OUTDOOR.LIST.filter((x) => x.cat === cat); box.appendChild($(`<div class="ctitle">${cat} · ${items.length}</div>`));
    items.forEach((it) => { const d = $(`<div class="it"></div>`), [c, g] = cv(84, 76); g.fillStyle = it.cat === "Plage" || it.cat === "Eau" ? "#f4e6c4" : "#d8f0c4"; g.fillRect(0, 0, 84, 76); const big = Math.max(it.size[0], it.size[1] * .8, 1.6), s = Math.min(14, 62 / (big * 1.25 + 1.2)); g.save(); g.translate(42, 68); OUTDOOR.draw(it.id, g, s, 1.3); g.restore(); d.appendChild(c); d.appendChild($(`<div class="n">${it.name}</div>`)); d.appendChild($(`<div class="u">${it.use ? "⚡ " + it.use : "&nbsp;"}</div>`)); box.appendChild(d); });
  }
  return el;
}
