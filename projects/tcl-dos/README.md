# partcl — a tiny libre Tcl that RUNS on the 8086 (DOS)

Upstream: <https://github.com/zserge/partcl> — **partcl**, a minimal Tcl
interpreter by Serge Zaitsev, © 2016, **MIT**. Pinned at commit
`1ed1df73907875ee770ac65e6546bd56fbc6f637` (`LICENSE.partcl` is the upstream
licence, copied verbatim).

partcl is a single ~650-line `tcl.c`: `set` / `proc` / `if` / `while` /
`return`-`break`-`continue`, command substitution `[...]`, `$var`, brace
grouping, and prefix arithmetic (`+ - * / < > <= >= == !=`). No header, no
dependencies — which is exactly what makes it a clean fit for a 16-bit target.

## What it is

`TCL.EXE` is a real MS-DOS `MZ` executable built with
[`ia16-elf-gcc`](https://github.com/tkchia/build-ia16) (the GCC port for
16-bit x86). Unlike [ACK](../ack), whose compiler is a host tool, partcl is
**itself a DOS program** — it runs *on* the emulated 8086, reads a Tcl script
from `PROG.TCL` via INT 21h file I/O, and prints results (its `puts` command)
through the C library (INT 21h). It is the **Tcl** entry in the lab's
DOS-native interpreter set, alongside [ubasic-dos](../ubasic-dos) (BASIC),
[small-c](../small-c) (C), [fe-dos](../fe-dos) (Lisp) and
[f83](../f83) / [volksforth](../volksforth) (Forth): a genuine interpreter
running on the machine, not merely one whose output does.

The only code added on top of upstream is `dosmain.c` — a DOS front-end
(public domain) that reads `PROG.TCL` and evaluates it. partcl is one
translation unit (`tcl.c`, no header), so `dosmain.c` `#include`s it with
`TEST` defined, dropping `tcl.c`'s own stdin-REPL `main()`. Nothing in `tcl.c`
is modified.

## Proven — runs on the emulated 8086

Mounting `samples/demo.tcl` as `PROG.TCL` and running `TCL.EXE` on bw-board's
i8086 DOS bench prints, deterministically:

```
partcl on DOS (8086)
42
120
720
```

(a banner, `[* 6 7]` = 42, and a recursive `fact` proc: `fact 5` = 120,
`fact 6` = 720 — i.e. `puts`, `set`, `proc`, `if`, `<=`, `*`, `-` and command
substitution, the core of the language). partcl's numbers are integers, so the
output is exact.

## Reproduce it

```
./fetch.sh          # clones zserge/partcl at the pinned commit and rebuilds TCL.EXE
```

Build flags (see `fetch.sh`): `-march=any_186` (the DOS bench's C variant runs
the 80186 ISA — `LEAVE` / `PUSH imm` / `IMUL`), and `-mcmodel=small` (partcl is
integer-only — no soft-float, unlike [fe-dos](../fe-dos) — so code and data each
fit a single 64K segment). The committed `TCL.EXE` reproduces byte-for-byte on
the same toolchain (`ia16-elf-gcc`).

## Run it yourself

From a bw-board checkout:

```
node scripts/run-dos.mjs TCL.EXE --preset xt --variant 80186 \
     --file PROG.TCL=samples/demo.tcl --max 60000000 --quiet
```

In brickwright-lite the same `TCL.EXE` runs on the browser DOS bench (the i8086
machine), reading your own Tcl source mounted as `PROG.TCL`.

## Licences

- **partcl** — MIT, © 2016 Serge Zaitsev (`LICENSE.partcl`).
- **`dosmain.c`** — public domain (written for this lab project).
- **Build/runtime** — `ia16-elf-gcc` is a GPL build tool; the produced program
  statically links newlib + libi86, both permissive.
