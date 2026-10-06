# ELKS floppy — CORS mirror for the brickwright-lite GUI lesson

This branch (`media/elks-v0.9.2`) carries `fd1440-fat.img` so the brickwright-lite
GUI can fetch it from the raw.githubusercontent CDN, which sends
`Access-Control-Allow-Origin: *`. The upstream GitHub **release** asset does not
send a CORS header, so a browser cannot read it directly — hence this mirror, the
same arrangement the Linux-on-RISC-V lesson uses (`media/riscv32-linux-v1`).

- **Image:** `projects/elks/fd1440-fat.img`
- **SHA-256:** `637a1d07ac1b18c7e8fafbf64911ceaa5864a37c60e23878d498534ccaae366b`
- **Upstream (unmodified):** https://github.com/ghaerr/elks/releases/download/v0.9.2/fd1440-fat.img
- **Corresponding source (GPL-2.0):** https://github.com/ghaerr/elks/tree/v0.9.2
- **License:** GPL-2.0 (see `LICENSE`)

The byte stream is identical to the upstream release asset (same SHA-256). This is
a redistribution for browser-reachability only, not a fork; ELKS is GPL-2.0 and is
offered here beside its corresponding source as GPL-2.0 §3 requires. `main`'s
`projects/elks/` keeps the floppy un-vendored (`fetch.sh`); this media branch is
the one the lite lesson pins by commit + SHA-256.
