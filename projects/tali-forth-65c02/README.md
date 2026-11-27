# Tali Forth 2 — teach a 65C02 a new word

An interactive **Tali Forth 2 ROM running on the actual emulated W65C02**,
with a W65C51 serial console, a small shared-RAM framebuffer and a W65C22
output port. Type a new Forth word, change its behavior, draw by writing
memory, and inspect the result. The host does not interpret Forth.

Upstream: [SamCoVT/TaliForth2](https://github.com/SamCoVT/TaliForth2), pinned at
[`68079b0341d809d3f2bbf38fce1f70e934bf6731`](https://github.com/SamCoVT/TaliForth2/tree/68079b0341d809d3f2bbf38fce1f70e934bf6731).
Tali's public-domain declaration is copied verbatim in
[`LICENSE.upstream`](LICENSE.upstream). This package's original platform,
samples and harness terms are in [`LICENSE`](LICENSE).

## Run a real Forth session

From the media-lab repository root, with a bw-board checkout available:

```sh
BW_BOARD_DIR=/path/to/bw-board node projects/tali-forth-65c02/run.mjs
```

The default board location is a sibling `../bw-board`. After the banner,
type a line and press Enter. A completed line prints `ok`. The runner also
accepts a text file, so the activity is not limited to the bundled examples:

```sh
BW_BOARD_DIR=/path/to/bw-board node projects/tali-forth-65c02/run.mjs \
  --script projects/tali-forth-65c02/samples/framebuffer.fs \
  --frame checker.pgm
```

`checker.pgm` is a binary **64 × 32 grayscale image of actual guest-written
framebuffer bytes**. It is a standard PGM file, not a host reconstruction of
what the Forth program was expected to draw. `--frame` also works when ending
an interactive session. Use `bye` to stop the guest or end standard input to
leave the console. Start the runner again for a fresh RAM session.

Each command has a two-million-instruction budget, and boot has a separate
bounded budget. A runaway program fails with its budget named. Ordinary
interactive typos return to Tali's real input loop and can be corrected;
script mode stops with a nonzero exit code when the guest rejects a line.

## Activity 1: change the language while it runs

Type:

```forth
: square dup * ;
7 square . cr
```

The guest prints `49` and returns to `ok`. `dup` copies the number on the
data stack, `*` multiplies the two numbers, and `.` prints the result.

Now replace the definition:

```forth
: square dup * 1 + ;
7 square . cr
```

Tali reports the redefinition, prints `50`, and returns to `ok`. The changed
word is compiled into the guest's RAM dictionary. Try `see square` to inspect
the word; this build retains the assembler, disassembler and wordlist
features. [`samples/square.fs`](samples/square.fs) contains the two versions.

**Challenge:** define `cube`, then make a word that prints the first five
cubes. Use `.s` to inspect the data stack between operations.

## Activity 2: a picture is memory

The frame starts at decimal **12288** (`$3000`), with 64 bytes per row and
32 rows. Each byte is one grayscale pixel: `0` black, `255` white. Tali's
allocator stops below this region, so the framebuffer does not overlap its
dictionary or history buffers.

```forth
decimal
: pixel ( x y color -- ) >r 64 * + 12288 + r> swap c! ;
: clear-screen 12288 2048 0 fill ;
: checker 32 0 do 64 0 do i j + 1 and 255 * i j rot pixel loop loop ;
clear-screen
checker
0 0 85 pixel
```

The definition calculates `12288 + y*64 + x`; `c!` stores a byte through the
emulated CPU's memory bus. The framebuffer snoops that write. Keep `x` in
`0..63` and `y` in `0..31`; this deliberately small word does not add bounds
checks. The last line changes just the top-left pixel to gray.

Run [`samples/framebuffer.fs`](samples/framebuffer.fs) with `--frame` to
export the result. **Challenge:** change the checker expression to make
vertical stripes, then four shades. Explain which address changes when you
move one pixel right and one row down.

## Activity 3: write a peripheral register

The ROM configures the VIA's port B as eight outputs. Its data register is
decimal **24576** (`$6000`):

```forth
decimal
: leds ( byte -- ) 24576 c! ;
85 leds
24576 c@ . cr
170 leds
24576 c@ . cr
```

The actual VIA register reads back `85` (`01010101`) and then `170`
(`10101010`). This changes simulated output pins; a graphical LED widget is
not part of this package's acceptance. The source is in
[`samples/port.fs`](samples/port.fs).

**Challenge:** write walking-bit values to the port and explain the
relationship between bit position and output pin.

## Machine and memory map

| Address / setting | Role |
|---|---|
| W65C02 at 1 MHz | CMOS 65C02 guest; not an NMOS-6502 binary |
| `$0000–$2FFF` | Tali-owned RAM, including data/return stacks, dictionary and history |
| `$3000–$37FF` | 2,048-byte bus-snooped framebuffer, 64 × 32, stride 64 |
| `$3800–$3FFF` | Spare RAM outside Tali's allocator |
| `$5000–$5003` | W65C51 ACIA: data, status, command, control |
| `$6000–$600F` | W65C22 VIA; port B at `$6000`, DDRB at `$6002` |
| `$8000–$FFFF` | 32 KiB ROM, including vectors |
| Reset vector `$BFBC` | Platform initialization, then Tali's `forth` entry |
| ACIA input loop `$C00A` | Real status polling loop; `run.mjs` waits here between commands |

The manifest supplies the configuration to bw-board's canonical
`runMediaBundle`. The ROM initializes the ACIA/VIA and clears video through
guest instructions; there are **no preload writes, patched PCs during
execution, serial traps, or host-side evaluation**. The runner verifies the
ROM hash before using its input-loop address.

The ACIA uses polling and a 19,200-baud register configuration. bw-board's
ACIA model delivers serial bytes at its documented abstraction level. This
package does not qualify bit-level serial timing or the known TX-status
behavior of current physical WDC 65C51 chips.

## What the proof establishes

```sh
BW_BOARD_DIR=/path/to/bw-board node projects/tali-forth-65c02/proof.mjs
```

Optional `--report result.json` saves the captured UART transcript and
machine counters. Optional `--frame frame.pgm` saves the actual framebuffer.
`--rom FILE` checks a selected artifact against the manifest before running.

The proof checks:

1. The exact 32 KiB ROM/hash, plus refusal of a changed hash and a named error
   for a missing ROM in the canonical media loader.
2. Guest boot, typed definition, computed `49`, redefinition, computed `50`,
   and a new `ok` after each completed line. Input echo alone cannot satisfy
   the computed-value checks.
3. A Forth variable changed from `41` to `42`, read through Forth and checked
   in actual guest RAM.
4. All 2,048 pixels after the guest executes the checker program, checked in
   both RAM and the framebuffer's captured bytes.
5. VIA direction and the `85 → 170` output/readback change.
6. A second independently booted machine has no learner-defined words, a
   clear framebuffer and reset VIA output, while the first remains intact.

Recorded qualification on both board commits produced identical UART
transcripts, instruction counts and framebuffer hash:

| Board revision | Result |
|---|---|
| `4869e77752e110910ac56520bc1f47a9cded97f4` (existing media-lab CI pin) | PASS |
| `b47e7e09ed873b33ca2fd912b21e136decc5e677` | PASS |

The active session used **1,107,748 instructions / 3,785,930 cycles**; the
fresh-session check used **94,001 instructions / 329,956 cycles**. These are
emulated work counts, not a real-hardware or host-performance benchmark.

This is a **CLI and media-runner package**. It does not qualify an installed
GUI journey, persistent storage, block editor, or the complete upstream
Forth conformance suite. Words and drawings are volatile. Keep your source
in a host `.fs` file and replay it in a fresh session.

## Reproduce the ROM

Required host tools: Git, Bash, Python 3, `cmp`, and **64tass 1.60.3243**.
The committed ROM runs without an assembler. Rebuild and verify it with:

```sh
TASS64=/path/to/64tass projects/tali-forth-65c02/fetch.sh
```

`fetch.sh` calls `build.sh --verify`: clone/fetch the exact upstream commit,
refuse modified tracked upstream files, check its license copy, add only
this package's platform file, assemble and byte-compare against the
committed ROM. The platform enables assembler/disassembler/wordlist and
history, with block/storage/editor extras omitted. No timestamps or local
paths are embedded in the ROM.

Use `TALI_WORK=/path/to/work` for a different build directory, or
`TALI_SOURCE=/path/to/clean/pinned/checkout` to reuse a checkout. The default
work area is the ignored `.build/` directory. `build.sh --write` is the
explicit maintainer mode for replacing the ROM after a platform change;
update its manifest hash and rerun the proof before publishing it.

From the repository root, the checksum-verified helper used by CI can prepare
the exact assembler without installing it system-wide:

```sh
export TASS64="$(scripts/prepare-64tass.sh /path/to/tool-cache)"
```

For a manual workspace-only assembler build, download the official
[64tass 1.60.3243 source archive](https://downloads.sourceforge.net/project/tass64/source/64tass-1.60.3243-src.zip),
verify the hash below, unpack it and run `make` in the source directory.
Set `TASS64` to the resulting `64tass` executable. The
[official download page](https://sourceforge.net/projects/tass64/files/source/64tass-1.60.3243-src.zip/download)
publishes the source hash; the archive carries 64tass's GPL license. This
build tool is not linked into or redistributed with the ROM.

| Artifact | SHA-256 |
|---|---|
| `tali-forth.rom` | `81c331f6afcd7f7049dbf51e65d839d0a483ef0699697586819bbeff95e74703` |
| Guest framebuffer bytes after proof | `b6b267257836be6b2cecedba4a3f0d1d829eb0c2f306c36c373c2c93b6f30cb6` |
| `64tass-1.60.3243-src.zip` | `9d83be3d23a2c55e085b7c7a7856c2f96080447ea120a6a8c21a217ed76427f0` |

Useful upstream references: the pinned
[platform interface](https://github.com/SamCoVT/TaliForth2/blob/68079b0341d809d3f2bbf38fce1f70e934bf6731/platform/README.md)
and [word list](https://github.com/SamCoVT/TaliForth2/blob/68079b0341d809d3f2bbf38fce1f70e934bf6731/docs/WORDLIST.md).
