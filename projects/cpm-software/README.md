# CP/M-80 software (Z80)

Libre programs for BrickWright's **Z80 CP/M** machine. A CP/M `.COM` loads at
`0x0100` and runs interactively on the machine's CP/M layer — the BDOS answers
behind `CALL 5`, exactly the way lite boots R.T. Russell's BBC BASIC (Z80) as
its built-in default. Everything in this directory is our own work under
**BSD-2-Clause**, with sources and a reproducible build.

## What's here

| Program | Source | Built with | Does |
|---|---|---|---|
| `sieve.com` | `src/sieve.c` + `src/crt0.s` | **SDCC** (C → Z80) | prints the primes below 50 via BDOS 2 — a real cross-compiled C program |
| `hello.com` | `src/hello.asm` | **pasmo** (Z80 asm) | prints a greeting via BDOS 9 and returns to `A>` |

Both are proven on BrickWright's CP/M layer:

```
sieve.com → Primes below 50 (SDCC C on CP/M):
            2 3 5 7 11 13 17 19 23 29 31 37 41 43 47
hello.com → Hello from CP/M 2.2 on BrickWright!
```

## Run it

**In the browser (brickwright-lite):** load `sieve.com` (or `hello.com`) into the
Z80 machine's **`com`** media slot. It boots over the CP/M shim and prints to the
console — the same interactive path as the built-in BBC BASIC. Swap the program
by putting a different `.COM` in the `com` slot.

**On the command line (bw-board):** these are ordinary CP/M 2.2 programs, so they
also run on the **real** CP/M 2.2 boot — DRI's genuine CCP+BDOS on our MIT BIOS
with a RAM-disk (`scripts/cpm-smoke.mjs`, see that repo's `roms/cpm/PROVENANCE`
for the Bryan Sparks / DRDOS Inc. 2022 license grant that makes CP/M 2.2
redistributable).

## Rebuild from source

The committed `.COM`s are ours; `build.sh` rebuilds them **byte-for-byte** so they
are verifiable, not trusted:

```sh
./build.sh          # needs pasmo + sdcc (both free software; apt: pasmo sdcc)
```

SHA-256 of the reproducible output:

```
18ef66fc24ef335ee1b6f8cf78b69996aad73993c484b36b67d128d8b2494fdf  hello.com
8caf606b539ca950bd25f185ce977c69ef57c09278a10b8a2f1b2c791d73d8f9  sieve.com
```

## Roadmap — the wider CP/M ecosystem

This project is the guaranteed-libre baseline. The larger CP/M world is reachable
in stages, and it's worth being straight about which stage each thing is at:

- **Real CP/M 2.2 boot, in the GUI.** The real CCP+BDOS boot (the `A>` prompt,
  `DIR`, running several programs off a disk) exists **today on the command line**
  (`cpm-smoke.mjs`) but is **not yet wired into the browser**, which currently
  runs one `.COM` at a time over the BDOS shim. Wiring the real boot into lite's
  debug-runner is the single highest-value next step — it turns this from a
  program launcher into a CP/M *computer*, and is the foundation for everything
  below.
- **CP/Mish** (David Given, permissive). Its releases are **bootable disk images
  per machine** (Kaypro II, Nabu, …), not loose `.COM`s, so its programs arrive
  through the real-boot path above (or by extracting them with `cpmtools`).
- **Palo Alto Tiny BASIC and other clearly-PD classics.** Genuinely public-domain
  CP/M programs, added here once each one's provenance is individually vetted.
- **CP/M 3 / Z-System (ZCPR3 + ZSDOS).** These are whole *systems*, not TPA
  programs — they need the banked/CBIOS real-boot path, not the shim. (ZSDOS is
  freeware-with-registration; its terms are checked before it is ever packaged.)

See `docs/RUNNING.md` and `docs/CANDIDATES.md` in this repo for the full CP/M map.

## License

BSD-2-Clause — see `LICENSE`. The build tools (pasmo GPL-3.0, SDCC GPL) are not
distributed here; you install them yourself to rebuild.
