# Corsham xKIM

Run `./build.sh` with an AS65-compatible assembler on PATH or set `AS65` to
its executable. The build retrieves the pinned [Corsham source](https://github.com/CorshamTech/xKIM/tree/0ce44974504514563e86cdf84ac8a9848b8bcdb5)
and produces an 8 KiB `xKIM.bin`. The qualified build used
[aigrette65 0.2.0](https://tangled.org/jcollie.dev/aigrette65/commit/f29675b868c945e5f339a77d308e31a59375e9ab)
and produced SHA-256 `e10ea3d5fc57eb6293a540fa8b7d16ab8297146517b72c2158876279dee917c2`.

In Brickwright, open **File → Machines → KIM-1 → Corsham xKIM**. Choose the
locally built ROM. Under storage, choose **Loose files** for individual 8.3
files or **FAT image** for a FAT12, FAT16 or FAT32 image up to 128 MiB. A raw
volume or an MBR disk with one primary FAT partition is supported. The image
supplies root files with short names made of ASCII letters, digits, hyphens or
underscores. Run opens Controller. Enter `D` to list the files. Enter `T` and give a filename to
display its contents. Enter `S`, supply the start and end addresses, then enter
a filename to save Intel HEX. Use `L` to reload it. **Export files** saves the
session files as a ZIP. Guest writes update session copies. The original host
files and disk images remain intact. The session accepts up to 64 files, 64 KiB per file and
2 MiB total.

Upstream declares GPLv3 and credits borrowed code in the assembly. Build the
ROM locally. Exporting a modified disk image and the Corsham RTC require
further work.
