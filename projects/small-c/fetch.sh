#!/usr/bin/env bash
# Fetch the Small-C 2.5 16-bit DOS toolchain (public domain) + license, verify shas.
set -euo pipefail
BASE="https://raw.githubusercontent.com/ZaneDubya/Small-C/master/code/bin"
curl -fL -o cc.exe    "$BASE/cc.exe"
curl -fL -o asm.exe   "$BASE/asm.exe"
curl -fL -o ylink.exe "$BASE/ylink.exe"
curl -fL -o license.txt "https://raw.githubusercontent.com/ZaneDubya/Small-C/master/license.txt"
sha256sum -c - <<SUMS
9694a5815da3c808309a4270fd235e1f9bb2434a158a704558df198f4164e11d  cc.exe
5944b382cf88ac121cfd2719e1bf737f402f6b425c7de22b0a1eb1185e81f6ad  asm.exe
8d34609ab49dc359d5098eb5a39b4a1dd7271951a840702016b82bd6a2f6744a  ylink.exe
SUMS
echo "fetched Small-C toolchain (verified). Run the compiler:"
echo "  node scripts/run-dos.mjs cc.exe --preset xt --max 3000000 --screen"
