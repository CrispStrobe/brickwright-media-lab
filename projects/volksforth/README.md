# VolksForth — BSD Forth for the 8086 (DOS)

Upstream: <https://github.com/forth-ev/volksForth> (BSD-2-Clause) — the
Forth-Gesellschaft's **volksFORTH-83**, a Forth interpreter/compiler
system with an unusually clear CPU story: its `8086/msdos/` tree names
the 8086/186/286 directly. Cleaner-licensed than the public-domain
Forths (a real BSD-2 grant) and native to our exact CPU range.

## Runs here — proven

`volks4th.com` loads on the 8086 DOS layer and prints its banner + the
Forth `ok`:

```
volksFORTH-83 rev. 3.81.41
 ok
```

Verified with bw-board `scripts/run-dos.mjs`:

```sh
node scripts/run-dos.mjs volks4th.com --preset xt --max 4000000 --screen
```

## Provenance (pinned in `fetch.sh`)

- Upstream: `github.com/forth-ev/volksForth` — `8086/msdos/volks4th.com`
- sha256 `847367d29b297614c1b5d068885e5ad26fa20452d079e1f3870294bf4c50c0a8`, 31,685 bytes
- License: BSD-2-Clause (repo `LICENSE`), © 1986-2021 Forth Gesellschaft e.V.
- Runs on: `i8086` DOS layer (also documented for 186/286)

## Run it

```sh
./fetch.sh     # downloads volks4th.com + LICENSE, verifies sha256
```
