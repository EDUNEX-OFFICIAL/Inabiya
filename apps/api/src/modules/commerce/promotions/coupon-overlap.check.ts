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
  false,
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
assert.equal(
  scopesCollide(
    { scope: 'MATCHING', productIds: [], collectionIds: [] },
    { scope: 'PRODUCT', productIds: ['a'], collectionIds: [] },
  ),
  true,
);
assert.equal(
  scopesCollide(
    { scope: 'MATCHING', productIds: [], collectionIds: [] },
    { scope: 'MATCHING', productIds: [], collectionIds: [] },
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

const firstOrder: CouponConflictSlice = {
  ...cartA,
  id: '4',
  code: 'WELCOME',
  eligibility: {
    match: 'all',
    conditions: [{ field: 'firstOrder', op: 'is', value: 'yes' }],
  },
};
const returning: CouponConflictSlice = {
  ...cartB,
  id: '5',
  code: 'LOYAL',
  eligibility: {
    match: 'all',
    conditions: [{ field: 'returningCustomer', op: 'is', value: 'yes' }],
  },
};
assert.equal(couponsConflict(firstOrder, returning, now), false);
assert.equal(couponsConflict(firstOrder, cartB, now), true);

const expressOnly: CouponConflictSlice = {
  ...cartA,
  id: '6',
  code: 'FAST',
  eligibility: {
    match: 'all',
    conditions: [{ field: 'shippingMethod', op: 'is', value: 'EXPRESS' }],
  },
};
const standardOnly: CouponConflictSlice = {
  ...cartB,
  id: '7',
  code: 'SLOW',
  eligibility: {
    match: 'all',
    conditions: [{ field: 'shippingMethod', op: 'is', value: 'STANDARD' }],
  },
};
assert.equal(couponsConflict(expressOnly, standardOnly, now), false);

const hamperYes: CouponConflictSlice = {
  ...base,
  id: '8',
  code: 'HAMPER',
  scope: 'MATCHING',
  matchRules: {
    match: 'all',
    conditions: [{ field: 'hamper', op: 'is', value: 'yes' }],
  },
};
const hamperNo: CouponConflictSlice = {
  ...base,
  id: '9',
  code: 'NOTHAMP',
  scope: 'MATCHING',
  matchRules: {
    match: 'all',
    conditions: [{ field: 'hamper', op: 'is', value: 'no' }],
  },
};
assert.equal(couponsConflict(hamperYes, hamperNo, now), false);
assert.equal(couponsConflict(hamperYes, cartA, now), false);

const highMin: CouponConflictSlice = {
  ...cartA,
  id: '10',
  code: 'BIG',
  minSubtotalPaise: 10_000,
};
const lowCap: CouponConflictSlice = {
  ...cartB,
  id: '11',
  code: 'SMALL',
  eligibility: {
    match: 'all',
    conditions: [{ field: 'maxSubtotalPaise', op: 'lte', value: '5000' }],
  },
};
assert.equal(couponsConflict(highMin, lowCap, now), false);

const off = { ...cartB, id: '3', code: 'OFF', active: false };
assert.equal(couponsConflict(cartA, off, now), false);

const map = buildConflictCodesById([cartA, cartB], now);
assert.deepEqual(map.get('1'), ['SAVE20']);
assert.deepEqual(map.get('2'), ['SAVE10']);

console.log('coupon-overlap.check: ok');
