#!/usr/bin/env bash
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="${STEFAN_WORK:-$here/.build}"
mkdir -p "$work"
work="$(cd "$work" && pwd)"
config="${STEFAN_ARDUINO_CONFIG:-$work/arduino.yaml}"
platform=rp2040:rp2040@3.9.5
revision=86ec458ca3dac9d156ce23bfa28a99f1f39ca656
export SOURCE_DATE_EPOCH=1782384000

if [[ ! -f "$config" ]]; then
    mkdir -p "$work/arduino/"{data,downloads,user}
    cat > "$config" <<CONFIG
directories:
  data: "$work/arduino/data"
  downloads: "$work/arduino/downloads"
  user: "$work/arduino/user"
board_manager:
  additional_urls:
    - https://github.com/earlephilhower/arduino-pico/releases/download/global/package_rp2040_index.json
CONFIG
fi
if ! arduino-cli --config-file "$config" core list | awk '$1 == "rp2040:rp2040" && $2 == "3.9.5" {found=1} END {exit !found}'; then
    arduino-cli --config-file "$config" core update-index
    arduino-cli --config-file "$config" core install "$platform"
fi

sketch="$work/IoTBasic"
mkdir -p "$sketch"
for file in IoTBasic.ino hardware.h runtime.cpp basic.h common.h language.h runtime.h; do
    curl -fLsS --retry 2 "https://raw.githubusercontent.com/slviajero/tinybasic/$revision/Basic2/IoTBasic/$file" -o "$sketch/$file"
done
patch -d "$sketch" -p1 < "$here/uart.patch"
arduino-cli --config-file "$config" compile --fqbn rp2040:rp2040:rpipico:usbstack=nousb,flash=2097152_131072 \
    --build-path "$work/build" "$sketch"
cmp "$work/build/IoTBasic.ino.uf2" "$here/stefan_basic_uart.uf2"
printf '%s\n' 'Stefan’s BASIC UF2 matches the published image.'
