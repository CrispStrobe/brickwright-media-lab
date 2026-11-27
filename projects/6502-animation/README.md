# Make an original animation on a 6502

An editable four-frame animation, an original **6502 assembly player**, and a
complete source-to-machine exercise. The CPU copies raw pixel data from its ROM
into the Eater-style framebuffer at `$2000`. All code and artwork in this
directory are original BrickWright work under [MIT](LICENSE).

**What is proven:** the committed ROM rebuilds byte-for-byte; the canonical
`runMediaBundle` path executes it; two complete animation loops match an
independent geometric pixel oracle; changing one source frame changes exactly
that guest frame; a fresh machine restores the original result. This is a
**CLI lesson with captured-frame playback**, not an installed browser authoring
interface. The animation is ROM-resident; it does not use SD streaming,
compression, sound, or a guest save operation.

## Run the original

Requirements: Node.js 20 or newer and a bw-board checkout with its documented
dependencies installed. The committed ROM can be run without an assembler.
Run the commands below from this directory:

```sh
BW_BOARD_DIR=/path/to/bw-board node run.mjs
```

Open `.build/playback/animation.html` to play, pause, and inspect the **actual
guest frames**. The HTML replays captured observations; it does not emulate a
6502 itself. `capture.json` records the guest instruction/cycle counts and frame
hashes, and `frame-0.bin` onward contain each complete 8192-byte framebuffer,
including the row padding.

The default board path is a sibling checkout: from a layout containing
`brickwright-media-lab/` and `bw-board/`, `node run.mjs` works without the
environment variable. `--frames 8` captures two complete loops. An instruction
budget bounds each frame, so a broken player fails instead of running forever.

## Change a frame and run the result

The source is [src/animation.json](src/animation.json). Its sprite is a diamond
drawn with `.` and `#`; each entry in `frames` places that sprite on the screen.
Make a copy, then change the **second frame's `x` from 32 to 35**:

```sh
cp src/animation.json my-animation.json
```

Edit `my-animation.json` with your editor. Build and execute it:

```sh
TASS64=/path/to/64tass node build.mjs --source my-animation.json --out .build/my-bundle
BW_BOARD_DIR=/path/to/bw-board node run.mjs --bundle .build/my-bundle --out .build/my-playback
```

Open `.build/my-playback/animation.html`. Frame 1 moves three pixels right; the
other frames stay in their original positions. The build emits its own manifest
with the changed ROM's SHA-256, a source copy, and a build report. The runner
checks that manifest hash before executing the ROM.

The first useful experiment is prediction: **which framebuffer addresses should
change?** A visible pixel at `(x, y)` occupies:

```text
address = $2000 + y * 128 + x
```

For the changed second frame, the diamond's center moves from `(37, 31)` to
`(40, 31)`. The bitmap source uses rows of 100 pixels; screen RAM reserves 128
bytes per row. The player must account for both strides.

### More small experiments

- Change the sprite's shape or move a frame vertically.
- Reduce `holdLoops` to shorten the player's software pause. Compare the guest
  cycle counts in `capture.json`; these are not host wall-clock benchmarks.
- Use one, two, or three frames and observe the shorter loop.
- Change the background to white and draw a black sprite.
- Try to place the sprite outside the screen. The encoder should reject it
  before creating a ROM; clipping is deliberately not an implicit behavior.

The format accepts **1–4 frames**, a fixed 100 × 64 image, a rectangular sprite,
and a monochrome palette (`0` black, `63` white). Four raw frames occupy 25,600
bytes, leaving space for the player and vectors in a 32 KiB ROM. The limit is
part of this lesson's memory budget.

**Reset:** run `node run.mjs` without `--bundle` again. It creates a fresh machine
and loads the committed starter ROM. Your edited source and output bundle remain
ordinary host files until you remove them; the guest does not save files.

**Challenge:** design a four-frame animation whose total raw image size stays at
25,600 bytes, then explain why changing the picture's complexity does not change
that size. RLE or delta encoding would require a new format and decoder; neither
is claimed by this player.

## Build and fetch convention

Install **64tass** or point `TASS64` at its executable. Reproduction was checked
with version **1.60.3243**, built from the
[official source archive](https://downloads.sourceforge.net/project/tass64/source/64tass-1.60.3243-src.zip)
(`9d83be3d23a2c55e085b7c7a7856c2f96080447ea120a6a8c21a217ed76427f0`).
64tass is an external build tool; its source/binary is not bundled here.

The repository's checksum-verified helper prepares that version. From the
repository root, run `export TASS64="$(scripts/prepare-64tass.sh /path/to/tool-cache)"`;
then return to this project directory for the build commands below.

```sh
TASS64=/path/to/64tass node build.mjs
TASS64=/path/to/64tass node build.mjs --check
```

The first command writes a bundle into `.build/bundle/`. The second rebuilds in
a temporary directory and requires byte equality with the committed
`animation.rom` and its manifest hash. `build.sh` is a convenience wrapper.
`fetch.sh` runs the same rebuild/check: all lesson source and media are already
committed, so it needs no upstream media download.

The encoder can also be used independently:

```sh
node encode.mjs src/animation.json .build/frames.bin
```

`frames.bin` contains exactly `frameCount * 6400` bytes: rows of 100 pixels, one
byte per monochrome pixel, frames concatenated with no header or padding. Build
generates the frame-pointer table and constants, then assembles
[src/player.asm](src/player.asm). The final ROM contains reset/interrupt vectors
and can enter through its reset vector at `$8000`.

## Machine and observation contract

| Item | Value |
|---|---|
| Machine | `eater6502`, functional W65C02 engine; player uses 6502 instructions |
| Clock | 1 MHz |
| RAM | `$0000–$3FFF` |
| ROM | `$8000–$FFFF`, 32,768 bytes |
| Framebuffer | Bus-snooping shared RAM at `$2000–$3FFF` |
| Visible display | 100 × 64 pixels, 128-byte row stride |
| Player workspace | Zero page `$00–$05`; normal stack at `$0100–$01FF` |
| Frame serial | `$0200`, incremented after all visible pixels are written |
| Published index | `$0201`, zero-based source frame index |
| Frame data | Raw pixels in ROM; no SD card or external stream |

The guest first clears all 8192 framebuffer bytes, including the 28 hidden bytes
of each row. It then copies 6400 visible pixels per frame. It publishes the frame
index and finally increments the serial byte. The CLI stops **after that guest
instruction**, reads the snooped display bytes, and resumes the CPU. It never
paints or repairs the guest framebuffer from the host.

The card exposes `getFrame()`/`buf`; it is not treated here as an installed app's
generic `video()` widget. The replay page is generated from captured bytes.
The player uses a software delay, not vertical-sync hardware, and intermediate
partial redraws are not included in complete-frame playback. The first captured
interval includes startup/clear work; subsequent intervals include the previous
frame's hold and the new frame's copy.

## Proof

The initial qualification used bw-board
[`b47e7e09ed873b33ca2fd912b21e136decc5e677`](https://github.com/CrispStrobe/bw-board/tree/b47e7e09ed873b33ca2fd912b21e136decc5e677),
Node.js 24.22.3, and 64tass 1.60.3243. This is engine/CLI evidence for that
configuration, not an installed-app qualification.

```sh
TASS64=/path/to/64tass BW_BOARD_DIR=/path/to/bw-board node proof.mjs
```

The bounded proof does the following:

1. Checks the committed ROM's manifest hash and rebuilds it byte-for-byte.
2. Loads it through `runMediaBundle`, observes the reset-vector entry, and steps
   the real guest CPU until its publication byte changes.
3. Checks **all 8192 bytes** of eight frames against an independent geometric
   description: a diamond of Manhattan radius 5 at four known centers. This
   oracle does not call the sprite encoder or read its output buffer.
4. Checks shared RAM agrees with the bus-snooping framebuffer and that the
   number of guest display writes is the initial 8192 plus 6400 per frame.
5. Edits the second frame's x-coordinate, rebuilds, executes another four frames,
   and checks its new geometry while proving the other frames are unchanged.
6. Creates a fresh original machine and checks another four frames, qualifying
   the documented reset path.
7. Rejects representative invalid sources before assembly: a clipped sprite,
   too many frames, an unknown pixel symbol, zero hold count, and wrong width.

Outputs in `.build/proof/` include `proof-report.json`, the exact edited source
and bundle, and `guest-frames.svg`, an original/edited contact sheet constructed
from the observed guest framebuffer. `proof.mjs` intentionally checks the fixed
starter exercise; use `run.mjs` to inspect arbitrary learner-authored variants.

| Experience stage | Status and boundary |
|---|---|
| Fetch/build | Original source/media present; deterministic rebuild and pinned ROM hash. |
| Boot/load | Canonical CLI media load and guest reset-vector entry proven. |
| Input | Host source editing and rebuild; no guest keyboard or mouse input claimed. |
| Activity | A one-frame source edit produces the corresponding checked guest pixels. |
| Reset | Fresh-machine reload reproduces the original four frames. |
| Persistence | Source/bundle/export are host files; no guest persistence or app storage qualification. |

The broader [learning plan](../../docs/LEARNING-EXPERIENCES.md) discusses SD,
compression, and further experiments. They remain separate future increments;
this directory supplies the complete initial source → ROM → guest-frame loop.
