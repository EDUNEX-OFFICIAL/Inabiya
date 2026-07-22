# Inabiya
# Memory — Living Engineering Context

Version: 2.0.0

Status: Active (living document — update every session)

Document Owner: Active implementer (human or AI must keep this current)

Audience:
Engineers
AI Coding Assistants
Tech Leads
QA

Last Updated: July 22, 2026 (Phase 12 media library)

---

## 1. Why this file exists

`Memory.md` is the **working brain** for implementation continuity.

It prevents:

- Rework across chats/tools
- Re-reading 9k+ line PRD every session just to know “where we are”
- Silent phase skipping
- Lost decisions and blockers

It is **not** a second PRD. Keep entries concise, dated, and true.

### Session protocol (mandatory)

**Start**

1. Read this file
2. Confirm Active Phase
3. Open only relevant PRD/Architecture/Rules/Design/Phases slices for the task

**End**

1. Update checkboxes
2. Append session log
3. Update decisions / blockers / next actions
4. Bump Last Updated

If chat and Memory disagree → ask human → sync Memory.

---

## 2. Canonical document map

| File | Role | Open when |
|---|---|---|
| `PRD.md` | Product truth (~full behavior) | Feature behavior ambiguity |
| `Architecture.md` | System structure | Boundaries, storage, events *(see caveat)* |
| `Rules.md` v2 | Stack + engineering law | Before coding |
| `Phases.md` v2 | Delivery sequence | Before choosing scope |
| `Design.md` v2 | Dual visual systems | Before UI |
| `Memory.md` v2 | Current progress | Every session |
| `IMPLEMENTATION_AUDIT.md` | Phases vs repo cross-check | Before phase transitions |

Path: `/srv/Inabiya/Docs/` (symlink `docs` → `Docs` for Cursor rules)

---

## 3. Current snapshot (single source of “now”)

### 3.1 Active phase

| Field | Value |
|---|---|
| Phase | **Phase 12 — CMS TipTap + saleStrip + media** |
| Status | **Shipped** (TipTap, saleStrip, media library/upload; real S3 SDK deferred) |
| Milestone | Page-builder §12 complete |
| Owner | Eng |
| Target window | 2026-07-22 |
| Monorepo | `/srv/Inabiya` (GitHub: `EDUNEX-OFFICIAL/Inabiya`) |
| Prior | Ecommerce marketing CMS / Phase 11 CLOSED |

### 3.2 Locked production stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| Backend | NestJS + TypeScript |
| DB | PostgreSQL + Prisma |
| Cache/Jobs | Redis + BullMQ |
| UI | Tailwind + shadcn/ui + Radix |
| Validation | Zod |
| Package mgr | pnpm workspaces |

### 3.3 Dual design reminder

- **System A Soft Gift:** `#FF6B9D` pastels, Fraunces + Plus Jakarta
- **System B Creator:** forest/cream/terracotta HSL, Playfair + Manrope
- Never mix casually

### 3.4 Docs completion status

| Doc | Status | Version |
|---|---|---|
| PRD.md | Complete (product) | 1.0.0 |
| Architecture.md | **Rewritten canonical — LMS removed** | **2.0.0** |
| Rules.md | Expanded production authority | **2.0.0** |
| Phases.md | Expanded delivery authority | **2.0.0** |
| Design.md | Expanded dual-system authority | **2.0.0** |
| Memory.md | Expanded living memory | **2.0.0** |

### 3.5 Product implementation status

| Product | Status | Notes |
|---|---|---|
| A Gift Commerce | Phase 5 leftovers closed | Analytics, account, abandonment |
| B Commerce Admin | Phase 4 leftovers closed | Bulk edits, reports, support |
| C Editorial | Phase 7 closed | Public publish + TipTap + writer payments |
| D Creator Collective | Phase 8 closed | Reverse-bid path + brand analytics |
| Shared Platform | Phase 1 + 9 closed | Mail/S3 stubs; real providers deferred |

### 3.6 Prototype caveat

An older CRA/FastAPI/Mongo prototype may exist under `Inabiya-emergent-ai`.  
**Reference only.** Production follows Rules v2 stack.

### 3.7 Architecture status

`Architecture.md` **v2.0.0 full rewrite completed (2026-07-20)**.

- LMS/education contamination removed
- Domains aligned to PRD (Commerce, Editorial, Creator, Platform)
- Stack aligned to Rules (Next.js, NestJS, Postgres/Prisma, Redis/BullMQ)
- v1 draft superseded — do not follow old Admissions/Hostel diagrams

Q4 (Architecture rewrite) → **Resolved**

---

## 4. Next actions (max 5 — keep fresh)

1. Cloudflare SSL mode check: **Full (strict)** preferred
2. Ecommerce + CMS deep QA on public host (TipTap, saleStrip, media upload)
3. Razorpay / formal pentest
4. Real AWS/MinIO SDK behind `S3StorageAdapter` (optional)
5. When ready: real SMTP adapter

### Remediation plan (audit → execute) — CLOSED 2026-07-21

| Wave | Theme | Status |
|---|---|---|
| **1** | Money & trust | **Closed** |
| **2** | Soft Gift UX | **Closed** |
| **3** | CMS / admin | **Closed** (smoked: SEO/Medical queues, product edit, coupon deactivate; `support@test.inabiya` seeded) |

Phase 10 Soft Gift nav — **Closed**. Phase 11 page builder — **CLOSED** (11A–11D). Phase 1 leftovers — **CLOSED** (stubs). Audits still queued.
---

## 5. Open questions

| ID | Question | Status | Owner | Blocking? |
|---|---|---|---|---|
| Q1 | Exact monorepo path for production code? | **Resolved — `/srv/Inabiya`** | Eng | Done 2026-07-20 |
| Q2 | Payment provider (Razorpay / other)? | **Resolved — Razorpay; integrate after project complete** | Product/Eng | Not blocking — mock until then |
| Q3 | Hosting (AWS/GCP/other)? | Open | DevOps | Soft — VPS deploy in use |
| Q4 | Rewrite Architecture.md to remove LMS contamination? | **Resolved — v2.0.0** | Architecture | Done 2026-07-20 |
| Q5 | Single deployable vs separate web/api deploys day one? | **Resolved — compose: web+api+worker** | Eng Lead | Done 2026-07-20 |
| Q6 | Commerce admin visual = Soft Gift dense confirmed? | Open | Design | Soft |
| Q7 | Launch package = Commerce only, or Commerce+Editorial? | **Resolved — VPS-local = Commerce+Editorial+Creator MVP; public DNS deferred** | Product/Eng | Done 2026-07-20 |
| Q8 | Third-party auth (Google etc.) day one? | **Resolved — No; email/password only for easy testing** | Eng | Done 2026-07-20 |
| Q9 | Return window (days after delivery)? | **Resolved — default 14, admin-customisable via `policy.return_window_days`** | Product | Done 2026-07-20 |

Resolve → move to Decisions Log → remove from this table.

---

## 6. Decisions log (append-only, newest first)

### 2026-07-22 — Phase 12 media library COMPLETE

- §12 remainder: upload + library picker for CMS image fields + TipTap
- Bytes on local disk (not stub-only); public content path for Soft Gift imgs
- Real S3/MinIO SDK still deferred behind adapter

### 2026-07-22 — Phase 12 CMS TipTap + saleStrip CLOSED

- Shipped TipTap on marketing `richText` (reuse `ArticleEditor`) + new `saleStrip` block
- Media library / image upload remain deferred (§12 remainder)
- No Prisma migration — `PageBlock.type` is string + JSON props

### 2026-07-21 — Phase 1 leftovers CLOSED (stubs only)

- **Override:** no real SMTP/SES/S3 — Phase 1 exits on ConsoleMailAdapter + existing S3StorageAdapter stub
- Shipped: media library API + `/admin/platform/media`; `FeatureFlag` + migration/seed + `/admin/platform/flags`; `MailPort` + test-send; worker via `sendConsoleMail`; `POST /auth/logout-all`; seed `super@test.inabiya`
- Profile edit already existed (Memory checkbox was stale)

### 2026-07-21 — Phase 11 Marketing Page Builder (docs only)

- Client DnD “creating pages” → **1B**: full marketing pages `/pages/[slug]` + block builder (not homepage-only, not TipTap replace)
- This session **2Y**: docs/roadmap only — **no** Prisma/API/`@dnd-kit` code; **no** ecommerce/CMS/Creator audits
- Authority: `Docs/CMS_PAGE_BUILDER.md`; Phases §24; DnD lib when coding = `@dnd-kit`
- Soft Gift theme for public pages; TipTap journal unchanged; homepage KV CMS stays until optional 11D
- Queued later: ecommerce+CMS re-audit; then Creator Collective deep audit

### 2026-07-20 — Phase 9 CLOSED (VPS-local)

- Load smoke + DR restore-to-temp-DB drills green
- Security headers (API + Next), SECURITY.md pentest MVP remediations
- Launch checklist signed for VPS-local; public Caddy/Razorpay/formal pentest deferred
- Q7: local GA surface = Commerce + Editorial + Creator MVP
- Residual risks logged (below + SECURITY.md)

### Residual risks (post–Phase 9)

1. ~~No public Caddy/HTTPS~~ — **live** `https://inabiya.edunexservices.in` (Cloudflare proxied + Caddy)
2. Mock payments (Razorpay deferred)
3. ~~Phase 1 carry-over: media, real SMTP (password reset done)~~ — Phase 1 **CLOSED** on stubs (ConsoleMail + S3 stub); real SMTP/S3 still deferred
4. Single-node VPS (no HA)
5. Formal external pentest not executed

### 2026-07-20 — Phase 8 CLOSED; Phase 9 started

- Campaign analytics + niche filter closed Phase 8 P0
- Phase 9: auth/checkout rate limits, RUNBOOKS + launch checklist, postgres backup script, platform readiness UI
- Q7 still open for public GA surface; hardening proceeds on VPS-local stack

### 2026-07-20 — Phase 7 CLOSED; Phase 8 started

- Phase 7 exit met (publish + TipTap + writer payments); P1 related/sitemap deferred
- Phase 8 first slice: full reverse-bid happy path MVP (analytics deferred)
- Single-winner award; closed/awarded reject new proposals; payment after approved deliverable

### 2026-07-20 — Phase 7 started

- Public articles at `/articles`, specialists at `/specialists`
- Publish/schedule via CONTENT_ADMIN APIs (not workflow transition)
- Medical gate still enforced before publish
- WriterPayment PENDING on publish; FINANCE releases
- Seed: `finance@test.inabiya`, editorial categories, specialist `dr-meera-sharma`
- Migration `20260720163000_phase7_publishing`

### 2026-07-20 — Phase 6 CLOSED

- P0 complete + P1: list filters, revision snapshots, due dates + reminder job, turnaround analytics
- Exit criteria met earlier (workflow smoke + publish blocked)
- Next active phase when started: **Phase 7** public publishing

### 2026-07-20 — Phase 4/5 leftovers closed

- Funnel analytics (`AnalyticsEvent` + track + reports funnel)
- Cart abandonment scan (15m API scheduler) + recovery email stub job
- Account page + profile PATCH; order tracking step UI
- Support lookup page; bulk publish/unpublish; richer reports UI
- A11y: labels/aria on account + support; security: existing authZ retained on new admin routes
- Perf: lightweight client track (keepalive); no blocking SSR analytics

### 2026-07-20 — Phase 6 started (Phase 5 partial close)

- User explicitly requested next phase while Phase 5 P0 incomplete
- Deferred Phase 5 leftovers: funnel analytics, cart abandonment, account/order polish, support lookup, perf/security/a11y
- Phase 6 first slice: article assignments + status machine + writer dashboard + comments + internal preview
- Publish (`PUBLISHED`) hard-blocked until Phase 7
- Medical gate optional per article; SEO→APPROVED when gate off

### 2026-07-20 — Return window policy (Q9)

- Default **14 days** after delivery
- Stored in `commerce_settings` key `policy.return_window_days`
- Commerce admin can change 1–365 days (`POST /admin/commerce/policy/returns`)

### 2026-07-20 — Phase 5 started (Phase 4 partial close)

- User explicitly requested next phase; Phase 4 P0 + cancel/refund P1 done
- Deferred Phase 4 leftovers: bulk product edits, richer reports UI
- Phase 5 first slice: Product reviews + admin moderation
- Review rules: verified purchase (paid→delivered), one review/product/user, PENDING→APPROVED/REJECTED
- Return policy default: **14 days after delivery** (Q9 — confirm)

### 2026-07-20 — Phase 4 ops console MVP started

- Dashboard KPIs, alerts, search, customer admin, coupon admin, homepage CMS
- Order fulfillment transitions validated; internal notes on orders
- See `Docs/IMPLEMENTATION_AUDIT.md` for Phases 0–3 cross-check

### 2026-07-20 — Payment provider: Razorpay (deferred)

- **Razorpay** is the chosen production payment provider
- Integration **deferred until after project completion** — not in current phase scope
- Until then: **mock provider** for cart/checkout/order testing (`PAYMENT_PROVIDER=mock`)
- Adapter port already in place; swap provider when ready without changing order/inventory flow

### 2026-07-20 — Phase 3 checkout MVP started

- Mock payment provider default (`PAYMENT_PROVIDER=mock`) until Q2 resolves
- Money remains integer paise; server-side totals only
- Checkout requires auth for MVP; guest cart merges on login

### 2026-07-20 — Phase 2 catalog MVP started

- Active phase moved to **Phase 2** (storefront + commerce admin parallel slices)
- Catalog entities: Category, Product, Variant, Inventory, Media, Personalization, Wishlist, GiftBox
- Money as integer paise (`pricePaise`)
- Phase 1 leftovers explicitly carried (password reset, media, email, flags)

### 2026-07-20 — Phase 0 closed; Phase 1 auth (no 3P IdP)

- Closed Phase 0 (CI green, migrate, seed, sample job, health)
- Started Phase 1 with **email/password JWT only** — no Google/OAuth/social
- Bearer tokens (+ optional httpOnly cookies); `COOKIE_SECURE=true` only behind HTTPS
- Seeded test users: customer/commerce/writer `@test.inabiya` / `Password123!`
- Storefront + commerce admin remain same commerce track (Phases 2+) — not dual-tracked vs Editorial

### 2026-07-20 — Docs path + VPS CI/CD

- Canonical docs: `/srv/Inabiya/Docs/`; `docs` symlink → `Docs` (removed broken `/srv/docs`)
- Q1 resolved: production monorepo `/srv/Inabiya` (`EDUNEX-OFFICIAL/Inabiya`)
- Q5 resolved: Phase 0 deployables = `web` + `api` + `worker` via compose (BuildKit on VPS)
- CI/CD: GitHub verify → SSH → `scripts/deploy-vps.sh` (images build on VPS, not GHCR)

### 2026-07-20 — Extra Cursor rules (GSAP, Ponytail, ecommerce)

- Added `03-ponytail.mdc` (lazy senior / YAGNI)
- Added `15-gsap-motion.mdc` (GSAP primary for Soft Gift ecommerce motion)
- Added performance, a11y, SEO, images, checkout UX rules
- GSAP primary; Framer only tiny UI

### 2026-07-20 — Cursor rules installed

- Added full `.cursor/rules/*.mdc` set (core, phase, stack, Nest, Next, design, Prisma, security, commerce/editorial/creator, jobs, testing, docs, git)
- Path: `f:\PHANTOM\Professional\Projects\Inabiya\.cursor\rules\`

### 2026-07-20 — Architecture.md v2 full rewrite

- Deleted LMS/education contaminated architecture draft
- Rewrote canonical Architecture for Inabiya four products + shared platform
- Added deep sections: commerce/editorial/creator flows, API catalog, state machines, data model direction, threat model, CI/CD, extraction criteria
- Stack locked to Next.js + NestJS + PostgreSQL/Prisma + Redis/BullMQ
- Old “students/admissions/hostel” concepts explicitly mapped to delete/replace table

### 2026-07-20 — Docs suite upgraded to v2

- Expanded `Rules.md`, `Phases.md`, `Design.md`, `Memory.md` to deeper production authority
- Confirmed dual design systems remain separated
- Confirmed delivery phases 0–9 for first production path
- Confirmed Active Phase remains Phase 0

### 2026-07 — Initial documentation suite created

- Created Rules/Phases/Design/Memory after PRD + Architecture
- Locked stack: Next.js App Router, NestJS, PostgreSQL/Prisma, Redis/BullMQ, Tailwind/shadcn
- Chose dual visual systems over unified single palette

---

## 7. Blockers & risks

| Type | Item | Impact | Mitigation | Status |
|---|---|---|---|---|
| Risk | Boiling entire PRD at once | No ship | Phase P0/P1/P2 tiers | Active watch |
| Risk | Architecture LMS contamination | Wrong domains | PRD+Rules language | Active watch |
| Risk | Theme bleed A↔B | Brand damage | Design.md QA | Active watch |
| Risk | Non-idempotent payments | Money defects | Phase 3 hard stops | Future |
| Risk | Medical gate bypass | Trust failure | Phase 6–7 tests | Future |
| Blocker | None yet | — | — | — |

---

## 8. Module ownership map (target)

| Module | Owner team (TBD names) | Status |
|---|---|---|
| identity | Platform | Done (Phase 1 CLOSED) |
| media | Platform | Done (MVP + S3 stub) |
| notifications | Platform | Done (ConsoleMail stub) |
| audit | Platform | Done (privileged paths) |
| commerce/* | Commerce | Phase 5 closed |
| editorial/* | Content | Phase 7 closed |
| creator/* | Creator Collective | Phase 8 closed |
| feature-flags | Platform | Done (Phase 1) |

Update owners when assigned.

---

## 9. PRD quick index for agents

Use this to open the right PRD slice instead of whole file:

| Need | PRD region |
|---|---|
| Personas/roles | PART 2 §11–15 |
| Shared platform services | PART 3 §16–27 |
| Gift commerce UX | PART 4 §28–43 |
| Cart/checkout/orders | PART 4B §44–65 |
| Catalog/inventory | PART 4C §66–91 |
| Engagement/growth | PART 4D §92–114 |
| Commerce rules/stories | PART 4E §115–123 |
| Admin foundation | PART 5A §124+ |
| Product admin | PART 5B |
| Inventory admin | PART 5C |
| Order admin | PART 5D |
| Customer CRM | PART 5E |
| Promotions | PART 5F+ |
| Editorial | PART 6* |
| Creator Collective | Product D sections |

\* Exact PART numbers for editorial/creator are large; search PRD headings when entering Phases 6–8.

---

## 10. Active phase checklist — Phase 9 (CLOSED)

### Must-have (P0)

- [x] Load test checkout + publish hot paths (`scripts/phase9-load-smoke.sh`)
- [x] Dashboards/alerts MVP — `/admin/platform` readiness + `/version`
- [x] Backup/restore drill for PostgreSQL (`backup-postgres.sh` + `dr-smoke.sh`)
- [x] Secret rotation runbook (`Docs/RUNBOOKS.md`)
- [x] Rate limits on auth + checkout place-order
- [x] Pentest P0/P1 remediations MVP (`Docs/SECURITY.md` + headers)
- [x] DR smoke test (`scripts/dr-smoke.sh`)
- [x] Runbooks: webhook failures, queue backlog, rollback
- [x] PII/GDPR checklist (MVP notes in RUNBOOKS)
- [x] Launch checklist signed (`Docs/RUNBOOKS.md`)
- [x] On-call owner list filled (VPS Eng / Project Lead — replace contacts before public DNS)

### Should (P1)

- [x] Chaos/degradation notes — Redis down → `/ready` degraded (documented); full chaos deferred
- [x] Cost/performance budget — single VPS + mock pay; revisit at public scale

### Exit criteria

- [x] Launch checklist complete (VPS-local sign-off)
- [x] SLOs defined (initial in RUNBOOKS)
- [x] Residual risks logged for GA

---

## 10x. Closed — Phase 8 checklist

### Must-have (P0)

- [x] Brand + Creator onboarding/profile
- [x] Campaign create/publish/list
- [x] Marketplace browse
- [x] Proposal/bid submit (reverse bidding)
- [x] Brand evaluation + select winner
- [x] Messaging MVP
- [x] Deliverable submit/approve/request-changes
- [x] Campaign state machine
- [x] Ratings MVP post-completion eligibility
- [x] Payment/escrow-release MVP with approval gates
- [x] Basic campaign analytics
- [x] Theme isolation verified (System B `data-theme="creator"`)

### Should (P1)

- [x] Creator discovery filter (`?niche=`)
- [ ] Campaign templates
- [ ] Notification set for proposal/award/deliverable events

### Exit criteria

- [x] Demo: Brand publishes → proposals → award → deliverable approve → payment release
- [x] Closed campaign rejects bids
- [x] System B visual scope on `/creator/*`

---

## 10y. Closed — Phase 7 checklist

### Must-have (P0)

- [x] Public article pages (`/articles`, `/articles/[slug]`)
- [x] Categories/tags taxonomy MVP
- [x] Schedule + publish (API + 60s due scan)
- [x] SEO metadata (title, description, canonical, OG)
- [x] Specialist public profiles (`/specialists`)
- [x] Writer payment release MVP + FINANCE gate
- [x] Article view metrics (increment on public read)
- [x] Newsletter signup MVP
- [x] TipTap rich editor (Phase 7 polish)

### Should (P1) — deferred

- [ ] Related articles
- [ ] Basic comments (public)
- [ ] RSS/sitemap

### Exit criteria

- [x] Demo: Approve → publish → public URL → specialist → release payment
- [x] Medical gate cannot be skipped before publish
- [x] Metadata wired on public article page

---

## 10z. Archived — Phase 0 checklist (scaffold)

### Must-have (P0)

- [x] Monorepo layout created
- [x] `apps/web` Next.js App Router boots
- [x] `apps/api` NestJS boots
- [x] Prisma + PostgreSQL migrate works
- [x] Redis connected
- [x] BullMQ worker + sample job works
- [x] Env strategy + `.env.example`
- [x] Lint + format + typecheck + CI
- [x] Health + readiness endpoints
- [x] Structured logging + correlation IDs
- [x] API error envelope implemented
- [x] S3 adapter stub
- [x] Role seed script
- [x] Empty domain module folders per Rules

### Should (P1)

- [x] Dev compose (db/redis; api/web/worker via `docker-compose.prod.yml`)
- [x] Workspace scripts documented
- [ ] OpenAPI stub generation path

### Exit criteria

- [x] Clean machine boot docs verified
- [x] CI green
- [x] Migrate+seed works
- [x] Sample job visible in logs
- [x] No fake complete product features

### Demo notes

_Phase 0 closed 2026-07-20. Health + worker sample + CI/CD deploy verified on VPS._

---

## 11. Phase checklists (templates — activate when phase starts)

> When entering a new phase: copy that phase’s checklist into §10, archive old phase closeout into §12.

### Phase 1 — Identity & shared platform (partial closeout — carry-over logged)

---

### Phase 2 — partial closeout (catalog MVP shipped)

---

### Phase 3 — partial closeout (revenue path MVP)

---

## 10a. Closed — Phase 6 checklist

### Must-have (P0)

- [x] Assignment create/assign
- [x] Writer dashboard
- [x] Rich editor MVP (textarea body) → upgraded TipTap rich editor (Phase 7 polish)
- [x] Article status state machine (ASSIGNED→DRAFT→SEO→MEDICAL→APPROVED / CHANGES_REQUESTED)
- [x] Comments / change requests
- [x] Role enforcement (writer cannot approve/publish)
- [x] Internal preview
- [x] Basic editorial ops list + status/overdue filters
- [x] Audit on status transitions

### Should (P1)

- [x] Revision history basics
- [x] Assignment due dates + reminders job (email stub)
- [x] Editor analytics (turnaround counts)

### Web

- [x] `/admin/editorial` list + filters + turnaround
- [x] `/admin/editorial/articles/new` (+ due date)
- [x] `/admin/editorial/articles/[id]` editor + transitions + revisions
- [x] `/admin/editorial/articles/[id]/preview`
- [x] `/admin/editorial/writer` queue

### Exit criteria

- [x] Demo: assignment → SEO → medical → approved without permission leaks
- [x] Unauthorized publish blocked (no PUBLISHED status; explicit reject)

---

## 10b. Archived — Phase 5 checklist

### Must-have (P0)

- [x] Account/profile/address polish
- [x] Order tracking UX polish
- [x] Reviews + moderation MVP
- [x] Returns/refund request MVP (window customisable)
- [x] Cart abandonment event + recovery email job (stub)
- [x] Funnel analytics events
- [x] Perf / security / a11y passes (MVP checklist applied)
- [x] Support order lookup

---

## 10c. Archived — Phase 4 checklist

### Must-have (P0)

- [x] Admin dashboard KPIs (orders, revenue, AOV, today)
- [x] Order detail + timeline + internal notes
- [x] Payment verification cues on order detail
- [x] Fulfillment path PAID → PROCESSING → SHIPPED → DELIVERED
- [x] Customer admin list + profile + suspend/reactivate
- [x] Coupon admin create + list
- [x] Homepage CMS MVP (featured slugs + hero title)
- [x] Basic daily revenue report API
- [x] Operational alerts (failed payments, low stock counts)
- [x] Global admin search (orders/customers/products)
- [x] Cancellation + refund trigger (P1)

### Deferred leftovers

- [x] Bulk product edits
- [x] Richer reports UI
- [ ] Stakeholder demo recorded

### Web (P0)

- [x] `/admin/commerce` — dashboard + nav
- [x] `/admin/commerce/orders/[id]` — fulfill + notes
- [x] `/admin/commerce/customers`, `/customers/[id]`
- [x] `/admin/commerce/coupons`, `/merchandising`, `/search`
- [x] `/admin/commerce/reports`, `/support`
- [x] Storefront reads `/catalog/home` for featured products

### Exit criteria

- [x] Ops can fulfill order end-to-end in admin
- [x] Coupon admin → checkout redeem works
- [x] Homepage curation reflects storefront
- [x] Daily revenue snapshot on dashboard
- [ ] Stakeholder demo recorded

---

## 10d. Archived — Phase 3 checklist (partial)

### Must-have (P0)

- [x] Cart guest + auth + merge
- [x] Checkout + shipping + gift message + coupons
- [x] Mock payment + webhook idempotency
- [x] Inventory reserve/commit/release
- [x] Customer orders + admin list
- [ ] Razorpay — deferred post-project
- [ ] Guest checkout without login

---

## 10e. Archived — Phase 2 checklist (partial)

### Storefront P0

- [x] Homepage, PLP, PDP, gift box, wishlist
- [ ] Category browse UI, search UI

### Commerce Admin P0

- [x] Product CRUD/publish, admin UI
- [ ] Category admin UI, inventory edit UI

---

## 10f. Archived — Phase 1 checklist (**CLOSED** 2026-07-21)

### Must-have (P0)

- [x] Register / login / logout / refresh (email+password)
- [x] JWT access + refresh strategy
- [x] RBAC role codes seeded + RolesGuard
- [x] API guards + commerce admin web gate
- [x] Admin shell by role — role-gated layouts; empty nav OK
- [x] Media library MVP (S3 stub + MediaAsset metadata)
- [x] Audit log for privileged actions (auth)
- [x] Notification adapter + email provider (**ConsoleMail stub** — no real SMTP)
- [x] Feature flag primitive
- [x] Password reset flow MVP

### Should (P1)

- [x] Session revocation / logout-all devices (`POST /auth/logout-all`)
- [x] Basic profile edit (`PATCH /auth/me` + gift account UI)

### Explicitly deferred (P2)

- [x] Third-party / social IdP — **not now**
- [ ] Real SMTP / SES / Resend
- [ ] Real S3 / MinIO SDK

---

## 11x. Phase checklists (remaining templates)

### Phase 1 — Identity & shared platform

- [x] Register/login/logout/refresh
- [x] RBAC roles seeded + enforced
- [x] Admin shell
- [x] Media upload/signed read
- [x] Audit privileged actions
- [x] Email adapter + test send (console stub)
- [x] Feature flags primitive
- [x] Password reset MVP

### Phase 2 — Catalog & gift foundations

- [ ] Categories/collections browse
- [ ] PLP/PDP
- [ ] Personalization MVP
- [ ] Gift box builder MVP
- [ ] Wishlist MVP
- [ ] Admin product CRUD + publish
- [ ] Basic inventory qty

### Phase 3 — Cart/checkout/payments/orders

- [ ] Cart guest+auth merge
- [ ] Checkout MVP
- [ ] Payment adapter
- [ ] Webhook idempotency tests
- [ ] Inventory reserve/release
- [ ] Order history/tracking basics
- [ ] Confirmation notification

### Phase 4 — Commerce ops console

- [ ] Dashboard KPIs subset
- [ ] Order fulfillment transitions
- [ ] Customer admin profile
- [ ] Coupons MVP
- [ ] Homepage CMS MVP
- [ ] Basic reports
- [ ] Low stock / failed payment alerts MVP

### Phase 5 — Commerce GA hardening

- [ ] Reviews moderation MVP
- [ ] Returns request MVP
- [ ] Abandonment email job
- [ ] Funnel analytics events
- [ ] Perf/security/a11y passes
- [ ] Support lookup enough for launch

### Phase 6 — Editorial core

- [ ] Assignments
- [ ] Writer dashboard + editor
- [ ] SEO + medical gates
- [ ] Status machine + audit
- [ ] Unauthorized publish blocked

### Phase 7 — Publishing & writer payments

> Active checklist lives in §10 — do not duplicate here.

### Phase 8 — Creator Collective

- [ ] Brand + creator onboarding
- [ ] Campaigns + marketplace
- [ ] Reverse proposals/bids
- [ ] Award + messaging
- [ ] Deliverable approvals
- [ ] Payment release gates
- [ ] System B theme verified isolated

### Phase 9 — Hardening

- [ ] Load tests
- [ ] Alerts/dashboards
- [ ] Backup/restore drill
- [ ] Pentest P0/P1 fixed
- [ ] Runbooks
- [ ] Launch checklist signed

---

## 12. Closed phases archive

### Phase 0 closed — 2026-07-20
- Commit/PR refs: scaffold + CI/CD on `main` (`EDUNEX-OFFICIAL/Inabiya`)
- Demo: health/ready, sample BullMQ job logs, migrate+seed, Actions deploy green
- Deferred leftovers: OpenAPI stub
- Carry-over risks: no public domain/Caddy yet

---

## 13. Session log (newest first)

### Session — 2026-07-22 (Phase 12 §12 media library)

- Local disk store in `S3StorageAdapter` (`MEDIA_LOCAL_ROOT`); Docker volume `inabiya_media_data`.
- Public `GET /api/v1/media/:id/content` (images only); assets return `publicUrl`.
- CMS `CmsMediaField` on image/hero/recipient URLs; TipTap Upload/Library (CMS + editorial).
- Zod `cmsMediaUrlSchema`; platform media page shows thumbs + copy public URL.
- Real AWS SDK still deferred.

---

### Session — 2026-07-22 (Phase 12 — CMS TipTap + saleStrip)

- Active phase → Phase 12; Phases.md §25; CMS_PAGE_BUILDER + audit updated.
- Admin richText: `ArticleEditor` TipTap (key=block id); public sanitize unchanged.
- New block `saleStrip`: Zod (`text`, cta*, `tone`) + admin EMPTY_PROPS/toPayload + Soft Gift `GiftBand` renderer.
- No Prisma migration (JSON block type). Media upload still deferred.
- Files: `packages/validation`, CMS `[id]/page.tsx`, `article-editor.tsx`, `marketing-page-blocks.tsx`.

---

### Session — 2026-07-21 (Journal teasers — no more pill)

- Homepage `articleTeasers`: title-only `clay-card` looked like a pill when one short article.
- UI: full-width editorial panels (16:9 media + display title + excerpt + meta + Read CTA); single article = featured split layout.
- API `resolveArticleTeasersProps`: returns description, publishedAt, imageUrl, category, specialist; preserves seeAllHref/Label.
- Files: `marketing-page-blocks.tsx`, `cms-pages.service.ts`.

---

- DNS: Cloudflare A → `187.127.143.207` (proxied)
- Caddy: `/srv/automation/deploy/caddy/sites.d/inabiya.caddy` — `/api*` → `inabiya-api:4001`, else `inabiya-web:3001`
- Compose: `api` + `web` on `vps_edge`; env `APP_URL=https://inabiya.edunexservices.in`, `COOKIE_SECURE=true`, `NEXT_PUBLIC_API_URL=same-origin`
- Ops: `vps-staggered-boot.sh` + `vps-health.sh` + `PORT_REGISTRY.md` updated
- Smoke: home/gift/api health **200** on public HTTPS
- Next: Cloudflare SSL Full (strict); public QA; Razorpay/pentest still deferred

---

### Session — 2026-07-21 (Dev workflow: pnpm on 3101)

- UI speed coding: `WEB_PORT=3101` + `pnpm --filter @inabiya/web dev`; API via Docker `4001` (or `pnpm dev:api` on 4101).
- Preview: http://127.0.0.1:3101/gift — Docker prod stays on 3001; final ship via `bash scripts/deploy-vps.sh web`.

### Session — 2026-07-21 (Personalised Name Blanket local image)

- Served `public/personalised-name-blanket.jpeg` as `/gift/media/personalised-name-blanket.jpeg` (not under `/gift/products/` — conflicts with `[slug]` route).
- Seed + live `product_media` for `personalised-name-blanket` point to that URL; copied into running `inabiya-web` public dir.

### Session — 2026-07-21 (Local WebP product media)

- Converted `public/personalised-name-blanket.jpeg` + `public/wooden-rattle-set.jpg` → WebP under `apps/web/public/gift/media/`.
- Seed + live URLs: `/gift/media/personalised-name-blanket.webp`, `/gift/media/wooden-rattle-set.webp` (rattle resized to 1200w).
- Note: Next only serves `public/` files present at process start — `docker restart inabiya-web` after copying new assets.

### Session — 2026-07-21 (Fix broken gift product images)

- Cause: seed Unsplash `photo-1515488042361-ee00e3ddd4e7` → HTTP 404 (swaddle + welcome hamper).
- Replaced demo product media with verified-200 Unsplash URLs; seed now updates primary `product_media` row on re-seed.
- Live DB `product_media` updated (4 rows); homepage product grids resolve from catalog — no web redeploy needed.
- Hero image unchanged (`photo-1635874714425…` still 200).

### Session — 2026-07-21 (Centered hero + gifting SVG)

- Removed text (`Offline` / twitch copy) from `Docs/gifting.svg`; served as `/gift/gifting-bg.svg`.
- Storefront hero: drop asymmetric split → centered brand/headline/CTAs over full-bleed SVG bg; GSAP entrance kept.
- Override: Soft Gift homepage hero polish.

### Session — 2026-07-21 (Hero image + no fade)

- Removed hero photo veil/opacity fade; doodle wash scoped to copy column only.
- Hero `imageUrl` → Unsplash hamper `photo-1635874714425-c342060a4c58?w=900&q=85` (seed, fallback, live `page_blocks`).

### Session — 2026-07-21 (Asymmetric Soft Gift hero + GSAP)

- **Override:** Soft Gift homepage hero visual polish (not phase P0).
- Storefront hero → asymmetric split (left copy, right full-bleed photo + diagonal veil); mobile stacks image band then copy.
- New client leaf `apps/web/components/cms/gift-storefront-hero.tsx` with scoped `useGSAP` entrance timeline (photo → brand → headline → subcopy/CTAs → trust; reduced-motion skip).
- Wired via `HeroBlock` + `LegacyGiftHomeFallback`; CSS `.gift-hero-split*`; seed hero `imageUrl` for photo plane.
- No CMS schema change; panel hero unchanged.

### Session — 2026-07-21 (Nav search always open)

- Soft Gift desktop search: always-expanded input, leftmost of Shop / For Whom / Journal (not utility icon).
- Clear (X) only when query non-empty; suggestions panel opens left-aligned; mobile drawer search for `<md`.
- No auto-focus on load. Redeployed `web` so live site picks up change.
- Fix: fixed search width + reserved clear-button slot so typing no longer stretches the bar; dropdown matches bar width.
- Fix: long “no match” query overflow (`break-all` + panel `overflow-hidden`); redeployed web.

### Session — 2026-07-21 (Homepage polish tweaks)

- Waves/pills only on recipientSplit (not product grids). Fixed horizontal scroll (`100vw` → `width:100%` + `overflow-x: clip`).
- Faded toy SVGs (`.gift-toys`) in section corners / hero.

### Session — 2026-07-21 (Soft Gift homepage visual polish)

- Soft Gift–interpreted PDF cues on `/gift` only: `.gift-band--*`, `.gift-doodle`, `.gift-wave-card`, `.gift-pill-overlap`, USP row under brands.
- Hero doodle; recipient wavy+pill; product grids mint/sky bands; CTA lavender; articles blush; footer soft band.
- Docs: Design.md recipes + Soft Gift homepage §1 note. No new CMS types.

### Session — 2026-07-21 (Soft Gift mega-nav edge-case pass)

- Search: Enter → PLP; AbortController race; maxLength 120 (Zod); hide See-all on error/busy; mobile full-width; collapse mega on search expand.
- Nav: close overlays on query-string change (same-path PLP); Escape closes mobile menu; mega `aria-controls` + scroll cap; Suspense around `useSearchParams`.

### Session — 2026-07-21 (Soft Gift mega-nav + search)

- Nav IA: Shop + For Whom 2-col megas (links + image/copy); Journal link; utilities = search / wishlist / cart / profile.
- `GiftSearch`: expand-on-click, 300ms debounce, catalog `q` suggestions (≤6) + see-all; mobile accordion + full-width search.
- Assets: `public/gift/nav/shop.svg`, `for-whom.svg`. Docs: Soft Gift homepage §2 + this log.
- Verify: `pnpm --filter web exec tsc --noEmit`; deploy web.

### Session — 2026-07-21 (Gift nav organize + icons)

- Soft Gift nav: shop links left/center; utility cluster (wishlist/cart icons + badge, profile dropdown with Profile/Orders/Sign out); mobile menu icon.
- Fixes wrap that put “Sign out” under logo.

### Session — 2026-07-21 (Brand strip polish + wordmarks)

- USP/brand hierarchy + spacing; logo tiles with `/gift/brands/*.svg` interim wordmarks (not official trademarks).
- Deployed `web`. Swap files with brand-approved assets when licensed.

### Session — 2026-07-21 (Ecommerce marketing CMS control)

- Audit: homepage chrome gaps → wired CMS. Hero eyebrow + trustLine chips; brandStrip usps/subtitle/logo brands; footer block; gift chrome API for nav+footer.
- Admin: `/admin/cms/gift-chrome`; page builder fields for new props; corporate slug `corporate-gifting`.
- Merchandising KV labeled legacy (does not drive `/gift`).
- Deployed api+web; seed updated. Still code-owned: PLP filter chips, box wizard labels, cart/checkout chrome (functional UX).

### Session — 2026-07-21 (Soft Gift brand marquee)

- `brandStrip` home: USP first, then seamless infinite brand carousel (duplicated track, `translate3d(-50%)`, soft edge mask).
- Defaults: The Moms Co. / Inabiya / Chicco / Mamaearth / Soft Nest; seed + live `home` block updated.
- `prefers-reduced-motion`: static wrap; hover pauses.

### Session — 2026-07-21 (Phase 1 leftovers CLOSED — stubs)

- **Override:** no real SMTP/S3 — ConsoleMail + S3StorageAdapter stub only.
- Mail: `MailPort` / `ConsoleMailAdapter`, `POST /admin/notifications/test-send`, worker `sendConsoleMail`.
- Media: upload/list/get/delete on `MediaAsset`, MIME gate + check, `/admin/platform/media`.
- Flags: `FeatureFlag` migration + seed (`support.impersonation` off, `checkout.guest`/`media.library` on), admin `/admin/platform/flags`, seed `super@test.inabiya`.
- Auth: `POST /auth/logout-all`; profile edit already present.
- Verify: migrate deploy, seed, `pnpm --filter @inabiya/api test` + api/web typecheck green.
- Phase 1 → **CLOSED**.

### Session — 2026-07-21 (Phase 11 CLOSED → password reset)

- Smoke: `/gift` 200; CMS `home` PUBLISHED with 7 blocks; API health 200.
- Phase 11 marked **CLOSED**. Override: Phase 1 carry-over **password reset MVP** — `PasswordResetToken`, `POST /auth/forgot-password` + `reset-password`, Soft Gift `/forgot-password` + `/reset-password`, worker stub `auth.password_reset`.
- Deployed api/web/worker; migration applied; smoke forgot → worker log with resetUrl → reset → login OK.

### Session — 2026-07-21 (Phase 11D Soft Gift homepage on blocks)

- `/gift` loads published MarketingPage slug `home` via `MarketingPageBlocks` (`layout=home`); `/pages/home` → `/gift`; legacy fallback if missing.
- New blocks: `brandStrip`, `recipientSplit`, `articleTeasers`; hero storefront + dual CTA; productGrid hamper/limit; cta panel title/body.
- API live resolve + homepage lock; seed publishes `home`; admin editor + merchandising deep-link.
- Docs: Phases / CMS_PAGE_BUILDER / Memory.

### Session — 2026-07-21 (Phase 11D CMS admin block editor)

- Editor: `brandStrip` / `recipientSplit` / `articleTeasers` + hero/productGrid/cta prop extensions; flat↔nested recipientSplit mapping; homepage unpublish lock.
- List: Homepage badge; merchandising: link to Soft Gift homepage block builder (KV form marked legacy).
- Next: finish 11D runtime homepage-on-blocks if not done; audits.

### Session — 2026-07-21 (Soft Gift UI → design tokens only)

- Locked Soft Gift token stack in `globals.css` (space/radius/surface/border/status/control + clay elevation) and Tailwind bridge (`gs-*`, semantic colors, `rounded-clay|control|pill`, `shadow-clay*`).
- Recipes: clay btn/input states, gift-banner/*, gift type + layout (`.gift-page`, stacks, hero washes).
- Migrated `(gift)` + gift-nav + clay-product-card + marketing-page-blocks off hardcoded hex/rgba/`text-red|green|amber` and raw spacing → `gs-*` / recipes.
- Docs: Design.md §4.2a + §4.7; QA tip; this log.

### Session — 2026-07-21 (Soft Gift Plush Clay UI Wave 3)

- Wave 3: order detail, wishlist, corporate, login/register, journal index + article — clay language.
- Mobile-first: GiftNav hamburger (&lt;md), short desktop labels, full-width CTAs, `.gift-page` / `.clay-input`, PLP/box horizontal chip scroll, PDP/cart/checkout/account/CMS pages aligned.
- Docs: Memory + QA Wave 3 + IMPLEMENTATION_AUDIT storefront note.

### Session — 2026-07-21 (Soft Gift Plush Clay UI Wave 2)

- Why clay (locked): warm/tactile for baby-gift parents; glass = cold/SaaS; neo = a11y/dated; flat = weak conversion grab. Kept Design.md pink + Fraunces.
- Wave 2: checkout + account + CMS public block renderer on same clay language (no heavy checkout motion).
- Wave 1 already: home/PLP/PDP/box/cart + tokens.

### Session — 2026-07-21 (Soft Gift Plush Clay UI Wave 1)

- **Override:** visual redesign of Soft Gift conversion path (not pixel-match); claymorphism-inspired “plush clay”, not glass.
- Tokens/utilities in `globals.css` (`--clay-*`, `.clay-card`, `.clay-btn`, rise motion + `prefers-reduced-motion`).
- Redesigned `/gift` hero (brand-first), PLP/PDP clay cards, cart + box chrome, sticky clay nav.
- Admin/Editorial/Creator themes untouched. Wave 2 (checkout/account/CMS pages) deferred.

### Session — 2026-07-21 (CMS/QA reminders + editorial toolbar UX)

- Docs: `CMS_PAGE_BUILDER.md` §12 future backlog (TipTap on page richText, saleStrip, media upload, 11D…); QA §8 future reminders; audit deferred list; Memory next actions.
- Editorial article edit: amber banner when body read-only (`PUBLISHED` etc.) — TipTap toolbar only on ASSIGNED/DRAFT/CHANGES_REQUESTED.
- Prior: gift Sign out auth sync; hide shop nav on login/register.

### Session — 2026-07-21 (Phase 11C catalog grid + preview)

- API: `CatalogService` enriches `productGrid` with `props.products` on public + publish + `GET /admin/cms/pages/:id/preview`.
- Web: shared Soft Gift `MarketingPageBlocks`; public `/pages/[slug]` uses API-resolved products; draft preview `/pages/preview/[id]`; admin Preview button.
- Next: optional 11D homepage migration; deferred ecommerce/CMS + Creator audits.

### Session — 2026-07-21 (Phase 11B DnD + full blocks)

- Installed `@dnd-kit/core` / `sortable` / `utilities` on web.
- Admin editor: drag-reorder blocks; palette adds image / productGrid / spacer.
- Public `/pages/[slug]`: render image, spacer, productGrid (slugs or category); OG metadata.
- Next: 11C polish.

### Session — 2026-07-21 (Phase 11A marketing pages)

- Migration `20260721010000_phase11a_marketing_pages`: `MarketingPage` + `PageBlock`.
- API: public `GET /cms/pages/:slug`; admin CRUD + publish/unpublish/delete under `/admin/cms/pages`.
- Web: `/admin/cms/pages` list/new/editor (up/down); public `/pages/[slug]` Soft Gift (hero/richText/cta).
- Zod block discriminated union; AuthZ COMMERCE/CONTENT/SUPER_ADMIN; audit on create/update/publish.
- **Not in 11A:** `@dnd-kit`, image/productGrid/spacer render, homepage migration (11B–D).

### Session — 2026-07-21 (Phase 11 DnD pages — docs only)

- Wrote `Docs/CMS_PAGE_BUILDER.md` (1B contract, block catalog, API sketch, 11A–D).
- Wired Phases §24, IMPLEMENTATION_AUDIT, Soft Gift reference pointer, Memory.
- **No code.** No ecommerce/CMS re-audit. No Creator audit.
- Next when asked: Phase 11A implement **or** audit executions per Memory §4.

### Session — 2026-07-21 (Phase 10 cross-check + fixes)

- Smoke: filters, box prefs/recs/add, budget_too_low, move-to-cart, inquiry, support search/inquiries, web routes — green.
- Fixes: girl/boy PLP includes `unisex`; age filter includes `any`; recs same; PDP/add-to-box + load promote `wizardStep` 6 when items exist; restart shows skip-to-box; recs remaining budget floored at 0.
- Redeployed api+web.

### Session — 2026-07-21 (Phase 10 Soft Gift nav — shipped)

- Waves 1–3 closed; Phase 10 **IN PROGRESS → P0/P1/P2 implemented**.
- Docs: `SOFT_GIFT_HOMEPAGE_REFERENCE.md`, Phases §23, audit.
- Schema migration `20260721001000_phase10_soft_gift_nav`: product taxonomy + GiftBox prefs + `GiftingInquiry`.
- Nav IA on `GiftNav`; PLP filters; 6-step `/gift/box`; hampers + home sections; `/gift/corporate` + admin inquiries.
- Seed: support@, shop categories, hamper products, brandName tags.
- Free shipping copy = ₹2,000 (unchanged threshold).
- Deployed api+web; smoke: filters, inquiry, support search, web routes OK.

### Session — 2026-07-21 (Waves closed → Phase 10 Soft Gift nav)

- Smoke Wave 3: health, SEO/Medical queues, product get, coupon deactivate OK; seeded `support@test.inabiya` for SUPPORT search.
- Waves 1–3 → **CLOSED**. Active phase → **10 Soft Gift Nav & Merchandising**.
- Docs: `SOFT_GIFT_HOMEPAGE_REFERENCE.md` (UI notes + navbar-driven add-ons); Phases §23; audit updated.
- Decision: navbar IA = core features; no pixel-match homepage; free ship stays ₹2,000.

### Session — 2026-07-20 (Wave 3 CMS ops)

- SEO/Medical article lists by status (not assignee-only); medical approve = MEDICAL_REVIEWER only (ops cannot self-approve).
- `AdminGate` on `(admin)/layout`; platform page requires admin login.
- Product edit `/admin/commerce/products/[id]` + inventory; coupon activate/deactivate; SUPPORT on commerce search.

### Session — 2026-07-20 (Wave 2 Soft Gift UX)

- Shared `GiftNav` in `(gift)/layout` (Wishlist + auth); home no longer duplicates nav.
- Invalid coupons cleared from cart + `couponRemoved` reason; over-budget blocks move-to-cart; budget cannot go below subtotal.
- `/gift/wishlist` manage UI; silent JWT refresh in `apiAuth`/`cartApi`; checkout saved-address prefills + human field labels; empty cart CTA.

### Session — 2026-07-20 (Wave 1 money/trust — executing)

- Plan locked in Memory §4 (Waves 1–3).
- **Done in Wave 1:** payment confirm ownership; mock webhook requires `PAYMENT_WEBHOOK_SECRET`; cart add stock = existing+incoming; PENDING_PAYMENT TTL 30m expire + cart restore; refund claim (return/cancel); same-origin `/api/v1` rewrite + `api-base.ts`; CORS_ORIGINS support.
- Next: Wave 2 storefront UX after smoke.

### Session — 2026-07-20 (Deep ecommerce + CMS audit)

- Read-only audit of Soft Gift + admin/editorial/creator. Canvas: `ecommerce-cms-audit.canvas.tsx`.
- **Critical themes:** payment confirm IDOR, open mock webhook, cart oversell, convert-before-pay / reserve leak, tunnel API URL, refund races.
- **UX themes you hit:** gift box ≠ cart, static Sign in, coupons/budget.
- **CMS:** SEO/Medical queues empty; admin client-only shell; SUPPORT unused.
- No code fixes in this session — prioritize Wave 1 money/trust next if human asks.

### Session — 2026-07-20 (Gift box → cart + auth nav + budget)

- Gift box ≠ cart: added **Add box to cart** (`POST …/move-to-cart`).
- Over-budget: show overspend; block new adds when over; set-budget updates active box (no wipe).
- Gift home nav: client `GiftNav` — Sign out / name after login (was static “Sign in”).

### Session — 2026-07-20 (Gift box browse CTA)

- Explained gift box = budget planner (≠ cart). Fixed UX: **Add more products** always visible after first item (was only when empty).

### Session — 2026-07-20 (Remove coupon on cart)

- Cart: **Remove coupon** button (DELETE `/cart/coupon`); input locked while applied; trim on apply.
- Prior: discount display via `discountPaise` / `totalPaise`.

### Session — 2026-07-20 (Cart coupon discount display)

- **Issue:** WELCOME10 “applied” but cart only showed subtotal — API `mapCart` never returned `discountPaise`.
- **Fix:** `toCartDto` computes discount; cart UI shows Discount + Total. Deployed web+api.

### Session — 2026-07-20 (Checkout guest login gate)

- **Issue:** Guest `/checkout` stuck on “Preparing…”; silent redirect; cart didn’t ask to sign in clearly; auth rate-limit (20/15m) blocked tunnel testing.
- **Fix:** Checkout gates (`need_login` / empty / error / ready); cart CTA → `/login?next=/checkout`; login/register honor `?next=` + cart merge; auth rate limit 60/15m; API restart + web/api deploy.
- **Test:** Soft-refresh → guest cart → “Sign in to checkout” → `customer@test.inabiya` / `Password123!` → checkout form.

### Session — 2026-07-20 (Phase 9 COMPLETE)

- Load smoke: `scripts/phase9-load-smoke.sh` (20×3 concurrent hot paths) OK
- DR smoke: `scripts/dr-smoke.sh` restore→verify→drop temp DB OK
- Security headers middleware + Next `headers()`; `Docs/SECURITY.md`
- Launch checklist signed for VPS-local; Q7 resolved; Phase 9 → **CLOSED**
- Phases 0–9 delivery sequence complete for local stack; public GA items deferred

### Session — 2026-07-20 (Phase 8 close + Phase 9 start)

- Brand analytics: `GET /creator/analytics/summary` + brand dashboard panel
- Creator discovery: `GET /creator/creators?niche=`
- Phase 8 → **CLOSED**; Phase 9 → **IN PROGRESS**
- Rate limits: auth login/register/refresh (20/15m/IP); checkout place-order (60/min/IP)
- Docs: `Docs/RUNBOOKS.md` (launch checklist, SLOs, backup/restore, webhooks, queue, rollback, PII)
- Script: `scripts/backup-postgres.sh` (drill OK — dump written under `backups/`)
- Platform admin: live `/ready` + `/version` snapshot
- Remaining Phase 9: load test, pentest, on-call names, full DR sign-off

### Session — 2026-07-20 (Phase 8 start — Creator Collective)

- Phase 7 → **CLOSED**; active phase → **8 IN PROGRESS**
- Schema: CreatorProfile, BrandProfile, Campaign, Proposal, Message, Deliverable, CampaignPayment, CampaignRating
- Migration `20260720170000_phase8_creator`
- API under `/creator/*`: marketplace, profiles, campaign lifecycle, bids, award, messaging, deliverables, payment release, ratings
- Web System B: `/creator`, marketplace, brand dashboard, creator studio
- Seed: `brand@test.inabiya`, `creator@test.inabiya` (+ profiles Soft Nest Co / Anya Creates)
- Deferred P0: basic campaign analytics
- Smoke OK: publish → bid → award → deliverable approve → payment RELEASED; awarded rejects new bids (409)

### Session — 2026-07-20 (Cursor rules Batch 3 — quality)

- Batch 3 (7 remaining) rewritten: `05` `21` `22` `32` `33` `40` `42`
- Anchors: `@inabiya/validation` schema names, `ArticleStatus` + `assertPublishable` / `MEDICAL_GATE_REQUIRED`, writer-payment release roles, CreatorModule scaffold honesty, `/health`+`/ready`, `.env.example` + 3001/4001 vs 3101/4101, PORT_REGISTRY
- Quality pass complete for all 27 rules (Batch 1+2+3); no app/migration/env code changes

### Session — 2026-07-20 (Cursor rules Batch 2 — quality)

- Batch 2 (10) rewritten with repo anchors: `12` `15` `16` `17` `18` `19` `20` `23` `30` `31`
- Anchors: `globals.css` themes, article `generateMetadata`, checkout `busy` submit, `InventoryService`, webhook `(provider,eventId)`, `NotificationsQueueService` jobIds, `OrderStatus` enum
- Design rule flags hardcoded `#FF6B9D` vs `var(--primary)`
- Remaining for Batch 3+: `05` naming, `21` editorial, `22` creator, `32` observability, `33` env, `40` docs, `42` ops
- No app/migration/env changes

### Session — 2026-07-20 (Cursor rules Batch 1 — quality)

- Process: enhance **≤10 rules per pass** (quality > bulk)
- Batch 1 rewritten with repo examples: `00` `01` `02` `03` `04` `10` `11` `13` `14` `41`
- Anchors: `ZodValidationPipe`, `ApiExceptionFilter`, `*Paise`, `RolesGuard`, `data-theme` layouts, checkout
- Remaining rules deferred to Batch 2+; no app/migration/env changes

### Session — 2026-07-20 (Login UX — password toggle)

- Login/register: show/hide password toggle (Eye icon)
- Login fail root cause: typo `writer@test.inabiy` (missing final `a`); API accepts full `writer@test.inabiya`
- Click-to-fill seeded users; email trim+lowercase on submit; writer → editorial redirect

### Session — 2026-07-20 (TipTap rich editor)

- Replaced textarea MVP with TipTap: headings, lists, quote, code, HR, link, image URL, table, align, undo/redo
- Sanitize via `isomorphic-dompurify` on save + public/preview render
- Auto-save every 30s when dirty; legacy plain-text bodies still load
- Images still URL-prompt (media library = Phase 1 carry-over)
- Not yet: video embeds, footnotes, emoji picker, callout boxes
- Deployed web; smoke health OK

### Session — 2026-07-20 (Cursor rules enhancement)

- Enhanced all 22 existing `.cursor/rules/*.mdc` to industry-standard depth (DoD, status maps, state machines, OWASP-aligned security, WCAG, CWV budgets)
- Added gap rules: `04-typescript`, `05-naming-conventions`, `32-observability`, `33-env-secrets`, `42-ops-isolation`
- Rewrote `18-seo-metadata` for Next.js App Router Metadata/JSON-LD (was generic SEO fluff)
- Inventory now **27** rules; always-apply kept lean; file-scoped rules use globs
- No app code / migrations / env keys changed
- Risk: denser always-apply context — monitor token pressure; trim if noisy
- Next: continue Phase 7 P1 if needed; optional ADR index linking Rules.md ↔ cursor rules

### Session — 2026-07-20 (Phase 7 start — publishing)

- Active phase → **7 IN PROGRESS**
- Schema: SCHEDULED/PUBLISHED, SEO fields, EditorialCategory/Tag, SpecialistProfile, WriterPayment, NewsletterSignup
- Migration `20260720163000_phase7_publishing`
- API: public `/articles/*`, admin schedule/publish, writer-payments release, 60s schedule scanner
- Web: `/articles`, `/articles/[slug]`, `/specialists`, admin publish panel + payments page
- Seed: `finance@test.inabiya`, categories, `dr-meera-sharma`
- Next: smoke demo path; then close Phase 7 or P1 extras
- Smoke OK: published `sleep-cues-for-newborns`, specialist attribution, writer payment RELEASED via finance@

### Session — 2026-07-20 (Phase 6 closeout)

- Filters: `?status=` / `?overdue=1` on article list
- Revisions: `ArticleRevision` snapshot on title/body save
- Due dates on create + 30m reminder scan → `assignment.due_reminder` stub
- Turnaround analytics: `/editorial/analytics/turnaround`
- Migration `20260720160000_phase6_closeout`
- Phase 6 → **CLOSED**; Phase 7 ready to start

### Session — 2026-07-20 (Close Phase 4/5 leftovers)

- Analytics: `POST /analytics/track`, funnel report, PLP/PDP/checkout/purchase wired
- Abandonment: `Cart.abandonmentNotifiedAt`, 15m API scan, worker email stub
- Account `/account` + `PATCH /auth/me`; order step tracker
- Admin: bulk products, reports page, support lookup
- Migration `20260720154000_phase5_leftovers`
- Active phase remains **6** (editorial); leftovers closed

### Session — 2026-07-20 (Phase 6 editorial workflow)

- Active phase → **6**; Phase 5 partial close (analytics/abandonment/account/a11y deferred)
- Schema: `Article`, `ArticleComment`, `ArticleStatusHistory`; migration `20260720151000_phase6_editorial`
- API: `/editorial/articles` CRUD-ish, transition, comments, preview, writers list
- Roles: CONTENT_ADMIN assigns; WRITER drafts; SEO/MEDICAL gates; publish blocked
- Seed users: content@, seo@, medical@ (+ existing writer@)
- Web: editorial list, new assignment, editor, preview, writer queue
- Next: Phase 6 demo path smoke; then Phase 7 publish or Phase 6 P1

### Session — 2026-07-20 (Phase 5 returns + customisable window)

- Q9 resolved: default 14 days, customisable in admin Returns page
- Schema: `ReturnRequest`, `ReturnStatus`, `OrderStatus.RETURNED`; migration `20260720145000_phase5_returns`
- Policy key `policy.return_window_days` in CommerceSetting
- Customer: eligibility + request on order detail
- Admin: list/approve(+mock refund+restock)/reject; set window days
- Next: funnel analytics / cart abandonment / account polish

### Session — 2026-07-20 (Phase 5 start — reviews)

- Active phase → **5**; Phase 4 partial close (bulk edits / richer reports deferred)
- Schema: `ProductReview` + `ReviewStatus`; migration `20260720144000_phase5_reviews`
- API: `GET/POST /catalog/products/:slug/reviews`, `GET/PATCH /admin/commerce/reviews`
- Rules: verified purchase, one review/user/product, moderation gate
- Web: PDP reviews section; admin Reviews page
- Q9 open: return window default **14 days** — confirm
- Next: returns request MVP

### Session — 2026-07-20 (Phase 4 P1 cancel + refund)

- `POST /api/v1/admin/orders/:id/cancel` — CANCELLED + payment REFUNDED (mock) + stock restock
- Mock `PaymentProvider.refund`; inventory `restock` helper
- Admin order detail: Cancel + refund button
- Fix: Docker web SSR uses forced `API_URL=http://api:4001` (catalog was empty on `/gift`)
- Smoke: `bash scripts/smoke-cancel-refund.sh` (needs a PAID/PROCESSING order)
- Next: bulk product edits, richer reports

### Session — 2026-07-20 (Cross-check + Phase 4 ops console)

- Cross-check: created `Docs/IMPLEMENTATION_AUDIT.md` (Phases 0–3 vs repo)
- Phase 3 partial closeout logged; Phase 4 active
- Done:
  - Schema: `OrderNote`, `CommerceSetting`; migration `20260720140424_phase4_ops`
  - API: dashboard KPIs, alerts, daily report, search, coupon admin, customer admin, storefront CMS
  - Orders: admin detail, notes, validated fulfillment transitions
  - Web: ops dashboard, order detail, customers, coupons, merchandising, search
  - Gift homepage uses `/catalog/home` featured slugs
- Next: Phase 5 GA hardening or Phase 1/2/3 deferred items

### Session — 2026-07-20 (Phase 3 checkout MVP)

- Phase: 3 (IN PROGRESS)
- Done:
  - Schema: Cart, Address, Coupon, Order, Payment, WebhookEvent
  - API: cart (guest/auth/merge), checkout, mock payment webhook, orders
  - Inventory reserve/commit/release on order lifecycle
  - Web: cart, checkout, orders, PDP add-to-cart, admin orders
  - Worker: order confirmation notification queue (log stub)
  - Seed: WELCOME10, FLAT100 coupons
- Smoke: guest cart → merge → place order → webhook → PAID
- Next: guest checkout, Phase 4 ops console; Razorpay after project complete

### Session — 2026-07-20 (Phase 2 catalog MVP)

- Phase: 2 (IN PROGRESS) — Phase 1 partial carry-over logged
- Done:
  - Prisma catalog schema + migration `20260720063159_phase2_catalog`
  - Catalog API: public browse, admin CRUD/publish/inventory, wishlist + gift box
  - Web: `/gift`, `/gift/products`, PDP, `/gift/box`, `/admin/commerce/products`
  - Seed: 2 categories + 3 published demo products
  - Fixes: JwtModule export for CatalogModule guards; Next.js dynamic PLP; deploy green
- Smoke: `GET /api/v1/catalog/products` → 3 products; web `/gift` 200
- Next: category/search UI, inventory admin UI, Phase 1 leftovers, Phase 3 prep

### Session — 2026-07-20 (Phase 1 simple auth)

- Phase: 1 (IN PROGRESS) — Phase 0 closed
- Docs analysis:
  - Phases/Rules/Architecture: JWT email/password; OAuth = P2 later
  - Commerce storefront + admin = same track (Phase 2+), not parallel vs Editorial
- Done:
  - Auth API: register/login/refresh/logout/me + admin-ping RBAC
  - Web: `/login`, `/register`, commerce admin session gate
  - Seeded test users; audit on login/register
- Decision: **no third-party auth** for easy testing
- Next: password reset, media, email adapter, feature flags

### Session — 2026-07-20 (Docs align + VPS CI/CD)

- Phase: 0 (IN PROGRESS)
- Done:
  - Fixed docs path: `docs` → `Docs` (removed broken `/srv/docs` symlink)
  - Synced Memory with real Phase 0 scaffold; Q1/Q5 resolved
  - Added Dockerfiles + `docker-compose.prod.yml` + `scripts/deploy-vps.sh`
  - Hardened CI; added `deploy-vps.yml` (verify → SSH → VPS BuildKit)
- Changed files:
  - `Docs/Memory.md`, Dockerfiles, compose prod, GHA workflows, README
- Decisions:
  - Images build on VPS; loopback smoke `3001`/`4001`; Caddy later
- Blockers:
  - GitHub secrets must be set for first auto-deploy
- Next:
  1. First successful `deploy-vps` smoke on VPS
  2. Tick remaining Phase 0 exit criteria

### Session — 2026-07-20 (Architecture rewrite)

- Phase: 0 (not started)
- Done:
  - Full rewrite `Architecture.md` → v2.0.0 (LMS removed)
  - Updated Memory decisions/Q4 resolved
- Changed files:
  - `docs/Architecture.md`
  - `docs/Memory.md`
- Decisions:
  - Architecture v2 is canonical; ignore v1 LMS draft
- Blockers:
  - None
- Next:
  1. Resolve Q1 repo path
  2. Start Phase 0 scaffold when instructed

### Session — 2026-07-20 (docs v2)

- Phase: 0 (not started)
- Done:
  - Expanded Rules/Phases/Design/Memory to v2.0.0
- Changed files:
  - `docs/Rules.md`, `Phases.md`, `Design.md`, `Memory.md`
- Decisions:
  - Dual design systems; Phase 0 active
- Next:
  1. Architecture cleanup (completed same day)

---

## 14. Environment & credentials notes

| Env | Status | Notes |
|---|---|---|
| Local | Provisioned on VPS path | Compose postgres `5433` / redis `6381`; `.env` present (gitignored) |
| Staging | Not provisioned | |
| Production | Partial | Public host `https://inabiya.edunexservices.in` via Caddy; Razorpay/pentest still open |

Do not store secret values in this file — only status and key names.

Required key names (from Rules): `DATABASE_URL`, `REDIS_URL`, JWT secrets, object storage, payment, email, `APP_URL`, `API_URL`.

---

## 15. Useful commands (fill during Phase 0)

```bash
pnpm install
pnpm dev
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm lint && pnpm typecheck
# Prod-like on VPS:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
bash scripts/deploy-vps.sh
```

---

## 16. AI guardrails (restate)

1. Do not invent progress checkboxes
2. Do not skip phases without explicit override logged here
3. Do not implement LMS domains from contaminated Architecture text
4. Do not blend Design systems A/B
5. Prefer updating Memory over long chat-only status
6. If Memory grows too large, archive old session logs to `Memory-archive.md`

---

## 17. Definition of a good Memory update

A good update is:

- Dated
- Phase-tagged
- Checkbox-accurate
- Decision-complete
- Next-actions limited to ≤5
- Free of secrets
- Free of PRD duplication

---

## 18. Ready-to-start gate for Phase 0

Phase 0 coding should start when:

- [x] Rules v2 locked
- [x] Phases v2 locked
- [x] Design v2 locked
- [x] Memory initialized
- [x] Q1 repo/monorepo path answered (`/srv/Inabiya`)
- [x] Human explicitly says start Phase 0

Scaffold is underway; exit criteria still open until VPS smoke verified.

---

**End of current Memory snapshot v2.0.0**
