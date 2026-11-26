# Les Échoués de Kalua — résumé du projet (à lire en début de conversation)

Jeu d'aventure à deux, en ligne, dans l'appli **Von** (dépôt `pierebest-pixel/von`, dossier `games/kalua/`), pensé pour jouer avec sa copine.
**Version publiée : 0.4** (26/11/2026). Les branches `main` et `kalua` sont identiques.

Documents à lire selon le besoin :
- **`design/kalua/LOG.md`** : le rapport détaillé du développement autonome (fichiers, systèmes, salles, boss, quêtes, tests, bugs).
- **`design/kalua/LORE.md`** : toute l'histoire du monde.
- **`design/kalua/maquettes-0.4/`** : 7 planches d'images tirées du vrai jeu.
  1. Intro
  2. Bestiaire
  3. Grottes
  4. Boss en temps réel
  5. Combats au tour par tour
  6. Habitants
  7. Monde et Nalia

## Règles de travail demandées par l'utilisateur
- Répondre en français, simplement.
- On valide chaque étape ensemble : **maquettes en images d'abord**, captures du vrai jeu avant de publier.
- Publier sur `main` **seulement quand l'utilisateur dit « publie »**.
- À chaque publication :
  - augmenter `APP_CACHE` dans `sw.js` (actuellement `von-app-v8`) ;
  - augmenter la version dans `games/kalua/menus.js` (écran titre) et dans `games/catalog.json`.
- L'utilisateur veut concevoir **lui-même les boss finaux des 3 grottes des îles** (6 Tortues, 7 Phare, 8 Étoiles). Ne pas les créer sans lui.
- Crédits de fin : **Sixte Maron** et **Claude**.
- Consignes de jeu :
  - **jamais de barre d'endurance** : course, esquive et attaques illimitées ; seuls les chants ont un temps de recharge ;
  - un point **rouge** au-dessus des PNJ des grandes quêtes, un point **noir** au-dessus de ceux qui apprennent un chant magique.

## Ce qui est fait

### Von (l'appli)
- Lanceur de jeux web pour iPhone : `index.html`, `app.js`, `app.css`, `sw.js`.
- Amis par tag (Firestore, `friends.js`, `firestore.rules`).
- Projet Firebase « von-en-ligne » : config dans `firebase-config.js`. Kalua utilise la **Realtime Database** (règles dans `database.rules.json`).

### Kalua 0.1 à 0.3.1 (étape 1)
- Créateur de personnage (7 onglets, dont ✨ Fancy). Les images des choix sont cliquables depuis la 0.3.1.
- « Mes îles » : on invite un ami, et chaque île est privée à deux.
- Jeu à deux en direct.
- La carte : 5 biomes, rivières, ponts, villages, animaux qui se promènent.
- Menu titre avec sa musique, menu en jeu.
- Vue dézoomée (encore plus en paysage), mini-carte en haut à droite, bouton menu ≡ à sa gauche.
- Musique du titre qui démarre bien sur iPhone.

### Kalua 0.4 (développement autonome, publié le 26/11/2026)
- **Lore complet** : l'Étoile tombée, le Cœur de Kalua, les Lumes, la Reine Ilaïa et la Grande Fêlure, la Cendre Noire, les 12 Gardiens, la prophétie des « deux cœurs ». Le grand secret : Nalia a provoqué le naufrage.
- **Introduction** : cinématique du naufrage de la Mouette d'Argent, réveil sur la plage, Nalia qui accompagne les joueurs jusqu'au village en leur donnant des conseils.
- **Nalia la guide** :
  - menu d'aide en 13 thèmes ;
  - **« Question personnalisée »** au clavier : elle cherche la réponse dans environ 260 fiches tirées des données du jeu, sans internet ;
  - on l'appelle partout avec la Conque d'appel ;
  - après sa mort, c'est Coco qui répond à sa place.
- **8 grottes, 117 salles** :
  - grottes 1, 3, 5 : temps réel, pixel art ;
  - grottes 2, 4, 8 : tour par tour ;
  - grottes 6, 7 : temps réel.
  - Pièges, énigmes, clés, passages secrets, 2 ou 3 mini-boss par grotte.
  - Boss : Mère-Racine, Amiral Nacre, Geôlier sans visage, Tempestaire, **Reine Cendrée** (boss final).
- **12 Gardiens** (boss optionnels au tour par tour) avec leurs mécaniques, repaires et récompenses. B1 et B9 se combattent en mer.
- **Deux systèmes de combat** :
  - temps réel : attaques annoncées au sol et protections à percer ;
  - tour par tour : timing pour frapper et parer, chants, statuts, attaques annoncées.
- **Magie : 6 chants** (Flamme, Racine, Marée, Bourrasque, Lueur, Onde), appris auprès de 6 maîtres au point noir. Ils servent au combat et aux énigmes.
- **Fils de vie** : Mère Tikka tisse 8 améliorations permanentes de la vie (de 5 à 13 cœurs) avec ce que donnent les animaux. Les animaux dorés donnent une Larme dorée.
- **Récolte, chasse, caresses, établi** (corde, torche, potion…), **forge de Brann** (hache, pioche, épée de corail, lame d'obsidienne).
- **31 PNJ vivants** : emploi du temps selon l'heure, commune aux deux joueurs (1 journée = 20 min), activités visibles, petites phrases. Il y a le jour, la nuit et le coucher du soleil.
- **5 grandes quêtes**, avec 3 cinématiques chacune :
  - Kéo (très longue, mort de Kéo) ;
  - Mère Tikka (très longue, l'âme de Mila) ;
  - Grand-père Oro (très longue, mort d'Oro) ;
  - Fennek (moyenne) ;
  - Lili (normale).
- **Quête du bateau** : l'enquête avec indices, témoins, construction et déduction, la nuit de la cloche, le Kraken, la mort de Bastien et l'aveu de Nalia. Elle débloque la navigation vers les 3 îles.
- **6 quêtes de magie** et **10 petites quêtes** : Tim, Jojo, Rosalie, Nouk, Bodo, Tobi, Arnaud le fantôme, Nana, Pipa, Brann.
- **Fin** :
  - combat final en 3 temps ;
  - phase spéciale au tour par tour « le Chant à Deux » : chanter tour à tour et tenir la main ;
  - sacrifice de Nalia, conclusion, crédits.
- **40 musiques** générées en direct (par région, par boss, par émotion) avec des fondus, plus 30 bruitages.
- Menu en jeu : Appeler Nalia, Quêtes (avec la quête suivie), Carte, Sac (on peut manger), Chants et vie, Journal et lore, Sauvegarde, Réglages.
- **Sauvegarde** de toute la progression dans le téléphone et en ligne (`islands/{id}/progress/{uid}`).

### Architecture du code (`games/kalua/`)
| Fichier | Rôle |
|---|---|
| `game.js` | écrans (chargement, créateur, Mes îles) |
| `play.js` | le jeu : modes île / grotte / combat / cinématique, actions, HUD, mini-carte, ambiance musicale |
| `state.js` | progression et sauvegarde (`Prog`) |
| `npcs.js` | habitants et emplois du temps (`NPC`) |
| `quests.js`, `quests2.js` | quêtes (`Quests`) |
| `story.js` | histoire principale, intro, fin, Gardiens, navigation (`Story`) |
| `guide.js` | savoir de Nalia (`Guide`) |
| `dialog.js` | dialogues |
| `cutscene.js` | cinématiques |
| `action.js` | combat en temps réel (`Act`) |
| `rtbosses.js` | boss en temps réel (`RTBoss`) |
| `battle.js` | combat au tour par tour (`Battle`) |
| `dungeon.js` | moteur des grottes (`Dungeon`) |
| `caves-1.js` … `caves-5.js`, `caves-iles.js` | les salles |
| `bestiary.js` | dessins des créatures et des boss (`Bosses`) |
| `items.js`, `items-data.js` | objets |
| `lore.js` | fragments de lore |
| `music.js` | musiques et bruitages |
| `menus.js` | menus |
| `avatar.js`, `map.js`, `world.js`, `creatures.js`, `net.js` | personnages, carte, monde, animaux, réseau (inchangés pour l'essentiel) |

### Tests (environnement local)
- Copie de test avec un **faux réseau**, dans le dossier temporaire de la session : `kalua-test/`, `fake-net.js`, `sync.sh`, `validate.js`, `harness.js`.
- `validate.js` vérifie les 117 salles : 0 problème.
- Testés sans erreur :
  - tous les boss en temps réel ;
  - les 26 combats au tour par tour ;
  - toutes les quêtes de bout en bout ;
  - la fin et les crédits.
- Astuce : quand le navigateur de test est caché, le jeu ne s'anime plus. On fait avancer les images à la main avec `frame()`, et on évite les `setTimeout`.

## Ce qu'il reste à faire

1. ⚠️ **Règles Firebase**
   - À faire par l'utilisateur : coller `database.rules.json` dans la console Firebase (Realtime Database → Règles → Publier).
   - Il y a une nouvelle règle `progress/{uid}` : sans elle, la sauvegarde en ligne de la progression risque d'être refusée. La sauvegarde dans le téléphone marche quand même.
2. **Les 3 boss finaux des grottes des îles** (Tortues, Phare, Étoiles), à concevoir avec l'utilisateur.
   - Les arènes sont prêtes et scellées (`sealed: true` dans `caves-iles.js`).
   - Pour en brancher un :
     - ajouter `boss:` (temps réel, dans `rtbosses.js`) ou `battle:` (tour par tour, dans `battle.js`) ;
     - ajouter `reward:` et `final: true` ;
     - retirer `sealed`.
   - Dessin dans `bestiary.js`, musique dans `music.js` (`BOSS_COLORS`).
   - Idées du lore : la grotte des Tortues est le nid sacré, avec la Tortue-Mère ; la grotte du Phare abrite la Cloche des Profondeurs ; la grotte des Étoiles est le cœur de l'étoile.
3. **Tester sur iPhone, à deux** :
   - le tactile, la lisibilité des dialogues et des cinématiques ;
   - le clavier de la question personnalisée ;
   - la fluidité des grottes en pixel art ;
   - le son.
   - **Personne n'a encore joué une partie complète à la main.**
4. **Équilibrage** : les PV et dégâts des boss, et la difficulté des énigmes, ont été réglés à l'estime.
5. **Coopération dans les grottes** : on voit l'autre joueur s'il est dans la même salle, mais les ennemis, énigmes et coffres sont propres à chaque joueur. Une vraie coop (grottes partagées) serait un gros chantier, à décider.
6. **Créatures secrètes des îles** (Tortue Ancienne, Hibou-Lanterne, Renard Céleste) : leurs combats existent dans `battle.js`, mais elles ne sont pas encore placées sur les îles.
7. **Reste de l'étape 2 des maquettes** : la construction du village, l'adoption des animaux (leur donner un nom, l'enclos, le lait, les œufs, la laine) et le **cheval qu'on monte**.
8. Petites améliorations possibles :
   - l'escorte de Nalia au début est un peu longue ;
   - le Gardien Mère-Racine est grand et dépasse en haut de l'écran sur petit écran ;
   - ajouter des icônes dessinées pour les nouveaux objets (aujourd'hui, ce sont des emojis) ;
   - nettoyer les anciennes images `shot1.png`, `shot2.png`, `shot3.png` du dossier du jeu.
