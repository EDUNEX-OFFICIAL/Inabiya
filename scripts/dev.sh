#!/usr/bin/env bash
# Local hot-reload on 3101/4101 so Docker prod can keep 3001/4001.
# Loads `.env` for secrets/DB, then overrides ports/URLs. Does not rewrite `.env`.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export NODE_ENV=development
export WEB_PORT=3101
export API_PORT=4101
export API_URL=http://127.0.0.1:4101
export API_REWRITE_URL=http://127.0.0.1:4101
export APP_URL=http://127.0.0.1:3101
export NEXT_PUBLIC_API_URL=same-origin
export COOKIE_SECURE=false

exec pnpm run --parallel --filter @inabiya/web --filter @inabiya/api --filter @inabiya/worker dev
