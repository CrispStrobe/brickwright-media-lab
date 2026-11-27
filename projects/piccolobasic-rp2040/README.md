# PiccoloBASIC for RP2040

This image runs Gary Sims's BSD-3-Clause PiccoloBASIC interpreter on a stock
Raspberry Pi Pico, with an editor on UART0 (GP0 and GP1, 115200 baud). The
Brickwright monitor accepts unnumbered source. PiccoloBASIC uses lowercase
keywords and supports labels. Enter `RUN` to execute, `LIST` to inspect the
listing, or `NEW` to clear it. Ctrl+C interrupts an executing program.
`SAVE "demo.bas"` writes the listing to LittleFS, `FILES` lists saved names,
and `LOAD "demo.bas"` replaces the current listing after reading the file.

```basic
let a=40
print "Piccolo ";a+2
end
```

The original firmware uses USB and LittleFS for its `main.bas` workflow. This
variant links the original interpreter and tokenizer into a small UART monitor
with a 4095-byte listing buffer. The source patch returns parser errors to the
prompt and bounds scanning of unterminated strings. The firmware runs on core 0
and uses the SDK's UART support.

The UART monitor uses the upstream LittleFS driver with a 128 KiB region at
flash offset `0xA0000`. The executable ends below that region. It initializes an
erased partition on the first file command and preserves any nonblank region
that it cannot mount. This smaller filesystem has a different geometry from the
original PiccoloBASIC firmware. The monitor saves through a temporary file and
replaces the destination only after the complete write succeeds.

`fetch.sh` rebuilds the pinned sources and compares the result with the
committed UF2. The reference image uses Arm GNU Toolchain 14.3.Rel1 with newlib,
Pico SDK 2.1.1, CMake/Ninja and picotool 2.3.1. Put that Arm toolchain and
picotool on PATH. Set `PICCOLO_WORK` to put the build outside this tree.

Run the emulator proof with
`BW_INTEGRATED_ROOT=/path/to/brickwright/packages/scratch-gui node proof.mjs`.
It checks UART boot, program output, error recovery, interruption, named-file
replacement, failed-load recovery, cold boot, and preservation of a nonblank
unmountable partition.

The interpreter and monitor are BSD-3-Clause. See [the upstream notice](LICENSE)
and the [Pico SDK](LICENSE.pico-sdk) and [LittleFS](LICENSE.littlefs) notices. The linked libgcc and newlib runtime
terms are provided with the [Arm toolchain and corresponding source](https://developer.arm.com/downloads/-/arm-gnu-toolchain-downloads).
