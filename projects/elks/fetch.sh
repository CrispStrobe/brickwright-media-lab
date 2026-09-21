#!/usr/bin/env bash
# Fetch the official ELKS v0.9.2 1.44 MB FAT floppy + its license from the
# upstream GitHub release, and verify the image against its pinned sha256.
# GPL-2: run it, never re-host it.
set -euo pipefail

TAG="v0.9.2"
BASE="https://github.com/ghaerr/elks/releases/download/${TAG}"
IMG="fd1440-fat.img"
IMG_SHA256="637a1d07ac1b18c7e8fafbf64911ceaa5864a37c60e23878d498534ccaae366b"

curl -fL -o "$IMG" "${BASE}/${IMG}"
curl -fL -o LICENSE "https://raw.githubusercontent.com/ghaerr/elks/${TAG}/LICENSE"

echo "${IMG_SHA256}  ${IMG}" | sha256sum -c -

echo "fetched ELKS ${TAG} ${IMG} (verified). Bundle it as slot 'floppy' on the"
echo "i8086 / PCXT8086 machine; the manifest declares the 80/2/18 geometry and"
echo "the at-floppy-drive-type quirk. Boots to 'Mounted root device'."
