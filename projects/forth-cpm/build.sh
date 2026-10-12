#!/usr/bin/env bash
# Reproduce FORTH.COM — zForth, the SAME tiny libre Forth the lab ships as an
# 8086 DOS program (projects/forth-dos), recompiled for a NON-DOS target: a Z80
# CP/M 2.2 .COM that runs on the bw-board Z80 machine's CP/M layer. Like
# forth-dos it reads its program from a mounted file PROG.FTH (here over CP/M
# BDOS open/read-sequential), so it runs ARBITRARY Code-tab Forth output, not a
# fixed demo. It proves the interpreter — and a Code-tab Forth program's source
# — is target-portable; only the run backend is machine-specific.
#
# zForth's DOS build uses float cells and printf/sscanf/fopen, none SDCC-z80
# friendly. This build uses a 32-bit INTEGER cell (zfconf.h) — division is
# integer (7/2 == 3), the one deliberate semantic gap versus the float-cell DOS
# build — sends output through BDOS function 2 (cpmmain.c, no printf), reads
# PROG.FTH over BDOS (no C library file I/O), and compiles with ZF_ENABLE_TRACE
# 0 (no va_list).
#
# Toolchain (free software): sdcc (z80 port) + sdasz80 (apt install sdcc).
# The prebuilt FORTH.COM is committed so the manifest runs without a toolchain.
set -euo pipefail
cd "$(dirname "$0")"
here="$(pwd)"

command -v sdcc    >/dev/null || { echo "need 'sdcc' with the z80 port (apt install sdcc)"; exit 2; }
command -v sdasz80 >/dev/null || { echo "need 'sdasz80' (ships with sdcc)"; exit 2; }

ZF_REPO="https://github.com/zevv/zForth.git"
ZF_COMMIT="41db72d165c1539d57f3f79970fc57ea881a79dc"
work="${ZF_WORK:-$here/.zforth-build}"
mkdir -p "$work"

if [ ! -d "$work/zForth/.git" ]; then git clone "$ZF_REPO" "$work/zForth"; fi
git -C "$work/zForth" fetch --depth 1 origin "$ZF_COMMIT" || true
git -C "$work/zForth" checkout -q "$ZF_COMMIT"

zf="$work/zForth"
mkdir -p "$zf/cpminc"
cp "$here/cpmmain.c" "$zf/cpmmain.c"
cp "$here/crt0.s"    "$zf/crt0.s"
cp "$here/zfconf.h"  "$zf/cpminc/zfconf.h"

# Embed the language bootstrap (forth/core.zf only).
python3 - "$zf" <<'PY'
import sys
zf = sys.argv[1]
lines = []
for line in open(zf + '/forth/core.zf', encoding='utf-8'):
	line = line.rstrip('\n')
	esc = line.replace('\\', '\\\\').replace('"', '\\"')
	lines.append('"%s\\n"' % esc)
open(zf + '/bootstrap.inc', 'w').write('static const char BOOTSTRAP[] =\n%s;\n' % '\n'.join(lines))
PY

( cd "$zf"
  sdasz80 -o crt0.rel crt0.s
  sdcc -mz80 -c -I cpminc -I src/zforth src/zforth/zforth.c -o zforth.rel
  sdcc -mz80 -c -I cpminc -I src/zforth cpmmain.c -o cpmmain.rel
  sdcc -mz80 --no-std-crt0 --code-loc 0x0113 crt0.rel cpmmain.rel zforth.rel -o zfcpm.ihx
  node - zfcpm.ihx "$here/FORTH.COM" <<'JS'
const fs = require('fs');
const [,, ihx, out] = process.argv;
const mem = new Map(); let max = 0;
for (const L of fs.readFileSync(ihx, 'utf8').split(/\r?\n/)) {
  if (L[0] !== ':') continue;
  const len = parseInt(L.substr(1, 2), 16), addr = parseInt(L.substr(3, 4), 16), type = parseInt(L.substr(7, 2), 16);
  if (type !== 0) continue;
  for (let k = 0; k < len; k++) { const a = addr + k; mem.set(a, parseInt(L.substr(9 + k * 2, 2), 16)); if (a > max) max = a; }
}
const buf = Buffer.alloc(max - 0x100 + 1, 0);
for (const [a, v] of mem) if (a >= 0x100) buf[a - 0x100] = v;
fs.writeFileSync(out, buf);
console.log(`${out}: ${buf.length} bytes`);
JS
)

echo "Built. sha256 of the shipped binary:"
sha256sum "$here/FORTH.COM"
echo "expected:"
echo "80f30b853e2cd7c886bdf31c2ece93321884e8b5f0994fa16d49a39de897f2a0  FORTH.COM"
