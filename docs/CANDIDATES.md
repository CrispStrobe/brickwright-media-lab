# Candidates ledger

Every free-software OS / language / firmware evaluated for the lab, with its
license, CPU tier, and honest status. "Runs here" = verified on this project's
emulated machines; "packaged" = a `projects/<name>/` exists. Licenses are
verified from the upstream LICENSE/COPYING unless marked *informal*.

The dividing line across the whole table is the **BIOS**: the **8086/XT** tier
uses our own clean-room free BIOS (`buildBios`), so anything there runs with no
external firmware. The **286/386** tier can now also run on **fully-free
firmware**: the experimental `i80386` AT machine boots the **LGPL Bochs legacy
BIOS + LGPL VGABios** (vendored at bw-board `roms/free-at-bios/`) with **no
proprietary ROM** — that is the harness `scripts/run-i80386-free-bios-freedos.mjs`
uses, and the `minix-2.0` and `ms-dos` projects below run on it. (The proprietary
IBM 5170 ROM remains an *optional* maintainer-only fidelity oracle; SeaBIOS is
still blocked — see Firmware.)

## Operating systems

| OS | License | Tier | Status |
|---|---|---|---|
| **ELKS** 0.9.2 | GPL-2.0 | 8086 | ✅ **Packaged, interactive Unix** — boots to a shell, steered by keyboard, runs ELKS BASIC (MIT) in-OS |
| **Minix 1.7.5** | BSD-3 | 8086 | ✅ **Packaged** — boots to the boot monitor; kernel panics "RAM disk too big" (>640 K) before a shell. Ships ACK (C/Pascal/Modula-2) |
| **Minix 2.0.4** | BSD-3 | 286/386 | ✅ **Packaged, interactive Unix** — on the **fully-free 386** (LGPL Bochs BIOS, no proprietary ROM) it boots in 16-bit protected mode to a multiuser `login:`, logs in `root`, runs a shell. The 286/AT-ROM blocker is lifted by the free-386 |
| **FreeDOS** 1.4 | mixed-free (GPL-2 kernel+FreeCOM) | 8086/386 | already the 386 DOS host; FloppyEdition fetchable. Not re-packaged (mixed aggregate) |
| **MS-DOS** 1.25/2.0/4.0 | **MIT** (covers the committed binaries too) | 8086/386 | 📦 **Packaged (boots to banner)** — the committed `v4.0-ozzie` Multitasking MS-DOS boot floppy is genuinely-MIT and boots to the real "MS-DOS version 4.00 … Microsoft Corp." banner on the free-386, but the beta core halts at Internal Error 4560 before a prompt. A clean prompt needs mainstream 4.00 **built** from `v4.0/src` (`v2.0/bin` has no `IO.SYS`, so 2.0 must be built too) |
| **PDOS/86** | CC0 / public domain | 8086 | 🔨 build the `pdos16.img`; `src/bootsec.asm` + `pload.com` provenance caveats |
| **OpenGEM / FreeGEM** (from DR GEM/ViewMAX-3) | GPL-2.0-or-later | 8086/386 | ✅ **Packaged** — OpenGEM 7 RC3 graphical DOS desktop, fetchable + GPL-licensed. Runs on a DOS host with a VGA framebuffer + mouse; not verifiable on the text-scrape harness (graphics plane), so run-proof is pinned to a framebuffer/mouse surface |
| **CP/M-80 2.2** | permissive (DRI "Unofficial CP/M Web Site" grant, reaffirmed 2022) | Z80/8080 | ✅ **Runs its `.COM` programs now** — not a booted image but the **BDOS emulated behind the `CALL 5` trap** (`cpm-z80.js`, the Z80 twin of the 8086 DOS bench): console + full sequential/random FCB file group against a Map-disk, no CP/M image and no pin bump. Proven by a real SDCC-compiled `.COM`. A **booted** 2.2 (CBIOS + disk → `A>`) is the un-built Z80 analogue of the ELKS floppy-boot path |
| **CP/M 3 / CP/M Plus** | permissive (same DRI grant) | Z80 (banked) | 🟡 **2.2-subset only** — programs that stay in the 2.2 BDOS run on the shim; CP/M-3-only calls (date/time, parse-filename, banking) are unimplemented. A real CP/M 3 needs banked RAM + its BDOS/BIOS = the Z80 boot path above |
| **Z-System (ZCPR3 + ZSDOS/ZDDOS)** | ZSDOS freeware-with-registration; ZCPR3 free | Z80 | 🟡 **not via shim** — these *are* the DOS; reachable only by **booting** them (Z80 boot path). Check ZSDOS registration terms before packaging |
| **CP/Mish** (David Given) | permissive (MIT-ish) | Z80 | ✅ **programs run now** on the BDOS shim; its ack/cowgol build also feeds the compile-on-CP/M route. Best libre CP/M-2.2 corpus candidate |
| **CP/M-65** (David Given) | 2-clause-BSD | **6502** | 🔴 **not wired** — a modern from-scratch CP/M-*like* for 6502 (different ABI, a bootable image). Our 6502 core could host it as a real-boot project; no 6502 BDOS shim exists |
| **CP/M-86** | *informal* DR grant (not OSI) | 8086 | ⚠️ license judgment call; fetchable disk images. No CP/M-86 BDOS shim yet (would be an INT E0h twin of the MS-DOS bench) |
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
| **ALICE Pascal** | Artistic-1.0 (Perl Artistic, per README) | 8086/386 | ✅ **Packaged, runs here** — on **booted FreeDOS** (the free-386) `alice` reaches its main menu / editor; it self-locates its `.suf` overlays via the DOS 3.0+ PSP path, which the minimal `run-dos` service lacks but a real DOS provides |
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
| **Bochs legacy BIOS** | LGPL-2.1 | ✅ the **fully-free 386 system BIOS** — vendored `roms/free-at-bios/BIOS-bochs-legacy` (Bochs 2.7). Boots FreeDOS, Minix 2.0.4 and MIT MS-DOS on the `i80386` AT with no proprietary ROM |
| **SeaBIOS** | LGPL-2.1/3 | the free 386 system BIOS (QEMU/v86 default). On this box, but **blocked**: bw-board's *bounded* 386 executor throws on SeaBIOS's instructions (LOCK…). "Fully-free 386" = extend the 386 CPU coverage + widen the ROM window + add an fw_cfg/CMOS shim (in progress) |
| **SeaVGABIOS** | LGPL-3 | ✅ the 386 VGA BIOS we already boot |
| **bochs-emu/VGABIOS** | LGPL-2.1 | alternative free VGA BIOS (prebuilt `vgabios-0.9d`) |
| **GLaBIOS** | GPL-3.0 | free 8088/XT BIOS (MartyPC's default); our `buildBios` is the analogue |
| **coreboot / libreboot** | GPL-2 / GPL-2+/3 | real-hardware firmware; SeaBIOS is the emulator-relevant free payload |

*Legend:* ✅ packaged & runs here · 📦 fetchable, packaging/run friction · 🔨 build required · 🖥️ cross/386 host only · 📜 source/historical · ⚠️ license or CPU caveat · ⛔/❌ blocked/rejected.
