#!/bin/sh
# MIT. Bounded regression/data checks only: no fetch, build or guest execution.
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
node --test "$here/ensure.test.mjs"
node "$here/proof.mjs"
python3 -B "$here/check-results.py" --self-test
