# Inabiya — Launch & Ops Runbooks (Phase 9)

Last updated: 2026-07-20  
Status: **Phase 9 closeout — VPS-local launch readiness signed**

## 1. Launch checklist (sign-off)

| # | Item | Owner | Done |
|---|---|---|---|
| 1 | Health `/api/v1/health` + `/ready` green on VPS | Eng | **x** 2026-07-20 |
| 2 | Migrate + seed smoke accounts work | Eng | **x** |
| 3 | Gift checkout paid path (mock) | Eng | **x** (prior phases) |
| 4 | Editorial publish → public article | Eng | **x** |
| 5 | Creator reverse-bid → payment release | Eng | **x** |
| 6 | Auth rate limits verified (429 after burst) | Eng | **x** (`Docs/SECURITY.md`) |
| 7 | Postgres backup drill completed | Ops/Eng | **x** (`scripts/backup-postgres.sh`) |
| 8 | Secrets not in git; `.env` rotation noted | Ops/Eng | **x** (runbook §4; verify prod secrets ≠ example) |
| 9 | On-call owner named | Lead | **x** — Primary: VPS Eng (`/srv/Inabiya`); Backup: Project Lead — update contacts before public DNS |
| 10 | Residual risks logged in `Memory.md` | Eng | **x** |
| 11 | Public domain + Caddy HTTPS (if launch needs public) | Ops | **Deferred** — VPS-local GA only |
| 12 | Razorpay live (deferred until after project) | Product | **N/A** until post-project |

**Launch package (Q7 resolved for Phase 9):** VPS-local GA surface = **Commerce + Editorial + Creator MVP**. Public internet launch still blocked on Caddy/HTTPS + Razorpay + formal pentest.

**Sign-off:** Eng — 2026-07-20 — Phase 9 exit for VPS-local readiness.

## 2. SLOs (initial)

| Signal | Target |
|---|---|
| API availability (`/ready`) | 99% monthly (VPS single-node) |
| p95 checkout place-order | < 2s (mock payment) |
| Queue lag (BullMQ) | < 5 min for email stubs |
| Auth lockout | 20 attempts / 15 min / IP |
| Load smoke | `scripts/phase9-load-smoke.sh` zero unexpected failures |

## 3. Backup / restore drill (Postgres)

```bash
bash scripts/backup-postgres.sh
bash scripts/dr-smoke.sh   # restore into temp DB, verify, drop — live DB untouched
```

## 4. Secret rotation

1. Generate new `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / DB password offline (≥32 chars).
2. Update `/srv/Inabiya/.env` (never commit).
3. `bash scripts/deploy-vps.sh api worker` (and web if public env changed).
4. Refresh tokens invalidate after secret change — users re-login.
5. Log rotation date in Memory session log.

## 5. Runbook — payment webhook failures

- Mock path: `POST /api/v1/webhooks/payments/mock`
- Idempotency: `payment_webhook_events` unique `(provider, eventId)`
- If order stuck PENDING: check API logs for fulfillment errors; re-send webhook with same `eventId` only if safe; else new eventId after fixing root cause.
- Stock: FAILED releases reservation; do not double-commit.

## 6. Runbook — queue backlog

- Worker: `docker logs inabiya-worker --tail 200`
- Redis: `docker exec inabiya-redis redis-cli ping`
- Restart: `docker compose -f docker-compose.yml -f docker-compose.prod.yml restart worker`
- Jobs are stubs (email log); backlog is low-risk for MVP.

## 7. Runbook — rollback

1. Note current image tag / `GIT_COMMIT` from container labels or Memory.
2. `git checkout <known-good>` in `/srv/Inabiya` **or** redeploy previous image tag.
3. `bash scripts/deploy-vps.sh api web worker`
4. If migration irreversible: restore DB dump from §3 before app rollback.
5. Verify `/ready` + one smoke path (login + health).

## 8. On-call

| Role | Contact | Notes |
|---|---|---|
| Primary | VPS Eng — `/srv/Inabiya` owner | Replace with name/phone before public DNS |
| Backup | Project Lead | Same |

## 9. PII / GDPR MVP notes

- Auth stores email + password hash; no card PAN/CVV.
- Audit logs: no tokens/passwords (redaction in pino).
- Deletion: soft-delete product later; for now support ticket + manual DB purge with backup.
- Newsletter: email only in `newsletter_signups`.

## 10. Related docs

- `Docs/SECURITY.md` — pentest MVP findings + remediations
- `scripts/phase9-load-smoke.sh` — concurrent hot-path smoke
- `scripts/dr-smoke.sh` — backup/restore DR smoke
