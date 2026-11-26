#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
pin=0ce44974504514563e86cdf84ac8a9848b8bcdb5
if [ ! -d upstream/.git ]; then
  git clone --no-checkout https://github.com/CorshamTech/xKIM.git upstream
fi
git -C upstream fetch origin "$pin"
git -C upstream checkout --detach "$pin"
test "$(git -C upstream rev-parse HEAD)" = "$pin"
