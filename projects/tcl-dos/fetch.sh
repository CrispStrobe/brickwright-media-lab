#!/usr/bin/env bash
# Reproduce TCL.EXE — partcl, a tiny libre Tcl interpreter, as a DOS-native
# 8086 program.
#
# partcl (Serge Zaitsev, 2016 — MIT) is a minimal Tcl in a single ~650-line
# tcl.c: set / proc / if / while / return-break-continue, command substitution
# `[...]`, `$var`, braces, and prefix arithmetic (+ - * / < > <= >= == !=).
# Unlike ACK (a host cross compiler) this program is ITSELF a 16-bit MS-DOS
# executable: it runs ON the bw-board 8086 DOS service layer, reads a Tcl
# script from PROG.TCL via INT 21h file I/O, and prints results (its `puts`
# command) via the C library (INT 21h). It is the Tcl entry in the lab's
# DOS-native interpreter set alongside BASIC (ubasic-dos), C (small-c), Lisp
# (fe-dos) and Forth (f83 / volksforth) — a real interpreter running on the
# machine, not merely one whose output does.
#
# Build tool: ia16-elf-gcc (the tkchia GCC port for 16-bit x86, GPL — used only
# as a BUILD tool; the produced program links newlib + libi86, both permissive).
# Debian/Ubuntu: the 'gcc-ia16-elf' package (apt install gcc-ia16-elf).
#
# The prebuilt TCL.EXE is committed so the manifest runs without a toolchain;
# run this only to reproduce it from source.
set -euo pipefail

TCL_REPO="https://github.com/zserge/partcl.git"
TCL_COMMIT="1ed1df73907875ee770ac65e6546bd56fbc6f637"
CC="${IA16_GCC:-ia16-elf-gcc}"

here="$(cd "$(dirname "$0")" && pwd)"
work="${TCL_WORK:-$here/.partcl-build}"
mkdir -p "$work"

# 1. Clone the interpreter at the pinned commit.
if [ ! -d "$work/partcl/.git" ]; then
	git clone "$TCL_REPO" "$work/partcl"
fi
git -C "$work/partcl" fetch --depth 1 origin "$TCL_COMMIT" || true
git -C "$work/partcl" checkout -q "$TCL_COMMIT"

# 2. A single, self-contained addition on top of upstream: a DOS front-end
#    (dosmain.c) that reads PROG.TCL and evaluates it. partcl is one translation
#    unit (tcl.c, no header); dosmain.c #includes it with TEST defined so tcl.c's
#    own stdin-REPL main() is dropped and this main used. Nothing in tcl.c is
#    modified.
cp "$here/dosmain.c" "$work/partcl/dosmain.c"

# 3. Cross-compile to a real 16-bit MS-DOS MZ .EXE.
#    -march=any_186: the bw-board DOS bench runs the '80186' variant for C
#    programs (LEAVE/PUSH imm/IMUL), so target the 186 instruction set.
#    -mcmodel=small: partcl is integer-only (no soft-float), so code + data each
#    fit a single 64K segment.
( cd "$work/partcl" && "$CC" -mcmodel=small -march=any_186 -O2 -Wall \
	dosmain.c -o "$here/TCL.EXE" )

echo "Built. sha256 of the shipped binary:"
sha256sum "$here/TCL.EXE"

cat <<'EOF'

Run it on the emulated 8086 (from a bw-board checkout), with a Tcl script
mounted as PROG.TCL on the DOS disk:

  node scripts/run-dos.mjs TCL.EXE --preset xt --variant 80186 \
       --file PROG.TCL=samples/demo.tcl --max 60000000 --quiet
  => partcl on DOS (8086) / 42 / 120 / 720

In brickwright-lite the same TCL.EXE runs on the browser DOS bench (the i8086
machine), reading the user's Tcl source mounted as PROG.TCL.
EOF
