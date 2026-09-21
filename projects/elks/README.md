# ELKS on the 8086 PC-XT

Upstream: <https://github.com/ghaerr/elks> (GPL-2.0) — the Embeddable
Linux Kernel Subset, a genuine 16-bit Unix-like OS for the 8086/8088.
This is the first project here that is a whole OPERATING SYSTEM: not a
program we assembled and not a service answered one call at a time, but
a kernel that boots itself, probes the hardware, mounts a root
filesystem and takes over the machine.

## What runs

The **official v0.9.2 release floppy** `fd1440-fat.img`, unmodified,
booted on BrickWright's `i8086` PC-XT machine (`PCXT8086`): our BIOS
ROM, the µPD765 floppy controller, the 8237 DMA controller and the 8259
interrupt controller, all driving a real GPL kernel. It boots to
**"Mounted root device"** and panics only because the 1.44 MB floppy
carries no interactive userland to hand off to — the boot itself is the
acceptance signal.

Provenance (encoded in the manifest, pinned in `fetch.sh`):

- Upstream commit `e7a56a4334e0ef9a2261d1c2de54db31ba40fdf0`, tag `v0.9.2`
- Artifact: `fd1440-fat.img`, official GitHub release asset
- sha256: `637a1d07ac1b18c7e8fafbf64911ceaa5864a37c60e23878d498534ccaae366b`
- size: 1,474,560 bytes · OEM id `ELKSFAT1` · banner `ELKS 0.9.2`
- geometry: 80 cylinders × 2 heads × 18 sectors × 512 bytes/sector
- license: GPL-2.0 (kernel); elkscmd userland is a mix of free licenses,
  see the fetched `LICENSE`

## The one hardware quirk it needs

ELKS trusts the PC/AT convention that **INT 13h AH=08h returns the
floppy DRIVE TYPE in BL** (01h=360K … 04h=1.44M … 05h=2.88M). A plain
XT BIOS answers the geometry but leaves BL untouched; ELKS then indexes
`fd_types[BL-1]` with BL=0, reads a 256-byte sector size instead of 512,
and every disk block lands at the wrong LBA — the root directory comes
back garbage and `/bin/init` is never found ("No init"). So the manifest
declares the quirk `at-floppy-drive-type`, and the machine supplies BL
at INT-13h entry (an opt-in hook — it touches no receipt-pinned ROM or
core file). This is why ELKS boots here where a bare XT BIOS would
strand it.

## Run it

```sh
./fetch.sh          # downloads the official image + LICENSE, verifies sha256
```

Then hand `fd1440-fat.img` to the app's media panel (or bw-board's
`runI8086FloppyBundle(manifest, files, {romBytes})`) with the machine
set to `i8086` / `PCXT8086`. Verified machine-side by bw-board
`scripts/elks-media-proof.mjs`, which runs THIS manifest against the
fetched image and asserts the banner, the sized geometry and the root
mount.

## ELKS as a programming VM (interactive)

The release image is a **complete interactive Unix**, not just a boot: it
reaches a `login:` prompt (~40M instructions), and bw-board's
`scripts/elks-shell.mjs` logs in as `root` **over the emulated XT
keyboard** (`machine.keyIn` → 8255 port A + IRQ1, wrapped by
`src/interactive-console.js`) and runs commands — the headless form of
what the app's keyboard widget does live.

Proven: authoring and running a program *inside* ELKS in its bundled
**ELKS BASIC** (MIT — a distinct component from the GPL-2 kernel):

```sh
echo -e 'basic\n10 PRINT "HELLO FROM ELKS"\n20 PRINT 6*7\nRUN' \
  | node scripts/elks-shell.mjs --stdin
# … login: root
# # basic
# ELKS BASIC   10240 bytes free
# RUN
# HELLO FROM ELKS
# 42
# Ok
```

`/bin` is rich: a Nano-X windowing system (`nxterm`, `nxtetris`,
`paint`, `nxcalc`), games, audio (`play`), `vi`/`sed`/`tar`, and
`/bin/basic`. So ELKS is the lab's first fully **steerable** OS — the
same `keyIn`/framebuffer/audio surfaces a video+audio+keyboard widget
binds. (Component licences vary — the kernel is GPL-2, ELKS BASIC is MIT;
some optional tools carry their own terms and must be checked before use,
e.g. a bundled C compiler is not assumed free.)

## The image is fetched, never re-hosted

ELKS is GPL-2; we run it as a black-box workload, which the licence
regime permits. This project ships only the manifest, the provenance and
a `fetch.sh` that pulls the artifact from the upstream release — the
user's fetch is the distribution event, and what is distributed is
ghaerr's honestly-licensed release, not a copy of ours.

A symboled local build (kernel a.out + `system.map`) is kept separately
for gdb / cpu-differential tracing; it is a DIFFERENT binary from the
release and is not what this project fetches.
