/**
 * Run: npx tsx apps/web/lib/seo-json-ld/collection-page.check.ts
 */
import assert from 'node:assert/strict';
import { collectionPageJsonLd } from './collection-page';

const page = collectionPageJsonLd({
  name: 'Gifts for baby girl',
  description: 'Blush picks',
  slug: 'for-baby-girl',
  siteOrigin: 'https://inabiya.edunexservices.in',
  imageUrl: '/gift/media/baby-girl-soft.jpg',
  products: [
    { name: 'Blush Bunny Plush', slug: 'blush-bunny-plush' },
    { name: 'Cloud Soft Swaddle', slug: 'cloud-soft-swaddle' },
  ],
});

assert.equal(page['@type'], 'CollectionPage');
assert.equal(page.url, 'https://inabiya.edunexservices.in/collections/for-baby-girl');
const main = page.mainEntity as {
  '@type': string;
  numberOfItems: number;
  itemListElement: unknown[];
};
assert.equal(main['@type'], 'ItemList');
assert.equal(main.numberOfItems, 2);
assert.equal(main.itemListElement.length, 2);

console.log('collection-page.check.ts: ok');
