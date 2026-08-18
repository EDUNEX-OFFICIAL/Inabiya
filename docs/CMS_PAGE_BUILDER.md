# CMS — Marketing Page Builder (Drag & Drop)

Version: 1.1.1  
Status: **11A–11D + Phase 12 TipTap/saleStrip/media shipped** (real S3 SDK still deferred)  
Last Updated: 2026-08-17 (per-section layout knobs: recipient grid, USP/offer/quote columns)

Client asked for **drag-and-drop page creation** in CMS. Product decision (**1B**): full **marketing pages** at `/pages/[slug]`, composed of ordered blocks — not TipTap-only articles, and not “homepage section reorder only” as the end state.

**This doc is the engineering contract.** Implementation = **Phase 11** + **Phase 12** (`docs/Phases.md`). Do not invent progress in Memory until code ships.

Related: Homepage KV CMS (existing) · TipTap articles (Editorial) · Soft Gift Design.md · `SOFT_GIFT_HOMEPAGE_REFERENCE.md`

---

## 1. Goal

Commerce / Content admins compose marketing pages by adding and **drag-dropping** blocks, then publish. Shoppers see Soft Gift–themed pages at `/pages/[slug]`.

### Non-goals

- Pixel WordPress / Webflow clone
- Creator Collective theme pages (`creator` theme)
- Replacing TipTap for long-form parenting journal (`/articles`)
- Full multi-site / B2B site builder
- Migrating `/gift` homepage onto blocks in **11A–C** (optional **11D** only)

---

## 2. Roles & AuthZ

| Action | Roles |
|---|---|
| Create / edit / reorder / publish pages | `COMMERCE_ADMIN`, `CONTENT_ADMIN`, `SUPER_ADMIN` |
| Public read published page | Anyone |

Authorize in the **service** (not UI-only). Audit **publish** (and preferably create/delete).

---

## 3. Data model (target)

```text
MarketingPage
  id, slug (unique), title
  status: DRAFT | PUBLISHED
  seoTitle?, seoDescription?, canonicalPath?, ogImageUrl?, robotsIndex
  seoSchemaExtras?   # Auto (system WebPage+FAQ) or Manual replace JSON-LD
  publishedAt?
  createdAt, updatedAt
  blocks: PageBlock[]

PageBlock
  id, pageId
  type: hero | richText | image | productGrid | cta | spacer | brandStrip | recipientSplit | discoveryChips | buildYourBoxTeaser | articleTeasers | footer | saleStrip | faq | exclusiveOffers | testimonials | countdown | featuredCarousel | whatsappCta | offerCarousel | thinStrip | customSection
  sortOrder: Int
  props: Json   # Zod-validated per type
```

Money never lives in block props as floats; product prices always come from catalog APIs (`*Paise`).

---

## 4. Block catalog (v1)

| Type | Props (sketch) | Notes |
|---|---|---|
| `customSection` | `layout?`, copy, media, `bg`, `width`, `minHeight`, `radius` + Style | Blank canvas. Layouts: `stack` (Blank) \| `split` \| `splitReverse` \| `two` \| `three` \| `bleed`. Gift tokens only. |
| `richText` | `html` | Sanitise with same DOMPurify path as articles |
| `image` | `url`, `alt`, `caption?` | MIME/size rules when media library exists |
| `productGrid` | `source?`, `title?`, `productSlugs?`, `category?`, `occasion?`, `age?`, `recipient?`, `hamper?`, `newWithinDays?`, `limit?`, `seeAll*` | Live catalog resolve. `source`: `auto` \| `manual` \| `bestsellers` \| `editors` \| `new` \| `on_sale` |
| `cta` | `label`, `href`, `variant?` | Link to box / PLP / external |
| `spacer` | `size: sm\|md\|lg` | Layout only |
| `saleStrip` | `text`, `ctaLabel?`, `ctaHref?`, `tone?` | Soft Gift promo band (Phase 12) |
| `thinStrip` | `text`, `items[]?`, `ctaLabel?`, `ctaHref?`, `tone?`, `marquee?` | Compact sale/announcement bar; optional ticker |
| `offerCarousel` | `overline?`, `title?`, `subtitle?`, `cards[{ tag, title, … }]` (max 8) | Horizontal offer cards |
| `featuredCarousel` | `eyebrow?`, `headline?`, `accentWord?`, `subcopy?`, `cards[{ category, kicker, title, imageUrl, href, … }]` | Explore fan carousel (was hardcoded on `/gift`) |
| `whatsappCta` | `eyebrow?`, `title`, `body?`, `countryCode?`, `placeholder?`, `ctaLabel?`, `disclaimer?` | Early-access band — palette only until placed on a page |
| `countdown` | `endsAt`, `title?`, `expiredLabel?`, `ctaLabel?`, `ctaHref?` | Soft Gift offer timer (dev leftovers Wave 4) |
| `faq` | `title?`, `items[{ question, answerHtml }]` | Accordion + FAQPage JSON-LD |
| `exclusiveOffers` | `overline?`, `title?`, `subtitle?`, `columns?` (2\|3), `cards[{ tag, title, … }]` (max 6) | Offer cards; phone 1 col |
| `testimonials` | `overline?`, `title?`, `subtitle?`, `cta*?`, `display?` (auto\|marquee\|grid), `quoteColumns?` (2\|3), `items[{ quote, author, … }]` (max 12) | Auto: marquee at 4+ quotes |
| `recipientSplit` | `title?`, `subtitle?`, `grid?` (2x1\|2x2\|2x3\|3x2), `items[{ label, href, … }]` (2–6) | Shop-by-baby tiles. Phone 1 col; tablet 2; `3x2` is 3 col from `lg`. Legacy `left`/`right` still load |
| `brandStrip` | `title?`, `brands[]?`, `usps[]?`, `showUsps?`, `uspColumns?` (2\|3\|4) | Logo strip + USP cards; phone 1 / tablet 2 / desktop `uspColumns` |
| `discoveryChips` | `title?`, `items[{ label, href, imageUrl?, imageAlt? }]`, `seeAll*` | Category / occasion / age image tiles; admin card editor + presets |
| `cta` | `label`, `href`, `variant?`, `title?`, `body?` | Corporate / promo band on Soft Gift home |

Unknown `type` → fail validation on save; public renderer skips unknown types safely (log).

---

## 5. Admin UX

1. **List** — `/admin/cms/pages` in Commerce Ops shell (search, status chips, duplicate/delete)
2. **Editor** — `/admin/cms/pages/[id]` dedicated fullscreen builder (ops sidebar hidden)
   - Left: Gutenberg-style inserter — **Custom** (Blank, columns, full bleed) then **Hero** presets plus other blocks, **icons**, drag onto canvas or click
   - Center: block list + **live preview of the selected section** (unsaved; not full-page)
   - Right: **Block** inspector (content + **Style**: align, vertical, headline size, ink color, space, full-hero overlay) or **Page SEO** tab
   - Hero `layout` prop drives Soft Gift public render (legacy pages without `layout` keep storefront/panel)
   - **`productGrid`:** source dropdown, filters, published-product multi-select (manual)
   - **`discoveryChips`:** structured tile editor + `CmsMediaField` + occasion/age presets
   - **`recipientSplit`:** tile layout 2×1 / 2×2 / 2×3 / 3×2 + card rows (max 6)
   - **`brandStrip` / `exclusiveOffers` / `testimonials`:** column / quote-display knobs for their own elements (not a shared grid builder)
3. Actions: Save (⌘/Ctrl+S) · Publish · Unpublish · Preview
4. Nav & footer chrome: `/admin/cms/gift-chrome`

Not a pixel WordPress/Elementor clone. Gutenberg-like focused editor + block inserter.

---

## 6. Public UX

- Route: App Router `/pages/[slug]` under Soft Gift `data-theme="gift"`
- Unpublished / missing → **404**
- SEO: `generateMetadata` from `seoTitle` / `seoDescription` / `canonicalPath` / `ogImageUrl` / `robotsIndex`; auto WebPage + FAQPage JSON-LD; admin Schema is Auto vs Manual `replace` (same as product edit); `/sitemap.xml` + `/robots.txt`
- Renderer: map `type` → small presentational components (no admin DnD on storefront)

---

## 7. API sketch

| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v1/cms/pages/:slug` | Public (PUBLISHED only) |
| `GET` | `/api/v1/admin/cms/pages` | Admin roles |
| `POST` | `/api/v1/admin/cms/pages` | Admin roles |
| `GET` | `/api/v1/admin/cms/pages/:id` | Admin roles |
| `PATCH` | `/api/v1/admin/cms/pages/:id` | Admin roles (meta + replace/reorder blocks) |
| `POST` | `/api/v1/admin/cms/pages/:id/publish` | Admin roles |
| `POST` | `/api/v1/admin/cms/pages/:id/unpublish` | Admin roles |

All bodies through Zod. Block `props` validated by discriminated union on `type`.

---

## 8. Security

- Zod on every write; no client-trusted HTML without sanitise
- `richText` → isomorphic-dompurify (same as editorial)
- No executable uploads inline; prefer URLs / future media library
- Audit: publish / unpublish / delete
- Rate-limit publish if abused

---

## 9. Relationship to existing CMS surfaces

| Surface | Status | Relationship |
|---|---|---|
| Homepage KV (`CommerceSetting` hero + featured slugs) | Legacy (optional sync) | Primary edit = CMS page `home` after 11D |
| TipTap `/articles` | Shipped | Stays for journal; not replaced by page builder |
| Soft Gift `/gift` | **Block engine** (slug `home`) | Renders `MarketingPageBlocks` layout=home; footer chrome stays in route |

---

## 10. Implementation phases (code later — not this session)

| Slice | Scope | Status |
|---|---|---|
| **11A** | Prisma models + migration; admin CRUD; up/down order; public renderer for `hero` + `richText` + `cta` | **DONE 2026-07-21** |
| **11B** | `@dnd-kit` reorder; full v1 block set; SEO metadata | **DONE 2026-07-21** |
| **11C** | `productGrid` live catalog; preview; Soft Gift polish | **DONE 2026-07-21** |
| **11D** | Soft Gift `/gift` on MarketingPage `home` + homepage block types | **DONE 2026-07-21** |
| **12** | TipTap + saleStrip + media library/upload | **DONE 2026-07-22** |

### Exit criteria (when coding)

- [x] Admin can create a page, add blocks, reorder, publish
- [x] Public `/pages/[slug]` renders published blocks only
- [x] Zod + AuthZ + sanitise + audit on publish
- [x] Soft Gift polish + productGrid preview extras (11C)
- [x] Soft Gift theme only on public pages; Memory updated honestly

---

## 12. Future backlog (not shipped — do not mark done)

Track here so testers/eng remember gaps. Ship only when Product/phase asks.

| Item | Why | Notes |
|---|---|---|
| **TipTap on `richText` marketing blocks** | **Shipped (Phase 12)** | Admin uses `ArticleEditor`; public DOMPurify |
| **`saleStrip` promo banner** | **Shipped (Phase 12)** | Zod + admin + Soft Gift `GiftBand` renderer |
| **Media library / image upload** for `image` + hero `imageUrl` | **Shipped (Phase 12)** | Local disk + `/api/v1/media/:id/content`; CMS picker |
| **Inline image in richText via upload** | **Shipped (Phase 12)** | TipTap Upload/Library (URL prompt still available) |
| **11D** `/gift` homepage on block engine | **Shipped** | Edit via `/admin/cms/pages` (slug `home`) |
| **More block types** (countdown) | **Shipped Wave 4 (2026-07-28)** | Zod + admin + Soft Gift band |
| **FAQ block** | Shipped 2026-07-22 | Accordion + FAQPage JSON-LD |
| **`productGrid` merchandising sources** | **Shipped 2026-07-28** | `bestsellers` / `editors` / `new` / `on_sale` / `manual` + CMS inspector |
| **More promo variants** | **Shipped 2026-08-17** | `featuredCarousel` on home; `whatsappCta` / `offerCarousel` / `thinStrip` in CMS palette (not auto-placed) |
| **Razorpay** | Mock pay in checkout | **Post-dev** — keep `PAYMENT_PROVIDER=mock` |

**Editorial TipTap reminder:** Toolbar shows only when article is editable (`ASSIGNED` / `DRAFT` / `CHANGES_REQUESTED`). **PUBLISHED** / review queues = read-only body (by design).

---

## 13. Deferred audits (not this doc’s job)

Per human (**2Y**): originally docs-only session.

Queued for **later executions** (when human asks):

1. Ecommerce + CMS deep re-audit  
2. Creator Collective (+ remaining core) deep audit  

---

**End of CMS_PAGE_BUILDER.md v1.1.0**
