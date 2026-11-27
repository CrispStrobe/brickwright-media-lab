# KIM-1 expansion and video exercises

These are original MIT-licensed fixtures. Run `./fetch.sh` to rebuild the
paper tapes and generate the memory and disk images.

- **RAM check** — In Expansion and storage, add KIM-2 at $2000, KIM-3 at $4000
  and KIM-3B at $6000. Load `ram-check.ptp`. Run at $0200. A byte of $5A at
  $0300 confirms all three slots. $FF indicates a mismatch.
- **Video** — Select K-1008 at $2000 and load `video.ptp`. Run at $0200.
  The display fills with a checkerboard.
- **Programmable RAM** — Load `expanded-ram.raw` in the memcfg field. The
  lower hole at $0400–$16FF and upper RAM from $2000–$FFF9 are enabled. The
  card leaves the motherboard ROM and reset-vector mapping alone. Run
  `memory-map.ptp` at $0200 to write and verify $34 at $0400 and $A7 at $FFF9.
- **Sector data** — Mount `sectors.img` as either SPI SD or Corsham DSK. The
  four 512-byte blocks carry distinct byte patterns. Run `sd-read.ptp` for
  PAL-1 SPI or `corsham-read.ptp` for the parallel DSK interface. Each copies
  the first 16 bytes of block 1 to $0310–$031F and sets $0300 to $5A on success.

`BW_BOARD_DIR=/path/to/bw-board node proof.mjs` runs all five tapes.
