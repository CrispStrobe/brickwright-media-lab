#!/usr/bin/env bash
# Fetch the fully-libre Doom: Freedoom (BSD-3 data) + FastDoom (GPL-2 engine),
# sha-verify both release zips, unpack the WADs + the 386 engine.
set -euo pipefail
FD_URL="https://github.com/freedoom/freedoom/releases/download/v0.13.0/freedoom-0.13.0.zip"
FDOOM_URL="https://github.com/viti95/FastDoom/releases/download/1.3.0/FastDoom_1.3.0.zip"
FD_SHA="3f9b264f3e3ce503b4fb7f6bdcb1f419d93c7b546f4df3e874dd878db9688f59"
FDOOM_SHA="4b805f3f712362d53797b3109ebf4651adb3bf28b903c91c4c477eba56121d6f"

curl -fL -o freedoom-0.13.0.zip "$FD_URL"
curl -fL -o FastDoom_1.3.0.zip "$FDOOM_URL"
echo "${FD_SHA}  freedoom-0.13.0.zip"   | sha256sum -c -
echo "${FDOOM_SHA}  FastDoom_1.3.0.zip" | sha256sum -c -

unzip -o freedoom-0.13.0.zip 'freedoom-0.13.0/freedoom1.wad' 'freedoom-0.13.0/freedoom2.wad' 'freedoom-0.13.0/COPYING.txt' >/dev/null
mv -f freedoom-0.13.0/freedoom1.wad freedoom-0.13.0/freedoom2.wad freedoom-0.13.0/COPYING.txt . 2>/dev/null || true
unzip -o FastDoom_1.3.0.zip 'FDOOM.EXE' 'DOOM1.TCF' >/dev/null 2>&1 || unzip -o FastDoom_1.3.0.zip >/dev/null
echo "fetched (verified). On the 386 + FreeDOS:  FDOOM.EXE -iwad FREEDOOM1.WAD"
echo "FastDoom is GPL-2 (engine); Freedoom is BSD-3 (data) — separately licensed."
