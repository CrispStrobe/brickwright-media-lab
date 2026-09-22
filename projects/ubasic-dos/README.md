# uBASIC — a libre BASIC that RUNS on the 8086 (DOS)

Upstream: <https://github.com/adamdunkels/ubasic> — **uBASIC**, a tiny
line-numbered BASIC interpreter in portable C, © 2006 Adam Dunkels and
© 2013 Danyil Bohdan, **BSD-3-Clause** (the licence header is on every
source file; copied here as `LICENSE.ubasic`).

uBASIC answers a real gap: *no clearly-libre BASIC runs natively on our
8086 today.* Microsoft's GW-BASIC MIT release is source-only 8086
assembly (no built `GWBASIC.EXE`), and the Bywater BASIC that many
mirrors ship is now **GPLv2** — a poor fit for a code path wired into
the MIT/BSD lite app. uBASIC is BSD-3-Clause, small, and — unlike
[ACK](../ack), whose compiler is a host tool — is **itself a 16-bit
MS-DOS program**. It runs *on* the machine, the DOS-native complement to
[Small-C](../small-c).

## What it is

`UBASIC.EXE` is a real MS-DOS `MZ` executable built with
[`ia16-elf-gcc`](https://github.com/tkchia/build-ia16) (the GCC port for
16-bit x86), linking newlib + libi86. It:

1. opens `PROG.BAS` on the DOS disk (INT 21h `open`/`read`),
2. runs it through Adam Dunkels' uBASIC core, and
3. prints via the C library, which lands on INT 21h / INT 10h.

So on the bw-board 8086 DOS service layer you **mount a `.BAS` as
`PROG.BAS`, run `UBASIC.EXE`, and read the output back** — exactly the
compile-on-DOS shape the lite code tab uses for its DOS toolchains.

### Two small changes over upstream

Both are in `fetch.sh` + `dosmain.c`, so the build is reproducible:

- **`VARIABLE_TYPE` widened `char` → `int`** (`vartype.h`): 16-bit
  integers, so ordinary arithmetic like `6*7` doesn't overflow an 8-bit
  accumulator.
- **A DOS front-end `dosmain.c`** that reads `PROG.BAS` (normalising
  CRLF→LF) and runs it — replacing upstream's `use-ubasic.c`, which
  hardcodes its program and is no use in the tab.

## Proven — runs on our 8086

`samples/answer.bas`:

```basic
10 print 6*7
```

run on the bw-board 8086 DOS bench (`createDos8086`, `loadExe`, INT 21h
file I/O) with `answer.bas` mounted as `PROG.BAS`, variant `80186`,
prints:

```
42
```

`samples/demo.bas` exercises `GOSUB`/`FOR`…`NEXT`/`LET`/`IF`…`THEN` and
string `PRINT`, producing `counting:` then `1 2 3 4 5`, `42`, and
`the answer`.

This is captured authoritatively by brickwright-lite's
`test/dos-compile.test.mjs`, which runs `UBASIC.EXE` on the **real** DOS
bench with `PROG.BAS` mounted and asserts `42` — the same
`runDosToolchain('ubasic', …)` path the code tab uses.

### From a bw-board checkout

```sh
node scripts/run-dos.mjs UBASIC.EXE --preset xt --variant 80186 \
     --file PROG.BAS=samples/answer.bas --max 12000000 --screen
# => 42
```

(The CLI can drop piped stdout on `process.exit`; the lite test / bench
harness is the authoritative capture.)

## Rebuild from source

```sh
./fetch.sh            # clones uBASIC at the pinned commit, applies the two
                      # changes, and cross-compiles UBASIC.EXE with ia16-elf-gcc
```

Build tool: `ia16-elf-gcc` (Debian/Ubuntu package `gcc-ia16-elf`). Its
GCC port is GPL, but it is a **build-time tool only** — the shipped
`UBASIC.EXE` is BSD-3-Clause uBASIC linked against permissive newlib +
libi86.

## Files

| File | What |
|------|------|
| `UBASIC.EXE` | the built 16-bit MS-DOS interpreter (committed) |
| `dosmain.c` | the DOS front-end (reads `PROG.BAS`, runs it) |
| `fetch.sh` | reproduces `UBASIC.EXE` from the pinned upstream |
| `LICENSE.ubasic` | the uBASIC BSD-3-Clause licence |
| `samples/*.bas` | example programs |
| `brickwright-media.json` | the media manifest |

## Provenance

- uBASIC upstream commit: `cc07193c231e21ecb418335aba5b199a08d4685c`
- `UBASIC.EXE` sha256: `d468484b3e122c0f79ba80822868459932b31c8c5f4a4c83bb54590911c88deb`
- Toolchain: `ia16-elf-gcc -mcmodel=small -march=any_186 -O2`
