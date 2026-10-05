# PicoBB — BBC BASIC for the Raspberry Pi Pico (RP2040 UART console)

Upstream: <https://github.com/Memotech-Bill/PicoBB> — **PicoBB**, Memotech-Bill's
port of R. T. Russell's **BBC BASIC** (BBCSDL) to the Raspberry Pi Pico
(RP2040 / RP2350). Zlib-licensed; it bundles BBCSDL (Zlib) and LittleFS
(BSD-3-Clause) as git submodules and builds against the Raspberry Pi Pico SDK
(BSD-3-Clause). Pinned here at commit
`8172cc81c6bf58791dbad77ede047977afaf5f81` (the exact sha is also backed up
offline in CrispStrobe/brickwright-firmware-private, branch
`backup/retro-basic-corpus`, `compat-corpora/retro-basic/`).

This is the media lab's first **RP2040** interactive-console project: a full BBC
BASIC interpreter you talk to over the Pico's UART, booted on bw-board's
**rp2040js** machine.

## What is built

The **simplest console configuration** — a UART console on a stock Pico:

```
make BOARD=pico STDIO=UART SERIAL_DEV=0 SOUND=NONE
```

| flag | meaning |
|---|---|
| `BOARD=pico` | RP2040, **no** CYW43 WiFi chip (`CYW43=NONE`) |
| `STDIO=UART` | console stdin/stdout on **UART0 only** — no USB-CDC |
| `SERIAL_DEV=0` | no extra BASIC-accessible serial device |
| `SOUND=NONE` | **required** — see below |
| `LFS=Y` (default) | LittleFS program store in Pico flash |
| `FAT=N` (default) | no FatFS |
| `STACK_CHECK=4` (default) | PicoBB's own `stack_trap.c` — so the custom-licensed `m0FaultDispatch.c` is **not** compiled into this binary |

Console I/O is pico-sdk `stdio_uart` on **UART0** (PL011 @ `0x40034000`, GP0/GP1,
115200 8N1) — exactly the peripheral bw-board's rp2040js machine emulates.

Output artifact (committed here):

* `bbcbasic_console_pico.uf2` — the firmware image booted by `proof.mjs`

### Why `SOUND=NONE`

The default console build is `SOUND=SDL`, whose `sound_sdl.c` calls
`multicore_launch_core1()`. bw-board's rp2040js adapter steps **core0 only**
(`advanceNs` runs a single core), so a core1-launching image hangs forever in
the SIO inter-core FIFO handshake (`Read from invalid SIO address: 50/58`).
`SOUND=NONE` keeps everything on core0, which is what boots. (The VGA/PicoCalc
configs also use core1 and are out of scope for a UART console anyway.)

## Proven — boots and runs on the emulated RP2040

`proof.mjs` boots `bbcbasic_console_pico.uf2` on bw-board's rp2040js machine and
drives the UART0 console through bw-board's **canonical rp2040 media-bundle
runner**, `runRp2040Bundle` (`src/machine-media-rp2040.js`). It is the rp2040
analogue of `runI8086FloppyBundle` — a sibling of the content-pinned
`runMediaBundle`, whose entry logic is 8/16-bit (`cpu.pc & 0xffff`, `mem[0xfffc]`)
and has no rp2040 factory. The runner flattens the UF2, `bootFromFlash`-es it on
`createRp2040jsAdapter()` (the same adapter lite's
`scripts/probe-pico-micropython.mjs` and bw-board's `test/pico-blink-full-chain`
drive), captures UART0 TX via `adapter.onSerial`, answers the console's VT100
size probes, and types into the REPL via `rp2040.uart[0].feedByte`. The boot
dance now lives in one place instead of being copied into each consumer.

The console is an **ANSI terminal**: at start it waits for the user to press
Enter (printing `.` once a second until a CR arrives), then probes the terminal
size with `ESC[6n`; `proof.mjs` answers those cursor-position queries like a
VT100 (`ESC[24;80R`). On first boot the LittleFS store is empty, so PicoBB
formats it and continues to the `>` prompt.

Captured UART transcript (ANSI `ESC[6n` size-probes elided for readability):

```
Waiting for connection
Unable to locate LittleFS image
BBC BASIC for Pico Console v0.50, Build Jul 12 2026, UART Console, Flash Filesystem, Min Stack, Stack Check 4, RTC
(C) Copyright R. T. Russell, 2025
>PRINT 2+2
         4
>FOR I=1 TO 3:PRINT I*I:NEXT
         1
         4
         9
>
```

`PRINT 2+2` → `4`, and the `FOR I=1 TO 3:PRINT I*I:NEXT` loop prints the squares
`1 4 9` (BBC BASIC right-justifies numbers in a 10-character field). Every
string above is asserted by `proof.mjs` (banner in the top-level `expect`, the
two sessions in `programs[]`). To run it:

```
# against lite's integrated engine (has node_modules/bw-board + rp2040js):
BW_INTEGRATED_ROOT=/path/to/brickwright-lite/packages/scratch-gui \
  node projects/picobb-rp2040/proof.mjs

# or against a bw-board checkout that has node_modules/rp2040js installed:
BW_BOARD_DIR=/path/to/bw-board node projects/picobb-rp2040/proof.mjs
```

## Reproducing the firmware

[`fetch.sh`](fetch.sh) clones pico-sdk 2.1.1 (+ its tinyusb submodule — PicoBB
guards the whole executable on `TARGET tinyusb_device`, even for a UART build),
PicoBB at the pinned commit, and the two bundled submodules at the commits
PicoBB pins (BBCSDL `483d7489`, LittleFS `4dd30c1b`), then builds the config
above and byte-compares the result against the committed `bbcbasic_console_pico.uf2`.

```
$ ./fetch.sh
...
OK — byte-identical.
```

**Reproducibility.** The build pins `SOURCE_DATE_EPOCH` to PicoBB's own commit
date (1783865948 = 2026-07-12), so the firmware's build-date banner is
deterministic. The only machine-specific data otherwise embedded in the image
is an absolute source path in one LittleFS error string (`__FILE__`); `fetch.sh`
remaps it with `-ffile-prefix-map` so the **UF2 reproduces byte-for-byte
regardless of build location** on the same toolchain (arm-none-eabi-gcc 13.2,
pico-sdk 2.1.1). `fetch.sh` byte-compares the **UF2**, and `proof.mjs`
(behaviour) is the authoritative check overall.

## Licensing

**Zlib** for the interpreter (PicoBB + BBCSDL), with **BSD-3-Clause** notices for
the statically-linked LittleFS and pico-sdk runtime, plus the standard
arm-none-eabi GCC runtime — all reproduced in [`LICENSE`](LICENSE). No GPL in
this project; the repo-level aggregation terms still apply as described in the
top-level README. Only components actually compiled into this UART-console
configuration are listed (no FatFS, lwIP, CYW43 or m0FaultDispatch).

## Provenance (pinned in `fetch.sh` and `brickwright-media.json`)

- PicoBB: `github.com/Memotech-Bill/PicoBB` @ `8172cc81c6bf58791dbad77ede047977afaf5f81` (Zlib)
- BBCSDL: `github.com/rtrussell/BBCSDL` @ `483d7489af3b2d173db7231b5fbc546763321dd6` (Zlib)
- LittleFS: `github.com/littlefs-project/littlefs` @ `4dd30c1b8f1b416633fe63a338ede8934b6449a9` (BSD-3-Clause)
- Pico SDK: `github.com/raspberrypi/pico-sdk` tag `2.1.1` (BSD-3-Clause)
- Machine: bw-board `rp2040js` — RP2040 Cortex-M0+, UART0 PL011 @ `0x40034000`
- Shipped artifact: `bbcbasic_console_pico.uf2`, sha256 (see `brickwright-media.json`)
