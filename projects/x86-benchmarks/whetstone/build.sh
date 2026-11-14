#!/bin/sh
# SPDX-License-Identifier: MIT
# Source stays unmodified. Separate outputs identify CPU and floating-point mode.
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
variant=${1:-8086}
fpu=${2:-absent}
case "$variant" in 8086|80186|80286) ;; *) echo '16-bit build only: choose 8086, 80186 or 80286; no DJGPP/native-386 substitute' >&2; exit 2;; esac
if [ "$fpu" != absent ]; then
 echo 'FPU-present build/execution is blocked: no executing x87 backend is qualified. Do not mix with software FP.' >&2
 exit 2
fi
out=${3:-$here/.build/$variant-$fpu}
mkdir -p "$out/source"
python3 - "$here/source/whetstone.c" <<'PYVERIFY'
import hashlib,sys
assert hashlib.sha256(open(sys.argv[1],'rb').read()).hexdigest()=='333e4ceca042c146f63eec605573d16ae8b07166cbc44a17bec1ea97c6f1efbf', 'source digest mismatch'
PYVERIFY
cc=${IA16_GCC:-ia16-elf-gcc}
"$cc" --version > "$out/compiler.txt"
cp "$here/source/whetstone.c" "$out/source/whetstone.c"
cp "$here/LICENSE" "$out/LICENSE"
"$cc" -mcmodel=medium -march=i"$variant" -O2 -fno-builtin -DPRINTOUT \
 "$out/source/whetstone.c" -lm -o "$out/WHT.EXE"
python3 - "$here" "$out" "$variant" <<'PY'
import hashlib,json,sys
from pathlib import Path
here,out=map(Path,sys.argv[1:3]);variant=sys.argv[3]
proof=json.loads((here/'assets.json').read_text());manifest=json.loads((here/'brickwright-media.json').read_text())
manifest['slots']['exe']='WHT.EXE';manifest['program']['variant']=variant
proof['compiler'].update({'name':(out/'compiler.txt').read_text().splitlines()[0],'options':['-mcmodel=medium','-march=i'+variant,'-O2','-fno-builtin','-DPRINTOUT'],'link':['-lm'],'fpu':'absent; GCC ia16 software floating point'})
b=(out/'WHT.EXE').read_bytes();proof['files']['WHT.EXE']={'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
(out/'assets.json').write_text(json.dumps(proof,indent=2)+'\n');(out/'brickwright-media.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(proof['files']['WHT.EXE']))
PY
