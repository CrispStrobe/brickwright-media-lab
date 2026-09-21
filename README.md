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

## Proven combinations

| Project | Machine | Status |
|---|---|---|
| ben-eater-bad-apple | eater6502 @5 MHz + sdcard(CA2 clock) + framebuffer | **Plays** — verified machine-side (bw-board `scripts/badapple-proof.mjs`) |
| tron-0xf | zx48 | **Plays** — the 48K acceptance title |
| blinkenrocket-firmware | attiny88 + 788AS matrix | **Boots** — pixel-identical boot glyph under emulation |
| steamboat-willie | eater6502 (same rig as Bad Apple) | Encoded data is GPL over a public-domain 1928 film — the cleanest demo of the set |
| elks | i8086 / PCXT8086 (BIOS + µPD765 + 8237 + 8259) | **Interactive Unix** — boots to a shell; steered by keyboard (`scripts/elks-shell.mjs`), programmed in-OS via bundled ELKS BASIC (MIT). Boot verified by `scripts/elks-media-proof.mjs` |
| minix-1.7 | i8086 / PCXT8086 | **Boots** — BSD-3 combo floppy reaches the Minix boot monitor; ships ACK (native C/Pascal/Modula-2) once the kernel starts |
| minix-2.0 | i80386 free-BIOS (LGPL Bochs BIOS, no proprietary ROM) | **Interactive Unix** — BSD-3 Minix 2.0.4 boots in 16-bit protected mode to a multiuser `login:`, logs in `root`, runs shell commands (the 386 tier the 8086 could not reach) |
| ms-dos | i80386 free-BIOS | **Boots to banner** — genuinely-MIT Microsoft Multitasking MS-DOS; prints the real "MS-DOS version 4.00 … Microsoft Corp." banner, then the beta core halts at Internal Error 4560 before a prompt (full prompt = build v4.0 from source) |
| opengem | i80386 + DOS + VGA/mouse | **Fetchable GPL desktop** — OpenGEM 7 RC3 (FreeGEM, GPL-2+): the graphical DOS GUI; delivered fetchable + licensed, full run-proof needs a framebuffer + mouse (not the text-scrape harness) |
| f83 | i8086 DOS layer | **Runs** — public-domain Forth-83; prints its banner and enters the interpreter (bw-board `run-dos.mjs`) |
| small-c | i8086 DOS layer | **Runs** — public-domain K&R C compiler; `cc.exe` compiles and emits 8086 assembly on the machine (bw-board `run-dos.mjs`) |
| volksforth | i8086 DOS layer | **Runs** — BSD-2 Forth-83; prints its banner and the Forth `ok` (bw-board `run-dos.mjs`) |
| freedoom-fastdoom | i80386 + FreeDOS + VGA | **Fully-libre Doom** — GPL-2 FastDoom engine + BSD-3 Freedoom data (no proprietary IWAD); runs on the 386 tier with the user's AT/VGA BIOS ROMs |
| ack | i8086 DOS layer | **Runs** — BSD-3 Amsterdam Compiler Kit cross-compiles Pascal / C / Modula-2 → 8086 `.COM`; the compiled programs print correct output on the machine (bw-board `run-dos.mjs`). Libre Pascal for our 8086 |
| alice-pascal | i80386 free-BIOS + FreeDOS | **Runs** — Artistic-1.0 ALICE: The Personal Pascal (1985); on booted FreeDOS it reaches its main menu / editor (needs a real DOS for the PSP `.suf`-overlay path, which `run-dos` lacks) |

## Running the machines

[`docs/RUNNING.md`](docs/RUNNING.md) is the how-to for actually running these —
on the command line (bw-board's `elks-shell.mjs` / `run-dos.mjs` /
`run-i80386-free-bios-freedos.mjs`) and in the browser (lite's debug panel:
load a floppy OS into the i8086 machine's Floppy slot and steer it live).
**CLI reaches everything, including the fully-free 386; the GUI reaches the
8086 tier today, with the 386 tier CLI-only until a pin bump + 386 wiring land.**

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
