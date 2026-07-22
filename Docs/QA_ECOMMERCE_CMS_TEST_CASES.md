# QA Test Cases — Ecommerce + CMS

**For:** Manual testers  
**App:** Inabiya Soft Gift (`/gift`) + Admin CMS  
**Base URL (VPS):** `http://127.0.0.1:3001`  
**How to mark:** Pass / Fail / Blocked + short note  
**Last updated:** 2026-07-21 (Soft Gift design tokens + spacing scale)

---

## 1. Sample data (use these)

### Logins (all password = `Password123!`)

| Who | Email | Use for |
|---|---|---|
| Customer | `customer@test.inabiya` | Shop, cart, checkout, orders |
| Commerce admin | `commerce@test.inabiya` | Products, coupons, orders, CMS pages |
| Content admin | `content@test.inabiya` | CMS pages (also allowed) |
| Support | `support@test.inabiya` | Support search / inquiries |
| Wrong password check | any email + `WrongPass1!` | Login fail |

### Products (seeded)

| Product | Slug (URL) | Approx price | Notes |
|---|---|---|---|
| Cloud Soft Swaddle | `/gift/products/cloud-soft-swaddle` | ₹1,299 | Newborn |
| Personalised Name Blanket | `/gift/products/personalised-name-blanket` | ₹2,499 | Keepsake |
| Wooden Rattle Set | `/gift/products/wooden-rattle-set` | ₹899 | Toys |
| Welcome Baby Hamper | `/gift/products/welcome-baby-hamper` | ₹3,999 | Ready-made hamper |
| Expecting Mom Calm Kit | `/gift/products/expecting-mom-calm-kit` | ₹1,799 | Mom / hamper |

### Categories (PLP filters)

`newborn` · `keepsakes` · `clothing` · `bath-skin` · `toys` · `mom-care`

### Coupons

| Code | What it does | Min cart |
|---|---|---|
| `WELCOME10` | 10% off | ₹500 |
| `FLAT100` | ₹100 off | ₹1,000 |
| `FAKECODE` | Should fail | — |

### Free shipping

Threshold = **₹2,000** (not ₹999).  
Use **Welcome Baby Hamper** (₹3,999) alone → free shipping should apply.  
Use **Wooden Rattle Set** (₹899) alone → shipping charge should apply.

### Checkout address (sample)

| Field | Value |
|---|---|
| Name | Test Customer |
| Phone | 9876543210 |
| Line 1 | 12 Soft Nest Lane |
| City | Bengaluru |
| State | Karnataka |
| Pincode | 560001 |

### CMS page (create while testing)

| Field | Sample value |
|---|---|
| Title | Summer Welcome Baby |
| Slug | `summer-welcome-baby` |
| SEO title | Summer Welcome Baby \| Inabiya |
| SEO description | Soft gifts for new parents this summer. |
| Public URL after publish | `/pages/summer-welcome-baby` |
| Preview URL (draft ok) | `/pages/preview/{pageId}` |

### CMS block samples

| Block | Sample props |
|---|---|
| hero | Headline: `Gifts that feel like a hug` · Subcopy: `Soft Nest picks for newborns` · CTA: `Shop hampers` → `/gift/hampers` |
| richText | `<p>Handpicked <strong>soft gifts</strong> for your little one.</p>` |
| image | URL: any https image · Alt: `Soft swaddle flat lay` |
| productGrid | Title: `Starter picks` · Slugs: `cloud-soft-swaddle, wooden-rattle-set` **or** Category: `newborn` |
| cta | Label: `Build your box` · Href: `/gift/box` |
| spacer | size: `md` |

---

## 2. Ecommerce — customer flows

| ID | Case | Steps | Expected |
|---|---|---|---|
| EC-00 | Customer Sign out in nav | Login `customer@test.inabiya` → land on `/gift` | Right side of Soft Gift navbar shows **Account** (or name) + **Sign out** — not Sign in |
| EC-00b | Writer can Sign out | Login `writer@test.inabiya` → Editorial has **Log out**; open `/gift` | Gift navbar shows **Sign out**; Editorial **Log out** works |
| EC-00c | Commerce Log out | Login `commerce@test.inabiya` → `/admin/commerce` | **Log out** visible; after logout, gift nav shows Sign in |
| EC-00d | Sign out clears session | Customer → Sign out → open `/account` or checkout | Sent to login / guest again |
| EC-00e | Login has no shop nav | Open `/login` (logged in or out) | No Build Your Box / Cart / Sign out row — only Sign in form (+ small Inabiya link OK) |
| EC-01 | Home loads | Open `/gift` | Soft Gift home loads; nav visible (Build Your Box, Hampers, Girl/Boy/Mom, Shop by Age, Cart) |
| EC-02 | PLP browse | Open `/gift/products` | Product cards show; prices look like ₹ amounts |
| EC-03 | Filter category | Filter / open category `toys` | Wooden Rattle Set visible; unrelated items filtered |
| EC-04 | Filter girl | Shop for Girl | Girl + unisex products show; boy-only should not dominate |
| EC-05 | PDP | Open Cloud Soft Swaddle | Title, price, Add to cart / box actions work |
| EC-06 | Guest add to cart | Add rattle (guest) → open cart | Item in cart; qty editable |
| EC-07 | Qty update | Cart: set qty 2 | Line total updates |
| EC-08 | Remove line | Remove item from cart | Cart empty or remaining only |
| EC-09 | Guest checkout blocked | Guest cart → Checkout | Prompt to sign in (cannot complete as guest) |
| EC-10 | Login customer | `/login` → `customer@test.inabiya` / `Password123!` | Lands in account / shop as customer |
| EC-11 | Bad login | Wrong password | Error; not logged in |
| EC-12 | Cart after login | Login → add swaddle → cart | Cart shows item for this user |
| EC-13 | Coupon valid | Cart ≥ ₹500 → apply `WELCOME10` | Discount applied; total lower |
| EC-14 | Coupon invalid | Apply `FAKECODE` | Clear error; no discount |
| EC-15 | Coupon min fail | Tiny cart + `FLAT100` | Rejected (needs ₹1,000 min) |
| EC-16 | Free shipping | Cart with hamper (₹3,999) | Free shipping / no ship fee (threshold ₹2,000) |
| EC-17 | Paid shipping | Cart with only rattle (₹899) | Shipping fee shown |
| EC-18 | Checkout place order | Fill sample address → place order | Order created; confirmation / order id shown |
| EC-19 | My orders | `/orders` or account orders | New order listed |
| EC-20 | Wishlist (if UI) | PDP → wishlist → view wishlist | Product appears |
| EC-21 | Build Your Box | `/gift/box` → steps → add items → move to cart | Prefs saved; items land in cart |
| EC-22 | Hampers | `/gift/hampers` | Ready-made hampers listed |
| EC-23 | Corporate inquiry | `/gift/corporate` → submit name/email/message | Success message; no crash |
| EC-24 | Stock / sold out | (If admin sets stock 0) try add | Clear out-of-stock message |

---

## 3. Ecommerce — admin / ops

| ID | Case | Steps | Expected |
|---|---|---|---|
| EA-01 | Admin login | Login `commerce@test.inabiya` | Access `/admin/commerce` |
| EA-02 | Customer blocked from admin | Login as customer → open `/admin/commerce` | Denied / redirect (not full admin) |
| EA-03 | Product list | Admin → products | Seeded products listed |
| EA-04 | Edit product | Edit Cloud Soft Swaddle title slightly → save | Saved; storefront shows new title |
| EA-05 | Coupon deactivate | Deactivate `WELCOME10` → customer tries code | Coupon rejected |
| EA-06 | Coupon reactivate | Activate again | Customer can use again |
| EA-07 | Order status | Find test order → move status (e.g. Processing → Shipped) | Status updates; customer sees change |
| EA-08 | Cancel / refund path | Cancel eligible order (per UI) | Status cancelled; money path honest (no fake “paid” if not) |
| EA-09 | Support search | Login `support@test.inabiya` → search customer/order | Results without crash |
| EA-10 | Corporate inquiries list | Admin inquiries list | Corporate form submissions visible |

*After EA-05/06, leave coupons **active** for other testers.*

---

## 4. CMS — marketing page builder

| ID | Case | Steps | Expected |
|---|---|---|---|
| CM-01 | Pages list | Login commerce/content → `/admin/cms/pages` | List loads; New page works |
| CM-02 | Create draft | New page → title/slug from sample data → create | Opens editor; status **DRAFT** |
| CM-03 | Add blocks | Add hero, richText, productGrid, cta, spacer, image | All appear in block list |
| CM-04 | Edit props | Fill sample props (see §1) → Save draft | Saved message; reload keeps data |
| CM-05 | Drag reorder | Drag block 3 above block 1 → Save | Order persists after reload |
| CM-06 | Draft not public | Open `/pages/summer-welcome-baby` while DRAFT | **404** / not found |
| CM-07 | Preview draft | Editor → **Preview** (or `/pages/preview/{id}`) | Soft Gift layout; amber “draft preview” banner; products in grid if configured |
| CM-08 | productGrid by slugs | Grid slugs `cloud-soft-swaddle, wooden-rattle-set` → Preview | Those 2 products with prices |
| CM-09 | productGrid by category | Clear slugs; category `newborn` → Preview | Newborn products (up to ~8) |
| CM-10 | Empty grid | Grid with fake slug `no-such-product` | Empty / “no products” message (no crash) |
| CM-11 | Publish empty | Remove all blocks → Publish | Error: need at least one block |
| CM-12 | Publish | With blocks → Publish | Status **PUBLISHED**; “View live” works |
| CM-13 | Public page | Open `/pages/summer-welcome-baby` (logged out) | Soft Gift page; hero + grid + CTA; no draft banner |
| CM-14 | SEO | View page source / tab title | SEO title & description present |
| CM-15 | Unpublish | Unpublish → public URL again | Public **404**; preview still works for admin |
| CM-16 | Content admin access | Login `content@test.inabiya` → edit/publish | Allowed |
| CM-17 | Customer blocked | Login customer → `/admin/cms/pages` | Denied |
| CM-18 | Bad slug | Create second page with same slug | Error: slug taken |
| CM-19 | Delete page | Delete test page | Gone from list; public 404 |
| CM-20 | richText safe | Put `<script>alert(1)</script>` in richText → Preview/Public | Script does **not** run |

---

## 5. Quick smoke (15 min)

Do these in order if time is short:

1. EC-00, EC-00b, EC-01, EC-05, EC-12, EC-13, EC-18  
2. CM-02 → CM-04 → CM-07 → CM-12 → CM-13 → CM-15  

---

## 6. Result sheet (copy per run)

| Run date | Tester | Build / URL | Notes |
|---|---|---|---|
| | | `http://127.0.0.1:3001` | |

| ID | Result (P/F/B) | Notes |
|---|---|---|
| EC-00 | | |
| EC-00b | | |
| EC-00c | | |
| EC-01 | | |
| … | | |

---

## 7. Known tester tips

- Seed again if data missing: eng runs `pnpm db:seed` (ask eng; don’t run on prod blindly).
- Money is always whole rupees in UI; backend uses paise.
- Soft Gift theme only on `/gift` and `/pages/*` — don’t expect Creator theme here.
- Payment may be stub/demo depending on env — if pay step is mock, note it; still check order created.
- **Auth nav:** After login, Soft Gift header must switch Sign in → **Sign out** without a hard refresh. If it still says Sign in while `/account` works, file a bug (layout auth sync).
- Commerce / Editorial hubs use a **Log out** button (not the gift navbar). Writer lands on Editorial first; open `/gift` to check gift Sign out.
- **Login / Register** pages must **not** show the full shop navbar (Build Your Box, Cart, etc.) — only a small Inabiya home link is OK.
- **Plush Clay UI:** Soft Gift customer surfaces use locked tokens — `.clay-*` recipes, `gift-banner--*`, spacing `gs-*` only (no random hex/red-green Tailwind). Focus/disabled/invalid inputs should look consistent.
- **Responsive smoke:** phone-width (~375px) home hero CTAs, Menu nav, PLP 1-col cards, checkout form usable without horizontal page scroll.
- **Editorial TipTap toolbar:** Shows only when article is editable (`ASSIGNED` / `DRAFT` / `CHANGES_REQUESTED`). On **PUBLISHED** (or SEO/Medical review) the body is read-only — no Bold/H2 toolbar. That is expected, not a missing feature. Amber banner on the edit page explains this.
- **CMS page builder text:** `hero.headline` = plain field; `richText` = **TipTap** (`ArticleEditor`, Phase 12). Sanity-check Bold/link → save → public page sanitised HTML.
- **CMS media:** Upload/Library on hero/`image`/recipient URLs; TipTap Upload/Library. Public path `/api/v1/media/:id/content`.

---

## 8. Future reminders (not built yet)

Do **not** fail a test for these — log as “future” / enhancement:

| # | Reminder |
|---|---|
| F1 | ~~TipTap on CMS `richText`~~ — **shipped Phase 12** |
| F2 | ~~`saleStrip` promo~~ — **shipped Phase 12** |
| F3 | ~~Media library / image upload~~ — **shipped Phase 12** (local disk; AWS SDK deferred) |
| F4 | ~~11D Soft Gift homepage on blocks~~ — **shipped** |
| F5 | Extra blocks (FAQ, testimonials, countdown) when Product asks |
| F6 | Phase 1: password reset, real email, feature flags |
| F7 | Razorpay (replace mock pay) + public domain / Caddy |
| F8 | Real AWS/MinIO SDK behind storage adapter |

Canonical eng list also in `Docs/CMS_PAGE_BUILDER.md` §12.

---

**End of QA file**
