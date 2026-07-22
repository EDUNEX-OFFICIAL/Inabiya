#!/usr/bin/env bash
set -euo pipefail
cd /srv/Inabiya
# shellcheck disable=SC1091
source .env
API="${API_URL:-http://127.0.0.1:4001}/api/v1"
# Prefer loopback docker ports
API="http://127.0.0.1:4001/api/v1"
WEB="http://127.0.0.1:3001"
FAIL=0

pass() { echo "PASS: $*"; }
fail() { echo "FAIL: $*"; FAIL=$((FAIL + 1)); }

echo "== health =="
curl -fsS "$API/health" >/dev/null && pass health || fail health
curl -fsS "$API/ready" >/dev/null && pass ready || fail ready

echo "== gift-chrome =="
CHROME=$(curl -fsS "$API/catalog/gift-chrome")
echo "$CHROME" | python3 -c '
import sys,json
d=json.load(sys.stdin)
assert len(d.get("shopLinks") or [])>=1
assert len(d.get("forWhomLinks") or [])>=1
assert d.get("footer")
print("chrome ok")
' && pass gift-chrome || fail gift-chrome

echo "== home cms =="
HOME=$(curl -fsS "$API/cms/pages/home")
echo "$HOME" | python3 -c '
import sys,json
p=json.load(sys.stdin)
types=[b["type"] for b in p["blocks"]]
assert "hero" in types and "brandStrip" in types and "footer" in types
hero=next(b for b in p["blocks"] if b["type"]=="hero")
bs=next(b for b in p["blocks"] if b["type"]=="brandStrip")
assert hero["props"].get("trustLine")
brands=bs["props"]["brands"]
assert isinstance(brands,list) and brands
assert all(isinstance(b,dict) and b.get("name") and b.get("logoUrl") for b in brands)
assert bs["props"].get("usps")
print("home ok", types)
' && pass home-cms || fail home-cms

echo "== 404 =="
CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$API/cms/pages/nope-xyz")
[[ "$CODE" == "404" ]] && pass "missing slug 404" || fail "missing slug got $CODE"

echo "== corporate =="
curl -fsS "$API/cms/pages/corporate-gifting" | python3 -c '
import sys,json
p=json.load(sys.stdin)
assert p.get("blocks")
print("corporate", [b["type"] for b in p["blocks"]])
' && pass corporate || fail corporate

echo "== admin authz =="
CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$API/admin/commerce/gift-chrome")
[[ "$CODE" == "401" || "$CODE" == "403" ]] && pass "gift-chrome unauth $CODE" || fail "gift-chrome unauth got $CODE"

echo "== chrome write + restore =="
TOK=$(curl -fsS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"commerce@test.inabiya","password":"Password123!"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["tokens"]["accessToken"])')

CODE=$(curl -sS -o /tmp/gc_bad.json -w '%{http_code}' -X POST "$API/admin/commerce/gift-chrome" \
  -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"shopLinks":[{"href":"","label":"x"}]}')
[[ "$CODE" == "400" ]] && pass "invalid chrome rejected $CODE" || fail "invalid chrome got $CODE $(head -c 120 /tmp/gc_bad.json)"

curl -fsS -X POST "$API/admin/commerce/gift-chrome" \
  -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"shopMega":{"headline":"Edge test hamper"}}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d["shopMega"]["headline"]=="Edge test hamper"' \
  && pass chrome-patch || fail chrome-patch

curl -fsS -X POST "$API/admin/commerce/gift-chrome" \
  -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"shopMega":{"headline":"Build or pick a hamper"}}' >/dev/null

echo "== web gift =="
HTML=$(curl -fsS "$WEB/gift")
echo "$HTML" | grep -q gift-brand-marquee && pass marquee || fail marquee
echo "$HTML" | grep -q gift-usp__label && pass usp || fail usp
COUNT=$(echo "$HTML" | grep -o '<footer ' | wc -l | tr -d ' ')
[[ "$COUNT" == "1" ]] && pass "footer once ($COUNT)" || fail "footer count=$COUNT (want 1)"

# logos referenced
echo "$HTML" | grep -q '/gift/brands/mamaearth.svg' && pass brand-logo-src || fail brand-logo-src
CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$WEB/gift/brands/mamaearth.svg")
[[ "$CODE" == "200" ]] && pass brand-logo-asset || fail "brand logo asset $CODE"

CODE=$(curl -sS -o /dev/null -w '%{http_code}' "$WEB/gift/corporate")
[[ "$CODE" == "200" ]] && pass corporate-page || fail "corporate-page $CODE"

echo "== zod edge cases =="
node <<'NODE'
const { pageBlockInputSchema, giftChromeBodySchema } = require('./packages/validation/dist/index.js');
const checks = [];
function check(name, ok) {
  checks.push([name, ok]);
  console.log((ok ? 'PASS' : 'FAIL') + ': zod ' + name);
}
check('brandStrip empty brands', pageBlockInputSchema.safeParse({ type: 'brandStrip', props: { title: 'T', brands: [], showUsps: false } }).success);
check('brand logo object', pageBlockInputSchema.safeParse({ type: 'brandStrip', props: { brands: [{ name: 'X', logoUrl: '/gift/brands/x.svg' }] } }).success);
check('bad usp icon rejected', !pageBlockInputSchema.safeParse({ type: 'brandStrip', props: { usps: [{ label: 'A', icon: 'nope' }] } }).success);
check('footer block', pageBlockInputSchema.safeParse({ type: 'footer', props: { brandName: 'Inabiya', columns: [{ title: 'Shop', links: [{ label: 'A', href: '/gift' }] }] } }).success);
check('empty href chrome rejected', !giftChromeBodySchema.safeParse({ shopLinks: [{ label: 'x', href: '' }] }).success);
check('hero trust+eyebrow', pageBlockInputSchema.safeParse({ type: 'hero', props: { headline: 'Hi', trustLine: 'A · B · C', eyebrow: 'Eyebrow' } }).success);
check('recipient imageUrl', pageBlockInputSchema.safeParse({ type: 'recipientSplit', props: { left: { label: 'g', href: '/g', imageUrl: '/x.jpg' }, right: { label: 'b', href: '/b' } } }).success);
if (checks.some(([, ok]) => !ok)) process.exit(1);
NODE
[[ $? -eq 0 ]] && pass zod || fail zod

echo
if [[ "$FAIL" -eq 0 ]]; then
  echo "ALL EDGE CHECKS PASSED"
  exit 0
fi
echo "$FAIL CHECK(S) FAILED"
exit 1
