# Freedoom + FastDoom — fully-libre Doom on the 386

Two upstreams, both free, combining into a Doom that is libre **end to
end** — a free engine running free game data, with no proprietary IWAD:

- **Freedoom 0.13.0** — <https://github.com/freedoom/freedoom> (**BSD-3-Clause**):
  the game DATA (`freedoom1.wad`, `freedoom2.wad`), a from-scratch replacement
  for the commercial Doom IWADs.
- **FastDoom 1.3.0** — <https://github.com/viti95/FastDoom> (**GPL-2.0**):
  a speed-focused DOS Doom ENGINE (id's GPL source, heavily optimised),
  shipping prebuilt 386 real-mode-DOS executables (`FDOOM.EXE` and a family
  of video-mode variants) plus Freedoom launch configs (`DOOM*.TCF`).

The engine and the data are **separately licensed** (GPL-2 code, BSD-3
data) — the manifest and `fetch.sh` keep them distinct.

## What runs, and where

The **386 tier**: FastDoom needs a 386 (protected mode via a DOS
extender), VGA, and a DOS host — the same machine that already runs
FreeDOS, Windows 3.0 and commercial Doom here. Boot FreeDOS on the
i80386 machine, run `FDOOM.EXE -file FREEDOOM1.WAD` (or use the bundled
`.TCF`), steer with the keyboard, hear the audio.

**Not executed in this packaging environment**, and honestly so: every
386 boot here needs the user's own **AT + VGA BIOS ROMs** (proprietary
IBM/VGA firmware the app supplies at runtime and this repo never
vendors), and those ROMs are not present in the build box. The
freely-licensed halves — the engine and the data — are what this project
delivers; the proprietary BIOS is the runtime, exactly as for every
other 386 title.

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
