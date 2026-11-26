#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
base=https://github.com/davidgiven/cpm65/releases/download/dev
for kind in sdcard sdshield k1013; do
  file="kim-1-$kind.zip"
  curl -fLsS "$base/$file" -o "$work/$file"
done
(cd "$work" && shasum -a 256 -c <<'HASHES'
156090198dfda6b4edd82320c80fa05a543f057f0f267c451e85bbcf041fad7d  kim-1-sdcard.zip
cbdba313cc503995d80009b194253cce589cfeed76cc9668a1de2b83a926f0e0  kim-1-sdshield.zip
9b3fe45a55136d993f8ec8e8b2e7e235df4b864a27dd549b7702eb6e71083534  kim-1-k1013.zip
HASHES
)
unzip -p "$work/kim-1-sdcard.zip" diskimage.raw > spi.raw
unzip -p "$work/kim-1-sdcard.zip" bootsd.pap > spi.pap
unzip -p "$work/kim-1-sdshield.zip" CPM-BOOT.DSK > corsham.dsk
unzip -p "$work/kim-1-sdshield.zip" bootsdshield.pap > corsham.pap
unzip -p "$work/kim-1-k1013.zip" diskimage.imd > k1013.imd
unzip -p "$work/kim-1-k1013.zip" boot.pap > k1013.pap
