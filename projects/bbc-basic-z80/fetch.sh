#!/usr/bin/env bash
# Reproduce bbcbasic.com — R.T. Russell's BBC BASIC (Z80), generic CP/M
# edition, as shipped by this project.
#
# BBC BASIC (Z80) is distributed by its author with the interpreter PREBUILT:
# rtrussell/BBCZ80 commits the ready-to-run CP/M .COM at bin/cpm/BBCBASIC.COM
# (zlib, shippable). Building it from the .Z80 source would need Russell's own
# CP/M macro assembler run through the repo's MAKE.SUB submit file, which is a
# CP/M-hosted toolchain — out of scope here, and not what upstream distributes.
# So the honest reproducible check is byte-identity: clone the repo at the
# pinned commit and confirm our committed bbcbasic.com is byte-for-byte the
# unmodified upstream binary.
#
# This is exactly how brickwright-lite ships the same file (THIRD-PARTY-NOTICES:
# "static/roms/bbcbasic.com ... from rtrussell/BBCZ80, shipped unmodified").
#
# Build deps: git, sha256sum, cmp (all standard).
set -euo pipefail

# BBC BASIC (Z80), zlib — Richard T. Russell:
BBCZ80_REPO="https://github.com/rtrussell/BBCZ80.git"
BBCZ80_COMMIT="410e7fb089f9d90f985ec5ed9ec1d40492fbe79f"
UPSTREAM_PATH="bin/cpm/BBCBASIC.COM"

here="$(cd "$(dirname "$0")" && pwd)"
work="${BBCZ80_WORK:-$here/.build}"
mkdir -p "$work"

# 1. Clone BBCZ80 at the pinned commit.
if [ ! -d "$work/BBCZ80/.git" ]; then
	git clone "$BBCZ80_REPO" "$work/BBCZ80"
fi
git -C "$work/BBCZ80" fetch origin "$BBCZ80_COMMIT"
git -C "$work/BBCZ80" checkout -q "$BBCZ80_COMMIT"

# 2. Verify the committed artifact matches the unmodified upstream binary.
echo "Upstream $UPSTREAM_PATH sha256:"
sha256sum "$work/BBCZ80/$UPSTREAM_PATH"
echo "Committed bbcbasic.com sha256:"
sha256sum "$here/bbcbasic.com"
if cmp -s "$work/BBCZ80/$UPSTREAM_PATH" "$here/bbcbasic.com"; then
	echo "OK — byte-identical to the unmodified upstream BBC BASIC (Z80) CP/M binary."
else
	echo "MISMATCH — committed bbcbasic.com is not the pinned upstream binary." >&2
	exit 1
fi

cat <<EOF

Run it on the emulated bw-board Z80 machine (from a bw-board checkout):
  BW_BOARD_DIR=/path/to/bw-board node projects/bbc-basic-z80/proof.mjs
EOF
