#!/bin/bash
# Usage : tools/stills.sh NN-nom  -> build/NN/sheet.jpg (une image par plan)
s=$1; n=${s%%-*}
T=$(python3 -c "import json;t=json.load(open('build/$n/timeline.json'));print(','.join(f\"{x['start']+x['dur']*0.6:.2f}\" for x in t['shots']))")
d=build/$n/stills_$(date +%s)
node tools/render.mjs stories/$s.mjs build/$n $d/s.jpg --still $T 2>&1 | grep -v -E "GL Driver|^still"
ls $d/*.jpg | sort -t_ -k3 -n > $d/list.txt
ffmpeg -v error -y $(while read f; do echo -n "-i $f "; done < $d/list.txt) -filter_complex "$(i=0; while read f; do echo -n "[$i]scale=240:-1[v$i];"; i=$((i+1)); done < $d/list.txt)$(i=0; while read f; do echo -n "[v$i]"; i=$((i+1)); done < $d/list.txt)xstack=inputs=$(wc -l < $d/list.txt):layout=$(python3 -c "
n=$(wc -l < $d/list.txt);print('|'.join(f'{(i%8)*240}_{(i//8)*427}' for i in range(n)))"):fill=black" build/$n/sheet.jpg
echo build/$n/sheet.jpg
