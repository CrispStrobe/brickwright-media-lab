#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
pin=e33587e356df8c069471516b70ab9b4ed4f571aa
if [ ! -d upstream/.git ]; then
  git clone --no-checkout https://github.com/eduardocasino/kim-1-programmable-memory-card.git upstream
fi
git -C upstream fetch origin "$pin"
git -C upstream checkout --detach "$pin"
test "$(git -C upstream rev-parse HEAD)" = "$pin"
