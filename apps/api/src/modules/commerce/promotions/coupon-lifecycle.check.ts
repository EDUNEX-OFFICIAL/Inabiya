import assert from 'node:assert/strict';
import {
  computeDiscountPaise,
  couponLayer,
  couponLifecycle,
  eligibleSubtotalPaise,
  formatCouponLabel,
  matchingQtyFromLines,
  nestedDiscountPaise,
  scopeMatchingLines,
} from './coupon-lifecycle';
import {
  eligibilitySatisfied,
  lineMatchesRules,
  parseCouponEligibility,
  parseCouponMatchRules,
} from './coupon-conditions';

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
assert.equal(
  computeDiscountPaise({ subtotalPaise: 10_000, discountPercent: 50, maxDiscountPaise: 2_000 }),
  2_000,
);

const lines = [
  { productId: 'p1', collectionIds: ['c1'], lineTotalPaise: 2000, quantity: 1 },
  { productId: 'p2', collectionIds: ['c2', 'c3'], lineTotalPaise: 3000, quantity: 2 },
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

const girlLine = {
  productId: 'g1',
  collectionIds: [],
  lineTotalPaise: 4000,
  quantity: 1,
  recipientTags: ['girl'],
  onSale: false,
  title: 'Pink hamper',
  brandName: 'Mushie',
  isReadyMadeHamper: true,
};
const boySale = {
  productId: 'b1',
  collectionIds: [],
  lineTotalPaise: 1500,
  quantity: 1,
  recipientTags: ['boy'],
  onSale: true,
  title: 'Blue rattle',
  brandName: 'Other',
  isReadyMadeHamper: false,
};

const matchGirl = parseCouponMatchRules({
  match: 'all',
  conditions: [{ field: 'recipient', op: 'is', value: 'girl' }],
});
assert.ok(matchGirl);
assert.equal(lineMatchesRules(girlLine, matchGirl), true);
assert.equal(lineMatchesRules(boySale, matchGirl), false);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'MATCHING',
    productIds: [],
    collectionIds: [],
    cartSubtotalPaise: 5500,
    lines: [girlLine, boySale],
    matchRules: matchGirl,
  }),
  4000,
);
assert.equal(
  eligibleSubtotalPaise({
    scope: 'MATCHING',
    productIds: [],
    collectionIds: [],
    cartSubtotalPaise: 5500,
    lines: null,
    matchRules: matchGirl,
  }),
  0,
);

const matchSaleOff = parseCouponMatchRules({
  match: 'all',
  conditions: [
    { field: 'onSale', op: 'is_not', value: 'yes' },
    { field: 'brand', op: 'contains', value: 'mush' },
  ],
});
assert.ok(matchSaleOff);
assert.equal(lineMatchesRules(girlLine, matchSaleOff), true);
assert.equal(lineMatchesRules(boySale, matchSaleOff), false);

const matched = scopeMatchingLines({
  scope: 'CART',
  productIds: [],
  collectionIds: [],
  lines: [girlLine, boySale],
});
assert.equal(matchingQtyFromLines(matched), 2);

const qtyRules = parseCouponEligibility({
  match: 'all',
  conditions: [{ field: 'cartQty', op: 'gte', value: '2' }],
});
assert.equal(
  eligibilitySatisfied(qtyRules, {
    cartQty: 2,
    matchingQty: 1,
    eligibleSubtotalPaise: 4000,
    paidOrderCount: 0,
  }),
  true,
);
assert.equal(
  eligibilitySatisfied(qtyRules, {
    cartQty: 1,
    matchingQty: 1,
    eligibleSubtotalPaise: 4000,
    paidOrderCount: 0,
  }),
  false,
);

const firstOrder = parseCouponEligibility({
  match: 'all',
  conditions: [{ field: 'firstOrder', op: 'is', value: 'yes' }],
});
assert.equal(
  eligibilitySatisfied(firstOrder, {
    cartQty: 1,
    matchingQty: 1,
    eligibleSubtotalPaise: 4000,
    paidOrderCount: 0,
  }),
  true,
);
assert.equal(
  eligibilitySatisfied(firstOrder, {
    cartQty: 1,
    matchingQty: 1,
    eligibleSubtotalPaise: 4000,
    paidOrderCount: 2,
  }),
  false,
);

const shipExpress = parseCouponEligibility({
  match: 'all',
  conditions: [{ field: 'shippingMethod', op: 'is', value: 'EXPRESS' }],
});
assert.equal(
  eligibilitySatisfied(shipExpress, {
    cartQty: 1,
    matchingQty: 1,
    eligibleSubtotalPaise: 4000,
    paidOrderCount: 0,
    shippingMethod: null,
  }),
  true,
);
assert.equal(
  eligibilitySatisfied(shipExpress, {
    cartQty: 1,
    matchingQty: 1,
    eligibleSubtotalPaise: 4000,
    paidOrderCount: 0,
    shippingMethod: 'STANDARD',
  }),
  false,
);

const anyRules = parseCouponEligibility({
  match: 'any',
  conditions: [
    { field: 'firstOrder', op: 'is', value: 'yes' },
    { field: 'cartQty', op: 'gte', value: '5' },
  ],
});
assert.equal(
  eligibilitySatisfied(anyRules, {
    cartQty: 1,
    matchingQty: 1,
    eligibleSubtotalPaise: 100,
    paidOrderCount: 0,
  }),
  true,
);

assert.equal(couponLayer('CART'), 'cart');
assert.equal(couponLayer('MATCHING'), 'line');
assert.equal(formatCouponLabel('GIRL10', 'FLAT100'), 'GIRL10 + FLAT100');
assert.equal(formatCouponLabel(null, 'WELCOME10'), 'WELCOME10');
assert.equal(nestedDiscountPaise(2800_00, 200_00, 100_00), 300_00);
assert.equal(nestedDiscountPaise(500, 400, 200), 500);

console.log('coupon-lifecycle.check: ok');
