# Minix 1.7.5 on the 8086 PC-XT

Upstream: <https://github.com/davidgiven/minix2> (BSD-3-Clause) —
David Given's "quick and dirty" buildable revival of classic Minix.
This is Andrew Tanenbaum's teaching Unix, the OS the *Operating Systems:
Design and Implementation* book is built around, and the second whole
OS in the lab after ELKS.

## Licensing — genuinely BSD, retroactively

Minix 1.x and 2.x were relicensed **BSD-3-Clause** in April 2000
(Prentice Hall, copyright 1987/1997), so the classic sources that were
once restricted are now free software. The upstream `LICENSE.md` carries
the exact grant; `fetch.sh` pulls it alongside the image.

## What runs, and where it stops

The **combo 1.44 MB floppy** boots on BrickWright's `i8086` PC-XT
(`PCXT8086`) to the **Minix boot monitor**:

```
Minix boot monitor 2.4
Press ESC to enter the monitor
Hit a key as follows:
   =   Start Minix
```

That is the verified acceptance signal — the boot loader loads, sizes
the disk and reaches its menu on real emulated hardware (µPD765 + 8237 +
8259 + our BIOS). It then **waits for a keystroke** (`=`) to launch the
kernel, exactly as ELKS waited for `init=`. Driving that keystroke needs
a scancode fed through the 8255 keyboard port + IRQ1, which the PCXT
media path does not yet expose — so **reaching the kernel is a tracked
follow-up**, and this project honestly pins the monitor, not a shell.

Use **Minix 1.7**, not 2.0.4: the stock 2.0.4 i86 build expects a 286
with ~2 MB, so it belongs on the 286 tier (a separate project once the
AT-boot harness is wired). 1.7 is the one that boots a plain 8086.

## Provenance (pinned in `fetch.sh`)

- Upstream repo: `github.com/davidgiven/minix2` (BSD-3-Clause)
- Artifact: `minix-1.7-combo-1440kB.img.gz` → decompressed `minix17.img`
- decompressed sha256: `a582fdffd79045b8ff3d1be2a1b35e5f83fa69a99bac444c919097b6409bf359`
- size: 1,474,560 bytes · geometry 80×2×18×512
- machine: `i8086` / `PCXT8086`, no drive-type quirk needed for the monitor

## Run it

```sh
./fetch.sh     # downloads the .gz + LICENSE, decompresses, verifies sha256
```

Then bundle `minix17.img` as slot `floppy` on the `i8086` machine, via
bw-board `runI8086FloppyBundle`. Verified machine-side: the manifest
boots to the Minix boot monitor. GPL/BSD image is fetched, never
re-hosted.
