/**
 * PDP gallery: autoplay + swipe (desktop drag / mobile swipe).
 * Run: npx tsx apps/web/components/gift/pdp-gallery.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { realIndex } from './pdp-gallery-math';

assert.equal(realIndex(0, 3, true), 2);
assert.equal(realIndex(1, 3, true), 0);
assert.equal(realIndex(2, 3, true), 1);
assert.equal(realIndex(3, 3, true), 2);
assert.equal(realIndex(4, 3, true), 0);
assert.equal(realIndex(0, 1, false), 0);

const src = readFileSync(join(__dirname, 'pdp-gallery.tsx'), 'utf8');
assert.match(src, /AUTO_MS = 4500/);
assert.match(src, /prefers-reduced-motion/);
assert.match(src, /onPointerDown/);
assert.match(src, /data-lenis-prevent/);
assert.match(src, /touch-pan-y/);
assert.match(src, /ArrowLeft/);
assert.match(src, /ArrowRight/);
assert.match(src, /GiftImage/);

const cfg = readFileSync(join(__dirname, '../../next.config.js'), 'utf8');
assert.match(cfg, /formats:\s*\[\s*'image\/avif',\s*'image\/webp'\s*\]/);
assert.match(cfg, /minimumCacheTTL/);

console.log('pdp-gallery.check ok');
