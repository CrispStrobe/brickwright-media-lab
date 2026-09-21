#!/usr/bin/env bash
# Fetch David Given's buildable Minix 1.7.5 combo floppy + its BSD-3 license,
# decompress, and verify the image against its pinned sha256.
# BSD-3-Clause: run it, and it may be re-hosted — but we fetch from upstream.
set -euo pipefail

GZ_URL="https://github.com/davidgiven/minix2/files/917980/minix-1.7-combo-1440kB.img.gz"
LICENSE_URL="https://raw.githubusercontent.com/davidgiven/minix2/master/LICENSE"
IMG="minix17.img"
IMG_SHA256="a582fdffd79045b8ff3d1be2a1b35e5f83fa69a99bac444c919097b6409bf359"

curl -fL -o minix17.img.gz "$GZ_URL"
curl -fL -o LICENSE "$LICENSE_URL"
gunzip -kf minix17.img.gz
# the archive expands to a name with the size in it; normalize
[ -f minix-1.7-combo-1440kB.img ] && mv -f minix-1.7-combo-1440kB.img "$IMG"

echo "${IMG_SHA256}  ${IMG}" | sha256sum -c -

echo "fetched Minix 1.7.5 ${IMG} (verified). Bundle it as slot 'floppy' on the"
echo "i8086 / PCXT8086 machine; boots to the Minix boot monitor (press '=' to"
echo "start the kernel — keyboard inject is a tracked follow-up)."
