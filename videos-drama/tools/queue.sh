#!/bin/bash
# Rend une liste de vidéos à la suite : tools/queue.sh 05-xxx 07-yyy ...
cd "$(dirname "$0")/.."
for s in "$@"; do n=${s%%-*}
  node tools/render.mjs stories/$s.mjs build/$n out/$s.mp4 > build/$n/render.log 2>&1
done
