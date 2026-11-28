#!/bin/sh
# SPDX-License-Identifier: BSD-3-Clause
set -eu
cd "$(dirname "$0")"
work=$(mktemp -d)
trap 'rm -r "$work"' EXIT HUP INT TERM
ca65 timer.s -o "$work/timer.o"
ld65 -t none --start-addr 0x0200 -o "$work/timer.bin" "$work/timer.o"
python3 - "$work/timer.bin" > TIMER.HEX <<'PY'
from pathlib import Path
import sys

program = Path(sys.argv[1]).read_bytes()
for offset in range(0, len(program), 16):
    data = program[offset:offset + 16]
    address = 0x0200 + offset
    record = bytes((len(data), address >> 8, address & 255, 0)) + data
    print(":" + (record + bytes((-sum(record) & 255,))).hex().upper())
print(":00000001FF")
PY
