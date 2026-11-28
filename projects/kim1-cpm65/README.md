# CP/M-65 on KIM-1

Run `./fetch.sh` to fetch and verify the three pinned archives from the
[CP/M-65 upstream dev release](https://github.com/davidgiven/cpm65/releases/tag/dev).
The project uses BSD-2-Clause for CP/M-65 itself. The release builds also collect
third-party guest utilities, each with its own terms. The script fetches from
upstream so Media Lab does not redistribute that collection. SHA-256 pins guard
against a moving development release.

In Machines, under KIM-1, choose CP/M-65 and the drive matching the
original upstream ZIP. Select that ZIP to boot with the bundled Brickwright ROM,
then use `DIR` in Controller. The ZIP is opened locally for the current session.

For manual setup in the Circuits KIM-1 panel, select the Brickwright ROM and TTY. Use a
programmable memory map with RAM in $0400–$16FF and $2000–$FFF9, or use the
expanded-RAM option. Mount `spi.raw` with SD (SPI), or `corsham.dsk` with Corsham
(DSK), or `k1013.imd` in K-1013 drive A. Import the matching paper tape and send `0200 G` through the terminal.

`BW_BOARD_DIR=/path/to/bw-board node proof.mjs` boots all three discs and verifies the
CP/M banner, the guest directory listing from `DIR`, and return to the prompt.
Use a Brickwright ROM with the fixed serial-delay entries at $1ED4 and $1EEB.
