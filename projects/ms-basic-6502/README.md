# Microsoft BASIC for 6502 (V1.1) — on the Ben Eater board

Historical source: <https://github.com/microsoft/BASIC-M6502> — the
**original Microsoft BASIC for the 6502** (`m6502.asm`), © 1976–1978
Microsoft, released by Microsoft under the **MIT License** in 2024. That
file is in MACRO-10 / CROSS-16 macro-assembler syntax and does **not**
assemble with a modern toolchain, so it is a reference, not the thing we
build.

Buildable form: <https://github.com/CrispStrobe/basic-m6502-bw> — a
**ca65 (cc65) translation** of that same MIT source, configured for the
KIM-style target and wired to the bw-board **eater6502** machine's
**W65C51 ACIA** serial console at `$5000`, assembling to a 32 KB ROM at
`$8000` with the reset/IRQ vectors at `$FFFA`. Both copyrights (Microsoft
and the ca65 port) are carried in this project's [`LICENSE`](LICENSE),
MIT throughout.

This is the first *interactive-console* candidate for the media lab on
the 6502 tier: not a framebuffer demo (like Bad Apple) but a full BASIC
interpreter you talk to over the serial line, exactly as the historical
machine did.

## Proven — boots and runs on the emulated eater6502

`basic.rom` loaded into the eater6502 `rom` slot boots on the bw-board
machine. Driven through bw-board's canonical `runMediaBundle(...)` path
(see [`proof.mjs`](proof.mjs)), the ACIA console prints, verbatim:

```
MEMORY SIZE?
WIDTH?

 15871 BYTES FREE

MICROSOFT BASIC V1.1
COPYRIGHT 1978 MICROSOFT

OK
```

(The two prompts are answered with the defaults — a bare carriage
return each. This V1.1 interpreter uses `OK` as its ready prompt, not
the later `READY.`.) It is a live interpreter. Typing a one-liner:

```
PRINT 2+2
 4

OK
```

…and a stored program:

```
10 FOR I=1 TO 3
20 PRINT "HI";I
30 NEXT I
RUN
HI 1
HI 2
HI 3

OK
```

Every string above is asserted by `proof.mjs` (boot banner in the
top-level `expect`, the two sessions in `programs[]`). To run it against
your own bw-board checkout:

```
BW_BOARD_DIR=/path/to/bw-board node projects/ms-basic-6502/proof.mjs
```

## Reproducing the ROM

[`fetch.sh`](fetch.sh) clones the ca65 port at the pinned commit, builds
it with `ca65`/`ld65` (package `cc65`), and checks the result against the
committed `basic.rom` **byte-for-byte**. The build is deterministic:

```
$ ./fetch.sh
...
OK — byte-identical.
```

## Licensing

**MIT** throughout ([`LICENSE`](LICENSE)) — Microsoft's MIT release of
the original source, plus the MIT ca65-port/I-O-shim copyright. No GPL in
this project; the repo-level aggregation terms still apply as described
in the top-level README.

## Provenance (pinned in `fetch.sh` and `brickwright-media.json`)

- Historical reference (not built): `github.com/microsoft/BASIC-M6502`
  @ `7460af2c03ae19c0e60ff327489229d2005b9357` (MIT)
- Buildable ca65 derivation: `github.com/CrispStrobe/basic-m6502-bw`
  @ `e1dcf16430f216b21888492235eb2defae13aa03` (MIT)
- Machine: bw-board `eater6502` — RAM `$0000–$3FFF`, W65C51 ACIA at
  `$5000`, ROM `$8000–$FFFF`
- Shipped artifact: `basic.rom` — 32,768 B, sha256
  `89c5072ea5162f8990676492d8a4c04c8b4dd3d54186e48ca576f93f2e63816c`

## Note on mist64/msbasic

The commonly-cited portable derivation of this source is
`github.com/mist64/msbasic` (a ca65 project that assembles several
historical targets — CBM, KIM, OSI, AppleSoft). It is an equally valid
starting point. The ca65 translation used here is a separate, first-party
derivation of the same MIT Microsoft source, already carrying the
eater6502 ACIA I/O shim and verified booting on the machine, so it is
what this project ships.
