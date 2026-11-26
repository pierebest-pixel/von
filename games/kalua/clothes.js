/* Les Échoués de Kalua — la garde-robe du magasin « Le Fil d'Or ».
 * 15 types de vêtements × 200 modèles (20 coupes × 10 coloris) = 3 000 modèles.
 * Chaque modèle se personnalise ensuite : 3 couleurs (palette ou roue), 16 motifs, 24 imprimés → des millions de combinaisons.
 * Une pièce = { type, design (0–19), c1, c2, c3, pattern, print }. drawFlat() la dessine à plat (vignette du magasin). */
"use strict";

const CLOTHES = (() => {
  const TAU = Math.PI * 2;
  const PALETTE = ["#ffffff", "#f4ecdc", "#e8d8b8", "#c8a070", "#8a5a3a", "#3a2a2a", "#2b2230", "#5a5a6a", "#9aa0b0", "#d6d3e3",
    "#ff9fc0", "#e2627c", "#c0394f", "#ff8a6a", "#ffb36b", "#ffd27a", "#f3e58a", "#9be0a8", "#5fae6b", "#2f7a4a",
    "#9fd3ef", "#5b8fd9", "#2a4a8a", "#5ac8c0", "#c9b3ff", "#9b6fd6", "#5a3a8a", "#ffd0e0"];
  const PATTERNS = [["uni", "Uni"], ["rayures", "Rayures"], ["mariniere", "Marinière"], ["pois", "Pois"], ["carreaux", "Carreaux"], ["vichy", "Vichy"], ["fleurs", "Fleurs"], ["hibiscus", "Hibiscus"],
    ["palmiers", "Palmiers"], ["etoiles", "Étoiles"], ["coeurs", "Cœurs"], ["coquillages", "Coquillages"], ["camouflage", "Camouflage"], ["zigzag", "Zigzag"], ["degrade", "Dégradé"], ["tiedye", "Tie-dye"]];
  const PRINTS = [["aucun", "Aucun"], ["ancre", "⚓"], ["etoile", "★"], ["coeur", "♥"], ["palmier", "🌴"], ["coquillage", "🐚"], ["vague", "🌊"], ["soleil", "☀"], ["lune", "☾"], ["tortue", "🐢"], ["poisson", "🐟"], ["fleur", "🌺"],
    ["volcan", "🌋"], ["kalua", "KALUA"], ["deuxcoeurs", "♥♥"], ["spirale", "@"], ["etoileFilante", "☄"], ["perroquet", "🦜"], ["ananas", "🍍"], ["cerise", "🍒"], ["eclair", "⚡"], ["note", "♪"], ["papillon", "🦋"], ["arcenciel", "🌈"]];
  const COLORIS = [["Lagon", "#5ac8c0", "#ffffff", "uni"], ["Corail", "#ff8a6a", "#fff4e0", "uni"], ["Nuit", "#2a4a8a", "#ffd27a", "etoiles"], ["Sable", "#e8d8b8", "#8a5a3a", "uni"], ["Hibiscus", "#e2627c", "#ffd0e0", "hibiscus"],
    ["Jungle", "#2f7a4a", "#9be0a8", "palmiers"], ["Volcan", "#3a2a2a", "#ff8a6a", "degrade"], ["Brume", "#d6d3e3", "#9b6fd6", "uni"], ["Matelot", "#ffffff", "#2a4a8a", "mariniere"], ["Coco", "#8a5a3a", "#f4ecdc", "uni"],
    ["Fraise", "#ff9fc0", "#c0394f", "pois"], ["Citron", "#f3e58a", "#ffffff", "vichy"], ["Menthe", "#9be0a8", "#ffffff", "rayures"], ["Lavande", "#c9b3ff", "#ffffff", "fleurs"], ["Cendre", "#5a5a6a", "#d6d3e3", "carreaux"],
    ["Aurore", "#ffb36b", "#ff9fc0", "degrade"], ["Océan", "#5b8fd9", "#9fd3ef", "coquillages"], ["Tropique", "#ffd27a", "#5fae6b", "palmiers"], ["Bonbon", "#ffd0e0", "#9fd3ef", "coeurs"], ["Encre", "#2b2230", "#ffffff", "uni"],
    ["Prairie", "#5fae6b", "#f3e58a", "fleurs"], ["Arc-en-ciel", "#ff9fc0", "#9fd3ef", "tiedye"], ["Forêt", "#2f7a4a", "#3a2a2a", "camouflage"], ["Rubis", "#c0394f", "#ffd27a", "uni"], ["Ciel", "#9fd3ef", "#ffffff", "zigzag"],
    ["Améthyste", "#5a3a8a", "#c9b3ff", "etoiles"], ["Crème", "#f4ecdc", "#c8a070", "rayures"], ["Pêche", "#ffb36b", "#fff4e0", "uni"], ["Ardoise", "#9aa0b0", "#2b2230", "zigzag"], ["Perle", "#ffffff", "#d6d3e3", "pois"]];

  // ---------------------------------------------------------------- les 15 types et leurs axes de coupe (20 coupes chacun)
  // chaque axe : [nom, [[valeur, libellé], …]] ; les 20 coupes sont des combinaisons bien réparties de ces axes
  const T = (id, name, family, axes, plural) => ({ id, name, family, axes, plural: plural || name + "s" });
  const TYPES = [
    T("tshirt", "T-shirt", "haut", [["col", [["rond", ""], ["v", "col V"], ["tunisien", "tunisien"], ["bateau", "col bateau"]]], ["manches", [["courtes", ""], ["retroussees", "manches retroussées"], ["raglan", "raglan"], ["longues", "manches longues"], ["mancherons", "mancherons"]]], ["coupe", [["droite", ""], ["oversize", "oversize"], ["crop", "court"], ["noue", "noué"]]], ["detail", [["aucun", ""], ["poche", "à poche"], ["bordures", "à liserés"], ["bandes", "à bandes"]]]]),
    T("debardeur", "Débardeur", "haut", [["col", [["rond", ""], ["v", "col V"], ["dos-nageur", "dos nageur"], ["licou", "licou"]]], ["bretelles", [["larges", ""], ["fines", "à fines bretelles"], ["croisees", "croisé"]]], ["coupe", [["droite", ""], ["crop", "court"], ["fluide", "fluide"], ["cotele", "côtelé"]]], ["detail", [["aucun", ""], ["volant", "à volant"], ["noeud", "à nœud"], ["dentelle", "à dentelle"]]]]),
    T("chemise", "Chemise", "haut", [["col", [["classique", ""], ["mao", "col mao"], ["claudine", "col Claudine"], ["hawai", "col hawaïen"]]], ["manches", [["longues", ""], ["courtes", "manches courtes"], ["retroussees", "retroussée"], ["bouffantes", "bouffante"]]], ["coupe", [["droite", ""], ["ample", "ample"], ["nouee", "nouée"], ["tunique", "tunique"]]], ["detail", [["aucun", ""], ["poches", "à poches"], ["epaulettes", "à épaulettes"], ["jabot", "à jabot"]]]]),
    T("pull", "Pull", "haut", [["col", [["rond", ""], ["roule", "col roulé"], ["v", "col V"], ["camionneur", "camionneur"]]], ["maille", [["lisse", ""], ["torsades", "torsadé"], ["cotes", "côtelé"], ["jacquard", "jacquard"]]], ["coupe", [["droite", ""], ["oversize", "oversize"], ["court", "court"], ["long", "long"]]], ["detail", [["aucun", ""], ["coudieres", "à coudières"], ["boutons", "boutonné"], ["pompons", "à pompons"]]]]),
    T("sweat", "Sweat", "haut", [["capuche", [["oui", "à capuche"], ["non", ""], ["oreilles", "à oreilles"]]], ["fermeture", [["aucune", ""], ["zip", "zippé"], ["demi", "demi-zip"]]], ["coupe", [["droite", ""], ["oversize", "oversize"], ["court", "court"], ["robe", "long"]]], ["detail", [["aucun", ""], ["kangourou", "poche kangourou"], ["bandes", "à bandes"], ["lacets", "à lacets"]]]]),
    T("blouson", "Blouson", "veste", [["style", [["teddy", "teddy"], ["aviateur", "aviateur"], ["jean", "en jean"], ["coupevent", "coupe-vent"], ["biker", "perfecto"]]], ["col", [["classique", ""], ["fourrure", "col fourré"], ["capuche", "à capuche"], ["montant", "col montant"]]], ["longueur", [["normale", ""], ["court", "court"], ["long", "long"]]], ["detail", [["aucun", ""], ["ecusson", "à écusson"], ["patchs", "à patchs"], ["bandes", "à bandes"]]]]),
    T("veste", "Veste", "veste", [["style", [["blazer", "blazer"], ["kimono", "kimono"], ["safari", "saharienne"], ["boleros", "boléro"], ["matelot", "de matelot"]]], ["fermeture", [["boutons", ""], ["croisee", "croisée"], ["ouverte", "ouverte"], ["ceinture", "à ceinture"]]], ["manches", [["longues", ""], ["trois-quarts", "trois-quarts"], ["retroussees", "retroussée"]]], ["detail", [["aucun", ""], ["poches", "à poches"], ["broderie", "brodée"], ["galons", "à galons"]]]]),
    T("manteau", "Manteau", "veste", [["style", [["caban", "caban"], ["trench", "trench"], ["duffle", "duffle-coat"], ["cape", "cape"], ["doudoune", "doudoune"]]], ["longueur", [["genou", ""], ["mi-cuisse", "court"], ["cheville", "long"]]], ["col", [["classique", ""], ["fourrure", "col fourré"], ["capuche", "à capuche"], ["chale", "col châle"]]], ["detail", [["aucun", ""], ["ceinture", "ceinturé"], ["brandebourgs", "à brandebourgs"], ["poches", "à poches"]]]]),
    T("robe", "Robe", "robe", [["forme", [["evasee", ""], ["droite", "droite"], ["portefeuille", "portefeuille"], ["bustier", "bustier"], ["longue", "longue"]]], ["manches", [["courtes", ""], ["sans", "sans manches"], ["longues", "manches longues"], ["bouffantes", "manches bouffantes"]]], ["col", [["rond", ""], ["v", "col V"], ["claudine", "col Claudine"], ["carre", "col carré"]]], ["detail", [["aucun", ""], ["ceinture", "ceinturée"], ["volants", "à volants"], ["noeud", "à nœud"]]]]),
    T("jupe", "Jupe", "bas", [["forme", [["patineuse", "patineuse"], ["crayon", "crayon"], ["portefeuille", "portefeuille"], ["plissee", "plissée"], ["paree", "paréo"]]], ["longueur", [["mi", ""], ["mini", "mini"], ["longue", "longue"]]], ["taille", [["normale", ""], ["haute", "taille haute"], ["elastique", "élastique"]]], ["detail", [["aucun", ""], ["boutons", "boutonnée"], ["volants", "à volants"], ["fente", "fendue"]]]]),
    T("short", "Short", "bas", [["style", [["chino", ""], ["jean", "en jean"], ["sport", "de sport"], ["cargo", "cargo"], ["surf", "de surf"]]], ["longueur", [["mi", ""], ["court", "court"], ["bermuda", "bermuda"]]], ["taille", [["normale", ""], ["haute", "taille haute"], ["cordon", "à cordon"]]], ["detail", [["aucun", ""], ["revers", "à revers"], ["bandes", "à bandes"], ["effiloche", "effiloché"]]]]),
    T("pantalon", "Pantalon", "bas", [["style", [["droit", ""], ["jean", "jean"], ["cargo", "cargo"], ["jogging", "jogging"], ["palazzo", "palazzo"]]], ["coupe", [["normale", ""], ["slim", "slim"], ["large", "large"], ["court", "court"]]], ["taille", [["normale", ""], ["haute", "taille haute"], ["cordon", "à cordon"]]], ["detail", [["aucun", ""], ["genoux", "à genoux renforcés"], ["bandes", "à bandes"], ["revers", "à revers"]]]]),
    T("chaussures", "Chaussures", "pieds", [["style", [["baskets", "baskets"], ["sandales", "sandales"], ["bottes", "bottes"], ["mocassins", "mocassins"], ["ballerines", "ballerines"], ["espadrilles", "espadrilles"], ["tongs", "tongs"]]], ["semelle", [["plate", ""], ["epaisse", "à semelle épaisse"], ["talon", "à talon"]]], ["detail", [["aucun", ""], ["lacets", "à lacets"], ["boucle", "à boucle"], ["pompon", "à pompon"]]]], "Chaussures"),
    T("chapeau", "Chapeau", "tete", [["style", [["paille", "de paille"], ["bob", "bob"], ["casquette", "casquette"], ["beret", "béret"], ["bonnet", "bonnet"], ["capeline", "capeline"], ["melon", "melon"], ["pirate", "de pirate"]]], ["bord", [["normal", ""], ["large", "à large bord"], ["releve", "à bord relevé"]]], ["detail", [["aucun", ""], ["ruban", "à ruban"], ["fleur", "à fleur"], ["plume", "à plume"]]]], "Chapeaux"),
    T("maillot", "Maillot de bain", "bain", [["style", [["une-piece", "une pièce"], ["deux-pieces", "deux pièces"], ["short", "short de bain"], ["combi", "combinaison de surf"], ["robe", "robe de plage"]]], ["coupe", [["classique", ""], ["sport", "sport"], ["retro", "rétro"], ["noue", "noué"]]], ["detail", [["aucun", ""], ["volant", "à volant"], ["anneau", "à anneau"], ["croise", "croisé"]]]], "Maillots de bain"),
  ];
  // les 20 coupes : parcours régulier de toutes les combinaisons des axes
  function designsOf(type) {
    const sizes = type.axes.map((a) => a[1].length), total = sizes.reduce((a, b) => a * b, 1), out = [], used = new Set();
    let step = Math.floor(total / 20) | 1; while (gcd(step, total) !== 1) step++;
    for (let k = 0, i = 0; out.length < 20 && k < total * 2; k++, i = (i + step) % total) {
      if (used.has(i)) continue; used.add(i); let r = i; const f = {}; const labels = [];
      type.axes.forEach(([name, vals], ai) => { const v = vals[r % sizes[ai]]; r = Math.floor(r / sizes[ai]); f[name] = v[0]; if (v[1]) labels.push(v[1]); });
      const short = ["chaussures", "chapeau", "maillot"].includes(type.id) && labels.length; const nm = short ? labels.join(" ") : (type.name + " " + labels.join(" ")).trim(); out.push({ f, name: nm.charAt(0).toUpperCase() + nm.slice(1) });
    }
    return out;
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  TYPES.forEach((t) => { t.designs = designsOf(t); });
  // les 200 modèles d'un type : chaque coupe en 10 coloris
  function catalog(typeId) {
    const t = TYPES.find((x) => x.id === typeId), out = [];
    t.designs.forEach((d, di) => { for (let k = 0; k < 10; k++) { const co = COLORIS[(di * 7 + k * 3) % COLORIS.length]; out.push({ type: typeId, design: di, name: d.name + " · " + co[0], c1: co[1], c2: co[2], c3: "#ffd27a", pattern: co[3], print: (di + k) % 5 === 0 ? PRINTS[1 + (di * 3 + k) % (PRINTS.length - 1)][0] : "aucun" }); } });
    return out;
  }

  // ---------------------------------------------------------------- dessin à plat (vignette 100 × 100)
  const sh = (h, k) => { const n = parseInt(h.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = (v) => Math.max(0, Math.min(255, Math.round(k >= 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
  const OUT = "rgba(60,40,40,.6)";
  function path(c, pts) { c.beginPath(); pts.forEach((p, i) => { if (p.length === 4) c.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (i) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.closePath(); }
  // remplissage avec le motif, ombrage doux, contour
  function cloth(c, pts, it, o = {}) {
    path(c, pts); c.save(); c.clip(); c.fillStyle = o.col || it.c1; c.fillRect(0, 0, 100, 100); if (!o.plain) pattern(c, it);
    const g = c.createLinearGradient(0, 0, 100, 100); g.addColorStop(0, "rgba(255,255,255,.18)"); g.addColorStop(.6, "rgba(255,255,255,0)"); g.addColorStop(1, "rgba(40,20,40,.16)"); c.fillStyle = g; c.fillRect(0, 0, 100, 100); c.restore();
    path(c, pts); c.strokeStyle = OUT; c.lineWidth = 1.4; c.lineJoin = "round"; c.stroke();
  }
  function pattern(c, it) {
    const a = it.c2, p = it.pattern; c.fillStyle = a; c.strokeStyle = a;
    const dots = (r, gap, off = 0) => { for (let y = 0; y < 100; y += gap) for (let x = ((y / gap) % 2) * gap / 2 + off; x < 100; x += gap) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } };
    const stamp = (fn, gap) => { for (let y = 4; y < 100; y += gap) for (let x = ((y / gap | 0) % 2) * gap / 2; x < 100; x += gap) { c.save(); c.translate(x, y); fn(); c.restore(); } };
    if (p === "rayures") for (let y = 0; y < 100; y += 8) c.fillRect(0, y, 100, 3.4);
    if (p === "mariniere") for (let y = 10; y < 100; y += 7) c.fillRect(0, y, 100, 2.4);
    if (p === "pois") dots(2.2, 9);
    if (p === "carreaux") { c.globalAlpha = .55; for (let x = 0; x < 100; x += 10) c.fillRect(x, 0, 3.5, 100); for (let y = 0; y < 100; y += 10) c.fillRect(0, y, 100, 3.5); c.globalAlpha = 1; }
    if (p === "vichy") { c.globalAlpha = .45; for (let x = 0; x < 100; x += 8) c.fillRect(x, 0, 4, 100); for (let y = 0; y < 100; y += 8) c.fillRect(0, y, 100, 4); c.globalAlpha = 1; }
    if (p === "fleurs") stamp(() => { for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(Math.cos(k / 5 * TAU) * 2.2, Math.sin(k / 5 * TAU) * 2.2, 1.7, 0, TAU); c.fill(); } c.fillStyle = "#ffd27a"; c.beginPath(); c.arc(0, 0, 1.2, 0, TAU); c.fill(); c.fillStyle = a; }, 14);
    if (p === "hibiscus") stamp(() => { for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(Math.cos(k / 5 * TAU) * 3, Math.sin(k / 5 * TAU) * 3, 3, 2, k / 5 * TAU, 0, TAU); c.fill(); } c.fillStyle = "#ffd27a"; c.fillRect(-.4, -4, .8, 4); c.fillStyle = a; }, 20);
    if (p === "palmiers") stamp(() => { c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 6); c.quadraticCurveTo(1, 2, 0, -1); c.stroke(); for (let k = -2; k <= 2; k++) { c.beginPath(); c.ellipse(k * 2, -1.5 + Math.abs(k) * .6, 2.6, 1, k * .5, 0, TAU); c.fill(); } }, 18);
    if (p === "etoiles") stamp(() => { c.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 1.2 : 3, an = k / 10 * TAU - Math.PI / 2; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.fill(); }, 13);
    if (p === "coeurs") stamp(() => { c.beginPath(); c.moveTo(0, 2.6); c.bezierCurveTo(-4, -.5, -2, -3.4, 0, -1.4); c.bezierCurveTo(2, -3.4, 4, -.5, 0, 2.6); c.fill(); }, 13);
    if (p === "coquillages") stamp(() => { c.beginPath(); c.moveTo(0, 2.5); c.lineTo(-3, -1); c.quadraticCurveTo(0, -4, 3, -1); c.closePath(); c.fill(); }, 15);
    if (p === "camouflage") { const cs = [a, sh(a, .7), sh(it.c1, .7)]; let s = 7; for (let k = 0; k < 26; k++) { s = (s * 31 + 17) % 97; c.fillStyle = cs[k % 3]; c.beginPath(); c.ellipse((s * 13) % 100, (s * 29) % 100, 6 + s % 5, 3.5 + s % 3, s, 0, TAU); c.fill(); } }
    if (p === "zigzag") { c.lineWidth = 2.2; for (let y = 6; y < 100; y += 10) { c.beginPath(); for (let x = 0; x <= 100; x += 5) c.lineTo(x, y + ((x / 5) % 2 ? 3 : -3)); c.stroke(); } }
    if (p === "degrade") { const g = c.createLinearGradient(0, 15, 0, 95); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, a); c.fillStyle = g; c.fillRect(0, 0, 100, 100); }
    if (p === "tiedye") { for (let r = 60; r > 0; r -= 8) { c.fillStyle = [a, it.c1, "#ffd27a", "#9fd3ef"][(r / 8) % 4]; c.globalAlpha = .55; c.beginPath(); c.arc(50, 50, r, 0, TAU); c.fill(); } c.globalAlpha = 1; }
  }
  function printOn(c, it, x, y, s = 1) {
    if (!it.print || it.print === "aucun") return; const pr = PRINTS.find((p) => p[0] === it.print); if (!pr) return;
    c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fillStyle = "rgba(255,255,255,.85)"; c.fill(); c.strokeStyle = it.c3 || "#ffd27a"; c.lineWidth = 1.2; c.stroke();
    c.fillStyle = it.c3 && it.c3 !== "#ffffff" ? sh(it.c3, .6) : "#3a2a2a"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = pr[1].length > 2 ? "900 5px 'Segoe UI'" : "9px 'Segoe UI Emoji','Apple Color Emoji',sans-serif"; c.fillText(pr[1], 0, .6); c.restore();
  }
  const seam = (c, pts, col = "rgba(60,40,40,.35)", w = .9) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.stroke(); };
  const btns = (c, x, y0, y1, n, col = "#f4ecdc") => { for (let k = 0; k < n; k++) { c.beginPath(); c.arc(x, y0 + k * (y1 - y0) / Math.max(1, n - 1), 1.4, 0, TAU); c.fillStyle = col; c.fill(); c.strokeStyle = OUT; c.lineWidth = .6; c.stroke(); } };

  // un haut générique, réglé par ses options
  function top(c, it, o) {
    const W = o.wide ? 26 : 22, L = o.len === "crop" ? 58 : o.len === "long" ? 86 : o.len === "robe" ? 94 : 76, sl = o.sleeves;
    const slv = sl === "aucune" ? [] : sl === "longues" ? [[50 - W, 26], [50 - W - 16, 70], [50 - W - 8, 73], [50 - W + 1, 40]] : sl === "mancherons" ? [[50 - W, 26], [50 - W - 6, 34], [50 - W, 36]] : [[50 - W, 26], [50 - W - 12, 44], [50 - W - 3, 49], [50 - W + 1, 38]];
    const right = slv.map(([x, y]) => [100 - x, y]).reverse();
    const neckW = o.neck === "bateau" ? 14 : o.neck === "roule" ? 8 : 9, neckD = o.neck === "v" ? 18 : o.neck === "bateau" ? 3 : 7;
    const body = [[50 - neckW, 18], [50 - W + 2, 22], ...slv, [50 - W + 2, L], [50 + W - 2, L], ...right, [50 + W - 2, 22], [50 + neckW, 18], [50, 18 + neckD]];
    if (o.straps) { const s = o.straps === "fines" ? 2 : 6; cloth(c, [[50 - W + 4, 30], [50 - 12, 30], [50 - 12 + s, 14], [50 - 12 + s * 2, 14], [50 - 6, 30], [50 + 6, 30], [50 + 12 - s * 2, 14], [50 + 12 - s, 14], [50 + 12, 30], [50 + W - 4, 30], [50 + W - 2, L], [50 - W + 2, L]], it); return; }
    cloth(c, body, it);
    if (o.neck === "roule") { c.beginPath(); c.roundRect(50 - 10, 10, 20, 10, 3); c.fillStyle = sh(it.c1, .9); c.fill(); c.strokeStyle = OUT; c.stroke(); for (let k = 0; k < 4; k++) seam(c, [[42 + k * 5, 11], [42 + k * 5, 19]]); }
    else seam(c, [[50 - neckW, 18], [50, 18 + neckD], [50 + neckW, 18]], OUT, 1.4);
    if (o.hood) { path(c, [[50 - 12, 18], [50 - 14, 6], [50, 1], [50 + 14, 6], [50 + 12, 18], [50, 22]]); c.fillStyle = sh(it.c1, .88); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke(); if (o.hood === "oreilles") { for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(50 + sx * 11, 3, 4, 5, 0, 0, TAU); c.fillStyle = sh(it.c1, .88); c.fill(); c.stroke(); } } seam(c, [[47, 20], [46, 30]], it.c2, 1.2); seam(c, [[53, 20], [54, 30]], it.c2, 1.2); }
    if (o.collar) { path(c, [[50 - 10, 17], [50 - 13, 27], [50 - 2, 22], [50, 18]]); c.fillStyle = o.collarCol || sh(it.c1, 1.1); c.fill(); c.strokeStyle = OUT; c.stroke(); path(c, [[50 + 10, 17], [50 + 13, 27], [50 + 2, 22], [50, 18]]); c.fill(); c.stroke(); }
    if (o.placket) { seam(c, [[50, 22], [50, L - 2]], OUT, 1); btns(c, 52.5, 26, L - 6, o.placket === "zip" ? 0 : 6); if (o.placket === "zip") seam(c, [[50, 22], [50, L - 2]], "#c8c8d0", 2); }
    if (o.pocket) { c.beginPath(); c.roundRect(o.pocket === "kangourou" ? 36 : 56, o.pocket === "kangourou" ? L - 22 : 32, o.pocket === "kangourou" ? 28 : 10, o.pocket === "kangourou" ? 13 : 10, 2); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); }
    if (o.stripes) { for (const x of [50 - W - 7, 50 + W + 7]) seam(c, [[x - 2, 30], [x - 4, 44]], it.c2, 2.4); seam(c, [[50 - W + 2, L - 4], [50 + W - 2, L - 4]], it.c2, 2.4); }
    if (o.knot) { c.beginPath(); c.ellipse(50, L + 2, 5, 3, 0, 0, TAU); c.fillStyle = sh(it.c1, .85); c.fill(); c.stroke(); }
    if (o.rib) for (let x = 50 - W + 4; x < 50 + W - 2; x += 3.2) seam(c, [[x, 24], [x, L - 2]], "rgba(60,40,40,.15)");
    if (o.cable) for (const x of [38, 50, 62]) for (let y = 26; y < L - 4; y += 7) { seam(c, [[x - 3, y], [x + 3, y + 3.5], [x - 3, y + 7]], "rgba(60,40,40,.25)", 1.2); }
    if (o.fur) { for (let k = 0; k < 8; k++) { c.beginPath(); c.arc(42 + k * 2.3, 18 + Math.sin(k) * 1.4, 3, 0, TAU); c.fillStyle = "#f4ecdc"; c.fill(); } }
    if (o.belt) { c.fillStyle = sh(it.c2, .9); c.fillRect(50 - W + 2, L * .62, W * 2 - 4, 4.5); c.strokeStyle = OUT; c.strokeRect(50 - W + 2, L * .62, W * 2 - 4, 4.5); c.strokeRect(47, L * .62 - .5, 6, 5.5); }
    if (o.badge) { c.beginPath(); c.arc(60, 34, 4.2, 0, TAU); c.fillStyle = it.c3 || "#ffd27a"; c.fill(); c.stroke(); }
    if (o.ruffle) for (let x = 50 - W + 3; x < 50 + W - 2; x += 4) { c.beginPath(); c.arc(x + 2, L, 2.2, 0, Math.PI); c.fillStyle = sh(it.c1, .9); c.fill(); c.stroke(); }
    if (o.bow) { path(c, [[50, 24], [43, 20], [43, 29]]); c.fillStyle = it.c2; c.fill(); c.stroke(); path(c, [[50, 24], [57, 20], [57, 29]]); c.fill(); c.stroke(); }
    printOn(c, it, 50, Math.min(44, L * .55), o.wide ? 1.15 : 1);
  }
  function bottom(c, it, o) {
    const len = o.len, top0 = 14;
    if (o.skirt) {
      const L = len === "mini" ? 52 : len === "longue" ? 94 : 72, flare = o.skirt === "crayon" ? 2 : o.skirt === "plissee" ? 20 : o.skirt === "paree" ? 16 : 14;
      const pts = [[30, top0], [70, top0], [70 + flare, L], ...(o.skirt === "paree" ? [[56, L - 6]] : []), [30 - flare, L]]; cloth(c, pts, it);
      c.fillStyle = sh(it.c1, .8); c.fillRect(30, top0, 40, o.high ? 9 : 5); c.strokeStyle = OUT; c.strokeRect(30, top0, 40, o.high ? 9 : 5);
      if (o.skirt === "plissee") for (let k = 1; k < 9; k++) seam(c, [[30 + k * 4.4, top0 + 6], [30 - flare + k * (40 + flare * 2) / 9, L]]);
      if (o.detail === "boutons") btns(c, 50, top0 + 9, L - 5, 5); if (o.detail === "volants") for (let x = 30 - flare; x < 70 + flare; x += 5) { c.beginPath(); c.arc(x + 2.5, L, 2.6, 0, Math.PI); c.fillStyle = sh(it.c1, .9); c.fill(); c.stroke(); } if (o.detail === "fente") seam(c, [[60, L], [58, L - 14]], OUT, 1.2);
      return;
    }
    const L = len === "court" ? 44 : len === "bermuda" ? 66 : len === "mi" ? 54 : len === "court7" ? 80 : 94, wide = o.wide ? 10 : o.slim ? -3 : 2;
    const pts = [[28, top0], [72, top0], [74 + wide, L], [53, L], [50, top0 + 22], [47, L], [26 - wide, L]]; cloth(c, pts, it);
    c.fillStyle = sh(it.c1, .82); c.fillRect(28, top0, 44, o.high ? 9 : 5.5); c.strokeStyle = OUT; c.strokeRect(28, top0, 44, o.high ? 9 : 5.5);
    if (o.cord) { seam(c, [[47, top0 + 4], [45, top0 + 13]], "#ffffff", 1.2); seam(c, [[53, top0 + 4], [55, top0 + 13]], "#ffffff", 1.2); }
    if (o.jean) { seam(c, [[34, top0 + 8], [38, top0 + 14], [44, top0 + 8]], "#ffd27a", .9); seam(c, [[56, top0 + 8], [62, top0 + 14], [66, top0 + 8]], "#ffd27a", .9); }
    if (o.cargo) for (const x of [24 - wide * .5, 66 + wide * .5]) { c.strokeStyle = OUT; c.strokeRect(x, L * .55, 10, 9); }
    if (o.stripes) { seam(c, [[29, top0 + 6], [27 - wide, L - 1]], it.c2, 2.6); seam(c, [[71, top0 + 6], [73 + wide, L - 1]], it.c2, 2.6); }
    if (o.cuff) { c.fillStyle = sh(it.c1, .85); c.fillRect(26 - wide, L - 5, 21 + wide, 5); c.fillRect(53, L - 5, 21 + wide, 5); }
    if (o.knees) for (const x of [36, 64]) { c.beginPath(); c.ellipse(x - (x < 50 ? wide * .3 : -wide * .3), L * .62, 5, 4, 0, 0, TAU); c.fillStyle = sh(it.c1, .85); c.fill(); }
    if (o.fray) for (let x = 27; x < 73; x += 2) seam(c, [[x, L], [x + .5, L + 2.5]], "#ffffff", .7);
  }
  function shoes(c, it, f) {
    const s = f.style, heel = f.semelle === "talon", thick = f.semelle === "epaisse";
    for (const dx of [0, 34]) {
      c.save(); c.translate(dx, 0);
      if (s === "bottes") cloth(c, [[22, 22], [40, 22], [40, 66], [56, 70], [58, 82], [20, 82]], it);
      else if (s === "tongs") { c.beginPath(); c.ellipse(36, 70, 15, 8, 0, 0, TAU); c.fillStyle = it.c1; c.fill(); c.strokeStyle = OUT; c.stroke(); seam(c, [[28, 68], [36, 64], [44, 68]], it.c2, 3); }
      else if (s === "sandales") { c.beginPath(); c.ellipse(36, 72, 15, 7, 0, 0, TAU); c.fillStyle = sh(it.c1, .8); c.fill(); c.stroke(); for (const y of [66, 72]) seam(c, [[24, y], [48, y - 2]], it.c2, 3.4); }
      else if (s === "ballerines") { cloth(c, [[22, 76], [24, 62], [44, 62], [52, 70], [52, 78], [22, 80]], it); if (f.detail === "boucle" || f.detail === "pompon") { c.beginPath(); c.arc(40, 64, 3, 0, TAU); c.fillStyle = it.c2; c.fill(); c.stroke(); } }
      else { cloth(c, [[20, 78], [22, 56], [36, 54], [48, 64], [56, 70], [56, 80], [20, 82]], it); if (s === "baskets" || f.detail === "lacets") for (let k = 0; k < 4; k++) seam(c, [[30 + k * 3, 58 + k * 1.6], [36 + k * 3, 60 + k * 1.6]], "#ffffff", 1.4); if (s === "espadrilles") for (let x = 22; x < 56; x += 3) seam(c, [[x, 80], [x + 1, 84]], "#c8a070", 1.4); }
      c.fillStyle = thick ? "#ffffff" : sh(it.c2, .8); c.fillRect(19, 80, 39, thick ? 6 : 3); c.strokeStyle = OUT; c.strokeRect(19, 80, 39, thick ? 6 : 3);
      if (heel) { c.fillStyle = sh(it.c1, .7); c.fillRect(20, 80, 6, 9); c.strokeRect(20, 80, 6, 9); }
      c.restore();
    }
  }
  function hat(c, it, f) {
    const s = f.style, wide = f.bord === "large" ? 1.35 : 1;
    if (s === "casquette") { cloth(c, [[26, 62], [28, 36], [50, 26], [72, 36], [74, 62]], it); c.beginPath(); c.ellipse(36, 63, 26, 6, 0, 0, TAU); c.fillStyle = it.c2; c.fill(); c.strokeStyle = OUT; c.stroke(); printOn(c, it, 50, 46, .9); }
    else if (s === "bonnet") { cloth(c, [[26, 70], [28, 40], [50, 26], [72, 40], [74, 70]], it); c.fillStyle = it.c2; c.fillRect(25, 62, 50, 10); c.strokeStyle = OUT; c.strokeRect(25, 62, 50, 10); c.beginPath(); c.arc(50, 22, 7, 0, TAU); c.fillStyle = "#ffffff"; c.fill(); c.stroke(); }
    else if (s === "beret") { c.beginPath(); c.ellipse(52, 52, 30, 14, -.15, 0, TAU); path(c, [[22, 54], [30, 40], [70, 36], [82, 50], [70, 62], [30, 62]]); cloth(c, [[22, 56], [34, 38], [70, 36], [82, 50], [72, 62], [30, 64]], it); seam(c, [[52, 37], [54, 31]], OUT, 2.4); }
    else if (s === "pirate") { cloth(c, [[14, 62], [28, 38], [50, 46], [72, 38], [86, 62], [50, 70]], it); printOn(c, { ...it, print: "etoile" }, 50, 54, .8); }
    else if (s === "melon") { c.beginPath(); c.ellipse(50, 66, 34, 8, 0, 0, TAU); c.fillStyle = sh(it.c1, .85); c.fill(); c.strokeStyle = OUT; c.stroke(); cloth(c, [[28, 66], [30, 40], [50, 30], [70, 40], [72, 66]], it); }
    else { // paille, bob, capeline
      const rw = (s === "capeline" ? 46 : s === "bob" ? 34 : 40) * Math.min(wide, s === "capeline" ? 1 : wide), crownH = s === "bob" ? 22 : 24;
      c.beginPath(); c.ellipse(50, 64, rw, rw * .26, 0, 0, TAU); c.fillStyle = s === "paille" ? "#e8c878" : sh(it.c1, .9); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.4; c.stroke();
      if (s === "paille") for (let k = 0; k < 10; k++) { c.beginPath(); c.ellipse(50, 64, rw * (1 - k / 12), rw * .26 * (1 - k / 12), 0, 0, TAU); c.strokeStyle = "rgba(160,120,60,.25)"; c.lineWidth = .7; c.stroke(); }
      cloth(c, [[30, 64], [32, 64 - crownH], [50, 64 - crownH - 6], [68, 64 - crownH], [70, 64]], s === "paille" ? { ...it, c1: "#e8c878", pattern: "uni" } : it);
    }
    if (f.detail === "ruban") { c.fillStyle = it.c2; c.fillRect(30, 56, 40, 5); c.strokeStyle = OUT; c.strokeRect(30, 56, 40, 5); }
    if (f.detail === "fleur") { for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(66 + Math.cos(k / 5 * TAU) * 3.4, 54 + Math.sin(k / 5 * TAU) * 3.4, 2.8, 0, TAU); c.fillStyle = it.c2; c.fill(); } c.beginPath(); c.arc(66, 54, 2, 0, TAU); c.fillStyle = "#ffd27a"; c.fill(); }
    if (f.detail === "plume") { seam(c, [[64, 58], [80, 22]], sh(it.c2, .7), 1); c.beginPath(); c.ellipse(73, 38, 3.6, 14, .4, 0, TAU); c.fillStyle = it.c2; c.fill(); c.strokeStyle = OUT; c.stroke(); }
  }
  function swim(c, it, f) {
    const s = f.style;
    if (s === "short") return bottom(c, it, { len: "mi", cord: true });
    if (s === "robe") return top(c, it, { len: "robe", sleeves: "aucune", straps: "fines" });
    if (s === "combi") { top(c, it, { len: "long", sleeves: "longues", neck: "roule", placket: "zip", stripes: true }); return; }
    if (s === "deux-pieces") { cloth(c, [[30, 22], [48, 30], [50, 40], [30, 42]], it); cloth(c, [[70, 22], [52, 30], [50, 40], [70, 42]], it); seam(c, [[30, 22], [36, 10]], it.c2, 1.6); seam(c, [[70, 22], [64, 10]], it.c2, 1.6); cloth(c, [[30, 60], [70, 60], [62, 74], [50, 78], [38, 74]], it); if (f.detail === "volant") for (let x = 30; x < 70; x += 5) { c.beginPath(); c.arc(x + 2.5, 42, 2.4, 0, Math.PI); c.fillStyle = sh(it.c1, .9); c.fill(); } return; }
    cloth(c, [[34, 12], [40, 12], [50, 28], [60, 12], [66, 12], [70, 40], [66, 64], [60, 80], [50, 84], [40, 80], [34, 64], [30, 40]], it); if (f.detail === "anneau") { c.beginPath(); c.arc(50, 36, 3, 0, TAU); c.strokeStyle = "#e8c060"; c.lineWidth = 1.6; c.stroke(); }
  }
  // le dessin d'un vêtement, selon son type et sa coupe
  function drawFlat(c, it, size = 100) {
    const t = TYPES.find((x) => x.id === it.type), f = t.designs[it.design || 0].f;
    c.save(); c.scale(size / 100, size / 100); c.lineWidth = 1.4;
    const id = it.type;
    if (id === "tshirt") top(c, it, { neck: f.col, sleeves: f.manches === "longues" ? "longues" : f.manches === "mancherons" ? "mancherons" : "courtes", wide: f.coupe === "oversize", len: f.coupe === "crop" ? "crop" : "", knot: f.coupe === "noue", pocket: f.detail === "poche", stripes: f.detail === "bandes", ruffle: false });
    if (id === "debardeur") top(c, it, { straps: f.bretelles === "fines" || f.col === "licou" ? "fines" : "larges", len: f.coupe === "crop" ? "crop" : "", rib: f.coupe === "cotele", ruffle: f.detail === "volant" });
    if (id === "chemise") top(c, it, { collar: true, collarCol: f.col === "claudine" ? "#ffffff" : null, placket: "boutons", sleeves: f.manches === "longues" || f.manches === "bouffantes" ? "longues" : "courtes", wide: f.coupe === "ample", knot: f.coupe === "nouee", len: f.coupe === "tunique" ? "long" : "", pocket: f.detail === "poches", bow: f.detail === "jabot" });
    if (id === "pull") top(c, it, { neck: f.col === "roule" ? "roule" : f.col, sleeves: "longues", wide: f.coupe === "oversize", len: f.coupe === "court" ? "crop" : f.coupe === "long" ? "long" : "", rib: f.maille === "cotes", cable: f.maille === "torsades", placket: f.col === "camionneur" || f.detail === "boutons" ? "boutons" : null, stripes: f.maille === "jacquard" });
    if (id === "sweat") top(c, it, { hood: f.capuche === "non" ? null : f.capuche, sleeves: "longues", wide: f.coupe === "oversize", len: f.coupe === "court" ? "crop" : f.coupe === "robe" ? "long" : "", placket: f.fermeture !== "aucune" ? "zip" : null, pocket: f.detail === "kangourou" ? "kangourou" : null, stripes: f.detail === "bandes" });
    if (id === "blouson") top(c, it, { sleeves: "longues", wide: true, len: f.longueur === "court" ? "crop" : f.longueur === "long" ? "long" : "", collar: f.col === "classique" || f.style === "biker", fur: f.col === "fourrure" || f.style === "aviateur", hood: f.col === "capuche" ? "oui" : null, neck: f.col === "montant" ? "roule" : "rond", placket: "zip", badge: f.detail === "ecusson" || f.detail === "patchs", stripes: f.detail === "bandes" || f.style === "teddy", rib: f.style === "coupevent" });
    if (id === "veste") top(c, it, { sleeves: "longues", collar: f.style !== "kimono", neck: "v", placket: f.fermeture === "ouverte" ? null : "boutons", belt: f.fermeture === "ceinture" || f.style === "kimono", pocket: f.detail === "poches" || f.style === "safari", stripes: f.detail === "galons" || f.style === "matelot", len: f.style === "boleros" ? "crop" : "" });
    if (id === "manteau") top(c, it, { sleeves: "longues", wide: true, len: f.longueur === "cheville" ? "robe" : f.longueur === "mi-cuisse" ? "" : "long", collar: f.col === "classique" || f.col === "chale", fur: f.col === "fourrure" || f.style === "doudoune", hood: f.col === "capuche" || f.style === "duffle" ? "oui" : null, placket: f.style === "cape" ? null : "boutons", belt: f.detail === "ceinture" || f.style === "trench", rib: f.style === "doudoune", pocket: f.detail === "poches" });
    if (id === "robe") top(c, it, { len: "robe", wide: f.forme === "evasee" || f.forme === "longue", sleeves: f.manches === "sans" ? "aucune" : f.manches === "longues" ? "longues" : "courtes", neck: f.col === "v" ? "v" : f.col === "carre" ? "bateau" : "rond", collar: f.col === "claudine", collarCol: "#ffffff", belt: f.detail === "ceinture", ruffle: f.detail === "volants", bow: f.detail === "noeud", straps: f.forme === "bustier" ? "fines" : null });
    if (id === "jupe") bottom(c, it, { skirt: f.forme, len: f.longueur, high: f.taille === "haute", detail: f.detail });
    if (id === "short") bottom(c, it, { len: f.longueur === "court" ? "court" : f.longueur === "bermuda" ? "bermuda" : "mi", high: f.taille === "haute", cord: f.taille === "cordon" || f.style === "sport" || f.style === "surf", jean: f.style === "jean", cargo: f.style === "cargo", stripes: f.detail === "bandes" || f.style === "sport", cuff: f.detail === "revers", fray: f.detail === "effiloche" });
    if (id === "pantalon") bottom(c, it, { len: f.coupe === "court" ? "court7" : "long", wide: f.coupe === "large" || f.style === "palazzo", slim: f.coupe === "slim", high: f.taille === "haute", cord: f.taille === "cordon" || f.style === "jogging", jean: f.style === "jean", cargo: f.style === "cargo", stripes: f.detail === "bandes" || f.style === "jogging", cuff: f.detail === "revers", knees: f.detail === "genoux" });
    if (id === "chaussures") shoes(c, it, f);
    if (id === "chapeau") hat(c, it, f);
    if (id === "maillot") swim(c, it, f);
    c.restore();
  }
  function swatch(c, it) { c.fillStyle = it.c1; c.fillRect(0, 0, 100, 100); pattern(c, it); }
  return { swatch, TYPES, PALETTE, PATTERNS, PRINTS, COLORIS, catalog, drawFlat, count: () => TYPES.length * 200 };
})();
if (typeof module !== "undefined") module.exports = CLOTHES;
