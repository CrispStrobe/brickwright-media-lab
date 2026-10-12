# zForth on DOS (8086)

[zForth](https://github.com/zevv/zForth) (Ico Doornekamp / zevv, **MIT**) is a
tiny embeddable Forth: a small C VM (`src/zforth/zforth.c`) plus a Forth-source
bootstrap (`forth/core.zf`) that defines the language — `:` `;`, `if/else/fi`,
`begin/until/again`, `." `, `.`, `emit`, `cr` and so on.

Here it is built **unmodified** (except for a DOS front-end, `dosmain.c`) into a
real 16-bit MS-DOS `.EXE` with [ia16-elf-gcc](https://github.com/tkchia/gcc-ia16).
It is DOS-native: it runs **on** the bw-board 8086 DOS service bench, reads a
Forth program from `PROG.FTH` via INT 21h file I/O, and prints via the C library.
`dosmain.c` embeds `core.zf` (the language only — the stock `misc.zf` FizzBuzz
demo and `memaccess.zf` load-time asserts are excluded so nothing prints at
startup), evaluates it, defines the `pin!`/`pin@` GPIO words (below), prints the banner, then reads and evaluates `PROG.FTH`.

It is the Forth entry in the lab's DOS-native interpreter set, alongside BASIC
(`ubasic-dos`), C (`small-c`), Lisp (`fe-dos`) and Tcl (`tcl-dos`) — a real
interpreter running on the machine, not merely one whose output does. The stock
`f83`/`volksforth` projects are interactive REPLs; zForth is the file-reading
Forth that fits the `PROG.<X>` contract the other DOS-native interpreters use.

## Run

```
node scripts/run-dos.mjs FORTH.EXE --preset xt --variant 80186 \
     --file PROG.FTH=samples/demo.fth --max 200000000 --quiet
```

```
zForth on DOS (8086)
49 42 64 5 4 3 2 1
```

`samples/demo.fth` defines `sq`/`cube`, computes `7 sq` (49), `6 7 *` (42),
`4 cube` (64), and counts down with a `begin … until` loop (5 4 3 2 1).

## Drive the board (GPIO)

`dosmain.c` adds two prelude words so a program can drive the machine's I/O
ports — the "drive the board" bridge behind the Code tab's device story:

```
pin! ( pin value -- )   8086 OUT to 0x378+pin   ( defined as : pin! 132 sys ; )
pin@ ( pin -- value )   8086 IN  from 0x378+pin  ( defined as : pin@ 133 sys ; )
```

They are plain user syscalls (`132 sys` / `133 sys`), **inert unless called**, so
every existing program is byte-for-byte unaffected. The bw-board 8086 bench
fires `machine.hooks.onPortAccess` on every OUT/IN, so a *generated* Forth word
reaches a device register. `samples/pins.fth` drives pins 3/5/7/2 and prints
`pins-set`; in brickwright-lite a `set pin N high/low` block generates `N V pin!`
and the write lights an 8-pin GPIO strip widget (see
`docs/CODE-TAB-LANGUAGE-DEVICE-BRIDGE.md` in brickwright-lite).

```
node scripts/run-dos.mjs FORTH.EXE --preset xt --variant 80186 \
     --file PROG.FTH=samples/pins.fth --max 200000000 --quiet
# => zForth on DOS (8086) / pins-set   (and OUTs to 0x378,0x37a,0x37d,0x37f)
```

## Reproduce

`fetch.sh` clones zForth at the pinned commit, embeds `core.zf`, and rebuilds
`FORTH.EXE` byte-for-byte (sha256 `b941d46c…`). Needs `ia16-elf-gcc`
(`apt install gcc-ia16-elf`). The prebuilt binary is committed so the manifest
runs without a toolchain.

## Licence

MIT (zForth, © Ico Doornekamp) — see `LICENSE.zforth`. `dosmain.c` is the
project's own thin DOS front-end. The build tool `ia16-elf-gcc` is GPL but
build-time only; the shipped binary links permissive newlib + libi86.
