# Soft Gift — Homepage Reference & Functional Add-ons

Version: 1.0.0  
Status: Active (post Wave 1–3)  
Last Updated: 2026-07-21

Client shared a **homepage visual reference** (screenshots). This doc captures:

1. Thin **UI notes** (visual inventory only)
2. **Functional add-ons** derived primarily from the **navbar IA** (core product signal)
3. Mapping to **Phase 10** delivery

**Hard rule:** Do **not** pixel-match the screenshots. Soft Gift Design (`gift` theme, Fraunces + Plus Jakarta, Design.md) wins. Improvise layout wherever needed.

Related: PRD §41 Gift Box Builder · `Docs/Phases.md` Phase 10 · `Docs/Memory.md`

**Marketing pages (DnD):** Client also wants drag-and-drop **arbitrary pages** (`/pages/[slug]`). That is **Phase 11**, not this homepage reference — see [`CMS_PAGE_BUILDER.md`](CMS_PAGE_BUILDER.md). This file stays navbar-first Soft Gift homepage IA only.

---

## 1. UI notes (visual inventory — non-authoritative)

| Section (reference) | Notes |
|---|---|
| Header / nav | Logo + primary links + cart |
| Hero | Personalised gifting headline, dual CTA, trust chips |
| Trusted brands | Logo grid |
| Shop by baby | Girl / boy large cards |
| USP bar | Personalised / ready-made / made with love / trusted quality |
| Exclusive offers | Welcome %, corporate quote, bulk pricing CTAs |
| Shop by category | Clothing, Bath & Skin, Toys, Mom Care |
| 6-step builder strip | Who → Age → Occasion → Budget → Categories → Your box |
| Ready-made hampers | Product grid + See all |
| Testimonials | Star quotes |
| Journal teaser | Articles CTA |
| Footer | Shop / Company / Reach us |

**Visual polish (2026-07-21):** Soft Gift–interpreted homepage cues (section washes `.gift-band--*`, hero doodles, wavy recipient/product edges, pill CTAs, USP icon row). Mood from client PDF only — **not** a My Baby Babbles pixel clone; Design.md Soft Gift tokens win.

Reference free-shipping copy showed **₹999**. Production threshold remains **₹2,000** (`FREE_SHIPPING_MIN_PAISE`) until Product changes it. Any trust copy must match the real threshold.

---

## 2. Functional add-ons (authority) — navbar-first

Navbar options from the client reference define **core Soft Gift capabilities**:

| Nav label | Functional meaning | Status before Phase 10 | Phase |
|---|---|---|---|
| Build Your Box | Guided builder (PRD §41): recipient, age, occasion, budget, categories → curated box | Budget planner only | **10B** |
| Ready-Made Hampers | Curated pack / hamper PLP | Featured products only | **10C** |
| For Baby Girl | Recipient/palette filtered browse | No attribute | **10A** |
| For Baby Boy | Recipient/palette filtered browse | No attribute | **10A** |
| For Expecting Mom | Recipient collection filter | Missing | **10A** |
| Shop by Age | Age-band filter | Missing | **10A** |
| Cart | Cart + checkout | Exists | — |

**Current chrome (2026-07-21):** desktop bar — **always-open search** (fixed width, leftmost of links) + **Shop ▾** + **For Whom ▾** megas (left links + right image/copy), **Journal** → `/articles`, then wishlist / cart / profile. Search debounces catalog `q` suggestions. Shop mega groups box, hampers, and category PLPs; For Whom groups recipient + age bands. Mobile uses the same groups as accordion sections + full-width search in the drawer.

### Secondary (P2 — improvise; do not block nav IA)

- Brands showcase (commerce `brandName`, not Creator `BrandProfile`)
- USP / offers marketing strips
- Corporate / bulk inquiry lead form
- Homepage testimonials / review snippets
- Journal teaser on `/gift`
- Rich footer IA (Shop by Occasion, Corporate, Contributor login)

---

## 3. Taxonomy conventions (Phase 10A)

| Filter key | Allowed values |
|---|---|
| `recipient` | `girl` · `boy` · `mom` · `unisex` |
| `age` | `newborn` · `infant` · `toddler` · `any` |
| `occasion` | `welcome-baby` · `baby-shower` · `naming` · `birthday` |
| `hamper` | `1` → ready-made hampers only |
| `category` | category slug (existing) |

Shop category seeds (improvise names as needed): `clothing`, `bath-skin`, `toys`, `mom-care` (plus existing `newborn`, `keepsakes`).

---

## 4. Explicit non-goals

- Pixel-perfect clone of client homepage
- Mixing Creator theme into Soft Gift
- Full B2B pricing engine (inquiry form only for Phase 10D)
- Changing free-shipping threshold without Product sign-off
