#!/usr/bin/env bash
# Reproduce FE.EXE — fe, a tiny libre Lisp, as a DOS-native 8086 program.
#
# fe (rxi, 2020 — MIT) is a tiny Lisp in ~900 lines of portable C: lambdas,
# closures, macros, a mark-and-sweep GC and a fixed object pool, no allocations
# after startup. Unlike ACK (a host cross compiler) this program is ITSELF a
# 16-bit MS-DOS executable: it runs ON the bw-board 8086 DOS service layer,
# reads a fe program from PROG.FE via INT 21h file I/O, and prints results via
# the C library (INT 21h). It is the Lisp complement to the DOS-native BASIC
# (ubasic-dos) and C (small-c) already in the lab — a genuine interpreter
# running on the machine, not merely one whose output does.
#
# Build tool: ia16-elf-gcc (the tkchia GCC port for 16-bit x86, GPL — used only
# as a BUILD tool; the produced program links newlib + libi86, both permissive).
# Debian/Ubuntu: the 'gcc-ia16-elf' package (apt install gcc-ia16-elf).
#
# The prebuilt FE.EXE is committed so the manifest runs without a toolchain;
# run this only to reproduce it from source.
set -euo pipefail

FE_REPO="https://github.com/rxi/fe.git"
FE_COMMIT="ed4cda96bd582cbb08520964ba627efb40f3dd91"
CC="${IA16_GCC:-ia16-elf-gcc}"

here="$(cd "$(dirname "$0")" && pwd)"
work="${FE_WORK:-$here/.fe-build}"
mkdir -p "$work"

# 1. Clone the interpreter at the pinned commit.
if [ ! -d "$work/fe/.git" ]; then
	git clone "$FE_REPO" "$work/fe"
fi
git -C "$work/fe" fetch --depth 1 origin "$FE_COMMIT" || true
git -C "$work/fe" checkout -q "$FE_COMMIT"

# 2. A single, self-contained addition on top of upstream: a DOS front-end
#    (dosmain.c) that reads PROG.FE and evaluates each top-level form — upstream's
#    FE_STANDALONE main is a stdin REPL and sizes a 64000-byte pool that leaves no
#    room for the stack in a small-model .exe, so the lab ships its own main with
#    a 32000-byte pool. Nothing in fe.c/fe.h is modified.
cp "$here/dosmain.c" "$work/fe/dosmain.c"

# 3. Cross-compile to a real 16-bit MS-DOS MZ .EXE.
#    -march=any_186: the bw-board DOS bench runs the '80186' variant for C
#    programs (LEAVE/PUSH imm/IMUL), so target the 186 instruction set.
#    -mcmodel=medium: fe plus newlib's soft-float (%g number formatting) is just
#    over the 64K a small-model code segment allows, so use far code (near data).
( cd "$work/fe" && "$CC" -mcmodel=medium -march=any_186 -O2 -Wall \
	-I src dosmain.c src/fe.c -o "$here/FE.EXE" )

echo "Built. sha256 of the shipped binary:"
sha256sum "$here/FE.EXE"

cat <<'EOF'

Run it on the emulated 8086 (from a bw-board checkout), with a fe program
mounted as PROG.FE on the DOS disk:

  node scripts/run-dos.mjs FE.EXE --preset xt --variant 80186 \
       --file PROG.FE=samples/demo.fe --max 60000000 --quiet
  => fe Lisp on DOS (8086) / 6 * 7 = 42 / 5! = 120 / fib(10) = 55

In brickwright-lite the same FE.EXE runs on the browser DOS bench (the i8086
machine), reading the user's fe source mounted as PROG.FE.
EOF
