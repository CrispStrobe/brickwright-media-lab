# RISC-V soft core × operating system — the OS-layer matrix

The **operating-system axis** across the lab's two RISC-V substrates. It does not
duplicate either of them; it maps *what OS runs on which core* and, crucially,
*what hardware model each OS demands* — the shopping list for making an OS boot
on either substrate.

- **Emulated** — bw-board `src/riscv32.js` (RV32IMA, **no-MMU**, a Linux-style
  `ecall` write/exit ABI, **no CLINT / PLIC / MMU yet**). The browser-native,
  always-on interpreter. See [`MATRIX.md`](MATRIX.md) §"Emulated RISC-V".
- **Hardware** — a soft core synthesised into the Gowin FPGA on a **Tang Nano
  20K**. Owned by [`TANG-NANO-RISCV.md`](TANG-NANO-RISCV.md) (core-selection
  ladder, licences, open Gowin flow). That doc recommends **picorv32 first**;
  this one asks *which OS each core can then host*. Where they overlap,
  `TANG-NANO-RISCV.md` is canonical and is cited, not restated.

> **Companion note:** `TANG-NANO-RISCV.md` currently lives in PR #14 and is not
> yet on `main`; the cross-links above resolve once that lands. This doc is its
> OS-layer sibling and should be read alongside it.

The two substrates **share only the ISA and the GCC/LLVM cross toolchain**. An OS
that boots in emulation does *not* imply it boots on the FPGA core, and vice
versa — the hardware model differs (`src/riscv32.js` has no CLINT today;
picorv32 has a *non-standard* IRQ scheme). This doc keeps them separate.

Legend: ✅ **verified** against the cited upstream source (dated 2026-09-22) ·
🟡 real but with an honest caveat · 🔴 not supported / not built · **unverified**
= could not confirm from an authoritative upstream source, do not rely on it.
Every licence is checked against the upstream `LICENSE` / GitHub licence API.

---

## 1. The core × OS table

Rows are the five cores in scope; columns are the OS targets. Each cell is a
status **+ a citation**. "Upstream" means the port lives in the OS project's own
tree (or a core-author-maintained repo); "community" means a third-party port,
useful but not canonical.

| core (licence) | bare-metal | FreeRTOS | Zephyr | NuttX | RT-Thread | Linux |
|---|---|---|---|---|---|---|
| **NEORV32** — BSD-3-Clause ✅ [[1]](#s1) | ✅ | ✅ **upstream port** (author repo `stnolting/neorv32-freertos`) [[2]](#s2) | ✅ **upstream board `neorv32`** (`boards/others/neorv32`) [[3]](#s3) | **unverified** (no upstream NuttX board found) | 🟡 **community WIP only**, not upstream [[7]](#s7) | 🟡 **no-MMU (nommu) Linux** cited by the core README; no Sv32 MMU [[1]](#s1) |
| **VexRiscv** — MIT ✅ [[4]](#s4) (via **LiteX**, BSD-2 [[5]](#s5)) | ✅ | ✅ (Zephyr `litex_vexriscv` covers it) [[6]](#s6) | ✅ **upstream board `litex_vexriscv`** (Arty A7-35T / SDI-MIPI) [[6]](#s6) | ✅ **upstream** `vexriscv` + `vexriscv_smp` [[8]](#s8) | 🟡 community (LiteX CSR-based) [[7]](#s7) | ✅ **canonical path** `litex-hub/linux-on-litex-vexriscv` (BSD-2) — Sv32 MMU variant [[9]](#s9) |
| **picorv32** — ISC ✅ [[10]](#s10) | ✅ | 🟡 **community** ports only; require SoC IRQ mods (custom q-reg scheme, not CLINT) [[11]](#s11) | 🔴 no upstream board | 🔴 | 🟡 **community** SoC (`wuhanstudio/picorv32_tang`) [[7]](#s7) | 🔴 **no MMU → no Linux** [[10]](#s10) |
| **SparrowRV** — MIT ✅ [[12]](#s12) | ✅ (BSP, C) [[12]](#s12) | 🔴 not claimed | 🔴 | 🔴 | 🔴 | 🔴 |
| **SERV** — ISC (bit-serial; see `TANG-NANO-RISCV.md`) | ✅ | 🔴 (too small in practice) | 🔴 | 🔴 | 🔴 | 🔴 |

**Reading the table honestly:**

- **NEORV32 has by far the best *upstream* OS story** of the permissive cores:
  an official Zephyr board **and** an author-maintained FreeRTOS port, both
  linked from the core's own datasheet [[1]](#s1). It is **no-MMU embedded**; the
  "Linux" it cites is **nommu-Linux**, not an Sv32 MMU boot.
- **VexRiscv only reaches an OS *through LiteX***. The Zephyr board is
  `litex_vexriscv`, the Linux path is `linux-on-litex-vexriscv`, and NuttX's
  LiteX port targets it — all three are **the LiteX SoC**, not bare VexRiscv HDL.
- **picorv32's RTOS ports are all community and all involve modifying the SoC**
  because its IRQ mechanism is non-standard (§2). There is **no** upstream
  Zephyr/NuttX/FreeRTOS board, and **no Linux** (no MMU).
- **SparrowRV is bare-metal only** — see the correction in §5.

---

## 2. Per-core hardware facts that drive OS support

| core | MMU | IRQ / timer model | Linux-capable? |
|---|---|---|---|
| **NEORV32** | no MMU (embedded) | RISC-V-compliant `mtime`/CLINT-style machine timer + CSR trap machinery; standard privileged ISA [[1]](#s1) | only **nommu**-Linux, cited by README [[1]](#s1) |
| **VexRiscv (LiteX)** | **Sv32 MMU** in the Linux variant [[9]](#s9) | LiteX-generated CLINT-equivalent + interrupt CSRs; addresses/IRQs come from the LiteX `csr.json` [[8]](#s8) | **yes** — the canonical rv32 soft-core Linux [[9]](#s9) |
| **picorv32** | **no MMU** [[10]](#s10) | **Non-standard**: custom instructions `getq/setq/retirq/maskirq/waitirq/timer` and four q-registers `q0–q3`; **explicitly *not* the RISC-V Privileged ISA / CLINT** [[10]](#s10)[[11]](#s11) | **no** |
| **SparrowRV** | no MMU | RV32IM**Zicsr** + Zifencei; CSR trap support, BSP-level [[12]](#s12) | no |
| **SERV** | no MMU | minimal (bit-serial) | no |

The picorv32 row is the load-bearing one for the emulated core: **do not model
picorv32's IRQ scheme in `src/riscv32.js`.** The emulated core should grow the
*standard* CLINT/PLIC (matching NEORV32 / VexRiscv), because that is what the
upstream RTOS/Linux ports assume. picorv32's q-reg scheme is a hardware-only
curiosity that its (community) RTOS ports patch around.

---

## 3. Minimum hardware model per OS

This is the actionable table: **what a core (or the emulator) must expose for
each OS to boot.** "CLINT" = machine-timer `mtime`/`mtimecmp` + software IRQ;
"PLIC" = external-interrupt controller; "Sv32" = the RV32 two-level MMU.

| OS | MMU (Sv32) | timer (CLINT) | ext-IRQ (PLIC) | UART | RAM (practical rv32) | notes |
|---|---|---|---|---|---|---|
| **bare-metal** | — | — | — | TX only | KBs | the emulated core already has this (ecall write/exit) |
| **FreeRTOS** | — | ✅ (tick source) | ✅ or core's IRQ scheme | ✅ (RX IRQ) | tens of KB | needs *an* IRQ + timer; picorv32 uses its own, not CLINT |
| **Zephyr** | — | ✅ | ✅ | ✅ | tens–hundreds of KB | driver model expects standard CLINT/PLIC on these boards |
| **NuttX** | — (flat) | ✅ | ✅ | ✅ | hundreds of KB | LiteX port keys off `litex_memorymap.h` + `irq.h` [[8]](#s8) |
| **RT-Thread** | — | ✅ | ✅ | ✅ | hundreds of KB | broad RISC-V support generally, but no upstream BSP for these cores |
| **nommu-Linux** | **no** (uClinux-style) | ✅ | ✅ | ✅ | several MB | NEORV32's cited Linux; heavier than any RTOS [[1]](#s1) |
| **Linux (MMU)** | **✅ Sv32** | ✅ | ✅ | ✅ (SBI/16550 console) | **≥ ~16–32 MB realistic** | VexRiscv-Linux; the full stack — MMU + PLIC + CLINT together [[9]](#s9) |

Rule of thumb the brief states and this table confirms: **Linux needs Sv32 MMU +
PLIC + CLINT**; **RTOSes need CLINT + UART (+ the core's IRQ scheme)**;
**bare-metal needs nothing beyond the ecall/UART** the emulated core already has.

---

## 4. Two substrates — what each OS costs on each

For every OS, the left column is *what to add to the **emulated** `src/riscv32.js`*
to run it in the browser; the right is *which **hardware** core on the Tang Nano*.

| OS | emulated: add to `src/riscv32.js` | hardware: core on Tang Nano |
|---|---|---|
| **bare-metal** | nothing — already runs (ecall write/exit) | **picorv32** (rung 1, per `TANG-NANO-RISCV.md`) |
| **FreeRTOS / Zephyr / NuttX / RT-Thread** | add **standard CLINT** (`mtime`/`mtimecmp`), full **CSR trap** path (`mstatus`/`mie`/`mtvec`/`mepc`/`mcause`), a **PLIC**, and a **16550-style UART** with an RX interrupt. Model the *standard* privileged ISA — **not** picorv32's q-reg scheme. | **NEORV32** (best upstream RTOS story, BSD-3, standard CLINT) or **VexRiscv/LiteX**; picorv32 only via its community, IRQ-patched ports |
| **nommu-Linux** | above **+** the nommu-Linux boot flow (still no MMU, but a much larger RAM image + console); heavy | **NEORV32** (cited nommu-Linux) — unproven here |
| **Linux (MMU)** | above **+ Sv32 page-table walk** (the big lift), SBI/console, and several MB of guest RAM | **VexRiscv-Linux under LiteX** — **demonstrated but tight** on the 8 MB SDRAM (see `TANG-NANO-RISCV.md` §"Rung 2"): a slimmed buildroot stunt, not a comfortable target |

**The emulator's cheapest high-value step** is the RTOS row: a **standard
CLINT + PLIC + UART-with-IRQ** unlocks FreeRTOS, Zephyr and NuttX at once, with
**no MMU** — a far smaller lift than Linux, and it matches what NEORV32 and
VexRiscv boards already assume. Linux-in-the-browser (Sv32) is the stretch and
should be scoped as such.

**Hardware, honest bounds:** Linux on the Tang Nano 20K is **demonstrated but
tight** — VexRiscv-Linux under LiteX on the in-package 8 MB SDRAM, slimmed and
slow (`TANG-NANO-RISCV.md` §"Rung 2"; the lite `TANG-NANO.md` even lists it a
non-goal). For RTOS-on-silicon, **NEORV32** is the strongest permissive candidate
by upstream support, and portable to the Gowin part — a useful complement to that
doc's picorv32-first ladder.

---

## 5. Corrections to the working synthesis (honest deltas)

- **SparrowRV — the biggest correction.** The project is
  **`xiaowuzxc/SparrowRV`**, *not* by `liangkangnan` (that author's core is
  `tinyriscv`). Its ISA is **RV32IM_Zicsr (+Zifencei)**, **not RV32IMC** as
  guessed. Licence **MIT** (per repo). OS support: **bare-metal only** — a C BSP
  and an educational sim/dev environment; **no RTOS, no Linux** is claimed
  [[12]](#s12). Do **not** list it as an RTOS host.
- **RT-Thread — no upstream BSP for any of these five cores.** RT-Thread's
  RISC-V breadth is real *in general* (GD32V, K210, etc.), but for the cores in
  scope only **community** ports exist (a picorv32 RT-Thread SoC
  `wuhanstudio/picorv32_tang`; NEORV32 RT-Thread was a community WIP) [[7]](#s7).
  Treat RT-Thread as **community, not canonical** everywhere here.
- **Everything else in the synthesis held up:** NEORV32's official Zephyr board
  and FreeRTOS port ✅ (note the FreeRTOS port is the author's *separate* repo,
  not in the neorv32 tree); VexRiscv + LiteX + Linux via `linux-on-litex-vexriscv`
  ✅; NuttX supports **both** `vexriscv` and `vexriscv_smp` with **Arty A7** as
  the reference board and other LiteX boards needing peripheral-address + IRQ
  config ✅; picorv32 is no-MMU with a custom, non-standard IRQ scheme ✅.
- **NuttX-on-NEORV32:** could **not** confirm an upstream NuttX board for
  NEORV32 — marked **unverified**, not "no".

---

## 6. Sources

Verified 2026-09-22 against upstream repos/docs and the GitHub licence API.

- <a id="s1"></a>[1] NEORV32 datasheet & README — BSD-3-Clause; OS list (FreeRTOS
  port, upstream Zephyr, MicroPython); nommu-Linux; no MMU:
  https://stnolting.github.io/neorv32/ and https://github.com/stnolting/neorv32
- <a id="s2"></a>[2] NEORV32 FreeRTOS port (author-maintained):
  https://github.com/stnolting/neorv32-freertos
- <a id="s3"></a>[3] Zephyr upstream NEORV32 board (`boards/others/neorv32`):
  https://docs.zephyrproject.org/latest/boards/others/neorv32/doc/index.html
- <a id="s4"></a>[4] VexRiscv — MIT: https://github.com/SpinalHDL/VexRiscv
- <a id="s5"></a>[5] LiteX — the SoC builder (BSD-2 on the Linux/Zephyr sub-repos):
  https://github.com/enjoy-digital/litex
- <a id="s6"></a>[6] Zephyr upstream `litex_vexriscv` board (Arty A7-35T /
  SDI-MIPI):
  https://docs.zephyrproject.org/latest/boards/enjoydigital/litex_vexriscv/doc/index.html
- <a id="s7"></a>[7] RT-Thread on these cores — community only (picorv32 SoC):
  https://github.com/wuhanstudio/picorv32_tang ; RT-Thread project:
  https://github.com/RT-Thread/rt-thread (Apache-2.0)
- <a id="s8"></a>[8] NuttX LiteX platform — `vexriscv` + `vexriscv_smp`, Arty A7
  reference, `litex_memorymap.h`/`irq.h` for other boards:
  https://nuttx.apache.org/docs/latest/platforms/risc-v/litex/index.html
- <a id="s9"></a>[9] Canonical rv32 Linux path — `linux-on-litex-vexriscv`
  (BSD-2, Sv32 MMU VexRiscv): https://github.com/litex-hub/linux-on-litex-vexriscv
- <a id="s10"></a>[10] picorv32 — ISC; no MMU; custom IRQ scheme:
  https://github.com/YosysHQ/picorv32
- <a id="s11"></a>[11] picorv32 IRQ / q-registers (`getq/setq/retirq/maskirq/
  waitirq/timer`, not the Privileged ISA) and community FreeRTOS caveats — same
  README, §"Custom Instructions for IRQ Handling": https://github.com/YosysHQ/picorv32
- <a id="s12"></a>[12] SparrowRV — `xiaowuzxc/SparrowRV`, RV32IM_Zicsr, MIT,
  bare-metal C BSP (educational; no RTOS/Linux):
  https://github.com/xiaowuzxc/SparrowRV

*Licences confirmed via `gh api repos/<repo>/license`: NEORV32 BSD-3-Clause,
VexRiscv MIT, linux-on-litex-vexriscv BSD-2-Clause, picorv32 ISC, NuttX
Apache-2.0, RT-Thread Apache-2.0. SparrowRV MIT per repo (LICENSE not surfaced
via the API — mark as repo-stated). Anything marked **unverified** above was not
confirmable from an authoritative upstream source in this pass.*
