# OpenGEM 7 RC3 — the free graphical DOS desktop

Upstream: <https://github.com/shanecoughlan/OpenGEM> (**GPL-2.0-or-later**) —
OpenGEM is a **FreeGEM** distribution: the free, GPL-licensed continuation of
Digital Research's **GEM** desktop (the same GEM that shipped as ViewMAX in
DR-DOS and drove the Atari ST). It is the lab's first **graphical** DOS
program — a windowed, mouse-driven desktop, not a text console.

## Licensing

**GPL-2.0-or-later.** The distro's `README.TXT` states it plainly —
"Copyright (C) 2001-2017 Shane Coughlan … This is free software; you can
redistribute it and/or modify it under the terms of the GNU General Public
License … either version 2 of the License, or (at your option) any later
version." The full GPL-2 text ships as `LICENSE.TXT`; `fetch.sh` pulls it
alongside the zip. FreeGEM/GEM AES component sources are in the upstream
`source/` tree (the OpenGEM-7 SDK).

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/shanecoughlan/OpenGEM`, path `binary/OPENGEM7-RC3.zip`
- Artifact: `OPENGEM7-RC3.zip` — sha256
  `f9c737c2154197a979136bf6857e5af7e61efb0d8436b380ec52427ac46277b1`,
  2,332,210 bytes; unpacks to `OPENGEM/` (`GEM.BAT`, `SETUP.BAT`, `GEMAPPS/`
  with the AES, apps like `EDICON`/`2048`, and the EGA/VGA/CGA font set)
- Machine tier: a DOS host with an EGA/VGA framebuffer + a mouse (the free-386
  FreeDOS host, or an 8086 DOS with graphics)

## What runs — and the honest run status

OpenGEM is installed onto a DOS disk with `SETUP.BAT` and launched with
`GEM.BAT`. It then switches the display into an **EGA/VGA graphics mode** and
paints its desktop, menus and windows into the graphics framebuffer
(`0xA0000`), driven by the **mouse**.

**Not run-proven in this packaging pass, and honestly so.** The packaging
harness here verifies programs by scraping the **text** video plane
(`0xB8000`, 25×80 characters) — which is exactly what a graphical GEM desktop
does *not* write to. Confirming OpenGEM therefore needs a **framebuffer +
mouse** surface (the app's video/mouse widget path), not this repo's
text-console tooling. So this project delivers the freely-licensed, verified,
fetchable artifact — the GPL desktop and its GPL license — and pins the run
requirement rather than forcing a text-scrape "pass" it cannot honestly
produce.

## Run it

```sh
./fetch.sh     # downloads + sha-verifies OPENGEM7-RC3.zip, unpacks OPENGEM/, pulls the GPL LICENSE
```

Then, on a DOS host with VGA + a mouse: `SETUP.BAT` to install, `GEM.BAT` to
start the desktop. Fetched from upstream, never re-hosted.
