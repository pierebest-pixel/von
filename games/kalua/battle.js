/* Les Échoués de Kalua — combats au tour par tour (grottes 2, 4, 8, les 12 Gardiens, les créatures secrètes, la phase finale).
 * Le joueur ne fait pas que « Attaquer » : chaque attaque a un TIMING (toucher au bon moment = coup critique),
 * chaque attaque ennemie peut être PARÉE au bon moment, les grosses attaques sont ANNONCÉES un tour avant,
 * et chaque Gardien a une mécanique qui demande un chant précis. */
"use strict";

const Battle = (() => {
  const TAU = Math.PI * 2;
  let B = null, ui = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const sleep = (ms) => (B && B.fast === 2 ? Promise.resolve() : new Promise((r) => setTimeout(r, B && B.fast ? ms * .3 : ms))); // fast = 2 : tests automatiques

  // ================================================================ ennemis du tour par tour
  // moves : { n: nom, k: type, d: dégâts, hits, st: [statut, tours], tele: texte d'annonce (attaque en 2 tours), w: poids }
  const M = (n, k, o = {}) => Object.assign({ n, k, d: 1, w: 1 }, o);
  const FOES = {
    // ---- Grotte 2 (Marine)
    crabeSoldat: { name: "Crabe soldat", hp: 7, draw: "crabeSoldat", moves: [M("Coup de pince", "hit"), M("Garde haute", "guard", { w: .5 })] },
    meduse: { name: "Méduse", hp: 5, draw: "meduse", moves: [M("Décharge", "hit", { st: ["choc", 1], w: .6 }), M("Caresse piquante", "hit")], weak: { lueur: 1.5 } },
    murene: { name: "Murène", hp: 8, draw: "murene", moves: [M("Morsure", "hit", { d: 2 }), M("Se cacher", "hide", { w: .5 })] },
    ermite: { name: "Bernard-soldat", hp: 6, draw: "ermite", moves: [M("Pince", "hit"), M("Coquille", "guard")] },
    mureneGeante: { name: "Murène géante", hp: 26, draw: "mureneGeante", scale: .7, mini: true, moves: [M("Morsure d'acier", "hit", { d: 2 }), M("Plonger dans son trou", "hide", { w: 1.2 }), M("Constriction", "hit", { st: ["lie", 1] }), M("Vague", "charge", { d: 3, tele: "La Murène géante s'enroule pour une énorme vague…" })],
      hint: "Quand elle se cache dans son trou, la Racine ou la Lueur la font sortir." },
    capitaineCrabe: { name: "Capitaine Crabe", hp: 30, draw: "capitaineCrabe", scale: .7, mini: true, adds: ["crabeSoldat", "crabeSoldat"], moves: [M("À l'abordage !", "summon", { sum: "crabeSoldat", w: .6 }), M("Coup de sabre", "hit", { d: 2 }), M("Soigner l'équipage", "healAll", { d: 3, w: .7 })],
      hint: "Il soigne ses soldats : abats-les d'abord, ou frappe tout le monde avec l'Onde." },
    amiralNacre: { name: "Amiral Nacre", hp: 60, draw: "amiralNacre", scale: .55, boss: true, music: "bossc2", phases: [1, .5],
      moves: [M("Canon à perles", "multi", { d: 1, hits: 3 }), M("Coquille de nacre", "shell", { w: .8 }), M("Pince royale", "hit", { d: 2 }), M("Marée noire", "charge", { d: 4, tele: "L'Amiral aspire toute l'eau de la grotte…" }), M("Appel de l'équipage", "summon", { sum: "crabeSoldat", w: .5 })],
      phase2: { moves: [M("Ruée hors de la coquille", "multi", { d: 2, hits: 2 }), M("Pince royale", "hit", { d: 3 }), M("Marée noire", "charge", { d: 5, tele: "L'Amiral, sans coquille, prépare une Marée noire furieuse !" })], text: "L'Amiral Nacre quitte sa coquille brisée ! Il est plus fragile… et furieux." },
      hint: "Dans sa coquille, il ne craint rien : l'Onde ou la Bourrasque la renversent." },
    // ---- Grotte 4 (Vent)
    harpie: { name: "Harpie", hp: 6, draw: "harpie", moves: [M("Serres", "hit"), M("Envol", "fly", { w: .5 })], weak: { bourrasque: 2 } },
    ventin: { name: "Ventin", hp: 5, draw: "ventin", moves: [M("Rafale", "hit"), M("Tourbillon", "hit", { st: ["vertige", 1], w: .5 })], weak: { flamme: 1.5 } },
    caillou: { name: "Caillou vivant", hp: 9, draw: "caillou", moves: [M("Roulade", "hit", { d: 2 }), M("Se figer", "guard")], weak: { onde: 2 } },
    harpieReine: { name: "Harpie-Reine", hp: 28, draw: "harpieReine", scale: .6, mini: true, moves: [M("Ouragan de plumes", "multi", { d: 1, hits: 3 }), M("Envol royal", "fly", { w: 1 }), M("Cri perçant", "status", { st: ["peur", 2] })], weak: { bourrasque: 2 },
      hint: "Quand elle s'envole, seule la Bourrasque peut la faire tomber." },
    golemVent: { name: "Golem du vent", hp: 34, draw: "golemVent", scale: .55, mini: true, moves: [M("Poing de granit", "hit", { d: 2 }), M("Rempart de pierre", "shield", { w: .8 }), M("Éboulement", "charge", { d: 4, tele: "Le Golem soulève un rocher énorme…" })], weak: { onde: 2 },
      hint: "Son rempart de pierre arrête les coups : l'Onde le fissure." },
    tempestaire: { name: "Tempestaire", hp: 70, draw: "tempestaire", scale: .5, boss: true, music: "bossc4", phases: [1, .5], notes: true,
      moves: [M("Note tranchante", "hit", { d: 2 }), M("Vent glacé", "status", { st: ["gel", 1] }), M("Chanter une note", "note", { w: 1.4 }), M("Plumes d'orage", "multi", { d: 1, hits: 3 })],
      phase2: { moves: [M("Chanter une note", "note", { w: 2 }), M("Éclair", "hit", { d: 3 }), M("Plumes d'orage", "multi", { d: 1, hits: 4 })], text: "Le Tempestaire se souvient du Chant du Vent… à l'envers !" },
      hint: "Chaque note qu'il chante prépare la Grande Tempête (à 3 notes). La Bourrasque efface une note." },
    // ---- Grotte 8 (Étoiles) — pas de boss final (réservé)
    etoile: { name: "Petite étoile", hp: 6, draw: "etoile", moves: [M("Éclat", "hit"), M("Scintiller", "dodge", { w: .5 })], weak: { lueur: .5, maree: 1.5 } },
    astre: { name: "Astre errant", hp: 9, draw: "etoile", scale: 1.4, moves: [M("Pluie d'étoiles", "multi", { d: 1, hits: 2 }), M("Gravité", "status", { st: ["lourd", 2] })] },
    etoileFilante: { name: "Étoile filante", hp: 30, draw: "etoileFilante", scale: .55, mini: true, speed: 2, moves: [M("Traînée", "hit", { d: 2 }), M("Éclat aveuglant", "status", { st: ["aveugle", 2] }), M("Rebond", "multi", { d: 1, hits: 2 })],
      hint: "Elle agit deux fois par tour ! La Racine la ralentit." },
    gardienConstellation: { name: "Gardien des Constellations", hp: 40, draw: "gardienConstellation", scale: .55, mini: true, adds: ["etoile", "etoile"], moves: [M("Relier les étoiles", "healAll", { d: 4 }), M("Rayon stellaire", "charge", { d: 4, tele: "Les étoiles s'alignent…" }), M("Comète", "hit", { d: 2 })],
      hint: "Les petites étoiles le soignent : éteins-les d'abord." },
    // ---- créatures secrètes des îles
    tortue: { name: "Tortue Ancienne", hp: 50, draw: "tortue", scale: .7, boss: true, music: "sad", secret: true, moves: [M("Rentrer la tête", "guard", { w: 1.5 }), M("Vague lente", "hit", { d: 2 }), M("Sagesse", "heal", { d: 5, w: .6 })], weak: { onde: 2 },
      hint: "Elle est presque invincible dans sa carapace. L'Onde la fait vibrer.", calm: "Elle ne voulait pas se battre. Elle s'éloigne vers la mer." },
    hibou: { name: "Hibou-Lanterne", hp: 36, draw: "hibou", scale: .7, boss: true, music: "night", secret: true, moves: [M("Berceuse", "status", { st: ["sommeil", 1], w: 1.2 }), M("Serres", "hit", { d: 2 }), M("Éteindre la lune", "status", { st: ["aveugle", 2] })], weak: { lueur: 2 },
      hint: "Sa berceuse endort. La Lueur le dérange beaucoup.", calm: "Le hibou s'envole en hululant doucement. Une plume tombe à tes pieds." },
    renard: { name: "Renard Céleste", hp: 40, draw: "renard", scale: .7, boss: true, music: "iles", secret: true, illusion: true, moves: [M("Illusions", "illusion", { w: 1 }), M("Morsure d'étoile", "hit", { d: 2 }), M("Rire", "status", { st: ["peur", 1] })],
      hint: "Ses illusions te font rater. La Lueur montre le vrai renard.", calm: "Le renard rit, fait une révérence, et disparaît dans un nuage d'étoiles." },
  };

  // ---- les 12 Gardiens (boss optionnels)
  const G = (id, o) => { FOES[id] = Object.assign({ boss: true, music: "boss" + id, phases: [1, .5] }, o); };
  G("B1", { name: "Roi Crabe Corail", hp: 48, draw: "B1", scale: .55, reward: "couronneCorail",
    moves: [M("Pince-tenaille", "hit", { d: 2 }), M("Bulles royales", "multi", { d: 1, hits: 3 }), M("Carapace de corail", "shield", { w: .8 })],
    phase2: { moves: [M("Pince-tenaille", "hit", { d: 2 }), M("Marée montante", "charge", { d: 4, tele: "Le Roi Crabe appelle la marée… elle monte !" }), M("Carapace de corail", "shield", { w: .6 }), M("Bulles royales", "multi", { d: 1, hits: 4 })], text: "« Mon royaume ! Mon beau royaume de corail ! » Le Roi Crabe pleure de rage." },
    hint: "Sa carapace de corail bloque tous les coups : l'Onde la brise. La Marée te protège de la marée montante.",
    lines: ["Qui ose entrer dans mon royaume ?", "Mes sujets… où sont mes sujets ?"] });
  G("B2", { name: "Petit Kraken", hp: 44, draw: "B2", scale: .55, reward: "encre",
    moves: [M("Tentacule", "hit", { d: 2 }), M("Nuage d'encre", "status", { st: ["aveugle", 2] }), M("Plonger", "hide", { w: .8 })],
    phase2: { moves: [M("Panique !", "multi", { d: 1, hits: 4 }), M("Nuage d'encre", "status", { st: ["aveugle", 2] }), M("Étreinte du bateau", "charge", { d: 4, tele: "Le Petit Kraken enroule ses tentacules autour de la coque…" })], text: "Le Petit Kraken panique ! Il frappe dans tous les sens." },
    hint: "Quand il plonge, la Lueur ou la Racine le ramènent. La Lueur dissipe l'encre." });
  G("B3", { name: "Grand Gorille Moussu", hp: 56, draw: "B3", scale: .55, reward: "fourrure", weak: { flamme: 1.5 },
    moves: [M("Frappe-poitrine", "buff", { w: .7 }), M("Lancer de rocher", "hit", { d: 2 }), M("Mousse guérisseuse", "heal", { d: 6, w: .8 })],
    phase2: { moves: [M("Double frappe", "multi", { d: 2, hits: 2 }), M("Mousse guérisseuse", "heal", { d: 6, w: .5 }), M("Rage de la forêt", "charge", { d: 5, tele: "Le Gorille arrache un arbre entier…" })], text: "Le Gorille rugit : la mousse sur son dos devient rouge." },
    hint: "La mousse le soigne. Une Flamme la brûle : il ne pourra plus se soigner pendant 3 tours." });
  G("B4", { name: "Serpent-Liane", hp: 50, draw: "B4", scale: .5, reward: "ecailleLiane", weak: { flamme: 1.5 }, resist: { racine: 0 },
    moves: [M("Étreinte", "status", { st: ["lie", 2], w: 1 }), M("Morsure venimeuse", "hit", { d: 1, st: ["poison", 3] }), M("Mue", "heal", { d: 5, w: .6 })],
    phase2: { moves: [M("Étreinte", "status", { st: ["lie", 2] }), M("Crochets", "multi", { d: 1, hits: 3 }), M("Racines mortes", "charge", { d: 4, tele: "Le Serpent-Liane s'enroule autour du vieil arbre et serre…" })], text: "Le vieil arbre gémit. Le Serpent serre plus fort." },
    hint: "Ligoté, tu ne peux plus attaquer : l'Onde te libère. La Racine ne lui fait rien (c'est une liane !)." });
  G("B5", { name: "Gardien du Temple", hp: 70, draw: "B5", scale: .5, reward: "oeilTurquoise",
    moves: [M("Poing de pierre", "hit", { d: 2 }), M("Regard turquoise", "charge", { d: 5, tele: "La pierre-œil du Gardien se met à briller…" }), M("Bouclier de pierre", "shield", { w: .7 })],
    phase2: { moves: [M("Poing de pierre", "hit", { d: 2, target: "ally" }), M("Regard turquoise", "charge", { d: 6, tele: "Le Gardien vise Kéo de sa pierre-œil !", target: "ally" }), M("Séisme", "multi", { d: 1, hits: 3 })], text: "« LA PORTE NE DOIT PAS S'OUVRIR. » Le Gardien se tourne vers Kéo." },
    hint: "Le Regard turquoise met un tour à se charger : pare-le, ou protège-toi avec la Marée. Son bouclier de pierre cède à l'Onde." });
  G("B6", { name: "Reine Grenouille", hp: 52, draw: "B6", scale: .55, reward: "couronneJonc", weak: { bourrasque: 1.6 },
    moves: [M("Langue royale", "hit", { d: 2 }), M("Chant hypnotique", "status", { st: ["sommeil", 1] }), M("Caprice", "summon", { sum: "grenouilleGarde", w: .6 })],
    phase2: { moves: [M("Langue royale", "multi", { d: 1, hits: 3 }), M("Chant des noyés", "charge", { d: 4, tele: "La Reine ouvre la bouche : des voix de noyés en sortent…" }), M("Chant hypnotique", "status", { st: ["sommeil", 1] })], text: "« Mes voix ! Vous n'aurez pas mes voix ! »" },
    hint: "Le vent la déséquilibre sur son nénuphar (Bourrasque). La Lueur te réveille du sommeil." });
  FOES.grenouilleGarde = { name: "Grenouille garde", hp: 5, draw: "crapaud", moves: [M("Coup de langue", "hit")] };
  G("B7", { name: "Esprit des Brumes", hp: 60, draw: "B7", scale: .45, reward: "larmeBrume", weak: { lueur: 2 }, mist: true,
    moves: [M("Voix des noyés", "multi", { d: 1, hits: 3 }), M("Se fondre dans la brume", "hide", { w: 1 }), M("Froid des tombes", "status", { st: ["gel", 1] })],
    phase2: { moves: [M("Voix des noyés", "multi", { d: 1, hits: 4 }), M("Dernier souffle", "charge", { d: 5, tele: "Toutes les âmes inspirent en même temps…" }), M("Se fondre dans la brume", "hide")], text: "Un visage d'enfant apparaît dans la brume : Mila !" },
    hint: "Dans la brume, il est intouchable : la Lueur le révèle et lui fait double dégâts." });
  G("B8", { name: "Bélier Tonnerre", hp: 58, draw: "B8", scale: .55, reward: "corneEclair",
    moves: [M("Coup de cornes", "hit", { d: 2 }), M("Charge électrique", "charge", { d: 5, tele: "Le Bélier gratte le sol, la foudre crépite dans sa laine…" }), M("Laine statique", "static", { w: .7 })],
    phase2: { moves: [M("Coup de cornes", "hit", { d: 2 }), M("Charge électrique", "charge", { d: 5, tele: "Le Bélier fonce, plus vite que l'éclair !" }), M("Orage", "multi", { d: 1, hits: 3 })], text: "Le ciel se couvre : l'orage tombe à chaque tour.", storm: true },
    hint: "La Racine l'immobilise et annule sa charge. Avec la laine statique, frapper te fait mal : utilise les chants." });
  G("B9", { name: "Aigle-Roi", hp: 54, draw: "B9", scale: .45, reward: "plumeDoree", weak: { bourrasque: 1.5 },
    moves: [M("Piqué", "hit", { d: 3 }), M("Envol", "fly", { w: 1 }), M("Pluie de plumes", "multi", { d: 1, hits: 3 })],
    phase2: { moves: [M("Piqué royal", "charge", { d: 5, tele: "L'Aigle-Roi monte très haut dans le ciel…" }), M("Envol", "fly"), M("Pluie de plumes", "multi", { d: 1, hits: 4 })], text: "« Le Phare ne doit pas se rallumer ! »" },
    hint: "En vol, tes coups ne l'atteignent pas : la Bourrasque le fait tomber (il est alors étourdi)." });
  G("B10", { name: "Gargouille des Ruines", hp: 60, draw: "B10", scale: .5, reward: "pierreLune", stoneForm: true,
    moves: [M("Griffes", "hit", { d: 2 }), M("Se changer en pierre", "stone", { w: 1 }), M("Cri des ruines", "status", { st: ["peur", 2] })],
    phase2: { moves: [M("Griffes", "multi", { d: 2, hits: 2 }), M("Se changer en pierre", "stone"), M("Chute des ruines", "charge", { d: 5, tele: "La Gargouille s'accroche au plafond…" })], text: "Des fissures lumineuses courent sur la Gargouille." },
    hint: "Changée en pierre, elle se soigne et ne craint rien… sauf l'Onde, qui la brise et l'étourdit." });
  G("B11", { name: "Dragonnet de Lave", hp: 62, draw: "B11", scale: .5, reward: "ecailleDragon", weak: { maree: 2 }, resist: { flamme: 0 },
    moves: [M("Souffle de feu", "hit", { d: 3, st: ["brule", 2], el: "feu" }), M("Petite sieste", "sleep", { w: .8 }), M("Coup de queue", "hit", { d: 2 })],
    phase2: { moves: [M("Souffle de feu", "multi", { d: 2, hits: 2, el: "feu" }), M("Éruption", "charge", { d: 5, tele: "Le Dragonnet gonfle ses joues : la lave bouillonne !", el: "feu" })], text: "Le Dragonnet est réveillé pour de bon !" },
    hint: "La Marée bloque son feu et lui fait double dégâts. Quand il dort, frappe fort… mais il se soigne." });
  G("B12", { name: "Phénix Cendré", hp: 56, draw: "B12", scale: .45, reward: "plumePhenix", rebirth: true,
    moves: [M("Plume ardente", "multi", { d: 1, hits: 3, st: ["brule", 1] }), M("Brasier", "hit", { d: 3 }), M("Danse des cendres", "status", { st: ["aveugle", 1] })],
    phase2: { moves: [M("Plume ardente", "multi", { d: 2, hits: 3 }), M("Brasier noir", "charge", { d: 6, tele: "Le Phénix s'embrase d'un feu noir…" })], text: "Le Phénix renaît… plus sombre." },
    hint: "À zéro, il devient un Œuf de cendres et renaît. Une Marée sur l'œuf l'empêche de renaître !" });
  // ---- phase finale au tour par tour
  FOES.reineFinale = { name: "La Reine Cendrée", hp: 999, draw: "reineCendree", scale: .5, boss: true, music: "finalChant", special: "chant", moves: [M("Appel du Cœur", "lien")] };

  // ================================================================ statuts
  const ST = { poison: "empoisonné", brule: "brûlé", lie: "ligoté", sommeil: "endormi", aveugle: "aveuglé", gel: "gelé", peur: "effrayé", choc: "électrisé", vertige: "étourdi", lourd: "alourdi" };

  // ================================================================ interface
  function buildUI() {
    if (ui) return ui;
    ui = document.createElement("div"); ui.id = "battle-ui"; ui.hidden = true;
    ui.innerHTML = `<div class="b-msg"></div><div class="b-menu"></div><div class="b-tap" hidden><div class="b-tap-txt"></div></div>`;
    document.body.appendChild(ui); return ui;
  }
  const msg = (t) => { ui.querySelector(".b-msg").textContent = t; };
  async function say(t, ms = 1100) { msg(t); await sleep(ms); }
  function menu(opts) { // [[valeur, libellé, désactivé?, petit texte]]
    const box = ui.querySelector(".b-menu");
    return new Promise((res) => {
      box.innerHTML = opts.map(([v, l, dis, sub], i) => `<button class="b-btn" data-i="${i}" ${dis ? "disabled" : ""}>${l}${sub ? `<small>${sub}</small>` : ""}</button>`).join("");
      box.onclick = (e) => { const b = e.target.closest(".b-btn"); if (!b || b.disabled) return; box.onclick = null; box.innerHTML = ""; Music.sfx("switch", .6); res(opts[Number(b.dataset.i)][0]); };
    });
  }
  // anneau de timing : renvoie 0 (raté), 1 (bien), 2 (parfait)
  function timing(label, speed = 1) {
    if (B.fast) return Promise.resolve(1);
    const tap = ui.querySelector(".b-tap"); tap.hidden = false; tap.querySelector(".b-tap-txt").textContent = label;
    B.ring = { t: 0, dur: 1.1 / speed, active: true };
    return new Promise((res) => {
      const done = (v) => { tap.hidden = true; B.ring = null; removeEventListener("pointerdown", on, true); removeEventListener("keydown", onk, true); res(v); };
      const judge = () => { const k = B.ring.t / B.ring.dur; const d = Math.abs(k - .78); return d < .07 ? 2 : d < .17 ? 1 : 0; };
      const on = (e) => { if (!B || !B.ring) return; e.preventDefault(); e.stopPropagation(); const v = judge(); B.ring.result = v; Music.sfx(v ? "switch" : "trap", .5); done(v); };
      const onk = (e) => { if (e.key === " " || e.key === "Enter") on(e); };
      addEventListener("pointerdown", on, true); addEventListener("keydown", onk, true);
      B.ringEnd = () => done(0);
    });
  }

  // ================================================================ combat
  function mkFoe(id, i, n) {
    const d = FOES[id];
    return { id, d, name: d.name, hp: Prog.foeHp(d.hp), max: Prog.foeHp(d.hp), st: {}, i, x: 0, y: 0, alive: true, guard: false, shield: 0, hide: false, fly: false, stone: false, buff: 0, tele: null, notes: 0, sleep: 0, noHeal: 0, rebirthDone: false, hurt: 0, phase: 0, fake: 0 };
  }
  const allyStats = { keo: { name: "Kéo", hp: 8, atk: 2, npc: "keo" }, nalia: { name: "Nalia", hp: 10, atk: 2, npc: "nalia" }, tikka: { name: "Mère Tikka", hp: 6, atk: 1, npc: "tikka", healer: true }, oro: { name: "Grand-père Oro", hp: 6, atk: 1, npc: "oro" }, partner: { name: "", hp: 8, atk: 2 } };

  async function start(o) {
    buildUI();
    B = { o, foes: (o.foes || []).map((id, i) => mkFoe(id, i)), turn: 0, msg: "", t: 0, fx: [], ring: null, cd: {}, st: {}, defend: false, momentum: 0, fast: o.fast,
      ally: o.ally ? Object.assign({ st: {} }, allyStats[o.ally], { max: allyStats[o.ally].hp, id: o.ally }) : null, bg: o.bg || "cave", chant: 0, lien: 0, result: null, shake: 0 };
    if (B.ally && o.ally === "partner") { B.ally.name = Game.partnerName() || "Ton cœur"; }
    for (const f of B.foes) if (f.d.adds) for (const a of f.d.adds) B.foes.push(mkFoe(a, B.foes.length));
    layout();
    ui.hidden = false; Game.enterBattle();
    const main = B.foes[0];
    Music.play(o.music || main.d.music || (main.d.mini ? "miniboss" : "battle"), .8);
    try {
      await say(o.intro || (main.d.boss || main.d.mini ? `${main.name} te barre la route !` : B.foes.length > 1 ? "Des ennemis surgissent !" : `${main.name} attaque !`), 1300);
      if (main.d.lines) await say(`« ${main.d.lines[0]} »`, 1500);
      if (main.d.hint && !Prog.flag("hint_" + main.id)) { Prog.set("hint_" + main.id); await say("💡 " + main.d.hint, 2600); }
      while (!B.result) {
        B.turn++;
        await playerTurn();
        if (B.result) break;
        if (B.ally && B.ally.hp > 0) await allyTurn();
        if (B.result) break;
        await foesTurn();
        await endOfTurn();
      }
    } catch (e) { console.warn("combat", e); B.result = B.result || "lose"; }
    const res = B.result;
    ui.hidden = true; ui.querySelector(".b-menu").innerHTML = "";
    const keep = B; B = null; Game.leaveBattle(res, keep);
    return res;
  }
  function layout() { const live = B.foes.filter((f) => f.alive); live.forEach((f, k) => { f.slot = k; f.n = live.length; }); }

  // ---------------------------------------------------------------- tour du joueur
  const weaponBonus = () => (Prog.has("lameObsidienne") ? 2 : Prog.has("epeeCorail") ? 1 : 0);
  async function playerTurn() {
    const P = Prog.P;
    if (B.st.sommeil > 0) { await say("Tu dors profondément… Zzz", 1000); return; }
    if (B.st.gel > 0) { await say("Tu es gelé et ne peux pas bouger !", 1000); return; }
    if (B.o.foes[0] === "reineFinale") return chantTurn();
    for (;;) {
      msg(`Que fais-tu ? (${P.hp}/${P.maxHp} ❤)`);
      const lie = B.st.lie > 0;
      const act = await menu([["atk", "⚔️ Attaquer", lie, lie ? "ligoté !" : ""], ["spell", "✨ Chant", !P.spells.length, P.spells.length ? "" : "aucun"], ["item", "🎒 Objet"], ["def", "🛡️ Parer", false, "dégâts ÷2"], ["run", "🏃 Fuir", B.foes.some((f) => f.d.boss || f.d.mini) || B.o.noFlee]]);
      if (act === "atk") { const tg = await target(); if (tg === null) continue; return attack(tg); }
      if (act === "def") { B.defend = true; B.momentum = 1; await say("Tu te mets en garde. Ton prochain coup sera plus fort.", 900); return; }
      if (act === "run") { if (Math.random() < .7) { await say("Tu t'enfuis !", 800); B.result = "flee"; return; } await say("Impossible de fuir !", 900); return; }
      if (act === "item") { const food = Object.keys(P.inv).filter((k) => ITEMS.cat(k) === "food"); if (!food.length) { await say("Tu n'as rien à manger.", 900); continue; }
        const it = await menu(food.slice(0, 7).map((k) => [k, `${ITEMS.get(k)[3]} ${ITEMS.name(k)} ×${P.inv[k]}`, false, `+${Math.min(ITEMS.val(k), 99)} ❤`]).concat([["back", "↩ Retour"]]));
        if (it === "back") continue; Prog.take(it); Prog.heal(ITEMS.val(it)); addFx("heal", "me"); Music.sfx("pickup"); await say(`Tu manges : ${ITEMS.name(it)}.`, 900); return; }
      if (act === "spell") {
        const sp = await menu(P.spells.map((s) => [s, SPELLS[s].icon + " " + SPELLS[s].name, (B.cd[s] || 0) > 0, (B.cd[s] || 0) > 0 ? `encore ${B.cd[s]} tour(s)` : SPELLS[s].short]).concat([["back", "↩ Retour"]]));
        if (sp === "back") continue;
        const needT = SPELLS[sp].target; let tg = null; if (needT) { tg = await target(); if (tg === null) continue; }
        return castSpell(sp, tg);
      }
    }
  }
  async function target() {
    const live = B.foes.filter((f) => f.alive); if (live.length === 1) return live[0];
    const v = await menu(live.map((f, k) => [k, `🎯 ${f.name}`, false, `${Math.max(0, f.hp)} PV`]).concat([["back", "↩ Retour"]]));
    return v === "back" ? null : live[v];
  }
  async function attack(f) {
    const q = await timing("Touche quand l'anneau est sur la cible !");
    let dmg = 2 + weaponBonus() + B.momentum + (B.st.peur > 0 ? -1 : 0); B.momentum = 0;
    if (q === 2) dmg = Math.round(dmg * 1.6); else if (q === 0) dmg = Math.max(1, dmg - 1);
    if (B.st.aveugle > 0 && Math.random() < .5) { await say("Aveuglé, tu rates ton coup !", 900); return; }
    if (f.fly) { await say(`${f.name} est hors de portée, dans le ciel !`, 1000); return; }
    if (f.hide) { await say(`${f.name} est caché : ton coup frappe le vide.`, 1000); return; }
    if (f.d.illusion && f.fake > 0 && Math.random() < .66) { f.fake--; await say("Ce n'était qu'une illusion !", 900); return; }
    if (f.d.mist && f.hide) { await say("Ton coup traverse la brume.", 900); return; }
    if (f.stone) { addFx("block", f); await say(`${f.name} est en pierre : ça ne lui fait rien.`, 1000); return; }
    if (f.shield > 0) { addFx("block", f); await say(`Le bouclier de ${f.name} arrête ton coup !`, 1000); return; }
    if (f.static) { Prog.hurt(1); addFx("zap", "me"); await say("Aïe ! La laine statique te renvoie une décharge !", 900); }
    if (f.guard) dmg = Math.max(1, Math.floor(dmg / 2));
    if (f.sleep > 0) { dmg += 2; f.sleep = 0; await say(`${f.name} est réveillé en sursaut !`, 700); }
    Music.sfx("hit"); await hit(f, dmg, q === 2 ? "CRITIQUE !" : null);
  }
  async function hit(f, dmg, label) {
    f.hp -= dmg; f.hurt = .5; addFx("num", f, { n: dmg, label }); B.shake = .2;
    await sleep(500);
    if (f.hp <= 0) await foeDown(f);
    else await checkPhase(f);
  }
  async function foeDown(f) {
    if (f.d.rebirth && !f.rebirthDone && !f.egg) { f.egg = 2; f.hp = 1; await say(`${f.name} s'effondre… et devient un Œuf de cendres ! Il va renaître !`, 1600); return; }
    f.alive = false; Music.sfx("kill"); await say(`${f.name} est vaincu !`, 900);
    layout();
    if (B.foes.every((x) => !x.alive)) B.result = "win";
  }
  async function checkPhase(f) {
    if (!f.d.phase2 || f.phase) return;
    if (f.hp / f.max <= .5) { f.phase = 1; f.tele = null; B.shake = .6; Music.sfx("roar", .8); await say(f.d.phase2.text, 2000); }
  }

  // ---------------------------------------------------------------- chants
  const SPELLS = {
    flamme: { name: "Flamme", icon: "🔥", short: "4 dégâts, brûle", target: true, cd: 2 },
    racine: { name: "Racine", icon: "🌱", short: "immobilise 1 tour", target: true, cd: 3 },
    maree: { name: "Marée", icon: "🌊", short: "bouclier d'eau", cd: 3 },
    bourrasque: { name: "Bourrasque", icon: "🌀", short: "3 dégâts, annule une charge", target: true, cd: 2 },
    lueur: { name: "Lueur", icon: "✨", short: "révèle, soigne les yeux", cd: 3 },
    onde: { name: "Onde", icon: "💥", short: "3 dégâts à tous, brise", cd: 3 },
  };
  const mult = (f, sp) => (f.d.weak && f.d.weak[sp] !== undefined ? f.d.weak[sp] : 1) * (f.d.resist && f.d.resist[sp] !== undefined ? f.d.resist[sp] : 1);
  async function castSpell(sp, f) {
    B.cd[sp] = SPELLS[sp].cd + 1; Music.sfx({ flamme: "fire", racine: "root", maree: "water", bourrasque: "wind", lueur: "light", onde: "boom" }[sp]);
    addFx(sp, f || "all");
    if (sp === "flamme") { if (f.egg) { await say("Le feu nourrit l'Œuf de cendres !", 1000); return; } const d = Math.round(4 * mult(f, sp)); if (!d) { await say(`${f.name} ne craint pas le feu.`, 1000); return; } f.st.brule = 2; f.noHeal = 3; await hit(f, d + B.momentum, mult(f, sp) > 1 ? "Super efficace !" : null); B.momentum = 0; return; }
    if (sp === "racine") { if (mult(f, sp) === 0) { await say(`${f.name} est une liane : les racines glissent sur lui.`, 1100); return; } f.rooted = 1; if (f.tele) { f.tele = null; await say(`Les racines immobilisent ${f.name} : sa charge est annulée !`, 1300); } else await say(`Les racines immobilisent ${f.name} !`, 1100);
      if (f.hide) { f.hide = false; await say(`Les racines tirent ${f.name} hors de sa cachette !`, 1000); } return; }
    if (sp === "maree") { B.st.bulle = 2; Prog.heal(1); B.st.brule = 0; await say("Une bulle d'eau t'entoure. (+1 ❤)", 1100); return; }
    if (sp === "bourrasque") { let txt = ""; if (f.tele) { f.tele = null; txt = " Sa charge est dispersée !"; } if (f.fly) { f.fly = false; f.stun = 1; txt += ` ${f.name} tombe du ciel, étourdi !`; } if (f.notes) { f.notes--; txt += " Une note s'envole !"; } if (f.d.mist && f.hide) txt += " La brume tourbillonne.";
      if (f.shellUp && f.d === FOES.amiralNacre) { f.shellUp = false; f.shield = 0; txt += " La coquille se renverse !"; }
      await say("Bourrasque !" + txt, 1200); await hit(f, Math.round(3 * mult(f, sp)), mult(f, sp) > 1 ? "Super efficace !" : null); return; }
    if (sp === "lueur") { B.st.aveugle = 0; B.st.sommeil = 0; B.st.peur = 0; B.momentum = Math.max(B.momentum, 1); let txt = "La Lueur chasse les ombres."; for (const x of B.foes) { if (x.d.mist && x.hide) { x.hide = false; txt += ` ${x.name} est révélé !`; } if (x.hide && !x.d.mist) { x.hide = false; txt += ` ${x.name} sort de sa cachette.`; } if (x.fake) { x.fake = 0; txt += " Les illusions disparaissent !"; } }
      await say(txt, 1300); for (const x of B.foes) if (x.alive && mult(x, "lueur") > 1) await hit(x, Math.round(2 * mult(x, "lueur")), "La lumière le brûle !"); return; }
    if (sp === "onde") { for (const x of B.foes.filter((y) => y.alive)) { let t = ""; if (x.shield > 0 || x.shellUp) { x.shield = 0; x.shellUp = false; t = " Bouclier brisé !"; } if (x.stone) { x.stone = false; x.stun = 1; t = " La pierre se fissure !"; } if (x.static) { x.static = 0; } if (t) await say(x.name + " :" + t, 900); await hit(x, Math.round(3 * mult(x, "onde")), null); if (B.result) return; } if (B.st.lie) { B.st.lie = 0; await say("L'Onde brise tes liens !", 900); } return; }
  }

  // ---------------------------------------------------------------- l'allié
  async function allyTurn() {
    const a = B.ally; const live = B.foes.filter((f) => f.alive); if (!live.length) return;
    if (B.o.foes[0] === "reineFinale") { await say(`${a.name} chante avec toi. Vos deux voix se mêlent.`, 900); return; }
    if (a.healer && Prog.P.hp < Prog.P.maxHp / 2) { Prog.heal(2); addFx("heal", "me"); await say(`${a.name} te soigne. (+2 ❤)`, 1000); return; }
    const f = live[0]; if (f.fly || f.hide || f.stone || f.shield > 0) { await say(`${a.name} cherche une ouverture…`, 800); return; }
    await say(`${a.name} attaque ${f.name} !`, 700); Music.sfx("hit"); await hit(f, a.atk, null);
  }

  // ---------------------------------------------------------------- tour des ennemis
  async function foesTurn() {
    for (const f of B.foes) {
      if (!f.alive || B.result) continue;
      const times = f.d.speed || 1;
      for (let k = 0; k < times && f.alive && !B.result; k++) await foeAct(f);
    }
  }
  async function foeAct(f) {
    if (f.egg) { f.egg--; if (f.egg <= 0) { f.rebirthDone = true; f.egg = 0; f.hp = Math.round(f.max * .6); f.phase = 1; Music.sfx("fire"); await say(`${f.name} renaît de ses cendres !`, 1500); } else await say("L'Œuf de cendres palpite…", 900); return; }
    if (f.stun > 0) { f.stun--; await say(`${f.name} est étourdi.`, 800); return; }
    if (f.rooted > 0) { f.rooted--; await say(`${f.name} se débat dans les racines.`, 800); return; }
    if (f.sleep > 0) { f.sleep--; f.hp = Math.min(f.max, f.hp + 2); await say(`${f.name} dort… et récupère des forces.`, 900); return; }
    f.guard = false;
    // attaque annoncée au tour précédent ?
    if (f.tele) { const mv = f.tele; f.tele = null; return doMove(f, mv, true); }
    if (f.d.notes && f.notes >= 3) { f.notes = 0; return doMove(f, M("GRANDE TEMPÊTE", "hit", { d: 6 }), true); }
    const list = f.phase && f.d.phase2 ? f.d.phase2.moves : f.d.moves;
    let tot = list.reduce((s, m) => s + m.w, 0), r = Math.random() * tot, mv = list[0];
    for (const m of list) { r -= m.w; if (r <= 0) { mv = m; break; } }
    if (mv.k === "heal" && (f.hp > f.max * .7 || f.noHeal > 0)) mv = list.find((m) => m.k === "hit" || m.k === "multi") || mv;
    if (mv.k === "charge") { f.tele = mv; Music.sfx("roar", .5); B.shake = .3; await say("⚠️ " + mv.tele, 1700); return; }
    return doMove(f, mv);
  }
  async function doMove(f, mv, big) {
    await say(`${f.name} : ${mv.n} !`, 800);
    const k = mv.k;
    if (k === "hit" || k === "charge") return strike(f, mv.d + (f.buff || 0), mv, big ? 1 : 1);
    if (k === "multi") { for (let i = 0; i < (mv.hits || 2) && !B.result; i++) await strike(f, mv.d, mv, 1.4); return; }
    if (k === "guard") { f.guard = true; await say(`${f.name} se protège.`, 700); return; }
    if (k === "shield") { f.shield = 2; await say(`${f.name} lève un bouclier ! (l'Onde le brise)`, 1000); return; }
    if (k === "shell") { f.shield = 3; f.shellUp = true; await say(`${f.name} se cache dans sa coquille !`, 1000); return; }
    if (k === "static") { f.static = 2; await say("La laine du Bélier crépite d'électricité !", 1000); return; }
    if (k === "stone") { f.stone = true; f.hp = Math.min(f.max, f.hp + 4); await say(`${f.name} se change en pierre et se répare.`, 1100); return; }
    if (k === "hide") { f.hide = true; await say(`${f.name} disparaît !`, 900); return; }
    if (k === "fly") { f.fly = true; await say(`${f.name} s'envole hors de portée !`, 900); return; }
    if (k === "dodge") { f.guard = true; await say(`${f.name} scintille et devient difficile à toucher.`, 900); return; }
    if (k === "buff") { f.buff = (f.buff || 0) + 1; await say(`${f.name} se martèle la poitrine : il frappera plus fort !`, 1100); return; }
    if (k === "heal") { const h = mv.d; f.hp = Math.min(f.max, f.hp + h); addFx("healFoe", f); await say(`${f.name} récupère ${h} PV.`, 900); return; }
    if (k === "healAll") { for (const x of B.foes) if (x.alive) x.hp = Math.min(x.max, x.hp + mv.d); await say("Tous les ennemis sont soignés !", 1000); return; }
    if (k === "summon") { if (B.foes.filter((x) => x.alive).length >= 4) { await say("… mais personne ne vient.", 700); return; } B.foes.push(mkFoe(mv.sum, B.foes.length)); layout(); await say(`${FOES[mv.sum].name} arrive en renfort !`, 900); return; }
    if (k === "status") { return inflict(mv.st[0], mv.st[1]); }
    if (k === "sleep") { f.sleep = 2; await say(`${f.name} s'endort en ronronnant… (il guérit en dormant)`, 1200); return; }
    if (k === "note") { f.notes = (f.notes || 0) + 1; Music.sfx("puzzle"); await say(`♪ ${f.name} chante une note… (${f.notes}/3)`, 1100); if (f.notes >= 3) await say("⚠️ La Grande Tempête arrive au prochain tour !", 1400); return; }
    if (k === "illusion") { f.fake = 2; await say(`${f.name} se multiplie en trois renards !`, 1100); return; }
  }
  async function inflict(s, turns) {
    if (B.st.bulle > 0 && s !== "lie") { await say("La bulle d'eau te protège.", 800); return; }
    B.st[s] = Math.max(B.st[s] || 0, turns); Music.sfx("trap", .6); await say(`Tu es ${ST[s]} !`, 900);
  }
  async function strike(f, dmg, mv, speed) {
    // cible : le joueur, ou l'allié si l'attaque le vise
    const onAlly = B.ally && B.ally.hp > 0 && (mv.target === "ally" || (B.ally && Math.random() < .25));
    if (onAlly) { B.ally.hp -= dmg; addFx("num", "ally", { n: dmg }); Music.sfx("hit"); await say(`${B.ally.name} encaisse le coup ! (${Math.max(0, B.ally.hp)} PV)`, 900); if (B.ally.hp <= 0) await say(`${B.ally.name} est à terre !`, 1000); return; }
    if (B.st.bulle > 0) { B.st.bulle--; addFx("block", "me"); Music.sfx("water"); await say("La bulle d'eau absorbe le coup !", 900); return; }
    const q = await timing("PARE ! Touche au bon moment", speed || 1);
    let d = dmg;
    if (B.defend) d = Math.floor(d / 2);
    if (q === 2) { d = Math.max(0, d - 2); } else if (q === 1) d = Math.max(0, d - 1);
    if (B.st.lourd > 0) d += 1;
    if (d <= 0) { addFx("block", "me"); Music.sfx("rock"); await say(q === 2 ? "Parade parfaite !" : "Paré !", 700); return; }
    Prog.hurt(d); addFx("num", "me", { n: d }); B.shake = .3; Music.sfx("hurt"); if (navigator.vibrate) try { navigator.vibrate(40); } catch { /* ignore */ }
    if (mv.st) await inflict(mv.st[0], mv.st[1]);
    if (mv.el === "feu" && Math.random() < .4) await inflict("brule", 2);
    await sleep(350);
    if (Prog.P.hp <= 0) { await say("Tu t'effondres…", 1300); B.result = "lose"; }
  }
  async function endOfTurn() {
    B.defend = false;
    for (const k in B.cd) if (B.cd[k] > 0) B.cd[k]--;
    for (const f of B.foes) { if (!f.alive) continue; if (f.shield > 0) f.shield--; if (f.shield <= 0) f.shellUp = false; if (f.static > 0) f.static--; if (f.noHeal > 0) f.noHeal--; if (f.stone && Math.random() < .5) f.stone = false; if (f.fly && Math.random() < .4) f.fly = false; if (f.hide && Math.random() < .35 && !f.d.mist) f.hide = false;
      if (f.st.brule > 0) { f.st.brule--; await hit(f, 1, "brûlure"); } if (B.result) return; }
    const B2 = B.foes.find((f) => f.alive && f.d.storm && f.phase); if (B2) { Prog.hurt(1); addFx("zap", "me"); await say("L'orage te frappe ! (-1 ❤)", 900); if (Prog.P.hp <= 0) { B.result = "lose"; return; } }
    if (B.st.poison > 0) { Prog.hurt(1); await say("Le poison te ronge. (-1 ❤)", 800); }
    if (B.st.brule > 0) { Prog.hurt(1); await say("Tu brûles ! (-1 ❤)", 800); }
    for (const s in B.st) if (B.st[s] > 0 && s !== "bulle") B.st[s]--;
    if (Prog.P.hp <= 0) { await say("Tu t'effondres…", 1300); B.result = "lose"; }
  }

  // ---------------------------------------------------------------- la phase spéciale finale : le Chant à Deux
  async function chantTurn() {
    const partner = Game.partnerName() || "ton cœur";
    msg(`Chant ${B.chant}/8 · Lien de la Reine ${B.lien}/10`);
    const act = await menu([["chant", "🎵 Chanter", false, "le Chant de Délivrance"], ["main", "🤝 Tenir la main", false, `de ${partner}`], ["garde", "🛡️ Garder", false, "protéger le chant"]]);
    B.lastActs = (B.lastActs || []).concat(act).slice(-2);
    if (act === "chant") {
      const q = await timing("Chante juste : touche au bon moment !");
      const gain = (q === 2 ? 3 : q === 1 ? 2 : 0) + (B.guardBonus ? 1 : 0); B.guardBonus = 0;
      if (B.lastActs.length === 2 && B.lastActs[0] === "chant") { await say("Seul(e), ta voix se brise… Les deux cœurs doivent chanter tour à tour !", 1500); B.chant = Math.max(0, B.chant - 1); return; }
      B.chant += gain; Music.sfx("light"); await say(gain ? `Le chant monte… (${B.chant}/8)` : "Ta voix tremble.", 1000);
    } else if (act === "main") { B.lien = Math.max(0, B.lien - 3); addFx("heal", "me"); await say(`Tu serres la main de ${partner}. Le lien de la Reine se desserre. (${B.lien}/10)`, 1300); }
    else { B.defend = true; B.guardBonus = 1; await say("Tu te places devant le chant. (Le prochain chant portera plus loin.)", 900); }
    if (B.chant >= 8) { B.result = "win"; }
  }
  // le tour de la Reine pendant le Chant à Deux
  FOES.reineFinale.act = true;
  const _foeAct = foeAct;
  foeAct = async function (f) { // eslint-disable-line no-func-assign
    if (f.id !== "reineFinale") return _foeAct(f);
    const add = B.defend ? 1 : 1 + (Math.random() < .5 ? 1 : 0); B.lien += add; B.defend = false; B.shake = .4; Music.sfx("roar", .6);
    await say(pick(["« Votre cœur est à moi ! »", "« Laissez-moi vivre… encore un siècle… »", "« Nalia… pourquoi m'as-tu abandonnée ? »", "« Deux cœurs… battez pour MOI ! »"]) + ` (lien ${B.lien}/10)`, 1500);
    if (B.lien >= 10) { await say("Le Cœur vous enchaîne… Vous tombez à genoux.", 1500); Prog.P.hp = Math.max(1, Prog.P.hp); B.result = "lose"; }
  };

  // ================================================================ effets et dessin
  function addFx(kind, who, o = {}) { if (B) B.fx.push(Object.assign({ kind, who, t: 0, max: kind === "num" ? 1 : .8 }, o)); }
  function posOf(who, vw, vh) {
    if (who === "me") return { x: vw * .22, y: vh * .66 };
    if (who === "ally") return { x: vw * .12, y: vh * .6 };
    if (who === "all") return { x: vw * .7, y: vh * .5 };
    const f = who; const n = f.n || 1; return { x: vw * (.62 + (f.slot - (n - 1) / 2) * .16), y: vh * (.5 + (f.slot % 2) * .06) };
  }
  function render(c, vw, vh, dt) {
    if (!B) return;
    B.t += dt; if (B.ring) { B.ring.t += dt; if (B.ring.t > B.ring.dur) B.ringEnd && B.ringEnd(); }
    let sx = 0, sy = 0; if (B.shake > 0) { B.shake -= dt; sx = rnd(-5, 5); sy = rnd(-4, 4); }
    c.save(); c.translate(sx, sy);
    // décor (on réutilise les décors des cinématiques)
    const sc = Math.min(vw / 780, vh / 520), bgView = { x0: 500 - vw / 2 / sc, x1: 500 + vw / 2 / sc, y0: 300 - vh / 2 / sc, y1: 300 + vh / 2 / sc };
    c.save(); c.translate(vw / 2, vh / 2); c.scale(sc, sc); c.translate(-500, -300); (Cutscene.BG[B.bg] || Cutscene.BG.cave)(c, bgView, B.t, B.o.bgOpt || {}); c.restore();
    c.fillStyle = "rgba(0,0,0,.15)"; c.fillRect(0, 0, vw, vh);
    const S = Math.min(vw, vh) / 420;
    // ennemis
    for (const f of B.foes) {
      if (!f.alive) continue; f.hurt = Math.max(0, f.hurt - dt);
      const p = posOf(f, vw, vh); c.save(); c.translate(p.x, p.y + (f.fly ? -60 * S : 0) + (f.hide ? 30 * S : 0));
      c.globalAlpha = f.hide ? .25 : 1; const s = S * (f.d.scale || 1) * (f.d.boss ? 1.1 : 1.3);
      if (f.egg) { c.fillStyle = "#4a3a3a"; c.beginPath(); c.ellipse(0, -30 * S, 26 * S, 34 * S, 0, 0, TAU); c.fill(); c.fillStyle = "#ff7a3a"; c.globalAlpha = .4 + .4 * Math.sin(B.t * 6); c.beginPath(); c.ellipse(0, -30 * S, 10 * S, 14 * S, 0, 0, TAU); c.fill(); c.globalAlpha = 1; }
      else {
        if (f.fake) for (const dx of [-60, 60]) { c.save(); c.globalAlpha = .5; c.translate(dx * S, 0); Bosses.draw(c, f.d.draw, B.t, { scale: s, phase: f.phase }); c.restore(); }
        Bosses.draw(c, f.d.draw, B.t + f.i, { scale: s, hurt: f.hurt, phase: f.phase, stone: f.stone, tongue: 0 });
      }
      if (f.shield > 0 || f.stone) { c.strokeStyle = f.stone ? "rgba(200,200,210,.9)" : "rgba(150,220,255,.9)"; c.lineWidth = 4; c.beginPath(); c.arc(0, -50 * S, 70 * S * (f.d.boss ? 1.3 : .8), 0, TAU); c.stroke(); }
      if (f.static) { c.strokeStyle = "#fff6a0"; c.lineWidth = 2; for (let i = 0; i < 4; i++) { c.beginPath(); const a = B.t * 7 + i * 1.6; c.moveTo(Math.cos(a) * 60 * S, -60 * S + Math.sin(a) * 40 * S); c.lineTo(Math.cos(a + .3) * 70 * S, -50 * S + Math.sin(a + .3) * 50 * S); c.stroke(); } }
      if (f.tele) { c.fillStyle = "#ff4a4a"; c.font = `900 ${24 * S}px system-ui`; c.textAlign = "center"; c.fillText("⚠", 0, -150 * S * (f.d.scale || 1) - 10); }
      if (f.notes) { c.fillStyle = "#fff"; c.font = `900 ${20 * S}px serif`; c.textAlign = "center"; c.fillText("♪".repeat(f.notes), 0, -190 * S * (f.d.scale || 1)); }
      if (f.sleep) { c.fillStyle = "#fff"; c.font = `800 ${18 * S}px system-ui`; c.fillText("Zzz", 30 * S, -120 * S); }
      c.restore();
      // barre de vie
      const w = Math.min(160, vw * .3) * (f.d.boss ? 1.2 : .8), y = p.y - (f.d.boss ? 210 : 110) * S * (f.d.scale || 1) * 1.1 - 20;
      c.fillStyle = "rgba(0,0,0,.45)"; c.beginPath(); c.roundRect(p.x - w / 2 - 3, y - 15, w + 6, 26, 8); c.fill();
      c.fillStyle = "#fff"; c.font = "800 10px ui-rounded, system-ui"; c.textAlign = "center"; c.fillText(f.d.special ? f.name : `${f.name}`, p.x, y - 4);
      if (!f.d.special) { c.fillStyle = "#3a2a2a"; c.fillRect(p.x - w / 2, y + 1, w, 6); c.fillStyle = f.phase ? "#ff7a3a" : "#ff5a6a"; c.fillRect(p.x - w / 2, y + 1, w * Math.max(0, f.hp) / f.max, 6); }
    }
    // le joueur (et son allié)
    const me = posOf("me", vw, vh);
    c.save(); c.translate(me.x, me.y); c.scale(S * 4.4, S * 4.4); c.translate(0, -14); Avatar.draw(c, Game.myAvatar(), { dir: "right", t: B.t, swing: 0 }); c.restore();
    if (B.st.bulle > 0) { c.strokeStyle = "rgba(140,210,255,.9)"; c.fillStyle = "rgba(140,210,255,.2)"; c.lineWidth = 3; c.beginPath(); c.arc(me.x, me.y - 50 * S, 60 * S, 0, TAU); c.fill(); c.stroke(); }
    if (B.ally) { const a = posOf("ally", vw, vh), n = B.ally.npc ? NPC.get(B.ally.npc) : null, av = n ? n.avatar : Game.partnerAvatar();
      c.save(); c.translate(a.x, a.y); c.globalAlpha = B.ally.hp > 0 ? 1 : .4; c.scale(S * 3.8, S * 3.8); c.translate(0, -14); Avatar.draw(c, av, { dir: "right", t: B.t + 1 }); c.restore();
      c.fillStyle = "#fff"; c.font = "800 11px ui-rounded"; c.textAlign = "center"; c.fillText(`${B.ally.name} ${Math.max(0, B.ally.hp)} PV`, a.x, a.y - 90 * S); }
    // cœurs du joueur + statuts
    hearts(c, 14, 14 + (B.o.top || 0), Math.min(22, vw / 22));
    const sts = Object.entries(B.st).filter(([k, v]) => v > 0 && ST[k]).map(([k, v]) => `${ST[k]} (${v})`).join(" · ");
    if (sts) { c.fillStyle = "rgba(0,0,0,.4)"; c.font = "700 12px ui-rounded"; const w = c.measureText(sts).width + 16; c.fillRect(12, 46, w, 20); c.fillStyle = "#fff"; c.textAlign = "left"; c.fillText(sts, 20, 60); }
    // jauges de la phase finale
    if (B.o.foes[0] === "reineFinale") { gauge(c, vw / 2 - 110, vh * .12, 220, "Chant de Délivrance", B.chant / 8, "#ffe08a"); gauge(c, vw / 2 - 110, vh * .12 + 34, 220, "Lien de la Reine", B.lien / 10, "#ff5a3a"); }
    // effets
    for (const q of B.fx) {
      q.t += dt; const p = posOf(q.who, vw, vh), k = q.t / q.max; c.save(); c.globalAlpha = Math.max(0, 1 - k);
      if (q.kind === "num") { c.font = `900 ${26 * S}px ui-rounded, system-ui`; c.textAlign = "center"; c.lineWidth = 4; c.strokeStyle = q.who === "me" ? "#7a1a2a" : "#3a1a1a"; c.fillStyle = q.who === "me" ? "#ff8a9a" : "#fff";
        c.strokeText("-" + q.n, p.x, p.y - 100 * S - k * 40); c.fillText("-" + q.n, p.x, p.y - 100 * S - k * 40); if (q.label) { c.font = `800 ${13 * S}px ui-rounded`; c.fillStyle = "#ffe08a"; c.fillText(q.label, p.x, p.y - 130 * S - k * 40); } }
      else if (q.kind === "flamme") { for (let i = 0; i < 8; i++) { c.fillStyle = ["#ff7a3a", "#ffb03a", "#ffe08a"][i % 3]; c.beginPath(); c.arc(p.x + Math.cos(i) * 40 * k * S, p.y - 60 * S - k * 60 * S + Math.sin(i * 2) * 20 * S, (14 - k * 10) * S, 0, TAU); c.fill(); } }
      else if (q.kind === "maree" || q.kind === "heal" || q.kind === "healFoe") { c.strokeStyle = q.kind === "maree" ? "#8ad0ff" : "#8aff9a"; c.lineWidth = 4; c.beginPath(); c.arc(posOf(q.kind === "healFoe" ? q.who : "me", vw, vh).x, posOf(q.kind === "healFoe" ? q.who : "me", vw, vh).y - 50 * S, 30 * S + k * 50 * S, 0, TAU); c.stroke(); }
      else if (q.kind === "racine") { c.strokeStyle = "#5a8a3a"; c.lineWidth = 6; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(p.x - 40 * S + i * 20 * S, p.y); c.quadraticCurveTo(p.x - 50 * S + i * 25 * S, p.y - 50 * S * Math.min(1, k * 3), p.x - 20 * S + i * 10 * S, p.y - 90 * S * Math.min(1, k * 3)); c.stroke(); } }
      else if (q.kind === "bourrasque") { c.strokeStyle = "#e8f6ff"; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(p.x, p.y - 60 * S, (20 + i * 14) * S * (.5 + k), B.t * 6 + i, B.t * 6 + i + 2); c.stroke(); } }
      else if (q.kind === "lueur") { c.fillStyle = "rgba(255,250,210,.6)"; c.fillRect(0, 0, vw, vh); }
      else if (q.kind === "onde") { c.strokeStyle = "#cfd8ff"; c.lineWidth = 8 * (1 - k); c.beginPath(); c.arc(me.x, me.y - 40 * S, k * vw, 0, TAU); c.stroke(); }
      else if (q.kind === "block") { c.strokeStyle = "#cfe0ff"; c.lineWidth = 3; c.beginPath(); c.arc(p.x, p.y - 60 * S, 40 * S, 0, TAU); c.stroke(); }
      else if (q.kind === "zap") { c.strokeStyle = "#fff6a0"; c.lineWidth = 3; c.beginPath(); c.moveTo(p.x - 20, p.y - 120 * S); c.lineTo(p.x + 6, p.y - 80 * S); c.lineTo(p.x - 8, p.y - 70 * S); c.lineTo(p.x + 12, p.y - 30 * S); c.stroke(); }
      c.restore();
    }
    B.fx = B.fx.filter((q) => q.t < q.max);
    // anneau de timing
    if (B.ring) { const k = B.ring.t / B.ring.dur, cx = vw / 2, cy = vh * .42, R = 90 * S;
      c.strokeStyle = "rgba(255,255,255,.35)"; c.lineWidth = 10; c.beginPath(); c.arc(cx, cy, R * .22, 0, TAU); c.stroke();
      c.strokeStyle = "rgba(120,255,160,.9)"; c.lineWidth = 6; c.beginPath(); c.arc(cx, cy, R * .22, 0, TAU); c.stroke();
      c.strokeStyle = "#fff"; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, R * (1 - k), 0, TAU); c.stroke(); }
    c.restore();
  }
  function gauge(c, x, y, w, label, k, col) { c.fillStyle = "rgba(0,0,0,.5)"; c.beginPath(); c.roundRect(x - 4, y - 16, w + 8, 30, 8); c.fill(); c.fillStyle = "#fff"; c.font = "800 11px ui-rounded"; c.textAlign = "left"; c.fillText(label, x, y - 3); c.fillStyle = "#3a2a2a"; c.fillRect(x, y + 2, w, 7); c.fillStyle = col; c.fillRect(x, y + 2, w * Math.min(1, k), 7); }
  function hearts(c, x, y, s) {
    const P = Prog.P;
    for (let i = 0; i < P.maxHp; i++) { const hx = x + (i % 10) * (s + 3), hy = y + Math.floor(i / 10) * (s + 3); c.save(); c.translate(hx + s / 2, hy + s / 2); c.scale(s / 20, s / 20);
      c.fillStyle = "rgba(0,0,0,.25)"; heartPath(c, 1, 1); c.fill(); c.fillStyle = i < P.hp ? "#ff4a6a" : "rgba(255,255,255,.35)"; heartPath(c, 0, 0); c.fill(); if (i < P.hp) { c.fillStyle = "rgba(255,255,255,.5)"; c.beginPath(); c.arc(-4, -4, 2.4, 0, TAU); c.fill(); } c.restore(); }
  }
  function heartPath(c, ox, oy) { c.beginPath(); c.moveTo(ox, oy + 8); c.bezierCurveTo(ox - 14, oy - 2, ox - 7, oy - 13, ox, oy - 5); c.bezierCurveTo(ox + 7, oy - 13, ox + 14, oy - 2, ox, oy + 8); }

  return { start, render, FOES, SPELLS, hearts, get active() { return Boolean(B); } };
})();
