# Inabiya
# Design System & UX Standards

Version: 2.0.0

Status: Active — Visual Authority

Document Owner: Design + Frontend Engineering

Stakeholders:
Design
Product
Frontend
QA
Marketing
AI Coding Assistants

Last Updated: July 2026

---

## 1. Purpose

This document is the authoritative design system for Inabiya production UI.

It defines:

1. Dual brand systems (Gift vs Creator Collective)
2. Tokens (color, type, space, radius, elevation, motion)
3. Layout principles and page compositions
4. Component inventory and variants
5. Accessibility, content, and QA standards
6. Anti-patterns AI must not generate

If UI conflicts with this file, change the UI — not the brand — unless Design + Eng approve a token update via ADR/`Memory.md`.

### Related docs

`PRD.md` (journeys) · `Rules.md` (stack) · `Phases.md` (when) · `Memory.md` (current) · this file (look & feel)

---

## 2. Dual-System Law (Non-Negotiable)

Inabiya is one company, **two selling concepts**, **two design systems**.

| System | Codename | Surfaces | Personality |
|---|---|---|---|
| **A** | Soft Gift | Storefront, Build Your Box, customer account, public blog UI, commerce-adjacent marketing | Warm, nurturing, pastel, soft, safe |
| **B** | Earthy Editorial | Creator Collective marketing, signup, creator/brand dashboards, campaign marketplace | Organic, earthy, luxurious, editorial |

### Hard rules

1. Never mix System A pink into System B.
2. Never restyle System A with System B forest/terracotta as default.
3. Theme by route/layout scope: `data-theme="gift"` | `data-theme="creator"`.
4. Shared primitives read CSS variables only.
5. Blog medical specialists ≠ Creator marketplace creators in IA/chrome.
6. Admin consoles may be denser, but remain inside their family tokens.

---

## 3. Design → Code Contract

| Concern | Standard |
|---|---|
| Styling | Tailwind CSS + CSS variables |
| Primitives | shadcn/ui + Radix, restyled |
| Motion | Framer Motion for intentional sequences |
| Toasts | Sonner |
| Forms | RHF + Zod + themed inputs |
| Icons A | lucide-react stroke ~1.5 |
| Icons B | lucide + Phosphor |
| Fonts A | Fraunces + Plus Jakarta Sans |
| Fonts B | Playfair Display + Manrope |

Forbidden as primary: MUI, Ant, Chakra, Inter/Roboto brand stacks, emoji-icons.

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
| Space | `--space-1`…`--space-8` → Tailwind `gs-1`…`gs-8` (`p-gs-4`, `gap-gs-5`, …) |
| Radius | `--radius-pill`, `--radius-card`, `--radius-control` → `rounded-pill` / `rounded-clay` / `rounded-control` |
| Surface | `--surface`, `--surface-soft`, `--surface-nav` |
| Border / focus | `--border-subtle`, `--border-strong`, `--border-focus`, `--ring` |
| Elevation | `--clay-shadow`, `--clay-shadow-hover`, `--clay-shadow-press` → `shadow-clay*` |
| Status | `--success`/`--success-bg`, `--warning`/`--warning-bg`, `--danger`/`--danger-bg`, `--info`/`--info-bg` |
| Control | `--input-bg`, `--input-border`, `--input-border-error`, `--tap-min` |

**Recipes (prefer over one-off classes):** `.clay-btn` / `.clay-btn-secondary` / `.clay-btn-ghost` (hover/active/disabled/focus-visible), `.clay-input` (hover/focus/disabled/`aria-invalid`), `.clay-card` / `.clay-panel` / `.clay-chip` / `.clay-nav`, `.gift-page` / `.gift-section` / `.gift-stack*`, `.gift-banner--success|warning|danger|info`, type: `.gift-display` / `.gift-h1` / `.gift-h2` / `.gift-body` / `.gift-muted` / `.gift-overline`. Homepage polish (Soft Gift–interpreted, not third-party clone): `.gift-band--blush|mint|sky|lavender|soft`, `.gift-doodle`, `.gift-toys` (faded corner SVGs), `.gift-wave-card` (recipient/category cards only), `.gift-pill-overlap`, `.gift-usp`. Avoid `100vw` full-bleed (scrollbar overflow).

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

  --radius-card: 1.5rem;
  --radius-panel: 1rem;
  --radius-pill: 9999px;
  --radius: 1rem;

  --shadow-brand: 0 8px 30px rgba(255, 107, 157, 0.18);
  --shadow-soft: 0 10px 40px rgba(45, 38, 64, 0.08);
  --shadow-card: 0 4px 20px rgba(45, 38, 64, 0.06);

  --glass-bg: rgba(255, 255, 255, 0.85);
  --glass-blur: 20px;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;

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

#### Type scale recipes

| Level | Recipe |
|---|---|
| Display / H1 hero | `font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#2D2640] leading-[1.1]` |
| H2 section | `font-serif text-2xl sm:text-3xl font-medium tracking-tight text-[#2D2640]` |
| H3 card | `font-sans text-lg sm:text-xl font-semibold text-[#2D2640]` |
| Body | `font-sans text-base text-[#3C3352] leading-relaxed` |
| Small | `font-sans text-sm text-[#3C3352]` |
| Overline/label | `font-sans text-xs uppercase tracking-[0.15em] font-bold text-[#FF6B9D]` |

Line length for reading: aim ~60–75ch on article pages.

### 4.6 Shape, elevation, glass

| Token | Value |
|---|---|
| Card radius | `rounded-2xl` / `rounded-3xl` |
| Pill controls | `rounded-full` |
| Shadows | ambient soft / pink-tint brand shadow |
| Sticky chrome | `bg-white/85 backdrop-blur-xl` |

### 4.7 Spacing & layout

- Prefer `--space-*` / Tailwind `gs-*` only inside Soft Gift (no raw `p-5` / `px-6` mixes)
- Page chrome: `.gift-page` (token padding) or `.gift-section` / `.gift-stack`
- Mobile feeds: 1 col or dense 2 col
- Desktop catalogs: 3–4 col / bento
- Premium = generous whitespace (favor `gs-6`–`gs-8` between sections)

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

#### Blog public

- Same System A fonts/colors
- Thumbnails often 16:9
- Trust-first; article body not aggressive sales chrome

#### Commerce admin (A-family dense)

- Same tokens/fonts
- Flatter tables
- Less playful motion
- Still no generic blue SaaS defaults

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
| Blog index / article | Editorial readability |

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
- Blog 16:9
- Hero full-bleed

Reference intents: hero hamper, lifestyle baby, essentials, wooden toys, mom care, nursery.

No abstract purple gradient heroes.

---

## 5. System B — Earthy Editorial (Creator Collective)

### 5.1 Personality

Organic · earthy · luxurious · editorial.  
Premium influencer marketplace for parenting brands.  
Light mode preferred; dark mode = deep green editorial.

### 5.2 Color tokens (HSL)

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

### 5.3 Typography (System B)

| Role | Font |
|---|---|
| Headings | Playfair Display |
| Body/UI | Manrope |

Cues:

- Large editorial H1 `text-5xl md:text-6xl`
- Uppercase labels `tracking-[0.2em]`
- Never Inter/Roboto

### 5.4 Layout modes

| Mode | Use | Pattern |
|---|---|---|
| Tetris grid | Marketing | 12-col asymmetric, large negative space, overlap text/image; `py-24 px-6 md:px-12 max-w-7xl` |
| High density | Dashboards | 3–4 col, subtle borders, flat, minimal shadow |

### 5.5 Surfaces & controls

- Header glass `backdrop-blur-xl bg-background/80`
- Marketing surfaces: flat + 1px border, hover lift, `p-8`
- Dashboard: `bg-muted/30`, subtle border
- Optional paper grain
- Marketing CTA pills `rounded-full`
- Dashboard utilities `rounded-md`
- Marketing layouts: composition-first Tailwind, not card spam
- shadcn for forms/modals/selects/calendars customized to B
- Marketing/signup inputs may be underline (`border-b-2 rounded-none`); dashboard solid muted

### 5.6 Motion (System B)

1. Marketing staggered fade-up
2. Dashboard ~150ms transitions
3. Subtle parallax on key imagery when it helps hierarchy

### 5.7 Page inventory (System B)

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

### 5.8 Component inventory (System B)

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

### 5.9 Imagery (System B)

Mother/newborn trust, creator lifestyle, filming creators, pediatric trust (where relevant), wooden product campaigns. Prefer curated references over random stock abstraction.

---

## 6. Shared Interaction Grammar

Across A and B, keep consistent interaction meaning:

Buttons · Forms · Tables · Filters · Pagination · Search · Toasts · Loading · Empty · Error · Confirm dialogs

Users must not relearn basic grammar when switching modules.

### 6.1 States

| State | Pattern |
|---|---|
| Loading | Skeletons for grids; stable layout |
| Empty | One message + one action |
| Validation | Inline field errors |
| Transient | Toast |
| Blocking | Page message + recovery |
| Success | Quiet confirmation |

Never expose stack traces.

### 6.2 Forms

- Labels visible
- Errors tied to fields
- Disable double submit on payment/proposal/checkout
- Show pending
- Required indicators accessible

### 6.3 Navigation

- Clarity over feature quantity
- Role-appropriate admin nav
- Persist user location cues (breadcrumbs in dense admin)

---

## 7. Theming architecture

```text
app/(gift)/layout.tsx      → data-theme="gift"
app/(blog)/layout.tsx      → data-theme="gift"
app/(creator)/layout.tsx   → data-theme="creator"
app/(admin)/commerce/...   → gift dense
app/(admin)/editorial/...  → gift dense or editorial-dense variant
app/(admin)/creator/...    → creator dense
```

Theme switching is structural, not per-component random.

---

## 8. Accessibility (WCAG-minded)

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

## 9. Content & tone

- Trust over aggressive selling
- Education before promotion on blog
- Premium calm; avoid fake urgency spam
- No emoji-as-icon language
- Indian parenting context: respectful, inclusive, non-judgmental

Microcopy examples (A): “Add to box”, “Remaining budget”, “Personalise this gift”  
Microcopy examples (B): “Submit proposal”, “Campaign marketplace”, “Deliverable approved”

---

## 10. Testing attributes

Critical interactive nodes require `data-testid` kebab-case.

Examples (A): `add-to-box-btn`, `summary-panel`, `budget-remaining`, `checkout-pay-btn`  
Examples (B): `submit-proposal-btn`, `campaign-card`, `select-creator-btn`

---

## 11. Design QA checklist (merge gate)

- [ ] Correct theme (A vs B)
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

---

## 12. Anti-patterns

1. Mixing A/B tokens
2. Treating specialists as creators in UI IA
3. Purple glow AI SaaS heroes
4. Applying cream+terracotta serif cluster onto Soft Gift by mistake
5. Broadsheet dense newspaper default
6. Unstyled sharp shadcn gray on Gift surfaces
7. Emoji icons
8. Decorative card grids with no job
9. Hero overlay sticker spam
10. Inventing a third uncontrolled palette
11. Dashboard widgets jammed into first marketing viewport
12. Inset tiny hero cards where full-bleed brand hero is required

---

## 13. AI instructions

1. Identify System A or B before styling
2. Use only that system’s tokens/fonts/layout mode
3. Prefer existing primitives
4. Obey first-viewport rules on marketing pages
5. Include a11y + test IDs
6. Do not “improve” by blending systems
7. If a new surface lacks guidance, propose options and wait

---

## 14. Phase application

| Phases | Design focus |
|---|---|
| 0–1 | token plumbing + shells |
| 2–5 | System A excellence |
| 6–7 | System A editorial readability + admin dense |
| 8 | System B scoped theme introduction |
| 9 | a11y/perf visual regressions |

---

## 15. Evolution

Token/font/component contract changes require:

1. Design approval
2. Eng acknowledgment
3. `Design.md` version bump
4. `Memory.md` decision entry
5. Theme regression pass on both systems if shared primitives change

---

**End of Design.md v2.0.0**
