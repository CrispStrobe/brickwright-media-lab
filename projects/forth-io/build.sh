#!/usr/bin/env bash
# Reproduce FORTH-IO.EXE — the DOS-native Forth (projects/forth-dos) with a GPIO
# bridge: two words that drive the machine's I/O ports. `pin! ( pin value -- )`
# does an 8086 OUT to port BW_GPIO_BASE+pin; `pin@ ( pin -- value )` does an IN.
# The bw-board 8086 bench fires machine.hooks.onPortAccess on every OUT/IN, so a
# generated Forth word can drive a device register — the "drive the board"
# bridge (see docs/CODE-TAB-LANGUAGE-DEVICE-BRIDGE.md in brickwright-lite).
#
# Identical to forth-dos except the front-end (iomain.c): same zForth at the
# same pin, same ia16-elf-gcc medium-model build. The prebuilt binary is
# committed so the manifest runs without a toolchain.
set -euo pipefail
cd "$(dirname "$0")"
here="$(pwd)"

ZF_REPO="https://github.com/zevv/zForth.git"
ZF_COMMIT="41db72d165c1539d57f3f79970fc57ea881a79dc"
CC="${IA16_GCC:-ia16-elf-gcc}"
work="${ZF_WORK:-$here/.zforth-build}"
mkdir -p "$work"

if [ ! -d "$work/zForth/.git" ]; then git clone "$ZF_REPO" "$work/zForth"; fi
git -C "$work/zForth" fetch --depth 1 origin "$ZF_COMMIT" || true
git -C "$work/zForth" checkout -q "$ZF_COMMIT"

cp "$here/iomain.c" "$work/zForth/iomain.c"

# Embed ONLY the language bootstrap (forth/core.zf); the GPIO words pin!/pin@
# are a prelude inside iomain.c, so no demo/library .zf is embedded.
python3 - "$work/zForth" <<'PY'
import sys
root = sys.argv[1]
out = []
for line in open(root + '/forth/core.zf', encoding='utf-8'):
	line = line.rstrip('\n')
	esc = line.replace('\\', '\\\\').replace('"', '\\"')
	out.append('"%s\\n"' % esc)
open(root + '/bootstrap.inc', 'w').write('static const char BOOTSTRAP[] =\n' + '\n'.join(out) + ';\n')
PY

( cd "$work/zForth" && "$CC" -mcmodel=medium -march=any_186 -O2 -Wall \
	-I src/zforth -I src/linux \
	iomain.c src/zforth/zforth.c -o "$here/FORTH-IO.EXE" )

echo "Built. sha256 of the shipped binary:"
sha256sum "$here/FORTH-IO.EXE"
echo "expected:"
echo "704ddb779937bf84b806c442701a17e2e021863320aa50418e873d624208df22  FORTH-IO.EXE"
