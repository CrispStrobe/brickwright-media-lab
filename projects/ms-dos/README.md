# MS-DOS (MIT) — a genuinely-libre bootable floppy

Upstream: <https://github.com/microsoft/MS-DOS> (**MIT**) — Microsoft's own
open-source release of MS-DOS. The repository's `LICENSE` is the MIT License and,
as Microsoft states, it covers the **committed binaries** too — so the DOS system
files in this repo are genuinely free-software bytes, not just source.

This project packages the one artifact in that repo that is **already a complete,
raw, bootable floppy image**: the boot disk of **Microsoft's Multitasking MS-DOS**
(the `v4.0-ozzie` tree). Its own on-disk `README` calls it *"Microsoft's first
beta release of Multi-tasking MS-DOS … based upon MS-DOS Version 2 sources"*, and
it boots to the authentic Microsoft copyright banner.

## What runs — and the precise blocker

Booted on the fully-free 386 (LGPL Bochs BIOS + LGPL VGABios, **no proprietary
ROM**), the BIOS loads the floppy's boot sector, which loads `IBMBIO.COM` +
`IBMDOS.COM`, and the genuine MS-DOS banner prints:

```
Booting from Floppy...
Internal Work #2.06 - May 25, 1984
MS-DOS version 4.00
Copyright 1981,82,83,84 Microsoft Corp.
*  Internal Error 4560  *
HardErr: no handler
```

So the **libre bytes boot and identify themselves as real Microsoft MS-DOS** — but
this *multitasking beta* core then halts at `Internal Error 4560 / HardErr: no
handler` before `COMMAND.COM`'s prompt. The error is in the DOS core itself, not
its configuration: removing the disk's `CONFIG.SYS` and `AUTOEXEC.BAT` (leaving
only `IBMBIO.COM`/`IBMDOS.COM`/`COMMAND.COM`) reproduces the same halt. This
multitasking build is famously hardware-picky (it was written for specific IBM PC
hardware and never widely shipped), and its critical-error path faults on our
emulated AT. **This project does not claim a DOS prompt — it pins the exact stage
it reaches.**

### The path to a full A:\> prompt

A clean interactive prompt from MIT bytes is reachable by building **mainstream
MS-DOS 4.00** from `microsoft/MS-DOS` `v4.0/src` (`BOOT/MSBOOT.ASM` + `MAKEFILE`,
assembled with the repo's committed MASM/LINK tools into `IO.SYS` / `MSDOS.SYS` /
`COMMAND.COM`). That is a **DOS-hosted source build**, not a fetch, and is out of
scope for this packaging pass — noted here so the next step is explicit. (The
repo's committed `v2.0` binaries can't be booted directly: `v2.0/bin` ships
`MSDOS.SYS` + `COMMAND.COM` but **no `IO.SYS`**, the OEM bootstrap, so a 2.0 disk
also has to be assembled/built rather than fetched.)

## Licensing

**MIT.** `github.com/microsoft/MS-DOS/LICENSE` (root) and `v4.0/LICENSE`
("Copyright (c) IBM and Microsoft Corporation") grant the MIT terms over the repo,
committed binaries included. `fetch.sh` pulls both license files beside the image.

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/microsoft/MS-DOS`, path `v4.0-ozzie/bin/DRDOS1_IMD.img`
  (upstream filename verbatim; identity is Microsoft MS-DOS, per its boot-sector
  OEM string `IBM  2.0` and the printed "MS-DOS version 4.00 … Microsoft Corp.")
- Artifact: raw FAT12 360 KB floppy — sha256
  `dfed217ca17b0003ec0cb72cdc0d68a6ec0aad6798ba0e46c38979c64dd95e73`, 368,640 bytes,
  geometry 40×2×9×512; carries `IBMBIO.COM` + `IBMDOS.COM` + `COMMAND.COM`
- Machine: free-386 (LGPL BIOS) or an XT; CMOS floppy type 1 = 360 KB (`0x10=0x10`)

## Run it

```sh
./fetch.sh     # downloads + sha-verifies the MIT boot floppy, pulls both LICENSE files
```

Then boot `msdos-mt-boot.img` as the floppy (40/2/9 geometry, CMOS floppy type 1).
It prints the genuine MS-DOS 4.00 banner and halts at Internal Error 4560, as
documented above. Fetched from upstream, never re-hosted (MIT permits re-hosting;
we still fetch from the source).
