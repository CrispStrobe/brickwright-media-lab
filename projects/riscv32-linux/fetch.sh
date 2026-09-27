#!/usr/bin/env bash
# Fetch the Linux-on-RISC-V boot media (kernel Image + busybox initramfs) and
# their licence texts, and verify both against their pinned SHA-256.
#
#   bash fetch.sh              the two boot files, from this repo's pinned mirror
#   bash fetch.sh --source     also the complete corresponding source (~186 MB)
#   bash fetch.sh --upstream   re-derive the kernel from rv32emu-prebuilt's own
#                              release instead of the mirror, as a cross-check
#
# GPL-2.0 (kernel, busybox) and LGPL-2.1+ (glibc): the binaries and their
# sources are published side by side (see README.md, "Corresponding source").
set -euo pipefail

MEDIA_COMMIT=5b257a33fb748885bd952d8b8b281c76f0b36516
RAW="https://raw.githubusercontent.com/CrispStrobe/brickwright-media-lab/${MEDIA_COMMIT}/riscv32-linux"
RELEASE="https://github.com/CrispStrobe/brickwright-media-lab/releases/download/riscv32-linux-v1"

IMAGE_SHA256=9130ceb4be18d10560cf49ac495d7f2d5dde23c33972d7a522c077cc523de1a9
INITRD_SHA256=d71915baaae4f35e32679a338885697194e4ecd7f31cbc9c69b82cd86b8edcd5

want_source=0; upstream=0
for a in "$@"; do
    case "$a" in
        --source) want_source=1 ;;
        --upstream) upstream=1 ;;
        *) echo "unknown option: $a" >&2; exit 2 ;;
    esac
done

if [ "$upstream" = 1 ]; then
    # rv32emu-prebuilt rotates its releases; this tag may disappear, which is
    # why the mirror exists. While it lives, it must give the same Image.
    URL=https://github.com/sysprog21/rv32emu-prebuilt/releases/download/2026.09.23-19f5a79-Linux-Image/rv32emu-linux-image-prebuilt.tar.gz
    curl -fL -o rv32emu-linux-image-prebuilt.tar.gz "$URL"
    echo "0352bbd2dc8d35703516f7e4db86c27fbabb39818c7034a74dff948913e462fd  rv32emu-linux-image-prebuilt.tar.gz" | sha256sum -c -
    tar --strip-components=2 -zxf rv32emu-linux-image-prebuilt.tar.gz rv32emu-linux-image-prebuilt/linux-image/Image
    echo "initramfs.cpio: cut it from the same tarball with bw-board test/linux-riscv/build.sh (byte-reproducible)"
else
    curl -fL -o Image "${RAW}/Image"
    curl -fL -o initramfs.cpio "${RAW}/initramfs.cpio"
fi

mkdir -p licenses
for f in GPL-2.0 linux-COPYING busybox-LICENSE glibc-COPYING.LIB glibc-LICENSES; do
    curl -fsSL -o "licenses/$f" "${RAW}/licenses/$f"
done

echo "${IMAGE_SHA256}  Image" | sha256sum -c -
[ -f initramfs.cpio ] && echo "${INITRD_SHA256}  initramfs.cpio" | sha256sum -c -

if [ "$want_source" = 1 ]; then
    mkdir -p source && cd source
    for f in SHA256SUMS linux-6.1.188.tar.xz busybox-1.37.0.tar.bz2 \
             glibc-2.42-3-gbc13db73937730401d592b33092db6df806d193e.tar.gz \
             buildroot-2025.11.tar.gz riscv32-linux-build-recipes.tar.gz; do
        curl -fL -o "$f" "${RELEASE}/$f"
    done
    grep -v -E '  (Image|initramfs\.cpio)$' SHA256SUMS | sha256sum -c -
    cd ..
fi

echo "fetched Linux 6.1.188 Image + busybox initramfs (verified). Boot on the"
echo "riscv32 machine: slots kernel + initrd (brickwright-media.json);"
echo "bw-board runRiscvLinuxBundle or createDebugTarget('riscv32', {linux})."
