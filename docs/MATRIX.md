# Machines, operating systems, and languages

This is the index of documented capabilities, reviewed against project proofs
on 2026-11-27. A CPU implementation, an upstream port, a fetched image, and an
interactive lesson are separate milestones. The linked project README and
proof define the accepted combination; an entry here does not qualify every
program on that architecture or every installed application version.

- [Candidates](CANDIDATES.md): licenses, upstream sources, and integration gates.
- [Running](RUNNING.md): the actual entry points and their limits.
- [Learning experiences](LEARNING-EXPERIENCES.md): activities, observations,
  challenges, and the implementation order.
- [RISC-V OS matrix](RISCV-OS-MATRIX.md): emulated board versus FPGA targets.

## Current machine families

| Machine | Documented execution | Languages and tools | Next useful experience |
|---|---|---|---|
| **8086 / PC-XT** | [ELKS](../projects/elks) shell; [Minix 1.7](../projects/minix-1.7) boot monitor, with kernel memory blocker | F83, VolksForth, Small-C compiler; ACK host compiler produces Pascal/C/Modula-2 programs | Compare implementations of one algorithm; repair a controlled boot failure |
| **DOS service layer, selected x86 variant** | Direct `.COM`/MZ programs; this does not boot DOS | [fe Lisp](../projects/fe-dos), [Tcl](../projects/tcl-dos), [uBASIC](../projects/ubasic-dos), and [native Forth](../projects/forth-dos) use their documented **80186** variant; strict 8086 compatibility is a separate claim | Inspect stack, heap, files, and compiler output |
| **Experimental x86 AT / 386 profile** | Free Bochs BIOS + VGABios; [Minix 2](../projects/minix-2.0) login/shell; [MIT MS-DOS](../projects/ms-dos) banner then error; FreeDOS host | [ALICE Pascal](../projects/alice-pascal) reaches menu/editor on real DOS; other hosted compiler candidates need individual proof | Re-evaluate MikeOS; package the existing board xv6 result |
| **Z80 / CP/M** | [Real CP/M 2.2 boot on CLI](../projects/cpm-software); browser `.COM` route uses a BDOS shim | SDCC/ACK/pasmo cross output; [BBC BASIC](../projects/bbc-basic-z80); [Forth](../projects/forth-cpm) | Complete browser disk/command workflow, then native Cowgol compile/run |
| **ZX Spectrum** | [tron-0xf](../projects/tron-0xf), the documented ZX48 acceptance game | Z80 assembly and the selected BASIC/ROM environment | Small games with observable display and input behavior |
| **6502 / 65C02 boards** | [Microsoft BASIC](../projects/ms-basic-6502); [original animation workshop](../projects/6502-animation); [Tali Forth](../projects/tali-forth-65c02) on its explicit **65C02** map; [Bad Apple](../projects/ben-eater-bad-apple); [KIM-1 CP/M-65](../projects/kim1-cpm65), [ACE KIM](../projects/ace-kim), and [expansion demos](../projects/kim1-expansion-demos) | ca65/ld65, cc65 and 64tass are host tools; Tali runs in the guest | Editable ROM animation and live Forth memory/port exercises are packaged; SD streaming/compression extensions and a monitor-to-disk KIM sequence remain distinct lessons |
| **RP2040** | [PicoBB](../projects/picobb-rp2040) UART-console firmware and formatted LittleFS on rp2040js; fresh-machine saved-program readback proved; MicroPython has a separate app probe | BBC BASIC, MicroPython; C cross builds | Completed-save persistence is proved; interrupted writes, uLisp and scheduling need their own experiments |
| **AVR / ATmega / ATtiny** | avr8js; [Blinkenrocket](../projects/blinkenrocket-firmware) documents boot/display interaction | avr-gcc and Arduino host toolchains | Change a visible pattern and inspect timer/input behavior |
| **8051 / STC** | Functional MCU family; exact devices and toolchain routes belong to the app's device matrix | SDCC cross builds | Small I/O and interrupt experiments with per-device proof |
| **Harris 80286** | Separate functional/wired integrations; DOS variant selection alone does not select an AT board | Selected 16-bit x86 toolchains | Follow the board's explicit connectivity and execution evidence |
| **RISC-V RV32** | [Linux + BusyBox](../projects/riscv32-linux), RV32IMAC, M/S/U, Sv32, CLINT, PLIC, 16550A; shell snapshot and cold boot documented | GCC/LLVM cross tools; bare-metal programs | Rebuild `/init`; modeled flash power loss; FreeRTOS port and task timeline |

## Important boundaries

- [OpenGEM](../projects/opengem) and [Freedoom/FastDoom](../projects/freedoom-fastdoom)
  are packaging candidates with outstanding graphical/guest proof. They are
  not accepted merely because the AT board boots other software.
- [Steamboat Willie](../projects/steamboat-willie) shares a display-rig idea;
  its specific decoder/data combination still needs its own execution proof.
- ACK's cross-compiled output is distinct from a compiler executing inside
  Minix. Small-C compiling a source file is distinct from a complete
  edit/assemble/link/run/save workflow.
- The [documented xv6 x86 board](https://github.com/CrispStrobe/bw-board/blob/master/docs/XV6-STOCK.md)
  has **CR4/PSE and APIC/IOAPIC compatibility extensions**. Its acceptance is
  not a claim about an unextended original 80386. A media-lab teaching bundle
  is still separate work.
- Stock [xv6-riscv](https://github.com/mit-pdos/xv6-riscv/blob/riscv/Makefile)
  targets RV64. It is not an already proven guest on the RV32 Linux machine.
- FreeRTOS, Zephyr, NuttX, and RT-Thread remain board-port/bundle candidates
  here. Having the required CPU facilities does not prove their BSPs or images.
- Guest instructions, modeled scheduling charges, and host elapsed time are
  different measurements. See [benchmark contracts](../projects/x86-benchmarks).

## RISC-V has two distinct substrates

### Emulated RV32: implemented

The software core and Linux lesson already exist. The next work is complete
activities and additional qualified guests, not implementing Sv32, CLINT, or
PLIC from scratch. The [Linux project](../projects/riscv32-linux) records the
exact images, corresponding sources, snapshots, and proof commands.

### Tang Nano 20K: separate FPGA work

[TANG-NANO-RISCV.md](TANG-NANO-RISCV.md) describes the soft-core selection and
hardware workflow. A RISC-V program needs a board-specific memory map, timer,
interrupt model, peripherals, and build configuration. Sharing an ISA does not
make the emulator's Linux image a Tang Nano image. The FPGA path needs its own
bitstream and real-board evidence before it becomes a proven lab combination.
