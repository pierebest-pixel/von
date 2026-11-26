# Construction, village et décoration — plan (maquettes v2 à valider)

Les 10 planches de ce dossier montrent tout le système avant de le brancher dans le jeu. Les dessins sont déjà du vrai code :
`games/kalua/buildings.js` (bâtiments + village), `games/kalua/decor.js` (déco intérieure), `games/kalua/outdoor.js` (déco extérieure),
`games/kalua/clothes.js` (vêtements). Refaire les images : `node capture.js`.

## Décisions prises avec toi
- Château = **25 pièces** (5 / 10 / 15 / 20 / 25).
- Démonter un bâtiment rend **toutes** les ressources.
- Dormir fait passer la nuit ; à deux, seulement si les deux sont couchés.
- Statuettes des Gardiens : débloquées en **libérant** chaque Gardien.
- Firebase : nouvelles règles à recoller (village commun) ; en solo, tout reste dans le téléphone.

## Ce que montrent les planches
| Planche | Contenu |
|---|---|
| 1 | La maison : Cabane → Maison → Grande maison → Manoir → Château, qui grandit sur la carte. |
| 2 | **50 bâtiments** constructibles (28 d'avant, tous redessinés, + **22 du quotidien** : piscine, aire de jeux, café, boulangerie, glacier, crêperie, pizzeria, grill du port, salon de thé, marché couvert, fleuriste, épicerie, poste, bibliothèque, école, maison des soins, kiosque à musique, bains chauds, cinéma en plein air, terrain de sport, atelier de couture, auberge). |
| 8 | **Le village de base reconstruit** : mairie avec horloge, place de l'Étoile et sa fontaine, Le Fil d'Or (vêtements), La Marmite de Kalua (restaurant), auberge, bibliothèque, café, boulangerie, glacier, marché couvert, fleuriste, ponton, habitants qui y vivent. |
| 3 | Pose libre partout sur l'île, village commun, chantier partagé. |
| 4 | Les pièces, chargées par leur porte ; plan de la maison. |
| 5 | Décorer la maison (menu ≡) ; objets utilisables. |
| 9 | **Le Fil d'Or** : 15 types × 200 modèles = **3 000 vêtements** (20 coupes × 10 coloris par type), puis retouche libre : 3 couleurs (28 pastilles + roue), 16 motifs, 24 imprimés. Gratuits, rangés dans l'armoire. |
| 6–7 | **247 objets de déco intérieure**, dont 31 de Noël. |
| 10 | **220 décorations d'extérieur** : jardin (40), mobilier (24), lumières (20), clôtures et chemins (18), eau (14), jeux (14), marché (18), plage (16), Kalua et Lumes (14), fêtes (9), Noël (20), divers (13). |

## Le nouveau style
Boîte à outils commune (`BUILD.kit`) : murs dégradés et texturés (planches, rondins, pierre, briques, enduit, colombages, bardeaux), toits à tuiles / ardoises / chaume / palmes / bardeaux, pignons, tours à toit conique, fenêtres à volets et jardinières, portes à perron et lanternes, auvents rayés, enseignes, cheminées qui fument, ombres douces, contours fins, lumière venant du haut à gauche. Dans le jeu, chaque bâtiment est dessiné une fois dans une image en cache (fluide sur iPhone).

## Ajouts que je propose en plus
- **Mairie** : projets du village (fêtes, nouveaux habitants, embellissements), registre des habitants, renommer l'île.
- **Restaurants** : plats qui soignent et donnent des bonus (vitesse, recharge des chants, cœurs en plus pour un temps).
- **Habitants** qui tiennent les commerces (Rosalie au Fil d'Or, etc.), se promènent sur la place, se parlent.
- **Fêtes de saison** sur la place (marché de Noël en décembre).
- **Armoire** dans la maison pour ranger les vêtements portés.

## Ordre de développement (une fois validé)
1. Moteur de construction (pose libre, règles, village commun en ligne / solo), démontage.
2. Le village de base remplacé par le nouveau, avec ses habitants et commerces.
3. Les 50 bâtiments et leurs effets ; la maison et son chantier partagé.
4. Intérieurs : pièces chargées par les portes ; décoration (247 objets) ; dormir.
5. Le Fil d'Or : catalogue, retouche, vêtements dessinés sur le personnage (le créateur de personnage gagne les 15 types).
6. Déco extérieure (220).
7. Captures du vrai jeu à valider, puis publication quand tu dis « publie ».
