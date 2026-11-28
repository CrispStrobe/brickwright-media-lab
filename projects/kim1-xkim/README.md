# Corsham xKIM

Run `./build.sh` with an AS65-compatible assembler on PATH or set `AS65` to
its executable. The build retrieves the pinned [Corsham source](https://github.com/CorshamTech/xKIM/tree/0ce44974504514563e86cdf84ac8a9848b8bcdb5)
and produces an 8 KiB `xKIM.bin`. The qualified build used
[aigrette65 0.2.0](https://tangled.org/jcollie.dev/aigrette65/commit/f29675b868c945e5f339a77d308e31a59375e9ab)
and produced SHA-256 `e10ea3d5fc57eb6293a540fa8b7d16ab8297146517b72c2158876279dee917c2`.

In Brickwright, open **File → Machines → KIM-1 → Corsham xKIM**. Choose the
locally built ROM and optionally select files with 8.3 names. Run opens
Controller. Enter `D` to list the files. Enter `T` and give a filename to
display its contents. The selected files are read-only and stay in the session.

Upstream declares GPLv3 and credits borrowed code in the assembly. The ROM is
built locally. The loose-file profile implements directory and read operations.
FAT disk images, guest file writes and the Corsham RTC require further work.
