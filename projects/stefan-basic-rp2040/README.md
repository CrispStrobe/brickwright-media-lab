# Stefan’s BASIC for Raspberry Pi Pico

This variant builds Stefan Lenz's BASIC 2.0 interpreter for a stock RP2040
Pico. The serial console runs on UART0 (GP0 and GP1, 9600 baud). It accepts
CR, LF and CRLF. Type numbered lines, then enter `RUN`. `LIST` shows the
program, `NEW` clears it, and Ctrl+C stops a running loop.

```basic
10 INPUT A
20 PRINT A*2
```

Use `SAVE "demo.bas"`, `CATALOG`, `NEW`, and `LOAD "demo.bas"` to store a
listing, see its filename, clear RAM, and reload it. The 128 KiB LittleFS
partition begins at flash offset `0x1df000` on a 2 MiB Pico. The interpreter
formats the partition at startup only when it is entirely erased. FDISK
requires explicit confirmation to format a nonblank partition.

The variant enables the full language set and gives the interpreter 32 KiB of
program memory. It uses Arduino-Pico's native LittleFS API. USB, display,
network and expansion drivers are outside this build. The recipe fetches the pinned interpreter
sources and builds against the pinned Arduino-Pico 3.9.5 release. The patch
selects UART0, reconciles the core's PinStatus type, normalizes serial line
endings and uses Ctrl+C as the break key.

The interpreter's [upstream license](LICENSE) is BSD-3-Clause. The
[Arduino-Pico core license](LICENSE.arduino-pico) and
[Pico SDK license](LICENSE.pico-sdk) also accompany the image. The
[Arduino-Pico release source and build platform](https://github.com/earlephilhower/arduino-pico/tree/3.9.5)
and [its pinned cross-toolchain](https://github.com/earlephilhower/pico-quick-toolchain)
are available separately. The build directory retains the interpreter
objects, the core archive and the linked ELF for inspection and relinking.

Rebuild and compare the UF2 with `bash fetch.sh` using Arduino CLI. To reuse a
separate Arduino installation, set `STEFAN_ARDUINO_CONFIG`. The emulator proof
runs with `BW_INTEGRATED_ROOT=/path/to/brickwright/packages/scratch-gui node proof.mjs`.
