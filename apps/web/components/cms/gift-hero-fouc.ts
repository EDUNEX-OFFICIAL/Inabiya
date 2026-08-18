/** Critical FOUC CSS — safe for server layout (no GSAP import).
 * Never hide LCP photo/frame (opacity:0 delays Largest Contentful Paint). */
export const GIFT_HERO_FOUC_CSS = `
.gift-hero-split:not([data-hero-ready]) [data-hero-anim],
.gift-hero-split:not([data-hero-ready]) [data-hero-cta],
.gift-hero-split:not([data-hero-ready]) .gift-hero-split__wash {
  opacity: 0 !important;
  visibility: hidden !important;
}
[data-gift-reveal]:not([data-reveal-ready]) {
  opacity: 0 !important;
  visibility: hidden !important;
}
[data-testid='category-carousel']:not([data-carousel-ready]) [data-carousel-intro],
[data-testid='category-carousel']:not([data-carousel-ready]) [data-carousel-controls] {
  opacity: 0 !important;
  visibility: hidden !important;
}
@media (prefers-reduced-motion: reduce) {
  .gift-hero-split:not([data-hero-ready]) [data-hero-anim],
  .gift-hero-split:not([data-hero-ready]) [data-hero-cta],
  .gift-hero-split:not([data-hero-ready]) .gift-hero-split__wash {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [data-gift-reveal]:not([data-reveal-ready]) {
    opacity: 1 !important;
    visibility: visible !important;
  }
  [data-testid='category-carousel']:not([data-carousel-ready]) [data-carousel-intro],
  [data-testid='category-carousel']:not([data-carousel-ready]) [data-carousel-controls] {
    opacity: 1 !important;
    visibility: visible !important;
  }
}
`.trim();
