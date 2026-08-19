# Inabiya — Implementation Cross-Check

Last verified: **2026-08-19** (client UAT shop/ops/CMS; next product = Editorial). Prior Phase 13 cross-check: **2026-07-29**.

This document reconciles phase claims in `Memory.md` against the repo.  
Authority for Phase 13 detail: [`COMMERCE_OPS_PANEL.md`](COMMERCE_OPS_PANEL.md) v2.0.0.

---

## Summary

| Phase | Status | Verdict |
|---|---|---|
| **0** Platform | Closed | Complete — OpenAPI stub shipped (Wave 5) |
| **1** Identity | **Closed for dev** | Auth P0 + stubs done; **real SMTP/S3 = post-dev** |
| **2** Catalog | **Closed for dev** | Storefront + admin products MVP |
| **3** Checkout | **Closed for dev** | Mock pay revenue path accepted until Razorpay (post-dev) |
| **4** Ops console | Closed (MVP) | Dashboard, CRM, CMS, fulfillment — **deepened by Phase 13** |
| **5** Reviews/returns/CX | Closed | + leftovers analytics/account |
| **6** Editorial workflow | Closed | |
| **7** Publishing | Closed | TipTap + public articles + writer pay |
| **8** Creator Collective | Closed | Reverse-bid → payment |
| **9** Hardening | **Closed (VPS-local)** | Rate limits, DR/load scripts, RUNBOOKS, SECURITY |
| **Waves 1–3** | **Closed** | Money/trust + Soft Gift UX + CMS ops |
| **10** Soft Gift Nav | **Closed** | Taxonomy, nav IA, 6-step builder, hampers, inquiries |
| **11** Marketing Page Builder | **Closed** | 11A–11D; Soft Gift `/gift` on blocks |
| **12** CMS TipTap + saleStrip + media | **Shipped** | TipTap, saleStrip, local media; real S3 SDK post-dev |
| **13** Commerce OPS Panel | **P0 Closed** | OPS-0…9 shipped; P1 leftovers listed below |
| **14** Procurement OPS-10 | **Paused** | S0–S3 in repo; not client-next (2026-08-19) |
| **15** Editorial client-ready | **E0 shipped** | Shell + journal + categories/specialists admin |

Client testing (2026-08-19): storefront + Commerce Ops + CMS. Next product: Journal before Creator campaigns.

---

## Wave 0 QA smoke (2026-07-28 loopback)

Base: web `http://127.0.0.1:3001` · API `http://127.0.0.1:4001/api/v1`

| Area | Result | Notes |
|---|---|---|
| `/gift` home + nav markers | Pass | Build Your Box, Hampers, Shop by Age, Cart |
| PLP / toys filter / PDP | Pass | 200; catalog lists 5 products |
| BYB `/gift/build-your-box` | Pass | 200 |
| `/gift/hampers` | **Fail → fixed Wave 0b** | Was 404; nav uses `?hamper=1` — add redirect |
| Corporate / cart / wishlist / login | Pass | 200 |
| Auth login + bad password | Pass | tokens; bad → 401 |
| Customer `/auth/me`, `/orders/me` | Pass | 200 |
| Admin CMS pages list | Pass | 200; includes `home` |
| Admin catalog | Pass | `/api/v1/admin/catalog/products` |

Full manual matrix: [`QA_ECOMMERCE_CMS_TEST_CASES.md`](QA_ECOMMERCE_CMS_TEST_CASES.md) §6.

### Wave 0b defect queue

| Sev | Defect | Disposition |
|---|---|---|
| P1 | `/gift/hampers` 404 (QA EC-22 legacy URL) | Redirect → `/gift/products?hamper=1` |

No P0 money/AuthZ defects found in smoke.

---

## Live endpoints (loopback)

| Service | URL |
|---|---|
| Web | http://127.0.0.1:3001 |
| API | http://127.0.0.1:4001/api/v1 |

---

## Post-dev backlog (third-party / public GA — do not implement in leftovers)

1. Razorpay — replace mock pay after project complete  
2. Real SMTP / SES / Resend  
3. Real AWS/MinIO SDK behind storage adapter  
4. Public domain / Caddy / `COOKIE_SECURE=true`  
5. Formal external pentest before public GA  
6. Real on-call contacts  

## Dev leftovers track — **CLOSED 2026-07-28**

1. ~~Product SEO + per-product FAQs~~  
2. ~~Invoice model + local PDF~~ (pdfkit already; snapshot model added)  
3. ~~Mock payment UX clarity~~  
4. ~~CMS `countdown` block~~  
5. ~~OpenAPI stub + docs closeout~~  

Post-dev stubs unchanged: Razorpay, real S3/MinIO, real SMTP, public Caddy/DNS, formal pentest.

## Other deferred (not this track)

- Soft Gift homepage pixel polish — **not required**  
- Gift cards / loyalty / referral (PRD Stage 4)  
- Editorial P1 related/comments/RSS; Creator deep audit  
- Editorial: TipTap toolbar only on editable statuses — expected, not a bug  

---

## Phase 13 — Commerce OPS Panel (2026-07-29)

**Claim (Memory):** OPS-0…9 shipped; Soft Gift dense ops desk (`gift` + `compact`); no `data-theme="admin"`.  
**Verdict:** **P0 Closed** — each OPS has matching UI + API evidence in repo. Not “product forever complete”: P1 items + post-dev providers remain.

### Per-OPS evidence

| OPS | Verdict | Repo evidence (representative) |
|---|---|---|
| **OPS-0** Shell & IA | **Pass** | `commerce-ops-shell.tsx`, `commerce-ops-nav.ts` (+ role check), layout `data-theme="gift"` |
| **OPS-1** Command center | **Pass** | `admin/commerce/page.tsx`, `ops-dashboard.service.ts` KPIs/alerts |
| **OPS-4** Order desk | **Pass** | orders list/board + case file; migration `20260729190000_ops4_order_shipping` |
| **OPS-3** Inventory | **Pass** | inventory desk + `InventoryMovement`; migration `20260729193000_ops3_inventory_movements` |
| **OPS-2** Catalog | **Pass** | products power-table + categories + merchandising polish; admin list `?q`/`?status` |
| **OPS-5** CRM & support | **Pass** | customers LTV/segments + 360; support phone search; `assertActiveForCheckout` |
| **OPS-6** Promotions | **Pass** | coupons builder/schedule; `couponLifecycle` + audit create/deactivate (admin preview removed) |
| **OPS-7** Reports | **Pass** | reports gallery; `/reports/sales|products|inventory|returns|coupons`; CSV export (paise) |
| **OPS-8** Settings & trust | **Pass** | `/admin/commerce/policy` + audit list; return window → returns eligibility path |
| **OPS-9** Power-user | **Pass (P0)** | shortcuts/`?` help; pin views; order bulk PROCESSING; `/admin/commerce/import` dry-run |

### Runnable checks present

- `commerce-ops-nav.check.ts`
- `customer-segments.check.ts`
- `coupon-lifecycle.check.ts`
- `ops3-inventory-available.check.ts` / `inventory-csv-parse.check.ts`
- `ops4-address-risk.check.ts`
- `reports-delta.check.ts`

### Honest gaps (do **not** mark as shipped)

| Item | OPS | Severity |
|---|---|---|
| Reservation visibility from open orders | OPS-3 | **Closed 2026-08-11** (`GET …/reservations`, PENDING_PAYMENT) |
| Communication log stub | OPS-5 | **Closed 2026-08-11** (`CustomerCommunicationLog`, log-only) |
| Promo conflict/priority UI | OPS-6 | **Closed 2026-08-11** (scope+schedule overlap chips; no priority schema) |
| Product CSV import (stock CSV only) | OPS-9 | **Closed 2026-08-11** (`POST /admin/catalog/products/import`, Import tab) |
| Customers cursor pagination | OPS-9 | **Closed 2026-08-11** (keyset + `users(created_at,id)`) |
| Partial shipment | OPS-4 | later |
| Scheduled report email | OPS-7 | P2 |
| Multi-warehouse / bin WMS | — | **out of scope** |
| Real Razorpay / SMTP / S3 / public DNS | — | **post-dev** |

### Theme / AuthZ spot-check

| Check | Result |
|---|---|
| No `data-theme="admin"` on commerce ops | Pass (contract + shell use Soft Gift) |
| Money as `*Paise` in report/order APIs | Pass (integer paise) |
| Support cannot suspend / cannot see catalog nav | Pass (Roles + nav filter check) |
| Suspend blocks checkout | Pass (`ACCOUNT_SUSPENDED`) |
| Inventory adjust cannot drive available &lt; 0 | Pass (service + ledger) |

### Relation to Phase 4

Phase 4 ops console MVP remains **Closed**. Phase 13 did **not** replace stack or theme; it deepened queues, inventory ledger, CRM, promotions, reports, policy/audit, and power-user tooling under the same Soft Gift dense admin.

### Smoke note (this verification)

**Static + typecheck evidence only** on 2026-07-29 (files/symbols/migrations present; `tsc` green earlier in session).  
Full browser matrix not re-run in this audit pass — use [`QA_ECOMMERCE_CMS_TEST_CASES.md`](QA_ECOMMERCE_CMS_TEST_CASES.md) + ops demo scripts when doing live QA.
