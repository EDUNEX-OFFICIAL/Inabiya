# Inabiya — Implementation Cross-Check

Last verified: **2026-07-28** (dev leftovers Waves 0–5 closed for Soft Gift ecommerce + CMS)

This document reconciles **Phases 0–12** claims in `Memory.md` against the repo.

---

## Summary

| Phase | Status | Verdict |
|---|---|---|
| **0** Platform | Closed | Complete — OpenAPI stub shipped (Wave 5) |
| **1** Identity | **Closed for dev** | Auth P0 + stubs done; **real SMTP/S3 = post-dev** |
| **2** Catalog | **Closed for dev** | Storefront + admin products MVP |
| **3** Checkout | **Closed for dev** | Mock pay revenue path accepted until Razorpay (post-dev) |
| **4** Ops console | Closed | Dashboard, CRM, CMS, fulfillment |
| **5** Reviews/returns/CX | Closed | + leftovers analytics/account |
| **6** Editorial workflow | Closed | |
| **7** Publishing | Closed | TipTap + public articles + writer pay |
| **8** Creator Collective | Closed | Reverse-bid → payment |
| **9** Hardening | **Closed (VPS-local)** | Rate limits, DR/load scripts, RUNBOOKS, SECURITY |
| **Waves 1–3** | **Closed** | Money/trust + Soft Gift UX + CMS ops |
| **10** Soft Gift Nav | **Closed** | Taxonomy, nav IA, 6-step builder, hampers, inquiries |
| **11** Marketing Page Builder | **Closed** | 11A–11D; Soft Gift `/gift` on blocks |
| **12** CMS TipTap + saleStrip + media | **Shipped** | TipTap, saleStrip, local media; real S3 SDK post-dev |

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
