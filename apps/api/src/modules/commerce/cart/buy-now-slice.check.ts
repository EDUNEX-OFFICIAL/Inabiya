/**
 * Buy Now checkout slice.
 * Run: npx tsx apps/api/src/modules/commerce/cart/buy-now-slice.check.ts
 */
import assert from 'node:assert/strict';
import { convertCartAfterBuyNow, selectBuyNowItems } from './buy-now-slice';

const cart = [
  { id: 'line-1', variantId: 'aaa', quantity: 2 },
  { id: 'line-2', variantId: 'aaa', quantity: 1 },
  { id: 'line-3', variantId: 'bbb', quantity: 1 },
];

assert.deepEqual(selectBuyNowItems(cart, undefined), cart);
assert.deepEqual(selectBuyNowItems(cart, 'bbb'), [{ id: 'line-3', variantId: 'bbb', quantity: 1 }]);
assert.deepEqual(selectBuyNowItems(cart, 'aaa'), [
  { id: 'line-1', variantId: 'aaa', quantity: 2 },
  { id: 'line-2', variantId: 'aaa', quantity: 1 },
]);
assert.deepEqual(selectBuyNowItems(cart, 'aaa', 'line-2'), [
  { id: 'line-2', variantId: 'aaa', quantity: 1 },
]);
assert.deepEqual(selectBuyNowItems(cart, 'zzz'), []);
assert.equal(convertCartAfterBuyNow(0), true);
assert.equal(convertCartAfterBuyNow(1), false);

console.log('buy-now-slice.check ok');
