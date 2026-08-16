/**
 * Stable gift-line fingerprints.
 * Run: npx tsx apps/api/src/modules/commerce/cart/gift-line-fingerprint.check.ts
 */
import assert from 'node:assert/strict';
import { giftExtrasUnitPaise, giftLineFingerprint } from './gift-line-fingerprint';

const a = giftLineFingerprint(
  { babyName: 'Ayaan' },
  {
    note: { label: 'Gift note', value: 'Happy birthday', pricePaise: 0 },
    wrap: { id: 'signature-wrap', label: 'Signature', pricePaise: 9900 },
  },
);
const b = giftLineFingerprint(
  { babyName: 'Ayaan' },
  {
    wrap: { pricePaise: 9900, label: 'Signature', id: 'signature-wrap' },
    note: { pricePaise: 0, value: 'Happy birthday', label: 'Gift note' },
  },
);
assert.equal(a, b);

const c = giftLineFingerprint(
  { babyName: 'Ayaan' },
  {
    note: { label: 'Gift note', value: 'Different', pricePaise: 0 },
    wrap: { id: 'signature-wrap', label: 'Signature', pricePaise: 9900 },
  },
);
assert.notEqual(a, c);

assert.equal(
  giftExtrasUnitPaise({
    note: { pricePaise: 100 },
    wrap: { pricePaise: 200 },
    ribbon: { pricePaise: 50 },
  }),
  350,
);
assert.equal(giftExtrasUnitPaise({ note: { pricePaise: -5 as unknown as number } }), 0);

console.log('gift-line-fingerprint.check ok');
