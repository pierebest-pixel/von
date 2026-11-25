# Von

Lanceur de jeux pour iPhone (appli web installable). On ajoute des jeux au catalogue ;
dans Von, on les installe d'un geste et ils marchent ensuite hors connexion.

## Installer Von sur l'iPhone
1. Ouvre l'adresse de Von dans **Safari**.
2. Touche le bouton **Partager**, puis **« Sur l'écran d'accueil »**.
3. Lance Von depuis son icône.

## Ajouter un jeu
1. Crée un dossier `games/<id-du-jeu>/` avec au moins `index.html` (le jeu en HTML/JS),
   une icône carrée (ex. `icon.png`, 256×256) et éventuellement des captures (format portrait).
2. Dans `index.html`, inclure le SDK : `<script src="../von-sdk.js"></script>`
   - `Von.score(n)` enregistre un score (Von garde le meilleur)
   - `Von.onPause(fn)`, `Von.onResume(fn)`, `Von.onRestart(fn)` pour le menu pause
   - `Von.sound` vaut `false` si le son est coupé dans les Réglages
3. Ajoute le jeu dans `games/catalog.json` :

```json
{
  "id": "serpent",
  "name": "Serpent",
  "category": "Arcade",
  "players": "Un joueur",
  "version": "1.0",
  "addedAt": "2026-11-25",
  "size": 840000,
  "controls": "Glisser le doigt",
  "description": "Mange les pommes sans te mordre la queue.",
  "icon": "icon.png",
  "screenshots": ["shot1.png", "shot2.png"],
  "files": ["index.html", "game.js", "icon.png", "shot1.png", "shot2.png"]
}
```

`files` liste **tous** les fichiers à télécharger lors de l'installation.
Pour publier une nouvelle version d'un jeu, augmente `version` : Réglages → « Rechercher des mises à jour ».

## Mettre à jour l'appli Von
Après une modification de l'appli, change `APP_CACHE` dans `sw.js` (ex. `von-app-v2`).

## Amis
Chaque joueur reçoit un tag unique (ex. `#K7P2QX`) visible dans Réglages → Profil et dans l'onglet Amis.
On ajoute un ami en entrant son tag dans « Trouver un ami » ; il accepte ou refuse la demande.
Les données sont dans Firebase (Firestore + connexion anonyme) :
- `firebase-config.js` : la configuration du projet Firebase (tant qu'elle vaut `null`, les amis sont « bientôt disponibles ») ;
- `firestore.rules` : les règles de sécurité, à copier dans la console Firebase (Firestore → Règles).

## Fichiers
- `index.html`, `app.css`, `app.js` : l'appli
- `friends.js`, `firebase-config.js`, `firestore.rules` : les amis
- `sw.js` : fonctionnement hors connexion
- `games/` : catalogue, SDK et jeux
- `icons/` : icône et logo
- `design/` : maquettes validées et générateur de l'icône
