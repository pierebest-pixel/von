/* Watchers — cartes des 4 régions, PNJ, dresseurs, boss, objets, légendaires. */
"use strict";
// ------------------------------------------------------------------ Constructeur de cartes
function B(w, h, g = ".") {
  const a = Array.from({ length: h }, () => Array(w).fill(g));
  const o = {
    set(x, y, c) { if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = c; return o; },
    rect(x, y, ww, hh, c) { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) o.set(i, j, c); return o; },
    trees(x, y, ww, hh, c = "T") { for (let j = y; j < y + hh; j += 2) for (let i = x; i < x + ww; i += 2) o.rect(i, j, 2, 2, c); return o; },
    border(c = "T") { o.trees(0, 0, w, 2, c); o.trees(0, h - 2, w, 2, c); o.trees(0, 0, 2, h, c); o.trees(w - 2, 0, 2, h, c); return o; },
    open(side, from, len = 2, f = "p") { if (side === "up") o.rect(from, 0, len, 2, f); if (side === "down") o.rect(from, h - 2, len, 2, f); if (side === "left") o.rect(0, from, 2, len, f); if (side === "right") o.rect(w - 2, from, 2, len, f); return o; },
    house(x, y) { return o.rect(x, y, 4, 4, "H"); },
    scatter(c, n, seed, on = ".") { let s = seed; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); for (let k = 0, t = 0; k < n && t < 500; t++) { const x = Math.floor(r() * w), y = Math.floor(r() * h); if (a[y][x] === on) { a[y][x] = c; k++; } } return o; },
    rows() { return a.map((r) => r.join("")); },
  };
  return o;
}
const MAPS = {};
const defMap = (m) => (MAPS[m.id] = m);

// Tables de Watchers sauvages : [espèce, niv min, niv max, habitat g|w, poids]
const W1 = [["Brumelin", 3, 6, "g", 2], ["Mousseron", 3, 6, "g", 3], ["Plumeau", 2, 5, "g", 5], ["Rongeboue", 3, 6, "g", 4], ["Luciole", 4, 7, "g", 2], ["Ombreuil", 4, 7, "g", 2], ["Serpenfeuille", 3, 6, "g", 3]];
const W1b = [["Brumelin", 9, 13, "g", 3], ["Ombreuil", 9, 13, "g", 3], ["Serpenfeuille", 9, 13, "g", 3], ["Hibrume", 12, 14, "g", 2], ["Champolin", 12, 14, "g", 1], ["Mousseron", 9, 12, "g", 2], ["Luciole", 10, 13, "g", 2], ["Grenouillard", 10, 14, "w", 3], ["Ondelle", 10, 13, "w", 1]];
const W2 = [["Crabosel", 17, 22, "g", 3], ["Voltapin", 17, 22, "g", 3], ["Pinsoleil", 18, 23, "g", 2], ["Tortidune", 17, 22, "g", 3], ["Écumet", 18, 24, "w", 3], ["Méduson", 18, 24, "w", 3], ["Corailine", 19, 24, "w", 2], ["Anguillon", 19, 25, "w", 2], ["Ombrécif", 21, 26, "w", 1]];
const W3 = [["Floconnet", 32, 38, "g", 3], ["Oursnoir", 32, 38, "g", 3], ["Harfroid", 33, 39, "g", 3], ["Lynxombre", 34, 40, "g", 2], ["Givrelin", 37, 41, "g", 1]];
const W3c = [["Picrocaille", 36, 42, "g", 3], ["Givrelame", 37, 43, "g", 2], ["Glacieuse", 38, 44, "g", 1], ["Gemmouche", 36, 42, "g", 3]];
const W4 = [["Cendrin", 50, 56, "g", 3], ["Ruinard", 50, 56, "g", 3], ["Spectrelle", 51, 57, "g", 3], ["Corbeille", 50, 56, "g", 3], ["Magmaserpe", 52, 58, "g", 2], ["Vestige", 54, 60, "g", 1], ["Éclisombre", 54, 60, "w", 2]];

// ================================================================== RÉGION 1 — Vallée des Brumes
{
  const m = B(16, 24).border().open("up", 6);
  m.rect(6, 2, 2, 20, "p").rect(2, 9, 12, 1, "p").rect(4, 12, 8, 1, "p");
  m.house(2, 4).house(10, 4).rect(12, 8, 1, 1, "p");
  m.set(7, 11, "h").set(5, 8, "S").set(11, 17, "S");
  m.rect(2, 15, 4, 1, "F").rect(10, 15, 4, 1, "F");
  m.trees(2, 18, 2, 2).trees(12, 18, 2, 2).trees(2, 20, 4, 2).trees(10, 20, 4, 2).rect(6, 20, 4, 2, ".");
  m.scatter("f", 10, 3).scatter(",", 12, 5);
  defMap({
    id: "brindille", name: "Brindille", region: 1, place: "brindille", rows: m.rows(), music: "region1",
    fx: { a1: .3, a2: .75 },
    exits: [{ side: "up", a: 6, b: 7, map: "route1", lock: (G) => !!G.save.starter, lockMsg: "Alba t'attend près de l'autel avant ton départ." }],
    signs: { "5,8": "Brindille — le village des lanternes.", "11,17": "« Ici repose Lune, Watcher de la famille Ardent. Elle éclairait nos nuits. »" },
    npcs: [
      npc("alba", 9, 11, "left", LOOKS.alba, "Alba", async (G) => {
        if (!G.save.starter) return STORY.chooseStarter(G);
        await G.say("Alba", G.flag("ending") ? "Tu es revenu… sans lui. La lumière que tu as donnée nous suffit pour voir nos visages. C'est déjà beaucoup." : "Touche l'autel pour soigner tes Watchers. Lys le faisait chaque matin avant de partir.");
      }),
      npc("maelle", 11, 13, "down", LOOKS.maelle, "Vieille Maëlle", async (G) => {
        if (!G.save.starter) return G.say("Vieille Maëlle", "Ta sœur est passée par ici, il y a trois hivers… Elle portait la même lanterne que toi. Va voir Alba, à l'autel.");
        await G.say("Vieille Maëlle", G.bossCount(1) < 3 ? ["Lys a pris le Sentier des Brumes, vers le Bois-Murmure. Elle disait que la forêt se souvenait de la lumière.", "Si la brume te bloque, touche les champignons qui brillent : ils la chassent."] : "Tu as grandi, petit. Lys serait fière… si elle te voyait.");
      }),
      npc("ernest", 3, 17, "right", LOOKS.ernest, "Ernest", async (G) => {
        const q = G.quest("pepin");
        if (!q) { await G.say("Ernest", ["Pépin… mon vieux Plumeau. Quinze hivers qu'il dort sur mon épaule.", "Il ne mange plus. Il tremble. On dit que l'Herbe d'or soigne tout… Il en pousse dans le Bois-Murmure, paraît-il.", "Je suis trop vieux pour y aller. Tu voudrais bien… ?"]); G.setQuest("pepin", 0); return; }
        if (q.done) return G.say("Ernest", "Je garde sa plume dorée dans ma poche. Comme ça, il est encore un peu sur mon épaule.");
        if (!G.has("totalsoin")) return G.say("Ernest", "Pépin t'attend… Il ouvre les yeux à chaque fois que la porte grince.");
        G.take("totalsoin");
        await G.say("Ernest", ["Tu l'as trouvée ! Pépin, regarde… regarde ce qu'on t'a ramené.", "…", "Il l'a sentie. Il a levé la tête, il a chanté. Une seule fois. Comme avant.", "Et puis il s'est endormi.", "…Il ne se réveillera pas, hein.", "Merci, petit. Grâce à toi, il est parti en chantant. Pas en tremblant.", "Prends sa plume. Et ça… je n'en aurai plus besoin."]);
        G.give("plumeor"); G.give("revivemax", 2); G.setQuest("pepin", 1, true);
      }),
      npc("iris", 12, 8, "down", LOOKS.iris, "Iris", async (G) => {
        const q = G.quest("lanternes"); const n = G.save.bag.lanteteinte || 0;
        if (!q) { await G.say("Iris", ["Je fabrique les lanternes de Brindille. Trois d'entre elles ont été emportées par la brume la nuit où le soleil a faibli.", "Si tu en trouves dans la Vallée, rapporte-les-moi. Je saurai les rallumer."]); G.setQuest("lanternes", Math.min(3, n)); return; }
        if (q.done) return G.say("Iris", "Les trois lanternes brillent à nouveau devant ma porte. Une pour chaque enfant du village qui n'est pas revenu.");
        if (n < 3) return G.say("Iris", `Tu en as trouvé ${n} sur 3. Elles brillent faiblement quand on s'en approche.`);
        G.take("lanteteinte", 3);
        await G.say("Iris", ["Les trois ! Regarde… elles se rallument dans mes mains.", "Celle-ci était celle de Lys, tu sais. Elle me l'avait commandée pour toi, pour tes dix ans.", "Garde ces Grandes Lanternes. Elles capturent bien mieux que les miennes."]);
        G.give("grande", 3); G.setQuest("lanternes", 3, true);
      }),
      npc("bram", 2, 12, "right", LOOKS.marchand, "Bram", (G) => UI.shop({ look: LOOKS.marchand, line: "Les lanternes se font rares depuis que le soleil faiblit… Choisis bien, voyageur.", stock: ["lanterne", "soin", "antidote", "reveil", "antibrule"] })),
    ],
  });
}
{
  const m = B(16, 36).border().open("down", 6).open("up", 6).open("right", 16);
  m.rect(6, 0, 2, 36, "p").rect(8, 16, 8, 2, "p");
  m.rect(2, 2, 4, 6, '"').rect(10, 4, 4, 6, '"').rect(2, 22, 4, 8, '"').rect(10, 24, 4, 6, '"');
  m.rect(8, 16, 2, 2, "M").set(9, 15, "m").set(8, 32, "S").set(12, 13, "r").set(3, 13, "r");
  m.trees(10, 20, 4, 2).trees(2, 16, 4, 4);
  m.scatter("f", 8, 11).scatter(",", 10, 13);
  defMap({
    id: "route1", name: "Sentier des Brumes", region: 1, place: "brindille", rows: m.rows(), wild: W1, roamers: 8,
    exits: [{ side: "down", a: 6, b: 7, map: "brindille" }, { side: "up", a: 6, b: 7, map: "boismurmure" }, { side: "right", a: 16, b: 17, map: "lacpale", dy: -4 }],
    signs: { "8,32": "↑ Bois-Murmure     → Lac Pâle" },
    items: [{ x: 3, y: 25, item: "lanteteinte" }, { x: 12, y: 6, item: "baie" }, { x: 13, y: 28, item: "soin" }, { x: 4, y: 3, item: "lanterne", qty: 2 }],
    npcs: [
      trainer("t_gamin1", 9, 8, "left", LOOKS.gamin, "Timothée", "Gamin", [["Plumeau", 4], ["Rongeboue", 5]], "Hé ! Tu as une lanterne, toi aussi ? Montre-moi ce que vaut ton Watcher !", "Bon, d'accord… t'es fort.", "Ma mère dit que les Watchers deviennent plus forts quand on croit en eux."),
      trainer("t_disc1", 4, 26, "right", LOOKS.disciple, "Disciple", "Ordre du Crépuscule", [["Ombreuil", 6], ["Brumelin", 7]], "La lumière s'éteint. Pourquoi lutter contre ce qui est inévitable ?", "Tu ne fais que retarder la nuit…", "Maître Varn attend dans le Bois-Murmure. Il saura te faire comprendre."),
      npc("p_route", 9, 30, "left", LOOKS.erudite, "Voyageuse", "Les Watchers sauvages se cachent dans les hautes herbes. Regarde bien : l'herbe frémit là où ils sont. Approche-toi pour les affronter."),
    ],
    enter: (G) => STORY.progress(),
  });
}
{
  const m = B(16, 26).border().open("left", 12);
  m.rect(4, 6, 8, 8, "w").rect(2, 12, 2, 2, "p").rect(2, 14, 12, 2, "p");
  m.rect(2, 2, 2, 4, ".").rect(2, 6, 2, 1, "M").set(3, 8, "m").rect(2, 7, 2, 5, ".");
  m.trees(4, 2, 10, 4).trees(12, 6, 2, 6);
  m.rect(2, 18, 4, 4, '"').rect(10, 18, 4, 4, '"').rect(6, 18, 4, 2, ".");
  m.trees(6, 20, 4, 4);
  m.set(2, 3, "f").set(3, 2, "f").set(3, 4, "f").set(12, 16, "S");
  m.scatter("f", 6, 21).scatter(",", 8, 23);
  defMap({
    id: "lacpale", name: "Lac Pâle", region: 1, place: "lacpale", rows: m.rows(), wild: W1b.filter((e) => e[3] === "w").concat(W1.slice(0, 5)), roamers: 7,
    exits: [{ side: "left", a: 12, b: 13, map: "route1", dy: 4 }],
    signs: {
      "12,16": "Lac Pâle. « On dit que les larmes qui tombent ici deviennent des Watchers. »",
      "8,13": (G) => { const q = G.quest("berceuse"); if (q && q.step === 0) { G.setQuest("berceuse", 1); G.give("cristal"); return "Tu te penches sur l'eau. Le chant monte… Sous la surface, un petit Watcher bleu tourne en rond, seul, en chantant une berceuse. Il tient dans sa bouche un cristal qu'il laisse tomber à tes pieds, puis il s'enfonce dans le noir."; } return "L'eau est calme. Si calme qu'on y voit les étoiles qui ne sont plus là."; },
    },
    items: [{ x: 13, y: 18, item: "lanteteinte" }, { x: 5, y: 21, item: "baiebleue" }],
    legend: [{ x: 2, y: 3, species: "Sylvaure", when: (G) => G.flag("beat:ysolde"), text: "Dans le bosquet, la brume s'écarte. Un Watcher couvert de feuilles d'or lève la tête : Sylvaure, le rêve de la forêt." }],
    npcs: [
      npc("nina", 3, 16, "right", LOOKS.nina, "Nina", async (G) => {
        const q = G.quest("berceuse");
        if (!q) { await G.say("Nina", ["Chut… tu l'entends ? Quelqu'un chante sous l'eau.", "C'est la berceuse que mon grand frère me chantait. Il est parti pêcher le soir où le soleil a faibli. Il n'est pas revenu.", "Tu veux bien regarder ? Moi j'ai peur de l'eau, maintenant."]); G.setQuest("berceuse", 0); return; }
        if (q.done) return G.say("Nina", "Je viens chanter avec lui tous les soirs. Il m'entend, je le sais.");
        if (q.step === 0) return G.say("Nina", "Le chant vient du milieu du lac… juste là, au bord du chemin.");
        await G.say("Nina", ["Un petit Watcher bleu… qui chante la berceuse de mon frère ?", "…Alors il n'est pas tout seul, là-dessous. Quelqu'un garde sa chanson.", "Merci. Je crois que je vais pouvoir dormir, ce soir."]);
        G.setQuest("berceuse", 1, true); G.give("aube");
      }),
      trainer("ysolde", 12, 15, "left", LOOKS.ysolde, "Ysolde", "Gardienne de la Brume", [["Luciole", 13], ["Brumoral", 15], ["Lucéclat", 16]], "La brume garde les souvenirs de ceux qui sont partis. Lys y a laissé les siens. Prouve que tu mérites de les voir.", "Tu as la même lumière qu'elle… Va. Le bosquet derrière le lac s'est ouvert pour toi.", "Lys pleurait souvent, ici. Elle disait qu'elle avait peur de ne pas être assez forte.", { boss: true, sight: 0 }),
    ],
  });
}
{
  const m = B(16, 34).border().open("down", 6).open("up", 6);
  m.rect(6, 0, 2, 34, "p");
  m.trees(2, 2, 4, 4).trees(10, 2, 4, 2).trees(2, 12, 2, 4).trees(12, 24, 2, 2).trees(2, 28, 2, 4).trees(10, 30, 4, 2);
  m.rect(2, 6, 4, 6, '"').rect(10, 6, 4, 4, '"').rect(2, 18, 4, 6, '"').rect(8, 26, 4, 4, '"');
  m.rect(10, 14, 4, 6, "."); m.rect(10, 13, 4, 1, "F").rect(9, 14, 1, 1, "F").rect(9, 19, 1, 1, "F").rect(8, 16, 2, 1, "p");
  m.rect(12, 26, 2, 2, "M").set(11, 29, "m").set(12, 28, ".").set(13, 28, ".").rect(12, 28, 2, 2, ".");
  m.set(9, 31, "h").set(8, 4, "f").set(9, 3, "f").set(5, 31, "S");
  m.scatter(",", 10, 31);
  defMap({
    id: "boismurmure", name: "Bois-Murmure", region: 1, place: "boismurmure", rows: m.rows(), wild: W1b.filter((e) => e[3] === "g"), roamers: 8,
    fx: { a1: .5, a2: .95, outer: 110 },
    exits: [{ side: "down", a: 6, b: 7, map: "route1" }, { side: "up", a: 6, b: 7, map: "portsel", lock: (G) => G.bossCount(1) >= 3, lockMsg: "Des racines géantes barrent le chemin. Elles ne s'écarteront que pour qui a vaincu les trois puissances de la Vallée." }],
    signs: { "5,31": "Bois-Murmure. Les arbres parlent la nuit. Ne leur réponds pas." },
    items: [{ x: 13, y: 28, item: "totalsoin" }, { x: 2, y: 10, item: "lanteteinte" }, { x: 11, y: 7, item: "supersoin" }, { x: 3, y: 21, item: "baie", qty: 2 }],
    npcs: [
      trainer("t_disc2", 4, 24, "right", LOOKS.disciple, "Disciple", "Ordre du Crépuscule", [["Brumelin", 10], ["Ombreuil", 11]], "Le camp du maître Varn est interdit aux porteurs de lumière !", "Je dois prévenir le maître…", "La lumière fait mal, à la fin. Tu verras."),
      trainer("t_disc3", 9, 22, "left", LOOKS.disciple, "Disciple", "Ordre du Crépuscule", [["Serpenfeuille", 11], ["Noirécu", 12]], "Retourne chez toi tant que tu as encore un chez-toi.", "Impossible…", "Le maître dit qu'il a connu ta sœur."),
      trainer("varn", 11, 16, "left", LOOKS.varn, "Varn", "Commandant de l'Ordre", [["Ombreuil", 13], ["Brumelin", 14], ["Noirécu", 15]], "Une Ardent. Encore. Ta sœur aussi croyait pouvoir sauver le soleil. Regarde où ça l'a menée.", "…Elle se battait exactement comme toi.", "Prends ce médaillon. Lys l'a perdu ici, en fuyant vers le nord. Je l'ai gardé… je ne sais pas pourquoi.", { boss: true, sight: 0, onWin: (G) => G.say("Varn", ["Lys est montée vers la Couronne, là où le soleil se meurt. Maël l'attendait.", "Je n'ai pas eu le courage de la suivre."]) }),
      trainer("sylve", 7, 4, "down", LOOKS.sylve, "Sylve", "Gardienne de la forêt", [["Mousseron", 12], ["Serpenfeuille", 13], ["Champolin", 15]], "La forêt a vu passer ta sœur. Elle a vu ses larmes. Montre-moi que tu ne pleureras pas devant l'obstacle.", "Les arbres s'écartent devant toi, petit porteur de lumière.", "Quand tu auras vaincu les trois puissances, les racines au nord te laisseront passer.", { boss: true, sight: 0 }),
    ],
    enter: (G) => STORY.progress(),
  });
}

// ================================================================== RÉGION 2 — Archipel des Marées
{
  const m = B(16, 24).border("q").open("down", 6);
  m.rect(2, 2, 12, 4, "w").rect(6, 0, 2, 7, "n").rect(0, 0, 16, 2, "w").rect(6, 0, 2, 2, "n");
  m.rect(6, 6, 2, 16, "p").rect(2, 12, 12, 1, "p");
  m.house(2, 7).house(10, 7).house(10, 16);
  m.set(4, 14, "h").set(8, 20, "S").set(3, 18, "s").set(13, 13, "s").rect(8, 3, 3, 1, "n").set(8, 5, "n");
  m.scatter(",", 10, 41);
  defMap({
    id: "portsel", name: "Port-Sel", region: 2, place: "portsel", rows: m.rows(), music: "region2", outside: "w", void: "#1f5a8a",
    fx: { tint: "90,30,80", a1: .2, a2: .45, outer: 140 },
    exits: [{ side: "down", a: 6, b: 7, map: "boismurmure" }, { side: "up", a: 6, b: 7, map: "recifs" }],
    signs: { "8,20": "Port-Sel. « Ceux qui partent en mer laissent une lanterne à la fenêtre. »" },
    npcs: [
      npc("jules", 5, 16, "right", LOOKS.jules, "Jules", async (G) => {
        const q = G.quest("facteur");
        if (!q) { await G.say("Jules", ["Je suis le facteur… enfin, j'étais. Plus personne ne s'écrit depuis que le soleil faiblit.", "Il me reste une lettre. Pour Anna, la veuve du Phare. Elle vient de son mari… écrite le jour du naufrage.", "Je n'ai jamais eu le courage de la lui porter. Tu veux bien ?"]); G.give("lettre"); G.setQuest("facteur", 0); return; }
        await G.say("Jules", q.done ? "Merci. J'ai enfin rendu mon dernier courrier." : "Le Phare est au nord, au-delà des Récifs. Attends la marée basse pour passer.");
      }),
      npc("tom", 10, 3, "left", LOOKS.tom, "Vieux Tom", async (G) => {
        const q = G.quest("marin");
        if (!q) { await G.say("Vieux Tom", ["J'attends l'Aurore, mon bateau. Elle devait rentrer ce soir.", "…Ce soir, ou un autre soir. Je ne sais plus très bien.", "Tu pourrais regarder du côté des Récifs ? Elle a une proue peinte en rouge."]); G.setQuest("marin", 0); return; }
        if (q.done) return; // Tom n'est plus là
        if (q.step === 0) return G.say("Vieux Tom", "L'Aurore… tu l'as vue ?");
        await G.say("Vieux Tom", ["Tu l'as trouvée… échouée. Avec mon nom gravé sur la barre.", "Alors c'est ça. Ce n'est pas elle qui ne rentrait pas.", "C'est moi.", "…Merci, petit. Je crois que je peux arrêter d'attendre."]);
        G.setQuest("marin", 1, true); G.give("baiebleue", 5);
        World.npcs = World.npcs.filter((n) => n.id !== "tom"); UI.toast("Le vieux Tom s'est effacé dans les embruns.");
      }, { when: (G) => !G.quest("marin")?.done }),
      npc("vendeuse2", 3, 13, "right", LOOKS.pecheuse, "Coralie", (G) => UI.shop({ look: LOOKS.pecheuse, line: "Les marées montent plus haut chaque année. Achète vite, avant qu'elles n'emportent ma boutique !", stock: ["lanterne", "grande", "soin", "supersoin", "antidote", "reveil", "revive"] })),
      trainer("marea", 8, 5, "left", LOOKS.marea, "Maréa", "Capitaine", [["Écumet", 22], ["Crabosel", 23], ["Médulux", 25]], "La mer prend tout ce qu'on lui confie. Mes hommes, mon navire… Voyons si elle te prendra aussi.", "Tu tiens la barre comme un vrai marin.", "Avec un Watcher de type Onde, tu peux traverser l'eau profonde. Avance simplement vers la mer.", { boss: true, sight: 0, onWin: async (G) => { G.setFlag("surf"); await G.say("Maréa", ["Écoute-moi : grimpe sur le dos d'un Watcher de type Onde, et la mer te portera.", "Ta sœur est passée par ici. Elle a traversé à la nage, sans peur. Elle cherchait le Phare."]); } }),
    ],
    enter: (G) => STORY.progress(),
  });
}
{
  const m = B(16, 36, "w");
  m.rect(4, 30, 8, 6, ".").rect(6, 30, 2, 6, "p").rect(2, 32, 2, 2, '"').rect(10, 31, 3, 3, '"');
  m.rect(6, 25, 2, 5, "~").rect(4, 20, 9, 5, ".").rect(5, 21, 3, 3, '"').rect(10, 18, 3, 4, "n").set(11, 18, "S");
  m.rect(7, 15, 2, 5, "~").rect(3, 10, 10, 5, ".").rect(9, 11, 3, 3, '"').rect(4, 11, 3, 2, '"');
  m.rect(6, 6, 2, 4, "~").rect(5, 2, 6, 4, ".").rect(6, 0, 2, 2, "~");
  m.rect(1, 3, 2, 2, ".").rect(1, 5, 2, 5, "~").rect(3, 4, 2, 1, "~").set(1, 3, "r").set(2, 2, "r");
  m.set(4, 22, "r").set(12, 12, "r").set(10, 3, "s").set(9, 33, "s");
  defMap({
    id: "recifs", name: "Récifs des Marées", region: 2, place: "portsel", rows: m.rows(), music: "region2", tide: true, outside: "w", void: "#1f5a8a", wild: W2, roamers: 9,
    fx: { tint: "90,30,80", a1: .25, a2: .5, outer: 140, particles: "rgba(220,240,255,.5)", fall: .2 },
    exits: [{ side: "down", a: 4, b: 11, map: "portsel", x: 7, y: 0 }, { side: "up", a: 6, b: 7, map: "phare" }],
    signs: { "11,18": (G) => { const q = G.quest("marin"); if (q && q.step === 0) { G.setQuest("marin", 1); return "L'épave d'un bateau à la proue rouge : l'Aurore. Sur la barre, un nom gravé au couteau : « Tom »."; } return "L'épave de l'Aurore. Les vagues lui chantent quelque chose."; } },
    items: [{ x: 12, y: 21, item: "cristal" }, { x: 2, y: 7, item: "aube" }, { x: 5, y: 3, item: "supersoin", qty: 2 }, { x: 11, y: 33, item: "baiebleue", qty: 2 }],
    legend: [{ x: 1, y: 4, species: "Abyssel", text: "Dans la grotte marine découverte par la marée, quelque chose respire. Les vagues se retirent avec lui : Abyssel." }],
    npcs: [
      trainer("t_pech1", 9, 23, "left", LOOKS.pecheuse, "Lou", "Pêcheuse", [["Écumet", 19], ["Corailine", 20]], "La marée basse, c'est l'heure des combats !", "La mer t'aime bien, on dirait.", "Quand la marée monte, les bancs de sable disparaissent. Compte tes pas !"),
      trainer("t_pech2", 5, 13, "right", LOOKS.pecheuse, "Mara", "Pêcheuse", [["Méduson", 21], ["Anguillon", 21], ["Crabosel", 22]], "Hé, ne marche pas sur mes filets !", "Bon… tu peux passer.", "Il y a une grotte à l'ouest. On n'y entre qu'à marée basse."),
      trainer("brann", 11, 22, "left", LOOKS.brann, "Brann", "Corsaire de l'Ordre", [["Voltapin", 24], ["Anguillon", 25], ["Ombrécif", 27]], "L'Ordre a besoin d'Abyssel. Et toi, tu es sur mon épave.", "Maël ne va pas être content…", "Maël a perdu son Watcher le jour où le soleil a faibli. Depuis, il veut arrêter le temps. Tu comprends ça ?", { boss: true, sight: 0 }),
    ],
    enter: (G) => STORY.progress(),
  });
}
{
  const m = B(16, 24, "w");
  m.rect(3, 6, 10, 16, ".").rect(6, 20, 2, 4, "~").rect(6, 12, 2, 8, "p").house(6, 7).rect(7, 6, 2, 1, ".");
  m.rect(12, 14, 4, 2, "n").rect(4, 16, 3, 3, '"').rect(10, 18, 2, 3, '"');
  m.set(9, 12, "h").set(4, 13, "S").set(5, 9, "s").set(11, 9, "r");
  defMap({
    id: "phare", name: "Le Phare", region: 2, place: "phare", rows: m.rows(), music: "region2", outside: "w", void: "#1f5a8a", wild: W2.filter((e) => e[3] === "g"), roamers: 3,
    fx: { tint: "90,30,80", a1: .25, a2: .5, outer: 140 },
    exits: [{ side: "down", a: 6, b: 7, map: "recifs" }],
    warps: { "15,14": { to: "cimeblanche", x: 7, y: 21, dir: "up", lock: (G) => G.bossCount(2) >= 3, lockMsg: "Le passeur refuse de partir : « Les Pics, c'est pour ceux qui ont vaincu l'Archipel. Reviens quand Maréa, Brann et Oren t'auront reconnu. »" }, "15,15": { to: "cimeblanche", x: 7, y: 21, dir: "up", lock: (G) => G.bossCount(2) >= 3, lockMsg: "Le passeur secoue la tête. « Pas encore. »" } },
    signs: { "4,13": "Le Phare. Sa flamme brûle encore. C'est la dernière de l'Archipel." },
    npcs: [
      npc("anna", 5, 11, "right", LOOKS.anna, "Anna", async (G) => {
        const q = G.quest("facteur");
        if (!q || q.done) return G.say("Anna", q?.done ? "Je relis sa lettre chaque soir, à la lumière du phare." : "Mon mari gardait ce phare. Depuis le naufrage, c'est moi qui l'allume. Pour qu'il trouve le chemin… s'il revient.");
        G.take("lettre");
        await G.say("Anna", ["Une lettre ? De… c'est son écriture.", "« Anna. La mer est trop forte, cette nuit. Si cette lettre t'arrive, c'est que je ne rentrerai pas.", "N'éteins pas le phare. Pas pour moi : pour ceux qui rentrent encore. Je t'aime. »", "…", "Il savait. Il savait, et il a pensé aux autres.", "Merci. Prends ça. Il voulait l'offrir à notre fille… nous n'en avons jamais eu."]);
        G.give("aube", 2); G.setQuest("facteur", 0, true);
      }),
      npc("passeur", 13, 13, "down", LOOKS.tom, "Passeur", (G) => G.say("Passeur", G.bossCount(2) >= 3 ? "Monte sur la barque, au bout du ponton. Je t'emmène aux Pics de Givre." : "Je n'emmène personne aux Pics tant que l'Archipel ne t'a pas reconnu.")),
      trainer("oren", 9, 7, "down", LOOKS.oren, "Oren", "Gardien du Phare", [["Pinsoleil", 25], ["Tortisable", 27], ["Solairon", 29]], "La flamme de ce phare est un morceau du Soleil-Cœur. Je la garde depuis cinquante ans. Montre-moi la tienne.", "Ta lumière est jeune… mais elle ne vacille pas.", "Lys est venue ici. Elle m'a demandé si la flamme pouvait rallumer le soleil. Je lui ai dit non. Elle est partie quand même.", { boss: true, sight: 0 }),
    ],
  });
}

// ================================================================== RÉGION 3 — Pics de Givre
{
  const m = B(16, 24).border("P").open("up", 6).open("down", 6, 2, "p");
  m.rect(6, 0, 2, 24, "p").rect(2, 11, 12, 1, "p");
  m.house(2, 4).house(10, 4).house(10, 14);
  m.set(4, 13, "h").set(8, 17, "c").set(5, 9, "S").rect(2, 16, 3, 3, '"');
  m.scatter(",", 10, 51);
  defMap({
    id: "cimeblanche", name: "Cime-Blanche", region: 3, place: "cimeblanche", rows: m.rows(), music: "region3", outside: "P", void: "#0a1018",
    fx: { tint: "10,20,40", a1: .3, a2: .6, particles: "rgba(255,255,255,.85)" },
    exits: [{ side: "up", a: 6, b: 7, map: "lacgele" }, { side: "down", a: 6, b: 7, map: "phare", x: 13, y: 14 }],
    signs: { "5,9": "Cime-Blanche. Le feu ne s'éteint jamais, ici. Sinon, on meurt." },
    enter: (G) => { G.save.cold = 100; G.save.lastFire = ["cimeblanche", 8, 18]; STORY.progress(); },
    npcs: [
      npc("leo", 9, 18, "left", LOOKS.leo, "Léo", async (G) => {
        const q = G.quest("feux"); const n = G.count("feux");
        if (!q) { await G.say("Léo", ["Mon papa est parti allumer les trois feux du Lac Gelé, pour guider les voyageurs.", "Il n'est jamais redescendu. Maman dit qu'il est devenu une étoile.", "Tu peux allumer les feux à sa place ? Comme ça, il saura qu'on pense à lui."]); G.setQuest("feux", Math.min(3, n)); return; }
        if (q.done) return G.say("Léo", "La nuit, je vois les trois feux depuis ma fenêtre. Je lui fais coucou.");
        if (n < 3) return G.say("Léo", `Tu en as allumé ${n} sur 3. Touche les foyers de pierre du Lac Gelé.`);
        await G.say("Léo", ["Les trois brûlent ! Je les vois d'ici !", "…Tu crois qu'il les voit, lui aussi ?", "Tiens. C'était à lui. Il disait que ça porte chance."]);
        G.give("revive", 3); G.give("boussole"); G.setQuest("feux", 3, true);
      }),
      npc("mira", 12, 19, "down", LOOKS.mira, "Mira", async (G) => {
        const q = G.quest("traineau");
        if (!q) { await G.say("Mira", ["Flocon, mon Oursnoir, a suivi une odeur dans la Grotte Bleue. Il y a deux jours.", "Je n'ai pas le droit d'y aller, c'est trop dangereux. Tu pourrais… le chercher ?"]); G.setQuest("traineau", 0); return; }
        if (q.done) return G.say("Mira", "J'ai accroché son collier au-dessus de mon lit. Il fait toujours du bruit quand il y a du vent.");
        if (q.step === 0) return G.say("Mira", "Flocon a un collier rouge avec une clochette. Tu l'entendras peut-être.");
        await G.say("Mira", ["Juste… son collier ?", "…", "Il est parti en dormant, au chaud contre la glace bleue ? Il aimait tant le froid.", "Merci de me l'avoir dit en vrai. Pas en mentant."]);
        G.give("supersoin", 3); G.setQuest("traineau", 1, true);
      }),
      npc("vendeur3", 3, 12, "down", LOOKS.montagnard, "Hector", (G) => UI.shop({ look: LOOKS.montagnard, line: "Prends des herbes rouges : le gel, ça ne pardonne pas, là-haut.", stock: ["grande", "aube", "supersoin", "soinmax", "antigel", "totalsoin", "revive"] })),
    ],
  });
}
{
  const m = B(16, 34).border("P").open("down", 6).open("up", 6);
  m.rect(6, 22, 2, 12, "p").rect(6, 0, 2, 9, "p");
  m.rect(2, 9, 12, 13, "i");
  // Rochers du puzzle de glace
  [[4, 11], [9, 12], [12, 15], [3, 17], [8, 19], [11, 20], [5, 14], [10, 9], [6, 10], [7, 13], [2, 12], [13, 18]].forEach(([x, y]) => m.set(x, y, "r"));
  m.rect(2, 24, 3, 6, '"').rect(10, 25, 4, 5, '"').rect(2, 3, 3, 4, '"').rect(10, 2, 4, 4, '"');
  m.set(9, 28, "c").set(3, 22, "c").set(12, 7, "c").set(8, 31, "S");
  defMap({
    id: "lacgele", name: "Lac Gelé", region: 3, place: "cimeblanche", rows: m.rows(), music: "region3", cold: true, outside: "P", void: "#0a1018", wild: W3, roamers: 8,
    fx: { tint: "10,20,40", a1: .4, a2: .62, particles: "rgba(255,255,255,.85)" },
    exits: [{ side: "down", a: 6, b: 7, map: "cimeblanche" }, { side: "up", a: 6, b: 7, map: "grotte" }],
    signs: { "8,31": "Lac Gelé. Sur la glace, on glisse jusqu'à heurter quelque chose. Réfléchis avant de bouger." },
    items: [{ x: 13, y: 10, item: "soinmax" }, { x: 2, y: 20, item: "cristal" }, { x: 12, y: 27, item: "antigel", qty: 2 }],
    npcs: [
      trainer("t_mont1", 11, 28, "left", LOOKS.montagnard, "Bastien", "Montagnard", [["Oursnoir", 33], ["Harfroid", 34]], "Le froid forge les vrais dresseurs !", "Brr… bien joué.", "Reste près des feux. Sans eux, le froid te tue en quelques minutes."),
      trainer("nivea", 8, 4, "down", LOOKS.nivea, "Nivéa", "Commandante de l'Ordre", [["Lynxombre", 38], ["Ourglace", 40], ["Givrelin", 41]], "Le soleil s'éteint et tu cours après. Maël, lui, a choisi de figer la douleur dans la glace. C'est plus sage.", "Tu… n'as pas peur du froid ?", "Lys a traversé ce lac. Elle s'est arrêtée au feu du nord, et elle a pleuré. Je l'ai vue. Je n'ai rien fait.", { boss: true, sight: 0 }),
    ],
    enter: (G) => STORY.progress(),
  });
  // Les feux de la quête : allumer = interagir
  const base = Object.assign({}, MAPS.lacgele.signs);
  for (const [x, y] of [[9, 28], [3, 22], [12, 7]]) {
    MAPS.lacgele.signs[x + "," + y] = (G) => {
      const k = "feu:" + x + "," + y;
      G.save.cold = 100; G.save.lastFire = ["lacgele", x, y + 1];
      if (G.flag(k)) return "Le feu crépite. Tu te réchauffes.";
      G.setFlag(k); const n = G.inc("feux"); const q = G.quest("feux");
      if (q && !q.done) G.save.quests.feux.step = Math.min(3, n);
      return `Tu ravives le feu de camp. Les flammes montent haut dans la nuit. (${n}/3)`;
    };
  }
}
{
  const m = B(16, 30, "e").border("R").open("down", 6, 2, "e").open("up", 6, 2, "e");
  m.trees(2, 8, 4, 2, "R").trees(10, 12, 4, 2, "R").trees(2, 18, 2, 4, "R").trees(12, 22, 2, 2, "R");
  m.rect(6, 2, 4, 4, "e").rect(2, 2, 4, 4, '"').rect(10, 4, 4, 6, '"').rect(4, 22, 6, 4, '"').rect(4, 12, 4, 4, '"');
  m.set(12, 20, "k").set(3, 14, "k").set(8, 27, "h");
  defMap({
    id: "grotte", name: "Grotte Bleue", region: 3, place: "grotte", rows: m.rows(), music: "region3", outside: "R", void: "#05080c", wild: W3c, roamers: 8,
    fx: { tint: "5,10,25", a1: .55, a2: .92, outer: 100 },
    exits: [{ side: "down", a: 6, b: 7, map: "lacgele" }, { side: "up", a: 6, b: 7, map: "glacier" }],
    signs: { "12,20": (G) => { const q = G.quest("traineau"); if (q && q.step === 0) { G.setQuest("traineau", 1); return "Contre le cristal bleu, un Oursnoir est couché, roulé en boule. Il ne respire plus. Il a l'air d'avoir eu chaud jusqu'au bout. Tu détaches doucement son collier rouge. La clochette tinte une dernière fois."; } return "Le cristal bleu irradie une chaleur étrange."; } },
    items: [{ x: 13, y: 5, item: "aube" }, { x: 2, y: 3, item: "totalsoin" }, { x: 9, y: 24, item: "cristal" }],
    npcs: [
      trainer("t_erud", 10, 17, "left", LOOKS.erudite, "Sabine", "Érudite", [["Gemmouche", 37], ["Picrocaille", 38], ["Glacieuse", 39]], "Ces cristaux sont des morceaux de soleil tombés il y a mille ans !", "Fascinant… tu es un phénomène.", "Les cristaux s'éteignent un à un. Comme le reste."),
      trainer("givrel", 7, 3, "down", LOOKS.givrel, "Givrel", "Ermite des cimes", [["Glacieuse", 41], ["Montagron", 43], ["Cristallys", 44]], "Tu cherches ta sœur. Je sais où elle est. Gagne, et je te le dirai.", "…Alors écoute.", "Lys a atteint le Cœur Éteint. Elle a voulu donner sa lumière au soleil. Ça n'a pas suffi. Son Watcher a refusé de la laisser partir seule… il est devenu une ombre. Elle aussi, un peu.", { boss: true, sight: 0, onWin: (G) => G.say("Givrel", ["Lys est morte là-haut. Je suis désolé.", "Ce qui reste d'elle garde encore le chemin. Si tu y vas, c'est elle que tu affronteras."]) }),
    ],
  });
}
{
  const m = B(16, 26).border("P").open("down", 6).open("up", 6);
  m.rect(6, 0, 2, 26, "p").rect(4, 2, 8, 3, ".").set(7, 2, ".");
  m.rect(2, 14, 4, 6, '"').rect(10, 12, 4, 8, '"').rect(2, 6, 3, 4, "i").rect(11, 4, 3, 3, "i");
  m.set(9, 22, "c").set(4, 23, "h").set(5, 3, "r").set(10, 3, "r").set(8, 21, "S");
  defMap({
    id: "glacier", name: "Sommet du Glacier", region: 3, place: "cimeblanche", rows: m.rows(), music: "region3", cold: true, outside: "P", void: "#0a1018", wild: W3, roamers: 7,
    fx: { tint: "10,20,40", a1: .4, a2: .65, particles: "rgba(255,255,255,.95)", drift: 3, fall: 2 },
    exits: [{ side: "down", a: 6, b: 7, map: "grotte" }, { side: "up", a: 6, b: 7, map: "portes", lock: (G) => G.bossCount(3) >= 3, lockMsg: "Un mur de glace scelle le passage vers la Couronne. Il ne cède que devant qui a vaincu les trois puissances des Pics." }],
    signs: { "8,21": "Sommet du Glacier. Au-delà : la Couronne Éteinte." },
    legend: [{ x: 7, y: 2, species: "Boréon", when: (G) => G.flag("beat:bor"), text: "Le vent tombe d'un coup. Sur le pic, un oiseau immense déploie des ailes de givre : Boréon." }],
    npcs: [
      trainer("t_mont2", 9, 16, "left", LOOKS.montagnard, "Rurik", "Montagnard", [["Harfroid", 39], ["Montagron", 41]], "Personne ne passe le Glacier sans mon autorisation !", "Passe, alors…", "Bor ne parle pas beaucoup. Il frappe."),
      trainer("bor", 7, 8, "down", LOOKS.bor, "Bor", "Gardien du Glacier", [["Ourglace", 44], ["Montagron", 45], ["Blizzarck", 47]], "…", "…Passe.", "Le froid garde les morts intacts. Ta sœur est là-haut. Intacte.", { boss: true, sight: 0 }),
    ],
    enter: (G) => STORY.progress(),
  });
}

// ================================================================== RÉGION 4 — Couronne Éteinte
{
  const m = B(16, 34, "e").border("X").open("down", 6, 2, "e").open("up", 6, 2, "e");
  m.rect(6, 0, 2, 34, "p");
  m.trees(2, 2, 4, 2, "#").trees(10, 2, 4, 2, "#");
  m.rect(2, 8, 3, 3, "l").rect(11, 9, 3, 3, "l").rect(2, 22, 4, 5, '"').rect(10, 24, 4, 5, '"').rect(10, 14, 4, 4, '"');
  m.rect(2, 13, 2, 2, ".").set(2, 12, "M").set(3, 12, "M").set(4, 15, "k").rect(2, 14, 2, 1, ".");
  [[3, 5], [12, 5], [3, 20], [12, 20], [5, 30]].forEach(([x, y]) => m.set(x, y, "b"));
  [[4, 18], [11, 21], [9, 12], [4, 28], [12, 31]].forEach(([x, y]) => m.set(x, y, "S"));
  m.set(9, 31, "h");
  const stele = (i, txt) => (G) => {
    const k = "stele" + i;
    if (!G.flag(k)) { G.setFlag(k); const n = G.inc("steles"); const q = G.quest("noms"); if (q && !q.done) G.save.quests.noms.step = Math.min(5, n); }
    return txt;
  };
  defMap({
    id: "portes", name: "Portes de la Couronne", region: 4, place: "couronne", rows: m.rows(), music: "region4", dark: true, outside: "X", void: "#060306", wild: W4, roamers: 8,
    fx: { tint: "8,2,8", particles: "rgba(255,120,60,.7)", fall: -.6 },
    exits: [{ side: "down", a: 6, b: 7, map: "glacier" }, { side: "up", a: 6, b: 7, map: "salles", lock: (G) => G.flag("beat:cendre"), lockMsg: "Une porte de cendre brûlante barre le passage. Cendre la garde." }],
    signs: {
      "4,18": stele(1, "« Ici repose Arwen, qui donna sa lumière pour le premier hiver. »"), "11,21": stele(2, "« Ici repose Théo et son Watcher Cendrin. Ils sont partis ensemble. »"),
      "9,12": stele(3, "« Ici repose Maëva, gardienne du Cœur. Elle a tenu cent ans. »"), "4,28": stele(4, "« Ici repose Éli, le Watcher de Maël. Pardonne-moi. »"),
      "12,31": stele(5, "« Ici repose Lys Ardent. Elle avait peur. Elle est venue quand même. »"),
    },
    items: [{ x: 2, y: 13, item: "eternelle" }, { x: 13, y: 26, item: "soinmax", qty: 2 }, { x: 3, y: 24, item: "revivemax" }],
    legend: [{ x: 12, y: 12, species: "Pyrolithe", text: "La lave se soulève. Un colosse de roche en fusion se redresse : Pyrolithe, le cœur de la montagne." }],
    npcs: [
      npc("pelerin", 8, 30, "left", LOOKS.pelerin, "Pèlerin", async (G) => {
        const q = G.quest("noms"); const n = G.count("steles");
        if (!q) { await G.say("Pèlerin", ["On a gravé ici le nom de ceux qui ont donné leur lumière au soleil.", "Je viens les lire, un par un, pour qu'ils ne soient pas oubliés. Mes yeux ne voient plus. Tu veux bien les lire pour moi ?"]); G.setQuest("noms", Math.min(5, n)); return; }
        if (q.done) return G.say("Pèlerin", "Tant que quelqu'un se souvient d'un nom, il n'est pas tout à fait éteint.");
        if (n < 5) return G.say("Pèlerin", `Tu en as lu ${n} sur 5.`);
        await G.say("Pèlerin", ["Lys Ardent… Ardent. C'est ton nom, n'est-ce pas ?", "Je suis désolé, enfant. Prends ceci. Elle me l'avait confiée en passant… elle disait qu'elle ne saurait pas s'en servir à temps."]);
        G.give("eternelle"); G.setQuest("noms", 5, true);
      }),
      trainer("cendre", 7, 6, "down", LOOKS.cendre, "Cendre", "Gardien éteint", [["Cendréon", 59], ["Magmaroi", 61], ["Corbânes", 62]], "Je brûlais, autrefois. Maintenant je ne suis plus que ce qui reste après le feu.", "La porte… s'ouvre.", "Nous avons tous essayé de rallumer le soleil. Nous avons tous échoué.", { boss: true, sight: 0 }),
      trainer("t_disc4", 9, 24, "left", LOOKS.disciple, "Disciple", "Ordre du Crépuscule", [["Spectrelle", 54], ["Ruinard", 55], ["Corbeille", 55]], "Personne ne dérange le Maître !", "Ah…", "Le Maître pleure, parfois, la nuit."),
    ],
    enter: (G) => { if (G.save.light == null) G.save.light = 100; STORY.progress(); },
  });
}
{
  const m = B(16, 34, "e").border("#").open("down", 6, 2, "e").open("up", 6, 2, "e");
  m.rect(6, 26, 2, 8, "p").rect(2, 24, 12, 2, "~").rect(4, 16, 8, 8, "i").rect(6, 12, 2, 4, "p");
  [[6, 18], [9, 20], [5, 22], [10, 17]].forEach(([x, y]) => m.set(x, y, "r"));
  m.rect(2, 4, 12, 7, "e").rect(2, 8, 3, 3, '"').rect(11, 8, 3, 3, '"').rect(2, 27, 3, 4, '"').rect(11, 27, 3, 4, '"');
  m.rect(6, 2, 2, 2, "M").set(5, 5, "k");
  [[3, 13], [12, 13], [8, 31]].forEach(([x, y]) => m.set(x, y, "b"));
  m.set(9, 31, "h");
  defMap({
    id: "salles", name: "Salles Englouties", region: 4, place: "couronne", rows: m.rows(), music: "region4", dark: true, tide: true, outside: "#", void: "#060306", wild: W4, roamers: 7,
    fx: { tint: "8,2,8" },
    exits: [{ side: "down", a: 6, b: 7, map: "portes" }, { side: "up", a: 6, b: 7, map: "coeur", lock: (G) => G.flag("beat:ecume") && G.flag("beat:silence"), lockMsg: "Deux sceaux, l'un d'eau, l'autre de silence, ferment la dernière porte." }],
    npcs: [
      trainer("ecume", 4, 6, "right", LOOKS.ecume, "Écume", "Gardienne éteinte", [["Éclisombre", 61], ["Voltanguille", 62], ["Abyssire", 64]], "Je me suis noyée dans ma propre marée en voulant éteindre le feu qui dévorait le soleil.", "Le sceau d'eau… se brise.", "Il n'y a plus de marée dans ces salles. Seulement des souvenirs qui montent et descendent.", { boss: true, sight: 0 }),
      trainer("silence", 11, 6, "left", LOOKS.silence, "Silence", "Gardien éteint", [["Lamentine", 62], ["Golemruine", 63], ["Vestige", 65]], "…", "…", "…Lys. Elle a ri, une fois, ici. C'est le dernier bruit que j'ai entendu.", { boss: true, sight: 0 }),
    ],
    enter: (G) => STORY.progress(),
  });
}
{
  const m = B(16, 24, "e").border("#").open("down", 6, 2, "e");
  m.rect(6, 12, 2, 12, "p").rect(3, 3, 10, 9, "e");
  m.set(7, 2, "k").set(8, 2, "k");
  [[3, 4], [12, 4], [3, 10], [12, 10]].forEach(([x, y]) => m.set(x, y, "b"));
  m.set(9, 20, "h");
  defMap({
    id: "coeur", name: "Cœur Éteint", region: 4, place: "couronne", rows: m.rows(), music: "region4", dark: true, outside: "#", void: "#060306",
    fx: { tint: "8,2,8", particles: "rgba(255,200,120,.6)", fall: -.4 },
    exits: [{ side: "down", a: 6, b: 7, map: "salles" }],
    legend: [
      { x: 4, y: 6, species: "Noctem", when: (G) => G.flag("ending"), text: "Dans l'ombre, une forme garde tout ce qu'on a voulu oublier. Elle connaît ton nom… et celui de Lys : Noctem." },
      { x: 11, y: 6, species: "Solenne", when: (G) => G.flag("ending"), text: "Une flamme minuscule danse au-dessus du sol. La dernière du Soleil-Cœur : Solenne." },
      { x: 7, y: 3, species: "L'Éclipse", when: (G) => G.flag("ending") && ["Sylvaure", "Abyssel", "Boréon", "Pyrolithe", "Noctem", "Solenne"].every((s) => G.save.caughtL.includes(s)) && !G.flag("beat:eclipse"), text: "Les six légendes frémissent dans leurs Lanternes. Au cœur du soleil éteint, quelque chose ouvre des yeux dorés. C'est lui qui a dévoré la lumière : L'Éclipse." },
    ],
    npcs: [
      trainer("lys", 7, 11, "down", LOOKS.lys, "Lys", "Ce qu'il reste d'elle", [["Brumoral", 68], ["Noirécu", 68], ["Lucéclat", 69], ["Blizzarck", 70], ["Abyssire", 70], ["Chênaclos", 72]], "…Petit frère ? Tu es venu. Tu n'aurais pas dû. Je ne contrôle plus… ce que je suis devenue.", "Tu es devenu si fort… Je suis fière de toi. Pardon de t'avoir laissé.", "", { boss: true, sight: 0, when: (G) => !G.flag("beat:lys"), onWin: async (G) => {
        await G.say("Lys", ["J'ai voulu donner ma lumière au soleil. Elle n'a pas suffi. Mon Watcher n'a pas voulu me laisser partir seule.", "Garde ma lanterne. Et ne fais pas la même erreur que moi… ou fais-la mieux.", "Je t'aime. Dis à Maëlle que j'ai pensé à elle."]);
        await G.say(null, "La silhouette de Lys se défait en poussière de lumière. Il ne reste que sa lanterne, encore tiède.");
        UI.fade(() => loadMap("coeur", World.px, World.py, World.dir));
      } }),
      trainer("mael", 7, 5, "down", LOOKS.mael, "Maël", "Maître du Crépuscule", [["Corbânes", 70], ["Cendréon", 71], ["Lamentine", 72], ["Golemruine", 72], ["Magmaroi", 73], ["Noirécu", 75]], "Tu as vaincu ce qui restait de ta sœur. Tu sais maintenant ce que ça fait de perdre. Laisse-moi figer le temps. Plus jamais personne ne perdra rien.", "…Éli. Pardonne-moi.", "Regarde le soleil, enfant. Il n'y a plus rien à sauver.", { boss: true, sight: 0, when: (G) => G.flag("beat:lys") && !G.flag("ending"), onWin: async (G) => { await STORY.ending(G); World.npcs = World.npcs.filter((n) => n.id !== "mael"); } }),
    ],
    enter: (G) => STORY.progress(),
  });
}
// Boss secret : L'Éclipse se combat comme un dresseur dans le Cœur (via la légende ci-dessus)
const _legendEnc = legendEncounter;
legendEncounter = async function (L) {
  if (L.species !== "L'Éclipse") return _legendEnc(L);
  G.busy = true; await UI.say(null, L.text); G.busy = false;
  const res = await Battle.start({ trainer: { id: "eclipse", name: "L'Éclipse", title: "", look: LOOKS.eclipse, boss: true, team: mons([["Noirécu", 100], ["Lamentine", 100], ["Infernoble", 100], ["Abyssire", 100], ["Golemruine", 100], ["L'Éclipse", 100]]), intro: "…", lose: "…la lumière… revient… un peu.", reward: 50000 } });
  if (res === "win") { G.setFlag("legend:L'Éclipse"); G.caught("L'Éclipse"); await UI.say(null, ["L'Éclipse se dissout. Au-dessus de la Couronne, le Soleil-Cœur s'éclaire d'un cran. Pas beaucoup. Assez pour qu'on voie l'aube, au loin.", "Tu as tout accompli. Merci d'avoir joué à Watchers."]); }
};
