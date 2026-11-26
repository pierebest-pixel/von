#!/bin/bash
# Prend la prochaine vidéo dans build/queue.txt (une par ligne) et la rend, jusqu'à épuisement.
cd "$(dirname "$0")/.."
while true; do
  s=$(flock build/queue.lock bash -c 'h=$(head -n1 build/queue.txt); [ -n "$h" ] && sed -i 1d build/queue.txt; echo "$h"')
  [ -z "$s" ] && break
  n=${s%%-*}
  while [ ! -f build/$n/audio.wav ]; do sleep 20; done
  node tools/render.mjs stories/$s.mjs build/$n out/$s.mp4 --fps 25 > build/$n/render.log 2>&1
done
