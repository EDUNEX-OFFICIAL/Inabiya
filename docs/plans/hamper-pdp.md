# Plan — Hamper vs Normal PDP

**Override:** Soft Gift merchandising / PDP outside Phase 12 (logged in Memory).

## Goal

Ready-made hampers are still one cart SKU, but the **product page** tells a bundle story: item count, what’s inside, individual retail prices, savings, video, richer SEO — while normal products keep a simpler PDP. Gallery + video + SEO sections are **shared**.

## Architecture

- Route stays `/gift/products/[slug]`.
- Branch UI on `isReadyMadeHamper`.
- Cart/checkout unchanged (single variant).
- Hamper “contents” = display BOM (`ProductHamperItem`), not separate cart lines (v1).

## Data model

1. `ProductHamperItem` — title, blurb?, brandName?, imageUrl?, qty, unitPricePaise, sortOrder
2. `ProductMedia.kind` — IMAGE | VIDEO; optional `posterUrl`
3. `Product.seoSections` Json — `[{ heading, bodyText }]`

Server maps: `hamperItemCount`, `contentsValuePaise`, `hamperSavingsPaise = max(0, contentsValue − fromPrice)`, `brandNames` (unique item brands, else product brand).

## UI

| Surface | Behavior |
|---|---|
| Shared gallery | Images + video play with poster |
| Shared SEO | `seoSections` below About |
| Hamper buy box | Contents summary, SAVE pill, What’s Inside grid, Buy / Build Your Box bar |
| Normal | Existing buy box + highlights |
| PLP / cards | Item count left · merch labels right (no overlap); thumbs + modal “What’s inside” (no card stretch) |

## Admin

Product edit: hamper items editor (when ready-made), media kind/poster, SEO sections JSON/fields.

## Ship slices

A Schema + Zod + catalog map · B Admin · C Shared gallery/SEO · D Hamper PDP + seed · E Memory

## Out of scope (v1)

Linked SKU BOM / multi-line inventory · theme mixing · client float money
