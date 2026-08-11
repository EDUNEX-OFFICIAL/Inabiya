import assert from 'node:assert/strict';
import {
  buildConflictCodesById,
  couponsConflict,
  schedulesOverlap,
  scopesCollide,
} from './coupon-overlap';
import type { CouponConflictSlice } from './coupon-overlap';

const base = {
  active: true,
  startsAt: null,
  expiresAt: null,
  maxUses: null,
  usedCount: 0,
  productIds: [] as string[],
  collectionIds: [] as string[],
};

assert.equal(
  schedulesOverlap(
    { startsAt: '2026-01-01', expiresAt: '2026-01-31' },
    { startsAt: '2026-01-15', expiresAt: '2026-02-15' },
  ),
  true,
);
assert.equal(
  schedulesOverlap(
    { startsAt: '2026-01-01', expiresAt: '2026-01-10' },
    { startsAt: '2026-01-11', expiresAt: '2026-01-20' },
  ),
  false,
);

assert.equal(
  scopesCollide(
    { scope: 'CART', productIds: [], collectionIds: [] },
    { scope: 'PRODUCT', productIds: ['p1'], collectionIds: [] },
  ),
  true,
);
assert.equal(
  scopesCollide(
    { scope: 'PRODUCT', productIds: ['a'], collectionIds: [] },
    { scope: 'PRODUCT', productIds: ['b'], collectionIds: [] },
  ),
  false,
);
assert.equal(
  scopesCollide(
    { scope: 'PRODUCT', productIds: ['a', 'b'], collectionIds: [] },
    { scope: 'PRODUCT', productIds: ['b'], collectionIds: [] },
  ),
  true,
);
assert.equal(
  scopesCollide(
    { scope: 'PRODUCT', productIds: ['a'], collectionIds: [] },
    { scope: 'COLLECTION', productIds: [], collectionIds: ['c1'] },
  ),
  true,
);

const now = new Date('2026-08-11T12:00:00Z');
const cartA: CouponConflictSlice = {
  ...base,
  id: '1',
  code: 'SAVE10',
  scope: 'CART',
};
const cartB: CouponConflictSlice = {
  ...base,
  id: '2',
  code: 'SAVE20',
  scope: 'CART',
};
assert.equal(couponsConflict(cartA, cartB, now), true);

const off = { ...cartB, id: '3', code: 'OFF', active: false };
assert.equal(couponsConflict(cartA, off, now), false);

const map = buildConflictCodesById([cartA, cartB], now);
assert.deepEqual(map.get('1'), ['SAVE20']);
assert.deepEqual(map.get('2'), ['SAVE10']);

console.log('coupon-overlap.check: ok');
