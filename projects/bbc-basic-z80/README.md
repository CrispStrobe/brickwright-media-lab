# BBC BASIC (Z80) — R.T. Russell, on the BrickWright Z80 machine

R.T. Russell's **BBC BASIC (Z80) v5.00**, the generic **CP/M edition**,
booting as a real interactive interpreter on bw-board's `z80` machine.

- **Upstream:** <https://github.com/rtrussell/BBCZ80> @
  `410e7fb089f9d90f985ec5ed9ec1d40492fbe79f`
- **Artifact:** `bbcbasic.com` — `bin/cpm/BBCBASIC.COM` from that repo,
  **shipped unmodified**, 18,944 B, sha256
  `833839801fe3edbb73b91613eb43ea6052822d2d09dafd08639d120ad3a6e1bd`
- **Licence:** **zlib** (see [`LICENSE`](LICENSE)) — Russell's own terms,
  carried verbatim. BBC BASIC (Z80) is distributed by its author with the
  interpreter prebuilt, so this is the unmodified author's binary, not a
  derivation.

This is the same binary brickwright-lite boots as its built-in BASIC
default (lite's `THIRD-PARTY-NOTICES.md`: *"`static/roms/bbcbasic.com` …
from rtrussell/BBCZ80, shipped unmodified"*), packaged here as a
media-lab project with a reproducibility check and a `runMediaBundle`
boot proof.

## Which path, and why

The task offered two Z80 routes — a BBC BASIC `.COM` on CP/M, or the bare
Z80 machine with a console I/O shim. **They are the same path here, and it
is the cleanest one.** BBC BASIC (Z80)'s generic CP/M edition does *all*
console I/O through CP/M **BDOS (`CALL 5`)**; bw-board runs it over a
minimal **BDOS console shim** installed on the Z80 machine's `pcTraps`
(the machine's own source names *"The CP/M BDOS console shim"* as the
first tenant of `pcTraps`; its surface is `src/bbc-z80-runner.js`). So the
`.COM` loads into the Z80 machine's **`com`** media slot exactly as the
sibling `cpm-software` project's programs do — the very slot and path lite
boots BBC BASIC on.

Rejected alternatives:

- **`next-bbc-basic`** (breakintoprogram, ZX Spectrum Next) — the Next
  edition is bound to Next-specific hardware I/O; it would need rehosting.
  The CP/M edition already targets a portable BDOS console, so it boots
  as-is.
- **Real CP/M 2.2 boot** (`createCpmSystem` / `scripts/cpm-smoke.mjs`) —
  a full CCP+BDOS computer can also run this `.COM`, but it is heavier and
  the real-boot path is not yet wired into the GUI. The BDOS shim is the
  path that actually ships in lite and is the cleanest reproducible boot,
  so it is what this project proves.

## Proven — boots and runs on the emulated bw-board z80

Driven through bw-board's canonical `runMediaBundle(...)` (see
[`proof.mjs`](proof.mjs)): the machine is realized, `bbcbasic.com` is loaded
into the `com` slot at `0x0100`, the entry PC is set to `0x0100`, and the
BDOS console shim is installed on `pcTraps`. The **real console transcript**
(verbatim, captured by the proof) is:

```
BBC BASIC (Z80) Version 5.00
(C) Copyright R.T.Russell 2025
>
```

It is a live interpreter. A one-liner:

```
>PRINT 2+2
         4
>
```

…and a stored program:

```
>10 FOR I=1 TO 3
>20 PRINT "Z";I
>30 NEXT I
>RUN
Z1
Z2
Z3
>
```

Every string above is asserted by `proof.mjs` (the boot banner in the
top-level `expect`, the two sessions in `programs[]`). BBC BASIC flushes
type-ahead after each Enter, so `proof.mjs` feeds program lines
prompt-by-prompt (waiting for `>` before the next line). To run it against
your own bw-board checkout:

```
BW_BOARD_DIR=/path/to/bw-board node projects/bbc-basic-z80/proof.mjs
```

## Reproducing the artifact

[`fetch.sh`](fetch.sh) clones `rtrussell/BBCZ80` at the pinned commit and
checks the committed `bbcbasic.com` against upstream's prebuilt
`bin/cpm/BBCBASIC.COM` **byte-for-byte**:

```
$ ./fetch.sh
...
OK — byte-identical to the unmodified upstream BBC BASIC (Z80) CP/M binary.
```

BBC BASIC (Z80) is distributed prebuilt by its author; building it from the
`.Z80` source would need Russell's own CP/M-hosted macro assembler
(`src/*.Z80` + `MAKE.SUB`), which is not what upstream ships. The honest
reproducible check for an unmodified-binary redistribution is byte-identity
to the pinned upstream artifact — the same way lite ships this file.

## Licensing

**zlib** throughout ([`LICENSE`](LICENSE)). No GPL in this project; the
repo-level aggregation terms still apply as described in the top-level
README. The name "BBC BASIC" is used by BBC permission granted to
R.T. Russell, to identify the unmodified upstream interpreter only; this
project does not alter or fork it.
