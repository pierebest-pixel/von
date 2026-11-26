/* Les Échoués de Kalua — la vie du village (0.7) :
 *  · des habitants derrière les comptoirs (Rosalie au Fil d'Or, Jojo à la Marmite, et les commerçants du village de base) ;
 *  · de nouveaux habitants à quêtes (le maire Barnabé et ses projets, Léon le facteur, Mamie Brioche, Monsieur Plume, Gino, Fanny) ;
 *  · la fête sur la place (décor, guirlandes, musique, habitants qui dansent) et le marché de Noël automatique en décembre ;
 *  · le cinéma en plein air (revoir les cinématiques) ;
 *  · les nouveaux vêtements dans le créateur de personnage. */
"use strict";

const VillageLife = (() => {
  const K = KALUA.K, VX = KALUA.VILLAGE.x, VY = KALUA.VILLAGE.y, TAU = Math.PI * 2;
  const { def, stage, start, to, finish, data, at, say, lines, choose, costTxt } = Quests;
  // ================================================================ les comptoirs du village de base
  // lieu (unités de carte) juste à côté de la porte de chaque commerce
  const BASEPOS = {}; for (const [id, x, y] of Village.BASE) BASEPOS[id] = [x, y];
  const spotOf = (id, dx = 70, dy = 40) => [VX + (BASEPOS[id][0] + dx) / K, VY + (BASEPOS[id][1] + dy) / K];
  const SHOPS = { mairie: "mairie", marmite: "restaurant", filOr: "vetements", auberge: "auberge", biblio: "bibliotheque", cafe: "cafe", boulangerie: "boulangerie", glacier: "glacier", marche: "marche", epicerie: "epicerie", poste: "poste" };
  for (const [spot, b] of Object.entries(SHOPS)) NPC.SPOT[spot] = spotOf(b);
  NPC.SPOT.placeV = [VX, VY + 2]; NPC.SPOT.sapinV = [VX + 70 / K, VY - 170 / K];
  // le comptoir dessiné devant le commerçant (on ne voit que le haut du corps)
  NPC.props.shop = (c) => {
    c.fillStyle = "rgba(40,30,20,.18)"; c.fillRect(-38, -4, 76, 8);
    c.fillStyle = "#8a5a36"; c.beginPath(); c.roundRect(-36, -34, 72, 34, 3); c.fill();
    c.fillStyle = "#a8743f"; c.fillRect(-36, -34, 72, 7); c.fillStyle = "#6e4426"; for (let i = 0; i < 4; i++) c.fillRect(-30 + i * 19, -24, 2, 22);
    c.fillStyle = "#f4ecdc"; c.beginPath(); c.roundRect(-30, -40, 22, 7, 2); c.fill(); c.fillStyle = "#ffd23a"; c.beginPath(); c.arc(20, -38, 5, 0, TAU); c.fill();
  };
  const av = NPC.av;
  const day = (id, home = "auberge") => [[7, home, "idle"], [8, id, "shop"], [19, "placeV", "idle"]];
  const KEEP = [
    ["barnabe", { name: "Barnabé", title: "le maire", shopOf: "mairie", color: "#3a5a9a", sched: day("mairie"), homeAt: [22, 7],
      avatar: av({ skin: "#f0c8a8", face: "rond", eyes: "joyeux", brows: "epais", hair: "chauve", hairColor: "#bdbdbd", mustache: "guidon", top: "veste", topColor: "#3a4a7a", topColor2: "#ffd27a", bottom: "pantalon", bottomColor: "#2a2a3a", shoes: "mocassins", hat: "melon", hatColor: "#2a2a3a", build: "costaud", glasses: "rondes" }),
      barks: { shop: ["Bienvenue, bienvenue !", "Notre village sera le plus beau de l'archipel !"], idle: ["Quelle belle soirée !"] } }],
    ["leon", { name: "Léon", title: "le facteur", shopOf: "poste", color: "#c0603a", sched: day("poste"), homeAt: [22, 7],
      avatar: av({ skin: "#e0b48a", face: "long", eyes: "rond", hair: "court", hairColor: "#5a3a2a", mustache: "fine", top: "chemise", topColor: "#3a6ab0", topColor2: "#ffd23a", bottom: "short", bottomColor: "#2a3a6a", shoes: "baskets", hat: "casquette", hatColor: "#3a6ab0" }),
      barks: { shop: ["Du courrier ? Non ? Une autre fois !", "Le vent a encore éparpillé mon sac…"] } }],
    ["brioche", { name: "Mamie Brioche", title: "la boulangère", shopOf: "boulangerie", color: "#c08a3a", sched: [[5, "boulangerie", "shop"], [19, "placeV", "idle"]], homeAt: [21, 5],
      avatar: av({ skin: "#fbe0d0", face: "rond", eyes: "endormis", hair: "chignon", hairColor: "#f0f0f0", top: "robe", topColor: "#ffe0b0", topColor2: "#ffffff", pattern: "vichy", bottom: "jupe", bottomColor: "#c08a3a", shoes: "sandales", glasses: "rondes", build: "costaud" }),
      barks: { shop: ["Croissants tout chauds !", "Il me faudrait de la bonne farine…"] } }],
    ["plume", { name: "Monsieur Plume", title: "le bibliothécaire", shopOf: "bibliotheque", color: "#5a4a8a", sched: day("biblio"), homeAt: [22, 7],
      avatar: av({ skin: "#f0d0b0", face: "long", eyes: "miclos", brows: "arques", hair: "frange", hairColor: "#8a8a8a", beard: "bouc", top: "pull", topColor: "#5a4a8a", pattern: "losanges", bottom: "pantalon", bottomColor: "#3a3a4a", shoes: "mocassins", glasses: "rondes" }),
      barks: { shop: ["Chut… on lit, ici.", "Quatre livres en retard. QUATRE."] } }],
    ["gino", { name: "Gino", title: "le glacier", shopOf: "glacier", color: "#d05a8a", sched: day("glacier"), homeAt: [22, 7],
      avatar: av({ skin: "#e8b48a", face: "ovale", eyes: "joyeux", hair: "boucle", hairColor: "#2a1a10", mustache: "epaisse", top: "tshirt", topColor: "#ffffff", pattern: "rayures", topColor2: "#ff8ab0", bottom: "pantalon", bottomColor: "#ff8ab0", shoes: "baskets", hat: "bob", hatColor: "#ffffff" }),
      barks: { shop: ["Pistache ! Pistache ! Où es-tu ?", "Une boule ou deux ?"] } }],
    ["fanny", { name: "Fanny", title: "la maraîchère", shopOf: "marche", color: "#5a9a4a", sched: [[6, "marche", "shop"], [18, "placeV", "idle"]], homeAt: [21, 6],
      avatar: av({ skin: "#c98d63", face: "coeur", eyes: "brillants", hair: "nattes", hairColor: "#c96a3a", top: "salopette", topColor: "#5a9a4a", topColor2: "#ffe08a", bottom: "short", bottomColor: "#5a9a4a", shoes: "bottes", hat: "paille", freckles: .7 }),
      barks: { shop: ["Fruits frais, légumes du jour !", "Mon panier est tout vide…"] } }],
    ["margot", { name: "Margot", title: "l'aubergiste", shopOf: "auberge", color: "#9a4a3a", sched: [[7, "auberge", "shop"]], homeAt: [23, 7],
      avatar: av({ skin: "#f0c8a8", face: "large", eyes: "amande", hair: "ondule", hairColor: "#8a3a2a", top: "chemise", topColor: "#ffffff", topColor2: "#9a4a3a", bottom: "jupe", bottomColor: "#6a3a2a", shoes: "bottes", earrings: "anneaux" }),
      barks: { shop: ["Une chambre ? Un lit, c'est la meilleure des potions.", "Il reste de la soupe."] } }],
    ["lucas", { name: "Lucas", title: "le cafetier", shopOf: "cafe", color: "#6a4a3a", sched: [[6, "cafe", "shop"], [18, "placeV", "idle"]], homeAt: [21, 6],
      avatar: av({ skin: "#8a5a3c", face: "ovale", eyes: "rond", hair: "afro", hairColor: "#1a1410", beard: "troisjours", top: "tshirt", topColor: "#3a2a20", bottom: "pantalon", bottomColor: "#c9b090", shoes: "baskets" }),
      barks: { shop: ["Un petit café ? Ça fait courir !", "Le meilleur café de l'archipel. Le seul, aussi."] } }],
    ["ahmed", { name: "Ahmed", title: "l'épicier", shopOf: "epicerie", color: "#3a7a6a", sched: day("epicerie"), homeAt: [22, 7],
      avatar: av({ skin: "#c98d63", face: "carre", eyes: "joyeux", brows: "epais", hair: "court", hairColor: "#1a1410", beard: "courte", top: "chemise", topColor: "#3a7a6a", bottom: "pantalon", bottomColor: "#3a3a3a", shoes: "mocassins" }),
      barks: { shop: ["Tout ce qu'il faut, et un peu plus !", "Des bananes ? J'ai des bananes."] } }],
  ];
  for (const [id, o] of KEEP) NPC.add(id, o);
  // Rosalie tient le Fil d'Or, Jojo cuisine à la Marmite
  const rosalie = NPC.get("rosalie"); rosalie.sched = [[8, "tente2", "idle"], [9, "filOr", "shop"], [18, "campFeu", "idle"], [21, "tente2", "sleep"]]; rosalie.shopOf = "vetements";
  rosalie.barks.shop = ["Bienvenue au Fil d'Or, mon chou !", "Tout est gratuit. L'élégance n'a pas de prix."];
  const jojo = NPC.get("jojo"); jojo.sched = [[6, "campFeu", "cook"], [10, "marmite", "shop"], [20, "campFeu", "cook"], [22, "tente2", "sleep"]]; jojo.shopOf = "restaurant";
  jojo.barks.shop = ["Le ragoût est prêt !", "Trois plats par jour, pas un de plus !"];
  try { Quests.Q.rosalie.stages[0].at = at("filOr"); } catch (e) { /* ignore */ }

  const GREET = { vetements: "Bienvenue au Fil d'Or ! Essaie tout ce que tu veux, mon chou.", restaurant: "Installe-toi ! Qu'est-ce qui te ferait plaisir ?", mairie: "Bienvenue à la mairie !", poste: "La Poste de Kalua, à votre service !", boulangerie: "Bonjour mon petit ! Tout sort du four.",
    bibliotheque: "Chut… Prends le livre que tu veux.", glacier: "Ciao ! Quelle glace aujourd'hui ?", marche: "Fruits frais, légumes du jour !", auberge: "Bienvenue à l'auberge ! Une chambre t'attend.", cafe: "Un café ? Il est tout chaud.", epicerie: "Bonjour ! Fais ton marché." };
  const baseB = (id) => Village.all().find((b) => b.base && b.id === id);
  const origTalk = Story.talk;
  Story.talk = async function (id) {
    const n = NPC.get(id);
    if (id === "barnabe") { Prog.P.talked[id] = true; if (await Quests.talk(id)) return; return projects(); }
    if (n && n.shopOf && NPC.pos(id, Net.now()).act === "shop") {
      Prog.P.talked[id] = true; Prog.changed();
      if (await Quests.talk(id)) return;
      if (id === "barnabe") return projects();
      const b = baseB(n.shopOf); await Dialog.say(NPC.speaker(id), GREET[n.shopOf] || "Bonjour !");
      if (b) return Services.use(b);
      return;
    }
    if (id === "perekalua") return pereKalua();
    return origTalk(id);
  };

  // ================================================================ quêtes des nouveaux habitants
  const VPT = (dx, dy) => [VX + dx / K, VY + dy / K]; // un point du village (pixels depuis le centre) en unités de carte
  const has = (id, lvl = 1) => Object.values(Village.S.b || {}).some((b) => b && b.id === id && (b.lvl || 1) >= lvl);

  // ---- le maire Barnabé : les projets du village (une vraie suite de quêtes, avec récompenses)
  const PROJ = [
    { t: "Construire une maison", d: "Une vraie maison, rien qu'à vous. (Menu ≡ → Construire → Habitat)", ok: () => has("maison"), r: { potion: 2, coquillage: 5 } },
    { t: "Planter un potager", d: "Un potager nourrit tout un village. (Construire → Production)", ok: () => has("potager"), r: { miel: 2, perle: 1 } },
    { t: "Embellir : 6 décorations", d: "Fleurs, bancs, lampions… Posez 6 décorations dehors.", ok: () => Object.keys(Village.S.o || {}).length >= 6, r: { lotus: 2, perle: 1 } },
    { t: "Une fontaine ou un kiosque", d: "Les habitants rêvent d'un endroit où se retrouver.", ok: () => has("fontaine") || has("kiosque"), r: { fer: 4, pierre: 10 } },
    { t: "Agrandir la maison", d: "Passez la maison au niveau 2 (chantier partagé, dans Construire → Modifier).", ok: () => has("maison", 2), r: { potion: 2, perle: 2 } },
    { t: "Une fête sur la place", d: "Organisez une fête à la mairie. Tout le village viendra danser !", ok: () => Boolean(Village.S.fete) || Prog.flag("fete_faite"), r: { perle: 2, larmeDoree: 1 } },
    { t: "Un cinéma en plein air", d: "Pour revoir vos plus belles aventures sous les étoiles.", ok: () => has("cinema"), r: { potion: 3, cristalFeu: 1 } },
    { t: "Le Château", d: "Le grand rêve : une maison de niveau 5, un vrai château Renaissance.", ok: () => has("maison", 5), r: { perle: 6, larmeDoree: 2, couronneVillage: 1 } },
  ];
  def("projets", { title: "Les projets du village", kind: "small", giver: "barnabe", desc: "Le maire Barnabé rêve d'un village magnifique. Chaque projet réalisé est récompensé.",
    stages: PROJ.map((p) => ({ obj: `Projet du maire : ${p.t}`, at: at("mairie") })),
    talk: { async barnabe() { return false; } } });
  const rewardTxt = (r) => Object.entries(r).map(([k, v]) => `${v} ${ITEMS.name(k)}`).join(", ");
  async function projects() {
    let s = stage("projets");
    if (s < 0) { await lines("barnabe", ["Ah ! Les fameux Échoués ! Barnabé, maire de Kalua, pour vous servir.", "J'ai de GRANDS projets pour notre village. Une maison, un potager, une fête… et un jour, un château !", "Chaque projet réalisé, je vous récompense. Parole de maire !"]); start("projets"); s = 0; }
    // récompenser tous les projets déjà réalisés
    while (s >= 0 && s < PROJ.length && PROJ[s].ok()) {
      const p = PROJ[s]; await say("barnabe", `Bravo ! Le projet « ${p.t} » est réalisé ! Voici votre récompense : ${rewardTxt(p.r)}.`);
      for (const [k, v] of Object.entries(p.r)) Prog.give(k, v); Music.jingle("item");
      if (s + 1 >= PROJ.length) { finish("projets"); await say("barnabe", "Un château… Je n'ose y croire. Vous avez fait de Kalua le plus beau village de l'archipel. Merci !"); return; }
      to("projets", s + 1); s++;
    }
    if (s >= 0 && s < PROJ.length) {
      G.menuOpen = true;
      const d = panel(`<h3>📋 Projets du village</h3><div class="psub">« Chaque projet réalisé est récompensé ! » — Barnabé, le maire</div>
        ${PROJ.map((p, i) => `<div class="item ${i < s ? "dim2" : ""}" style="cursor:default"><i style="background:${i < s ? "#e6f6ea" : i === s ? "#fff1d9" : "#f1ecfb"}">${i < s ? "✅" : i === s ? "⭐" : "🔒"}</i><span class="dish">${esc(p.t)}<small>${i <= s ? esc(p.d) + " · 🎁 " + esc(rewardTxt(p.r)) : "Plus tard…"}</small></span></div>`).join("")}
        <button class="item main center" data-close>Au travail !</button>`, "projets");
      d.querySelector(".panel").addEventListener("click", (e) => { if (e.target.closest("[data-close]")) G.menuOpen = false; });
      d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
    } else await say("barnabe", "Kalua est magnifique grâce à vous. Je n'ai plus rien à demander… à part une autre fête !");
  }

  // ---- Léon le facteur : le sac de courrier renversé
  const LETTERS = [VPT(-1300, 175), VPT(-640, 300), VPT(380, 175), VPT(1250, 300), VPT(60, 760)];
  def("leon", { title: "Le sac du facteur", kind: "small", giver: "leon", desc: "Un coup de vent a éparpillé tout le courrier de Léon dans le village.",
    stages: [{ obj: "Ramasse les 5 lettres envolées dans le village (0/5)", at: () => { const d = data("leon"), i = LETTERS.findIndex((_, k) => !(d.l || [])[k]); const p = LETTERS[Math.max(0, i)]; return { x: p[0] * K, y: p[1] * K }; } },
      { obj: "Rapporte les lettres à Léon, à la Poste", at: at("poste") }, { obj: "Livre le colis de Léon à Brann, à la forge du volcan", at: at("forge") }, { obj: "Retourne voir Léon", at: at("poste") }],
    talk: {
      async leon() { const s = stage("leon");
        if (s < 0) { await lines("leon", ["Catastrophe ! Une bourrasque, et HOP ! Tout mon courrier s'est envolé dans le village.", "Cinq lettres. Tu veux bien m'aider à les retrouver ? Elles sont légères, elles ont dû voler loin."]); start("leon"); Prog.setQuest("leon", 0, { l: [] }); return true; }
        if (s === 1) { await lines("leon", ["Les cinq ! Tu es plus rapide que moi, et pourtant je cours toute la journée.", "Dis… Il y a aussi ce colis pour Brann, le forgeron. Il habite près du volcan. Mes jambes n'aiment pas le volcan."]); Prog.give("colis", 1); to("leon", 2); return true; }
        if (s === 2) { await say("leon", "Le colis est pour Brann, à la forge, près du volcan. Attention, ça chauffe là-haut !"); return true; }
        if (s === 3) { await lines("leon", ["Brann l'a reçu ? Merveilleux ! Le courrier passe TOUJOURS.", "Tiens : un timbre très rare, celui de la Reine Ilaïa. Et désormais, la Poste t'enverra un petit cadeau chaque jour."]); Prog.give("timbre", 1); Prog.give("perle", 2); Prog.set("poste_plus"); finish("leon"); return true; }
        return false; },
      async brann() { if (stage("leon") !== 2 || !Prog.has("colis")) return false; Prog.take("colis", 1); await lines("brann", ["Un colis ? Pour moi ? … Des gants de forge tout neufs ! C'est Léon qui les envoie ?", "Dis-lui merci. Et dis-lui de monter me voir, un jour. Le volcan ne mord pas. Presque pas."]); to("leon", 3); return true; },
    },
    objects: [{ id: "lettre", show: () => stage("leon") === 0, list: LETTERS, draw: "letter", hint: "✉️ Une lettre envolée",
      async interact(q, i) { const d = data("leon"); d.l = d.l || []; if (d.l[i]) return; d.l[i] = true; Prog.changed(); Music.sfx("pickup"); const n = d.l.filter(Boolean).length; Game.toast(`✉️ Lettre (${n}/5)`); if (n >= 5) to("leon", 1); } }] });

  // ---- Mamie Brioche : la galette des Échoués
  const GALETTE = { farine: 3, oeuf: 2, miel: 1, lait: 1 };
  def("brioche", { title: "La galette des Échoués", kind: "small", giver: "brioche", desc: "Mamie Brioche veut cuire une galette pour tout le village. Il lui faut les produits des fermes du village.",
    stages: [{ obj: `Apporte à Mamie Brioche : 3 farines, 2 œufs, 1 miel, 1 lait`, at: at("boulangerie") }],
    talk: { async brioche() { const s = stage("brioche");
      if (s < 0) { await lines("brioche", ["Bonjour mon petit ! Tu sais ce qui manque à ce village ? Une GALETTE. Une vraie, qu'on partage.", "Mais il me faut de la farine du moulin, des œufs du poulailler, du miel de la ruche et du lait de l'enclos.", "Si vous construisez tout ça, vous aurez tout ce qu'il faut. Et moi, je m'occupe du reste !"]); start("brioche"); return true; }
      if (s === 0) { if (Prog.pay(GALETTE)) { await lines("brioche", ["Tout y est ! Attends… (Elle pétrit, elle enfourne, elle chantonne.)", "Voilà ! Une galette dorée. Et dedans, la fève : c'est toi qui l'as ! Tu es le roi… ou la reine de Kalua !", "Et désormais, à la boulangerie, mes plats te soigneront deux fois plus."]); Prog.give("feve", 1); Prog.give("potion", 2); Prog.set("brioche_plus"); finish("brioche"); } else await say("brioche", `Il me manque encore : ${costTxt(GALETTE)}. Construis un moulin, un poulailler, une ruche et un enclos !`); return true; }
      return false; } } });

  // ---- Monsieur Plume : les livres en retard
  const BOOKS = { amaru: "« Contes de la Reine Ilaïa »", lili: "« Atlas des étoiles »", maelle: "« Les courants de l'archipel »", zephyr: "« Mille façons de parler au vent »" };
  const bookTalk = (who, txt) => async function () { if (stage("plume") !== 0) return false; const d = data("plume"); d.b = d.b || {}; if (d.b[who]) return false; d.b[who] = true; Prog.changed(); await say(who, txt); Music.sfx("pickup"); const n = Object.keys(d.b).length; Game.toast(`📚 Livre récupéré (${n}/4) : ${BOOKS[who]}`); if (n >= 4) to("plume", 1); return true; };
  def("plume", { title: "Les livres en retard", kind: "small", giver: "plume", desc: "Quatre habitants ont emprunté des livres à la bibliothèque… il y a très, très longtemps.",
    stages: [{ obj: "Récupère les 4 livres : Amaru, Lili, Maëlle et Zéphyr (0/4)", at: at("ruineJ") }, { obj: "Rapporte les livres à Monsieur Plume", at: at("biblio") }],
    talk: {
      async plume() { const s = stage("plume");
        if (s < 0) { await lines("plume", ["Chut… Ah, c'est toi. Tu tombes bien. J'ai QUATRE livres en retard. Quatre !", "Amaru la conteuse, la petite Lili, Maëlle la navigatrice et Zéphyr le meunier.", "Va les voir. Sois poli… mais ferme."]); start("plume"); Prog.setQuest("plume", 0, { b: {} }); return true; }
        if (s === 0) { await say("plume", `Il m'en manque encore ${4 - Object.keys(data("plume").b || {}).length}. Amaru, Lili, Maëlle, Zéphyr…`); return true; }
        if (s === 1) { await lines("plume", ["Les quatre ! Un peu cornés… mais entiers. Merci, merci.", "Tiens : la carte d'honneur de la bibliothèque. Et ce vieux livre-là. Il parle du Cœur de Kalua. Garde-le."]); Prog.give("grandLivre", 1); Prog.give("perle", 1); Prog.P.lore.bibliotheque = true; Prog.changed(); finish("plume"); return true; }
        return false; },
      amaru: bookTalk("amaru", "Le livre de contes ? Oh… je l'avais oublié. Tiens. Je les connais tous par cœur, de toute façon."),
      lili: bookTalk("lili", "L'Atlas des étoiles ! Je l'ai lu dix fois. Bon… onze. Tiens, rends-le à Monsieur Plume."),
      maelle: bookTalk("maelle", "« Les courants de l'archipel »… Il m'a sauvé la vie, ce livre. Rends-le-lui avec mes remerciements."),
      zephyr: bookTalk("zephyr", "Ah, le livre du vent ? Fouuu ! Il s'était envolé sous mon lit. Le voilà."),
    } });
  Quests.order.splice(Quests.order.indexOf("plume"), 1); Quests.order.unshift("plume"); // les livres passent avant le reste des conversations

  // ---- Gino le glacier : Pistache a disparu
  const CAT = [VPT(-1080, 140), VPT(960, -380), VPT(-300, -250), VPT(1380, 520), VPT(-560, 690), VPT(420, -480)];
  def("gino", { title: "Pistache a disparu", kind: "small", giver: "gino", desc: "Le chat de Gino adore se cacher. Il faut le retrouver trois fois.",
    stages: [{ obj: "Trouve Pistache, le chat de Gino, caché dans le village", at: () => null }, { obj: "Ramène Pistache à Gino (il te suit)", at: at("glacier") }],
    talk: { async gino() { const s = stage("gino"), d = data("gino");
      if (s < 0) { await lines("gino", ["Mamma mia ! Pistache ! Mon chat ! Il a encore filé !", "Il se cache toujours dans un coin du village. Tu veux bien le chercher ? Il est vert. Enfin, presque."]); start("gino"); Prog.setQuest("gino", 0, { n: 0, i: 0 }); return true; }
      if (s === 1) { d.n = (d.n || 0) + 1; Prog.changed();
        if (d.n >= 3) { await lines("gino", ["Pistache ! Mon trésor ! Trois fois que tu le retrouves… Tu es un vrai détective.", "Pour te remercier : la glace à la pistache est pour toi, chaque jour. Elle rend tous les cœurs !"]); Prog.give("perle", 2); Prog.set("gino_plus"); finish("gino"); return true; }
        await say("gino", ["Grazie ! … Oh non. Il a déjà refilé. Tu peux le retrouver encore ?", "Il recommence ! Dernière fois, promis. Enfin… j'espère."][d.n - 1]); d.i = (d.i + 1 + Math.floor(Math.random() * 3)) % CAT.length; Prog.changed(); to("gino", 0); return true; }
      if (s === 0) { await say("gino", "Cherche bien ! Derrière les boutiques, près des arbres… Il adore les coins tranquilles."); return true; }
      return false; } },
    objects: [{ id: "pistache", show: () => stage("gino") === 0, only: () => data("gino").i || 0, list: CAT, draw: "cat", hint: "🐱 Pistache !",
      async interact() { Music.sfx("pickup"); Game.toast("🐱 Miaou ! Pistache se laisse attraper."); to("gino", 1); } }] });

  // ---- Fanny la maraîchère : le panier du marché
  const PANIER = { banane: 5, champignon: 3, coco: 2, lotus: 1 };
  def("fanny", { title: "Le panier de Fanny", kind: "small", giver: "fanny", desc: "Le marché est vide : Fanny a besoin de produits de l'île.",
    stages: [{ obj: "Apporte à Fanny : 5 bananes, 3 champignons, 2 noix de coco, 1 lotus", at: at("marche") }],
    talk: { async fanny() { const s = stage("fanny");
      if (s < 0) { await lines("fanny", ["Bonjour ! Regarde mes étals… tout vides. Le naufrage a tout chamboulé.", "Il me faudrait des bananes, des champignons, des noix de coco… et un lotus du marais, pour faire joli."]); start("fanny"); return true; }
      if (s === 0) { if (Prog.pay(PANIER)) { await lines("fanny", ["Waouh ! Mon marché revit !", "Tiens, des graines magiques : votre potager donnera le double, maintenant. Et deux perles, pour la route."]); Prog.give("perle", 2); Prog.set("potager_plus"); finish("fanny"); } else await say("fanny", `Il me manque : ${costTxt(PANIER)}.`); return true; }
      return false; } } });

  // ================================================================ objets de quête (dessins)
  Story.drawExtra = (k, c, t, o) => {
    if (k === "letter") { c.save(); c.translate(Math.sin(t * 2 + o.i) * 4, -10 + Math.sin(t * 3 + o.i) * 3); c.rotate(Math.sin(t * 2.4 + o.i) * .3); c.fillStyle = "#fffaf0"; c.fillRect(-10, -7, 20, 14); c.strokeStyle = "#c0603a"; c.lineWidth = 1.5; c.strokeRect(-10, -7, 20, 14); c.beginPath(); c.moveTo(-10, -7); c.lineTo(0, 1); c.lineTo(10, -7); c.stroke(); c.fillStyle = "#e05a5a"; c.beginPath(); c.arc(0, 1, 2.5, 0, TAU); c.fill(); c.restore(); return true; }
    if (k === "cat") { c.save(); c.translate(0, -8); c.scale(1.2, 1.2); Creatures.drawKind(c, "chat"); c.restore(); c.fillStyle = "#9ad04a"; c.beginPath(); c.arc(0, -34 + Math.sin(t * 4) * 2, 4, 0, TAU); c.fill(); return true; }
    return false;
  };

  // ================================================================ la fête sur la place, et le marché de Noël (en décembre, automatiquement)
  const PX = () => Village.CX, PY = () => Village.CY;
  const isDecember = () => new Date().getMonth() === 11;
  const feteOn = () => { const f = Village.S.fete; return Boolean(f) && Date.now() - f < 3 * 3600 * 1000; };
  const noelOn = () => isDecember();
  const evening = (T) => { const h = NPC.hourAt(T); return h >= 17 && h < 23; };
  function festNow(T = Net.now()) { if (feteOn()) return "fete"; if (noelOn()) return "noel"; return null; }
  const FETE = [["fanionsFete", -300, -120], ["fanionsFete", 300, -120], ["lampionsFete", -230, 50], ["lampionsFete", 230, 50], ["ballons", -380, 60], ["ballons", 380, 60], ["matFete", -440, -80], ["scene", 450, -170], ["gateauGeant", 150, -185]];
  const NOEL = [["grandSapin", 70, -200], ["renneLumineux", -280, 120], ["traineauPereNoel", 290, 120], ["archeNoel", 0, 330], ["sucreOrgeExt", -380, -190], ["sucreOrgeExt", 380, -190], ["etoileGeante", -180, -205], ["bougieGeante", 460, 60], ["bougieGeante", -460, 60]];
  const CHALETS = [[-540, -110], [-540, 90], [540, -110], [540, 90]];
  const LAMPS = [[-12, -6], [-7, -11], [7, -11], [12, -6], [7, -1], [-7, -1]];
  function chalet(c, x, y, i) { // un chalet du marché de Noël (dessiné une fois en cache)
    const key = "chalet" + i; let sp = chaletCache[key];
    if (!sp) { const s = 22, cv = document.createElement("canvas"); cv.width = 8 * s; cv.height = 9 * s; const g = cv.getContext("2d"); g.translate(4 * s, 7.6 * s); g.scale(s, s);
      const B = BUILD.kit; B.shadow(g, 6, 4); B.wall(g, -2.8, 0, 5.6, 3.4, "#b07a4a", "planks"); B.awning(g, -2.8, -2.2, 5.6, .8, ["#d0303a", "#2a8a4a", "#d0303a", "#c08a2a"][i % 4], "#ffffff");
      B.rrect(g, -2.4, -1.4, 4.8, .5, .1, "#f4ecdc", B.OUT); for (let k = 0; k < 4; k++) B.ell(g, -1.8 + k * 1.2, -1.6, .35, .3, ["#ffd23a", "#e05a5a", "#7ac0e0", "#ffffff"][k], null);
      B.roof(g, -2.8, -3.4, 5.6, 2.4, "#7a4a2a", "shingle", { over: .6, inset: .4 }); B.rrect(g, -3.4, -5.9, 6.8, .7, .35, "#ffffff", null); B.rrect(g, -3.3, -3.6, 6.6, .5, .25, "#ffffff", null);
      g.font = "900 .7px sans-serif"; g.textAlign = "center"; g.fillStyle = "#fff"; g.fillText(["Vin chaud", "Pain d'épices", "Jouets", "Marrons"][i % 4], 0, -2.6);
      sp = chaletCache[key] = { cv, s }; }
    const k = Village.BS / sp.s; c.drawImage(sp.cv, x - 4 * sp.s * k, y - 7.6 * sp.s * k, sp.cv.width * k, sp.cv.height * k);
  }
  const chaletCache = {};
  function lampTop(i) { const [x, y] = LAMPS[i]; return { x: PX() + x * Village.BS, y: PY() + 90 + y * Village.BS - 5.4 * Village.BS }; }
  function garlands(c, kind, t) {
    const night = (() => { const h = NPC.hourAt(Net.now()); return h >= 19 || h < 6; })();
    const cols = kind === "noel" ? ["#e0303a", "#2aa04a", "#ffd23a", "#ffffff"] : ["#ff7f9f", "#ffd23a", "#7ad0ff", "#9ae07a", "#c9a3ff"];
    for (let i = 0; i < LAMPS.length; i++) {
      const a = lampTop(i), b = lampTop((i + 1) % LAMPS.length), n = 9;
      c.strokeStyle = "rgba(60,40,40,.6)"; c.lineWidth = 1.4; c.beginPath();
      for (let k = 0; k <= n; k++) { const q = k / n, x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q + Math.sin(q * Math.PI) * 26; if (k) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
      for (let k = 1; k < n; k++) { const q = k / n, x = a.x + (b.x - a.x) * q, y = a.y + (b.y - a.y) * q + Math.sin(q * Math.PI) * 26, col = cols[(k + i) % cols.length];
        if (kind === "fete" && !night) { c.fillStyle = col; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x + 6, y); c.lineTo(x, y + 12); c.fill(); }
        else { const on = .6 + .4 * Math.sin(t * 3 + k + i); if (night) { c.fillStyle = col.replace(")", "") ; c.globalAlpha = .25 * on; c.beginPath(); c.arc(x, y + 4, 11, 0, TAU); c.fill(); c.globalAlpha = 1; } c.fillStyle = col; c.beginPath(); c.arc(x, y + 4, 4, 0, TAU); c.fill(); } }
    }
  }
  const origCollect = Village.collect;
  Village.collect = function (items, view) {
    origCollect(items, view);
    const kind = festNow(); if (!kind) return;
    if (Math.abs(PX() - (view.x0 + view.x1) / 2) > 2600 || Math.abs(PY() - (view.y0 + view.y1) / 2) > 1800) return;
    const L = kind === "fete" ? FETE : NOEL;
    for (const [id, dx, dy] of L) { if (id === "feuArtifice") continue; const sp = Village.sprite("o", id); items.push({ y: PY() + dy, draw: (c) => Village.drawSprite(c, sp, PX() + dx, PY() + dy) }); }
    if (kind === "noel") CHALETS.forEach(([dx, dy], i) => items.push({ y: PY() + dy, draw: (c) => chalet(c, PX() + dx, PY() + dy, i) }));
    const h = NPC.hourAt(Net.now());
    if (kind === "fete" && (h >= 20 || h < 4)) { const sp = Village.sprite("o", "feuArtifice"); items.push({ y: PY() - 220, draw: (c) => Village.drawSprite(c, sp, PX() - 150, PY() - 220) }); }
    items.push({ y: 1e8, draw: (c, t) => garlands(c, kind, t ?? G.t) });
  };
  // la neige de décembre (sur l'écran, dans le village et la nuit de Noël partout)
  const flakes = Array.from({ length: 70 }, (_, i) => ({ x: Math.random(), y: Math.random(), s: 1 + Math.random() * 2.4, v: .03 + Math.random() * .05, ph: Math.random() * 6 }));
  function snow(c, vw, vh, dt) {
    if (!noelOn() || G.mode !== "world" || !G.p) return;
    const near = Math.hypot(G.p.x - PX(), G.p.y - PY()) < 2600, d = new Date(); if (!near && !(d.getDate() >= 24 && d.getDate() <= 26)) return;
    c.save(); c.setTransform(DPR, 0, 0, DPR, 0, 0); c.fillStyle = "rgba(255,255,255,.85)";
    for (const f of flakes) { f.y += f.v * dt; if (f.y > 1.02) { f.y = -.02; f.x = Math.random(); } const x = (f.x + Math.sin(G.t * .8 + f.ph) * .01) * vw, y = f.y * vh; c.beginPath(); c.arc(x, y, f.s, 0, TAU); c.fill(); }
    c.restore();
  }
  // les habitants viennent danser sur la place (fête : toute la journée ; Noël : le soir)
  const GATHER = ["barnabe", "leon", "brioche", "plume", "gino", "fanny", "margot", "lucas", "ahmed", "nana", "tim", "jojo", "rosalie", "tobi", "bodo", "maelle", "lili", "pipa"];
  NPC.setHook((n, T) => {
    const kind = festNow(T); if (!kind) return null;
    const i = GATHER.indexOf(n.id); if (i < 0) return null;
    const h = NPC.hourAt(T); if (kind === "noel" ? !evening(T) : (h < 9 || h >= 24)) return null;
    const a = i / GATHER.length * TAU + T * .05, rx = 300 + (i % 3) * 40, ry = 120 + (i % 2) * 30;
    const x = PX() + Math.cos(a) * rx, y = PY() - 40 + Math.sin(a) * ry; const dance = (Math.floor(T / 4) + i) % 3 !== 0;
    return { x, y, act: dance ? "dance" : "idle", moving: !dance, dir: Math.sin(a) > 0 ? "left" : "right", spot: "placeV" };
  });
  // le Père Kalua : en décembre, il distribue un cadeau par jour près du grand sapin
  NPC.add("perekalua", { name: "Père Kalua", title: "le Père Noël des îles", color: "#c0303a", sched: [[0, "sapinV", "idle"]],
    avatar: av({ skin: "#f8d8c8", face: "rond", eyes: "joyeux", brows: "epais", hair: "court", hairColor: "#ffffff", beard: "longue", mustache: "epaisse", top: "manteau", topColor: "#d0303a", topColor2: "#ffffff", bottom: "pantalon", bottomColor: "#d0303a", shoes: "bottes", shoesColor: "#2a2a2a", hat: "bonnet", hatColor: "#d0303a", build: "costaud" }),
    barks: { idle: ["Ho ho ho ! Joyeux Noël, les Échoués !", "Un cadeau par jour, pas un de plus !"] } });
  const origHidden = Story.hidden;
  Story.hidden = (id) => (id === "perekalua" ? !isDecember() : origHidden(id));
  async function pereKalua() {
    const k = "noel:" + Math.floor(Net.now() / NPC.DAY);
    if (Prog.P.flags[k]) { await Dialog.say(NPC.speaker("perekalua"), "Ho ho ho ! Ton cadeau d'aujourd'hui est déjà dans ton sac. Reviens demain !"); return; }
    Prog.P.flags[k] = true; Prog.changed();
    const gifts = [["perle", 2], ["potion", 2], ["larmeDoree", 1], ["miel", 3], ["cristalFeu", 1], ["lotus", 3], ["fer", 5]], g = gifts[Math.floor(Math.random() * gifts.length)];
    await Dialog.say(NPC.speaker("perekalua"), `Ho ho ho ! Joyeux Noël ! Tiens, un petit cadeau : ${g[1]} ${ITEMS.name(g[0])} !`); Prog.give(g[0], g[1]); Music.jingle("secret");
  }

  // ================================================================ le cinéma en plein air
  function cinema() {
    G.menuOpen = true; const L = Cutscene.films();
    const d = panel(`<h3>🎬 Cinéma en plein air</h3><div class="psub">Toutes les cinématiques déjà vues, à revoir sous les étoiles</div>
      ${L.length ? L.map((f, i) => `<button class="item" data-film="${esc(f.key)}"><i style="background:#f1ecfb">🎞️</i><span class="dish">${esc(f.title)}<small>Scène ${i + 1}${f.partial ? " · passée en partie" : ""}</small></span><span class="chev">▶</span></button>`).join("") : `<p class="pnote">Aucune cinématique encore. Elles apparaîtront ici dès que vous les aurez vues.</p>`}
      <button class="item main center" data-close>Fermer</button>`, "cinema");
    d.querySelector(".panel").addEventListener("click", async (e) => { const t = e.target.closest("[data-film],[data-close]"); if (!t) return; buzz(); closePanel(); G.menuOpen = false; if (t.dataset.film) { await Cutscene.replay(t.dataset.film); } });
    d.querySelector(".pdim").addEventListener("click", () => { G.menuOpen = false; });
  }
  const origUse = Services.use;
  Services.use = async function (b) {
    if (b.id === "cinema") return cinema();
    if (b.id === "glacier" && Prog.flag("gino_plus") && Services.once("pistache")) { Prog.heal(99); Music.jingle("heart"); toast("🍨 Glace à la pistache offerte par Gino : tous tes cœurs sont revenus !", null, 2600); return; }
    if (b.id === "poste" && Prog.flag("poste_plus") && Services.once("posteplus")) { Prog.give(["perle", "lotus", "miel", "coquillage"][Math.floor(Math.random() * 4)], 1); }
    if (b.id === "potager" && Prog.flag("potager_plus") && Services.once("potagerplus" + (b.bid || ""))) { Prog.give("banane", 2); Prog.give("herbe", 1); }
    if (b.id === "mairie") { Prog.set("mairie_vue"); }
    return origUse(b);
  };
  // la boulangerie de Mamie Brioche soigne deux fois plus après la galette
  const bm = Services.MENUS.boulangerie; if (bm) { const orig = bm[1].map((x) => x[3].heal); Object.defineProperty(Services, "_brioche", { value: () => { bm[1].forEach((x, i) => { x[3].heal = Prog.flag("brioche_plus") ? orig[i] * 2 : orig[i]; }); } }); }
  Prog.onChange(() => { if (Services._brioche) Services._brioche(); if (Village.S.fete && !Prog.flag("fete_faite")) Prog.P.flags.fete_faite = true; });

  // ================================================================ musique de fête
  const origMusic = Story.music;
  Story.music = function () {
    const m = origMusic ? origMusic() : null; if (m) return m;
    const kind = festNow(); if (!kind || !G.p) return null;
    if (Math.hypot(G.p.x - PX(), G.p.y - PY()) > 900) return null;
    if (kind === "noel" && !evening(Net.now()) && !feteOn()) return null;
    return kind;
  };

  // ================================================================ les nouveaux vêtements dans le créateur de personnage
  (function creator() {
    const tenue = Avatar.TABS.find((t) => t.id === "tenue"), acc = Avatar.TABS.find((t) => t.id === "accessoires");
    const item = (tab, key) => tab && tab.items.find((i) => i.key === key);
    const addVals = (it, vals) => { if (!it) return; for (const v of vals) if (!it.values.some((x) => x[0] === v[0])) it.values.push(v); };
    addVals(item(tenue, "top"), [["sweat", "Sweat"], ["blouson", "Blouson"], ["manteau", "Manteau"], ["maillot", "Maillot de bain"]]);
    addVals(item(tenue, "pattern"), CLOTHES.PATTERNS);
    addVals(item(tenue, "shoes"), [["mocassins", "Mocassins"], ["ballerines", "Ballerines"], ["espadrilles", "Espadrilles"]]);
    addVals(item(acc, "hat"), [["beret", "Béret"], ["capeline", "Capeline"], ["melon", "Melon"]]);
    if (tenue && !item(tenue, "print")) { const i = tenue.items.findIndex((x) => x.key === "pattern"); tenue.items.splice(i + 1, 0, { key: "print", label: "Imprimé", type: "choice", values: CLOTHES.PRINTS, zoom: "body" }); }
    const c3 = item(tenue, "topColor2"); if (tenue && c3 && !item(tenue, "topColor3")) tenue.items.splice(tenue.items.indexOf(c3) + 1, 0, Object.assign({}, c3, { key: "topColor3", label: "Troisième couleur" }));
  })();

  return { snow, cinema, projects, festNow, PROJ };
})();
