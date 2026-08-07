import gsap from 'gsap';

/** Critical FOUC CSS — inline in hero so first paint hides before globals.css. */
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

type HeroEntranceEls = {
  wash?: Element | null;
  frame?: Element | null;
  early?: Element | null; // eyebrow / brand
  title?: Element | null;
  body?: Element | null;
  primary?: Element | null;
  secondary?: Element | null;
  trust?: Element | null;
};

/** Hide → ready → fade/slide in. Call from useGSAP; return cleanup. */
export function runGiftHeroEntrance(root: HTMLElement, els: HeroEntranceEls): () => void {
  const targets = root.querySelectorAll(
    '[data-hero-anim], [data-hero-cta], .gift-hero-split__frame, .gift-hero-split__wash',
  );

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    if (targets.length) gsap.set(targets, { clearProps: 'all' });
    root.setAttribute('data-hero-ready', '');
    return () => root.removeAttribute('data-hero-ready');
  }

  const { wash, frame, early, title, body, primary, secondary, trust } = els;

  if (wash) gsap.set(wash, { opacity: 0, visibility: 'visible' });
  if (frame) gsap.set(frame, { opacity: 0, visibility: 'visible', y: 22, scale: 1.03 });
  if (early) gsap.set(early, { opacity: 0, visibility: 'visible', y: 10 });
  if (title) gsap.set(title, { opacity: 0, visibility: 'visible', y: 28 });
  if (body) gsap.set(body, { opacity: 0, visibility: 'visible', y: 16 });
  if (primary) gsap.set(primary, { opacity: 0, visibility: 'visible', y: 14 });
  if (secondary) gsap.set(secondary, { opacity: 0, visibility: 'visible', y: 12 });
  if (trust) gsap.set(trust, { opacity: 0, visibility: 'visible', y: 10 });

  // Unlock CSS !important only after GSAP owns inline opacity:0
  root.setAttribute('data-hero-ready', '');

  const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  const fadeClear = 'opacity,visibility,transform';

  if (wash) tl.to(wash, { opacity: 1, duration: 1.1, clearProps: 'opacity,visibility' }, 0);
  if (frame) tl.to(frame, { opacity: 1, y: 0, scale: 1, duration: 1.2, clearProps: fadeClear }, 0.15);
  if (early) tl.to(early, { opacity: 1, y: 0, duration: 0.7, clearProps: fadeClear }, 0.4);
  if (title) tl.to(title, { opacity: 1, y: 0, duration: 1.05, clearProps: fadeClear }, 0.55);
  if (body) tl.to(body, { opacity: 1, y: 0, duration: 0.85, clearProps: fadeClear }, 0.85);
  if (primary) tl.to(primary, { opacity: 1, y: 0, duration: 0.75, clearProps: fadeClear }, 1.1);
  if (secondary) tl.to(secondary, { opacity: 1, y: 0, duration: 0.7, clearProps: fadeClear }, 1.3);
  if (trust) tl.to(trust, { opacity: 1, y: 0, duration: 0.7, clearProps: fadeClear }, 1.5);

  return () => {
    tl.kill();
    root.removeAttribute('data-hero-ready');
    if (targets.length) gsap.set(targets, { opacity: 0, visibility: 'hidden', clearProps: 'transform' });
  };
}
