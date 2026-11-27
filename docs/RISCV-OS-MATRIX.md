# RISC-V operating systems: emulated board and FPGA targets

Reviewed 2026-11-27 against the implemented [Linux project](../projects/riscv32-linux)
and board evidence. The FPGA core survey below retains its dated upstream
references; those references are leads for a selected configuration, not
BrickWright execution proofs.

## 1. The emulated board already boots Linux

bw-board's `RiscV32Machine` is **RV32IMAC + Zicsr/Zifencei**, with M/S/U modes,
**Sv32**, **CLINT**, **PLIC**, and an **NS16550A UART**. The packaged Linux
configuration has 64 MiB RAM and an in-emulator SBI implementation. Linux +
BusyBox boots to a shell, accepts UART input, and has a verified shell snapshot.

The earlier plan to implement CLINT, PLIC, privileged traps, and Sv32 as
prerequisites is obsolete. The current work is to qualify additional software
and build learning activities on the existing board.

| Guest / activity | Current evidence | Remaining work |
|---|---|---|
| [Linux + BusyBox](../projects/riscv32-linux) | Pinned kernel/initramfs, shell input, cold boot, verified shell snapshot | Guided `/init` changes, rebuilt initramfs, controlled startup failures |
| Bare-metal | Existing RISC-V program/toolchain routes in bw-board | Each lesson still needs its own input/output and device proof |
| [FreeRTOS](https://github.com/FreeRTOS/FreeRTOS-Kernel) | Upstream GCC port includes RV32 CLINT adaptation; the lab board has the underlying timer/trap facilities | Pin kernel and BSP, verify addresses/interrupts/context switches, package a task-timeline lesson |
| [Zephyr](https://github.com/zephyrproject-rtos/zephyr), [NuttX](https://github.com/apache/nuttx), [RT-Thread](https://github.com/RT-Thread/rt-thread) | Upstream RISC-V support is a starting point | A specific compatible board port, build, media bundle, and bounded boot/interaction proof |
| [littlefs](https://github.com/littlefs-project/littlefs) fault experiment | Software candidate; already used separately by PicoBB | Modeled flash callbacks, deterministic power cuts, restart with retained storage, recovery observations |
| [Inform/PunyInform](https://github.com/johanberntsson/PunyInform) story interpreter | Proposed Linux userspace bundle | Cross-build a selected text interpreter, add an original story and input/output proof |
| [xv6-riscv](https://github.com/mit-pdos/xv6-riscv/blob/riscv/Makefile) | Stock upstream is **RV64**, not this RV32 machine | A separately reviewed RV32 port or a new RV64 substrate; neither is implied here |

The existing [xv6 x86 result](https://github.com/CrispStrobe/bw-board/blob/master/docs/XV6-STOCK.md)
is a different, already demonstrated route for a kernel lesson. Its explicit
PSE/APIC compatibility extensions must remain part of that configuration.

See [LEARNING-EXPERIENCES.md](LEARNING-EXPERIENCES.md) for the activity
milestones. A correct ISA is only one prerequisite: peripheral addresses,
interrupt wiring, boot convention, ABI, storage, and RAM must match the guest.

## 2. The FPGA is a separate substrate

[TANG-NANO-RISCV.md](TANG-NANO-RISCV.md) owns the Tang Nano 20K core-selection,
toolchain, and hardware plan. A CPU synthesized into an FPGA shares an ISA and
compiler family with the emulator; it does not automatically share its machine
model, firmware, device tree, or accepted images.

The following is an **upstream survey**, originally recorded 2026-09-22. Check
the selected upstream revision and generated hardware configuration before
using any row as a build plan. None of these rows proves a new lab bitstream
or a real-board OS boot.

| Core / SoC | Upstream references | OS direction and integration gate |
|---|---|---|
| **NEORV32** (BSD-3-Clause) | [Core/datasheet](https://github.com/stnolting/neorv32), [author FreeRTOS port](https://github.com/stnolting/neorv32-freertos), [Zephyr board](https://docs.zephyrproject.org/latest/boards/others/neorv32/doc/index.html) | Embedded/RTOS candidate with standard trap/timer machinery. Any nommu-Linux claim is separate from an Sv32 Linux configuration. Select and qualify a specific SoC build. |
| **VexRiscv** (MIT), commonly integrated through **LiteX** | [Core](https://github.com/SpinalHDL/VexRiscv), [LiteX](https://github.com/enjoy-digital/litex), [Linux integration](https://github.com/litex-hub/linux-on-litex-vexriscv), [NuttX LiteX](https://nuttx.apache.org/docs/latest/platforms/risc-v/litex/index.html), [Zephyr LiteX board](https://docs.zephyrproject.org/latest/boards/enjoydigital/litex_vexriscv/doc/index.html) | MMU-enabled configurations support the Linux direction. Generated peripheral addresses, IRQs, memory controller, and board resources are part of the target. A Zephyr board is not evidence of a FreeRTOS port. |
| **PicoRV32** (ISC) | [Core and custom IRQ instructions](https://github.com/YosysHQ/picorv32) | Small bare-metal bring-up candidate. Its optional q-register IRQ mechanism is not the standard privileged ISA/CLINT model. Community RTOS ports need their own SoC adaptation; the minimal core is not a drop-in MMU-Linux board. |
| **SparrowRV** (repository-stated MIT) | [xiaowuzxc/SparrowRV](https://github.com/xiaowuzxc/SparrowRV) | RV32IM + CSR/fence support and bare-metal BSP; no RTOS/Linux acceptance claimed here. This is not liangkangnan's tinyriscv project. |
| **SERV** (ISC) | [Core](https://github.com/olofk/serv) | Bit-serial bare-metal exploration; no packaged lab RTOS/Linux target. |

The survey previously mixed "upstream verified" with "runs in this lab".
Those are now separate. Also avoid a general "no MMU means no possible Linux"
rule: nommu Linux is a distinct configuration, and does not establish
compatibility with the packaged Sv32 Linux guest.

## 3. Match each guest to a concrete board

| Software class | What must be specified and proved |
|---|---|
| Bare-metal program | Entry/load addresses, instruction extensions, RAM/ROM layout, console or output device |
| RTOS | All of the above plus a tick source, trap/context-switch behavior, selected interrupt routing, stack and heap limits |
| MMU Linux | Privileged ISA and translation model, boot/SBI contract, device tree, timers/interrupts, console, sufficient RAM, initramfs/storage |
| nommu Linux | Its own kernel configuration, process/binary model, memory and device requirements; not a substitute label for the MMU build |
| Cross-machine lesson | Separate host build and guest runtime identities; prove each board independently, even when source or bytecode is shared |

For the emulated RV32 Linux machine, many of those facilities are already
implemented and tested. For a new RTOS, the remaining proof is the selected
kernel/BSP using them correctly. For an FPGA core, the generated SoC must
supply them physically; emulation success alone is insufficient.

## 4. Recommended next work

1. Extend the existing Linux lesson with an inspectable initramfs and startup
   exercise, keeping the working snapshot as the quick starting point.
2. Build a single-core FreeRTOS lesson with periodic work, input, blocking,
   and a visible task timeline. Qualify the BSP before adding priority
   inversion or additional peripherals.
3. Add a modeled littlefs power-loss experiment with a specified storage
   contract and deterministic failure points.
4. Keep the Tang Nano first-light milestone focused on a small program,
   console, and observable I/O. A later RTOS or Linux milestone requires
   its own resource and hardware evidence.

The emulated Linux lesson is implemented. Linux on an 8 MiB Tang Nano board is
a separate constrained hardware project; see the sourced discussion and
product scope in [TANG-NANO-RISCV.md](TANG-NANO-RISCV.md).

## 5. Sources and status maintenance

- [Packaged RV32 Linux, exact media, sources, and snapshot proof](../projects/riscv32-linux/README.md).
- [FreeRTOS RISC-V port adaptation](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/portable/GCC/RISC-V/readme.txt).
- [FreeRTOS MIT license](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/LICENSE.md).
- [Stock xv6-riscv build ISA](https://github.com/mit-pdos/xv6-riscv/blob/riscv/Makefile).
- [Existing x86 xv6 board result and extension requirements](https://github.com/CrispStrobe/bw-board/blob/master/docs/XV6-STOCK.md).
- [Original PicoRV32 community RT-Thread lead](https://github.com/wuhanstudio/picorv32_tang):
  a separate community SoC, not an accepted lab port.
- [Tang Nano hardware plan and original core survey](TANG-NANO-RISCV.md).

Update an integration status only with the exact source/firmware/media
identities and a reproducible observation. Preserve earlier evidence as
history; do not leave an obsolete "missing hardware" statement as current
roadmap text after that hardware is implemented.
