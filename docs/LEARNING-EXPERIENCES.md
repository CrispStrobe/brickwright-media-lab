# Learning experiences: recommendations and delivery plan

This document turns the software recommendations in [CANDIDATES.md](CANDIDATES.md)
into experiments a learner can perform. The goal is a collection of small,
understandable computers: change a program or a machine setting, observe a
consequence, and explain it. A working prompt is the start of an experience;
the useful outcome is something the learner can make, investigate, or repair.

Status review: **2026-11-27**. Existing capabilities below are grounded in the
linked project documentation and engine evidence. This document does not add
execution evidence. All proposed adapters, lesson interfaces, sample programs,
and fault-injection facilities remain work to implement and verify.

The first recommendations are **6502 animation, Tali Forth, real CP/M plus
Cowgol, CHIP-8, and a littlefs experiment**. Interactive fiction adds a strong
creative route; Linux, xv6, and FreeRTOS supply progressively deeper systems
work. The other experiences reuse substantial parts of the lab and can be
developed alongside those additions.

## 1. A useful experience has an observable result

Each experience should answer five questions in its project README or lesson:

1. **Make:** what can the learner change or create?
2. **Observe:** what output, state, trace, or file makes the consequence visible?
3. **Explain:** what computing concept does that consequence reveal?
4. **Reset:** how does the learner return to a known starting point?
5. **Challenge:** what small variation demonstrates understanding?

Use the same five questions for an animation and an operating-system exercise.
They should describe actual learner actions, not just a list of installed
packages. A first exercise should have one conspicuous result and a bounded
scope; advanced tools can remain available without being prerequisites.

### Evidence stages

Track these stages independently. A later-looking feature does not establish an
earlier stage on a different machine, runner, or installed application.

| Stage | Evidence required | What it does not establish |
|---|---|---|
| **Fetch** | Pinned source/artifact, checksum, license/provenance, reproducible fetch or build instructions. | Successful guest execution. |
| **Boot/load** | The selected artifact reaches its documented entry point on the specified machine. | Working keyboard, files, graphics, or a complete application. |
| **Input** | A real user input reaches the guest and causes a checked response. | Completion of the proposed learning activity. |
| **Activity** | The learner's source/configuration change produces the expected observed consequence. | Data surviving a restart. |
| **Persistence** | Save/close, export or retained storage, a fresh session, and independent readback of the expected result. | Arbitrary crash durability or persistence through every UI. |

Where storage is deliberately ephemeral, say so and make **Reset** discard the
working copy. Where no persistence is relevant, mark that stage **not needed**.
Do not use a single "works" badge to combine all five stages.

Headless engine evidence and browser evidence must be named separately. The
current [x86 user paths](https://github.com/CrispStrobe/bw-board/blob/master/docs/X86-USER-PATHS.md)
describe the supported execution and debugger boundaries. A CLI success or a
visible app pane cannot establish the behavior of an installed supplier build.

## 2. Portfolio and priorities

Priorities rank learning value and the opportunity to reuse existing work;
they are not estimates of implementation time.

| Priority | Experience | Starting position | First meaningful milestone |
|---|---|---|---|
| **First** | [Make a movie on a 6502](#3-make-a-movie-on-a-6502) | Existing player, SD path, framebuffer. | An original editable animation plays, and one change visibly alters its output or data size. |
| **First** | [Tali Forth on the 65C02](#4-tali-forth-on-the-65c02) | New guest adapter on an existing CPU family. | Define a word, run it, and inspect its stack effect. |
| **First** | [A CP/M computer and Cowgol](#5-a-cpm-computer-and-cowgol) | Real CP/M CLI boot exists; Cowgol is a new candidate. | Edit, compile, and execute a small program in the selected guest workflow. |
| **First** | [CHIP-8 and Octo](#6-chip-8-and-octo) | New VM/guest integration, existing creative tools upstream. | Change a sprite and input behavior in an authored program. |
| **First** | [A filesystem that survives interruption](#7-a-filesystem-that-survives-interruption) | littlefs already appears in PicoBB. | Save/load first; then a separately verified interrupted-write experiment. |
| **Creative** | [Interactive fiction](#8-interactive-fiction-with-inform-6-and-punyinform) | New story/toolchain/interpreter bundle. | A learner changes a puzzle and plays the changed story. |
| **Reuse** | [One program in several languages](#9-one-program-in-several-languages) | Existing language bundles and sample programs. | Compare equivalent programs and explain one meaningful implementation difference. |
| **Reuse** | [Repair a computer that will not boot](#10-repair-a-computer-that-will-not-boot) | Existing machines, boot paths, configurable media. | Diagnose and repair one deliberately introduced fault. |
| **Reuse** | [Build a Linux userspace](#11-build-a-linux-userspace) | Existing RV32 Linux lesson and boot snapshot. | Change `/init`, rebuild the initramfs, and see the new startup behavior. |
| **Systems** | [Understand a kernel with xv6](#12-understand-a-kernel-with-xv6) | Existing bounded x86 engine evidence. | Add one small user-visible kernel feature and exercise it. |
| **Reuse** | [The KIM-1 expansion ladder](#13-the-kim-1-expansion-ladder) | Existing KIM projects and CP/M-65 boot proofs. | Reach the same useful program through progressively richer hardware configurations. |
| **Systems** | [Scheduling with FreeRTOS](#14-scheduling-with-freertos) | Existing RV32 platform facilities; new guest qualification. | Alter task behavior and observe a missed or recovered deadline. |
| **Later** | [uLisp on RP2040](#15-ulisp-on-rp2040) | Upstream RP2040 support; new adapter and image. | Evaluate a recursive function through the proven UART/core0 path. |
| **Revisit** | [MikeOS on the 386 tier](#16-reconsider-mikeos-for-the-386-tier) | Earlier 8086 rejection no longer settles 386 suitability. | Boot, accept input, and run a small authored program on free firmware. |

## 3. Make a movie on a 6502

**Why:** a visible animation makes memory layout, bandwidth, compression, and
assembly optimization concrete. The machine is small enough for the learner to
understand where each pixel and byte goes.

**Starting point.** [Bad Apple](../projects/ben-eater-bad-apple/README.md) already
documents a proven player with a 5 MHz 6502, VIA-driven SPI SD reader, and
100 x 64 framebuffer in 128-byte rows. The CA2 handshake clock is a particularly
good example of a hardware feature changing software performance. The separate
[Steamboat Willie](../projects/steamboat-willie/README.md) project says its
decoder/data pairing is not yet proven; its availability is not equivalent
evidence. Use original or explicitly licensed lesson imagery.

**Make and observe.** Begin with a short original animation: a bouncing ball,
rotating shape, or learner-drawn sprite. Supply its editable source and a small
encoder for one explicitly documented player format. Change the sprite or frame
sequence and see the actual emulated screen change. Expose encoded bytes,
framebuffer locations, and measured guest work where supported.

**Runnable milestones:**

1. Fetch/build the pinned player and an original minimal animation; play a known
   first and last frame through the existing machine path.
2. Change one input frame, rebuild, and verify a corresponding framebuffer
   difference. The lesson is now an activity, not just a media demo.
3. Add a comparison such as full-frame versus changed-region encoding, if the
   selected format supports it or a second decoder is implemented.
4. Introduce a controlled bandwidth or work budget and explain the visible
   consequences of exceeding it.

**Reset:** reload the original animation and working machine configuration.
**Challenge:** improve the animation under a fixed encoded-size or guest-work
budget. Report what was measured; emulator wall time is not a hardware benchmark.
Persistence is optional: export the learner's source and generated media rather
than implying that the guest saves them.

## 4. Tali Forth on the 65C02

**Why:** an interactive Forth puts a language, stack machine, and real memory in
the same small space. Defining a new word and immediately using it creates a
short route from language idea to machine effect.

**Candidate.** [Tali Forth 2](https://github.com/SamCoVT/TaliForth2/tree/master-64tass)
has a public-domain grant in its
[COPYING.txt](https://github.com/SamCoVT/TaliForth2/blob/master-64tass/COPYING.txt).
Its [platform notes](https://github.com/SamCoVT/TaliForth2/blob/master-64tass/platform/README.md)
describe the platform adaptation points. This is a **65C02** candidate: do not
silently select an NMOS 6502 configuration or assume that a suitable console and
memory map already match.

**Make and observe.** Start with `: SQUARE DUP * ;`, execute `7 SQUARE .`, and
display or inspect the stack before and after each word. Then define a word that
changes a safe, explicitly mapped output byte. A graphics or LED extension
should follow a proven memory/console adapter, not be a prerequisite for a
working interpreter.

**Runnable milestones:** pin and build the source; provide the platform I/O and
memory configuration; boot to a prompt; feed a definition through the real
console path; check both its result and return to the prompt. Only then add a
memory-output exercise and a bounded stack-error exercise.

**Reset:** cold-start the interpreter or reload a known dictionary image.
**Challenge:** compose a new word from the starter words and explain its stack
effect before executing it. Export source text initially; dictionary or block
storage persistence requires its own save/reload proof.

## 5. A CP/M computer and Cowgol

**Why:** this is a good way to experience a complete programming environment on
a small machine: edit a file, invoke a compiler, run its output, and understand
the services supplied by an operating system.

**Existing work.** [CP/M software](../projects/cpm-software/README.md) documents
both the `.COM` service-layer route and a real CCP+BDOS boot on the CLI through
`scripts/cpm-smoke.mjs`. The browser integration described there still runs one
program over the BDOS shim. Connecting the real boot to the browser is a
valuable milestone on its own. It does not establish CP/M 3 banking or a
Z-System boot.

**New candidate.** [Cowgol](https://github.com/davidgiven/cowgol) is BSD-2-Clause
([COPYING](https://github.com/davidgiven/cowgol/blob/master/COPYING)). Its
[README](https://github.com/davidgiven/cowgol/blob/master/README.md) describes
generic CP/M support. Treat running its compiler on the guest, compiling a
small program there, and rebuilding the entire compiler there as three separate
claims. A complete compiler rebuild on an 8-bit target is not established by the
upstream support description.

**Make and observe.** Provide a tiny command-line utility or text adventure in
Cowgol. The learner changes a branch or output message, compiles it, and runs the
result from the CP/M prompt. A companion low-level exercise follows an output
request through `CALL 5`, contrasting the service shim and the real OS.

**Runnable milestones:**

1. Boot real CP/M, list the disk, accept commands, and run two known programs in
   one session through the selected interface.
2. Package a pinned Cowgol toolchain and its required files for the selected
   CP/M environment. Identify which build steps run on the host.
3. Compile one small guest source, execute its output, modify it, and repeat.
4. Save the source/result, export or retain the disk, and verify it after a fresh
   boot before marking persistence complete.

**Reset:** restore a clean working disk. **Challenge:** add a command-line option
or a new room to the program and explain the resulting executable's dependency
on CP/M services. Full compiler self-hosting is a later research milestone.

## 6. CHIP-8 and Octo

**Why:** a tiny virtual instruction set can make an emulator understandable.
The learner can see how registers, instructions, sprites, timers, and keys
produce a game, then change the implementation rather than treating it as a
black box.

**Candidates.** [Octo](https://github.com/JohnEarnest/Octo/tree/gh-pages) supplies
an MIT-licensed authoring environment and examples; its
[README](https://github.com/JohnEarnest/Octo/blob/gh-pages/Readme.md) is the starting
point. [chip8Archive](https://github.com/JohnEarnest/chip8Archive) is a CC0 corpus
with platform/quirk metadata described in its
[README](https://github.com/JohnEarnest/chip8Archive/blob/master/Readme.md).
Keep Octo's host authoring tools, a CHIP-8 interpreter, and each program's media
as separate artifacts in the provenance record.

**Scope.** Start with one explicitly defined baseline CHIP-8 profile and an
original sample. Select one host CPU configuration whose framebuffer and keys
are already exercised, then implement/port the guest VM and its I/O adapter.
The exact machine is an implementation decision to record before packaging.
Do not promise that every archive entry runs: instruction extensions, draw
behavior, and other quirks differ.

**Make and observe.** Draw a sprite, move it with a key, then change collision
behavior or a delay. Show the corresponding instruction, registers, and display
effect through an available observation mechanism. The strongest extension is
to implement one missing instruction and make a small test program work.

**Runnable milestones:** execute a minimal authored ROM; check a known rendered
frame; check key input; rebuild a source change with Octo and run the changed
ROM. A guest VM executing on another emulated CPU must actually take that path
before it is described as an emulator-inside-an-emulator lesson.

**Reset:** restart the VM with a clean state and fixed ROM. **Challenge:** add a
second sprite or a scoring rule. Program-source and ROM export are sufficient
initial persistence; a game's save-state mechanism is separate work.

## 7. A filesystem that survives interruption

**Why:** saving a file looks simple until power disappears partway through the
operation. A visible storage experiment connects programming to durability,
flash constraints, and the difference between an API call and committed data.

**Starting point.** [littlefs](https://github.com/littlefs-project/littlefs) is
BSD-3-Clause ([LICENSE.md](https://github.com/littlefs-project/littlefs/blob/master/LICENSE.md)).
Its [README](https://github.com/littlefs-project/littlefs/blob/master/README.md)
describes power-loss resilience and the role of sync/close in committing file
updates. [PicoBB](../projects/picobb-rp2040/README.md) already includes littlefs;
the new work is an experiment and its evidence, not introducing this dependency.

**Two steps.** First prove an ordinary PicoBB program-save and program-load cycle
through its actual flash path. Then build a controlled littlefs block-device
exercise that can interrupt a selected operation, remount the resulting bytes,
and report what survived. The second exercise needs its own harness and defined
failure model; resetting the CPU after a completed write is not a simulated
power cut during a write.

**Make and observe.** Change a saved counter or text file. Display the
application's attempted update, the commit point, the backing storage result,
and what a fresh mount reads. Compare explicitly selected pre-commit and
post-commit interruptions without generalizing beyond the exercised cases.

**Runnable milestones:** ordinary save/close/load; fresh-session readback from
the exported or retained flash image; one deterministic interrupted operation;
remount/readback with a stated expected result; then a small collection of
operation boundaries. Preserve the original image so every trial is repeatable.

**Reset:** restore a pristine flash image. **Challenge:** change when the program
syncs or closes its file and predict which value will survive. A PicoBB branch
or prototype does not change the baseline status until it is merged and its
exact proof is linked from the project.

## 8. Interactive fiction with Inform 6 and PunyInform

**Why:** a story gives variables, conditions, state machines, parsing, and
testing an immediate purpose. It is also an appealing creative experience for
learners who do not initially want to write graphics or device drivers.

**Candidates.** [Inform 6](https://github.com/DavidKinder/Inform6) provides the
compiler; its [license](https://github.com/DavidKinder/Inform6/blob/master/licence.txt)
offers Artistic-2.0 terms as a selectable route.
[PunyInform](https://github.com/johanberntsson/PunyInform) is MIT-licensed and
documents a requirement for Inform 6.44 or newer. Pin a compatible pair and keep
the library, compiler, interpreter, and story licenses explicit.

**Runtime gap.** A compiled story still needs a suitable Z-machine interpreter
on the selected guest. Choose and qualify that interpreter before promising a
DOS, CP/M, or other target. The historical
[Frotz GitHub README](https://github.com/DavidGriffith/frotz) points to its current
GitLab home; it should not be treated as a maintained source location by habit.
The first lesson can use a minimal story version supported by the chosen port.

**Make and observe.** Start with two rooms, a key, a locked door, and one useful
verb. Change the condition for opening the door, rebuild the story on the host,
and play it in the guest. Then test a short command transcript that reaches the
ending and another that correctly fails.

**Runnable milestones:** reproducible story build; interpreter boot/load;
interactive command input; changed story behavior; only then save/restore,
validated in a new session. A playable transcript makes a better acceptance
check than the interpreter's banner.

**Reset:** reload the original story or restart it. **Challenge:** add a puzzle
with two possible solutions and explain which state is shared between them.
Ship an original lesson story so media provenance is straightforward.

## 9. One program in several languages

**Why:** the lab already contains unusually different programming models.
Comparing a small, understandable task reveals those differences more clearly
than accumulating disconnected "hello world" demonstrations.

**Existing ingredients.** [ACK](../projects/ack/README.md) supplies proven
host-compiled Pascal/C/Modula-2 output on the 8086. [Small-C](../projects/small-c/README.md)
runs its compiler on the target. [F83](../projects/f83/README.md),
[VolksForth](../projects/volksforth/README.md), [fe](../projects/fe-dos/README.md),
[Tcl](../projects/tcl-dos/README.md), [uBASIC](../projects/ubasic-dos/README.md),
and [Z80 BBC BASIC](../projects/bbc-basic-z80/README.md) offer more contrasts.
[zForth on CP/M](../projects/forth-cpm/README.md) documents an especially useful
semantic difference: integer cells on that target versus floating-point cells
in its DOS sibling.

**Make and observe.** Begin with a sieve, factorial, tiny parser, or text
adventure. Compare recursion with iteration, a stack with named variables, and
compiled output with interpreted source. Then compare BBC BASIC on Z80 with
[PicoBB](../projects/picobb-rp2040/README.md): similar program ideas reach the
user through different firmware, storage, and console arrangements.

**Runnable milestone:** the same bounded task has checked outputs in two
languages; a learner modifies both; the lesson explains one observed difference.
Expand to more languages only after this loop is complete. Mark host compilation
and target compilation separately, and record integer width and runtime
semantics when they affect the result.

**Reset:** restore the starter sources and machine configuration. **Challenge:**
handle a larger input or a boundary case, then explain the change. Executable
size and measured guest instruction counts can be useful; cross-emulator wall
time is not a direct hardware comparison. Persistence can begin as source
export rather than an unproven guest filesystem workflow.

## 10. Repair a computer that will not boot

**Why:** diagnosis teaches a learner to form a hypothesis, gather evidence,
change one thing, and distinguish symptoms from causes.

**Starting point.** [ELKS](../projects/elks/README.md) documents a concrete BIOS
compatibility issue: its floppy probe expects a drive type in `BL` from INT 13h
AH=08h. The wrong expectation causes sectors to be interpreted incorrectly.
[Minix 2](../projects/minix-2.0/README.md) demonstrates different memory and
protected-mode requirements. The [machine design](MACHINE-MANAGER-DESIGN.md)
exposes configuration choices that can become controlled exercises.

**Make and observe.** Supply one deliberately broken, disposable configuration:
wrong disk geometry, too little RAM, a missing startup program, or an unmapped
peripheral. Show the actual symptom and a small amount of relevant evidence.
The learner chooses a hypothesis, changes the configuration, and sees the
original task succeed.

**Runnable milestone:** one known fault has a deterministic failure symptom,
one intended repair, and a positive post-repair activity such as executing a
command. Keep the expected answer and the initial disk/configuration available
for reset. Do not present a random boot failure as a finished puzzle.

**Reset:** restore the original challenge copy. **Challenge:** explain why a
plausible alternative repair does not address the cause. Add further faults as
separate exercises rather than increasing the ambiguity of the first one.
Respect current debugger boundaries: do not depend on 386 disassembly,
step-over/out, symbols, or checkpoint replay where the selected runner refuses
them. Persistent writes are unnecessary for the first configuration puzzle.

## 11. Build a Linux userspace

**Why:** the existing shell can become a lesson about which parts of a system
are the kernel, the initial userspace, the shell, libraries, and device access.

**Existing work.** [Linux on RISC-V](../projects/riscv32-linux/README.md) documents
a working RV32 Linux/BusyBox environment, M/S/U modes, Sv32, CLINT, PLIC, UART,
and a checked post-boot snapshot. Linux boot and those platform facilities are
existing capabilities, despite older planning sections elsewhere in the repo.

**Make and observe.** Inspect the provided root filesystem and `/proc`, then edit
`/init` to print an original startup message or launch a different small program.
Rebuild the initramfs, boot it, and observe exactly where the change occurs.
The next exercise removes or misnames the intended startup program and asks the
learner to distinguish kernel startup from userspace startup.

**Runnable milestones:** demonstrate the existing shell and reset; reproduce
the initramfs build; boot one changed `/init`; verify an expected marker and an
interactive command; package a controlled broken variant with a repair.
Changing the kernel or initial memory invalidates assumptions about a snapshot
made for other bytes: use a compatible snapshot or boot from scratch.

**Reset:** reload the published starter image/snapshot. **Challenge:** produce a
minimal userspace for one task and explain every retained file. The existing
snapshot has specific cold-boot equivalence evidence; it is not a promise of
general reverse debugging. Initramfs changes persist by rebuilding/exporting
the artifact; ordinary guest writes need a separate persistence route.

## 12. Understand a kernel with xv6

**Why:** xv6 can connect system calls, processes, files, and virtual memory to
source that a learner can inspect and change.

**Existing work and boundary.** The engine's
[stock xv6 notes](https://github.com/CrispStrobe/bw-board/blob/master/docs/XV6-STOCK.md)
record the current x86 route and its acceptance. This is an extended x86
configuration with facilities such as PSE/APIC; do not describe that result as
original-80386 compatibility or assume it transfers to an arbitrary 386 media
manifest. The lab's RV32 machine also does not establish compatibility with the
current upstream RV64 xv6 target. Start with the proven engine route and package
its exact requirements.

**Make and observe.** Add a small user program, then a narrowly scoped system
call or process-observation feature. Trace the intended transition from user
program to kernel handler using facilities actually exposed by the selected
runner. A later exercise can alter a scheduling or filesystem rule and explain
the new behavior.

**Runnable milestones:** pin the accepted source/configuration and expose its
boot and input path; run a known user program; change and rebuild one program;
add one small kernel feature with a checked result. Link the relevant engine
acceptance instead of transferring every engine claim to the installed app.

**Reset:** restore the original kernel and disk. **Challenge:** add a new query
that reports useful process information, then explain the user/kernel boundary.
File writes and process observations belong in the activity check; fresh-session
disk readback is still a separate persistence milestone.

## 13. The KIM-1 expansion ladder

**Why:** a learner can watch a monitor-oriented computer gain more memory,
human-friendly I/O, mass storage, and finally an operating system.

**Existing work.** [ACE KIM](../projects/ace-kim/README.md),
[expansion demos](../projects/kim1-expansion-demos/README.md),
[programmable memory](../projects/kim1-memory-card/README.md),
[xKIM](../projects/kim1-xkim/README.md), and
[CP/M-65](../projects/kim1-cpm65/README.md) provide the components. CP/M-65's
project proof boots SPI SD, Corsham DSK, and K-1013 IMD media to a banner/prompt.
This is an experience expansion, not a newly proposed 6502 OS port.

**Make and observe.** Begin with a short monitor program. Add a terminal, expand
the memory map, load the program from a paper tape, and finally boot CP/M-65
from one selected storage route. At each step, identify what the new hardware
or software makes possible. Compare other storage routes only after one route
has a complete lesson.

**Runnable milestone:** a curated sequence of known configurations leads to a
working program and then a useful OS command. The learner changes one memory
allocation or program byte and sees an explained consequence. Use the exact
documented RAM ranges and boot instructions for the selected CP/M-65 route.

**Reset:** restore the chosen memory map and source media. **Challenge:** explain
which operations would still work if the disk adapter were removed. A proven
prompt does not prove save/reload; qualify that separately. CP/M-65 itself and
the utility collection in its upstream releases retain their individual terms.

## 14. Scheduling with FreeRTOS

**Why:** a periodic output, a busy task, and a queue can make concurrency visible
without requiring a large operating system.

**Candidate.** [FreeRTOS-Kernel](https://github.com/FreeRTOS/FreeRTOS-Kernel) is
MIT-licensed. Its [RISC-V port notes](https://github.com/FreeRTOS/FreeRTOS-Kernel/blob/main/portable/GCC/RISC-V/readme.txt)
are the starting point for the port. The existing RV32 Linux platform already
provides relevant timer, trap, and UART facilities, but this is not a verified
FreeRTOS guest. The selected timer/interrupt model, addresses, and BSP must be
made to agree and demonstrated.

**Make and observe.** One task emits periodic markers; another does work; a
third input or interrupt path supplies events through a queue. Change a task
priority, a delay, or a blocking operation and observe which output arrives
late. Initially use timestamped UART records. A visual scheduling timeline can
follow once those records have trustworthy meaning.

**Runnable milestones:** build a pinned bare-metal/RTOS image; prove timer-driven
task switching; accept an input event; show an expected schedule change after
one source edit. Add shared-resource and priority-inversion exercises only after
the simpler scheduler behavior is checked.

**Reset:** restart the image with fixed inputs. **Challenge:** recover the
periodic task's deadline without deleting the other work. Keep emulated guest
time distinct from host rendering speed. A port for the emulator does not
automatically run on an FPGA core: PicoRV32's custom interrupt scheme is a
specific difference documented in [the OS matrix](RISCV-OS-MATRIX.md).
No filesystem persistence is needed for this first lesson.

## 15. uLisp on RP2040

**Why:** a Lisp REPL on a microcontroller can connect recursion and lists to
interactive firmware, and later to physical-looking outputs.

**Candidate.** [uLisp ARM](https://github.com/technoblogy/ulisp-arm) is
MIT-licensed and supports RP2040 upstream. That board support is not yet proof
of the BrickWright console/media path. Select a pinned configuration and adapt
it to the available UART and core0 execution before promising peripheral demos.

**Make and observe.** Evaluate a list-processing or recursive function, change
its stopping condition, and inspect the resulting output. A later extension
can bind a Lisp operation to a verified GPIO/output path. Keep the initial
activity small enough that behavior is understandable without a GUI port.

**Runnable milestone:** build and boot an image; read and evaluate expressions
through the actual guest UART; define a function; call it with two checked
inputs; return to a working prompt. Image packaging, input, and storage are
separate gates.

**Reset:** restart with a clean workspace. **Challenge:** replace a recursive
function with an iterative version and compare their observable behavior.
Image/workspace saving requires a later fresh-session readback check. PicoBB's
proven `SOUND=NONE` configuration illustrates why multicore and peripheral
assumptions should be explicit; it does not qualify uLisp automatically.

## 16. Reconsider MikeOS for the 386 tier

**Why:** a small educational OS with a simple application boundary can offer a
more direct route to understanding OS services than another large desktop.

**Candidate.** [MikeOS](https://mikeos.sourceforge.net/) documents a 386-class
minimum and 1 MiB RAM, with BSD-like licensing. The old rejection in the ledger
is valid for an 8086-only choice; it is not a reason to exclude an experiment on
the existing free-firmware 386 tier. This remains a candidate until the exact
release, bundled components, and boot path have been checked here.

**Make and observe.** Boot, launch an included simple program, then write a tiny
application that calls an OS service and returns cleanly. Explain which tasks
the application delegates to the OS and which hardware assumptions the OS makes.

**Runnable milestone:** pin/fetch a specific image and source; boot on free
firmware; accept keyboard input; run an authored program; check its output and
return to the OS. A 386 CPU label or menu screenshot is insufficient evidence
for the application lesson.

**Reset:** restore the starter image. **Challenge:** add a useful command or
change an application interaction. Saving an edited program to a disk is a
separate persistence milestone. Keep this experiment behind the higher-priority
experiences until its boot cost and teaching value are clearer.

## 17. Packaging the first complete lessons

Use the existing project structure: upstream license/provenance, pinned fetch
or build instructions, a media manifest, and a bounded proof. Add the smallest
lesson assets needed to make the experience repeatable:

- An editable starter and one completed example, with their own source license.
- A short description of what to change and what should happen.
- A checked observation: output text, a framebuffer condition, a file's bytes,
  or a justified trace. A banner alone only proves the corresponding boot step.
- A reset recipe that names what is discarded and what is retained.
- A challenge that extends the same concept without a new setup procedure.
- A stage record identifying the runner, machine/configuration, artifact
  versions, and the exact fetch/boot/input/activity/persistence evidence.

Start implementation with a narrow vertical slice. For example, Tali is useful
once a learner can define and execute one word; the animation lesson is useful
once changing one original frame changes the emulated output. Grow each slice
after the interaction is established, rather than waiting for every optional
feature or every target machine.

Native self-hosting, reverse debugging, broad game compatibility, arbitrary
power-loss simulation, and FPGA deployment are valuable extensions. They are
independent capabilities with their own prerequisites and proof; none is needed
to turn the first set of recommendations into complete learning experiences.
