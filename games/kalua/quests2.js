/* Les Échoués de Kalua — quêtes de magie (point noir), petites quêtes des habitants, forge, atelier, Fils de vie. */
"use strict";

(() => {
  const { def, stage, start, to, next, finish, data, mapAt, at, fight, say, lines, choose, cut, NARR, isNight, hour, have, costTxt } = Quests;
  const K = KALUA.K;
  const learn = async (spell, master) => {
    Prog.learn(spell); Music.jingle("learn"); Prog.P.spell = spell; Prog.changed(); if (typeof refreshMagic === "function") refreshMagic();
    const S = Battle.SPELLS[spell];
    await cut(async (C) => {
      C.bg("stars", { aurora: true }); C.music("reveal", .6); C.camNow(500, 300, 760); C.fx("light", 12);
      const m = C.add("me", { me: true, x: 500, y: 420, dir: "down", glow: "rgba(255,240,180,.6)" });
      await C.fade(0, .8); C.sfx("magic");
      await C.caption(`${S.icon} Chant de la ${S.name}`, "appris !", 2.4);
      await C.fade(1, .6);
    });
    await lines(master, [{ flamme: "Le Chant de la Flamme : CHANT lance une boule de feu. Elle allume les torches, brûle les ronces… et les ennemis.", racine: "Le Chant de la Racine : face au vide, il fait pousser un pont de lianes. Près des ennemis, il les immobilise.", maree: "Le Chant de la Marée : une bulle d'eau t'entoure et arrête les tirs. Près de la lave, il la refroidit un moment.", bourrasque: "Le Chant de la Bourrasque : un souffle qui pousse les blocs lourds, les ennemis, et fait tourner les ventilateurs.", lueur: "Le Chant de la Lueur : il éclaire les salles noires et montre les passages invisibles. Rechante-le pour l'éteindre.", onde: "Le Chant de l'Onde : une onde de choc qui brise les murs fissurés et étourdit tout autour de toi." }[spell], "Le bouton ✨ CHANT lance le chant choisi. Le petit bouton ⇄ change de chant. Pas d'épuisement : il faut juste attendre que le chant revienne."]);
  };

  // ================================================================ les six maîtres des chants (point noir)
  def("m_racine", { title: "Le Chant de la Racine", kind: "black", giver: "tilo",
    desc: "Maître Tilo, l'arbre qui parle, enseigne le chant des racines à qui écoute vraiment.",
    stages: [{ obj: "Trouve les 3 pousses lumes dans la jungle et touche-les (0/3)", at: () => { const L = [[280, 600], [345, 470], [460, 640]], d = data("m_racine"), i = [0, 1, 2].find((k) => !(d.p || [])[k]) ?? 0; return { x: L[i][0] * K, y: L[i][1] * K }; } }, { obj: "Retourne voir Maître Tilo", at: at("vieilArbre") }],
    talk: { async tilo() { const s = stage("m_racine");
      if (s < 0) { await lines("tilo", ["Hmmm… Une petite pousse qui marche. Il y a longtemps que personne ne m'avait parlé.", "Les Lumes chantaient aux racines. Les racines leur répondaient. Je peux t'apprendre… si tu sais écouter.", "Trois de mes pousses sont cachées dans la jungle. Elles chantent tout bas. Trouve-les et pose ta main sur elles."]); start("m_racine"); Prog.setQuest("m_racine", 0, { p: [] }); return true; }
      if (s === 1) { await lines("tilo", ["Tu les as entendues ? Alors tu es prêt(e). Écoute… et chante avec moi."]); await learn("racine", "tilo"); finish("m_racine"); return true; }
      if (s === 0) { await say("tilo", "Les pousses chantent tout bas. Cherche les petites lumières vertes près du sol."); return true; }
      return false; } },
    objects: [{ id: "pousse", show: () => stage("m_racine") === 0, list: [[280, 600], [345, 470], [460, 640]], draw: "sprout", hint: "🌱 Une pousse qui chante",
      async interact(q, i) { const d = data("m_racine"); d.p = d.p || []; if (d.p[i]) return; d.p[i] = true; Prog.changed(); Music.sfx("light"); const n = d.p.filter(Boolean).length; Game.toast(`🌱 Pousse lume (${n}/3) — elle fredonne sous ta main.`); if (n >= 3) to("m_racine", 1); } }] });

  def("m_maree", { title: "Le Chant de la Marée", kind: "black", giver: "ondine",
    desc: "Ondine la plongeuse enseigne le chant de l'eau à qui ose plonger.",
    stages: [{ obj: "Ramasse les 5 perles bleues dans les hauts-fonds du récif (0/5)", at: mapAt(700, 912) }, { obj: "Réponds à la question d'Ondine", at: at("ponton") }],
    talk: { async ondine() { const s = stage("m_maree");
      if (s < 0) { if (stage("bateau") === 0 && !Quests.data("bateau").c.cloche) return false; await lines("ondine", ["L'eau écoute ceux qui chantent juste. Tu veux apprendre ?", "Alors prouve que tu n'as pas peur de te mouiller : cinq perles bleues brillent dans les hauts-fonds, près du récif. Rapporte-les."]); start("m_maree"); Prog.setQuest("m_maree", 0, { p: [] }); return true; }
      if (s === 1) { const v = await choose("ondine", "Dernière chose. Que fait l'eau quand elle rencontre un rocher ?", [[0, "Elle le casse"], [1, "Elle le contourne… et l'use doucement"], [2, "Elle s'arrête"]]);
        if (v !== 1) { await say("ondine", "Non. Pense à la mer, et reviens."); return true; } await say("ondine", "Exactement. La Marée ne combat pas : elle protège, et elle patiente."); await learn("maree", "ondine"); finish("m_maree"); return true; }
      if (s === 0) { await say("ondine", "Cinq perles bleues, près du récif, à l'ouest de la plage."); return true; }
      return false; } },
    objects: [{ id: "perle", show: () => stage("m_maree") === 0, list: [[690, 905], [705, 915], [720, 908], [682, 918], [712, 922]], draw: "pearl", hint: "🔵 Perle bleue",
      async interact(q, i) { const d = data("m_maree"); d.p = d.p || []; if (d.p[i]) return; d.p[i] = true; Prog.changed(); Music.sfx("water"); const n = d.p.filter(Boolean).length; Game.toast(`🔵 Perle bleue (${n}/5)`); if (n >= 5) to("m_maree", 1); } }] });

  def("m_lueur", { title: "Le Chant de la Lueur", kind: "black", giver: "luciole",
    desc: "Sœur Luciole garde la lueur qui guide les âmes. Elle l'enseigne à ceux qui suivent les lucioles.",
    stages: [{ obj: "La nuit, touche les 3 lanternes dans l'ordre que montrent les lucioles", at: at("lanterne1") }, { obj: "Retourne voir Sœur Luciole", at: at("lanterne3") }],
    talk: { async luciole() { const s = stage("m_lueur");
      if (s < 0) { await lines("luciole", ["Même la plus petite lueur fait reculer la nuit.", "Ce soir, les lucioles danseront autour des trois lanternes du marais, l'une après l'autre. Touche les lanternes dans le même ordre qu'elles."]); start("m_lueur"); Prog.setQuest("m_lueur", 0, { seq: [] }); return true; }
      if (s === 1) { await say("luciole", "Tu as suivi les lucioles sans te tromper. La lueur est en toi."); await learn("lueur", "luciole"); finish("m_lueur"); return true; }
      if (s === 0) { await say("luciole", isNight() ? "Regarde les lucioles : elles volent d'abord vers une lanterne, puis une autre, puis la dernière." : "Attends la nuit, enfant. Les lucioles dorment le jour."); return true; }
      return false; } },
    objects: [{ id: "lant", show: () => stage("m_lueur") === 0 && isNight(), list: [[430, 232], [500, 246], [455, 296]], draw: "lantern", hint: "🏮 Lanterne des morts", fireflies: [2, 0, 1],
      async interact(q, i) { const d = data("m_lueur"), want = [2, 0, 1]; d.seq = d.seq || []; d.seq.push(i); Prog.changed();
        if (d.seq[d.seq.length - 1] !== want[d.seq.length - 1]) { d.seq = []; Prog.changed(); Music.sfx("trap"); Game.toast("Les lucioles s'éparpillent… Mauvais ordre. Regarde-les encore."); return; }
        Music.sfx("light"); Game.toast(`🏮 ${d.seq.length}/3`); if (d.seq.length >= 3) to("m_lueur", 1); } }] });

  def("m_bourrasque", { title: "Le Chant de la Bourrasque", kind: "black", giver: "zephyr",
    desc: "Zéphyr le meunier connaît le chant du vent. Il faut d'abord attraper ses plumes.",
    stages: [{ obj: "Attrape les 5 plumes que le vent fait tourner autour des moulins (0/5)", at: at("moulin3") }, { obj: "Retourne voir Zéphyr", at: at("moulin3") }],
    talk: { async zephyr() { const s = stage("m_bourrasque");
      if (s < 0) { await lines("zephyr", ["Fouuuu ! Le vent a la flemme, aujourd'hui. Moi aussi.", "Tu veux le Chant de la Bourrasque ? Attrape les cinq plumes que mes moulins ont laissé s'envoler. Elles tournent dans le vent, par là."]); start("m_bourrasque"); Prog.setQuest("m_bourrasque", 0, { p: [] }); return true; }
      if (s === 1) { await say("zephyr", "Cinq plumes ! T'as des jambes de vent, toi. Allez, souffle avec moi : FOUUUUU !"); await learn("bourrasque", "zephyr"); finish("m_bourrasque"); return true; }
      if (s === 0) { await say("zephyr", "Les plumes ! Elles tournent autour des moulins. Cours !"); return true; }
      return false; } },
    objects: [{ id: "plumeV", show: () => stage("m_bourrasque") === 0, list: [[1270, 470], [1300, 455], [1310, 495], [1275, 500], [1255, 485]], draw: "feather", hint: "🪶 Plume dans le vent", moving: true,
      async interact(q, i) { const d = data("m_bourrasque"); d.p = d.p || []; if (d.p[i]) return; d.p[i] = true; Prog.changed(); Music.sfx("wind"); const n = d.p.filter(Boolean).length; Game.toast(`🪶 Plume (${n}/5)`); if (n >= 5) to("m_bourrasque", 1); } }] });

  def("m_flamme", { title: "Le Chant de la Flamme", kind: "black", giver: "vulcain",
    desc: "Vulcain, le vieux souffleur du volcan, n'enseigne la Flamme qu'à ceux qui ont tenu dans le cercle de feu.",
    stages: [{ obj: "Apporte à Vulcain 1 cristal de feu et 2 soufres", at: at("campV") }, { obj: "Tiens 20 secondes dans le cercle de feu, près du camp", at: mapAt(985, 330) }, { obj: "Retourne voir Vulcain", at: at("campV") }],
    talk: { async vulcain() { const s = stage("m_flamme");
      if (s < 0) { await lines("vulcain", ["Fffff… Une flamme, c'est un souffle qui a de l'ambition.", "Apporte-moi un cristal de feu (les golems de lave en gardent) et deux soufres (près des geysers). Ensuite, on verra si tu tiens la chaleur."]); start("m_flamme"); return true; }
      if (s === 0) { if (Prog.pay({ cristalFeu: 1, soufre: 2 })) { await lines("vulcain", ["Bien, bien. Maintenant, l'épreuve : entre dans le cercle de feu, là, à côté. Tiens vingt secondes sans te faire brûler.", "Esquive, petit(e) ! Le feu prévient toujours avant de mordre."]); to("m_flamme", 1); } else await say("vulcain", `Il me manque : ${costTxt({ cristalFeu: 1, soufre: 2 })}.`); return true; }
      if (s === 2) { await say("vulcain", "Ha ! Tu sens encore le roussi, mais tu tiens debout. Voilà ta flamme."); await learn("flamme", "vulcain"); finish("m_flamme"); return true; }
      if (s === 1) { await say("vulcain", "Le cercle de feu, là. Entre dedans quand tu es prêt(e)."); return true; }
      return false; } },
    objects: [{ id: "cercle", show: () => stage("m_flamme") === 1, list: [[985, 330]], draw: "firering", hint: "🔥 Entrer dans le cercle de feu",
      async interact() { const p = Game.player; const cx = p.x, cy = p.y; Game.toast("Tiens bon 20 secondes ! Esquive les zones rouges !", 2500);
        let hits0 = Prog.P.hp, t = 0; const iv = setInterval(() => { t++; for (let k = 0; k < 3; k++) Act.zone({ shape: "circle", x: cx + (Math.random() - .5) * 360, y: cy + (Math.random() - .5) * 220, r: 50, delay: .9, dur: .25, dmg: 1, col: "255,110,40" });
          if (Math.random() < .5) Act.zone({ shape: "circle", x: Game.player.x, y: Game.player.y, r: 46, delay: 1, dur: .2, dmg: 1, col: "255,110,40" });
          if (t >= 20) { clearInterval(iv); if (Prog.P.hp > 0) { Music.jingle("victory"); Game.toast("Tu as tenu ! Retourne voir Vulcain."); to("m_flamme", 2); } } }, 1000); } }] });

  def("m_onde", { title: "Le Chant de l'Onde", kind: "black", giver: "grumo",
    desc: "Grumo, le golem gris des ruines, a perdu son cœur de pierre. Il apprend l'Onde à qui le lui rend.",
    stages: [{ obj: "Frappe les rochers fissurés des ruines pour trouver le cœur de Grumo (0/3)", at: mapAt(1100, 700) }, { obj: "Rends son cœur à Grumo", at: at("ruinesF") }],
    talk: { async grumo() { const s = stage("m_onde");
      if (s < 0) { await lines("grumo", ["GRUMO… CHERCHE… CŒUR.", "CŒUR… TOMBÉ… DANS ROCHERS. GRUMO… TROP GROS… POUR CHERCHER.", "TOI… PETIT. TOI… TAPER ROCHERS. S'IL TE PLAÎT."]); start("m_onde"); Prog.setQuest("m_onde", 0, { r: [] }); return true; }
      if (s === 1) { await lines("grumo", ["CŒUR ! GRUMO… CONTENT ! GRUMO… FAIT… BOUM !", "TOI AUSSI. FAIRE BOUM. ÉCOUTE…"]); await learn("onde", "grumo"); finish("m_onde"); return true; }
      if (s === 0) { await say("grumo", "ROCHERS… FISSURÉS. TAPER. TAPER FORT."); return true; }
      return false; } },
    objects: [{ id: "rocF", show: () => stage("m_onde") === 0, list: [[1095, 690], [1118, 712], [1085, 715]], draw: "crackrock", hint: "🪨 Rocher fissuré (Taper)",
      async interact() { Game.toast("Un rocher fissuré. Frappe-le !"); },
      hit(q, i) { const d = data("m_onde"); d.r = d.r || []; d.h = d.h || {}; d.h[i] = (d.h[i] || 0) + 1; Prog.changed(); Music.sfx("rock");
        if (d.h[i] >= 3 && !d.r[i]) { d.r[i] = true; const n = d.r.filter(Boolean).length; if (n >= 3) { Game.toast("💎 Le cœur de pierre de Grumo ! Il bat doucement."); to("m_onde", 1); } else Game.toast(`Le rocher éclate… rien. (${n}/3)`); } return true; } }] });

  // ================================================================ petites quêtes des habitants
  def("tim", { title: "L'harmonica de Tim", kind: "small", giver: "tim", desc: "Tim a perdu l'harmonica de son père dans le naufrage.",
    stages: [{ obj: "Cherche l'harmonica de Tim sur la plage (là où le sable brille)", at: mapAt(770, 912) }, { obj: "Rends l'harmonica à Tim", at: at("camp") }],
    talk: { async tim() { const s = stage("tim");
      if (s < 0) { await lines("tim", ["C'était l'harmonica de mon papa. Il était marin aussi. Il est parti en mer et… il est pas revenu.", "Je l'ai perdu quand la vague m'a jeté sur la plage. Tu veux bien chercher ? Il est rouge, en fer."]); start("tim"); return true; }
      if (s === 1 && Prog.take("harmonica", 1)) { await lines("tim", ["MON HARMONICA ! Tu l'as trouvé !", "(Tim joue quelques notes. C'est faux, très faux. Mais il sourit jusqu'aux oreilles.)", "Tiens, c'est pour toi. J'ai trouvé ça dans le sable aussi. Ça brille, c'est forcément précieux."]); Prog.give("perle", 2); Music.jingle("quest"); finish("tim"); return true; }
      return false; } },
    objects: [{ id: "harmo", show: () => stage("tim") === 0, list: [[770, 912]], draw: "sparkle", hint: "✨ Le sable brille", async interact() { Prog.give("harmonica", 1); Game.toast("Un harmonica rouge, plein de sable !"); to("tim", 1); } }] });

  def("jojo", { title: "Le ragoût de Jojo", kind: "small", giver: "jojo", desc: "Jojo veut refaire le fameux ragoût de la Mouette d'Argent.",
    stages: [{ obj: "Apporte à Jojo : 1 poisson, 1 noix de coco, 1 banane, 1 champignon", at: at("campFeu") }],
    talk: { async jojo() { const s = stage("jojo");
      if (s < 0) { await lines("jojo", ["Il me manque juste… UN ingrédient. Non, quatre. Bon, tous.", "Le ragoût de la Mouette ! Poisson, coco, banane, champignon. Le capitaine en mangeait trois bols. Apporte-moi tout ça et je t'en fais pour la route !"]); start("jojo"); return true; }
      if (s === 0) { if (Prog.pay({ poisson: 1, coco: 1, banane: 1, champignon: 1 })) { await lines("jojo", ["Hop, hop, hop… et une pincée de sel marin… VOILÀ !", "Deux bols de ragoût. Un pour toi, un pour ton amoureux… euh, ton coéquipier. Ça remet sur pied, tu verras.", "Et maintenant que j'ai les ingrédients, je peux t'en refaire quand tu veux. Ramène-moi les mêmes choses."]); Prog.give("ragout", 2); finish("jojo"); Prog.set("recette_ragout"); }
        else await say("jojo", `Il me manque : ${costTxt({ poisson: 1, coco: 1, banane: 1, champignon: 1 })}. Le poisson, Pipa en pêche au ponton.`); return true; }
      if (s >= 999 && Prog.flag("recette_ragout")) { const v = await choose("jojo", "Un ragoût ? (poisson, coco, banane, champignon)", [["oui", "Oui, chef !"], ["non", "Pas maintenant"]]); if (v === "oui") { if (Prog.pay({ poisson: 1, coco: 1, banane: 1, champignon: 1 })) { Prog.give("ragout", 1); await say("jojo", "Chaud devant !"); } else await say("jojo", "Il manque des ingrédients, mon grand."); } return true; }
      return false; } } });

  def("rosalie", { title: "Un parasol pour Madame", kind: "small", giver: "rosalie", desc: "Dame Rosalie souffre du soleil des tropiques.",
    stages: [{ obj: "Apporte à Dame Rosalie 3 feuilles de palmier et 1 bambou", at: at("tente2") }],
    talk: { async rosalie() { const s = stage("rosalie");
      if (s < 0) { if (stage("bateau") === 0 && !Quests.data("bateau").t.rosalie) return false; await lines("rosalie", ["Quel soleil ! Ma peau, ma pauvre peau ! Je vais finir comme un pruneau.", "Un parasol. Il me faut un parasol. Trois feuilles de palmier et un bambou, et je fais le reste. J'ai cousu pour la Cour, vous savez."]); start("rosalie"); return true; }
      if (s === 0) { if (Prog.pay({ feuille: 3, bambou: 1 })) { await lines("rosalie", ["Oh ! Un parasol ! Avec ça, je suis la femme la plus élégante de l'île.", "Tenez, mon petit. Une perle de mon collier. Pour la peine. Et… merci, sincèrement."]); Prog.give("perle", 1); finish("rosalie"); } else await say("rosalie", `Il me manque : ${costTxt({ feuille: 3, bambou: 1 })}.`); return true; }
      return false; } } });

  const NOUK = [[520, 205], [440, 300], [560, 150]];
  def("nouk", { title: "Cache-cache dans les roseaux", kind: "small", giver: "nouk", desc: "Nouk veut jouer à cache-cache. Il triche un peu.",
    stages: [{ obj: "Trouve Nouk caché dans le marais (manche 1/3)", at: () => ({ x: NOUK[data("nouk").r || 0][0] * K, y: NOUK[data("nouk").r || 0][1] * K }) }],
    talk: { async nouk() { const s = stage("nouk");
      if (s < 0) { await say("nouk", "Cache-cache ? Cache-cache ! Ferme les yeux, compte jusqu'à dix, et trouve-moi ! Trois fois !"); start("nouk"); Prog.setQuest("nouk", 0, { r: 0 }); NPC.setOverride("nouk", { x: NOUK[0][0] * K, y: NOUK[0][1] * K, act: "idle", dir: "down" }); return true; }
      if (s === 0) { const d = data("nouk"); d.r = (d.r || 0) + 1; Prog.changed();
        if (d.r >= 3) { NPC.setOverride("nouk", null); await say("nouk", "T'es trop fort(e) ! Tiens, mon trésor : un lotus ! Je l'ai trouvé tout seul !"); Prog.give("lotus", 1); finish("nouk"); }
        else { await say("nouk", `Trouvé ! Encore une ! (${d.r}/3) Ferme les yeux…`); NPC.setOverride("nouk", { x: NOUK[d.r][0] * K, y: NOUK[d.r][1] * K, act: "idle", dir: "down" }); }
        return true; }
      return false; } } });

  const SHEEP = [[1340, 560], [1150, 640], [1265, 410]];
  def("bodo", { title: "Les moutons égarés", kind: "small", giver: "bodo", desc: "Il manque trois moutons au troupeau de Bodo.",
    stages: [{ obj: "Retrouve les 3 moutons égarés de Bodo (0/3)", at: () => { const d = data("bodo"), i = [0, 1, 2].find((k) => !(d.m || [])[k]) ?? 0; return { x: SHEEP[i][0] * K, y: SHEEP[i][1] * K }; } }, { obj: "Retourne voir Bodo", at: at("paturage") }],
    talk: { async bodo() { const s = stage("bodo");
      if (s < 0) { await lines("bodo", ["… huit, neuf… il en manque encore trois !", "Depuis que l'orage gronde là-haut, mes moutons s'enfuient. Si tu les vois, ramène-les-moi. Ils ont une clochette."]); start("bodo"); Prog.setQuest("bodo", 0, { m: [] }); return true; }
      if (s === 1) { await say("bodo", "Douze ! Le compte est bon ! Tiens, de la laine, la plus douce."); Prog.give("laine", 3); finish("bodo"); return true; }
      return false; } },
    objects: [{ id: "sheep", show: () => stage("bodo") === 0, list: SHEEP, draw: "sheep", hint: "🐑 Un mouton égaré",
      async interact(q, i) { const d = data("bodo"); d.m = d.m || []; if (d.m[i]) return; d.m[i] = true; Prog.changed(); Music.sfx("pickup"); const n = d.m.filter(Boolean).length; Game.toast(`🐑 « Bêêê ! » Le mouton file vers le pâturage. (${n}/3)`); if (n >= 3) to("bodo", 1); } }] });

  const SHELLS = [[640, 930], [990, 905], [1450, 860]];
  def("tobi", { title: "La collection de Tobi", kind: "small", giver: "tobi", desc: "Tobi cherche les trois coquillages les plus rares de l'archipel.",
    stages: [{ obj: "Trouve 3 coquillages rares (un se trouve sur l'Île aux Tortues)", at: () => { const d = data("tobi"), i = [0, 1, 2].find((k) => !(d.c || [])[k]) ?? 0; return { x: SHELLS[i][0] * K, y: SHELLS[i][1] * K }; } }],
    talk: { async tobi() { const s = stage("tobi");
      if (s < 0) { await lines("tobi", ["Celui-ci ? Banal. Celui-là ? BANAL. Tout est banal sur cette plage !", "Il existe trois coquillages rares dans l'archipel : la Conque rose, l'Œil de sirène et la Spirale des Tortues. Trouve-les et je te donnerai mon plus beau trésor."]); start("tobi"); Prog.setQuest("tobi", 0, { c: [] }); return true; }
      if (s === 0) { if (Prog.count("coqRare") >= 3) { Prog.take("coqRare", 3); await lines("tobi", ["Les trois ! Ma collection est COMPLÈTE ! Je peux mourir heureux. Enfin, pas tout de suite.", "Voici mon trésor : la Conque d'appel. On dit qu'en soufflant dedans, on peut parler à quelqu'un très loin. Moi, ça ne marche jamais. Essaie, toi."]); if (!Prog.has("conque")) Prog.give("conque", 1); else Prog.give("perle", 3); finish("tobi"); } else await say("tobi", `Tu en as ${Prog.count("coqRare")} sur 3.`); return true; }
      return false; } },
    objects: [{ id: "coq", show: () => stage("tobi") === 0, list: SHELLS, draw: "sparkle", hint: "🐚 Un coquillage étrange",
      async interact(q, i) { const d = data("tobi"); d.c = d.c || []; if (d.c[i]) return; d.c[i] = true; Prog.changed(); Prog.give("coqRare", 1); } }] });

  def("arnaud", { title: "La lettre d'Arnaud", kind: "small", giver: "arnaud", desc: "Un fantôme erre la nuit dans le cimetière des Échoués.",
    stages: [{ obj: "Trouve la lettre d'Arnaud dans le cimetière de la jungle", at: mapAt(318, 662) }, { obj: "Lis la lettre à Arnaud, la nuit", at: at("cimetiere") }],
    talk: { async arnaud() { const s = stage("arnaud");
      if (s < 0) { await lines("arnaud", ["Louise… attends-moi…", "Oh. Vous me voyez ? Vous êtes… deux. Comme nous. Louise et moi, nous sommes arrivés ici il y a quatre-vingts ans. Une cloche, une tempête, un naufrage.", "Une femme aux cheveux blancs nous a dit que nous étions « les deux cœurs ». Louise est descendue au Cœur du volcan. Je n'ai pas eu le courage de la suivre.", "J'ai écrit une lettre pour elle. Je l'ai perdue. Elle est quelque part dans le cimetière."]); start("arnaud"); return true; }
      if (s === 1) { if (!isNight()) { Game.toast("Arnaud n'apparaît que la nuit."); return true; } Prog.take("lettreArnaud", 1);
        await cut(async (S) => { S.bg("jungle", { graves: true }); S.music("sad"); S.camNow(500, 300, 760); S.tint("rgba(20,30,80,.4)"); S.fx("fireflies", 3);
          const a = S.add("arnaud", { npc: "arnaud", x: 560, y: 410, dir: "left", alpha: .6, glow: "rgba(180,210,255,.5)" }); const m = S.add("me", { me: true, x: 400, y: 420, dir: "right" });
          await S.fade(0, 1);
          await S.say(NARR, "Tu lis la lettre à voix haute : « Louise, si tu lis ceci, c'est que tu as été plus brave que moi. Je n'ai pas descendu les marches. Je t'ai laissée seule devant le Cœur. »");
          await S.say(NARR, "« Si un jour deux autres viennent, je leur dirai : n'y allez pas l'un sans l'autre. Jamais. C'est ensemble, ou rien. »");
          await S.say("arnaud", "… Ensemble, ou rien. Je l'ai écrit, et je ne l'ai pas fait.");
          const l = S.add("louise", { av: Object.assign({}, Avatar.DEFAULT, { hair: "chignon", hairColor: "#d0d8f0", top: "robe", topColor: "#d0d8f0", skin: "#e8eef8", aura: "#cfe0ff" }), x: 760, y: 400, alpha: 0, glow: "rgba(200,220,255,.6)" });
          await S.fadeActor(l, .7, 2); await S.move(l, 620, 410, 2);
          await S.say({ name: "Louise", color: "#7a9ad0" }, "Arnaud. Tu en as mis, du temps.");
          await S.say("arnaud", "Tu m'attendais ?");
          await S.say({ name: "Louise", color: "#7a9ad0" }, "Évidemment, idiot. On part ensemble, cette fois ?");
          await Promise.all([S.fadeActor(a, 0, 3), S.fadeActor(l, 0, 3), S.move(a, 600, 200, 3), S.move(l, 640, 200, 3)]);
          await S.say(NARR, "Les deux silhouettes s'élèvent ensemble au-dessus des tombes.");
          await S.fade(1, 1.5); });
        Prog.P.lore.arnaud = true; Prog.kill("arnaud"); finish("arnaud"); return true; }
      return false; } },
    objects: [{ id: "lettre", show: () => stage("arnaud") === 0, list: [[318, 662]], draw: "sparkle", hint: "✉️ Une lettre sous une pierre", async interact() { Prog.give("lettreArnaud", 1); to("arnaud", 1); } }] });

  // ---- Nana : le grand quiz de Kalua
  def("nana", { title: "Le grand quiz de Nana", kind: "small", giver: "nana", desc: "Nana pose des questions sur l'île. Cinq bonnes réponses d'affilée, et c'est gagné.",
    stages: [{ obj: "Réponds aux 5 questions de Nana", at: at("villageEst") }],
    talk: { async nana() { const s = stage("nana");
      if (s < 0) { await say("nana", "Une question, une seule ! Bon, cinq. Si tu réponds juste aux cinq, tu gagnes un SUPER prix !"); start("nana"); }
      if (stage("nana") === 0) {
        const all = [["Où vit Mère Tikka ?", ["Au Marais des Brumes", "Au volcan", "Sur la plage"], 0], ["Qui garde le Temple de la jungle ?", ["Kéo", "Brann", "Pipa"], 0], ["Combien de pierres levées sur les falaises ?", ["Cinq", "Sept", "Douze"], 1], ["Que donne un mouton qu'on caresse ?", ["Rien, il est content", "Du lait", "Des œufs"], 0], ["Qui enseigne le Chant de la Flamme ?", ["Zéphyr", "Vulcain", "Ondine"], 1], ["Quel animal suit le joueur partout ?", ["Le chien", "Le chat", "Les deux"], 2], ["Où se trouve l'épave ?", ["Sur la Côte Dorée", "Dans le marais", "Au sommet du volcan"], 0]];
        const pick = all.sort(() => Math.random() - .5).slice(0, 5);
        for (const [q, o, a] of pick) { const v = await choose("nana", q, o.map((x, i) => [i, x])); if (v !== a) { await say("nana", "BZZZ ! Raté ! Reviens quand tu veux pour retenter !"); return true; } }
        await say("nana", "CINQ SUR CINQ ! Tu es le nouveau champion de Kalua ! Voici ton super prix : trois potions de soin !"); Prog.give("potion", 3); finish("nana"); return true;
      }
      return false; } } });

  // ---- Pipa : les devinettes du Roi Crabe
  def("pipa", { title: "Le rocher du Roi Crabe", kind: "small", giver: "pipa", desc: "Pipa connaît un rocher où dort un crabe couronné… mais il n'apparaît qu'à marée basse.",
    stages: [{ obj: "Va au rocher du Roi Crabe en bateau (Maëlle, au ponton du port)", at: mapAt(905, 936) }],
    when: () => Prog.flag("intro_done"),
    talk: { async pipa() { const s = stage("pipa");
      if (s < 0) { await lines("pipa", ["Psst ! Tu sais garder un secret ? Sur un rocher au large, il y a un crabe ÉNORME avec une couronne.", "Mon grand-père disait que c'était le roi d'un royaume de corail mort. On ne peut y aller qu'en bateau. Moi, j'ose pas."]); start("pipa"); return true; }
      if (s >= 999 && !Prog.has("canne")) { await say("pipa", "Tu as battu le Roi Crabe ?! Tiens, ma vieille canne à pêche. Tu la mérites."); Prog.give("canne", 1); return true; }
      return false; } },
        async onBoss() { finish("pipa"); await say("pipa", "(De loin, Pipa saute de joie sur la plage.) IL L'A FAIT ! IL L'A FAIT !"); } });

  // ---- Brann : la forge
  const FORGE = [
    ["hache", { pierre: 2, bois: 2, liane: 1 }, "Une hache en pierre. Coupe vite, et tranche les bambous géants."],
    ["pioche", { pierre: 3, bois: 2, fer: 1 }, "Une pioche. Pour le fer, l'obsidienne… et les murs têtus."],
    ["epeeCorail", { coquillage: 6, perle: 1, fer: 2 }, "L'épée de corail. Deux fois plus forte que tes poings."],
    ["lameObsidienne", { obsidienne: 5, fer: 3, ecailleDragon: 1 }, "La lame d'obsidienne. La meilleure arme de Kalua. Il faut une écaille de dragon pour la tremper."],
  ];
  def("brann", { title: "La forge de Brann", kind: "small", giver: "brann", desc: "Brann forge des outils et des armes, si on lui apporte les matériaux.", stages: [{ obj: "Parle à Brann pour forger", at: at("forge") }],
    talk: { async brann() {
      if (stage("brann") < 0) { await lines("brann", ["Encore un Échoué. Bienvenue au club. Moi, ça fait quarante ans.", "Je suis forgeron. Apporte-moi des matériaux, je te forge ce que tu veux. Haches, pioches, épées. Pas de bijoux, je suis pas Rosalie."]); start("brann"); }
      const opts = FORGE.filter(([id]) => !Prog.has(id)).map(([id, cost]) => [id, `${ITEMS.get(id)[3]} ${ITEMS.name(id)}`, costTxt(cost)]);
      const v = await choose("brann", "Qu'est-ce que je te forge ?", opts.map(([id, l, c]) => [id, `${l} — ${c}`]).concat([["rien", "Rien pour l'instant"]]));
      if (v === "rien") return true;
      const f = FORGE.find(([id]) => id === v); if (Prog.pay(f[1])) { Music.sfx("rock"); await say("brann", `CLANG ! CLANG ! … Voilà. ${f[2]}`); Prog.give(v, 1); } else await say("brann", `Il me manque : ${costTxt(f[1])}.`);
      return true; } } });

  // ---- l'atelier (au village) : cordes, torches, potions…
  const CRAFT = [["corde", { liane: 3 }, 1], ["fil", { roseau: 2 }, 1], ["torche", { bois: 1, feuille: 1, soufre: 1 }, 1], ["potion", { herbe: 2, lotus: 1 }, 1], ["brochette", { viande: 1, bois: 1 }, 1], ["the", { lotus: 1, herbe: 1 }, 1], ["collier", { coquillage: 4, fil: 1 }, 1]];
  Quests.craft = async () => {
    const v = await choose({ name: "Établi du village", icon: "atelier" }, "Que veux-tu fabriquer ?", CRAFT.map(([id, cost]) => [id, `${ITEMS.get(id)[3]} ${ITEMS.name(id)} — ${costTxt(cost)}`]).concat([["rien", "Rien"]]));
    if (v === "rien") return;
    const c = CRAFT.find(([id]) => id === v); if (Prog.pay(c[1])) { Prog.give(v, c[2]); Music.sfx("wood"); } else Game.toast(`Il manque : ${costTxt(c[1])}`);
  };

  // ================================================================ les Fils de vie (Mère Tikka) — augmentation définitive de la vie
  const FILS = [
    { plume: 2, cuir: 1 }, { carapace: 2, plumeMouette: 1 }, { laine: 2, corne: 1 }, { ecaille: 2, defense: 1 },
    { ecailleCroco: 2, gelee: 2 }, { plumeAigle: 1, corne: 2, cuir: 1 }, { carapace: 2, ecaille: 2, laine: 1 }, { larmeDoree: 1, plume: 1, plumeAigle: 1 },
  ];
  const FILS_TXT = ["un fil de forêt", "un fil d'écume", "un fil de vent", "un fil de braise", "un fil de brume", "un fil de ciel", "un fil de pierre", "le fil d'or"];
  Quests.FILS = FILS;
  Quests.fils = async () => {
    const n = Prog.P.fils;
    if (n >= FILS.length) { await say("tikka", "Tu portes les huit Fils de vie. Ton cœur est aussi solide qu'une racine de mille ans. Je n'ai plus rien à tisser."); return; }
    const cost = FILS[n];
    if (!Prog.flag("fils_intro")) { Prog.set("fils_intro"); await lines("tikka", ["Chaque bête de Kalua garde un peu de Souffle dans ses plumes, sa laine, ses écailles.", "Avec ce Souffle, je tisse des Fils de vie. Chaque fil, je le noue autour de ton cœur : il bat plus fort, pour toujours.", "Il y a huit fils. Chacun demande des bêtes différentes, d'endroits différents. Le dernier demande une Larme dorée : seuls les animaux dorés en pleurent. Caresse-les, ne les chasse pas."]); }
    const v = await choose("tikka", `Fil n°${n + 1} — ${FILS_TXT[n]}. Il me faut : ${costTxt(cost)}.`, [["tisser", "🧵 Tisse-le !"], ["non", "Plus tard"]]);
    if (v !== "tisser") return;
    if (!Prog.pay(cost)) { await say("tikka", "Il manque des choses, petit(e). Je sens que ta besace est trop légère."); return; }
    Prog.P.fils++; Prog.addMaxHp(1); Music.jingle("heart"); Music.sfx("heart");
    await say("tikka", `(Mère Tikka tisse en fredonnant, puis noue le fil autour de ton poignet. Il disparaît dans ta peau, tout chaud.) Ton cœur bat plus fort. Tu as maintenant ${Prog.P.maxHp} cœurs.`);
  };
  Quests.Q.tikka.talk.tikka = ((orig) => async function () {
    const r = await orig.call(this); if (r) return true;
    const v = await choose("tikka", "Que veux-tu, petit(e) ?", [["fils", "🧵 Les Fils de vie"], ["the", "🍵 Un thé de lotus (1 lotus + 1 herbe)"], ["rien", "Juste te dire bonjour"]]);
    if (v === "fils") await Quests.fils();
    else if (v === "the") { if (Prog.pay({ lotus: 1, herbe: 1 })) { Prog.give("the", 1); await say("tikka", "Bois-le chaud."); } else await say("tikka", "Il faut un lotus et une herbe."); }
    else await say("tikka", Prog.flag("marais_clair") ? "Bonjour à toi. Depuis que Mila est partie, je dors bien. C'est étrange, le calme." : "Bonjour, bonjour. La brume chante fort, aujourd'hui.");
    return true;
  })(Quests.Q.tikka.talk.tikka);
})();
