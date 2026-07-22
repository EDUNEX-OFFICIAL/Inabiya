import assert from 'node:assert/strict';
import {
  percentOff,
  pickLabelAnchorVariant,
  resolveStorefrontDisplayLabels,
} from './storefront-display-labels';

assert.equal(percentOff(250000, 500000), 50);
assert.equal(percentOff(249900, 499800), 50);
assert.equal(percentOff(100, 100), null);
assert.equal(percentOff(200, 100), null);

const variants = [
  { pricePaise: 300000, compareAtPricePaise: null, available: 0 },
  { pricePaise: 200000, compareAtPricePaise: 400000, available: 3 },
  { pricePaise: 100000, compareAtPricePaise: null, available: 0 },
];
const anchor = pickLabelAnchorVariant(variants);
assert.equal(anchor?.pricePaise, 200000);

const now = new Date('2026-07-22T12:00:00Z');
const labels = resolveStorefrontDisplayLabels({
  publishedAt: new Date('2026-07-10T12:00:00Z'),
  storefrontLabels: ['BESTSELLER', 'GIFT_SET', 'SALE', 'NEW'],
  variants: [{ pricePaise: 249900, compareAtPricePaise: 499800, available: 3 }],
  now,
});
assert.deepEqual(
  labels.map((l) => l.code),
  ['PCT_OFF', 'LOW_STOCK'],
);
assert.equal(labels[0]?.text, '50% off');

const manualsOnly = resolveStorefrontDisplayLabels({
  publishedAt: new Date('2025-01-01T00:00:00Z'),
  storefrontLabels: ['EDITORS_PICK', 'GIFT_SET'],
  variants: [{ pricePaise: 100000, compareAtPricePaise: null, available: 20 }],
  now,
});
assert.deepEqual(
  manualsOnly.map((l) => ({ code: l.code, text: l.text })),
  [
    { code: 'EDITORS_PICK', text: "Editor's pick" },
    { code: 'GIFT_SET', text: 'Gift set' },
  ],
);

const newOnly = resolveStorefrontDisplayLabels({
  publishedAt: new Date('2026-07-20T00:00:00Z'),
  storefrontLabels: [],
  variants: [{ pricePaise: 100000, compareAtPricePaise: null, available: 10 }],
  now,
});
assert.deepEqual(
  newOnly.map((l) => l.code),
  ['NEW'],
);

console.log('storefront-display-labels.check.ts: ok');
