/* Les Échoués de Kalua — le savoir de Nalia, la guide.
 * 1) Des thèmes à choisir (commandes, objets, zones, grottes, boss, quêtes, PNJ, magie…).
 * 2) La « Question personnalisée » : le joueur écrit librement ; on cherche dans une base de connaissances
 *    construite à la fois à la main ET à partir des données du jeu (objets, PNJ, boss, grottes, chants, quêtes),
 *    plus quelques réponses « en direct » (objectif, heure, vie, position). Aucune connexion internet n'est utilisée. */
"use strict";

const Guide = (() => {
  // ---------------------------------------------------------------- outils de texte
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const STOP = new Set("le la les un une des de du d l a au aux et ou est ce que qui quoi comment pourquoi quand quel quelle quels quelles je tu il elle on nous vous ils elles me te se mon ma mes ton ta tes son sa ses y en dans sur sous pour par avec sans pas ne plus moins tres bien faire fait peut peux veux dois doit faut il-y c ca cela ceci est-ce est ce sont etre avoir as ai a-t-il comme si mais donc alors trouver trouve trouves aller va vas sais savoir dire dis explique parle parles chose truc".split(" "));
  const stem = (w) => w.length > 4 ? w.replace(/(ements|ement|ations|ation|ages|age|euses|euse|eurs|eur|ees|ee|es|s|x|e)$/, "") : w;
  const SYN = { combat: ["combattre", "battre", "tuer", "frapper", "attaque", "attaquer", "taper", "vaincre"], vie: ["coeur", "coeurs", "pv", "sante", "soin", "soigner", "guerir", "mourir", "mort", "hp"], magie: ["chant", "chants", "sort", "sorts", "pouvoir", "pouvoirs", "magique", "spell"],
    bateau: ["navire", "naviguer", "barque", "mer", "voile", "traversee", "ile", "iles"], grotte: ["grottes", "donjon", "caverne", "salle", "salles"], boss: ["gardien", "gardiens", "monstre", "chef"], quete: ["quetes", "mission", "objectif", "aider"],
    commande: ["commandes", "bouton", "boutons", "touche", "touches", "controle", "controles", "jouer", "deplacer", "bouger"], sac: ["inventaire", "objets", "objet", "items"], endurance: ["fatigue", "stamina", "souffle", "essouffle"],
    carte: ["map", "minicarte", "mini-carte", "plan"], cle: ["cles", "porte", "verrou", "verrouille", "ferme"], nuit: ["jour", "heure", "soir", "matin"], arme: ["epee", "lame", "hache", "pioche", "outil", "outils", "forger", "forge"] };
  const SYNI = {}; for (const [k, L] of Object.entries(SYN)) for (const w of L) SYNI[stem(norm(w))] = k;
  const toks = (s) => { const out = []; for (let w of norm(s).split(" ")) { if (!w || STOP.has(w)) continue; w = stem(w); out.push(w); if (SYNI[w]) out.push(SYNI[w]); } return out; };

  // ---------------------------------------------------------------- base de connaissances écrite à la main
  const KB = [];
  const add = (cat, title, keys, text) => KB.push({ cat, title, keys: toks(keys + " " + title), text });
  // commandes et mécaniques
  add("commandes", "Se déplacer", "deplacer bouger fleches marcher courir commande", "Les flèches font marcher. SPRINT (le bouton jaune) fait courir, aussi longtemps que tu veux : sur Kalua, personne ne s'essouffle !");
  add("commandes", "Taper", "taper frapper attaquer couper casser arbre rocher", "TAPER frappe devant toi : les ennemis, mais aussi les arbres (bois), les rochers (pierre), les buissons, les leviers et les cristaux des grottes.");
  add("commandes", "Ramasser / Parler", "ramasser parler cueillir ouvrir coffre lire stele entrer interagir", "RAMASSER sert à tout le reste : parler aux gens, cueillir, ouvrir les coffres, lire les stèles, entrer dans les grottes, caresser les animaux.");
  add("commandes", "Esquiver", "esquiver esquive roulade eviter invincible", "ESQUIVE te fait rouler. Pendant la roulade, rien ne peut te toucher. C'est la meilleure défense contre les boss : regarde les zones rouges au sol, et roule hors d'elles.");
  add("commandes", "Chanter (magie)", "chant magie bouton violet lancer sort changer", "Le bouton violet ✨ CHANT lance le chant choisi. Le petit bouton ⇄ change de chant. Il n'y a pas de jauge : chaque chant revient tout seul après quelques secondes.");
  add("mecaniques", "Pas d'endurance", "endurance fatigue stamina jauge courir infini", "Il n'y a aucune endurance sur Kalua. Tu peux courir, esquiver et frapper autant que tu veux. Seuls les chants demandent d'attendre un peu.");
  add("mecaniques", "La vie et les cœurs", "vie coeur coeurs soigner mourir mort evanouir", "Tes cœurs sont en haut à gauche. La nourriture en rend (coco, banane, poisson, potion, ragoût de Jojo…). Si tu tombes à zéro, tu t'évanouis et tu te réveilles au village, ou à l'entrée de la grotte. Tu ne perds rien.");
  add("progression", "Augmenter sa vie : les Fils de vie", "augmenter vie max maximum coeur fils tikka tisser animaux plume ecaille laine corne", "Mère Tikka, au Marais des Brumes, tisse des Fils de vie avec ce que donnent les animaux : plumes, écailles, laine, cornes, carapaces, cuir. Chaque fil donne un cœur de plus, pour toujours. Il y en a huit. Le dernier demande une Larme dorée.");
  add("progression", "Les animaux dorés", "dore doree larme animal rare briller", "Parfois, un animal brille d'or. Ne le chasse pas : caresse-le (Ramasser). Il pleure une Larme dorée, pour le dernier Fil de vie. Les animaux dorés changent chaque jour.");
  add("mecaniques", "Chasser et caresser", "chasser chasse animaux caresser viande cuir plume", "Frappe un animal pour le chasser : il donne viande, cuir, plumes, écailles… Il reviendra plus tard. Ramasser le caresse. On ne chasse ni les chiens ni les chats, voyons.");
  add("mecaniques", "Récolter", "recolte recolter bois pierre fer obsidienne couper", "Tape trois fois un arbre pour du bois, un rocher pour de la pierre. Avec une hache ou une pioche, ça va deux fois plus vite, et la pioche donne du fer et de l'obsidienne. Tout repousse.");
  add("mecaniques", "Jour et nuit", "jour nuit heure soir matin temps", "Une journée sur Kalua dure vingt minutes. Les habitants changent d'endroit selon l'heure : ils dorment, pêchent, travaillent. Certaines choses n'arrivent que la nuit : les étoiles tombées, le fantôme d'Arnaud, l'Esprit des Brumes.");
  add("mecaniques", "La mini-carte et la carte", "carte minicarte ou suis plan losange jaune", "La mini-carte en haut à droite montre toute l'île : toi en bleu, ton cœur en rose, et un losange jaune pour l'objectif de ta quête. Touche-la pour la grande carte.");
  add("mecaniques", "Les points au-dessus des têtes", "point rouge noir marqueur tete pnj important", "Un point ROUGE au-dessus d'une tête : une grande quête t'attend. Un point NOIR : cette personne peut t'apprendre un chant magique. Un point orange avec un « ! » : une petite quête.");
  add("mecaniques", "Jouer à deux", "deux ami amoureux partenaire ensemble coop", "Vous êtes deux Échoués sur la même île. Chacun a son sac et ses quêtes, mais vous vous voyez en direct, même dans les grottes si vous êtes dans la même salle. La prophétie parle de deux cœurs… ce n'est pas un hasard.");
  add("mecaniques", "Le sac et l'atelier", "sac inventaire atelier etabli fabriquer corde torche potion", "Le Sac est dans le menu ≡. L'établi du village fabrique des cordes, des torches, des potions, des brochettes… Brann, au camp du volcan, forge les outils et les armes.");
  add("mecaniques", "Les armes", "arme epee lame obsidienne corail degats force", "Brann forge l'épée de corail (dégâts ×2) puis la lame d'obsidienne (×3), qui demande une écaille de dragon.");
  add("mecaniques", "Naviguer", "bateau naviguer ile phare tortues etoiles ponton", "Une fois la quête du capitaine Bastien finie, va au ponton du port : Maëlle t'emmène sur les trois îles, et vers les Gardiens de la mer.");
  // grottes et énigmes
  add("grottes", "Les grottes", "grotte grottes combien liste huit", "Il y a huit grottes. Sur la grande île : Racines (jungle), Marine (côte est), Brumes (marais), Vent (falaises), et le Cœur du Volcan. Sur les îles : Tortues, Phare, Étoiles. Les grottes 2, 4 et 8 se jouent au tour par tour, les autres en temps réel.");
  add("grottes", "Petites clés et grande clé", "cle cles porte verrouillee grande serrure coffre", "Dans une grotte, les petites clés ouvrent les portes à serrure dorée. La grande clé, dans un grand coffre violet, ouvre la porte du gardien de la grotte.");
  add("enigmes", "Blocs et plaques", "bloc pousser plaque pression bouton sol", "Marche contre un bloc pour le pousser. Pose-le sur une plaque de pression. Les blocs gris marqués ≋ sont trop lourds : il faut la Bourrasque.");
  add("enigmes", "Cristaux rouges et bleus", "cristal cristaux rouge bleu bloc baisser", "Frappe un cristal : les blocs rouges et bleus échangent leur place. Réfléchis au chemin avant de frapper.");
  add("enigmes", "Torches", "torche torches allumer eteinte ordre feu", "Les torches éteintes s'allument avec la Flamme (ou une torche, si tu en as une). Parfois, il faut respecter un ordre : lis les stèles.");
  add("enigmes", "Trous et lave", "trou vide gouffre lave tomber traverser pont", "Le Chant de la Racine fait un pont de lianes au-dessus des trous, face à toi. La Marée refroidit la lave quelques secondes.");
  add("enigmes", "Murs fissurés et secrets", "mur fissure secret passage cache casser", "Un mur fissuré sonne creux : l'Onde le brise. Derrière, il y a souvent un passage secret et un trésor.");
  add("enigmes", "Salles sombres", "sombre noir obscurite voir lumiere invisible", "Dans le noir, la Lueur éclaire la salle et montre les ponts invisibles.");
  add("enigmes", "Les stèles et énigmes", "stele enigme devinette reponse question ecrire", "Lis les stèles avec Ramasser. Certaines posent une devinette : choisis la bonne réponse, ou écris-la au clavier.");
  add("combat", "Combattre en temps réel", "combat temps reel boss vulnerable zone rouge", "Les boss annoncent leurs attaques : une zone rouge apparaît au sol, puis frappe. Esquive ! Beaucoup de boss ont une protection (🛡) : il faut trouver le bon moment, ou le bon chant, pour les toucher.");
  add("combat", "Combattre au tour par tour", "tour par tour parer timing anneau critique fuir", "Au tour par tour, touche l'écran quand l'anneau blanc arrive sur le vert : ton coup est critique. Quand l'ennemi attaque, touche au bon moment pour PARER. Les grosses attaques sont annoncées un tour avant (⚠) : pare-les, ou annule-les avec le bon chant.");
  // histoire (sans tout révéler)
  add("histoire", "Kalua", "kalua ile origine etoile coeur volcan", "Kalua est née d'une étoile vivante tombée dans la mer. Son cœur bat encore sous le volcan, et répand le Souffle : la lumière dont est faite la magie.");
  add("histoire", "La Cendre Noire", "cendre noire mal corruption monstres agressifs", "La Cendre Noire est sortie du Cœur quand il s'est fêlé, il y a sept cents ans. Elle rend les bêtes agressives et retient les morts dans la brume.");
  add("histoire", "Les Lumes", "lumes anciens peuple reine temple", "Les Lumes étaient le premier peuple de Kalua. Ils chantaient le Souffle. Leur dernière reine s'appelait Ilaïa… et c'est à cause d'elle que tout a basculé.");
  add("histoire", "Les Gardiens", "gardiens douze sceaux boss optionnels", "Douze grandes bêtes portent les Sceaux qui retiennent la Cendre. Chaque Gardien libéré affaiblit la Cendre — et ce qui se cache au fond du volcan.");

  // ---------------------------------------------------------------- connaissances tirées des données du jeu
  const SPOTNAME = (spot) => { const [x, y] = NPC.SPOT[spot] || [0, 0]; const w = KALUA.weights(x, y); let b = 0; for (let i = 1; i < 5; i++) if (w[i] > w[b]) b = i; return KALUA.mainD(x, y) > 1 ? "sur une île" : (Math.hypot(x - KALUA.VILLAGE.x, (y - KALUA.VILLAGE.y) * 1.25) < 120 ? "au village" : KALUA.BIOMES[b].name); };
  const ACT = { look: "regarde la mer", idle: "se promène", fish: "pêche", sleep: "dort", cook: "cuisine", pray: "prie", guard: "monte la garde", read: "lit", dig: "fouille", sing: "chante", dance: "danse", light: "allume les lanternes", tend: "s'occupe des bêtes ou des plantes", star: "observe les étoiles", forge: "forge", swim: "nage", play: "joue", haunt: "erre", walk: "marche", gone: "a disparu" };
  function dataKB() {
    const out = [];
    for (const n of NPC.list) {
      const sched = n.sched.map(([h, spot, act]) => `à ${h} h, ${ACT[act] || act} (${SPOTNAME(spot)})`).join(" ; ");
      out.push({ cat: "pnj", title: n.name, keys: toks(`${n.name} ${n.title} ${n.id} qui ou trouver`), text: () => Prog.isDead(n.id) ? `${n.name} n'est plus de ce monde. Je pense à lui souvent.` : `${n.name}, ${n.title}. Son emploi du temps : ${sched}.${n.role === "magic" ? " Cette personne enseigne un chant magique (point noir)." : n.role === "main" ? " C'est une personne importante de l'île (point rouge quand une grande quête attend)." : ""}` });
    }
    for (const [id, it] of Object.entries(ITEMS.L)) out.push({ cat: "objets", title: it[0], keys: toks(`${it[0]} ${id}`), text: () => `${it[0]} : ${it[2]} Tu en as ${Prog.count(id)}.` });
    for (const [id, f] of Object.entries(Battle.FOES)) if (f.boss && /^B\d+$/.test(id)) { const b = KALUA.BOSSES[Number(id.slice(1)) - 1];
      out.push({ cat: "boss", title: f.name, keys: toks(`${f.name} ${id} boss gardien`), text: () => `${f.name} (${id}) ${Prog.P.bosses[id] ? "est déjà libéré. Merci pour lui." : `dort ${b && b[3] ? "en mer (il faut le bateau)" : "à son repaire, indiqué par une couronne sur la carte"}.`} Conseil : ${f.hint || "observe ses attaques."}` }); }
    for (const [id, d] of Object.entries(RTBoss.DEF)) out.push({ cat: "boss", title: d.name, keys: toks(`${d.name} ${id} boss`), text: () => `${d.name} : ${d.guardHint || "esquive ses zones rouges et frappe quand il est vulnérable."}` });
    for (const cv of KALUA.CAVES) { const D = Dungeon.CAVES[cv.n]; out.push({ cat: "grottes", title: cv.name, keys: toks(`${cv.name} grotte ${cv.n}`), text: () => `${cv.name} (grotte ${cv.n}) : ${cv.mode}. ${D ? `${Object.keys(D.rooms).length} salles. ` : ""}${{ 1: "Dans la jungle, à l'ouest. Le Chant de la Racine y est indispensable.", 2: "Sur la côte est. Les combats y sont au tour par tour. La Marée t'aidera.", 3: "Au nord-ouest du marais. Il y fait très noir : apprends la Lueur avant.", 4: "Au nord des falaises. Le vent y souffle partout : la Bourrasque est indispensable.", 5: "Au cœur du volcan. Ysolde n'ouvrira la porte que quand tu auras les quatre trophées des autres grottes.", 6: "Sur l'Île aux Tortues.", 7: "Sur l'Île du Phare.", 8: "Sur l'Îlot aux Étoiles." }[cv.n]} ${Prog.cave(cv.n).cleared ? "Tu l'as déjà terminée !" : ""}` }); }
    for (const [sp, S] of Object.entries(Battle.SPELLS)) { const who = NPC.list.find((n) => n.spell === sp); out.push({ cat: "magie", title: "Chant de la " + S.name, keys: toks(`${S.name} chant magie ${sp} apprendre apprend enseigne maitre sort pouvoir`), text: () => `${S.icon} ${S.name} : ${S.short}. ${who ? `${who.name} l'enseigne (${SPOTNAME(who.sched[0][1])}).` : ""} ${Prog.knows(sp) ? "Tu le connais déjà." : ""}` }); }
    for (const id of Quests.order) { const q = Quests.Q[id]; out.push({ cat: "quetes", title: q.title, keys: toks(`${q.title} quete ${q.giver} ${NPC.get(q.giver) ? NPC.get(q.giver).name : ""}`), text: () => { const s = Quests.stage(id); return `${q.title} : ${q.desc} ${s < 0 ? `Parle à ${NPC.get(q.giver) ? NPC.get(q.giver).name : "quelqu'un"} pour la commencer.` : s >= 999 ? "Tu l'as terminée." : `En cours : ${q.stages[s] ? q.stages[s].obj : "…"}`}`; } }); }
    for (const b of KALUA.BIOMES) out.push({ cat: "zones", title: b.name, keys: toks(b.name + " zone biome"), text: { "Côte Dorée": "La Côte Dorée, au sud : l'épave, le port des pêcheurs, le camp des naufragés. Des coquillages, des crabes géants et le rocher du Roi Crabe, au large.", "Jungle Émeraude": "La Jungle Émeraude, à l'ouest : les cabanes dans les arbres, le Temple, Maître Tilo, le cimetière des Échoués et la Grotte des Racines. Attention aux sangliers épineux, ils chassent en groupe.", "Marais des Brumes": "Le Marais des Brumes, au nord-ouest : le village sur pilotis, Mère Tikka, les lanternes des morts, et les crocos des brumes, en groupe. La Grotte des Brumes est au fond.", "Falaises des Vents": "Les Falaises des Vents, à l'est : les moulins, les sept pierres levées, la tour de guet de Lili, et la Grotte du Vent.", "Volcan de Kalua": "Le Volcan de Kalua, au nord : le Sanctuaire d'Ysolde, le camp de Brann et Vulcain, les geysers, et les golems de lave. Le Cœur du Volcan est la dernière grotte." }[b.name] });
    return out;
  }
  let DKB = null;
  const all = () => { if (!DKB) DKB = dataKB(); return KB.concat(DKB); };

  // ---------------------------------------------------------------- réponses en direct
  function live(q) {
    const n = norm(q);
    if (/(que|quoi) (dois|faire|je fais)|prochaine etape|je suis perdu|objectif|par ou commencer|aide moi/.test(n)) { const o = Story.goalText(); return o ? `En ce moment, je te conseille : ${o}` : "Explore, parle aux gens au point rouge ou noir, et regarde ta mini-carte : le losange jaune montre ton objectif."; }
    if (/quelle heure|il est quelle|c est la nuit|fait il nuit/.test(n)) { const h = NPC.hourAt(Net.now()); return `Il est environ ${Math.floor(h)} h ${String(Math.floor((h % 1) * 60)).padStart(2, "0")} sur Kalua. ${h >= 20 || h < 6 ? "C'est la nuit." : "Il fait jour."}`; }
    if (!/augment|plus de|max|gagner|fil/.test(n) && /combien.*(coeur|vie)|^ma vie|mes coeurs|il me reste/.test(n)) return `Tu as ${Prog.P.hp} cœurs sur ${Prog.P.maxHp}, et ${Prog.P.fils} Fil(s) de vie sur 8.`;
    if (/ou suis|ou je suis|ou sommes/.test(n)) return `Tu es ${Game.mode === "cave" ? "dans " + (Dungeon.cave ? Dungeon.cave.name : "une grotte") : "dans " + G.place}.`;
    if (/qui es tu|t es qui|ton nom|nalia/.test(n) && !/ou est/.test(n)) return Prog.flag("nalia_aveu") ? "Je suis Nalia. Fille d'Ilaïa. Celle qui vous a menés ici. Je ne mentirai plus." : "Je suis Nalia. Je vis ici depuis… longtemps. Je connais chaque pierre de cette île.";
    if (/combien.*(gardien|boss)/.test(n)) return `Tu as libéré ${Object.keys(Prog.P.bosses).filter((k) => /^B/.test(k)).length} Gardien(s) sur 12.`;
    if (/quels? chants?|mes chants|magie connue/.test(n)) return Prog.P.spells.length ? `Tu connais : ${Prog.P.spells.map((s) => Battle.SPELLS[s].name).join(", ")}.` : "Tu ne connais encore aucun chant. Cherche les gens au point noir.";
    return null;
  }

  // ---------------------------------------------------------------- recherche
  function search(q) {
    const T = toks(q); if (!T.length) return [];
    const res = [];
    for (const e of all()) {
      let s = 0; const titleT = toks(e.title);
      for (const t of T) { if (e.keys.includes(t)) s += 2; else if (t.length > 3 && e.keys.some((k) => k.startsWith(t) || t.startsWith(k))) s += 1; if (titleT.includes(t)) s += 2; }
      if (norm(q).includes(norm(e.title)) && e.title.length > 3) s += 4;
      if (e.cat === "objets") s *= .75; // les objets passent après les explications
      if (s > 0) res.push({ e, s });
    }
    return res.sort((a, b) => b.s - a.s);
  }
  const txt = (e) => (typeof e.text === "function" ? e.text() : e.text);
  function answer(q) {
    const l = live(q); if (l) return l;
    const r = search(q);
    if (!r.length || r[0].s < 2) return pick(["Hmm… Je ne suis pas sûre de comprendre. Demande-moi par exemple « comment augmenter ma vie », « où est Mère Tikka », « comment battre le Bélier Tonnerre » ou « que dois-je faire ».", "Je connais beaucoup de choses sur Kalua, mais pas ça… Essaie avec d'autres mots : un nom de personne, de grotte, d'objet ou de chant."]);
    let a = txt(r[0].e);
    if (r[1] && r[1].s >= r[0].s - 1 && r[1].e.title !== r[0].e.title) a += "\n\nEt aussi — " + r[1].e.title + " : " + txt(r[1].e);
    return a;
  }
  const pick = (L) => L[Math.floor(Math.random() * L.length)];

  // ---------------------------------------------------------------- le menu de Nalia
  const TOPICS = [["commandes", "🎮 Les commandes"], ["mecaniques", "⚙️ Comment ça marche"], ["progression", "❤️ Devenir plus fort"], ["magie", "✨ Les chants"], ["grottes", "⛰️ Les grottes"], ["enigmes", "🧩 Énigmes et pièges"], ["combat", "⚔️ Combattre"], ["boss", "👑 Les boss"], ["quetes", "📜 Les quêtes"], ["pnj", "👥 Les habitants"], ["zones", "🗺️ Les régions"], ["objets", "🎒 Les objets"], ["histoire", "📖 L'histoire de Kalua"]];
  async function topics(sp) {
    for (;;) {
      const t = await Dialog.choose(sp, "De quoi veux-tu que je te parle ?", TOPICS.concat([["back", "↩ Retour"]]));
      if (t === "back") return;
      let list = all().filter((e) => e.cat === t);
      if (t === "objets") list = list.filter((e) => Prog.count(ITEMS.ids.find((id) => ITEMS.name(id) === e.title)) > 0 || ["Petite clé", "Grande clé"].includes(e.title)).slice(0, 12);
      if (t === "pnj") list = list.filter((e) => Prog.P.talked[NPC.list.find((n) => n.name === e.title)?.id]).slice(0, 14);
      if (!list.length) { await Dialog.say(sp, t === "objets" ? "Ton sac est presque vide ! Récolte, chasse, ouvre des coffres, et reviens me demander." : t === "pnj" ? "Tu n'as encore rencontré personne. Va dire bonjour !" : "Rien à dire là-dessus pour l'instant."); continue; }
      const pickE = await Dialog.choose(sp, "Lequel ?", list.slice(0, 12).map((e, i) => [i, e.title]).concat([["back", "↩ Retour"]]));
      if (pickE === "back") continue;
      await Dialog.say(sp, txt(list[pickE]));
    }
  }
  async function custom(sp) {
    const q = await Dialog.input(sp, "Pose-moi n'importe quelle question sur Kalua. Écris-la, puis appuie sur Envoyer.");
    if (!q) return;
    await Dialog.say(sp, answer(q));
  }
  return { add, answer, search, topics, custom, norm };
})();
