/* Les Échoués de Kalua — l'histoire principale.
 * Introduction (le naufrage), Nalia la guide, les repaires des 12 Gardiens, la navigation, l'entrée des grottes,
 * les cinématiques des boss de grottes, la fin, les crédits, et tout ce qui relie les quêtes au monde. */
"use strict";

const Story = (() => {
  const K = KALUA.K, TAU = Math.PI * 2;
  const { say, lines, choose, cut, NARR, isNight, hour } = Quests;
  const sp = (id) => NPC.speaker(id);
  const meName = () => (me && me.name) || "toi";

  // ================================================================ INTRODUCTION : le naufrage de la Mouette d'Argent
  async function intro() {
    await cut(async (S) => {
      S.music("intro", .5);
      S.bg("stars", {}); S.camNow(500, 300, 900);
      await S.fade(0, 2);
      await S.caption("Il y a trois mille ans…", "une étoile vivante tomba dans la mer.", 3.5);
      S.add("star", { boss: "etoileFilante", x: 200, y: 40, scale: .3 }); S.sfx("light"); await S.move(S.get("star"), 720, 430, 2.2); S.remove("star"); S.flash("#fff6c8", .8); S.sfx("boom");
      await S.caption("Son cœur bat encore.", "On l'appelle Kalua.", 3);
      await S.fade(1, 1.2);
      // --- la nuit du naufrage
      S.bg("storm", { ship: { x: 380, y: 400, s: .9, tilt: 0 }, rocks: true, light: 0 }); S.music("storm", 1.5); S.fx("rain", 70); S.camNow(500, 300, 980);
      await S.fade(0, 1.5);
      await S.caption("La Mouette d'Argent", "quelque part dans l'océan, une nuit sans lune", 3);
      await S.lightning(1);
      // sur le pont
      S.bg("deck", { tilt: 0 }); S.camNow(500, 300, 800);
      const b = S.add("bastien", { npc: "bastien", x: 740, y: 430, dir: "left" });
      const m = S.add("me", { me: true, x: 380, y: 440, dir: "right" }); const pa = S.add("pa", { partner: true, x: 320, y: 445, dir: "right" });
      const ma = S.add("maelle", { npc: "maelle", x: 600, y: 445, dir: "left" });
      const coco = S.add("coco", { creature: "perroquet", x: 520, y: 330 });
      await S.say("bastien", "Tenez-vous à quelque chose, les amoureux ! Ça va secouer !");
      await S.say("maelle", "Capitaine ! La boussole… elle tourne ! Elle ne s'arrête plus !");
      S.sfx("bell"); S.shake(4, 2); await S.wait(1.5);
      await S.say(NARR, "DONG. Une cloche, quelque part sous la mer. Si grave qu'on la sent dans les os.");
      await S.say("bastien", "Qu'est-ce que… Il n'y a pas d'église en pleine mer !");
      await S.say({ name: "Coco", color: "#3a9a3a" }, "NALIA ! NALIA !");
      for (const a of [b, m, pa, ma, coco]) a.alpha = 0;
      S.bg("storm", { ship: { x: 380, y: 400, s: .9, tilt: -.05 }, rocks: true, light: 0 }); S.camNow(560, 300, 900);
      await S.lightning(1); S.opt({ light: 1 }); await S.wait(.9); S.opt({ light: 0 });
      await S.say(NARR, "Un éclair. Sur un rocher noir, une silhouette de femme, toute blanche, regarde le navire. Puis elle disparaît.");
      await S.say("maelle", "RÉCIFS ! RÉCIFS DROIT DEVANT !");
      // le choc
      for (let i = 0; i < 18; i++) { S.opt({ ship: { x: 380 + i * 14, y: 400 + i, s: .9, tilt: -.05 - i * .006 } }); await S.wait(.05); }
      S.sfx("crash"); S.flash("#fff", 1); S.shake(16, 1.6); S.opt({ ship: { x: 640, y: 420, s: .9, tilt: .35, broken: true } });
      await S.wait(1.2); S.sfx("crash", .6); await S.lightning(2);
      await S.say(NARR, "La coque se brise sur les récifs. Les mâts tombent. La mer engloutit tout.");
      S.bg("storm", { rocks: true, light: 0 }); S.camNow(500, 330, 900);
      const mm = S.add("me2", { me: true, x: 470, y: 450, dir: "down", lying: true, alpha: .9 }); const pp = S.add("pa2", { partner: true, x: 540, y: 455, dir: "down", lying: true, alpha: .9 });
      S.remove("me"); S.remove("pa"); S.remove("bastien"); S.remove("maelle"); S.remove("coco");
      await S.say(NARR, "Dans les vagues, deux mains se cherchent… et se trouvent.");
      await S.fade(1, 2.4, "#fff");
      // --- la plage, au matin
      S.fx("rain", 0); S.tint(null); S.music("beach", 2);
      S.bg("beach", { dawn: true }); S.camNow(500, 320, 820);
      S.remove("me2"); S.remove("pa2");
      const m3 = S.add("me", { me: true, x: 430, y: 410, dir: "down", lying: true }); const p3 = S.add("pa", { partner: true, x: 520, y: 416, dir: "down", lying: true });
      await S.fade(0, 2.5, "#fff");
      await S.caption("Les Échoués de Kalua", "", 3.2);
      S.sfx("wave"); await S.wait(1);
      const n = S.add("nalia", { npc: "nalia", x: 900, y: 400, dir: "left", glow: "rgba(200,230,255,.45)" });
      await S.move(n, 600, 405, 3);
      await S.say("nalia", "…Hé. Hé, réveillez-vous. Vous m'entendez ?");
      m3.lying = false; await S.hop(m3, 14, .4); S.face(m3, "right"); await S.wait(.4); p3.lying = false; S.face(p3, "left"); await S.hop(p3, 12, .4);
      await S.say("nalia", "Vous êtes vivants ! Tous les deux. Je… je suis tellement contente.");
      await S.say("nalia", "Bienvenue sur Kalua. Je m'appelle Nalia. Je connais cette île mieux que personne.");
      const v = await S.choose("nalia", "Votre navire s'est brisé sur les récifs cette nuit. D'autres ont survécu : le capitaine, un mousse, un cuisinier… Ils sont au camp, plus loin sur la plage.", [["merci", "Merci de nous avoir trouvés."], ["ou", "Où sommes-nous, exactement ?"], ["cloche", "Cette nuit… on a entendu une cloche."]]);
      if (v === "ou") await S.say("nalia", "Sur une île que les cartes oublient. Il y a une jungle, un marais, des falaises, un volcan. Et des gens adorables. Enfin, la plupart.");
      if (v === "cloche") { await S.wait(.6); await S.say("nalia", "…Une cloche ? En pleine tempête, on entend toutes sortes de choses. Le vent, la mer… Ne pensez plus à ça."); }
      if (v === "merci") await S.say("nalia", "Ne me remerciez pas. Pas encore.");
      await S.say("nalia", "Venez. Il y a une clairière, un peu au nord, avec de vieilles huttes. Des Échoués y vivaient… avant. Ce sera votre village.");
      await S.say("nalia", "Suivez-moi ! Je vous montrerai deux ou trois choses en chemin.");
      await S.fade(1, 1.2);
    }, { noSkip: false });
    Prog.set("intro_done"); Prog.set("escort");
    startEscort(true);
    Game.objective("Suis Nalia jusqu'au village");
  }
  // escorte : Nalia marche devant et donne des conseils
  const ESC = { i: 0, wait: 0, tip: 0, path: [[800, 890], [795, 820], [790, 760], [780, 700], [768, 660]],
    tips: [
      "Les flèches pour marcher. SPRINT pour courir : sur Kalua, personne ne s'essouffle, profitez-en !",
      "TAPER, c'est pour frapper. Les arbres donnent du bois, les rochers de la pierre. Tout repousse.",
      "RAMASSER, c'est pour tout le reste : parler, cueillir, ouvrir. Et caresser les animaux, c'est important aussi.",
      "Vous voyez les petits points au-dessus des têtes ? Rouge : quelqu'un a besoin de vous. Noir : quelqu'un peut vous apprendre un chant.",
      "La mini-carte, en haut à droite, montre toute l'île. Le losange jaune, c'est votre prochain objectif.",
    ] };
  // (re)lance l'escorte : le joueur et Nalia sont posés sur la terre ferme, et le chemin aussi
  function startEscort(teleport) {
    const W = Game.world, sp0 = NPC.W("plage");
    ESC.pts = ESC.path.map(([x, y]) => W.snap(x * K, y * K));
    if (teleport) Game.teleport(sp0.x - 30, sp0.y + 10);
    const p = Game.player;
    // on reprend au point du chemin le plus proche du joueur (utile après un rechargement)
    let best = 0; ESC.pts.forEach((q, i) => { if (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(ESC.pts[best].x - p.x, ESC.pts[best].y - p.y)) best = i; });
    ESC.i = teleport ? 0 : best; ESC.wait = 0; ESC.tip = teleport ? 0 : ESC.tips.length;
    const n0 = W.snap(p.x + 70, p.y - 30);
    NPC.setOverride("nalia", { x: n0.x, y: n0.y, act: "idle", dir: "up" });
  }
  function updateEscort(dt) {
    if (!Prog.flag("escort")) return;
    if (!ESC.pts) startEscort(false);
    const p = Game.player, n = NPC.pos("nalia", Net.now());
    const tgt = ESC.pts[Math.min(ESC.i, ESC.pts.length - 1)], tx = tgt.x, ty = tgt.y;
    const dP = Math.hypot(p.x - n.x, p.y - n.y);
    let x = n.x, y = n.y, moving = false, dir = n.dir;
    if (dP < 320) { const d = Math.hypot(tx - x, ty - y); if (d > 6) { const s = Math.min(d, 205 * dt); x += (tx - x) / d * s; y += (ty - y) / d * s; moving = true; dir = Math.abs(tx - x) > Math.abs(ty - y) ? (tx < x ? "left" : "right") : (ty < y ? "up" : "down"); } else if (ESC.i < ESC.pts.length) { ESC.i++; if (ESC.tip < ESC.tips.length && !Dialog.open) { const t = ESC.tips[ESC.tip++]; Dialog.say(sp("nalia"), t); } } }
    else { dir = p.x < x ? "left" : "right"; ESC.wait += dt; if (ESC.wait > 6) { ESC.wait = 0; Game.toast("Nalia t'attend. Suis-la !", 1500); }
      // si le joueur s'est perdu très loin, Nalia revient vers lui
      if (dP > 900) { const q = Game.world.snap(p.x + 80, p.y - 40); x = q.x; y = q.y; } }
    NPC.setOverride("nalia", { x, y, act: moving ? "walk" : "idle", moving, dir });
    const v = NPC.W("village"), nearVillage = Math.hypot(p.x - v.x, p.y - v.y) < 420;
    if (((ESC.i >= ESC.pts.length && Math.hypot(p.x - x, p.y - y) < 220) || nearVillage) && !Dialog.open && !Game.busy()) arriveVillage();
  }
  async function arriveVillage() {
    if (!Prog.flag("escort")) return;
    Prog.set("escort", false); ESC.pts = null;
    await cut(async (S) => {
      S.bg("village", {}); S.music("village"); S.camNow(500, 300, 820);
      const n = S.add("nalia", { npc: "nalia", x: 560, y: 410, dir: "left" }); const m = S.add("me", { me: true, x: 380, y: 420, dir: "right" }); const pa = S.add("pa", { partner: true, x: 320, y: 425, dir: "right" });
      await S.fade(0, 1);
      await S.say("nalia", "Voilà ! Votre village. Ce n'est pas grand-chose : deux huttes, un feu, un vieil établi. Mais c'est à vous.");
      await S.say("nalia", "L'établi, là, sert à fabriquer des cordes, des torches, des potions. Le feu… sert à se tenir chaud. Et à parler le soir.");
      await S.say("nalia", "Tenez. Une conque d'appel. Soufflez dedans, où que vous soyez, et je vous répondrai. Je sais à peu près tout sur cette île. Posez-moi n'importe quelle question.");
      S.add("cq", { item: "conque", x: 470, y: 400, scale: 1.6 }); S.sfx("pickup"); await S.wait(.8); S.remove("cq");
      await S.say("nalia", "Une dernière chose. L'île est… malade. Une cendre noire ronge les bêtes. Le volcan gronde de plus en plus fort.");
      await S.say("nalia", "Il paraît que la réponse se trouve dans les grottes. La première est dans la jungle, à l'ouest : la Grotte des Racines. Mais allez d'abord dire bonjour aux autres. Le capitaine vous cherche.");
      await S.fade(1, 1);
    });
    NPC.setOverride("nalia", null);
    Prog.set("village_found"); Prog.give("conque", 1);
    Game.objective("");
  }

  // ================================================================ Nalia : la guide
  async function talkNalia() {
    const s = sp("nalia");
    if (Prog.flag("escort")) { await Dialog.say(s, "Par ici ! Le village est juste au nord."); return; }
    const first = Prog.flag("nalia_aveu") ? "Vous êtes revenus me parler. Après tout ce que j'ai fait. Merci." : pick(["Bonjour, vous deux ! Une question ?", "Je vous écoute.", "Kalua est belle aujourd'hui, non ?"]);
    for (;;) {
      const v = await Dialog.choose(s, first, [["goal", "🧭 Que dois-je faire ?"], ["info", "📚 Informations sur le jeu"], ["ask", "✍️ Question personnalisée"], ["story", "💬 Parler de toi"], ["bye", "Rien, merci"]]);
      if (v === "goal") await Dialog.say(s, goalText() || "Explorez, aidez les gens au point rouge, apprenez les chants au point noir. Et regardez le losange jaune sur la mini-carte.");
      else if (v === "info") await Guide.topics(s);
      else if (v === "ask") await Guide.custom(s);
      else if (v === "story") await Dialog.say(s, naliaStory());
      else return;
    }
  }
  function naliaStory() {
    if (Prog.flag("nalia_aveu")) return "Sept cents ans. J'ai vu mourir tous ceux que j'aimais, puis tous ceux que j'ai fait venir. Je ne demande pas votre pardon. Je demande juste que vous finissiez ce que ma mère a commencé.";
    if (Prog.flag("cave3_done")) return "Oui… « Nalia, fille d'Ilaïa ». C'était ma cellule. Ma mère m'y a enfermée parce que je refusais de l'aider. J'avais seize ans. J'en ai sept cent seize.";
    return pick(["Moi ? Il n'y a pas grand-chose à dire. J'aime les lucioles, la mer le matin, et les chansons idiotes.", "Je suis née ici. Il y a… longtemps. Plus longtemps que vous ne croyez.", "Ma mère chantait très bien. C'est tout ce que je veux dire d'elle, pour l'instant."]);
  }
  const pick = (L) => L[Math.floor(Math.random() * L.length)];
  // la conque d'appel : parler à Nalia de n'importe où (après sa mort, c'est Coco qui répète ce qu'elle savait)
  async function conque() {
    if (!Prog.has("conque")) { Game.toast("Il te faudrait une conque d'appel."); return; }
    Music.sfx("wave", .5);
    if (Prog.isDead("nalia")) { const c = { name: "Coco (qui répète Nalia)", color: "#3a9a3a", draw: (g) => { g.translate(32, 44); g.scale(1.6, 1.6); Creatures.drawKind(g, "perroquet"); } };
      const v = await Dialog.choose(c, "Deux cœurs ! Deux cœurs ! (Coco a retenu tout ce que Nalia disait.)", [["info", "📚 Informations"], ["ask", "✍️ Question personnalisée"], ["bye", "Au revoir, Coco"]]);
      if (v === "info") await Guide.topics(c); if (v === "ask") await Guide.custom(c); return; }
    await talkNalia();
  }

  // ================================================================ parler aux gens
  const CHAT = {
    bastien: () => Prog.flag("nalia_aveu") ? "…" : "Matelot ! On a un bateau à construire et un mystère à résoudre.",
    pipa: () => Prog.flag("bastien_dead") ? "Le capitaine… Il me disait que je pêchais comme une mouette. C'était gentil, dans sa bouche." : pick(["Ça mord ! … Non.", "T'as déjà vu un poisson-lune ? Moi non plus."]),
    keo: () => "Je garde la porte.",
    amaru: () => Prog.flag("keo_dead") ? "(Amaru porte le collier de dent de Kéo.) Il me parle, tu sais. Dans le vent qui passe sur sa lance. Il dit que tu as été brave." : "Les Lumes écrivaient avec des étoiles. Si tu trouves des fresques, viens me les raconter.",
    tikka: () => "Bonjour, bonjour.",
    fennek: () => Prog.flag("pyrrha") ? "Pyrrha et moi, on allume les lanternes ensemble maintenant. Elle triche : elle souffle dessus." : "Une flamme pour chaque âme.",
    oro: () => "Le vent ne chante plus depuis mes huit ans.",
    lili: () => Prog.flag("oro_dead") ? "Je garde le moulin. Le soir, je compte les étoiles. Il y en a une nouvelle, au-dessus des pierres. Je l'ai appelée Oro." : "Tu sais combien il y a d'étoiles ? Moi non plus. Mais je vais les compter.",
    ysolde: () => storyYsolde(),
    brann: () => "CLANG !",
    nalia: () => "",
    tim: () => Prog.flag("bastien_dead") ? "Le capitaine m'appelait « moussaillon ». Personne m'appellera plus jamais comme ça." : "Le capitaine dit qu'on va repartir ! Moi, je veux rester. Ici, y a des singes.",
    jojo: () => Prog.flag("bastien_dead") ? "Je fais encore trois bols de ragoût chaque soir. L'habitude. Le troisième, je le laisse au bord de l'eau." : "Ça sent bon, hein ? C'est du crabe. Enfin, je crois.",
    rosalie: () => Prog.flag("bastien_dead") ? "Ce vieux bourru de capitaine… Il était charmant, au fond. Ne le répétez à personne." : "Coco, mon chéri, ne mange pas le chapeau du capitaine !",
    maelle: () => Prog.flag("bateau_ok") ? "Le Bastien est au ponton. Quand tu veux, je t'emmène." : "La boussole tournait… Je n'avais jamais vu ça.",
    nouk: () => "Cache-cache ?",
    bodo: () => Prog.flag("vent_chante") ? "Depuis que les pierres chantent, mes moutons dorment comme des bébés." : "Douze moutons. Il en faut douze.",
    tobi: () => "Banal. Banal. Oh ! … Non, banal.",
    nana: () => "Une question, une seule !",
    vulcain: () => "Fffff…", tilo: () => "Hmmm…", ondine: () => "L'eau écoute.", zephyr: () => "Fouuu !", luciole: () => "Que ta lueur ne s'éteigne pas.", grumo: () => "GRUMO… CONTENT.",
    arnaud: () => "Louise…",
  };
  async function talk(id) {
    Prog.P.talked[id] = true; Prog.changed();
    if (id === "nalia") return talkNalia();
    if (id === "maelle" && Prog.flag("bateau_ok")) return sail();
    if (await Quests.talk(id)) return;
    if (id === "ysolde") return storyYsoldeTalk();
    const n = NPC.get(id), txt = CHAT[id] ? CHAT[id]() : "Bonjour !";
    await Dialog.say(sp(id), txt || (n.barks.idle || ["Bonjour !"])[0]);
  }
  // Ysolde : la gardienne du Sanctuaire ouvre le Cœur du Volcan
  const TROPHIES = ["graineRacine", "nacre", "masque", "notePerdue"];
  function storyYsolde() { return Prog.flag("coeur_ouvert") ? "Le chemin est ouvert. Que les deux cœurs ne se lâchent pas." : "Le Cœur bat trop fort. Je le sens dans mes dents."; }
  async function storyYsoldeTalk() {
    if (Prog.flag("coeur_ouvert") || Prog.flag("final_done")) return Dialog.say(sp("ysolde"), Prog.flag("final_done") ? "Le Cœur bat doucement, maintenant. Comme un cœur qui dort. Merci." : storyYsolde());
    if (!Prog.P.talked.ysolde_intro) { Prog.P.talked.ysolde_intro = true; Prog.changed();
      await lines("ysolde", ["Je suis Ysolde, gardienne du Sanctuaire. Ma mère l'était avant moi, et sa mère avant elle. Depuis sept cents ans.", "Derrière cette porte : le Cœur du Volcan. Le chemin que la Reine a descendu.", "La porte ne s'ouvre qu'avec les quatre clés des grottes : la Graine-mère des Racines, la Nacre royale de la Grotte Marine, le Masque du Geôlier, et la Note perdue du Vent."]); }
    const have = TROPHIES.filter((t) => Prog.has(t));
    if (have.length < 4) return Dialog.say(sp("ysolde"), `Tu as ${have.length} des quatre clés. ${have.length ? "Il manque : " + TROPHIES.filter((t) => !Prog.has(t)).map(ITEMS.name).join(", ") + "." : ""}`);
    if (!Prog.flag("bateau_ok")) return Dialog.say(sp("ysolde"), "Tu as les quatre clés… mais tu ne sais pas encore toute la vérité. Va voir ce qui sonne sous le Phare. Ensuite, reviens.");
    await openHeart();
  }
  async function openHeart() {
    await cut(async (S) => {
      S.bg("volcano", {}); S.music("reveal"); S.camNow(500, 300, 820); S.fx("embers", 10);
      const y = S.add("ysolde", { npc: "ysolde", x: 520, y: 410, dir: "up" }); const m = S.add("me", { me: true, x: 380, y: 420, dir: "right" }); const pa = S.add("pa", { partner: true, x: 320, y: 425, dir: "right" });
      const n = S.add("nalia", { npc: "nalia", x: 800, y: 410, dir: "left", alpha: 0 });
      await S.fade(0, 1);
      await S.say("ysolde", "La Graine. La Nacre. Le Masque. La Note. Posez-les sur l'autel.");
      for (const t of TROPHIES) { S.sfx("magic"); S.flash("#ffd0a0", .3); await S.wait(.4); }
      S.sfx("boom"); S.shake(8, 1.6); await S.say(NARR, "La montagne gronde. Une fente lumineuse s'ouvre dans la roche : un escalier qui descend vers la lumière rouge.");
      await S.fadeActor(n, 1, 1); await S.move(n, 640, 410, 1.5);
      await S.say("nalia", "Je viens avec vous. Jusqu'au bout. C'est ma mère qui est en bas.");
      await S.say("ysolde", "Ta mère, Nalia, c'est la Reine Cendrée. Tu le sais depuis toujours.");
      await S.say("nalia", "Oui. Et c'est pour ça que ça doit être moi.");
      await S.say("ysolde", "Alors descendez. Et ne vous lâchez pas la main. C'est ensemble, ou rien.");
      await S.fade(1, 1.5);
    });
    Prog.set("coeur_ouvert"); Prog.P.lore.ysolde = true; Prog.changed();
    Game.toast("⛰️ Le Cœur du Volcan est ouvert !", 3000);
  }

  // ================================================================ marqueurs au-dessus des têtes
  function marker(id) {
    if (Prog.isDead(id)) return null;
    if (id === "nalia") return Prog.flag("intro_done") && !Prog.flag("village_found") ? "talk" : null;
    const m = Quests.marker(id); if (m) return m;
    if (id === "ysolde" && !Prog.flag("coeur_ouvert") && TROPHIES.every((t) => Prog.has(t)) && Prog.flag("bateau_ok")) return "red";
    if (id === "maelle" && Prog.flag("bateau_ok")) return "talk";
    return null;
  }
  const hidden = (id) => (id === "nalia" && (Prog.flag("final_done") || Prog.isDead("nalia"))) || (id === "bastien" && Prog.isDead("bastien")) || (id === "maelle" && false);

  // ================================================================ objectifs
  function goalText() {
    const o = Quests.objective(); if (o) return o.text;
    if (!Prog.flag("village_found")) return "Suis Nalia jusqu'au village.";
    if (!Prog.cave(1).cleared) return Prog.knows("racine") ? "Explore la Grotte des Racines, à l'ouest de la jungle." : "Apprends le Chant de la Racine (Maître Tilo, le vieil arbre de la jungle), puis explore la Grotte des Racines.";
    const left = [2, 3, 4].filter((n) => !Prog.cave(n).cleared);
    if (left.length) return `Explore les grottes : ${left.map((n) => KALUA.CAVES[n - 1].name).join(", ")}.`;
    if (!Prog.flag("bateau_ok")) return "Aide le capitaine Bastien à construire son bateau et à résoudre le mystère du naufrage.";
    if (!Prog.flag("coeur_ouvert")) return "Va voir Ysolde au Sanctuaire du volcan, avec les quatre trophées des grottes.";
    if (!Prog.flag("final_done")) return "Descends au Cœur du Volcan. Ensemble.";
    return "Kalua est libre. Profitez de votre île !";
  }
  function target() {
    const o = Quests.objective(); if (o && o.at) return o.at;
    if (!Prog.flag("village_found")) return NPC.W("village");
    if (!Prog.cave(1).cleared) { const c = KALUA.CAVES[0]; return { x: c.x * K, y: c.y * K }; }
    if (!Prog.flag("coeur_ouvert") && Prog.flag("bateau_ok")) return NPC.W("sanctuaire");
    if (Prog.flag("coeur_ouvert") && !Prog.flag("final_done")) { const c = KALUA.CAVES[4]; return { x: c.x * K, y: c.y * K }; }
    return null;
  }

  // ================================================================ objets du monde (quêtes, repaires, tombes, établi, ponton…)
  const LAIRS = KALUA.BOSSES.map(([x, y, name, sea], i) => ({ id: "B" + (i + 1), x: x * K, y: y * K, name, sea: Boolean(sea) }));
  function lairOpen(l) {
    if (Prog.P.bosses[l.id] || l.sea || l.id === "B5") return false; // B5 : seulement dans la quête de Kéo
    for (const id of Quests.order) { const q = Quests.Q[id]; if (q.lairs && q.lairs[l.id]) return q.lairs[l.id](); }
    return Prog.flag("village_found"); // les Gardiens qui ne font partie d'aucune quête attendent qu'on vienne les voir
  }
  function worldObjects() {
    const out = Quests.objects().map((o) => Object.assign({ kind: "quest" }, o));
    const land = (x, y) => Game.world.snap(x, y);
    for (const l of LAIRS) if (lairOpen(l)) { const q = land(l.x, l.y); out.push({ kind: "lair", l, x: q.x, y: q.y, hint: `👑 ${l.name} · Ramasser pour l'affronter` }); }
    out.push({ kind: "bench", x: (KALUA.VILLAGE.x + 30) * K, y: (KALUA.VILLAGE.y + 2) * K, hint: "🔨 Établi · Ramasser pour fabriquer" });
    if (Prog.flag("bateau_ok")) { const q = land(958 * K, 878 * K); out.push({ kind: "pier", x: q.x, y: q.y, hint: "⛵ Ponton · Ramasser pour naviguer" }); }
    for (const [id, spot] of [["keo", "temple"], ["bastien", "ponton"], ["oro", "pierre1"], ["nalia", "dune"]]) if (Prog.isDead(id)) { const w = NPC.W(spot); out.push({ kind: "grave", who: id, x: w.x + 40, y: w.y + 50, hint: `🕯️ ${NPC.get(id).name}` }); }
    if (Prog.flag("coeur_ouvert") && !Prog.flag("final_done")) out.push({ kind: "glow", x: KALUA.CAVES[4].x * K, y: KALUA.CAVES[4].y * K - 40 });
    return out;
  }
  function collect(items, view) {
    for (const o of worldObjects()) { if (o.x < view.x0 - 200 || o.x > view.x1 + 200 || o.y < view.y0 - 200 || o.y > view.y1 + 200) continue; items.push({ y: o.y, draw: (c, t) => drawObj(c, o, t) }); }
  }
  function drawObj(c, o, t) {
    c.save(); c.translate(o.x, o.y);
    if (o.kind === "lair") { c.globalAlpha = .9; Bosses.draw(c, o.l.id, t, { scale: .32 }); c.globalAlpha = 1; c.fillStyle = "#ffd23a"; c.font = "16px system-ui"; c.textAlign = "center"; c.fillText("👑", 0, -80 + Math.sin(t * 2) * 3); }
    else if (o.kind === "bench") { c.fillStyle = "rgba(0,0,0,.15)"; c.fillRect(-26, -2, 52, 6); c.fillStyle = "#a8703f"; c.fillRect(-26, -22, 52, 8); c.fillRect(-22, -16, 6, 16); c.fillRect(16, -16, 6, 16); c.fillStyle = "#8a8a96"; c.fillRect(-10, -30, 20, 8); }
    else if (o.kind === "pier") { c.fillStyle = "#8a5a3a"; c.beginPath(); c.moveTo(-40, -10); c.lineTo(40, -10); c.lineTo(30, 6); c.lineTo(-34, 6); c.fill(); c.fillStyle = "#4a3020"; c.fillRect(-2, -80, 4, 70); c.fillStyle = "#f4ecd8"; c.beginPath(); c.moveTo(2, -76); c.quadraticCurveTo(36, -46, 2, -16); c.fill(); }
    else if (o.kind === "grave") { c.fillStyle = "#9a9aa6"; c.beginPath(); c.roundRect(-12, -32, 24, 32, [10, 10, 0, 0]); c.fill(); c.fillStyle = "#ff9fb8"; c.beginPath(); c.arc(-14, -2, 4, 0, TAU); c.arc(14, -2, 4, 0, TAU); c.fill();
      if (o.who === "keo") { c.strokeStyle = "#8a6a4a"; c.lineWidth = 3; c.beginPath(); c.moveTo(22, 0); c.lineTo(22, -70); c.stroke(); c.fillStyle = "#c0c0c8"; c.beginPath(); c.moveTo(16, -70); c.lineTo(22, -84); c.lineTo(28, -70); c.fill(); }
      if (o.who === "bastien") { c.fillStyle = "#2a2a3a"; c.beginPath(); c.ellipse(0, -34, 16, 5, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(0, -38, 9, 7, 0, Math.PI, 0); c.fill(); } }
    else if (o.kind === "glow") { c.globalAlpha = .3 + .2 * Math.sin(t * 3); c.fillStyle = "#ff7a3a"; c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fill(); }
    else if (o.kind === "quest") drawQuestObj(c, o, t);
    c.restore();
  }
  function drawQuestObj(c, o, t) {
    const k = o.o.draw, b = Math.sin(t * 3 + o.i) * 3;
    const glow = (col, r = 22) => { c.globalAlpha = .35 + .2 * Math.sin(t * 4 + o.i); c.fillStyle = col; c.beginPath(); c.arc(0, -14, r, 0, TAU); c.fill(); c.globalAlpha = 1; };
    if (k === "sparkle") { glow("#fff6a0"); c.fillStyle = "#fff"; for (let i = 0; i < 4; i++) { const a = t * 2 + i * 1.57; c.beginPath(); c.arc(Math.cos(a) * 10, -14 + Math.sin(a) * 6, 2, 0, TAU); c.fill(); } }
    else if (k === "moss") { glow("#9ad07a"); c.fillStyle = "#8a9a7a"; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(-8 + i * 4, -20 + (i % 2) * 6, 5, 0, TAU); c.fill(); } }
    else if (k === "stone") { const d = Quests.data("oro"); const on = (d.s || [])[o.i]; c.fillStyle = "#8a8a90"; c.beginPath(); c.roundRect(-14, -80, 28, 80, 9); c.fill(); if (on) { c.strokeStyle = "#9fe8ff"; c.lineWidth = 3; c.beginPath(); c.arc(0, -55, 8 + Math.sin(t * 3) * 2, 0, TAU); c.stroke(); } else { c.fillStyle = "rgba(255,255,255,.6)"; c.font = "900 13px system-ui"; c.textAlign = "center"; c.fillText(String(o.i + 1), 0, -50); } }
    else if (k === "lantern") { c.fillStyle = "#6a4a2a"; c.fillRect(-2, -60, 4, 60); glow("#8ad0ff", 16); c.fillStyle = "#8ad0ff"; c.beginPath(); c.roundRect(-7, -70, 14, 16, 3); c.fill(); const L = o.o.fireflies; if (L) { const step = Math.floor(t / 1.2) % 4, which = L[step]; if (which === o.i) { for (let i = 0; i < 6; i++) { c.fillStyle = "#fff6a0"; c.beginPath(); c.arc(Math.cos(t * 4 + i) * 22, -62 + Math.sin(t * 5 + i) * 14, 2.2, 0, TAU); c.fill(); } } } }
    else if (k === "wisp") { Bosses.draw(c, "follet", t, {}); }
    else if (k === "cradle") { c.fillStyle = "#6a4a2a"; c.beginPath(); c.ellipse(0, -10, 26, 10, 0, 0, Math.PI); c.fill(); if (Quests.stage("fennek") >= 3) { for (let i = 0; i < 3; i++) { c.fillStyle = ["#ff7a3a", "#ffb03a", "#ffe08a"][i]; c.beginPath(); c.arc(34 + Math.sin(t * 8 + i) * 2, -10 - i * 6, 8 - i * 2, 0, TAU); c.fill(); } } Bosses.draw(c, "follet", t, { scale: .7 }); }
    else if (k === "fallenStar") { glow("#fff6a0", 28); c.save(); c.translate(0, -16 + b); c.rotate(t); c.fillStyle = "#ffe08a"; c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = i % 2 ? 5 : 12; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.fill(); c.restore(); }
    else if (k === "sprout") { glow("#9aff9a", 16); c.strokeStyle = "#4a9a3a"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -16); c.stroke(); c.fillStyle = "#6aca5a"; c.beginPath(); c.ellipse(-6, -18, 7, 4, -.5, 0, TAU); c.ellipse(6, -20, 7, 4, .5, 0, TAU); c.fill(); }
    else if (k === "pearl") { glow("#8ad0ff", 14); c.fillStyle = "#cfeaff"; c.beginPath(); c.arc(0, -10 + b, 6, 0, TAU); c.fill(); }
    else if (k === "feather") { const a = t * 1.5 + o.i; c.translate(Math.cos(a) * 30, Math.sin(a) * 16 - 40); c.rotate(Math.sin(t * 3 + o.i) * .6); ITEMS.draw(c, "plume", 0, 0, 26); }
    else if (k === "firering") { c.strokeStyle = "rgba(255,120,40,.8)"; c.lineWidth = 4; c.setLineDash([8, 6]); c.beginPath(); c.ellipse(0, 0, 90, 50, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
    else if (k === "crackrock") { c.fillStyle = "#8a8a90"; c.beginPath(); c.ellipse(0, -14, 22, 18, 0, 0, TAU); c.fill(); c.strokeStyle = "#3a3a40"; c.lineWidth = 2; c.beginPath(); c.moveTo(-8, -26); c.lineTo(0, -14); c.lineTo(-4, -4); c.moveTo(0, -14); c.lineTo(10, -20); c.stroke(); }
    else if (k === "bamboo") { c.fillStyle = "#7aaa4a"; for (let i = 0; i < 3; i++) { c.fillRect(-14 + i * 10, -150 + i * 10, 8, 150 - i * 10); } c.fillStyle = "#5a8a3a"; for (let y = -140; y < 0; y += 24) c.fillRect(-14, y, 30, 3); glow("#fff6a0", 12); }
    else if (k === "sheep") { c.save(); c.translate(0, -12 + Math.abs(b)); c.scale(1.4, 1.4); Creatures.drawKind(c, "mouton"); c.restore(); c.fillStyle = "#ffd23a"; c.beginPath(); c.arc(0, -40, 4, 0, TAU); c.fill(); }
    else if (Story.drawExtra && Story.drawExtra(k, c, t, o)) { /* dessins ajoutés (village2.js…) */ }
else glow("#fff6a0");
  }
  function nearestObj(p, reach = 70) { let best = null, bd = reach; for (const o of worldObjects()) { if (o.kind === "glow") continue; const d = Math.hypot(o.x - p.x, (o.y - p.y) * 1.2); if (d < bd) { bd = d; best = o; } } return best; }
  function hintAt(p) { const o = nearestObj(p, o0(p)); if (!o) return null; return { x: o.x, y: o.y - (o.kind === "lair" ? 100 : o.kind === "stone" ? 100 : 60), text: o.hint || (o.o && o.o.hint) || "✨" }; }
  const o0 = () => 80;
  async function doInteract(o) {
    if (o.kind === "quest") { Game.lockInput(true); try { await o.o.interact(o.q, o.i); } finally { Game.lockInput(false); } return true; }
    if (o.kind === "lair") { await lairFight(o.l); return true; }
    if (o.kind === "bench") { await Quests.craft(); return true; }
    if (o.kind === "pier") { await sail(); return true; }
    if (o.kind === "grave") { await Dialog.say(NARR, { keo: "« Kéo, Veilleur. Il a gardé la porte. » Sa lance est plantée dans la terre. Quelqu'un y a accroché des fleurs fraîches.", bastien: "Le chapeau du capitaine Bastien, posé sur un poteau du ponton. Coco vient parfois s'y percher.", oro: "Une petite pierre devant la septième pierre levée : « Oro, berger des vents. Il a entendu. »", nalia: "Une étoile de nacre plantée dans le sable : « Nalia. Elle aimait les lucioles et les chansons idiotes. »" }[o.who]); return true; }
    return false;
  }
  function hit(p) { const o = nearestObj(p, 80); if (o && o.kind === "quest" && o.o.hit) return o.o.hit(o.q, o.i); return false; }
  function spell(sp, x, y) { for (const o of worldObjects()) if (o.kind === "quest" && o.o.spell && Math.hypot(o.x - x, o.y - y) < 200) { if (o.o.spell(o.q, o.i, sp)) return; } }

  // ================================================================ les Gardiens (boss optionnels)
  async function lairFight(l) {
    const f = Battle.FOES[l.id];
    const v = await Dialog.choose({ name: l.name, draw: (c) => { c.translate(32, 60); Bosses.draw(c, l.id, 1, { scale: .2 }); } }, f.lines ? `« ${f.lines[1] || f.lines[0]} »` : `${l.name} se réveille et te fixe.`, [["go", "⚔️ Affronter le Gardien"], ["no", "Pas maintenant"]]);
    if (v !== "go") return;
    const ally = { B5: "keo", B7: "tikka" }[l.id];
    const r = await Battle.start({ foes: [l.id], ally, bg: bgOf(l), noFlee: true });
    if (r !== "win") { Prog.P.hp = Math.max(1, Prog.P.hp); worldAfterLoss(); return; }
    await guardianFreed(l.id);
  }
  function bgOf(l) { const w = KALUA.weights(l.x / K, l.y / K); let b = 0; for (let i = 1; i < 5; i++) if (w[i] > w[b]) b = i; return ["beach", "jungle", "marsh", "cliffs", "volcano"][b]; }
  function worldAfterLoss() { Game.toast("Tu t'effondres… Le Gardien te laisse partir. Reviens plus fort(e) !", 3000); Prog.P.hp = Prog.P.maxHp; Prog.changed(); }
  async function guardianFreed(id) {
    Prog.P.bosses[id] = true; Prog.changed();
    const f = Battle.FOES[id]; if (f.reward) Prog.give(f.reward, 1);
    const n = Object.keys(Prog.P.bosses).filter((k) => /^B\d+$/.test(k)).length;
    Prog.P.lore.gardiens = true;
    await Dialog.say(NARR, `${f.name} est libéré. Une petite lumière sort de son corps et file vers le volcan. (Gardiens libérés : ${n}/12)`);
    for (const qid of Quests.order) { const q = Quests.Q[qid]; if (q.lairs && q.lairs[id] && q.onBoss) await q.onBoss(id); }
  }

  // ================================================================ naviguer
  async function sail() {
    if (!Prog.flag("bateau_ok")) { Game.toast("Il faut d'abord un bateau."); return; }
    const opts = [["tortues", "🐢 Île aux Tortues"], ["phare", "🗼 Île du Phare"], ["etoiles", "⭐ Îlot aux Étoiles" + (Prog.flag("carte_ciel") ? "" : " (de nuit)")], ["port", "⚓ Retour au port"]];
    if (!Prog.P.bosses.B1) opts.splice(3, 0, ["B1", "👑 Le rocher du Roi Crabe"]);
    if (!Prog.P.bosses.B9) opts.splice(3, 0, ["B9", "👑 Le nid de l'Aigle-Roi"]);
    const v = await Dialog.choose(sp("maelle"), "Le Bastien est prêt. On va où, matelot ?", opts.concat([["non", "Nulle part"]]));
    if (v === "non") return;
    if (v === "etoiles" && !Prog.flag("carte_ciel") && !isNight()) { await say("maelle", "L'Îlot aux Étoiles ? On ne le trouve qu'à la nuit, en suivant les étoiles. Ou avec une carte du ciel."); return; }
    await cut(async (S) => {
      S.bg("sea", { boat: { x: 300 }, night: isNight(), island: v === "phare" ? "#8a8a90" : v === "tortues" ? "#8ac070" : v === "etoiles" ? "#9a8ad0" : null, ix: 820, tower: v === "phare" }); S.music("sea"); S.camNow(500, 300, 900);
      await S.fade(0, .8); await S.wait(1.6); await S.fade(1, .8);
    });
    if (v === "B1" || v === "B9") {
      const l = LAIRS.find((x) => x.id === v); const r = await Battle.start({ foes: [v], bg: "sea", bgOpt: { boat: { x: 300 } }, noFlee: true });
      if (r === "win") { await guardianFreed(v); if (v === "B1" && Quests.stage("pipa") === 0) await Quests.Q.pipa.onBoss(); } else worldAfterLoss();
      const w = NPC.W("ponton"); Game.teleport(w.x - 30, w.y - 20); return;
    }
    const dest = { tortues: [1420, 870], phare: [1440, 205], etoiles: [150, 870], port: [940, 870] }[v];
    let x = dest[0] * K, y = dest[1] * K; for (let k = 0; k < 40 && !Game.world.walkable(x, y); k++) { y -= 20; x += (k % 2 ? 1 : -1) * 12; }
    Game.teleport(x, y); Game.toast("⛵ " + { tortues: "Île aux Tortues", phare: "Île du Phare", etoiles: "Îlot aux Étoiles", port: "Le port" }[v], 2000);
    if (v !== "port") Game.toast("Pour repartir, reviens au bord de l'eau : Maëlle t'attend. (Ramasser près du bateau)", 3500);
  }
  // sur les îles : le bateau attend au bord de l'eau
  const BOATS = [[1420, 870], [1440, 205], [150, 870]];
  function islandBoat(p) { for (const [x, y] of BOATS) if (Math.hypot(p.x - x * K, p.y - y * K) < 220) return true; return false; }

  // ================================================================ entrées des grottes
  async function caveDoor(n) {
    if (n === 5 && !Prog.flag("coeur_ouvert")) { await Dialog.say(NARR, "Une paroi de roche noire, chaude comme une peau. Elle bat, doucement. Ysolde, au Sanctuaire, sait comment l'ouvrir."); return; }
    if (n >= 6 && !Dungeon.CAVES[n]) { Game.toast("La grotte est scellée."); return; }
    const C = KALUA.CAVES[n - 1];
    const v = await Dialog.choose({ name: C.name, icon: "torche" }, `${C.name} — ${C.mode}.${Prog.cave(n).cleared ? " (terminée)" : ""} Entrer ?`, [["go", "Entrer"], ["no", "Pas maintenant"]]);
    if (v === "go") Game.enterCave(n);
  }

  // ================================================================ boss des grottes : avant / après
  async function caveBossIntro(n) {
    const t = { 1: ["La Mère-Racine", "Elle berçait les morts. Maintenant, elle les dévore."], 3: ["Le Geôlier sans visage", "Il garde encore les prisonniers d'une reine morte."], 5: ["La Reine Cendrée", "Ilaïa, dernière Reine-Chanteuse des Lumes."] }[n];
    if (!t) return;
    await cut(async (S) => { S.bg(n === 5 ? "heart" : "cave", { col: Dungeon.PAL[n].wall, glow: n === 1 ? "rgba(120,200,90,.3)" : "rgba(120,160,255,.25)" }); S.music(n === 5 ? "final" : "boss" + "c" + n, .4); S.camNow(500, 300, 900);
      S.add("b", { boss: { 1: "mereRacine", 3: "geolier", 5: "reineCendree" }[n], x: 500, y: 430, scale: .9 });
      await S.fade(0, .6); S.shake(6, 1); S.sfx("roar"); await S.caption(t[0], t[1], 2.6); await S.fade(1, .4); });
    if (n === 5) await finalIntro();
  }
  async function caveBossDone(n) {
    Prog.set("cave" + n + "_done");
    if (n === 1) await cut(async (S) => {
      S.bg("cave", { col: "#3a2a1e", glow: "rgba(180,255,140,.35)" }); S.music("reveal"); S.camNow(500, 300, 800); S.fx("light", 6);
      const m = S.add("me", { me: true, x: 400, y: 420, dir: "right" }); const sp0 = S.add("sp", { boss: "mereRacine", x: 640, y: 430, scale: .55, alpha: .5 });
      await S.fade(0, .8);
      await S.say({ name: "La Mère-Racine", color: "#5a8a3a" }, "…Merci. Je berçais leurs âmes… puis la cendre noire m'a donné faim. Si faim.");
      await S.say({ name: "La Mère-Racine", color: "#5a8a3a" }, "La reine… Ilaïa. Elle n'est pas morte, petit cœur. Elle est en bas. Tout en bas. Elle attend.");
      await S.fadeActor(sp0, 0, 2);
      await S.say(NARR, "Au fond de la salle, une dernière fresque : une reine fusionnée avec une étoile noire. Ses yeux sont deux braises.");
      await S.fade(1, 1);
    });
    if (n === 3) await cut(async (S) => {
      S.bg("cave", { col: "#2a2e3a", glow: "rgba(140,200,255,.3)" }); S.music("reveal"); S.camNow(500, 300, 760);
      const m = S.add("me", { me: true, x: 360, y: 420, dir: "right" }); const pa = S.add("pa", { partner: true, x: 300, y: 425, dir: "right" });
      S.add("cell", { draw: (c) => { c.fillStyle = "#3a3a46"; for (let i = 0; i < 6; i++) c.fillRect(-60 + i * 22, -150, 8, 150); c.fillRect(-64, -150, 128, 8); c.fillStyle = "#c9c9d6"; c.font = "700 11px serif"; c.textAlign = "center"; c.fillText("NALIA, FILLE D'ILAÏA", 0, -160); }, x: 620, y: 430 });
      await S.fade(0, .8);
      await S.say(NARR, "Au fond de la prison, une cellule plus petite que les autres. Sur la porte, gravé à la main : « Nalia, fille d'Ilaïa. Enfermée pour avoir désobéi à la Reine. »");
      const n0 = S.add("nalia", { npc: "nalia", x: 820, y: 420, dir: "left", glow: "rgba(200,230,255,.4)" }); await S.move(n0, 700, 420, 1.6);
      await S.say("nalia", "…Vous l'avez trouvée. Ma cellule.");
      await S.say("nalia", "Oui. C'est mon nom. Ilaïa était ma mère. Quand elle a voulu chanter le Chant Interdit, j'ai refusé de l'aider. Elle m'a enfermée ici.");
      const v = await S.choose("nalia", "Quand le Cœur s'est fêlé, le peu de Souffle qu'elle m'avait donné m'a gardée en vie. J'avais seize ans. Ça fait sept cents ans.", [["ok", "Pourquoi tu ne nous l'as pas dit ?"], ["triste", "Tu as été seule tout ce temps ?"]]);
      await S.say("nalia", v === "ok" ? "Parce que vous m'auriez regardée comme vous me regardez maintenant." : "Seule ? Non. Il y avait les lucioles. Et les Échoués. Ils arrivent, ils restent, ils meurent. Moi, je reste.");
      await S.say("nalia", "Il y a autre chose que je ne vous ai pas dit. Je vous le dirai. Bientôt. Je vous le promets.");
      await S.fade(1, 1.2);
    });
    if (n === 2) await lines(NARR, ["L'Amiral Nacre rentre dans sa coquille, calmé. Une voix minuscule en sort : « La cloche… Elle nous appelait aussi, autrefois. Toutes les nuits de tempête. »", "Dans la coque du navire lume, tu trouves une plaque : la route vers l'Île du Phare y est gravée, avec un dessin de cloche."]);
    if (n === 4) await lines(NARR, ["Le Tempestaire se défait en notes de musique qui s'envolent par les couloirs. Une seule reste, posée dans ta main : la Note perdue.", Prog.isDead("oro") ? "Tu penses à Grand-père Oro. Il aurait aimé l'entendre." : "Quelque part sur les falaises, Grand-père Oro lève la tête. Il croit avoir entendu quelque chose."]);
    if (n === 5) return; // la fin est gérée par finale()
    Game.exitCave(n);
    if ([1, 2, 3, 4].every((k) => Prog.cave(k).cleared)) setTimeout(() => Game.toast("Les quatre grottes sont libérées ! Ysolde, au Sanctuaire du volcan, t'attend.", 4500), 1500);
  }

  // ================================================================ LA FIN
  async function finalIntro() {
    await cut(async (S) => {
      S.bg("heart", {}); S.music("final", .5); S.camNow(500, 300, 900); S.fx("embers", 14);
      const n = S.add("nalia", { npc: "nalia", x: 300, y: 430, dir: "right" }); const m = S.add("me", { me: true, x: 220, y: 440, dir: "right" }); const pa = S.add("pa", { partner: true, x: 160, y: 445, dir: "right" });
      const r = S.add("r", { boss: "reineCendree", x: 680, y: 440, scale: .8 });
      await S.fade(0, 1);
      await S.say({ name: "La Reine Cendrée", color: "#c04a3a" }, "Nalia. Ma fille. Tu m'as enfin amené ce que je t'avais demandé.");
      await S.say("nalia", "Je ne t'ai rien amené, mère. Ils sont venus te libérer. Et moi aussi.");
      await S.say({ name: "La Reine Cendrée", color: "#c04a3a" }, "Me libérer ? Je suis VIVANTE depuis sept cents ans. Avec deux cœurs de plus, je vivrai pour toujours.");
      S.shake(8, 1); S.sfx("roar");
      await S.say("nalia", "Battez-vous ! Moi, je dois préparer le dernier chant. Tenez bon jusqu'à ce que je revienne !");
      await S.move(n, 100, 380, 1); S.remove("nalia");
      const nG = Object.keys(Prog.P.bosses).filter((k) => /^B\d+$/.test(k)).length;
      if (nG) await S.say(NARR, `Les ${nG} Gardiens que tu as libérés brillent dans le Cœur : la Reine est plus faible.`);
      await S.fade(1, .6);
    });
    // (chaque Gardien libéré affaiblit la Reine : voir rtbosses.js, reineCendree.onSpawn)
  }
  async function finale() {
    // la Reine tombe… et se relève : la phase spéciale au tour par tour, le Chant à Deux
    await cut(async (S) => {
      S.bg("heart", {}); S.music("finalChant", .6); S.camNow(500, 300, 900); S.fx("embers", 8);
      const m = S.add("me", { me: true, x: 330, y: 440, dir: "right" }); const pa = S.add("pa", { partner: true, x: 270, y: 445, dir: "right" });
      const r = S.add("r", { boss: "reineCendree", x: 640, y: 440, scale: .7, phase: 2 });
      await S.fade(0, .8);
      await S.say(NARR, "La Reine Cendrée s'effondre… puis se redresse dans un hurlement. Le Cœur fêlé, dans sa poitrine, se met à battre au rythme de vos cœurs à vous.");
      await S.say({ name: "La Reine Cendrée", color: "#c04a3a" }, "Je vous tiens. Vos deux cœurs battent pour moi, maintenant.");
      await S.say(NARR, "Il n'y a plus d'épée, plus de chant de guerre. Il ne reste qu'une chose à faire : chanter ensemble le Chant de Délivrance, chacun son tour, sans se lâcher la main.");
      await S.fade(1, .6);
    });
    for (;;) {
      const r = await Battle.start({ foes: ["reineFinale"], ally: "partner", bg: "heart", noFlee: true, intro: "Le Chant à Deux commence. Chantez tour à tour, et ne vous lâchez pas la main !" });
      if (r === "win") break;
      Prog.P.hp = Prog.P.maxHp; Prog.changed();
      await Dialog.say(sp("nalia"), "(La voix de Nalia, de très loin.) Relevez-vous… Chantez chacun votre tour. Seul, une voix se brise. À deux, elle porte.");
    }
    await ending();
  }
  async function ending() {
    await cut(async (S) => {
      S.bg("heart", { pure: 0 }); S.music("sad", 1); S.camNow(500, 300, 860); S.fx("light", 6);
      const m = S.add("me", { me: true, x: 320, y: 440, dir: "right" }); const pa = S.add("pa", { partner: true, x: 260, y: 445, dir: "right" });
      const r = S.add("r", { boss: "reineCendree", x: 640, y: 440, scale: .7, phase: 2 });
      const n = S.add("nalia", { npc: "nalia", x: 80, y: 430, dir: "right", glow: "rgba(220,240,255,.7)" });
      await S.fade(0, 1);
      await S.move(n, 540, 430, 2.2);
      await S.say("nalia", "Mère. C'est moi. C'est Nalia.");
      await S.say({ name: "La Reine Cendrée", color: "#c04a3a" }, "…Nalia ? Ma toute petite… Tu as… tu as l'air si fatiguée.");
      await S.say("nalia", "Toi aussi, mère. Ça fait si longtemps. Il est temps de se reposer.");
      await S.say(NARR, "Nalia prend la main de la Reine, et elle chante. Le Chant de Délivrance. Elle y met tout ce qui lui reste de Souffle : sept cents ans de vie.");
      S.music("finalChant", .5); S.sfx("light"); S.fx("light", 30); S.flash("#fff6d8", .8);
      for (let i = 0; i <= 10; i++) { S.opt({ pure: i / 10 }); await S.wait(.25); }
      S.remove("r");
      const il = S.add("ilaia", { av: Object.assign({}, Avatar.DEFAULT, { hair: "treslong", hairColor: "#2a1a20", top: "robe", topColor: "#e8d8f0", hat: "couronne", hatColor: "#ffd23a", skin: "#f0dcd0", eyes: "endormis" }), x: 640, y: 440, glow: "rgba(255,240,200,.7)" });
      await S.say({ name: "Ilaïa", color: "#a07ad0" }, "Pardon. Pardon, ma fille. Pour la prison. Pour la Cendre. Pour tous ces gens. Pour tout.");
      await S.say("nalia", "Je sais, maman. Je sais.");
      await S.say({ name: "Ilaïa", color: "#a07ad0" }, "(À vous deux.) Deux cœurs… Ne vous lâchez jamais. Moi, j'ai lâché la main de tout le monde.");
      await Promise.all([S.fadeActor(il, 0, 3.5), S.fadeActor(n, 0, 3.5), S.move(il, 620, 240, 3.5), S.move(n, 560, 240, 3.5)]);
      await S.say(NARR, "Ilaïa et Nalia se défont en lumière, ensemble. Le Cœur de Kalua, apaisé, bat doucement. La Fêlure s'est refermée.");
      await S.fade(1, 2, "#fff");
      // --- dehors
      S.music("hope", 1); S.fx("light", 0); S.fx("embers", 0);
      S.bg("stars", { aurora: true }); S.camNow(500, 300, 980); S.remove("me"); S.remove("pa");
      await S.fade(0, 2.5, "#fff");
      await S.say(NARR, "Cette nuit-là, toute l'île sortit regarder le ciel.");
      const dead = ["keo", "bastien", "oro"].filter((d) => Prog.isDead(d)).map((d) => NPC.get(d).name);
      const stars = ["Les douze Gardiens", "Mila", ...dead, "Nalia"];
      for (let i = 0; i < stars.length; i++) { S.add("s" + i, { boss: "etoile", x: 160 + i * (680 / stars.length), y: 140 + (i % 2) * 50, scale: .4, label: stars[i] }); S.sfx("light", .6); await S.wait(.7); }
      await S.say(NARR, "De nouvelles étoiles s'étaient allumées. Les Gardiens libérés. Mila. " + (dead.length ? dead.join(", ") + ". " : "") + "Et, juste au-dessus du volcan, une petite étoile un peu plus blanche que les autres, qui clignotait comme une luciole.");
      for (let i = 0; i < stars.length; i++) S.remove("s" + i);
      // les adieux au port
      S.bg("beach", { dawn: true, wreck: false }); S.camNow(500, 320, 860);
      const boat = S.add("boat", { draw: (c, t) => { c.fillStyle = "#8a5a3a"; c.beginPath(); c.moveTo(-90, 0); c.lineTo(90, 0); c.lineTo(70, 26); c.lineTo(-70, 26); c.fill(); c.fillStyle = "#4a3020"; c.fillRect(-3, -140, 6, 140); c.fillStyle = "#f4ecd8"; c.beginPath(); c.moveTo(3, -134); c.quadraticCurveTo(80, -80, 3, -14); c.fill(); c.fillStyle = "#2a2a3a"; c.font = "800 12px serif"; c.textAlign = "center"; c.fillText("Le Bastien", 0, 18); }, x: 780, y: 340 });
      const tim = S.add("tim", { npc: "tim", x: 720, y: 320, dir: "left", scale: .8 }), jojo = S.add("jojo", { npc: "jojo", x: 800, y: 320, dir: "left", scale: .8 }), ro = S.add("rosalie", { npc: "rosalie", x: 840, y: 318, dir: "left", scale: .8 });
      const m2 = S.add("me", { me: true, x: 360, y: 420, dir: "right" }); const p2 = S.add("pa", { partner: true, x: 300, y: 425, dir: "right" }); const ma = S.add("maelle", { npc: "maelle", x: 460, y: 415, dir: "right" });
      await S.fade(0, 1.5);
      await S.say("maelle", "La Cloche s'est tue. Les boussoles marchent. Tim, Jojo et Dame Rosalie rentrent chez eux. Moi, je les ramène… et je reviendrai. Promis.");
      await S.say("tim", "Vous venez pas ?! … Ah. Vous restez. Évidemment, vous restez.");
      await S.say("rosalie", "Prenez soin de Coco. Il vous préfère, de toute façon. L'ingrat.");
      S.sfx("wave"); await Promise.all([S.move(boat, 1300, 300, 5), S.move(tim, 1240, 280, 5), S.move(jojo, 1320, 280, 5), S.move(ro, 1360, 278, 5)]);
      S.bg("village", { night: false }); S.camNow(500, 300, 820); S.remove("maelle");
      m2.x = 440; m2.y = 410; p2.x = 520; p2.y = 412; S.face(m2, "right"); S.face(p2, "left");
      const coco = S.add("coco", { creature: "perroquet", x: 480, y: 320 });
      await S.say(NARR, "Et vous deux, vous êtes restés. Sur votre île. Dans votre village. Sous un ciel enfin clair.");
      await S.say({ name: "Coco", color: "#3a9a3a" }, "DEUX CŒURS ! DEUX CŒURS !");
      await S.fade(1, 3);
    }, { noSkip: false });
    Prog.kill("nalia"); Prog.set("final_done"); Prog.set("marais_clair"); Prog.P.lore.coeur = true;
    await credits();
    Game.exitCave(5); setTimeout(() => { const w = NPC.W("villageFeu"); Game.teleport(w.x + 40, w.y + 40); }, 400);
  }
  async function credits() {
    await cut(async (S) => {
      S.bg("stars", { aurora: true }); S.music("credits", 1.5); S.camNow(500, 300, 900); S.fx("light", 3);
      await S.fade(0, 2);
      const C = [["Les Échoués de Kalua", ""], ["Une idée de", "Sixte Maron"], ["Histoire, monde et code", "Claude"], ["Direction, tests et idées", "Sixte Maron"], ["Musique (composée en direct)", "Claude"], ["Les trois boss des îles imaginés par", "Sixte Maron"], ["Au Coin · Dame Plumeau · Capitaine Stella", "et les Étoiles Filantes"],
        ["Avec", "Nalia · Capitaine Bastien · Kéo · Amaru · Mère Tikka · Mila"], ["", "Grand-père Oro · Lili · Fennek · Pyrrha · Ysolde · Brann"], ["", "Pipa · Maëlle · Tim · Jojo · Dame Rosalie · Coco"], ["Au village", "Barnabé · Léon · Mamie Brioche · Monsieur Plume · Gino · Fanny · Margot · Lucas · Ahmed"], ["Et les Douze Gardiens", "qui retenaient la Cendre"],
        ["À la mémoire de", "Kéo, Bastien, Oro… et Nalia"], ["Pour deux cœurs", "qui battent ensemble"], ["Merci d'avoir joué", "♥"]];
      for (const [a, b] of C) { await S.caption(a, b, 3.4); }
      await S.fade(1, 2);
    }, { noSkip: false });
  }

  // ================================================================ boucle de l'histoire
  let tickT = 0;
  function update(dt) {
    updateEscort(dt);
    tickT -= dt; if (tickT > 0) return; tickT = .5;
    const o = Quests.objective(); Game.objective(o ? o.text : Prog.flag("escort") ? "Suis Nalia jusqu'au village" : Prog.flag("village_found") && !Prog.flag("final_done") ? goalText() : "");
    // Fennek : la nuit, les lanternes ; Arnaud ; etc. → gérés par les quêtes
  }
  function resume() { if (Prog.flag("escort")) { startEscort(false); Game.objective("Suis Nalia jusqu'au village"); } }
  function music() { return null; }
  function event(kind, data) { /* réservé : succès, statistiques */ }
  function lore(id) { const L = LORE[id]; if (!L) return; Prog.note("Lore : " + L.title); Dialog.say({ name: "📖 " + L.title, icon: "sceauFragment", color: "#7a6a9a" }, L.text); }
  // renvoie tout de suite vrai/faux (l'action elle-même continue en arrière-plan)
  function interactWorld(p) {
    if (Prog.flag("bateau_ok") && islandBoat(p) && KALUA.isleAt(p.x / K, p.y / K) >= 0) { sail(); return true; }
    const o = nearestObj(p, 80); if (!o) return false; doInteract(o); return true;
  }

  // le boss final : après sa défaite en temps réel, la phase au tour par tour
  const _done = caveBossDone;
  return { intro, talk, marker, hidden, goalText, target, collect, hintAt, interact: interactWorld, hit, spell, caveDoor, caveBossIntro,
    async caveBossDone(n) { if (n === 5) return finale(); return _done(n); }, lore, update, resume, music, event, conque, sail, LAIRS, credits, ending };
})();
