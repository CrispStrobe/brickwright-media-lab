# BrickWright GPL Lab

Copyleft-licensed software and media for BrickWright's simulated
machines — kept OUT of the MPL/MIT application tree on purpose, and
delivered the way copyleft intends: with sources, licenses, and build
scripts, fetched **only when a user asks for them**.

## How this works

- The BrickWright app itself contains no GPL code or data. Its media
  system (`describeMedia`/`applyMedia`) loads ROMs, SD images, tapes
  and snapshots the user provides.
- Each project here is a directory carrying **its own upstream
  license** (GPL-2.0, GPL-3.0, …), a `README.md` with provenance, a
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
kernel boots from its release image. ELKS below is verified against it
(`scripts/elks-media-proof.mjs`).

## Proven combinations

| Project | Machine | Status |
|---|---|---|
| ben-eater-bad-apple | eater6502 @5 MHz + sdcard(CA2 clock) + framebuffer | **Plays** — verified machine-side (bw-board `scripts/badapple-proof.mjs`) |
| tron-0xf | zx48 | **Plays** — the 48K acceptance title |
| blinkenrocket-firmware | attiny88 + 788AS matrix | **Boots** — pixel-identical boot glyph under emulation |
| steamboat-willie | eater6502 (same rig as Bad Apple) | Encoded data is GPL over a public-domain 1928 film — the cleanest demo of the set |
| elks | i8086 / PCXT8086 (BIOS + µPD765 + 8237 + 8259) | **Boots** — official v0.9.2 floppy reaches "Mounted root device", verified machine-side (bw-board `scripts/elks-media-proof.mjs`) |

## Adding a project

One directory: upstream LICENSE copied verbatim, README with source
URL + what was changed (usually: nothing), fetch.sh, manifest. Big
binaries stay upstream when upstream serves them; this repo may also
carry built artifacts WITH their corresponding sources, as the GPL
requires.
