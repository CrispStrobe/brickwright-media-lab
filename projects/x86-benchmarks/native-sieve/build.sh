#!/bin/sh
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
out=${1:-$here/.build}
mkdir -p "$out/source"
cp "$here"/source/* "$out/source/"
cp "$here/LICENSE" "$out/LICENSE"
cc=${CC:-gcc}
"$cc" --version > "$out/compiler.txt"
"$cc" -m32 -march=i386 -O2 -ffreestanding -fno-builtin -fno-pic -fno-pie -fno-stack-protector -fno-asynchronous-unwind-tables -mno-sse -mno-mmx -msoft-float -nostdlib -c "$here/source/sieve.c" -o "$out/sieve.o"
"$cc" -m32 -march=i386 -c "$here/source/start.S" -o "$out/start.o"
ld -m elf_i386 -T "$here/source/link.ld" "$out/start.o" "$out/sieve.o" -o "$out/sieve.elf"
objcopy -O binary "$out/sieve.elf" "$out/SIEVE.BIN"
python3 - "$here" "$out" <<'PY'
import json,hashlib,sys
from pathlib import Path
here,out=map(Path,sys.argv[1:]);m=json.loads((here/'native-i80386.json').read_text());(out/'brickwright-media.json').write_text(json.dumps(m,indent=2)+'\n')
a={'version':'owned sieve 1, 20 passes / 8192 entries','sourceCommit':'see media-lab Git commit','compiler':{'name':(out/'compiler.txt').read_text().splitlines()[0],'options':'-m32 -march=i386 -O2 -ffreestanding -fno-builtin -fno-pic -fno-pie -fno-stack-protector -fno-asynchronous-unwind-tables -mno-sse -mno-mmx -msoft-float -nostdlib','link':'ld -m elf_i386 -T source/link.ld; objcopy -O binary','fpu':'absent; no floating-point code'},'files':{}}
for p in [out/'SIEVE.BIN',out/'LICENSE',*sorted((out/'source').iterdir())]:
 b=p.read_bytes();a['files'][str(p.relative_to(out))]={'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
(out/'assets.json').write_text(json.dumps(a,indent=2)+'\n');print(json.dumps(a['files']['SIEVE.BIN']))
PY
