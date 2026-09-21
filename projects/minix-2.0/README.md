# Minix 2.0.4 on the fully-free 386

Upstream: <https://github.com/davidgiven/minix2> (**BSD-3-Clause**) — David
Given's buildable revival of classic Minix, "QD edition". This is the 2.x line
of Andrew Tanenbaum's teaching Unix — the OS behind *Operating Systems: Design
and Implementation* — and it goes further here than its 1.7 sibling: it reaches
a **multiuser login and an interactive root shell**.

## Why the 386, not the 8086

The lab already packages **Minix 1.7.5** on the plain 8086 (`projects/minix-1.7`),
where it stops at the boot monitor. **2.0.4 is a different tier**: its i86 kernel
**executes in 16-bit protected mode** and expects a 286-class machine with a
couple of megabytes of RAM. The 8086/XT tier cannot run it — which is exactly
what `docs/CANDIDATES.md` recorded ("Minix 2.0.4 … 286 … needs the 286/AT ROM").

That blocker is now lifted by the **fully-free 386**: BrickWright's experimental
`i80386` AT machine booted on the **LGPL Bochs legacy BIOS + LGPL VGABios**
(vendored at bw-board `roms/free-at-bios/`), with **no proprietary IBM ROM**. It
supplies the protected mode and the 4 MB the 2.0.4 kernel wants, so Minix 2 boots
here on **entirely free firmware**.

## What runs — proven, to an interactive shell

Booted on the free-386 (LGPL BIOS, no proprietary ROM), driving the emulated AT
keyboard. The kernel starts, sizes memory, loads its RAM disk, runs multiuser
startup, and reaches `login:`; injecting `root` logs in to a `#` shell that
**executes commands**:

```
Minix 2.0.4  Copyright 2001 Prentice-Hall, Inc.
Executing in 16-bit protected mode
Memory size = 4039K   MINIX = 250K   RAM disk = 1440K   Available = 2349K
RAM disk loaded.
Multiuser startup in progress.
Starting daemons: update.
Minix 2 QD edition. This is not an official Minix build.
Minix  Release 2 Version 0.4
noname login: root
# echo minixshellworks
minixshellworks
#
```

Two keystrokes are injected through the machine's real keyboard path
(`machine.keyIn` → the 8042 controller + IRQ1): `=` at the Minix boot monitor to
launch the kernel, then `root` at the login prompt. This is the advantage the
386 tier has over the 8086 Minix-1.7 project, which reached the monitor but had
no keyboard-inject path to press `=` — here the same free-386 machine that runs
FreeDOS drives Minix's console keyboard, so it goes all the way to a shell.

## Licensing — genuinely BSD

Minix 1.x and 2.x were relicensed **BSD-3-Clause** in April 2000 (Prentice Hall,
copyright 1987/1997), so these classic sources are free software. Upstream
`LICENSE` carries the grant; `fetch.sh` pulls it beside the image. The LGPL
firmware that boots it is separately licensed and vendored in bw-board, not here.

## Provenance (pinned in `fetch.sh`)

- Upstream repo: `github.com/davidgiven/minix2` (BSD-3-Clause), "Minix 2 QD edition"
- Artifact: the `v1` release asset `combo-1440kB.img.gz` → decompressed `minix204.img`
- gzip sha256: `46c0a2ada3f9d952e1359cacba44c1011ad1a03995811e4e716be0a56dd491e5`
- image sha256: `1fe04d26593954eb7b71b084029b35bd937b57641d63cff419c157f8384e8780`
- size: 1,474,560 bytes · geometry 80×2×18×512 · banner "Minix 2.0.4 … Prentice-Hall"
- machine: `i80386` free-BIOS AT (LGPL Bochs BIOS + LGPL VGABios, **no proprietary ROM**)
- boot CMOS: floppy drive 0 = 1.44 MB (`0x10=0x40`), boot from floppy (`0x3d=0x01`)

## Run it

```sh
./fetch.sh     # downloads the .gz + BSD-3 LICENSE, decompresses, verifies sha256
```

Then boot `minix204.img` as the floppy on the **fully-free 386**, e.g. with the
harness that bw-board `scripts/run-i80386-free-bios-freedos.mjs` uses — insert
the floppy with geometry 80/2/18, set CMOS floppy type 0 to 1.44 MB, boot from
floppy, inject `=` at the monitor and `root` at `login:`. Verified machine-side:
boots to a multiuser shell on free firmware. BSD-3 image is fetched, never
re-hosted.
