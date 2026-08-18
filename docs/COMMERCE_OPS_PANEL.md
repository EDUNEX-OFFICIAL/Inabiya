# Commerce OPS Panel — Professional Development Journey

Version: 2.0.0  
Status: **OPS-0…9 shipped** — Phase 13 Commerce OPS Panel complete  
Last Updated: 2026-08-15  
Document Owner: Eng + Product

**This doc is the engineering + UX contract** for elevating Commerce Admin from Phase 4 MVP to a professional operations console (Shopify Admin / BigCommerce / Amazon Seller–class). Implement **one OPS phase at a time**. Do not invent progress in Memory until code ships.

Related:

| Doc | Role |
|---|---|
| `PRD.md` PART 5A–5F | Product behavior encyclopedia |
| `Phases.md` Phase 4 (archived MVP) + Phase 13 pointer | Delivery authority |
| `Design.md` §4 Soft Gift + admin dense | Visual law |
| `Memory.md` | Active phase + session truth |
| `Rules.md` | Stack, AuthZ, money, Zod |

---

## 1. Goal

Commerce / Support / Finance / Super Admin run the gift store **without spreadsheets**: fulfill orders, keep inventory honest, curate catalog, help customers, run promotions, and see daily health — with UX density and workflow clarity comparable to large ecommerce ops tools.

### Non-goals (this journey)

- Fourth visual theme (`data-theme="admin"`) — **forbidden**
- Editorial CMS or Creator admin redesign (separate products)
- Full WMS / multi-warehouse / bin topology (OPS-9 P2 / future)
- Full marketing automation journeys (PRD Stage 4)
- Real Razorpay / SMTP / public DNS (post-dev stubs stay until those tracks)
- Replacing Soft Gift storefront experience

### North-star UX (every phase)

Like Shopify Admin: **task-first, dense, calm**.

- Soft Gift tokens (`gift`) + `data-density="compact"` — flatter tables, less playful motion
- Pattern: **KPI / alerts → filters → table → detail (page or drawer) → timeline + audit**
- Empty / loading / error / forbidden states on every list & mutation
- Global search + role-aware nav
- Authorize in **service**; Zod on every mutation; money in `*Paise`; inventory never negative

---

## 2. Baseline (already shipped)

Phase 4 Commerce Operations Console MVP is **closed**. Do not rebuild from zero — **deepen**.

### Existing routes (`apps/web`)

| Route | Capability (MVP) |
|---|---|
| `/admin/commerce` | Dashboard KPIs + nav |
| `/admin/commerce/orders`, `/orders/[id]` | List + fulfill path + notes + payment cues |
| `/admin/commerce/products`, `/new`, `/[id]` | CRUD / publish |
| `/admin/commerce/customers`, `/customers/[id]` | List + profile + suspend |
| `/admin/commerce/coupons` | Create + list |
| `/admin/cms/pages` | Homepage / storefront blocks (CMS) |
| `/admin/commerce/reports` | Basic revenue reports |
| `/admin/commerce/support` | Order lookup |
| `/admin/commerce/search` | Global search MVP |
| `/admin/commerce/returns` | Returns queue |
| `/admin/commerce/reviews` | Review moderation |
| `/admin/commerce/gifting-inquiries` | Inquiries |

### Shipped Phase 4 P0 (honest)

- Dashboard KPIs (orders, revenue, AOV)
- Order detail + timeline + notes; PAID → PROCESSING → SHIPPED → DELIVERED
- Customer admin + coupons + CMS homepage blocks + alerts + search
- Cancel / refund trigger; bulk product edits; richer reports UI

### Gaps this journey closes

MVP screens exist but are not yet a **unified professional ops desk**: inconsistent IA density, weak “today’s work” queues, shallow inventory ledger UX, limited promotion engine, power-user bulk/shortcuts, and enterprise report/export polish.

---

## 3. Roles & AuthZ

| Role | OPS access |
|---|---|
| `COMMERCE_ADMIN` | Full commerce ops (catalog, inventory, orders, promotions, reports) |
| `SUPPORT` | Orders read + notes + customer lookup; limited mutations |
| `FINANCE` | Reports, refunds visibility, payment cues |
| `SUPER_ADMIN` | All + settings / roles surfaces |
| Customer / Writer / Creator / Brand | **No** commerce OPS |

Authorize ownership and role in the **service**, not UI-only. Audit: publish, refund, payout-adjacent, role/policy change, inventory adjust, suspend customer.

---

## 4. Design system (locked)

| Rule | Detail |
|---|---|
| Theme | `data-theme="gift"` on commerce admin layouts |
| Density | `data-density="compact"` |
| Fonts | Fraunces + Plus Jakarta (same Soft Gift family) |
| Motion | Minimal — status transitions, toasts; no storefront GSAP stories |
| Components | shadcn/Radix tables, dialogs, sheets, badges, breadcrumbs |
| Forbidden | Generic blue SaaS defaults; cream+terracotta Creator look; Blog teal as primary; purple glow AI clichés |

Shared building blocks to grow over the journey:

- `AdminShell` (sidebar + top bar + breadcrumbs)
- `AdminKpiCard`, `AdminAlertInbox`, `AdminDataTable`, `AdminFilterBar`
- `AdminStatusBadge`, `AdminTimeline`, `AdminEmptyState`
- Command palette (OPS-0 stub → OPS-9 polish)

---

## 5. Journey map (build one by one)

**Recommended order** (daily ops first):

```text
OPS-0 → OPS-1 → OPS-4 → OPS-3 → OPS-2 → OPS-5 → OPS-6 → OPS-7 → OPS-8 → OPS-9
```

| ID | Name | Focus | Depends on |
|---|---|---|---|
| **OPS-0** | Shell & IA | Unified chrome, nav, density, search entry | Phase 4 baseline |
| **OPS-1** | Command center | Dashboard 2.0 + alert queues | OPS-0 |
| **OPS-4** | Order desk | Fulfillment case-file UX | OPS-0 (OPS-1 ideal) |
| **OPS-3** | Inventory ops | Stock truth + ledger UX | OPS-0 |
| **OPS-2** | Catalog desk | Power table + labels / collections | OPS-0 |
| **OPS-5** | CRM & support | Customer 360 + support desk | OPS-4 |
| **OPS-6** | Promotions | Rules engine deepen | OPS-2 |
| **OPS-7** | Reports | Gallery + export | OPS-1 |
| **OPS-8** | Settings & trust | Policy, audit viewer | OPS-0 |
| **OPS-9** | Power-user | Bulk, shortcuts, import, P2 depth | Prior OPS P0s |

Delivery phases in `Phases.md` = **Phase 13** track (`OPS-0` … `OPS-9`). Memory Active Phase must name the **current OPS-N** only.

---

## 6. Phase contracts

### OPS-0 — Shell & Information Architecture

**Goal:** One coherent ops app chrome so later modules feel like one product.

#### UI / UX

- [x] Persistent sidebar IA: Dashboard, Products, Inventory, Orders, Customers, Promotions, Merchandising, Reports, Reviews/Returns, Support, Settings
- [x] Top bar: global search entry, role chip, environment cue (mock payments)
- [x] Breadcrumbs on all nested routes
- [x] Shared page header pattern (title + primary action + secondary)
- [x] Compact density applied consistently; no one-off padding chaos
- [x] Forbidden / empty shell for wrong roles

#### Functionality

- [x] Role-gated nav items (Support ≠ full Commerce Admin)
- [x] Layout ownership: `gift` + `compact` only at layout boundary
- [x] Audit link / “recent privileged actions” stub optional P1
- [x] Command palette stub (open + navigate to known routes) P1

#### Exit criteria

- [x] Every existing commerce admin route sits under the new shell without theme regression
- [x] Nav matches IA table; Support role sees reduced set
- [x] Memory marks OPS-0 done only when shell is live in code

#### Demo

Login as commerce admin → navigate Products → Orders → Dashboard without layout flicker; login as support → no Promotions/Settings.

---

### OPS-1 — Command Center (Dashboard 2.0)

**Goal:** First screen answers “What needs attention today?”

**PRD:** §129–142

#### UI / UX

- [x] KPI strip: orders today, revenue (paise→display), AOV, open fulfillments
- [x] Date range control (today / 7d / 30d)
- [x] Alert inbox: failed payments, low stock, pending ship, open returns
- [x] Quick actions: New product, Create coupon, Open orders queue
- [x] Deep-link each alert to the right list filtered

#### Functionality

- [x] Metrics APIs accurate vs orders (no float money)
- [x] Alert counts from real queries (not hardcoded)
- [x] Refresh / stale indicator P1

#### Exit criteria

- [x] Ops can triage a day from dashboard alone
- [x] Each alert opens filtered target

#### Demo

Seed low stock + unpaid/failed → dashboard shows cards → click → correct queue.

---

### OPS-2 — Catalog & Merchandising Desk

**Goal:** Publish and curate catalog at merchant speed.

**PRD:** PART 5B; merchandising

#### UI / UX

- [x] Products power-table: search, status, stock, tags, bulk bar
- [x] Product edit: clear sections (basics, variants, media, personalization, SEO, publish)
- [x] Categories / collections admin polish (as schema allows)
- [x] Merchandising: featured / homepage / pins with preview cues

#### Functionality

- [x] Publish / unpublish with audit
- [x] Bulk status publish/unpublish (category/tag bulk = P1 later)
- [x] Media binding via existing media library patterns on **new product** (upload/library/preview/alt + SEO); edit page uses `ProductGalleryEditor` + library picker (P1 closed)
- [x] Variant/SKU inventory hooks visible from product
- [x] Admin list **keyset cursor pagination** (see §13)

#### Exit criteria

- [x] Admin publishes from edit + list; bulk publish/unpublish on desk
- [x] Merchandising desk links CMS homepage + legacy pins + /gift preview

#### Demo

Bulk unpublish → storefront hides; feature product → home/CMS reflects.

---

### OPS-3 — Inventory Operations

**Goal:** Stock is trustworthy and every change is auditable.

**PRD:** §77–79, PART 5C

#### UI / UX

- [x] Inventory list: SKU, available, reserved, low-stock badge
- [x] Adjust dialog: delta + reason (receive, damage, recount, correction)
- [x] Movement history timeline per SKU
- [x] Low-stock board (threshold)

#### Functionality

- [x] States: available / reserved (damaged via DAMAGE reason decrement — no separate damaged bucket yet)
- [x] Adjustments write ledger / audit rows
- [x] Reservation visibility from open orders P1
- [ ] Multi-warehouse / bins = **out of scope** (OPS-9 P2)

#### Exit criteria

- [x] Adjust stock → storefront availability updates; history shows actor + reason
- [x] Cannot drive available below zero via admin adjust

#### Demo

Set stock 1 → place order → reserved visible → adjust damage → audit line.

---

### OPS-4 — Order Desk & Fulfillment

**Goal:** Order detail is a complete “case file”; queue is the daily workbench.

**PRD:** PART 5D §192–219

#### UI / UX

- [x] Orders queue: filters (status, date, payment, SLA-ish age), search, badges
- [x] Optional board/kanban for fulfillment statuses P1
- [x] Order detail: customer, lines, personalization, gift message, payment cues, timeline, notes, actions
- [x] Exception badges (payment issue, address risk, return open)
- [x] Print-friendly packing summary P1

#### Functionality

- [x] Legal status transitions only; invalid transitions rejected
- [x] Cancel / refund polish + AuthZ (Finance/Commerce)
- [x] Internal notes + timeline events
- [x] Shipping carrier / AWB fields MVP P1
- [ ] Partial shipment advanced = later

#### Exit criteria

- [x] Happy path fulfill end-to-end from queue
- [x] Refund/cancel audited; customer order history consistent

#### Demo

Paid order → processing → ship with note → delivered; failed pay order clearly blocked from ship.

---

### OPS-5 — Customer CRM & Support

**Goal:** One customer page replaces tab-hopping; support can resolve without DB access.

**PRD:** PART 5E

#### UI / UX

- [x] Customers table: search, status, order count, LTV (paise)
- [x] Customer 360: profile, addresses, orders, notes, segments stub
- [x] Support desk: order lookup by id/email/phone; recent tickets/inquiries link
- [x] Communication log stub (internal only) P1

#### Functionality

- [x] Suspend / reactivate with audit
- [x] Support role scoped APIs (read customers/search; no suspend)
- [x] Basic segments (repeat_buyer / high_value / new / suspended) — full CRM automation = future Stage 4

#### Exit criteria

- [x] Support finds order + customer in &lt;3 clicks from support entry
- [x] Suspend blocks login (existing) + checkout (`ACCOUNT_SUSPENDED`)

#### Demo

Lookup by email → open order → add note → visible on order timeline + customer 360.

---

### OPS-6 — Promotions Engine

**Goal:** Marketing configures incentives without engineering tickets.

**PRD:** PART 5F

#### UI / UX

- [x] Promotions list: type, schedule, status, usage
- [x] Builder: conditions → benefit → schedule
- [x] Conflict / priority display when multiple qualify P1
- [x] Coupon codes UX polish (generate, deactivate)

#### Functionality

- [x] Deepen beyond simple coupons (cart %, fixed paise, min order + schedule)
- [x] Expiry / usage limits enforced at checkout (existing validate; schedule on create)
- [x] Stackability matrix full PRD = P2 — **ceiling documented**: one coupon per cart
- [x] Audit create/deactivate

#### Exit criteria

- [x] Create promo → redeem path via existing cart validate
- [x] Expired / inactive / exhausted promo rejected by validate

#### Demo

Min-order coupon → under threshold fails → over threshold succeeds → deactivate → fails.

---

### OPS-7 — Reports & Finance Visibility

**Goal:** Stand-up and light finance without a separate BI tool.

#### UI / UX

- [x] Report gallery cards (sales, products, inventory, returns, coupons)
- [x] Date range + compare previous period (sales KPIs)
- [x] Tables + sparkline for sales revenue
- [x] Export CSV (Excel/PDF P1/P2)

#### Functionality

- [x] Queries scoped; money as integer paise in API
- [x] Finance role can read; mutations still AuthZ-gated
- [ ] Scheduled email export = P2 / Stage 4-ish

#### Exit criteria

- [x] Commerce Admin exports 7-day sales CSV matching report totals (same window as dashboard)
- [x] No float rupee math in report pipelines

#### Demo

Place 2 paid orders → sales report + CSV match KPI strip.

---

### OPS-8 — Settings, Policy & Trust

**Goal:** Ops-owned policy without redeploy; privileged actions inspectable.

#### UI / UX

- [x] Settings hub: returns window, low-stock threshold, shipping display copy stubs
- [x] Notifications prefs (which alerts on dashboard) P1
- [x] Audit log viewer (filter by actor/action/date)
- [x] Read-only roles matrix for Commerce Admin education

#### Functionality

- [x] Policy keys in `commerce_settings` (return window + low stock + shipping copy)
- [x] Audit API pagination + AuthZ
- [x] Feature flag surface read P1 (link to existing `/admin/platform/flags`)

#### Exit criteria

- [x] Change return window → customer return eligibility respects new value (existing eligibility path)
- [x] Admin can find who refunded / changed policy via audit search

#### Demo

Set return window 7 → ineligible order blocked; audit shows `policy.updated`.

---

### OPS-9 — Power-User & Scale Polish

**Goal:** Feels like a real company tool under load and haste.

#### UI / UX

- [x] Saved views / pinned filters per user (localStorage)
- [x] Keyboard shortcuts (g+o orders, / search, ? help, ⌘K)
- [x] Bulk actions on major lists (orders PROCESSING + products publish)
- [x] Import wizard UX (stock CSV) with dry-run errors
- [x] Mobile triage layout (read + status change) P1

#### Functionality

- [x] CSV import/export polish with Zod row validation (stock import + product create import)
- [x] Performance pass on large order/product/customer lists (indexes, cursor pagination) — products/orders/customers keyset shipped
- [x] P2 backlog only: warehouse/bin, forecasting, full SLA engine, advanced segmentation (documented ceiling)

#### Exit criteria

- [x] Import dry-run → fix errors → commit path
- [x] Shortcuts documented in-app (?)

#### Demo

Import CSV with 2 bad rows → report → fix → success; shortcut opens Orders.

---

## 7. Cross-cutting Done definition (every OPS-N)

A phase is **done** only when all are true:

1. Scope matches this doc’s P0 checkboxes for that OPS-N  
2. Zod + AuthZ on new/changed mutations; ownership checks where needed  
3. Migrations / env keys noted in Memory session log  
4. Non-trivial logic has at least one runnable check  
5. Soft Gift dense theme not broken; no `admin` theme  
6. Memory: Active Phase updated, checkboxes honest, ≤5 next actions refreshed  
7. No secrets committed  

---

## 8. Hard stops (escalate — do not “temporary” ship)

| Stop | Why |
|---|---|
| Float money / JS number rupees | Trust & accounting |
| Negative inventory | Oversell |
| AuthZ / Zod bypass | IDOR / abuse |
| Webhook / refund non-idempotent paths | Double money effects |
| Theme mix / `data-theme="admin"` | Design law |
| Cross-module Prisma shortcuts | Architecture |
| Skipping OPS order without Memory override | Phase discipline |

---

## 9. Suggested sprint slicing

| Sprint-ish | Deliver |
|---|---|
| 1 | OPS-0 Shell |
| 2 | OPS-1 Dashboard |
| 3–4 | OPS-4 Order desk |
| 5 | OPS-3 Inventory |
| 6 | OPS-2 Catalog polish |
| 7 | OPS-5 CRM / Support |
| 8 | OPS-6 Promotions |
| 9 | OPS-7 Reports |
| 10 | OPS-8 Settings |
| 11+ | OPS-9 Power-user |

Adjust length to team size; **never start two OPS-N P0 tracks in parallel** without human override in Memory.

---

## 10. Progress tracker

| OPS | Status | Shipped date | Notes |
|---|---|---|---|
| OPS-0 Shell & IA | **Shipped** | 2026-07-29 | Responsive pass + shell polish |
| OPS-1 Command center | **Shipped** | 2026-07-29 | Range KPIs + alert deep-links |
| OPS-2 Catalog desk | **Shipped** | 2026-07-29 | Power table + categories + merch |
| OPS-3 Inventory ops | **Shipped** | 2026-07-29 | Ledger + adjust + low-stock board |
| OPS-4 Order desk | **Shipped** | 2026-07-29 | Queue + case file + carrier/AWB |
| OPS-5 CRM & support | **Shipped** | 2026-07-29 | 360 + support phone lookup |
| OPS-6 Promotions | **Shipped** | 2026-07-29 | Builder + schedule (admin preview removed 2026-08-17) |
| OPS-7 Reports | **Shipped** | 2026-07-29 | Gallery + sales CSV |
| OPS-8 Settings & trust | **Shipped** | 2026-07-29 | Policy hub + audit viewer |
| OPS-9 Power-user | **Shipped** | 2026-07-29 | Shortcuts, pin views, bulk, CSV import |

Update this table when Memory marks an OPS complete.

---

## 11. How we start each OPS-N

1. Read `Memory.md` — confirm Active Phase = this OPS-N (or log human override)  
2. Open only this section + relevant PRD slice + Design admin notes  
3. Implement P0 only; park P1/P2 in this doc / Memory  
4. Exit criteria demo + Memory session log  
5. Move Active Phase to next OPS in recommended order  

**First implementation kickoff:** **OPS-0 — Shell & IA**.

---

## 12. Document history

| Date | Change |
|---|---|
| 2026-07-29 | v1.5.0 — Admin catalog keyset pagination (§13) |
| 2026-07-29 | v1.4.0 — OPS-3 Inventory desk + OPS-4 AuthZ refresh |
| 2026-07-29 | v1.3.0 — OPS-4 Order desk (queue, case file, carrier/AWB) |
| 2026-07-29 | v1.2.0 — OPS-0 responsive harden + OPS-1 Command center |
| 2026-07-29 | v1.1.0 — OPS-0 Shell & IA shipped |
| 2026-07-29 | v1.0.0 — Full journey defined from Phase 4 baseline; OPS-0…9 contracts |

---

## 13. Admin catalog keyset pagination (reference)

**Status:** Shipped 2026-07-29 · **Human override** of OPS-9 P1 leftover.

### Contract

`GET /api/v1/admin/catalog/products`

| Query | Type | Default | Notes |
|---|---|---|---|
| `q` | string | — | title / slug / brand / SKU `contains` (ILIKE) |
| `status` | enum | — | `DRAFT` \| `PUBLISHED` \| `ARCHIVED` |
| `cursor` | string | — | Opaque keyset from prior `nextCursor` |
| `limit` | int 1…50 | **25** | Page size |

**Response (breaking vs old bare array):**

```json
{
  "items": [ /* slim desk rows */ ],
  "nextCursor": "base64url… or null",
  "limit": 25
}
```

No `total` / `page` — avoid `COUNT(*)` on every keystroke. UI shows “N on this page · more” + Prev/Next.

### Algorithm (keyset, not OFFSET)

1. Sort: `ORDER BY updated_at DESC, id DESC` (id is stable tie-break).
2. Cursor payload: `base64url(`${updatedAt.toISOString()}_${id}`)`.
3. Next page = rows **strictly after** last row in that order:

```sql
(updated_at < :u) OR (updated_at = :u AND id < :id)
```

4. Fetch `limit + 1` rows; if extra exists, slice to `limit` and set `nextCursor` from last kept row.

Helpers: `apps/api/src/modules/commerce/catalog/admin-catalog-cursor.ts`  
Check: `admin-catalog-cursor.check.ts`

### Optimizations

| Layer | Choice |
|---|---|
| Indexes | `products(updated_at, id)`, `products(status, updated_at, id)` — migration `20260729200000_admin_catalog_keyset_indexes` |
| Include | Slim `adminListInclude`: variants+inventory only, **1 IMAGE** media — no SEO/hamper/personalization/categories |
| Count | Omitted by design |
| UI Prev | Client **cursor stack** (previous page tokens); API is forward-only |
| Search | Debounced 300ms; clears `cursor` + stack on filter change |

### Do / Don’t (future lists)

```text
✅ Keyset on (sortCol, id) for admin/public heavy lists sorted by time
✅ take = limit+1 for hasMore
✅ Slim list DTO ≠ full get-by-id mapProduct
❌ OFFSET/LIMIT deep pages for catalog desk
❌ Prisma cursor:{ id } + skip:1 when orderBy is updatedAt alone (duplicate/skip risk)
❌ Returning full productInclude on list endpoints
```

Reuse this pattern for orders/customers when those queues outgrow seed scale.
