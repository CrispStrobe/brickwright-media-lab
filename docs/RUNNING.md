# Running the media projects

Use a project's README, manifest, and proof together. **Fetched**, **booted**,
**interactive**, **activity completed**, and **saved/reloaded** are different
claims. The [experience catalog](LEARNING-EXPERIENCES.md) describes the next
activities; it does not turn proposed ports into working guests.

## Start with a reproducible proof

From a media-lab checkout, point `BW_BOARD_DIR` at the compatible bw-board
checkout identified by the project or CI job. The workflow pins are in
[verify.yml](../.github/workflows/verify.yml); the general and KIM jobs may use
different board revisions for their respective accepted surfaces.

```sh
BW_BOARD_DIR=/path/to/bw-board node projects/ms-basic-6502/proof.mjs
BW_BOARD_DIR=/path/to/bw-board node projects/bbc-basic-z80/proof.mjs
BW_BOARD_DIR=/path/to/bw-board node projects/picobb-rp2040/proof.mjs
```

Run a project's `fetch.sh` first when its required files are fetched rather
than committed. Read that script and project README for build prerequisites
and pinned artifact/source identities. Some projects build tools; others
download media. A successful fetch does not establish guest execution.

The repository verifier checks eligible projects and reports explicit skips:

```sh
BW_BOARD_DIR=/path/to/bw-board node scripts/ci-verify.mjs
BW_BOARD_DIR=/path/to/bw-board node scripts/ci-verify.mjs --fetch
```

The second command runs the configured downloads/builds. It does not
make every project bootable; inspect each PASS/FAIL/SKIP and the project proof.

## x86 command-line routes

Run these examples from a compatible bw-board checkout, supplying your actual
file paths. The canonical [x86 user paths](https://github.com/CrispStrobe/bw-board/blob/master/docs/X86-USER-PATHS.md)
and [loading guide](https://github.com/CrispStrobe/bw-board/blob/master/docs/X86-LOADING-GUIDE.md)
define supported formats, geometry, firmware, disk persistence, and debug APIs.

| Goal | Entry point | Boundary |
|---|---|---|
| ELKS shell | `node scripts/elks-shell.mjs --image fd1440-fat.img` | Real floppy boot and hardware keyboard input; see [ELKS](../projects/elks) |
| DOS program | `node scripts/run-dos.mjs PROG.COM --variant 8086 --preset xt --max 5000000 --screen` | Service-layer execution, not a booted DOS disk |
| Supply a DOS input file | Add `--file GUEST.TXT=/path/to/input.txt` | Explicit guest filename mapping; use `--out output` for files created by the service layer |
| 80186-language bundle | Use the variant and budget in its manifest, e.g. `--variant 80186` | fe, Tcl, uBASIC, and the native DOS Forth are not proved as strict 8086 binaries |
| FreeDOS on free AT firmware | `node scripts/run-i80386-free-bios-freedos.mjs` | Uses the documented free Bochs BIOS/VGA profile and required fetched media |
| 386 raw HDD | Follow the loading guide's raw-HDD/live-terminal recipe | Exact CHS and images required; saving writes requires the explicit export route |

The 386 debug contract includes forward stepping, selected code/write
breakpoints, registers, and memory. Disassembly, symbols, step-over/out, and
architectural checkpoint/replay are not implied by the existence of a debug
pane. Refer to the board guide for the exact contract and installed app
adoption requirements.

## Project entry points and accepted activities

| Project | Documented route | What the evidence establishes |
|---|---|---|
| [ELKS](../projects/elks) | `proof.mjs`, board shell runner | Interactive shell and in-OS BASIC |
| [Minix 1.7](../projects/minix-1.7) | XT floppy route | Boot monitor; kernel still hits the documented RAM-disk limit |
| [Minix 2](../projects/minix-2.0) | Free x86 AT firmware and specified floppy | Protected-mode login and shell |
| [MIT MS-DOS](../projects/ms-dos) | Free x86 AT firmware, specified 40/2/9 floppy | Multitasking DOS banner followed by Internal Error 4560, not a working prompt |
| [ALICE Pascal](../projects/alice-pascal) | Booted FreeDOS with overlays available | Menu/editor entry; complete edit/compile/save lesson still needs proof |
| [OpenGEM](../projects/opengem) | Fetch and install on the selected DOS/VGA/mouse environment | Packaging; full graphical interaction proof remains outstanding |
| [Freedoom/FastDoom](../projects/freedoom-fastdoom) | Selected engine, WAD, DOS/extender and VGA configuration | Packaging with outstanding component review and guest execution |
| [ACK](../projects/ack) | Host build followed by DOS service execution | Pascal/C/Modula-2 output; Pascal has a documented OUTPUT-close message |
| [CP/M programs](../projects/cpm-software) | `.COM` slot / `proof.mjs`; board `scripts/cpm-smoke.mjs` for real boot | Sample programs on the shim and real CCP+BDOS CLI route; full browser disk workflow remains separate |
| [BBC BASIC Z80](../projects/bbc-basic-z80) | `proof.mjs` and CP/M `.COM` slot | Interactive arithmetic and stored program execution |
| [Microsoft BASIC 6502](../projects/ms-basic-6502) | `proof.mjs`, Eater ROM + ACIA | Interactive BASIC and stored program execution |
| [PicoBB](../projects/picobb-rp2040) | `proof.mjs`, canonical `runRp2040Bundle` | UART/core0 configuration and the exact sessions documented by the project; sound/multicore are separate |
| [Linux RV32](../projects/riscv32-linux) | `runRiscvLinuxBundle` / Linux lesson | Linux shell, UART commands, verified shell snapshot; cold boot is also supported |
| [KIM CP/M-65](../projects/kim1-cpm65) | Fetch pinned media, then `proof.mjs` | Three specified storage configurations boot to the prompt |
| [ACE KIM](../projects/ace-kim) / [expansion demos](../projects/kim1-expansion-demos) | Their proof scripts and board configurations | The documented keypad, display, memory, and storage exercises |

## Application surfaces

The application supplies machine selection, media loading, display widgets,
input, and debug controls; media-lab supplies separately licensed programs and
images. A board proof is not an installed-app proof. Check the application
version and its [x86 user paths](https://github.com/CrispStrobe/brickwright-lite/blob/main/docs/X86-USER-PATHS.md)
when reproducing a browser or desktop journey.

- The documented 8086 path loads supported bootable floppy images and routes
  the machine display/input through its configured surface.
- The Z80 browser route loads individual `.COM` programs over a BDOS shim.
  Real CP/M disk boot exists on CLI; wiring a full command/disk session into
  the browser is a specific next milestone.
- The Linux RV32 lesson documents an instant shell snapshot and a separate
  cold-boot action. This is not a general promise of reverse debugging.
- The KIM project describes the selected ROM, expanded memory, storage
  adapter, imported paper tape, and terminal command needed for its boot.
- An x86 AT framebuffer is a prerequisite for a graphical program, not proof
  that OpenGEM or Doom has been executed. Audio also needs its own guest and
  device acceptance; a manifest declaration alone is insufficient.

## Adding a runnable learning activity

Record starting machine/media identities, learner input, observed result,
reset path, and persistence boundary. Prefer a bounded proof of that complete
activity over checking only a boot banner. Retain sources, component licenses,
and reproduction recipes for distributed artifacts. See
[LEARNING-EXPERIENCES.md](LEARNING-EXPERIENCES.md) for the activity format.
