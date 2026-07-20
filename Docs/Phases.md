# Inabiya
# Implementation Phases & Delivery Roadmap

Version: 2.0.0

Status: Active — Delivery Authority

Document Owner: Product & Engineering Leadership

Stakeholders:
Product
Engineering
Design
QA
Operations
Finance
AI Coding Assistants

Last Updated: July 2026

---

## 1. Purpose

This document translates the full Inabiya PRD into sequenced, shippable engineering phases.

It answers:

1. What do we build now?
2. What is deferred?
3. What PRD sections map into each phase?
4. What does “phase complete” mean?

AI and humans must not attempt to implement the entire PRD in one pass.

### Related docs

| Doc | Role |
|---|---|
| `PRD.md` | Full requirements |
| `Architecture.md` | Technical structure |
| `Rules.md` | Stack & coding law |
| `Design.md` | Visual systems |
| `Memory.md` | Live progress |
| `Phases.md` | Sequence (this file) |

---

## 2. Planning Law

1. **Foundation → Revenue → Trust/Content → Marketplace → Hardening**
2. **Vertical slices over horizontal CRUD sprawl**
3. **One active coding phase** unless leadership explicitly dual-tracks (§16)
4. **No future-phase pull-ins** without explicit re-scope
5. **Every phase must be demoable**
6. **Quality gates travel with the phase** (authZ, validation, migrations, critical tests)
7. **PRD Stages 1–3 are first production path**; Stages 4–7 remain future epics
8. **MVP subset is allowed inside a phase**, but must be labeled Deferred vs Must-Have

---

## 3. Release Map vs PRD Lifecycle

| PRD Stage (§24) | Theme | Delivery phases |
|---|---|---|
| Stage 1 Premium Ecommerce | Gift commerce + commerce ops | 0–5 |
| Stage 2 Editorial Growth | Parenting editorial | 6–7 |
| Stage 3 Creator Marketplace | Creator Collective | 8 |
| Stage 4 Marketing Automation | journeys/segmentation | Future |
| Stage 5 Subscription Ecosystem | memberships/subscriptions | Future |
| Stage 6 Community Platform | communities/UGC deep | Future |
| Stage 7 Complete Ecosystem | network effects | Future |

### Milestones

| ID | Name | Exit when |
|---|---|---|
| M0 | Foundation Ready | Phase 0 done |
| M1 | Commerce Alpha | Phase 2 done |
| M2 | Commerce Beta | Phases 3–4 done |
| M3 | Commerce GA Candidate | Phase 5 done |
| M4 | Editorial GA Candidate | Phases 6–7 done |
| M5 | Creator Collective Beta | Phase 8 done |
| M6 | Production Hardening | Phase 9 done |

---

## 4. Scope Tiers Inside Each Phase

Every capability in a phase is tagged:

| Tier | Meaning |
|---|---|
| **P0 Must** | Blocks phase exit |
| **P1 Should** | Strongly expected for quality; can residual to Memory with approval |
| **P2 Later** | Explicitly deferred; do not build unless phase finishes early and lead approves |

---

## 5. Phase 0 — Platform Foundation

**Goal:** Production skeleton for all later work.  
**Milestone:** M0  
**Depends on:** Documentation suite + stack lock (`Rules.md`)  
**PRD anchors:** §16–20 shared platform philosophy; §26 constraints (web-first, auditable admin, role permissions)

### P0 Must

- Monorepo (`apps/web`, `apps/api`, packages as needed)
- Next.js App Router shell
- NestJS modular monolith shell
- PostgreSQL + Prisma bootstrap + first migration
- Redis connectivity
- BullMQ worker + sample job
- Env strategy (local/staging/prod) + `.env.example`
- ESLint, Prettier, TypeScript strict, CI (lint + typecheck + unit smoke)
- `/health` + readiness
- Structured logging + correlation IDs
- Standard API error envelope
- S3-compatible storage adapter stub
- Seed baseline roles
- Empty domain module folders per `Rules.md` map

### P1 Should

- Turbo/pnpm workspace DX scripts
- OpenAPI stub generation path
- Basic Dockerfile compose for api/web/db/redis

### P2 Later

- Full observability suite (deep dashboards)
- Multi-region anything
- Microservice extraction

### Exit criteria

- Documented boot commands work on clean machine
- CI green on lint/typecheck
- Migrate + seed works
- Sample job processes
- No product business features pretending to be complete

### Demo

Boot web+api, hit health, enqueue sample job, show logs with request ID.

---

## 6. Phase 1 — Identity, Access & Shared Platform Core

**Goal:** AuthN/AuthZ + shared primitives.  
**Depends on:** Phase 0  
**PRD anchors:** §11–15 personas/roles; §20 Authentication/Authorization/Profile/Media/Notification/Audit/Payment primitives; §26 permission + audit constraints

### P0 Must

- Register / login / logout / refresh
- JWT access + refresh strategy
- RBAC for: Customer, Commerce Admin, Content Admin, Writer, SEO Editor, Medical Reviewer, Creator, Brand, Finance, Support, Super Admin
- API guards + web protected layouts
- Admin shell by role (empty nav ok)
- Media library MVP (upload metadata, object storage, signed read)
- Audit log for privileged actions
- Notification adapter interface + one email provider impl
- Feature flag primitive
- Password reset flow MVP

### P1 Should

- Session revocation / logout-all devices
- Basic profile edit
- Support impersonation disabled by default (flagged)

### P2 Later

- Full social identity matrix
- Advanced notification preference center
- Hardware key / enterprise SSO

### Exit criteria

- Unauthorized API calls fail closed
- Role-gated routes work for at least Customer + Commerce Admin + Writer
- Media upload/retrieve works
- Privileged action writes audit row

### Demo

Login matrix; denied route; upload image; show audit event; send test email job.

### PRD section checklist (coverage intent)

- [ ] §11 user types represented in role model
- [ ] §20 auth/authz/media/notification/audit stubs real enough for dependents

---

## 7. Phase 2 — Commerce Catalog & Gift Foundations

**Goal:** Discover products + configure gifts; admin can publish catalog.  
**Milestone contribution:** M1  
**Depends on:** Phase 1  
**PRD anchors:** PART 4 §28–43; PART 4C §66–76, §81; PART 5B product management basics §143–157

### Storefront P0

- Homepage shell with featured hooks
- Categories + collections browse (MVP)
- PLP with basic filters/sort
- PDP with media/price/availability
- Personalization options MVP (PRD §39–40 subset)
- Gift Box Builder MVP (§41–42 subset: create box, add eligible items, summary, remaining budget metaphor if configured)
- Wishlist MVP authenticated (§43)
- Search basic (DB/full-text acceptable)

### Commerce Admin P0

- Product CRUD
- Variants/SKUs
- Categories
- Product media binding
- Publish/unpublish
- Basic inventory quantity edit
- Personalization configuration MVP on product

### P1 Should

- Product tags Must/Recommended/Nice
- Recently viewed
- Basic merchandising pins

### P2 Later

- Advanced recommendations engine
- Full attribute matrix sophistication
- Multi-warehouse inventory topology
- Bulk import/export polish (Phase 4/5 ops can deepen)

### Exit criteria

- Admin publishes personalized product with media + stock
- Visitor browses PLP/PDP
- User builds basic gift box + wishlist item
- Stock edits reflect on storefront availability

### Demo

Create personalized SKU → publish → PDP personalize → add to box → admin stock change → unavailable state.

### PRD mapping

| PRD | Phase 2 treatment |
|---|---|
| §34–38 discovery/PDP | P0 MVP |
| §39–42 personalization + builder | P0 subset |
| §43 wishlist | P0 |
| §66–71 catalog entities | P0 schema+admin |
| §77–79 inventory deep ops | P2 (basic qty only now) |
| §82 recommendations | P2 |
| §105–107 gift cards/loyalty/referral | Future stages |

---

## 8. Phase 3 — Cart, Checkout, Payments & Orders

**Goal:** Primary revenue path works safely.  
**Milestone contribution:** M2  
**Depends on:** Phase 2  
**PRD anchors:** PART 4B §44–58; §53–56 payments/orders; §115 commerce business rules (critical); shared Payment service §20

### P0 Must

- Cart guest + auth + merge rules (§44–46)
- Address book basics (§49)
- Checkout stages MVP (§47–48)
- Shipping method MVP (§50)
- Gift preferences/message (§51)
- Coupon redeem MVP simple non-stack (§52 subset)
- Payment adapter + redirect/intent flow (§53–54)
- Webhook idempotency
- Order creation + lifecycle subset (§55–56)
- Inventory reservation + release on fail/cancel (§78/§115 critical)
- Customer order history + tracking basics (§57)
- Order confirmation notification

### P1 Should

- Basic cancel path
- Payment failure recovery UX
- Tax display MVP if required by launch market rules

### P2 Later

- Full returns/refund sophistication (start in Phase 5)
- Partial shipments / multi-package advanced logistics
- Complex promotion stackability matrix (deepen Phase 4)

### Exit criteria

- Paid test order in staging
- Duplicate webhook ≠ duplicate side effects
- Failed payment releases reservation
- Order visible to customer + admin list

### Demo

Checkout → pay test → replay webhook → single order → stock decremented → email job.

### Hard stop defects (phase cannot close)

- Double charge / double order from webhook replay
- Negative inventory
- Float money bugs
- AuthZ bypass on order read

---

## 9. Phase 4 — Commerce Operations Console

**Goal:** Run the store without spreadsheets.  
**Milestone contribution:** M2  
**Depends on:** Phase 3  
**PRD anchors:** PART 5A dashboard §124–142; 5B deepen; 5C inventory ops MVP; 5D order mgmt §192–219; 5E customer CRM MVP; 5F promotions MVP

### P0 Must

- Admin dashboard KPIs subset (orders, revenue, AOV)
- Order management detail + legal status transitions + notes + timeline
- Payment verification cues
- Fulfillment happy path (processing → shipped → delivered)
- Customer admin profile + order history + status (active/suspended basics)
- Coupon/discount create+list+basic rules
- Homepage CMS MVP (banners/featured products/collections)
- Basic commerce reports
- Operational alerts MVP (failed payments, low stock simple)
- Global admin search MVP (orders/customers/products)

### P1 Should

- Cancellation + basic refund trigger
- Low stock monitoring
- Internal notes + customer communication log stubs
- Bulk product edits limited

### P2 Later

- Full warehouse/bin topology
- Forecasting
- Advanced segmentation CRM
- Full promotion priority/stack engine (as complete PRD)
- SLA management sophistication
- Import/export enterprise polish

### Exit criteria

- Ops can fulfill order path
- Coupon works end-to-end
- Homepage curation reflects storefront
- Daily revenue snapshot visible

### Demo

Coupon checkout → fulfill in admin → feature product on homepage → show dashboard cards.

### PRD mapping notes

Full PART 5 is enormous. Phase 4 ships an **operable MVP console**, not every §143–§300 control. Remaining console depth continues in Phase 5 / post-GA backlog tracked in Memory.

---

## 10. Phase 5 — Customer Experience Hardening (Commerce GA Candidate)

**Goal:** Trustworthy Stage 1 launch candidate.  
**Milestone:** M3  
**Depends on:** Phase 4  
**PRD anchors:** PART 4D §92–114; returns §58; reviews §60/§97–98; notifications §61/§111; NFRs §120; module exit §123

### P0 Must

- Account/profile/address polish
- Order tracking UX polish
- Reviews + moderation MVP
- Returns/refund request MVP aligned to policy
- Cart abandonment event + recovery email job (not full journey builder)
- Funnel analytics events (view/PDP/add/checkout/purchase)
- Perf pass on PLP/PDP/checkout
- Security pass on auth/checkout/account
- A11y pass critical flows
- Support order lookup tools enough for launch

### P1 Should

- Q&A MVP if staffing allows
- Cross-sell/upsell simple merchandising
- SEO basics on key templates

### P2 / Future

- Gift cards, loyalty, referral (§105–107)
- Marketing automation Stage 4
- Native apps

### Exit criteria

- QA checklist of critical commerce journeys green
- No open P0/P1 security issues in commerce scope
- Core Web Vitals measured on key pages
- Commerce KPI events flowing

### Demo

Review product → track order → return request → show funnel events → Lighthouse/CWV snapshot.

---

## 11. Phase 6 — Editorial Platform Core Workflow

**Goal:** Replace spreadsheet editorial ops.  
**Milestone contribution:** M4  
**Depends on:** Phase 1 (stream-parallel after M1 possible; see §16)  
**Recommended after:** Phase 5 unless dedicated editorial stream funded  
**PRD anchors:** PART 6 editorial sections (assignments, writer dashboard, review workflow, roles); personas Writer/SEO/Medical/Content Admin

### P0 Must

- Assignment create/assign
- Writer dashboard
- Rich editor MVP
- Article status state machine (assigned→draft→seo→medical→approved→…)
- Comments / change requests
- Role enforcement (writer cannot publish)
- Internal preview
- Basic editorial ops list/filters
- Audit on status transitions

### P1 Should

- Revision history basics
- Assignment due dates + reminders job
- Editor analytics (turnaround counts)

### P2 Later

- AI writing copilots
- Advanced taxonomy tools
- External CMS sync

### Exit criteria

- One article moves assignment → SEO → medical → approved without permission leaks
- Unauthorized publish blocked

### Demo

Full internal workflow for one medically gated article.

---

## 12. Phase 7 — Public Publishing, SEO & Editorial Payments

**Goal:** Stage 2 public trust content live.  
**Milestone:** M4  
**Depends on:** Phase 6  
**PRD anchors:** publishing/scheduling/SEO/media/public article UX; specialist profiles; writer payments

### P0 Must

- Public article pages
- Categories/tags taxonomy MVP
- Schedule + publish jobs
- SEO metadata (title, description, canonical, OG)
- Specialist/expert public profiles (editorial — not Creator Collective)
- Writer payment release MVP + finance role gate
- Article view metrics basics
- Newsletter signup MVP (recommended P0)

### P1 Should

- Related articles
- Basic comments if PRD requires at this stage
- RSS/sitemap

### P2 Later

- Advanced SEO scoring automation
- Multi-language
- Full community layer (Stage 6)

### Exit criteria

- Scheduled article publishes publicly
- Medical gate cannot be skipped
- Metadata correct
- Writer payment releasable under rules

### Demo

Approve→schedule→public URL live→specialist attribution→release writer payment.

---

## 13. Phase 8 — Creator Collective Marketplace

**Goal:** Stage 3 reverse-bidding marketplace core.  
**Milestone:** M5  
**Depends on:** Phase 1 + payment/media primitives; strongly after M3  
**PRD anchors:** Product D Creator Collective sections (campaigns, profiles, proposals, reverse bidding, messaging, deliverables, ratings, payments)  
**Design:** System B only (`Design.md`)

### P0 Must

- Brand capability + Creator onboarding/profile
- Campaign create/publish/list
- Marketplace browse
- Proposal/bid submit (reverse bidding)
- Brand evaluation + select winner
- Messaging MVP
- Deliverable submit/approve/request-changes
- Campaign state machine
- Ratings MVP post-completion eligibility
- Payment/escrow-release MVP with approval gates
- Basic campaign analytics
- Theme isolation verified (no gift pink bleed)

### P1 Should

- Campaign templates
- Creator discovery filters
- Notification set for proposal/award/deliverable events

### P2 Later

- Enterprise multi-phase campaign template studio
- Full dispute court
- Social autopublish integrations
- Advanced matching algorithms

### Exit criteria

- Brand publishes → multiple proposals → award → deliverable approve → payment eligible
- Closed campaign rejects bids
- System B visual compliance

### Demo

End-to-end reverse bid happy path + one rejection path + payment gate.

---

## 14. Phase 9 — Production Hardening & Launch Readiness

**Goal:** Operable production.  
**Milestone:** M6  
**Depends on:** Phase 5 + (7 and/or 8 per launch package)  
**PRD anchors:** NFRs, audit constraints, security, availability KPIs in Part 1/commerce NFRs

### P0 Must

- Load test checkout + publish hot paths
- Dashboards/alerts (API errors, latency, queue lag, payment failures)
- Backup/restore drill for PostgreSQL
- Secret rotation runbook
- Rate limits on auth/sensitive APIs
- Pentest P0/P1 remediations
- DR smoke test
- Runbooks: webhook failures, queue backlog, rollback
- PII/GDPR checklist
- Launch checklist sign-off
- On-call owner list

### P1 Should

- Chaos/degradation drills for Redis/search
- Cost/performance budget review

### P2 Later

- Multi-region active-active
- Full formal SOC evidence packs if not required yet

### Exit criteria

- Launch checklist complete
- SLOs defined
- Residual risks logged in Memory

---

## 15. Future Epics (Explicitly Out of Phases 0–9)

| Epic | PRD pointers | Notes |
|---|---|---|
| Marketing Automation | Stage 4; journey builder | Not Phase 4 abandonment email |
| Subscriptions | Stage 5; § related future | Separate commerce mode |
| Community | Stage 6 | Beyond newsletter/comments MVP |
| Gift cards / loyalty / referral | §105–107 | Post-GA growth |
| Native mobile apps | constraints say web-first | Future |
| Advanced search service extraction | Architecture evolution | After modular monolith proves scale |
| AI assist layer | editorial copilots etc. | Optional add-on after workflow exists |

---

## 16. Parallelization Rules

If staffing allows after Phase 1:

| Stream A Revenue | Stream B Content |
|---|---|
| 2 → 3 → 4 → 5 | 6 → 7 |
| Join at 9 | 8 can follow 5 or 7 based on business priority |

Constraints:

1. Shared platform changes have one owning module
2. No duplicate payment/media/auth adapters
3. Creator Collective does not start before identity/media/payments primitives stable
4. Dual-track must be written into `Memory.md`

---

## 17. AI Phase Discipline

When user does not specify phase, AI asks.

Default order: 0→1→2→3→4→5→6→7→8→9

AI must refuse Phase N+2 feature work while Phase N incomplete unless user explicitly overrides and Memory records the exception.

Each coding session updates Memory phase checklist.

---

## 18. Detailed Dependency Graph

```text
Phase 0 Foundation
   ↓
Phase 1 Identity + Shared Platform
   ↓
   ├───────────────┐
   ↓               ↓
Phase 2 Catalog   (optional stream) Phase 6 Editorial Core
   ↓               ↓
Phase 3 Checkout  Phase 7 Publishing
   ↓
Phase 4 Commerce Ops
   ↓
Phase 5 Commerce GA
   ↓
Phase 8 Creator Collective (also needs Phase 1 primitives)
   ↓
Phase 9 Hardening
```

---

## 19. Definition of Done — Phase Template

```md
## Phase <N> Closeout

### Must-haves
- [ ] all P0 complete

### Quality
- [ ] critical tests added
- [ ] no open P0 defects in phase scope
- [ ] authZ verified on new protected mutations
- [ ] migrations included

### Design
- [ ] correct theme system applied

### Docs
- [ ] Memory updated
- [ ] deferred leftovers listed with owners

### Demo
- [ ] stakeholder demo notes attached
```

---

## 20. Risk Register (Phase-aware)

| Risk | Phase impact | Mitigation |
|---|---|---|
| Boil-the-ocean PRD implementation | All | Phase tiers P0/P1/P2 |
| Webhook non-idempotent | 3,9 | Hard stop defect |
| Medical gate bypass | 6–7 | State machine + authZ tests |
| Escrow release without approval | 8 | Payment gate tests |
| Theme bleed | 8 (+any UI) | Design QA checklist |
| Architecture LMS contamination | 0–2 | PRD domains + Rules language |
| Ops console perfectionism | 4 | MVP console, deepen later |

---

## 21. Change Control

Roadmap changes require:

1. Product/eng agreement
2. Version bump on this file
3. Memory decision entry
4. Active checklist rewrite if mid-phase impact

---

## 22. Immediate Next Action

1. Keep Active Phase = **Phase 0** in `Memory.md`
2. Confirm production repo/monorepo path (Open Question)
3. Start scaffolding Next.js + NestJS + Prisma + Redis + BullMQ
4. Do not begin Product D UI until Phase 1 primitives exist

---

**End of Phases.md v2.0.0**
