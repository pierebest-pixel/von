/* Les Échoués de Kalua — catalogue de tous les objets : nom, catégorie, description, icône.
 * Catégories : res (ressource), food (nourriture, soigne), tool (outil/équipement), quest (objet de quête),
 * trophy (trophée de boss), cave (objet de grotte), faune (essences animales pour les Fils de vie). */
"use strict";

const ITEMS = (() => {
  // [nom, catégorie, description, emoji de secours si pas de dessin, valeur (soin ou dégâts)]
  const L = {
    // ---- ressources (dessins des maquettes)
    bois: ["Bois", "res", "Coupé dans les arbres de la jungle. Sert à presque tout.", "🪵"],
    boisflotte: ["Bois flotté", "res", "Blanchi par le sel. On en trouve sur les plages.", "🪵"],
    feuille: ["Feuille de palmier", "res", "Large et solide : toits, voiles, éventails.", "🌿"],
    coco: ["Noix de coco", "food", "Rafraîchissante. Rend 1 cœur.", "🥥", 1],
    coquillage: ["Coquillage", "res", "Joli et utile pour les bijoux.", "🐚"],
    sable: ["Sable", "res", "Du sable doré de la Côte.", "⏳"],
    cordage: ["Vieux cordage", "res", "Un bout de corde de la Mouette d'Argent.", "🪢"],
    perle: ["Perle", "res", "Rare. Les huîtres des récifs en cachent parfois.", "⚪"],
    liane: ["Liane", "res", "Souple et solide.", "🌱"],
    bambou: ["Bambou", "res", "Léger et creux.", "🎋"],
    banane: ["Banane", "food", "Sucrée. Rend 1 cœur.", "🍌", 1],
    champignon: ["Champignon", "food", "Comestible… celui-là. Rend 1 cœur.", "🍄", 1],
    plume: ["Plume colorée", "faune", "Plume de perroquet de la jungle. Pleine de Souffle.", "🪶"],
    argile: ["Argile", "res", "Prise au bord de l'eau du marais.", "🟤"],
    roseau: ["Roseau", "res", "Pour les flûtes et les paniers.", "🌾"],
    gelee: ["Gelée gluante", "res", "Laissée par les grenouilles du marais. Colle tout.", "🟢"],
    herbe: ["Herbe médicinale", "res", "Mère Tikka en fait des remèdes.", "🌿"],
    lotus: ["Lotus", "res", "Fleur rare des nénuphars. Calme les esprits.", "🪷"],
    pierre: ["Pierre", "res", "Une bonne pierre des falaises.", "🪨"],
    silex: ["Silex", "res", "Tranchant. Fait des étincelles.", "🔪"],
    fer: ["Minerai de fer", "res", "Il faut une pioche pour l'extraire.", "⛏️"],
    laine: ["Laine", "faune", "Douce laine de mouton des falaises.", "🧶"],
    obsidienne: ["Obsidienne", "res", "Verre noir du volcan. Très tranchant.", "🖤"],
    soufre: ["Soufre", "res", "Sent l'œuf pourri. Près des geysers.", "🟡"],
    cristalFeu: ["Cristal de feu", "res", "Brûlant au toucher. Bat comme un cœur.", "🔥"],
    cendre: ["Cendre", "res", "Cendre grise ordinaire… pas la Noire.", "🌫️"],
    viande: ["Viande", "food", "À cuire au feu de camp. Crue : rend 1 cœur.", "🍖", 1],
    cuir: ["Cuir", "faune", "Cuir épais de bête domestique ou de sanglier.", "🟫"],
    lait: ["Lait", "food", "Rend 2 cœurs.", "🥛", 2],
    oeuf: ["Œuf", "food", "Rend 1 cœur.", "🥚", 1],
    miel: ["Miel", "food", "Le miel des ruches du village. Rend 2 cœurs.", "🍯", 2],
    farine: ["Farine", "res", "Moulue au moulin du village.", "🌾"],
    poisson: ["Poisson", "food", "Rend 1 cœur, 2 s'il est cuit.", "🐟", 1],
    fil: ["Fil", "res", "Tressé à partir de fibres.", "🧵"],
    corde: ["Corde", "res", "Une vraie corde solide.", "🪢"],
    hache: ["Hache en pierre", "tool", "Coupe les arbres deux fois plus vite.", "🪓"],
    pioche: ["Pioche", "tool", "Casse les rochers et extrait le fer et l'obsidienne.", "⛏️"],
    canne: ["Canne à pêche", "tool", "Pour pêcher au bout des pontons.", "🎣"],
    torche: ["Torche", "tool", "Éclaire un peu les grottes sombres.", "🔦"],
    collier: ["Collier de coquillages", "quest", "Un joli collier.", "📿"],
    radeau: ["Radeau", "tool", "Un petit radeau de bambou.", "🛶"],
    potion: ["Potion de soin", "food", "Rend 4 cœurs.", "🧪", 4],
    brochette: ["Brochette", "food", "Viande cuite. Rend 3 cœurs.", "🍢", 3],
    // ---- nouvelles nourritures
    ragout: ["Ragoût de Jojo", "food", "La recette du cuisinier de la Mouette. Rend toute la vie.", "🍲", 99],
    the: ["Thé de lotus", "food", "Rend 2 cœurs et calme l'âme.", "🍵", 2],
    // ---- essences animales (Fils de vie)
    plumeAigle: ["Plume d'aigle", "faune", "Plume immense des falaises.", "🪶"],
    ecaille: ["Écaille de lézard", "faune", "Lisse et chaude.", "🦎"],
    ecailleCroco: ["Écaille de croco", "faune", "Épaisse comme une armure. Prise aux crocos des brumes.", "🐊"],
    corne: ["Corne", "faune", "Corne de bouquetin ou de chèvre.", "🦴"],
    carapace: ["Carapace", "faune", "Carapace de crabe ou de scarabée de lave.", "🦀"],
    defense: ["Défense de sanglier", "faune", "Pointue. Prise aux sangliers épineux.", "🐗"],
    plumeMouette: ["Plume de mouette", "faune", "Blanche et légère.", "🪶"],
    larmeDoree: ["Larme dorée", "faune", "Laissée par un animal doré. Contient un Souffle pur.", "💧"],
    // ---- équipement
    epeeCorail: ["Épée de corail", "tool", "Forgée par Brann. Dégâts ×2.", "🗡️", 2],
    lameObsidienne: ["Lame d'obsidienne", "tool", "La meilleure lame de Kalua. Dégâts ×3.", "⚔️", 3],
    conque: ["Conque d'appel", "tool", "Souffle dedans pour parler à Nalia où que tu sois.", "🐚"],
    bottes: ["Bottes de brume", "tool", "On ne s'enfonce plus dans la vase du marais.", "👢"],
    boussole: ["Boussole de Maëlle", "tool", "L'aiguille montre la grotte la plus proche.", "🧭"],
    // ---- grottes
    cle: ["Petite clé", "cave", "Ouvre une porte verrouillée de cette grotte.", "🗝️"],
    cleBoss: ["Grande clé", "cave", "Ouvre la porte du gardien de la grotte.", "🔑"],
    // ---- trophées des 12 Gardiens et des grottes
    couronneCorail: ["Couronne de corail", "trophy", "Sceau des Marées. Trophée du Roi Crabe Corail.", "👑"],
    encre: ["Encre magique", "trophy", "Sceau des Profondeurs. Laissée par le Petit Kraken.", "🖋️"],
    fourrure: ["Fourrure de mousse", "trophy", "Sceau de la Forêt. Du Grand Gorille Moussu.", "🟩"],
    ecailleLiane: ["Écaille-liane", "trophy", "Sceau des Racines. Du Serpent-Liane.", "🐍"],
    oeilTurquoise: ["Pierre-œil turquoise", "trophy", "Sceau de la Mémoire. Du Gardien du Temple.", "🔷"],
    couronneJonc: ["Couronne de jonc", "trophy", "Sceau des Eaux dormantes. De la Reine Grenouille.", "👑"],
    larmeBrume: ["Larme de brume", "trophy", "Sceau des Âmes. De l'Esprit des Brumes.", "💧"],
    corneEclair: ["Corne-éclair", "trophy", "Sceau de l'Orage. Du Bélier Tonnerre.", "⚡"],
    plumeDoree: ["Plume dorée", "trophy", "Sceau du Ciel. De l'Aigle-Roi.", "🪶"],
    pierreLune: ["Fragment de pierre-lune", "trophy", "Sceau de la Pierre. De la Gargouille.", "🌙"],
    ecailleDragon: ["Écaille de dragon", "trophy", "Sceau du Feu. Du Dragonnet de Lave.", "🐉"],
    plumePhenix: ["Plume de phénix", "trophy", "Sceau de la Renaissance. Du Phénix Cendré.", "🔥"],
    graineRacine: ["Graine-mère", "trophy", "Cœur de la Mère-Racine (Grotte 1).", "🌰"],
    nacre: ["Nacre royale", "trophy", "Coquille de l'Amiral Nacre (Grotte 2).", "🐚"],
    masque: ["Masque du Geôlier", "trophy", "Le visage que le Geôlier n'avait plus (Grotte 3).", "🎭"],
    notePerdue: ["Note perdue", "trophy", "La dernière note du Chant du Vent (Grotte 4).", "🎵"],
    // ---- quêtes
    harmonica: ["Harmonica de Tim", "quest", "Le seul souvenir de son père.", "🎵"],
    billeAuCoin: ["Bille d'Au Coin", "trophy", "La bille préférée d'Au Coin, toute bleue. Elle porte bonheur aux amoureux.", "🔵"],
    plumeauOr: ["Plumeau d'or", "trophy", "Le plumeau de Dame Plumeau. Il fait briller tout ce qu'il touche.", "🪶"],
    ballonEtoile: ["Ballon des Étoiles", "trophy", "Le ballon des Étoiles Filantes, couvert de petites étoiles dorées.", "⚽"],
    carapaceAncienne: ["Écaille de la Tortue Ancienne", "trophy", "Elle a cinq cents ans. Elle sent la mer et le sable chaud.", "🐢"],
    plumeLanterne: ["Plume-lanterne", "trophy", "Une plume du Hibou-Lanterne. Elle luit doucement dans le noir.", "🪶"],
    queueEtoilee: ["Poil d'étoile", "trophy", "Laissé par le Renard Céleste en riant. Il scintille.", "✨"],
    colis: ["Colis pour Brann", "quest", "Un paquet bien ficelé. « Fragile » est écrit dessus. Trois fois.", "📦"],
    timbre: ["Timbre de la Reine", "trophy", "Un timbre très rare, à l'effigie de la Reine Ilaïa. Léon en est très fier.", "📮"],
    feve: ["Fève de la galette", "trophy", "Trouvée dans la galette de Mamie Brioche. Tu es le roi (ou la reine) de Kalua !", "👑"],
    grandLivre: ["Le Grand Livre de Kalua", "trophy", "Un vieux livre de la bibliothèque. Il raconte le Cœur de l'île.", "📖"],
    couronneVillage: ["Couronne du village", "trophy", "Offerte par le maire Barnabé quand le château a été construit.", "👑"],
    lettreArnaud: ["Lettre d'Arnaud", "quest", "« Louise, si tu lis ceci… »", "✉️"],
    carteMarine: ["Carte marine déchirée", "quest", "Un morceau de la carte de Maëlle.", "🗺️"],
    journalBord: ["Journal de bord", "quest", "Le journal du capitaine Bastien.", "📔"],
    gouvernail: ["Gouvernail", "quest", "Le gouvernail de la Mouette d'Argent.", "☸️"],
    voile: ["Voile cousue", "quest", "Une voile de feuilles et de laine.", "⛵"],
    mat: ["Mât de bambou géant", "quest", "Un tronc de bambou lume, dur comme le fer.", "🎋"],
    goudron: ["Goudron de lave", "quest", "Pour rendre la coque étanche.", "⚫"],
    cloche: ["Battant de cloche", "quest", "Il vibre encore. Il vient de sous la mer.", "🔔"],
    flammeVolee: ["Flamme bleue", "quest", "Une flamme de lanterne des morts.", "🔵"],
    lanterne: ["Lanterne des morts", "quest", "Elle guide les âmes perdues.", "🏮"],
    poupee: ["Poupée de Mila", "quest", "Une poupée de jonc, usée par les années.", "🧸"],
    pierreChant: ["Pierre de chant", "quest", "Une pierre qui fredonne quand le vent passe.", "🪨"],
    lunette: ["Lunette d'Oro", "quest", "Une longue-vue en cuivre.", "🔭"],
    carteCiel: ["Carte du ciel", "quest", "Les constellations de Kalua.", "✨"],
    lanceKeo: ["Lance de Kéo", "quest", "Plantée devant le Temple.", "🔱"],
    sceauFragment: ["Éclat de sceau", "quest", "Un éclat de pierre lume gravé d'une spirale.", "🌀"],
    eventail: ["Éventail de palme", "quest", "Pour Dame Rosalie.", "🪭"],
    coqRare: ["Coquillage rare", "quest", "Un coquillage introuvable… ou presque.", "🐚"],
    moutonPerdu: ["Clochette de mouton", "quest", "La clochette d'un mouton égaré.", "🔔"],
  };
  const get = (id) => L[id] || [id, "res", "", "❔"];
  const name = (id) => get(id)[0];
  const cat = (id) => get(id)[1];
  const desc = (id) => get(id)[2];
  const val = (id) => get(id)[4] || 0;
  // dessine l'icône dans un contexte (dessin des maquettes si possible, sinon emoji)
  function draw(c, id, x, y, size) {
    if (Items.ids.includes(id)) return Items.draw(c, id, x, y, size / 24);
    c.save(); c.font = `${Math.round(size * .8)}px system-ui, "Apple Color Emoji"`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(get(id)[3], x, y + size * .04); c.restore();
  }
  // petite image HTML (pour les menus)
  const cache = new Map();
  function img(id, px = 40) {
    const k = id + ":" + px; if (cache.has(k)) return cache.get(k);
    const cv = document.createElement("canvas"), D = Math.min(window.devicePixelRatio || 1, 2); cv.width = cv.height = px * D;
    const c = cv.getContext("2d"); c.scale(D, D); draw(c, id, px / 2, px / 2, px * .82);
    const url = cv.toDataURL(); cache.set(k, url); return url;
  }
  return { L, get, name, cat, desc, val, draw, img, ids: Object.keys(L) };
})();
