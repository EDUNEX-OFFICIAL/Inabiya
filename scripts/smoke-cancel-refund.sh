#!/usr/bin/env bash
# Smoke: admin cancel + mock refund + restock (Phase 4 P1)
# Usage: bash scripts/smoke-cancel-refund.sh
set -euo pipefail
API="${API_URL:-http://127.0.0.1:4001}/api/v1"

login() {
  curl -sf "$API/auth/login" -H 'content-type: application/json' \
    -d "{\"email\":\"$1\",\"password\":\"Password123!\"}" \
    | python3 -c 'import sys,json; print(json.load(sys.stdin)["tokens"]["accessToken"])'
}

COMMERCE_TOKEN=$(login commerce@test.inabiya)

ORDER_ID=$(curl -sf "$API/admin/orders" -H "authorization: Bearer $COMMERCE_TOKEN" \
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

BEFORE=$(curl -sf "$API/admin/orders/$ORDER_ID" -H "authorization: Bearer $COMMERCE_TOKEN")
echo "Canceling $ORDER_ID ..."
AFTER=$(curl -sf -X POST "$API/admin/orders/$ORDER_ID/cancel" -H "authorization: Bearer $COMMERCE_TOKEN")

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
