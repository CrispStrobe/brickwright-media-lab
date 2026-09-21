# ACK — libre Pascal (and C, Modula-2) that RUNS on the 8086

Upstream: <https://github.com/davidgiven/ack> — the **Amsterdam Compiler
Kit**, © 1987–2005 Vrije Universiteit Amsterdam, **BSD-3-Clause**
(license in the repo's `Copyright` file, copied here as `COPYING.ACK`).

ACK is a complete cross toolchain with first-class front ends for **ANSI
C, Pascal, Modula-2 and Basic**. Its `msdos86` platform emits **i86
MS-DOS `.COM`** programs. So ACK is the answer to a real gap: *no libre
Pascal runs natively on our 8086 today.* ACK gives us one — not by
running the compiler on the 8086 (it runs on a modern host), but by
producing 8086 programs that **do** run there.

This is the complement to the [Small-C](../small-c) project: Small-C's
*compiler* is itself a 16-bit DOS program; ACK's compiler is a host tool
whose *output* is the 8086 program. Both put a libre language on the
machine.

## Proven — compiled by ACK, run on our 8086

The three sources in `samples/` were compiled with ACK
(`ack -mmsdos86 -O`) at the pinned commit below, and each **runs on the
bw-board 8086 DOS service layer** (`scripts/run-dos.mjs --preset xt`).
Captured output:

**Pascal** — `samples/sieve.p` → `sieve.com`

```
$ node scripts/run-dos.mjs sieve.com --preset xt --max 6000000 --quiet
Primes up to 50:
   2   3   5   7  11  13  17  19  23  29  31  37  41  43  47
done.
sieve.p, 27: file OUTPUT: close error
```

**C** — `samples/fact.c` → `fact.com`

```
$ node scripts/run-dos.mjs fact.com --preset xt --max 6000000 --quiet
Factorials, compiled by ACK, running on the 8086:
1! = 1
2! = 2
3! = 6
4! = 24
5! = 120
6! = 720
7! = 5040
8! = 40320
```

**Modula-2** — `samples/sieve.mod` → `sievemod.com`

```
$ node scripts/run-dos.mjs sievemod.com --preset xt --max 6000000 --quiet
Primes up to 50, from Modula-2:
   2   3   5   7  11  13  17  19  23  29  31  37  41  43  47
done.
```

All output is correct. The one cosmetic wart: ACK's **Pascal** runtime
prints `file OUTPUT: close error` *after* its correct output, because it
closes the `OUTPUT` file at exit with a DOS call the functional service
layer doesn't implement. It is a clean-up message, not a failure — the
numbers are all there and correct. C and Modula-2 exit clean.

## The other ACK path — native, inside Minix (not yet reachable here)

ACK is also the *native* compiler shipped inside the Minix distributions
(see the [`minix-1.7`](../minix-1.7) project): there `cc`/`pc`/`m2` run
**on the 8086 itself**, under Minix. That path needs a booted Minix
userland, which our Minix floppy reaches the boot monitor of but does not
yet run to a shell. Until it does, the **cross** path proven here is how
ACK's Pascal reaches our 8086. This project is that cross path, packaged.

## Licensing

**BSD-3-Clause** (`COPYING.ACK`). ACK was relicensed from its original
academic terms to BSD by the Vrije Universiteit. The compiler is a host
build tool; the `.com` files here are its output and carry the same
permissive terms. No GPL anywhere in this project.

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/davidgiven/ack`
- Pinned commit: `7afa32a0a0f13e865fa2e8104e442689005cd627`
- Target platform: `msdos86` (i86 MS-DOS `.COM`)
- Shipped binaries (compiled by ACK from `samples/`):
  - `sieve.com`    sha256 `db1ce4885bc04a942ac503730168af5e639c584a81e1077e3fc7e21fb732ae5c` (Pascal, 4,138 B)
  - `fact.com`     sha256 `f53d2a613deb2b5da1b107c18570ae3e131c532ed76522279acbe85e0c916bf7` (C, 13,990 B)
  - `sievemod.com` sha256 `c9be50f40ce0b8076872b861852d7c4e9f99491aabc7fdd0a04122fc6f6c66b1` (Modula-2, 18,688 B)
- Runs on: `i8086` DOS layer via bw-board `scripts/run-dos.mjs`

## Reproduce

```sh
./fetch.sh     # clone ACK@pinned, build msdos86, recompile the three samples
```

Build deps: `build-essential flex bison lua5.3 lua-posix python3` (ACK
needs "Lua of any version with the lua-posix library", plus flex/yacc,
GNU make and Python 3.4+; ~1 GB in the build dir). The pre-built `.com`
files are committed so you can run the manifest **without** building ACK;
`fetch.sh` is for reproducing them from source.

## Run it

```sh
node scripts/run-dos.mjs sieve.com    --preset xt --max 6000000 --quiet   # Pascal
node scripts/run-dos.mjs fact.com     --preset xt --max 6000000 --quiet   # C
node scripts/run-dos.mjs sievemod.com --preset xt --max 6000000 --quiet   # Modula-2
```
