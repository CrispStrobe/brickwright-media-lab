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

**8086 floppy-boot OSes — reachable now.** In the debug panel, load a bootable
`.img` (ELKS, Minix 1.7) into the **i8086 machine's "Floppy" media slot**. It
boots on the PC-XT machine (BIOS + µPD765 + 8237 + 8259 + CGA); the panel's
**video** is the CGA screen and the **keyboard** steers it — so you can log into
ELKS *in the browser* and type at it. (This is what lite PR #253 wired.)

**DOS programs / languages (F83, Small-C, VolksForth, ACK output).** These run
on the DOS service layer; the GUI's assembled-DOS path already runs `.com`/`.exe`
programs. Dropping a fetched `.com` in as a DOS program runs it with its output
on the CGA screen + console.

**The fully-free 386 (FreeDOS, FastDoom+Freedoom) — CLI-only today.** The free-386
capability is on bw-board `master`, but the browser build pins an older bw-board
and the debug panel has no 386-free-BIOS boot path yet. Reaching it in the GUI
needs (a) a bw-board **pin bump** into lite and (b) a small 386 `bootMedia`
wiring in the debug runner — both tracked, neither done. Use the CLI runner above
for now.

## Per-project quick reference

| Project | Tier | CLI | GUI |
|---|---|---|---|
| elks | 8086 | `elks-shell.mjs` (interactive) / `elks-media-proof.mjs` | ✅ floppy slot → boot + steer |
| minix-1.7 | 8086 | `run-i8086` floppy boot (to the monitor) | ✅ floppy slot (boot monitor) |
| f83 / volksforth | 8086 DOS | `run-dos.mjs f83.com` | ✅ DOS program |
| small-c | 8086 DOS | `run-dos.mjs cc.exe` | ✅ DOS program |
| ack | 8086 DOS | `run-dos.mjs sieve.com` (compiled output) | ✅ DOS program |
| freedoom-fastdoom | 386 | `run-i80386-free-bios-freedos.mjs` + the WAD/engine | ⏳ CLI-only (386 GUI wiring pending) |

## Summary

- **CLI: fully reachable** — every project runs from bw-board's scripts on
  `master`, including the fully-free 386.
- **GUI: 8086 tier reachable** (boot + steer ELKS/Minix, run DOS programs in the
  browser); the **386 tier is CLI-only** until the pin bump + 386 `bootMedia`
  wiring land.
