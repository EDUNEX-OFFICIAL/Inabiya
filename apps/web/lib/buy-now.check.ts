/**
 * Buy Now PDP → checkout path.
 * Run: npx tsx apps/web/lib/buy-now.check.ts
 */
import assert from 'node:assert/strict';
import { buyNowCartItems, buyNowCheckoutPath, parseBuyNowVariantId } from './buy-now';

const id = '11111111-1111-4111-8111-111111111111';
const itemId = '22222222-2222-4222-8222-222222222222';
assert.equal(parseBuyNowVariantId(id), id);
assert.equal(parseBuyNowVariantId(` ${id} `), id);
assert.equal(parseBuyNowVariantId('nope'), undefined);
assert.equal(parseBuyNowVariantId(''), undefined);
assert.equal(buyNowCheckoutPath(id), `/checkout?buyNow=${id}`);
assert.equal(buyNowCheckoutPath(id, itemId), `/checkout?buyNow=${id}&buyNowItem=${itemId}`);
assert.deepEqual(
  buyNowCartItems(
    [
      { id: 'a', variantId: id },
      { id: 'b', variantId: 'other' },
    ],
    id,
  ),
  [{ id: 'a', variantId: id }],
);
assert.deepEqual(
  buyNowCartItems(
    [
      { id: 'a', variantId: id },
      { id: 'b', variantId: id },
    ],
    id,
    'b',
  ),
  [{ id: 'b', variantId: id }],
);
assert.deepEqual(buyNowCartItems([{ variantId: id }], undefined), [{ variantId: id }]);

console.log('buy-now.check ok');
