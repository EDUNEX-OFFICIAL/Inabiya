#!/usr/bin/env bash
# Postgres backup for Inabiya (Phase 9).
# Usage: bash scripts/backup-postgres.sh
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${BACKUP_DIR:-$REPO/backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$OUT_DIR/inabiya-$STAMP.dump"
CONTAINER="${POSTGRES_CONTAINER:-inabiya-postgres}"
USER_NAME="${POSTGRES_USER:-inabiya}"
DB_NAME="${POSTGRES_DB:-inabiya}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "error: container $CONTAINER not running" >&2
  exit 1
fi

echo "==> dumping $DB_NAME from $CONTAINER → $FILE"
docker exec "$CONTAINER" pg_dump -U "$USER_NAME" -d "$DB_NAME" -Fc > "$FILE"
ls -lh "$FILE"
echo "==> done"
