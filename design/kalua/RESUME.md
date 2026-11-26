# Les Échoués de Kalua — résumé du projet (à lire en début de conversation)

Jeu à deux en ligne dans **Von** (`games/kalua/`), pensé pour jouer avec sa copine.
Publié dans Von en **version 0.3.1** (branches `main` et `kalua` identiques au moment de ce résumé).

## Règles de travail demandées par l'utilisateur
- **Chaque étape est validée ensemble** : ne rien coder sans accord ; montrer d'abord des **maquettes en images**, puis des captures du vrai jeu avant de publier.
- Répondre en français, simplement.
- Publier sur `main` seulement quand l'utilisateur dit « publie ».

## Von (l'appli) — déjà fait
- Lanceur de jeux web pour iPhone : `index.html`, `app.js`, `app.css`, `sw.js` (penser à augmenter `APP_CACHE` à chaque publication, actuellement `von-app-v6`).
- **Amis** : tag unique par joueur (Réglages → Profil), onglet Amis, « Trouver un ami » par tag, demandes à accepter. Firebase **Firestore** + connexion anonyme (`friends.js`, `firestore.rules`).
- Projet Firebase **« von-en-ligne »** : config dans `firebase-config.js` (dont `databaseURL` Realtime Database europe-west1).
- Kalua utilise **Realtime Database** ; règles dans `database.rules.json`. ⚠️ L'utilisateur doit les coller dans la console (Realtime Database → Règles → Publier) ; pas encore confirmé.

## Décisions de design validées
- **Nom** : Les Échoués de Kalua. **Icône** : A, carte au trésor.
- **Style** : « simple et doux » (pastel, livre illustré) pour l'île, le village, les PNJ et les grottes 2, 4, 6, 7, 8. **Pixel art aventure** pour les grottes 1, 3 et 5.
- **Jeu visible par tous** dans le catalogue ; chaque île est privée entre ses 2 membres (invitation d'un ami Von).
- **Commandes** : flèches directionnelles (pas de joystick) + 4 boutons : **Taper** (frapper, couper le bois, casser les rochers), **Ramasser**, **Esquiver** (roulade), **Sprint**. Jouable en **portrait et paysage**.
- **Créateur de personnage** très complet, 7 onglets : Corps, Visage, Cheveux, Tenue, Accessoires, Maquillage, ✨ Fancy (squelette, catrina, oreilles, cornes, ailes, queue, aura…).
- **Carte** (`carte-v5.jpg`) : grande île en **5 biomes** (Côte Dorée au sud avec l'épave et « votre village » ; Jungle Émeraude à l'ouest ; Marais des Brumes au nord-ouest ; Falaises des Vents à l'est ; Volcan de Kalua au nord). Pas de brouillard. Rivières avec ponts, sentiers, villages et décors dans chaque biome.
  - **3 îles autour** (Île aux Tortues, Île du Phare, Îlot aux Étoiles), accessibles **en bateau après une quête de PNJ**.
- **8 grottes** : 1 Racines (Jungle, temps réel, pixel) · 2 Marine (Côte, tour par tour, doux) · 3 Brumes (Marais, temps réel, pixel) · 4 Vent (Falaises, tour par tour, doux) · 5 Cœur du Volcan (**boss final**, pixel) · 6 Tortues (temps réel, doux) · 7 Phare (temps réel, doux) · 8 Étoiles (tour par tour, doux).
- **Boss final** (grotte 5) : phase 1 en temps réel découpée en **3 temps** (à 66 % et 33 % de vie), puis **phase 2 au tour par tour « spéciale »** que l'utilisateur détaillera.
- **10 PNJ** (2 par biome) : énigmes, quiz, puzzles. Leurs récompenses débloquent la suite (pont, bottes, corde, masque, radeau…).
- **12 boss optionnels au tour par tour** (`boss-optionnels.jpg`). **B1** Roi Crabe Corail, **B2** Petit Kraken et **B9** Aigle-Roi sont **en mer**, accessibles en bateau après la quête de PNJ.
- **Bestiaire** (`bestiaire.jpg`) : 4 espèces par biome, 3 inoffensives (tuables pour leurs matériaux) et 1 agressive. Dans la Jungle (Sangliers épineux) et le Marais (Crocos des brumes), l'agressive **attaque en groupe**.
  - **3 créatures secrètes**, une par île : Tortue Ancienne, Hibou-Lanterne, Renard Céleste. Inoffensives ; si on les attaque, **combat au tour par tour**.
  - **Animaux partout** (vache, cochon, chèvre, mouton, poule, canard, **cheval montable**, chien, chat, lapin) : adoptables ou tuables.
- **Menus** (`menus-et-icones.jpg`) : menu titre animé (Jouer / Mon personnage / Réglages) ; menu en jeu ≡ (Reprendre, Carte, **Sac**, **Sauvegarde**, Mon personnage, Réglages, Mes îles, Menu titre) ; réglages (sons, musique, vibrations, taille des boutons, gaucher, pseudos, zoom).
- **Musique du titre** : épique + mignonne + rythmée (`kalua-titre.mp3`), composée en Web Audio (`music.js`).

## Plan des étapes
1. ✅ **Étape 1** (publiée en 0.3) : personnage, Mes îles et invitation, jeu à deux en direct, carte complète, décor, animaux qui se promènent, menus, musique du titre.
   - ✅ **0.3.1** (retouches avant l'étape 2) : vignettes du créateur enfin cliquables (le toucher tombait sur le dessin), vue dézoomée (encore plus en paysage), mini-carte de toute l'île en haut à droite (touche = grande carte), bouton menu ≡ à gauche de la mini-carte, musique du titre débloquée au relâchement du doigt (exigence de Safari sur iPhone).
2. ⏳ **Étape 2** : récolte, sac, atelier (recettes), construction du village, adoption, chasse, cheval. Maquettes dans `etape2-maquettes.jpg`, **en attente de validation**.
3. ⏳ **Étape 3** : les 10 PNJ et leurs énigmes (éventuellement des questions personnalisées sur le couple, stockées dans l'île privée et jamais en clair dans le code).
4. ⏳ **Étape 4** : grottes, combats (temps réel et tour par tour), boss, créatures agressives, boss optionnels.

## Code de Kalua (`games/kalua/`)
- `index.html`, `style.css` : écrans et HUD.
- `avatar.js` : options et dessin des personnages.
- `net.js` : Firebase Realtime Database. Chemins : `islands/{id}` (members, players, pos), `userIslands/{uid}` ; heure serveur via `Net.now()`.
- `map.js` : géographie en unités carte 1600×1000, avec 1 unité = 14 px monde. Contient biomes, relief, rivières, sentiers, ponts, PLACES, CAVES, NPCS, BOSSES, ANIMAL_ZONES, et le rendu du sol en tuiles de 512 px.
- `world.js` : décor généré par morceaux, collisions (mer, rivières sauf ponts, lave), dessin.
- `creatures.js` : dessins des animaux (repris du bestiaire) et promenades déterministes (identiques pour les 2 joueurs).
- `menus.js` : réglages, menu titre, menu en jeu, carte, sac, sauvegarde.
- `music.js` : musique.
- `game.js` : créateur, Mes îles, boucle de jeu, commandes, synchronisation.
- `design/kalua/items-maquette.js` : icônes des ~50 objets de l'étape 2, à réutiliser.

## Tests (environnement cloud)
- Émulateurs Firebase (auth + database) avec firebase-tools, en passant `NO_PROXY` pour le localhost.
- Charger les règles via `curl --noproxy '*' -X PUT -H "Authorization: Bearer owner" --data-binary @database.rules.json "http://127.0.0.1:9000/.settings/rules.json?ns=demo-von"`.
- Playwright : 2 contextes iPhone, CDN gstatic redirigé vers `node_modules/firebase`, `firebase-config.js` remplacé par une config d'émulateur (`databaseURL: https://demo-von.firebaseio.com`).
- La vraie base `*.firebasedatabase.app` n'est pas joignable depuis le conteneur.
