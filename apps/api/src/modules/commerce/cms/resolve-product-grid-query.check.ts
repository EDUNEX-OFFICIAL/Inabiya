import assert from 'node:assert/strict';
import { parseProductGridResolution } from './resolve-product-grid-query';

const now = new Date('2026-07-28T12:00:00Z');

// Backward compat: slugs without source → manual
const legacy = parseProductGridResolution(
  { productSlugs: ['a', 'b'], limit: 4, title: 'Picks' },
  now,
);
assert.equal(legacy.source, 'manual');
assert.equal(legacy.mode, 'slugs');
assert.deepEqual(legacy.slugs, ['a', 'b']);
assert.equal(legacy.limit, 4);
assert.equal(legacy.title, 'Picks');

// bestsellers
const best = parseProductGridResolution(
  { source: 'bestsellers', limit: 8, seeAllHref: '/gift/products' },
  now,
);
assert.equal(best.source, 'bestsellers');
assert.equal(best.mode, 'query');
assert.equal(best.query.storefrontLabel, 'BESTSELLER');
assert.equal(best.limit, 8);

// editors
const eds = parseProductGridResolution({ source: 'editors' }, now);
assert.equal(eds.query.storefrontLabel, 'EDITORS_PICK');

// on_sale
const sale = parseProductGridResolution({ source: 'on_sale', category: 'toys' }, now);
assert.equal(sale.query.onSale, true);
assert.equal(sale.query.category, 'toys');

// new — 30-day window from now
const neu = parseProductGridResolution({ source: 'new', newWithinDays: 14 }, now);
assert.equal(neu.source, 'new');
assert.equal(neu.newWithinDays, 14);
assert.ok(neu.query.publishedSince instanceof Date);
assert.equal(
  neu.query.publishedSince!.toISOString(),
  new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
);

// auto + hamper default limit 3
const hamper = parseProductGridResolution({ hamper: true }, now);
assert.equal(hamper.source, 'auto');
assert.equal(hamper.mode, 'query');
assert.equal(hamper.query.hamper, '1');
assert.equal(hamper.limit, 3);

// manual empty slugs → slug mode empty
const emptyManual = parseProductGridResolution({ source: 'manual' }, now);
assert.equal(emptyManual.mode, 'slugs');
assert.deepEqual(emptyManual.slugs, []);

console.log('resolve-product-grid-query.check.ts: ok');
