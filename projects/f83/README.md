# F83 — Forth-83 on the 8086 (DOS)

Upstream: <https://github.com/ForthHub/F83> — Henry Laxen & Michael
Perry's **F83**, the classic public-domain Forth-83 system for the 8086.
The first *language* project in the lab: not an OS, but a tool that runs
on the machine and lets you program it.

## Runs here — proven

`F83.COM` loads on BrickWright's 8086 DOS layer and prints its banner:

```
8086 Forth 83 Model
Version 2.1.0  Modified 01Jun84
```

Verified with bw-board `scripts/run-dos.mjs`:

```sh
node scripts/run-dos.mjs f83.com --preset xt --max 5000000 --screen
```

It then drops into the interactive Forth interpreter — a full
programming environment (editor, assembler, metacompiler) in 26 KB, on a
plain 8086.

## Licensing

**Public domain.** The upstream `readme.1st` states plainly: "F83.COM, a
public domain implementation of FORTH-83." Laxen & Perry released it to
the public domain; `fetch.sh` pulls that notice alongside the binary.

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/ForthHub/F83`
- Artifact: `f83.com`, sha256 `e808ce6f4c348c2de86de3e963d71b4d0c31b2e11ea36d18f9ac87ac6d92610f`, 26,368 bytes
- Runs on: `i8086` DOS layer (`run-dos.mjs`, `xt` preset) — public domain

## Run it

```sh
./fetch.sh     # downloads f83.com + readme.1st, verifies sha256
```

Then run `f83.com` on the 8086 DOS tier. Fetched from upstream, not
re-hosted (public domain, so re-hosting is permitted too).
