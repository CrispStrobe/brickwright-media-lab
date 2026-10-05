#!/usr/bin/env bash
# Reproduce bbcbasic_console_pico.uf2 / .elf — PicoBB (BBC BASIC for the Pico),
# the minimal UART-console configuration, built for a stock RP2040 (Pico) and
# verified byte-for-byte against the committed artifacts.
#
# PicoBB is Memotech-Bill's Pico port of R. T. Russell's BBC BASIC (BBCSDL).
# It is Zlib-licensed and bundles BBCSDL (Zlib) and LittleFS (BSD-3-Clause) as
# git submodules; this minimal config does NOT compile FatFS, lwIP, CYW43 WiFi,
# USB-CDC, VGA or sound-pin code. The build uses the Raspberry Pi Pico SDK
# (BSD-3-Clause) and the arm-none-eabi GCC toolchain.
#
# The console UART build is selected with:
#     make BOARD=pico STDIO=UART SERIAL_DEV=0
#   BOARD=pico     -> RP2040, no CYW43 WiFi chip   (CYW43=NONE)
#   STDIO=UART     -> console stdin/stdout on UART0 only (no USB-CDC)
#   SERIAL_DEV=0   -> no extra BASIC-accessible serial device
#   (defaults kept: LFS=Y  LittleFS flash store, FAT=N, STACK_CHECK=4 ->
#    PicoBB's own stack_trap.c, so the custom-licensed m0FaultDispatch.c is
#    NOT compiled into this binary.)
#
# Console I/O is pico-sdk `stdio_uart` on UART0 (PL011 @ 0x40034000, GP0/GP1,
# 115200 8N1) — exactly the peripheral bw-board's rp2040js machine emulates.
#
# Build deps (Debian/Ubuntu): gcc-arm-none-eabi cmake make ninja-build python3 git
#   (plus a C/C++ host compiler: pico-sdk 2.x builds `picotool`/`elf2uf2`).
set -euo pipefail

# ---- pinned provenance -------------------------------------------------------
PICOBB_REPO="https://github.com/Memotech-Bill/PicoBB.git"
PICOBB_COMMIT="8172cc81c6bf58791dbad77ede047977afaf5f81"      # Zlib
# submodule commits PicoBB@8172cc81 points at:
BBCSDL_COMMIT="483d7489af3b2d173db7231b5fbc546763321dd6"      # Zlib
LITTLEFS_COMMIT="4dd30c1b8f1b416633fe63a338ede8934b6449a9"    # BSD-3-Clause
BBCSDL_REPO="https://github.com/rtrussell/BBCSDL.git"
LITTLEFS_REPO="https://github.com/littlefs-project/littlefs.git"
# Pico SDK (BSD-3-Clause) — released tag; CMakeLists supports SDK 2.x.
PICO_SDK_TAG="2.1.1"
PICO_SDK_REPO="https://github.com/raspberrypi/pico-sdk.git"

here="$(cd "$(dirname "$0")" && pwd)"
work="${PICOBB_WORK:-$here/.build}"
mkdir -p "$work"

# Deterministic build:
#  - SOURCE_DATE_EPOCH pins __DATE__/__TIME__ -> a fixed build-date banner.
#  - -ffile-prefix-map rewrites the build-location-specific absolute prefixes
#    embedded in __FILE__ strings (one LittleFS error path) to fixed tokens, so
#    the UF2 is byte-identical regardless of where it is built.
export SOURCE_DATE_EPOCH=1783865948   # PicoBB@8172cc81 commit date (2026-07-12)

# ---- 1. pico-sdk at the pinned tag + its tinyusb submodule -------------------
# (PicoBB guards the whole bbcbasic executable on `TARGET tinyusb_device`, so
#  even the UART build needs the SDK's tinyusb submodule initialised.)
if [ ! -d "$work/pico-sdk/.git" ]; then
	git clone --branch "$PICO_SDK_TAG" --depth 1 "$PICO_SDK_REPO" "$work/pico-sdk"
fi
git -C "$work/pico-sdk" submodule update --init --depth 1 lib/tinyusb
export PICO_SDK_PATH="$work/pico-sdk"

# ---- 2. PicoBB at the pinned commit -----------------------------------------
if [ ! -d "$work/PicoBB/.git" ]; then
	git clone "$PICOBB_REPO" "$work/PicoBB"
fi
git -C "$work/PicoBB" fetch origin "$PICOBB_COMMIT"
git -C "$work/PicoBB" checkout -q "$PICOBB_COMMIT"

# ---- 3. the two bundled submodules at PicoBB's pinned commits ----------------
init_sub () { # <dir> <repo> <commit>
	local d="$work/PicoBB/$1"
	rm -rf "$d"; mkdir -p "$d"
	git -C "$d" init -q
	git -C "$d" remote add origin "$2"
	git -C "$d" fetch -q --depth 1 origin "$3"
	git -C "$d" checkout -q "$3"
}
init_sub BBCSDL   "$BBCSDL_REPO"   "$BBCSDL_COMMIT"
init_sub littlefs "$LITTLEFS_REPO" "$LITTLEFS_COMMIT"

# ---- 4. build the minimal UART console for RP2040 ----------------------------
# -ffile-prefix-map rewrites the two build-location-specific absolute prefixes
# (PicoBB tree + pico-sdk) to fixed tokens, so the __FILE__ strings embedded in
# the image do not depend on where this script runs — the UF2 then reproduces
# byte-for-byte anywhere. Passed via CFLAGS/CXXFLAGS/ASMFLAGS because PicoBB's
# Makefile forwards -DOPTIMISE to cmake unquoted (spaces would break it).
MAP="-ffile-prefix-map=$work/PicoBB=PicoBB -ffile-prefix-map=$work/pico-sdk=pico-sdk"
( cd "$work/PicoBB/console/pico" && make clean >/dev/null 2>&1 || true; \
  rm -rf build_console_pico; \
  CFLAGS="$MAP" CXXFLAGS="$MAP" ASMFLAGS="$MAP" \
    make BOARD=pico STDIO=UART SERIAL_DEV=0 SOUND=NONE )

built_uf2="$work/PicoBB/console/pico/bbcbasic_console_pico.uf2"
built_elf="$work/PicoBB/console/pico/bbcbasic_console_pico.elf"

# ---- 5. verify byte-for-byte against the committed artifacts -----------------
# The UF2 is the authoritative byte-compare: with SOURCE_DATE_EPOCH and the
# -ffile-prefix-map above it carries no build-location- or date-dependent data,
# so a fresh build reproduces it byte-for-byte on the same toolchain
# (arm-none-eabi-gcc 13.2) and pico-sdk 2.1.1. The ELF additionally carries DWARF
# debug info (DW_AT_comp_dir, toolchain build paths), which is not fully location-
# independent, so it is compared informationally only.
echo
echo "Rebuilt UF2  sha256:"; sha256sum "$built_uf2"
echo "Committed UF2 sha256:"; sha256sum "$here/bbcbasic_console_pico.uf2"
if cmp -s "$built_uf2" "$here/bbcbasic_console_pico.uf2"; then
	echo "OK — UF2 byte-identical."
else
	echo "MISMATCH — the committed UF2 does not match a fresh build." >&2
	echo "Check the toolchain (arm-none-eabi-gcc 13.2) and pico-sdk tag ($PICO_SDK_TAG)." >&2
	echo "proof.mjs (behaviour) remains the authoritative check." >&2
	exit 1
fi
if [ -f "$here/bbcbasic_console_pico.elf" ]; then
	echo "Rebuilt ELF  sha256:"; sha256sum "$built_elf"
	echo "Committed ELF sha256:"; sha256sum "$here/bbcbasic_console_pico.elf"
	cmp -s "$built_elf" "$here/bbcbasic_console_pico.elf" \
		&& echo "(ELF also byte-identical.)" \
		|| echo "(ELF differs — expected: DWARF debug paths are toolchain/location-specific.)"
fi

cat <<EOF

Run it on the emulated RP2040 (bw-board's rp2040js machine):
  BW_INTEGRATED_ROOT=/path/to/lite/packages/scratch-gui \\
    node projects/picobb-rp2040/proof.mjs
EOF
