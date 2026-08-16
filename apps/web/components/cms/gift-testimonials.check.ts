/**
 * Dual-speed testimonials marquee — recycle offset + reduced-motion path.
 * Run: npx tsx apps/web/components/cms/gift-testimonials.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { shiftMarqueeOffset, TESTIMONIAL_MARQUEE_PX } from './gift-testimonial-marquee-offset';
import { resolveTestimonialDated } from './gift-testimonial-card';

assert.equal(TESTIMONIAL_MARQUEE_PX.fast > TESTIMONIAL_MARQUEE_PX.slow, true);
assert.equal(resolveTestimonialDated('Anaya', ''), '2026-07-18');
assert.equal(resolveTestimonialDated('Anaya', '2026-01-01'), '2026-01-01');
assert.equal(resolveTestimonialDated('Unknown', ''), '');

assert.deepEqual(shiftMarqueeOffset(10, 40), { offset: 10, shift: false });
assert.deepEqual(shiftMarqueeOffset(40, 40), { offset: 0, shift: true });
assert.deepEqual(shiftMarqueeOffset(55, 40), { offset: 15, shift: true });
assert.deepEqual(shiftMarqueeOffset(10, 0), { offset: 10, shift: false });

const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');
const start = css.indexOf("[data-theme='gift'] .gift-testimonials {");
assert.ok(start >= 0, 'gift-testimonials shell missing');
const end = css.indexOf("[data-theme='gift'] .gift-brand-strip {", start);
assert.ok(end > start, 'gift-testimonials block end missing');
const slice = css.slice(start, end);
assert.doesNotMatch(slice, /@keyframes gift-testimonials-marquee/);
assert.match(
  slice,
  /prefers-reduced-motion:\s*reduce[\s\S]*gift-testimonial-card--loop[\s\S]*display:\s*none/,
);
assert.doesNotMatch(slice, /#e8a317|#fff5f8|#f1faf5|#f1f7fb|#ffffff\b/);
assert.doesNotMatch(slice, /font-size:\s*(1\.05rem|0\.875rem|0\.75rem|3\.25rem)/);
assert.match(slice, /gift-testimonial-card__stars[\s\S]*color:\s*var\(--inabiya-yellow\)/);
assert.match(slice, /gift-testimonial-card__quote[\s\S]*font-size:\s*var\(--text-body\)/);
assert.match(slice, /gift-testimonial-card__author \{[\s\S]*font-size:\s*var\(--text-body\)/);
assert.match(slice, /gift-testimonial-card__role[\s\S]*font-size:\s*var\(--text-caption\)/);
assert.match(slice, /gift-testimonial-card__mark[\s\S]*font-size:\s*var\(--text-display\)/);

const tsx = readFileSync(join(__dirname, 'marketing-page-blocks.tsx'), 'utf8');
assert.match(tsx, /items\.length >= 4/);
assert.match(tsx, /i % 2 === 0/);
assert.match(
  tsx,
  /GiftTestimonialMarquee items=\{leftCol\} speed="slow"[\s\S]*GiftTestimonialMarquee items=\{rightCol\} speed="fast"/,
);
assert.match(tsx, /gift-testimonials__viewport--desktop/);
assert.match(tsx, /gift-testimonials__viewport--mobile/);

const marquee = readFileSync(join(__dirname, 'gift-testimonial-marquee.tsx'), 'utf8');
assert.match(marquee, /appendChild\(lead\)/);
assert.match(marquee, /shiftMarqueeOffset/);
assert.match(marquee, /loopCopy/);

const items = [0, 1, 2, 3, 4, 5, 6, 7];
const leftCol = items.filter((_, i) => i % 2 === 0);
const rightCol = items.filter((_, i) => i % 2 === 1);
assert.deepEqual(leftCol, [0, 2, 4, 6]);
assert.deepEqual(rightCol, [1, 3, 5, 7]);

console.log('gift-testimonials.check: ok');
