#!/usr/bin/env bash
# Fetch OpenGEM 7 RC3 -- a FreeGEM distribution: the free (GPL-2.0-or-later)
# graphical DOS desktop descended from Digital Research's GEM / ViewMAX.
# We pull the runnable RC3 distro zip + its GPL license from the upstream repo.
set -euo pipefail

RAW="https://raw.githubusercontent.com/shanecoughlan/OpenGEM/master"
ZIP_URL="${RAW}/binary/OPENGEM7-RC3.zip"
ZIP="OPENGEM7-RC3.zip"
ZIP_SHA256="f9c737c2154197a979136bf6857e5af7e61efb0d8436b380ec52427ac46277b1"

curl -fL -o "$ZIP" "$ZIP_URL"
curl -fL -o LICENSE "${RAW}/binary/OPENGEM7-RC3/LICENSE.TXT"   # GNU GPL v2 text
echo "${ZIP_SHA256}  ${ZIP}" | sha256sum -c -

unzip -o "$ZIP" >/dev/null
echo "fetched OpenGEM 7 RC3 (verified, GPL-2.0-or-later). Unpacked to ./OPENGEM/."
echo "Install onto a DOS disk with SETUP.BAT, then launch the desktop with GEM.BAT"
echo "(needs an EGA/VGA framebuffer + a mouse). It is a graphical DOS GUI, so a"
echo "text-mode console cannot render it -- see README.md for run status."
