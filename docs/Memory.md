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

Last Updated: August 11, 2026 (Commerce Ops readability)

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

Path: `/srv/Inabiya/docs/` (canonical)

---

## 3. Current snapshot (single source of “now”)

### 3.1 Active phase

| Field | Value |
|---|---|
| Phase | **Phase 14 / OPS-10 — Procurement** |
| Status | **In progress** — S0→S3 first slice (suppliers + simple PO full-receive) |
| Milestone | Single-merchant procurement |
| Owner | Eng |
| Target window | 2026-08-11+ |
| Monorepo | `/srv/Inabiya` (GitHub: `EDUNEX-OFFICIAL/Inabiya`) |
| Authority | [`docs/PROCUREMENT_OPS.md`](PROCUREMENT_OPS.md) |
| Prior | Phase 13 OPS P1 closed |

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

### 3.3 Triple design reminder

- **System A Soft Gift (`gift`):** `#FF6B9D` pastels, Fraunces + Plus Jakarta — ecommerce + commerce CMS
- **System C Blog Creative (`blog`):** paper/ink + teal accent, Newsreader + Source Sans 3 — `/articles`, specialists, editorial CMS
- **System B Creator (`creator`):** forest/cream/terracotta HSL, Playfair + Manrope — influencer campaigns
- Shared foundations on `:root` (space/type/z/duration); never mix casually; no `data-theme="admin"`
### 3.4 Docs completion status

| Doc | Status | Version |
|---|---|---|
| PRD.md | Complete (product) | 1.0.0 |
| Architecture.md | **Rewritten canonical — LMS removed** | **2.0.0** |
| Rules.md | Expanded production authority | **2.0.0** |
| Phases.md | Expanded delivery authority | **2.0.0** |
| Design.md | Expanded **triple**-system authority | **2.1.0** |
| Memory.md | Expanded living memory | **2.0.0** |
| COMMERCE_OPS_PANEL.md | Phase 13 OPS journey; OPS-0…9 **complete** | **2.0.0** |
| PROCUREMENT_OPS.md | Phase 14 OPS-10 suppliers/POs | **1.0.0** |

### 3.5 Product implementation status

| Product | Status | Notes |
|---|---|---|
| A Gift Commerce | Phase 5 leftovers closed | Analytics, account, abandonment |
| B Commerce Admin | Phase 13 OPS-0…9 + **P1 closed** (2026-08-11) | Soft Gift ops desk + P1 leftovers |
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

1. **QA:** hard-refresh `/admin/commerce` — neutral canvas vs white panels
2. **QA:** `/admin/commerce/suppliers` + New PO → Receive all → inventory
3. **Commit/push** when ready
4. Resume OPS-10 after readability QA
5. —


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
| Q6 | Commerce admin visual = Soft Gift dense confirmed? | **Resolved — gift+compact semantic remap (neutral canvas, pink accents)** | Design | Done 2026-08-11 |
| Q7 | Launch package = Commerce only, or Commerce+Editorial? | **Resolved — VPS-local = Commerce+Editorial+Creator MVP; public DNS deferred** | Product/Eng | Done 2026-07-20 |
| Q8 | Third-party auth (Google etc.) day one? | **Resolved — No; email/password only for easy testing** | Eng | Done 2026-07-20 |
| Q9 | Return window (days after delivery)? | **Resolved — default 14, admin-customisable via `policy.return_window_days`** | Product | Done 2026-07-20 |

Resolve → move to Decisions Log → remove from this table.

---

## 6. Decisions log (append-only, newest first)

### 2026-08-11 — Commerce Ops readability (human override)

- **Override:** Phase 14 Procurement in progress; human: fix Commerce Control readability properly.
- Approach: `[data-theme=gift][data-density=compact]` semantic remap (warm paper canvas, charcoal borders, darker muted) — **no `data-theme=admin`**.
- Canvas: warm paper (blush+yellow ivory), not cool gray void; cards stay white.
- Recipes: `.ops-muted` / `.ops-th`; flat `.clay-panel` under compact; shell + dashboard hierarchy; thead sweep on commerce desks.
- Storefront blush unchanged (gift without compact).
- Design.md density + Commerce admin dense notes updated.

### 2026-08-11 — OPS-10 Procurement (human override)

- **Override:** Phase 13 P1 closed; human: proceed with supplier/PO/receiving (not marketplace).
- Authority: `docs/PROCUREMENT_OPS.md` v1.0.0; Phases §27 pointer.
- Schema: `Supplier`, `PurchaseOrder`, `PurchaseOrderLine`, `ProductVariant.preferredSupplierId`; migration `20260811180000_ops10_procurement`.
- API: `/admin/commerce/suppliers`, `/purchase-orders` (+ order/receive/cancel); Zod + COMMERCE_ADMIN; receive → inventory `RECEIVE`.
- Web: Suppliers desk, PO list/new/detail; nav items; Soft Gift compact.
- Seed: 3 Delhi-area suppliers + ORDERED `PO-SEED-OKHLA-001` (BATH-001, BLNK-001).
- Check: `purchase-order-lifecycle.check.ts`; nav check updated.
- Ceiling: no partial receive, no supplier portal, no multi-warehouse.

### 2026-08-08 — Coupon PRODUCT / CATEGORY scope (Phase 13 override)

- **Override:** Phase 13 complete; client: coupons category- or product-specific
- Schema: `CouponScope` CART|PRODUCT|CATEGORY + `productIds` / `categoryIds` arrays; migration `20260808010000_coupon_scope`
- Checkout: discount computed on **eligible** line subtotal; empty match → `COUPON_NOT_ELIGIBLE`
- Admin promotions desk: Applies to chips + product search / category chips; Soft Gift list polish
- Check: `coupon-lifecycle.check.ts` (eligible helpers)

### 2026-08-08 — Dedicated PDP product video (Phase 13 override)

- **Override:** Phase 13 complete; human: dedicated video below trust badges (not primary gallery swap)
- Admin: Media → **Product video** (YouTube or direct `.mp4`/`.webm`) + optional poster; gallery images-only
- Storefront: `PdpVideoBand` click-to-play facade; YouTube via `youtube-nocookie` only after click; gallery LCP = images only
- Data: existing `ProductMedia` VIDEO row (no migration); one video per product
- Smoke: `pnpm exec tsx scripts/smoke-product-video.ts` → PASS
- Out of scope: Vimeo/arbitrary iframe, video MIME upload expansion

### 2026-08-07 — Admin SEO Schema Control (Phase 13 override)

- **Override:** Phase 13 complete; client asked for admin control to add Schema.org JSON-LD on all SEO surfaces
- Surfaces: CMS marketing pages + products + articles
- UX: guided presets + Advanced JSON (`SeoSchemaPanel`); auto Product/Article/WebPage/FAQ stay authoritative
- Data: `seoSchemaExtras` Json on Product/Article/MarketingPage; migration `20260807120000_seo_schema_extras`
- Smoke: `pnpm exec tsx scripts/smoke-seo-schema-extras.ts` → PASS
- Forbidden: custom Product/Offer/AggregateRating/Article overrides; FAQPage extras when system FAQ exists

### 2026-08-07 — Soft Gift PDP CMS About + trust + media (Phase 13 override)

- **Override:** Phase 13 complete; human polish for PDP CMS content
- About this gift = TipTap via existing `seoSections` (admin label renamed); empty → description + auto highlights
- Trust strip = global `CommerceSetting` `pdp.trust_cues` (Settings Policy tab) + public GET
- Gallery editor: IMAGE|VIDEO kind + poster URL (paste URL; media upload still image-only MIME)
- Demo: `lavender-bath-essentials` 3 gallery images + TipTap about HTML

### 2026-07-29 — Phase 13 IMPLEMENTATION_AUDIT cross-check

- `IMPLEMENTATION_AUDIT.md`: Phase 13 **P0 Closed**; per-OPS evidence table + honest P1 gaps
- Static verification (files/migrations/symbols); browser matrix not re-run this pass
- Next: live Soft Gift ops QA when needed; post-dev providers unchanged

### 2026-07-29 — OPS-9 Power-user polish shipped (Phase 13 complete)

- Shortcuts: ⌘K `/` `g+o/p/i…` `?` help; order pin views; bulk → PROCESSING
- Stock CSV import dry-run/commit (`/admin/commerce/import`); Zod rows + audit
- IMPLEMENTATION_AUDIT Phase 13 cross-check done same day; P1 leftovers remain

### 2026-07-29 — OPS-8 Settings & trust shipped

- Policy hub: return window, low-stock threshold, shipping copy → `commerce_settings` + audit
- Audit viewer: filter/paginate; roles matrix; dashboard/inventory use policy threshold
- Next: OPS-9 Power-user polish

### 2026-07-29 — OPS-7 Reports shipped

- Gallery: sales/products/inventory/returns/coupons/funnel; sales prev-period + sparkline + CSV
- APIs: `/reports/sales|products|inventory|returns|coupons` (paise); Finance read roles
- Next: OPS-8 Settings & trust

### 2026-07-29 — OPS-6 Promotions shipped (+ OPS-5 xcheck)

- OPS-5 xcheck: P0 ok; customer 360 roles refresh from `/auth/me`
- Promotions desk: list type/schedule/status/usage; builder + preview; generate/deactivate; audit create/activate
- Ceiling: one coupon per cart (stack matrix P2)
- Next: OPS-7 Reports

### 2026-07-29 — OPS-5 CRM & support shipped

- Customers desk: search/status/LTV/segments; Customer 360 (addresses, orders, notes, inquiries)
- Support desk: email/phone/order lookup + inquiries/returns links; suspend blocks checkout
- Next: OPS-6 Promotions

### 2026-07-29 — OPS-2 Catalog desk shipped

- Products power-table: `?q`/`?status`, stock column, tags, sticky bulk bar; admin list API filters
- Product edit sectioned (basics/SEO/media/tags/variants) + publish + inventory desk links
- Categories desk + nav; merchandising polish (CMS home + legacy pins + /gift preview)
- Next: OPS-5 CRM & support

### 2026-07-29 — OPS-3 Inventory ops shipped

- `InventoryMovement` ledger + adjust API (RECEIVE/DAMAGE/RECOUNT/CORRECTION)
- Never available-negative (`onHand >= reserved`); audit `inventory.adjusted`
- Desk UI: list, low-stock board, adjust sheet, history sheet
- Catalog absolute inventory set routes through same ledger (CORRECTION)
- OPS-4 cross-check: order detail roles refresh from `/auth/me`
- Next: OPS-2 Catalog desk

### 2026-07-29 — OPS-4 Order desk shipped

- Queue: status chips, search, age window, exception badges, list/board toggle
- Case file: customer/address, lines+personalization, payment, notes, timeline, print pack slip
- Carrier + trackingNumber + shippedAt (migration `20260729190000_ops4_order_shipping`)
- AuthZ: Support notes; Finance cancel; Commerce fulfill; payment blocks ship
- Next: OPS-3 Inventory ops

### 2026-07-29 — OPS-1 Command center + OPS-0 responsive harden

- Shell: `100dvh`, safe-area, scroll-lock drawers, mobile header 2-row, bottom-sheet ⌘K, tap-sized nav
- `OpsTableScroll` on orders/products/reports; product edit lost double padding
- Dashboard `?range=1|7|30`; alert cards deep-link orders/returns/inventory; Refresh + relative age
- Orders list honors `?status=` / `?focus=failed-payments`
- Next: OPS-4 Order desk

### 2026-07-29 — OPS-0 Commerce Shell & IA shipped

- `CommerceOpsShell`: sidebar IA, breadcrumbs, role chip, Payments:mock cue, ⌘K jump palette
- Role-gated nav: SUPPORT/FINANCE reduced; API read access for Support (orders/customers/search) + Finance reports
- Placeholders: `/inventory`, `/settings`; login redirects Support → support desk, Finance → reports
- Check: `pnpm exec tsx apps/web/lib/commerce-ops-nav.check.ts`
- Next: OPS-1 Command center

### 2026-07-29 — Commerce OPS Panel journey (Phase 13)

- Human: move to commerce ops panel; document full development journey before coding one-by-one.
- **Authority:** `docs/COMMERCE_OPS_PANEL.md` v1.0.0 — OPS-0…9 contracts (UI/UX + functionality).
- **Phases.md** §26 Phase 13 pointer added.
- Active Phase → Phase 13; first build = **OPS-0 Shell & IA** (not started).
- Baseline: Phase 4 MVP remains; journey **deepens**, does not replace stack/theme locks.
- Build order: OPS-0 → 1 → 4 → 3 → 2 → 5 → 6 → 7 → 8 → 9.

### 2026-07-29 — Brand line + hamper card contents modal

- **Override:** Soft Gift merchandising UX outside Phase 12.
- Brands are labels (`Brand:` / `Brands:`), not chips; hampers/BYB use unique item/product brands.
- Ready-hamper cards: badge corners split; contents via modal (no in-grid card stretch).

### 2026-07-29 — Hamper PDP (display BOM)

- **Override:** Soft Gift hamper merchandising outside Phase 12.
- Plan: `docs/plans/hamper-pdp.md` — same `/gift/products/[slug]`, branch on `isReadyMadeHamper`.
- `ProductHamperItem` display BOM (not multi-line cart); savings = contents − sell (paise).
- `ProductMedia.kind` IMAGE|VIDEO + poster; `seoSections` JSON for long-form SEO.
- Linked SKU BOM / bundle inventory deferred.

### 2026-07-29 — Soft gift collection pages (rule-based)

- **Override:** Collection browse UX outside Phase 12 (storefront merchandising).
- Soft collections: `/gift/collections/[slug]` registry maps to existing catalog filters (no Prisma `Collection` yet).
- Desktop filter sidebar + mobile sticky Filters sheet; collection base filter locked.
- Launch set: recipient / occasion / age / curated (hampers, bestsellers, editors, new, sale).

### 2026-07-28 — Soft Gift ecommerce + CMS leftovers (dev-only)

- **Policy:** No Razorpay / real S3 / real SMTP / public DNS in this track — mock + local adapters stay
- Wave 0: QA smoke + audit honesty; `/gift/hampers` redirect fix
- Wave 1: Product `seo*` + `faqItems` (Prisma + admin + PDP metadata)
- Wave 2: `CommerceInvoice` snapshot + existing pdfkit PDF path
- Wave 3: Checkout/admin mock-pay clarity; `PAYMENTS_MODE=mock` in `.env.example`
- Wave 4: CMS `countdown` block
- Wave 5: OpenAPI stub (`docs/openapi.stub.yaml` + generate script)

### 2026-07-28 — Triple theme token architecture

- **Override:** Design.md dual-system → **triple** (Soft Gift · Blog Creative · Creator Collective)
- Shared `:root` foundations; per-theme primitives/semantics/recipes; `data-density="compact"` for admin
- Orphan `data-theme="admin"` removed; editorial → `blog`, commerce/platform → `gift`, creator admin → `creator`
- Public `/articles` + `/specialists` moved under `(blog)` route group

### 2026-07-22 — Soft Gift homepage & chrome roadmap (Pass 1–12)

- **Override:** Soft Gift storefront polish outside Phase 12
- Pass 1: layout-owned footer + nav; home drops CMS footer block
- Pass 2–4: saleStrip, discoveryChips, buildYourBoxTeaser (+ Zod/admin/seed)
- Pass 5–6: home quick-add; empty journal hide
- Pass 7–8: footer Help/social/newsletter; WhatsApp FAB + back-to-top
- Pass 9: `/about`, `/contact`, creative Soft Gift 404
- Pass 10–12: marquee a11y, scroll reveal, next/image hero+home cards

### 2026-07-22 — Homepage sections after brand strip

- **Override:** Soft Gift homepage polish outside Phase 12
- Shared `GiftSectionHeader` (overline + title + subtitle + secondary CTA)
- Product grids: featured lead card + richer tiles (brand, labels, From ₹)
- Recipient split: numbered cards, blurbs, photos; journal subtitle
- CMS product cards pass `brandName` / `displayLabels` / hamper flag

### 2026-07-22 — Hybrid product labels (Phase A)

- **Override:** Gift Commerce merchandising outside Phase 12
- Manual presets: `BESTSELLER` | `EDITORS_PICK` | `GIFT_SET` (max 2)
- Auto ribbons: `% off` from `compareAtPricePaise`, `New` ≤30d publish, `Low stock` 1–5; display cap 2
- Priority: PCT_OFF → LOW_STOCK → manuals → NEW; legacy NEW/SALE ignored on read
- Admin MRP PATCH; PDP strike-through MRP; `displayLabels` on catalog DTO
- No CMS label library this pass

### 2026-07-22 — PDP FAQs + accordion ease

- **Override:** Gift Commerce PDP polish outside Phase 12
- Homepage CMS FAQ stays; PDP also gets product-aware FAQs (personalise / ship / returns / gift|hamper) + FAQPage JSON-LD
- Shared `FaqAccordion` with height ease (grid 0fr→1fr); CMS + PDP + shipping/returns drawers
- Per-product CMS FAQ fields still deferred

### 2026-07-22 — CMS FAQ/SEO edge-case hardening

- `/pages/corporate-gifting` → redirect `/gift/corporate` (canonical duplicate)
- Admin FAQ save: reject invalid/empty JSON (no placeholder pollution)
- SEO Zod: empty strings → null/omit for canonical/OG/seo fields
- Unpublished QA pages `dnd-test-*` / `welcome-test-*` (left sitemap)

### 2026-07-22 — CMS FAQ block + Marketing SEO completeness

- Phase 12 CMS backlog: `faq` page block (accordion + FAQPage JSON-LD)
- MarketingPage SEO: `canonicalPath`, `ogImageUrl`, `robotsIndex`; wire `/gift`, `/gift/corporate`, `/pages/[slug]`
- Discovery: `app/sitemap.ts` + `app/robots.ts`; preview noindex
- Product/PDP SEO fields deferred

### 2026-07-22 — PDP UX polish (Google feedback, adapted)

- **Override:** Gift Commerce PDP polish outside Phase 12
- Stars under title; personalisation toggle (no fake +₹ fee); wishlist heart; TrustStrip icons
- About highlights from real product data (not invented material claims); Quick Add on related
- Empty reviews: warmer copy + `GET /catalog/reviews/recent` store-wide social proof
- Multi-image gallery already has thumbs; added dots — extra narrative photos need Admin media

### 2026-07-22 — Product storefront labels (NEW / SALE)

- **Override:** Gift Commerce merchandising polish outside Phase 12
- `Product.storefrontLabels` String[] (`NEW`|`SALE`); Commerce Admin checkboxes; PLP overlay + PDP chips
- Not auto from publish date; no compare-at pricing this pass
- **Superseded** by Hybrid labels Phase A (same day)

### 2026-07-22 — Soft Gift PDP modern hierarchy

- **Override:** Gift Commerce PDP polish outside Phase 12
- Gallery + sticky buy box (qty, CTA hierarchy, personalization helpers)
- TrustStrip; About + tags; shipping/returns details; related products; reviews form collapsed by default
- Components: `pdp-gallery.tsx`, `trust-strip.tsx`

### 2026-07-22 — Invoice document format polish

- Preview: hide GiftNav; proper TAX INVOICE header, meta grid, address cards, item table (Qty/Price/Amount), clean totals
- Payment label maps `mock` → Online payment; dates en-IN
- PDF layout aligned to same structure; print CSS for clean sheet

### 2026-07-22 — Invoice preview + PDF download

- Why HTML before: MVP receipt without PDF lib — users wanted real PDF + preview
- `/orders/[id]/invoice` Soft Gift preview (Print + Download PDF)
- `GET /orders/me/:id/invoice` JSON; `GET …/invoice/pdf` → `application/pdf` via pdfkit
- Order detail CTA: **View invoice** (not direct HTML download)

### 2026-07-22 — Account displayName syncs to GiftNav

- Profile PATCH updated DB + page state but not `localStorage` user → header stayed stale
- Fix: `updateStoredUser()` + `AUTH_CHANGED` notify after save

### 2026-07-22 — Order invoice download (post-payment)

- `GET /orders/me/:id/invoice` → printable HTML receipt (AuthZ + only after CAPTURED/paidAt)
- Order detail: Download invoice CTA, ship/bill address, payment line, Continue shopping / Build another box, support email
- Invoice # = `INV-{orderNumber}` (dedicated Invoice model / PDF lib deferred)
- Check: `order-invoice.check.ts`
- **Override:** Gift Commerce polish (user-reported) outside Phase 12

### 2026-07-22 — Build Your Box URL → `/gift/build-your-box`

- Canonical path renamed from vague `/gift/box` for clarity + SEO
- Permanent redirect `/gift/box` → `/gift/build-your-box` in `next.config.js`
- Nav/CTA/seed/defaults updated; login `next=` + PDP continue preserve new path

### 2026-07-22 — Build Your Box wizard UX + recommendations fix

- **Bug:** login → `/gift/box` silently dumped users on step 6 (persisted box + auto-force when items existed)
- **Fix:** resume gate (Continue / Start over); remove mount auto-jump to step 6; `POST /catalog/gift-boxes/reset` clears items+prefs; move-to-cart resets wizard to step 1; empty step-6 auto-reset
- Recommendations: progressive filter relaxation (category→occasion→age→budget-only); `ageBand=any` no longer requires tag `any`
- PDP Add-to-box uses `?continue=1` to skip resume gate
- Check: `gift-box-recommendations.check.ts`
- **Override:** Gift Commerce polish outside Phase 12 (user-reported storefront bug)
- Next: redeploy web+api for live site; manual smoke of wizard 1→6 + recommendations

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
- Authority: `docs/CMS_PAGE_BUILDER.md`; Phases §24; DnD lib when coding = `@dnd-kit`
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
- See `docs/IMPLEMENTATION_AUDIT.md` for Phases 0–3 cross-check

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

- Canonical docs: `/srv/Inabiya/docs/`; `docs` symlink → `Docs` (removed broken `/srv/docs`)
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
- [x] Secret rotation runbook (`docs/RUNBOOKS.md`)
- [x] Rate limits on auth + checkout place-order
- [x] Pentest P0/P1 remediations MVP (`docs/SECURITY.md` + headers)
- [x] DR smoke test (`scripts/dr-smoke.sh`)
- [x] Runbooks: webhook failures, queue backlog, rollback
- [x] PII/GDPR checklist (MVP notes in RUNBOOKS)
- [x] Launch checklist signed (`docs/RUNBOOKS.md`)
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
- [x] OpenAPI stub generation path (`scripts/generate-openapi-stub.js` → `docs/openapi.stub.yaml`)

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

- [x] Categories/collections browse
- [x] PLP/PDP
- [x] Personalization MVP
- [x] Gift box builder MVP
- [x] Wishlist MVP
- [x] Admin product CRUD + publish
- [x] Basic inventory qty

### Phase 3 — Cart/checkout/payments/orders

- [x] Cart guest+auth merge
- [x] Checkout MVP
- [x] Payment adapter (**mock** — Razorpay post-dev)
- [x] Webhook idempotency tests
- [x] Inventory reserve/release
- [x] Order history/tracking basics
- [x] Confirmation notification

### Phase 4 — Commerce ops console

- [x] Dashboard KPIs subset
- [x] Order fulfillment transitions
- [x] Customer admin profile
- [x] Coupons MVP
- [x] Homepage CMS MVP
- [x] Basic reports
- [x] Low stock / failed payment alerts MVP

### Phase 5 — Commerce GA hardening

- [x] Reviews moderation MVP
- [x] Returns request MVP
- [x] Abandonment email job
- [x] Funnel analytics events
- [x] Perf/security/a11y passes
- [x] Support lookup enough for launch

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

### Session — 2026-08-11 (Commerce Ops readability)

- **Override:** Phase 14 active; human asked comprehensive plan + fix for Soft Gift ops desk washout.
- Shipped: gift+compact token remap; clay-panel/card/chip densify; `.ops-muted`/`.ops-th`; shell chrome; dashboard (blob removed, alert/KPI contrast); thead sweep on commerce list pages; Design + Memory.
- Storefront `/gift` untouched.
- **Live:** `bash scripts/deploy-vps.sh web` @ `c6bb10d` — smoke health/ready 200; web recreated.
- Follow-up: warm paper canvas (blush+yellow ivory) replaces cool gray void; redeployed web.
- **Pushed:** `cc910e5` → `origin/main` (OPS-10 + ops desk readability).
- Next: hard-refresh QA on Dashboard; resume OPS-10.

### Session — 2026-08-11 (OPS-10 Procurement S0–S3)

- **Override logged:** Phase 14 / OPS-10 procurement started after Phase 13 P1.
- Shipped suppliers + simple PO full-receive path (API + Soft Gift desks + Delhi seed).
- Next: migrate + seed + deploy; QA Receive all → inventory.
- Deployed `web api` @ `c6bb10d` (working tree); migrate already applied; health/ready 200. Seeded Delhi suppliers locally.

### Session — 2026-08-11 (Commerce OPS P1 track complete)

- **Override:** Phase 13 P0 complete; human: comprehensive P1 plan + execute OPS-order one-by-one.
- **Docs-only already shipped:** OPS-2 media picker on edit; OPS-8 alert prefs + flags link; OPS-9 mobile triage + orders keyset.
- **OPS-3:** inventory reservations drawer — `GET …/inventory/:variantId/reservations` (PENDING_PAYMENT); migration `20260811100000_ops3_order_item_variant_index`.
- **OPS-5:** `CustomerCommunicationLog` + POST log-only; customer 360 Communications; migration `20260811110000_ops5_customer_communication_log`.
- **OPS-6:** scope+schedule overlap chips (`conflictsWith`) on promotions desk; check `coupon-overlap.check.ts`.
- **OPS-9:** Product CSV import (`POST /admin/catalog/products/import`, Import Stock|Products tabs); customers keyset + Prev/Next; migration `20260811120000_ops9_users_keyset_index`.
- Checks: inventory-reservations, customer-communication, coupon-overlap, parse-product-csv, admin-customers-cursor; api+web tsc green.
- Deployed `bash scripts/deploy-vps.sh web api` @ image tag `c6bb10d` (working tree); migrate no pending; health/ready 200.
- Next: live QA matrix; commit/push when human asks.

### Session — 2026-08-08 (Collections mobile card uses full width)
- Mobile list cards: title/slug/chips left, Edit/View icon stack right (no empty right gutter).
- Deployed `web` only.
- Next: commit/push pending admin UX batch if human asks.

### Session — 2026-08-08 (Collection sort auto + list action icons)

- Removed Sort order from collection edit UI; list/chrome order by `createdAt` asc.
- Collections list Edit/View/Delete: icon+label, larger tap targets (mobile-friendly).
- Next: deploy web+api.

### Session — 2026-08-08 (Push Smart collections + edit page + PLP schema)

- Committed + pushed Smart membership, dedicated collection edit page, CollectionPage JSON-LD, migrations SEO+smart.

### Session — 2026-08-08 (Collection PLP JSON-LD)

- Auto `CollectionPage` + `ItemList` (+ breadcrumb) on `/gift/collections/[slug]`; check `collection-page.check.ts`.
- Next: deploy web; view-source PLP for ld+json.

### Session — 2026-08-08 (Collection edit → dedicated page)

- List desk Edit opens `/admin/commerce/collections/[id]` (not inline). New → `/collections/new`.
- Edit page shows matching/assigned products list + conditions + SEO; API `getAdminCollection` returns Smart live matches.
- Next: deploy web+api; QA Edit → product list.

### Session — 2026-08-08 (Smart collections deploy)

- Deployed `bash scripts/deploy-vps.sh web api` (working tree; image tag still `3df96c9`) — migrate no pending; smoke health/ready 200; api+web healthy.
- Next: hard-refresh admin Collections (Hand-picked / Smart); QA `/gift/collections/for-baby-girl`. Commit/push when ready.

### Session — 2026-08-08 (Shopify-style Smart collections, easy UI)

- **Override:** Phase 13 complete — human: Smart collections back, but easy to understand (no JSON).
- Schema: `membershipMode` MANUAL|SMART + `smartRules` JSON. Migration `20260808150000_collection_smart_membership`.
- Admin: **Hand-picked** vs **Smart (auto)**; condition rows (field / is / value); All/Any match; SEO kept.
- Product assign + coupons: Hand-picked only. Seed 16 Smart with one condition each.
- Next: deploy web+api; QA Smart PLP + builder.

### Session — 2026-08-08 (Drop RULES — collections join-only + SEO)

- **Override:** Phase 13 complete — human: remove Rules membership; product↔collection assign only.
- Materialized 16 RULES → `ProductCollection` joins (138 links), then migration `20260808140000_collections_manual_only_seo` drops `membership_mode`/`rules`, adds collection SEO fields.
- API/Zod/admin/storefront: no RULES; list by joins; collection SEO in create/update + `generateMetadata`.
- Admin desk: product multi-select + SEO fields; product form label Collections (all collections).
- Seed: MANUAL metadata + match-based joins after products.
- Next: deploy web+api; QA collections desk + PLP SEO.

### Session — 2026-08-08 (Collections deploy + push)

- Pushed `f9e0e5a` → `origin/main`.
- Deployed `bash scripts/deploy-vps.sh web api` @ `f9e0e5a` — api/web/worker healthy; migrate no pending; smoke health/ready 200.
- Next: hard-refresh admin Collections + `/gift/collections/for-baby-girl` on live.

### Session — 2026-08-08 (Collections cross-check)

- Cross-check vs plan: schema/API/admin/storefront/seed/docs mostly PASS; tsc + unit checks green; DB 16 RULES collections, `categories` table gone.
- Fixed leftover: CMS page block defaults still `catalogCategories` / `?category=` → `catalogCollections` + `/gift/collections/…`; save path normalizes old source to `catalogCollections`.
- Remaining gaps (non-blocking / known): admin desk missing hero/related/MANUAL product multi-select UI fields; `GIFT_COLLECTIONS` registry still in repo (PLP uses API); prod deploy + MarketingPage JSON rewrite still pending; coupon COLLECTION needs MANUAL collection.
- Next: deploy web+api; QA collections PLP + admin desk.

### Session — 2026-08-08 (Collections replace Categories — 1A hybrid · 2B fresh)

- **Override:** Phase 13 complete — human: drop commerce Categories; Collections only (Shopify-shaped). Blog `EditorialCategory` untouched.
- Schema: `Collection` + `ProductCollection`; drop `Category`/`ProductCategory`; `GiftBox.collectionSlugs`; `CouponScope.COLLECTION` + `collectionIds`. Migration `20260808120000_collections_replace_categories`.
- Membership: `MANUAL` (join) | `RULES` (JSON filters). Coupon COLLECTION = MANUAL joins only (v1).
- API: `/catalog/collections`, admin CRUD; products `collectionSlugs` / `?collection=`.
- Admin: `/admin/commerce/collections` desk; categories page removed; nav/products/coupons remapped.
- Storefront: collection PLP loads from API; PLP/chrome/BYB/CMS off category; seed 16 RULES collections from former registry.
- Checks: validation rebuild; collection-ops, coupon-lifecycle, gift-box-rec, catalog-collections, nav, product-grid; api+web tsc clean. Local migrate + seed 16 collections.
- Next: `deploy-vps.sh web api`; hard-refresh admin collections + `/gift/collections/for-baby-girl`; optional MANUAL collection for coupon QA.

### Session — 2026-08-08 (Cross-check audit fixes + Support ?q= restore + deploy)

- Cross-check: Search→Support redirect, orders/coupons cursors, dashboard aggregates, product clay, `loginUrl`/401, reports lazy, `opsChipClass`, migrations present.
- Gap fixed: Support had lost `useSearchParams` auto-run for `?q=` (Search redirect regression) — restored Suspense + URL sync + `loginUrl` + gift-banner.
- Checks: api+web tsc; orders/coupons cursor + coupon-lifecycle checks OK.
- **Live:** `deploy-vps.sh web api` @ `2261a69` — Support `?q=` restore in web image; migrate no pending; smoke health/ready 200; api+web healthy.
- **Git:** committed + pushed Soft Gift desks + coupon scope + OPS audit fixes 1–6 (this session).

### Session — 2026-08-08 (OPS cross-audit fixes 1–6 complete)

- **Override:** Phase 13 — human: fix audit items 1→6 completely.
- **1 Search:** stub → redirect Support (`?q=` preserved); nav Search removed; Support auto-runs URL q; products → admin edit.
- **2 Orders:** keyset `{ items, nextCursor, limit }` + slim select; FE Prev/Next; cursor helpers + check.
- **3 Dashboard/sales:** KPI aggregates (not unbounded findMany); products report SQL GROUP BY; indexes migration `20260808080000_ops_hot_indexes` (`orders.created_at+id`, `paid_at`, `payments.status`, `inventory.on_hand`).
- **4 Product create/edit:** Soft Gift clay-panel/input/chip + gift-banner; media field chrome aligned.
- **5 Auth UX:** `loginUrl` everywhere; products `clearSession` only on 401; shell `g` chords role-filtered.
- **6:** `opsChipClass` shared; reports lazy-by-tab + cache; coupons cursor pagination.
- Checks: api+web tsc clean; orders/coupons cursor checks; migrate applied locally.
- **Live:** `deploy-vps.sh web api` @ `2261a69` — hot indexes already applied; smoke health/ready 200; containers healthy.

### Session — 2026-08-08 (Fix 5/6 ops leftovers)

- **Fix 5:** `loginUrl` + `ApiClientError`/`isUnauthorizedError`; bare `/login` → `loginUrl(...)` across commerce desks; products list clears session only on 401; shell `g` chords filtered by `filterNavForRoles` hrefs
- **Fix 6:** `opsChipClass` shared helper; reports lazy-fetch by active tab + cache; coupons `listAdmin` cursor pagination `{ items, nextCursor, limit }` + FE Prev/Next; `adminCouponsQuerySchema`; validation rebuild
- Migrations: none · Env: none
- Risk: coupons status/search still client-filters current page only (v1)
- Next: human QA chords + reports/coupons

### Session — 2026-08-08 (Orders desk cursor pagination)

- Admin orders list: consume `{ items, nextCursor, limit }` + `cursor`/`limit` query (products desk UX).
- Prev stack, filter resets cursor, soft refresh kept; login `?next=` preserves orders URL.
- File: `apps/web/app/(admin)/admin/commerce/orders/page.tsx`. AuthZ/bulk/board untouched.

### Session — 2026-08-08 (Commerce OPS Soft Gift cross-reaudit)

- Static reaudit of 21 `/admin/commerce` routes (UI parity + perf/data + AuthZ/deep-links).
- Verdict: list desks mostly gold; outliers Search + product create/edit; scale P1s = orders take:100, dashboard unbounded paid loads, reports 6× fetch.
- Artifact: canvas `commerce-ops-cross-audit.canvas.tsx` (20 findings · fix order 1–6).
- No code changes this pass.

### Session — 2026-08-08 (Dashboard / coupons / merchandising / settings Soft Gift)

- **Override:** Phase 13 — human: polish remaining commerce desks + product/category coupons.
- Coupons: Soft Gift desk (chips/search/cards/table/builder) + **CART | PRODUCT | CATEGORY** scope; eligible-subtotal validate in cart; Zod + migration `20260808010000_coupon_scope`.
- Dashboard: clay-chip ranges; inventory deep-link `?stock=low`; Refresh parity.
- Merchandising: clay-panels; product search pins; homepage CMS CTA; drop guide blurbs.
- Settings: clay-chip Policy/Audit tabs; clay-panel forms; mobile audit cards; soft Refresh.
- Check: `coupon-lifecycle.check.ts`; web+api tsc clean; migrate applied locally.
- **Live:** `deploy-vps.sh web api` @ `2261a69` — migrate none pending (scope already applied); smoke health/ready 200; containers healthy.

### Session — 2026-08-08 (Commerce ops sidebar live)

- `deploy-vps.sh web` @ `2261a69` — container recreated; smoke health/ready 200; sidebar polish now on `127.0.0.1:3001`
- Next: hard-refresh QA collapse/expand + mobile drawer

### Session — 2026-08-08 (Commerce ops sidebar polish)

- Desktop sidebar: collapsible icon rail (persists `localStorage`); header + brand toggles; `[` shortcut
- Lucide icons on every nav item + command palette rows; active pink bar + hover micro-motion (`prefers-reduced-motion` respected)
- Collapsed footer: avatar initials + sign-out icon; mobile drawer slide-in
- Files: `commerce-ops-shell.tsx`, `globals.css` ops-aside / ops-nav-link
- Next: hard-refresh QA collapse/expand + mobile drawer

### Session — 2026-08-08 (Reports chart height + daily pagination)

- **Override:** Phase 13 — human: Sales trend chart too tall; daily list too long; no deploy.
- Chart: SalesTrendChart fixed height `10.5rem` / `12rem` (drop wide `aspect-video` blow-up).
- Sales daily table/cards: 10/page, newest-first, Prev/Next pager; CSV still exports full window.
- Returns recent list: 8/page same pager. Web tsc clean. **Deploy:** skipped per human.

### Session — 2026-08-08 (push Soft Gift ops batch)

- Committed + pushed `5262fd1` → `origin/main` (84 files): Soft Gift desks, reports charts, categories/video/SEO extras.
- Already live via prior `deploy-vps.sh web api` @ working tree (image tag still `6976f9e` until next rebuild).

### Session — 2026-08-08 (Support products leftover + deploy)

- Support desk: show API `products` hits → `/admin/commerce/products/[id]`; only non-empty result sections; placeholder includes product.
- Build: Next.js production build OK inside deploy; web `tsc` clean earlier.
- **Live:** `deploy-vps.sh web api` @ `6976f9e` — migrate none pending; smoke health/ready 200; containers healthy.

### Session — 2026-08-08 (CRM desks Soft Gift cross-check)

- Verified Soft Gift parity (chips/search/cards/table/Refresh) + URL defaults (reviews PENDING, returns REQUESTED / `?status=REQUESTED` deep-link).
- Fixes: reviews empty copy (`filterActive || status` bug); notice after moderate (load was clearing it); Support Refresh re-runs lookup when results open; NEW badge amber (match inquiries).
- AuthZ UX: hide review Approve/Reject + returns Save/moderate unless COMMERCE_ADMIN|SUPER_ADMIN (API already restricted; SUPPORT read stays).
- Known leftover (pre-existing): support search API returns `products` but UI still omits product hits.
- Web tsc clean. **Deploy:** pending (`deploy-vps.sh web`).

### Session — 2026-08-08 (Reviews / returns / support / inquiries Soft Gift)

- **Override:** Phase 13 complete — human: polish reviews, returns, support, gifting-inquiries to Soft Gift desk parity.
- Reviews: clay-chip Pending/Approved/Rejected/All; search pill; mobile cards + table; Approve/Reject; soft Refresh; no guide copy.
- Returns: Requested default + status chips; search; compact return-window panel; Approve+refund/Reject; Settings link; mobile cards + table.
- Support: search pill lookup; clay-panel results + badges; recent inquiries; drop “3 clicks” description.
- Inquiries: type + New chips; search; mobile cards (More/Less) + table; Support/Customer links.
- No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Reports charts + filters)

- **Override:** Phase 13 complete — human: shadcn graphs + relevant filters on `/admin/commerce/reports`.
- Dep: `recharts@2.15.4`; shadcn-style `components/ui/chart.tsx`; Soft Gift chart helpers in `reports-charts.tsx`.
- Charts: Sales area (revenue/orders); Products/Inventory/Coupons/Funnel bars; Returns donut.
- Filters (URL): window `1d|7d|14d|30d` chips; Sales `metric`; Products `top`+`sort`; Returns `rstatus`; Coupons `active=1`.
- No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Product create/edit Soft Gift clay polish)

- **Override:** Phase 13 complete — human: polish product create + edit forms to Soft Gift clay desk chrome.
- `products/new`: clay-panel sections, clay-input, gift-banner errors, clay-btn / ghost Cancel.
- `products/[id]`: clay-panel sections/hero/sticky bar; clay-input; clay-chip toggles; clay pulse skeleton; gift-banner errors/success; login `next` → product id (not list).
- Nested chrome: `product-media-field`, `product-gallery-editor`, `product-video-field` → clay-input / clay-panel / gift-banner (TipTap/SEO/gallery/video kept).
- AuthZ + save/publish/API unchanged. No migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Reports Soft Gift desk polish)

- **Override:** Phase 13 complete — human: polish `/admin/commerce/reports` UI/UX + responsive.
- Clay-chip report tabs (no gallery blurbs); window select; URL `?report=&days=`; soft Refresh; drop guide description.
- Sales KPI clay-panels + delta tones; mobile cards + clay-panel tables; soft status badges; empty panels; inventory link `?stock=low`.
- No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Customers Soft Gift desk polish)

- **Override:** Phase 13 complete — human: polish `/admin/commerce/customers` (+ 360) to Soft Gift desk parity.
- List: clay-chip All/Active/Suspended; search pill + 300ms debounce; Clear + count; Refresh soft-refresh; mobile cards + clay-panel table; drop guide description.
- 360: badges (account/orders/inquiries); clay-panel sections; skeleton/empty; Refresh; emerald/red banners; no notes how-to copy; Suspend AuthZ unchanged.
- No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Orders case-file Soft Gift polish)

- **Override:** Phase 13 complete — human: continue orders improvements (list gaps + case file).
- List: sticky bulk bar (products pattern); clear selection on filter change.
- Case file `/admin/commerce/orders/[id]`: drop header description; status/payment badges; skeleton/empty; soft Refresh; emerald/red banners; shortened exception labels; section chrome; timeline badges; note submit via form Enter; load error (no silent redirect).
- AuthZ/actions unchanged. No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Orders Soft Gift desk polish)

- **Override:** Phase 13 complete — human: polish `/admin/commerce/orders` to Soft Gift desk parity (products/categories/inventory).
- UI only: clay-chip status + Pay issues; search pill + 300ms debounce; Age select; Clear + count; RefreshCw soft-refresh; drop header description.
- List: mobile cards + clay-panel desktop table; status/payment soft badges; skeleton/empty banners; pin views as clay chips.
- Preserved: List/Board, pin views, bulk → PROCESSING, exceptions, `?focus=failed-payments`, AuthZ.
- No API/migration; cursor pagination still P1. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Stock CSV import cross-check)

- **Override:** Phase 13 — human: cross-check last import polish.
- Fixes: `canSubmit` no longer waits on deferred parse (paste lag); sticky bar + page `pb` use safe-area; mobile Inventory link; AbortError ignore.
- Verified: Soft Gift clay/gift-banner; dry-run→commit gate; API path + Zod max 500 unchanged; web tsc clean.
- **Deploy:** still pending (`deploy-vps.sh web`).

### Session — 2026-08-08 (Stock CSV import polish)

- **Override:** Phase 13 complete — human: design / perf / responsive polish on `/admin/commerce/import`.
- Soft Gift ops: clay-panel editor, reason chips, Upload CSV, gift-banner errors, result status pills.
- Responsive: mobile sticky Dry-run/Commit bar; mobile result cards + desktop table; Inventory link sm+.
- Perf: `useDeferredValue` live parse count; `startTransition` for results; AbortController cancel; paginate results (80).
- No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Inventory desk cross-check)

- **Override:** Phase 13 — human: verify adjust/history + UI/UX + responsive + performance.
- Fixes: modal backdrop was covering dialog (clicks dead); stale load/history race via seq refs; soft refresh (no list unmount flicker); modal-local adjust/history errors; Esc close; Enter submit on Adjust; history clear+skeleton; mobile Import link; Out-only “N of M” count.
- Adjust preview still mirrors API available≥0; web tsc clean. Deploy still pending.

### Session — 2026-08-08 (Inventory desk Soft Gift polish)

- **Override:** Phase 13 complete — human: polish `/admin/commerce/inventory` to Soft Gift desk parity (products/categories).
- UI only: clay-chip All/Low/Out; search pill + 300ms debounce; sort Available↑↓/SKU/Product; Clear + count; mobile cards + clay-panel table; Import + Refresh header; drop guide description.
- Adjust/History modals: clay surfaces, reason labels, available-after preview (blocks Apply if &lt; 0 client-side; API still enforces).
- Legacy `?lowStock=1` still maps to Low chip; URL now prefers `?stock=low|out`.
- No API/migration. Web tsc clean. **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-08 (Categories desk filters)

- **Override:** Phase 13 complete — human: useful filters on categories desk; no deploy.
- Chips: All / With products / Empty; sort: sort order · name · product count; search includes description; Clear + count.
- Client-side only (small list).

### Session — 2026-08-08 (Dedicated PDP product video)

- **Override:** Phase 13 complete — human: YouTube/link video section below trust badges; not as primary image.
- Lib: `product-video.ts` (YouTube id parse + direct file); smoke `scripts/smoke-product-video.ts` PASS.
- Storefront: `ProductVideoPlayer` facade; `PdpVideoBand` rewired; gallery filters out VIDEO for LCP.
- Admin: `ProductVideoField`; gallery editor images-only; edit hydrate/save merges one VIDEO row.
- `next.config.js`: `i.ytimg.com` remote pattern for YouTube posters.
- **Deploy:** pending human (`deploy-vps.sh web`).

### Session — 2026-08-07 (Category assign + dynamic storefront)

- **Override:** Phase 13 complete — human: product edit category picker + stop hardcoding category chips/nav.
- Admin product edit: Discovery → Categories chips from `/admin/catalog/categories`; PATCH `categorySlugs`.
- Shared `lib/catalog-categories.ts`: fetch/merge helpers; check OK.
- Gift chrome `getGiftChrome`: non-category shopLinks + live catalog categories (auto after create).
- PLP chips, collection filters, BYB step, CMS product-grid category select → live catalog.
- Homepage discoveryChips: `itemsSource=catalogCategories` (+ auto-detect category PLP blocks); media hints kept by slug.
- Seed chrome shopLinks slimmed; category discovery block tagged `itemsSource`.
- **Deploy:** pending human (`deploy-vps.sh web api`) — skipped this session.

### Session — 2026-08-07 (Categories desk UI/UX polish)

- **Override:** Phase 13 complete — human: polish `/admin/commerce/categories` to products-desk Soft Gift parity (flat taxonomy; no tree/images).
- API: admin list returns `sortOrder` + `productCount`; `PATCH`/`DELETE` categories; delete blocked when products linked; slug conflict → 409; audits `catalog.category.update|delete`.
- Public `GET /catalog/categories` stays slim (no counts).
- UI: clay header/search/create panel; mobile cards + desktop table; inline edit + guarded delete; product count → products `?category=`.
- Check: `category-ops.check.ts` ok; validation rebuild; api/web tsc clean.
- **Live:** `deploy-vps.sh web api` @ `6976f9e` — smoke OK (health/ready 200); no pending migrations.

### Session — 2026-08-07 (No button translate hover)

- **Override:** Phase 13 complete — human: button lift looks childish; animate icons only.
- Removed `translateY` hover/active from `.clay-btn*` / `.blog-btn*` / `.creator-btn*` + footer social + floating WA/top.
- Kept Soft Gift icon micro-motion (`.clay-btn:hover svg`); logged in Design.md + `12-design-themes.mdc`.
- **Live:** `deploy-vps.sh web` — also ships mobile products hierarchy + Filters popover polish; smoke OK.

### Session — 2026-08-07 (Products mobile hierarchy)

- **Override:** Phase 13 complete — human mobile QA on products desk.
- Root: `.clay-btn-ghost { display:inline-flex }` overrode Tailwind `hidden` → Import/Categories/Merch leaked on phone; wrapped in `hidden sm:flex`.
- Mobile cards: title > price/stock/sku > tags as muted text (no pill chips); actions as text links + icon View.
- Toolbar: status + Filters one row; OpsPageHeader title + New product side-by-side.

### Session — 2026-08-07 (Products filters → single button)

- **Override:** Phase 13 complete — human: don't fill page with filters.
- Collapsed stock/type/merch/recipient/occasion/category/sort into one **Filters** popover (badge count, click-outside + Esc).
- Toolbar stays: status chips + Filters + count/Clear.
- **Live:** `deploy-vps.sh web api` — smoke OK (health/ready 200); no pending migrations.

### Session — 2026-08-07 (Products desk filters + sort)

- **Override:** Phase 13 complete — human: more useful filters/sort + responsive.
- API `adminCatalogListQuerySchema`: stock (low/out/in), hamper, storefrontLabel, recipient, occasion, category, sort (updated|title|created|price).
- Stock uses available (onHand−reserved) vs policy threshold; price sort ranked in-memory ≤500 (ponytail).
- UI: status chips + responsive select grid (1/2/3/4 cols) + Clear filters; URL-backed.
- Check: `admin-catalog-cursor.check.ts` ok; validation + api/web tsc clean.

### Session — 2026-08-07 (Products status filter readability)

- **Override:** Phase 13 complete — human QA: All/Published/Draft/Archived chips hard to read on blush wash.
- Audit: inactive used `border-subtle` + `opacity-80` + `text-xs` → borders vanished, contrast too low vs active pill.
- Fix: Soft Gift `.clay-chip` base; inactive `foreground` ink + surface fill; active primary tint; `text-sm font-medium`; `aria-pressed`.
- Scope: `/admin/commerce/products` only (orders/inventory still share old chip pattern).

### Session — 2026-08-07 (Schema auto review UX)

- Auto Product/FAQ chips clarified as Generated; live JSON-LD preview from product fields/FAQs.
- Product admin passes `autoPreviewNodes`; FAQ builder shared via `lib/product-faq.ts`.

### Session — 2026-08-07 (Media library + gallery DnD)

- **Override:** Phase 13 complete — human: library modal polish + drag reorder.
- `MediaAsset.altText` + PATCH `/media/:id`; library modal: select → edit alt/name → Use image.
- Product gallery: `@dnd-kit` drag handle (CMS-style), arrow buttons removed.
- Migration `20260807220000_media_asset_alt_text`.
- **Live:** `deploy-vps.sh web api` — migrate applied; smoke OK.

### Session — 2026-08-07 (Gallery + Schema UX polish)

- **Override:** Phase 13 complete — human UX feedback after schema ship.
- Gallery: compact 80px thumbs (row layout); hide Image URL for uploads; **Show source** / Paste URL when needed.
- Schema panel: auto-first chips (Product/FAQ, WebPage, Article…); extras + Advanced JSON collapsed by default.
- Next: deploy web for live admin
- **Live:** `deploy-vps.sh web` — smoke OK; hard-refresh product Media + Schema sections

### Session — 2026-08-07 (Admin SEO Schema Control)

- **Override:** Phase 13 complete — client: admin schema control on CMS pages + products + articles (1C + 2A guided+JSON).
- Prisma `seoSchemaExtras` on Product/Article/MarketingPage; Zod presets + custom; conflict rules (no Product/Article override; no second FAQPage when system FAQ).
- Shared `SeoSchemaPanel`; auto Product/Article JSON-LD; public merge into single `@graph`.
- Check: `pnpm exec tsx scripts/smoke-seo-schema-extras.ts` → PASS; api+web tsc clean.
- Env/migrations: `20260807120000_seo_schema_extras` deployed.
- **Live:** `bash scripts/deploy-vps.sh web api` @ `6976f9e` — health/ready OK; migrate no pending.
- Next: Rich Results Test smoke on one of each surface

### Session — 2026-08-07 (PDP CMS About + trust strip + media)

- **Override:** Phase 13 complete — Soft Gift PDP CMS polish (human: 1C TipTap About, 2A global trust).
- About: TipTap `seoSections` renders in About band; admin label “About this gift”; duplicate ProductSeoSections removed; empty → description + auto highlights.
- Trust: `pdp.trust_cues` in CommerceSetting; policy GET/POST + Settings UI; public `GET /api/v1/commerce/storefront/trust-cues`; TrustStrip fetches with defaults.
- Gallery editor: per-row IMAGE|VIDEO + poster URL (paste URL path).
- Demo: `lavender-bath-essentials` → 3 images + TipTap about HTML; seed updated; api+web rebuilt/redeployed.
- Next: human viewport QA

### Session — 2026-08-07 (push + deploy Soft Gift polish)

- Pushed `7af91ed` to `origin/main` (φ scale, type/image leftovers, Lenis+marketing RSC split, Docs→docs).
- Deployed `web` via `deploy-vps.sh web` — smoke healthy.
- Next: human viewport QA at 375/768/1280

### Session — 2026-08-07 (Soft Gift Lenis + marketing RSC split)

- **Override continue:** perf follow-up — Lenis deferred + marketing client islands.
- `(gift)/layout.tsx` → **Server** (`data-theme` + FOUC from `gift-hero-fouc.ts` no GSAP); chrome in `gift-layout-chrome.tsx`.
- `GiftLenis` lazy-loads `gift-lenis-inner` (Lenis+GSAP) after mount; reduced-motion skips.
- `marketing-page-blocks.tsx` → **RSC** (~1.5k LOC, no `'use client'`); `HomeProductCard` client island; RichText/FAQ sanitize on server via `sanitizeArticleHtml`.
- SVG `<img>` kept for brand marks / article SVG covers / corporate hero SVG (intentional).
- `tsc --noEmit` clean.
- Next: human viewport QA

### Session — 2026-08-07 (Soft Gift leftover type + images)

- **Override continue:** post-φ leftover pass — gift storefront `text-sm`/`text-xs`/`rounded-*` → `text-body`/`text-caption`/`rounded-pill|clay|control`; headings → `.gift-h2` where ad-hoc.
- Images: `next/image` on hamper PDP, gift-nav mega, wishlist, marketing hero/image/article covers (SVG brand marks + SVG covers stay `<img>`).
- Touched ~36 gift/marketing files; `tsc --noEmit` clean.
- Next: human viewport QA; Lenis/marketing client split optional

### Session — 2026-08-07 (Soft Gift φ spacing & typography)

- **Override:** post Phase 13 — Soft Gift–only visual polish (human: golden ratio φ + consistency). Blog/Creator untouched.
- Gift-scoped φ tokens in `globals.css`: type (body `1rem`, display `2.618`/`4.236`) + section space-5…8; `--gift-whatsapp`, `--gift-sticky-offset`.
- Hero headline → `--text-display*`; Tailwind `text-body` / `text-body-lg`.
- Hotspots aligned to recipes/`gs-*`/semantics: marketing blocks, clay-product-card, PDP, labels, filters, nav badge, invoice, WhatsApp FAB.
- Perf: `next/image` + `sizes` on clay-product-card + pdp-gallery (+ marketing secondary product grid).
- Docs: `Design.md` §4.2a/4.5–4.7 φ Soft Gift; this Memory entry.
- Next: human viewport QA; leftover gift `text-sm`/`<img>` pass optional

### Session — 2026-08-07 (rename Docs → docs)

- Renamed canonical folder **`Docs/` → `docs/`** (lowercase); removed old `docs` symlink earlier same day.
- Updated Cursor rules, README, openapi stub script, and in-doc path refs.
- Next: commit when human asks

### Session — 2026-08-07 (remove docs symlink)

- Removed `docs` → `Docs` symlink (superseded by rename to lowercase `docs/`).
- Next: rename complete

### Session — 2026-08-07 (hero headline mobile size)

- **Override:** Soft Gift polish (human: desktop hero H1 dominant but mobile still weak).
- Hero H1 scale: **44→56→72px** (was 36→52→72) so mobile/sm also punch above page `.gift-h1`.
- File: `globals.css` (`.gift-hero-split__headline`)
- Deployed `web` via `deploy-vps.sh web` @ `d4e4417` (smoke ok; live CSS has 2.75/3.5/4.5rem).
- Next: hard-refresh `/gift` mobile viewport QA

### Session — 2026-08-07 (brand 2-row carousel)

- **Override:** Soft Gift polish (human: 2-row carousel mobile+desktop; remove +more).
- Brand panel: dual seamless marquees (row2 reverse); hover pause; reduced-motion → swipe scroll.
- Removed `+ more` CTA.
- Files: `marketing-page-blocks.tsx`, `globals.css`
- Deployed `web` @ `d4e4417` (smoke ok).
- Next: hard-refresh brand strip on `/gift`

### Session — 2026-08-07 (brand panel mobile left align)

- **Override:** Soft Gift polish (human: brands left-align on mobile / improve).
- Mobile: 2-col grid + left title; pills fill cells; name ellipsis.
- `sm+`: flex wrap `flex-start` (no centered ragged last row).
- File: `globals.css`
- Deployed `web` @ `d4e4417` (smoke ok).
- Next: hard-refresh brand strip on `/gift` mobile

### Session — 2026-08-07 (hero type + Lenis + icon motion)

- **Override:** Soft Gift polish (human: larger dominant headline; minimal icon motion; add Lenis).
- Hero H1: 36→52→72px; `max-w-3xl`.
- Icon hover micro-motion on clay buttons, trust chips, USP cards (`prefers-reduced-motion` gated).
- Lenis on Soft Gift layout only (`GiftLenis` + ScrollTrigger sync); skipped when reduced-motion.
- Dep: `lenis` in `@inabiya/web`.
- Files: `gift-storefront-hero.tsx`, `gift-lenis.tsx`, `(gift)/layout.tsx`, `globals.css`, lockfile.
- Deployed `web` via `deploy-vps.sh web` @ `d4e4417` (smoke ok).
- Next: hard-refresh `/gift` — headline, hover icons, smooth scroll

### Session — 2026-08-07 (hero mobile CTA width + trust row)

- **Override:** Soft Gift hero mobile polish (human: trust badges one row; CTA not full-bleed; then both CTAs same row).
- Trust: always `flex-row`; mobile equal-width columns with icon-over-label.
- CTAs: side-by-side; primary flex-dominant; secondary content-sized + slightly smaller type on mobile.
- Files: `gift-storefront-hero.tsx`, `globals.css`
- Deployed `web` via `deploy-vps.sh web` @ `d4e4417` (smoke ok) ×3.
- Next: hard-refresh `/gift` mobile viewport QA

### Session — 2026-08-07 (hero FOUC — deploy + critical CSS)

- **Override:** Soft Gift hero polish (human: flash still visible after source-only fix).
- Root cause: Docker `inabiya-web` was **8d old** (source never deployed); prior CSS was inside `@layer` + late stylesheet.
- Fix: shared `gift-hero-entrance.ts` (set→ready→to); critical `<style>` in hero; unlayered globals FOUC rule.
- Deploy: `bash scripts/deploy-vps.sh web` — live on `:3001` (critical CSS in HTML before eyebrow)
- Next: hard-refresh `/gift` (Ctrl+Shift+R)

### Session — 2026-08-07 (hero FOUC / flash-before-from)

- **Override:** Soft Gift hero polish outside Phase 12 (human: content flash then hide then animate).
- Cause: `gsap.from()` after paint; no CSS pre-hide.
- Fix: CSS hide until `data-hero-ready`; `gsap.set` from-state then `to()`; reduced-motion still reveals.
- Files: `gift-storefront-hero.tsx`, `corporate-hero.tsx`, `globals.css`
- Next: hard-refresh `/gift` (+ corporate) hero load

### Session — 2026-07-30 (Dashboard command center deepen)

- **Override:** post Phase 13 — implement owner-dashboard gaps (human request)
- API `GET /admin/commerce/dashboard`: previous-period KPIs, 7d sparkline `daily`, SLA aging (24h), `alertPrefs`, `recentAudit`
- Policy: `dashboardAlertPrefs` in `commerce_settings` + Settings UI toggles
- UI: deltas, aging rows, sparkline, Auto 60s refresh + stale label, recent activity stub
- Check: `dashboard-command.check.ts`; docs OPS-0 audit stub + OPS-8 alert prefs marked done
- Deployed `web` + `api` via `deploy-vps.sh` @ `6fad003` (smoke ok)
- Pushed `main` @ `6024487` (`feat(commerce-ops): deepen dashboard and catalog desk polish`)
- Next: hard-refresh `/admin/commerce` + Settings alert prefs QA

### Session — 2026-07-29 (Commerce dashboard owner UX)

- **Override:** post Phase 13 polish — `/admin/commerce` owner POV redesign (human request)
- Attention-first inbox (urgency sort, deep-links, calm clear state); revenue hero + pulse KPIs; low-stock panel; icon quick actions; skeleton load
- Soft Gift tokens/recipes only; no API change
- Next: visual QA on `/admin/commerce` mobile + desktop

### Session — 2026-07-29 (Admin catalog keyset pagination)

- **Override:** OPS-9 P1 cursor pagination for products desk (human request)
- API: `{ items, nextCursor, limit }` keyset on `(updatedAt,id)`; slim list include; indexes migration
- UI: Prev/Next + cursor stack; default limit 25
- Docs: `COMMERCE_OPS_PANEL.md` §13; Architecture + audit notes
- Check: `admin-catalog-cursor.check.ts`; deployed web+api @ `6fad003`

### Session — 2026-07-29 (Catalog search debounce)

- Products search: compact pastel pill + Search/X icons; removed Clear + Search buttons; 300ms debounce URL sync
- Deployed `web` @ `6fad003` (smoke ok)

### Session — 2026-07-29 (Catalog desk deploy)

- Cross-check: mobile header (New product full-width; Import/Categories/Merch sm+), select-all on cards, chip/search stacking, typecheck ok
- Deployed `web` via `bash scripts/deploy-vps.sh web` @ `6fad003` (smoke ok)
- Next: hard-refresh `/admin/commerce/products` mobile + desktop QA

### Session — 2026-07-29 (Catalog desk UX polish)

- Products desk: thumbnails + SKU, status chips, clay-panel table, mobile cards, bulk bar only on selection
- Dropped guide description; quieter secondary actions; success/error banners separated
- Next: visual QA on `/admin/commerce/products`

### Session — 2026-07-29 (Remove Payments: mock badge)

- Removed amber “Payments: mock” strip from commerce ops shell header (only UI surface)

### Session — 2026-07-29 (Gift skeletons + PDP gap)

- Opinion → yes: Soft Gift loading uses layout shimmer (PDP/cart/wishlist/box + route loading.tsx); collections already had one
- PDP gap: parent `gap-gs-*` + section `mt-gs-8` + `.article-prose h2 { mt-8 }` stacked — removed section mt; first prose child `mt-0`
- Next: hard-refresh PDP + cart QA

### Session — 2026-07-29 (Table paste kept without toolbar)

- Product toolbar still hides Table button; TipTap table schema always loaded so paste/HTML round-trips
- Sanitize allowlist already includes table/thead/tbody/tr/th/td

### Session — 2026-07-29 (Product editor toolbar compact)

- TipTap: Heading / List / Align as dropdowns (H2–H4, ul/ol, L/C/R)
- Product page content: no Code, Image, Upload, Library, Table (gallery owns media)
- Editorial/CMS keep image + code defaults via props
- Next: hard-refresh product edit QA

### Session — 2026-07-29 (H2/H3 restore, drop style chip)

- Restored **H2** / **H3** toolbar labels; kept **Paragraph**
- Removed style chip / STYLE row (pink active button is enough)
- H1 still omitted (page title owns it)
- Next: hard-refresh editor QA
- Deployed `web` (smoke ok)

### Session — 2026-07-29 (UI copy rule + empty style)

- Rule: `.cursor/rules/42-ui-copy.mdc` — no guide/instruction UI unless essential; keep short
- TipTap: no Paragraph chip/active when editor empty (`isEmpty`)
- Stripped product edit/new helper blurbs; labels/placeholders only
- Next: deploy web

### Session — 2026-07-29 (Editor style toolbar UX)

- TipTap: Paragraph + Heading/Subheading labels; live “Style: …” chip
- Selection re-render fix so pink active state tracks cursor
- H1 still omitted on purpose (page title owns H1)
- Next: deploy web

### Session — 2026-07-29 (Product TipTap body)

- Product page content: section rows → single TipTap editor (toolbar + media library)
- Storage still `seoSections` JSON: one `{ heading: '', bodyText: html }` row
- PDP `ProductSeoSections` renders sanitized HTML via `ArticleBody`
- Zod + catalog parse allow empty heading; body max 50k
- Next: hard-refresh product edit + PDP QA
- Deployed `web` + `api` (smoke ok)

### Session — 2026-07-29 (Rename SEO labels)

- Admin copy: “Long-form SEO sections” → **Product page content**; share OG → plain-language optional
- API field still `seoSections` (no schema rename)
- Next: hard-refresh product edit; confirm copy feels clear
- Deployed `web` (smoke ok)

### Session — 2026-07-29 (Product edit UI overhaul)

- Full edit desk redesign (not label-only): hero thumb + status, in-page section nav
- Media: visual gallery editor (upload/library/alt/reorder) — JSON gone
- FAQs / SEO sections / hamper: structured row editors
- Discovery: chip toggles; sticky Save bar; wider max-w-4xl cards
- Files: `products/[id]/page.tsx`, `product-gallery-editor.tsx`
- Next: hard-refresh product edit QA; feedback on remaining polish
- Deployed `web` (smoke ok)

### Session — 2026-07-29 (Product draft + edit UX)

- Clarified: create → `/admin/commerce/products/[id]` = product edit desk
- New product: **Save as draft** (default submit) + **Create & publish**; no separate OG upload
- Edit: status pill Draft/Published; **View product**; **Move to draft**; OG URL under Advanced
- Status model remains DRAFT | PUBLISHED (draft = pending / not live)
- Deployed `web` (smoke ok)
- Next: hard-refresh new + edit product pages

### Session — 2026-07-29 (Media upload 401 refresh)

- Root cause: `uploadCmsMediaFile` used raw fetch — no silent refresh on expired access token (15m TTL)
- Added `apiAuthUpload` (multipart + 401→refresh→retry); wired CMS + platform media + product picker
- Deployed `web` (smoke ok)
- Next: hard-refresh products/new; if still fails → Sign out / log in again

### Session — 2026-07-29 (New product media + SEO)

- Override (post Phase 13): human asked to upgrade `/admin/commerce/products/new`
- `ProductMediaField`: upload + library modal + preview + alt text (reuses CMS media API)
- Create form sections: Basics / Pricing / Media / SEO (title, description, canonical, OG image, robots)
- `createProductBodySchema`: relative media/OG paths + SEO fields; create service persists SEO
- Check: schema smoke (`PASS` relative URL; rejects `../` path)
- Deployed `web` + `api` via `deploy-vps.sh` (smoke ok)
- Edit page gallery still JSON (P1); new-product picker shipped
- Next: human QA on products/new; optional wire picker into product edit gallery

### Session — 2026-07-29 (OG image = primary on create)

- Removed separate OG upload from `/products/new` — PDP already falls back to `media[0]`
- Note on form: social preview uses primary image; override stays on edit page

### Session — 2026-07-29 (Ops shell scroll + chrome fix)

- Document scroll lock (`ops-shell-lock`); only `.ops-main-scroll` + sidebar scroll
- Removed duplicate Shortcuts topbar buttons; shortcuts live in avatar menu
- Removed sidebar X; hamburger uses plain button + `md:!hidden` (clay-btn-ghost broke hide)
- `scrollbar-gutter: stable` on main to avoid layout shift
- Next: deploy web + hard-refresh QA
- Deployed `web` @ `6fad003` (smoke ok)

### Session — 2026-07-29 (Commerce Ops shell UX polish)

- Override (post Phase 13): ops desk chrome polish from human QA feedback
- Topbar: hamburger/Menu icon, Jump-to chip + ⌘K, Shortcuts label, avatar dropdown (storefront + Sign out)
- Sidebar: sticky full-height; nav scrolls; hover-only scrollbar; bottom user card (name, role, Sign out)
- Dashboard: title/copy, linked KPIs, muted zero alerts, low-stock wording
- Breadcrumb root on home = Dashboard; nested keeps soft Commerce Ops root
- Check: `commerce-ops-nav.check.ts`
- Deployed `web` via `bash scripts/deploy-vps.sh web` @ `6fad003` (smoke ok)
- Next: human visual QA of ops shell (hard-refresh)

### Session — 2026-07-29 (deploy + push for Commerce/CMS QA)

- Commit + push Phase 13 OPS desk + audit; deploy web+api for human QA
- Next actions: pause further build until Commerce + CMS panel feedback

### Session — 2026-07-29 (Phase 13 audit cross-check)

- Honest Phase 13 section added to IMPLEMENTATION_AUDIT; P0 pass / P1 listed
- No code change beyond docs

### Session — 2026-07-29 (OPS-9 Power-user)

- Shortcuts + saved views + order bulk + inventory CSV import
- Phase 13 OPS-0…9 closed in Memory/Phases/COMMERCE_OPS_PANEL v2.0.0

### Session — 2026-07-29 (OPS-8 Settings & trust)

- `/admin/commerce/policy` + `/audit`; settings UI tabs; low-stock from policy
- Next: OPS-9

### Session — 2026-07-29 (OPS-7 Reports)

- Sales report aligned to dashboard window; CSV export; gallery cards
- Next: OPS-8

### Session — 2026-07-29 (OPS-5 xcheck + OPS-6 Promotions)

- Verified OPS-5 AuthZ/checkout/suspend/LTV/support phone path
- OPS-6 coupon schedule + preview API + promotions UI
- Next: OPS-7

### Session — 2026-07-29 (OPS-5 CRM & support)

- Customer list filters + LTV; 360 page; support phone search; checkout suspend gate
- Next: OPS-6

### Session — 2026-07-29 (OPS-2 Catalog desk)

- Catalog desk: power table + filters API; categories page; merchandising polish; edit sections
- Next: OPS-5

### Session — 2026-07-29 (OPS-3 Inventory + OPS-4 xcheck)

- Cross-checked OPS-4 APIs (orders filters/exceptions ok); AuthZ refresh on case file
- OPS-3: migration movements, admin inventory APIs, desk UI
- Checks + typecheck ok; deploy web+api
- Next: OPS-2

### Session — 2026-07-29 (OPS-4 Order desk)

- Order desk queue + case-file UI; board view P1; packing print
- API list filters + exceptions; status update with carrier/AWB
- Migration applied; address-risk check; typecheck + redeploy web/api
- Next: OPS-3 Inventory

### Session — 2026-07-29 (OPS-1 + responsive OPS-0)

- Cross-checked OPS-0 mobile: shell/header/tables/palette fixed for small viewports
- OPS-1 command center: range KPIs, alert inbox deep-links, quick actions, refresh
- API dashboard range + openReturns / pendingShip / awaitingProcess
- Typecheck ok; deploy web+api
- Next: OPS-4

### Session — 2026-07-29 (OPS-0 Shell & IA)

- Shipped commerce ops shell under `gift` + `compact`
- Files: `commerce-ops-shell.tsx`, `commerce-ops-nav.ts`, layout wire, inventory/settings stubs
- AuthZ: Support/Finance read paths on orders/customers/reports/reviews/returns
- Nav unit check ok; web+api typecheck ok
- Deployed `inabiya-web` + `inabiya-api` (compose prod)
- Next: OPS-1

### Session — 2026-07-29 (Commerce OPS journey doc)

- Docs only: `COMMERCE_OPS_PANEL.md` v1.0.0 (OPS-0…9 UI/UX + func contracts)
- `Phases.md` §26 Phase 13 pointer; Memory Active Phase → Phase 13 (awaiting OPS-0)
- No app code this session
- Next: implement OPS-0 Shell & IA one-by-one

### Session — 2026-07-29 (hero mobile text-first)
- Soft Gift + corporate hero: mobile order text then image (removed order-2/order-1 swap).
- Next: deploy web; then ecommerce OPS panel

### Session — 2026-07-29 (PDP wishlist heart visible)
- Cause: `clay-btn-ghost` padding (1.4rem×2) inside `w-12` left ~3px — heart crushed to a speck.
- Fix: icon button without clay-btn padding (`size-12 p-0` + lucide Heart).
- Next: deploy web

### Session — 2026-07-29 (PDP wishlist heart fix)
- Broken custom HeartIcon SVG path → invisible speck; replaced with lucide `Heart` (same as gift nav).
- Next: deploy web; hard-refresh PDP wishlist button

### Session — 2026-07-29 (seamless modal scroll-lock)
- Root cause of weird shift: paddingRight on html+body **on top of** `scrollbar-gutter: stable` → horizontal overflow.
- Fix: `lockPageScroll` only toggles `html.scroll-locked` / overflow; no padding; modal root `overflow-hidden`.
- Next: deploy web; hard-refresh ready-hampers modal open/close

### Session — 2026-07-29 (modal scroll-lock + thumbs +N)
- Modal open shake: `scrollbar-gutter: stable` + scrollbar-width padding on body/html + sticky nav `data-scroll-lock-compensate`.
- What’s inside modal restyled (header band, item rows, Save pill, Gift this CTA).
- Card thumbs: ≤4 all; >4 → 3 stacked + `+N`; welcome hamper seeded to 5 items for +N demo.
- Next: deploy web (+ seed if DB needs 5th item)

### Session — 2026-07-29 (hamper card portal modal + CTA)
- Fix: What’s inside was trapped in `.clay-card` (`overflow` + hover `transform`) → looked like in-card glitch scroll.
- Modal now `createPortal(…, document.body)`; card CTA `Gift this · ₹…` / `View details`.
- Next: deploy web; hard-refresh ready-hampers

### Session — 2026-07-29 (brand line + hamper card modal)
- **Override:** Soft Gift PDP brands + ready-hampers card UX outside Phase 12.
- Brands: `ProductHamperItem.brandName` + API `brandNames`; PDP/home/BYB use `ProductBrandLine` (`Brand:` / `Brands:`) not chips.
- Cards: left “N items” / right merch labels (drop GIFT_SET on hampers); thumbs + modal What’s inside (no in-card expand stretch).
- Migration `20260729120000_hamper_item_brand`; seed multi-brand BOM; check `brands.check.ts`.
- Next: deploy web+api; hard-refresh ready-hampers + welcome-baby PDP

### Session — 2026-07-29 (hamper stream smoke closed)
- Deploy already live; smoke: CMS home `hamperItemCount` (4/3/4); home HTML “N items” + curated line; ready-hampers PLP 4 badges; welcome VIDEO+MP4 200; all 4 hampers savings > 0.
- Collections + hamper PDP plan v1 complete (display BOM). Linked SKU BOM still out of scope.
- Next: browser visual QA; real unboxing video when ready

### Session — 2026-07-29 (home hamper badge + demo video)
- HomeProductCard + non-home product grid: “N items” badge; CMS `mapProductCard` passes `hamperItemCount`.
- Seed: `/gift/media/welcome-hamper-unbox.mp4` VIDEO on `welcome-baby-hamper` (+ poster).
- Next: deploy web+api; hard-refresh `/gift` hampers + PDP gallery video

### Session — 2026-07-29 (hamper PDP contents)
- **Override:** Hamper vs normal PDP outside Phase 12. Plan: `docs/plans/hamper-pdp.md`.
- Migration `20260729110000_hamper_pdp_contents`: hamper items, media kind/poster, seoSections.
- API map: hamperItemCount / contentsValuePaise / hamperSavingsPaise; admin JSON editors.
- PDP: What’s Inside, SAVE badge, video gallery + band, SEO sections, hamper action bar; PLP item-count badge.
- Seed: welcome-baby / mom / nursing hampers with contents; check `hamper-savings.check.ts`.
- Next: deploy web+api; QA welcome-baby-hamper PDP

### Session — 2026-07-29 (collection PLP UX polish)
- **Override:** Collection UX audit fixes outside Phase 12.
- Active chips + results toolbar (count + sort select); mobile sheet draft→Apply + focus trap.
- Slim full-bleed hero, breadcrumbs, BYB CTA (URL prefs on BYB), related “Also shop” below grid.
- Checkbox facets + accordion; Age band label; newborn removed from category facet; budget Under ₹1.5k/3k.
- API: `maxPricePaise` on catalog list (Zod + service filter); empty state with sibling CTAs; `loading.tsx` skeleton.
- Next: run `bash scripts/deploy-vps.sh web api` then hard-refresh collection QA

### Session — 2026-07-29 (deploy web — collection pages)
- Deployed `web` via `bash scripts/deploy-vps.sh web` so `/gift/collections/*` live (was Soft Gift 404).
- Smoke: health/ready OK; local `/gift/collections/for-baby-girl` expected 200 after recreate.
- Next: hard-refresh live girl/boy collection + Filters QA

### Session — 2026-07-29 (gift collection pages)
- **Override:** Soft Gift collection pages + filters (merch UX) outside Phase 12.
- Registry: `apps/web/lib/gift-collections.ts` (16 slugs).
- Route: `/gift/collections/[slug]` with hero + related chips + product grid.
- Filters: desktop sidebar + mobile sheet (`collection-filters.tsx`); base filter locked.
- Rewired seed homepage, `gift.chrome`, nav/footer defaults, PDP tags, hampers redirect, sitemap.
- Check: merge/base-wins assert via tsx; web typecheck green; `pnpm db:seed` refreshed CMS hrefs.
- Next: browser QA boy/girl/mom + mobile Filters

### Session — 2026-07-29 (hero mobile center + shorter photo)
- **Override:** Soft Gift hero mobile polish (client: mobile looks off).
- Mobile: copy centered (`items-center text-center`); desktop stays left.
- Shorter mobile photo (`1/1`, max ~44vh) so CTAs share first viewport; tighter gaps; bottom pad for WhatsApp FAB.
- Headline 28px on narrow phones; `lg:` restores left align + 60px.
- Files: `gift-storefront-hero.tsx`, `globals.css`; deploy `web`.
- Next: hard-refresh `/gift` on phone

### Session — 2026-07-29 (deploy web — hero spacing)
- Deployed `web` only via `bash scripts/deploy-vps.sh web` (@ cb961d6).
- Smoke: health/ready OK; `127.0.0.1:3001` → 200.
- Next: hard-refresh live `/gift` desktop + mobile QA

### Session — 2026-07-29 (hero left copy ↔ image center)
- **Override:** Soft Gift hero spacing (client reference) outside Phase 12.
- Dropped forced `min-height: 92vh` (empty pastel bands); hero height follows image.
- Desktop: copy column `justify-center` + `lg:items-stretch` so tight text block sits on image vertical center (not inflated gaps).
- Tightened eyebrow→headline→sub→CTA→trust margins; trust `padding-top` reduced.
- Mobile: smaller image/copy gap (`gap-gs-4`), shorter photo max-height, tighter stack padding.
- Files: `gift-storefront-hero.tsx`, `globals.css`
- Next: hard-refresh `/gift` desktop + mobile visual QA

### Session — 2026-07-28 (Soft Gift shadows + hero polish)
- **Override:** Soft Gift visual polish (client: too many clay shadows) outside Phase 12.
- Reduced gift `--clay-shadow*` / brand / chip / nav elevation to minimal single-layer; hardcoded homepage card shadows → tokens.
- Hero: removed `/gift/gifting-bg.svg`; pastel wash gradient only; grid padding aligned to `.gift-band` via `--gift-pad-*` (was `py-gs-6` vs band `space-5` on mobile).
- Hover lift minimal: cards/buttons `-3px/-2px` → `-1px`; CTA nudge `2px` → `1px`.
- Files: `globals.css`, `gift-storefront-hero.tsx`, `corporate-hero.tsx`, `marketing-page-blocks.tsx`, `gift-floating-actions.tsx`, `Design.md` shadow notes.
- Next: hard-refresh `/gift` + `/gift/corporate` visual QA

### Session — 2026-07-28 (gift footer COMPANY ↔ REACH US align)
- Shipped: Desktop Soft Gift footer uses shared CSS subgrid tracks so row-1 COMPANY and row-2 REACH US share the same right-edge column; Shop/Help/Company pack right of a flexible spacer after brand.
- Files: `apps/web/app/globals.css`
- Risks: none (CSS-only; mobile/tablet flex+2-col grid unchanged)
- Next: Browser QA at ≥1024px width

### Session — 2026-07-28 (Soft Gift ecommerce + CMS leftovers)
- Waves 0–5 shipped (dev-only; third-party still post-dev).
- Migrations: `product_seo_faq`, `commerce_invoice`.
- Mock pay UX; CMS countdown; OpenAPI stub path.
- Next: restart API containers; browser QA for blocked EC/CM rows.

### Session — 2026-07-28 (triple theme tokens)
- **Override:** Design v2.1 triple systems (gift / blog / creator); logged in decisions.
- Shared foundations in `globals.css` `:root`; Blog Creative + Creator recipe parity; clay bridge for editorial CMS.
- Layouts: blog theme on journal; density compact on admin families; dropped orphan `admin` theme.
- Moved `(gift)/articles|specialists` → `(blog)/`; smoke shells on articles + creator home.
- Tailwind semantic maps extended (`primary-hover`, type, z, duration).
- Next: visual QA `/articles` `/creator` `/admin/editorial`.

### Session — 2026-07-28 (footer WhatsApp icon)
- Replaced Lucide `MessageCircle` with official WhatsApp glyph in footer social + Reach us.
- Shared `components/gift/whatsapp-icon.tsx` (floating CTA reuses it).
- Next: hard-refresh `/gift` footer.

### Session — 2026-07-28 (cross-check storefront page fixes)
- Verified routes 200; register copy OK (client chunk); PLP/auth/articles/footer markers OK.
- Fixed: login seed passwords tree-shaken from prod bundle; corporate hero CTA → `#inquiry` + Browse shop (re-seeded); PDP label cap + hamper chip vs Gift set; View cart match tightened; specialist detail clay cards; articles newsletter flush margin.
- Confirmed: `Password123!` / seed emails absent from `.next/static`.
- Next: spot-check PDP add-to-cart + corporate quote scroll on mobile.

### Session — 2026-07-28 (storefront pages audit + Wave A/B fixes)
- **Override:** Soft Gift polish outside Phase 12.
- Audit canvas: `gift-storefront-pages-audit.canvas.tsx` (14 findings; plan waves).
- Auth: login seed panel `NODE_ENV===development` only; empty defaults; customer copy on forgot/register.
- PLP: active filter chips, sort chips, overline + count, empty clay-panel.
- BYB: clay tokens, Remaining-first summary, gift-h2 steps.
- PDP: split busyCart/Wish/Box; FAQ dedupe (details → #faq); View cart link.
- Checkout: city/state grid + PIN narrow; tax line when >0.
- About/contact padding; specialists clay-cards; corporate bare main + CorporateHero; articles gift-band + compact newsletter; footer newsletter wrap; PLP labels max=2.
- Next: visual QA PLP/BYB/corporate/login mobile.

### Session — 2026-07-28 (footer polish + short newsletter)
- **Override:** Soft Gift storefront polish outside Phase 12.
- Footer: brand mark lockup, icon socials, Reach us (email/WA/@inabiya), copyright bar; soft pink/lavender glow on dark band.
- Newsletter compact: fixed ~12.5rem email + Subscribe (not full-width); dark-surface input.
- Next: hard-refresh `/gift` footer.

### Session — 2026-07-28 (home product card CTA + chips)
- **Override:** Soft Gift storefront polish outside Phase 12.
- Home cards: primary `View gift` (`clay-btn`) + secondary `Add to cart` (`clay-btn-secondary`); price uses foreground (not primary pink).
- Hamper grid: hide redundant “Ready-made hamper” chip (brand chip stays; PLP unchanged).
- Overlay labels `max={1}` on home for even NEW / Gift set hierarchy.
- Next: hard-refresh `/gift` hampers + product shelves.

### Session — 2026-07-28 (hero overline pill width)
- `.gift-overline` was stretching full column width inside hero `flex-col` (default stretch).
- Fixed with `width: fit-content; max-width: 100%` so pill hugs label text.
- Next: hard-refresh `/gift` hero eyebrow.

### Session — 2026-07-28 (CMS-first homepage merchandising)
- **Override:** Soft Gift homepage merchandising CMS outside Phase 12 (Phase 12 remains shipped).
- `productGrid.source`: auto | manual | bestsellers | editors | new | on_sale; catalog filters `storefrontLabel` / `onSale` / `publishedSince` + occasion/age/recipient.
- Admin: ProductGridBlockEditor + DiscoveryChipsBlockEditor (media + occasion/age presets).
- Seed: 15 demo products (verified Unsplash), home blocks = saleStrip → best sellers → categories → new → occasion → age → on sale → editors → trending → BYB → hampers → corporate CTA → testimonials/journal/faq.
- Check: `apps/api/src/modules/commerce/cms/resolve-product-grid-query.check.ts`.
- Next: hard-refresh `/gift`; QA CMS save on productGrid; restart API if needed for Zod rebuild.

### Session — 2026-07-28 (categories + testimonials polish)
- Categories: overline/subtitle, hover lift, “Shop →”, blush media frame; toys→train-toy photo; Mom Care image swapped off blanket.
- Testimonials: pastel card tones, quote mark, avatar initials, italic display quote, real subtitle.
- Next: hard-refresh `/gift` category + parent-love bands.

### Session — 2026-07-28 (BYB banner readability polish)
- Deeper pink→sky gradient + vignette for white-text contrast; stronger overline/CTA.
- Steps: glass cards with number + icon, clearer type; trust labels as chips.
- Next: hard-refresh `/gift` Build Your Box band.

### Session — 2026-07-28 (USP section polish; kill filler asides)
- Removed floating mottos (“Personalised · Ready · Trusted”, offers/testimonials fillers).
- USP: real subtitle under title; soft pastel card washes (pink/mint/sky/lavender); icon-on-top layout.
- Shop-by-baby subtitle stays under title (not right-rail). Header spacing tightened.
- Next: hard-refresh `/gift` USP block.

### Session — 2026-07-28 (hero: drop brand wordmark, restore Unsplash)
- Hero left-side Inabiya wordmark removed (nav brand stays).
- Hero image restored to prior Unsplash (`photo-1635874714425…`); seed + default updated.
- Next: hard-refresh `/gift`.

### Session — 2026-07-28 (homepage UX audit resolve + padding)
- **Override:** Soft Gift storefront polish outside Phase 12.
- Unified chrome gutter: `--gift-pad-x/y` · nav/band/footer/hero aligned (`px-gs-4` / `sm:px-gs-6`, tighter section Y).
- P0: hero Inabiya brand · Soft Gift brand-pill accents (no hex) · unique category/recipient media · removed vanity 4.9 rating · local hero/hamper images.
- P1/P2: section headers · clay-btn offer CTAs · radius token · toys ≤ recipient · +more link · testids · no emoji · shipping→#faq · journal alt · Design.md radius 1.75.
- Re-seed `home` required for CMS props.
- Next: visual QA `/gift` mobile+desktop.

### Session — 2026-07-28 (exclusive offers card colors)
- **Override:** Soft Gift storefront polish outside Phase 12.
- Bug: Tailwind tree-shook `.gift-offer-card--{blush,sky,lavender}` background rules (dynamic class) → white cards.
- Fix: tone fills under `.gift-offers-grid …`; static tone class map; safelist; Capture 007 soft pastel washes + tinted tags.
- Next: hard-refresh `/gift` Exclusive Offers; confirm pink/teal/lavender cards.

### Session — 2026-07-27 (Inabiya homepage client parity)
- **Override:** Soft Gift storefront polish outside Phase 12 (Phase 12 remains shipped).
- Brand copy: public-facing name is **Inabiya** (not “Inabiya Soft Gift”); Soft Gift = theme/system only.
- `/gift` hero size bump (larger H1 + image frame); navbar untouched; footer dark tone on gift layout chrome.
- New CMS blocks: `exclusiveOffers`, `testimonials`; `discoveryChips` image cards; BYB steps max 6.
- Seed home order: hero → brands → shop-by-baby → USP cards → offers → categories → BYB → hampers → testimonials → journal (unchanged) → faq.
- Assets: `/gift/media/{girl.jpeg,baby-clothes.jpg,baby-cues.jpg,train-toy.jpg}`.
- Re-seed or admin republish `home` required for live DB.
- Next: visual QA on `/gift`; optional Mom Care dedicated image.

### Session — 2026-07-26 (/blog stub → real journal)
- **Override:** Soft Gift polish outside Phase 12.
- `/blog` redirects to `/articles` (editorial PUBLISHED list). Homepage journal teaser = same articles (e.g. Sleep cues).
- `/articles` index shows cover + Journal branding; public list API includes `imageUrl` from `ogImageUrl`.
- Next: deploy web+api.

### Session — 2026-07-26 (Journal cover SVG + CMS editable)
- **Override:** Soft Gift polish outside Phase 12.
- Article `ogImageUrl` → homepage `articleTeasers` image; seeded `/gift/media/sleep-cues-for-newborn.svg`.
- Editorial CMS: Cover image field (CmsMediaField) + PATCH for published; publish/schedule accept relative/media URLs.
- Next: DB update + deploy web/api.

### Session — 2026-07-26 (Build Your Box right panel SVG + CMS media)
- **Override:** Soft Gift polish outside Phase 12.
- `/gift/media/gift-box.svg` on BYB teaser; CMS `imageUrl` / `imageAlt` / `imageFit`; relative public paths in `cmsMediaUrlSchema`.
- Media upload allows jpeg/png/webp/gif/avif/svg (+ PDF); SVG content served with CSP sandbox.
- Next: patch live `buildYourBoxTeaser` props + deploy web/api.

### Session — 2026-07-26 (Shop by baby — local girl/boy photos)
- **Override:** Soft Gift polish outside Phase 12.
- Local `/gift/media/girl.jpg` + `boy.jpg` (from repo `public/`); seed + admin defaults; home cards show only label + short CTA (no 01/eyebrow/blurb).
- Next: push + deploy web; patch live `page_blocks` recipientSplit props.

### Session — 2026-07-26 (Shop by baby — right-half fade photo)
- **Override:** Soft Gift polish outside Phase 12.
- `recipientSplit` home cards: photo on right ~52–58% width; CSS mask + soft wash so left edge fades into copy panel (pink/sky).
- Next: push/deploy if human wants live; girl Unsplash URL may 403 on VPS — consider local media.

### Session — 2026-07-22 (Ready-made hampers card size + WhatsApp FAB)
- **Override:** Soft Gift polish outside Phase 12.
- Home `productGrid`: featured row only when ≥3 products (2-item hamper grids stay equal `sm:grid-cols-2`); rest cols by count.
- WhatsApp FAB: real WhatsApp glyph SVG (was Lucide `MessageCircle`).
- Next: push/CI deploy; smoke `/gift` hampers + FAB.

### Session — 2026-07-22 (PDP FAQ + accordion ease)

- **Override:** Gift Commerce polish outside Phase 12
- Smooth FAQ accordion (`faq-accordion.tsx`); wired CMS homepage + PDP
- PDP FAQ after related products; product-aware copy + JSON-LD
- Shipping/Returns drawers reuse same ease
- Next: optional admin-editable per-product FAQs later

---

### Session — 2026-07-22 (CMS FAQ/SEO cross-check + fixes)

- Cross-check: FAQ/SEO live OK; found duplicate `/pages/corporate-gifting`, test pages in sitemap, FAQ placeholder on bad JSON
- Fixes: corporate redirect; FAQ save rejects invalid/empty; Zod empty→null SEO; unpublish QA pages; FAQ JSON-LD entity decode
- Deploy: `api` + `web`
- Next: optional articles sitemap take>50 if catalog grows; Product/PDP SEO still deferred

---

### Session — 2026-07-22 (CMS FAQ + marketing SEO)

- Zod `faq` block; Soft Gift accordion + FAQPage JSON-LD; admin palette
- Prisma SEO fields migration; cms-seo helper; gift/corporate/pages metadata
- Public `GET /cms/pages` for sitemap; robots.txt
- Seed: home FAQ block + canonical `/gift`
- Files: validation, cms service/controller, marketing-page-blocks, admin CMS editor, sitemap/robots

---

### Session — 2026-07-22 (PDP UX trust / CTA / reviews)

- **Override:** Gift Commerce polish outside Phase 12
- Buy box: star summary, personalisation checkbox reveal, primary+heart CTA, secondary gift box
- TrustStrip icons; About value highlights; related Quick Add; recent reviews API
- Skipped fake embroidery surcharge and false fabric claims
- Files: PDP page, trust-strip, pdp-gallery dots, clay-product-card, star-rating-summary, reviews API

---

### Session — 2026-07-22 (Homepage roadmap edge-case harden + deploy)

- Skip CMS `footer` blocks under gift layout (no double footer on /pages)
- Home quick-add: button outside product Link (a11y)
- Gift chrome admin: Help column + social + newsletter (no wipe on save)
- Floating top respects prefers-reduced-motion
- Cross-check typecheck/tests green

---

### Session — 2026-07-22 (Homepage chrome roadmap Pass 1–12)

- **Override:** Soft Gift polish outside Phase 12 — full roadmap shipped in one session per user request
- Global chrome footer + floats; seed home without CMS footer; saleStrip/discovery/BYB blocks
- Quick-add + empty journal; newsletter/social footer; about/contact/404
- A11y marquee pause; GSAP scroll reveal; next/image LCP
- Files: layout, gift-chrome-footer, marketing-page-blocks, validation, seed, Memory, …

---

### Session — 2026-07-22 (Homepage section polish post–brand strip)

- **Override:** Soft Gift homepage polish outside Phase 12
- `GiftSectionHeader`; home product featured + card polish; recipient blurbs/images
- CMS `mapProductCard` richer; seed overlines/subtitles; admin overline/subtitle/blurb fields
- Files: marketing-page-blocks, cms-pages.service, admin CMS editor, seed, Memory

---

### Session — 2026-07-22 (Hybrid product labels Phase A)

- **Override:** Gift Commerce merchandising outside Phase 12
- Migration `compare_at_price_paise`; Zod manuals + `updateVariantBodySchema`
- `resolveStorefrontDisplayLabels` + check; `mapProduct.displayLabels`
- Admin: manuals + MRP; PLP/PDP ProductLabels; PDP strike-through
- Seed: blanket 50% off + BESTSELLER; rattle low stock; hamper GIFT_SET; swaddle EDITORS_PICK
- Files: schema/migration, validation, catalog.service/controller, storefront-display-labels*, product-labels, admin product edit, catalog.ts, seed, Memory

---

### Session — 2026-07-22 (Product storefront labels NEW/SALE)

- **Override:** Gift Commerce polish outside Phase 12
- Prisma `storefront_labels` + Zod; CatalogService map/create/update
- Admin edit checkboxes; `ProductLabels` on ClayProductCard + PDP
- Seed demo: swaddle NEW, blanket SALE, hamper NEW+SALE
- Files: schema migration, validation, catalog.service, admin product edit, product-labels.tsx
- **Superseded** by Hybrid Phase A

---

### Session — 2026-07-22 (Soft Gift PDP modern hierarchy)

- **Override:** Gift Commerce PDP polish outside Phase 12
- Reading order: breadcrumb → gallery + sticky buy box → TrustStrip → About/tags/shipping → related → reviews
- Qty stepper; CTA: Add to cart → Add to gift box (if eligible) → Wishlist; reviews form collapsed by default
- Edge/responsive pass: related fallbacks (category→recipient→all); buy-box line-clamp; slug reset; required personalization; SELECT fields; breadcrumb truncate; gallery square + thumb scroll
- Files: `gift/products/[slug]/page.tsx`, `pdp-gallery.tsx`, `trust-strip.tsx`; Memory decisions log
- Typecheck OK; deployed web

---

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

- Removed text (`Offline` / twitch copy) from `docs/gifting.svg`; served as `/gift/gifting-bg.svg`.
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

- Wrote `docs/CMS_PAGE_BUILDER.md` (1B contract, block catalog, API sketch, 11A–D).
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
- Security headers middleware + Next `headers()`; `docs/SECURITY.md`
- Launch checklist signed for VPS-local; Q7 resolved; Phase 9 → **CLOSED**
- Phases 0–9 delivery sequence complete for local stack; public GA items deferred

### Session — 2026-07-20 (Phase 8 close + Phase 9 start)

- Brand analytics: `GET /creator/analytics/summary` + brand dashboard panel
- Creator discovery: `GET /creator/creators?niche=`
- Phase 8 → **CLOSED**; Phase 9 → **IN PROGRESS**
- Rate limits: auth login/register/refresh (20/15m/IP); checkout place-order (60/min/IP)
- Docs: `docs/RUNBOOKS.md` (launch checklist, SLOs, backup/restore, webhooks, queue, rollback, PII)
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

- Cross-check: created `docs/IMPLEMENTATION_AUDIT.md` (Phases 0–3 vs repo)
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
  - `docs/Memory.md`, Dockerfiles, compose prod, GHA workflows, README
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
