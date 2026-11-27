#!/usr/bin/env bash
# Rebuild the committed UART image with the pinned interpreter and Pico SDK.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="${PICCOLO_WORK:-$here/.build}"
mkdir -p "$work"
work="$(cd "$work" && pwd)"
export SOURCE_DATE_EPOCH=1750819200

checkout() {
    local repo="$1" revision="$2" path="$3"
    if [[ ! -e "$path/.git" ]]; then git init -q "$path"; fi
    git -C "$path" fetch --depth 1 "$repo" "$revision"
    git -C "$path" checkout -q --detach "$revision"
}
checkout https://github.com/garyexplains/piccoloBASIC.git 74f7f4491a14f4016c3dc48d778c3372b8f7baf8 "$work/interpreter"
checkout https://github.com/raspberrypi/pico-sdk.git bddd20f928ce76142793bef434d4f75f4af6e433 "$work/sdk"

if ! git -C "$work/interpreter" apply --reverse --check "$here/console.patch" 2>/dev/null; then
    git -C "$work/interpreter" apply "$here/console.patch"
fi

export PICO_SDK_PATH="$work/sdk"
cmake -S "$here" -B "$work/build" -G Ninja -DPICCOLO_SOURCE="$work/interpreter" \
    -DPICO_BOARD=pico -DPICO_NO_PICOTOOL=1 -DCMAKE_BUILD_TYPE=Release
cmake --build "$work/build"
picotool uf2 convert "$work/build/piccolobasic_uart.elf" "$work/piccolobasic_uart.uf2"
cmp "$work/piccolobasic_uart.uf2" "$here/piccolobasic_uart.uf2"
printf '%s\n' 'PiccoloBASIC UF2 matches the committed image.'
