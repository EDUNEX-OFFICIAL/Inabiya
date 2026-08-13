import assert from 'node:assert/strict';
import { computeDiscountPaise, couponLifecycle, eligibleSubtotalPaise } from './coupon-lifecycle';

const now = new Date('2026-07-29T12:00:00Z');

assert.equal(
  couponLifecycle(
    { active: false, startsAt: null, expiresAt: null, maxUses: null, usedCount: 0 },
    now,
  ),
  'off',
);
assert.equal(
  couponLifecycle(
    {
      active: true,
      startsAt: '2026-08-01T00:00:00Z',
      expiresAt: null,
      maxUses: null,
      usedCount: 0,
    },
    now,
  ),
  'scheduled',
);
assert.equal(
  couponLifecycle(
    {
      active: true,
      startsAt: null,
      expiresAt: '2026-07-01T00:00:00Z',
      maxUses: null,
      usedCount: 0,
    },
    now,
  ),
  'expired',
);
assert.equal(
  couponLifecycle({ active: true, startsAt: null, expiresAt: null, maxUses: 5, usedCount: 5 }, now),
  'exhausted',
);
assert.equal(
  couponLifecycle({ active: true, startsAt: null, expiresAt: null, maxUses: 5, usedCount: 1 }, now),
  'active',
);

assert.equal(computeDiscountPaise({ subtotalPaise: 10_000, discountPercent: 10 }), 1_000);
assert.equal(computeDiscountPaise({ subtotalPaise: 500, discountPaise: 900 }), 500);

const lines = [
  { productId: 'p1', collectionIds: ['c1'], lineTotalPaise: 2000 },
  { productId: 'p2', collectionIds: ['c2', 'c3'], lineTotalPaise: 3000 },
];

assert.equal(
  eligibleSubtotalPaise({
    scope: 'CART',
    productIds: [],
    collectionIds: [],
    cartSubtotalPaise: 5000,
    lines,
  }),
  5000,
);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'PRODUCT',
    productIds: ['p2'],
    collectionIds: [],
    cartSubtotalPaise: 5000,
    lines,
  }),
  3000,
);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'COLLECTION',
    productIds: [],
    collectionIds: ['c1'],
    cartSubtotalPaise: 5000,
    lines,
  }),
  2000,
);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'PRODUCT',
    productIds: ['p9'],
    collectionIds: [],
    cartSubtotalPaise: 5000,
    lines,
  }),
  0,
);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'PRODUCT',
    productIds: ['p1'],
    collectionIds: [],
    cartSubtotalPaise: 5000,
    lines: null,
  }),
  5000,
);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'COLLECTION',
    productIds: [],
    collectionIds: ['c1'],
    cartSubtotalPaise: 5000,
    lines: [],
  }),
  0,
);

console.log('coupon-lifecycle.check: ok');
