/**
 * Run: npx tsx apps/web/lib/catalog-categories.check.ts
 */
import assert from 'node:assert/strict';
import {
  categoryPlpHref,
  categorySlugFromHref,
  isCategoryPlpHref,
  mergeShopLinksWithCategories,
  resolveCatalogCategoryChips,
} from './catalog-categories';

assert.equal(categoryPlpHref('bath-skin'), '/gift/products?category=bath-skin');
assert.equal(isCategoryPlpHref('/gift/products?category=toys'), true);
assert.equal(isCategoryPlpHref('/gift/build-your-box'), false);
assert.equal(categorySlugFromHref('/gift/products?category=mom-care'), 'mom-care');

const merged = mergeShopLinksWithCategories(
  [
    { href: '/gift/build-your-box', label: 'Build Your Box' },
    { href: '/gift/products?category=clothing', label: 'Old Clothing' },
    { href: '/gift/collections/ready-hampers', label: 'Hampers' },
  ],
  [
    { slug: 'nursery', name: 'Nursery' },
    { slug: 'toys', name: 'Toys' },
  ],
);
assert.deepEqual(
  merged.map((l) => l.href),
  [
    '/gift/build-your-box',
    '/gift/collections/ready-hampers',
    '/gift/products?category=nursery',
    '/gift/products?category=toys',
  ],
);

const chips = resolveCatalogCategoryChips(
  [{ slug: 'clothing', name: 'Clothing' }],
  [{ href: '/gift/products?category=clothing', imageUrl: '/img.jpg', imageAlt: 'Clothes' }],
);
assert.equal(chips[0]?.imageUrl, '/img.jpg');
assert.equal(chips[0]?.label, 'Clothing');

console.log('catalog-categories.check.ts: ok');
