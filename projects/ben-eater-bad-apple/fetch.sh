#!/usr/bin/env bash
set -euo pipefail
BASE="https://raw.githubusercontent.com/NormalLuser/Ben-Eater-Bad-Apple/master"
curl -fL -o player.hex "$BASE/BadApple37FPS.bin"      # Intel HEX despite the name
curl -fL -o sd-image.bin "$BASE/BApple-Intro-Single-SD.bin"
curl -fL -o LICENSE "$BASE/LICENSE"
echo "fetched. Bundle player.hex (slot: rom-ram@\$1800) + sd-image.bin (slot: sd-image)."
