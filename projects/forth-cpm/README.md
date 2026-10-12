# zForth on CP/M-80 (Z80) — the DOS-native Forth, on a non-DOS target

[zForth](https://github.com/zevv/zForth) (Ico Doornekamp / zevv, **MIT**) is the
same tiny embeddable Forth the lab ships as an 8086 DOS program
([`forth-dos`](../forth-dos)). Here it is recompiled for a **non-DOS** target:
a Z80 **CP/M 2.2** `.COM` that runs on the bw-board Z80 machine's CP/M layer —
the one lite boots BBC BASIC and the [`cpm-software`](../cpm-software) demos on.

It demonstrates the point behind the Code tab's Forth language: the two-way
blocks⇄Forth transpiler (`bw-lang/forth.js` in brickwright-lite) emits *source
text*, and that source is **target-portable**. Only the run backend is
machine-specific. The committed `prog.fth` is the exact canonical shape the
transpiler writes — a `: banner ;` custom block, `7 7 *`, and a counted
`( repeat )` `begin … until` loop — and it runs here on a Z80/CP-M machine, not
only on the 8086 DOS bench.

## Run

```
BW_BOARD_DIR=/path/to/bw-board node proof.mjs
```

```
zForth on CP/M (Z80)
49
1
2
3
done
```

`proof.mjs` realizes the bw-board `z80` machine through the canonical
`runMediaBundle` path, loads `FORTH.COM` at `0x0100`, installs the same minimal
BDOS console shim `cpm-software` uses, and runs to the warm-boot vector.

## How it differs from the DOS build

zForth's stock build uses **float cells** and the C library's
`printf`/`sscanf`/`fopen` — none of which is friendly to SDCC's Z80 backend.
This build therefore:

- uses a **32-bit integer cell** (`zfconf.h`). SDCC-z80 has no cheap float, so
  **division is integer** (`7 / 2` is `3`, not `3.5`). This is the one
  deliberate semantic gap versus the float-cell DOS build, and it is recorded
  here rather than hidden.
- sends output through **BDOS function 2** (`cpmmain.c`, inline asm — no
  `printf`/varargs),
- **embeds** the Forth program as a C string (no CP/M file I/O), and
- compiles with `ZF_ENABLE_TRACE 0`, so no `va_list` is emitted.

The zForth VM (`src/zforth/zforth.c`) itself compiles under SDCC-z80 unchanged;
the float cell was the only blocker.

## Reproduce

`build.sh` clones zForth at the pinned commit, embeds `forth/core.zf` (the
language only) and `prog.fth`, compiles with SDCC's z80 port, and carves
`FORTH.COM` from the linker's Intel-HEX extent, byte-for-byte
(`sha256 b8752e77…`). Needs `sdcc` (with the z80 port) and `sdasz80`
(`apt install sdcc`). The prebuilt binary is committed so the manifest runs
without a toolchain.

## Licence

MIT (zForth, © Ico Doornekamp) — see `LICENSE.zforth`. `cpmmain.c` is this
project's own CP/M front-end; `crt0.s` is BrickWright's CP/M crt0
(BSD-2-Clause, shared with [`cpm-software`](../cpm-software)). `sdcc`/`sdasz80`
are GPL but build-time only; the shipped `.COM` contains zForth plus the
front-end, no SDCC runtime beyond the permissive support routines it links.
