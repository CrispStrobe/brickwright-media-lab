# Native TOPBENCH functional terminal completion

The unmodified pinned TOPBENCH binary now completes `-i` under the explicitly
bounded [native CGA query contract](../../native-video-queries.md). This new
result does not alter v1 incomplete observations or v3 terminal-unqualified
observations. It is a native i80386 real-mode shim run, not FreeDOS or a
physical-386 timing result.

- Measured media/runner source: `81b5cea56114c36cef7c1f85c693a4ff707a4606`.
- Emulator source: `fa26a41a21f3d948d49612ee2cdb26824334a53a`.
- Runner SHA256: `0c63b55d9bb589e81e71570fb0bcf24067dd39daebaebd446f14bdcadd939901`.
- Native adapter SHA256: `7063ae8094a3fcdaef281780e6c25ac8d7aa3f738aafc65c10bca286090e1afa`.
- Binary SHA256: `c739a73c6955d9798cfeae2d7b0c46011fdc9f943071ecf2bb730ebf4eab52eb`.
- Upstream source: `40a15475ecbbd9dc47d9b578c70248593c511980`, release0.40c.
  Exact upstream compiler is unknown. The executable's 0.40b banner mismatch
  remains visible in the raw screen.

Loader is the owned `createDos8086` MZ loader, PSP0800/image0810, with
`native-i80386-dos-startup-v3` PIC/PIT, text BDA and native FLAGS/segment adapter.
Preset is `PCAT80386_EXPERIMENTAL`, 6 MHz functional clock, 16 MiB backing with
sparse installed RAM exactly as recorded, plus the 1 KiB D0000 trap page.
Video remains CGA/B800 text; FPU absent; DOS image, BIOS image and extender null.
The source inventory and complete runner dependency hashes are in the JSON.

The run reaches **exit4**, no exception, zero unsupported services, after
**2,222,281 retired instructions / 13,933,440 functional scheduling cycles**.
All five extension-probe requests and unchanged register responses are retained
as explicit `absent-on-cga` outcomes. No EGA/VGA/font capability was invented.
The terminal gate requires that exact sequence, exit4 and all six finite
positive screen fields; missing, extra or fabricated positive responses fail.

```text
Score:                  19
Memory:                 923
Effective addressing:   393
Opcode exercise:        420
Vid adapter speed:      340
3DGame opcode exercise: 444
```

These scores describe this emulator's functional clock only. Raw CP437 suffix
bytes remain represented by the captured characters in JSON. INT21 stdout is
empty: the program writes through CRT to B800 screen memory.

Host process CPU/wall: **4.149527s / 3.226605820s**. Guest-loop interval:
**3.600541s CPU / 2.415080496s wall**. This is one observation with no baseline
pair: **no speedup, physical timing or general native386 timing claim**.
No successful workload was replayed to re-read it; v3 Whetstone validation
remains complete for its separately pinned new build, without a rerun here.

Exact invocation from this media checkout:

```sh
node projects/x86-benchmarks/run.mjs --board "$BW_BOARD_DIR" \
  --project projects/x86-benchmarks/topbench --variant 80386 --max 3000000
```

Qualification used a nonblocking exclusive heavy-work lock, free reserve above
12 GiB and explicit memory/load/CPU/wall bounds. The completed run stayed inside
its three-million-progress-step limit. The eight real-native startup/service/
query controls include actual INT/return paths, unknown-request and non-CGA
refusals, and damaged query-gate records. The standalone retained-data reader
adds seven damaged-record controls without importing the producer or a guest.

```sh
BW_BOARD_DIR="$BW_BOARD_DIR" node --test projects/x86-benchmarks/native-dos.test.mjs
python3 -B projects/x86-benchmarks/check-native-video.py
```

Legacy 8086/186/286 completion is not established here. Sieve retains its
**1.009895 CPU / 1.013227 wall, NO speedup** outcome. Achieved opt-in xv6
**CPU-6.45% / wall-7.68%** stays separate, completed and parked.
