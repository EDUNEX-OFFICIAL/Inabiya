#!/usr/bin/env bash
# Fast VPS deploy: BuildKit cache + path-aware rebuild of web/api/worker.
# Usage: bash scripts/deploy-vps.sh [web|api|worker ...]
# Env: FORCE_ALL=1 rebuild everything; SKIP_SMOKE=1 skip curl checks
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export GIT_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo latest)"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

if [ ! -f "$REPO/.env" ]; then
  echo "error: missing $REPO/.env — copy from .env.example and set production values" >&2
  exit 1
fi

if ! docker network inspect vps_edge >/dev/null 2>&1; then
  echo "==> creating external network vps_edge"
  docker network create vps_edge
fi

# Ensure infra is up first (postgres/redis)
echo "==> infra up (postgres redis)"
"${COMPOSE[@]}" up -d postgres redis

pick_services() {
  if [ "${FORCE_ALL:-0}" = "1" ] || [ "$#" -gt 0 ]; then
    if [ "$#" -gt 0 ]; then
      echo "$*"
      return
    fi
    echo "web api worker"
    return
  fi

  local before="${DEPLOY_BEFORE_SHA:-}"
  local after
  after="$(git rev-parse HEAD)"
  if [ -z "$before" ] || [ "$before" = "$after" ]; then
    echo "web api worker"
    return
  fi

  local changed
  changed="$(git diff --name-only "$before" "$after" || true)"
  if [ -z "$changed" ]; then
    echo "web api worker"
    return
  fi

  local need_web=0 need_api=0 need_worker=0 need_all=0
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
      pnpm-lock.yaml|package.json|pnpm-workspace.yaml|tsconfig.base.json|docker-compose.yml|docker-compose.prod.yml|.dockerignore)
        need_all=1
        ;;
      apps/web/Dockerfile|apps/api/Dockerfile|apps/worker/Dockerfile)
        need_all=1
        ;;
      apps/web/*|packages/types/*|packages/validation/*|packages/config/*)
        need_web=1
        ;;
      apps/api/*|prisma/*)
        need_api=1
        ;;
      apps/worker/*)
        need_worker=1
        ;;
      packages/*)
        need_web=1
        need_api=1
        ;;
    esac
  done <<<"$changed"

  if [ "$need_all" = "1" ]; then
    echo "web api worker"
    return
  fi

  local out=()
  [ "$need_web" = "1" ] && out+=(web)
  [ "$need_api" = "1" ] && out+=(api)
  [ "$need_worker" = "1" ] && out+=(worker)
  if [ "${#out[@]}" -eq 0 ]; then
    echo "web api worker"
  else
    echo "${out[*]}"
  fi
}

SERVICES="$(pick_services "$@")"
# shellcheck disable=SC2206
SERVICE_ARR=($SERVICES)

echo "==> Deploying Inabiya @ ${GIT_COMMIT}"
echo "==> Building: ${SERVICE_ARR[*]}"
"${COMPOSE[@]}" build --parallel "${SERVICE_ARR[@]}"

echo "==> Recreating: ${SERVICE_ARR[*]}"
"${COMPOSE[@]}" up -d --remove-orphans --force-recreate --no-deps "${SERVICE_ARR[@]}"
# Bring full graph if api/web deps need healthy postgres
"${COMPOSE[@]}" up -d --remove-orphans

if printf ' %s ' "${SERVICE_ARR[@]}" | grep -q ' api '; then
  echo "==> Prisma migrate deploy"
  "${COMPOSE[@]}" run --rm --no-deps \
    -e DATABASE_URL="postgresql://${POSTGRES_USER:-inabiya}:${POSTGRES_PASSWORD:-inabiya}@postgres:5432/${POSTGRES_DB:-inabiya}?schema=public" \
    api \
    sh -c 'cd /repo && pnpm exec prisma migrate deploy --schema=prisma/schema.prisma' \
    || "${COMPOSE[@]}" exec -T api sh -c 'cd /repo && pnpm exec prisma migrate deploy --schema=prisma/schema.prisma'
fi

if [ "${SKIP_SMOKE:-0}" != "1" ]; then
  echo "==> Smoke checks"
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if curl -fsS "http://127.0.0.1:4001/api/v1/health" >/dev/null 2>&1; then
      break
    fi
    sleep 5
  done
  curl -fsS "http://127.0.0.1:4001/api/v1/health"
  echo
  curl -fsS "http://127.0.0.1:4001/api/v1/ready" || true
  echo
  curl -fsSI "http://127.0.0.1:3001" | head -1
fi

echo "==> Done"
"${COMPOSE[@]}" ps
