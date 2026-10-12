#!/usr/bin/env bash
# Reproduce FORTH.COM — zForth, the SAME tiny libre Forth the lab ships as a
# DOS program (projects/forth-dos), recompiled for a NON-DOS target: a Z80
# CP/M 2.2 .COM. It runs on the bw-board Z80 machine's CP/M layer (the one lite
# boots BBC BASIC and the cpm-software demos on), proving the interpreter — and
# therefore a Code-tab Forth program's source — is target-portable; only the
# run backend is machine-specific.
#
# zForth (Ico Doornekamp / zevv, MIT) is a small C VM (src/zforth/zforth.c) plus
# a Forth-source bootstrap (forth/core.zf). The DOS build uses float cells and
# the C library's printf/sscanf/fopen; none of that is SDCC-z80 friendly, so
# this build:
#   - uses a 32-bit INTEGER cell (zfconf.h) — SDCC-z80 has no cheap float, so
#     division is integer (7/2 == 3). This is the one semantic gap versus the
#     float-cell DOS build, and it is deliberate and recorded.
#   - sends output through BDOS function 2 (cpmmain.c, inline asm — no printf),
#   - EMBEDS the Forth program (prog.fth) as a C string (no CP/M file I/O),
#   - compiles with ZF_ENABLE_TRACE 0, so no va_list is emitted.
#
# Toolchain (both free software, widely packaged):
#   sdcc    — the Small Device C Compiler with the z80 port   apt: sdcc
#   sdasz80 — the SDCC Z80 assembler (ships with sdcc)
#
# The prebuilt FORTH.COM is committed so the manifest runs without a toolchain;
# run this only to reproduce it from source.
set -euo pipefail
cd "$(dirname "$0")"
here="$(pwd)"

command -v sdcc    >/dev/null || { echo "need 'sdcc' with the z80 port (apt install sdcc)"; exit 2; }
command -v sdasz80 >/dev/null || { echo "need 'sdasz80' (ships with sdcc)"; exit 2; }

ZF_REPO="https://github.com/zevv/zForth.git"
ZF_COMMIT="41db72d165c1539d57f3f79970fc57ea881a79dc"
work="${ZF_WORK:-$here/.zforth-build}"
mkdir -p "$work"

# 1. Clone the interpreter at the pinned commit.
if [ ! -d "$work/zForth/.git" ]; then git clone "$ZF_REPO" "$work/zForth"; fi
git -C "$work/zForth" fetch --depth 1 origin "$ZF_COMMIT" || true
git -C "$work/zForth" checkout -q "$ZF_COMMIT"

zf="$work/zForth"
mkdir -p "$zf/cpminc"
cp "$here/cpmmain.c" "$zf/cpmmain.c"
cp "$here/crt0.s"    "$zf/crt0.s"
cp "$here/zfconf.h"  "$zf/cpminc/zfconf.h"

# 2. Embed the language bootstrap (forth/core.zf — the language only; the stock
#    misc.zf FizzBuzz demo and memaccess.zf load-time asserts are excluded) and
#    the user program (prog.fth) as C strings.
emit_inc () { # <src.zf> <symbol> <out.inc>
	python3 - "$1" "$2" "$3" <<'PY'
import sys
src, sym, out = sys.argv[1], sys.argv[2], sys.argv[3]
lines = []
for line in open(src, encoding='utf-8'):
	line = line.rstrip('\n')
	esc = line.replace('\\', '\\\\').replace('"', '\\"')
	lines.append('"%s\\n"' % esc)
open(out, 'w').write('static const char %s[] =\n%s;\n' % (sym, '\n'.join(lines)))
PY
}
emit_inc "$zf/forth/core.zf" BOOTSTRAP "$zf/bootstrap.inc"
emit_inc "$here/prog.fth"    PROG      "$zf/prog.inc"

# 3. Compile each unit to a .rel, link with the CP/M crt0, carve the .COM from
#    the Intel-HEX extent (no padding).
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
echo "b8752e776d1d5e874d220b507fbe17def92eaea64160e39ce66484cf1f764e4e  FORTH.COM"
