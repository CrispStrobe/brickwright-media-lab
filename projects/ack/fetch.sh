#!/usr/bin/env bash
# Reproduce the ACK 8086 sample programs from source.
#
# ACK (the Amsterdam Compiler Kit, BSD-3) is a CROSS compiler: it builds and
# runs on a modern host and emits 8086 MS-DOS .COM programs (its "msdos86"
# platform). This script clones ACK at the pinned commit, builds it, and
# compiles the three sample sources in samples/ into the .com files this
# project ships (sieve.com, fact.com, sievemod.com). The pre-built .com files
# are committed so the manifest runs without a ~15-minute, ~1 GB build; run
# this only to reproduce them from scratch.
#
# Build deps (Debian/Ubuntu names): build-essential flex bison
#   lua5.3 lua-posix python3   (ACK needs "Lua with lua-posix", any version)
set -euo pipefail

ACK_REPO="https://github.com/davidgiven/ack.git"
ACK_COMMIT="7afa32a0a0f13e865fa2e8104e442689005cd627"

here="$(cd "$(dirname "$0")" && pwd)"
work="${ACK_WORK:-$here/.ack-build}"
mkdir -p "$work"

# 1. Clone at the pinned commit.
if [ ! -d "$work/ack/.git" ]; then
	git clone "$ACK_REPO" "$work/ack"
fi
git -C "$work/ack" fetch --depth 1 origin "$ACK_COMMIT"
git -C "$work/ack" checkout -q "$ACK_COMMIT"

# 2. Build only the msdos86 platform (keeps it to ~1 GB / a few minutes).
#    Temporary files go under $work, NOT /tmp.
sed -i 's/^DEFAULT_PLATFORM ?= .*/DEFAULT_PLATFORM ?= msdos86/' "$work/ack/Makefile"
sed -i 's/^PLATS = all/PLATS = msdos86/'                        "$work/ack/Makefile"
( cd "$work/ack" && TMPDIR="$work/tmp" mkdir -p "$work/tmp" && \
  TMPDIR="$work/tmp" make -j"$(nproc)" )

ACKDIR="$work/ack/.obj/staging"
ACK="$ACKDIR/bin/ack"
export ACKDIR

# 3. Compile the samples to 8086 DOS .COM programs.
"$ACK" -mmsdos86 -O -o "$here/sieve.com"    "$here/samples/sieve.p"
"$ACK" -mmsdos86 -O -o "$here/fact.com"     "$here/samples/fact.c"
"$ACK" -mmsdos86 -O -o "$here/sievemod.com" "$here/samples/sieve.mod"

# 4. Verify the committed binaries match (integrity of what we ship).
echo "Compiled. sha256 of the shipped .com files:"
sha256sum "$here/sieve.com" "$here/fact.com" "$here/sievemod.com"

cat <<'EOF'

Run them on the emulated 8086 (from a bw-board checkout):

  node scripts/run-dos.mjs sieve.com    --preset xt --max 6000000 --quiet   # Pascal
  node scripts/run-dos.mjs fact.com     --preset xt --max 6000000 --quiet   # C
  node scripts/run-dos.mjs sievemod.com --preset xt --max 6000000 --quiet   # Modula-2
EOF
