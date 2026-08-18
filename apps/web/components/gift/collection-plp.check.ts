/**
 * Collection PLP: nested filter scroll + custom sort (no native <select>).
 * Run: npx tsx apps/web/components/gift/collection-plp.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filters = readFileSync(join(__dirname, 'collection-filters.tsx'), 'utf8');
assert.match(filters, /data-lenis-prevent/);
assert.match(filters, /gift-facet-scroll/);
assert.match(filters, /overscroll-contain/);
assert.match(filters, /onToggle=/);
assert.match(filters, /useState\(defaultOpen\)/);
assert.match(filters, /facetKey/);
assert.match(filters, />\s*Apply\s*</);
assert.match(filters, /disabled=\{!dirty\}/);
assert.doesNotMatch(filters, /apply immediately/);

const toolbar = readFileSync(join(__dirname, 'collection-results-toolbar.tsx'), 'utf8');
assert.match(toolbar, /GiftSelect/);
assert.doesNotMatch(toolbar, /<select[\s>]/);

const lenis = readFileSync(join(__dirname, 'gift-lenis-inner.tsx'), 'utf8');
assert.match(lenis, /allowNestedScroll:\s*true/);

const lenisShell = readFileSync(join(__dirname, 'gift-lenis.tsx'), 'utf8');
assert.match(lenisShell, /GiftLenisBoot/);
assert.doesNotMatch(lenisShell, /<Inner>\{children\}<\/Inner>/);

const nav = readFileSync(join(__dirname, '../gift-nav.tsx'), 'utf8');
assert.match(nav, /GiftNavQuerySync/);
assert.match(nav, /useLayoutEffect/);

const hero = readFileSync(join(__dirname, '../cms/gift-storefront-hero.tsx'), 'utf8');
assert.match(hero, /enteredSrc/);

const homeMotion = readFileSync(join(__dirname, '../cms/gift-home-motion.tsx'), 'utf8');
assert.match(homeMotion, /data-reveal-ready/);
assert.match(homeMotion, /gsap\.to/);
assert.doesNotMatch(homeMotion, /gsap\.from\(/);

const carousel = readFileSync(join(__dirname, 'category-carousel.tsx'), 'utf8');
assert.match(carousel, /data-carousel-ready/);
assert.match(carousel, /parseCmsCarouselCards/);

const parseCards = readFileSync(join(__dirname, 'parse-cms-carousel-cards.ts'), 'utf8');
assert.match(parseCards, /export function parseCmsCarouselCards/);
assert.doesNotMatch(parseCards, /['"]use client['"]/);

const cmsBlocks = readFileSync(join(__dirname, '../cms/marketing-page-blocks.tsx'), 'utf8');
assert.match(cmsBlocks, /type === 'featuredCarousel'/);
assert.doesNotMatch(cmsBlocks, /<CategoryCarousel\s*\/>/);

const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');
assert.doesNotMatch(css, /\[data-theme='gift'\] \*::-webkit-scrollbar/);
assert.match(css, /\[data-theme='gift'\] \.gift-facet-scroll/);
assert.match(css, /data-reveal-ready/);
assert.match(css, /data-carousel-ready/);

const giftSelect = readFileSync(join(__dirname, 'gift-select.tsx'), 'utf8');
assert.match(giftSelect, /role="listbox"/);
assert.match(giftSelect, /aria-haspopup="listbox"/);
assert.match(giftSelect, /createPortal/);
assert.match(giftSelect, /--z-overlay/);

const collPage = readFileSync(
  join(__dirname, '../../app/(gift)/collections/[slug]/page.tsx'),
  'utf8',
);
assert.match(collPage, /md:hidden[\s\S]*priority/);
assert.match(collPage, /hidden w-\[42%\] md:block[\s\S]*eager/);
assert.equal((collPage.match(/^\s+priority$/gm) ?? []).length, 1);

const fouc = readFileSync(join(__dirname, '../../app/(gift)/gift-hero-fouc.css'), 'utf8');
assert.doesNotMatch(fouc, /gift-hero-split__photo/);
assert.doesNotMatch(fouc, /gift-hero-split__frame/);

console.log('collection-plp.check.ts ok');
