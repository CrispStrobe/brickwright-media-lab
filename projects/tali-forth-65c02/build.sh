#!/usr/bin/env bash
# Build a pinned Tali Forth ROM, with no upstream source changes.
# Default verifies against tali-forth.rom; --write installs a rebuilt ROM.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
work="${TALI_WORK:-$here/.build}"
upstream="${TALI_SOURCE:-$work/upstream}"
assembler="${TASS64:-64tass}"
commit="68079b0341d809d3f2bbf38fce1f70e934bf6731"
mode="${1:---verify}"
if [[ "$mode" != --verify && "$mode" != --write ]]; then
    echo "Usage: $0 [--verify|--write]" >&2
    exit 2
fi
if ! command -v "$assembler" >/dev/null 2>&1; then
    echo "64tass not found; install 64tass 1.60.3243 or set TASS64 to its path." >&2
    exit 2
fi
if ! "$assembler" --version | head -n 1 | grep -Fq 'V1.60.3243'; then
    echo "Reproducible build requires 64tass 1.60.3243 (set TASS64)." >&2
    exit 2
fi
mkdir -p "$work"
if [[ ! -d "$upstream/.git" ]]; then
    git clone --no-checkout https://github.com/SamCoVT/TaliForth2.git "$upstream"
fi
if ! git -C "$upstream" cat-file -e "$commit^{commit}" 2>/dev/null; then
    git -C "$upstream" fetch origin "$commit"
fi
actual="$(git -C "$upstream" rev-parse HEAD 2>/dev/null || true)"
if [[ "$actual" != "$commit" ]]; then
    git -C "$upstream" checkout --detach "$commit"
fi
# Never silently compile edits to upstream tracked files, even with TALI_SOURCE.
if [[ -n "$(git -C "$upstream" status --porcelain --untracked-files=no)" ]]; then
    echo "Refusing modified upstream tracked files at $upstream" >&2
    exit 2
fi
cmp "$here/LICENSE.upstream" "$upstream/COPYING.txt"
mkdir -p "$upstream/platform/brickwright"
cp "$here/source/platform.asm" "$upstream/platform/brickwright/platform.asm"
"$assembler" --nostart --output "$work/tali-forth.rom" \
    --labels "$work/tali-forth.labels" \
    "$upstream/platform/brickwright/platform.asm"
python3 - "$work/tali-forth.rom" <<'PY'
from pathlib import Path
import hashlib, sys
p = Path(sys.argv[1])
b = p.read_bytes()
if len(b) != 32768:
    raise SystemExit(f"ROM size is {len(b)}, expected 32768")
pc = int.from_bytes(b[0x7ffc:0x7ffe], "little")
if not 0x8000 <= pc < 0xfffa:
    raise SystemExit(f"Invalid reset vector: {pc:#x}")
print(f"ROM {len(b)} bytes, reset {pc:#06x}, sha256 {hashlib.sha256(b).hexdigest()}")
PY
if [[ "$mode" == --write ]]; then
    cp "$work/tali-forth.rom" "$here/tali-forth.rom"
    echo 'Built tali-forth.rom; update the manifest hash only after proof passes.'
else
    cmp "$work/tali-forth.rom" "$here/tali-forth.rom"
    echo 'PASS: rebuilt ROM is byte-identical to the committed artifact.'
fi
