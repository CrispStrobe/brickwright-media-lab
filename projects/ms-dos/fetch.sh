#!/usr/bin/env bash
# Fetch a genuinely-libre bootable MS-DOS floppy: Microsoft's Multitasking
# MS-DOS (the "v4.0-ozzie" beta disk) from the microsoft/MS-DOS repo, whose
# LICENSE is MIT and, per Microsoft, covers the committed binaries too.
# The image is a raw FAT12 360KB disk carrying IBMBIO.COM + IBMDOS.COM +
# COMMAND.COM; it boots to the authentic "MS-DOS version 4.00, Copyright ...
# Microsoft Corp." banner. See README.md for the exact run status.
set -euo pipefail

RAW="https://raw.githubusercontent.com/microsoft/MS-DOS/main"
IMG_URL="${RAW}/v4.0-ozzie/bin/DRDOS1_IMD.img"      # upstream filename, verbatim
IMG="msdos-mt-boot.img"
IMG_SHA256="dfed217ca17b0003ec0cb72cdc0d68a6ec0aad6798ba0e46c38979c64dd95e73"

curl -fL -o "$IMG" "$IMG_URL"
curl -fL -o LICENSE "${RAW}/LICENSE"
curl -fL -o LICENSE.v4.0 "${RAW}/v4.0/LICENSE"      # "Copyright (c) IBM and Microsoft Corporation"

echo "${IMG_SHA256}  ${IMG}" | sha256sum -c -

echo "fetched Microsoft Multitasking MS-DOS boot disk ${IMG} (verified, MIT)."
echo "It is a raw 360KB FAT12 floppy (40 cyl x 2 heads x 9 sectors). Boot it on"
echo "the free-386 (LGPL Bochs BIOS) with CMOS floppy type 1 (0x10=0x10) or on an"
echo "XT: it prints the genuine 'MS-DOS version 4.00 Copyright ... Microsoft Corp.'"
echo "banner. NOTE: this multitasking BETA core then halts at 'Internal Error 4560"
echo "/ HardErr: no handler' before COMMAND.COM's prompt on our emulated AT -- see"
echo "README.md. A clean A:\\> prompt needs mainstream MS-DOS 4.00 built from"
echo "microsoft/MS-DOS v4.0/src (a DOS+MASM source build, not a fetch)."
