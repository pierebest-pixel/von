/* Les Échoués de Kalua — moteur de quêtes + les cinq grandes quêtes des PNJ importants + la quête du bateau.
 *  · Le Serment des Lumes (Kéo)           — très longue · boss : Grand Gorille Moussu, Serpent-Liane, Gardien du Temple · mort de Kéo
 *  · La Brume qui chante (Mère Tikka)     — très longue · boss : Reine Grenouille, Esprit des Brumes
 *  · Le Dernier Chant du Vent (Oro)       — très longue · boss : Bélier Tonnerre, Gargouille des Ruines · mort d'Oro
 *  · Les Lanternes éteintes (Fennek)      — moyenne
 *  · La Carte du ciel (Lili)              — normale
 *  · L'Enquête de la Mouette d'Argent (Capitaine Bastien) — la quête du bateau · boss : Petit Kraken · mort de Bastien
 * Chaque grande quête a trois cinématiques : le début, un tournant au milieu, la fin. */
"use strict";

const Quests = (() => {
  const Q = {}; const order = [];
  const K = KALUA.K;
  const def = (id, o) => { Q[id] = Object.assign({ id, kind: "small", stages: [], talk: {}, objects: [], on: {} }, o); order.push(id); };
  const st = (id) => Prog.quest(id);
  const stage = (id) => { const q = st(id); return q ? (q.done ? 999 : q.st) : -1; };
  function start(id) { if (st(id)) return; Prog.setQuest(id, 0); Music.jingle("quest"); Game.toast(`📜 Nouvelle quête : ${Q[id].title}`, 3000); Prog.note(`Quête commencée : ${Q[id].title}`); Prog.P.track = id; Prog.changed(); }
  function to(id, n, d) { Prog.setQuest(id, n, d); const s = Q[id].stages[n]; if (s && s.obj) Game.toast(`★ ${s.obj}`, 2600); }
  function next(id, d) { to(id, stage(id) + 1, d); }
  function finish(id) { Prog.finishQuest(id); Music.jingle("victory"); Game.toast(`✅ Quête terminée : ${Q[id].title}`, 3200); Prog.note(`Quête terminée : ${Q[id].title}`); if (Prog.P.track === id) Prog.P.track = null; Prog.changed(); }
  const data = (id) => (st(id) || { d: {} }).d;
  const at = (spot, dx = 0, dy = 0) => () => { const w = NPC.W(spot); return { x: w.x + dx * K, y: w.y + dy * K }; };
  const mapAt = (x, y) => () => ({ x: x * K, y: y * K });
  const hour = () => NPC.hourAt(Net.now());
  const isNight = () => { const h = hour(); return h >= 20 || h < 5; };
  const sp = (id) => NPC.speaker(id);
  const say = (id, txt) => Dialog.say(typeof id === "string" ? sp(id) : id, txt);
  const lines = (id, L) => Dialog.lines(typeof id === "string" ? sp(id) : id, L);
  const choose = (id, txt, o) => Dialog.choose(typeof id === "string" ? sp(id) : id, txt, o);
  const NARR = { name: "" };
  const cut = (fn) => Cutscene.play(fn);
  const me = () => ({ name: (typeof window.me !== "undefined" && window.me ? window.me.name : "Toi"), avatar: Game.myAvatar() });
  const have = (cost) => Prog.hasAll(cost);
  const costTxt = (cost) => Object.entries(cost).map(([k, v]) => `${v} ${ITEMS.name(k)} (${Prog.count(k)}/${v})`).join(", ");
  const fight = async (foes, o = {}) => { const r = await Battle.start(Object.assign({ foes: [].concat(foes) }, o)); return r === "win"; };
  const spotPos = (spot) => NPC.W(spot);

  // ================================================================ LE SERMENT DES LUMES (Kéo) — très longue
  def("keo", { title: "Le Serment des Lumes", kind: "red", giver: "keo", long: true,
    desc: "Kéo garde une porte qu'il n'a jamais vue s'ouvrir. Trois sceaux la ferment. Derrière : la vérité sur son père… et sur la reine.",
    stages: [
      { obj: "Parle à Amaru, la conteuse, sœur de Kéo (cabanes de la jungle)", at: at("cabane3") },
      { obj: "Suis les traces de mousse dans la jungle (0/3)", at: () => { const d = data("keo"); const L = [[350, 520], [320, 545], [395, 505]]; const i = Math.min(2, d.moss || 0); return { x: L[i][0] * K, y: L[i][1] * K }; } },
      { obj: "Affronte le Grand Gorille Moussu dans la clairière cachée", at: mapAt(380, 500) },
      { obj: "Retourne voir Kéo au Temple", at: at("temple") },
      { obj: "Demande à Maître Tilo où dort le Serpent-Liane", at: at("vieilArbre") },
      { obj: "Apporte 3 herbes médicinales à Maître Tilo pour soigner le vieil arbre", at: at("vieilArbre") },
      { obj: "Délivre le vieil arbre du Serpent-Liane", at: mapAt(270, 690) },
      { obj: "Rejoins Kéo au Temple, la nuit (après 20 h)", at: at("temple") },
      { obj: "Affronte le Gardien du Temple avec Kéo", at: at("temple") },
    ],
    talk: {
      async keo(q) {
        const s = stage("keo");
        if (s < 0) {
          await cut(async (S) => {
            S.bg("temple", { door: 0 }); S.music("quest"); S.camNow(500, 300, 800);
            const k = S.add("keo", { npc: "keo", x: 500, y: 410, dir: "up" }); const m = S.add("me", { me: true, x: 300, y: 430, dir: "right" });
            await S.fade(0, 1.2); await S.barsTo(1, .1);
            await S.say("keo", "Chaque nuit depuis douze ans, je monte la garde devant cette porte. Mon père la gardait avant moi. Et son père avant lui.");
            await S.move(m, 400, 430, 1.4);
            S.opt({ door: .04 }); S.shake(3, .6); S.sfx("door"); S.flash("#7ae0e0", .4);
            await S.wait(.6); S.face(k, "left");
            await S.say("keo", "…La porte a bougé. Quand tu t'es approché(e). Elle n'a JAMAIS bougé.");
            await S.say("keo", "Mon père, Kaïmo, est entré une nuit. La porte s'est refermée. On ne l'a jamais revu.");
            await S.say("keo", "Trois sceaux la ferment : celui de la Forêt, celui des Racines… et le troisième est derrière. Les deux premiers sont gardés par des bêtes anciennes.");
            const v = await S.choose("keo", "Aide-moi. Je veux savoir ce qui est arrivé à mon père.", [["oui", "Je t'aide, Kéo."], ["peur", "Et si on n'aimait pas la réponse ?"]]);
            if (v === "peur") await S.say("keo", "Alors je l'apprendrai quand même. Un Veilleur ne détourne pas les yeux.");
            await S.say("keo", "Ma sœur Amaru connaît les vieilles histoires. Elle saura où dort le Gardien de la Forêt.");
            await S.fade(1, 1);
          });
          start("keo"); return true;
        }
        if (s === 3) { await lines("keo", ["La fourrure de mousse… Le premier sceau. Je le sens vibrer.", "Le deuxième est l'écaille du Serpent-Liane. Il s'enroule autour du plus vieil arbre de la jungle. Maître Tilo saura lequel."]); next("keo"); return true; }
        if (s === 7) {
          if (!isNight()) { await say("keo", "La porte ne s'ouvre qu'à la nuit, quand les étoiles la touchent. Reviens après 20 h."); return true; }
          if (!Prog.has("fourrure") || !Prog.has("ecailleLiane")) { await say("keo", "Il nous faut les deux sceaux : la fourrure de mousse et l'écaille-liane."); return true; }
          await this.middle(); return true;
        }
        if (s === 8) { await say("keo", "Il est réveillé. Ensemble. Maintenant."); const ok = await this.fightGardien(); return true; }
        if (s >= 0 && s < 999) { await say("keo", ["Va voir Amaru. Elle est à sa cabane, ou au milieu des ruines à lire les spirales.", "Les traces de mousse mènent au Gardien de la Forêt.", "Le Grand Gorille… il est dans la clairière cachée.", "", "Maître Tilo, le vieil arbre qui parle, au sud-ouest de la jungle.", "Apporte les herbes à Tilo.", "Le Serpent est enroulé autour du vieil arbre, près du totem du sud."][s] || "Courage."); return true; }
        return false;
      },
      async amaru() {
        const s = stage("keo");
        if (s === 0) {
          await lines("amaru", ["Kéo t'envoie ? Il a enfin demandé de l'aide… Il doit avoir peur.", "Écoute la chanson du Gardien de la Forêt :", "« Où les arbres pleurent leur mousse, dort celui qui se souvient de tous. »", "Cherche la mousse grise sur les troncs. Elle mène à lui. Trois fois tu la verras."]);
          next("keo", { moss: 0 }); return true;
        }
        return false;
      },
      async tilo() {
        const s = stage("keo");
        if (s === 4) { await lines("tilo", ["Hmmm… Le Serpent-Liane… Il serre mon frère, le Vieil Ombre, depuis sept cents ans.", "Si tu le délivres, mon frère va souffrir en respirant de nouveau. Apporte-moi trois herbes médicinales : je préparerai un baume pour lui."]); next("keo"); return true; }
        if (s === 5) { if (Prog.pay({ herbe: 3 })) { await lines("tilo", ["Merci, jeune pousse. Le baume est prêt.", "Mon frère est au sud, près du totem. Le Serpent dort, enroulé sur lui. Ne le réveille pas… sans être prêt(e)."]); next("keo"); } else await say("tilo", `Il me faut trois herbes médicinales. Tu en as ${Prog.count("herbe")}. Elles poussent dans les buissons et les marais.`); return true; }
        return false;
      },
    },
    async middle() {
      await cut(async (S) => {
        S.bg("temple", { door: 0 }); S.music("reveal"); S.camNow(500, 300, 800); S.tint("rgba(20,30,80,.25)");
        const k = S.add("keo", { npc: "keo", x: 420, y: 410, dir: "up" }); const m = S.add("me", { me: true, x: 560, y: 420, dir: "up" }); const pa = S.add("pa", { partner: true, x: 620, y: 430, dir: "up" });
        await S.fade(0, 1);
        await S.say("keo", "La fourrure de mousse… dans le premier sceau. L'écaille-liane… dans le deuxième.");
        S.sfx("magic"); S.flash("#7ae0e0", .5); await S.wait(.5); S.sfx("door"); S.shake(5, 1.2);
        for (let i = 0; i <= 10; i++) { S.opt({ door: i / 10 * .9 }); await S.wait(.12); }
        await S.say(NARR, "Derrière la porte : un escalier qui descend dans le noir… et, posée contre le mur, une lance.");
        await S.say("keo", "…La lance de mon père.");
        await S.move(k, 500, 300, 1); S.fadeActor(k, .2, .5);
        await S.say(NARR, "Une voix de pierre résonne dans la crypte : « LA PORTE NE DOIT PAS S'OUVRIR. »");
        S.add("g", { boss: "B5", x: 500, y: 330, scale: .55, alpha: 0 }); S.fadeActor(S.get("g"), 1, 1); S.sfx("roar"); S.shake(8, .8);
        await S.wait(1.2); await S.fade(1, .6);
      });
      next("keo"); await this.fightGardien();
    },
    async fightGardien() {
      const ok = await fight("B5", { ally: "keo", bg: "temple", bgOpt: { door: .9 }, intro: "Le Gardien du Temple se dresse devant la crypte !" });
      if (!ok) { Game.toast("Kéo te traîne hors de la crypte. Le Gardien attend toujours."); return false; }
      Prog.P.bosses.B5 = true; Prog.give("oeilTurquoise", 1);
      await cut(async (S) => {
        S.bg("temple", { door: .9 }); S.music("sad", 1); S.camNow(500, 300, 760);
        const k = S.add("keo", { npc: "keo", x: 500, y: 330, dir: "down" }); const m = S.add("me", { me: true, x: 470, y: 420, dir: "up" }); const pa = S.add("pa", { partner: true, x: 540, y: 425, dir: "up" });
        const g = S.add("g", { boss: "B5", x: 500, y: 250, scale: .5, phase: 1 });
        await S.fade(0, .8);
        S.sfx("boom"); S.shake(10, 1.5); await S.fadeActor(g, 0, 1);
        await S.say(NARR, "Le Gardien s'effondre. Le plafond de la crypte craque. La grande porte commence à retomber !");
        S.opt({ door: .5 }); S.shake(8, 1);
        await S.move(k, 500, 380, .6); S.face(k, "up");
        await S.say("keo", "Sortez ! Je la retiens !");
        await S.move(m, 400, 470, .8); await S.move(pa, 600, 470, .6);
        await S.say("keo", "Prenez la pierre-œil. Elle montre ce que les Lumes ont caché. Montrez-la… à Ysolde.");
        S.shake(6, 2); await S.say("keo", "Dites à Amaru… que j'ai gardé la porte.");
        S.flash("#fff", .8); S.sfx("crash"); S.opt({ door: 0 }); S.remove("keo"); S.shake(12, 1);
        await S.wait(1.5);
        await S.say(NARR, "La porte s'est refermée. Pour toujours.");
        S.bg("jungle", {}); S.camNow(500, 300, 800);
        const a = S.add("amaru", { npc: "amaru", x: 760, y: 410, dir: "left" }); S.get("me").x = 420; S.get("me").y = 410; S.get("pa").x = 480;
        await S.move(a, 560, 410, 2);
        await S.say("amaru", "…Où est mon frère ?");
        await S.say(NARR, "Tu ne réponds pas. Amaru comprend.");
        await S.say("amaru", "Il a gardé la porte. Comme notre père. Comme le père de notre père.");
        const sp = S.add("lance", { item: "lanceKeo", x: 500, y: 410, scale: 2.2 });
        await S.say("amaru", "Je planterai sa lance devant le Temple. Et je porterai son collier. Il chantera encore, à travers moi.");
        await S.say(NARR, "Dans la pierre-œil, une image : deux personnes se tiennent la main devant une étoile fêlée. En dessous, des spirales : « Deux cœurs qui battent ensemble. »");
        await S.fade(1, 2);
      });
      Prog.kill("keo"); Prog.P.lore.prophetie = true; Prog.set("keo_dead"); finish("keo");
      return true;
    },
    objects: [
      { id: "moss", show: () => stage("keo") === 1, list: [[350, 520], [320, 545], [395, 505]], draw: "moss", hint: "🌿 Mousse grise sur le tronc",
        async interact(q, i) { const d = data("keo"); if ((d.moss || 0) !== i) { Game.toast("De la mousse… mais la piste ne passe pas par là."); return; } d.moss = i + 1; Prog.changed(); Music.sfx("puzzle"); Game.toast(`🌿 Trace de mousse (${d.moss}/3)`);
          if (d.moss >= 3) { await lines("amaru", ["(La chanson d'Amaru te revient : « …dort celui qui se souvient de tous. »)"]); next("keo"); } } },
    ],
    lairs: { B3: () => stage("keo") === 2, B4: () => stage("keo") === 6 },
    async onBoss(b) {
      if (b === "B3") { await lines(NARR, ["Le Grand Gorille tombe à genoux. La mousse de son dos se détache doucement…", "Il pose une grosse main sur ta tête, comme on bénit un enfant, puis il s'en va dans la forêt."]); to("keo", 3); }
      if (b === "B4") { await lines("tilo", ["(La voix de Tilo résonne dans les racines.) Mon frère respire… Merci. Prends l'écaille : c'est le deuxième sceau."]); to("keo", 7); }
    },
  });

  // ================================================================ LA BRUME QUI CHANTE (Mère Tikka) — très longue
  def("tikka", { title: "La Brume qui chante", kind: "red", giver: "tikka", long: true,
    desc: "Il y a dix ans, Mila, la petite-fille de Mère Tikka, a disparu dans la brume. Depuis, la brume chante avec sa voix.",
    stages: [
      { obj: "Interroge Fennek et Nouk sur les voix dans la brume (0/2)", at: at("pilotis2") },
      { obj: "Trouve un lotus sur les nénuphars du marais", at: at("roseaux") },
      { obj: "Rapporte le lotus à Mère Tikka", at: at("pilotis3") },
      { obj: "Affronte la Reine Grenouille sur le grand nénuphar", at: mapAt(430, 172) },
      { obj: "Obtiens une lanterne des morts (Fennek)", at: at("lanterne1") },
      { obj: "La nuit (après 22 h), entre dans le Cœur de la brume avec Mère Tikka", at: mapAt(560, 285) },
    ],
    talk: {
      async tikka() {
        const s = stage("tikka");
        if (s < 0) {
          await cut(async (S) => {
            S.bg("marsh", {}); S.music("sad"); S.camNow(500, 300, 820); S.fx("fireflies", 2);
            const t = S.add("tikka", { npc: "tikka", x: 520, y: 410, dir: "up" }); const m = S.add("me", { me: true, x: 300, y: 420, dir: "right" });
            await S.fade(0, 1.4);
            S.add("doll", { item: "poupee", x: 560, y: 400, scale: 1.2 });
            await S.say("tikka", "Chaque soir, je pose sa poupée au bord de l'eau. Au cas où.");
            await S.move(m, 420, 420, 1.2);
            await S.wait(.6); S.sfx("magic", .5);
            await S.say(NARR, "Dans la brume, un rire d'enfant. Tout près. Puis plus rien.");
            await S.say("tikka", "Tu l'as entendue, toi aussi ? Mila. Ma petite luciole. Elle avait sept ans quand la brume l'a prise.");
            await S.say("tikka", "Depuis dix ans, la brume chante avec sa voix. Les Brumiers disent que je deviens folle.");
            const v = await S.choose("tikka", "Tu veux bien chercher avec moi ? Mes yeux ne voient plus… mais toi, tu vois.", [["oui", "Je vais retrouver Mila."], ["prudent", "Je vais chercher ce qui chante."]]);
            await S.say("tikka", v === "oui" ? "Ne promets pas ce que la brume ne rend pas, petit(e). Mais merci." : "C'est honnête. Merci.");
            await S.say("tikka", "Fennek allume les lanternes des morts, il entend tout. Et le petit Nouk joue partout dans les roseaux. Commence par eux.");
            await S.fade(1, 1);
          });
          start("tikka"); Prog.setQuest("tikka", 0, { asked: {} }); return true;
        }
        if (s === 2) { if (!Prog.take("lotus", 1)) { await say("tikka", "Il me faut un lotus. Ils poussent sur les nénuphars, au nord du marais."); return true; }
          await lines("tikka", ["Un lotus… Je vais t'en faire un thé. Il ouvre les oreilles de l'âme.", "(Tu bois. Le monde devient flou… et tu entends clairement des centaines de voix, venues du grand nénuphar, au nord-ouest.)", "La Reine Grenouille… Bien sûr. Cette vaniteuse collectionne les voix des noyés. Va la voir. Et reprends-lui ce qui n'est pas à elle."]);
          Prog.give("the", 1, true); next("tikka"); return true; }
        if (s === 5) {
          if (!Prog.has("lanterne")) { await say("tikka", "Sans lanterne des morts, l'Esprit nous dévorera. Va voir Fennek."); to("tikka", 4); return true; }
          if (!(hour() >= 22 || hour() < 5)) { await say("tikka", "L'Esprit ne sort que dans la brume épaisse de la nuit. Après 22 heures. Je t'attendrai au Cœur de la brume."); return true; }
          await say("tikka", "C'est l'heure. Allons-y. Je tiendrai la lanterne."); return true;
        }
        if (s >= 0 && s < 999) { await say("tikka", ["Fennek et Nouk. Écoute ce qu'ils savent.", "Un lotus. Sur les nénuphars, au nord du marais.", "", "Le grand nénuphar, au nord-ouest. La Reine Grenouille.", "Fennek a des lanternes des morts. Il t'en prêtera une."][s] || "…"); return true; }
        return false;
      },
      async fennek() {
        const s = stage("tikka");
        if (s === 0) { const d = data("tikka"); if (d.asked.fennek) return false; d.asked.fennek = true; Prog.changed();
          await lines("fennek", ["Les voix ? Elles viennent toujours du même endroit : le grand nénuphar, au nord-ouest. Là où chante la Reine Grenouille.", "Et parfois… une voix de petite fille. Elle chante une comptine que je connais. « Lu-mé, lu-mé… »"]); await checkAsked(); return true; }
        if (s === 4) {
          if (stage("fennek") >= 999 || Prog.has("lanterne")) { if (!Prog.has("lanterne")) Prog.give("lanterne", 1); await say("fennek", "Prends cette lanterne. Pyrrha y a mis un peu de sa flamme : elle ne s'éteindra jamais."); next("tikka"); return true; }
          if (stage("fennek") >= 0) return false; // la quête de Fennek est en cours : c'est elle qui répond
          await lines("fennek", ["Une lanterne des morts ? Je n'en ai plus une seule qui tienne : quelqu'un vole mes flammes, chaque nuit !", "Aide-moi à attraper ce voleur, et je te donne ma plus belle lanterne."]);
          if (stage("fennek") < 0) await Q.fennek.talk.fennek(); return true;
        }
        return false;
      },
      async nouk() {
        const s = stage("tikka");
        if (s === 0) { const d = data("tikka"); if (d.asked.nouk) return false; d.asked.nouk = true; Prog.changed();
          await lines("nouk", ["La fille de la brume ? Je l'ai vue ! Elle est toute transparente. Elle joue à cache-cache avec moi, mais elle triche : elle passe à travers les arbres.", "Elle m'a dit que la grosse grenouille lui a volé sa voix. Elle chuchote, maintenant."]); await checkAsked(); return true; }
        return false;
      },
    },
    lairs: { B6: () => stage("tikka") === 3, B7: () => stage("tikka") === 5 && (hour() >= 22 || hour() < 5) && Prog.has("lanterne") },
    async onBoss(b) {
      if (b === "B6") {
        await cut(async (S) => {
          S.bg("marsh", { blue: true }); S.music("reveal"); S.camNow(500, 300, 820); S.fx("fireflies", 6);
          const m = S.add("me", { me: true, x: 360, y: 420, dir: "right" }); const r = S.add("reine", { boss: "B6", x: 640, y: 400, scale: .45 });
          await S.fade(0, .8);
          await S.say(NARR, "La Reine Grenouille hoquette… et recrache des dizaines de petites lumières : les voix qu'elle avait volées.");
          S.sfx("light"); S.burst("light", 40); await S.fadeActor(r, 0, 1.5);
          const mila = S.add("mila", { av: Object.assign({}, Avatar.DEFAULT, { hair: "couettes", hairColor: "#f4f2ff", top: "robe", topColor: "#e8f0ff", skin: "#eef4ff", eyes: "grands", aura: "#cfe6ff" }), x: 560, y: 410, alpha: 0, scale: .75, glow: "rgba(200,230,255,.6)" });
          await S.fadeActor(mila, .8, 1.5);
          await S.say({ name: "Mila", color: "#7ab0ff" }, "Grand-mère… dis à grand-mère… la brume a froid…");
          S.music("danger"); S.shake(6, 1.2); S.tint("rgba(220,230,240,.25)");
          await S.say(NARR, "Une main de brume immense surgit et emporte la petite silhouette vers le Cœur de la brume.");
          await S.move(mila, 900, 300, 1.2); S.remove("mila");
          S.add("doll", { item: "poupee", x: 560, y: 412, scale: 1.2 });
          await S.say(NARR, "La poupée de Mila tombe dans la vase. Tu la ramasses.");
          await S.fade(1, 1);
        });
        Prog.give("poupee", 1, true);
        await lines("tikka", ["(De retour au village sur pilotis…) Elle t'a parlé ? Elle… a froid ?", "L'Esprit des Brumes. Toutes les âmes noyées du marais, collées ensemble. Il l'a gardée.", "Il nous faudra une lanterne des morts pour l'approcher. Fennek."]);
        to("tikka", 4);
      }
      if (b === "B7") {
        await cut(async (S) => {
          S.bg("marsh", { blue: true }); S.music("hope", 1); S.camNow(500, 300, 760); S.fx("light", 8);
          const t = S.add("tikka", { npc: "tikka", x: 420, y: 410, dir: "right" }); const m = S.add("me", { me: true, x: 330, y: 425, dir: "right" });
          await S.fade(0, 1.2);
          await S.say(NARR, "L'Esprit des Brumes se défait en centaines de lucioles. Chaque luciole est une âme qui s'envole enfin.");
          const mila = S.add("mila", { av: Object.assign({}, Avatar.DEFAULT, { hair: "couettes", hairColor: "#f4f2ff", top: "robe", topColor: "#e8f0ff", skin: "#eef4ff", eyes: "grands", aura: "#cfe6ff" }), x: 640, y: 410, alpha: 0, scale: .75, glow: "rgba(200,230,255,.7)" });
          await S.fadeActor(mila, .9, 2);
          await S.say({ name: "Mila", color: "#7ab0ff" }, "Grand-mère ! Tu as grandi tes rides !");
          await S.move(mila, 470, 410, 1.6);
          await S.say("tikka", "Mila… Ma luciole. Je ne te vois pas… mais je te sens. Tu es chaude.");
          await S.say({ name: "Mila", color: "#7ab0ff" }, "J'ai plus froid. Je peux partir, maintenant ? Les autres m'attendent, là-haut.");
          await S.say("tikka", "Va. Va, ma luciole. Et chante juste, pour une fois.");
          S.sfx("light"); await Promise.all([S.move(mila, 520, 120, 3), S.fadeActor(mila, 0, 3)]);
          S.bg("stars", { aurora: true }); S.camNow(500, 300, 900);
          await S.say(NARR, "Une étoile nouvelle s'allume au-dessus du marais. La brume, pour la première fois depuis dix ans, se lève.");
          await S.fade(1, 2);
        });
        Prog.set("marais_clair"); Prog.take("poupee", 1); Prog.give("bottes", 1);
        await lines("tikka", ["Prends ces bottes de brume. Mila les avait tissées pour toi… enfin, pour quelqu'un comme toi. Elle disait qu'un jour viendrait quelqu'un.", "Et reviens me voir quand tu veux : je continuerai à tisser des Fils de vie pour toi. C'est tout ce que je sais faire de mes mains."]);
        finish("tikka");
      }
    },
  });
  async function checkAsked() { const d = data("tikka"); if (d.asked.fennek && d.asked.nouk) { await say(NARR, "Les deux pistes mènent au même endroit : le grand nénuphar, et sa Reine. Mère Tikka voudra préparer un thé de lotus pour t'ouvrir les oreilles de l'âme."); to("tikka", 1); } else Game.toast(`★ Interroge Fennek et Nouk (${Object.keys(d.asked).length}/2)`); }

  // ================================================================ LE DERNIER CHANT DU VENT (Grand-père Oro) — très longue
  const STONES = [[1150, 520], [1165, 498], [1190, 492], [1214, 505], [1222, 530], [1205, 552], [1175, 552]];
  def("oro", { title: "Le Dernier Chant du Vent", kind: "red", giver: "oro", long: true,
    desc: "Sept pierres levées chantaient autrefois avec le vent. Grand-père Oro voudrait les entendre une dernière fois.",
    stages: [
      { obj: "Réveille les sept pierres levées (0/7) — parle à Oro pour savoir comment", at: () => { const d = data("oro"); const i = STONES.findIndex((_, k) => !(d.s || [])[k]); const p = STONES[Math.max(0, i)]; return { x: p[0] * K, y: p[1] * K }; } },
      { obj: "Arrête le Bélier Tonnerre sur le haut plateau", at: mapAt(1235, 420) },
      { obj: "Reprends la pierre de chant à la Gargouille des Ruines", at: mapAt(1110, 676) },
      { obj: "Rejoins Oro aux pierres levées, au coucher du soleil (17 h – 20 h)", at: at("pierres") },
    ],
    talk: {
      async oro() {
        const s = stage("oro");
        if (s < 0) {
          await cut(async (S) => {
            S.bg("cliffs", { sunset: false, stones: 7, lit: 0 }); S.music("falaises"); S.camNow(500, 300, 860);
            const o = S.add("oro", { npc: "oro", x: 480, y: 410, dir: "down" }); const m = S.add("me", { me: true, x: 280, y: 420, dir: "right" });
            await S.fade(0, 1.2);
            S.sfx("wind", .6);
            await S.say(NARR, "Grand-père Oro souffle dans une vieille flûte fendue. Il n'en sort qu'un sifflement triste.");
            await S.move(m, 380, 420, 1.2);
            await S.say("oro", "Quand j'avais huit ans, ces sept pierres chantaient. Le vent passait dedans, et tout le plateau vibrait comme un orgue.");
            await S.say("oro", "Un jour, le vent s'est tu. Les pierres aussi. Les jeunes croient que j'invente.");
            const l = S.add("lili", { npc: "lili", x: 760, y: 410, dir: "left" }); await S.move(l, 580, 410, 1.4);
            await S.say("lili", "Grand-père ! Tu as encore oublié ton écharpe !");
            await S.say("oro", "Je voudrais les entendre une dernière fois, Lili. Avant de partir.");
            await S.say("lili", "Arrête de dire ça…");
            const v = await S.choose("oro", "Tu m'aiderais, toi, à réveiller les pierres ?", [["oui", "Je vais les faire chanter."], ["comment", "Comment fait-on chanter une pierre ?"]]);
            await S.say("oro", v === "comment" ? "Chacune a perdu sa voix d'une façon différente. Je vais te dire. Viens me voir quand tu veux, je t'expliquerai pierre par pierre." : "Hé hé. Tu as le regard d'un berger. Viens me voir, je t'expliquerai pierre par pierre.");
            await S.fade(1, 1);
          });
          start("oro"); Prog.setQuest("oro", 0, { s: [] }); return true;
        }
        if (s === 0) {
          const d = data("oro"), done = (d.s || []).filter(Boolean).length;
          const tips = ["La 1re (la plus à l'ouest) est couverte de mousse : frappe-la jusqu'à ce qu'elle soit propre.", "La 2e veut une offrande : une plume d'aigle. Les aigles nichent près de la tour.", "La 3e répond aux devinettes. Parle-lui.", "La 4e a besoin d'un grand coup de vent. Zéphyr le meunier connaît le Chant de la Bourrasque.", "La 5e a perdu sa pierre de chant : la Gargouille des Ruines l'a volée.", "La 6e attend l'éclair : sa voix est dans la corne du Bélier Tonnerre.", "La 7e, c'est moi qui la réveillerai. À la fin."];
          const next0 = (d.s || []).findIndex((v, k) => k < 6 && !v); const i = next0 < 0 ? (d.s || []).length < 6 ? (d.s || []).length : 6 : next0;
          await lines("oro", [`Tu as réveillé ${done} pierre(s) sur 7.`, tips[Math.min(i, 6)]]);
          if (done >= 4 && !d.mid) await Q.oro.middle();
          return true;
        }
        if (s === 3) { const h = hour(); if (h < 17 || h >= 20) { await say("oro", "Au coucher du soleil. Entre 17 h et 20 h. C'est l'heure où le vent se lève."); return true; } await Q.oro.ending(); return true; }
        if (s > 0 && s < 999) { await say("oro", ["", "Le Bélier… sur le haut plateau. Fais attention à toi.", "La Gargouille garde les ruines au sud. Elle a la pierre de chant."][s]); return true; }
        return false;
      },
    },
    async middle() {
      data("oro").mid = true; Prog.changed();
      await cut(async (S) => {
        S.bg("cliffs", { stones: 7, lit: 4, wind: true }); S.music("danger"); S.camNow(500, 300, 860); S.fx("leaves", 6);
        const o = S.add("oro", { npc: "oro", x: 480, y: 410 }); const m = S.add("me", { me: true, x: 380, y: 420, dir: "right" }); const l = S.add("lili", { npc: "lili", x: 580, y: 410, dir: "left" });
        for (let i = 0; i < 3; i++) S.add("mouton" + i, { creature: "mouton", x: 700 + i * 50, y: 420 + i * 6, dir: "left" });
        await S.fade(0, .8);
        S.sfx("wind"); await S.say(NARR, "Quatre pierres chantent. Une longue note grave roule sur le plateau. Le vent revient !");
        await S.say("oro", "Tu entends ? TU ENTENDS ? C'est… c'est ça !");
        S.lightning(2); S.sfx("roar");
        await S.say(NARR, "Mais le ciel s'assombrit d'un coup. Là-haut, sur le haut plateau, une silhouette de nuage et de cornes gratte le sol : le Bélier Tonnerre.");
        for (let i = 0; i < 3; i++) S.move(S.get("mouton" + i), 1100, 380, 1.4);
        await S.wait(.6); S.face(o, "down"); await S.say("oro", "Mes… mes jambes…"); o.lying = true; S.shake(4, .4);
        await S.say("lili", "GRAND-PÈRE ! … Ça va, il respire. Il est juste épuisé.");
        await S.say("lili", "Le Bélier a toujours détesté le vent. Il va tout casser. Arrête-le, je t'en prie !");
        await S.fade(1, 1);
      });
      to("oro", 1);
    },
    async ending() {
      await cut(async (S) => {
        S.bg("cliffs", { sunset: true, stones: 7, lit: 6, wind: true }); S.music("hope", 1); S.camNow(500, 300, 900); S.fx("leaves", 3);
        const o = S.add("oro", { npc: "oro", x: 820, y: 400, dir: "left" }); const l = S.add("lili", { npc: "lili", x: 740, y: 410, dir: "right" }); const m = S.add("me", { me: true, x: 560, y: 420, dir: "right" }); const pa = S.add("pa", { partner: true, x: 500, y: 425, dir: "right" });
        await S.fade(0, 1.5);
        await S.say("oro", "Six pierres. Il ne manque que la mienne. La septième.");
        await S.say("oro", "Lili, tu tiens ma main ? Bien.");
        await S.say(NARR, "Oro pose son front contre la dernière pierre, et il chante. Une voix fêlée, minuscule… puis le vent la prend, et les sept pierres répondent ensemble.");
        S.opt({ lit: 7 }); S.music("credits", .5); S.sfx("light"); S.burst("light", 60); S.fx("light", 10);
        await S.wait(2.5);
        await S.say("oro", "Le vent chante… comme quand j'avais huit ans.");
        await S.say("lili", "Grand-père, regarde, les moulins tournent tout seuls !");
        await S.say("oro", "Garde le moulin, ma Lili. Et compte les étoiles pour moi. Toutes.");
        S.face(o, "down"); await S.wait(1.2); o.lying = true;
        await S.say(NARR, "Grand-père Oro s'est endormi contre la pierre, un sourire au coin des lèvres. Il ne se réveillera pas.");
        S.music("sad", 2); S.add("hat", { item: "plume", x: 820, y: 360, scale: 1.4 }); S.move(S.get("hat"), 1200, 120, 4);
        await S.say(NARR, "Le vent emporte son chapeau de paille au-dessus des falaises.");
        await S.say("lili", "…Il a entendu. C'est tout ce qui compte. Il a entendu.");
        await S.fade(1, 2.5);
      });
      Prog.kill("oro"); Prog.set("oro_dead"); Prog.set("vent_chante"); Prog.give("lunette", 1); finish("oro");
      await lines("lili", ["Il voulait que tu aies sa lunette. Avec elle, on voit très loin… même la lumière du Phare, la nuit.", "Moi, je garde le moulin. Comme il a dit."]);
    },
    objects: [
      { id: "stone", show: () => stage("oro") >= 0 && stage("oro") < 3, list: STONES, draw: "stone", hint: "🪨 Pierre levée",
        async interact(q, i) {
          const d = data("oro"); d.s = d.s || []; if (d.s[i]) { Game.toast("Cette pierre chante doucement dans le vent."); return; }
          if (i === 0) { Game.toast("La pierre est couverte de mousse. Frappe-la pour la nettoyer."); return; }
          if (i === 1) { if (Prog.take("plumeAigle", 1)) { wake(i); Game.toast("Tu glisses la plume d'aigle dans une fente : la pierre fredonne !"); } else Game.toast("Une fente en forme de plume. (Il faut une plume d'aigle.)"); return; }
          if (i === 2) { const v = await choose({ name: "Pierre qui parle", icon: "pierreChant" }, "« Je cours sans jambes, je siffle sans bouche, je pousse les nuages et je n'ai pas de mains. Qui suis-je ? »", [[0, "Le vent"], [1, "La rivière"], [2, "Un oiseau"]]); if (v === 0) wake(i); else Game.toast("La pierre reste muette."); return; }
          if (i === 3) { Game.toast("La pierre est lourde et immobile… Un grand coup de vent la réveillerait (Bourrasque)."); return; }
          if (i === 4) { if (Prog.take("pierreChant", 1)) { wake(i); Game.toast("Tu remets la pierre de chant à sa place !"); } else Game.toast("Un creux vide, comme un nid. (La Gargouille a volé la pierre de chant.)"); return; }
          if (i === 5) { if (Prog.has("corneEclair")) { wake(i); Game.toast("Tu touches la pierre avec la corne-éclair : elle crépite et chante !"); } else Game.toast("La pierre attend l'éclair. (La corne du Bélier Tonnerre ?)"); return; }
          if (i === 6) { Game.toast("La septième pierre. Oro dit qu'il la réveillera lui-même."); }
        },
        hit(q, i) { if (i === 0) { const d = data("oro"); d.moss0 = (d.moss0 || 0) + 1; Prog.changed(); if (d.moss0 >= 4 && !(d.s || [])[0]) { wake(0); Game.toast("La pierre est propre. Elle chante !"); } else Game.toast("La mousse s'en va…", 800); return true; } return false; },
        spell(q, i, sp) { if (i === 3 && sp === "bourrasque") { wake(3); Game.toast("La bourrasque s'engouffre dans la pierre : elle CHANTE !"); return true; } return false; } },
    ],
    lairs: { B8: () => stage("oro") === 1, B10: () => stage("oro") === 2 || (stage("oro") === 0 && data("oro").mid) },
    async onBoss(b) {
      if (b === "B8") { await lines("lili", ["Le Bélier s'est calmé ! Il est redevenu… un simple bélier, un peu gros. Il est parti rejoindre le troupeau.", "Grand-père va mieux. Il dit : « Va chercher la pierre de chant chez la Gargouille, au sud. »"]); to("oro", 2); }
      if (b === "B10") { Prog.give("pierreChant", 1); await lines(NARR, ["Dans les griffes de pierre de la Gargouille : une petite pierre qui fredonne. La pierre de chant !"]); if (stage("oro") === 2) to("oro", 0); }
    },
  });
  function wake(i) { const d = data("oro"); d.s = d.s || []; d.s[i] = true; Prog.changed(); Music.sfx("light"); Music.jingle("puzzle");
    const n = d.s.filter(Boolean).length; Game.toast(`🪨 Pierres réveillées : ${n}/7`);
    if (n >= 6 && Prog.P.bosses.B8 && Prog.P.bosses.B10) to("oro", 3); else if (n >= 4 && !d.mid) Q.oro.middle(); }

  // ================================================================ LES LANTERNES ÉTEINTES (Fennek) — moyenne
  const WISP = [[505, 205], [540, 180], [520, 150], [470, 140]];
  def("fennek", { title: "Les Lanternes éteintes", kind: "red", giver: "fennek",
    desc: "Chaque nuit, quelqu'un vole les flammes bleues des lanternes des morts du marais.",
    stages: [
      { obj: "Guette la lanterne près des roseaux, la nuit (après 20 h)", at: at("lanterne2") },
      { obj: "Suis le feu follet ! (0/4)", at: () => { const p = WISP[Math.min(3, data("fennek").w || 0)]; return { x: p[0] * K, y: p[1] * K }; } },
      { obj: "Rassemble 3 bois et 2 feuilles de palmier pour faire un feu à l'enfant", at: mapAt(470, 140) },
      { obj: "Allume le feu près du berceau, dans les roseaux", at: mapAt(470, 140) },
      { obj: "Retourne voir Fennek", at: at("lanterne1") },
    ],
    talk: {
      async fennek() {
        const s = stage("fennek");
        if (s < 0) {
          await cut(async (S) => {
            S.bg("marsh", { blue: true }); S.music("night"); S.camNow(500, 300, 800); S.tint("rgba(20,30,80,.3)"); S.fx("fireflies", 3);
            const f = S.add("fennek", { npc: "fennek", x: 440, y: 410, dir: "right" }); const m = S.add("me", { me: true, x: 260, y: 420, dir: "right" });
            await S.fade(0, 1);
            await S.say("fennek", "Une flamme pour chaque âme. Comme ça, les morts retrouvent leur chemin.");
            S.sfx("magic"); const w = S.add("w", { boss: "follet", x: 570, y: 330, scale: 1 });
            await S.say(NARR, "Une petite flamme bleue se détache d'une lanterne… et file entre les roseaux en riant.");
            await S.move(w, 900, 300, .8); S.remove("w");
            await S.say("fennek", "ENCORE ! Ça fait la troisième cette semaine ! Sans flamme, les âmes se perdent !");
            await S.say("fennek", "Toi. Tu as l'air rapide. Guette la lanterne près des roseaux cette nuit. Attrape ce voleur.");
            await S.fade(1, 1);
          });
          start("fennek"); Prog.setQuest("fennek", 0, { w: 0 }); return true;
        }
        if (s === 4) { await Q.fennek.ending(); return true; }
        if (s >= 0 && s < 999) { await say("fennek", ["Guette la lanterne près des roseaux. La nuit !", "Suis-le ! Ne le perds pas !", "Un feu ? Pour un feu follet ? … Bon. Si tu le dis.", "Le berceau, dans les roseaux au nord.", ""][s]); return true; }
        return false;
      },
    },
    async ending() {
      await cut(async (S) => {
        S.bg("marsh", { blue: true }); S.music("hope"); S.camNow(500, 300, 760); S.tint("rgba(20,30,80,.25)"); S.fx("fireflies", 4);
        const f = S.add("fennek", { npc: "fennek", x: 420, y: 410, dir: "right" }); const m = S.add("me", { me: true, x: 320, y: 420, dir: "right" }); const w = S.add("w", { boss: "follet", x: 620, y: 360 });
        await S.fade(0, 1);
        await S.say({ name: "Pyrrha", color: "#7ab0ff" }, "Pardon, monsieur des lanternes. J'avais si froid. Depuis la Fêlure, j'ai toujours froid.");
        await S.say("fennek", "… La Fêlure ? Mais ça fait sept cents ans, petite.");
        await S.say({ name: "Pyrrha", color: "#7ab0ff" }, "Je sais. C'est long, sept cents ans, quand on a froid.");
        await S.say("fennek", "Bon. Écoute-moi bien. Je vais te fabriquer une lanterne à toi. La plus belle. Et toutes les nuits, tu m'aideras à allumer les autres. D'accord ?");
        await S.say({ name: "Pyrrha", color: "#7ab0ff" }, "Une maison ? À moi ? … D'accord !");
        await S.move(w, 470, 330, 1.2); S.sfx("light"); S.burst("sparkles", 30);
        await S.say(NARR, "Depuis cette nuit-là, les lanternes du marais brillent deux fois plus fort.");
        await S.fade(1, 1.5);
      });
      Prog.give("lanterne", 1); Prog.set("pyrrha"); finish("fennek");
      await say("fennek", "Tiens, la lanterne promise. Pyrrha y a mis un peu de sa flamme. Elle éclaire même l'âme des choses. Mère Tikka en aura besoin, je crois.");
      if (stage("tikka") === 4) to("tikka", 5);
    },
    objects: [
      { id: "lantern", show: () => stage("fennek") === 0, list: [[500, 246]], draw: "lantern", hint: "🏮 Guetter la lanterne",
        async interact() { if (!isNight()) { Game.toast("Il fait jour. Le voleur ne vient que la nuit (après 20 h)."); return; } await lines(NARR, ["Tu te caches derrière les roseaux. Les minutes passent…", "Là ! Une petite flamme bleue se faufile jusqu'à la lanterne et avale sa lumière ! Elle s'enfuit vers le nord !"]); to("fennek", 1, { w: 0 }); } },
      { id: "wisp", show: () => stage("fennek") === 1, list: WISP, draw: "wisp", hint: "🔵 Le feu follet", only: () => data("fennek").w || 0,
        async interact(q, i) { const d = data("fennek"); d.w = i + 1; Prog.changed(); Music.sfx("magic"); if (d.w < 4) Game.toast(`Il s'enfuit encore ! (${d.w}/4)`);
          else { await cut(async (S) => {
            S.bg("marsh", { blue: true }); S.music("sad"); S.camNow(500, 300, 700); S.tint("rgba(20,30,80,.35)");
            const m = S.add("me", { me: true, x: 330, y: 420, dir: "right" }); const w = S.add("w", { boss: "follet", x: 600, y: 380 });
            S.add("berceau", { draw: (c) => { c.fillStyle = "#6a4a2a"; c.beginPath(); c.ellipse(0, -14, 34, 14, 0, 0, Math.PI); c.fill(); c.fillStyle = "#8a6a4a"; c.fillRect(-34, -18, 68, 6); }, x: 620, y: 420 });
            await S.fade(0, .8);
            await S.say(NARR, "Le feu follet s'est réfugié dans un vieux berceau de jonc, au milieu des roseaux. Il tremble. Toutes les flammes volées sont entassées autour de lui.");
            await S.say({ name: "Feu follet", color: "#7ab0ff" }, "Ne me les reprends pas… S'il te plaît. J'ai froid. J'ai tellement froid.");
            await S.say({ name: "Feu follet", color: "#7ab0ff" }, "Je m'appelle Pyrrha. Je dormais dans ce berceau quand la montagne a crié, il y a longtemps. Après, je n'ai plus jamais eu chaud.");
            await S.fade(1, 1);
          }); to("fennek", 2); } } },
      { id: "cradle", show: () => stage("fennek") === 2 || stage("fennek") === 3, list: [[470, 140]], draw: "cradle", hint: "🔥 Faire un feu pour Pyrrha",
        async interact() { if (stage("fennek") === 2) { if (!have({ bois: 3, feuille: 2 })) { Game.toast(`Il faut : ${costTxt({ bois: 3, feuille: 2 })}`); return; } to("fennek", 3); }
          Prog.pay({ bois: 3, feuille: 2 }); Music.sfx("fire");
          const v = await choose({ name: "Pyrrha", color: "#7ab0ff" }, "Un vrai feu ? Pour moi ? … Oh, c'est chaud ! Dis, les flammes volées… je dois vraiment les rendre ?", [["rendre", "Oui. Les âmes en ont besoin."], ["garder", "Garde-en une. Fennek comprendra."]]);
          data("fennek").choice = v; Prog.changed();
          await say({ name: "Pyrrha", color: "#7ab0ff" }, v === "rendre" ? "D'accord. Je les rends toutes. Mais tu diras au monsieur que je suis désolée ?" : "Merci ! Juste une, toute petite. Je la garderai toujours.");
          to("fennek", 4); } },
    ],
  });

  // ================================================================ LA CARTE DU CIEL (Lili) — normale
  const STARS = [[830, 930], [300, 470], [520, 200], [1290, 600]];
  def("lili", { title: "La Carte du ciel", kind: "red", giver: "lili",
    desc: "Depuis la tempête, une constellation a disparu du ciel de Lili. Des étoiles sont tombées sur l'île.",
    stages: [
      { obj: "Retrouve les 4 étoiles tombées, la nuit (0/4)", at: () => { const d = data("lili"); const i = STARS.findIndex((_, k) => !(d.f || [])[k]); const p = STARS[Math.max(0, i)]; return { x: p[0] * K, y: p[1] * K }; } },
      { obj: "Rapporte les étoiles à Lili, en haut de la tour (la nuit)", at: at("tour") },
      { obj: "Réponds au quiz des étoiles de Lili", at: at("tour") },
    ],
    talk: {
      async lili() {
        const s = stage("lili");
        if (s < 0) {
          if (!isNight()) { await say("lili", "Reviens ce soir à la tour de guet ! Je te montrerai les étoiles. (Après 20 h)"); return true; }
          await cut(async (S) => {
            S.bg("stars", {}); S.music("night"); S.camNow(500, 300, 900);
            const l = S.add("lili", { npc: "lili", x: 520, y: 430, dir: "up" }); const m = S.add("me", { me: true, x: 420, y: 440, dir: "up" });
            await S.fade(0, 1.2);
            await S.say("lili", "Là, c'est la Couronne. Là, le Grand Crabe. Et là… normalement… il y a la Mouette.");
            await S.say("lili", "Depuis la tempête — TA tempête — la Mouette a disparu. Il manque quatre étoiles. Je les ai vues tomber sur l'île !");
            S.sfx("light"); S.add("star", { boss: "etoile", x: 300, y: 120, scale: .6 }); await S.move(S.get("star"), 900, 380, 1.4); S.remove("star");
            await S.say("lili", "Tu vois ? Encore une ! Elles brillent la nuit, là où elles sont tombées. Tu veux bien les ramasser ? Je les remettrai à leur place.");
            await S.say("lili", "Grand-père dit qu'on ne peut pas remettre une étoile au ciel. Moi je dis qu'il suffit d'essayer.");
            await S.fade(1, 1);
          });
          start("lili"); Prog.setQuest("lili", 0, { f: [] }); return true;
        }
        if (s === 1) { if (!isNight()) { await say("lili", "Ce soir, à la tour ! Les étoiles ne se remettent que la nuit."); return true; } await Q.lili.middle(); return true; }
        if (s === 2) { await Q.lili.quiz(); return true; }
        if (s === 0) { await say("lili", `Tu as trouvé ${(data("lili").f || []).filter(Boolean).length} étoile(s) sur 4. Elles brillent la nuit : sur la plage, dans la jungle, dans le marais et sur les falaises.`); return true; }
        return false;
      },
    },
    async middle() {
      await cut(async (S) => {
        S.bg("stars", {}); S.music("reveal"); S.camNow(500, 300, 900);
        const l = S.add("lili", { npc: "lili", x: 520, y: 430, dir: "up" }); const m = S.add("me", { me: true, x: 420, y: 440, dir: "up" }); const pa = S.add("pa", { partner: true, x: 360, y: 440, dir: "up" });
        await S.fade(0, 1);
        await S.say("lili", "Une… deux… trois… quatre. Hop !");
        const pts = [[380, 160], [460, 110], [540, 150], [620, 110], [500, 220], [440, 200], [560, 200]];
        for (const [x, y] of pts) { S.add("s" + x, { boss: "etoile", x, y: y + 30, scale: .35 }); S.sfx("light", .5); await S.wait(.25); }
        S.front((c, v, t) => { c.strokeStyle = "rgba(255,240,180,.7)"; c.lineWidth = 2; c.beginPath(); [[0, 4], [4, 1], [1, 5], [5, 2], [2, 6], [6, 3]].forEach(([a, b]) => { c.moveTo(pts[a][0], pts[a][1] + 20); c.lineTo(pts[b][0], pts[b][1] + 20); }); c.stroke(); });
        await S.wait(1);
        await S.say("lili", "Ce n'est pas la Mouette… Regarde la forme. Deux cœurs, l'un dans l'autre.");
        await S.say("lili", "Grand-père m'a raconté une vieille comptine lume : « Deux cœurs qui battent ensemble refermeront la Fêlure. » Je croyais que c'était pour les bébés.");
        await S.say("lili", "…Deux cœurs. Comme vous deux.");
        await S.fade(1, 1.4);
      });
      Prog.P.lore.deuxCoeurs = true; to("lili", 2);
      await say("lili", "Avant de finir la carte, je dois vérifier que tu as bien regardé le ciel ! Petit quiz !");
      await Q.lili.quiz();
    },
    async quiz() {
      const qs = [["Combien de grottes y a-t-il sur Kalua et ses îles ?", ["Cinq", "Huit", "Douze"], 1], ["Comment s'appelait le navire qui s'est échoué ?", ["La Mouette d'Argent", "La Sirène Bleue", "Le Bastien"], 0], ["Qu'est-ce qui bat sous le volcan ?", ["Un tambour lume", "Le Cœur de Kalua", "Un dragon"], 1]];
      for (const [q, o, a] of qs) { const v = await choose("lili", q, o.map((x, i) => [i, x])); if (v !== a) { await say("lili", "Hmm… non ! Regarde mieux autour de toi, et reviens me voir."); return; } }
      await cut(async (S) => {
        S.bg("stars", { aurora: true }); S.music("hope"); S.camNow(500, 300, 900);
        const l = S.add("lili", { npc: "lili", x: 520, y: 430, dir: "up" }); const m = S.add("me", { me: true, x: 420, y: 440, dir: "up" });
        await S.fade(0, 1);
        await S.say("lili", "Trois sur trois ! La carte du ciel est finie !");
        S.sfx("light"); const st = S.add("st", { boss: "etoileFilante", x: 120, y: 60, scale: .25 }); await S.move(st, 900, 260, 2); S.remove("st");
        await S.say("lili", "Une étoile filante ! Vite, un vœu !");
        await S.wait(1.2);
        await S.say("lili", "J'ai souhaité que vous restiez sur Kalua. Pour toujours. C'est égoïste ?");
        await S.fade(1, 1.4);
      });
      Prog.give("carteCiel", 1); Prog.set("carte_ciel"); finish("lili");
      await say("lili", "Avec la carte du ciel, tu pourras naviguer la nuit jusqu'à l'Îlot aux Étoiles. Il paraît que la première étoile, Kalua, est tombée là-bas !");
    },
    objects: [
      { id: "star", show: () => stage("lili") === 0 && isNight(), list: STARS, draw: "fallenStar", hint: "⭐ Étoile tombée",
        async interact(q, i) { const d = data("lili"); d.f = d.f || []; if (d.f[i]) return; d.f[i] = true; Prog.changed(); Music.sfx("light"); Music.jingle("item");
          const n = d.f.filter(Boolean).length; Game.toast(`⭐ Étoile tombée (${n}/4)`); if (n >= 4) to("lili", 1); } },
    ],
  });

  // ================================================================ L'ENQUÊTE DE LA MOUETTE D'ARGENT (Capitaine Bastien) — la quête du bateau
  const CLUES = { journal: "Le journal de bord : « 3 h — une cloche sous l'eau. Toutes les boussoles tournent. Maëlle jure qu'il n'y a pas de récif ici. »",
    carte: "La carte de Maëlle (reconstituée) : la route était sûre. Seul l'Île du Phare est entourée d'un cercle tracé à la main : « ici, l'aiguille s'affole ».",
    temoins: "Les témoins : Tim a entendu chanter une femme. Jojo a vu une lumière sur les rochers. Rosalie : Coco répète un mot, « Nalia ». Maëlle : la boussole pointait vers le Phare.",
    cloche: "Le battant de cloche trouvé par Ondine au fond du récif : il vibre encore. Il vient de sous le Phare." };
  const PARTS = { gouvernail: "Le gouvernail (dans l'épave)", voile: "La voile (Dame Rosalie la coud)", mat: "Le mât (un bambou géant de la jungle)", goudron: "Le goudron de lave (Brann)", corde: "Les cordages (2 cordes)" };
  def("bateau", { title: "L'Enquête de la Mouette d'Argent", kind: "boat", giver: "bastien", long: true,
    desc: "Pourquoi les boussoles ont-elles tourné ? Qui a mené la Mouette d'Argent sur les récifs ? Et comment repartir ? Le capitaine Bastien mène l'enquête… et construit un bateau.",
    stages: [
      { obj: "Enquête : trouve les 4 indices (journal, carte, témoins, cloche) — et construis le bateau (5 pièces)", at: () => { const d = data("bateau"); if (!d.c?.journal) return spotPos("epave"); if (!d.c?.temoins) return spotPos("camp"); if (!d.c?.carte) return spotPos("dune"); return spotPos("ponton"); } },
      { obj: "Présente tes conclusions au capitaine Bastien", at: at("ponton") },
      { obj: "La nuit, quelque chose se passe… (attends la nuit, au port)", at: at("port") },
      { obj: "Rejoins Bastien au ponton pour la première traversée", at: at("ponton") },
    ],
    talk: {
      async bastien() {
        const s = stage("bateau");
        if (s < 0) {
          await cut(async (S) => {
            S.bg("beach", { dawn: false }); S.music("quest"); S.camNow(500, 300, 820);
            const b = S.add("bastien", { npc: "bastien", x: 200, y: 400, dir: "right" }); const m = S.add("me", { me: true, x: 620, y: 420, dir: "left" });
            await S.fade(0, 1);
            await S.say("bastien", "Regarde-la. La Mouette d'Argent. Trente ans qu'elle me portait. Trente ans sans une égratignure.");
            await S.move(m, 420, 420, 1.2);
            await S.say("bastien", "Et cette nuit-là… ma boussole a tourné comme une toupie. Maëlle, ma navigatrice, a vérifié trois fois : il n'y avait PAS de récifs sur notre route.");
            await S.say("bastien", "Quelqu'un — ou quelque chose — nous a menés ici. Je veux savoir quoi. Et je veux un bateau pour ramener tout le monde chez soi.");
            const v = await S.choose("bastien", "Tu es avec moi, matelot ?", [["oui", "À vos ordres, capitaine !"], ["doute", "Et si c'était juste la tempête ?"]]);
            if (v === "doute") await S.say("bastien", "Une tempête dans un ciel sans nuage ? Avec une cloche qui sonne sous l'eau ? Non, matelot. Ça sent la magie, ou le mensonge.");
            await S.say("bastien", "Voilà le plan. Un : on enquête — mon journal de bord est resté dans l'épave, les autres rescapés ont peut-être vu des choses, la carte de Maëlle s'est déchirée. Deux : on construit un bateau.");
            await S.say("bastien", "Je te donne ce carnet. Note tout. Un bon marin ne croit que ce qu'il a vérifié.");
            await S.fade(1, 1);
          });
          start("bateau"); Prog.setQuest("bateau", 0, { c: {}, p: {}, t: {}, map: 0 }); return true;
        }
        if (s === 0) {
          const d = data("bateau"); const nc = Object.keys(d.c).length, np = Object.keys(d.p).length;
          const v = await choose("bastien", `Alors, matelot ? Indices : ${nc}/4. Pièces du bateau : ${np}/5.`, [["indices", "📔 Relire mes indices"], ["pieces", "🔨 Ce qu'il manque au bateau"], ["donner", "📦 Donner des pièces"], ["rien", "Rien, capitaine"]]);
          if (v === "indices") { const L = Object.keys(CLUES).map((k) => (d.c[k] ? "✔ " + CLUES[k] : "✘ ???")); await lines("bastien", L); }
          if (v === "pieces") await lines("bastien", Object.keys(PARTS).map((k) => (d.p[k] ? "✔ " : "✘ ") + PARTS[k]));
          if (v === "donner") await givePart();
          if (nc >= 4 && np >= 5) { await say("bastien", "Tout est là. Le bateau est presque prêt… et j'ai besoin de savoir ce que TU en conclus. Viens, on va réfléchir ensemble."); to("bateau", 1); await Q.bateau.deduction(); }
          else if (nc >= 4 && !d.toldParts) { d.toldParts = true; Prog.changed(); await say("bastien", "Les indices sont réunis. Maintenant, le bateau !"); }
          return true;
        }
        if (s === 1) { await Q.bateau.deduction(); return true; }
        if (s === 2) { await say("bastien", "Attendons la nuit. Je veux voir de mes yeux ce qui se passe sur ce Phare."); return true; }
        if (s === 3) { await Q.bateau.voyage(); return true; }
        return false;
      },
      async tim() { if (stage("bateau") !== 0 || data("bateau").t.tim) return false; return witness("tim", "Tim, qu'as-tu entendu cette nuit-là ?", [["chant", "Tu as entendu quelque chose avant le choc ?"], ["peur", "Tu avais peur ?"]], "chant", ["Une femme qui chantait. Je vous jure ! Une chanson toute douce, sous la pluie. « Lu-mé, lu-mé… »", "Le capitaine dit que j'ai rêvé. Mais Jojo aussi a vu quelque chose."]); },
      async jojo() { if (stage("bateau") !== 0 || data("bateau").t.jojo) return false; return witness("jojo", "Jojo, tu étais sur le pont ?", [["lumiere", "Tu as vu quelque chose, sur les rochers ?"], ["repas", "Il reste du ragoût ?"]], "lumiere", ["Une lumière ! Sur le grand rocher, juste avant le choc. Une silhouette toute blanche, comme une femme faite de lune.", "Et puis BAOUM. Plus de rocher, plus de lumière, plus de bateau."]); },
      async rosalie() { if (stage("bateau") !== 0 || data("bateau").t.rosalie) return false; return witness("rosalie", "Dame Rosalie, vous vous souvenez de la nuit du naufrage ?", [["coco", "Votre perroquet a-t-il dit quelque chose d'étrange ?"], ["robe", "Votre robe a survécu ?"]], "coco", ["Coco ? Il n'arrête pas de répéter un mot depuis la tempête. Un mot que je ne connais pas.", "« NALIA ! NALIA ! » Ridicule. Qui s'appelle Nalia ?"]); },
      async maelle() {
        const d = data("bateau");
        if (stage("bateau") !== 0) return false;
        if (!d.t.maelle) return witness("maelle", "Maëlle, et ta boussole ?", [["aiguille", "Vers où pointait l'aiguille ?"], ["carte", "Ta carte est perdue ?"]], "aiguille", ["Vers le nord-est. Toujours vers le nord-est. Exactement vers l'île du Phare. Comme si quelque chose l'attirait.", "Et ma carte s'est déchirée en trois morceaux dans la tempête. Si tu les retrouves, je pourrai te montrer quelque chose."]);
        if (!d.c.carte && Prog.count("carteMarine") >= 3) { Prog.take("carteMarine", 3); await lines("maelle", ["Les trois morceaux ! Voyons… Là. Tu vois ce cercle ? Je l'ai tracé la veille : l'aiguille s'affolait chaque fois qu'on approchait de l'île du Phare.", "Il y a quelque chose sous ce Phare."]); clue("carte"); return true; }
        if (!d.c.carte) { await say("maelle", `Il me manque des morceaux de carte (${Prog.count("carteMarine")}/3). Un dans les dunes, un… je crois que Pipa en a trouvé un, et un crabe géant s'en est servi de couverture !`); return true; }
        return false;
      },
      async pipa() {
        if (stage("bateau") !== 0 || data("bateau").map & 2) return false;
        await say("pipa", "Un bout de carte ? Ouais, je l'ai repêché ! Mais rien n'est gratuit chez Pipa : trois devinettes de marin !");
        const qs = [["Qu'est-ce qui a des dents mais ne mord jamais ?", ["Un peigne", "Un requin", "Un crabe"], 0], ["Plus elle sèche, plus elle est mouillée. Qu'est-ce que c'est ?", ["Une éponge", "Une serviette", "Une vague"], 1], ["Je monte et je descends deux fois par jour sans jamais bouger. Qui suis-je ?", ["La marée", "Un escalier", "Le soleil"], 0]];
        for (const [q, o, a] of qs) { const v = await choose("pipa", q, o.map((x, i) => [i, x])); if (v !== a) { await say("pipa", "Raté ! Hé hé. Reviens quand t'auras réfléchi."); return true; } }
        await say("pipa", "Trois sur trois ! T'es un vrai marin. Tiens, ton bout de carte."); data("bateau").map |= 2; Prog.give("carteMarine", 1); return true;
      },
      async ondine() {
        const d = data("bateau"); if (stage("bateau") !== 0 || d.c.cloche) return false;
        if (Object.keys(d.c).length < 2) { await say("ondine", "Une cloche sous l'eau ? Hmm. Reviens quand tu en sauras plus, et je plongerai pour toi."); return true; }
        await lines("ondine", ["Une cloche ? J'ai vu un truc briller au fond du récif, entre les coraux. Attends-moi…", "(Ondine plonge. Une minute… deux… Elle remonte, essoufflée.)", "Tiens. Un battant de cloche, gros comme mon bras. Il vibre encore. Et regarde la marque : une spirale lume. Il vient de très loin… du côté du Phare."]);
        Prog.give("cloche", 1); clue("cloche"); return true;
      },
      async rosalieVoile() { return false; },
    },
    async deduction() {
      await say("bastien", "Bien. On reprend tout depuis le début. Réponds-moi franchement, matelot.");
      const q1 = await choose("bastien", "Qu'est-ce qui a fait tourner les boussoles ?", [[0, "Un orage magnétique"], [1, "Une cloche qui sonne sous la mer"], [2, "Le Kraken"]]);
      if (q1 !== 1) { await say("bastien", "Hmm. Relis tes indices. Le journal, le battant d'Ondine…"); return; }
      const q2 = await choose("bastien", "Et d'où vient cette cloche ?", [[0, "De l'Île du Phare"], [1, "Du volcan"], [2, "De l'épave"]]);
      if (q2 !== 0) { await say("bastien", "Non… La carte de Maëlle, la boussole… Tout pointe dans une seule direction."); return; }
      const q3 = await choose("bastien", "Dernière question. Quelqu'un a sonné cette cloche. Qui ?", [[0, "Personne, elle sonne toute seule"], [1, "Une femme lumineuse que Coco appelle « Nalia »"], [2, "Les fantômes du marais"]]);
      if (q3 !== 1) { await say("bastien", "Tu y crois, toi ? Une cloche qui sonne toute seule ? Les témoins ont vu quelqu'un."); return; }
      await lines("bastien", ["Nalia. La fille aux cheveux blancs qui vous a accueillis sur la plage. Celle qui sait TOUT de cette île.", "Je ne l'accuse pas. Pas encore. Mais je veux voir ce Phare de mes yeux.", "Ce soir, on veille. Si quelqu'un sonne cette cloche, on le verra."]);
      to("bateau", 2);
    },
    async nightEvent() {
      await cut(async (S) => {
        S.bg("lighthouse", { beam: 0 }); S.music("reveal"); S.camNow(500, 300, 900); S.fx("rain", 0);
        await S.fade(0, 1);
        await S.say(NARR, "Minuit. Tout le village dort. Seuls le capitaine et toi veillez sur le ponton.");
        S.sfx("bell"); S.shake(3, 1.5); await S.wait(1.4);
        await S.say(NARR, "DONG. Une cloche, sous la mer. Si grave qu'on la sent dans la poitrine.");
        S.opt({ beam: 1 }); S.sfx("light");
        await S.say(NARR, "Sur l'île du Phare, une lumière s'allume. Puis le Phare, éteint depuis des siècles, tourne lentement.");
        S.bg("beach", { dawn: false, wreck: false }); S.tint("rgba(10,20,60,.55)"); S.camNow(500, 300, 820);
        const b = S.add("bastien", { npc: "bastien", x: 260, y: 410, dir: "right" }); const m = S.add("me", { me: true, x: 200, y: 420, dir: "right" });
        const n = S.add("nalia", { npc: "nalia", x: 640, y: 400, dir: "right", glow: "rgba(200,230,255,.6)" });
        const coco = S.add("coco", { creature: "perroquet", x: 300, y: 340 });
        await S.say({ name: "Coco", color: "#3a9a3a" }, "NALIA ! NALIA ! NALIAAA !");
        await S.say(NARR, "Au bord de l'eau, Nalia avance dans la mer, lentement, les yeux fermés, comme une somnambule. L'eau ne la mouille pas.");
        await S.move(n, 900, 380, 3);
        await S.say("bastien", "Par toutes les sirènes… Elle MARCHE sur l'eau.");
        await S.fadeActor(n, 0, 1.2);
        await S.say("bastien", "Demain, on part pour le Phare. Bateau fini ou pas.");
        await S.fade(1, 1.4);
      });
      Prog.set("nuit_cloche"); to("bateau", 3);
      await say("nalia", "(Le lendemain matin, Nalia te sourit comme si de rien n'était.) Bien dormi ? Moi, j'ai fait un drôle de rêve… Je marchais sur la mer.");
    },
    async voyage() {
      const ok0 = await choose("bastien", "Le bateau est à l'eau. Maëlle à la carte, moi à la barre. On part pour le Phare ?", [["go", "⛵ Larguez les amarres !"], ["wait", "Pas encore."]]);
      if (ok0 !== "go") return;
      await cut(async (S) => {
        S.bg("sea", { boat: { x: 400 }, island: "#8a8a90", ix: 860, tower: true, beam: .4 }); S.music("sea"); S.camNow(500, 300, 900);
        await S.fade(0, 1);
        await S.say("bastien", "Ha ! Sentez-moi ce vent ! Le Bastien… euh, le bateau, file comme une mouette !");
        await S.say("maelle", "Capitaine, l'aiguille recommence à tourner.");
        S.sfx("bell"); S.shake(5, 1); S.music("bossB2");
        await S.say(NARR, "La mer bouillonne. Des tentacules violets jaillissent tout autour du bateau !");
        await S.fade(1, .5);
      });
      const ok = await fight("B2", { bg: "sea", bgOpt: { boat: { x: 300 } }, intro: "Le Petit Kraken attaque le bateau !", noFlee: true });
      if (!ok) { Game.toast("Le bateau fait demi-tour, à moitié inondé. Il faudra réessayer."); Prog.P.hp = Prog.P.maxHp; return; }
      Prog.P.bosses.B2 = true; Prog.give("encre", 1);
      await cut(async (S) => {
        S.bg("sea", { boat: { x: 420 }, island: "#8a8a90", ix: 880, tower: true }); S.music("sad", .8); S.camNow(500, 300, 820);
        await S.fade(0, .6);
        await S.say(NARR, "Le Petit Kraken recule, terrifié… mais un dernier tentacule s'est enroulé autour de la coque. Le bateau penche. L'eau entre.");
        const b = S.add("bastien", { npc: "bastien", x: 400, y: 330, dir: "right" });
        await S.say("bastien", "Maëlle, la barre ! Toi, tiens bon ! Je m'occupe de ce calamar !");
        await S.move(b, 520, 360, .5); S.sfx("hit"); S.shake(6, .5);
        await S.say(NARR, "Le capitaine tranche le tentacule d'un coup de hache. Le bateau se redresse d'un coup… et Bastien bascule par-dessus bord, emporté par le Kraken qui s'enfuit.");
        S.sfx("splash"); await S.move(b, 600, 460, .6); await S.fadeActor(b, 0, .4);
        await S.say("maelle", "CAPITAINE !");
        await S.wait(1.5);
        S.add("hat", { draw: (c) => { c.fillStyle = "#2a2a3a"; c.beginPath(); c.ellipse(0, -6, 20, 6, 0, 0, Math.PI * 2); c.fill(); c.beginPath(); c.ellipse(0, -12, 11, 8, 0, Math.PI, 0); c.fill(); }, x: 620, y: 360 });
        await S.say(NARR, "Rien. Seulement son chapeau, qui danse sur l'eau.");
        S.bg("lighthouse", { beam: 0 }); S.camNow(500, 300, 820); S.remove("hat"); S.music("reveal");
        const n = S.add("nalia", { npc: "nalia", x: 640, y: 420, dir: "left" }); const m = S.add("me", { me: true, x: 360, y: 420, dir: "right" }); const pa = S.add("pa", { partner: true, x: 300, y: 425, dir: "right" });
        await S.say(NARR, "Sur l'île du Phare, au pied de la tour, quelqu'un vous attend.");
        await S.say("nalia", "…Je suis désolée. Pour le capitaine. Pour tout.");
        await S.say("nalia", "C'est moi. C'est moi qui ai sonné la Cloche des Profondeurs. C'est moi qui ai mené la Mouette d'Argent sur les récifs.");
        const v = await S.choose("nalia", "Je vous ai vus sur le pont, cette nuit-là. Vous vous teniez la main. J'ai su tout de suite.", [["pourquoi", "Pourquoi ?!"], ["colere", "Bastien est mort à cause de toi."]]);
        if (v === "colere") await S.say("nalia", "Oui. Et Kéo, peut-être, et d'autres avant lui. Je porte chaque nom. Je mérite ta colère.");
        await S.say("nalia", "Le Cœur de Kalua est fêlé. Seuls deux cœurs qui battent ensemble peuvent le refermer. Je cherche ces deux cœurs depuis sept cents ans.");
        await S.say("nalia", "Je ne vous demande pas de me pardonner. Je vous demande de finir ce que d'autres n'ont pas pu finir. Après… je vous dirai tout. Je vous le promets.");
        await S.fade(1, 2);
      });
      Prog.kill("bastien"); Prog.set("bastien_dead"); Prog.set("bateau_ok"); Prog.set("nalia_aveu"); Prog.set("coco"); Prog.P.lore.cloche = true;
      finish("bateau");
      await lines("maelle", ["(De retour au port.) Le bateau s'appelle « Le Bastien », maintenant. C'est moi qui tiens la barre.", "Quand tu veux aller sur une île, viens me voir au ponton. Je t'emmène, où tu veux. Il l'aurait voulu."]);
      Game.toast("⛵ Tu peux maintenant naviguer depuis le ponton du port ! Coco le perroquet te suit.", 4000);
    },
    objects: [
      { id: "journal", show: () => stage("bateau") === 0 && !data("bateau").c.journal, list: [[812, 922]], draw: "sparkle", hint: "📔 Fouiller l'épave",
        async interact() { await lines(NARR, ["Sous une poutre, trempé mais lisible : le journal de bord du capitaine.", CLUES.journal]); Prog.give("journalBord", 1, true); clue("journal"); } },
      { id: "dune", show: () => stage("bateau") === 0 && !(data("bateau").map & 1), list: [[862, 908]], draw: "sparkle", hint: "🗺️ Quelque chose dans le sable",
        async interact() { data("bateau").map |= 1; Prog.changed(); Prog.give("carteMarine", 1); Game.toast("Un morceau de la carte de Maëlle, à moitié enterré !"); } },
      { id: "crab", show: () => stage("bateau") === 0 && !(data("bateau").map & 4), list: [[1000, 880]], draw: "sparkle", hint: "🦀 Un crabe géant… avec un papier sur le dos",
        async interact() { const ok = await fight(["crabeGeantB"], { bg: "beach", intro: "Le crabe géant protège sa « couverture » !" }); if (ok) { data("bateau").map |= 4; Prog.changed(); Prog.give("carteMarine", 1); Game.toast("Tu récupères le morceau de carte !"); } } },
      { id: "gouvernail", show: () => stage("bateau") === 0 && !data("bateau").p.gouvernail && !Prog.has("gouvernail"), list: [[805, 935]], draw: "sparkle", hint: "☸️ Le gouvernail est coincé",
        async interact() { Game.toast("Le gouvernail est coincé sous les planches. Frappe-les pour le dégager !"); },
        hit() { const d = data("bateau"); d.gv = (d.gv || 0) + 1; Prog.changed(); Music.sfx("wood"); if (d.gv >= 5) { Prog.give("gouvernail", 1); Game.toast("Le gouvernail est libre !"); } return true; } },
      { id: "bambou", show: () => stage("bateau") === 0 && !data("bateau").p.mat && !Prog.has("mat"), list: [[340, 600]], draw: "bamboo", hint: "🎋 Un bambou géant lume",
        async interact() { if (!Prog.has("hache")) { Game.toast("Ce bambou est dur comme le fer. Il faudrait une hache (Brann en forge)."); return; } Game.toast("Frappe-le avec ta hache !"); },
        hit() { if (!Prog.has("hache")) { Game.toast("Ta main rebondit. Il faut une hache !"); return true; } const d = data("bateau"); d.bb = (d.bb || 0) + 1; Prog.changed(); Music.sfx("wood"); if (d.bb >= 4) { Prog.give("mat", 1); Game.toast("Le bambou géant tombe ! Voilà un mât."); } return true; } },
      { id: "nuit", show: () => stage("bateau") === 2 && isNight(), list: [[905, 872]], draw: "sparkle", hint: "🌙 Veiller au port",
        async interact() { await Q.bateau.nightEvent(); } },
    ],
  });
  function clue(k) { const d = data("bateau"); if (d.c[k]) return; d.c[k] = true; Prog.changed(); Music.jingle("secret"); Game.toast(`🔎 Nouvel indice ! (${Object.keys(d.c).length}/4)`); }
  async function witness(id, q, opts, good, answer) {
    const v = await choose(id, q, opts);
    if (v !== good) { await say(id, { tim: "Peur ? Moi ? … Un peu. Demande-moi plutôt ce que j'ai entendu.", jojo: "Du ragoût ? Pas sans ingrédients ! Pose-moi une vraie question, enquêteur.", rosalie: "Ma robe est RUINÉE, merci de le rappeler. Autre chose ?", maelle: "Ma carte… oui. Mais ce n'est pas le plus étrange." }[id]); return true; }
    await lines(id, answer); const d = data("bateau"); d.t[id] = true; Prog.changed();
    const n = Object.keys(d.t).length; Game.toast(`🗣️ Témoins interrogés : ${n}/4`);
    if (n >= 4) { await say(NARR, "Tous les témoignages concordent : un chant, une lumière, un nom… et une aiguille qui montre le Phare."); clue("temoins"); }
    return true;
  }
  async function givePart() {
    const d = data("bateau"); let any = false;
    if (Prog.take("gouvernail", 1)) { d.p.gouvernail = true; any = true; }
    if (Prog.take("mat", 1)) { d.p.mat = true; any = true; }
    if (Prog.take("voile", 1)) { d.p.voile = true; any = true; }
    if (Prog.take("goudron", 1)) { d.p.goudron = true; any = true; }
    if (!d.p.corde && Prog.take("corde", 2)) { d.p.corde = true; any = true; }
    Prog.changed();
    await say("bastien", any ? `Parfait ! Pièces du bateau : ${Object.keys(d.p).length}/5.` : "Tu n'as aucune pièce sur toi. Le gouvernail est dans l'épave, Rosalie peut coudre une voile, Brann sait faire le goudron, il faut un bambou géant pour le mât et deux cordes.");
  }
  // Rosalie coud la voile ; Brann fait le goudron ; l'atelier fait les cordes
  Q.bateau.talk.rosalie = ((orig) => async function () {
    if (stage("bateau") === 0 && data("bateau").t.rosalie && !data("bateau").p.voile && !Prog.has("voile")) {
      const v = await choose("rosalie", "Une voile ? Je cousais les robes de la Cour, mon petit. Apporte-moi 4 feuilles de palmier et 2 laines.", [["give", "Voilà les matériaux"], ["later", "Plus tard"]]);
      if (v === "give") { if (Prog.pay({ feuille: 4, laine: 2 })) { await say("rosalie", "Un, deux, trois… Et voilà ! La plus jolie voile de l'océan. Avec un petit nœud, par élégance."); Prog.give("voile", 1); } else await say("rosalie", `Il me manque : ${costTxt({ feuille: 4, laine: 2 })}.`); }
      return true;
    }
    return orig.call(this);
  })(Q.bateau.talk.rosalie);
  Q.bateau.talk.brann = async function () {
    if (stage("bateau") !== 0 || data("bateau").p.goudron || Prog.has("goudron")) return false;
    const v = await choose("brann", "Du goudron pour une coque ? Facile. 2 soufres et 1 obsidienne, et je te fais du goudron de lave qui tiendra mille ans.", [["give", "Voilà !"], ["later", "Je reviens"]]);
    if (v === "give") { if (Prog.pay({ soufre: 2, obsidienne: 1 })) { await say("brann", "Ça sent l'œuf pourri. C'est bon signe. Voilà ton goudron."); Prog.give("goudron", 1); } else await say("brann", `Il me manque : ${costTxt({ soufre: 2, obsidienne: 1 })}.`); }
    return true;
  };
  Battle.FOES.crabeGeantB = { name: "Crabe géant", hp: 14, draw: "crabeGeant", scale: 1, moves: [{ n: "Pince", k: "hit", d: 1, w: 1 }, { n: "Carapace", k: "guard", w: .5 }] };

  // ================================================================ moteur : PNJ, marqueurs, objectifs
  async function talk(npcId) {
    for (const id of order) { const h = Q[id].talk[npcId]; if (h) { const r = await h.call(Q[id], st(id)); if (r) return true; } }
    return false;
  }
  function marker(npcId) {
    for (const id of order) { const q = Q[id]; if (q.giver === npcId && stage(id) < 0 && (!q.when || q.when())) return q.kind === "black" ? "black" : q.kind === "small" ? "talk" : "red"; }
    for (const id of order) { const q = Q[id]; if (q.giver === npcId && stage(id) >= 0 && stage(id) < 999 && (q.kind === "red" || q.kind === "boat")) return "red"; }
    return null;
  }
  function tracked() { let id = Prog.P.track; if (!id || stage(id) < 0 || stage(id) >= 999) id = order.find((k) => stage(k) >= 0 && stage(k) < 999); return id || null; }
  function objective() { const id = tracked(); if (!id) return null; const s = Q[id].stages[stage(id)]; if (!s) return null; return { id, text: s.obj, at: s.at ? s.at() : null }; }
  // objets de quête dans le monde
  function objects() {
    const out = [];
    for (const id of order) for (const o of Q[id].objects) { if (!o.show()) continue; o.list.forEach((p, i) => { if (o.only && o.only() !== i) return; out.push({ q: id, o, i, x: p[0] * K, y: p[1] * K }); }); }
    return out;
  }
  return { Q, order, def, st, stage, start, to, next, finish, data, talk, marker, objective, objects, tracked, at, mapAt, fight, say, lines, choose, cut, NARR, isNight, hour, have, costTxt };
})();
