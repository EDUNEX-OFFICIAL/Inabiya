#!/usr/bin/env bash
# Phase 9 — light concurrent smoke/load against hot paths.
# Usage: bash scripts/phase9-load-smoke.sh
set -euo pipefail

API="${API_URL:-http://127.0.0.1:4001}/api/v1"
WEB="${APP_URL:-http://127.0.0.1:3001}"
CONCURRENCY="${CONCURRENCY:-20}"
ROUNDS="${ROUNDS:-3}"

echo "==> load smoke API=$API WEB=$WEB concurrency=$CONCURRENCY rounds=$ROUNDS"

fail=0
hit() {
  local url="$1"
  local code
  code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$url" || echo 000)
  if [[ "$code" != "200" && "$code" != "401" && "$code" != "404" ]]; then
    echo "FAIL $code $url"
    fail=$((fail + 1))
  fi
}

for ((r = 1; r <= ROUNDS; r++)); do
  echo "-- round $r"
  for ((i = 0; i < CONCURRENCY; i++)); do
    hit "$API/health" &
    hit "$API/ready" &
    hit "$API/catalog/products" &
    hit "$API/creator/marketplace" &
    hit "$API/articles" &
    hit "$WEB/gift" &
    hit "$WEB/creator" &
  done
  wait
done

# Authenticated hot path sample
TOKEN=$(curl -sS -X POST "$API/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"customer@test.inabiya","password":"Password123!"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["tokens"]["accessToken"])')

code=$(curl -sS -o /dev/null -w '%{http_code}' -H "Authorization: Bearer $TOKEN" "$API/orders/me")
[[ "$code" == "200" ]] || { echo "FAIL orders/me $code"; fail=$((fail + 1)); }

echo "==> failures=$fail"
[[ "$fail" -eq 0 ]]
echo "==> load smoke OK"
