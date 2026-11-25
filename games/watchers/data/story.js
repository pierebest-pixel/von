/* Watchers — histoire, quêtes, boss, dresseurs. */
"use strict";
const SK = TRAINER_ART.SKIN;
// Apparences validées (dresseurs et boss)
const LOOKS = {
  hero: { skin: SK[0], hair: "#1a1622", hairStyle: "hood", outfit: "cloak", main: "#1a1622", accent: "#5b1f86" },
  gamin: { skin: SK[0], hair: "#a0522d", hairStyle: "spiky", outfit: "coat", main: "#3a6a8a", accent: "#e8c830" },
  pecheuse: { skin: SK[2], hair: "#1a1418", hairStyle: "braid", outfit: "coat", main: "#2a7a6a", accent: "#f5d58a" },
  montagnard: { skin: SK[1], hair: "#c9c9c9", hairStyle: "short", outfit: "armor", main: "#5a6a7a", accent: "#a8c4e8" },
  disciple: { skin: SK[0], hairStyle: "hood", outfit: "robe", main: "#3a1a4a", accent: "#a3123a", mask: "#1a1418", eyes: "#ff5a3a" },
  erudite: { skin: SK[3], hair: "#3a2a20", hairStyle: "bun", outfit: "robe", main: "#6a4a2a", accent: "#c9a84a" },
  sylve: { skin: SK[1], hair: "#4e9a4a", hairStyle: "long", outfit: "robe", main: "#2f5a3a", accent: "#c4e06a", hat: "circlet", prop: "staff", aura: "#5ee0c6" },
  varn: { skin: SK[0], hairStyle: "hood", outfit: "cloak", main: "#2a1030", accent: "#a3123a", mask: "#120a10", prop: "sword" },
  ysolde: { skin: SK[4], hair: "#e8e3f0", hairStyle: "long", outfit: "robe", main: "#8a8aa8", accent: "#c46fb0", hat: "circlet", aura: "#c46fb0" },
  marea: { skin: SK[2], hair: "#1a1418", hairStyle: "long", outfit: "captain", main: "#1c3f7a", accent: "#f2b134", hat: "tricorne", prop: "sword" },
  brann: { skin: SK[1], hair: "#8a2a1a", hairStyle: "spiky", outfit: "coat", main: "#3a1a2a", accent: "#a3123a", cape: "#2a0a1a" },
  oren: { skin: SK[3], hair: "#e8e8e8", hairStyle: "short", outfit: "coat", main: "#c9a84a", accent: "#fff3a0", prop: "lantern", aura: "#ffd36b" },
  givrel: { skin: SK[4], hair: "#ffffff", hairStyle: "long", outfit: "cloak", main: "#5a78b8", accent: "#e8f4ff", prop: "staff", aura: "#8fd0e8" },
  nivea: { skin: SK[0], hair: "#c9def5", hairStyle: "bun", outfit: "armor", main: "#2a3a5a", accent: "#a3123a", cape: "#1a1a3a" },
  bor: { skin: SK[1], hair: "#5a3a22", hairStyle: "bald", outfit: "armor", main: "#8aa6d8", accent: "#e8f4ff", hat: "horns" },
  cendre: { skin: SK[5], hairStyle: "hood", outfit: "robe", main: "#3a1a1a", accent: "#ff5a3a", mask: "#1a0a0a", aura: "#ff5a3a" },
  ecume: { skin: SK[5], hair: "#3a5a7a", hairStyle: "long", outfit: "robe", main: "#1a2a3a", accent: "#5fa0b8", mask: "#0a1a2a", eyes: "#5ee0c6", aura: "#3b7dd8" },
  silence: { skin: SK[5], hairStyle: "hood", outfit: "cloak", main: "#1a1420", accent: "#6b4a96", mask: "#0a0810", eyes: "#a36bd6", aura: "#6b4a96" },
  lys: { skin: SK[4], hair: "#2a1a3a", hairStyle: "long", outfit: "cloak", main: "#2a2433", accent: "#5ee0c6", prop: "lantern", aura: "#5ee0c6", eyes: "#5ee0c6" },
  mael: { skin: SK[0], hair: "#e8e3f0", hairStyle: "long", outfit: "cloak", main: "#12061e", accent: "#ff9a4a", hat: "crown", prop: "staff", aura: "#a3123a", cape: "#4a0f3a" },
  eclipse: { skin: "#050203", hairStyle: "hood", outfit: "cloak", main: "#050203", accent: "#ff7a3a", mask: "#050203", eyes: "#ffd36b", aura: "#ff7a3a", hat: "crown", cape: "#120608" },
  // Habitants
  maelle: { skin: SK[1], hair: "#9a9aa0", hairStyle: "bun", outfit: "robe", main: "#3a2a4a", accent: "#8a7a9a" },
  alba: { skin: SK[0], hair: "#e8dcc0", hairStyle: "long", outfit: "robe", main: "#5a5a7a", accent: "#5ee0c6", hat: "circlet" },
  ernest: { skin: SK[1], hair: "#c9c9c9", hairStyle: "bald", outfit: "coat", main: "#4a3a2a", accent: "#8a6a4a" },
  iris: { skin: SK[0], hair: "#8a3a1a", hairStyle: "short", outfit: "coat", main: "#2a5a5a", accent: "#e8c830" },
  nina: { skin: SK[0], hair: "#e0b040", hairStyle: "braid", outfit: "robe", main: "#c46fb0", accent: "#ffffff" },
  marchand: { skin: SK[2], hair: "#7a5a3a", hairStyle: "short", outfit: "coat", main: "#5a2a4a", accent: "#c9a84a" },
  jules: { skin: SK[0], hair: "#2a2a2a", hairStyle: "short", outfit: "coat", main: "#2a3a5a", accent: "#e8c830" },
  anna: { skin: SK[1], hair: "#1a1418", hairStyle: "long", outfit: "robe", main: "#1a1a2a", accent: "#5a5a7a" },
  tom: { skin: SK[4], hair: "#e8e8e8", hairStyle: "short", outfit: "captain", main: "#2a3a4a", accent: "#8a9aa8" },
  leo: { skin: SK[0], hair: "#c9a84a", hairStyle: "spiky", outfit: "coat", main: "#a3123a", accent: "#ffffff" },
  mira: { skin: SK[3], hair: "#1a1418", hairStyle: "long", outfit: "armor", main: "#3a5a7a", accent: "#e8f4ff" },
  pelerin: { skin: SK[5], hairStyle: "hood", outfit: "cloak", main: "#2a2026", accent: "#8a7a6a" },
};

const BOSSES = { 1: ["sylve", "varn", "ysolde"], 2: ["marea", "brann", "oren"], 3: ["nivea", "givrel", "bor"], 4: ["cendre", "ecume", "silence", "lys", "mael"] };

const QUESTS = {
  main: { main: true, title: "Le Soleil-Cœur s'éteint", face: { look: LOOKS.maelle }, end: "Le soleil ne s'est pas rallumé. Mais tu es encore là.", steps: [
    "Parle à la gardienne Alba, près de l'autel de Brindille.",
    "Traverse le Sentier des Brumes. Lys est partie vers le Bois-Murmure.",
    "Affronte les trois puissances de la Vallée : Sylve, Varn et Ysolde.",
    "Rejoins Port-Sel, au nord du Bois-Murmure.",
    "Affronte Maréa, Brann et Oren dans l'Archipel des Marées.",
    "Prends le bateau du Phare vers les Pics de Givre.",
    "Affronte Nivéa, Givrel et Bor dans les Pics de Givre.",
    "Monte vers la Couronne Éteinte, au-delà du Glacier.",
    "Franchis les Gardiens éteints : Cendre, Écume et Silence.",
    "Atteins le Cœur Éteint. Lys t'y attend.",
  ] },
  pepin: { title: "Le dernier hiver de Pépin", face: { look: LOOKS.ernest }, end: "Pépin s'est endormi dans les bras d'Ernest.", steps: ["Le Watcher du vieil Ernest est très malade. Trouver une Herbe d'or.", "Rapporter l'Herbe d'or à Ernest, à Brindille."] },
  lanternes: { title: "Les lanternes perdues", face: { look: LOOKS.iris }, end: "Iris a rallumé les trois lanternes.", steps: ["Retrouver 3 lanternes éteintes dans la Vallée (0/3).", "Retrouver 3 lanternes éteintes dans la Vallée (1/3).", "Retrouver 3 lanternes éteintes dans la Vallée (2/3).", "Rapporter les 3 lanternes à Iris, à Brindille."] },
  berceuse: { title: "La berceuse du lac", face: { look: LOOKS.nina }, end: "Nina sait maintenant qui chantait.", steps: ["Nina entend chanter sous l'eau du Lac Pâle. Chercher d'où vient le chant.", "Raconter à Nina ce que tu as trouvé."] },
  facteur: { title: "Le facteur égaré", face: { look: LOOKS.jules }, end: "La lettre est enfin arrivée.", steps: ["Remettre la lettre scellée à Anna, la veuve du Phare."] },
  marin: { title: "Le marin qui attend", face: { look: LOOKS.tom }, end: "Le vieux Tom a fini d'attendre.", steps: ["Tom attend son bateau, l'Aurore. Le chercher dans les Récifs.", "Dire à Tom ce que tu as trouvé."] },
  feux: { title: "Les feux des cimes", face: { look: LOOKS.leo }, end: "Les trois feux brûlent pour le père de Léo.", steps: ["Allumer les 3 feux de camp du Lac Gelé (0/3).", "Allumer les 3 feux de camp du Lac Gelé (1/3).", "Allumer les 3 feux de camp du Lac Gelé (2/3).", "Revenir voir Léo à Cime-Blanche."] },
  traineau: { title: "Le collier de Flocon", face: { look: LOOKS.mira }, end: "Mira a gardé le collier.", steps: ["Mira a perdu son Watcher, Flocon, dans la Grotte Bleue.", "Rapporter la nouvelle à Mira."] },
  noms: { title: "Les noms gravés", face: { look: LOOKS.pelerin }, end: "Tu as lu tous les noms. Le dernier était celui de Lys.", steps: ["Lire les 5 stèles des Portes de la Couronne (0/5).", "Lire les stèles (1/5).", "Lire les stèles (2/5).", "Lire les stèles (3/5).", "Lire les stèles (4/5).", "Revenir voir le pèlerin."] },
};

const mons = (list) => list.map(([sp, lv]) => createMon(sp, lv, { shiny: false }));

// Dresseur sur la carte : se bat une fois, puis dit une phrase
function trainer(id, x, y, dir, look, name, title, team, intro, lose, after, extra = {}) {
  return {
    id, x, y, dir, look: { spec: look }, trainer: true, sight: extra.sight ?? 4, ...extra,
    async talk(G) {
      if (G.flag("beat:" + id)) return G.say(name, after);
      const res = await Battle.start({ trainer: { id, name, title, look, team: mons(team), intro, lose, boss: !!extra.boss, reward: extra.reward } });
      if (res === "win") { if (extra.onWin) await extra.onWin(G); STORY.progress(); }
    },
  };
}
// PNJ qui parle
const npc = (id, x, y, dir, look, name, talk, extra = {}) => ({ id, x, y, dir, look: { spec: look }, talk: typeof talk === "function" ? talk : (G) => G.say(name, talk), ...extra });

const STORY = {
  async intro() {
    const c = UI.add(el('<div class="cinema"><p></p></div>')); const p = c.querySelector("p");
    MUSIC.play("ending");
    const lines = [
      "Depuis des années, le Soleil-Cœur s'éteint.",
      "Les Watchers, nés de sa lumière et de nos souvenirs, s'affaiblissent avec lui.",
      "Il y a trois hivers, ta sœur Lys est partie comprendre pourquoi.",
      "Elle n'est jamais revenue.",
      "Ce matin, à Brindille, sa lanterne s'est rallumée toute seule.",
    ];
    for (const l of lines) {
      p.textContent = l; p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
      await new Promise((r) => { const t = setTimeout(r, 3200); const go = () => { clearTimeout(t); r(); }; c.onclick = go; Input.aListeners.push(go); });
      Input.aListeners = [];
    }
    c.remove();
    G.setQuest("main", 0);
  },

  // Recalcule l'étape de la quête principale d'après les drapeaux
  progress() {
    const s = G.save; if (!s.quests.main || s.quests.main.done) return;
    let step = 0;
    if (s.starter) step = 1;
    if (G.save.visited.includes("boismurmure")) step = 2;
    if (G.bossCount(1) >= 3) step = 3;
    if (s.regions.includes(2)) step = 4;
    if (G.bossCount(2) >= 3) step = 5;
    if (s.regions.includes(3)) step = 6;
    if (G.bossCount(3) >= 3) step = 7;
    if (s.regions.includes(4)) step = 8;
    if (["cendre", "ecume", "silence"].every((b) => G.flag("beat:" + b))) step = 9;
    if (step > s.quests.main.step) { s.quests.main.step = step; UI.toast("Quête mise à jour"); }
  },

  // Le choix du premier Watcher
  async chooseStarter(G) {
    await G.say("Alba", ["Te voilà. La lanterne de Lys s'est rallumée cette nuit… je l'ai vue briller depuis l'autel.", "Avant de partir, ta sœur m'a confié trois Lanternes. « Si mon frère vient un jour, qu'il en choisisse une », m'a-t-elle dit.", "Chacune abrite un Watcher qu'elle avait soigné. Choisis bien. Il te suivra jusqu'au bout."]);
    const opts = ["Braisillon (Flamme)", "Ondelle (Onde)", "Pousselin (Sève)"];
    let i;
    for (;;) {
      i = await G.ask("Quel Watcher choisis-tu ?", opts, "Alba");
      const sp = ["Braisillon", "Ondelle", "Pousselin"][i];
      const ok = await G.ask(`${sp} : « ${SPECIES[sp].lore} » Tu le choisis ?`, ["Oui", "Revoir"], "Alba");
      if (ok === 0) break;
    }
    const sp = ["Braisillon", "Ondelle", "Pousselin"][i];
    const m = createMon(sp, 5, { shiny: false, caughtIn: "Cadeau de Lys" });
    G.addMon(m); G.save.starter = m.uid; SFX.play("caught");
    G.give("lanterne", 5); G.give("soin", 2);
    await G.say("Alba", [`${sp} te regarde comme s'il te connaissait déjà.`, "Prends aussi ces Lanternes. Dans les hautes herbes, des Watchers sauvages se cachent : approche-toi d'eux pour les affronter, puis lance une Lanterne pour les capturer.", "Reviens toucher l'autel quand tes Watchers sont blessés. Et… ramène-la, si tu peux."]);
    STORY.progress();
  },

  // Fin du jeu : après Maël
  async ending(G) {
    const starter = G.save.party.find((m) => m.uid === G.save.starter) || G.save.box.find((m) => m.uid === G.save.starter);
    const name = starter ? starter.species : "ton premier Watcher";
    await G.say("Maël", ["Tu as gagné… et alors ? Regarde-le. Le Soleil-Cœur n'a plus rien à donner.", "Je voulais arrêter le temps pour que plus personne ne perde rien. Pour que plus personne ne perde… ce que j'ai perdu."]);
    await G.say(null, "Au centre de la salle, le Soleil-Cœur bat encore, très faiblement. Comme un cœur qui s'arrête.");
    await G.say(null, `${name} s'avance vers lui. Tu l'appelles. Il se retourne… et te regarde, comme le premier jour à Brindille.`);
    const c = UI.add(el('<div class="cinema"><p></p></div>')); const p = c.querySelector("p");
    MUSIC.play("ending");
    const lines = [
      `${name} entre dans la lumière.`,
      "Pendant un instant, tout devient blanc. Tu sens la chaleur de Lys, de ton village, de chaque Watcher que tu as croisé.",
      "Puis la lumière retombe.",
      "Le Soleil-Cœur ne s'est pas rallumé. Il brille juste assez pour que la nuit ne soit pas totale.",
      `${name} n'est pas revenu.`,
      "Le monde d'Aube restera dans la pénombre. Mais il est encore là.",
      "Toi aussi.",
    ];
    for (const l of lines) {
      p.textContent = l; p.style.animation = "none"; void p.offsetWidth; p.style.animation = "";
      await new Promise((r) => { const t = setTimeout(r, 4200); const go = () => { clearTimeout(t); r(); }; c.onclick = go; Input.aListeners.push(go); });
      Input.aListeners = [];
    }
    c.remove();
    if (starter) { G.save.party = G.save.party.filter((m) => m !== starter); G.save.box = G.save.box.filter((m) => m !== starter); }
    if (!G.save.party.length && G.save.box.length) G.save.party.push(G.save.box.shift());
    G.setFlag("ending");
    G.save.quests.main = { step: 9, done: true };
    G.give("medaillon", 1);
    await G.say(null, ["— FIN —", "Merci d'avoir joué. Deux présences nouvelles sont apparues dans le Cœur Éteint… et l'on dit que celui qui réunira les six légendes rencontrera ce qui a dévoré le soleil."]);
    MUSIC.play("region4");
    G.write();
  },
};
