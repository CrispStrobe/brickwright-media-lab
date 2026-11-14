# Netlib C Whetstone 1.2 — licensed source and separate software-FP builds

Unmodified original: https://www.netlib.org/benchmark/whetstone.c (22 March
1998), SHA-256 `333e4ceca042c146f63eec605573d16ae8b07166cbc44a17bec1ea97c6f1efbf`.
This upstream is not Git-versioned; the exact content hash is its source pin.
The **entire** opening comment/permission/limited-rights reference is retained
in `source/whetstone.c` and copied verbatim into LICENSE.

`fetch.sh` verifies that exact source on explicit request. `build.sh` uses the
installed 16-bit ia16 GCC (an equivalent 16-bit toolchain, not DJGPP) and libm.
It records compiler version, CPU/options, source and binary hashes in each
build's own manifest/receipt. Generated executables are not committed here.

```sh
./fetch.sh
./build.sh 8086 absent
node ../run.mjs --board "$BW_BOARD_DIR" --project .build/8086-absent \
  --variant 8086 --max 20000000
# Separate CPU builds: ./build.sh 80186 absent; ./build.sh 80286 absent
```

These are software-floating-point **validation** builds (`-DPRINTOUT`, one
major loop). They retain module outputs for correctness and must not be mixed
with score builds or FPU-present results. The source itself refuses a timing
score when its second-resolution DOS clock reports zero elapsed seconds.
The initial short probe printed module text but did not complete and recorded
unsupported INT21h/44h; no Whetstone performance result is claimed.

FPU-present execution is blocked: the current native i80386 core explicitly
requires an external x87 backend. `build.sh` refuses that mode rather than
silently substituting software FP. A raw freestanding native-386 Whetstone
port also needs an independently pinned math/soft-float runtime; a DOS
executable must not masquerade as that port. This package supplies source and
a 16-bit build path only. No physical FPU or 80387 claim.
