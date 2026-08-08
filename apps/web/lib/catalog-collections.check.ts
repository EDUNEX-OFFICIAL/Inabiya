/**
 * Run: npx tsx apps/web/lib/catalog-collections.check.ts
 */
import assert from 'node:assert/strict';
import {
  collectionPlpHref,
  collectionSlugFromHref,
  isCollectionHref,
  mergeShopLinksWithCollections,
  resolveCatalogCollectionChips,
} from './catalog-collections';

assert.equal(collectionPlpHref('for-baby-girl'), '/gift/collections/for-baby-girl');
assert.ok(isCollectionHref('/gift/collections/newborn'));
assert.equal(collectionSlugFromHref('/gift/collections/ready-hampers'), 'ready-hampers');

const merged = mergeShopLinksWithCollections(
  [{ href: '/gift/products?category=toys', label: 'Toys' }],
  [{ slug: 'bestsellers', title: 'Best sellers' }],
);
assert.ok(merged.some((l) => l.href.includes('/gift/collections/bestsellers')));
assert.ok(!merged.some((l) => l.href.includes('category=')));

const chips = resolveCatalogCollectionChips(
  [{ slug: 'newborn', title: 'Newborn essentials' }],
  [{ href: '/gift/collections/newborn', imageUrl: '/x.jpg', imageAlt: 'N' }],
);
assert.equal(chips[0]?.label, 'Newborn essentials');
assert.equal(chips[0]?.imageUrl, '/x.jpg');

console.log('catalog-collections.check.ts: ok');
