# ACE KIM keypad computer

This pair contains A.C. Wright's MIT-licensed BIOS 1.8 and KC Monitor 1.1.
Run `./fetch.sh` to verify the pinned upstream binaries against the copies here.
Run `BW_BOARD_DIR=/path/to/bw-board node proof.mjs` to boot, dismiss the LCD
splash with ESC, and enter INS, 5, A to write $5A at address $0800.

- [BIOS source and release](https://github.com/acwright/6502-BIOS/tree/932021a429bf2c9cdc3a9cbd6a974bef9268e183)
- [KC Monitor source](https://github.com/acwright/6502-KIM/tree/b01b5dcda9409385188abab4ec47bed237dac3c0)
