#!/usr/bin/env bash
# Reproduce basic.rom — Microsoft BASIC for 6502 (V1.1) as a bw-board eater6502 ROM.
#
# Microsoft open-sourced the ORIGINAL 6502 BASIC source (m6502.asm, MIT) at
# github.com/microsoft/BASIC-M6502. That raw file is in MACRO-10 / CROSS-16
# macro-assembler syntax and is NOT assemblable by a modern toolchain. The
# buildable form used here is a ca65 (cc65) translation of that MIT source,
# targeted at the bw-board eater6502 machine (W65C51 ACIA console at $5000,
# 32 KB ROM at $8000). The translation lives upstream and is pinned below;
# this script clones it at that commit and assembles the ROM with cc65's
# ca65/ld65, then verifies the result byte-for-byte against the committed
# basic.rom.
#
# Build deps (Debian/Ubuntu): cc65   (provides ca65 + ld65)
set -euo pipefail

# Historical reference (NOT built — Microsoft's original macro source, MIT):
MS_ORIG_REPO="https://github.com/microsoft/BASIC-M6502.git"
MS_ORIG_COMMIT="7460af2c03ae19c0e60ff327489229d2005b9357"

# Buildable ca65 derivation of the above, with eater6502 I/O (MIT):
PORT_REPO="https://github.com/CrispStrobe/basic-m6502-bw.git"
PORT_COMMIT="e1dcf16430f216b21888492235eb2defae13aa03"

here="$(cd "$(dirname "$0")" && pwd)"
work="${BASIC_WORK:-$here/.build}"
mkdir -p "$work"

# 1. Clone the ca65 port at the pinned commit.
if [ ! -d "$work/port/.git" ]; then
	git clone "$PORT_REPO" "$work/port"
fi
git -C "$work/port" fetch origin "$PORT_COMMIT"
git -C "$work/port" checkout -q "$PORT_COMMIT"

# 2. Assemble the ROM (ca65 -t none; ld65 with the eater6502 memory map).
( cd "$work/port" && ca65 -t none -o basic.o basic.s && ld65 -C basic.cfg -o basic.rom basic.o )

# 3. Verify the rebuilt ROM matches the committed artifact byte-for-byte.
echo "Rebuilt ROM sha256:"
sha256sum "$work/port/basic.rom"
echo "Committed ROM sha256:"
sha256sum "$here/basic.rom"
if cmp -s "$work/port/basic.rom" "$here/basic.rom"; then
	echo "OK — byte-identical."
else
	echo "MISMATCH — the committed basic.rom does not match a fresh build." >&2
	exit 1
fi

cat <<EOF

Historical reference (Microsoft's original macro source, not built here):
  $MS_ORIG_REPO @ $MS_ORIG_COMMIT

Run it on the emulated Ben Eater 6502 (from a bw-board checkout):
  node projects/ms-basic-6502/proof.mjs    # drives runMediaBundle, checks the banner + a program
EOF
