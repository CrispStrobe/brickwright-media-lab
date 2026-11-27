#!/usr/bin/env bash
# MIT. Build the exact assembler used by the reproducible 6502 lessons.
# Prints only the executable path on stdout; progress goes to stderr.
set -euo pipefail
version=1.60.3243
archive_name="64tass-$version-src.zip"
expected=9d83be3d23a2c55e085b7c7a7856c2f96080447ea120a6a8c21a217ed76427f0
work="${1:-${TMPDIR:-/tmp}/brickwright-64tass-$version}"
mkdir -p "$work"
work="$(cd "$work" && pwd)"
archive="$work/$archive_name"

if [[ ! -f "$archive" ]]; then
    download="$(mktemp "$work/download.XXXXXX")"
    trap 'rm -f "$download"' EXIT
    curl --fail --location --retry 3 \
        "https://downloads.sourceforge.net/project/tass64/source/$archive_name" \
        --output "$download" >&2
    printf '%s  %s\n' "$expected" "$download" | sha256sum --check >&2
    mv "$download" "$archive"
    trap - EXIT
fi
printf '%s  %s\n' "$expected" "$archive" | sha256sum --check >&2

# Extract afresh so a previous build's edited source cannot affect this build.
# The verified download is reused; no caller-owned source tree is overwritten.
build="$(mktemp -d "$work/build.XXXXXX")"
python3 -m zipfile --extract "$archive" "$build"
source_dir="$build/64tass-$version-src"
TMPDIR="$build" make -C "$source_dir" -j2 >&2
"$source_dir/64tass" --version >&2
printf '%s\n' "$source_dir/64tass"
