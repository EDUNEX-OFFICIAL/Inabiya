# Inabiya
# Engineering Rules & AI Coding Boundaries

Version: 2.0.0

Status: Active — Production Authority

Document Owner: Engineering Leadership

Stakeholders:
Engineering
Architecture
Security
QA
DevOps
Product
AI Coding Assistants

Last Updated: July 2026

---

## 1. Document Purpose

This document is the non-negotiable engineering constitution for Inabiya.

| Document | Answers |
|---|---|
| `PRD.md` | What must the product do? |
| `Architecture.md` | How is the system structured? |
| `Rules.md` | What may engineers and AI do / never do while building? |
| `Phases.md` | In what order do we build? |
| `Design.md` | How must it look and feel? |
| `Memory.md` | What is the current truth of progress? |

If a delivery trade-off conflicts with these rules, **stop and escalate**. Convenience is not an exception path.

### 1.1 Goals of this document

1. Prevent tech-stack drift
2. Protect domain boundaries across four products
3. Force production-safe defaults (auth, money, inventory, payments, publishing)
4. Make AI coding assistants predictable and scoped
5. Keep long-term maintainability higher than short-term speed

### 1.2 Authority order

When ambiguity exists, resolve in this order:

1. `PRD.md` — product behavior & business rules
2. `Architecture.md` — system structure *(with caveat in §1.3)*
3. `Rules.md` — coding / stack / safety rules (this file)
4. `Design.md` — visual & interaction standards
5. `Phases.md` — sequencing
6. `Memory.md` — current progress & open decisions

### 1.3 Architecture.md caveat (mandatory)

`Architecture.md` currently contains some education/LMS template residue (Admissions, Hostel, Exams, etc.).

For implementation:

- **Use** Architecture principles that match Inabiya: modular monolith, DDD boundaries, PostgreSQL system of record, Redis as cache, events, security posture.
- **Do not implement** education domains.
- **Product domains always come from `PRD.md`:** Gift Commerce, Commerce CMS, Editorial Platform, Creator Collective + shared platform services.

---

## 2. Approved Technology Stack (Locked)

Changing any item below requires an ADR + engineering lead approval.

### 2.1 Core stack

| Layer | Approved | Forbidden alternatives |
|---|---|---|
| Language | TypeScript strict | Untyped JS as default, Python as primary backend |
| Frontend | Next.js App Router | CRA, Vite SPA as primary, Pages Router for new work |
| Backend | NestJS modular monolith | FastAPI/Django/Flask as primary API |
| ORM | Prisma | TypeORM, Sequelize, Drizzle, Mongoose |
| Database | PostgreSQL | MongoDB as system of record |
| Cache | Redis | Using Redis as durable business DB |
| Jobs | BullMQ on Redis | Ad-hoc fire-and-forget background hacks |
| UI kit | Tailwind + shadcn/ui + Radix | MUI / Ant / Chakra as primary |
| Validation | Zod | Ad-hoc untyped validation |
| Forms | react-hook-form + Zod | Uncontrolled sprawl without schema |
| Icons A | lucide-react | emoji-as-icons |
| Icons B | lucide-react + Phosphor | random icon packs per page |
| Dates | `date-fns` **or** `luxon` (pick one repo-wide) | mixing both |
| Client data | TanStack Query | Redux/MobX as default server-state |
| Auth | JWT access + refresh | long-lived tokens in localStorage without hardening plan |
| Files | S3-compatible object storage | DB BYTEA / base64 blobs for media |
| API | REST `/api/v1` first | unversioned public APIs |
| Packages | pnpm workspaces | npm/yarn drift without ADR |
| Tests | Vitest (unit) + Playwright (e2e) preferred | zero-test merges for critical paths |

### 2.2 Allowed supporting libraries (no ADR needed)

- `clsx`, `tailwind-merge`
- `framer-motion` (intentional motion only)
- `sonner` toasts
- NestJS Helmet / security middleware equivalents
- `nestjs-pino` or equivalent structured logging
- Payment SDKs **only behind adapters**
- Email/SMS SDKs **only behind notification adapters**
- OpenAPI generators if they do not dictate domain design

### 2.3 Explicitly forbidden without ADR

1. Second ORM beside Prisma
2. Microservices-by-default
3. Direct cross-module table access
4. Client-side payment secrets
5. Storing secrets in git
6. `any` to silence TypeScript
7. Prototype stack (CRA + FastAPI + Mongo) in production codepaths
8. LMS vocabulary models (Student, Hostel, Tuition…)
9. Invented third brand palette outside `Design.md`
10. Disabling auth/validation/tests “temporarily” and shipping it

### 2.4 Prototype legacy rule

Older CRA/FastAPI/Mongo code may be used only as **behavioral reference**.  
It is not architecture, not schema truth, and not folder template.

---

## 3. Monorepo & Folder Conventions

### 3.1 Expected layout

```text
/
  apps/
    web/                 # Next.js App Router
    api/                 # NestJS modular monolith
    worker/              # BullMQ processors (optional split; may live in api initially)
  packages/
    ui/                  # shared themed primitives (optional)
    config/              # eslint/tsconfig/tailwind presets
    types/               # shared DTO/types if needed
    validation/          # shared Zod schemas when FE/BE need parity
  docs/                  # may mirror product docs or link out
  prisma/                # schema + migrations (or apps/api/prisma)
  turbo.json | pnpm-workspace.yaml
```

Exact names may vary slightly, but the separation of `web` / `api` / shared packages is mandatory once Phase 0 starts.

### 3.2 NestJS module map (Inabiya domains)

```text
apps/api/src/
  modules/
    identity/            # auth, users, sessions, roles
    media/               # uploads, signed URLs, media library
    notifications/       # email/sms/push adapters + templates
    audit/               # privileged action logs
    search/              # indexing projection adapters
    commerce/
      catalog/
      inventory/
      cart/
      checkout/
      orders/
      promotions/
      customers/         # commerce CRM views/ops
    editorial/
      assignments/
      articles/
      reviews-workflow/
      publishing/
      writer-payments/
    creator/
      profiles/
      campaigns/
      proposals/
      deliverables/
      campaign-payments/
    platform/
      feature-flags/
      settings/
  common/                # filters, interceptors, result types
  infrastructure/        # prisma, redis, s3, payment providers
```

### 3.3 Next.js route groups

```text
apps/web/app/
  (gift)/                # System A storefront + customer account
  (blog)/                # public parenting content (System A family)
  (creator)/             # System B Creator Collective
  (admin)/
    commerce/
    editorial/
    creator/
    platform/
  api/                   # only if BFF routes are justified; prefer Nest API
```

Theme scoping is mandatory via layout (`data-theme="gift" | "creator"`). See `Design.md`.

### 3.4 File naming

| Kind | Convention | Example |
|---|---|---|
| Nest controller | `*.controller.ts` | `order.controller.ts` |
| Nest service | `*.service.ts` | `order.service.ts` |
| Nest module | `*.module.ts` | `order.module.ts` |
| Use-case | `*.use-case.ts` or application service | `place-order.use-case.ts` |
| Prisma models | PascalCase models, mapped snake tables | `Order` → `orders` |
| React components | PascalCase | `ProductCard.tsx` |
| Hooks | `useX.ts` | `useCart.ts` |
| Zod schemas | camelCase + Schema | `placeOrderSchema` |
| Tests | `*.spec.ts` / `*.test.ts` / `*.e2e.ts` | `place-order.spec.ts` |
| Env | SCREAMING_SNAKE | `DATABASE_URL` |

---

## 4. Domain Ownership Rules

### 4.1 Four products + shared platform

| Domain | Owns | Must never own |
|---|---|---|
| Gift Commerce | Catalog browse, personalization, gift box, cart, checkout, customer orders, wishlist, reviews | Editorial approval chain, creator bidding |
| Commerce CMS | Product ops, inventory ops, order fulfillment UI, discounts, homepage CMS, commerce reports | Article medical gates, campaign reverse bidding |
| Editorial | Assignments, writer tools, SEO/medical review workflow, publish/schedule, writer payouts | SKU inventory math, creator proposals |
| Creator Collective | Creator/brand profiles, campaigns, proposals/bids, deliverables, campaign payments | Gift engraving rules, medical article review |
| Shared Platform | Identity, RBAC, media, notifications, search infra, audit, payment primitives, feature flags | Product-specific business policy |

### 4.2 Boundary hard rules

1. No direct Prisma queries across foreign module tables.
2. Cross-domain collaboration uses:
   - application API within monolith, or
   - domain events, or
   - explicit anti-corruption adapters
3. Never duplicate business invariants in UI-only form.
4. Medical reviewers ≠ marketplace creators.
5. System A and System B design tokens stay isolated.
6. Shared payment service may initiate charges, but order/campaign/writer payout *business gates* remain in owning domains.

### 4.3 Ubiquitous language (required)

Use PRD language in code:

Allowed examples: `GiftBox`, `PersonalizationOption`, `OrderStatus`, `InventoryReservation`, `ArticleAssignment`, `MedicalReview`, `CampaignProposal`, `ReverseBid`, `DeliverableApproval`

Forbidden examples: `Student`, `Admission`, `Hostel`, `Exam`, `LibraryLoan`, `FeeInvoice` (education SaaS bleed)

---

## 5. Layering & Dependency Rules

### 5.1 Dependency direction

```text
Controllers / Route Handlers
        ↓
Application Use Cases
        ↓
Domain Policies / Aggregates
        ↑
Infrastructure Adapters (Prisma, Redis, S3, Razorpay, SMTP)
```

Domain must not import NestJS, Prisma Client, Redis, fetch, or Next.js.

### 5.2 Controller rules

Controllers/route handlers may only:

1. Authenticate/authorize entry
2. Validate input (DTO/Zod)
3. Call one use-case
4. Map result to HTTP response

They must not contain pricing math, inventory reservation logic, editorial transition logic, or bid awarding logic.

### 5.3 Use-case rules

Each mutating business operation should be an explicit use-case, e.g.:

- `PlaceOrder`
- `ReserveInventory`
- `SubmitArticleForSeoReview`
- `SelectCampaignCreator`
- `ReleaseWriterPayment`

Use-cases own transaction boundaries for their aggregate.

---

## 6. Data Rules

### 6.1 PostgreSQL is system of record

- All transactional business state lives in PostgreSQL.
- Redis is cache/lock/queue/rate-limit only.
- Search indexes are rebuildable projections.
- Object storage holds binaries; DB holds metadata.

### 6.2 Prisma rules

1. Every schema change = migration
2. Never hotfix production schema manually without recorded migration
3. Public IDs: UUID/ULID
4. Monetaries: integer minor units (paise) **or** `Decimal` — never JS `number` float money math
5. Explicit status enums/state fields over boolean soups
6. Named indexes for hot paths (orders by customer, SKU stock, article status, campaign status)
7. Soft-delete only when PRD recoverability/audit requires it

### 6.3 Consistency & idempotency

Idempotency keys required for:

- Place order / checkout finalize
- Payment webhook processing
- Campaign creator selection
- Payout initiation / release
- Writer payment release
- Inventory adjust imports (bulk)

Duplicate delivery of the same key must not create duplicate business effects.

### 6.4 Inventory correctness

- Reservation and release are first-class operations
- Failed/cancelled payments must release reservations
- Oversell prevention is a domain invariant, not UI hope
- Admin adjustments are audited

### 6.5 State machines (mandatory pattern)

Critical entities use explicit transitions, reject illegal jumps:

| Entity | Examples of states (MVP subset allowed, full PRD later) |
|---|---|
| Order | pending_payment → paid → processing → shipped → delivered / cancelled / returned |
| Article | assigned → drafting → seo_review → medical_review → approved → scheduled → published |
| Campaign | draft → open → reviewing → awarded → in_delivery → completed / cancelled |
| Deliverable | submitted → changes_requested → approved |
| Payment | created → authorized/captured → failed → refunded (provider-mapped) |

Illegal transition ⇒ `409` + stable error code.

---

## 7. API Standards

### 7.1 URL & versioning

- Public/versioned: `/api/v1/...`
- Resource nouns, plural: `/orders`, `/products`, `/campaigns`
- Nested only when ownership is true: `/campaigns/:id/proposals`
- No verbs in paths (`/createOrder` forbidden)

### 7.2 Methods

| Method | Use |
|---|---|
| GET | Read |
| POST | Create / non-idempotent commands |
| PATCH | Partial update |
| PUT | Full replace (rare) |
| DELETE | Remove / archive when PRD allows |

### 7.3 Pagination

Prefer cursor pagination for public/list heavy endpoints.  
Offset allowed for admin tables when product needs page numbers.

### 7.4 Error envelope (mandatory)

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "One or more items are no longer available.",
    "details": [{ "path": "items[0].skuId", "issue": "out_of_stock" }],
    "requestId": "req_01H..."
  }
}
```

Rules:

- Stable machine codes
- Safe human messages
- No SQL, stack traces, provider raw payloads in clients
- Field paths for validation failures

### 7.5 Status code map

| Case | Code |
|---|---|
| OK read/update | 200 |
| Created | 201 |
| Async accepted | 202 |
| Validation | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Missing | 404 |
| Conflict / illegal state / duplicate | 409 |
| Rate limit | 429 |
| Unhandled | 500 |
| Upstream dependency | 502/503 |

### 7.6 Auth on APIs

Every protected endpoint must:

1. Verify identity
2. Enforce permission/ownership
3. Audit sensitive admin/finance actions

UI route hiding is not authorization.

---

## 8. Error Handling & Resilience

### 8.1 Error classes

| Class | Examples | Expected behavior |
|---|---|---|
| Presentation | bad JSON, wrong types | 400 |
| Application | unauthorized workflow | 401/403/409 |
| Domain | closed campaign, illegal order jump | 409 + domain code |
| Infrastructure | DB/Redis/payment timeout | retry/queue/degrade; safe 5xx |

### 8.2 Resilience rules

1. Timeouts on all external calls
2. Retries only for idempotent/safe operations
3. Circuit-break or degrade non-critical features (recs, search) when dependencies fail
4. Checkout/auth/payments never “succeed” on partial unknown state
5. Redis outage must not corrupt money/inventory truth
6. Never empty-catch

### 8.3 Frontend error UX

- Field errors inline
- Transient issues via toast
- Blocking failures with recovery CTA
- Preserve form state when recoverable

---

## 9. Security Rules

### 9.1 Secure defaults

- HTTPS only in deployed environments
- Least privilege RBAC
- Secrets in env/secret manager only
- httpOnly Secure cookies preferred for browser sessions where applicable
- CSRF strategy aligned to auth transport
- Rate limit auth and sensitive POST endpoints
- Signed private media URLs

### 9.2 Validation & injection defense

- Zod/DTO validation on every external input
- Prisma parameterized access only
- Output encoding against XSS
- Upload MIME/size/type checks + malware scan path for production
- No executable user uploads served inline

### 9.3 PII & payments

- Never store raw PAN/CVV
- Mask PII in logs
- Admin access to customer/creator PII is audited
- Financing/refund/payout actions require privileged roles

### 9.4 IDOR prevention

For every sensitive read/write:

- Verify resource ownership or elevated role
- Do not trust client-provided owner IDs

### 9.5 Roles (initial set)

Customer, Commerce Admin, Content Admin, Writer, SEO Editor, Medical Reviewer, Creator, Brand, Finance, Support, Super Admin.

Role matrix details live with PRD/identity design; code must not invent wildcard admin for convenience.

---

## 10. Business-Critical Invariants (from PRD — enforce in code)

These are selected high-severity invariants. Full PRD remains authoritative; this list is the engineering “never break” subset.

### 10.1 Commerce

1. Personalization on one cart line must not mutate another line
2. Coupons do not stack unless explicitly configured
3. Paid/cancelled transitions follow order state machine
4. Cancel releases reserved inventory
5. Inventory cannot go implicitly negative
6. Money calculations are deterministic and audited on capture/refund
7. Guest cart merge on login must be deterministic and conflict-safe

### 10.2 Editorial

1. Unpublished content is not publicly addressable
2. Medical-required articles cannot publish without medical approval
3. SEO/medical gates cannot be skipped by writers
4. Scheduled publish executes via job, not browser hope
5. Writer payout release follows approval rules

### 10.3 Creator Collective

1. Closed campaigns reject new proposals
2. Selection/award is single-winner unless PRD explicitly allows multi
3. Escrow/payment release requires deliverable approval gates
4. Brand and creator data isolation by ownership
5. Ratings only after eligible completion states

### 10.4 Platform

1. Every authenticated request respects role permissions
2. Privileged admin actions are auditable
3. No feature may bypass established workflows

---

## 11. Background Jobs & Events

### 11.1 Use BullMQ for

- Email/SMS dispatch
- Payment webhook follow-up
- Image variants / media post-process
- Search reindex
- Scheduled article publish
- Inventory low-stock alerts
- Payout retries
- Report aggregation

### 11.2 Job rules

1. Idempotent handlers
2. Explicit retry/backoff
3. Dead-letter visibility
4. Correlation IDs propagated
5. No hidden cron logic embedded in request handlers

### 11.3 Domain events (examples)

`OrderPaid`, `OrderCancelled`, `InventoryLow`, `ArticlePublished`, `CampaignAwarded`, `DeliverableApproved`, `PaymentCaptured`, `UserRoleChanged`

Consumers must tolerate at-least-once delivery.

---

## 12. Frontend Engineering Rules

### 12.1 Next.js

- Server Components by default for read pages
- Client Components for interactive islands only
- No privileged secrets in client bundles
- Server Actions (if used) validate Zod + enforce authZ equally to API
- Prefer Nest API as system of record interface

### 12.2 State

- Server state: TanStack Query
- UI/local state: React state
- Cart may use dedicated client store only with clear hydration/merge rules
- Do not introduce Redux unless ADR justifies multi-surface extreme complexity

### 12.3 Design compliance

Must follow `Design.md`:

- System A vs System B theme isolation
- shadcn restyled to brand tokens
- no emoji icons
- accessibility + `data-testid` on critical controls

### 12.4 Forms

- Schema-first
- Disable double-submit on payment/checkout/proposal submit
- Show pending states

---

## 13. Testing Standards

### 13.1 Required focus by risk

| Risk area | Minimum tests |
|---|---|
| Money / checkout / webhooks | unit + integration + duplicate webhook cases |
| Inventory reservation | domain unit + concurrency-sensitive cases where practical |
| Editorial publish gates | workflow unit tests |
| Campaign award / payout gates | workflow unit tests |
| AuthZ | permission denial cases |
| Critical UX journeys | Playwright e2e smoke |

### 13.2 Quality bar

- New bug ⇒ regression test when feasible
- Deterministic tests (fake clocks/network)
- CI must run lint + typecheck + unit tests
- Do not merge known failing critical tests

---

## 14. Observability & Ops Rules

1. Structured logs JSON-capable
2. `requestId` / `correlationId` on requests and jobs
3. Metrics: latency, error rate, queue lag, payment failure rate
4. Alerts on checkout failure spikes and queue dead-letters
5. Never log tokens, passwords, OTPs, full card data
6. Health endpoints: liveness + readiness (DB/Redis dependency awareness)

---

## 15. Environment & Secrets

### 15.1 Required env categories

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`
- Object storage credentials
- Payment provider keys
- Email provider keys
- `APP_URL` / `API_URL`
- Feature flag source if external

### 15.2 Secret rules

- `.env*` with secrets never committed
- Different secrets per environment
- Rotation runbook required before production GA
- Local `.env.example` documents keys without values

---

## 16. Git / PR / Delivery Rules

1. Focused PRs — one concern
2. No secrets in commits
3. Migrations reviewed with code
4. Phase scope respected (`Phases.md`)
5. Do not bypass CI
6. Meaningful commit messages (why > noise)
7. Do not commit generated junk, huge media binaries, or personal dumps

---

## 17. AI Coding Assistant Constitution

### 17.1 Before coding

AI must:

1. Read `Memory.md` Active Phase
2. Confirm task belongs to that phase
3. Open only relevant PRD sections
4. Follow this Rules stack
5. Ask when ambiguous

### 17.2 While coding

AI must:

1. Keep diff scoped
2. Preserve domain boundaries
3. Add validation + authZ for protected mutations
4. Update schemas/migrations with behavior
5. Match Design system for UI
6. Prefer extend over rewrite

### 17.3 AI must never

1. Swap stack “for speed”
2. Implement future phases silently
3. Mix Gift and Creator themes
4. Conflate medical specialists with creators
5. Disable security to unblock demos
6. Claim done without stating remaining gaps
7. Invent PRD features
8. Copy LMS architecture domains
9. Leave fake stubs that look production-complete
10. Delete audit/idempotency protections

### 17.4 After coding

AI must:

1. Summarize what changed
2. List migrations/env changes
3. Update `Memory.md`
4. List residual risks

### 17.5 Conflict protocol

If docs conflict: stop → state conflict → wait for human decision → update `Memory.md` Decisions Log.

---

## 18. Do / Don’t Card

### Do

- Modular NestJS domains
- Prisma migrations
- Explicit state machines
- Idempotent payments/webhooks
- Theme-scoped UI
- Phase-scoped delivery
- Ask when unsure

### Don’t

- Mongo/FastAPI production drift
- Cross-module table joins
- Float money
- UI-only authorization
- Theme blending
- Scope explosion
- Silent architecture rewrites

---

## 19. Exception Process

Any intentional rule break requires:

1. Business justification
2. Risk assessment
3. Alternatives considered
4. Time-bound or permanent label
5. ADR
6. Eng lead approval
7. `Memory.md` entry

Undocumented exceptions are defects.

---

## 20. Definition of Done (Engineering)

A change is done only if:

- Matches relevant PRD acceptance intent for the scoped slice
- Respects architecture boundaries (Inabiya domains)
- Types/lint/tests for touched critical paths pass
- AuthZ + validation present
- Errors follow envelope
- Design tokens correct for surface
- No secrets introduced
- Scope inside active phase
- `Memory.md` updated

---

## 21. Rules Evolution

Update this file when:

- Stack changes via ADR
- Recurring AI/human mistakes need guardrails
- Security/compliance needs rise
- Cross-team conventions need clarifying

Never weaken safety rules for temporary velocity without explicit leadership acceptance recorded in Memory.

---

**End of Rules.md v2.0.0**
