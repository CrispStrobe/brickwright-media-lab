#!/usr/bin/env bash
set -euo pipefail
BASE="https://raw.githubusercontent.com/NormalLuser/Ben-Eater-Bad-Apple/master"
curl -fL -o steamboat-org.bin "$BASE/SteamboatWillieOrg.bin"
curl -fL -o steamboat-extra-bw.bin "$BASE/SteamboatWillieExtraBW.bin"
curl -fL -o LICENSE "$BASE/LICENSE"
echo "fetched Steamboat data; assemble the upstream decoder to pair (see README)."
