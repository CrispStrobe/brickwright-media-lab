# Candidates ledger

Every free-software OS / language / firmware evaluated for the lab, with its
license, CPU tier, and honest status. "Runs here" = verified on this project's
emulated machines; "packaged" = a `projects/<name>/` exists. Licenses are
verified from the upstream LICENSE/COPYING unless marked *informal*.

The dividing line across the whole table is the **BIOS**: the **8086/XT** tier
uses our own clean-room free BIOS (`buildBios`), so anything there runs with no
external firmware. The **286/386** tier runs *real* AT firmware — today the
proprietary IBM 5170 ROM (user-supplied), because bw-board's 386 is a *bounded*
executor qualified against exactly that ROM's instruction stream. A free BIOS
exists (see Firmware) but needs CPU-coverage work first.

## Operating systems

| OS | License | Tier | Status |
|---|---|---|---|
| **ELKS** 0.9.2 | GPL-2.0 | 8086 | ✅ **Packaged, interactive Unix** — boots to a shell, steered by keyboard, runs ELKS BASIC (MIT) in-OS |
| **Minix 1.7.5** | BSD-3 | 8086 | ✅ **Packaged** — boots to the boot monitor; kernel panics "RAM disk too big" (>640 K) before a shell. Ships ACK (C/Pascal/Modula-2) |
| **Minix 2.0.4** | BSD-3 | 286 | ⛔ needs the 286/AT ROM (absent here); would reach a shell → ACK |
| **FreeDOS** 1.4 | mixed-free (GPL-2 kernel+FreeCOM) | 8086/386 | already the 386 DOS host; FloppyEdition fetchable. Not re-packaged (mixed aggregate) |
| **MS-DOS** 1.25/2.0/4.0 | **MIT** (covers the committed binaries too) | 8086 | 🔨 buildable-libre — a bootable floppy must be *assembled* (v4.0 cleanest); not a fetch |
| **PDOS/86** | CC0 / public domain | 8086 | 🔨 build the `pdos16.img`; `src/bootsec.asm` + `pload.com` provenance caveats |
| **OpenGEM / FreeGEM** (from DR GEM/ViewMAX-3) | GPL-2.0 | 8086 | 📦 ready graphical DOS desktop (OPENGEM7-RC3) — the mouse+video demo. Not yet packaged |
| **CP/M-86** | *informal* DR grant (not OSI) | 8086 | ⚠️ license judgment call; fetchable disk images |
| **COHERENT** 3.2 | *informal* free-distribution grant | 286 | ⚠️ real Unix; informal license + needs the 286 ROM |
| **os8088** | MIT | 8086 | ⚠️ GUI OS — renders nothing on our text plane (graphics mode); repo bundles unlicensed MS Word source |
| **SvarDOS / EDR-DOS** | mixed (MIT + EDR custom grant + varied) | 8086 | ⚠️ not wholesale standard-libre; FreeDOS is the cleaner DOS |
| **MikeOS** | BSD-like | — | ❌ REJECT — needs a 386 (uses FS/GS), not an 8086 |
| **Minix 3 / KolibriOS / MenuetOS** | BSD/GPL | — | ❌ REJECT — Pentium-class |
| **Fuzix** (8086 target) | mixed-free | 8086 | ❌ the 8086 port is a sketch; does not boot |
| **Snowdrop OS** | *informal* | 8086 | ⚠️ informal "no restrictions" grant |

## Languages (compilers & interpreters)

| Tool | License | Tier | Status |
|---|---|---|---|
| **F83** | public domain | 8086 | ✅ **Packaged, runs here** — Forth-83 |
| **VolksForth** | BSD-2 | 8086 | ✅ **Packaged, runs here** — Forth-83 |
| **Small-C** 2.5 | public domain | 8086 | ✅ **Packaged** — `cc.exe` compiles + emits 8086 asm here (full cc→asm→link needs a persistent-FS DOS) |
| **ELKS BASIC** | MIT | 8086 | ✅ **runs here** (inside booted ELKS) |
| **ALICE Pascal** | Artistic-1.0 (*informal*, README) | 8086 | 📦 native Pascal, `alice.exe` fetchable — but self-locates its `.suf` files via the DOS 3.0+ PSP path, which our minimal DOS service lacks → needs booted DOS |
| **Berkeley Logo** `BL.EXE` | GPL-2.0 | 8086 | 📦 native Logo — but ships as an installer (`blogo.exe`→`INSTALLU.EXE`), so it needs unpacking on a DOS |
| **GW-BASIC** | MIT (source) | 8086 | 🔨 runnable-libre only via the **tkchia** MIT fork built with JWasm/JWlink (serial stubbed); MS upstream is source-only-in-practice |
| **ACK** | BSD-3 | 8086/286 | native C/Pascal/Modula-2/Basic — but only *inside booted Minix* (cross on a modern host). Rides in via the Minix project; not yet reachable (Minix shell) |
| **DeSmet C / DCC (for ELKS)** | GPL-2.0 | 8086 | 🔨 self-hosting C on ELKS; source only, no prebuilt — build + inject |
| **GCC-IA16** | GPL-3.0 + runtime exception | 8086/186/286 | 🖥️ **cross only** — runs on a modern/386 host, emits 16-bit; never on the 8086 itself |
| **SmallerC** | BSD-2 | (386 to run) | 🖥️ cross/386 — emits 8086 but its DOS build needs a 386 |
| **Open Watcom** 1.9/V2 | Sybase OWPL (OSI, not FSF-free) | 386 | 🖥️ C/C++/Fortran on 386 DOS; not native 8086 |
| **DJGPP** (GCC) | GPL | 386 | 🖥️ real GCC on 386 DOS (needs CWSDPMI) |
| **Free Pascal** i8086 | GPL/LGPL | (host) | 🖥️ **cross only** (FPC's own docs); go32v2 `ppc386` self-hosts on 386 |
| **Paterson Listings** (incl. MS BASIC-86 runtime) | MIT | — | 📜 historical source transcriptions; no runnable artifact |

## Games / media (free, for the 386 tier)

| Item | License | Tier | Status |
|---|---|---|---|
| **Freedoom + FastDoom** | BSD-3 (data) + GPL-2 (engine) | 386 | ✅ **Packaged** — fully-libre Doom; runs on the 386 with a system BIOS (see Firmware) |
| Freedoom alone | BSD-3 | 386 | data only — needs a Doom engine (→ 386) |
| Sopwith / zmiy / sudoku86 | GPL-2 / GPL-3 / BSD-2 | 8086 | native-8086 libre games (DOS `.com`/`.exe`) — candidates for the language/DOS path |

## Firmware (BIOS + VGA BIOS)

| Firmware | License | Role |
|---|---|---|
| **buildBios** (ours) | project (free) | ✅ the 8086/XT system BIOS — clean-room, no external ROM |
| **SeaBIOS** | LGPL-2.1/3 | the free 386 system BIOS (QEMU/v86 default). On this box, but **blocked**: bw-board's *bounded* 386 executor throws on SeaBIOS's instructions (LOCK…). "Fully-free 386" = extend the 386 CPU coverage + widen the ROM window + add an fw_cfg/CMOS shim (in progress) |
| **SeaVGABIOS** | LGPL-3 | ✅ the 386 VGA BIOS we already boot |
| **bochs-emu/VGABIOS** | LGPL-2.1 | alternative free VGA BIOS (prebuilt `vgabios-0.9d`) |
| **GLaBIOS** | GPL-3.0 | free 8088/XT BIOS (MartyPC's default); our `buildBios` is the analogue |
| **coreboot / libreboot** | GPL-2 / GPL-2+/3 | real-hardware firmware; SeaBIOS is the emulator-relevant free payload |

*Legend:* ✅ packaged & runs here · 📦 fetchable, packaging/run friction · 🔨 build required · 🖥️ cross/386 host only · 📜 source/historical · ⚠️ license or CPU caveat · ⛔/❌ blocked/rejected.
