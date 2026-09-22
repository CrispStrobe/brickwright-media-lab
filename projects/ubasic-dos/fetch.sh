#!/usr/bin/env bash
# Reproduce UBASIC.EXE — a libre, DOS-native BASIC interpreter for the 8086.
#
# uBASIC (Adam Dunkels, 2006; Danyil Bohdan, 2013 — BSD-3-Clause) is a tiny
# line-numbered BASIC interpreter in portable C. Unlike ACK (a host cross
# compiler) this program is ITSELF a 16-bit MS-DOS executable: it runs on the
# bw-board 8086 DOS service layer, reads a BASIC program from PROG.BAS via
# INT 21h file I/O, and prints results via the C library (INT 21h/INT 10h).
# It is the DOS-native complement to Small-C — a libre BASIC that runs ON the
# machine, not merely one whose output does.
#
# Build tool: ia16-elf-gcc (the tkchia GCC port for 16-bit x86, GPL — used only
# as a BUILD tool; the produced program links newlib + libi86, both permissive).
# Debian/Ubuntu: the 'gcc-ia16-elf' package (apt install gcc-ia16-elf).
#
# The prebuilt UBASIC.EXE is committed so the manifest runs without a toolchain;
# run this only to reproduce it from source.
set -euo pipefail

UBASIC_REPO="https://github.com/adamdunkels/ubasic.git"
UBASIC_COMMIT="cc07193c231e21ecb418335aba5b199a08d4685c"
CC="${IA16_GCC:-ia16-elf-gcc}"

here="$(cd "$(dirname "$0")" && pwd)"
work="${UBASIC_WORK:-$here/.ubasic-build}"
mkdir -p "$work"

# 1. Clone the interpreter core at the pinned commit.
if [ ! -d "$work/ubasic/.git" ]; then
	git clone "$UBASIC_REPO" "$work/ubasic"
fi
git -C "$work/ubasic" fetch --depth 1 origin "$UBASIC_COMMIT" || true
git -C "$work/ubasic" checkout -q "$UBASIC_COMMIT"

# 2. Two small, self-contained changes on top of upstream:
#    a) widen VARIABLE_TYPE from char to int (16-bit ints, so 6*7 etc. do not
#       overflow an 8-bit accumulator);
#    b) add a DOS front-end (dosmain.c) that reads PROG.BAS and runs it — the
#       upstream use-ubasic.c hardcodes its program, which is no use in the tab.
sed -i 's/#define VARIABLE_TYPE char/#define VARIABLE_TYPE int/' "$work/ubasic/vartype.h"
cp "$here/dosmain.c" "$work/ubasic/dosmain.c"

# 3. Cross-compile to a real 16-bit MS-DOS MZ .EXE.
#    -march=any_186: the bw-board DOS bench runs the '80186' variant for C
#    programs (LEAVE/PUSH imm/IMUL), so target the 186 instruction set.
#    -mcmodel=small: one 64K code + one 64K data segment, ample for uBASIC.
( cd "$work/ubasic" && "$CC" -mcmodel=small -march=any_186 -O2 -Wall \
	dosmain.c ubasic.c tokenizer.c -o "$here/UBASIC.EXE" )

echo "Built. sha256 of the shipped binary:"
sha256sum "$here/UBASIC.EXE"

cat <<'EOF'

Run it on the emulated 8086 (from a bw-board checkout), with a BASIC program
mounted as PROG.BAS on the DOS disk:

  # (bw-board run-dos mounts files via --file NAME=path; UBASIC.EXE reads PROG.BAS)
  node scripts/run-dos.mjs UBASIC.EXE --preset xt --variant 80186 \
       --file PROG.BAS=samples/answer.bas --max 12000000 --quiet
  => 42

In brickwright-lite it is driven by runDosToolchain('ubasic', source, …)
(lib/bw-debug/dos-toolchain-routes.js), which mounts the user's BASIC as
PROG.BAS and runs UBASIC.EXE on the browser DOS bench.
EOF
