/**
 * Cart personalization vs catalog options.
 * Run: npx tsx apps/api/src/modules/commerce/cart/assert-cart-personalization.check.ts
 */
import assert from 'node:assert/strict';
import { assertCartPersonalization } from './assert-cart-personalization';

const opts = [
  {
    key: 'babyName',
    label: 'Baby name',
    type: 'TEXT',
    maxLength: 24,
    options: null,
    required: true,
  },
  {
    key: 'wrapColor',
    label: 'Wrap color',
    type: 'SELECT',
    maxLength: null,
    options: ['Pink', 'Blue'],
    required: false,
  },
];

assert.throws(() => assertCartPersonalization(opts, {}), /fill in Baby name/);
assert.throws(() => assertCartPersonalization(opts, { babyName: 'x'.repeat(30) }), /24 characters/);
assert.throws(
  () => assertCartPersonalization(opts, { babyName: 'Ayaan', wrapColor: 'Green' }),
  /Invalid choice/,
);
assert.throws(
  () => assertCartPersonalization(opts, { babyName: 'Ayaan', unknown: 'x' }),
  /Unknown personalization/,
);

const ok = assertCartPersonalization(opts, { babyName: 'Ayaan', wrapColor: 'Pink' });
assert.deepEqual(ok, { babyName: 'Ayaan', wrapColor: 'Pink' });

console.log('assert-cart-personalization.check ok');
