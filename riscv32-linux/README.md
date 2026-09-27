# Linux on RISC-V — media (brickwright-media-lab, branch `media/riscv32-linux-v1`)

This branch holds ONLY the two boot files BrickWright fetches for its
"Linux on RISC-V" lesson, so a browser can load them from a
content-addressed URL (`raw.githubusercontent.com/<repo>/<commit>/…`,
which serves CORS). The project itself — provenance, fetch script,
manifest — lives on `main` under `projects/riscv32-linux/`.

| File | SHA-256 | Size | What |
|---|---|---|---|
| `Image` | `9130ceb4be18d10560cf49ac495d7f2d5dde23c33972d7a522c077cc523de1a9` | 4876836 | Linux 6.1.188 kernel, rv32ima Sv32 (GPL-2.0) |
| `initramfs.cpio` | `d71915baaae4f35e32679a338885697194e4ecd7f31cbc9c69b82cd86b8edcd5` | 2663424 | busybox 1.37.0 (GPL-2.0) + glibc 2.42 loader/libc/libresolv (LGPL-2.1+) + an /init script |

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
