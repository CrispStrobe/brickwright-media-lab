# First observed benchmark/control results — 2026-11-14

These are emulator observations, not asset-proof badges or physical CPU scores.
There are no FreeDOS images, DPMI/DJGPP runtimes or FPU-present results here.

The corrected **v2 native i80386** Sieve comparison completed **18/18** fresh
children with identical captured CPU/hidden segment/system-table/device state,
full RAM hash, serial output, guest instructions and functional cycles. Two
excluded warmup pairs precede seven measured alternating baseline/candidate
pairs. Every child reports:

```text
NATIVE386 SIEVE n=8192 passes=20 primes=1028 sum=3908641
```

Each executes **2,075,296 guest instructions / 12,451,776 functional machine
cycles**, at the fixed PCAT80386_EXPERIMENTAL 6 MHz configuration, FPU absent.
Raw32 image/load/entry is pinned in the native-sieve manifest and assets receipt.
The guest startup/loader is owned; no OS, BIOS image or extender is loaded.

Baseline: `d19b5e4d2b8aa0f025fd7a3512db3252e470433d`.
Candidate: `fa26a41a21f3d948d49612ee2cdb26824334a53a`.
Measured runner: media-lab `cb3649e73726b09f199dfac9f8c158e5e7589dcd`.

| Host interval | Baseline CPU / wall (s) | Candidate CPU / wall (s) | Candidate/baseline CPU / wall | Favorable pairs CPU / wall |
|---|---:|---:|---:|---:|
| Whole child (includes admission/startup/capture) | 1.784543 / 1.485955 | 1.802202 / 1.505610 | 1.009895 / 1.013227 | 1/7 / 1/7 |
| Guest execution loop | 1.404456 / 1.136014 | 1.422075 / 1.156773 | 1.012545 / 1.018274 | 2/7 / 1/7 |

**No Sieve speedup is observed.** The separate achieved xv6 opt-in result
(CPU -6.45% / wall -7.68%) describes a different workload/execution path and
remains separate. Do not subtract results measured on separate VMs.
The raw candidate record contains the actual Node/CPU/configuration identities.

`v2/raw-pair-outputs.json` retains every numeric child sample and unmodified
serial output with its original-record and captured-state hashes. The original
18 full records remain in the retained archive; one unchanged measured candidate
record is published as `v2/native-candidate-raw.json`. Independent inventory,
source/runner bindings, equality and arithmetic checks passed. Original archive
SHA-256: `afb33bed6676aaa0b0d806c233dd98283ec513ce01e60467a4d434ee3e4fef9e`.

## DOS probes: no valid TOPBENCH or Whetstone score

| Core | TOPBENCH 0.40c `-i` | Whetstone software-FP validation |
|---|---|---|
| Native i80386 | Incomplete at 20M progress steps | Incomplete at 20M progress steps |
| 80286 | Incomplete at 20M progress steps | Incomplete at 20M progress steps |
| 80186 | Incomplete at 20M progress steps | Incomplete at 20M progress steps |
| 8086 | Incomplete at 20M progress steps | Incomplete at 20M progress steps |

All raw observations are in `v1/`. TOPBENCH emitted no text/score and recorded
unsupported INT21h/AH44h and INT10h/AH11h once each. Whetstone emitted module
validation text, with unusable `e` floating-point formatting, and recorded
unsupported INT21h/AH44h four times. Neither terminated within the original
20M bound; no refusal is muted and no failed run qualifies a comparison.
Legacy runDos progress steps include DOS-service transitions, and are explicitly
not reported as exact guest instruction counts. Native counters are available
in the raw records. Timer/BIOS initialization is a follow-up hypothesis, not an
established explanation or qualified fix.

The original v1 Sieve guest-equality audit passed, but its parent wall interval
included record-writing overhead. Those original samples remain annotated;
they are not relabeled as corrected v2 whole-child measurements. Only the
native paired comparison was rerun after the timing/capture code changed.
The failed DOS probes were not repeated. Each original archive was acquired
once; auxiliary API throttling after successful download did not trigger a
second artifact download.
