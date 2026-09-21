# Small-C — a C compiler that runs on the 8086 (DOS)

Upstream: <https://github.com/ZaneDubya/Small-C> (reconstructed toolchain
with 16-bit DOS binaries) — J. E. Hendrix's **Small-C 2.5**, the classic
public-domain C compiler descended from Ron Cain's Dr. Dobb's Small-C.
This is the answer to "a libre C compiler that runs *natively* on the
8086": the compiler executable itself is a 16-bit DOS program.

## Runs here — proven

`CC.EXE` loads on BrickWright's 8086 DOS layer, prints its banner, and
actually **compiles** — given no input it emits the assembly skeleton of
an empty program:

```
Small C, Version 2.5, Revision Level 170
Copyright 1982, 1983, 1985, 1988 J. E. Hendrix
CODE SEGMENT PUBLIC
ASSUME CS:CODE, SS:DATA, DS:DATA
extrn __eq: near
...
END
```

Verified with bw-board `scripts/run-dos.mjs`:

```sh
node scripts/run-dos.mjs cc.exe --preset xt --max 3000000 --screen
```

So the compiler genuinely runs and generates 8086 assembly on the
emulated XT. **Caveat — the full pipeline is a tracked follow-up:** a
complete build is three programs (`cc.exe` → `asm.exe` → `ylink.exe`)
sharing a DOS filesystem, and `run-dos.mjs` runs one program at a time,
so compile→assemble→link→run end-to-end needs a persistent-filesystem DOS
session (or booted FreeDOS). The compiler stage is what's proven here.

## Licensing

**Public domain.** `license.txt`: "The source code for the Small-C
Compiler and runtime libraries (CP/M & DOS) … are hereby available for
royalty free use … retain the original copyright notices and credit all
prior authors (Ron Cain, James Hendrix, Zane Wagner, etc.)." Not ANSI —
it's a K&R **subset** C, period-authentic.

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/ZaneDubya/Small-C` (`code/bin/`)
- `cc.exe`    sha256 `9694a5815da3c808309a4270fd235e1f9bb2434a158a704558df198f4164e11d` (82,272 B) — the compiler
- `asm.exe`   sha256 `5944b382cf88ac121cfd2719e1bf737f402f6b425c7de22b0a1eb1185e81f6ad` (64,352 B) — Small-Assembler
- `ylink.exe` sha256 `8d34609ab49dc359d5098eb5a39b4a1dd7271951a840702016b82bd6a2f6744a` (37,104 B) — linker
- Runs on: `i8086` DOS layer — public domain

## Run it

```sh
./fetch.sh     # downloads cc/asm/ylink + license.txt, verifies sha256
```

Then run `cc.exe` on the 8086 DOS tier. This pairs with the ELKS/Minix
"compile→run" story: Small-C is the libre C front end that produces
8086 code on the machine itself.
