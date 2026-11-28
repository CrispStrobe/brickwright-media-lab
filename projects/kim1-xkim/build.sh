#!/usr/bin/env bash
# Build the user-supplied ROM from the exact upstream source revision.
set -euo pipefail
cd "$(dirname "$0")"
assembler="$(command -v "${AS65:-as65}")"
./fetch.sh
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git -C upstream archive HEAD | tar -xf - -C "$work"
(cd "$work" && "$assembler" -q -oxKIM.bin xKIM.asm)
test "$(wc -c < "$work/xKIM.bin" | tr -d '[:space:]')" = 8192
cp "$work/xKIM.bin" xKIM.bin
shasum -a 256 xKIM.bin
