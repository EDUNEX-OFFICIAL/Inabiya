#!/usr/bin/env bash
# Smoke: admin cancel + mock refund + restock (Phase 4 P1)
# Usage: bash scripts/smoke-cancel-refund.sh
set -euo pipefail
API="${API_URL:-http://127.0.0.1:4001}/api/v1"
CSRF='X-Requested-With: InabiyaWeb'
JAR=$(mktemp)
trap 'rm -f "$JAR"' EXIT

curl -sf -c "$JAR" -b "$JAR" "$API/auth/login" \
  -H 'content-type: application/json' -H "$CSRF" \
  -d '{"email":"commerce@test.inabiya","password":"Password123!"}' >/dev/null

ORDER_ID=$(curl -sf -b "$JAR" "$API/admin/orders" \
  | python3 -c '
import sys,json
rows=json.load(sys.stdin)
for o in rows:
  if o["status"] in ("PAID","PROCESSING"):
    print(o["id"]); break
')

if [[ -z "${ORDER_ID}" ]]; then
  echo "SKIP: no PAID/PROCESSING order to cancel (place+pay one first)"
  exit 0
fi

BEFORE=$(curl -sf -b "$JAR" "$API/admin/orders/$ORDER_ID")
echo "Canceling $ORDER_ID ..."
AFTER=$(curl -sf -b "$JAR" -H "$CSRF" -X POST "$API/admin/orders/$ORDER_ID/cancel")

python3 -c '
import json,sys
before, after = json.loads(sys.argv[1]), json.loads(sys.argv[2])
assert after["status"] == "CANCELLED", after["status"]
pay = after["paymentVerification"]
assert any(p["status"] == "REFUNDED" for p in pay) or not any(
  p["status"] == "CAPTURED" for p in before["paymentVerification"]
)
print("OK cancel+refund", after["orderNumber"], [p["status"] for p in pay])
' "$BEFORE" "$AFTER"
