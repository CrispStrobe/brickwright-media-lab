# Native i80386 terminal validation — startup v2

These are new-image/new-runner observations, separate from immutable v1/v2.
Native i80386 means `ExperimentalI80386ATMachine`, ordinary `step`, fixed
`PCAT80386_EXPERIMENTAL` 6 MHz scheduling clock, 16 MiB address-space backing (sparse installed
640 KiB conventional + 512 KiB extended RAM) and the 1 KiB
D0000 DOS trap page. No OS, DOS/BIOS image, FreeDOS, extender or x87 backend.
The MZ loader uses PSP0800/image0810; startup-v2 initializes the real PIC/PIT,
80x25 mode3 BDA and native segment/FLAGS adapter. Records include complete
source inventories, runner/dependency hashes, device/CPU/RAM captures and raw
stdout/screen output. Scheduling cycles are not physical 386 cycle timing.

Measured media source: `8942cff96b59a8cdf3300a1990bcb8a71b921f8e`.
Candidate emulator: `fa26a41a21f3d948d49612ee2cdb26824334a53a`.
Frozen baseline emulator: `d19b5e4d2b8aa0f025fd7a3512db3252e470433d`.
`inventory.json` binds the original records and numeric host oracle; no producer
imports or replay are needed for `../../check-native-terminal.py`.

## Whetstone: native software-FP validation completed

Unmodified Netlib C1.2 source SHA256
`333e4ceca042c146f63eec605573d16ae8b07166cbc44a17bec1ea97c6f1efbf`.
Compiler ia16-elf-gcc6.3.0, options `-mcmodel=medium -march=i8086 -O2
-fno-builtin -mno-newlib-autofloat-stdio -DPRINTOUT`, link `-lm`, argument `1`.
New executable 83,776 bytes, SHA256
`f7003e37da058b1a41b8520b010c9791aafa10fa8a9cb11a4c0998055936b8ac`.
The old 70,256-byte executable SHA256
`063ecf407581ea608d90ae0baf918b85dbf166f2ce3692f7a948e08d6937e2b9`
used integer-only printf; its incomplete observations are not overwritten.

Both new-image runs exit0, have no unsupported services, and print all ten
numeric module rows equal to the unmodified-source host oracle at printed
precision. Both retire **24,021,261 instructions**, schedule **144,127,566
functional cycles**, and report **23 guest seconds / 4.3 KIPS**. Their entire
captured semantic state is equal, including RAM, CPU, devices and instructions.
The four console AX4400 queries are explicitly handled, not suppressed.

| Source | Host CPU s | Host wall s | Execution CPU s | Execution wall s |
|---|---:|---:|---:|---:|
| Candidate fa26a41a | 24.857002 | 24.719928237 | 24.394591 | 23.683597618 |
| Baseline d19b5e4d | 24.136263 | 24.051704279 | 23.661926 | 23.030442386 |

These are one observation per source, candidate then baseline, not repeated
alternating pairs. There is **no speedup claim or general 386 timing result**.
PRINTOUT and the functional guest clock make this a terminal/numeric validation
of software FP, not a physical CPU/FPU score. The host oracle exits1 because
its own duration is too short; it is used only for the printed module values.

Exact CLI (output directory must be new; no app asset bundling):

```sh
projects/x86-benchmarks/whetstone/build.sh 8086 absent "$WHT_BUILD"
node projects/x86-benchmarks/run.mjs --board "$CANDIDATE" \
  --project "$WHT_BUILD" --variant 80386 --max 30000000
node projects/x86-benchmarks/run.mjs --board "$BASELINE" \
  --project "$WHT_BUILD" --variant 80386 --max 30000000
```

The measured 8942cff collector is pinned in both raw records. Later screen-only
collection polish does not relabel these originals or require their replay.

## TOPBENCH: terminal, still unqualified

Unmodified release0.40c binary SHA256
`c739a73c6955d9798cfeae2d7b0c46011fdc9f943071ecf2bb730ebf4eab52eb`,
upstream source commit `40a15475ecbbd9dc47d9b578c70248593c511980`.
The exact compiler is unknown upstream. Its screen banner says **0.40b**;
release identity and banner mismatch are preserved.

The fixed startup reaches upstream's intended exit4 at **2FB1:0226**, with
**2,222,281 retired instructions / 13,933,440 functional cycles**. There is no
remaining delivered CPU exception in the terminal record. Host CPU/wall are
4.035742s / 3.252535411s; execution CPU/wall are 3.418329s / 2.246568578s.
CRT writes go to B800 memory; INT21 stdout is empty. Raw screen rows:

```text
TOPBENCH | 16-bit real-mode x86 Benchmarking Suite | Version 0.40b
Score:                  19
Memory:                 923
Effective addressing:   393
Opcode exercise:        420
Vid adapter speed:      340
3DGame opcode exercise: 444
```

The microsecond suffix's raw character encoding is preserved in the JSON.
These are observations, **not accepted benchmark scores**. Remaining blocker:
INT10 AH11 font-information query (once), AH1A display-combination query
(twice), AH12 EGA-information query (twice) are unsupported. Earlier diagnostic
requests identify AX1130, AX1A00 and AH12/BL10 respectively; terminal accounting
retains the exact AH/counts. No font ROM or EGA/VGA BIOS is supplied. Complete
these declared video-query contracts with real positive/refusal controls before
qualifying TOPBENCH. Do not whitelist these errors or infer performance from
exit4 alone.

The prior actual #DE was DIV BL at native **2E79:0117** (upstream reports
2669:0117 after relocation adjustment): ES40:004A columns was zero. The new BDA
and actual timer controls repair that startup failure. The native service also
stops forcing legacy F000 FLAGS into a 386 return. None is an instruction-core
optimization. The collector now selects the TOPBENCH screen channel explicitly;
the retained 8942cff original stays terminal-unqualified.

```sh
node projects/x86-benchmarks/run.mjs --board "$CANDIDATE" \
  --project projects/x86-benchmarks/topbench --variant 80386 --max 30000000
```

Legacy 8086/186/286 workload completion is not established by these native runs.
Historical Sieve remains **CPU1.009895 / wall1.013227, NO speedup**. Achieved
actual xv6 **CPU-6.45% / wall-7.68%**, opt-in, remains separate and parked.
