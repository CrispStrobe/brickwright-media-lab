# zForth-IO on DOS (8086) — a Forth that drives the machine's GPIO

This is the DOS-native Forth ([`forth-dos`](../forth-dos)) with a **GPIO
bridge**: two words that drive the machine's I/O ports from inside the
interpreter.

- `pin! ( pin value -- )` — an 8086 `OUT` to port `gpioBase + pin`.
- `pin@ ( pin -- value )` — an 8086 `IN` from `gpioBase + pin`.

`gpioBase` is `0x378` (the classic LPT1 data port), giving an 8-pin strip at
`0x378..0x37f`. The bw-board 8086 bench fires `machine.hooks.onPortAccess` on
every `OUT`/`IN`, so a **generated** Forth word reaches a device register —
the working half of the "drive the board" bridge designed in brickwright-lite
`docs/CODE-TAB-LANGUAGE-DEVICE-BRIDGE.md`.

```
 : main  3 1 pin!  5 0 pin!  7 1 pin!  ." pins-set" cr ;  main
          └ pin 3 on   └ pin 5 off  └ pin 7 on
```

## How it works

zForth's `sys` primitive (`<id> sys`) calls the C front-end's `zf_host_sys`.
`iomain.c` adds two user syscalls — `132` (`pin!`) and `133` (`pin@`) — and a
prelude `: pin! 132 sys ;` `: pin@ 133 sys ;` evaluated before the user program,
so `PROG.FTH` can call them. `pin!` pops `( pin value )` and does
`bw_outb(gpioBase + pin, value)` via inline asm; the bench observes the `OUT`.

This is identical to `forth-dos` except the front-end: same zForth at the same
pin, the same ia16-elf-gcc medium-model build.

## Run / prove

```
BW_BOARD_DIR=/path/to/bw-board node proof.mjs
```

`proof.mjs` boots `FORTH-IO.EXE` on the real bw-board 8086 bench via
`createDos8086`, mounts `samples/pins.fth` as `PROG.FTH`, captures the `OUT`s to
the GPIO range, and checks both the console and the expected pin writes. CI
(`scripts/ci-verify.mjs`) dispatches it → a verified "a Forth program drove GPIO
pins" capability.

## What this is / is not

This proves the **port-driving half** end-to-end: a generated Forth word drives
real device registers on the bench. It does **not** yet include the lite GUI
surface — an 8-pin visual widget and a two-way "set pin P to V" block in the
Code tab — which is the remaining follow-up. See the device-bridge design doc.

## Reproduce

`build.sh` clones zForth at the pinned commit, embeds `forth/core.zf`, and
builds `FORTH-IO.EXE` byte-for-byte (`sha256 704ddb77…`) with `ia16-elf-gcc`
(`apt install gcc-ia16-elf`). The prebuilt binary is committed so the manifest
runs without a toolchain.

## Licence

MIT (zForth, © Ico Doornekamp) — see `LICENSE.zforth`. `iomain.c` is this
project's own DOS front-end. `ia16-elf-gcc` is GPL but build-time only; the
shipped binary links permissive newlib + libi86.
