# Linux on RISC-V — Linux 6.1.188 + BusyBox on the emulated RV32 machine

A real Linux kernel (Sv32 MMU, SBI, PLIC, 16550A console) and a BusyBox
shell, booting on bw-board's `RiscV32Machine` in the browser. The
BrickWright app offers it as the **Linux on RISC-V** lesson: it fetches
the two files below when the learner presses Run, checks both SHA-256s
before booting, and connects the machine's serial console to a terminal.

| | |
|---|---|
| Machine | `riscv32` — RV32IMAC + Zicsr/Zifencei, M/S/U, Sv32, CLINT, PLIC, NS16550A; 64 MiB RAM at `0x80000000`; bw-board's in-emulator SBI v0.3 stands in for OpenSBI |
| Kernel | Linux 6.1.188 `Image`, 4,876,836 B, SHA-256 `9130ceb4be18d10560cf49ac495d7f2d5dde23c33972d7a522c077cc523de1a9` — GPL-2.0-only |
| Initramfs | `initramfs.cpio` (newc), 2,663,424 B, SHA-256 `d71915baaae4f35e32679a338885697194e4ecd7f31cbc9c69b82cd86b8edcd5` — BusyBox 1.37.0 (GPL-2.0-only), glibc 2.42 loader + `libc.so.6` + `libresolv.so.2` (LGPL-2.1-or-later), an `/init` script |
| Boot | ~68 M instructions from reset to the `bwb# ` prompt; `uname -a` → `Linux (none) 6.1.188 … riscv32 GNU/Linux` |
| Snapshot | `linux-shell.snap.gz`, 2,006,204 B, SHA-256 `7b82fc38525d36e8a98fb9aa112e804813e7d3a456fcca2ace220129357a272c` — the machine at the prompt; the app opens the lesson from it (see "Snapshot") |
| Runner | bw-board `runRiscvLinuxBundle(manifest, files)` (headless) or `createDebugTarget('riscv32', {linux: {kernel, initrd}})` (an app's debugger); both in `src/riscv32-linux-session.js` |
| Verified by | bw-board `test/linux-riscv/lesson.mjs` in the "Linux RISC-V boot" workflow: pinned-media check, a tampered initramfs refused by name, boot to the prompt through a debug session, `uname -a` typed over the UART |

## Provenance

Both files are from **rv32emu-prebuilt** release
`2026.09.23-19f5a79-Linux-Image` (asset `rv32emu-linux-image-prebuilt.tar.gz`,
SHA-256 `0352bbd2dc8d35703516f7e4db86c27fbabb39818c7034a74dff948913e462fd`),
built by rv32emu's CI from sysprog21/rv32emu@`19f5a7984e54292df025d747f87a7728e7cfb3eb`:
Buildroot 2025.11 (GCC 14.3, binutils 2.42, glibc) with rv32emu's
`buildroot.config` + `busybox.config`, then the kernel.org 6.1.188 tarball
with rv32emu's `linux.config`.

- `Image` is that release's `linux-image/Image`, unmodified.
- `initramfs.cpio` is cut from that release's `rootfs.cpio` by bw-board's
  `test/linux-riscv/build.sh`: only `/bin/busybox` and the three glibc
  libraries it loads, an `/init` that mounts proc/sys/devtmpfs, prints
  `BWB-LINUX-USERSPACE-UP` and starts `sh -l` on ttyS0, `/etc/profile`
  setting `PS1="bwb# "`, and `/lib32 -> lib`. `mkcpio.py` writes a
  reproducible newc archive (owners 0, mtimes 0), so the SHA-256 above is
  reproducible from the upstream tarball.

rv32emu-prebuilt rotates its releases, so the two files are **mirrored**
here: on the orphan branch `media/riscv32-linux-v1` (commit
`07132874ee064fa782f80ccae64af8d75cae65c8`, directory `riscv32-linux/`)
and as assets of the release `riscv32-linux-v1`. The app fetches the
branch copy through `raw.githubusercontent.com/<repo>/<commit>/…` —
content-addressed by the commit and served with CORS, which a GitHub
release download is not — and checks the SHA-256 again before booting.

## Snapshot

`linux-shell.snap.gz` is the emulated machine at the `bwb# ` prompt, taken
after booting the two files above: bw-board's whole-machine snapshot (format
`BWRV32S1`: hart registers and CSRs, CLINT/PLIC/UART state, and the RAM pages
that differ from the RAM right after the kernel, initramfs and device tree
were placed), gzip level 9. The app's default Run restores it on top of the
freshly loaded kernel and initramfs, so the shell is up at once; "Boot from
scratch" boots the kernel without it.

- Raw SHA-256 `1972e440f4b3d683b55f3c87fdf9bd62ab70300c3f56baf59da6043e7b2ceebe`,
  8,585,586 bytes; taken at 67,571,000 steps. Built by bw-board's "Linux
  RISC-V boot" workflow (run 36576659198) and published unmodified on the
  media branch at the commit above; `node scripts/riscv32-linux-snapshot.mjs
  Image initramfs.cpio out.snap.gz` in bw-board rebuilds the same bytes.
- bw-board `test/linux-riscv/snapshot.mjs` proves a restored machine and a
  cold-booted one identical: byte-identical console output and final machine
  state over `ls /`, `echo`, `cat /proc/cpuinfo`, `uname -a`. That workflow
  re-checks the published file on every change to the RISC-V core.
- It holds the kernel, BusyBox and glibc as they sit in memory, so it is
  GPL-2.0 / LGPL-2.1 like them and lives here, not in the app. Its
  corresponding source is the release below plus the MIT-licensed program
  that makes it (bw-board `scripts/riscv32-linux-snapshot.mjs`).

## Corresponding source (how the GPL offer is made)

The binaries and their complete corresponding source are published **from
the same place**: this repository. Every asset of release
[`riscv32-linux-v1`](https://github.com/CrispStrobe/brickwright-media-lab/releases/tag/riscv32-linux-v1)
sits beside the two binaries:

| Asset | SHA-256 | What it is the source of |
|---|---|---|
| `linux-6.1.188.tar.xz` | `ed4d0acb1307c235230c89efc094e210e6290593f94a7e617f28b1001101a33a` | the kernel (unmodified kernel.org tarball; hash as in kernel.org's `sha256sums.asc`) |
| `busybox-1.37.0.tar.bz2` | `3311dff32e746499f4df0d5df04d7eb396382d7e108bb9250e7b519b837043a4` | BusyBox (busybox.net tarball) |
| `glibc-2.42-3-gbc13db73937730401d592b33092db6df806d193e.tar.gz` | `a364a548ebda9c570f5bf62bf5e4ad3240a90056455b9edfbf1472a7254bd1c0` | glibc (the snapshot Buildroot 2025.11 builds) |
| `buildroot-2025.11.tar.gz` | `6570804fef53374530d1a97edb512770e822300e9c06ede2ea306ea9a55215f9` | the build system and the patches it applies to BusyBox (`package/busybox/*.patch`); hash as in buildroot.org's `.sign` |
| `riscv32-linux-build-recipes.tar.gz` | `3a844524af3b8ba09d49a8735d0c2de15d4b23ec02e1a4fffdbd5decd1e21775` | the scripts and configuration that control compilation and installation: rv32emu's `linux.config`, `busybox.config`, `buildroot.config`, `tools/build-linux-image.sh`, `mk/external.mk`; bw-board's `build.sh` + `mkcpio.py` |

This is the GPL-2.0 §3 route "offering equivalent access to copy the source
code from the same place" (and LGPL-2.1 §6 for glibc): whoever can download
the binaries from this repository can download the source from it too. We
chose this over a written offer because it needs no future action from
anyone. **Rule for maintainers: never delete the release assets while any
published build of the app pins the media commit above.**

The BrickWright app (BSD-3) contains none of this: it holds only the two
URLs and SHA-256s, fetches on the learner's click, and shows the licence and
this source link beside the Run button.

## Fetch

```sh
bash fetch.sh            # Image + initramfs.cpio + licence texts, SHA-256 checked
bash fetch.sh --source   # plus the corresponding source above
bash fetch.sh --upstream # re-derive the kernel from rv32emu-prebuilt (while that tag lives)
bash fetch.sh --snapshot # also the post-boot snapshot (linux-shell.snap.gz)
```

Licence texts (`licenses/` on the media branch): `GPL-2.0`, the kernel's
`COPYING`, BusyBox's `LICENSE`, glibc's `COPYING.LIB` and `LICENSES`.
