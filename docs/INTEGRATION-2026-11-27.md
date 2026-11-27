# Learning-lab delivery and branch integration — 2026-11-27

This record connects the recommendation review, implemented lessons, existing
branch integration, and observed validation. The full recommendation catalog is
[LEARNING-EXPERIENCES.md](LEARNING-EXPERIENCES.md); the status ledger is
[CANDIDATES.md](CANDIDATES.md).

## Delivered work

| Area | Delivered result | Primary evidence |
|---|---|---|
| Documentation | Reconciled CPU/OS/compiler/firmware status, corrected stale RV32 and x86 claims, and documented 14 learning experiences with observable activities and next dependencies | [Documentation PR #39](https://github.com/CrispStrobe/brickwright-media-lab/pull/39), merged as `e5e2631ff30420adfa41d367aecbca91a2759c97` |
| Original 6502 animation | Editable original source, validating encoder, reproducible ROM player, real guest framebuffer capture, changed-frame proof, and HTML replay | [Project and commands](../projects/6502-animation/README.md), [proof](../projects/6502-animation/proof.mjs) |
| Tali Forth 65C02 | Pinned upstream, reproducible platform ROM, interactive/script console, definitions/variables, actual framebuffer and VIA writes, and fresh-machine isolation | [Project and commands](../projects/tali-forth-65c02/README.md), [proof](../projects/tali-forth-65c02/proof.mjs) |
| PicoBB storage | Reproducible formatted LittleFS fixture, SAVE/LOAD/RUN, new-SoC readback retaining only flash, and pristine-image negative control | [PR #40](https://github.com/CrispStrobe/brickwright-media-lab/pull/40), [project proof](../projects/picobb-rp2040/proof.mjs) |
| Whetstone package | Preserved exact executable/source/notices, corrected native i80386 route, shared manifest validation, verified cache support, and actual completed native execution | [PR #37](https://github.com/CrispStrobe/brickwright-media-lab/pull/37), [retained run record](../projects/x86-benchmarks/results/route-validation-2026-11-27.json) |
| CI | Checksum-pinned 64tass bootstrap, Tali source-to-ROM reproduction, benchmark regression review, and existing project proofs | [Workflow](../.github/workflows/verify.yml), [assembler helper](../scripts/prepare-64tass.sh) |

The animation package starts with raw ROM-resident frames. Compression, SD
streaming, and an installed browser editor remain follow-ups. Tali's dictionary
and display are intentionally ephemeral. PicoBB establishes readback after a
completed save; interrupted writes and browser/physical storage durability
require separate experiments. Other recommended runtimes remain candidates
until their own packages and proofs exist.

## Remote checkpoints and integration order

The documentation was published and merged before implementation. Work was
then checkpointed to remote feature branches rather than kept only in a local
working tree:

- `docs/learning-experiences-20261127`: documentation checkpoints `704b6cce`
  and `a391ff43`, merged in PR #39.
- `feat/learning-lab-20261127`: first executable lesson checkpoint
  `046e38094781d7f17f6b4748e5d1f5c71f6164f9`; later checkpoints contain the
  interactive runners, complete instructions, CI setup and integration record.
  [Lesson PR #41](https://github.com/CrispStrobe/brickwright-media-lab/pull/41)
  merged checkpoint `c0d3760231e23f52a30b56c3557fc750fb1ad043` to main as
  `25fe63096a92ed8079cbf14e8187014e9201e8a9`.
- `lane/native386-benchmark-gui-assets-20261115`: route correction
  `a3edfed7a459f18e2555c7f3683638d55b4c8ae7` and retained validation record
  `99ddd23c93e1c84585f056e906f2dbea1fbc9caf`; merged in PR #37 as
  `147d66c57a9594e28f5e5a2fbb81c887c161a92c`.
- `feat/picobb-formatted-flash`: extended proof checkpoint
  `4e842edadc006f2d2094c2c18fd717c0ff3de91d`; merged in PR #40 as
  `ce5c1e3cce638600dd248b9f048dba6a25b044ba`.
- The lesson branch then incorporated those main-branch merges in
  `34b42b7c0fa146e9793d0c7aa7ed8fd9d7accff2`, preserving their histories.

## Validation

The general workflow's bw-board pin remains
`4869e77752e110910ac56520bc1f47a9cded97f4`. The separate KIM job retains its
existing pin `8f823cbacdf2ea9ce74818151b870892e568d0bd`. The current engine used
for additional lesson and native-386 checks is
`b47e7e09ed873b33ca2fd912b21e136decc5e677`.

| Check | Observed result |
|---|---|
| General verifier, existing pin, `node scripts/ci-verify.mjs --fetch` | **18 pass, 0 fail, 17 explicit skips**, 35 projects. Required 64tass was supplied; all attempted fetches succeeded and verified. |
| Benchmark `review.sh` | **18/18 tests**, three asset proofs, retained-data readers and negative controls pass. |
| Original animation, both engines | **16 complete 8192-byte guest frame comparisons** across two starter loops, an edited second frame, and a fresh reset; independent geometric oracle, RAM/display agreement and guest store counts. |
| Tali, both engines | Typed word produces 49, redefinition 50, variable 42; all 2048 display bytes checked; VIA 85/170; fresh-instance isolation; missing/altered ROM refusal. Each fresh boot performs exactly 2048 guest display-initialization stores. |
| Reproducible builds | Original animation rebuild matches the committed ROM; Tali builds byte-identically from a fresh upstream clone with 64tass 1.60.3243. |
| PicoBB, both engines | **41 checks** pass across initial save/reload, fresh-instance retained-flash readback, and pristine-image control. Simulated boot/session durations: 5534 / 2948 / 2954 ms. |
| Actual Whetstone native execution | Exit 0 after **24,021,727 progress steps**; all ten numeric modules valid, positive guest-clock duration, zero unsupported services. Exact executable unchanged. |
| Runners | Original and edited animation bundle capture; arbitrary Forth script and interactive recovery/multiline/exit paths; actual guest-pixel export. |

The general verifier passes `6502-animation`, `ack`, `bbc-basic-z80`,
`cpm-software`, `elks`, `f83`, `fe-dos`, `forth-cpm`, `forth-dos`,
`ms-basic-6502`, `picobb-rp2040`, `riscv32-linux`, `small-c`,
`tali-forth-65c02`, `tcl-dos`, `ubasic-dos`, `volksforth`, and `x86-benchmarks`.
The last entry's general proof checks assets; the separate retained Whetstone
record establishes actual guest execution.

The 17 skips remain visible: three KIM projects require the separate KIM
engine/job; four directories have no media manifest; ten projects lack an
executable route supported by this general harness. A skip is not a passing
boot claim. The KIM job is unchanged and is not included in the 18-pass total.

Hosted GitHub Actions runs were still **queued** during this integration.
The results above describe the local configured runs, not completed hosted
checks. Inspect the final branch/main workflow runs for later hosted results.

### Artifact identities

| Artifact | SHA-256 |
|---|---|
| Original animation ROM, 32 KiB | `45504aefefd3adc676028013b568332289876da79afc3f682045d6052e41c396` |
| Tali ROM, 32 KiB | `81c331f6afcd7f7049dbf51e65d839d0a483ef0699697586819bbeff95e74703` |
| Formatted PicoBB UF2 | `f0acd59bfd93182c2dcde4af65d36f3d20cf2e8eecc6c6ec760c1ac9654264d8` |
| Whetstone WHT.EXE, 83,776 bytes | `f7003e37da058b1a41b8520b010c9791aafa10fa8a9cb11a4c0998055936b8ac` |
| Official 64tass 1.60.3243 source archive | `9d83be3d23a2c55e085b7c7a7856c2f96080447ea120a6a8c21a217ed76427f0` |

## Existing branch audit

The initial remote inventory contained 28 branches including `main`. Two
branches held useful unmerged work and were integrated after review and fixes:
PicoBB formatted flash and the Whetstone validation package described above.

### Already integrated historical branches

These 21 branches were already represented by merged or squash-merged work.
Re-merging their old tips would not deliver a new feature and could revive
obsolete changes. They were left intact.

| Branch | Audited head prefix |
|---|---|
| `add/fe-dos-lisp-20261006` | `769b7a6a795a` |
| `add/tcl-dos-partcl-20261006` | `89df261fc738` |
| `add-ack` | `5183a3e0b948` |
| `add-candidates-ledger` | `9459a8163cdb` |
| `add-elks-os` | `9e327a219fd7` |
| `add-freedoom-fastdoom` | `bc36d5140dde` |
| `add-minix-languages` | `76223f6a7308` |
| `batch/minix2-msdos-opengem` | `da171ac3c7d6` |
| `ci/media-lab-elks-riscv` | `c6df3bcbf091` |
| `ci/media-lab-fetch-prebuilt` | `061111245f40` |
| `ci/media-lab-verify` | `e745e96cb356` |
| `elks-programming-vm` | `a04e82600014` |
| `feat/kim-expansion-media` | `ba4ca405a8f8` |
| `lane/forth-cpm-20261012` | `5cac4100c9ed` |
| `machine-manager-design` | `56862c2d647f` |
| `media/ci-hardening` | `d14a75acd31f` |
| `media/forth-dos` | `3f77867f054a` |
| `migrate/picobb-runrp2040bundle-20261005` | `613db078c7a8` |
| `project/bbc-basic-z80` | `f034b7e367ee` |
| `project/ms-basic-6502` | `8ae866bcb3ff` |
| `project/picobb-rp2040` | `f18e52ede170` |

### Intentionally separate or superseded

| Branch | Decision and reason |
|---|---|
| `media/riscv32-linux-v1` (`07132874`) | Keep the orphan media-distribution history separate. Main already uses its pinned kernel/initramfs/snapshot artifacts; an unrelated-history merge would not add an implementation. |
| `media/elks-v0.9.2` (`1ebf1392`) | Keep the immutable CORS floppy mirror separate, as its `MEDIA-MIRROR.md` directs. |
| `media/adafruit-cad-parts-9f2a89f3` (`fb6c7632`) | Keep the large immutable CAD archive on its distribution branch; main references it. |
| `lane/forth-io-20261012` (`f72373e8`) | Closed PR #30 was superseded by merged PR #32's Forth GPIO work. Do not resurrect the earlier implementation. |

No remote branch was deleted, no unrelated histories were forced together,
and no dependent repository's branches were merged as part of this media-lab
integration.
