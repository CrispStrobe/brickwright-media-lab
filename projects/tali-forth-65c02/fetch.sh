#!/usr/bin/env bash
# Fetch the pinned source and reproduce the committed ROM byte-for-byte.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
exec "$here/build.sh" --verify
