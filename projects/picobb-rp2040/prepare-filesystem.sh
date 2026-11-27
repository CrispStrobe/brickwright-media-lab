#!/usr/bin/env bash
set -euo pipefail

if [[ $# != 3 ]]; then
    printf 'Usage: %s PICOBB_CHECKOUT FIRMWARE_UF2 OUTPUT_UF2\n' "$0" >&2
    exit 2
fi
picobb=$(cd "$1" && pwd)
firmware=$(cd "$(dirname "$2")" && pwd)/$(basename "$2")
output=$(cd "$(dirname "$3")" && pwd)/$(basename "$3")
scratch=$(mktemp -d "${TMPDIR:-/tmp}/picobb-flash.XXXXXX")
trap 'rm -rf "$scratch"' EXIT
make -C "$picobb/src/lfsutil" mklfsimage
cc -O2 "$picobb/src/lfsutil/uf2conv.c" -o "$scratch/uf2conv"
printf '#include <stdlib.h>\n' > "$scratch/malloc.h"
cc -O2 -I"$scratch" "$picobb/src/lfsutil/uf2merge.c" -o "$scratch/uf2merge"
mkdir "$scratch/empty"
cd "$scratch"
"$picobb/src/lfsutil/mklfsimage" -o littlefs.bin -s 128K empty
# PicoBB scans sector boundaries after the program for this superblock.
# Leave room above the 257 KiB reviewed firmware and below the 2 MiB flash limit.
"$scratch/uf2conv" -m "$firmware" littlefs.bin littlefs.uf2 320K
"$scratch/uf2merge" -e -o "$output" "$firmware" littlefs.uf2
