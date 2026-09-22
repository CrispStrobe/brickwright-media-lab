# Running the machines — CLI and GUI

How to actually *run* the projects in this lab, on both the command line
(bw-board's scripts) and in the browser (brickwright-lite's debug panel).
Written to be honest about what is reachable where **today** — some paths are
CLI-only until a GUI wiring lands (noted inline).

Everything below assumes you've fetched a project's artifact with its
`fetch.sh`. The app/CLI never ships the GPL/other content — you fetch it.

## Command line (bw-board scripts)

Run from a bw-board checkout. These all work on `master`.

| You want | Command |
|---|---|
| **Boot ELKS to a shell + steer it** | `node scripts/elks-shell.mjs --image fd1440-fat.img` → logs in as `root`, drops to `#` |
| **Program *inside* ELKS** (ELKS BASIC) | `printf 'basic\n10 PRINT "HI"\n20 PRINT 6*7\nRUN\n' \| node scripts/elks-shell.mjs --stdin --image fd1440-fat.img` |
| **Run a DOS program** (F83, Small-C `cc.exe`, VolksForth, an ACK-compiled `.com`) | `node scripts/run-dos.mjs PROG.COM --preset xt --max 5000000 --screen` |
| **Prove a floppy OS boots** | `node scripts/elks-media-proof.mjs` (ELKS → "Mounted root device") |
| **Compile→run a program on booted ELKS** | `node scripts/run-elks-program.mjs fd1440-fat.img prog.aout` |
| **Boot FreeDOS on the *fully-free 386*** (LGPL BIOS, **no proprietary ROM**) | `node scripts/run-i80386-free-bios-freedos.mjs` |

Notes:
- `run-dos.mjs` mounts extra host files into the DOS filesystem with repeated
  `--file PATH` (a program that needs data files alongside it).
- `elks-shell.mjs` steers the real hardware keyboard (scancodes → the 8255 +
  IRQ1), so it drives kernel-driver OSes, not just BIOS INT 16h.
- The **fully-free 386** runner refuses `$AT_BIOS_ROM` on purpose — it boots the
  vendored LGPL Bochs BIOS + VGABios, so it reproduces with zero secret input.

## Browser (brickwright-lite debug panel)

**8086 floppy-boot OSes — reachable now.** Load a bootable `.img` (ELKS, Minix
1.7) into the **i8086 machine's "Floppy" media slot**. It boots on the PC-XT
machine (BIOS + µPD765 + 8237 + 8259 + CGA). The machine's **screen** renders in
the **Widgets pane** — a `simplevga`/`terminal` display widget is the front panel
that shows the CGA output — and input widgets (or the debug keyboard path) steer
it, so you can log into ELKS *in the browser* and type at it. (This is what lite
PR #253 wired.) The **Debug** pane is the developer instrument beside it (serial
console + stepping + the TMS9918A VDP screen), *not* where the PC framebuffer
renders. See `docs/MACHINE-MANAGER-DESIGN.md` §4 for how each machine surface
maps.

**DOS programs / languages (F83, Small-C, VolksForth, ACK output).** These run
on the DOS service layer; the GUI's assembled-DOS path already runs `.com`/`.exe`
programs. Dropping a fetched `.com` in as a DOS program runs it with its output
on the CGA screen + console.

**The fully-free 386 — now boots in the GUI.** The i80386 machine boots on the
**vendored LGPL Bochs BIOS + VGABios alone** (no proprietary ROM): the CPU runs,
the VGABios banner renders, `video()` returns a 720×400 framebuffer that shows in
the **Widgets pane**, and it takes keyboard input. (The bw-board pin bump + the
386 `bootMedia` path in the debug runner both landed.) A **live OS prompt**
(FreeDOS/Doom) still needs the fetched GPL disk image inserted — the runner
supports floppy→A: and hard-disk→C: (type-47 CMOS); once you drop a bootable 386
image into the machine's slot it boots the way the 8086 floppy OSes do.

**Machine output reaches the Widgets pane.** A machine's screen (a `simplevga`
display widget), keyboard (an input widget → `runner.keyIn`) and **sound** (its
`audio()` voices → the browser speakers) all surface in the Widgets pane — a
manifest declares its screen/keyboard widgets and they render on boot. New
code-tab languages ride the same machines: **uBASIC** (a libre DOS BASIC, "BASIC
(uBASIC on DOS)"), the **compile-on-DOS** engine (a real DOS `.EXE` compiler runs
in the browser and its output is read back), and libre **Pascal/C via ACK** — on
the 8086 (hosted endpoint) and on **Z80 via CP/M** (a new CP/M-80 machine runs a
real ACK-compiled Z80 CP/M `.COM`).

## Per-project quick reference

| Project | Tier | CLI | GUI |
|---|---|---|---|
| elks | 8086 | `elks-shell.mjs` (interactive) / `elks-media-proof.mjs` | ✅ floppy slot → boot + steer |
| minix-1.7 | 8086 | `run-i8086` floppy boot (to the monitor) | ✅ floppy slot (boot monitor) |
| minix-2.0 | 386 free-BIOS | `run-i80386-free-bios-freedos.mjs` (adapted to insert the Minix floppy) → boots to `login:`, `root` → shell | 🟡 386 boots in GUI on free BIOS; drop the Minix floppy into the 386 slot to reach `login:` |
| ms-dos | 386 free-BIOS | `run-i80386-free-bios-freedos.mjs` (adapted, 40/2/9 floppy) → MS-DOS 4.00 banner, halts at Internal Error 4560 | 🟡 386 boots in GUI on free BIOS; drop the MS-DOS floppy into the 386 slot |
| opengem | 386 + DOS + VGA/mouse | fetch + install on a DOS host; graphical — no text-console proof | ⏳ needs framebuffer + mouse |
| alice-pascal | 386 free-BIOS + FreeDOS | boot FreeDOS, put the ALICE files on a mounted C:, run `alice` → main menu | ⏳ CLI-only (needs booted DOS, not `run-dos`) |
| f83 / volksforth | 8086 DOS | `run-dos.mjs f83.com` | ✅ DOS program |
| small-c | 8086 DOS | `run-dos.mjs cc.exe` | ✅ DOS program |
| ack | 8086 DOS | `run-dos.mjs sieve.com` (compiled output) | ✅ DOS program |
| freedoom-fastdoom | 386 | `run-i80386-free-bios-freedos.mjs` + the WAD/engine | 🟡 386 boots in GUI on free BIOS; drop the FreeDOS+FastDoom image into the 386 slot |

## Summary

- **CLI: fully reachable** — every project runs from bw-board's scripts on
  `master`, including the fully-free 386.
- **GUI: 8086 tier reachable** (boot + steer ELKS/Minix, run DOS programs in the
  browser; uBASIC + compile-on-DOS + Pascal/C-via-ACK in the Code tab).
- **GUI: 386 tier boots** — the pin bump + 386 `bootMedia` path landed, so the
  i80386 machine runs on the vendored LGPL BIOS and renders to the Widgets pane.
  A **live 386 OS prompt** (FreeDOS/MS-DOS/Minix/Doom) still needs the fetched
  GPL disk image dropped into the 386 machine's slot — the runner boots it the
  moment it's inserted.
- **GUI: CP/M-80 (Z80) tier reachable** — a CP/M-80 machine runs real ACK/SDCC
  `.COM` programs, so Pascal/C compiled for Z80/CP/M run in the browser.
- **Widgets pane** carries every machine's screen, keyboard **and sound**.
