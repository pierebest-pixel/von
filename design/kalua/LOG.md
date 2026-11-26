# LOG — Développement autonome de Kalua

> Rapport de la session de travail autonome du 26 novembre 2026.
> Point de départ : Kalua 0.3.1 (étape 1 publiée).
> Les modifications ne sont **ni commitées, ni poussées, ni publiées**. Elles sont seulement enregistrées dans le dossier local `von/` (branche `kalua`).
> Pour l'histoire complète du monde, voir [LORE.md](LORE.md).

---

## 0. En bref

| Élément | État |
|---|---|
| Lore complet (origine, peuples, magie, 12 Gardiens, 8 grottes, secrets, fin) | ✅ `design/kalua/LORE.md` |
| Systèmes de base (progression, sac, dialogues, cinématiques, combat temps réel, combat tour par tour, grottes) | ✅ |
| Grottes de l'île principale (1 à 5) avec leur boss | ✅ 83 salles en tout |
| Grottes des îles (6, 7, 8) : salles, pièges, énigmes, ennemis, mini-boss | ✅ 34 salles, **boss finaux non créés (réservés à Sixte)** |
| 12 Gardiens (boss optionnels) au tour par tour | ✅ |
| 5 grandes quêtes (3 très longues, 1 moyenne, 1 normale) avec 3 cinématiques chacune | ✅ 15 cinématiques |
| Quête du bateau (enquête) | ✅ |
| 6 quêtes de magie (point noir) | ✅ |
| 10 petites quêtes d'habitants + forge + atelier | ✅ |
| Fils de vie : augmentation définitive de la vie grâce aux animaux | ✅ 8 fils, de 5 à 13 cœurs |
| Cycle de vie des PNJ (heure commune, emplois du temps, trajets, activités) | ✅ 31 PNJ |
| Cinématique d'introduction (naufrage) + guide Nalia + escorte jusqu'au village | ✅ |
| Nalia : thèmes d'aide + « Question personnalisée » (clavier, recherche dans les données du jeu) | ✅ |
| Musiques : une par biome, par boss, par situation, avec fondus | ✅ 40 thèmes |
| Fin du jeu (combat final en 3 temps + Chant à Deux, conclusion, crédits Sixte Maron et Claude) | ✅ |
| Aucune barre d'endurance | ✅ (seulement un temps de recharge sur les chants) |
| Publication | ❌ volontairement rien de publié |

---

## 1. Fichiers

### Créés (`games/kalua/`)
| Fichier | Rôle |
|---|---|
| `state.js` | Progression du joueur : vie, Fils de vie, sac, chants, drapeaux d'histoire, quêtes, boss vaincus, état des grottes, PNJ morts, animaux chassés, lore, journal. Sauvegarde dans le téléphone **et** en ligne (`islands/{id}/progress/{uid}`). |
| `items.js` | Les icônes des ~50 objets des maquettes de l'étape 2 (copiées de `design/kalua/items-maquette.js`). |
| `items-data.js` | Catalogue complet : ~110 objets (nom, catégorie, description, soin ou force, icône dessinée ou emoji). |
| `dialog.js` | Boîte de dialogue : texte qui s'écrit, portrait, choix, **saisie au clavier** (question libre), interruption par « Passer ». |
| `cutscene.js` | Moteur de cinématiques : 14 décors animés (tempête, pont du navire, plage, village, jungle, temple, marais, falaises, volcan, grotte, Cœur, mer, phare, ciel étoilé), acteurs, caméra, tremblements, éclairs, fondus, bandes noires, titres, particules (pluie, braises, cendres, lucioles, lumière, feuilles, bulles), musique et bruitages. Bouton « Passer ». |
| `npcs.js` | 31 habitants : apparence, rôle, emploi du temps, activités, petites phrases, marqueurs (point rouge / noir / orange). Heure commune aux deux joueurs (1 journée = 20 minutes). |
| `bestiary.js` | Dessins de 60 créatures : ennemis, mini-boss, boss de grottes, les 12 Gardiens, les créatures secrètes. |
| `action.js` | Combat en temps réel : 25 types d'ennemis et 18 comportements, projectiles, **zones d'attaque annoncées**, coups du joueur, 6 chants, butin (cœurs, matériaux). |
| `rtbosses.js` | Boss et mini-boss en temps réel : partitions d'attaques par phases, vulnérabilités, chants nécessaires. |
| `battle.js` | Combat au tour par tour : timing pour attaquer (critique) et pour **parer**, chants avec temps de recharge en tours, objets, statuts (poison, brûlure, ligoté, sommeil, aveugle, gel, peur…), attaques annoncées, boucliers, envol, cachette, illusions, renaissance, allié, et la phase spéciale « Chant à Deux ». |
| `dungeon.js` | Moteur des grottes : salles de 15 × 9 cases, 30 types de cases (voir § 4), énigmes, portes à clé, grande clé, salles sombres, rendu pixel art ou doux. |
| `caves-1.js` … `caves-5.js`, `caves-iles.js` | Les 117 salles des 8 grottes. |
| `lore.js` | 21 fragments de lore à découvrir (journal). |
| `guide.js` | Le savoir de Nalia : base de connaissances + recherche en langage naturel. |
| `quests.js` | Moteur de quêtes + les 5 grandes quêtes + la quête du bateau. |
| `quests2.js` | Quêtes de magie, petites quêtes, forge, atelier, Fils de vie. |
| `story.js` | Histoire principale : introduction, escorte, Nalia, Gardiens, navigation, entrée des grottes, cinématiques des boss, fin, crédits. |
| `play.js` | Le jeu lui-même (remplace la deuxième moitié de `game.js`) : modes île / grotte / combat / cinématique, récolte, chasse, caresses, animaux dorés, ennemis de l'île, jour et nuit, ambiance musicale, HUD (cœurs, objectif, barre de boss, recharge du chant), mini-carte. |

### Créés (`design/kalua/`)
- `LORE.md` : le lore complet.
- `LOG.md` : ce rapport.

### Modifiés
| Fichier | Changement |
|---|---|
| `index.html` | Boutons CHANT et ⇄, liste des nouveaux scripts, zone des objets ramassés. |
| `style.css` | Styles : chant, dialogues, combat, cinématiques, quêtes, journal, sac. |
| `game.js` | Ne garde que les écrans (créateur, Mes îles). Le jeu est dans `play.js`. |
| `menus.js` | Menu en jeu : Appeler Nalia (conque), Quêtes, Sac (vrais objets, manger), Chants et vie, Journal et lore. La grande carte montre l'objectif et les Gardiens libérés. |
| `music.js` | Nouveau moteur : 40 thèmes générés (biomes, nuit, grottes, danger, combat, mini-boss, 16 thèmes de boss, tristesse, révélation, espoir, quête, final, crédits), fondus enchaînés, fanfares, 30 bruitages. La musique du titre est inchangée. |
| `map.js` | `isleAt()` : savoir si on est sur une des trois îles. |
| `world.js` | On peut marcher sur les trois îles (on y arrive en bateau) ; décor propre à chaque île. |
| `net.js` | Sauvegarde de la progression en ligne (`saveProgress`, au plus une écriture toutes les 4 s). |
| `database.rules.json` | Règle pour `progress/{uid}` (chacun n'écrit que la sienne). **⚠️ À recoller dans la console Firebase.** |

---

## 2. Systèmes développés

### Progression et sauvegarde
- Tout est enregistré : vie, Fils de vie, sac, chants, quêtes, grottes (salles vues, énigmes résolues, clés, coffres, murs brisés), boss, PNJ morts, lore, journal, position.
- Sauvegarde locale immédiate, et en ligne dans l'île (la version la plus récente gagne si on change de téléphone).

### Contrôles (sans endurance)
- Flèches, SPRINT (illimité), TAPER, RAMASSER (parler, ouvrir, lire, caresser, entrer), ESQUIVE (invincible pendant la roulade), **CHANT** (bouton violet) et **⇄** (changer de chant).
- Au clavier : flèches/ZQSD, Espace (taper), E (ramasser), X (esquiver), F (chanter), R (changer de chant), Échap (menu).
- **Aucune jauge d'endurance ni de mana.** L'équilibrage se fait par des temps de recharge sur les chants.

### La magie : les Six Chants
| Chant | Temps réel | Tour par tour | Maître (point noir) |
|---|---|---|---|
| 🔥 Flamme | boule de feu (2 dégâts) ; allume les torches, brûle les ronces | 4 dégâts + brûlure, empêche les soins | Vulcain (camp du volcan) |
| 🌱 Racine | pont de lianes sur 4 cases de vide ; immobilise les ennemis proches | immobilise 1 tour, annule une charge | Maître Tilo (vieil arbre, jungle) |
| 🌊 Marée | bulle qui arrête les tirs ; refroidit la lave et les golems | bouclier d'eau (absorbe un coup) +1 ❤ | Ondine (ponton du port) |
| 🌀 Bourrasque | pousse les blocs lourds et les ennemis, lance les ventilateurs, souffle les tirs | 3 dégâts, annule une charge, fait tomber ceux qui volent | Zéphyr (moulins) |
| ✨ Lueur | éclaire les salles noires, montre les ponts invisibles, révèle les fantômes | révèle, soigne l'aveuglement et le sommeil, coup suivant renforcé | Sœur Luciole (marais, la nuit) |
| 💥 Onde | brise les murs fissurés, étourdit tout autour | 3 dégâts à tous, brise boucliers et pierre | Grumo (ruines des falaises) |

### Augmentation définitive de la vie : les Fils de vie
- Mère Tikka (marais) tisse 8 Fils de vie à partir d'essences animales. Chaque fil donne **+1 cœur pour toujours** (de 5 à 13 cœurs).
- On obtient les essences en chassant (TAPER sur un animal), sur les ennemis de l'île, ou en caressant les **animaux dorés**. Un animal sur 40 environ est doré chaque jour. Il pleure une Larme dorée quand on le caresse.
- Recettes, toutes différentes, avec des animaux de biomes différents :
  1. 2 plumes (perroquet) + 1 cuir
  2. 2 carapaces (crabe, scarabée) + 1 plume de mouette
  3. 2 laines (mouton) + 1 corne (chèvre, bouquetin)
  4. 2 écailles (lézard, salamandre) + 1 défense de sanglier
  5. 2 écailles de croco + 2 gelées (grenouille)
  6. 1 plume d'aigle + 2 cornes + 1 cuir
  7. 2 carapaces + 2 écailles + 1 laine
  8. 1 Larme dorée + 1 plume + 1 plume d'aigle
- On découvre le système par Mère Tikka et par Nalia (« comment augmenter ma vie »).

### Récolte, chasse, artisanat
- Arbres (3 coups), rochers, buissons, coquillages, champignons, fleurs, roseaux, lotus. Tout repousse (90 à 120 s).
- Hache et pioche : récolte deux fois plus rapide ; la pioche donne du fer et de l'obsidienne.
- Chasse : 25 espèces, chacune avec son butin. Elles reviennent au bout de 4 minutes. On ne chasse ni les chiens ni les chats.
- **Établi du village** : corde, fil, torche, potion, brochette, thé de lotus, collier.
- **Forge de Brann** : hache, pioche, épée de corail (×2), lame d'obsidienne (×3). La lame est aussi cachée dans une salle secrète du volcan.

### Ennemis de l'île
- Groupes agressifs qui apparaissent quand on approche : sangliers épineux (jungle, en groupe), crocos des brumes (marais, en groupe), condors (falaises), golems de lave (volcan), crabes géants (côte). Ils reviennent 3 minutes après avoir été vaincus.
- La musique passe en mode « danger » quand ils te prennent en chasse.

### Jour, nuit et vie des PNJ
- 1 journée de Kalua = 20 minutes, **la même pour les deux joueurs**.
- La nuit assombrit l'écran, avec une lueur orangée au coucher du soleil.
- Chaque PNJ a un emploi du temps de 3 à 6 étapes. Exemple pour Fennek : il dort le jour, se lève à 16 h, puis allume les lanternes une par une. Ils marchent d'un lieu à l'autre (en passant par les ponts) et ont une activité visible : pêcher, dormir (zzz), cuisiner (fumée), forger (étincelles), prier (halo), nager, danser, observer les étoiles, allumer les lanternes…
- Ils disent une petite phrase quand on passe à côté.
- Positions calculées à partir de l'heure commune : les deux joueurs voient le même PNJ au même endroit.
- Marqueurs : **point rouge** = grande quête, **point noir** = quête qui apprend un chant, point orange « ! » = petite quête.

### Combat en temps réel
- Les boss **annoncent** leurs attaques : la zone apparaît au sol puis frappe (cercles, anneaux, lignes, rectangles). On esquive en roulant.
- Les protections (🛡) obligent à trouver le bon moment ou le bon chant.
- Barre de vie du boss en haut de l'écran, avec la couleur de la phase.

### Combat au tour par tour
- ⚔️ Attaquer avec un anneau de timing (parfait = coup critique ×1,6), ✨ Chant, 🎒 Objet, 🛡️ Parer (dégâts ÷2, et le coup suivant est plus fort), 🏃 Fuir (impossible contre un boss).
- Quand l'ennemi attaque : anneau « PARE ! ». Bien = −1 dégât, parfait = −2.
- Les grosses attaques sont annoncées un tour avant (⚠). On peut les parer, les bloquer avec la Marée, ou les annuler avec la Racine ou la Bourrasque.
- Conseil affiché la première fois qu'on rencontre un boss.

---

## 3. Les grottes

| Grotte | Mode | Salles (avant le boss) | Mini-boss | Boss |
|---|---|---|---|---|
| 1 · Racines | temps réel, pixel | 15 (14 + 1 secrète) | Ver-Racine (s.6), Champignon-Roi (s.11) | **Mère-Racine** |
| 2 · Marine | tour par tour | 14 (13 + 1 secrète) | Murène géante (s.6), Capitaine Crabe (s.11) | **Amiral Nacre** |
| 3 · Brumes | temps réel, pixel | 16 (15 + 1 secrète) | Crapaud-Geôle (s.6), Lanternier (s.12) | **Le Geôlier sans visage** |
| 4 · Vent | tour par tour | 13 (12 + 1 secrète) | Harpie-Reine (s.6), Golem du vent (s.12) | **Tempestaire** |
| 5 · Cœur du Volcan | temps réel, pixel | 20 (19 + 1 secrète) | Golem de magma (s.6), Chevaliers de cendre (s.12), Salamandre-Mère (s.17) | **La Reine Cendrée** |
| 6 · Tortues | temps réel | 11 + arène scellée | Grand Bernard (s.5), Méduse-Reine (s.10) | ⛔ réservé à Sixte |
| 7 · Phare | temps réel | 11 + arène scellée | Automate-Gardien (s.5), Goéland-Spectre (s.11) | ⛔ réservé à Sixte |
| 8 · Étoiles | tour par tour | 9 + arène scellée | Étoile filante (s.5), Gardien des Constellations (s.9) | ⛔ réservé à Sixte |

**117 salles au total**, vérifiées automatiquement : taille, portes qui se répondent, ennemis, coffres cachés, stèles, boss.

### Cases et mécanismes disponibles
Murs, sol, eau, trous, lave, pics fixes, pics alternés (2 rythmes), ponts, glace, blocs à pousser, **blocs lourds** (Bourrasque), plaques de pression, torches (ordre, minuterie), ronces (Flamme), murs fissurés (Onde, passages secrets), jarres, petites clés, coffres, grands coffres, leviers (ordre), cristaux rouge/bleu, grilles, ventilateurs, **courants d'air et d'eau**, **ponts invisibles** (Lueur), **sol qui s'effondre**, stèles (lecture, choix ou **réponse écrite au clavier**), cœurs, **lance-flèches**, portes (clé, grande clé, scellée), salles sombres.

### Énigmes et pièges, par grotte
- **Racines** : combat qui scelle les portes, blocs sur plaques, gouffre à traverser avec la Racine, 3 leviers dans l'ordre des « trois gisants », devinette du Cœur, cristaux, salle des spores (pics alternés + champignons cracheurs), devinette écrite (« trou »), couloir des flèches, tombe secrète d'Ilaïa enfant.
- **Marine** : levier de marée (l'eau devient un chemin), cale aux perles (blocs), courants qui repoussent, devinette du soleil, cristaux du phare englouti, bassin aux deux leviers, **sol de nacre qui s'effondre** jusqu'au grand coffre, chambre secrète de l'amiral, salle des trois cloches (ordre décrit par une stèle).
- **Brumes** : loge du gardien (leviers), **cachot noir à pont invisible**, salle des chaînes (pics + flèches), 4 torches dans un ordre décrit, cellules inondées (blocs à faire passer par une seule rangée), spectres (on ne les touche que visibles ou à la Lueur), réfectoire (liste de noms : indice sur Nalia), cristaux, salle des supplices (sol qui s'effondre + flèches), cellule secrète (dessin d'enfant), cellule de la princesse.
- **Vent** : bouche du vent (courant contraire), couloir des courants, ventilateur à lancer, bloc lourd à pousser 5 fois, salle des notes (la note la plus grave), pont suspendu (courant vers le haut), alcôve secrète (« Oro, 8 ans »), chambre des échos (réponse écrite « écho »), trésor gardé par 3 groupes, couloir des trois ventilateurs (un seul est le bon).
- **Volcan** : rivière de lave (Marée), 5 torches de gauche à droite avant que la première ne s'éteigne (Flamme + minuterie), grand gouffre (Racine), bloc de basalte (Bourrasque), salle sans lumière (Lueur), murs creux (Onde) et **reliquaire secret avec la lame d'obsidienne**, cristaux et lave, arène des cendreux, salle des souvenirs (4 fresques de la vie d'Ilaïa), couloir des pièges (pics, flèches, effondrement), trésor de la garde (Flamme + Racine + Onde ensemble), montée de lave (courant), les mains de cendre (les Échoués d'avant, dont Kaïmo et Arnaud).
- **Tortues** : bassin aux méduses (pont étroit), carapaces sur plaques, marée et corail (pics + courant), tortues de pierre (se cachent dans leur carapace), nid secret (souvenir d'Ilaïa enfant), cristaux d'écume.
- **Phare** : salle des engrenages, mécanisme de la lentille (3 leviers + pics), **escalier en labyrinthe sous les flèches**, miroirs noirs (pont invisible), spectres marins, cabinet du gardien (carnet sur Nalia), galerie des vents marins (Racine au-dessus du vide, contre le vent).
- **Étoiles** : salle des constellations (devinette de la Couronne), puits de lumière (pont invisible en losange), cristaux célestes, écho stellaire (réponse écrite « étoile filante »), trésor des étoiles.

### Les boss des grottes, en détail
- **Mère-Racine** : invulnérable sauf quand elle ouvre sa bouche-tombeau, ou quand on brise ses **4 racines-veines** (alors 6 s sans défense). Lignes de racines qui visent, pluie de graines, onde de choc, puis serpents-racines et **anneaux concentriques** en phase 3.
- **Amiral Nacre** : rentre dans sa coquille (immunisé, l'Onde ou la Bourrasque la renversent), canon à perles, **Marée noire annoncée**, appelle son équipage. En phase 2, il quitte sa coquille brisée : plus fragile mais plus furieux.
- **Le Geôlier sans visage** : salle noire. Sans Lueur, il est presque invisible et intouchable. Il se téléporte de cellule en cellule, lance des clés (à tête chercheuse en phase 2), fait tourner ses chaînes (6 lignes successives) et s'étourdit lui-même (seul moment vulnérable). Cage autour du joueur. En phase 2, il retrouve un visage. En phase 3, il se dédouble.
- **Tempestaire** : chante des notes (♪). À 3 notes, la **Grande Tempête** (6 dégâts). Chaque Bourrasque efface une note. En phase 2, il chante le Chant du Vent à l'envers.
- **La Reine Cendrée** (fin du jeu), voir § 6.
- Mini-boss :
  - Ver-Racine : sous terre, il sort entouré d'anneaux.
  - Champignon-Roi : il ne prend des dégâts que quand il est essoufflé, sauf le feu qui le touche toujours. Spirales de spores, champignons en renfort.
  - Crapaud-Geôle : sauts annoncés, langue, barreaux qui tombent.
  - Lanternier : la Flamme fait tomber sa lanterne, la Lueur l'éblouit.
  - Golem de magma : il faut la Marée tout près de lui.
  - Chevaliers de cendre : **il faut abattre les deux jumeaux en moins de 8 s, sinon le premier se relève**.
  - Salamandre-Mère : elle plonge dans la lave ; la Marée fige la mare.
  - Grand Bernard : la Bourrasque ou l'Onde le renversent.
  - Méduse-Reine : anneaux électriques ; elle n'est vulnérable que quand elle recharge.
  - Automate-Gardien : blindé devant, il faut le frapper dans le dos.
  - Goéland-Spectre : piqués annoncés, invisible sans Lueur.
  - Murène géante, Capitaine Crabe, Harpie-Reine, Golem du vent, Étoile filante (agit deux fois par tour), Gardien des Constellations (soigné par ses étoiles) : au tour par tour.

---

## 4. Les 12 Gardiens (boss optionnels, tour par tour)

Chacun a son dessin, sa musique (thème de boss propre), 2 phases avec un texte de transition, une mécanique spéciale, un conseil, une récompense (son Sceau) et un emplacement : un repaire avec une couronne sur la carte, ou une route en mer. Chaque Gardien libéré **affaiblit la Reine Cendrée** dans le combat final (−3 PV chacun).

| # | Gardien | Mécanique | Où / quand | Récompense |
|---|---|---|---|---|
| B1 | Roi Crabe Corail | carapace de corail (Onde), marée montante annoncée | en mer (bateau) · petite quête de Pipa | Couronne de corail |
| B2 | Petit Kraken | encre (aveugle), plongée, panique | **quête du bateau** (attaque le bateau) | Encre magique |
| B3 | Grand Gorille Moussu | se soigne avec sa mousse (la Flamme l'en empêche), se renforce | quête de Kéo | Fourrure de mousse |
| B4 | Serpent-Liane | ligote (on ne peut plus attaquer, l'Onde libère), venin, insensible à la Racine | quête de Kéo | Écaille-liane |
| B5 | Gardien du Temple | Regard turquoise annoncé, bouclier de pierre ; en phase 2, il vise **Kéo** (allié) | quête de Kéo | Pierre-œil turquoise |
| B6 | Reine Grenouille | chant hypnotique (sommeil), renforts, faible au vent | quête de Mère Tikka | Couronne de jonc |
| B7 | Esprit des Brumes | intouchable dans la brume (Lueur ×2), voix des noyés | quête de Mère Tikka, la nuit (Tikka est l'alliée soigneuse) | Larme de brume |
| B8 | Bélier Tonnerre | charge électrique annoncée (la Racine l'annule), laine statique qui renvoie les coups, orage à chaque tour | quête d'Oro | Corne-éclair |
| B9 | Aigle-Roi | s'envole (la Bourrasque le fait tomber), piqué royal | en mer (bateau) | Plume dorée |
| B10 | Gargouille des Ruines | forme de pierre qui se soigne (l'Onde la brise) | quête d'Oro | Fragment de pierre-lune |
| B11 | Dragonnet de Lave | souffle de feu (la Marée bloque, ×2), sieste qui soigne | volcan (libre) | Écaille de dragon (→ lame d'obsidienne) |
| B12 | Phénix Cendré | renaît une fois plus sombre ; une Marée sur l'Œuf de cendres empêche la renaissance | volcan (libre) | Plume de phénix |

Les **créatures secrètes** des îles (Tortue Ancienne, Hibou-Lanterne, Renard Céleste) ont leur combat au tour par tour prêt dans `battle.js`. Elles ne sont pas encore placées sur les îles (voir § 10).

---

## 5. Les quêtes

### Les 5 grandes quêtes (point rouge), 3 cinématiques chacune
1. **Le Serment des Lumes (Kéo) — très longue**
   - 9 étapes : la porte qui bouge → Amaru et la chanson du Gardien → suivre 3 traces de mousse → **Grand Gorille Moussu** → Maître Tilo → 3 herbes pour le baume → **Serpent-Liane** → la porte, la nuit → **Gardien du Temple** avec Kéo en allié.
   - Cinématiques : la porte qui bouge pour la première fois / les sceaux et la lance du père / **mort de Kéo** qui retient la porte, la peine d'Amaru, la vision de la prophétie.
   - Conséquences : Kéo disparaît, sa tombe et sa lance sont devant le Temple, Amaru porte son collier et parle de lui.
2. **La Brume qui chante (Mère Tikka) — très longue**
   - 6 étapes : interroger Fennek et Nouk → trouver un lotus → thé de lotus (vision) → **Reine Grenouille** → obtenir une lanterne des morts (lien avec la quête de Fennek) → **Esprit des Brumes** la nuit, avec Tikka en alliée.
   - Cinématiques : la poupée au bord de l'eau et le rire de Mila / les voix libérées et Mila emportée par la brume / Mila qui part enfin, devenue une étoile.
   - Conséquences : le marais s'éclaircit, Tikka reçoit les bottes de brume tissées par Mila, son dialogue change, et Mila apparaît dans la fin.
3. **Le Dernier Chant du Vent (Grand-père Oro) — très longue**
   - Réveiller 7 pierres levées, chacune autrement : la frapper pour enlever la mousse, une plume d'aigle, une devinette, la Bourrasque, la pierre de chant volée par la Gargouille, la corne de l'éclair, et la dernière chantée par Oro.
   - Deux Gardiens : **Bélier Tonnerre** et **Gargouille des Ruines**.
   - Cinématiques : la flûte fendue et Lili / le vent qui revient, le Bélier et Oro qui s'effondre / les sept pierres qui chantent, puis **la mort paisible d'Oro**.
   - Conséquences : les moulins tournent, Lili garde le moulin et nomme une étoile « Oro », la lunette passe au joueur.
4. **Les Lanternes éteintes (Fennek) — moyenne**
   - Guetter la nuit, poursuivre le feu follet en 4 points, comprendre que Pyrrha a froid depuis 700 ans, lui faire un feu, puis **choisir** si elle rend les flammes ou en garde une.
   - Cinématiques : le vol de flamme / Pyrrha dans le berceau / Fennek lui fabrique sa propre lanterne.
   - Récompense : la lanterne des morts, nécessaire pour la quête de Mère Tikka.
5. **La Carte du ciel (Lili) — normale**
   - 4 étoiles tombées à trouver la nuit (plage, jungle, marais, falaises), les remettre au ciel, puis un quiz.
   - Cinématiques : la constellation manquante / la constellation des **Deux Cœurs** (indice sur la prophétie) / l'étoile filante et le vœu de Lili.

**Les deux quêtes avec au moins 4 Gardiens au total** : Kéo (3 : B3, B4, B5) + Oro (2 : B8, B10) = 5 Gardiens. Mère Tikka en ajoute 2 (B6, B7).

### La quête du bateau : « L'Enquête de la Mouette d'Argent » (capitaine Bastien)
- **Enquête** : 4 indices.
  - Le journal de bord, dans l'épave.
  - La carte de Maëlle en 3 morceaux : dans les dunes ; chez Pipa, contre 3 devinettes de marin ; sur le dos d'un crabe géant à combattre.
  - Les **témoignages** : il faut poser la bonne question à Tim, Jojo, Rosalie et Maëlle.
  - Le battant de cloche, qu'Ondine remonte du récif.
- **Construction** : 5 pièces.
  - Le gouvernail, à dégager dans l'épave en frappant.
  - La voile, cousue par Rosalie (feuilles + laine).
  - Le mât, un bambou géant à couper à la hache.
  - Le goudron de lave, fait par Brann.
  - Deux cordes, à l'établi.
- **Déduction** : un interrogatoire en 3 questions avec Bastien. Une erreur renvoie aux indices.
- **Événement inattendu** : la nuit, la cloche sonne, le Phare s'allume, Coco crie « NALIA ! » et Nalia marche sur la mer.
- **Traversée** : le **Petit Kraken** attaque. Bastien coupe le tentacule et **meurt** emporté par la mer. Sur l'île du Phare, **Nalia avoue** avoir provoqué le naufrage.
- **Conséquences** :
  - Le bateau devient « Le Bastien » et Maëlle le pilote.
  - La navigation est débloquée : les 3 îles, le rocher du Roi Crabe, le nid de l'Aigle-Roi.
  - Coco suit le joueur.
  - Le chapeau de Bastien reste au ponton, et Tim, Jojo et Rosalie parlent de lui.

### Les 6 quêtes de magie (point noir)
- **Tilo** : trouver 3 pousses qui chantent.
- **Ondine** : 5 perles bleues, puis une question.
- **Sœur Luciole** : toucher les lanternes dans l'ordre des lucioles, la nuit.
- **Zéphyr** : attraper 5 plumes qui tournent dans le vent.
- **Vulcain** : cristal de feu + 2 soufres, puis **tenir 20 s dans le cercle de feu**.
- **Grumo** : casser 3 rochers fissurés pour retrouver son cœur de pierre.

Chaque chant appris déclenche une courte cinématique.

### Les petites quêtes des habitants
- **Tim** : l'harmonica de son père.
- **Jojo** : le ragoût de la Mouette, qui débloque une recette réutilisable.
- **Dame Rosalie** : un parasol.
- **Nouk** : cache-cache en 3 manches. Il se cache vraiment ailleurs.
- **Bodo** : 3 moutons égarés.
- **Tobi** : 3 coquillages rares, dont un sur l'île aux Tortues. Il donne la conque.
- **Arnaud** (le fantôme, la nuit) : sa lettre, puis une petite cinématique où il retrouve Louise. Lore : le couple d'avant.
- **Nana** : un quiz de 5 questions tirées au hasard.
- **Pipa** : le rocher du Roi Crabe.
- **Brann** : la forge.

---

## 6. Histoire principale, cinématiques et morts

### Cinématiques réalisées (31)
- **Introduction**
  - L'étoile qui tombe.
  - La Mouette d'Argent dans la tempête.
  - Le pont du navire : la boussole folle, la cloche sous la mer, Coco qui crie « Nalia ».
  - L'éclair qui montre la silhouette sur le rocher.
  - Le **crash** : tremblements, éclairs, flash, bruitages, navire brisé.
  - Les deux mains qui se trouvent dans les vagues.
  - Le réveil sur la plage, au matin.
  - La rencontre avec Nalia, avec des choix de dialogue.
- **Village** : l'arrivée avec Nalia et le don de la conque.
- **Grandes quêtes** : 15, soit 3 pour chacune.
- **Quête du bateau** : la promesse sur l'épave, la nuit de la cloche, la traversée, la mort de Bastien et l'aveu de Nalia.
- **Petites quêtes et magie** : Arnaud et Louise, et l'apprentissage de chaque chant.
- **Ouverture du Cœur** par Ysolde : Nalia décide de venir.
- **Boss des grottes** :
  - Grotte 1 : l'intro de la Mère-Racine, puis sa libération et la fresque de la Reine.
  - Grotte 3 : l'intro du Geôlier, puis **la cellule « Nalia, fille d'Ilaïa »** et l'aveu de Nalia sur ses 700 ans.
  - Grottes 2 et 4 : conclusions racontées.
- **Fin** : intro du combat final, la Reine qui se relève, le sacrifice de Nalia et la délivrance d'Ilaïa, le ciel aux nouvelles étoiles, les adieux au port, Coco.
- **Crédits** (12 cartons, dont **Sixte Maron** et **Claude**).

### Morts de PNJ et conséquences
| PNJ | Quand | Conséquences |
|---|---|---|
| Kéo | fin du Serment des Lumes | Il disparaît du monde. Sa tombe et sa lance sont devant le Temple. Amaru porte son collier. Il est cité dans la fin et les crédits. |
| Capitaine Bastien | fin de la quête du bateau | Il disparaît. Son chapeau reste au ponton. Maëlle devient capitaine. Coco suit le joueur. Tim, Jojo et Rosalie parlent de lui. Le bateau s'appelle « Le Bastien ». |
| Grand-père Oro | fin du Dernier Chant du Vent | Il disparaît. Sa petite pierre est devant la 7e pierre levée. Lili reprend le moulin et nomme une étoile « Oro ». Il est dans la fin. |
| Arnaud (fantôme) | fin de sa quête | Il part en paix avec Louise. |
| Nalia | la fin du jeu | Elle disparaît. Son étoile de nacre est dans les dunes. La conque fait parler **Coco**, qui répète tout ce qu'elle savait : le guide reste accessible. |

### Révélations progressives
1. La Cendre Noire.
2. La fresque de la reine et de l'étoile fêlée (grotte 1).
3. La prophétie des deux cœurs (crypte de Kéo).
4. « Nal… » dans le réfectoire, puis la cellule de Nalia (grotte 3).
5. Les Échoués d'avant (Arnaud, et les mains de cendre).
6. La cloche et l'aveu de Nalia (quête du bateau).
7. La Reine est vivante dans le Cœur (Ysolde, le volcan).
8. Le sacrifice de Nalia (fin).

### Le combat final
- **Temps 1** :
  - Un voile de cendre protège la Reine. Il faut la **Bourrasque** pour le déchirer, puis frapper.
  - Attaques : anneaux de cendre, éventail de braises à tête chercheuse, pluie de feu.
- **Temps 2** (à 66 %) :
  - Deux chevaliers de cendre se lèvent.
  - Attaques : rayons du Cœur en croix, murs de lave sur les côtés, salves, braises qui explosent.
- **Temps 3** (à 33 %) :
  - La Reine s'envole et se dédouble en reflets. La **Lueur** montre la vraie.
  - Attaques : pluie de cendres et anneaux en cascade.
- **Phase spéciale au tour par tour, « le Chant à Deux »** :
  - Plus d'attaques : il faut **chanter tour à tour** (en tapant au bon moment), tenir la main de l'autre (fait baisser le « lien » de la Reine) et garder.
  - Chanter deux fois de suite brise la voix.
  - Le chant doit atteindre 8 avant que le lien n'atteigne 10. En cas d'échec, on recommence avec des conseils de Nalia.
- Chaque Gardien libéré retire 3 PV à la Reine.

---

## 7. Nalia, la guide

- Elle apparaît dans l'introduction, accompagne le joueur jusqu'au village (escorte avec 5 conseils sur les commandes, les points, la mini-carte), puis vit au village (emploi du temps : la plage à l'aube, le feu du village, la dune la nuit, à regarder la mer).
- **Conque d'appel** : menu ≡ → « Appeler Nalia » depuis n'importe où.
- Menu de dialogue :
  - 🧭 Que dois-je faire ?
  - 📚 Informations sur le jeu (13 thèmes : commandes, mécaniques, progression, chants, grottes, énigmes, combat, boss, quêtes, habitants rencontrés, régions, objets possédés, histoire)
  - ✍️ **Question personnalisée**
  - 💬 Parler de toi : ses réponses changent avec l'histoire
- **Question personnalisée** :
  - Un champ texte ouvre le clavier du téléphone.
  - La question est découpée en mots-clés : sans accents, mots vides retirés, racines, synonymes (« pv » = vie, « sort » = chant, « donjon » = grotte…).
  - Elle est comparée à une base d'environ 260 fiches. Une trentaine sont écrites à la main ; les autres sont **générées à partir des données du jeu** :
    - chaque PNJ, avec son emploi du temps réel ;
    - chaque objet, avec la quantité dans le sac ;
    - chaque boss, avec son conseil ;
    - chaque grotte et chaque chant (qui l'enseigne) ;
    - chaque quête, avec son étape en cours ;
    - chaque région.
  - Réponses en direct : l'objectif actuel, l'heure, la vie, la position, les Gardiens libérés, les chants connus.
  - Si deux fiches sont proches, elle répond avec les deux. Sinon, elle propose des exemples de questions.
  - Tout fonctionne sans internet et sans IA externe.
- Exemples testés :
  - « comment augmenter ma vie » → les Fils de vie de Mère Tikka.
  - « où est mère tikka » → son emploi du temps.
  - « comment battre le bélier tonnerre » → le conseil de combat.
  - « c'est quoi la cendre noire » → la réponse du lore.
  - « il y a une jauge de fatigue ? » → « aucune endurance ».
  - « comment ouvrir une porte fermée » → les clés.

---

## 8. Musiques et ambiance sonore

Tout est composé et joué en direct (Web Audio). Les changements de musique se font avec des fondus de 1 à 2,5 s.

- **Lieux** :
  - Côte (marimba, île), village (harpe), jungle (flûte, tambours tribaux), marais (cloches, bourdon, chœur « ou »), falaises (flûte, mode lydien), volcan (cuivres, mode harmonique).
  - Îles (pentatonique), nuit (cloches douces), mer.
- **Grottes** : douce (mystérieuse), pixel (chiptune), volcan (chiptune + chœur).
- **Situations** :
  - Danger (dès qu'un groupe d'ennemis te prend en chasse), combat, mini-boss.
  - **16 thèmes de boss** (un par Gardien et par boss de grotte : tonalité, mode et instrument différents).
  - Final (épique et sombre), « Chant à Deux » (chœur).
- **Émotions** : tristesse, révélation, espoir, quête, intro (sombre et épique, chœur), tempête, crédits.
- **Fanfares** : victoire, objet, secret, chant appris, quête, cœur gagné, échec.
- **30 bruitages** : coups, blessures, bois, pierre, portes, leviers, coffres, feu, eau, vent, racines, lumière, vagues, tonnerre, explosion, **fracas du naufrage**, éclaboussures, **cloche sous-marine**, magie, pièges, chutes, battement de cœur, rugissement…
- La musique baisse pendant les dialogues de cinématique.

---

## 9. Tests effectués

- Syntaxe de tous les fichiers (`node --check`) : OK.
- **Validateur automatique des 117 salles** (taille 15 × 9, portes qui se répondent dans les deux sens, ennemis déclarés, coffres cachés, stèles, cases de boss, énigmes cohérentes) : 0 problème. 5 erreurs trouvées et corrigées au passage.
- Navigateur (copie locale avec un faux réseau, sans toucher à Firebase) :
  - Île : rendu, PNJ, mini-carte, cœurs, objectif : OK, sans erreur.
  - Toutes les salles sans boss des 8 grottes chargées et animées : **aucune erreur**.
  - Grotte 1 : combat contre les slimes, apparition de la Mère-Racine et de ses racines-veines : OK.
  - Combat au tour par tour contre le Bélier Tonnerre (clics automatiques) : OK.
  - **Introduction complète** (titres, tempête, pont, crash, plage, Nalia) puis escorte jusqu'au village et cinématique du village : OK.
  - Questions libres à Nalia : OK, après une amélioration du classement des réponses.
  - **Les 13 boss et mini-boss en temps réel** (Ver-Racine, Champignon-Roi, Mère-Racine, Crapaud-Geôle, Lanternier, Geôlier, Golem de magma, Chevaliers, Salamandre-Mère, Grand Bernard, Méduse-Reine, Automate-Gardien, Goéland-Spectre) : apparition, attaques, changements de phase, défaite, salle marquée résolue, cinématiques d'après-boss : OK, sans erreur.
  - **Les 26 combats au tour par tour** (les 12 Gardiens, les 6 mini-boss et 2 boss des grottes 2, 4 et 8, les 3 créatures secrètes, 3 groupes d'ennemis normaux), joués par un « joueur » qui clique au hasard : tous terminés, sans erreur.
  - **Le Chant à Deux** : en jouant au hasard, on perd ; en alternant chant et main tendue, on gagne en 7 tours. Il a été rééquilibré pour ça.
  - **Toutes les quêtes jouées de bout en bout**, cinématiques comprises (les combats remplacés par une victoire automatique) :
    - le Serment des Lumes, la Brume qui chante, le Dernier Chant du Vent, les Lanternes éteintes, la Carte du ciel ;
    - l'Enquête de la Mouette d'Argent ;
    - les 6 quêtes de magie ;
    - Tim, Jojo, Rosalie, Nouk, Bodo, Tobi, Arnaud, Nana, la forge.
  - **Monde** : navigation vers les îles (on peut y marcher), Gardiens en mer (B1, B9), repaire libre (B11), Ysolde qui ouvre le Cœur avec les 4 trophées, entrée de la grotte 5.
  - **Fin du jeu complète** : défaite de la Reine Cendrée, Chant à Deux, cinématique de fin, crédits, retour au village (Nalia morte, drapeau de fin posé) : OK, sans erreur.
  - Mise en page en portrait (390 × 780) : aucun bouton ne se chevauche.
- Bugs corrigés pendant les tests :
  - Pendant la quête de Mère Tikka, Fennek ne pouvait pas terminer sa propre quête.
  - Le bonus « Gardiens libérés » contre la Reine pouvait lui rendre sa vie au milieu du combat (il est maintenant appliqué dès son apparition).
  - Le Chant à Deux était impossible à gagner.
  - L'allié attaquait la Reine pendant le Chant à Deux, au lieu de chanter.
  - Les PNJ étaient dessinés comme du décor (plantage).
  - Des acteurs restaient visibles dans le plan de la tempête.
  - Le compteur des conseils de l'escorte était cassé.
  - L'interaction sur l'île renvoyait toujours « vrai ».
  - Le Gardien du Temple était attaquable hors quête.
  - Questions sur la vie mal comprises.
  - Plusieurs salles mal formées.

---

## 10. Ce qui reste à faire / ce qui demande ton intervention

1. **Les 3 boss finaux des grottes des îles** (Tortues, Phare, Étoiles).
   - Les arènes sont prêtes et scellées (stèle « ce boss sera créé plus tard, avec Sixte »).
   - Pour les brancher, dans `caves-iles.js` :
     - ajouter `boss:` (temps réel, à définir dans `rtbosses.js`) ou `battle:` (tour par tour, dans `battle.js`) ;
     - ajouter `reward:` et `final: true` ;
     - retirer `sealed`.
   - Les dessins se font dans `bestiary.js` et la musique dans `music.js` (`BOSS_COLORS`).
2. **Règles Firebase** : recoller `database.rules.json` dans la console (Realtime Database → Règles → Publier). Il y a une nouvelle règle `progress/{uid}`.
3. **Tests sur iPhone, à deux** :
   - Je n'ai pas pu tester le vrai réseau ni le tactile.
   - À vérifier : la taille des textes des dialogues, le bouton CHANT, le clavier de la question personnalisée, la fluidité dans les grosses salles pixel.
4. **Coopération dans les grottes** : on voit l'autre joueur s'il est dans la même salle, mais les ennemis, énigmes et coffres sont **propres à chaque joueur**. Une vraie coopération (ennemis partagés) demanderait de synchroniser les grottes : c'est un gros chantier, à discuter.
5. **Créatures secrètes des îles** (Tortue Ancienne, Hibou-Lanterne, Renard Céleste) : leurs combats existent mais elles ne sont pas encore placées sur les îles.
6. **Étape 2 des maquettes** :
   - Déjà fait : récolte, sac, atelier, chasse.
   - Pas encore fait : **la construction du village, l'adoption des animaux et le cheval monté**.
7. **Équilibrage** : les PV et dégâts des boss ont été réglés à l'estime. Ils demandent des parties réelles.
8. **Une vraie partie à la main** :
   - Toutes les quêtes ont été jouées de bout en bout par un script, avec les combats gagnés automatiquement, et tous les combats ont été testés à part.
   - Mais personne n'a encore joué une partie complète à la main : rythme, difficulté des énigmes, lisibilité des cinématiques sur un petit écran.
   - Le navigateur de test était caché : je n'ai pas pu regarder les dernières images moi-même.
9. **Publication** : rien n'a été publié, comme demandé. Avant de publier : augmenter `APP_CACHE` dans `sw.js`, la version du jeu (`menus.js`, `games/catalog.json`), et mettre à jour `RESUME.md`.
