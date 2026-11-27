#!/bin/sh
# Everything is original and committed here; no upstream media download is needed.
# Rebuild and verify the supplied ROM from the editable source.
set -eu
TASK_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec node "$TASK_DIR/build.mjs" --check "$@"
