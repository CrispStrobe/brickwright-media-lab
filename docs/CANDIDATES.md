# Candidates ledger

Software, firmware and media evaluated for BrickWright, with the **license
basis**, **execution target**, **recorded result** and **next proof** kept
separate. Learning goals and proposed experiments live in
[`LEARNING-EXPERIENCES.md`](LEARNING-EXPERIENCES.md); commands and supported
loading paths live in [`RUNNING.md`](RUNNING.md).

## Reading the ledger

- **Proven** names a particular result on a particular runner. A banner, menu,
  shell, compiler output and completed program are different results.
- **Staged** means a project directory, manifest or fetch recipe exists. It
  does not establish guest execution, an installed GUI journey, or complete
  component review of a selected binary.
- **Candidate** means a proposed integration, even when upstream runs on the
  same CPU family. Its board, memory map, devices and ABI still have to match.
- **Blocked / deferred** names a constraint for the stated target; it is not
  a rejection of every port of that project.

License entries identify recorded upstream terms. Project READMEs and copied
license files carry artifact-specific provenance; unpackaged candidates still
need a pinned source/artifact and review of any bundled runtime or data. A
source license and permission to bundle every component of a prebuilt binary
are separate questions. Older unpackaged entries whose grants are not yet
established are marked explicitly.

**Host compiler**, **guest compiler** and **guest output** are separate
capabilities. The `i8086` machine name alone is not an ISA guarantee: several
portable-C interpreter builds below use its **80186 variant**.

### Firmware and machine profiles

The 8086/XT path uses the project's clean-room `buildBios`. The experimental
`i80386` AT also has a working free-firmware path using the vendored **LGPL
Bochs legacy BIOS and VGABios**. FreeDOS, Minix 2.0.4 and the MS-DOS banner do
not require a proprietary ROM. SeaBIOS is a separate integration candidate.

Name any extended x86 profile explicitly. The accepted stock xv6 x86 result
uses **CR4/PSE and APIC/IOAPIC extensions**; it is not proof of operation on an
unextended original 80386. See the
[board user paths](https://github.com/CrispStrobe/bw-board/blob/master/docs/X86-USER-PATHS.md)
and [xv6 profile notes](https://github.com/CrispStrobe/bw-board/blob/master/docs/XV6-STOCK.md).

## Operating systems

| OS | License basis | Target / path | Recorded state | Next proof or remaining gate |
|---|---|---|---|---|
| **[ELKS 0.9.2](../projects/elks/README.md)** | GPL-2.0; ELKS BASIC MIT | 8086/XT, booted floppy | **Proven, packaged:** interactive shell, keyboard input and BASIC programs | Extend into edit/run/save lessons with a reset-and-reload check |
| **[Minix 1.7.5](../projects/minix-1.7/README.md)** | BSD-3-Clause | 8086/XT | **Partial, packaged:** boot monitor; recorded kernel stop is `RAM disk too big` before a shell | Fit the RAM-disk/userland image to the memory profile |
| **[Minix 2.0.4](../projects/minix-2.0/README.md)** | BSD-3-Clause | Free-firmware `i80386` AT; 16-bit protected-mode guest | **Proven, packaged:** multiuser login, root shell and commands | Demonstrate native compile/link/run separately; a shell does not prove the compiler is installed and usable |
| **FreeDOS 1.4** | Mixed distribution; kernel and FreeCOM GPL-2.0 | Booted DOS on the free AT profile | **Proven host:** ALICE and AT workflows; not a standalone media-lab package | Pin the selected image/component set for a bundle; distinguish it from the DOS service layer |
| **[MS-DOS 1.25 / 2.0 / 4.0](../projects/ms-dos/README.md)** | MIT for upstream released sources and committed binaries | 8086/386, artifact-dependent; selected beta tested on free AT | **Partial, packaged:** `v4.0-ozzie` multitasking beta prints its 4.00 banner, then Internal Error 4560 | Build/qualify mainstream `v4.0/src` for a prompt. Released `v2.0/bin` lacks `IO.SYS` and is not a complete boot image |
| **PDOS/86** | CC0 / public domain recorded; boot-component provenance unresolved | 8086 | **Candidate:** build `pdos16.img` | Review `bootsec.asm` / `pload.com`, then prove boot, file I/O and execution |
| **[OpenGEM / FreeGEM](../projects/opengem/README.md)** | GPL-2.0-or-later | DOS host, graphics framebuffer and mouse | **Staged:** OpenGEM 7 RC3 fetch recipe; no rendered desktop/interaction proof in packaging pass | Install, render and exercise a menu/window through the actual framebuffer/mouse surface |
| **[CP/M-80 2.2](../projects/cpm-software/README.md)** | DRI grant reaffirmed 2022; [board provenance](https://github.com/CrispStrobe/bw-board/blob/master/roms/cpm/PROVENANCE) | Z80; real CCP+BDOS boot on CLI, BDOS services in GUI | **Proven:** CLI boots real CP/M with the project's BIOS/RAM disk and runs sample `.COM`s; GUI runs individual `.COM`s over `CALL 5` services | Bring the real boot/disk session into the GUI; demonstrate several files/programs in one session |
| **CP/M 3 / CP/M Plus** | Same recorded DRI grant; select exact distribution | Z80 with banked RAM and appropriate BIOS | **Candidate:** CP/M-2.2-compatible calls do not establish CP/M 3 support | Qualify banking, boot and CP/M-3-only calls such as date/time and filename parsing |
| **Z-System: ZCPR3 + ZSDOS/ZDDOS** | Mixed; ZSDOS freeware-with-registration requires exact review | Z80 system replacement | **Deferred:** not an ordinary transient `.COM` | Resolve terms and boot the actual system; the BDOS shim is not a substitute |
| **[CP/Mish](https://github.com/davidgiven/cpmish)** | Component-specific permissive terms; selected release still to review | Z80, machine-specific boot images | **Candidate:** source of programs/toolchains, not a blanket proven corpus | Extract/qualify selected programs or port the image's BIOS/devices; Kaypro/Nabu images are not generic Z80 images |
| **[CP/M-65 on KIM-1](../projects/kim1-cpm65/README.md)** | CP/M-65 BSD-2-Clause; release utilities have their own terms | Expanded KIM-1 RAM with SPI SD, Corsham DSK or K-1013 IMD | **Proven, packaged:** `proof.mjs` boots all three disk paths to banner and prompt | Add edit/compile/run and persistence proofs; this 6502 ABI does not run CP/M-80 `.COM`s |
| **[Linux + BusyBox](../projects/riscv32-linux/README.md)** | Linux/BusyBox GPL-2.0-only; glibc LGPL-2.1-or-later | RV32IMAC, Sv32, M/S/U, CLINT/PLIC, 16550A and SBI; 64 MiB | **Proven, packaged:** Linux 6.1.188 shell, UART commands, cold boot and snapshot equivalence | Build lessons on the existing system; RISC-V Linux and its MMU are no longer unbuilt roadmap items |
| **[xv6 x86](https://github.com/CrispStrobe/bw-board/blob/master/docs/XV6-STOCK.md)** | MIT; [upstream](https://github.com/mit-pdos/xv6-public) | Extended x86 AT with PSE/APIC/IOAPIC and free Bochs firmware | **Proven in bw-board, not a media-lab package:** shell/filesystem tasks and full original `usertests` on the recorded large-memory profile | Package exact profile/source/disks and a bounded syscall/process/page-table lesson; not strict 386 hardware compatibility |
| **[xv6 RISC-V](https://github.com/mit-pdos/xv6-riscv)** | MIT | Upstream RV64; lab software core RV32 | **Candidate:** distinct from accepted x86 xv6 | Select/review an RV32 port or add an explicit RV64 machine; RV32 Linux boot does not make upstream RV64 xv6 compatible |
| **[FreeRTOS](https://github.com/FreeRTOS/FreeRTOS-Kernel)** | [MIT](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/LICENSE.md) | RV32 with configured tick/interrupt source | **Candidate:** upstream [RISC-V port](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/portable/GCC/RISC-V/readme.txt); no media-lab runtime proof here | Match port to existing timer/traps/UART; prove two scheduled tasks and a bounded queue/mutex experiment |
| **[MikeOS](https://mikeos.sourceforge.net/)** | BSD-like upstream terms; pin release | 386-class machine, minimum 1 MiB per upstream | **Candidate, reopened for 386:** unsuitable for strict 8086, not rejected for the whole lab | Build/fetch a pinned image and qualify boot plus one program on free AT |
| **CP/M-86** | Historical DR grant; exact terms not established here | 8086 | **Deferred:** no CP/M-86 BDOS services | Resolve artifact license and choose booted OS or `INT E0h` service integration |
| **COHERENT 3.2** | Historical free-distribution grant; exact terms not established here | 286-class AT | **Deferred:** no qualified image/profile | Review exact grant and board/devices; CPU tier alone does not establish bootability |
| **os8088** | MIT project; bundled MS Word material needs separate review | 8086, graphics | **Deferred:** display and distribution-content gates | Select a clean artifact and prove rendered output |
| **SvarDOS / EDR-DOS** | Mixed MIT, EDR-specific and package terms | 8086/AT, image-dependent | **Deferred:** distribution review required | Review exact components; FreeDOS already provides the current DOS host |
| **Minix 3 / KolibriOS / MenuetOS** | Project/variant-specific BSD/GPL or other terms | Later x86, release-dependent | **Deferred:** outside qualified combinations | Evaluate exact ISA, board, memory and license independently; do not infer support from another extended x86 result |
| **[FUZIX, 8086 target](https://github.com/EtchedPixels/FUZIX/blob/master/STATUS.md)** | GPL-2.0 main tree, LGPL libraries, application-specific terms | 8086 | **Blocked:** upstream IBMPC port remains early sketches | Keep separate from functioning ports on other architectures |
| **[FUZIX, Z80 / other 8-bit targets](https://github.com/EtchedPixels/FUZIX)** | [Mixed free components](https://github.com/EtchedPixels/FUZIX/blob/master/LICENCE) | Specific banked-memory boards | **Deferred candidate:** upstream working targets, but Z80 compiler transition warning; CP/M22 target experimental | Pin target/toolchain and implement its memory/devices; not a drop-in CP/M-shim program |
| **Snowdrop OS** | Informal “no restrictions” grant in prior evaluation | 8086 | **Deferred:** exact license/artifact review | Establish grant, pin image and qualify hardware profile |

The [RISC-V OS matrix](RISCV-OS-MATRIX.md) separates the implemented emulator
from the upstream-port and FPGA research. The
[packaged Linux proof](../projects/riscv32-linux/README.md) is the current
emulated-machine baseline; Tang Nano FPGA acceptance remains separate.

## Languages: what runs in the guest today

| Tool / project | License basis | Host and guest distinction | Recorded state | Next learning or runtime proof |
|---|---|---|---|---|
| **[F83](../projects/f83/README.md)** | Public domain | Guest Forth on 8086 DOS service | **Proven, packaged:** banner and interpreter | Define a word, inspect stack effects and save/reload |
| **[VolksForth](../projects/volksforth/README.md)** | BSD-2-Clause | Guest Forth on 8086 DOS service | **Proven, packaged:** banner and `ok` | Compare the same algorithm across Forths/CPUs |
| **[zForth DOS](../projects/forth-dos/README.md)** | MIT interpreter plus recorded runtime terms | `i8086` DOS service; documented run uses **80186 variant** | **Proven, packaged:** file-driven Forth and `pin!` / `pin@` bridge | Reuse GPIO sample; distinguish float cells from CP/M build |
| **[zForth CP/M](../projects/forth-cpm/README.md)** | MIT; project startup BSD-2-Clause | Guest Z80 interpreter, host SDCC build | **Proven, packaged:** reads and executes `PROG.FTH` over BDOS | Compare portable source; integer cells make `7 / 2` equal `3` |
| **[Small-C 2.5](../projects/small-c/README.md)** | Public domain | Compiler itself on 8086 DOS service | **Proven, packaged:** C to 8086 assembly | Complete assembler/linker/execution and persistent-file round trip |
| **[ACK](../projects/ack/README.md)** | BSD-3-Clause | **Host cross-compiler** emits guest 8086 `.COM`; native Minix compiler separate | **Proven, packaged:** Pascal/C/Modula-2 output runs on DOS service | Preserve recorded Pascal output-close warning; separately prove native compilation in now-bootable Minix 2 |
| **[uBASIC DOS](../projects/ubasic-dos/README.md)** | BSD-3-Clause; permissive runtime recorded locally | Guest interpreter on **80186 variant** | **Proven, packaged:** mounted BASIC source executes | Reuse for BASIC-versus-C experiment; no new BASIC port needed |
| **[fe Lisp DOS](../projects/fe-dos/README.md)** | MIT; project/runtime terms recorded locally | Guest interpreter on **80186 variant**, medium model | **Proven, packaged:** arithmetic, factorial and Fibonacci | Expose closures, allocation and fixed-pool garbage collection |
| **[partcl DOS](../projects/tcl-dos/README.md)** | MIT; project/runtime terms recorded locally | Guest interpreter on **80186 variant**, small model | **Proven, packaged:** command substitution and recursive procedures | Compare evaluation models on the same task |
| **ELKS BASIC** | MIT | Interpreter inside booted ELKS | **Proven:** interactive programs | Complete shell/file edit/run workflow |
| **[Microsoft BASIC 6502](../projects/ms-basic-6502/README.md)** | MIT source and ca65 port | Guest ROM on Eater 6502, W65C51 ACIA at `$5000` | **Proven, packaged:** prompt, arithmetic/stored loop; reproducible ROM | Connect memory/I/O experiments to existing interpreter |
| **[BBC BASIC Z80](../projects/bbc-basic-z80/README.md)** | Zlib | Generic guest CP/M `.COM` via BDOS console | **Proven, packaged:** prompt, arithmetic and stored program | Add real CP/M disk workflow; console proof does not establish graphics |
| **[PicoBB RP2040](../projects/picobb-rp2040/README.md)** | Zlib; littlefs/Pico SDK BSD-3-Clause and runtime notices | Guest Cortex-M0+ firmware, UART0/core0 | **Proven, packaged:** prompt/programs, formatted LittleFS, and saved-program readback in a fresh machine retaining only flash; clean-image negative control | Preserve `SOUND=NONE` and UART-only configuration; interrupted-write durability and browser storage/export need separate proofs |
| **[Tali Forth 2](../projects/tali-forth-65c02/README.md)** | Pinned upstream public-domain grant; original integration also dedicated to the public domain | **65C02**, 32 KiB ROM, ACIA `$5000`; dictionary RAM below reserved framebuffer `$3000` | **Proven, packaged:** console definitions/redefinition, variables, 2 KiB framebuffer stores, VIA output and fresh-machine isolation; reproducible ROM and interactive/script CLI | Add bounded stack-error and dictionary/storage exercises separately; this is not an NMOS-6502 build |
| **[ALICE Pascal](../projects/alice-pascal/README.md)** | Artistic-1.0 per upstream grant | Guest IDE on booted FreeDOS/free AT; DOS 3+ PSP overlay path | **Proven, packaged:** main menu with overlays found | Edit/run/save a program; menu acceptance alone does not qualify that cycle |

## Language and runtime additions

These are candidates to package and prove, not newly supported runtimes. See
[`LEARNING-EXPERIENCES.md`](LEARNING-EXPERIENCES.md) for the lesson designs.

| Candidate | License / source | Intended target | Why add it | Admission and runtime gate |
|---|---|---|---|---|
| **Cowgol** | [BSD-2-Clause](https://github.com/davidgiven/cowgol/blob/master/COPYING); [upstream](https://github.com/davidgiven/cowgol) | Guest Z80 CP/M compiler, host bootstrap tools | Edit/compile/run entirely inside the small computer | Pin compiler/tool set, fit memory/disk, compile changed source and run output. Upstream support is not local proof; compiler self-rebuild is a further milestone |
| **uLisp ARM** | [MIT](https://github.com/technoblogy/ulisp-arm/blob/master/LICENSE); [RP2040 support](https://github.com/technoblogy/ulisp-arm/blob/master/README.md) | RP2040 single-core UART console | Redefine functions while controlling visible peripherals | Adapt UART0, avoid unsupported core/device assumptions, prove prompt and GPIO. Arduino USB `Serial` is not UART0 |
| **MicroLua** | [MIT](https://github.com/MicroLua/MicroLua/blob/main/LICENSE.txt); [upstream](https://github.com/MicroLua/MicroLua) | RP2040, first one core | Cooperative coroutines with visible scheduling effects | Qualify one-core build/UART/timers/GPIO; show yielding and blocking tasks. Second core is separate |
| **Berkeley Logo `BL.EXE`** | GPL-2.0 recorded in prior evaluation | DOS, intended 8086 path | Turtle geometry and recursive pictures | Unpack `blogo.exe` / `INSTALLU.EXE` on DOS, pin executable and prove graphics/input |
| **GW-BASIC** | MIT source; [buildable tkchia fork](https://github.com/tkchia/GW-BASIC) | 8086 DOS | Historical BASIC with source-to-binary story | Build with JWasm/JWlink and prove executable; source release alone is not runnable. Record stubbed features |
| **DeSmet C / DCC for ELKS** | GPL-2.0 recorded in prior evaluation | Guest compiler inside ELKS | Native C on 8086 Unix | Pin/build/inject compiler and compile/link/run changed source |
| **GCC-IA16** | GPL-3.0 + runtime exception; [upstream](https://github.com/tkchia/gcc-ia16) | Host cross-compiler for 8086/186/286 | Already supports guest builds | Record generated ISA/runtime per artifact; compiler itself is not 8086-native |
| **SmallerC** | BSD-2-Clause; [upstream](https://github.com/alexfru/SmallerC) | Host or 386 DOS compiler; emits 8086 output | Inspectable compilation path | Distinguish compiler host requirement from output target; prove DOS runtime |
| **Open Watcom 1.9 / V2** | Sybase Open Watcom Public License; policy fit to review | 386 DOS/host, target-dependent | C/C++/Fortran and historical tooling | Review compiler/runtime terms and prove a build/run cycle |
| **DJGPP** | GPL compiler; component/runtime-specific terms | 386 DOS with DPMI | GCC inside simulated PC | Accepted [finite DPMI client result](https://github.com/CrispStrobe/bw-board/blob/master/docs/I80386-DPMI-HIGHMEM-AT-RESULTS.md) is not broad DJGPP compatibility; qualify compiler/files/output program |
| **Free Pascal** | GPL compiler; LGPL/runtime-specific terms | i8086 cross target; 386 `go32v2` host candidate | Pascal across native/cross paths | Prove selected compiler-host/runtime; i8086 output does not make compiler 8086-native |
| **Paterson listings** | MIT | Historical source/reference | Source archaeology | Keep as reference until a reproducible executable exists |

## Games, media and storage experiments

| Item | License basis | Target / state | Learning opportunity | Remaining gate |
|---|---|---|---|---|
| **CHIP-8 with Octo** | [Octo MIT](https://github.com/JohnEarnest/Octo/blob/gh-pages/LICENSE.txt); [archive CC0](https://github.com/JohnEarnest/chip8Archive/blob/master/Readme.md) | **Candidate:** host/browser tooling; choose separate VM or guest interpreter on existing CPU | Build a game, then change its VM's sprite/collision instruction | Pin small cartridge corpus/metadata; prove display/keys/timers. `chip8`, `schip`, `xochip` and quirks are distinct profiles. Octo is not an existing native 6502/Z80 binary |
| **PunyInform + Inform 6 + Frotz** | [PunyInform MIT](https://github.com/johanberntsson/PunyInform/blob/master/LICENSE); [Inform 6 selectable Artistic-2.0](https://github.com/DavidKinder/Inform6/blob/master/licence.txt); [Frotz](https://github.com/DavidGriffith/frotz) GPL-2.0-or-later, exact port to pin | **Candidate:** host-compiled Z-machine story, separately qualified guest interpreter | Author a tiny room/object puzzle; inspect parser/bytecode; save/restore | PunyInform requires Inform 6.44+. Pin versions/story format; prove input/save/restore on selected guest. Interpreter terms do not license third-party stories |
| **littlefs laboratory** | [BSD-3-Clause](https://github.com/littlefs-project/littlefs/blob/master/LICENSE.md) | **First storage stage delivered:** PicoBB saves a program and reads it back after a fresh-instance boot retaining only flash | Observe file updates, then bounded power-loss recovery | Define interrupted-operation model and instrument flash writes/remounts; completed-save readback does not establish interruption durability |
| **[Freedoom + FastDoom](../projects/freedoom-fastdoom/README.md)** | Data BSD-3-Clause; engine source GPL-2.0; **prebuilt component review pending** | **Staged:** 386 DOS/extender + VGA; no packaging-pass guest execution proof | Later rendering/performance/game-modification lesson | Review exact extender/runtime/libraries/source/notices; then prove menu/game/input/exit. Fetchability is not a reviewed runnable bundle |
| **Freedoom alone** | BSD-3-Clause | Data, not executable | Inspect maps/assets with qualified engine | Requires an engine; does not independently establish runtime |
| **Sopwith / zmiy / sudoku86** | GPL-2 / GPL-3 / BSD-2 respectively in prior ledger; exact artifacts to pin | **Candidates:** DOS, intended 8086 path | Small input/state/rendering games | Verify each binary's ISA/license/video/input and run; one proof does not cover the group |
| **[Blinkenrocket](../projects/blinkenrocket-firmware/README.md)** | Firmware terms in package | **Proven, packaged:** ATtiny88/matrix boot glyph | Change glyph, scan order or refresh rate | Prove changed pattern/timing on intended simulation surface |
| **[Original 6502 animation](../projects/6502-animation/README.md)** | Original source, player, encoder and lesson MIT | **Proven, packaged:** ROM-resident frames on the Eater-style 100×64 framebuffer | Edit a sprite/frame, rebuild, inspect real guest frame captures and replay | Raw frames are the initial format; compression, SD streaming and installed-browser authoring remain extensions |
| **[Bad Apple](../projects/ben-eater-bad-apple/README.md) / [Steamboat Willie](../projects/steamboat-willie/README.md)** | Code, encoded data and source media have separate provenance; see projects | Existing Eater-6502 framebuffer/SD media path | Encode original animation; compare raw frames/deltas/compression under bandwidth budget | Use original or reviewed reusable source clip; retain terms and prove encoder-to-playback round trip |
| **[tron-0xf](../projects/tron-0xf/README.md)** | Package's upstream terms | Existing ZX48 acceptance title | Follow input to game state and screen writes | Title acceptance is not arbitrary Spectrum ROM/game compatibility |
| **[x86 benchmarks](../projects/x86-benchmarks/README.md)** | Per-benchmark license/provenance | Packaged finite workloads/results; [Whetstone validation](../projects/x86-benchmarks/whetstone-validation/README.md) now selects and completes the qualified native 386 DOS route | Inspect software floating point and what benchmarks measure | Preserve profiles/inputs/result bounds; host wall time is not calibrated historical CPU speed; runtime provenance limits remain explicit |

## Firmware

| Firmware | License basis | Recorded role | Gate for a new claim |
|---|---|---|---|
| **`buildBios`** | Project's free implementation | Proven clean-room 8086/XT BIOS | Qualify new device/boot behavior on exact XT profile |
| **Bochs legacy BIOS** | LGPL-2.1 | Proven free AT boot; vendored `roms/free-at-bios/BIOS-bochs-legacy`, Bochs 2.7 | Keep revision, ROM placement and board with guest proof |
| **Bochs VGABios** | LGPL-2.1 | VGA firmware used with free AT profile | Graphics/input acceptance remains application-specific |
| **SeaBIOS** | LGPL-2.1/3, selected component-dependent | Separate candidate; earlier bring-up hit CPU coverage, ROM-window and platform-service gaps | Reassess current board/exact image; no accepted SeaBIOS boot recorded here. Free AT operation no longer depends on it |
| **SeaVGABIOS** | LGPL-3 | Alternative free VGA firmware | Name/prove exact firmware/profile; not interchangeable evidence for Bochs image |
| **GLaBIOS** | GPL-3.0 | Upstream free 8088/XT BIOS, alternative to `buildBios` | Pin/configure XT image and prove intended behavior |
| **coreboot / libreboot** | GPL-2 / GPL-2+/3, components vary | Physical-platform firmware research | Select matching platform/payload; not an automatic emulator BIOS replacement |

## Deferred ideas with distinct hardware work

- **[Classic Contiki](https://github.com/contiki-os/contiki)** —
  [BSD-3-Clause](https://github.com/contiki-os/contiki/blob/master/LICENSE).
  C64/Apple II/AVR ports do not match a generic Eater 6502 board. Revisit for a
  deliberate networking lesson after selecting board, transport and packet
  observation paths.
- **[Collapse OS](https://collapseos.org/)** — promising for a tiny computer
  building software for another. Pin source and verify its primary license
  before adding a checked license entry; board I/O, storage and self-hosting
  proofs remain separate tasks.

For a promoted candidate, record the source/artifact pin, exact machine
profile and a small observable result in its project README. The next useful
milestone is a learner changing something and observing the result; the
[learning roadmap](LEARNING-EXPERIENCES.md) specifies those outcomes.
