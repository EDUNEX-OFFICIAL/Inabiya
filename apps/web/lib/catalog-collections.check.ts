/**
 * Run: npx tsx apps/web/lib/catalog-collections.check.ts
 */
import assert from 'node:assert/strict';
import {
  collectionPlpHref,
  collectionSlugFromHref,
  HOME_COLLECTION_GRID_LIMIT,
  isCollectionHref,
  mergeShopLinksWithCollections,
  parseHomeCollectionLimit,
  resolveCatalogCollectionChips,
} from './catalog-collections';

assert.equal(collectionPlpHref('for-baby-girl'), '/collections/for-baby-girl');
assert.ok(isCollectionHref('/collections/newborn'));
assert.equal(collectionSlugFromHref('/collections/ready-hampers'), 'ready-hampers');

const merged = mergeShopLinksWithCollections(
  [{ href: '/products?category=toys', label: 'Toys' }],
  [{ slug: 'bestsellers', title: 'Best sellers' }],
);
assert.ok(merged.some((l) => l.href.includes('/collections/bestsellers')));
assert.ok(!merged.some((l) => l.href.includes('category=')));

const chips = resolveCatalogCollectionChips(
  [
    { slug: 'on-sale', title: 'On sale', sortOrder: 16 },
    { slug: 'newborn', title: 'Newborn essentials', sortOrder: 9, description: 'First weeks.' },
    { slug: 'for-baby-girl', title: 'Gifts for baby girl', sortOrder: 1 },
  ],
  [{ href: '/collections/newborn', imageUrl: '/x.jpg', imageAlt: 'N' }],
);
assert.equal(chips[0]?.label, 'Gifts for baby girl');
assert.equal(chips[1]?.imageUrl, '/x.jpg');
assert.equal(chips[1]?.description, 'First weeks.');
assert.equal(chips.slice(0, HOME_COLLECTION_GRID_LIMIT).length, 3);
assert.equal(parseHomeCollectionLimit(undefined), 4);
assert.equal(parseHomeCollectionLimit('8'), 8);
assert.equal(parseHomeCollectionLimit(0), 4);
assert.equal(parseHomeCollectionLimit(99), 12);

console.log('catalog-collections.check.ts: ok');
