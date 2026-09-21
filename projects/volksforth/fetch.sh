#!/usr/bin/env bash
# Fetch VolksForth (BSD-2 Forth-83 for the 8086) + license, verify sha256.
set -euo pipefail
BASE="https://raw.githubusercontent.com/forth-ev/volksForth/master"
curl -fL -o volks4th.com "$BASE/8086/msdos/volks4th.com"
curl -fL -o LICENSE "$BASE/LICENSE"
echo "847367d29b297614c1b5d068885e5ad26fa20452d079e1f3870294bf4c50c0a8  volks4th.com" | sha256sum -c -
echo "fetched VolksForth (verified). Run: node scripts/run-dos.mjs volks4th.com --preset xt --max 4000000 --screen"
