/**
 * Buy Now PDP → checkout path.
 * Run: npx tsx apps/web/lib/buy-now.check.ts
 */
import assert from 'node:assert/strict';
import { buyNowCartItems, buyNowCheckoutPath, parseBuyNowVariantId } from './buy-now';

const id = '11111111-1111-4111-8111-111111111111';
assert.equal(parseBuyNowVariantId(id), id);
assert.equal(parseBuyNowVariantId(` ${id} `), id);
assert.equal(parseBuyNowVariantId('nope'), undefined);
assert.equal(parseBuyNowVariantId(''), undefined);
assert.equal(buyNowCheckoutPath(id), `/checkout?buyNow=${id}`);
assert.deepEqual(buyNowCartItems([{ variantId: id }, { variantId: 'other' }], id), [
  { variantId: id },
]);
assert.deepEqual(buyNowCartItems([{ variantId: id }], undefined), [{ variantId: id }]);

console.log('buy-now.check ok');
