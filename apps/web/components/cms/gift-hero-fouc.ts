/** Critical FOUC CSS — safe for server layout (no GSAP import). */
export const GIFT_HERO_FOUC_CSS = `
.gift-hero-split:not([data-hero-ready]) [data-hero-anim],
.gift-hero-split:not([data-hero-ready]) [data-hero-cta],
.gift-hero-split:not([data-hero-ready]) .gift-hero-split__frame,
.gift-hero-split:not([data-hero-ready]) .gift-hero-split__wash {
  opacity: 0 !important;
  visibility: hidden !important;
}
@media (prefers-reduced-motion: reduce) {
  .gift-hero-split:not([data-hero-ready]) [data-hero-anim],
  .gift-hero-split:not([data-hero-ready]) [data-hero-cta],
  .gift-hero-split:not([data-hero-ready]) .gift-hero-split__frame,
  .gift-hero-split:not([data-hero-ready]) .gift-hero-split__wash {
    opacity: 1 !important;
    visibility: visible !important;
  }
}
`.trim();
