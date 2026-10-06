# fe — a tiny libre Lisp that RUNS on the 8086 (DOS)

Upstream: <https://github.com/rxi/fe> — **fe**, a tiny Lisp interpreter by
rxi, © 2020, **MIT**. Pinned at commit
`ed4cda96bd582cbb08520964ba627efb40f3dd91` (`LICENSE.fe` is the upstream
licence, copied verbatim).

fe is ~900 lines of portable C: lambdas, closures, macros, a mark-and-sweep
garbage collector over a **fixed object pool**, and no heap allocation after
startup. That self-containment is exactly what makes it a clean fit for a
16-bit target.

## What it is

`FE.EXE` is a real MS-DOS `MZ` executable built with
[`ia16-elf-gcc`](https://github.com/tkchia/build-ia16) (the GCC port for
16-bit x86). Unlike [ACK](../ack), whose compiler is a host tool, fe is
**itself a DOS program** — it runs *on* the emulated 8086, reads a fe program
from `PROG.FE` via INT 21h file I/O, and prints results through the C library
(INT 21h). It is the **Lisp** complement to the DOS-native BASIC
([ubasic-dos](../ubasic-dos)) and C ([small-c](../small-c)) already in the lab:
a genuine interpreter running on the machine, not merely one whose output does.

The only code added on top of upstream is `dosmain.c` — a DOS front-end
(public domain) that reads `PROG.FE` and evaluates each top-level form. Nothing
in `fe.c`/`fe.h` is modified. (Upstream's bundled `FE_STANDALONE` main is a
stdin REPL and sizes a 64000-byte pool that leaves no room for the stack in a
small-model `.exe`, so the lab ships its own `main` with a 32000-byte pool.)

## Proven — runs on the emulated 8086

Mounting `samples/demo.fe` as `PROG.FE` and running `FE.EXE` on bw-board's
i8086 DOS bench prints, deterministically:

```
fe Lisp on DOS (8086)
6 * 7 = 42
5! = 120
fib(10) = 55
```

(a banner, integer arithmetic, a recursive `factorial`, and a recursive
`fibonacci` — i.e. `fn`, `if`, `<=`, `*`, `-`, `+` and `print`, the core of the
language, all working). fe's number type is `float`; the demo's values are
whole, so the output is exact (`%.7g` of `42.0` is `42`).

## Reproduce it

```
./fetch.sh          # clones rxi/fe at the pinned commit and rebuilds FE.EXE
```

Build flags (see `fetch.sh`): `-march=any_186` (the DOS bench's C variant runs
the 80186 ISA — `LEAVE` / `PUSH imm` / `IMUL`), and `-mcmodel=medium` (fe plus
newlib's soft-float `%g` formatting is just over the 64K a small-model code
segment allows, so far code / near data). The committed `FE.EXE` reproduces
byte-for-byte on the same toolchain (`ia16-elf-gcc`).

## Run it yourself

From a bw-board checkout:

```
node scripts/run-dos.mjs FE.EXE --preset xt --variant 80186 \
     --file PROG.FE=samples/demo.fe --max 60000000 --quiet
```

In brickwright-lite the same `FE.EXE` runs on the browser DOS bench (the i8086
machine), reading your own fe source mounted as `PROG.FE`.

## Licences

- **fe** — MIT, © 2020 rxi (`LICENSE.fe`).
- **`dosmain.c`** — public domain (written for this lab project).
- **Build/runtime** — `ia16-elf-gcc` is a GPL build tool; the produced program
  statically links newlib + libi86, both permissive.
