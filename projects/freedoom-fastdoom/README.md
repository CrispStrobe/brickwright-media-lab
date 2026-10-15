# Freedoom + FastDoom — staged DOS game package

FastDoom engine source is GPL-licensed; Freedoom replacement data is
BSD-licensed. This recipe selects a prebuilt DOS engine and game data. Those
source licenses do not establish the complete component and notice obligations
of the selected prebuilt engine:

- **Freedoom 0.13.0** — <https://github.com/freedoom/freedoom> (**BSD-3-Clause**):
  the game DATA (`freedoom1.wad`, `freedoom2.wad`), a from-scratch replacement
  for the commercial Doom IWADs.
- **FastDoom 1.3.0** — <https://github.com/viti95/FastDoom> (**GPL-2.0**):
  a speed-focused DOS Doom ENGINE (id's GPL source, heavily optimised),
  shipping prebuilt 386 DOS executables (`FDOOM.EXE` and a family
  of video-mode variants) plus Freedoom launch configs (`DOOM*.TCF`).

The engine source and game data are **separately licensed** (GPL-2 code,
BSD-3 data). The manifest and `fetch.sh` keep the two downloads distinct.

## Prebuilt component review

Bundling status: **pending exact component review**. The pinned engine's
[license](https://github.com/viti95/FastDoom/blob/1.3.0/FASTDOOM/LICENSE),
[link specification](https://github.com/viti95/FastDoom/blob/1.3.0/FASTDOOM/fdoom.lnk)
and [stub binding](https://github.com/viti95/FastDoom/blob/1.3.0/stub.bat)
are distinct inputs to that review. Admit the selected executable's actual
extender/runtime and linked-library identities, corresponding source and
required notices before describing the prebuilt package as fully libre or
redistributable as a bundle. The root engine license alone is insufficient.
The current recipe is not a completed component inventory or notice package.
No archive was newly acquired or executed for this documentation review.

## What runs, and where

The intended target is a 386 with protected-mode DOS-extender support, a DOS
host and VGA. After fetching the separate engine and data, the intended launch
is `FDOOM.EXE -iwad FREEDOOM1.WAD`, or the supplied launch configuration.

**Packaging status: no guest execution was performed in this packaging pass.**
The pinned downloads and licenses are available, but this project does not yet
qualify a rendered game/menu, keyboard or mouse interaction, audio, completion,
performance or an installed GUI journey. The top-level project table records
this same boundary.

A compatible AT/VGA firmware profile is required. The emulator's documented
[free BIOS/VGA AT result](https://github.com/CrispStrobe/bw-board/blob/master/docs/I80386-DPMI-HIGHMEM-AT-RESULTS.md)
means proprietary ROMs are not a general prerequisite. This project has not yet
been qualified with that profile and does not bundle BIOS images. Follow the
[CLI/GUI loading and format guide](https://github.com/CrispStrobe/bw-board/blob/master/docs/X86-USER-PATHS.md)
for actual supported inputs; a fetchable package is not automatic guest adoption.

## Provenance (pinned in `fetch.sh`)

- Freedoom `freedoom-0.13.0.zip` — sha256 `3f9b264f3e3ce503b4fb7f6bdcb1f419d93c7b546f4df3e874dd878db9688f59` (24,143,781 B); yields `freedoom1.wad` (28.8 MB) + `freedoom2.wad`, `COPYING.txt` (BSD-3)
- FastDoom `FastDoom_1.3.0.zip` — sha256 `4b805f3f712362d53797b3109ebf4651adb3bf28b903c91c4c477eba56121d6f` (16,504,321 B); yields `FDOOM.EXE` + video-mode variants + `DOOM*.TCF`
- Machine: `i80386` (protected mode, VGA, DOS host)

## Run it

```sh
./fetch.sh     # downloads + sha-verifies both releases, unpacks the WAD + engine
```

Then, on the 386 with FreeDOS: `FDOOM.EXE -iwad FREEDOOM1.WAD`.
Both halves are fetched from upstream, never re-hosted.
