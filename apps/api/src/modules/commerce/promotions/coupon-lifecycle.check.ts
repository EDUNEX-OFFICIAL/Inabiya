import assert from 'node:assert/strict';
import { computeDiscountPaise, couponLifecycle } from './coupon-lifecycle';

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
  couponLifecycle(
    { active: true, startsAt: null, expiresAt: null, maxUses: 5, usedCount: 5 },
    now,
  ),
  'exhausted',
);
assert.equal(
  couponLifecycle(
    { active: true, startsAt: null, expiresAt: null, maxUses: 5, usedCount: 1 },
    now,
  ),
  'active',
);

assert.equal(computeDiscountPaise({ subtotalPaise: 10_000, discountPercent: 10 }), 1_000);
assert.equal(computeDiscountPaise({ subtotalPaise: 500, discountPaise: 900 }), 500);

console.log('coupon-lifecycle.check: ok');
