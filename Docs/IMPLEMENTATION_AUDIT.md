# Inabiya — Implementation Cross-Check

Last verified: **2026-07-21** (Phase 10 closed; Phase 11A–11C page builder shipped)

This document reconciles **Phases 0–9** claims in `Memory.md` against the repo, plus post-GA waves / Phase 10–11.

---

## Summary

| Phase | Status | Verdict |
|---|---|---|
| **0** Platform | Closed | Complete |
| **1** Identity | Partial | Auth P0 done; media/reset/flags/email deferred |
| **2** Catalog | Partial close | Storefront + admin products MVP |
| **3** Checkout | Partial close | Mock pay revenue path |
| **4** Ops console | Closed | Dashboard, CRM, CMS, fulfillment |
| **5** Reviews/returns/CX | Closed | + leftovers analytics/account |
| **6** Editorial workflow | Closed | |
| **7** Publishing | Closed | TipTap + public articles + writer pay |
| **8** Creator Collective | Closed | Reverse-bid → payment |
| **9** Hardening | **Closed (VPS-local)** | Rate limits, DR/load scripts, RUNBOOKS, SECURITY |
| **Waves 1–3** | **Closed** | Money/trust + Soft Gift UX + CMS ops (smoked 2026-07-21) |
| **10** Soft Gift Nav | **Closed** | Taxonomy, nav IA, 6-step builder, hampers, inquiries — `SOFT_GIFT_HOMEPAGE_REFERENCE.md` |
| **11** Marketing Page Builder | **11A–11C done** | Live productGrid + draft preview; 11D optional — `CMS_PAGE_BUILDER.md` |

---

## Phase 9 evidence

| Item | Evidence |
|---|---|
| Rate limits | `apps/api/src/common/guards/rate-limit.guard.ts` |
| Security headers | `security-headers.middleware.ts` + `apps/web/next.config.js` |
| Backup / DR | `scripts/backup-postgres.sh`, `scripts/dr-smoke.sh` |
| Load smoke | `scripts/phase9-load-smoke.sh` |
| Runbooks / launch | `Docs/RUNBOOKS.md` |
| Pentest MVP | `Docs/SECURITY.md` |
| Ops UI | `/admin/platform` |

---

## Live endpoints (loopback)

| Service | URL |
|---|---|
| Web | http://127.0.0.1:3001 |
| API | http://127.0.0.1:4001/api/v1 |

---

## Deferred backlog (post Phase 9)

1. Razorpay — after project complete  
2. Phase 1: password reset, media, email, feature flags  
3. Public domain / Caddy / `COOKIE_SECURE=true`  
4. Formal external pentest before public GA  
5. Real on-call contacts  
6. Soft Gift homepage pixel polish — **not required**; nav-first functional Phase 10 instead  
7. Phase 11 marketing page builder — **11A–11C shipped**; 11D optional; see `CMS_PAGE_BUILDER.md` §12 future backlog (TipTap on richText, saleStrip, media upload)  
8. Deep re-audit: ecommerce + CMS; then Creator Collective (+ remaining core) — **queued**, not this session  
9. Soft Gift storefront visual redesign — **Plush Clay Waves 1–3 shipped** (mobile-first customer UI); optional further polish later  
10. Editorial: TipTap toolbar only on editable statuses — document for QA (not a bug on PUBLISHED)
