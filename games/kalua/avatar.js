/* Les Échoués de Kalua — personnages : options de personnalisation et dessin (style doux).
 * Repère local : pieds vers y = 14, tête centrée vers (0, -1.5), rayon ~5. Le code appelant met à l'échelle. */
"use strict";

const Avatar = (() => {
  // ------------------------------------------------------------ palettes
  const SKIN = ["#ffeee4", "#ffe2cc", "#ffd3b0", "#f2c19a", "#e2a882", "#c98d63", "#a8714f", "#8a5a3c", "#6e4632", "#4f3124", "#bfe3ff", "#c9f2c0", "#e9d3ff", "#d6d3e3"];
  const HAIR = ["#2b2230", "#3d2c24", "#6b3f22", "#8a5a3c", "#b07a3a", "#e08a5a", "#c0392b", "#f3c768", "#fff1b8", "#f4f4f4", "#9aa0b0", "#ff9fc0", "#c9a3e8", "#9ad1e8", "#9be0a8", "#e2627c"];
  const CLOTH = ["#ffffff", "#f4f1ea", "#2b2230", "#6b5050", "#8fb8ff", "#5b8fd9", "#9fd3ef", "#9be0a8", "#5fae6b", "#ffd27a", "#ffb36b", "#ff9fc0", "#e2627c", "#c0394f", "#c9b3ff", "#9b6fd6", "#c98d63", "#d6d3e3"];
  const EYES = ["#4a3a3a", "#2b2230", "#5b8fd9", "#9fd3ef", "#5fae6b", "#9be0a8", "#b07a3a", "#9b6fd6", "#e05a6a", "#ffd27a", "#d6d3e3", "#ff9fc0"];
  const MAKEUP = ["#e2627c", "#ff9fc0", "#c0394f", "#7a3a8a", "#2b2230", "#ffb36b", "#c9a3e8", "#9fd3ef", "#9be0a8", "#ffd27a"];
  const FANCY = ["#2b2230", "#f4f4f4", "#c0394f", "#ff9fc0", "#c9a3e8", "#9fd3ef", "#9be0a8", "#ffd27a", "#ffb36b", "#8a5a3c"];

  const DEFAULT = {
    skin: "#ffd3b0", build: "normal", height: 0.5,
    face: "rond", eyes: "grands", eyeColor: "#4a3a3a", brows: "fins", nose: "point", mouth: "sourire",
    freckles: 0, mole: "aucun", scar: "aucune",
    hair: "court", hairColor: "#8a5a3c", streak: "", tips: "", beard: "aucune", mustache: "aucune",
    top: "tshirt", topColor: "#8fb8ff", topColor2: "#ffffff", pattern: "uni",
    bottom: "short", bottomColor: "#c98d63", shoes: "sandales", shoesColor: "#8a5a3c",
    hat: "aucun", hatColor: "#ffd27a", glasses: "aucunes", earrings: "aucunes", necklace: "aucun", earFlower: "aucune",
    lips: "", eyeshadow: "", eyeliner: "aucun", lashes: "aucun", blush: "#ff9c9c", glitter: "aucunes",
    paint: "aucune", paintColor: "#c9a3e8", ears: "aucunes", horns: "aucunes", halo: "non", wings: "aucunes", tail: "aucune",
    fancyColor: "", aura: "",
  };

  // ------------------------------------------------------------ options du créateur
  // type : choice (vignettes), color (pastilles + roue), slider. zoom : head | body
  const C = (key, label, values, zoom = "head") => ({ key, label, type: "choice", values, zoom });
  const K = (key, label, palette, none) => ({ key, label, type: "color", palette, none });
  const TABS = [
    { id: "corps", label: "Corps", items: [
      K("skin", "Peau", SKIN),
      C("build", "Carrure", [["fin", "Fine"], ["normal", "Normale"], ["costaud", "Costaud"]], "body"),
      { key: "height", label: "Taille", type: "slider" },
    ] },
    { id: "visage", label: "Visage", items: [
      C("face", "Forme du visage", [["rond", "Rond"], ["ovale", "Ovale"], ["carre", "Carré"], ["coeur", "Cœur"], ["large", "Large"], ["long", "Long"]]),
      C("eyes", "Yeux", [["rond", "Ronds"], ["grands", "Grands"], ["brillants", "Brillants"], ["amande", "Amande"], ["miclos", "Mi-clos"], ["joyeux", "Joyeux"],
        ["endormis", "Endormis"], ["chat", "Chat"], ["etoiles", "Étoiles"], ["coeurs", "Cœurs"], ["croix", "Croix"], ["spirale", "Spirale"]]),
      K("eyeColor", "Couleur des yeux", EYES),
      C("brows", "Sourcils", [["aucun", "Aucun"], ["fins", "Fins"], ["epais", "Épais"], ["arques", "Arqués"], ["fronces", "Froncés"], ["tristes", "Tristes"]]),
      C("nose", "Nez", [["aucun", "Aucun"], ["point", "Point"], ["bouton", "Bouton"], ["triangle", "Pointu"], ["retrousse", "Retroussé"]]),
      C("mouth", "Bouche", [["sourire", "Sourire"], ["grand", "Grand sourire"], ["rieur", "Rieur"], ["o", "Oh !"], ["chat", "Chat"], ["langue", "Langue"],
        ["neutre", "Neutre"], ["crocs", "Crocs"], ["bisou", "Bisou"], ["boude", "Boudeur"]]),
      { key: "freckles", label: "Taches de rousseur", type: "slider" },
      C("mole", "Grain de beauté", [["aucun", "Aucun"], ["joue", "Joue"], ["menton", "Menton"], ["oeil", "Sous l'œil"], ["levre", "Lèvre"]]),
      C("scar", "Cicatrice", [["aucune", "Aucune"], ["joue", "Joue"], ["oeil", "Œil"], ["nez", "Nez"], ["pansement", "Pansement"]]),
    ] },
    { id: "cheveux", label: "Cheveux", items: [
      C("hair", "Coiffure", [["chauve", "Chauve"], ["rase", "Rasé"], ["court", "Court"], ["petard", "En pétard"], ["meche", "Mèche"], ["frange", "Frange"],
        ["carre", "Carré"], ["mi", "Mi-long"], ["long", "Long"], ["treslong", "Très long"], ["ondule", "Ondulé"], ["boucle", "Bouclé"], ["afro", "Afro"],
        ["couettes", "Couettes"], ["nattes", "Nattes"], ["queue", "Queue de cheval"], ["chignon", "Chignon"], ["macarons", "Macarons"],
        ["iroquoise", "Iroquoise"], ["dreads", "Dreadlocks"]]),
      K("hairColor", "Couleur", HAIR),
      K("streak", "Mèche colorée", HAIR, true),
      K("tips", "Pointes en dégradé", HAIR, true),
      C("beard", "Barbe", [["aucune", "Aucune"], ["troisjours", "3 jours"], ["courte", "Courte"], ["longue", "Longue"], ["bouc", "Bouc"]]),
      C("mustache", "Moustache", [["aucune", "Aucune"], ["fine", "Fine"], ["epaisse", "Épaisse"], ["guidon", "Guidon"]]),
    ] },
    { id: "tenue", label: "Tenue", items: [
      C("top", "Haut", [["tshirt", "T-shirt"], ["debardeur", "Débardeur"], ["chemise", "Chemise"], ["pull", "Pull"], ["robe", "Robe"],
        ["salopette", "Salopette"], ["kimono", "Kimono"], ["veste", "Veste"], ["feuilles", "Feuillage"]], "body"),
      K("topColor", "Couleur principale", CLOTH),
      K("topColor2", "Deuxième couleur", CLOTH),
      C("pattern", "Motif", [["uni", "Uni"], ["rayures", "Rayures"], ["pois", "Pois"], ["fleurs", "Fleurs"], ["carreaux", "Carreaux"], ["etoiles", "Étoiles"], ["coeurs", "Cœurs"]], "body"),
      C("bottom", "Bas", [["short", "Short"], ["pantalon", "Pantalon"], ["jupe", "Jupe"], ["legging", "Legging"], ["pagne", "Pagne"]], "body"),
      K("bottomColor", "Couleur du bas", CLOTH),
      C("shoes", "Chaussures", [["pieds", "Pieds nus"], ["sandales", "Sandales"], ["tongs", "Tongs"], ["baskets", "Baskets"], ["bottes", "Bottes"]], "body"),
      K("shoesColor", "Couleur des chaussures", CLOTH),
    ] },
    { id: "accessoires", label: "Accessoires", items: [
      C("hat", "Chapeau", [["aucun", "Aucun"], ["paille", "Paille"], ["bob", "Bob"], ["casquette", "Casquette"], ["bandana", "Bandana"],
        ["fleurs", "Couronne de fleurs"], ["bonnet", "Bonnet"], ["pirate", "Pirate"], ["couronne", "Couronne"], ["noeud", "Nœud"]]),
      K("hatColor", "Couleur du chapeau", CLOTH),
      C("glasses", "Lunettes", [["aucunes", "Aucunes"], ["rondes", "Rondes"], ["carrees", "Carrées"], ["soleil", "Soleil"], ["coeur", "Cœur"],
        ["etoiles", "Étoiles"], ["monocle", "Monocle"], ["cacheoeil", "Cache-œil"]]),
      C("earrings", "Boucles d'oreilles", [["aucunes", "Aucunes"], ["perles", "Perles"], ["anneaux", "Anneaux"], ["etoiles", "Étoiles"], ["coquillages", "Coquillages"]]),
      C("necklace", "Collier", [["aucun", "Aucun"], ["coquillages", "Coquillages"], ["perles", "Perles"], ["dent", "Dent de requin"], ["coeur", "Cœur"], ["fleurs", "Fleurs"]], "body"),
      C("earFlower", "Fleur à l'oreille", [["aucune", "Aucune"], ["hibiscus", "Hibiscus"], ["marguerite", "Marguerite"]]),
    ] },
    { id: "maquillage", label: "Maquillage", items: [
      K("lips", "Rouge à lèvres", MAKEUP, true),
      K("eyeshadow", "Fard à paupières", MAKEUP, true),
      C("eyeliner", "Eyeliner", [["aucun", "Aucun"], ["fin", "Fin"], ["chat", "Œil de chat"]]),
      C("lashes", "Cils", [["aucun", "Naturels"], ["longs", "Longs"]]),
      K("blush", "Blush", ["#ff9c9c", ...MAKEUP], true),
      C("glitter", "Paillettes", [["aucunes", "Aucunes"], ["paillettes", "Paillettes"], ["etoiles", "Étoiles"], ["coeurs", "Cœurs"]]),
    ] },
    { id: "fancy", label: "✨ Fancy", items: [
      C("paint", "Peinture de visage", [["aucune", "Aucune"], ["squelette", "Squelette"], ["catrina", "Catrina"], ["tribale", "Tribale"], ["clown", "Clown"],
        ["coeurs", "Cœurs"], ["etoiles", "Étoile"], ["tigre", "Tigre"], ["papillon", "Papillon"]]),
      K("paintColor", "Couleur de la peinture", FANCY),
      C("ears", "Oreilles", [["aucunes", "Aucunes"], ["chat", "Chat"], ["lapin", "Lapin"], ["renard", "Renard"], ["ours", "Ours"], ["souris", "Souris"], ["elfe", "Elfe"]]),
      C("horns", "Cornes", [["aucunes", "Aucunes"], ["demon", "Démon"], ["licorne", "Licorne"], ["cerf", "Cerf"], ["belier", "Bélier"]]),
      C("wings", "Ailes", [["aucunes", "Aucunes"], ["ange", "Ange"], ["demon", "Démon"], ["papillon", "Papillon"], ["fee", "Fée"]], "body"),
      C("tail", "Queue", [["aucune", "Aucune"], ["chat", "Chat"], ["renard", "Renard"], ["diable", "Diable"], ["lapin", "Lapin"]], "body"),
      K("fancyColor", "Couleur oreilles / ailes / queue", FANCY, "auto"),
      C("halo", "Auréole", [["non", "Non"], ["oui", "Oui"]]),
      K("aura", "Aura", ["#c9a3e8", "#ffd27a", "#9be0a8", "#ff9fc0", "#9fd3ef", "#ffffff", "arcenciel"], true),
    ] },
  ];

  function normalize(a) {
    const out = { ...DEFAULT };
    if (a && typeof a === "object") for (const k of Object.keys(DEFAULT)) if (a[k] !== undefined && a[k] !== null) out[k] = a[k];
    return out;
  }

  function random() {
    const a = { ...DEFAULT };
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const chance = (p) => Math.random() < p;
    for (const tab of TABS) for (const it of tab.items) {
      if (it.type === "choice") a[it.key] = pick(it.values)[0];
      else if (it.type === "color") a[it.key] = it.none && chance(.6) ? "" : pick(it.palette);
      else a[it.key] = Math.random();
    }
    // Un peu de mesure pour que le hasard reste joli
    a.skin = pick(SKIN.slice(0, 10).concat(chance(.1) ? SKIN.slice(10) : []));
    a.freckles = chance(.3) ? Math.random() : 0;
    for (const k of ["paint", "horns", "wings", "tail", "ears"]) if (chance(.9)) a[k] = DEFAULT[k];
    if (chance(.85)) a.halo = "non";
    if (chance(.75)) a.aura = "";
    if (chance(.5)) a.hat = "aucun";
    if (chance(.5)) a.glitter = "aucunes";
    if (chance(.4)) { a.lips = ""; a.eyeshadow = ""; a.eyeliner = "aucun"; }
    if (chance(.6)) { a.beard = "aucune"; a.mustache = "aucune"; }
    if (chance(.5)) a.scar = "aucune";
    if (chance(.6)) a.mole = "aucun";
    if (chance(.75)) a.glasses = "aucunes";
    if (chance(.5)) a.eyes = pick(["rond", "grands", "brillants", "amande"]);
    if (chance(.5)) a.mouth = pick(["sourire", "grand", "rieur"]);
    return a;
  }

  // ------------------------------------------------------------ outils de dessin
  const TAU = Math.PI * 2;
  const circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); };
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
  const line = (c, pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
  const heart = (c, x, y, s) => { c.beginPath(); c.moveTo(x, y + s * .9); c.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .7, y - s * 1.4, x, y - s * .4); c.bezierCurveTo(x + s * .7, y - s * 1.4, x + s * 1.6, y - s * .2, x, y + s * .9); c.fill(); };
  const star = (c, x, y, r) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * .45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fill(); };
  const flower = (c, x, y, r, col, mid = "#ffe08a") => { c.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * TAU / 5; circle(c, x + Math.cos(a) * r, y + Math.sin(a) * r, r * .75); } c.fillStyle = mid; circle(c, x, y, r * .55); };
  const shade = (hex, f) => { // f < 0 assombrit, f > 0 éclaircit
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  const hairFill = (c, a) => {
    if (!a.tips) return a.hairColor;
    const g = c.createLinearGradient(0, -8, 0, 11);
    g.addColorStop(0, a.hairColor); g.addColorStop(.45, a.hairColor); g.addColorStop(1, a.tips);
    return g;
  };

  // ------------------------------------------------------------ tête
  function headPath(c, a) {
    c.beginPath();
    switch (a.face) {
      case "ovale": c.ellipse(0, -1.2, 4.6, 5.6, 0, 0, TAU); break;
      case "carre": c.roundRect(-5, -6.6, 10, 10.4, 3); break;
      case "large": c.ellipse(0, -1.4, 5.8, 4.9, 0, 0, TAU); break;
      case "long": c.ellipse(0, -1, 4.3, 6.1, 0, 0, TAU); break;
      case "coeur": c.moveTo(0, 4.3); c.bezierCurveTo(-3.2, 3, -5.6, 0, -5.3, -2.6); c.bezierCurveTo(-5, -6.8, 5, -6.8, 5.3, -2.6); c.bezierCurveTo(5.6, 0, 3.2, 3, 0, 4.3); break;
      default: c.arc(0, -1.5, 5.2, 0, TAU);
    }
  }

  function hairBack(c, a, back) {
    c.fillStyle = hairFill(c, a);
    switch (a.hair) {
      case "long": rr(c, -5.6, -3, 11.2, 10, 4); break;
      case "treslong": rr(c, -5.8, -3, 11.6, 14, 4.5); break;
      case "ondule": c.beginPath(); c.moveTo(-5.8, -3); for (let y = -3; y <= 9; y += 2) c.quadraticCurveTo(-7.2, y + 1, -5.6, y + 2); c.lineTo(5.6, 9);
        for (let y = 9; y >= -3; y -= 2) c.quadraticCurveTo(7.2, y - 1, 5.8, y - 2); c.closePath(); c.fill(); break;
      case "carre": rr(c, -6, -4, 12, 7.6, 3); break;
      case "afro": circle(c, 0, -3.2, 8.2); break;
      case "boucle": for (const [x, y] of [[-5.4, -1], [5.4, -1], [-5.6, 2], [5.6, 2], [-4.6, 4.4], [4.6, 4.4]]) circle(c, x, y, 2); break;
      case "couettes": ell(c, -6.4, 1.6, 2, 3.8, .3); ell(c, 6.4, 1.6, 2, 3.8, -.3); rr(c, -6.6, -2.4, 1.6, 1.4, .6); rr(c, 5, -2.4, 1.6, 1.4, .6); break;
      case "queue": if (back) { rr(c, -1.6, -2, 3.2, 10, 1.6); } else ell(c, 6, 1, 1.8, 4.2, -.4); break;
      case "dreads": for (let i = -5; i <= 5; i += 1.25) rr(c, i - .5, -2, 1.1, 10.5 - Math.abs(i) * .4, .55); break;
      case "nattes": for (const s of [-1, 1]) for (let k = 0; k < 5; k++) circle(c, s * (5.4 - k * .15), 1 + k * 1.7, 1.15 - k * .06); break;
      case "chignon": circle(c, 0, -7.8, 2.9); break;
      case "macarons": circle(c, -4.4, -6.6, 2.5); circle(c, 4.4, -6.6, 2.5); break;
    }
  }

  function hairFront(c, a) {
    const st = a.hair;
    if (st === "chauve") return;
    c.fillStyle = hairFill(c, a);
    if (st === "rase") { c.globalAlpha = .5; c.beginPath(); c.arc(0, -2.2, 5.3, Math.PI * 1.04, Math.PI * 1.96); c.fill(); c.globalAlpha = 1; return; }
    if (st === "iroquoise") {
      c.globalAlpha = .35; c.beginPath(); c.arc(0, -2.2, 5.3, Math.PI * 1.04, Math.PI * 1.96); c.fill(); c.globalAlpha = 1;
      c.beginPath(); c.moveTo(-1.6, -5.5); for (let i = 0; i < 4; i++) { c.lineTo(-1.2 + i * .9, -10.5 + Math.abs(i - 1.5) * .8); c.lineTo(-.7 + i * .9, -6.5); } c.lineTo(1.6, -5.5); c.closePath(); c.fill(); return;
    }
    if (st === "afro") { for (let i = 0; i < 9; i++) { const ang = Math.PI * (1.05 + i * .1); circle(c, Math.cos(ang) * 5.3, -2.4 + Math.sin(ang) * 4.8, 2); } return; }
    c.beginPath(); c.arc(0, -2.6, 5.5, Math.PI * 1.02, Math.PI * 1.98); c.fill();
    switch (st) {
      case "frange": rr(c, -4.8, -6.4, 9.6, 3.6, 1.2); break;
      case "carre": rr(c, -4.8, -6.4, 9.6, 3.2, 1.2); rr(c, -6, -4, 1.8, 7.4, .9); rr(c, 4.2, -4, 1.8, 7.4, .9); break;
      case "meche": ell(c, -1.2, -5, 4.6, 2.2, -.35); ell(c, -3.6, -2.6, 1.8, 3, .5); break;
      case "petard": ell(c, -2, -5.4, 3.6, 1.9, -.3); ell(c, 2.4, -5.2, 3.2, 1.8, .4);
        c.beginPath(); for (let i = 0; i < 6; i++) { const x = -4.5 + i * 1.8; c.moveTo(x - 1, -6); c.lineTo(x, -9.4 + (i % 2) * 1.2); c.lineTo(x + 1, -6); } c.fill(); break;
      case "boucle": for (let i = 0; i < 6; i++) circle(c, -4 + i * 1.6, -6 + (i % 2) * .6, 1.5); break;
      case "dreads": for (let i = 0; i < 5; i++) rr(c, -3.6 + i * 1.6, -6.6, 1.2, 3.6, .6); break;
      default: ell(c, -2, -5.4, 3.6, 1.9, -.3); ell(c, 2.4, -5.2, 3.2, 1.8, .4);
    }
    if (["mi", "long", "treslong", "ondule", "nattes", "couettes"].includes(st)) { ell(c, -4.9, -.5, 1.5, 3.6); ell(c, 4.9, -.5, 1.5, 3.6); }
    if (a.streak) { c.fillStyle = a.streak; ell(c, 2.4, -5.2, 2.1, 1.1, .4); }
  }

  function eyes(c, a, dx) {
    const col = a.eyeColor, X = [-1.9 + dx, 1.9 + dx], Y = -.9;
    if (a.eyeshadow) { c.fillStyle = a.eyeshadow; c.globalAlpha = .45; X.forEach((x) => ell(c, x, Y - 1, 1.5, .9)); c.globalAlpha = 1; }
    const hl = (x, y, r) => { c.fillStyle = "#fff"; circle(c, x, y, r); };
    X.forEach((x, i) => {
      const s = i ? 1 : -1;
      switch (a.eyes) {
        case "rond": c.fillStyle = col; ell(c, x, Y, .72, .86); hl(x + .2, Y - .3, .26); break;
        case "brillants": c.fillStyle = "#2b2230"; ell(c, x, Y, 1.15, 1.4); c.fillStyle = col; ell(c, x, Y + .25, .85, 1); c.fillStyle = shade(col, -.4); circle(c, x, Y + .3, .4); hl(x + .35, Y - .45, .45); hl(x - .35, Y + .55, .2); break;
        case "amande": c.fillStyle = "#fff"; ell(c, x, Y, 1.2, .65); c.fillStyle = col; circle(c, x + .1, Y, .58); c.fillStyle = "#2b2230"; circle(c, x + .1, Y, .26); line(c, [[x - 1.3, Y - .2], [x, Y - .75], [x + 1.3, Y - .3]], .3, "#2b2230"); break;
        case "miclos": c.fillStyle = col; ell(c, x, Y + .2, .8, .6); c.fillStyle = a.skin; c.fillRect(x - 1, Y - .9, 2, .9); line(c, [[x - .95, Y], [x + .95, Y]], .35, "#2b2230"); break;
        case "joyeux": line(c, [[x - .9, Y + .3], [x, Y - .6], [x + .9, Y + .3]], .4, "#2b2230"); break;
        case "endormis": line(c, [[x - .9, Y], [x, Y + .45], [x + .9, Y]], .38, "#2b2230"); break;
        case "chat": c.fillStyle = col; ell(c, x, Y, 1, 1.1); c.fillStyle = "#2b2230"; ell(c, x, Y, .22, .85); hl(x + .4, Y - .4, .22); break;
        case "etoiles": c.fillStyle = col; star(c, x, Y, 1.15); hl(x + .25, Y - .3, .2); break;
        case "coeurs": c.fillStyle = col === "#4a3a3a" ? "#e2627c" : col; heart(c, x, Y, .9); hl(x + .3, Y - .3, .2); break;
        case "croix": line(c, [[x - .7, Y - .7], [x + .7, Y + .7]], .38, "#2b2230"); line(c, [[x + .7, Y - .7], [x - .7, Y + .7]], .38, "#2b2230"); break;
        case "spirale": { c.strokeStyle = "#2b2230"; c.lineWidth = .28; c.beginPath(); for (let t = 0; t < 12; t += .3) { const r = t * .085; c.lineTo(x + Math.cos(t * s) * r, Y + Math.sin(t * s) * r); } c.stroke(); break; }
        default: c.fillStyle = col; ell(c, x, Y + .1, 1, 1.25); hl(x + .3, Y - .4, .4); hl(x - .3, Y + .5, .2);
      }
      if (a.lashes === "longs" && !["croix", "spirale"].includes(a.eyes)) line(c, [[x + s * .8, Y - .9], [x + s * 1.5, Y - 1.5]], .25, "#2b2230");
      if (a.eyeliner === "fin") line(c, [[x - s * .9, Y - 1.1], [x + s * 1.1, Y - 1.2]], .3, "#2b2230");
      if (a.eyeliner === "chat") line(c, [[x - s * .9, Y - 1.1], [x + s * 1.1, Y - 1.2], [x + s * 1.9, Y - 1.8]], .35, "#2b2230");
    });
  }

  function brows(c, a, dx) {
    if (a.brows === "aucun") return;
    const col = shade(a.hair === "chauve" || a.hair === "rase" ? "#8a5a3c" : a.hairColor, -.25);
    [-1, 1].forEach((s) => {
      const x = s * 1.9 + dx, y = -3;
      switch (a.brows) {
        case "epais": c.fillStyle = col; rr(c, x - 1.1, y - .45, 2.2, .85, .4); break;
        case "arques": line(c, [[x - 1, y + .1], [x, y - .55], [x + 1, y + .1]], .35, col); break;
        case "fronces": line(c, [[x - s * 1, y - .4], [x + s * .9, y + .35]], .4, col); break;
        case "tristes": line(c, [[x - s * 1, y + .35], [x + s * .9, y - .35]], .4, col); break;
        default: line(c, [[x - .9, y], [x + .9, y - .2]], .28, col);
      }
    });
  }

  function nose(c, a, dx) {
    const x = dx * .8, y = .4, col = shade(a.skin, -.22);
    switch (a.nose) {
      case "point": c.fillStyle = col; circle(c, x, y, .28); break;
      case "bouton": c.fillStyle = shade(a.skin, -.1); ell(c, x, y, .75, .55); c.fillStyle = "#fff"; c.globalAlpha = .5; circle(c, x - .2, y - .15, .18); c.globalAlpha = 1; break;
      case "triangle": line(c, [[x, y - 1], [x + .45, y + .2], [x - .2, y + .25]], .28, col); break;
      case "retrousse": line(c, [[x - .45, y], [x, y + .3], [x + .45, y]], .28, col); break;
    }
  }

  function mouth(c, a, dx) {
    const x = dx * .8, y = 1.6, ink = "#8a5a5a", lip = a.lips || null;
    switch (a.mouth) {
      case "grand": c.fillStyle = lip || "#b85a5a"; c.beginPath(); c.arc(x, y - .4, 1.5, .1 * Math.PI, .9 * Math.PI); c.closePath(); c.fill(); break;
      case "rieur": c.fillStyle = "#8a3a3a"; c.beginPath(); c.arc(x, y - .5, 1.3, 0, Math.PI); c.closePath(); c.fill(); c.fillStyle = "#ff8a8a"; ell(c, x, y + .45, .7, .35); if (lip) line(c, [[x - 1.3, y - .5], [x + 1.3, y - .5]], .3, lip); break;
      case "o": c.fillStyle = lip || "#8a3a3a"; ell(c, x, y, .55, .65); break;
      case "chat": line(c, [[x - 1, y - .3], [x - .5, y + .2], [x, y - .2], [x + .5, y + .2], [x + 1, y - .3]], .35, lip || ink); break;
      case "langue": line(c, [[x - 1, y - .4], [x, y + .2], [x + 1, y - .4]], .35, lip || ink); c.fillStyle = "#ff7f8f"; rr(c, x - .45, y, .9, 1.1, .45); break;
      case "neutre": line(c, [[x - .8, y], [x + .8, y]], .35, lip || ink); break;
      case "crocs": line(c, [[x - 1.1, y - .4], [x, y + .2], [x + 1.1, y - .4]], .35, lip || ink); c.fillStyle = "#fff";
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(x + s * .7, y - .1); c.lineTo(x + s * .45, y + .8); c.lineTo(x + s * .25, y); c.fill(); } break;
      case "bisou": c.fillStyle = lip || "#e2627c"; heart(c, x, y, .55); break;
      case "boude": line(c, [[x - .9, y + .3], [x, y - .2], [x + .9, y + .3]], .35, lip || ink); break;
      default:
        if (lip) { c.fillStyle = lip; ell(c, x, y - .1, 1, .5); }
        else { c.strokeStyle = ink; c.lineWidth = .45; c.lineCap = "round"; c.beginPath(); c.arc(x, y - 1.1, 1.1, .22 * Math.PI, .78 * Math.PI); c.stroke(); }
    }
  }

  function faceDetails(c, a, dx) {
    // joues
    if (a.blush && a.paint !== "squelette" && a.paint !== "clown") { c.fillStyle = a.blush; c.globalAlpha = .5; ell(c, -3.1 + dx, .7, 1.1, .75); ell(c, 3.1 + dx, .7, 1.1, .75); c.globalAlpha = 1; }
    const n = Math.round((a.freckles || 0) * 7);
    if (n) { c.fillStyle = shade(a.skin, -.35); const P = [[.2, -.3], [-.5, .2], [.6, .5], [-.1, .8], [.9, -.1], [-.8, -.2], [.4, 1.1]];
      for (const s of [-1, 1]) for (let i = 0; i < n; i++) circle(c, s * (3 + P[i][0]) + dx, .3 + P[i][1] * .8, .17); }
    c.fillStyle = "#5a3a3a";
    if (a.mole === "joue") circle(c, 3 + dx, 1.6, .25); if (a.mole === "menton") circle(c, -.9 + dx, 3.1, .23);
    if (a.mole === "oeil") circle(c, -2.6 + dx, .3, .22); if (a.mole === "levre") circle(c, 1.4 + dx, 1.1, .22);
    const sc = shade(a.skin, -.3);
    if (a.scar === "joue") { line(c, [[2.4 + dx, -.2], [3.8 + dx, 1.6]], .3, sc); for (let k = 0; k < 3; k++) line(c, [[2.6 + dx + k * .45, .5 + k * .55], [3.3 + dx + k * .45, .1 + k * .55]], .18, sc); }
    if (a.scar === "oeil") line(c, [[-1.6 + dx, -3.4], [-2.2 + dx, 1]], .32, sc);
    if (a.scar === "nez") line(c, [[-1 + dx, -.2], [1.2 + dx, .9]], .3, sc);
    if (a.scar === "pansement") { c.save(); c.translate(2.9 + dx, .9); c.rotate(-.5); c.fillStyle = "#f6d7b0"; rr(c, -1.3, -.45, 2.6, .9, .4); c.fillStyle = "#e8bf94"; rr(c, -.4, -.45, .8, .9, .1); c.restore(); }
    if (a.glitter === "paillettes") { c.fillStyle = "#fff"; [[-3.8, -2.2], [3.9, -2], [-2.8, 1.8], [3.4, 2], [-4, .2]].forEach(([x, y]) => { star(c, x + dx, y, .45); }); }
    if (a.glitter === "etoiles") { c.fillStyle = "#ffd96a"; star(c, -3.7 + dx, -.4, .75); star(c, 3.8 + dx, -.2, .55); }
    if (a.glitter === "coeurs") { c.fillStyle = "#ff7f9f"; heart(c, -3.4 + dx, 1, .5); heart(c, 3.5 + dx, .9, .45); }
  }

  function facePaint(c, a, dx) {
    const p = a.paint, col = a.paintColor;
    if (p === "aucune") return;
    c.save(); headPath(c, a); c.clip();
    if (p === "squelette" || p === "catrina" || p === "clown") { c.fillStyle = "#f6f3ee"; c.fillRect(-7, -9, 14, 15); }
    if (p === "squelette" || p === "catrina") {
      c.fillStyle = p === "catrina" ? col : "#2b2230"; ell(c, -1.9 + dx, -.8, 1.6, 1.8); ell(c, 1.9 + dx, -.8, 1.6, 1.8);
      c.fillStyle = "#2b2230"; c.beginPath(); c.moveTo(dx, .7); c.lineTo(dx - .6, 1.6); c.lineTo(dx + .6, 1.6); c.fill();
      c.strokeStyle = "#2b2230"; c.lineWidth = .3; c.beginPath(); c.moveTo(-2.3 + dx, 2.7); c.lineTo(2.3 + dx, 2.7); for (let i = -2; i <= 2; i++) { c.moveTo(i + dx, 2.2); c.lineTo(i + dx, 3.2); } c.stroke();
      if (p === "catrina") { flower(c, -3.6 + dx, -3.8, .55, "#ff7f9f"); flower(c, 3.6 + dx, -3.8, .55, col); c.fillStyle = col; for (let i = -2; i <= 2; i++) circle(c, i * .7 + dx, 3.9 - Math.abs(i) * .2, .22); }
    }
    if (p === "clown") { c.fillStyle = col; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 1.9 + dx, -3.4); c.lineTo(s * 2.6 + dx, -.9); c.lineTo(s * 1.9 + dx, 1.4); c.lineTo(s * 1.2 + dx, -.9); c.fill(); } }
    if (p === "tribale") { line(c, [[-4.6 + dx, .2], [-2.4 + dx, .6]], .45, col); line(c, [[-4.4 + dx, 1.4], [-2.6 + dx, 1.6]], .45, col); line(c, [[4.6 + dx, .2], [2.4 + dx, .6]], .45, col); line(c, [[4.4 + dx, 1.4], [2.6 + dx, 1.6]], .45, col);
      c.fillStyle = col; for (let i = 0; i < 3; i++) circle(c, dx, -3.6 + i * .7, .25); }
    if (p === "tigre") { c.fillStyle = col; for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(s * 5.4 + dx, -2.6 + k * 1.6); c.lineTo(s * 3 + dx, -2 + k * 1.6); c.lineTo(s * 5.4 + dx, -1.6 + k * 1.6); c.fill(); }
      c.beginPath(); c.moveTo(dx - 1.4, -6); c.lineTo(dx, -3.8); c.lineTo(dx + 1.4, -6); c.fill(); }
    if (p === "papillon") { c.fillStyle = col; c.globalAlpha = .8; for (const s of [-1, 1]) { ell(c, s * 2.6 + dx, -1.6, 2, 1.5, s * .5); ell(c, s * 2.2 + dx, .6, 1.3, 1, -s * .4); } c.globalAlpha = 1; }
    c.restore();
    if (p === "coeurs") { c.fillStyle = col; heart(c, -3.2 + dx, .9, .7); heart(c, 3.2 + dx, .9, .7); }
    if (p === "etoiles") { c.fillStyle = col; star(c, 1.9 + dx, -.9, 2.2); }
  }

  function beard(c, a, dx) {
    const col = a.hair === "chauve" || a.hair === "rase" ? "#5a3a2a" : a.hairColor;
    c.fillStyle = col;
    switch (a.beard) {
      case "troisjours": c.globalAlpha = .35; c.beginPath(); c.arc(dx * .5, -.4, 4.6, .12 * Math.PI, .88 * Math.PI); c.closePath(); c.fill(); c.globalAlpha = 1; break;
      case "courte": c.beginPath(); c.moveTo(-4.4 + dx * .5, 0); c.quadraticCurveTo(dx * .5, 6.2, 4.4 + dx * .5, 0); c.quadraticCurveTo(dx * .5, 3, -4.4 + dx * .5, 0); c.fill(); break;
      case "longue": c.beginPath(); c.moveTo(-4.4 + dx * .5, 0); c.quadraticCurveTo(-3 + dx * .5, 8.5, dx * .5, 8.6); c.quadraticCurveTo(3 + dx * .5, 8.5, 4.4 + dx * .5, 0); c.quadraticCurveTo(dx * .5, 3, -4.4 + dx * .5, 0); c.fill(); break;
      case "bouc": ell(c, dx * .8, 3.3, 1, 1.2); break;
    }
    switch (a.mustache) {
      case "fine": line(c, [[-1.3 + dx * .8, 1.2], [dx * .8, .9], [1.3 + dx * .8, 1.2]], .4, col); break;
      case "epaisse": ell(c, -.8 + dx * .8, 1.1, 1, .5, .2); ell(c, .8 + dx * .8, 1.1, 1, .5, -.2); break;
      case "guidon": line(c, [[-2.2 + dx * .8, .2], [-1.6 + dx * .8, 1.2], [dx * .8, .9], [1.6 + dx * .8, 1.2], [2.2 + dx * .8, .2]], .5, col); break;
    }
  }

  // ------------------------------------------------------------ fancy
  const fancyCol = (a) => a.fancyColor || (a.hair === "chauve" || a.hair === "rase" ? "#8a5a3c" : a.hairColor);

  function animalEars(c, a) {
    const col = fancyCol(a), inner = "#ffc6d6";
    for (const s of [-1, 1]) {
      switch (a.ears) {
        case "chat": c.fillStyle = col; c.beginPath(); c.moveTo(s * 1.8, -6.2); c.lineTo(s * 5.2, -10); c.lineTo(s * 5.4, -4.4); c.fill(); c.fillStyle = inner; c.beginPath(); c.moveTo(s * 2.9, -6.2); c.lineTo(s * 4.9, -8.8); c.lineTo(s * 4.9, -5.6); c.fill(); break;
        case "renard": c.fillStyle = col; c.beginPath(); c.moveTo(s * 1.4, -6.3); c.lineTo(s * 5.4, -11.4); c.lineTo(s * 5.6, -4.2); c.fill(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(s * 2.8, -6.4); c.lineTo(s * 5.1, -10); c.lineTo(s * 5.1, -5.6); c.fill(); break;
        case "lapin": c.fillStyle = col; ell(c, s * 2.2, -10.4, 1.5, 4.4, s * .15); c.fillStyle = inner; ell(c, s * 2.2, -10.2, .7, 3.3, s * .15); break;
        case "ours": c.fillStyle = col; circle(c, s * 4.2, -6.4, 2); c.fillStyle = inner; circle(c, s * 4.2, -6.4, 1); break;
        case "souris": c.fillStyle = col; circle(c, s * 4.6, -6.4, 2.7); c.fillStyle = inner; circle(c, s * 4.6, -6.4, 1.6); break;
      }
    }
  }
  function elfEars(c, a) {
    if (a.ears !== "elfe") return;
    c.fillStyle = a.skin;
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 4.6, -2.4); c.lineTo(s * 8, -4.4); c.lineTo(s * 4.8, .4); c.fill(); }
  }
  function horns(c, a) {
    switch (a.horns) {
      case "demon": c.fillStyle = "#3a1f2a"; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 1.9, -6.4); c.quadraticCurveTo(s * 4.6, -9, s * 3.3, -11.2); c.quadraticCurveTo(s * 4, -8.4, s * 3.9, -5.9); c.fill(); } break;
      case "licorne": { const g = c.createLinearGradient(0, -12, 0, -6); g.addColorStop(0, "#ffe9a8"); g.addColorStop(1, "#ffc6e0"); c.fillStyle = g; c.beginPath(); c.moveTo(-1.2, -6.4); c.lineTo(0, -12.6); c.lineTo(1.2, -6.4); c.fill();
        line(c, [[-.8, -7.6], [.7, -8.2]], .22, "#f0a0c0"); line(c, [[-.5, -9.4], [.5, -9.8]], .22, "#f0a0c0"); break; }
      case "cerf": for (const s of [-1, 1]) { line(c, [[s * 2.4, -6.2], [s * 3.6, -9.6], [s * 3.2, -12]], .7, "#9a6a44"); line(c, [[s * 3.4, -9], [s * 5.2, -10.4]], .6, "#9a6a44"); line(c, [[s * 3.3, -10.8], [s * 1.9, -12]], .5, "#9a6a44"); } break;
      case "belier": c.strokeStyle = "#e8dcc8"; c.lineWidth = 1.1; for (const s of [-1, 1]) { c.beginPath(); for (let t = 0; t < 9; t += .3) { const r = 2.4 - t * .2; c.lineTo(s * (4.4 + Math.cos(t) * r), -4.6 + Math.sin(t) * r); } c.stroke(); } break;
    }
  }
  function wings(c, a, t) {
    const flap = Math.sin(t * 4) * .08, col = a.fancyColor || null;
    for (const s of [-1, 1]) {
      c.save(); c.translate(s * 2.5, 4); c.rotate(s * (.15 + flap)); c.scale(s, 1);
      switch (a.wings) {
        case "ange": c.fillStyle = "#ffffff"; c.strokeStyle = "#ddd3ee"; c.lineWidth = .35;
          c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(7, -9, 11, -4); c.quadraticCurveTo(10, -1, 7, 0); c.quadraticCurveTo(8, 2, 5, 3); c.quadraticCurveTo(4, 4, 0, 3); c.closePath(); c.fill(); c.stroke(); break;
        case "demon": c.fillStyle = col || "#3a1f2a"; c.beginPath(); c.moveTo(0, 0); c.lineTo(9, -7); c.lineTo(10, 1); c.quadraticCurveTo(8, -.5, 7, 2); c.quadraticCurveTo(5, .5, 4, 3); c.quadraticCurveTo(2.5, 1.5, 0, 3); c.closePath(); c.fill(); break;
        case "papillon": c.fillStyle = col || "#c9a3e8"; ell(c, 4.6, -3.2, 4.6, 3.6, -.5); c.fillStyle = shade(col || "#c9a3e8", .3); ell(c, 3.8, 2.4, 2.8, 2.2, .4); c.fillStyle = "#fff"; circle(c, 5.6, -4, .9); break;
        case "fee": c.fillStyle = col || "#bfe8ff"; c.globalAlpha = .6; ell(c, 4.4, -3.6, 4.4, 2.2, -.7); ell(c, 3.6, 1.8, 3, 1.5, .5); c.globalAlpha = 1; break;
      }
      c.restore();
    }
  }
  function tail(c, a, t) {
    const col = fancyCol(a), w = Math.sin(t * 3) * .15;
    c.save(); c.translate(4, 9); c.rotate(w);
    switch (a.tail) {
      case "chat": line(c, [[0, 0], [3, -1], [4.5, -4], [3.6, -6.4]], 1.3, col); break;
      case "renard": c.fillStyle = col; ell(c, 3, -2.6, 2.2, 4, .6); c.fillStyle = "#fff"; ell(c, 4.2, -5, 1.1, 1.4, .6); break;
      case "diable": line(c, [[0, 0], [3, 1], [5, -2], [5.4, -4]], .6, "#c0394f"); c.fillStyle = "#c0394f"; c.beginPath(); c.moveTo(5.4, -5.8); c.lineTo(4.2, -3.6); c.lineTo(6.6, -3.8); c.fill(); break;
      case "lapin": c.fillStyle = "#fff"; circle(c, 1.4, -.2, 1.6); break;
    }
    c.restore();
  }
  function aura(c, a, t) {
    if (!a.aura) return;
    const g = c.createRadialGradient(0, 1, 2, 0, 1, 15);
    if (a.aura === "arcenciel") { g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.45, "rgba(255,159,192,.28)"); g.addColorStop(.65, "rgba(159,211,239,.28)"); g.addColorStop(.85, "rgba(255,210,122,.22)"); g.addColorStop(1, "rgba(255,255,255,0)"); }
    else { g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(.6, a.aura + "55"); g.addColorStop(1, a.aura + "00"); }
    c.fillStyle = g; circle(c, 0, 1, 15);
    c.fillStyle = "#fff";
    for (let i = 0; i < 5; i++) { const ang = t * .8 + i * 1.26, r = 9 + Math.sin(t * 2 + i) * 2; star(c, Math.cos(ang) * r, 1 + Math.sin(ang) * r * .9, .45 + .2 * Math.sin(t * 3 + i)); }
  }

  // ------------------------------------------------------------ accessoires
  function hat(c, a) {
    const col = a.hatColor;
    switch (a.hat) {
      case "paille": c.fillStyle = "#f3d08a"; ell(c, 0, -5.6, 8, 2.2); c.fillStyle = "#e8c070"; rr(c, -4, -9.6, 8, 4.4, 2.2); c.fillStyle = col; c.fillRect(-4, -6.6, 8, 1.1); break;
      case "bob": c.fillStyle = col; ell(c, 0, -5.4, 6.8, 1.8); rr(c, -4.6, -9.4, 9.2, 4.6, 2.6); break;
      case "casquette": c.fillStyle = col; c.beginPath(); c.arc(0, -5.2, 5.4, Math.PI, 0); c.fill(); ell(c, 3.4, -5.1, 4, 1.1, .1); c.fillStyle = shade(col, -.2); circle(c, 0, -10.5, .7); break;
      case "bandana": c.fillStyle = col; c.beginPath(); c.arc(0, -2.8, 5.6, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(5.2, -4.2); c.lineTo(-5.2, -4.2); c.fill(); ell(c, 5.6, -3.4, 1, .7, .6); ell(c, 6.4, -2.4, .7, 1.2, .3);
        c.fillStyle = "#fff"; c.globalAlpha = .6; [[-2, -6.2], [1, -7], [3, -5.6], [-3.6, -4.8]].forEach(([x, y]) => circle(c, x, y, .3)); c.globalAlpha = 1; break;
      case "fleurs": [["#ff9fb8", -4.6, -5.4], ["#ffd27a", -2.4, -6.8], ["#c9b3ff", 0, -7.3], ["#9fd3ef", 2.4, -6.8], ["#ff9fb8", 4.6, -5.4]].forEach(([fc, x, y]) => flower(c, x, y, .75, fc)); break;
      case "bonnet": c.fillStyle = col; c.beginPath(); c.arc(0, -4.6, 5.5, Math.PI, 0); c.fill(); c.fillStyle = shade(col, -.15); rr(c, -5.6, -5.2, 11.2, 1.8, .9); c.fillStyle = "#fff"; circle(c, 0, -10.4, 1.4); break;
      case "pirate": c.fillStyle = "#2b2230"; c.beginPath(); c.moveTo(-7.4, -5.6); c.quadraticCurveTo(0, -14, 7.4, -5.6); c.quadraticCurveTo(0, -7.4, -7.4, -5.6); c.fill();
        c.fillStyle = "#fff"; circle(c, 0, -8.8, .9); line(c, [[-1.1, -7.4], [1.1, -6.6]], .3, "#fff"); line(c, [[1.1, -7.4], [-1.1, -6.6]], .3, "#fff"); c.fillStyle = col; c.fillRect(-6, -6.4, 12, .5); break;
      case "couronne": c.fillStyle = "#ffd96a"; c.beginPath(); c.moveTo(-3.6, -6); c.lineTo(-3.8, -9.6); c.lineTo(-1.8, -7.6); c.lineTo(0, -10.4); c.lineTo(1.8, -7.6); c.lineTo(3.8, -9.6); c.lineTo(3.6, -6); c.fill();
        c.fillStyle = col; circle(c, 0, -7.4, .55); c.fillStyle = "#ff7f9f"; circle(c, -2.2, -6.9, .4); circle(c, 2.2, -6.9, .4); break;
      case "noeud": c.fillStyle = col; c.save(); c.translate(3, -6.4); c.rotate(.3); c.beginPath(); c.moveTo(0, 0); c.lineTo(-3, -1.9); c.lineTo(-3, 1.9); c.fill(); c.beginPath(); c.moveTo(0, 0); c.lineTo(3, -1.9); c.lineTo(3, 1.9); c.fill(); c.fillStyle = shade(col, -.2); circle(c, 0, 0, .8); c.restore(); break;
    }
  }
  function glasses(c, a, dx) {
    const X = [-1.9 + dx, 1.9 + dx], Y = -.9, ink = "#5a4040";
    switch (a.glasses) {
      case "rondes": c.strokeStyle = ink; c.lineWidth = .4; c.beginPath(); X.forEach((x) => { c.moveTo(x + 1.5, Y); c.arc(x, Y, 1.5, 0, TAU); }); c.moveTo(X[0] + 1.5, Y); c.lineTo(X[1] - 1.5, Y); c.stroke(); break;
      case "carrees": c.strokeStyle = ink; c.lineWidth = .4; c.beginPath(); X.forEach((x) => c.roundRect(x - 1.5, Y - 1.1, 3, 2.2, .5)); c.moveTo(X[0] + 1.5, Y); c.lineTo(X[1] - 1.5, Y); c.stroke(); break;
      case "soleil": c.fillStyle = "#2b2230"; X.forEach((x) => rr(c, x - 1.6, Y - 1, 3.2, 2.1, 1)); c.fillRect(X[0], Y - .7, X[1] - X[0], .4); c.fillStyle = "rgba(255,255,255,.5)"; X.forEach((x) => rr(c, x - 1, Y - .6, 1, .5, .25)); break;
      case "coeur": c.fillStyle = "#ff7f9f"; X.forEach((x) => heart(c, x, Y + .1, 1.3)); c.fillRect(X[0], Y - .5, X[1] - X[0], .35); break;
      case "etoiles": c.fillStyle = "#ffd96a"; X.forEach((x) => star(c, x, Y, 1.8)); c.fillRect(X[0], Y - .3, X[1] - X[0], .35); break;
      case "monocle": c.strokeStyle = "#c9a24a"; c.lineWidth = .4; c.beginPath(); c.arc(X[1], Y, 1.5, 0, TAU); c.stroke(); line(c, [[X[1] + 1.2, Y + .9], [X[1] + 2, Y + 5]], .2, "#c9a24a"); break;
      case "cacheoeil": c.fillStyle = "#2b2230"; ell(c, X[0], Y, 1.5, 1.3); line(c, [[X[0] - 1.4, Y - .6], [-4.8, -3.4]], .3, "#2b2230"); line(c, [[X[0] + 1.4, Y - .6], [4.8, -4.4]], .3, "#2b2230"); break;
    }
  }
  function earrings(c, a) {
    for (const s of [-1, 1]) {
      const x = s * 5, y = .8;
      switch (a.earrings) {
        case "perles": c.fillStyle = "#fff"; circle(c, x, y, .55); break;
        case "anneaux": c.strokeStyle = "#ffd96a"; c.lineWidth = .3; c.beginPath(); c.arc(x, y + .6, .8, 0, TAU); c.stroke(); break;
        case "etoiles": c.fillStyle = "#ffd96a"; star(c, x, y + .4, .8); break;
        case "coquillages": c.fillStyle = "#ffc6d6"; c.beginPath(); c.arc(x, y + .8, .8, Math.PI, 0); c.lineTo(x, y + 1.6); c.fill(); break;
      }
    }
  }
  function earFlower(c, a) {
    if (a.earFlower === "hibiscus") flower(c, -4.6, -3.4, 1, "#ff5f7a", "#ffd27a");
    if (a.earFlower === "marguerite") flower(c, -4.6, -3.4, .9, "#ffffff", "#ffd27a");
  }
  function necklace(c, a, y0) {
    const y = y0 + .2;
    switch (a.necklace) {
      case "coquillages": line(c, [[-2.6, y], [0, y + 1.6], [2.6, y]], .25, "#f4f1ea"); c.fillStyle = "#ffc6d6"; [[-1.4, y + 1.1], [0, y + 1.8], [1.4, y + 1.1]].forEach(([x, yy]) => { c.beginPath(); c.arc(x, yy, .6, Math.PI, 0); c.lineTo(x, yy + .6); c.fill(); }); break;
      case "perles": c.fillStyle = "#fff"; for (let i = -3; i <= 3; i++) circle(c, i * .8, y + 1.5 - Math.abs(i) * .35, .38); break;
      case "dent": line(c, [[-2.6, y], [0, y + 1.6], [2.6, y]], .25, "#6b5050"); c.fillStyle = "#fffdf4"; c.beginPath(); c.moveTo(-.6, y + 1.5); c.lineTo(0, y + 3.2); c.lineTo(.6, y + 1.5); c.fill(); break;
      case "coeur": line(c, [[-2.6, y], [0, y + 1.6], [2.6, y]], .2, "#ffd96a"); c.fillStyle = "#ff5f7a"; heart(c, 0, y + 2.2, .7); break;
      case "fleurs": ["#ff9fb8", "#ffd27a", "#c9b3ff", "#9fd3ef", "#ff9fb8"].forEach((fc, i) => flower(c, -3 + i * 1.5, y + 1.1 - Math.abs(i - 2) * .35, .5, fc)); break;
    }
  }

  // ------------------------------------------------------------ corps
  function body(c, a, o) {
    const W = a.build === "fin" ? 7.6 : a.build === "costaud" ? 10.4 : 8.8;
    const legLen = 3.6 + 1.6 * (Number(a.height) || 0);
    const feetY = 13.7, hip = feetY - legLen, top = hip + 2 - 8; // haut du torse
    const walk = o.walk, step = walk == null ? 0 : Math.sin(walk * TAU);
    const lift = [Math.max(0, step) * .9, Math.max(0, -step) * .9];
    const skin = a.skin, bc = a.bottomColor, dress = a.top === "robe";
    // jambes
    [-1, 1].forEach((s, i) => {
      const x = s * 1.9 - 1.3, y = hip + 1 - lift[i], h = legLen - .8;
      const full = !dress && (a.bottom === "pantalon" || a.bottom === "legging");
      c.fillStyle = full ? bc : skin; rr(c, x, y, 2.6, h, 1.2);
      if (!dress && a.bottom === "short") { c.fillStyle = bc; rr(c, x - .1, y - .3, 2.8, h * .45, 1); }
      if (a.bottom === "legging" && !dress) { c.fillStyle = shade(bc, -.1); c.fillRect(x, y + h - 1.4, 2.6, .4); }
      // chaussures
      const fy = y + h - .9;
      switch (a.shoes) {
        case "baskets": c.fillStyle = a.shoesColor; rr(c, x - .3, fy - .4, 3.2, 1.6, .8); c.fillStyle = "#fff"; rr(c, x - .3, fy + .7, 3.2, .6, .3); break;
        case "bottes": c.fillStyle = a.shoesColor; rr(c, x - .2, fy - 2.4, 3, 3.6, 1); c.fillStyle = shade(a.shoesColor, -.2); rr(c, x - .3, fy + .7, 3.2, .6, .3); break;
        case "sandales": c.fillStyle = a.shoesColor; rr(c, x - .2, fy + .7, 3, .6, .3); c.fillRect(x + .2, fy - .1, 2.2, .45); break;
        case "tongs": c.fillStyle = a.shoesColor; rr(c, x - .2, fy + .7, 3, .55, .3); line(c, [[x + .4, fy + .1], [x + 1.3, fy + .5], [x + 2.2, fy + .1]], .3, a.shoesColor); break;
      }
    });
    const by = o.walk == null ? 0 : -Math.abs(step) * .35; // petit rebond
    c.save(); c.translate(0, by);
    // bas : jupe / pagne par-dessus les jambes
    if (!dress && a.bottom === "jupe") { c.fillStyle = bc; c.beginPath(); c.moveTo(-W / 2 + .4, hip); c.lineTo(W / 2 - .4, hip); c.lineTo(W / 2 + .8, hip + 3.2); c.lineTo(-W / 2 - .8, hip + 3.2); c.closePath(); c.fill(); }
    if (!dress && a.bottom === "pagne") { for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "#7cc078" : "#5fae6b"; ell(c, -W / 2 + .9 + i * (W - 1.8) / 5, hip + 1.6, .9, 2, (i - 2.5) * .08); } }
    // bras (derrière les manches)
    const swing = o.walk == null ? 0 : step * .6, sw = o.swing || 0;
    const handY = top + 4.4, handX = W / 2 + .3;
    const sleeveLong = a.top === "pull" || a.top === "kimono" || a.top === "veste";
    const armCol = sleeveLong ? a.topColor : skin;
    c.fillStyle = armCol; rr(c, -handX - .9, top + 1 - swing, 1.8, 4, .9); rr(c, handX - .9, top + 1 + swing - sw * 2.2, 1.8, 4, .9);
    if (sleeveLong) { c.fillStyle = a.topColor2; rr(c, -handX - .95, handY - 1.2 - swing, 1.9, .7, .3); rr(c, handX - .95, handY - 1.2 + swing - sw * 2.2, 1.9, .7, .3); }
    c.fillStyle = skin; circle(c, -handX, handY - swing, 1.3); circle(c, handX, handY + swing - sw * 2.2, 1.3);
    // torse
    const torso = () => { c.beginPath(); c.roundRect(-W / 2, top, W, 8, 3.4); };
    const tc = a.top === "feuilles" ? "#7cc078" : a.topColor;
    c.fillStyle = a.top === "salopette" ? a.topColor2 : tc; torso(); c.fill();
    if (dress) { c.fillStyle = tc; c.beginPath(); c.moveTo(-W / 2 + .2, top + 4); c.lineTo(W / 2 - .2, top + 4); c.lineTo(W / 2 + 1.6, hip + 3.4); c.quadraticCurveTo(0, hip + 4.4, -W / 2 - 1.6, hip + 3.4); c.closePath(); c.fill(); }
    // motif
    if (a.pattern !== "uni" && a.top !== "feuilles") {
      c.save(); torso(); if (dress) { c.moveTo(-W / 2, top + 4); c.lineTo(W / 2 + 1.6, hip + 3.4); c.lineTo(-W / 2 - 1.6, hip + 3.4); } c.clip();
      const pc = a.topColor2; c.fillStyle = pc; c.strokeStyle = pc; c.globalAlpha = .75;
      const yMax = dress ? hip + 4.4 : top + 8;
      for (let y = top + 1; y < yMax; y += 1.9) for (let x = -W / 2 - 1; x < W / 2 + 2; x += 1.9) {
        const ox = ((y - top) / 1.9) % 2 ? .95 : 0;
        switch (a.pattern) {
          case "pois": circle(c, x + ox, y, .35); break;
          case "fleurs": if ((x + y) % 3 < 1.5) flower(c, x + ox, y, .35, pc, "#fff"); break;
          case "etoiles": star(c, x + ox, y, .5); break;
          case "coeurs": heart(c, x + ox, y, .4); break;
        }
      }
      if (a.pattern === "rayures") for (let y = top + .8; y < yMax; y += 1.6) c.fillRect(-W, y, W * 2, .7);
      if (a.pattern === "carreaux") { for (let y = top + .5; y < yMax; y += 1.6) c.fillRect(-W, y, W * 2, .5); for (let x = -W; x < W; x += 1.6) c.fillRect(x, top, .5, 14); }
      c.restore(); c.globalAlpha = 1;
    }
    switch (a.top) {
      case "debardeur": c.fillStyle = skin; c.beginPath(); c.arc(0, top, 2.2, 0, Math.PI); c.fill(); c.fillStyle = skin; rr(c, -W / 2 - .1, top - .1, 1.1, 2.8, .5); rr(c, W / 2 - 1, top - .1, 1.1, 2.8, .5); break;
      case "chemise": c.fillStyle = a.topColor2; c.beginPath(); c.moveTo(-1.8, top); c.lineTo(0, top + 1.8); c.lineTo(1.8, top); c.lineTo(0, top + .6); c.fill(); for (let i = 0; i < 3; i++) circle(c, 0, top + 2.8 + i * 1.6, .28); break;
      case "pull": c.fillStyle = a.topColor2; rr(c, -W / 2, top + 6.9, W, 1.1, .5); c.beginPath(); c.arc(0, top, 1.8, 0, Math.PI); c.fill(); break;
      case "salopette": c.fillStyle = tc; rr(c, -W / 2 + 1.2, top + 2.4, W - 2.4, 5.6, 1.4); rr(c, -W / 2 + .2, top + 5, W - .4, 3, 2); c.fillRect(-W / 2 + 1.3, top, .9, 2.6); c.fillRect(W / 2 - 2.2, top, .9, 2.6);
        c.fillStyle = "#ffd96a"; circle(c, -W / 2 + 1.75, top + 2.6, .35); circle(c, W / 2 - 1.75, top + 2.6, .35); break;
      case "kimono": c.fillStyle = shade(tc, -.12); c.beginPath(); c.moveTo(-2.4, top); c.lineTo(1.6, top + 5); c.lineTo(2.6, top + 5); c.lineTo(-1.2, top); c.fill(); c.fillStyle = a.topColor2; rr(c, -W / 2, top + 4.4, W, 1.6, .4); break;
      case "veste": c.fillStyle = a.topColor2; rr(c, -1.6, top, 3.2, 8, 1); c.fillStyle = shade(tc, -.15); c.fillRect(-1.7, top, .4, 8); c.fillRect(1.3, top, .4, 8); break;
      case "feuilles": for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? "#9fd68f" : "#5fae6b"; ell(c, -W / 2 + .8 + i * (W - 1.6) / 6, top + 4 + (i % 2) * 1.6, 1, 2.8, (i - 3) * .12); } c.fillStyle = "#c9956b"; c.fillRect(-W / 2, top + 6.6, W, .7); break;
      case "robe": c.fillStyle = a.topColor2; rr(c, -W / 2, top + 3.6, W, .8, .4); break;
    }
    necklace(c, a, top);
    c.restore();
    return top + by; // haut du torse, pour placer la tête
  }

  // ------------------------------------------------------------ dessin complet
  // o : { dir: "down"|"up"|"left"|"right", walk: 0..1 | null, swing: 0..1, t: secondes }
  function draw(c, av, o = {}) {
    const a = normalize(av), t = o.t || 0, dir = o.dir || "down", back = dir === "up";
    const dx = dir === "left" ? -.6 : dir === "right" ? .6 : 0;
    c.save();
    aura(c, a, t);
    c.fillStyle = "rgba(120,90,60,.16)"; ell(c, 0, 14, 6, 1.8);
    if (!back) { wings(c, a, t); if (a.tail !== "aucune") tail(c, a, t); }
    const top = body(c, a, o);
    c.save(); c.translate(dx * .5, top - 3.4); // la tête suit le torse
    if (back) {
      elfEars(c, a); c.fillStyle = a.skin; headPath(c, a); c.fill();
      hairBack(c, a, true);
      if (!["chauve", "rase", "iroquoise"].includes(a.hair)) {
        c.fillStyle = hairFill(c, a);
        const low = ["court", "petard", "meche", "frange", "boucle", "afro", "chignon", "macarons", "queue"].includes(a.hair) ? 1.6 : 3.4;
        c.beginPath(); c.arc(0, -1.6, 5.5, Math.PI, 0); c.lineTo(5.5, low); c.quadraticCurveTo(0, low + 1.4, -5.5, low); c.closePath(); c.fill();
        if (a.hair === "boucle" || a.hair === "afro") for (let i = -2; i <= 2; i++) circle(c, i * 2.2, low, 1.5);
      }
      else if (a.hair !== "chauve") { c.fillStyle = a.hairColor; c.globalAlpha = .5; headPath(c, a); c.fill(); c.globalAlpha = 1; }
      if (a.hair === "iroquoise") { c.fillStyle = a.hairColor; rr(c, -1.4, -10, 2.8, 9, 1.4); }
      hat(c, a); animalEars(c, a); horns(c, a);
    } else {
      hairBack(c, a, false);
      elfEars(c, a);
      c.fillStyle = a.skin; headPath(c, a); c.fill();
      facePaint(c, a, dx);
      faceDetails(c, a, dx);
      if (a.paint !== "squelette" && a.paint !== "catrina") eyes(c, a, dx);
      brows(c, a, dx);
      if (a.paint !== "squelette" && a.paint !== "catrina") { nose(c, a, dx); mouth(c, a, dx); }
      beard(c, a, dx);
      hairFront(c, a);
      earrings(c, a); earFlower(c, a);
      glasses(c, a, dx);
      animalEars(c, a); horns(c, a); hat(c, a);
    }
    if (a.halo === "oui") { c.strokeStyle = "#ffd96a"; c.lineWidth = .8; c.beginPath(); c.ellipse(0, -12 + Math.sin(t * 2) * .4, 3.6, 1.1, 0, 0, TAU); c.stroke(); }
    c.restore();
    if (back) { wings(c, a, t); if (a.tail !== "aucune") tail(c, a, t); }
    c.restore();
  }

  return { TABS, DEFAULT, normalize, random, draw, shade, star, heart, flower };
})();
