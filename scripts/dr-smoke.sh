#!/usr/bin/env bash
# Phase 9 — DR smoke: backup then restore into a temporary database and drop it.
# Does NOT touch the live `inabiya` application database data beyond reading a dump.
# Usage: bash scripts/dr-smoke.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
CONTAINER="${POSTGRES_CONTAINER:-inabiya-postgres}"
USER_NAME="${POSTGRES_USER:-inabiya}"
SRC_DB="${POSTGRES_DB:-inabiya}"
DR_DB="${DR_DB:-inabiya_dr_smoke}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${BACKUP_DIR:-$REPO/backups}"
DUMP="$OUT_DIR/dr-smoke-$STAMP.dump"

mkdir -p "$OUT_DIR"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "error: container $CONTAINER not running" >&2
  exit 1
fi

echo "==> 1/4 backup $SRC_DB → $DUMP"
docker exec "$CONTAINER" pg_dump -U "$USER_NAME" -d "$SRC_DB" -Fc > "$DUMP"
ls -lh "$DUMP"

echo "==> 2/4 recreate $DR_DB"
docker exec -i "$CONTAINER" psql -U "$USER_NAME" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DR_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $DR_DB;
CREATE DATABASE $DR_DB OWNER $USER_NAME;
SQL

echo "==> 3/4 restore into $DR_DB"
docker exec -i "$CONTAINER" pg_restore -U "$USER_NAME" -d "$DR_DB" --no-owner --role="$USER_NAME" < "$DUMP"

echo "==> 4/4 verify + drop $DR_DB"
USERS=$(docker exec "$CONTAINER" psql -U "$USER_NAME" -d "$DR_DB" -tAc 'SELECT count(*) FROM users')
echo "users_in_dr_db=$USERS"
[[ "${USERS:-0}" -ge 1 ]]

docker exec -i "$CONTAINER" psql -U "$USER_NAME" -d postgres -v ON_ERROR_STOP=1 <<SQL
DROP DATABASE IF EXISTS $DR_DB;
SQL

echo "==> DR smoke OK (live $SRC_DB untouched)"
