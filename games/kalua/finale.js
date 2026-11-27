/* Les Échoués de Kalua — finitions de la version 1.0 :
 *  · les trois créatures secrètes des îles (Tortue Ancienne à l'aube, Hibou-Lanterne la nuit, Renard Céleste en dernier) ;
 *  · ce que Nalia sait des nouveautés (village, fêtes, animaux, cheval, boss des îles). */
"use strict";

(() => {
  const { def, data } = Quests, TAU = Math.PI * 2;
  const hour = () => NPC.hourAt(Net.now());
  // ================================================================ les créatures secrètes
  const SECRETS = [
    { id: "tortue", at: [1405, 858], when: () => { const h = hour(); return h >= 5 && h < 10; }, bg: "beach", reward: ["carapaceAncienne", 1], gift: [["perle", 3], ["larmeDoree", 1]],
      hint: "🐢 Une très vieille tortue dort sur le sable", intro: "Une tortue grande comme une barque ouvre un œil. Il y a cinq cents ans de mer dans ce regard. Elle ne veut pas se battre… mais elle veut voir si tu es patient." },
    { id: "hibou", at: [1478, 196], when: () => { const h = hour(); return h >= 21 || h < 4; }, bg: "lighthouse", reward: ["plumeLanterne", 1], gift: [["potion", 2], ["perle", 2]],
      hint: "🦉 Deux yeux brillent en haut d'un rocher", intro: "Un hibou aux plumes lumineuses, comme une lanterne vivante. Il chantonne une berceuse… attention à ne pas t'endormir !" },
    { id: "renard", at: [150, 878], when: () => { const h = hour(); return (h >= 20 || h < 5) && Prog.P.bosses.Stortue && Prog.P.bosses.Shibou; }, bg: "stars", reward: ["queueEtoilee", 1], gift: [["larmeDoree", 2], ["cristalFeu", 2]],
      hint: "🦊 Un renard fait d'étoiles te regarde en riant", intro: "Le Renard Céleste ! On dit qu'il n'apparaît qu'à ceux qui ont déjà rencontré la Tortue et le Hibou. Il rit, et il y a trois renards. Puis cinq." },
  ];
  def("secrets", { title: "Les créatures secrètes des îles", kind: "hidden", desc: "Trois créatures légendaires vivent sur les îles du large.", stages: [],
    objects: SECRETS.map((s) => ({ id: "secret_" + s.id, show: () => Prog.flag("bateau_ok") && !Prog.P.bosses["S" + s.id] && s.when(), list: [s.at], draw: "secret_" + s.id, hint: s.hint,
      async interact() {
        const v = await Dialog.choose({ name: Battle.FOES[s.id].name, draw: (c) => { c.translate(32, 66); Bosses.draw(c, s.id, G.t, { scale: .18 }); } }, s.intro, [["go", "✨ S'approcher"], ["no", "La laisser tranquille"]]);
        if (v !== "go") return;
        const r = await Battle.start({ foes: [s.id], bg: s.bg });
        if (r !== "win") { if (r === "lose") Prog.P.hp = Math.max(1, Prog.P.hp); return; }
        Prog.P.bosses["S" + s.id] = true; Prog.give(s.reward[0], s.reward[1]); for (const [k, n] of s.gift) Prog.give(k, n); Music.jingle("secret");
        Prog.note(`Rencontre secrète : ${Battle.FOES[s.id].name}.`); const n = SECRETS.filter((x) => Prog.P.bosses["S" + x.id]).length;
        Game.toast(n >= 3 ? "🌟 Les trois créatures secrètes des îles sont rencontrées !" : `✨ Créature secrète ${n}/3`, 3200);
      } })) });
  const prevDraw = Story.drawExtra;
  Story.drawExtra = (k, c, t, o) => {
    if (prevDraw && prevDraw(k, c, t, o)) return true;
    if (!k.startsWith("secret_")) return false; const id = k.slice(7);
    c.save(); c.globalAlpha = .35 + .15 * Math.sin(t * 2); c.fillStyle = id === "hibou" ? "#ffe08a" : id === "renard" ? "#c9a3ff" : "#9ae0c0"; c.beginPath(); c.arc(0, -40, 60, 0, TAU); c.fill(); c.restore();
    c.save(); c.translate(0, -6 + Math.sin(t * 1.5) * 2); Bosses.draw(c, id, t, { scale: .5 }); c.restore();
    if (id === "renard") for (let i = 0; i < 6; i++) { c.fillStyle = "#fff6c8"; c.beginPath(); c.arc(Math.cos(t + i) * 50, -60 + Math.sin(t * 1.3 + i) * 30, 2, 0, TAU); c.fill(); }
    return true;
  };

  // ================================================================ ce que sait Nalia (question libre)
  const A = Guide.add;
  A("village", "Les commerçants du village", "commercant boutique magasin comptoir vendeur rosalie jojo marmite fil or", "Dans la journée, les commerçants se tiennent derrière leur comptoir : Rosalie au Fil d'Or, Jojo à La Marmite, Mamie Brioche à la boulangerie, Gino au glacier, Fanny au marché, Lucas au café, Ahmed à l'épicerie, Léon à la Poste, Monsieur Plume à la bibliothèque, Margot à l'auberge. Parle-leur pour entrer dans la boutique.");
  A("village", "Le maire et ses projets", "maire barnabe projet projets mairie recompense", "Barnabé, le maire, a huit projets pour le village : une maison, un potager, des décorations, une fontaine ou un kiosque, agrandir la maison, une fête, un cinéma… et un château. Chaque projet réalisé est récompensé. Va le voir à la mairie.");
  A("village", "La fête sur la place", "fete feter danse place guirlande musique feu artifice", "À la mairie, on peut organiser une fête sur la place : guirlandes, lampions, ballons, une scène, un gâteau géant, et le soir un feu d'artifice. Les habitants viennent danser.");
  A("village", "Le marché de Noël", "noel decembre marche sapin pere kalua cadeau neige chalet", "En décembre, le village se transforme tout seul : chalets, grand sapin, neige, et le soir les habitants se retrouvent sur la place. Le Père Kalua, près du sapin, donne un cadeau par jour.");
  A("village", "Le cinéma en plein air", "cinema film revoir cinematique scene", "Construisez un cinéma en plein air : on y revoit toutes les cinématiques déjà vues, sous les étoiles.");
  A("village", "Le château Renaissance", "chateau renaissance maison niveau 5 loire", "Au niveau 5, la maison devient un château Renaissance, comme ceux de la Loire : pierre blanche, hauts toits d'ardoise, tours d'angle, lanterne dorée et jardins à la française.");
  A("animaux", "Adopter un animal", "adopter adoption animal nom domestique chien chat vache poule mouton chevre cochon canard lapin", "Caresse trois fois le même animal (chien, chat, cheval, ou un animal de la ferme) : il s'attache à toi, et tu peux l'adopter et lui donner un nom. Il vit à l'enclos, au poulailler, à l'étable ou à la maison, ou il te suit. Chaque jour, il te donne quelque chose : du lait, des œufs, de la laine…");
  A("animaux", "Monter à cheval", "cheval monter galoper chevaucher selle siffler", "Adopte un cheval, puis Ramasser près de lui → Monter. À cheval, tu vas presque deux fois plus vite. Ramasser pour descendre. Si tu l'as laissé loin, menu ≡ → Siffler mon cheval.");
  A("grotte", "La Grotte des Tortues", "grotte tortues date code porte nacre au coin soleil", "La Grotte des Tortues cache une date dans ses énigmes : le jour, le mois, l'année où deux cœurs se sont rencontrés. Note-les dans ton carnet : la porte de nacre ne s'ouvre qu'avec cette date. Derrière, Au Coin veut jouer à un, deux, trois… soleil.");
  A("grotte", "La Grotte du Phare", "grotte phare cloche nom lettres devinette menage plumeau", "Dans la Grotte du Phare, le carnet du gardien cache neuf lettres dans neuf devinettes de ménage. Elles forment le nom gravé sous la Cloche. Derrière : Dame Plumeau, la Fée du Ménage. Elle déteste la propreté…");
  A("grotte", "La Grotte des Étoiles", "grotte etoiles cocktail football foot match stella fragments", "La Grotte des Étoiles cache six fragments du nom d'un cocktail. Ensemble, ils ouvrent le Terrain des Étoiles, où Capitaine Stella et les Étoiles Filantes vous défient au football : trois buts gagnants !");
  A("boss", "Au Coin (un, deux, trois, soleil)", "au coin soleil un deux trois garcon bonnet", "Au Coin compte face au mur : avance. Quand il se retourne, ne bouge plus du tout, même pas d'un pas ! S'il te voit bouger : au coin, et tu perds un cœur, puis deux, puis trois… Touche-le quatre fois avec TAPER. Méfie-toi des bonbons et des balles qui roulent.");
  A("boss", "Dame Plumeau (le ménage)", "dame plumeau fee menage poussiere linge chaussette proprete", "Dame Plumeau salit tout. TAPER balaie la poussière, RAMASSER prend le linge, qu'il faut porter au panier. Quand l'arène est propre à 85 % et le linge rangé, elle s'évanouit : frappe-la ! Quatre fois.");
  A("boss", "Capitaine Stella (le match)", "stella foot football match but ballon tir passe tacle etoiles filantes", "Un match en trois buts gagnants. Va au ballon pour l'avoir. TAPER tire (vers le but si tu regardes vers lui), RAMASSER fait une passe, ESQUIVE tacle pour voler le ballon. Attention au Tir des Étoiles de Stella : il tourne !");
  A("secret", "Les créatures secrètes", "secret secrete creature tortue ancienne hibou lanterne renard celeste", "Trois créatures légendaires vivent sur les îles du large. La Tortue Ancienne dort sur la plage de l'Île aux Tortues, à l'aube. Le Hibou-Lanterne veille la nuit sur l'Île du Phare. Le Renard Céleste… il n'apparaît qu'à ceux qui ont rencontré les deux autres, la nuit, sur l'Îlot aux Étoiles.");
  A("progression", "Sauvegarde", "sauvegarde sauvegarder telephone changer ligne solo", "Tout est sauvegardé tout seul, dans le téléphone et en ligne : les îles à deux comme les îles en solo. Tu peux changer de téléphone sans rien perdre.");
})();
