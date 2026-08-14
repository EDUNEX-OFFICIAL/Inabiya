/**
 * Buy Now checkout slice.
 * Run: npx tsx apps/api/src/modules/commerce/cart/buy-now-slice.check.ts
 */
import assert from 'node:assert/strict';
import { convertCartAfterBuyNow, selectBuyNowItems } from './buy-now-slice';

const cart = [
  { variantId: 'aaa', quantity: 2 },
  { variantId: 'bbb', quantity: 1 },
];

assert.deepEqual(selectBuyNowItems(cart, undefined), cart);
assert.deepEqual(selectBuyNowItems(cart, 'bbb'), [{ variantId: 'bbb', quantity: 1 }]);
assert.deepEqual(selectBuyNowItems(cart, 'zzz'), []);
assert.equal(convertCartAfterBuyNow(0), true);
assert.equal(convertCartAfterBuyNow(1), false);

console.log('buy-now-slice.check ok');
