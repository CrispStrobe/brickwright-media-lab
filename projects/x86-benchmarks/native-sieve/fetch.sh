#!/bin/sh
# The source is owned and committed in media-lab; build only on explicit request.
set -eu
here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
exec "$here/build.sh" "$@"
