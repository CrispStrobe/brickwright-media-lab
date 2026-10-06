# BrickWright Media Lab

Free/libre software and media for BrickWright's simulated machines —
whole operating systems, compilers and programs under GPL, BSD, MIT,
MPL, Apache, zlib or public-domain terms — kept OUT of the MPL/MIT
application tree on purpose, and delivered the honest way: with sources,
licenses and build scripts, fetched **only when a user asks for them**.
The strictest case (GPL) sets the rule the whole repo follows; permissive
projects simply carry their own lighter terms.

## How this works

- The BrickWright app itself contains none of this code or data. Its
  media system (`describeMedia`/`applyMedia`) loads ROMs, SD images,
  tapes, floppies and snapshots the user provides.
- Each project here is a directory carrying **its own upstream
  license** (GPL-2.0, GPL-3.0, BSD, MIT, …), a `README.md` with
  provenance, a
  `fetch.sh` that downloads artifacts from the upstream source, and a
  `brickwright-media.json` manifest mapping files to media slots —
  drop the resulting bundle onto the app's media panel and the machine
  runs it.
- This repository as a whole is a **mere aggregation**: projects keep
  their individual licenses; repo-level files are GPL-3.0-or-later.
- Nothing here is linked into, imported by, or shipped with the app.
  The app can OFFER these bundles by URL the way a browser offers a
  download — the user's click is the distribution event, and what is
  distributed is this repo's honestly-licensed content.

## The manifest is executable

bw-board ships `runMediaBundle(manifest, files)` — one call from a
project's `brickwright-media.json` + fetched files to a running
machine (config realized, documented preload writes applied, slots
loaded, entry set). The Bad Apple and tron manifests below are
verified against it in bw-board's own suite.

Bootable-OS floppies (the `i8086` machine) run through the sibling
`runI8086FloppyBundle(manifest, files, {romBytes})` — same manifest
shape, plus a floppy geometry and per-OS hardware quirks — so a real
kernel boots from its release image. ELKS and Minix below are verified
against it (`scripts/elks-media-proof.mjs`).

DOS *programs* (a `.com`/`.exe` compiler, interpreter or game — the F83
and Small-C projects) are not boot floppies: they load on the 8086 DOS
service layer via bw-board `scripts/run-dos.mjs`, which streams their
output. Each such manifest carries a `program` block naming the tool and
preset, and its `expect` strings are what the program prints.

A manifest may also declare its **screen**: an optional `widgets` array with
a `simplevga` display marked `"source": "video"`. In the GUI the machine's
framebuffer (`runner.video()`) is mirrored into that widget in the **Widgets
pane** — a machine's screen is a widget, exactly as an LED on a wired board is.
The ELKS manifest declares one; a machine with no display card omits it (its
output then shows only in the Debug instrument). The CLI ignores the field. See
[`docs/MACHINE-MANAGER-DESIGN.md`](docs/MACHINE-MANAGER-DESIGN.md) §4.2.

## Proven combinations

| Project | Machine | Status |
|---|---|---|
| ben-eater-bad-apple | eater6502 @5 MHz + sdcard(CA2 clock) + framebuffer | **Plays** — verified machine-side (bw-board `scripts/badapple-proof.mjs`) |
| tron-0xf | zx48 | **Plays** — the 48K acceptance title |
| blinkenrocket-firmware | attiny88 + 788AS matrix | **Boots** — pixel-identical boot glyph under emulation |
| steamboat-willie | eater6502 (same rig as Bad Apple) | Encoded data is GPL over a public-domain 1928 film — the cleanest demo of the set |
| ms-basic-6502 | eater6502 (W65C51 ACIA console @ $5000) | **Boots to interactive BASIC** — MIT Microsoft BASIC V1.1, ca65-built ROM; prints the banner + `OK` and runs programs over the ACIA (`projects/ms-basic-6502/proof.mjs`). ROM reproduces byte-for-byte from the pinned source (`fetch.sh`) |
| elks | i8086 / PCXT8086 (BIOS + µPD765 + 8237 + 8259) | **Interactive Unix** — boots to a shell; steered by keyboard (`scripts/elks-shell.mjs`), programmed in-OS via bundled ELKS BASIC (MIT). Boot verified by `scripts/elks-media-proof.mjs` |
| minix-1.7 | i8086 / PCXT8086 | **Boots** — BSD-3 combo floppy reaches the Minix boot monitor; ships ACK (native C/Pascal/Modula-2) once the kernel starts |
| minix-2.0 | i80386 free-BIOS (LGPL Bochs BIOS, no proprietary ROM) | **Interactive Unix** — BSD-3 Minix 2.0.4 boots in 16-bit protected mode to a multiuser `login:`, logs in `root`, runs shell commands (the 386 tier the 8086 could not reach) |
| ms-dos | i80386 free-BIOS | **Boots to banner** — genuinely-MIT Microsoft Multitasking MS-DOS; prints the real "MS-DOS version 4.00 … Microsoft Corp." banner, then the beta core halts at Internal Error 4560 before a prompt (full prompt = build v4.0 from source) |
| opengem | i80386 + DOS + VGA/mouse | **Fetchable GPL desktop** — OpenGEM 7 RC3 (FreeGEM, GPL-2+): the graphical DOS GUI; delivered fetchable + licensed, full run-proof needs a framebuffer + mouse (not the text-scrape harness) |
| f83 | i8086 DOS layer | **Runs** — public-domain Forth-83; prints its banner and enters the interpreter (bw-board `run-dos.mjs`) |
| small-c | i8086 DOS layer | **Runs** — public-domain K&R C compiler; `cc.exe` compiles and emits 8086 assembly on the machine (bw-board `run-dos.mjs`) |
| fe-dos | i8086 DOS layer | **Runs** — MIT fe (rxi), a tiny Lisp (lambdas, closures, macros, mark-and-sweep GC); `FE.EXE` reads `PROG.FE` and prints — banner, `6 * 7 = 42`, `5! = 120` (recursive factorial), `fib(10) = 55` (recursive Fibonacci) over INT 21h (bw-board `run-dos.mjs`). Reproduces byte-for-byte from the pinned `rxi/fe` commit (`fetch.sh`). The Lisp complement to `ubasic-dos` (BASIC) and `small-c` (C) |
| tcl-dos | i8086 DOS layer | **Runs** — MIT partcl (zserge), a minimal Tcl (`set`/`proc`/`if`/`while`, command substitution, prefix arithmetic); `TCL.EXE` reads `PROG.TCL` and prints via `puts` — banner, `[* 6 7]` = 42, a recursive `fact` proc (`120`, `720`) over INT 21h (bw-board `run-dos.mjs`). Reproduces byte-for-byte from the pinned `zserge/partcl` commit (`fetch.sh`). The Tcl entry alongside `ubasic-dos`/`small-c`/`fe-dos` |
| volksforth | i8086 DOS layer | **Runs** — BSD-2 Forth-83; prints its banner and the Forth `ok` (bw-board `run-dos.mjs`) |
| freedoom-fastdoom | i80386 + FreeDOS + VGA | **Fully-libre Doom** — GPL-2 FastDoom engine + BSD-3 Freedoom data (no proprietary IWAD); runs on the 386 tier with the user's AT/VGA BIOS ROMs |
| ack | i8086 DOS layer | **Runs** — BSD-3 Amsterdam Compiler Kit cross-compiles Pascal / C / Modula-2 → 8086 `.COM`; the compiled programs print correct output on the machine (bw-board `run-dos.mjs`). Libre Pascal for our 8086 |
| cpm-software | z80 CP/M layer | **Runs** — BSD-2 libre CP/M 2.2 programs written for BrickWright: `sieve.com` (a real SDCC-compiled C program, primes < 50) and `hello.com` (pasmo asm). A `.COM` in the `com` slot runs interactively on the CP/M layer (the path lite boots BBC BASIC on); `build.sh` rebuilds both from source byte-for-byte. Also runs on the real CP/M 2.2 boot (`scripts/cpm-smoke.mjs`) |
| bbc-basic-z80 | z80 CP/M layer | **Runs** — zlib R.T. Russell BBC BASIC (Z80) v5.00, the generic CP/M `.COM`, shipped unmodified from rtrussell/BBCZ80. Boots interactively via `runMediaBundle` over the BDOS console shim (`com` slot at 0x0100): prints its `BBC BASIC (Z80) Version 5.00 / (C) Copyright R.T.Russell` banner, computes `PRINT 2+2` → `4`, runs a stored FOR/NEXT loop. Boot proven by `projects/bbc-basic-z80/proof.mjs`; `fetch.sh` verifies the binary byte-for-byte against the pinned upstream. The interpreter lite boots as its built-in BASIC default |
| alice-pascal | i80386 free-BIOS + FreeDOS | **Runs** — Artistic-1.0 ALICE: The Personal Pascal (1985); on booted FreeDOS it reaches its main menu / editor (needs a real DOS for the PSP `.suf`-overlay path, which `run-dos` lacks) |
| riscv32-linux | riscv32 (RV32IMAC, Sv32, SBI, PLIC, 16550A; 64 MiB) | **Interactive Linux** — Linux 6.1.188 + BusyBox boot to a shell prompt and answer `uname -a` over the UART (bw-board `runRiscvLinuxBundle`, `test/linux-riscv/lesson.mjs`). The binaries are mirrored on branch `media/riscv32-linux-v1` with their complete corresponding source as assets of release `riscv32-linux-v1` |
| picobb-rp2040 | rp2040 (rp2040js; UART0 PL011 console @ 0x40034000) | **Boots to interactive BASIC** — Zlib PicoBB (BBC BASIC for the Pico), stock-RP2040 UART-console build; boots on bw-board's rp2040js via `createRp2040jsAdapter` (**not** `runMediaBundle` — it has no rp2040 machine factory), prints its banner + `>` prompt and runs `PRINT 2+2`→`4` and a `FOR` loop (squares `1 4 9`) over the UART (`projects/picobb-rp2040/proof.mjs`). The UF2 reproduces byte-for-byte from the pinned Pico-SDK build (`fetch.sh`, `SOURCE_DATE_EPOCH` + `-ffile-prefix-map`). Needs `SOUND=NONE`: the default build launches core1, which the single-core rp2040js adapter cannot service |

## Machine Manager (design)

[`docs/MACHINE-MANAGER-DESIGN.md`](docs/MACHINE-MANAGER-DESIGN.md) — the config-driven machine model (a machine is a manifest), the wired-vs-functional axis, the three surfaces (quick-picker / manager / “…” editor), config-vs-image storage for hundreds of machines, importers, and how the code-tab languages + media bundles bind to a configurable machine.

## Running the machines

[`docs/RUNNING.md`](docs/RUNNING.md) is the how-to for actually running these —
on the command line (bw-board's `elks-shell.mjs` / `run-dos.mjs` /
`run-i80386-free-bios-freedos.mjs`) and in the browser (lite's debug panel:
load a floppy OS into the i8086 machine's Floppy slot and steer it live).
**CLI reaches everything; the GUI now reaches the 8086 tier (boot + steer),
the 386 tier (boots on the free LGPL BIOS, renders to the Widgets pane — drop
a fetched 386 image into the slot for a live OS prompt), and the Z80 CP/M tier
(interactive `.COM`s).**

## The matrix

[`docs/MATRIX.md`](docs/MATRIX.md) is the one-page overview — every emulated CPU
× the OSs that boot on it × the compilers that target it, plus the two planned
axes (an emulated RISC-V core, and a soft RISC-V SoC on the real Tang Nano 20K).

## Candidates & roadmap

[`docs/CANDIDATES.md`](docs/CANDIDATES.md) is the full ledger — every free OS,
language and firmware evaluated, with its license, CPU tier, and honest status
(runs here / packaged / build-required / cross-only / blocked). The dividing
line is the BIOS: the 8086/XT tier is fully free (`buildBios`), while the
286/386 tier runs real AT firmware today (a free-BIOS path via SeaBIOS is
tracked there).

## Adding a project

One directory: upstream LICENSE copied verbatim, README with source
URL + what was changed (usually: nothing), fetch.sh, manifest. Big
binaries stay upstream when upstream serves them; this repo may also
carry built artifacts WITH their corresponding sources, as the GPL
requires.
