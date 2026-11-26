#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

curl -fLsS 'https://raw.githubusercontent.com/acwright/6502-BIOS/932021a429bf2c9cdc3a9cbd6a974bef9268e183/BIOS.bin' -o "$work/bios.rom"
curl -fLsS 'https://raw.githubusercontent.com/acwright/6502-KIM/b01b5dcda9409385188abab4ec47bed237dac3c0/Firmware/KC%20Monitor/KC%20Monitor.bin' -o "$work/kc-monitor.rom"
(cd "$work" && shasum -a 256 -c <<'HASHES'
0343d53e8f073cd515e67fbfd344641d1a5a35d5f903bbdd69564e97d4a3aa51  bios.rom
4defbbea6dca97fde50c69a5bdd9c584c946b0010003fc2aaa66ba78a1d015a0  kc-monitor.rom
HASHES
)
cmp "$work/bios.rom" bios.rom
cmp "$work/kc-monitor.rom" kc-monitor.rom
