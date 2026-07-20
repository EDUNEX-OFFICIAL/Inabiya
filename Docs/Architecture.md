# Inabiya
# Technical Architecture Document

Version: 2.0.0

Status: Active — Canonical (supersedes v1.0.0 LMS-contaminated draft)

Document Owner: Engineering Architecture Team

Audience:
Software Architects
Backend Engineers
Frontend Engineers
DevOps Engineers
Security Engineers
QA Engineers
Technical Leads
AI Coding Assistants

Last Updated: July 2026

---

## 0. Rewrite Notice

Version 1.0.0 of this document incorrectly mixed education/LMS SaaS template content (Admissions, Hostel, Exams, Library loans, multi-tenant school ERP patterns) into Inabiya.

**Version 2.0.0 is a full rewrite.**

Canonical product domains now match `PRD.md`:

1. Personalized Baby Gift Commerce
2. Commerce Management System
3. Parenting Editorial Platform
4. Creator Collective
5. Shared Platform Services

Canonical implementation stack matches `Rules.md`:

- Next.js (App Router) + TypeScript
- NestJS modular monolith + TypeScript
- PostgreSQL + Prisma
- Redis + BullMQ
- Tailwind CSS + shadcn/ui + Radix
- S3-compatible object storage
- REST `/api/v1` first

If any residual education vocabulary appears in older notes or transcripts, ignore it.

---

## 1. Architecture Purpose

### 1.1 Purpose

This document defines how Inabiya is engineered: bounded contexts, runtime topology, data ownership, APIs, events, security, scalability, and evolution strategy.

`PRD.md` defines **what** the product must do.  
This document defines **how** those requirements are realized safely at scale.

### 1.2 Scope

Included:

- System & domain architecture
- Backend / frontend architecture
- Database, cache, search, media
- API & event architecture
- AuthN/AuthZ
- Background processing
- Integrations (payments, email/SMS)
- Security, observability, deployment
- Scalability & disaster recovery
- Folder structure & governance

Excluded (owned elsewhere):

- Feature acceptance criteria → `PRD.md`
- Coding do/don’t → `Rules.md`
- Delivery order → `Phases.md`
- Visual systems → `Design.md`
- Live progress → `Memory.md`

### 1.3 Architectural goals

| Goal | Meaning for Inabiya |
|---|---|
| Scalability | Millions of users, products, articles, creator interactions without redesign |
| Maintainability | Teams change commerce without breaking editorial/creator |
| Reliability | Payment/search/notification partial failures do not take down whole platform |
| Security | Least privilege for customers, writers, medical reviewers, creators, brands, admins |
| Performance | Fast storefront & checkout; async heavy work |
| Extensibility | Future mobile, subscriptions, AI assists without paradigm break |

### 1.4 Architectural philosophy

1. **Domain-oriented** — business capabilities define boundaries
2. **Modular monolith first** — extract services only when justified
3. **Shared platform services once** — auth/media/notifications/search/audit/payments primitives
4. **Event-driven collaboration** where sync coupling is unnecessary
5. **Explicit ownership** of modules, tables, queues, events
6. **Evolution over rewrite**

### 1.5 Decision principles

Every significant decision must improve at least one of: evolution, ops simplicity, scale, security, observability, decoupling, resilience, understandability, automation — without contradicting long-term Inabiya vision.

### 1.6 Relationship to other docs

| Document | Responsibility |
|---|---|
| `PRD.md` | Requirements, workflows, personas |
| `Architecture.md` | Technical blueprint (this file) |
| `Rules.md` | Engineering standards & AI boundaries |
| `Phases.md` | Build sequencing |
| `Design.md` | System A/B visual architecture |
| `Memory.md` | Living progress & decisions |

Authority order for conflicts: PRD (product) → Architecture (structure) → Rules (implementation constraints) → Design → Phases → Memory.

---

## 2. System Architecture

### 2.1 Overview

Inabiya is a **web-first, cloud-native, modular domain platform** for India’s parenting ecosystem.

It is **not** a generic multi-vendor marketplace in v1, **not** a multi-institution school ERP, and **not** a microservices mesh on day one.

Primary deployables (Phase 0+):

| Deployable | Responsibility |
|---|---|
| `apps/web` | Next.js App Router — storefront, blog, creator surfaces, admin UIs |
| `apps/api` | NestJS modular monolith — system of record APIs |
| `apps/worker` | BullMQ processors (may start inside api; split when load requires) |
| PostgreSQL | Transactional system of record |
| Redis | Cache, locks, rate limits, job queues |
| Object storage | Media binaries |
| Edge/CDN | Static + media delivery |

Optional later: API gateway, dedicated search engine, separate notification service.

### 2.2 High-level topology

```text
                 Visitors / Customers / Parents
                 Writers / Editors / Medical Reviewers
                 Creators / Brands
                 Commerce / Content / Finance / Support Admins
                                   │
                                   ▼
                         Next.js Web (apps/web)
                      theme scopes: gift | creator
                                   │
                                   ▼
                         NestJS API (apps/api)
                      /api/v1/*  + auth guards
                                   │
          ┌────────────┬───────────┼───────────┬────────────┐
          ▼            ▼           ▼           ▼            ▼
     Identity     Commerce     Editorial   Creator     Platform
     & Users      Domains      Domains     Domains     Shared
          │            │           │           │            │
          └────────────┴───────────┴───────────┴────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
               PostgreSQL        Redis      Object Storage
                                    │
                                    ▼
                               BullMQ Workers
                         (email, webhooks, publish,
                          reindex, media, payouts)
```

### 2.3 Architectural style

Combination of:

- Domain-Driven Design (bounded contexts)
- Modular Monolith
- Hexagonal / clean layering inside modules
- Event-driven integration between domains
- CQRS-light where read models help (catalog/search projections) — not mandatory everywhere

### 2.4 Why modular monolith first

Microservices early costs: distributed tx, latency, orchestration, versioning, ops burden.

Inabiya starts modular monolith because:

- Faster domain boundary learning
- One deploy pipeline initially
- In-process calls for sync paths
- Easier integration testing
- Clear extraction seams later (notifications, search, media processing)

Evolution path:

```text
Modular Monolith
  → Strong module isolation + events
    → Extract high-churn infra (workers/search)
      → Extract domains only with proven independent scale needs
```

### 2.5 Core platform vs business modules

**Platform (shared, business-agnostic):**

Identity, Authorization, Media, Notifications, Search infra, Audit, Feature Flags, Settings, Payment primitives (provider adapters)

**Business modules:**

Commerce (catalog, inventory, cart, checkout, orders, promotions, customers ops)  
Editorial (assignments, articles, review workflow, publishing, writer payments)  
Creator (profiles, campaigns, proposals/bids, messaging, deliverables, campaign payments)

Business modules **must not** reimplement platform primitives.

### 2.6 Request lifecycle (sync)

```text
Client → Next.js (RSC/route) → Nest Controller
  → AuthN → AuthZ → Validation
  → Application Use Case
  → Domain Policy / Aggregate
  → Prisma / adapters
  → Response envelope
```

Side effects (email, reindex, image variants) enqueue to BullMQ after successful commit when eventual consistency is acceptable.

### 2.7 Cross-cutting services

Logging, metrics, tracing, rate limiting, feature flags, localization readiness, exception mapping, validation, config — centralized patterns, not copy-pasted per module.

### 2.8 Inter-module communication

| Mode | When |
|---|---|
| In-process application API | Strong consistency needed inside one request |
| Domain events | Fan-out reactions (OrderPaid → email, inventory finalize, analytics) |
| Read via published query service | Cross-domain read without table sharing |
| Anti-corruption adapter | External systems / future extractions |

**Forbidden:** direct Prisma queries into another module’s tables.

### 2.9 External integrations

| Integration | Pattern |
|---|---|
| Payments (e.g. Razorpay) | Adapter + webhooks + idempotency |
| Email/SMS | Notification adapter |
| Object storage | Media service abstraction |
| Analytics sink | Event publisher |
| Future ERP/WMS | Explicit ACL — not in v1 |

### 2.10 Architectural constraints

1. Modules do not access foreign tables
2. Business rules stay in owning domain
3. Platform services stay business-agnostic
4. Public APIs versioned
5. Breaking changes need migration strategy
6. Cross-module deps minimized and documented
7. Infra concerns do not leak into domain layer
8. Dual design systems scoped by route/theme — architectural concern for frontend boundaries

### 2.11 Single-organization v1 assumption

PRD constraint: first production release operates as a single business organization (not multi-school multi-tenant ERP).

Architecture may keep `organization_id` nullable/ready for future, but must not invent school-tenant complexity in v1.

---

## 3. Domain-Driven Design for Inabiya

### 3.1 Why DDD here

Inabiya encodes complex policies: personalization, inventory reservation, editorial medical gates, reverse bidding, escrow-like campaign payments.

Technology layers alone will not protect that complexity — **bounded contexts** will.

### 3.2 Core principles

- Business first
- Explicit ownership
- Encapsulation of internals
- Ubiquitous language from PRD
- Prefer domain events over reach-in mutations

### 3.3 Ubiquitous language (required)

Use: Product, Variant/SKU, GiftBox, Personalization, Cart, Order, InventoryReservation, Coupon, Article, Assignment, MedicalReview, Campaign, Proposal/Bid, Creator, Brand, Deliverable

Do not use: Student, Admission, Hostel, Exam, LibraryLoan, TuitionFee, Classroom

### 3.4 Strategic domain classification

| Type | Domains |
|---|---|
| Core | Gift Commerce transaction path; Editorial trust workflow; Creator reverse bidding |
| Supporting | Promotions, merchandising, writer payouts, campaign messaging |
| Generic | Identity, media, email delivery, object storage |

Invest deeply in core domains.

### 3.5 Bounded contexts

| Context | Responsibility |
|---|---|
| Identity | Users, sessions, roles, permissions |
| Media | Assets metadata + storage pointers |
| Notifications | Templates + delivery |
| Audit | Privileged action records |
| Catalog | Products, variants, categories, collections, personalization config |
| Inventory | Stock, reservations, adjustments |
| Buying | Cart, checkout, pricing application |
| Orders | Order lifecycle, tracking, returns requests |
| Promotions | Coupons/discounts rules |
| Customer Ops | Admin CRM views over customers |
| Editorial Authorship | Assignments, drafts, editor |
| Editorial Governance | SEO/medical review gates |
| Publishing | Schedule/publish/public projection |
| Writer Ledger | Writer payment release states |
| Creator Identity | Creator/brand profiles |
| Campaign Marketplace | Campaigns, proposals, awards |
| Collaboration | Campaign messaging, deliverables |
| Campaign Ledger | Campaign payment gates |

Contexts may map 1:1 or many:1 to NestJS modules; ownership must remain clear.

### 3.6 Shared kernel

Small shared kernel only:

- IDs (UUID)
- Money value object (minor units)
- Result/error types
- Auth principal shape
- Pagination cursor types
- Correlation ID

Do not dump business enums from all domains into shared kernel.

### 3.7 Anti-corruption layers

| Boundary | ACL purpose |
|---|---|
| Payment provider | Map provider statuses → domain payment states |
| Email provider | Normalize delivery results |
| Prototype/legacy systems | Prevent Mongo/FastAPI models leaking |
| Future WMS/ERP | Isolate external schemas |

### 3.8 Context relationships (examples)

- Commerce ↔ Editorial: merchandising links / content recommendations via IDs + events — not shared tables
- Commerce ↔ Creator: campaign product mentions via references
- Editorial ↔ Creator: no conflation of medical specialists and marketplace creators
- All domains → Identity/Media/Notifications/Audit

### 3.9 Domain events (canonical examples)

`UserRegistered`  
`OrderPlaced` `OrderPaid` `OrderCancelled` `OrderShipped` `OrderDelivered`  
`InventoryReserved` `InventoryReleased` `InventoryLow`  
`ArticleSubmitted` `ArticleSeoApproved` `ArticleMedicallyApproved` `ArticlePublished`  
`WriterPaymentReleased`  
`CampaignPublished` `ProposalSubmitted` `CampaignAwarded` `DeliverableApproved` `CampaignPaymentReleased`

Consumers must be idempotent (at-least-once).

---

## 4. Backend Architecture (NestJS)

### 4.1 Modular monolith layout

```text
apps/api/src/
  main.ts
  app.module.ts
  modules/
    identity/
    media/
    notifications/
    audit/
    search/
    commerce/
      catalog/
      inventory/
      cart/
      checkout/
      orders/
      promotions/
      customers/
    editorial/
      assignments/
      articles/
      review-workflow/
      publishing/
      writer-payments/
    creator/
      profiles/
      campaigns/
      proposals/
      messaging/
      deliverables/
      campaign-payments/
    platform/
      feature-flags/
      settings/
  common/
  infrastructure/
    prisma/
    redis/
    storage/
    payments/
    mail/
```

### 4.2 Layering inside a module

```text
controller (HTTP)
  → use-case / application service
    → domain policy / aggregate
      ← repository port
infrastructure adapters implement ports (Prisma, Redis, S3, Razorpay)
```

Domain layer must not import NestJS/Prisma/Redis/HTTP clients.

### 4.3 Transaction boundaries

- One use-case owns the business transaction for its aggregate
- After commit, publish outbox/events or enqueue jobs
- Prefer transactional outbox pattern for reliable events when maturity allows; until then, carefully ordered commit+enqueue with compensating retries

### 4.4 Idempotency middleware

Required on:

- checkout finalize / place order
- payment webhooks
- campaign award
- payout/writer payment release
- bulk inventory imports

Store idempotency keys with request hash + result reference.

### 4.5 Validation

- Zod and/or Nest DTO pipes at the edge
- Domain invariants deeper inside
- Never trust client-only validation

---

## 5. Frontend Architecture (Next.js App Router)

### 5.1 Route group topology

```text
apps/web/app/
  (gift)/                # System A storefront + account
  (blog)/                # public content (System A family)
  (creator)/             # System B Creator Collective
  (admin)/
    commerce/
    editorial/
    creator/
    platform/
  layout.tsx             # root
```

Each group sets `data-theme="gift" | "creator"` per `Design.md`.

### 5.2 Rendering strategy

| Surface | Default |
|---|---|
| PLP/PDP/blog article | Server Components + cached fetches where safe |
| Builder / cart / checkout interactive | Client islands |
| Admin tables | Client interactive + server initial data |
| Auth-sensitive mutations | Server Actions **or** Nest API — both must enforce AuthZ + Zod |

Prefer Nest API as system-of-record interface. Server Actions are borders, not a second business layer.

### 5.3 State

- Server state: TanStack Query
- Auth session: httpOnly cookie strategy preferred
- Cart: dedicated client store with deterministic guest→user merge
- No Redux unless ADR proves need

### 5.4 BFF caution

Avoid duplicating domain logic in Next route handlers. If BFF aggregation is needed, keep it thin.

### 5.5 Design system architecture

Shared UI package/primitives consume CSS variables.  
Theme tokens differ by `data-theme`.  
Never hardcode System A pink into Creator routes.

---

## 6. Data Architecture

### 6.1 System of record

PostgreSQL is authoritative for transactional business state.

Redis is **not** a source of truth.  
Search indexes are rebuildable projections.  
Object storage holds bytes; DB holds metadata.

### 6.2 Prisma standards

- Schema is canonical relational model
- All changes via migrations
- UUID/ULID public IDs
- Money as integer paise or Decimal — never float
- Explicit status enums
- Named indexes for hot paths
- Soft delete only when PRD requires recoverability/audit

### 6.3 Schema ownership by context (illustrative)

**Identity:** users, credentials, roles, permissions, sessions/refresh tokens  
**Media:** media_assets, media_variants  
**Audit:** audit_logs  
**Catalog:** products, product_variants, categories, collections, product_media, personalization_options  
**Inventory:** inventory_items, inventory_transactions, inventory_reservations  
**Buying:** carts, cart_lines  
**Orders:** orders, order_lines, order_status_history, payments, refunds, return_requests  
**Promotions:** coupons, coupon_redemptions, promotion_rules  
**Editorial:** assignments, articles, article_versions, article_reviews, publish_schedules  
**Writer ledger:** writer_payment_entries  
**Creator:** creator_profiles, brand_profiles, campaigns, proposals, messages, deliverables, campaign_payments, ratings

Exact column design evolves via migrations; ownership does not.

### 6.4 Referential rules across contexts

Prefer storing foreign IDs without cross-context JOINs in business services.  
Reporting may use carefully governed read models/views later — not as an excuse for write-time coupling.

### 6.5 Inventory consistency

- Reservation on checkout intent/payment start (policy TBD in use-case, but must be explicit)
- Release on cancel/fail
- Prevent implicit negative stock
- Admin adjustments audited

### 6.6 Outbox / projections

As scale grows:

- `outbox_events` table for reliable publish
- projection workers for search and recommendation feeds

---

## 7. API Architecture

### 7.1 Style

REST-first, versioned:

```text
/api/v1/products
/api/v1/cart
/api/v1/orders
/api/v1/articles
/api/v1/campaigns
/api/v1/campaigns/:id/proposals
```

### 7.2 Conventions

- Plural nouns
- Nested only for true ownership
- Cursor pagination preferred for public lists
- UTC ISO-8601 timestamps
- Consistent error envelope (`Rules.md`)

### 7.3 Error envelope

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "One or more items are no longer available.",
    "details": [],
    "requestId": "req_..."
  }
}
```

### 7.4 Auth on every protected route

Identity verification → permission/ownership → handler.

### 7.5 Webhooks

Payment webhooks:

- signature verify
- idempotency key / provider event id uniqueness
- fast ACK + async finalize when needed
- never trust client-reported payment success alone

---

## 8. Event & Job Architecture

### 8.1 BullMQ usage

Queues (examples):

- `notifications`
- `payments.webhooks`
- `media.process`
- `search.index`
- `editorial.publish`
- `inventory.alerts`
- `payouts`
- `analytics`

### 8.2 Job rules

- Idempotent handlers
- Explicit retries/backoff
- Dead-letter visibility
- Correlation IDs
- Timeout budgets

### 8.3 Sync vs async guideline

| Sync in request | Async via queue |
|---|---|
| Auth, price calc, reserve stock, create order row | Email, image variants, search index, non-critical analytics |
| Validate medical gate on publish command | Fan-out notifications after publish commit |

---

## 9. Authentication & Authorization

### 9.1 Principles

- Zero implicit trust
- Least privilege
- UI hiding ≠ authorization
- Defense in depth
- Complete audit for privileged actions

### 9.2 Authentication

- Registration / login / logout / password reset
- JWT access (short-lived) + refresh
- Prefer httpOnly Secure cookies for browser session transport
- MFA optional elevation for admin/finance later

### 9.3 Roles (v1)

Customer, Commerce Admin, Content Admin, Writer, SEO Editor, Medical Reviewer, Creator, Brand, Finance, Support, Super Admin

### 9.4 Authorization model

- Role permissions for admin tools
- Resource ownership checks (orders, proposals, articles)
- Workflow state gates (cannot publish without medical approval when required)
- IDOR prevention on all sensitive IDs

### 9.5 Permission examples

| Action | Who |
|---|---|
| Place order | Customer / guest checkout policy |
| Fulfill order | Commerce Admin / Support limited |
| Submit article | Writer |
| SEO approve | SEO Editor |
| Medical approve | Medical Reviewer |
| Publish | Content Admin (after gates) |
| Create campaign | Brand |
| Submit proposal | Creator |
| Release payouts | Finance / Super Admin |

### 9.6 Audit

Log: login failures, role changes, refunds, payout releases, permission denials, article publish, campaign award.

---

## 10. Media & Storage Architecture

### 10.1 Principles

- Files are not DB rows
- DB stores metadata; object storage stores bytes
- Private by default; signed URLs for restricted assets
- Immutable versions preferred

### 10.2 Flow

```text
Client → Media API → validate → store object → save metadata → optional process job (variants)
```

### 10.3 Categories

Product images, gift personalization assets, article hero/inline media, creator portfolio, campaign briefs/deliverables, admin exports.

### 10.4 Security

MIME/size checks, malware scanning path for production, no executable inline serve, CDN for public product/blog assets.

---

## 11. Search Architecture

### 11.1 v1

PostgreSQL full-text / trigram for products & articles acceptable.

### 11.2 Evolution

Dedicated search engine (OpenSearch/Elastic/Meilisearch/Typesense) behind Search module adapter when scale requires.

### 11.3 Rules

- Search index is projection
- Rebuildable from PostgreSQL
- Index updates via jobs on product/article change events

---

## 12. Caching Architecture

### 12.1 Redis roles

- HTTP/API response cache where safe
- Session/rate-limit buckets
- Distributed locks (careful, short TTL)
- BullMQ backend

### 12.2 Rules

- Cache is optimization, not correctness dependency
- Invalidate via events (product published, article published, price changed)
- Checkout/payment paths must remain correct if Redis is down (degrade cache, keep DB path)

---

## 13. Payments Architecture

### 13.1 Shared payment primitive + domain gates

Platform payment adapter handles provider APIs.  
Domains decide **when** money may capture/release:

- Commerce: order payment lifecycle
- Editorial: writer payment release
- Creator: campaign escrow/release after deliverable approval

### 13.2 Commerce payment flow (conceptual)

```text
Checkout → create payment intent → redirect/confirm
  → provider webhook
  → verify + idempotent finalize
  → OrderPaid event
  → notifications + inventory finalize
```

### 13.3 Hard requirements

- No raw PAN/CVV storage
- Idempotent webhooks
- Explicit mapping to domain payment states
- Compensating actions on failures

---

## 14. Domain Architectures (summary)

### 14.1 Gift Commerce

Capabilities: discovery, personalization, gift box, cart, checkout, orders, tracking, wishlist, reviews

Critical invariants:

- Line personalization isolation
- Coupon stack rules
- Inventory reservation correctness
- Deterministic money math
- Legal order transitions only

### 14.2 Commerce CMS

Capabilities: product ops, inventory ops, order fulfillment, customers, discounts, homepage CMS, reports

Critical invariants:

- Admin actions audited
- Suspension blocks new orders
- Stock adjustments explicit

### 14.3 Editorial Platform

Capabilities: assignment → write → SEO → medical → approve → schedule/publish → writer payment

Critical invariants:

- Unpublished not publicly routable
- Required medical gate unbypassable
- Publish via job for schedules

### 14.4 Creator Collective

Capabilities: profiles, campaigns, reverse bids/proposals, messaging, deliverables, ratings, payments

Critical invariants:

- Closed campaign rejects proposals
- Award rules explicit
- Payment release requires approval gates
- System B theme isolation

Specialists (medical) ≠ Creators (marketplace). Separate models/routes.

---

## 15. Security Architecture

### 15.1 Controls

HTTPS, secrets manager, least privilege DB users, rate limits, CSRF strategy aligned to auth transport, security headers, dependency scanning, input validation, output encoding.

### 15.2 Threat focus areas

- Checkout fraud / payment replay
- IDOR on orders/proposals/articles
- Privilege escalation across admin roles
- XSS in article/rich content
- Upload abuse
- Coupon abuse

### 15.3 Content security

Sanitize rich text storage/rendering pipelines for editorial and messaging.

---

## 16. Observability

### 16.1 Pillars

- Logs: structured, correlation IDs, no secrets/PII sprawl
- Metrics: latency, error rate, saturation, queue lag, payment failure rate, checkout conversion technical funnels
- Traces: request across web→api→db/queue where available

### 16.2 Health

- Liveness: process up
- Readiness: DB (and critical deps) reachable

### 16.3 Alerting examples

Spike in 5xx, webhook processing failures, queue DLQ growth, checkout success collapse, publish job failures.

---

## 17. Deployment Architecture

### 17.1 Environments

Local · Staging · Production

### 17.2 Early topology

- Containerized `web`, `api`, `worker`
- Managed PostgreSQL
- Managed Redis
- S3-compatible bucket + CDN
- CI: lint, typecheck, unit tests, migrations dry-run

### 17.3 Release strategy

- Rolling deploys
- Backward-compatible migrations first
- Feature flags for risky launches
- Webhook endpoints must stay compatible during rollout

### 17.4 Config

12-factor config via env; no secrets in images/git.

---

## 18. Scalability Strategy

### 18.1 Horizontal first

Stateless api/web/worker replicas behind load balancer.

### 18.2 Data scale levers

- Indexes + query budgets
- Read replicas later for heavy read paths
- Cache popular PLP/PDP fragments carefully
- Move search to dedicated engine when needed
- Partition/archive old audit/event tables later

### 18.3 Hot paths to protect

- PDP + cart + checkout
- Payment webhooks
- Article public reads
- Campaign proposal storms near deadlines

---

## 19. Reliability & Disaster Recovery

### 19.1 Failure isolation

Payment provider down → controlled degrade, clear UX, no silent success  
Redis down → platform remains correct on DB for critical paths  
Search down → browse/category fallback  
Notification down → queue + retry

### 19.2 DR basics

- PostgreSQL automated backups + tested restore
- Object storage redundancy
- Runbooks for rollback, webhook replay, queue drain
- RPO/RTO targets defined before GA (record in Memory)

---

## 20. Folder Structure (canonical target)

```text
/
  apps/
    web/                 # Next.js
    api/                 # NestJS
    worker/              # optional split
  packages/
    ui/
    config/
    validation/
    types/
  prisma/                # or apps/api/prisma
  docs/                  # product engineering docs (or linked)
  pnpm-workspace.yaml
  turbo.json             # optional
```

Exact paths may vary slightly; separation of concerns must not.

---

## 21. Testing Architecture

| Layer | Focus |
|---|---|
| Domain unit | State transitions & invariants |
| Use-case | AuthZ + workflows |
| API contract | Critical endpoints |
| Webhook integration | Duplicate delivery |
| E2E (Playwright) | Checkout, publish, reverse-bid happy paths |
| Load | Checkout & publish before GA |

---

## 22. Migration & Evolution

### 22.1 From prototype (CRA/FastAPI/Mongo)

- Treat as behavioral reference only
- Recreate schemas in PostgreSQL deliberately
- Do not dual-write long term without plan
- Port features by phase, not big-bang rewrite of UI+API simultaneously without gates

### 22.2 Future extractions services candidates

1. Worker fleet
2. Search
3. Notification dispatcher
4. Media processing
5. Only later: isolated commerce/editorial services if scale/org needs demand

### 22.3 Future product stages (architecture readiness)

Marketing automation, subscriptions, community, mobile apps — extend via new modules/contexts following same rules; do not collapse into existing aggregates carelessly.

---

## 23. Architecture Governance

### 23.1 ADRs required for

- Stack changes
- New datastores
- Microservice extraction
- Payment provider change
- Auth transport change
- Cross-context coupling exceptions

### 23.2 Standards owned with Rules.md

Coding, API, DB, security, folder conventions.

### 23.3 Review triggers

New module, external integration, schema redesign, security model change, platform-wide library adoption.

### 23.4 Exception process

Justification → risk → alternatives → timebox → approval → Memory + ADR.

### 23.5 Documentation sync

Architecture is living. Update when seams change. Memory records interim decisions.

---

## 24. Non-Goals (Architecture v1)

Explicitly not architectural targets for first production path:

- Multi-institution school ERP tenancy
- Microservices default
- Event-sourcing everything
- Real-time multiplayer collaboration platform
- Multi-vendor third-party seller marketplace
- Native mobile clients as primary
- Telemedicine/live consultation stacks

---

## 25. Traceability Matrix (PRD → Architecture)

| PRD area | Architecture home |
|---|---|
| Personas/roles | Identity + AuthZ §9 |
| Shared services §20 | Platform modules §2.5 |
| Gift commerce PART 4 | Commerce domains §14.1 + data §6 |
| Cart/checkout/payments | Buying/Orders + Payments §13 |
| Commerce CMS PART 5 | Commerce CMS §14.2 |
| Editorial PART 6 | Editorial §14.3 + jobs §8 |
| Creator Collective | Creator §14.4 + Design System B |
| Exclusions §19 | Non-goals §24 + Phases future epics |
| Web-first constraint | Frontend §5, Deployment §17 |

---

## 26. Implementation Sequence Alignment

Architecture is delivered through `Phases.md`:

| Phase | Architecture outcome |
|---|---|
| 0 | Monorepo, api/web/worker skeleton, prisma/redis/queues |
| 1 | Identity/media/audit/notifications primitives |
| 2–5 | Commerce contexts vertically sliced |
| 6–7 | Editorial + publishing projections |
| 8 | Creator contexts + System B theme boundary |
| 9 | Hardening, SLOs, DR drills |

Do not implement Phase 8 data model during Phase 0 “because future.”

---

## 27. Quality Attributes Checklist

Before calling an incremental architecture “done” for a phase:

- [ ] Boundary respected (no foreign table writes)
- [ ] AuthZ on new mutations
- [ ] Idempotency where required
- [ ] Errors typed
- [ ] Jobs idempotent
- [ ] Observability hooks present
- [ ] Migrations included
- [ ] Design theme scope correct for UI surfaces
- [ ] Memory updated

---

## 28. Glossary

| Term | Meaning |
|---|---|
| Modular monolith | One deployable with hard module boundaries |
| Bounded context | Explicit linguistic/model boundary |
| System of record | PostgreSQL for transactional truth |
| Projection | Derived read model (search/cache) |
| Idempotency key | Client/provider key preventing duplicate side effects |
| System A / B | Gift vs Creator design systems |
| Outbox | Reliable event publication pattern |

---

## 29. Open Architecture Decisions (track in Memory)

These are intentionally open at rewrite time:

1. Exact monorepo root path
2. Payment provider selection
3. Cookie vs bearer primary browser auth transport details
4. Whether worker is separate deployable from day one
5. Search engine choice timing
6. RPO/RTO numeric targets for GA

Do not block Phase 0 on (2)/(5)/(6).

---

## 30. End State Vision (without premature complexity)

Inabiya becomes a coherent parenting ecosystem platform:

- Premium personalized commerce core
- Trusted medically-gated editorial engine
- Creator marketplace with reverse bidding
- Shared identity, media, payments, and audit spine

Architecturally it remains understandable: modules with owners, Postgres truth, Redis speed, queues for async, Next.js for experience, NestJS for policy enforcement.

---

---

## 31. Detailed Commerce Domain Architecture

### 31.1 Commerce bounded context map

```text
Catalog ──► Inventory ──► Buying(Cart/Checkout) ──► Orders
   │                           │                      │
   │                           ├── Promotions          ├── Payments
   │                           └── Pricing             └── Returns
   └── Merchandising/Homepage CMS (admin)
```

### 31.2 Catalog aggregate responsibilities

**Product aggregate root** owns:

- Identity, titles, descriptions, SEO fields
- Publish state (draft/published/archived)
- Media references (IDs only)
- Category/collection memberships
- Personalization option definitions
- Variant/SKU children

**Variant/SKU** owns:

- SKU code
- Price (minor units)
- Attributes (size/color/etc.)
- Inventory item linkage
- Gift-box eligibility flags

Rules:

- Unpublished products are not publicly listable
- Personalization config changes do not mutate historical order lines
- Price changes do not rewrite past orders

### 31.3 Inventory aggregate responsibilities

**InventoryItem** per SKU (v1 may be single-warehouse):

- `on_hand`
- `reserved`
- `available` (= on_hand - reserved) computed or maintained consistently
- Low-stock threshold

**InventoryReservation**

- Linked to cart/checkout/order attempt
- TTL or explicit release triggers
- Must release on payment failure/cancel

**InventoryTransaction** (append-only ledger preferred)

- receive, adjust, reserve, release, sell, return, damage

Illegal states:

- available < 0
- reserve without stock
- silent oversell

### 31.4 Cart & checkout architecture

**Cart**

- Guest cart id (cookie) and/or user id
- Lines contain: skuId, qty, personalization payload snapshot, gift-box membership if any
- Pricing recomputed server-side on read/mutate (never trust client totals)

**Checkout use-case steps (logical)**

1. Validate cart lines & personalization
2. Validate addresses/shipping
3. Apply coupon under stack policy
4. Quote tax/shipping (MVP subset)
5. Create order in `pending_payment` (or equivalent)
6. Reserve inventory
7. Create payment intent via adapter
8. Return client redirect/confirm payload

On payment success webhook:

9. Mark order paid (idempotent)
10. Convert reservations to sale consumption
11. Emit `OrderPaid`
12. Enqueue confirmation notification

On failure/cancel:

9b. Release reservations
10b. Mark payment failed / order cancelled per policy
11b. Emit compensating events

### 31.5 Order state machine (architecture-level)

```text
[draft/checkout] → pending_payment → paid → processing → packed → shipped → delivered
                              syn          ↘ cancelled
paid/processing/shipped may enter return_requested → refunded/replaced (policy-defined)
```

Illegal examples:

- delivered → pending_payment
- cancelled → shipped without replacement order flow
- paid twice for same idempotency key

### 31.6 Pricing architecture

Server-side price engine inputs:

- SKU base price
- Personalization add-ons
- Gift box composition rules
- Coupon/promotion adjustments
- Shipping quote

Outputs immutable snapshot onto order lines at purchase time.

### 31.7 Promotions architecture

v1 engine supports:

- Percentage / fixed amount coupons
- Min cart value
- Expiry
- Usage limits
- Explicit non-stack default

Full PRD stackability matrix can deepen without changing module ownership.

### 31.8 Returns & refunds architecture

Return request is a domain object referencing order lines.

Refunds go through payment adapter with idempotency and finance authorization where required.

Inventory restock is explicit decision (restockable vs damaged).

---

## 32. Detailed Editorial Domain Architecture

### 32.1 Context split

| Context | Owns |
|---|---|
| Authorship | assignments, drafts, editor content, writer dashboard |
| Governance | SEO review, medical review, comments/change requests |
| Publishing | schedule, public projection, SEO metadata on publish |
| Writer Ledger | payment eligibility & release |

### 32.2 Article state machine

```text
assigned → drafting → seo_review → medical_review → approved → scheduled → published
                ↑          │              │
                └──────────┴── changes_requested (loop)
published → unpublished/archived (admin policy)
```

Rules:

- Public routes resolve only `published` (and currently effective scheduled jobs that already flipped)
- If medical gate required, publish blocked without medical approval
- Writer cannot self-approve medical/SEO
- Status transitions write audit + optional domain events

### 32.3 Assignment architecture

Assignment references:

- article stub or brief
- writer user id
- due date
- priority
- required review gates flags

### 32.4 Publishing pipeline

```text
Approve → (optional) schedule row → BullMQ publish job at time
        → create public projection
        → set canonical URL
        → enqueue search index
        → enqueue notifications (newsletter optional)
        → emit ArticlePublished
```

### 32.5 Specialist profiles architecture

Editorial specialists/experts are content trust entities.

They are **not** Creator Collective creators.

Separate tables/routes/UI chrome.

### 32.6 Writer payments architecture

Payment entry becomes eligible after policy (e.g., published + admin/finance release).

Release is privileged, audited, idempotent.

---

## 33. Detailed Creator Collective Architecture

### 33.1 Context split

| Context | Owns |
|---|---|
| Profiles | creator & brand profiles, onboarding |
| Marketplace | campaigns, listing eligibility |
| Bidding | proposals/bids (reverse bidding) |
| Collaboration | messaging, deliverables |
| Ratings | post-completion ratings |
| Campaign Ledger | payment hold/release gates |

### 33.2 Campaign state machine

```text
draft → open → reviewing → awarded → in_delivery → completed
                 syn           ↘ cancelled / expired
```

### 33.3 Proposal/bid architecture

- Creator submits proposal against open campaign
- Contains bid/commercial terms + pitch + portfolio refs
- Duplicate active proposals per creator/campaign constrained by policy
- Closed/awarded campaigns reject new proposals

### 33.4 Award flow

```text
Brand selects proposal → CampaignAwarded event
  → notify winner/losers
  → lock campaign from new bids
  → open deliverable workspace
```

### 33.5 Deliverable & payment gates

```text
submitted → changes_requested → approved → payment_eligible → payment_released
```

Architecture rule: campaign ledger must not release because UI clicked “pay”; domain gate required.

### 33.6 Messaging architecture

Campaign-scoped threads between brand and awarded creator (MVP).

Not a global social graph in v1.

### 33.7 Frontend architecture note

All Creator Collective UI under `data-theme="creator"` (System B).  
No Soft Gift pink tokens.

---

## 34. Identity & Access Deep Dive

### 34.1 User model

A single `users` identity can hold one primary role or multiple roles via join table (prefer flexible role assignment).

Some actors are organizations (Brand) represented by users with brand membership.

### 34.2 Session architecture

Recommended:

- Access token short TTL
- Refresh token rotated
- Refresh reuse detection optional hardening
- Server-side revoke list/version for logout-all

### 34.3 AuthZ evaluation order

1. Authenticated?
2. Role allows action type?
3. Resource ownership or admin scope?
4. Workflow state allows transition?
5. Feature flag enabled?

Deny by default.

### 34.4 Admin surface separation

| Admin area | Route group | Theme family |
|---|---|---|
| Commerce ops | `(admin)/commerce` | Soft Gift dense |
| Editorial ops | `(admin)/editorial` | Soft Gift dense / editorial-dense |
| Creator ops | `(admin)/creator` | Creator dense |
| Platform | `(admin)/platform` | neutral dense |

---

## 35. API Resource Catalog (v1 target map)

> Not every resource is built in Phase 0. This is the architectural map.

### 35.1 Identity

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/password/forgot`
- `POST /api/v1/auth/password/reset`
- `GET /api/v1/me`

### 35.2 Media

- `POST /api/v1/media`
- `GET /api/v1/media/:id`
- `DELETE /api/v1/media/:id` (authZ)

### 35.3 Catalog (public)

- `GET /api/v1/categories`
- `GET /api/v1/collections`
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/search/products`

### 35.4 Cart / checkout

- `GET/POST/PATCH/DELETE /api/v1/cart...`
- `POST /api/v1/checkout/quote`
- `POST /api/v1/checkout/place` (idempotent)
- `POST /api/v1/payments/webhooks/:provider`

### 35.5 Orders (customer)

- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/return-requests`

### 35.6 Commerce admin

- `/api/v1/admin/products...`
- `/api/v1/admin/inventory...`
- `/api/v1/admin/orders...`
- `/api/v1/admin/customers...`
- `/api/v1/admin/coupons...`
- `/api/v1/admin/homepage...`
- `/api/v1/admin/reports/commerce...`

### 35.7 Editorial

- `/api/v1/editorial/assignments...`
- `/api/v1/editorial/articles...`
- `/api/v1/editorial/articles/:id/transition`
- `/api/v1/editorial/payments...`
- Public: `GET /api/v1/public/articles`, `GET /api/v1/public/articles/:slug`

### 35.8 Creator

- `/api/v1/creator/profile...`
- `/api/v1/brand/campaigns...`
- `/api/v1/campaigns` (marketplace list)
- `/api/v1/campaigns/:id/proposals`
- `/api/v1/campaigns/:id/award`
- `/api/v1/campaigns/:id/messages`
- `/api/v1/deliverables...`
- `/api/v1/campaign-payments...`

---

## 36. Sequence Diagrams (textual)

### 36.1 Place order + pay

```text
Web                API                 Prisma              Provider           Worker
 |--place checkout-->|                    |                   |                 |
 |                   |--tx create order-->|                   |                 |
 |                   |--reserve stock---->|                   |                 |
 |                   |--create intent------------------------>|                 |
 |<--redirect/confirm|                    |                   |                 |
 |                   |<--webhook--------------------------------|                 |
 |                   |--idempotent paid-->|                   |                 |
 |                   |--emit OrderPaid----|-------------------|--email/index--> |
```

### 36.2 Publish article

```text
Editor UI → transition(approved/schedule) → API validates gates
  → write schedule/publish → commit
  → enqueue publish job → worker flips public projection → search index → events
```

### 36.3 Reverse bid award

```text
Brand UI → award(proposalId) → API checks campaign open/reviewing
  → mark awarded + reject remaining per policy
  → emit CampaignAwarded → notify → open deliverable workspace
```

---

## 37. Data Model Notes (Prisma direction)

### 37.1 Conventions

- `id String @id @default(uuid())` or ULID
- `createdAt` / `updatedAt`
- `deletedAt` only when soft delete required
- money ints: `pricePaise Int`
- enums for statuses
- `@@index` on foreign keys and status/createdAt pairs

### 37.2 Example commerce excerpts (illustrative)

```prisma
model Product {
  id          String   @id @default(uuid())
  slug        String   @unique
  title       String
  status      ProductStatus
  variants    ProductVariant[]
  media       ProductMedia[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ProductVariant {
  id         String @id @default(uuid())
  productId  String
  sku        String @unique
  pricePaise Int
  product    Product @relation(fields: [productId], references: [id])
  inventory  InventoryItem?
}

model InventoryItem {
  id        String @id @default(uuid())
  variantId String @unique
  onHand    Int
  reserved  Int
}

model Order {
  id          String @id @default(uuid())
  userId      String?
  status      OrderStatus
  currency    String @default("INR")
  totalPaise  Int
  lines       OrderLine[]
  payments    Payment[]
}
```

Editorial/creator models follow same conventions with their own enums/relations — never shared with LMS entities.

### 37.3 Multi-module join prohibition

Application services must not `include` arbitrary foreign-module graphs to “make UI easy.”  
Compose via explicit query services or BFF aggregations that call owning modules.

---

## 38. Non-Functional Architecture Targets (initial)

| Attribute | Initial target (tune in Phase 9) |
|---|---|
| API p95 (read) | < 300ms intra-region excluding cold start |
| Checkout place p95 | < 800ms before provider redirect |
| Webhook ack | < 200ms then async finalize if needed |
| Public article TTFB | optimize via RSC/CDN |
| Availability | aspire 99.9% after GA hardening |
| RPO | backup-defined (set numeric in Memory before launch) |
| RTO | runbook-defined |

These are architectural intentions, not yet contractual SLOs until Phase 9 sign-off.

---

## 39. Threat Model Snapshot

| Threat | Mitigation |
|---|---|
| Payment replay | Idempotent event IDs + signature verify |
| Coupon brute force | Rate limit + tight validation |
| IDOR orders | ownership checks |
| Privilege escalation | role tests + least privilege |
| XSS in articles | sanitize + CSP |
| Upload malware | type/size + scanning path |
| Admin token theft | short TTL + secure cookies + revoke |
| Mass proposal spam | rate limits + campaign caps |

---

## 40. Environment Topology Details

### 40.1 Local

- Docker Compose: postgres, redis, minio (or S3 mock), mailhog
- `web` + `api` + `worker` on host or compose

### 40.2 Staging

- Production-like config
- Test payment keys
- Seed data for demos
- Webhook tunneling as needed

### 40.3 Production

- Managed Postgres with backups
- Redis HA
- Object storage + CDN
- Horizontal api/web/worker
- Secrets manager
- Central logs/metrics

---

## 41. CI/CD Architecture

Pipeline stages:

1. Install (pnpm)
2. Lint
3. Typecheck web+api
4. Unit tests
5. Prisma migrate diff check
6. Build
7. Deploy staging
8. Smoke tests
9. Promote production

Migration rule: expand-contract for breaking changes; never destructive drop without plan.

---

## 42. Logging & Audit Event Catalog (minimum)

### 42.1 Security/audit

- `auth.login.success` / `auth.login.failure`
- `authz.denied`
- `role.changed`
- `refund.initiated`
- `payout.released`
- `article.published`
- `campaign.awarded`

### 42.2 Operational

- `order.paid`
- `inventory.low`
- `webhook.processed`
- `job.failed`
- `publish.executed`

Every event includes `requestId`/`correlationId` where applicable.

---

## 43. Feature Flag Architecture

Flags control risky launches:

- new checkout path
- promotions engine enhancements
- editorial public comments
- creator marketplace open registration

Flags evaluated server-side for security-sensitive paths.

---

## 44. Internationalization & Currency Posture

v1 India/web-first:

- INR minor units
- IST display formatting in UI, UTC storage
- i18n framework may be installed ready, but multi-language content is future

Do not hardcode multi-currency complexity into early aggregates without ADR.

---

## 45. Mobile Strategy (architecture)

PRD excludes native apps in v1.

Architecture keeps:

- API-first contracts
- auth token compatibility
- responsive web

Native clients later consume same `/api/v1` without rewriting domains.

---

## 46. Analytics Architecture

### 46.1 Product analytics events (examples)

`product_viewed`, `add_to_cart`, `checkout_started`, `order_paid`, `article_viewed`, `proposal_submitted`, `campaign_awarded`

### 46.2 Path

Domain/event → worker → analytics sink (vendor or warehouse later)

Do not block checkout on analytics failure.

---

## 47. Content Delivery Architecture

- Public product/blog assets via CDN
- HTML from Next.js (SSR/RSC) with caching policies carefully chosen for personalized pages
- Cart/checkout pages: no shared public cache of private data

---

## 48. Backup & Restore Architecture

| Asset | Strategy |
|---|---|
| PostgreSQL | Automated daily + PITR if provider supports |
| Redis | Ephemeral; rebuild from DB/queues |
| Object storage | Versioning + redundancy |
| Secrets | Managed store, not backed up in git |

Restore drills mandatory in Phase 9.

---

## 49. Module Extraction Criteria (when to break monolith)

Extract a module only if most are true:

1. Independent scaling pain proven
2. Independent release cadence needed
3. Clear API already exists
4. Team ownership isolated
5. Ops ready for distributed failure modes
6. ADR approved

Candidates order: worker → search → notifications → media processing → (rare) business domains.

---

## 50. Architecture Compliance Checklist for PRs

Reviewers verify:

- [ ] No foreign-module table access
- [ ] Use-case contains business rules (not controller)
- [ ] AuthZ present
- [ ] Idempotency for money/state transitions
- [ ] Migration included if schema changes
- [ ] Job/event side effects not doing hidden sync work incorrectly
- [ ] Theme boundary respected in UI
- [ ] Errors use envelope
- [ ] Tests for critical invariants when touched
- [ ] Memory updated if decision-worthy

---

## 51. Mapping Old Contaminated Concepts → Inabiya

| If you see in old notes… | Replace with… |
|---|---|
| Student | Customer / Parent / User |
| Admission | Onboarding / Registration |
| Fee invoice | Order payment / writer payout / campaign payment |
| Attendance | (delete — not applicable) |
| Hostel | (delete) |
| Exam | (delete) |
| Library book loan | Media asset borrow? **No** — delete concept |
| Multi-school tenant | Single-org v1; future org model only with ADR |
| LMS module map | Commerce / Editorial / Creator / Platform |

---

## 52. Worked Example: Adding a New Capability

Example: “Add gift message after paid order”

1. Confirm PRD allowance / write tiny ADR if ambiguous
2. Identify owning context: Orders
3. Add schema migration on order tables only
4. Use-case `UpdateGiftMessage` with AuthZ + state guard (maybe only before shipment)
5. API route under orders
6. UI in gift account theme
7. Audit if admin override
8. Tests for illegal state
9. Memory note if policy decision new

Do **not** put this in Editorial or Creator modules.

---

## 53. Capacity Planning Thoughts (directional)

Early production:

- Start with small api/web/worker pools
- Watch checkout p95 + webhook lag
- Scale workers before api if queue lag dominates
- Add read replica when admin reports + storefront reads contend

Do not pre-build Kubernetes complexity if a managed container platform suffices initially — choose in Phase 0/9 ops decisions.

---

## 54. Documentation Debt Cleared by v2

Cleared:

- LMS domain diagrams presented as Inabiya
- School tenancy as default
- Education ubiquitous language
- Misleading “thousands of orgs campuses” framing as core identity

Retained (valid):

- Modular monolith rationale
- Postgres + Redis posture
- Security principles
- Governance/ADR culture
- Event-driven collaboration ideas

---

## 55. Final Authority Statement

For engineering implementation of Inabiya:

1. **Product behavior** → `PRD.md`
2. **Technical structure** → `Architecture.md` v2 (this file)
3. **Coding law** → `Rules.md` v2
4. **Sequence** → `Phases.md` v2
5. **Visual systems** → `Design.md` v2
6. **Current progress** → `Memory.md`

Any conflict with v1 architecture drafts: **v2 wins**.

---

**End of Architecture.md v2.0.0**

Document status: Canonical. Previous LMS-contaminated draft superseded.
)
