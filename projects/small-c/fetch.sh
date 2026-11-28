#!/usr/bin/env bash
# Fetch and verify the pinned DOS toolchain and upstream notice.
set -euo pipefail
curl -fL -o CC.EXE https://raw.githubusercontent.com/ZaneDubya/Small-C/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef/code/bin/cc.exe
curl -fL -o ASM.EXE https://raw.githubusercontent.com/ZaneDubya/Small-C/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef/code/bin/asm.exe
curl -fL -o YLINK.EXE https://raw.githubusercontent.com/ZaneDubya/Small-C/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef/code/bin/ylink.exe
curl -fL -o CLIB.LIB https://raw.githubusercontent.com/ZaneDubya/Small-C/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef/code/smalllib/clib.lib
curl -fL -o STDIO.H https://raw.githubusercontent.com/ZaneDubya/Small-C/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef/code/bin/stdio.h
curl -fL -o license.txt https://raw.githubusercontent.com/ZaneDubya/Small-C/dfd563f56c35633ba61b7a2ab1dea3c5097ed7ef/license.txt
shasum -a 256 -c <<'SUMS'
9694a5815da3c808309a4270fd235e1f9bb2434a158a704558df198f4164e11d  CC.EXE
5944b382cf88ac121cfd2719e1bf737f402f6b425c7de22b0a1eb1185e81f6ad  ASM.EXE
8d34609ab49dc359d5098eb5a39b4a1dd7271951a840702016b82bd6a2f6744a  YLINK.EXE
ceee80eb55fba1db014fde7caaf1dab1555462ffc1c577f7f9b6396af045fe9a  CLIB.LIB
8ab3ffd2ae1c76f7eff6bd3c452386580dc9b38bd2864ec5337bee6f08efb105  STDIO.H
991ff43f5d874c22866ca8891e07cd16893a4f5597155ad907735aa2c3e340e3  license.txt
SUMS
