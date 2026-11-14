# TOPBENCH 0.40c — DOS program and native i80386 shim input

Upstream: https://github.com/MobyGamer/TOPBENCH, release 0.40c, source commit
`40a15475ecbbd9dc47d9b578c70248593c511980`. `assets.json` pins the original
release ZIP, source archive and every shipped file. The upstream version is
0.40c; this package does not relabel it as 1.x.

The MIT Jim Leonard notice is in LICENSE. Only root TOPBENCH source texts are
mirrored. Bundled third-party detection/timer directories, OBJ files and other
prebuilt libraries are omitted. This source subset is not a standalone build
kit; the executable is the unmodified pinned upstream release. Its exact
compiler/version/options are not recorded upstream, so a reproducible source
build is not claimed. The Pascal source's `-i` command prints six results and
exits with DOS code **4**, which is an intentional expected code here.

```sh
./fetch.sh  # explicit fetch + hash verification of upstream release/source
node ../run.mjs --board "$BW_BOARD_DIR" --project . --variant 80386 --max 20000000
# 16-bit existing program path: replace variant with 80286, 80186 or 8086.
```

The 16-bit variants use the existing bw-board runDos export with fixed XT,
5 MHz, mapped RAM/preset and B800 text capture. The program command tail is
exactly `-i`; it is not keyboard input. Its DOS services are the pinned bw-board
shim, not a booted DOS image. `native-i80386.json` specifies the separate native
386 shim/MZ-loader contract. That contract is not a FreeDOS media bundle and
has no automatic GUI fallback. The new benchmark driver passes the command
tail through the runDos API; generic GUI consumption must preserve `args`.

The initial bounded probes did not complete; no TOPBENCH score is claimed.
A nonterminating probe is retained as an incomplete observation, not PASS.
Only asset/notice proof currently passes. Full upstream hardware detection and
PIT calibration may require services absent from the small benchmark shim.
