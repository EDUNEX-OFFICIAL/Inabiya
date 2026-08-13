# Inabiya
# Design System & UX Standards

Version: 2.1.0

Status: Active — Visual Authority

Document Owner: Design + Frontend Engineering

Stakeholders:
Design
Product
Frontend
QA
Marketing
AI Coding Assistants

Last Updated: August 11, 2026 (gift+compact ops readability remap)

---

## 1. Purpose

This document is the authoritative design system for Inabiya production UI.

It defines:

1. Triple brand systems (Soft Gift · Blog Creative · Creator Collective)
2. Tokens (color, type, space, radius, elevation, motion) — shared foundations + per-theme semantics
3. Layout principles and page compositions
4. Component inventory and variants
5. Accessibility, content, and QA standards
6. Anti-patterns AI must not generate

If UI conflicts with this file, change the UI — not the brand — unless Design + Eng approve a token update via ADR/`Memory.md`.

### Related docs

`PRD.md` (journeys) · `Rules.md` (stack) · `Phases.md` (when) · `Memory.md` (current) · this file (look & feel)

---

## 2. Triple-System Law (Non-Negotiable)

Inabiya is one company, **three visual systems** (ecommerce, parenting journal, influencer campaigns).

| System | Codename | `data-theme` | Surfaces | Personality |
|---|---|---|---|---|
| **A** | Soft Gift | `gift` | Storefront `/gift`, marketing `/pages/*`, customer account, commerce CMS | Warm, nurturing, pastel, soft, safe |
| **C** | Blog Creative | `blog` | Public `/articles`, `/specialists`, `/blog`, editorial CMS | Creative journal, paper/ink, trust-first longform |
| **B** | Creator Collective | `creator` | Influencer campaign marketing, creator/brand dashboards, creator admin | Organic, earthy, luxurious, marketplace |

### Hard rules

1. Never mix Soft Gift pink into Blog or Creator.
2. Never restyle Soft Gift with Creator forest/terracotta or Blog teal-ink as default.
3. Theme by route/layout scope: `data-theme="gift"` | `data-theme="blog"` | `data-theme="creator"`.
4. Shared foundations (`:root` space/type/z/duration) + theme primitives; components read **semantic** CSS variables only.
5. Blog medical specialists ≠ Creator marketplace creators in IA/chrome.
6. Admin consoles stay in family tokens + `data-density="compact"` — **no fourth brand palette** (`admin` theme is forbidden).
7. Hover / focus / disabled / invalid live in recipes (`.clay-*`, `.blog-*`, `.creator-*`), not ad-hoc TSX hex.

---

## 3. Design → Code Contract

| Concern | Standard |
|---|---|
| Styling | Tailwind CSS + CSS variables |
| Primitives | shadcn/ui + Radix, restyled |
| Motion | GSAP Soft Gift story; Framer only for tiny UI |
| Toasts | Sonner |
| Forms | RHF + Zod + themed inputs |
| Icons A | lucide-react stroke ~1.5 |
| Icons C | lucide-react stroke ~1.5 |
| Icons B | lucide + Phosphor |
| Fonts A | Fraunces + Plus Jakarta Sans |
| Fonts C | Newsreader + Source Sans 3 |
| Fonts B | Playfair Display + Manrope |

Forbidden as primary: MUI, Ant, Chakra, Inter/Roboto brand stacks, emoji-icons.

### Token layers (all themes)

| Layer | Where | What |
|---|---|---|
| 0 Shared foundations | `:root` in `globals.css` | `--space-*`, `--text-*`, `--duration-*`, `--z-*`, `--tap-min`, default radii |
| 1 Brand primitives | `[data-theme]` | Raw hex/HSL only (e.g. `--inabiya-pink`, `--blog-ink`, creator HSL) |
| 2 Semantics | `[data-theme]` | Same names: `--background`, `--primary`, `--primary-hover`, `--surface`, `--border-focus`, status, inputs, shadows |
| 3 Recipes | `@layer components` | Buttons/inputs/cards/type with hover/active/focus/disabled/invalid |
| Density | `data-density="compact"` | Tighter padding/type for CMS/admin. Soft Gift ops may remap **semantic** surfaces / borders / muted (same family primitives) for WCAG desk readability — primary accent unchanged; **no fourth theme** |

---

## 4. System A — Soft Gift

### 4.1 Brand personality & first-viewport law

Warm · nurturing · premium · soft · safe · mobile-first editorial ecommerce.

Tagline signal: thoughtfully personalised baby essentials & gifting.

First viewport on branded marketing pages:

- One composition (not dashboard)
- Brand is hero-level
- One headline, one supporting sentence, one CTA group, one dominant visual
- Full-bleed / edge-to-edge hero preferred
- No floating promo chips on hero media
- Cards not default in hero

### 4.2 Color tokens

| Token | Hex | CSS var | Usage |
|---|---|---|---|
| Pink primary | `#FF6B9D` | `--inabiya-pink` | CTAs, progress, accents |
| Pink dark | `#E65688` | `--inabiya-pink-dark` | Hover |
| Soft bg | `#FFF3F8` | `--inabiya-soft` | Page background |
| Heading | `#2D2640` | `--inabiya-heading` | H1–H6 |
| Body | `#3C3352` | `--inabiya-body` | Body/secondary |
| Yellow | `#FFD166` | `--inabiya-yellow` | Must-have tags |
| Mint | `#B5EAD7` | `--inabiya-mint` | Recommended tags |
| Lavender | `#E8D5F5` | `--inabiya-lavender` | Nice-to-have / tracks |
| White | `#FFFFFF` | `--inabiya-white` | Cards/panels |

**Usage rules**

- Soft pink ground + white cards
- No generic blue CTAs
- Tag text = heading dark (never white on yellow/mint/lavender)
- Primary button = white on pink
- Progress fill = pink; track = lavender
- **Soft Gift UI must not hardcode hex, rgba, or ad-hoc spacing in TSX** — use CSS vars + recipes + Tailwind `gs-*` / semantic colors only (see §4.2a–4.7)

### 4.2a Semantic tokens (System A — required)

Defined in `apps/web/app/globals.css` under `[data-theme='gift']`. Brand hex lives only as primitives; components consume semantics.

| Layer | Tokens |
|---|---|
| Space | Shared `:root` `--space-1`…`--space-4` (controls) + **gift φ** `--space-5`…`--space-8` → Tailwind `gs-1`…`gs-8` |
| Type (φ) | Gift overrides `--text-caption/body/h2/h1/display` (+ `-lg`) and `--leading-body: 1.618` |
| Radius | Gift overrides `--radius-pill` / `--radius-card` / `--radius-control` → `rounded-pill` / `rounded-clay` / `rounded-control` |
| Surface | `--surface`, `--surface-soft`, `--surface-nav` |
| Border / focus | `--border-subtle`, `--border-strong`, `--border-focus`, `--ring` |
| Elevation | `--clay-shadow`, `--clay-shadow-hover`, `--clay-shadow-press` → `shadow-clay*` |
| Status | `--success`/`--success-bg`, `--warning`/`--warning-bg`, `--danger`/`--danger-bg`, `--info`/`--info-bg` |
| Control | `--input-bg`, `--input-border`, `--input-border-error`, `--tap-min` |
| Misc gift | `--gift-whatsapp`, `--gift-sticky-offset`, `--gift-pad-x/y` |

**φ note (Soft Gift only):** body base `1rem`; steps ≈1.618. Caption floors at `0.75rem` (a11y). Blog/Creator keep shared `:root` ladder — do not copy gift overrides.

**Recipes (prefer over one-off classes):** `.clay-btn` / `.clay-btn-secondary` / `.clay-btn-ghost` (hover/active/disabled/focus-visible — **no button translateY lift**; icon SVG micro-motion OK), `.clay-input` (hover/focus/disabled/`aria-invalid`), `.clay-card` / `.clay-panel` / `.clay-chip` / `.clay-nav`, `.gift-page` / `.gift-section` / `.gift-stack*`, `.gift-banner--success|warning|danger|info`, checkout: `.checkout-option` / `.checkout-section` / `.checkout-sticky-pay` (no GSAP, no clay-card hover lift), type: `.gift-display` / `.gift-h1` / `.gift-h2` / `.gift-body` / `.gift-muted` / `.gift-overline`. Homepage polish (Soft Gift–interpreted, not third-party clone): `.gift-band--blush|mint|sky|lavender|soft`, `.gift-doodle`, `.gift-toys` (faded corner SVGs), `.gift-wave-card` (recipient/category cards only), `.gift-pill-overlap`, `.gift-usp`. Avoid `100vw` full-bleed (scrollbar overflow).

### 4.3 shadcn semantic mapping (System A)

Map shadcn variables into gift theme (approximate):

| shadcn token | Maps to |
|---|---|
| `--background` | soft `#FFF3F8` |
| `--foreground` | heading `#2D2640` |
| `--primary` | pink `#FF6B9D` |
| `--primary-foreground` | white |
| `--secondary` | lavender / soft tint |
| `--muted` | lavender-tinted muted surface |
| `--accent` | mint soft surfaces for success accents |
| `--destructive` | accessible red (not pink) |
| `--border` | soft lavender-gray border |
| `--ring` | pink |

Exact HSL conversions should live in theme CSS; hex above is brand source.

### 4.4 Canonical CSS (System A)

```css
[data-theme="gift"] {
  --inabiya-pink: #FF6B9D;
  --inabiya-pink-dark: #E65688;
  --inabiya-soft: #FFF3F8;
  --inabiya-heading: #2D2640;
  --inabiya-body: #3C3352;
  --inabiya-yellow: #FFD166;
  --inabiya-mint: #B5EAD7;
  --inabiya-lavender: #E8D5F5;
  --inabiya-white: #FFFFFF;

  --font-display: "Fraunces", ui-serif, Georgia, serif;
  --font-body: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;

  --radius-card: 1.75rem;
  --radius-panel: 1rem;
  --radius-pill: 9999px;
  --radius: 1rem;

  --shadow-brand: 0 2px 8px rgba(255, 107, 157, 0.10);
  --shadow-soft: 0 2px 10px rgba(45, 38, 64, 0.04);
  --shadow-card: 0 1px 3px rgba(45, 38, 64, 0.05);

  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-blur: 20px;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  /* Gift φ section rhythm (controls stay on 1–4) */
  --space-5: 1.618rem;
  --space-6: 2.618rem;
  --space-7: 4.236rem;
  --space-8: 6.854rem;

  /* Gift φ type (body = 1rem) */
  --text-caption: 0.75rem;
  --text-body: 1rem;
  --text-body-lg: 1rem;
  --text-h2: 1.25rem;
  --text-h2-lg: 1.618rem;
  --text-h1: 1.618rem;
  --text-h1-lg: 2.618rem;
  --text-display: 2.618rem;
  --text-display-lg: 4.236rem;
  --leading-body: 1.618;

  --tap-min: 48px;
  --btn-height: 56px;

  --background: var(--inabiya-soft);
  --foreground: var(--inabiya-heading);
  --primary: var(--inabiya-pink);
  --primary-foreground: #fff;
}
```

### 4.5 Typography (System A)

| Role | Font | Weight guidance |
|---|---|---|
| Display / headings | Fraunces | medium editorial |
| Body / UI | Plus Jakarta Sans | regular/semibold |

Soft Gift uses a **φ (≈1.618) type scale** scoped under `[data-theme='gift']` (see §4.2a). Prefer CSS recipes / Tailwind token aliases — never raw hex in TSX.

#### Type scale recipes

| Level | Recipe (preferred) | Token (mobile → lg) |
|---|---|---|
| Display / hero | `.gift-display` or `.gift-hero-split__headline` | `--text-display` → `--text-display-lg` (`2.618` → `4.236rem`) |
| H1 | `.gift-h1` / `text-h1` | `1.618` → `2.618rem` |
| H2 section | `.gift-h2` / `text-h2` | `1.25` → `1.618rem` |
| Body | `.gift-body` / `text-body` | `1rem` (`--leading-body: 1.618`) |
| Muted | `.gift-muted` | same body size, lower opacity |
| Overline/label | `.gift-overline` / `text-caption` | `0.75rem`, uppercase, `0.1em` tracking |

Line length for reading: aim ~60–75ch on article pages.

### 4.6 Shape, elevation, glass

| Token | Value |
|---|---|
| Card radius | `rounded-clay` (`--radius-card`) |
| Pill controls | `rounded-pill` |
| Control radius | `rounded-control` |
| Shadows | `shadow-clay` / `shadow-brand` (minimal ambient) |
| Sticky chrome | `bg-surface-nav` + backdrop blur |

### 4.7 Spacing & layout

- Prefer `--space-*` / Tailwind `gs-*` only inside Soft Gift (no raw `p-5` / `px-6` / half-step `gap-1.5` mixes)
- Controls: `gs-1`…`gs-4` (4/8 grid). Section rhythm: gift φ `gs-5`…`gs-8`
- Page chrome: `.gift-page` (token padding) or `.gift-section` / `.gift-stack`
- Mobile feeds: 1 col or dense 2 col
- Desktop catalogs: 3–4 col / bento
- Premium = generous whitespace (favor `gs-6`–`gs-8` between sections)
- Sticky mobile chrome under nav: `top-[var(--gift-sticky-offset)]`

### 4.8 Motion (System A)

Minimum intentional motions on polished gift flows:

1. Builder step: fade + slight y-translate
2. Budget/progress width ease-out
3. Add-to-box check + mint pulse

Guidelines:

- UI feedback ~200–350ms
- Respect `prefers-reduced-motion`
- Avoid perpetual decorative loops
- Prefer specific properties over blanket `transition-all`

### 4.9 Signature patterns

#### Build Your Box

- Multi-step state machine UX
- Sticky progress (“Step X of N”)
- Mobile bottom glass summary shows **Remaining Budget** (not cart total)
- Desktop sticky right summary
- Tags: Must-have (yellow) / Recommended (mint) / Nice-to-have (lavender)

#### Product card

- Soft white surface, prominent media, title, price, tag
- Media ratio 1:1 or 4:5
- Add action clear and large enough for thumbs

#### Commerce admin (A-family dense)

- Same family tokens/fonts; under `data-density="compact"` remap canvas/borders/muted for desk contrast (not storefront blush)
- White panels on neutral canvas; pink = accents/CTAs/active nav only
- Flatter tables (`.ops-th`); less playful motion; no decorative blobs on KPIs
- Still no generic blue SaaS defaults; **no `data-theme="admin"`**

### 4.10 Page inventory (System A)

#### Storefront / marketing

| Page | Composition notes |
|---|---|
| Home | Brand hero, one CTA path to shop/builder, restrained secondary |
| Build Your Box landing | Emotional + clear start CTA |
| Builder steps | Progress + catalog + summary trinity |
| Ready-made hampers | Grid of curated boxes |
| Shop by age / occasion | Filter-forward PLP |
| Category PLP | Filters, sort, soft cards |
| PDP | Gallery, personalization, trust cues, CTA |
| Cart | Editable lines + personalization summary |
| Checkout | Single-column calm focus; minimal distraction |
| Order confirmation | Reassurance + next steps |
| Account / orders / wishlist | Dense but soft |
| About / contact | Human, warm photography |

#### Commerce admin

Dashboard, products, inventory, orders, customers, promotions, homepage CMS, reports, settings — dense A-family.

### 4.11 Component inventory (System A)

#### Foundations

Button (primary/outline/ghost), Input, Textarea, Select, Checkbox, Radio, Switch, Badge/Chip, Dialog, Sheet, Dropdown, Tabs, Accordion, Tooltip, Toast, Skeleton, Pagination, Breadcrumb, Table (admin), Form field.

#### Brand components

| Component | Notes |
|---|---|
| `SiteHeader` / `SiteFooter` | Glass sticky header ok |
| `ProductCard` | Tag + media + price |
| `CategoryChips` | horizontal scroll mobile |
| `BuilderProgress` | lavender track / pink fill |
| `SummaryPanel` | remaining budget emphasis |
| `BudgetMeter` | near-limit color shift |
| `PersonalizationFields` | engraving/message/options |
| `PriceBlock` | clear hierarchy |
| `TrustStrip` | shipping/returns/trust (non-hero) |
| `ReviewStars` | accessible labels |
| `OrderTimeline` | status clarity |
| `EmptyState` | one message + one CTA |
| `AdminKpiCard` | dense variant |

Utility classes expected: `.btn-primary`, `.btn-outline`, `.chip`, `.card-soft`, `.tag-must|rec|nice`, `.glass`, `.heading`, `.subtle`.

### 4.12 Imagery (System A)

Warm bright soft light; cotton/wood textures; human connection.

Aspect:

- Product 1:1 or 4:5
- Hero full-bleed

Reference intents: hero hamper, lifestyle baby, essentials, wooden toys, mom care, nursery.

No abstract purple gradient heroes.

---

## 5. System C — Blog Creative

### 5.1 Personality

Creative parenting journal · paper & ink · trust-first · longform readable · calm CTAs.  
Not Soft Gift sales chrome; not Creator marketplace earthy.

### 5.2 Color tokens (primitives)

| Token | Hex | CSS var | Usage |
|---|---|---|---|
| Paper | `#F7F5F2` | `--blog-paper` | Page background |
| Ink | `#1E2A3A` | `--blog-ink` | Headings |
| Body | `#3A4553` | `--blog-body` | Body copy |
| Accent | `#0F766E` | `--blog-accent` | Links / primary CTA |
| Accent hover | `#0D5F59` | `--blog-accent-hover` | Hover |
| Wash | `#E8F2F0` | `--blog-wash` | Soft bands / chips |
| Highlight | `#F4E8C1` | `--blog-highlight` | Quotes / callouts |
| White | `#FFFFFF` | `--blog-white` | Cards |

**Usage rules**

- Paper ground + white cards; teal-ink accents (never gift pink, never terracotta)
- Tag/chip text = ink dark on wash (not white on wash)
- Primary button = white on accent
- **No hardcoded hex in TSX** — semantics + `.blog-*` recipes + `gs-*` only

### 5.3 Semantic + recipes

Defined under `[data-theme='blog']`. Same semantic names as Soft Gift/Creator (`--primary`, `--primary-hover`, `--surface`, status, inputs, shadows).

**Recipes:** `.blog-shell`, `.blog-page`, `.blog-prose`, `.blog-btn` / `.blog-btn-secondary` / `.blog-btn-ghost`, `.blog-input`, `.blog-card`, `.blog-chip`, `.blog-nav`, `.blog-banner--*`, type `.blog-display` / `.blog-h1` / `.blog-h2` / `.blog-body` / `.blog-muted` / `.blog-overline`.

### 5.4 Typography (System C)

| Role | Font |
|---|---|
| Headings | Newsreader |
| Body/UI | Source Sans 3 |

### 5.5 Page inventory (System C)

| Surface | Notes |
|---|---|
| Article index | Journal band + readable list; 16:9 thumbs |
| Article detail | Prose-first; specialist attribution |
| Specialists index/detail | Trust cards; not creator marketplace chrome |
| Editorial CMS | Same tokens + `data-density="compact"` |

### 5.6 Imagery (System C)

Soft daylight, documentary parenting, specialist portraits. Aspect 16:9 for article thumbs. No pink Soft Gift product grids as the primary visual idea.

---

## 6. System B — Creator Collective (influencer campaigns)

### 6.1 Personality

Organic · earthy · luxurious · editorial.  
Premium influencer marketplace for parenting brands.  
Light mode preferred; dark mode = deep green editorial.

### 6.2 Color tokens (HSL)

#### Light

| Token | HSL |
|---|---|
| `--background` | `40 33% 98%` |
| `--foreground` | `150 40% 15%` |
| `--card` | `0 0% 100%` |
| `--primary` | `150 40% 20%` |
| `--primary-foreground` | `40 33% 98%` |
| `--secondary` | `20 60% 50%` terracotta |
| `--secondary-foreground` | `0 0% 100%` |
| `--muted` | `40 20% 90%` |
| `--muted-foreground` | `150 20% 40%` |
| `--accent` | `40 30% 92%` |
| `--border` / `--input` | `40 20% 85%` |
| `--ring` | `150 40% 20%` |
| `--radius` | `0.75rem` |

#### Dark

| Token | HSL |
|---|---|
| `--background` | `150 40% 10%` |
| `--foreground` | `40 33% 98%` |
| `--card` | `150 30% 13%` |
| `--primary` | `40 33% 98%` |
| `--primary-foreground` | `150 40% 10%` |
| `--secondary` | `20 60% 50%` |
| `--muted` | `150 30% 18%` |
| `--border` / `--input` | `150 30% 20%` |
| `--ring` | `40 33% 98%` |

No generic SaaS blue/purple.

### 6.3 Typography (System B)

| Role | Font |
|---|---|
| Headings | Playfair Display |
| Body/UI | Manrope |

Cues:

- Large editorial H1 `text-5xl md:text-6xl`
- Uppercase labels `tracking-[0.2em]`
- Never Inter/Roboto

### 6.4 Layout modes

| Mode | Use | Pattern |
|---|---|---|
| Tetris grid | Marketing | 12-col asymmetric, large negative space, overlap text/image; `py-24 px-6 md:px-12 max-w-7xl` |
| High density | Dashboards | 3–4 col, subtle borders, flat, minimal shadow |

### 6.5 Surfaces & controls

- Header glass `backdrop-blur-xl bg-background/80`
- Marketing surfaces: flat + 1px border, hover lift, `p-8`
- Dashboard: `bg-muted/30`, subtle border
- Optional paper grain
- Marketing CTA pills `rounded-full`
- Dashboard utilities `rounded-md`
- Marketing layouts: composition-first Tailwind, not card spam
- shadcn for forms/modals/selects/calendars customized to B
- Marketing/signup inputs may be underline (`border-b-2 rounded-none`); dashboard solid muted

### 6.6 Motion (System B)

1. Marketing staggered fade-up
2. Dashboard ~150ms transitions
3. Subtle parallax on key imagery when it helps hierarchy

### 6.7 Page inventory (System B)

| Surface | Notes |
|---|---|
| Marketing landing | Tetris, brand-forward, creator/brand CTAs |
| Creator signup multi-step | Custom forms, progress, underline/editorial inputs |
| Creator dashboard | Density mode, proposals, earnings, deliverables |
| Brand dashboard | Campaigns, evaluation queue |
| Campaign marketplace | Browse + filters |
| Proposal/bid submit | Clear reverse-bidding UX |
| Messaging | Calm dense thread |
| Deliverable review | Approval gates obvious |

### 6.8 Component inventory (System B)

| Component | Notes |
|---|---|
| `CreatorHeader` | glass |
| `TetrisSection` | 12-col marketing blocks |
| `CampaignCard` | flat border, not gift soft-pink card |
| `ProposalForm` | reverse bid fields |
| `StatusBadge` | campaign/deliverable states |
| `DenseStat` | dashboard metrics |
| `DeliverableReviewPanel` | approve/request changes |
| `CreatorProfileHeader` | editorial portrait treatment |

Icons: lucide + Phosphor. Toasts: Sonner.

**Recipes (required parity):** `.creator-shell`, `.creator-page`, `.creator-btn` / `.creator-btn-secondary` / `.creator-btn-ghost`, `.creator-input`, `.creator-card`, `.creator-chip`, `.creator-nav`, `.creator-banner--*`, type `.creator-display` / `.creator-h1` / `.creator-h2` / `.creator-body` / `.creator-muted` / `.creator-overline`. Semiotics: `--primary-hover`, surfaces, status, input states — same names as gift/blog.

### 6.9 Imagery (System B)

Mother/newborn trust, creator lifestyle, filming creators, pediatric trust (where relevant), wooden product campaigns. Prefer curated references over random stock abstraction.

---

## 7. Shared Interaction Grammar

Across A, B, and C, keep consistent interaction meaning:

Buttons · Forms · Tables · Filters · Pagination · Search · Toasts · Loading · Empty · Error · Confirm dialogs

Users must not relearn basic grammar when switching modules.

### 7.1 States

| State | Pattern |
|---|---|
| Loading | Skeletons for grids; stable layout |
| Empty | One message + one action |
| Validation | Inline field errors |
| Transient | Toast |
| Blocking | Page message + recovery |
| Success | Quiet confirmation |

Never expose stack traces.

### 7.2 Forms

- Labels visible
- Errors tied to fields
- Disable double submit on payment/proposal/checkout
- Show pending
- Required indicators accessible

### 7.3 Navigation

- Clarity over feature quantity
- Role-appropriate admin nav
- Persist user location cues (breadcrumbs in dense admin)

---

## 8. Theming architecture

```text
app/(gift)/layout.tsx              → data-theme="gift"
app/(blog)/layout.tsx              → data-theme="blog"  (+ /articles, /specialists)
app/(creator)/layout.tsx           → data-theme="creator"
app/(admin)/layout.tsx             → no theme (AdminGate only)
app/(admin)/commerce/...           → gift + data-density="compact"
app/(admin)/editorial/...          → blog + data-density="compact"
app/(admin)/creator/...            → creator + data-density="compact"
app/(admin)/platform/...           → gift + data-density="compact"
```

Theme switching is structural, not per-component random. Never invent `data-theme="admin"`.

---

## 9. Accessibility (WCAG-minded)

Target: practical WCAG 2.2 AA for core flows.

1. Contrast readable on brand fills
2. Focus visible (`ring`)
3. Keyboard: dialogs, menus, builder, checkout
4. Tap targets ≥ 48×48; primary CTAs often 56px
5. Icon-only controls need `aria-label`
6. Don’t use color alone for status
7. Meaningful `alt`; decorative marked
8. `prefers-reduced-motion` honored
9. Form errors announced appropriately

---

## 10. Content & tone

- Trust over aggressive selling
- Education before promotion on blog
- Premium calm; avoid fake urgency spam
- No emoji-as-icon language
- Indian parenting context: respectful, inclusive, non-judgmental

Microcopy examples (A): “Add to box”, “Remaining budget”, “Personalise this gift”  
Microcopy examples (C): “Read the guide”, “Meet our specialists”, “Subscribe to the journal”  
Microcopy examples (B): “Submit proposal”, “Campaign marketplace”, “Deliverable approved”

---

## 11. Testing attributes

Critical interactive nodes require `data-testid` kebab-case.

Examples (A): `add-to-box-btn`, `summary-panel`, `budget-remaining`, `checkout-pay-btn`  
Examples (C): `article-card`, `newsletter-subscribe-btn`, `specialist-profile`  
Examples (B): `submit-proposal-btn`, `campaign-card`, `select-creator-btn`

---

## 12. Design QA checklist (merge gate)

- [ ] Correct theme (A gift / C blog / B creator)
- [ ] Correct fonts
- [ ] No Inter/Roboto/purple-glow SaaS default
- [ ] Mobile verified
- [ ] Tap targets OK
- [ ] Focus visible
- [ ] Loading/empty/error present
- [ ] Motions intentional
- [ ] Real imagery, not abstract filler as main idea
- [ ] No emoji icons
- [ ] No theme bleed
- [ ] `data-testid` on critical controls
- [ ] Hero composition rules respected on marketing pages
- [ ] Admin uses family theme + compact density (not a fourth palette)

---

## 13. Anti-patterns

1. Mixing A/B/C tokens
2. Treating specialists as creators in UI IA
3. Purple glow AI SaaS heroes
4. Applying cream+terracotta serif cluster onto Soft Gift by mistake
5. Broadsheet dense newspaper default
6. Unstyled sharp shadcn gray on Gift surfaces
7. Emoji icons
8. Decorative card grids with no job
9. Hero overlay sticker spam
10. Inventing a fourth uncontrolled palette (e.g. `data-theme="admin"`)
11. Dashboard widgets jammed into first marketing viewport
12. Inset tiny hero cards where full-bleed brand hero is required
13. Soft Gift pink CTAs on Blog Creative or Creator surfaces

---

## 14. AI instructions

1. Identify System A, B, or C before styling
2. Use only that system’s tokens/fonts/layout mode
3. Prefer existing primitives / recipes
4. Obey first-viewport rules on marketing pages
5. Include a11y + test IDs
6. Do not “improve” by blending systems
7. If a new surface lacks guidance, propose options and wait

---

## 15. Phase application

| Phases | Design focus |
|---|---|
| 0–1 | token plumbing + shells |
| 2–5 | System A excellence |
| 6–7 | System C journal readability + admin dense |
| 8 | System B scoped theme introduction |
| 9 | a11y/perf visual regressions |
| Ongoing | Triple-theme token parity (shared foundations + recipes) |

---

## 16. Evolution

Token/font/component contract changes require:

1. Design approval
2. Eng acknowledgment
3. `Design.md` version bump
4. `Memory.md` decision entry
5. Theme regression pass on all three systems if shared foundations change

---

**End of Design.md v2.1.0**
