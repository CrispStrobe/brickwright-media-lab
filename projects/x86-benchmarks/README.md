# x86 benchmark assets and explicit runners

PR #36 is a bounded asset/cache/CLI harness delivery. TOPBENCH and Whetstone
remain **INCOMPLETE** on all four cores. Recorded native Sieve whole-child
CPU/wall ratios are **1.009895 / 1.013227: NO speedup**. The achieved actual
xv6 opt-in result (CPU -6.45% / wall -7.68%) is a separate workload and result.
GUI frontend wiring, core/FPU changes and additional benchmarks are outside
this PR. The explicit consumer contract below supports later GUI integration.

Review without downloads, builds, an emulator checkout or benchmark reruns:

```sh
projects/x86-benchmarks/review.sh
```

This runs cache/CLI/consumer regression checks, validates committed asset
bytes/notices, and independently recomputes the retained numeric observations.
It never imports the emulator or runs a guest.

This directory is runtime-fetchable media, offered by URL when requested.
It is separate from the MIT app repo/build, and is directly callable after
verified download into a user cache. Guest programs are loaded into emulated
memory; they are not linked into the host app. Preserve each project's license.

- `topbench/`: upstream TOPBENCH **0.40c**, MIT; no upstream 1.x release found.
  The DOS `program` manifest is compatible with the existing program path.
  `native-i80386.json` separately declares the native 386 real-mode DOS shim.
- `whetstone/`: original Netlib C 1.2 source with its complete permission block;
  `build.sh` makes separate CPU-specific, software-FP validation executables.
  This source bundle is not a compiled, completed Whetstone score.
- `native-sieve/`: owned MIT freestanding integer control, raw32 load/entry,
  explicit native i80386 manifest. It has no OS, BIOS image or extender.

Native 386 means `ExperimentalI80386ATMachine` / `PCAT80386_EXPERIMENTAL`.
The real-mode TOPBENCH loader adds exactly 1 KiB of RAM at D0000h for the
DOS service trap. The raw32 loader supplies flat protected-mode segment caches,
zeroed RAM and a fixed entry; the owned guest startup establishes its stack.
There is no FreeDOS fallback, acceptance-image dependency, DPMI or DJGPP runtime.
The byte-block WASM dispatcher is not enabled by these initial runs.

From a media-lab checkout with a committed bw-board checkout at `$BW_BOARD_DIR`:

```sh
node projects/x86-benchmarks/proof.mjs
node projects/x86-benchmarks/run.mjs --board "$BW_BOARD_DIR" \
  --project projects/x86-benchmarks/topbench --variant 80386 --max 20000000
# Then use --variant 80286, 80186, 8086; these call existing runDos on fixed XT.
projects/x86-benchmarks/native-sieve/build.sh
node projects/x86-benchmarks/run.mjs --board "$BW_BOARD_DIR" \
  --project projects/x86-benchmarks/native-sieve/.build --variant 80386 --max 10000000
```

Each run emits one JSON line with exact asset/source hashes, emulator commit,
runner identity, configuration, raw DOS/serial/screen output, guest counters,
CPU/memory state and host CPU/wall time. A failure exits 2 with its observed
record. DOS progress-step counts include host service transitions; only the
native 386 CPU counter is reported as guest instruction count. 386 machine
cycles are the core's fixed functional scheduling charge, not physical timing.

For optimization comparisons use alternating fresh children, excluded warmups,
and explicit baseline/candidate source directories:

```sh
python3 projects/x86-benchmarks/compare.py --baseline "$BASELINE" \
  --candidate "$CANDIDATE" --project "$BENCH_PROJECT" --variant 80386 \
  --output "$NEW_RESULTS_DIR" --pairs 7 --warmups 2
```

Guest failure, differing full captured state/instruction counts or changed
configuration refuses timing qualification. Benchmark scores are separate from
host-time ratios. A timeout is failure, never a score. No physical CPU/FPU,
80387, full DOS compatibility or default dispatcher adoption is claimed.

`proof.mjs` verifies asset bytes and complete notices only; it does not assert
benchmark completion. Raw performance/correctness observations are separate.
Heavy runs belong on local bounded resources or Kaggle CPU, not `ci:full`.

NSSI and 3DBench are not open licensed: do not add their binaries without
recorded written redistribution permission. Future packages must be fetch-only
with pinned hashes and retained notices. Dhrystone/LINPACK sources need exact
per-file provenance before mirroring; unclear files stay fetch-only.

Runtime cache/direct invocation (no app bundling):

```sh
node projects/x86-benchmarks/ensure.mjs --project topbench \
  --media-ref "$PINNED_MEDIA_COMMIT" --cache "$USER_BENCH_CACHE" \
  --run --board "$BW_BOARD_DIR" --variant 80386 --max 20000000
```

`ensure.mjs` downloads from the pinned media-lab Git revision, verifies every
asset hash, displays the license on stderr, and invokes the appropriate
runner from the user cache. Existing valid cached payloads are reused. Use
`--project native-sieve` for the explicit raw32 native runner. No asset is
committed to the app or its build artifact. Whetstone cache fetch supplies
source; `--run` invokes its verified helper with the installed 16-bit compiler
before guest invocation. A failed build prevents guest launch. `ensureBenchmark`
exports an `onNotice` callback and a cache path for a future GUI action; GUI
wiring must present that notice and explicitly select the native runner type.
A generic DOS-program GUI action is not yet a native-386 action.

Timing protocol v2 stops the parent wall timer immediately after child exit,
before parsing or writing records. It also records a separate execution interval
around the guest loop (DOS-loader cost is included on the legacy runDos path,
and excluded on native 386). The independent whole-child CPU measurement still
includes startup, input verification and capture. Device `getState()` snapshots
and hidden segment/system tables join CPU, RAM and instruction equality.
The original v1 parent-wall samples included record-writing overhead and must
not be relabeled as v2 whole-child wall measurements. Their guest observations
and failures remain valid and retained.


Node/desktop consumers can use the same reviewed path:

```js
const cached = await ensureBenchmark({project, ref, cache, onNotice: showNotice});
const plan = await createBenchmarkRunPlan({...cached, board, variant, max});
// Present plan.runnerKind; use a host process service to capture GUI output.
const exitCode = await runBenchmarkPlan(plan);
```

`createBenchmarkRunPlan` explicitly distinguishes `dos`,
`native-i80386-dos-shim` and `native-i80386-raw`. It refuses OS-media manifests,
unsupported native formats and raw images on legacy DOS variants. The returned
build/run arguments are serializable for a GUI host service. The CLI checks
required arguments and the board path before fetching. Runtime errors are
concise; guest incomplete exit 2 remains exit 2. A notice is displayed before
invocation, including when cached assets are reused offline. Actual frontend
wiring is deferred; `guiSupported: false` on the native manifests stays honest.
