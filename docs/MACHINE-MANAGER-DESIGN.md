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
  // wired-only (§3):
  "circuit": { "ref": "circuit-id-or-url", "cpuPart": "part-id" },
  "provenance": { "source": "media-lab:freedoom-fastdoom", "license": "…" }
}
```

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

## 4. Three surfaces, three scales

1. **Quick-picker (the existing dropdown)** — switch fast among *a few*. Recent +
   favorites + a "Manage machines…" entry. Shows each machine's mode badge.
2. **Machine Manager (new surface)** — the *library* at scale: a searchable /
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
