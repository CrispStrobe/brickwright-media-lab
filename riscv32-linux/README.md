# Linux on RISC-V — media (brickwright-media-lab, branch `media/riscv32-linux-v1`)

This branch holds ONLY the boot files BrickWright fetches for its
"Linux on RISC-V" lesson, so a browser can load them from a
content-addressed URL (`raw.githubusercontent.com/<repo>/<commit>/…`,
which serves CORS). The project itself — provenance, fetch script,
manifest — lives on `main` under `projects/riscv32-linux/`.

| File | SHA-256 | Size | What |
|---|---|---|---|
| `Image` | `9130ceb4be18d10560cf49ac495d7f2d5dde23c33972d7a522c077cc523de1a9` | 4876836 | Linux 6.1.188 kernel, rv32ima Sv32 (GPL-2.0) |
| `initramfs.cpio` | `d71915baaae4f35e32679a338885697194e4ecd7f31cbc9c69b82cd86b8edcd5` | 2663424 | busybox 1.37.0 (GPL-2.0) + glibc 2.42 loader/libc/libresolv (LGPL-2.1+) + an /init script |
| `linux-shell.snap.gz` | `7b82fc38525d36e8a98fb9aa112e804813e7d3a456fcca2ace220129357a272c` | 2006204 | the emulated machine at the `bwb# ` prompt after booting the two files above (see "Snapshot") |

## Snapshot (`linux-shell.snap.gz`, added 2026-09-29)

A whole-machine snapshot of bw-board's `RiscV32Machine` taken at the
shell prompt, so the lesson opens there instead of replaying a
68-million-instruction boot. It is a memory image of the machine running
the two files above: hart registers and CSRs, the CLINT/PLIC/UART state,
and the RAM pages that differ from the RAM right after the kernel,
initramfs and device tree were placed (bw-board `src/riscv32-snapshot.js`
format `BWRV32S1`, gzip level 9). It contains parts of the kernel, BusyBox
and glibc as they sit in memory, so it is GPL-2.0 / LGPL-2.1 like them;
its corresponding source is the same release `riscv32-linux-v1` plus the
program that makes it, bw-board `scripts/riscv32-linux-snapshot.mjs`
(MIT).

- Raw (uncompressed) SHA-256 `1972e440f4b3d683b55f3c87fdf9bd62ab70300c3f56baf59da6043e7b2ceebe`,
  8585586 bytes, 2089 literal pages; taken at 67,571,000 steps (67,568,318
  retired instructions).
- Built by bw-board's "Linux RISC-V boot" workflow, run 36576659198
  (commit `0b281d81`, branch `lane/c2-rv-snapshot`, Node 22.23.2, zlib
  1.3.1-e00f703) and published unmodified; the same bytes rebuild on
  Node 20 with that zlib. Reproduce with
  `node scripts/riscv32-linux-snapshot.mjs Image initramfs.cpio out.snap.gz --expect-raw 1972e440…`.
- bw-board's `test/linux-riscv/snapshot.mjs` proves it equivalent to a
  cold boot: a restored machine and a cold-booted one give byte-identical
  console output and final machine state over `ls /`, `echo`,
  `cat /proc/cpuinfo` and `uname -a`. That workflow re-checks this
  published copy on every change to the RISC-V core.

## Corresponding source

The complete corresponding source for both files is published beside
them, as assets of the release **`riscv32-linux-v1`** of this repository:
<https://github.com/CrispStrobe/brickwright-media-lab/releases/tag/riscv32-linux-v1>

- `linux-6.1.188.tar.xz` — the unmodified kernel.org tarball the Image was built from;
- `busybox-1.37.0.tar.bz2`, `glibc-2.42-3-gbc13db73937730401d592b33092db6df806d193e.tar.gz` — the exact upstream tarballs;
- `buildroot-2025.11.tar.gz` — the build system that compiled busybox and glibc, including the patches it applies (`package/busybox/*.patch`);
- `riscv32-linux-build-recipes.tar.gz` — the configurations and scripts that control compilation and installation: rv32emu@19f5a79's `linux.config`, `busybox.config`, `buildroot.config` and `tools/build-linux-image.sh`, and bw-board's `test/linux-riscv/build.sh` + `mkcpio.py`, which cut `initramfs.cpio` byte for byte.

See `licenses/` for the license texts. Both files are redistributed
unmodified from rv32emu-prebuilt's `2026.09.23-19f5a79-Linux-Image`
release (tarball SHA-256 `0352bbd2dc8d35703516f7e4db86c27fbabb39818c7034a74dff948913e462fd`),
except that `initramfs.cpio` keeps only busybox and the three glibc
libraries it loads from that release's rootfs, plus an `/init` script.
