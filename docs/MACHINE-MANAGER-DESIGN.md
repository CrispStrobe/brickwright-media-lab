# Machine Manager — design

A machine is a **config**, not a hardcoded flavor. This doc specs a
config-driven machine model, the surfaces to manage it at scale (hundreds),
and how the code-tab languages, the media-lab bundles, and the wired/functional
engines all bind to it. The goal: tame the `CPU × BIOS × OS × disks × mode`
matrix by *composing* machines, never *enumerating* them.

## 1. Why

Today the code tab offers a few pre-baked machine flavors (`8086`, `8088-pc`,
`80186`, `80286-at`) plus separate machine kinds (Eater 6502, ZX48…). As we add
the free-386, ELKS/Minix/FreeDOS bootdisks, and libre languages, the space
explodes combinatorially. Pre-baking each combination as a flavor doesn't scale;
a user may accumulate **hundreds** of machines (as they might hundreds of DOSBox
profiles). The fix is a small, declarative **machine config** + surfaces to
create, browse, import and activate them.

## 2. The model: a machine is a manifest

A machine config is the existing `brickwright-media.json` manifest, extended.
It is **small JSON**; its disk/ROM images are **referenced by URL + sha256 and
fetched only on activation** (the media-lab's "the click is the distribution
event"). So a 300-machine library is 300 tiny JSONs, not 300 floppy images.

```jsonc
{
  "id": "uuid",                       // stable local id
  "title": "FreeDOS on the free 386",
  "executionMode": "functional",      // "functional" | "wired" | "auto"  (§3)
  "machine": "i80386",                // target kind (i8086, i80286, i80386, z80, eater6502, zx48, …)
  "cpu": { "variant": "80386" },      // variant/clock for the kind
  "ram": { "conventionalKiB": 640, "extendedKiB": 3456 },
  "bios": { "kind": "bochs-lgpl" },   // "buildbios-xt" | "bochs-lgpl" | "seabios-lgpl" | "ibm-5170"(user-supplied)
  "video": { "kind": "vga", "optionRom": "seavgabios-lgpl" },
  "slots": {                          // slot -> media reference (§ describeMedia slots)
    "hdd":   { "url": "…/freedos-hd.img", "sha256": "…", "geometry": {…} },
    "floppy":{ "url": "…/boot.img",       "sha256": "…", "geometry": {"cylinders":80,"heads":2,"sectors":18} }
  },
  "quirks": ["at-floppy-drive-type"],
  "bootOrder": ["floppy", "hdd"],
  // Panel widgets this machine declares (§4.2). A `source:"video"` widget is the
  // machine's SCREEN — created on activate and fed each frame from runner.video()
  // via the panel's setVgaFrame, so the framebuffer renders in the Widgets pane.
  // A manifest with no screen widget is headless/serial-only (video → Debug only).
  "widgets": [
    { "name": "screen", "type": "simplevga",
      "config": { "width": 640, "height": 200 },
      "layout": { "x": 0, "y": 0, "w": 24, "h": 14 },
      "source": "video" }
  ],
  // wired-only (§3):
  "circuit": { "ref": "circuit-id-or-url", "cpuPart": "part-id" },
  "provenance": { "source": "media-lab:freedoom-fastdoom", "license": "…" }
}
```

**The manifest declares its own screen (§4.2 made concrete).** A machine's video
does not reach a widget by magic: the manifest names a `simplevga` (or other
display) widget and marks it `source:"video"`. On activate, the host creates that
widget on the ControllerPanel and starts a mirror that polls `runner.video()`
(`{width,height,rgba,frame?}`, produced by every CPU's video card) and paints it
with `setVgaFrame` — bw-board's method whose own docstring is *"Mirror a machine
video card frame into a VGA widget."* Both ends already ship in bw-board; the only
new piece is the pump between them. `config.width/height` are an initial size —
the real frame's dimensions override them. A machine with no display card, or one
you only want to drive over serial, declares no video widget and shows its output
in the Debug instrument instead. (Input widgets — a `keyboard`/`keypad` bound to
the machine — are the steering counterpart; declare one only once its key→keyIn
path is wired, so a control is never dead.)

Rules:
- **One schema, shared by GUI and CLI.** The manifest the "…" dialog emits is the
  same one `run-dos.mjs` / `run-i80386-free-bios-freedos.mjs` / a media-lab
  `fetch.sh` consume. What you build in the dialog runs headless, and vice-versa.
- **Images are references, never inlined.** `{url, sha256, geometry?}`. Fetched +
  hash-verified on activate; cached by sha. The library never loads images.
- **Validation** lives in one module (`machine-config.js`), reused by GUI + CLI +
  a Node test, so a bad config is rejected the same everywhere.

## 3. Wired vs functional (a first-class field, already real in the engine)

The engine already distinguishes these (`i8086Execution` modes
`['auto','functional','wired']`; the debug runner boots either the designer's
real board or the fast DOS/functional core). The config MUST carry it.

- **`functional`** — a fast functional model (chips are config, no exact bus).
  Runs real OSes/software at speed. **This is the only viable mode for booting an
  OS** — a fully-wired bus sim will not boot FreeDOS/Doom/ELKS at usable speed
  (measured: functional cores are already generator-bound for the widgets pane).
- **`wired`** — realized from a **circuit** (chips seated on the breadboard/circuit
  designer, pin/bus edges simulated); "boots the way the silicon would," drives
  real peripherals (VIA, HD44780, LEDs). Exact, tangible, slow. For *learning
  hardware*, not running an OS.
- **`auto`** — functional unless the circuit needs a peripheral the functional
  model lacks.

Consequence for the manager: **media-lab OS/bootdisk content → functional
machines; teaching circuits (breadboard CPU + LCD, Eater 6502 + VIA) → wired
machines.** They serve different questions; a machine picks its lane, and the
manager must show the mode so no one tries to boot FreeDOS on a wired breadboard.
Two authoring flows feed the manager: the **"…" config dialog** (functional) and
the **circuit designer** (wired; its config carries a `circuit` reference).

## 4. Where a machine appears — the real lite surfaces (grounded in code)

The manager adds **no new pane**. A machine is *managed* by a picker + a modal +
the "…" editor, and it *appears* through surfaces lite already has. This section
is written against the actual code (`gui.jsx`, `controller-panel-view.jsx`,
`debug-panel.jsx`, `fpga-tab.jsx`) — not an idealized layout — because the
uniform principle only becomes obvious once you read them:

> **The Widgets pane is the universal output surface / front panel.** *Every*
> execution surface — a functional machine, a wired circuit, an FPGA fabric —
> renders its **user-facing** output through widgets. Debug is a developer
> *instrument*, not the machine's screen.

### 4.1 The right pane is a composable dock

The right pane switches modes via `dockMode` + `bw-debug-dock` +
`bw-stage-circuit` (localStorage), so the user *composes* what sits beside their
Code/Blocks on the left:

- **Scratch stage** — `TargetPane`, the default mode.
- **Widgets** — `dockMode==='controller'` → `ControllerPanelView` (the front
  panel; §4.2).
- **Debug** — `bw-debug-dock` (`'top'`/`'right'`): the debugger instrument (§4.3).
- **microbit / arcade** — device panes for those kinds.
- **Circuit blended in** — `bw-stage-circuit` lets the Circuit render *in the
  right pane*, so a user can have **Code on the left and the Circuit beside it**.

### 4.2 Widgets pane = the machine's screen and front panel

`controller-panel-view.jsx` carries real **display widgets** that render machine
output directly — this is where a PC's video actually reaches the user:

- **`simplevga`** — a `<canvas>` fed an RGBA **framebuffer** via `putImageData`
  (labelled "VGA"). This is the machine's screen.
- **`lcd` / `mono_lcd` / `oled` / `terminal`** — character/graphics displays; a
  `terminal` face shows a growing bound buffer (a scrolling console).
- **matrix / seven-seg / LEDs / gauges / bargraph** — smaller readouts.

Input widgets (keypad / keyboard / joystick / D-pad / buttons) bound to the
machine steer it (keyboard, mouse). The clincher that this is the *universal*
surface: the **FPGA tab mirrors its output pins into this same view**
(`gui.jsx`: *"Mirror the FPGA design's OUTPUT pins into the Controller/Widgets
view"*, `bw-fpga-leds` / `bw-fpga-output`). So a functional machine's screen is a
`simplevga`/`lcd`/`terminal` **widget** — its front panel — exactly as an LED on a
wired board is a widget.

### 4.3 Debug pane = a developer instrument, not the screen

`debug-panel.jsx` is **not** the general framebuffer surface. It is:

- a **Serial console** — RS232-like text I/O (AVR USART / 8051 UART / BBC serial):
  output, plus an optional line-send box (`sendSerial`);
- a **VdpScreen** that appears **only for a TMS9918A VDP** machine
  (`runner.video()` polled per frame);
- stepping / breakpoints / frames / trace.

So a machine's **serial / monitor** I/O and its debugging live here; its **real
screen** does not. (This corrects the earlier RUNNING.md claim that "the debug
panel's video is the CGA screen" — the CGA/VGA framebuffer belongs in a Widgets
display widget; Debug's `video()` path is the VDP instrument.)

### 4.4 Tab row (left / main authoring) — including FPGA

Blocks · **Code** · **Circuit** · **FPGA**. Circuit is the wired
authoring/watch surface (a **wired machine ≡ a circuit**); **FPGA** is a real
fourth surface — build-time `BW_ENABLE_FPGA`, runtime opt-in via **Settings ▸
FPGA lab** (`gui.jsx`) — the HDL/fabric surface, whose output mirrors into
Widgets (§4.2).

### 4.5 How a machine binds to these surfaces

| A machine's… | reaches the user in… |
|---|---|
| **screen / video** (VGA/CGA framebuffer, LCD, VDU text) | a **Widgets** display widget (`simplevga`/`lcd`/`terminal`) — its front panel |
| **keyboard / mouse** steering | **Widgets** input widgets bound to it, or Debug `keyIn`/serial-send |
| **serial / monitor** console + stepping | the **Debug** instrument |
| **wiring** (a wired machine ≡ a circuit) | the **Circuit** surface (tab, or blended beside Code) |
| **HDL / fabric** (an FPGA machine) | the **FPGA** tab (output mirrored to Widgets) |

### 4.6 Managing machines (three management surfaces, three scales)

These *manage* the config; they don't render the machine (that's §4.1–4.5):

1. **Quick-picker (the existing dropdown)** — switch fast among *a few*. Recent +
   favorites + a "Manage machines…" entry. Shows each machine's mode badge.
2. **Machine Manager (new modal)** — the *library* at scale: a searchable /
   filterable / taggable list (by CPU, OS, mode), with create · duplicate · edit ·
   delete · **import / export** · "set active". This is the surface for hundreds.
   Precedent: 86Box/PCem machine lists, D-Fend/Launchbox DOSBox profiles, an IDE's
   "Edit Configurations…".
3. **"…" Config editor** — edit *one* functional machine: CPU/variant · RAM ·
   BIOS · video · attached disks (floppy A:/B:, HD C:) · boot order. Opened from
   either surface. (Wired machines edit in the circuit designer instead.)

## 5. Storage & scale

- **Configs** in **IndexedDB** (hundreds/thousands are trivial — small JSON).
  Export/import as `.json` files or a **repo**.
- **Images** referenced by `{url, sha256}`, fetched on activate, cached by sha in
  the browser (Cache Storage / OPFS). Never loaded for the library view.
- **Sync/backup**: a config library is exportable as a folder of manifests — i.e.
  a repo. The **media-lab is already exactly this** (`projects/<name>/brickwright-
  media.json`), so it doubles as an importable curated library; a user's private
  repo holds their own hundreds.

## 6. Importers (all cheap, because config ≠ image)

- **DOSBox `.conf`** → a functional config (the `--dosbox-conf` mapping already
  reads machine/cycles/mounts/autoexec).
- **A folder/collection of disk images** → one config each (detect geometry;
  default BIOS by CPU).
- **A manifest repo** (the media-lab, or the user's own) → bulk import; each
  `projects/*/brickwright-media.json` becomes a library entry.

## 7. How languages & media bind to a configurable machine

- The **code tab** picks a *machine config* (not a bare flavor) as its run target;
  a toolchain route (`toolchains.mjs`) compiles the source for that machine's CPU
  and runs it on that machine.
- **Pascal-via-ACK** and a **libre GW-BASIC** become registry entries against the
  configurable targets — and since ACK is multi-target (i86/i386/z80/6502/68k),
  Pascal/C can extend across targets, not just the 8086.
- A **media-lab bundle** is a machine config with software attached; "run this OS"
  = load its manifest as the active machine.
- Its **output reaches the user through the surfaces of §4.5** — e.g. FreeDOS/QBasic
  on a functional 80286 renders into a `simplevga`/`terminal` **Widgets** display
  (its screen), takes keys from a bound input widget, and exposes its serial/monitor
  in **Debug**. The manager never invents a surface for it.

## 8. Incremental build plan (so this ships in slices)

1. **Foundation (no UI, Node-testable):** `machine-config.js` (schema + validate +
   normalize, incl. `executionMode`), a config **store** (interface + IndexedDB
   impl + in-memory impl for tests), and the **importers** (dosbox-conf, manifest).
   CRUD + import/export + fetch-on-activate resolver. Unit-tested framework-free.
2. **Activate path:** a config → the existing boot path (functional: the debug
   runner's `bootMedia`/machineConfig; wired: the designer board). One `activate
   (config)` that both GUI and CLI call.
3. **Manager UI:** the library panel (list/search/filter/CRUD/import/export) over
   the store.
4. **"…" editor:** the functional-machine config form.
5. **Quick-picker rework:** recent/favorites + "Manage…".
6. **Free-386 in the GUI:** ships as a *config* (386 + bochs-lgpl BIOS + FreeDOS
   HD) once the bw-board pin bump lands the free-386 code into lite.
7. **Language routes:** Pascal-via-ACK + libre GW-BASIC as `toolchains.mjs`
   entries against configurable machines.

Steps 1–2 are the spine and are self-contained (no pin bump, Node-testable);
everything visible builds on them.
