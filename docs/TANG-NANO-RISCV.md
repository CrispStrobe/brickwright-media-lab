# Tang Nano 20K — soft RISC-V SoC on real silicon

The **hardware** RISC-V axis of the lab: a RISC-V CPU **synthesised into the
Gowin FPGA** on a physical Tang Nano 20K, not interpreted in software. This is a
*design + toolchain plan*, honest about what is proven here and what needs a
board on a desk — **no bitstream is claimed** (the open Gowin toolchain and a
physical board are not available in this environment).

It is the sibling of two things it does **not** duplicate:

- **brickwright-lite `docs/TANG-NANO.md`** — the authoritative *implementation
  plan* for the FPGA tab (phases TN0–TN6, the hosted `bw-synth` service, the
  licence policy, the tier model). That document owns the editor surface, the
  synthesis service and the flashing transport. **This one owns only the
  soft-CPU core question**: which RISC-V core, at which rung, and how a compiled
  program reaches real silicon. Where they overlap, `TANG-NANO.md` is canonical
  and is cited, not restated.
- The **emulated rv32 core** (bw-board `src/riscv32.js`, RV32IMA) — a *software*
  interpreter, no FPGA. See [`MATRIX.md`](MATRIX.md) §"Emulated RISC-V". The two
  share the **ISA and the GCC/LLVM cross toolchain and nothing else** (§4).

Legend: ✅ proven (measured here or cited upstream) · 🟡 partial / one honest
gap · 🔴 not built (planned) · 🖥️ needs a desktop/board, cannot run in CI ·
⚠️ caveat. Every licence is verified against the upstream LICENSE / GitHub
licence API, dated; anything else is marked *estimate*.

---

## 0. The board budget (what everything below must fit)

`GW2AR-LV18QN88C8/I7`, the Gowin part on the Tang Nano 20K. Numbers from the
lite `TANG-NANO.md` (hardware in hand) and Gowin's GW2A-18 datasheet:

| resource | budget | note |
|---|---|---|
| LUT4 | **20 736** | the headline "~20.7K LUTs" |
| FF | **15 552** | registers |
| block RAM (BSRAM) | **~46 × 18 Kbit ≈ 828 Kbit** (~104 KiB) *estimate* | CPU TCM / caches live here |
| in-package RAM | **8 MB SDRAM** (64 Mbit) | the Linux question turns on this |
| flash | 64 Mbit QSPI | bitstream + payload |
| other | microSD, HDMI, RGB LED, 27 MHz osc, onboard USB-JTAG | |
| chipdb name | **`GW2A-18C`** (C-grade) | *not* `GW2A-18`; `--vopt family` required |

The `GW2A-18C` vs `GW2A-18` trap and the `--vopt family` requirement are
documented at length in lite `TANG-NANO.md` — it "cost three CI rounds." Do not
rediscover it.

---

## 1. Toolchains

### 1.1 FPGA place-and-route: the open Gowin flow vs the Gowin IDE

Two ways to turn Verilog into a `.fs` bitstream for this part.

| | **Open flow** | **Gowin IDE (vendor)** |
|---|---|---|
| pipeline | Yosys (`synth_gowin`) → **nextpnr-himbaechel-gowin** → **Apicula** `gowin_pack` → `.fs` | Gowin EDA (synth + P&R + pack), one GUI/CLI |
| licence | Yosys **ISC**, nextpnr-himbaechel-gowin **ISC**, Apicula **MIT** — all shippable | proprietary, free-of-charge *Education* build; account/licence file required |
| runs headless / in CI | ✅ **yes** — it is what `bw-synth` runs in a container (§3) | 🖥️ ⚠️ desktop-oriented; EULA + licence-server friction make it a poor CI citizen |
| the reference here | ✅ **this is the lab's flow** | used by third-party projects (e.g. grughuhler's picorv32 port), *not* by us |
| device string | `family GW2A-18C`, `device GW2AR-LV18QN88C8/I7` | same part |

**The lab is committed to the open flow** and has already stood it up three ways
(lite `TANG-NANO.md` §5.2, §8): a hardened container service
(`synth.crispstro.be`), a byte-identical in-browser WASM chain (`@yowasp/yosys` +
`@yowasp/nextpnr-himbaechel-gowin` + Apicula via Pyodide), and a `bw-fpga` CLI.
All three produce a **byte-identical blinky bitstream** (`586e54ac…`), which is
the differential that makes the flow trustworthy. A soft-CPU SoC is *more
Verilog through the same pipe* — no new P&R tool.

**CI-vs-desktop verdict (the honest one):**

- **P&R itself runs in CI / on a server today** — proven: `bw-synth`'s CI builds
  a bitstream on every push, and the deployed container does ~8 s builds at
  ~200 MB RSS. The open flow is genuinely headless.
- **Two things are *not* in CI and structurally cannot be:** (a) **the browser
  WASM tier needs WebAssembly-GC**, which **Node does not expose** — so
  `bw-fpga --mode local` refuses from the command line by design, and local
  synthesis is editor/native-app only; (b) **flashing needs a physical board on
  USB**, and this VM has no passthrough (lite `TANG-NANO.md` §7.2, §8/TN4).
- **A soft-CPU bitstream is heavier than a blinky.** The blinky is seconds; a
  picorv32/VexRiscv SoC with P&R is minutes and more memory. On this
  memory-starved VPS, treat a real SoC build as **CI/server work, never a local
  webpack-adjacent build** (the box OOMs — a recurring lesson in the lab memory).

### 1.2 The RISC-V cross toolchain (CPU side)

The program the soft CPU runs is built on a **host**, cross-compiled — the FPGA
never compiles for itself.

| tool | licence | role | status here |
|---|---|---|---|
| **riscv-gnu-toolchain** (GCC + binutils + newlib) | GPL-3.0 w/ **GCC runtime exception** | `riscv32-unknown-elf-gcc`, bare-metal ELF → `.bin`/`.hex` | 🖥️ cross-only, like every other GCC in the lab |
| **LLVM/Clang** (`--target=riscv32`) | Apache-2.0-with-LLVM-exception | alternative cross compiler | 🖥️ cross-only |
| picolibc / newlib | BSD-family | libc for bare-metal | with GCC |

**Licence note that matters and is easy to get wrong:** GCC being GPL-3.0
**does not touch the bitstream or the user's program**. *Running* a compiler
never licences its output (the runtime exception exists precisely for this), and
the lab has settled this exact question repeatedly — SDCC, avr-gcc, GCC-IA16 are
all GPL cross tools whose output ships freely. The RISC-V GCC is the same slot.
The ISA is open and unencumbered (RISC-V International); using rv32 costs no
licence. This is the **shared** toolchain with the emulated core (§4) — one
cross toolchain feeds both substrates.

---

## 2. The core selection ladder

Four permissively-licensed cores, ordered by ambition. **The whole ladder is
licence-clean** — a notable contrast with the *retro* FPGA-core ecosystem, which
lite `TANG-NANO.md` §2.2 found to be "almost entirely GPL-3.0 or unlicensed."
For soft RISC-V there is no GPL/ROM wall: every rung below is MIT/ISC/Apache.

LUT/BRAM figures are **upstream-cited or estimates, never measured on this part
here** — marked accordingly. They must be *measured* (a real `nextpnr` report)
before any of them is promised.

| rung | core | ISA | ~LUT4 | fit on GW2AR-18 | Linux? | licence |
|---|---|---|---|---|---|---|
| **0 (sub-rung)** | **SERV** | RV32I(+MC/Zicsr) | **~198–350** *(iCE40, cited)* | trivial (<2%) | no | **ISC** ✅ |
| **1 — first rung** | **picorv32** | RV32I / +M / +C | **~1 000** (no M), **~2 011** (IMC) *(cited)* | **easy** (~5–10%) | no (no MMU) | **ISC** ✅ |
| **2 — the stretch** | **VexRiscv** (Linux variant, LiteX) | RV32IMA + MMU | **~3.3–6k** *(Artix/Cyclone, cited; GW2A est.)* | fits, **tight w/ caches+SDRAM ctrl** | 🟡 **yes, community-proven** | **MIT** ✅ |
| **3 — stretch-of-the-stretch** | **biriscv** | RV32IMZicsr + basic MMU, **dual-issue superscalar** | large *(no GW2A number; "fits Artix-7 w/o all LUTs")* | ⚠️ **tight-to-over budget** on GW2A-18 | yes (boots Linux 5.0 RV32IMA on Arty) | **Apache-2.0** ✅ |

### Rung 1 — picorv32 is the recommended first rung 🔴→(bring-up)

**Recommendation: start with picorv32, bare-metal.** Reasons:

- **Smallest core that is still a comfortable, conventional CPU** (SERV is
  smaller but bit-serial — pedagogically a curiosity, ~40× slower per
  instruction; a poor "here is a RISC-V running your C" demo). picorv32 at
  ~1–2k LUT4 uses **well under 10 %** of the GW2AR-18 — all the fabric headroom
  is for the SoC around it, not the CPU.
- **A working, board-specific reference exists**:
  [`grughuhler/picorv32_tang_nano_20k`](https://github.com/grughuhler/picorv32_tang_nano_20k)
  — picorv32 + on-chip SRAM + a `simpleuart` wrapper + LED/timer/WS2812, serial
  at 115200, one-letter command monitor, **bare-metal**. (It builds with the
  *Gowin IDE*; our contribution is porting that SoC to the **open** flow — same
  Verilog, different P&R.) picorv32 itself is `YosysHQ/picorv32`, **ISC**.
- **No MMU, no external-RAM dependency** for the first light-up: CPU + BRAM +
  UART fits in on-chip block RAM, so the SDRAM controller (the fiddly part) is
  not on the critical path to "GCC output over UART."
- It is the honest *hardware* analogue of the emulated core's "bare-metal →
  xv6 → Linux" bring-up ladder (`MATRIX.md`): prove the substrate with the
  smallest real program first.

Note this **complements** lite's decision #9 ("first *SoC*: VexRiscv, the LiteX
default"). Those are not in conflict: VexRiscv/LiteX is lite's chosen
*productisation* path because a LiteX `csr.json` **single-sources** the Renode
functional-simulation tier (lite `TANG-NANO.md` §4) — its value is the
sim↔silicon correspondence, not minimal area. picorv32 is the **bring-up rung**:
the smallest thing that proves *our open flow can put a CPU on this board at
all*, before taking on LiteX's generator machinery. Ladder, not fork.

### Rung 2 — VexRiscv / the Linux stretch 🟡

Linux on the Tang Nano 20K is **real and community-demonstrated**, and it uses
**VexRiscv** (RV32IMA + MMU) under **LiteX**: Sipeed showcased a 48 MHz VexRiscv
softcore booting a minimal Linux, using the in-package SDRAM as main memory
([CNX Software, 2023](https://www.cnx-software.com/2023/05/22/25-sipeed-tang-nano-20k-fpga-board-can-simulate-a-risc-v-core-run-linux-retro-games/)).
The canonical software path is `linux-on-litex-vexriscv`.

**But mark the tension honestly.** lite `TANG-NANO.md` lists "Linux on the soft
CPU (8 MB SDRAM)" as an **explicit non-goal** and says "8 MB SDRAM rules out
Linux — do not plan for it." Both statements are true at once:

- The community boot is a **buildroot/no-MMU-tight minimal** Linux, heavily
  slimmed, slow, and dependent on the SDRAM controller + caches all fitting
  *alongside* the MMU core — the "tight" in the table. It is a stunt-that-works,
  not a comfortable dev target.
- The lab's product decision descopes it deliberately: the *functional* tier
  (Renode) gives a far better Linux-on-RISC-V experience than 8 MB of real
  SDRAM ever will, and the silicon's value is bare-metal/RTOS immediacy.

So: **VexRiscv bare-metal/RTOS is the credible rung-2 target**; **VexRiscv-Linux
is a demonstrable stretch we can cite but should not promise as a smooth path.**
VexRiscv is **MIT**.

### Rung 3 — biriscv, the stretch-of-the-stretch ⚠️

[`ultraembedded/biriscv`](https://github.com/ultraembedded/biriscv) — **Apache-2.0**,
RV32IMZicsr with **basic MMU**, a **dual-issue superscalar** 6/7-stage pipeline
that boots Linux 5.0 (RV32IMA, atomics emulated) on a Digilent Arty (Artix-7).
Its own README says it "fits easily onto cheap hobbyist FPGAs … *without using
all LUT resources*" — but the reference is **Artix-7**, a larger fabric than the
GW2A-18. No GW2A LUT number is published. Superscalar dual-issue is *expensive*
in LUTs and multi-port register-file pressure; **on a 20.7K-LUT GW2A-18 this is
tight-to-over budget** and is the right thing to label the stretch-of-the-stretch
until a real `nextpnr` report on this part says otherwise. It is the axis's
"prove the ISA can host a real OS with an MMU" endpoint, not an early rung.

---

## 3. The flow, end to end

```
   RISC-V C/asm                         Verilog SoC (this axis's new HDL)
   ┌───────────┐                        ┌──────────────────────────────┐
   │  main.c   │  riscv32-…-gcc  →      │  picorv32  ─ bus ─ BRAM       │   Yosys
   │           │  .elf → .bin/.hex ───► │  (rung 1)        │           │   +nextpnr
   └───────────┘  (cross, host, §1.2)   │            UART ─┤  (opt.)   │   +Apicula
        │  program image                │            SDRAM/SD ─┘        │  (open flow,
        └──── init BRAM / QSPI ────────►└──────────────────────────────┘   §1.1)
                                                       │  .fs bitstream
                                                       ▼
                                        openFPGALoader  -b tangnano20k  design.fs
                                          (native Tauri transport, or bw-fpga CLI)
                                                       │
                                                       ▼
                                        real GW2AR-18 ── UART 115200 ──► host terminal
                                                       (GCC output over serial)
```

**What is proven here vs what needs a board:**

| stage | status | evidence |
|---|---|---|
| Verilog SoC → `.fs` (blinky) | ✅ proven | `bw-synth` byte-identical `586e54ac…`, 3 tiers |
| Verilog SoC → `.fs` (a *CPU* SoC) | 🔴 not attempted here | no toolchain in this env; heavier than blinky, CI/server work |
| RISC-V GCC cross-compile | ✅ (tool exists, standard) | 🖥️ needs the cross toolchain installed |
| program image into BRAM / QSPI | 🔴 design only | picorv32 ref does SRAM-init-in-Verilog; QSPI-XIP is a follow-on |
| `.fs` → board via openFPGALoader | 🟡 JS/CLI wired, **unflashed** | lite `TANG-NANO.md` §8/TN4: `fpga-tauri-transport.js` + `bw-fpga flash`; **no board on this VM** |
| boot + GCC output over UART | 🖥️ **needs a board** | the whole point; unmeasurable here |

The flashing path is **not new work for this axis** — it is exactly the FPGA
tab's existing native Tauri transport (`fpga_flash_bitstream` → openFPGALoader)
and the `bw-fpga` CLI (`scripts/bw-fpga.mjs flash design.fs`). A soft-CPU `.fs`
flashes the same way a blinky `.fs` does; the board is device-agnostic about
what the bitstream computes.

---

## 4. How this axis relates to its two neighbours

**vs the emulated rv32 core (bw-board `src/riscv32.js`, RV32IMA).** Same ISA,
same GCC/LLVM cross toolchain, **different execution substrate** — an interpreter
in JS vs LUTs on silicon. The emulated core is the browser-native, always-on,
inspectable path (parallels z80.js / i8086 / 6502 in the lab); the FPGA core is
the real-silicon path, for what a *bitstream is actually built for*. A program
compiled once by `riscv32-…-gcc` can run on **both**, which is the pedagogical
payoff: "the same binary, in the simulator and on the chip." They **share only
the ISA and the compilers** — do not couple their codebases; the emulated core
must never become the FPGA core's oracle-by-assumption (that is a different,
asserted-not-generated correspondence, cf. lite `TANG-NANO.md` §5b's
differential-gate discipline).

**vs the gate-level FPGA tab work already in flight.** Build **on** it, do not
duplicate it. Current gate-level lanes in bw-board
(`lane/tangnano-gate-level`, `lane/tangnano-inert-rails`) and the board-part /
3.3 V-DRC work own: the Tang Nano *breadboard part*, the `gate-level`
`MACHINE_SEMANTICS` value, the pin bridge, and gate/RTL-level netlist
simulation. This soft-CPU axis is a **consumer** of all of that plumbing — it
adds *SoC-scale Verilog* to a pipeline (synthesis → `.fs` → flash → drive an
LED on the breadboard) that those lanes and the TN0–TN6 plan already built.
Concretely: **no new P&R tool, no new flashing transport, no new licence
policy** — this axis contributes HDL (a CPU SoC top + `.cst`) and the core
selection above, and rides the existing rails. The one genuinely new surface a
productised rung-2 would need — bundling Renode as the functional tier — is
lite `TANG-NANO.md`'s TN5a and must be **reconciled** with the unclaimed Renode
lanes there, not started in parallel.

---

## 5. Licences — every core and every tool

Verified against upstream LICENSE / GitHub licence API. The lab's regime
(MEMORY *licence-regime*; lite `licence.js`) is **permissive-preferred**:
MIT / ISC / BSD-2/3 / Apache-2.0 / MPL-2.0 / 0BSD / Unlicense / CC0 ship; the
GPL family and CERN-OHL-S are copyleft (local-build-only for HDL, never on the
hosted server; fine as *cross tools* whose output is unencumbered).

### Cores (the HDL that goes on the board)

| core | SPDX | regime | note |
|---|---|---|---|
| **picorv32** | **ISC** | ✅ ship | recommended first rung |
| **VexRiscv** | **MIT** | ✅ ship | rung-2 / Linux stretch; MIT covers the generated Verilog |
| **biriscv** | **Apache-2.0** | ✅ ship | stretch-of-the-stretch |
| **SERV** | **ISC** | ✅ ship | sub-rung curiosity |
| *(SpinalHDL — VexRiscv's generator)* | **MIT** | ✅ ship | a build-host tool; emits the Verilog |

**No licensing flags on the cores.** Unlike the retro-core ecosystem (GPL/ROM
walls, lite §2.2), the RISC-V soft-CPU ladder is uniformly permissive. This is
the single most important licence finding for the axis.

### Toolchain (never on the board; produces the bitstream / the program)

| tool | SPDX | regime | note |
|---|---|---|---|
| **Yosys** | **ISC** | ✅ ship | synthesis (`synth_gowin`) |
| **nextpnr-himbaechel-gowin** | **ISC** | ✅ ship | place & route (the `-gowin` package) |
| **Project Apicula** (`apycula`/`gowin_pack`) | **MIT** | ✅ ship | GW2A bitstream packer (Python) |
| **openFPGALoader** | **Apache-2.0** | ✅ ship | USB flashing; `-b tangnano20k` |
| **riscv-gnu-toolchain (GCC)** | GPL-3.0 **+ runtime exception** | ✅ cross tool | output unencumbered; never on the board |
| **LLVM/Clang** | Apache-2.0-with-LLVM-exception | ✅ cross tool | alternative compiler |
| Gowin EDA (vendor IDE) | proprietary (free Education build) | ⚠️ not used | third-party refs use it; the lab uses the open flow |

**Flags:** none blocking. The only ⚠️ is a positive choice, not a problem — the
lab prefers the open flow over the proprietary Gowin IDE, so the vendor EULA is
simply out of scope. GCC's GPL-3.0 is a *cross-tool* licence (settled precedent,
§1.2), not a contamination of the bitstream or the compiled program.

---

## 6. Status summary & what would move it forward

| item | status |
|---|---|
| open P&R flow (Yosys+nextpnr+Apicula) reaches `.fs` | ✅ proven (blinky, 3 tiers, byte-identical) |
| soft-CPU SoC bitstream | 🔴 designed here, **not built** (no toolchain / board in this env) |
| core ladder + licences | ✅ this document |
| picorv32 board reference | ✅ exists (grughuhler), Gowin-IDE build to port to the open flow |
| flashing transport | 🟡 wired (Tauri + CLI), **unflashed** — needs a board |
| Linux (VexRiscv) | 🟡 community-proven stretch; lab-descoped as a product goal |

**Next physical step (needs the toolchain + a board, not more design):** take the
grughuhler picorv32 SoC, rebuild its Verilog through **the open flow** (`yosys
synth_gowin` → `nextpnr-himbaechel-gowin` for `GW2A-18C` → `gowin_pack`) with a
`.cst` placing UART TX/RX and the 27 MHz clock, flash with `openFPGALoader -b
tangnano20k`, and confirm `riscv32-unknown-elf-gcc` "hello" over UART at 115200.
Everything up to "confirm" is CI/server-shaped; "confirm" needs the board.

---

## Appendix — untested scaffold (NOT a working bitstream)

Illustrative only, to make §3 concrete. **Not synthesised, not simulated, not
flashed** — no toolchain in this environment. Pin numbers are placeholders and
**must be checked against the Tang Nano 20K schematic** before use.

A minimal picorv32 SoC top (CPU + BRAM + UART), sketch:

```verilog
// SPDX-License-Identifier: ISC
// UNTESTED SCAFFOLD — illustrative wiring only. Not synthesised or flashed.
// picorv32.v (ISC, YosysHQ) is expected alongside this file.
module soc_top (
    input  wire clk_27mhz,     // Tang Nano 20K onboard oscillator
    input  wire rst_n,         // active-low reset (a button)
    output wire uart_tx,
    input  wire uart_rx,
    output wire led
);
    // --- reset sync (placeholder) ---
    reg [3:0] rstcnt = 0;
    wire resetn = &rstcnt;
    always @(posedge clk_27mhz) if (!resetn) rstcnt <= rstcnt + 1'b1;

    // --- picorv32 native memory interface ---
    wire        mem_valid, mem_instr, mem_ready;
    wire [31:0] mem_addr, mem_wdata, mem_rdata;
    wire [3:0]  mem_wstrb;

    picorv32 #(
        .ENABLE_MUL(1), .ENABLE_DIV(0), .COMPRESSED_ISA(1),
        .PROGADDR_RESET(32'h0000_0000), .STACKADDR(32'h0000_4000)
    ) cpu (
        .clk(clk_27mhz), .resetn(resetn),
        .mem_valid(mem_valid), .mem_instr(mem_instr), .mem_ready(mem_ready),
        .mem_addr(mem_addr), .mem_wdata(mem_wdata), .mem_wstrb(mem_wstrb),
        .mem_rdata(mem_rdata)
        // irq/pcpi tied off in a real top
    );

    // --- address decode (placeholder map) ---
    //   0x0000_0000 : BRAM (program + data)   0x0200_0000 : UART   0x0300_0000 : LED
    localparam UART = 32'h0200_0000, GPIO = 32'h0300_0000;
    wire sel_ram  = (mem_addr < 32'h0001_0000);
    wire sel_uart = (mem_addr[31:16] == UART[31:16]);
    wire sel_gpio = (mem_addr[31:16] == GPIO[31:16]);

    // --- on-chip program RAM, $readmemh-initialised from GCC output ---
    reg [31:0] ram [0:16383];               // 64 KiB = 16 Ki words
    initial $readmemh("firmware.hex", ram); // riscv32-…-gcc → objcopy → hex
    reg [31:0] ram_rdata; reg ram_ready;
    always @(posedge clk_27mhz) begin
        ram_ready <= mem_valid & sel_ram & ~ram_ready;
        if (mem_valid & sel_ram) begin
            ram_rdata <= ram[mem_addr[15:2]];
            if (mem_wstrb[0]) ram[mem_addr[15:2]][ 7: 0] <= mem_wdata[ 7: 0];
            if (mem_wstrb[1]) ram[mem_addr[15:2]][15: 8] <= mem_wdata[15: 8];
            if (mem_wstrb[2]) ram[mem_addr[15:2]][23:16] <= mem_wdata[23:16];
            if (mem_wstrb[3]) ram[mem_addr[15:2]][31:24] <= mem_wdata[31:24];
        end
    end

    // --- UART + LED: use picorv32's simpleuart (ISC) and a 1-bit reg ---
    //   (instantiation elided; see grughuhler/picorv32_tang_nano_20k for a
    //    working simpleuart wrapper to port to the open flow)
    reg led_r; assign led = led_r;
    always @(posedge clk_27mhz)
        if (mem_valid & sel_gpio & mem_wstrb[0]) led_r <= mem_wdata[0];

    assign mem_ready = ram_ready /* | uart_ready */;
    assign mem_rdata = sel_ram ? ram_rdata : 32'h0 /* : uart_rdata */;
    assign uart_tx   = 1'b1;   // placeholder — real simpleuart drives this
endmodule
```

A Gowin constraints sketch (`soc_top.cst`) — **placeholder pins**:

```
// UNTESTED — verify every pin against the Tang Nano 20K schematic.
// Format per lite lib/bw-fpga/cst.js: IO_LOC "port" pin;  IO_PORT "port" attrs;
IO_LOC  "clk_27mhz" 4;
IO_PORT "clk_27mhz" IO_TYPE=LVCMOS33;
IO_LOC  "rst_n" 88;
IO_PORT "rst_n" IO_TYPE=LVCMOS33 PULL_MODE=UP;
IO_LOC  "led" 15;
IO_PORT "led" IO_TYPE=LVCMOS33 DRIVE=8;
IO_LOC  "uart_tx" 17;
IO_PORT "uart_tx" IO_TYPE=LVCMOS33 DRIVE=8;
IO_LOC  "uart_rx" 18;
IO_PORT "uart_rx" IO_TYPE=LVCMOS33 PULL_MODE=UP;
```

A build-script skeleton (open flow) — **will not run here; no toolchain**:

```sh
#!/usr/bin/env bash
# UNTESTED SKELETON. Requires yosys, nextpnr-himbaechel-gowin, apycula,
# openFPGALoader, and riscv32 GCC — none present in the design environment.
set -euo pipefail
FAMILY=GW2A-18C
DEVICE=GW2AR-LV18QN88C8/I7

# 1. cross-compile the firmware (host GCC), then hex for $readmemh
riscv32-unknown-elf-gcc -march=rv32imc -mabi=ilp32 -nostdlib -Ttext=0 \
    -o firmware.elf start.S main.c
riscv32-unknown-elf-objcopy -O verilog firmware.elf firmware.hex

# 2. synth → P&R → pack  (the same three tools bw-synth runs server-side)
yosys -p "read_verilog picorv32.v soc_top.v; synth_gowin -top soc_top -json soc.json"
nextpnr-himbaechel --device "$DEVICE" --vopt family="$FAMILY" \
    --json soc.json --vopt cst=soc_top.cst --write soc_pnr.json
gowin_pack -d "$FAMILY" -o soc.fs soc_pnr.json

# 3. flash the real board (needs a Tang Nano 20K on USB)
openFPGALoader -b tangnano20k soc.fs
# then: connect a serial terminal at 115200 to see GCC output over UART
```

(The exact `nextpnr-himbaechel` invocation for the `.cst` differs slightly
between the himbaechel-gowin releases; confirm against the installed version —
lite's `bw-synth` is the working reference for the precise flags.)

---

*Sources: brickwright-lite `docs/TANG-NANO.md` (implementation plan, licence
table, board budget, byte-identical bitstream evidence);
[grughuhler/picorv32_tang_nano_20k](https://github.com/grughuhler/picorv32_tang_nano_20k);
[YosysHQ/picorv32](https://github.com/YosysHQ/picorv32) (ISC);
[SpinalHDL/VexRiscv](https://github.com/SpinalHDL/VexRiscv) (MIT);
[ultraembedded/biriscv](https://github.com/ultraembedded/biriscv) (Apache-2.0);
[olofk/serv](https://github.com/olofk/serv) (ISC);
[CNX Software — Tang Nano 20K RISC-V/Linux](https://www.cnx-software.com/2023/05/22/25-sipeed-tang-nano-20k-fpga-board-can-simulate-a-risc-v-core-run-linux-retro-games/).
LUT figures are upstream-cited (Artix-7 / Cyclone / iCE40) or estimates, never
measured on the GW2A-18 in this environment.*
