# ALICE: The Personal Pascal — native Pascal IDE on booted DOS

Upstream: <https://github.com/DosWorld/alicepascal> — **ALICE: The Personal
Pascal** (1985, Looking Glass Software, designed by Brad Templeton), a
structure-aware Pascal IDE for MS-DOS. Its author released it as **freeware
under the Perl Artistic Licence** ("The code and program are now free under the
terms of the Perl Artistic Licence", `README.MD`). This is a native **8086**
Pascal environment — a language project that runs a full editor + compiler on
the machine.

## Runs here — proven, to the ALICE main menu

ALICE needs a **real, booted DOS**: it self-locates its `.suf` overlay and
template files (and its help file) via the **DOS 3.0+ PSP program path** — the
"where was I loaded from" that a full DOS fills in. bw-board's minimal
`run-dos` service layer does not provide that path, so ALICE cannot find its
overlays there. A booted DOS does.

On the **fully-free 386** (LGPL Bochs BIOS + LGPL VGABios, **no proprietary
ROM**) booting **FreeDOS 1.4**, with the ALICE files placed on a mounted FAT16
`C:`, running `alice` reaches its main menu:

```
                            ALICE: The Personal Pascal
               Copyright (c) 1985 by Looking Glass Software Limited
                       Published by Software Channels Inc.
                            Designed by Brad Templeton
                                 Release SCI-1.3
                     Freeware -- Sorry, no support available
                                          Welcome to ALICE Pascal
                                        A Edit a New Program
                                        B Load in an existing Pascal Program
                                        C Quit the ALICE system
                                        D Experiment in Immediate Mode
                                        E What is ALICE all about?
                                        F General Information
```

That is the acceptance signal — ALICE initialized, found its `.suf`/help files
through the FreeDOS PSP path, and offered its editor. (Verified by booting
FreeDOS on the free-386 with the ALICE files on an in-script FAT16 `C:` and
driving `c:` → `alice` over the emulated AT keyboard.)

## Licensing

**Artistic-1.0** (the Perl Artistic Licence). The upstream `README.MD` states
"The code and program are now free under the terms of the Perl Artistic Licence",
and ALICE's own start screen prints "Freeware -- Sorry, no support available".
`fetch.sh` pulls that `README.MD` (the licence statement) beside the binaries.

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/DosWorld/alicepascal`, `alice-binaries/` (the "small" build)
- Files + sha256 (verified in `fetch.sh`): `alice.exe` `d272d038…c846c`,
  `apin.exe` `5bbb217e…99b7`, `ap.ini` `8a1e6f89…1c9a`, `apbuilt.suf`
  `a29a19df…4e84`, `aptempla.suf` `f5528338…326bd`, `nlbegin.suf`
  `72b8193a…dc11`, `helpfile.huf` `113af8ab…c1f6`
- Runs on: a **booted DOS** — the free-386 FreeDOS host (proven), or an 8086
  FreeDOS; **not** the minimal `run-dos` service (no PSP path)

## Run it

```sh
./fetch.sh     # downloads + sha-verifies the ALICE file set, pulls the licence README
```

Then, on a booted DOS with all these files in one directory: `alice`. It opens
to the menu above. Fetched from upstream, never re-hosted.
