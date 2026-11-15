# Whetstone software floating point validation executable

This package supplies the **exact already-qualified** 83,776-byte `WHT.EXE`,
SHA-256 `f7003e37da058b1a41b8520b010c9791aafa10fa8a9cb11a4c0998055936b8ac`.
It is the unmodified Netlib C Whetstone 1.2 source, compiled by ia16 GCC 6.3.0
with `-DPRINTOUT`, software floating point and full floating-point printf.
The source SHA-256 is
`333e4ceca042c146f63eec605573d16ae8b07166cbc44a17bec1ea97c6f1efbf`.
The complete source permission/comment is retained in `LICENSE` and the source.

This product includes software developed by the University of California,
Berkeley and its contributors.

`RUNTIME-NOTICES.txt` retains the selected source/header permission blocks,
including the Berkeley acknowledgment. `licenses/` retains the original Newlib
and Libgloss aggregate notices, GPLv3 and GCC Runtime Library Exception 3.1.
The aggregate notices include other targets; `runtime-members.json` maps the
139 actually linked members to the exact selected source files and explicit
source/common-header notices. The mapping uses 107 DWARF compilation units and
32 assembly/template mappings from the source Makefiles. GCC's shared IA16
preamble and division headers carry the exception notice included by their
assembly compilation units. The existing build invokes GCC directly on the
unmodified C source using ordinary assembler/linker steps; it uses no
non-GPL intermediate-code optimizer.

`runtime-provenance.json` records the exact installed package versions, current
archive hashes, verified installed-package archive checks, official source
archive byte/hash identities and the immutable prior qualification record.
The original build did not capture runtime archive hashes. This package does
**not** establish bit-identical historical runtime archives or complete package
installation history, and does not claim blanket license clearance.

The executable was copied without rebuilding or rerunning the benchmark.
It uses the existing native i80386 DOS shim (`run.mjs --variant 80386`), with
no guest OS, BIOS image, extender or x87 backend. The prior exact-byte native
qualification is in [`results/v3`](../results/v3/README.md). Browser integration
and its evidence are separate from that CLI qualification.

For a new explicitly requested native run, the existing CLI is:

```sh
node ../run.mjs --board "$BW_BOARD_DIR" --project . --variant 80386 --max 30000000
```

This is a one-loop PRINTOUT **validation** build, not a score build or physical
CPU timing measurement. Admission requires all ten numeric modules, positive
guest-clock duration, expected exit0 and zero unsupported services. No new
benchmark comparison, speedup, legacy CPU completion or hardware FPU result is
claimed. The sibling `whetstone/` source/build package remains unchanged.
