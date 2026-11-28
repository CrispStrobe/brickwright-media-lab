#!/usr/bin/env bash
# Fetch VolksForth (BSD-2 Forth-83 for the 8086) + license, verify sha256.
set -euo pipefail
BASE="https://raw.githubusercontent.com/forth-ev/VolksForth/9fbb463e88837eac53fadf8b7748d0170819ff4c"
curl -fL -o volks4th.com "$BASE/8086/msdos/volks4th.com"
curl -fL -o LICENSE "$BASE/LICENSE"
echo "847367d29b297614c1b5d068885e5ad26fa20452d079e1f3870294bf4c50c0a8  volks4th.com" | shasum -a 256 -c -
echo "fetched VolksForth (verified). Run: node scripts/run-dos.mjs volks4th.com --preset xt --max 4000000 --screen"
