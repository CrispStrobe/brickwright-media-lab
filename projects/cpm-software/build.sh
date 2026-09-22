#!/usr/bin/env bash
# Reproduce the committed CP/M-80 demo .COMs from their sources.
#
# These programs are OURS (BSD-2-Clause) — there is nothing to fetch. The
# repo commits the built .COMs for convenience (they are tiny and belong to
# us); this script rebuilds them byte-for-byte from src/ so the binaries are
# verifiable, not trusted.
#
# Toolchain (both are free software, widely packaged):
#   pasmo  — a Z80 assembler (GPL-3.0)          apt: pasmo
#   sdcc   — the Small Device C Compiler (GPL)  apt: sdcc  (needs the z80 port)
set -euo pipefail
cd "$(dirname "$0")"

command -v pasmo >/dev/null || { echo "need 'pasmo' (a Z80 assembler)"; exit 2; }
command -v sdcc  >/dev/null || { echo "need 'sdcc' with the z80 port"; exit 2; }
command -v sdasz80 >/dev/null || { echo "need 'sdasz80' (ships with sdcc)"; exit 2; }

# --- hello.com: a Z80/CP/M "hello" via BDOS 9, assembled with pasmo ---
pasmo src/hello.asm hello.com

# --- sieve.com: a real SDCC-compiled C program (primes < 50 via BDOS 2) ---
# crt0 (inherits CP/M's SP, runs main, warm-boots to A>) + sieve.c.
# Data is placed above the code (0x0400) so writes never touch the program;
# the .COM is carved from the linker's Intel-HEX extent (no padding).
sdasz80 -o src/crt0.rel src/crt0.s
sdcc -mz80 --no-std-crt0 --code-loc 0x0113 --data-loc 0x0400 \
     src/crt0.rel src/sieve.c -o src/sieve.ihx
node - "src/sieve.ihx" sieve.com <<'JS'
const fs = require('fs');
const [,, ihx, out] = process.argv;
const mem = new Map(); let max = 0;
for (const L of fs.readFileSync(ihx, 'utf8').split(/\r?\n/)) {
  if (L[0] !== ':') continue;
  const len = parseInt(L.substr(1,2),16), addr = parseInt(L.substr(3,4),16),
        type = parseInt(L.substr(7,2),16);
  if (type !== 0) continue;
  for (let k = 0; k < len; k++) { const a = addr + k;
    mem.set(a, parseInt(L.substr(9+k*2,2),16)); if (a > max) max = a; }
}
const buf = Buffer.alloc(max - 0x100 + 1, 0);
for (const [a, v] of mem) if (a >= 0x100) buf[a - 0x100] = v;
fs.writeFileSync(out, buf);
console.log(`${out}: ${buf.length} bytes`);
JS
rm -f src/crt0.rel src/sieve.ihx src/sieve.lk src/sieve.map src/sieve.noi src/sieve.rel src/sieve.sym src/sieve.lst src/sieve.asm

echo "built:"
sha256sum hello.com sieve.com
echo
echo "expected:"
echo "18ef66fc24ef335ee1b6f8cf78b69996aad73993c484b36b67d128d8b2494fdf  hello.com"
echo "8caf606b539ca950bd25f185ce977c69ef57c09278a10b8a2f1b2c791d73d8f9  sieve.com"
