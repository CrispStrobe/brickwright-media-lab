# zForth on CP/M-80 (Z80) — the DOS-native Forth, on a non-DOS target

[zForth](https://github.com/zevv/zForth) (Ico Doornekamp / zevv, **MIT**) is the
same tiny embeddable Forth the lab ships as an 8086 DOS program
([`forth-dos`](../forth-dos)). Here it is recompiled for a **non-DOS** target:
a Z80 **CP/M 2.2** `.COM` that runs on the bw-board Z80 machine's CP/M layer —
the one lite boots BBC BASIC and the [`cpm-software`](../cpm-software) demos on.

Like `forth-dos`, it **reads its program from a mounted file `PROG.FTH`** (here
over CP/M BDOS open/read-sequential), so it runs **arbitrary** Code-tab Forth
output, not a fixed demo. It demonstrates the point behind the Code tab's Forth
language: the two-way blocks⇄Forth transpiler (`bw-lang/forth.js` in
brickwright-lite) emits *source text*, and that source is **target-portable** —
only the run backend is machine-specific.

## Run

```
BW_BOARD_DIR=/path/to/bw-board node proof.mjs
```

```
zForth on CP/M (Z80)
49
10
20
30
40
total=40
```

`proof.mjs` realizes the bw-board `z80` machine through `runMediaBundle`, loads
`FORTH.COM` at `0x0100`, installs a minimal BDOS shim that serves the console
**and** the mounted `PROG.FTH` (fn 15 open, 26 set DMA, 20 read sequential, 16
close), and runs to the warm-boot vector. In brickwright-lite the full lite BDOS
layer (`cpm-z80.js`) serves the same reads, so `runCpmProgram` runs arbitrary
generated Forth on the Z80/CP-M bench.

## How it differs from the DOS build

zForth's stock build uses **float cells** and `printf`/`sscanf`/`fopen` — none
friendly to SDCC's Z80 backend. This build therefore:

- uses a **32-bit integer cell** (`zfconf.h`). SDCC-z80 has no cheap float, so
  **division is integer** (`7 / 2` is `3`, not `3.5`) — the one deliberate
  semantic gap versus the float-cell DOS build, recorded here rather than hidden.
- sends output through **BDOS function 2** (`cpmmain.c`, inline asm — no
  `printf`/varargs),
- reads `PROG.FTH` over **BDOS** (no C library file I/O), and
- compiles with `ZF_ENABLE_TRACE 0`, so no `va_list` is emitted.

The zForth VM (`src/zforth/zforth.c`) itself compiles under SDCC-z80 unchanged;
the float cell was the only blocker.

## Reproduce

`build.sh` clones zForth at the pinned commit, embeds `forth/core.zf` (the
language only), compiles with SDCC's z80 port, and carves `FORTH.COM` from the
linker's Intel-HEX extent, byte-for-byte (`sha256 80f30b85…`). Needs `sdcc`
(with the z80 port) and `sdasz80` (`apt install sdcc`). The prebuilt binary is
committed so the manifest runs without a toolchain.

## Licence

MIT (zForth, © Ico Doornekamp) — see `LICENSE.zforth`. `cpmmain.c` is this
project's own CP/M front-end; `crt0.s` is BrickWright's CP/M crt0
(BSD-2-Clause, shared with [`cpm-software`](../cpm-software)). `sdcc`/`sdasz80`
are GPL but build-time only.
