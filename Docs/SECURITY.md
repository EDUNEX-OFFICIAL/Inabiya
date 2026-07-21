# Inabiya — Phase 9 Security / Pentest MVP Notes

Last updated: 2026-07-20  
Scope: VPS-local stack (loopback web/api). Not a formal third-party pentest.

## Findings → remediations

| ID | Severity | Finding | Status |
|---|---|---|---|
| S1 | High (if public) | Services bound to `127.0.0.1` only — not on `0.0.0.0` | **OK** — intentional; public needs Caddy |
| S2 | Medium | Auth brute force | **Fixed** — `RateLimitGuard` 20/15m/IP on login/register/refresh |
| S3 | Medium | Checkout abuse | **Fixed** — 60/min/IP on place-order |
| S4 | Medium | Missing security headers on API | **Fixed** — `SecurityHeadersMiddleware` |
| S5 | Low | Cookies `Secure` off on HTTP loopback | **Accepted** — set `COOKIE_SECURE=true` behind HTTPS |
| S6 | Medium | Default JWT secrets in `.env.example` | **Mitigated** — never commit `.env`; rotation runbook; residual risk if prod still uses `change-me` |
| S7 | Low | CORS allowlist | **OK** — `APP_URL` + localhost:3001 only |
| S8 | Info | Mock payments | **Accepted** until Razorpay post-project |
| S9 | Info | Email is log stub | **Accepted** — Phase 1 carry-over |
| S10 | Low | IDOR | Ownership checks on orders/returns/campaigns/articles — spot-checked; full pentest still recommended before public DNS |

## Residual risks (GA)

1. No public Caddy/HTTPS yet — do not expose host ports.
2. Razorpay not live — mock payment only.
3. Media signed URLs / password reset / real SMTP still open (Phase 1 carry-over).
4. Single-node VPS — no HA; backup + DR smoke required before public launch.
5. Formal external pentest not run — schedule before public GA.

## Verify

```bash
# Headers
curl -sI http://127.0.0.1:4001/api/v1/health | grep -iE 'x-content-type|x-frame|referrer|cache-control'

# Rate limit (should eventually 429)
for i in $(seq 1 25); do
  curl -sS -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:4001/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"email":"nobody@test.inabiya","password":"wrong"}'
done | sort | uniq -c
```
