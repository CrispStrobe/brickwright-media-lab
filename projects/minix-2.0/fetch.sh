#!/usr/bin/env bash
# Fetch David Given's buildable Minix 2.0.4 "QD edition" combo floppy + its
# BSD-3 license, decompress, and verify the image against its pinned sha256.
# BSD-3-Clause: run it, and it may be re-hosted -- but we fetch from upstream.
set -euo pipefail

GZ_URL="https://github.com/davidgiven/minix2/releases/download/v1/combo-1440kB.img.gz"
LICENSE_URL="https://raw.githubusercontent.com/davidgiven/minix2/master/LICENSE"
IMG="minix204.img"
IMG_SHA256="1fe04d26593954eb7b71b084029b35bd937b57641d63cff419c157f8384e8780"
GZ_SHA256="46c0a2ada3f9d952e1359cacba44c1011ad1a03995811e4e716be0a56dd491e5"

curl -fL -o combo-1440kB.img.gz "$GZ_URL"
curl -fL -o LICENSE "$LICENSE_URL"
echo "${GZ_SHA256}  combo-1440kB.img.gz" | sha256sum -c -
gunzip -kf combo-1440kB.img.gz
mv -f combo-1440kB.img "$IMG"
echo "${IMG_SHA256}  ${IMG}" | sha256sum -c -

echo "fetched Minix 2.0.4 ${IMG} (verified). Boot it on the FULLY-FREE 386 (LGPL"
echo "Bochs BIOS + LGPL VGABios, NO proprietary ROM) -- NOT the plain 8086: the"
echo "2.0.4 i86 build wants a 286/protected-mode host with ~2MB, which the free"
echo "386 AT machine provides. Boots to a multiuser 'login:' prompt; log in root."
