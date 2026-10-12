#!/usr/bin/env bash
# Reproduce FORTH.EXE — zForth, a tiny libre Forth, as a DOS-native 8086 program.
#
# zForth (Ico Doornekamp / zevv, MIT) is a tiny embeddable Forth: a small C VM
# (src/zforth/zforth.c) plus a Forth-source bootstrap (forth/core.zf) that
# defines the language (`:` `;` `if/else/fi` `begin/until/again` `." ` `.` `emit`
# `cr` …). Unlike ACK (a host cross compiler) this program is ITSELF a 16-bit
# MS-DOS executable: it runs ON the bw-board 8086 DOS service layer, reads a
# Forth program from PROG.FTH via INT 21h file I/O, and prints via the C library.
# It is the Forth entry in the lab's DOS-native interpreter set alongside BASIC
# (ubasic-dos), C (small-c), Lisp (fe-dos) and Tcl (tcl-dos) — a real interpreter
# running on the machine, not merely one whose output does. (f83 / volksforth are
# interactive REPLs; zForth is the file-reading Forth that fits the PROG.<X>
# contract the other DOS-native interpreters use.)
#
# Build tool: ia16-elf-gcc (the tkchia GCC port for 16-bit x86, GPL — used only
# as a BUILD tool; the produced program links newlib + libi86, both permissive).
# Debian/Ubuntu: the 'gcc-ia16-elf' package (apt install gcc-ia16-elf).
#
# The prebuilt FORTH.EXE is committed so the manifest runs without a toolchain;
# run this only to reproduce it from source.
set -euo pipefail

ZF_REPO="https://github.com/zevv/zForth.git"
ZF_COMMIT="41db72d165c1539d57f3f79970fc57ea881a79dc"
CC="${IA16_GCC:-ia16-elf-gcc}"

here="$(cd "$(dirname "$0")" && pwd)"
work="${ZF_WORK:-$here/.zforth-build}"
mkdir -p "$work"

# 1. Clone the interpreter at the pinned commit.
if [ ! -d "$work/zForth/.git" ]; then
	git clone "$ZF_REPO" "$work/zForth"
fi
git -C "$work/zForth" fetch --depth 1 origin "$ZF_COMMIT" || true
git -C "$work/zForth" checkout -q "$ZF_COMMIT"

# 2. DOS front-end (dosmain.c): reads PROG.FTH and evaluates it, and embeds the
#    language bootstrap. Nothing in zForth's own sources is modified.
cp "$here/dosmain.c" "$work/zForth/dosmain.c"

# 3. Embed ONLY the language bootstrap (forth/core.zf) as a C string. The stock
#    build also loads demo/library .zf files (misc.zf is a FizzBuzz demo,
#    memaccess.zf runs load-time asserts) — those print at startup, so they are
#    deliberately excluded. core.zf alone defines the full language.
python3 - "$work/zForth" <<'PY'
import sys
root = sys.argv[1]
out = []
for line in open(root + '/forth/core.zf', encoding='utf-8'):
	line = line.rstrip('\n')
	esc = line.replace('\\', '\\\\').replace('"', '\\"')
	out.append('"%s\\n"' % esc)
open(root + '/bootstrap.inc', 'w').write('static const char BOOTSTRAP[] =\n' + '\n'.join(out) + ';\n')
PY

# 4. Cross-compile to a real 16-bit MS-DOS MZ .EXE.
#    -march=any_186: the bw-board DOS bench runs the '80186' variant for C.
#    -mcmodel=medium: zForth's zf_cell is `float` (the stock src/linux/zfconf.h),
#    so soft-float + %g pull in enough code to need the medium model (as fe-dos
#    does). The bootstrap.inc sits in the clone root; zforth.h is in src/zforth,
#    zfconf.h in src/linux.
( cd "$work/zForth" && "$CC" -mcmodel=medium -march=any_186 -O2 -Wall \
	-I src/zforth -I src/linux \
	dosmain.c src/zforth/zforth.c -o "$here/FORTH.EXE" )

echo "Built. sha256 of the shipped binary:"
sha256sum "$here/FORTH.EXE"

cat <<'EOF'

Run it on the emulated 8086 (from a bw-board checkout), with a Forth program
mounted as PROG.FTH on the DOS disk:

  node scripts/run-dos.mjs FORTH.EXE --preset xt --variant 80186 \
       --file PROG.FTH=samples/demo.fth --max 200000000 --quiet
  => zForth on DOS (8086) / 49 42 64 5 4 3 2 1

In brickwright-lite the same FORTH.EXE runs on the browser DOS bench (the i8086
machine), reading the user's Forth source mounted as PROG.FTH.
EOF
