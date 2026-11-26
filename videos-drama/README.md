# Drama House — 10 vidéos TikTok

Mini-studio qui fabrique des vidéos verticales (1080×1920) façon « drama » :
persos 3D cubiques, ville colorée, voix off française, sous-titres mot à mot,
étiquettes de chapitre, chronos, calendriers « JOUR », textes d'impact.

| # | Histoire | Ton |
|---|----------|-----|
| 01 | Le Piment du Diable | drôle |
| 02 | Les avions en papier | triste |
| 03 | La maison des Corbeaux | horreur / gore |
| 04 | Le GPS de Jean-Mi | drôle |
| 05 | Le croissant de 6h | émouvant |
| 06 | L'ascenseur | horreur / gore |
| 07 | Le zombie végétarien | drôle / gore |
| 08 | La dernière course | triste / inspirant |
| 09 | Le colocataire | flippant / drôle |
| 10 | Le critique | drame / émouvant |

## Fabriquer une vidéo

```bash
npm install                      # three.js + police Poppins
pip install kokoro-onnx soundfile numpy
# modèle de voix (Kokoro v1.0, voix française ff_siwis) dans $TTS_DIR :
#   kokoro-v1.0.onnx et voices-v1.0.bin
#   https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
TTS_DIR=/chemin/vers/modele python3 tools/build_audio.py stories/01-piment-du-diable.mjs build/01
node tools/render.mjs stories/01-piment-du-diable.mjs build/01 out/01-piment-du-diable.mp4
```

- `stories/*.mjs` : le scénario, plan par plan (texte dit, décor, acteurs, caméra, effets).
- `render/engine.js` : moteur Three.js (persos, décors, animations, overlays).
- `tools/build_audio.py` : voix off, minutage des sous-titres, musique et bruitages générés, mixage.
- `tools/render.mjs` : rendu image par image dans Chromium + encodage ffmpeg.
- `tools/stills.sh NN-nom` : planche d'aperçu (une image par plan).
