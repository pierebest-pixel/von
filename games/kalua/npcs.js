/* Les Échoués de Kalua — les habitants : apparence, emploi du temps, activités, petites phrases.
 * L'heure est commune aux deux joueurs (1 journée de Kalua = 20 minutes) : tout le monde voit les PNJ au même endroit.
 * Marqueurs : point ROUGE = grande quête d'un PNJ important · point NOIR = quête qui apprend un chant (magie). */
"use strict";

const NPC = (() => {
  const K = KALUA.K, TAU = Math.PI * 2;
  const DAY = 1200; // secondes réelles pour 24 h
  const hourAt = (T) => ((T / DAY) * 24 + 7) % 24; // le jeu commence à 7 h du matin
  const av = (o) => Object.assign({}, Avatar.DEFAULT, o);

  // ---------------------------------------------------------------- lieux (unités carte)
  const SPOT = {
    plage: [790, 905], epave: [812, 925], recif: [700, 912], dune: [860, 905],
    village: [765, 652], villageFeu: [772, 668], villageNord: [760, 628], villageEst: [800, 640], villageOuest: [728, 650],
    port: [905, 872], portFeu: [905, 888], ponton: [955, 878], hutte1: [880, 858], hutte2: [905, 876], hutte3: [930, 860],
    camp: [612, 872], campFeu: [628, 884], tente1: [600, 858], tente2: [618, 878],
    champ: [700, 712], champ2: [842, 705], prairie: [720, 590],
    cabanes: [420, 470], cabane1: [400, 448], cabane2: [440, 468], cabane3: [420, 496], temple: [486, 558], totemSud: [362, 708], totemTemple: [470, 572], ruineJ: [420, 650], vieilArbre: [300, 562], cimetiere: [330, 655],
    pilotis: [470, 262], pilotis1: [452, 245], pilotis2: [488, 258], pilotis3: [470, 284], pontonM: [440, 270], lanterne1: [430, 232], lanterne2: [500, 246], lanterne3: [455, 296], roseaux: [520, 200], herbes: [560, 160],
    pierres: [1185, 528], pierre1: [1162, 534], moulin1: [1120, 442], moulin2: [1150, 420], moulin3: [1290, 480], tour: [1300, 454], paturage: [1240, 590], champF: [1120, 608], ruinesF: [1108, 704],
    sanctuaire: [720, 348], cristaux: [700, 262], campV: [962, 314], forge: [975, 322], geyser: [1020, 222], soufriere: [935, 175],
  };
  // les lieux sont toujours ramenés sur la terre ferme (sinon un habitant ou un objectif peut se retrouver dans l'eau, hors d'atteinte)
  const W = (s) => { const x = SPOT[s][0] * K, y = SPOT[s][1] * K, w = typeof Game !== "undefined" && Game.world; return w && w.snap ? w.snap(x, y) : { x, y }; };

  // ---------------------------------------------------------------- les habitants
  // sched : [heure de début, lieu, activité] ; act : walk, idle, fish, sleep, cook, pray, guard, read, sweep, dance, look, dig, sing, light, tend, star, forge, swim, play, haunt
  const L = {};
  const def = (id, o) => { L[id] = Object.assign({ id, role: "minor", color: "#6b5050", sched: [[0, "village", "idle"]], barks: {} }, o); };

  // --- la guide
  def("nalia", { name: "Nalia", title: "la guide", role: "guide", color: "#7a8fd0",
    avatar: av({ skin: "#f3d6c6", face: "ovale", eyes: "etoiles", eyeColor: "#7ab8ff", brows: "fins", hair: "treslong", hairColor: "#f4f2ff", top: "robe", topColor: "#cfe0ff", topColor2: "#ffffff", pattern: "etoiles", bottom: "jupe", bottomColor: "#a8b8f0", shoes: "pieds", necklace: "perles", earFlower: "hibiscus", glitter: "etoiles", aura: "#cfe6ff" }),
    sched: [[5, "plage", "look"], [8, "villageFeu", "idle"], [12, "village", "tend"], [17, "villageFeu", "sing"], [22, "dune", "look"]],
    barks: { look: ["La mer est calme ce soir…", "Tu entends la cloche ? Non… rien."], sing: ["♪ Lu-mé, lu-mé… ♪"], idle: ["Pose-moi toutes tes questions !"] } });

  // --- les 10 PNJ importants (point rouge quand ils ont une grande quête)
  def("bastien", { name: "Capitaine Bastien", title: "capitaine de la Mouette d'Argent", role: "main", color: "#3a5a8a",
    avatar: av({ skin: "#e8b48a", face: "carre", eyes: "miclos", brows: "epais", hair: "court", hairColor: "#d8d8d8", beard: "longue", mustache: "epaisse", top: "veste", topColor: "#2f4f7f", topColor2: "#ffd27a", bottom: "pantalon", bottomColor: "#3a3a4a", shoes: "bottes", hat: "pirate", hatColor: "#2a2a3a", scar: "joue" }),
    sched: [[5, "ponton", "look"], [9, "epave", "dig"], [14, "port", "idle"], [18, "portFeu", "idle"], [22, "hutte1", "sleep"]],
    barks: { look: ["Pas un bateau à l'horizon…", "Cette mer m'a pris mon navire."], dig: ["Il doit rester du bon bois là-dedans.", "Ouf, mon dos…"], sleep: ["Zzz… Maëlle… cap au nord…"] } });
  def("pipa", { name: "Pipa", title: "pêcheuse", role: "main", color: "#d0704a",
    avatar: av({ skin: "#c98d63", face: "rond", eyes: "joyeux", hair: "couettes", hairColor: "#3a2a20", top: "debardeur", topColor: "#ff9a6a", bottom: "short", bottomColor: "#5a8ad0", shoes: "tongs", hat: "bandana", hatColor: "#ff6a6a", freckles: .6, necklace: "coquillages" }),
    sched: [[5, "ponton", "fish"], [11, "recif", "dig"], [16, "portFeu", "cook"], [21, "hutte2", "sleep"]],
    barks: { fish: ["Ça mord ! … Non.", "Devinette : qu'est-ce qui a des dents mais ne mord pas ?"], cook: ["Poisson grillé, qui en veut ?"] } });
  def("keo", { name: "Kéo", title: "le Veilleur", role: "main", color: "#3f8a4a",
    avatar: av({ skin: "#a8734f", face: "ovale", eyes: "amande", brows: "fronces", hair: "dreads", hairColor: "#1a1410", top: "feuilles", topColor: "#4f9a52", bottom: "pagne", bottomColor: "#8a5a3c", shoes: "pieds", paint: "tribale", paintColor: "#ffffff", necklace: "dent" }),
    sched: [[5, "totemTemple", "guard"], [9, "temple", "guard"], [19, "cabane2", "idle"], [23, "cabane2", "sleep"]],
    barks: { guard: ["Personne n'entre au Temple.", "Je garde la porte. Comme mon père. Comme son père."], idle: ["Tu te bats bien, pour un Échoué."] } });
  def("amaru", { name: "Amaru", title: "la conteuse", role: "main", color: "#8a5aa8",
    avatar: av({ skin: "#a8734f", face: "long", eyes: "miclos", hair: "nattes", hairColor: "#bdbdbd", top: "kimono", topColor: "#8a5aa8", topColor2: "#ffd27a", bottom: "jupe", bottomColor: "#5a3a6a", shoes: "pieds", necklace: "fleurs", glasses: "cacheoeil", paint: "tribale", paintColor: "#ffd27a" }),
    sched: [[6, "ruineJ", "read"], [13, "cabane3", "idle"], [18, "cabanes", "sing"], [23, "cabane3", "sleep"]],
    barks: { read: ["Ces spirales… elles parlent d'une reine.", "Les Lumes écrivaient avec des étoiles."], sing: ["Approchez, je vais vous conter l'Étoile tombée…"] } });
  def("tikka", { name: "Mère Tikka", title: "guérisseuse brumière", role: "main", color: "#5a8a7a",
    avatar: av({ skin: "#c9a88a", face: "rond", eyes: "endormis", hair: "chignon", hairColor: "#e8e8e8", top: "pull", topColor: "#6a8a7a", bottom: "jupe", bottomColor: "#4a5a50", shoes: "pieds", necklace: "dent", earrings: "anneaux", glasses: "rondes" }),
    sched: [[6, "herbes", "dig"], [12, "pilotis3", "cook"], [19, "lanterne3", "pray"], [23, "pilotis3", "sleep"]],
    barks: { dig: ["Cette herbe-là soigne. Celle-ci tue.", "Je ne vois pas tes yeux, mais je vois ton Souffle."], pray: ["Mila… reviens à la lumière."] } });
  def("fennek", { name: "Fennek", title: "l'allumeur de lanternes", role: "main", color: "#c9a040",
    avatar: av({ skin: "#e8c4a0", face: "long", eyes: "miclos", hair: "meche", hairColor: "#c9a040", top: "veste", topColor: "#4a4a5a", topColor2: "#c9a040", bottom: "pantalon", bottomColor: "#2a2a3a", shoes: "bottes", hat: "bob", hatColor: "#3a3a4a", ears: "renard" }),
    sched: [[7, "pilotis2", "sleep"], [16, "pilotis2", "idle"], [18, "lanterne1", "light"], [20, "lanterne2", "light"], [22, "lanterne3", "light"], [2, "pontonM", "look"]],
    barks: { light: ["Une flamme pour chaque âme.", "Encore une lanterne éteinte… qui me vole ?"], sleep: ["Zzz… pas maintenant… il fait jour…"] } });
  def("oro", { name: "Grand-père Oro", title: "berger des vents", role: "main", color: "#8a7a5a",
    avatar: av({ skin: "#e0b48a", face: "long", eyes: "miclos", brows: "epais", hair: "chauve", beard: "longue", hairColor: "#f0f0f0", top: "pull", topColor: "#c9b090", pattern: "rayures", bottom: "pantalon", bottomColor: "#7a6a5a", shoes: "sandales", hat: "paille", hatColor: "#e8d090" }),
    sched: [[6, "pierres", "pray"], [10, "paturage", "tend"], [16, "moulin2", "idle"], [21, "pierre1", "sleep"]],
    barks: { pray: ["Chantez, vieilles pierres…", "Le vent ne chante plus depuis mes huit ans."], tend: ["Allez, mes nuages, allez !"] } });
  def("lili", { name: "Lili", title: "petite astronome", role: "main", color: "#d07aa0",
    avatar: av({ skin: "#f0c8a8", face: "coeur", eyes: "brillants", hair: "macarons", hairColor: "#c96a3a", top: "salopette", topColor: "#ffb0c8", topColor2: "#ffffff", bottom: "short", bottomColor: "#ffb0c8", shoes: "baskets", glasses: "rondes", freckles: .8 }),
    sched: [[7, "moulin1", "play"], [12, "champF", "tend"], [17, "moulin2", "read"], [20, "tour", "star"], [2, "moulin2", "sleep"]],
    barks: { star: ["Tu vois la Couronne ? Là, les cinq étoiles !", "Un jour je compterai TOUTES les étoiles."], play: ["Grand-père dit que le vent chantait avant !"] } });
  def("ysolde", { name: "Ysolde", title: "gardienne du Sanctuaire", role: "main", color: "#b04a3a",
    avatar: av({ skin: "#e8c4a8", face: "ovale", eyes: "amande", brows: "fronces", hair: "long", hairColor: "#1a1418", top: "robe", topColor: "#8a2a2a", topColor2: "#ffb03a", bottom: "jupe", bottomColor: "#5a1a1a", shoes: "sandales", paint: "tribale", paintColor: "#ffb03a", earrings: "anneaux", lips: "#8a2a3a" }),
    sched: [[6, "sanctuaire", "pray"], [11, "cristaux", "look"], [15, "sanctuaire", "guard"], [22, "sanctuaire", "sleep"]],
    barks: { pray: ["Le Cœur bat trop fort aujourd'hui.", "Que la Reine dorme encore une nuit."], look: ["Les cristaux noircissent…"] } });
  def("brann", { name: "Brann", title: "forgeron", role: "main", color: "#6a4a3a",
    avatar: av({ skin: "#d8a07a", face: "large", eyes: "rond", brows: "epais", hair: "rase", hairColor: "#c96a3a", beard: "courte", top: "debardeur", topColor: "#4a3a30", bottom: "pantalon", bottomColor: "#3a2a20", shoes: "bottes", build: "costaud", scar: "oeil" }),
    sched: [[6, "forge", "forge"], [12, "geyser", "dig"], [15, "forge", "forge"], [21, "campV", "sleep"]],
    barks: { forge: ["CLANG ! … CLANG !", "L'obsidienne, ça se travaille à froid. Presque."], dig: ["Du soufre, encore du soufre."] } });

  // --- les maîtres des chants (point noir)
  def("vulcain", { name: "Vulcain", title: "le vieux souffleur", role: "magic", spell: "flamme", color: "#d0602a",
    avatar: av({ skin: "#c98d63", face: "rond", eyes: "joyeux", hair: "iroquoise", hairColor: "#ff7a3a", beard: "bouc", top: "kimono", topColor: "#d0602a", topColor2: "#ffd27a", bottom: "pagne", bottomColor: "#6a2a1a", shoes: "pieds", paint: "tribale", paintColor: "#ffd27a" }),
    sched: [[6, "campV", "idle"], [10, "soufriere", "pray"], [16, "campV", "cook"], [22, "campV", "sleep"]], barks: { pray: ["Fffff… Une flamme, c'est un souffle qui a de l'ambition."] } });
  def("tilo", { name: "Maître Tilo", title: "l'arbre qui parle", role: "magic", spell: "racine", color: "#4f8a3a", tree: true, sched: [[0, "vieilArbre", "idle"]],
    barks: { idle: ["Hmmm… jeune pousse…", "Mes racines touchent toute l'île."] } });
  def("ondine", { name: "Ondine", title: "la plongeuse", role: "magic", spell: "maree", color: "#3a8ac0",
    avatar: av({ skin: "#e8c4a0", face: "ovale", eyes: "grands", eyeColor: "#3a8ac0", hair: "ondule", hairColor: "#3ab0c0", top: "debardeur", topColor: "#3a8ac0", pattern: "pois", bottom: "legging", bottomColor: "#2a5a8a", shoes: "pieds", earrings: "coquillages", necklace: "perles" }),
    sched: [[6, "ponton", "swim"], [12, "recif", "swim"], [18, "hutte3", "idle"], [22, "hutte3", "sleep"]], barks: { swim: ["L'eau écoute ceux qui chantent juste."] } });
  def("zephyr", { name: "Zéphyr", title: "le meunier", role: "magic", spell: "bourrasque", color: "#7aa0c0",
    avatar: av({ skin: "#f0d0b0", face: "long", eyes: "rond", hair: "petard", hairColor: "#f4f4f4", top: "chemise", topColor: "#e8e8f0", topColor2: "#7aa0c0", bottom: "pantalon", bottomColor: "#7aa0c0", shoes: "sandales", hat: "bonnet", hatColor: "#7aa0c0", mustache: "guidon" }),
    sched: [[6, "moulin3", "idle"], [14, "pierres", "look"], [19, "moulin3", "sleep"]], barks: { idle: ["Le vent a la flemme, aujourd'hui.", "Fouuu !"] } });
  def("luciole", { name: "Sœur Luciole", title: "gardienne de la lueur", role: "magic", spell: "lueur", color: "#c0b040",
    avatar: av({ skin: "#e8d0b8", face: "rond", eyes: "brillants", eyeColor: "#e0c040", hair: "carre", hairColor: "#2a2a2a", top: "robe", topColor: "#2a3a4a", topColor2: "#ffe08a", pattern: "etoiles", bottom: "jupe", bottomColor: "#2a3a4a", shoes: "sandales", halo: "oui", glitter: "paillettes" }),
    sched: [[8, "pilotis1", "sleep"], [17, "lanterne3", "pray"], [21, "roseaux", "light"], [4, "pilotis1", "idle"]], barks: { light: ["Même la plus petite lueur fait reculer la nuit."] } });
  def("grumo", { name: "Grumo", title: "le golem gris", role: "magic", spell: "onde", color: "#7a7a88", golem: true,
    sched: [[0, "ruinesF", "idle"], [12, "champF", "walk"], [18, "ruinesF", "sleep"]], barks: { idle: ["GRUMO… GARDE… PIERRE.", "BOUM ?"] } });

  // --- les autres habitants (petites quêtes)
  def("tim", { name: "Tim", title: "mousse de la Mouette", color: "#4a7ab0",
    avatar: av({ skin: "#f0c8a8", face: "rond", eyes: "grands", hair: "meche", hairColor: "#d8a040", top: "tshirt", topColor: "#ffffff", pattern: "rayures", topColor2: "#4a7ab0", bottom: "short", bottomColor: "#4a7ab0", shoes: "pieds", hat: "casquette", hatColor: "#4a7ab0", freckles: 1 }),
    sched: [[7, "camp", "play"], [12, "plage", "dig"], [18, "campFeu", "idle"], [22, "tente1", "sleep"]], barks: { play: ["Tu as vu un harmonica ? Rouge, en fer ?"], dig: ["Il est forcément quelque part !"] } });
  def("jojo", { name: "Jojo", title: "cuisinier de la Mouette", color: "#c97a3a",
    avatar: av({ skin: "#8a5a3c", face: "large", eyes: "joyeux", hair: "rase", hairColor: "#1a1410", mustache: "epaisse", top: "chemise", topColor: "#ffffff", bottom: "pantalon", bottomColor: "#3a3a3a", shoes: "sandales", hat: "bob", hatColor: "#ffffff", build: "costaud" }),
    sched: [[6, "campFeu", "cook"], [11, "champ", "dig"], [15, "campFeu", "cook"], [22, "tente2", "sleep"]], barks: { cook: ["Il me manque juste… UN ingrédient.", "Ça sent bon, hein ?"] } });
  def("rosalie", { name: "Dame Rosalie", title: "passagère distinguée", color: "#d06a9a",
    avatar: av({ skin: "#fbe0d0", face: "coeur", eyes: "amande", lashes: "longs", hair: "chignon", hairColor: "#c96a8a", top: "robe", topColor: "#ff9ac0", topColor2: "#ffffff", pattern: "fleurs", bottom: "jupe", bottomColor: "#ff9ac0", shoes: "sandales", hat: "fleurs", hatColor: "#ffd0e0", necklace: "perles", earrings: "perles", lips: "#e04a7a", glasses: "soleil" }),
    sched: [[8, "tente2", "idle"], [11, "dune", "look"], [17, "campFeu", "idle"], [21, "tente2", "sleep"]], barks: { look: ["Quel soleil ! Ma peau, ma pauvre peau !", "Coco, mon chéri, où es-tu ?"] } });
  def("maelle", { name: "Maëlle", title: "navigatrice", color: "#3a6a6a",
    avatar: av({ skin: "#e0b48a", face: "ovale", eyes: "amande", brows: "fins", hair: "queue", hairColor: "#5a3a2a", top: "veste", topColor: "#3a6a6a", topColor2: "#ffffff", bottom: "pantalon", bottomColor: "#2a3a3a", shoes: "bottes", hat: "bandana", hatColor: "#c94a4a" }),
    sched: [[6, "epave", "read"], [12, "dune", "look"], [19, "camp", "read"], [23, "tente1", "sleep"]], barks: { read: ["La boussole tournait… je n'avais jamais vu ça.", "Ma carte… il m'en manque des morceaux."] } });
  def("nouk", { name: "Nouk", title: "enfant du marais", color: "#6a9a6a",
    avatar: av({ skin: "#c9a88a", face: "rond", eyes: "grands", hair: "afro", hairColor: "#2a2a20", top: "tshirt", topColor: "#9ad09a", bottom: "short", bottomColor: "#5a7a5a", shoes: "pieds", ears: "souris" }),
    sched: [[7, "pontonM", "play"], [12, "roseaux", "play"], [18, "pilotis2", "idle"], [21, "pilotis2", "sleep"]], barks: { play: ["Tu me trouveras jamais !", "Cache-cache ? Cache-cache !"] } });
  def("bodo", { name: "Bodo", title: "berger", color: "#8a8a5a",
    avatar: av({ skin: "#e0b48a", face: "large", eyes: "rond", hair: "boucle", hairColor: "#8a5a3c", top: "pull", topColor: "#e8dcc8", bottom: "pantalon", bottomColor: "#6a5a4a", shoes: "bottes", hat: "paille", hatColor: "#d8c080" }),
    sched: [[6, "paturage", "tend"], [18, "champF", "idle"], [22, "moulin1", "sleep"]], barks: { tend: ["… huit, neuf… il en manque encore !"] } });
  def("tobi", { name: "Tobi", title: "collectionneur de coquillages", color: "#c08a5a",
    avatar: av({ skin: "#f0c8a8", face: "long", eyes: "rond", hair: "frange", hairColor: "#8a8a8a", top: "chemise", topColor: "#ffe08a", pattern: "carreaux", bottom: "short", bottomColor: "#8a6a4a", shoes: "sandales", glasses: "monocle", hat: "paille" }),
    sched: [[6, "recif", "dig"], [12, "dune", "dig"], [17, "port", "idle"], [22, "hutte3", "sleep"]], barks: { dig: ["Celui-ci ? Banal. Celui-là ? BANAL."] } });
  def("arnaud", { name: "Arnaud", title: "l'Échoué d'avant", color: "#9ab0d0", ghost: true,
    avatar: av({ skin: "#dfe8f4", face: "long", eyes: "endormis", hair: "mi", hairColor: "#c0d0e8", top: "chemise", topColor: "#c0d0e8", bottom: "pantalon", bottomColor: "#a0b0c8", shoes: "bottes", aura: "#bcd4ff" }),
    sched: [[20, "cimetiere", "haunt"], [5, "cimetiere", "gone"]], barks: { haunt: ["Louise… attends-moi…", "Ne descendez pas au Cœur… ou alors… ensemble."] } });
  def("nana", { name: "Nana", title: "la reine des quiz", color: "#a06ad0",
    avatar: av({ skin: "#8a5a3c", face: "coeur", eyes: "joyeux", hair: "macarons", hairColor: "#1a1410", top: "tshirt", topColor: "#c9a3e8", pattern: "coeurs", bottom: "jupe", bottomColor: "#8a6ad0", shoes: "baskets", earrings: "etoiles" }),
    sched: [[7, "villageEst", "play"], [12, "prairie", "dance"], [18, "villageFeu", "dance"], [22, "villageEst", "sleep"]], barks: { dance: ["Une question, une seule ! Prêts ?", "♪ La la la ♪"] } });

  // ---------------------------------------------------------------- position selon l'heure
  const routeCache = new Map();
  function route(a, b) { // chemin entre deux lieux : en ligne droite, ou par le pont le plus proche s'il y a une rivière
    const key = a + ">" + b; if (routeCache.has(key)) return routeCache.get(key);
    const A = W(a), B = W(b), w = typeof Game !== "undefined" && Game.world ? Game.world : null;
    let pts = [A, B];
    if (w) {
      const clear = (P, Q) => { const n = Math.ceil(Math.hypot(Q.x - P.x, Q.y - P.y) / 120); for (let i = 1; i < n; i++) if (!w.walkable(P.x + (Q.x - P.x) * i / n, P.y + (Q.y - P.y) * i / n)) return false; return true; };
      if (!clear(A, B)) { let best = null; for (const br of KALUA.BRIDGES) { const P = { x: br.x * K, y: br.y * K }, d = Math.hypot(P.x - A.x, P.y - A.y) + Math.hypot(B.x - P.x, B.y - P.y); if (!best || d < best.d) best = { d, P }; } if (best) pts = [A, best.P, B]; }
    }
    routeCache.set(key, pts); return pts;
  }
  const along = (pts, k) => { let total = 0; const segs = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); segs.push(d); total += d; }
    let rem = k * total; for (let i = 0; i < segs.length; i++) { if (rem <= segs[i] || i === segs.length - 1) { const q = segs[i] ? Math.min(1, rem / segs[i]) : 1; return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * q, y: pts[i].y + (pts[i + 1].y - pts[i].y) * q, right: pts[i + 1].x > pts[i].x }; } rem -= segs[i]; } return pts[pts.length - 1]; };
  function slot(n, h) { // l'entrée de l'emploi du temps à l'heure h (les heures tournent sur 24 h)
    const s = n.sched; let cur = s[s.length - 1], prev = s[s.length - 2] || cur, start = cur[0];
    const sorted = [...s].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < sorted.length; i++) if (h >= sorted[i][0]) { cur = sorted[i]; prev = sorted[(i - 1 + sorted.length) % sorted.length]; start = cur[0]; }
    if (h < sorted[0][0]) { cur = sorted[sorted.length - 1]; prev = sorted[sorted.length - 2] || cur; start = cur[0] - 24; }
    return { cur, prev, since: h - start };
  }
  let hook = null; // fêtes : les habitants se rassemblent sur la place
  const override = {}; // positions imposées par l'histoire (escorte, scène…)
  function state(n, T) {
    if (hook) { const r = hook(n, T); if (r) return r; }
    if (override[n.id]) { const o = override[n.id]; return { x: o.x, y: o.y, act: o.act || "idle", moving: Boolean(o.moving), dir: o.dir || "down", spot: null }; }
    const h = hourAt(T), { cur, prev, since } = slot(n, h);
    const WALK = .6; // il faut 0,6 h (36 s) pour aller d'un lieu à l'autre
    if (since < WALK && prev[1] !== cur[1]) {
      const p = along(route(prev[1], cur[1]), since / WALK);
      return { x: p.x, y: p.y, act: "walk", moving: true, dir: p.right ? "right" : "left", spot: cur[1] };
    }
    // sur place : petits pas autour du lieu (déterministe)
    const base = W(cur[1]), seed = n.id.length * 7 + n.id.charCodeAt(0);
    const still = ["shop", "sleep", "fish", "pray", "read", "forge", "star", "cook", "guard", "haunt"].includes(cur[2]);
    const r = still ? 0 : 26, ph = T / 9 + seed;
    const x = base.x + Math.cos(ph) * r + (KALUA.hash(seed, 1) - .5) * 30, y = base.y + Math.sin(ph * 1.3) * r * .5;
    const moving = !still && Math.abs(Math.sin(ph)) > .3;
    return { x, y, act: cur[2], moving, dir: still ? (cur[2] === "fish" || cur[2] === "look" ? "up" : "down") : (Math.cos(ph + 1.57) > 0 ? "left" : "right"), spot: cur[1] };
  }

  // ---------------------------------------------------------------- présence (histoire)
  function present(n) {
    if (typeof Prog === "undefined") return true;
    if (Prog.isDead(n.id)) return false;
    if (n.homeAt) { const h = hourAt(Net.now()); if (h >= n.homeAt[0] || h < n.homeAt[1]) return false; }
    if (n.id === "arnaud") { const h = hourAt(Net.now()); return h >= 20 || h < 5; }
    if (n.id === "nalia" && !Prog.flag("intro_done")) return false;
    if (typeof Story !== "undefined" && Story.hidden && Story.hidden(n.id)) return false;
    return true;
  }
  // marqueur au-dessus de la tête : "red" (grande quête), "black" (chant à apprendre), "talk" (!), null
  const marker = (n) => (typeof Story !== "undefined" && Story.marker ? Story.marker(n.id) : null);

  // ---------------------------------------------------------------- dessin
  const props = {
    fish(c, t) { c.strokeStyle = "#8a6a3a"; c.lineWidth = 2; c.beginPath(); c.moveTo(10, -30); c.lineTo(46, -64); c.stroke(); c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = .8; c.beginPath(); c.moveTo(46, -64); c.lineTo(48 + Math.sin(t * 2) * 2, -2); c.stroke(); },
    sleep(c, t) { c.fillStyle = "#6b5050"; c.font = "800 13px ui-rounded"; for (let i = 0; i < 3; i++) { const k = (t * .6 + i / 3) % 1; c.globalAlpha = 1 - k; c.fillText("z", 12 + k * 14, -60 - k * 30); } c.globalAlpha = 1; },
    cook(c, t) { c.fillStyle = "#6b4630"; c.fillRect(14, -6, 26, 5); c.fillStyle = "#4a4a4a"; c.beginPath(); c.arc(27, -14, 10, 0, Math.PI); c.fill(); for (let i = 0; i < 3; i++) { const k = (t * .5 + i / 3) % 1; c.globalAlpha = .5 * (1 - k); c.fillStyle = "#fff"; c.beginPath(); c.arc(27 + Math.sin(k * 6) * 4, -24 - k * 40, 4 + k * 6, 0, TAU); c.fill(); } c.globalAlpha = 1; },
    forge(c, t) { c.fillStyle = "#3a3a3a"; c.fillRect(14, -16, 26, 14); if (Math.sin(t * 6) > .9) { c.fillStyle = "#ffd27a"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(27 + (Math.random() - .5) * 20, -22 - Math.random() * 14, 1.6, 0, TAU); c.fill(); } } },
    star(c, t) { c.fillStyle = "#c08a3a"; c.save(); c.translate(10, -50); c.rotate(-.8); c.fillRect(0, -3, 30, 6); c.restore(); },
    light(c, t) { c.globalAlpha = .7 + .3 * Math.sin(t * 5); c.fillStyle = "#8ad0ff"; c.beginPath(); c.arc(16, -46, 6, 0, TAU); c.fill(); c.globalAlpha = 1; },
    pray(c, t) { c.globalAlpha = .4 + .3 * Math.sin(t * 2); c.fillStyle = "#fff6c8"; c.beginPath(); c.arc(0, -40, 34, 0, TAU); c.fill(); c.globalAlpha = 1; },
    swim(c, t) { c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = 2; c.beginPath(); c.ellipse(0, -4, 26 + Math.sin(t * 3) * 3, 7, 0, 0, TAU); c.stroke(); },
    dig(c, t) { if (Math.sin(t * 5) > .6) { c.fillStyle = "#e0c090"; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(14 + i * 4, -4 - Math.random() * 10, 2, 0, TAU); c.fill(); } } },
    dance(c, t) { c.fillStyle = "#ff7f9f"; c.font = "700 14px system-ui"; c.fillText("♪", 14 + Math.sin(t * 3) * 6, -70 - (t * 20) % 20); },
    sing(c, t) { props.dance(c, t); },
  };
  function drawTree(c, t, talking) { // Maître Tilo
    c.fillStyle = "rgba(40,50,30,.2)"; c.beginPath(); c.ellipse(0, 4, 60, 14, 0, 0, TAU); c.fill();
    c.fillStyle = "#6b4a34"; c.beginPath(); c.moveTo(-26, 0); c.quadraticCurveTo(-18, -80, -30, -140); c.lineTo(30, -140); c.quadraticCurveTo(18, -80, 26, 0); c.fill();
    for (const [x, y, r, col] of [[-50, -160, 50, "#3f8a4a"], [40, -170, 56, "#4f9a52"], [0, -210, 60, "#5aa85a"], [-10, -150, 40, "#3f7a3f"]]) { c.fillStyle = col; c.beginPath(); c.arc(x + Math.sin(t + x) * 2, y, r, 0, TAU); c.fill(); }
    c.fillStyle = "#2a1a10"; c.beginPath(); c.ellipse(-10, -80, 4, Math.abs(Math.sin(t * .4)) > .05 ? 5 : .5, 0, 0, TAU); c.ellipse(12, -80, 4, Math.abs(Math.sin(t * .4)) > .05 ? 5 : .5, 0, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(1, -60, 9, talking ? 6 : 2, 0, 0, TAU); c.fill(); c.fillStyle = "#e8e0c0"; c.fillRect(-20, -95, 14, 3); c.fillRect(6, -95, 14, 3);
  }
  function drawGolem(c, t, moving) {
    c.fillStyle = "rgba(40,50,30,.2)"; c.beginPath(); c.ellipse(0, 3, 30, 8, 0, 0, TAU); c.fill();
    const b = moving ? Math.abs(Math.sin(t * 4)) * 4 : 0; c.translate(0, -b);
    c.fillStyle = "#8a8a96"; c.beginPath(); c.roundRect(-24, -62, 48, 50, 10); c.fill(); c.fillStyle = "#7a7a86"; c.fillRect(-18, -14, 12, 14); c.fillRect(6, -14, 12, 14);
    c.beginPath(); c.roundRect(-36, -58, 14, 34, 6); c.roundRect(22, -58, 14, 34, 6); c.fill(); c.fillStyle = "#9a9aa6"; c.beginPath(); c.roundRect(-16, -86, 32, 28, 8); c.fill();
    c.fillStyle = "#7ae0e0"; c.beginPath(); c.arc(-6, -74, 3, 0, TAU); c.arc(6, -74, 3, 0, TAU); c.fill(); c.fillStyle = "#5a9a5a"; c.beginPath(); c.arc(-12, -86, 6, Math.PI, 0); c.fill();
  }
  function bubble(c, x, y, text) {
    c.font = "700 12px ui-rounded, -apple-system, system-ui"; const w = Math.min(220, c.measureText(text).width + 18);
    c.fillStyle = "rgba(255,255,255,.95)"; c.beginPath(); c.roundRect(x - w / 2, y - 26, w, 24, 12); c.fill(); c.beginPath(); c.moveTo(x - 5, y - 3); c.lineTo(x, y + 4); c.lineTo(x + 5, y - 3); c.fill();
    c.fillStyle = "#5a4040"; c.textAlign = "center"; c.fillText(text.length > 34 ? text.slice(0, 33) + "…" : text, x, y - 10);
  }
  function drawMarker(c, kind, t) {
    if (!kind) return;
    const y = -112 + Math.sin(t * 3) * 3;
    c.fillStyle = "#fff"; c.beginPath(); c.arc(0, y, 9, 0, TAU); c.fill();
    c.fillStyle = kind === "red" ? "#e0303a" : kind === "black" ? "#1a1418" : "#ffb020"; c.beginPath(); c.arc(0, y, 6.5, 0, TAU); c.fill();
    if (kind === "talk") { c.fillStyle = "#fff"; c.font = "900 10px system-ui"; c.textAlign = "center"; c.fillText("!", 0, y + 3.5); }
  }

  const list = Object.values(L);
  const barkState = new Map();
  function visible(view, T, out) {
    for (const n of list) {
      if (!present(n)) continue;
      const s = state(n, T); if (s.x < view.x0 - 120 || s.x > view.x1 + 120 || s.y < view.y0 - 160 || s.y > view.y1 + 160) continue;
      out.push({ y: s.y, npc: n, s });
    }
    return out;
  }
  function draw(c, n, s, t, nearMe) {
    c.save(); c.translate(s.x, s.y);
    if (n.ghost) c.globalAlpha = .55 + .15 * Math.sin(t * 2);
    if (s.act === "pray" || n.id === "nalia") props.pray(c, t);
    if (n.tree) drawTree(c, t, nearMe);
    else if (n.golem) drawGolem(c, t, s.moving);
    else {
      c.save(); if (s.act === "swim") { c.beginPath(); c.rect(-60, -200, 120, 196); c.clip(); c.translate(0, 18); }
      c.scale(3.4, 3.4); c.translate(0, -14);
      if (s.act === "sleep") { c.rotate(-Math.PI / 2); c.translate(10, 6); }
      Avatar.draw(c, n.avatar, { dir: s.dir, walk: s.moving ? (t * 2.2 + n.id.length * .1) % 1 : null, swing: s.act === "forge" || s.act === "dig" ? Math.max(0, Math.sin(t * 5)) : 0, t });
      c.restore();
    }
    if (props[s.act]) props[s.act](c, t);
    c.globalAlpha = 1;
    drawMarker(c, marker(n.id), t);
    c.restore();
    // nom au-dessus de la tête
    c.font = "800 11px ui-rounded, system-ui"; c.textAlign = "center"; const nm = n.name, w = c.measureText(nm).width + 12;
    const ty = s.y - (n.tree ? 250 : 86);
    c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.roundRect(s.x - w / 2, ty - 10, w, 16, 8); c.fill(); c.fillStyle = n.color; c.fillText(nm, s.x, ty + 2);
    // petite phrase quand on passe à côté
    if (nearMe) {
      let b = barkState.get(n.id); const now = performance.now();
      if (!b || now > b.until + 9000) { const pool = (n.barks[s.act] || n.barks.idle || []); if (pool.length) { b = { text: pool[Math.floor(Math.random() * pool.length)], until: now + 3500 }; barkState.set(n.id, b); } }
      if (b && now < b.until) bubble(c, s.x, ty - 14, b.text);
    }
  }
  function nearest(x, y, T, reach = 70) {
    let best = null, bd = reach;
    for (const n of list) { if (!present(n)) continue; const s = state(n, T); const d = Math.hypot(s.x - x, (s.y - y) * 1.2) - (n.tree ? 50 : 0); if (d < bd) { bd = d; best = { n, s }; } }
    return best;
  }
  const get = (id) => L[id];
  const speaker = (id) => { const n = L[id]; if (!n) return { name: id }; return { name: n.name, avatar: n.avatar, color: n.color, draw: n.tree ? (c) => { c.translate(32, 120); c.scale(.42, .42); drawTree(c, 1, true); } : n.golem ? (c) => { c.translate(32, 70); c.scale(.62, .62); drawGolem(c, 1, false); } : null }; };
  const pos = (id, T) => state(L[id], T);
  const setOverride = (id, o) => { if (o) override[id] = o; else delete override[id]; };
  const add = (id, o) => { def(id, o); if (!list.includes(L[id])) list.push(L[id]); return L[id]; };
  return { setHook: (f) => { hook = f; }, add, props, av, L, list, SPOT, W, DAY, hourAt, visible, draw, nearest, get, speaker, pos, present, setOverride, drawTree, drawGolem, bubble };
})();
