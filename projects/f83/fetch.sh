#!/usr/bin/env bash
# Fetch F83 (public-domain Forth-83 for the 8086) + its PD notice, verify sha256.
set -euo pipefail
BASE="https://raw.githubusercontent.com/ForthHub/F83/master"
curl -fL -o f83.com "$BASE/f83.com"
curl -fL -o readme.1st "$BASE/readme.1st"
echo "e808ce6f4c348c2de86de3e963d71b4d0c31b2e11ea36d18f9ac87ac6d92610f  f83.com" | sha256sum -c -
echo "fetched F83 (verified). Run: node scripts/run-dos.mjs f83.com --preset xt --max 5000000 --screen"
