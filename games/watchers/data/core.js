/* Watchers — données de base : types, attaques, Watchers, objets. */
"use strict";

// ------------------------------------------------------------------ Types
const TYPES = ["Flamme", "Onde", "Sève", "Roc", "Givre", "Foudre", "Vent", "Ombre", "Lumière", "Esprit"];
const TYPE_UI = { Flamme: "#d9572b", Onde: "#3b7dd8", Sève: "#4e9a4a", Roc: "#8a7356", Givre: "#5fa8c8", Foudre: "#c9a820", Vent: "#6fa58c", Ombre: "#6b4a96", Lumière: "#c9a84a", Esprit: "#b05a9c" };
// attaquant -> { défenseur: multiplicateur }
const CHART = {
  Flamme: { Sève: 2, Givre: 2, Onde: .5, Roc: .5, Flamme: .5 },
  Onde: { Flamme: 2, Roc: 2, Sève: .5, Onde: .5 },
  Sève: { Onde: 2, Roc: 2, Flamme: .5, Sève: .5, Vent: .5 },
  Roc: { Flamme: 2, Vent: 2, Givre: 2, Roc: .5, Sève: .5 },
  Givre: { Sève: 2, Vent: 2, Flamme: .5, Onde: .5, Givre: .5 },
  Foudre: { Onde: 2, Vent: 2, Roc: .5, Sève: .5, Foudre: .5 },
  Vent: { Sève: 2, Esprit: 2, Roc: .5, Foudre: .5 },
  Ombre: { Esprit: 2, Lumière: .5, Ombre: .5 },
  Lumière: { Ombre: 2, Givre: 2, Flamme: .5, Lumière: .5 },
  Esprit: { Lumière: 2, Roc: 2, Ombre: .5, Esprit: .5 },
};
const effectiveness = (atk, defTypes) => defTypes.reduce((m, t) => m * (CHART[atk][t] ?? 1), 1);

// ------------------------------------------------------------------ États
const STATUS = {
  psn: { name: "Empoisonné", short: "EMP", color: "#a35bd6" },
  brn: { name: "Brûlé", short: "BRÛ", color: "#d9572b" },
  frz: { name: "Gelé", short: "GEL", color: "#5fa8c8" },
  par: { name: "Paralysé", short: "PAR", color: "#c9a820" },
  slp: { name: "Endormi", short: "SOM", color: "#8e8e97" },
};

// ------------------------------------------------------------------ Attaques
// [nom, type, catégorie p=physique s=spéciale x=statut, puissance, précision, PP, effet]
// effet : st=état infligé, ch=chance %, buff/debuff=[stat, niveaux], heal=%PV, drain=% des dégâts, prio, recoil
const MOVE_LIST = [
  ["Flammèche", "Flamme", "s", 40, 100, 25, { st: "brn", ch: 10 }], ["Morsure ardente", "Flamme", "p", 55, 95, 20, { st: "brn", ch: 10 }],
  ["Rideau de braise", "Flamme", "s", 70, 100, 15, {}], ["Crocs de feu", "Flamme", "p", 80, 95, 15, { st: "brn", ch: 20 }],
  ["Brasier", "Flamme", "s", 95, 90, 10, { st: "brn", ch: 15 }], ["Cœur incandescent", "Flamme", "p", 120, 85, 5, { recoil: 25 }],
  ["Bulle", "Onde", "s", 40, 100, 25, {}], ["Gifle d'écume", "Onde", "p", 55, 100, 20, {}],
  ["Vague", "Onde", "s", 70, 100, 15, { debuff: ["spd", 1], ch: 20 }], ["Ressac", "Onde", "p", 85, 95, 10, {}],
  ["Raz-de-marée", "Onde", "s", 105, 85, 5, {}], ["Pluie douce", "Onde", "x", 0, 100, 10, { heal: 40 }],
  ["Feuille vive", "Sève", "p", 40, 100, 25, {}], ["Spores", "Sève", "x", 0, 75, 15, { st: "slp", ch: 100 }],
  ["Racines", "Sève", "s", 60, 100, 15, { drain: 50 }], ["Lame-feuille", "Sève", "p", 80, 95, 15, {}],
  ["Fouet de lianes", "Sève", "p", 95, 90, 10, {}], ["Floraison", "Sève", "s", 110, 85, 5, {}],
  ["Jet de cailloux", "Roc", "p", 40, 95, 25, {}], ["Carapace", "Roc", "x", 0, 100, 15, { buff: ["def", 2] }],
  ["Éboulis", "Roc", "p", 65, 90, 15, { debuff: ["spd", 1], ch: 30 }], ["Coup de bélier", "Roc", "p", 85, 90, 10, {}],
  ["Avalanche de pierres", "Roc", "p", 100, 85, 5, {}], ["Séisme ancien", "Roc", "p", 120, 80, 5, {}],
  ["Souffle froid", "Givre", "s", 40, 100, 25, { st: "frz", ch: 5 }], ["Givre", "Givre", "x", 0, 90, 10, { debuff: ["spd", 2] }],
  ["Éclats de glace", "Givre", "p", 65, 95, 15, {}], ["Rayon gelé", "Givre", "s", 85, 95, 10, { st: "frz", ch: 10 }],
  ["Blizzard", "Givre", "s", 110, 75, 5, { st: "frz", ch: 15 }], ["Croc glacial", "Givre", "p", 70, 95, 15, { st: "frz", ch: 10 }],
  ["Étincelle", "Foudre", "s", 40, 100, 25, { st: "par", ch: 10 }], ["Onde électrique", "Foudre", "x", 0, 90, 15, { st: "par", ch: 100 }],
  ["Choc", "Foudre", "p", 65, 100, 15, { st: "par", ch: 10 }], ["Arc voltaïque", "Foudre", "s", 85, 95, 10, { st: "par", ch: 10 }],
  ["Foudre", "Foudre", "s", 110, 75, 5, { st: "par", ch: 30 }], ["Vif-éclair", "Foudre", "p", 45, 100, 20, { prio: 1 }],
  ["Bourrasque", "Vent", "s", 40, 100, 25, {}], ["Vif-vol", "Vent", "p", 45, 100, 20, { prio: 1 }],
  ["Tranche-vent", "Vent", "p", 65, 100, 15, {}], ["Tornade", "Vent", "s", 85, 90, 10, {}],
  ["Ouragan", "Vent", "s", 110, 75, 5, {}], ["Vent arrière", "Vent", "x", 0, 100, 15, { buff: ["spd", 2] }],
  ["Griffe d'ombre", "Ombre", "p", 45, 100, 25, {}], ["Regard noir", "Ombre", "x", 0, 100, 15, { debuff: ["atk", 1] }],
  ["Morsure", "Ombre", "p", 65, 100, 15, {}], ["Boule d'ombre", "Ombre", "s", 80, 100, 15, { debuff: ["sdf", 1], ch: 20 }],
  ["Nuit noire", "Ombre", "s", 100, 90, 5, {}], ["Vol d'âme", "Ombre", "p", 75, 100, 10, { drain: 50 }],
  ["Lueur", "Lumière", "s", 40, 100, 25, {}], ["Éclat", "Lumière", "p", 60, 100, 15, {}],
  ["Prisme", "Lumière", "s", 75, 100, 15, {}], ["Aube", "Lumière", "x", 0, 100, 10, { heal: 50 }],
  ["Rayon solaire", "Lumière", "s", 110, 85, 5, {}], ["Lance de lumière", "Lumière", "p", 90, 95, 10, {}],
  ["Murmure", "Esprit", "s", 40, 100, 25, {}], ["Voile de brume", "Esprit", "x", 0, 100, 15, { buff: ["sdf", 2] }],
  ["Hantise", "Esprit", "s", 65, 100, 15, { debuff: ["spa", 1], ch: 20 }], ["Écho", "Esprit", "s", 80, 100, 10, {}],
  ["Cri des morts", "Esprit", "s", 105, 85, 5, {}], ["Rêve", "Esprit", "x", 0, 100, 10, { st: "slp", ch: 100 }],
  // Attaques neutres (sans type fort) : type de l'utilisateur
  ["Charge", null, "p", 40, 100, 35, {}], ["Rugissement", null, "x", 0, 100, 30, { debuff: ["atk", 1] }],
  ["Coup de queue", null, "p", 55, 100, 25, {}], ["Concentration", null, "x", 0, 100, 20, { buff: ["atk", 2] }],
  // Signatures des légendaires
  ["Bourgeon d'aurore", "Sève", "s", 130, 90, 5, { heal: 25 }], ["Abîme", "Onde", "s", 130, 90, 5, { debuff: ["def", 1], ch: 50 }],
  ["Hiver éternel", "Givre", "s", 130, 85, 5, { st: "frz", ch: 30 }], ["Cœur de lave", "Flamme", "p", 135, 85, 5, { st: "brn", ch: 30 }],
  ["Oubli", "Ombre", "s", 130, 90, 5, { st: "slp", ch: 20 }], ["Dernier soleil", "Lumière", "s", 140, 90, 5, {}],
  ["Éclipse totale", "Ombre", "s", 150, 90, 5, { debuff: ["spa", 1], ch: 50 }],
];
const MOVES = {};
for (const [name, type, cat, power, acc, pp, fx] of MOVE_LIST) MOVES[name] = { name, type, cat, power, acc, pp, ...fx };

// ------------------------------------------------------------------ Watchers
// Lignées : [noms par stade], types, forme, graine, niveaux d'évolution, région, habitat, rôle, rareté
// habitat : g=hautes herbes, w=eau, c=grotte/ruines ; rôle : atk|def|spe|spd|bal|tank
const LINES = [
  // --- Région 1 : Vallée des Brumes (starters + faune)
  [["Braisillon", "Brasilord", "Infernoble"], ["Flamme"], "beast", 3, [16, 36], 1, "starter", "atk"],
  [["Ondelle", "Ondalis", "Abyssire"], ["Onde"], "fish", 17, [16, 36], 1, "starter", "spe"],
  [["Pousselin", "Sylvarin", "Chênaclos"], ["Sève"], "biped", 25, [16, 36], 1, "starter", "def"],
  [["Brumelin", "Brumoral"], ["Esprit", "Vent"], "spirit", 41, [22], 1, "g", "spe", 2],
  [["Mousseron", "Champolin"], ["Sève", "Esprit"], "beast", 52, [20], 1, "g", "tank", 3],
  [["Plumeau", "Hibrume", "Noctaile"], ["Vent"], "bird", 61, [12, 28], 1, "g", "spd", 5],
  [["Rongeboue", "Terrarat"], ["Roc"], "beast", 73, [18], 1, "g", "def", 4],
  [["Luciole", "Lucéclat"], ["Lumière"], "bird", 88, [21], 1, "g", "spe", 2],
  [["Grenouillard", "Marécroc"], ["Onde", "Sève"], "biped", 95, [24], 1, "w", "bal", 3],
  [["Ombreuil", "Noirécu"], ["Ombre"], "beast", 104, [23], 1, "g", "spd", 2],
  [["Serpenfeuille", "Lianeur"], ["Sève"], "serpent", 117, [19], 1, "g", "atk", 3],
  // --- Région 2 : Archipel des Marées
  [["Écumet", "Marévent"], ["Onde", "Vent"], "bird", 131, [30], 2, "w", "spd", 4],
  [["Crabosel", "Crabaron"], ["Roc", "Onde"], "beast", 142, [32], 2, "g", "def", 4],
  [["Méduson", "Médulux"], ["Onde", "Foudre"], "spirit", 153, [31], 2, "w", "spe", 3],
  [["Corailine", "Coraliss"], ["Roc", "Lumière"], "fish", 164, [33], 2, "w", "tank", 2],
  [["Voltapin", "Voltigeur"], ["Foudre"], "beast", 175, [29], 2, "g", "spd", 3],
  [["Pinsoleil", "Solairon"], ["Lumière", "Vent"], "bird", 186, [34], 2, "g", "spe", 2],
  [["Anguillon", "Voltanguille"], ["Foudre", "Onde"], "serpent", 197, [32], 2, "w", "atk", 2],
  [["Tortidune", "Tortisable"], ["Roc"], "biped", 208, [30], 2, "g", "tank", 3],
  [["Ombrécif"], ["Ombre", "Onde"], "fish", 219, [], 2, "w", "atk", 1],
  // --- Région 3 : Pics de Givre
  [["Floconnet", "Givrelin", "Blizzarck"], ["Givre"], "spirit", 233, [36, 48], 3, "g", "spe", 4],
  [["Oursnoir", "Ourglace"], ["Givre"], "beast", 244, [42], 3, "g", "atk", 3],
  [["Picrocaille", "Montagron"], ["Roc", "Givre"], "biped", 255, [44], 3, "c", "def", 3],
  [["Harfroid", "Hiboréal"], ["Vent", "Givre"], "bird", 266, [43], 3, "g", "spd", 3],
  [["Lynxombre", "Lynxéclair"], ["Foudre", "Ombre"], "beast", 277, [45], 3, "g", "atk", 2],
  [["Givrelame"], ["Givre"], "serpent", 288, [], 3, "c", "atk", 1],
  [["Glacieuse"], ["Esprit", "Givre"], "spirit", 299, [], 3, "c", "spe", 1],
  [["Gemmouche", "Cristallys"], ["Roc", "Lumière"], "spirit", 310, [46], 3, "c", "tank", 2],
  // --- Région 4 : Couronne Éteinte
  [["Cendrin", "Cendréon"], ["Flamme", "Ombre"], "beast", 321, [58], 4, "g", "atk", 3],
  [["Ruinard", "Golemruine"], ["Roc", "Esprit"], "biped", 332, [60], 4, "c", "tank", 3],
  [["Spectrelle", "Lamentine"], ["Esprit", "Ombre"], "spirit", 343, [59], 4, "c", "spe", 3],
  [["Corbeille", "Corbânes"], ["Ombre", "Vent"], "bird", 354, [57], 4, "g", "spd", 3],
  [["Magmaserpe", "Magmaroi"], ["Flamme", "Roc"], "serpent", 365, [61], 4, "c", "atk", 2],
  [["Éclisombre"], ["Lumière", "Ombre"], "fish", 376, [], 4, "w", "spe", 1],
  [["Vestige"], ["Esprit"], "biped", 387, [], 4, "c", "bal", 1],
];
const LEGENDS = [
  ["Sylvaure", ["Sève", "Lumière"], "beast", 501, "Bourgeon d'aurore", 50],
  ["Abyssel", ["Onde", "Ombre"], "serpent", 502, "Abîme", 55],
  ["Boréon", ["Givre", "Vent"], "bird", 503, "Hiver éternel", 60],
  ["Pyrolithe", ["Flamme", "Roc"], "biped", 504, "Cœur de lave", 65],
  ["Noctem", ["Ombre", "Esprit"], "spirit", 505, "Oubli", 70],
  ["Solenne", ["Lumière", "Flamme"], "bird", 506, "Dernier soleil", 75],
];

const LORE = {
  Braisillon: "Une braise tombée du Soleil-Cœur lui a donné vie. Il a toujours un peu froid.",
  Ondelle: "Née d'une larme versée dans le lac. Elle chante quand quelqu'un est triste.",
  Pousselin: "Pousse là où un Watcher est enterré. Les anciens disent qu'il se souvient d'eux.",
  Brumelin: "Fait de brume et de souvenirs oubliés. Il se dissipe si personne ne pense à lui.",
  Ombrécif: "On dit qu'il garde les noyés. Il ne remonte jamais à la surface.",
  Glacieuse: "Le dernier soupir d'un voyageur perdu dans la tempête, figé pour toujours.",
  Vestige: "Il erre dans les ruines en cherchant un maître mort depuis des siècles.",
  Sylvaure: "La forêt l'a rêvé pour se protéger de la nuit.",
  Abyssel: "Il dort sous l'Archipel. Les marées sont sa respiration.",
  Boréon: "Ses ailes ont figé les Pics en une seule nuit.",
  Pyrolithe: "Le cœur de la montagne. Il brûle depuis que le soleil s'est tu.",
  Noctem: "Il garde tout ce qu'on a voulu oublier. Il connaît le nom de Lys.",
  Solenne: "La dernière flamme du Soleil-Cœur. Elle ne suffira pas.",
  "L'Éclipse": "",
};

// Statistiques de base générées par rôle et par stade
const ROLE = { atk: [.95, 1.3, .9, .8, .85, 1.1], def: [1.05, .95, 1.35, .75, 1, .85], spe: [.9, .75, .85, 1.35, 1.1, 1.05], spd: [.85, 1.05, .8, .95, .8, 1.45], bal: [1, 1, 1, 1, 1, 1], tank: [1.35, .9, 1.15, .8, 1.15, .65] };
const SPECIES = {};
const DEX = []; // ordre du Carnet
function makeSpecies(name, types, shape, seed, stage, nStages, role, region, extra = {}) {
  const bst = extra.bst || (nStages === 1 ? 440 : [300, 420, 520][stage - 1] + (nStages === 2 && stage === 2 ? 50 : 0)) + (region - 1) * 18;
  const w = ROLE[role], sum = w.reduce((a, b) => a + b, 0);
  const base = w.map((v) => Math.round(bst * v / sum));
  const sp = { name, types, shape, seed, stage: extra.legend ? 3 : stage + (nStages === 1 ? 1 : 0), region, base, role, catchRate: extra.legend ? 3 : Math.round(200 - stage * 55 - (region - 1) * 8), xp: Math.round(bst / 5.5), legend: !!extra.legend, lore: LORE[name] || "" , ...extra };
  SPECIES[name] = sp; DEX.push(name); return sp;
}
for (const [names, types, shape, seed, evo, region, habitat, role, rarity] of LINES) {
  names.forEach((n, i) => {
    const sp = makeSpecies(n, types, shape, seed, i + 1, names.length, role, region, { habitat, rarity: rarity || 0, starter: habitat === "starter" });
    if (names[i + 1]) { sp.evolveTo = names[i + 1]; sp.evolveAt = evo[i]; }
    if (i > 0) sp.evolveFrom = names[i - 1];
  });
}
for (const [n, types, shape, seed, sig, lvl] of LEGENDS) makeSpecies(n, types, shape, seed, 3, 1, "bal", 5, { legend: true, bst: 600, signature: sig, level: lvl });
makeSpecies("L'Éclipse", ["Ombre", "Lumière"], "spirit", 777, 3, 1, "bal", 5, { legend: true, bst: 680, signature: "Éclipse totale", secret: true });

// Apprentissage : attaques des types de l'espèce, de la plus faible à la plus forte
function learnset(sp) {
  if (sp._learn) return sp._learn;
  const pool = MOVE_LIST.filter(([, t]) => sp.types.includes(t)).map(([n]) => MOVES[n]).filter((m) => !LEGENDS.some((L) => L[4] === m.name) && m.name !== "Éclipse totale");
  pool.sort((a, b) => (a.power || 55) - (b.power || 55));
  const list = [[1, "Charge"], [1, sp.role === "def" || sp.role === "tank" ? "Carapace" : "Rugissement"]];
  const lvls = [5, 9, 14, 19, 25, 31, 38, 45, 53, 62, 72, 85];
  pool.forEach((m, i) => { if (i < lvls.length) list.push([lvls[i], m.name]); });
  if (sp.signature) list.push([1, sp.signature]);
  list.push([20, "Concentration"]);
  return (sp._learn = list.sort((a, b) => a[0] - b[0]));
}

// ------------------------------------------------------------------ Objets
// kind : heal | revive | cure | lantern | trade | key ; price en Éclats (0 = non vendu)
const ITEMS = {
  soin: { name: "Fiole de soin", desc: "+20 PV", kind: "heal", amount: 20, price: 150, tab: "Soins" },
  supersoin: { name: "Super fiole", desc: "+60 PV", kind: "heal", amount: 60, price: 400, tab: "Soins" },
  soinmax: { name: "Fiole d'aurore", desc: "Tous les PV", kind: "heal", amount: 9999, price: 1200, tab: "Soins" },
  revive: { name: "Plume d'éveil", desc: "Ranime à 50 %", kind: "revive", amount: .5, price: 900, tab: "Soins" },
  revivemax: { name: "Plume d'aube", desc: "Ranime à 100 %", kind: "revive", amount: 1, price: 0, tab: "Soins" },
  antidote: { name: "Herbe violette", desc: "Soigne le poison", kind: "cure", cures: ["psn"], price: 100, tab: "Soins" },
  antibrule: { name: "Herbe bleue", desc: "Soigne la brûlure", kind: "cure", cures: ["brn"], price: 120, tab: "Soins" },
  antigel: { name: "Herbe rouge", desc: "Dégèle", kind: "cure", cures: ["frz"], price: 120, tab: "Soins" },
  reveil: { name: "Herbe de rosée", desc: "Réveille / soigne la paralysie", kind: "cure", cures: ["slp", "par"], price: 120, tab: "Soins" },
  totalsoin: { name: "Herbe d'or", desc: "Soigne tout état", kind: "cure", cures: ["psn", "brn", "frz", "par", "slp"], price: 450, tab: "Soins" },
  lanterne: { name: "Lanterne", desc: "Capture standard", kind: "lantern", bonus: 1, price: 200, tab: "Lanternes" },
  grande: { name: "Grande Lanterne", desc: "Meilleure chance", kind: "lantern", bonus: 1.6, price: 600, tab: "Lanternes" },
  aube: { name: "Lanterne d'Aube", desc: "Excellente chance", kind: "lantern", bonus: 2.5, price: 1500, tab: "Lanternes" },
  eternelle: { name: "Lanterne Éternelle", desc: "Capture à coup sûr", kind: "lantern", bonus: 999, price: 0, tab: "Lanternes" },
  baie: { name: "Baie rouge", desc: "S'échange chez les marchands", kind: "trade", price: 0, sell: 40, tab: "Divers" },
  baiebleue: { name: "Baie bleue", desc: "S'échange chez les marchands", kind: "trade", price: 0, sell: 60, tab: "Divers" },
  cristal: { name: "Cristal d'éclat", desc: "Très précieux", kind: "trade", price: 0, sell: 500, tab: "Divers" },
  lettre: { name: "Lettre scellée", desc: "Pour la veuve du phare", kind: "key", tab: "Quête" },
  lanteteinte: { name: "Lanterne éteinte", desc: "Pour la fabricante de Brindille", kind: "key", tab: "Quête" },
  medaillon: { name: "Médaillon de Lys", desc: "Encore tiède", kind: "key", tab: "Quête" },
  boussole: { name: "Boussole gelée", desc: "Pointe vers le nord, toujours", kind: "key", tab: "Quête" },
  plumeor: { name: "Plume dorée", desc: "Celle de Pépin", kind: "key", tab: "Quête" },
};
const ITEM_ICON = { soin: "soin", supersoin: "supersoin", soinmax: "soinmax", revive: "revive", revivemax: "revivemax", antidote: "antidote", antibrule: "antibrule", antigel: "antigel", reveil: "totalsoin", totalsoin: "totalsoin", lanterne: "lanterne", grande: "grande", aube: "aube", eternelle: "eternelle", baie: "baie", baiebleue: "baiebleue", cristal: "cristal", lettre: "lettre", lanteteinte: "lanterne", medaillon: "cristal", boussole: "cristal", plumeor: "revive" };
// Échanges : [donné, qté, reçu, qté]
const TRADES = [["baie", 3, "aube", 1], ["baiebleue", 5, "revive", 1], ["cristal", 1, "eternelle", 1], ["baie", 2, "supersoin", 1], ["baiebleue", 2, "totalsoin", 1]];
