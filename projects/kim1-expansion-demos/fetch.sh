#!/usr/bin/env bash
# Generate all original fixtures using ca65/ld65 and Node.js.
set -euo pipefail
cd "$(dirname "$0")"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cat > "$work/kim.cfg" <<'CFG'
MEMORY { RAM: start = $0200, size = $1500, file = %O; }
SEGMENTS { CODE: load = RAM, type = ro; }
CFG
for program in ram-check video; do
  ca65 "$program.s" -o "$work/$program.o"
  ld65 -C "$work/kim.cfg" "$work/$program.o" -o "$work/$program.bin"
done
node fixtures.mjs "$work"
