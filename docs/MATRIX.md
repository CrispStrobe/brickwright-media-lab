# The matrix — chips × OSs × compilers

The one-page overview of what runs where across the BrickWright lab: every CPU
the emulators cover, the operating systems that boot on it, and the compilers /
languages that target it. This is the **index**; the detail lives in two focused
docs it does not duplicate:

- **`docs/CANDIDATES.md`** — every OS/compiler evaluated, with license + honest status.
- **`docs/RUNNING.md`** — how to actually run each one (CLI + GUI).
- **brickwright-lite `docs/device-matrix.md`** — the chip × *language*/toolchain detail (compiler, AST, blocks, debugger modules).

Legend: ✅ proven here · 🟡 partial / one honest gap · 🔴 not built (planned) · ⚠️ caveat · *emu* = software-emulated core · *hw* = real silicon.

## Chips × OSs × compilers

| Chip / core | Where | OSs it runs | Compilers / languages that target it |
|---|---|---|---|
| **Intel 8086** | ✅ emu (PC-XT: BIOS + µPD765 + 8237 + 8259 + CGA) | ELKS (shell), Minix 1.7 (monitor), MS-DOS 1.25/2.0/4.0, FreeDOS, PDOS/86, OpenGEM | ACK (C/Pascal/Modula-2), Small-C, SmallerC, F83 + VolksForth (Forth), uBASIC, GW-BASIC, asm (service); GCC-IA16 (cross) |
| **Intel 80386** | ✅ emu (free LGPL Bochs BIOS + VGABios — GUI boot) | Minix 2.0.4 (`login:` → shell), MS-DOS 4.0 (banner), FreeDOS, OpenGEM, FastDoom+Freedoom | Open Watcom, DJGPP (GCC), Free Pascal — hosted / 386-host |
| **Zilog Z80** | ✅ emu | **CP/M 2.2** — real CCP+BDOS boot (CLI) + BDOS shim (GUI); BBC BASIC (built-in default) | SDCC (C), ACK (z80/cpm), pasmo (asm), BBC BASIC |
| **ZX Spectrum 48/128** | ✅ emu (Z80) | Spectrum ROM + games (tron-0xf) | z80 asm, BASIC |
| **MOS 6502 / W65C02** | ✅ emu (Eater rig) | — (CP/M-65 is a candidate); demos: Bad Apple, Steamboat Willie | cc65 (C), ca65 + ld65 (asm) — hosted |
| **Intel 8051 (STC12…)** | ✅ emu | — (MCU) | SDCC (5 of 6 STC parts link locally; STC89 hosted) |
| **AVR (ATmega/ATtiny)** | ✅ emu (avr8js) | — (Arduino / MCU) | avr-gcc (hosted, C + asm), Arduino |
| **RP2040 (Pico)** | ✅ emu (rp2040js) | — (MicroPython boots in-sim) | C (hosted → bin/UF2), MicroPython |
| **Intel 80286 (Harris)** | ⚠️ functional core too slow for the widgets pane (generator-bound) | (286-tier OSs, not productized) | as 8086 |
| **RISC-V rv32** | 🔴 **planned** — new emulated core (cf. ultraembedded *exactstep*) | Linux (rv32ima) / xv6-riscv / an RTOS / bare-metal | RISC-V GCC / LLVM (cross) |

## The two new axes (planned, honestly not built)

### Emulated RISC-V (rv32) — the software-core axis
A new chip in the lab beside i8086 / z80 / 6502: an `rv32ima` interpreter core,
a RISC-V GCC/LLVM cross route, and OS bring-up in emulation (bare-metal → xv6 →
Linux). No FPGA involved. This is the natural next family — it parallels every
existing core and unlocks the whole RISC-V OS + compiler ecosystem in the
browser. Reference cores: ultraembedded *exactstep* (ISA sim), *biriscv* (RTL).

### Tang Nano 20K soft RISC-V SoC — the hardware axis
The FPGA tab is already **Tang Nano 20K-native**: Verilog → **Yosys** → in-app
netlist simulation, and the native (Tauri) app flashes a real `.fs` bitstream
via **openFPGALoader**. Today it does gate/RTL-level designs (counters, LEDs,
logic ICs). The soft-CPU step is a *SoC bitstream* built with the open Gowin
flow (Yosys + nextpnr-apicula) → flashed → booting an OS on real silicon, cross-
compiled with RISC-V GCC. On-ramp: a small core (picorv32 bare-metal, or
VexRiscv-Linux); **biriscv-Linux** is the stretch (it has an MMU but is large for
the GW2AR-18). This is a hardware-in-the-loop workflow, distinct from the
emulated core above — the two share only the ISA and the compilers.

## Reading the matrix

- **"Runs here" is measured**, not aspirational — an OS cell means it boots on
  the emulated machine (see `RUNNING.md` for the exact command / GUI slot).
- **A compiler cell is where the toolchain runs**, which is often a host/hosted
  endpoint emitting for the chip, not the chip compiling itself. The 8086 is the
  exception that also compiles *on* the target (the DOS service bench runs real
  DOS compilers in the browser).
- **Emulated ≠ hardware.** Every ✅ above is a software core. The Tang Nano track
  is the only path to real silicon, and only for what a bitstream is built for.
