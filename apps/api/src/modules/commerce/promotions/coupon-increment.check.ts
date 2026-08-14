import assert from 'node:assert/strict';

/** Models `UPDATE coupons SET used_count = used_count + 1 WHERE max_uses IS NULL OR used_count < max_uses`. */
export function tryIncrementCouponUsage(row: {
  usedCount: number;
  maxUses: number | null;
}): boolean {
  if (row.maxUses != null && row.usedCount >= row.maxUses) return false;
  row.usedCount += 1;
  return true;
}

const limited = { usedCount: 2, maxUses: 3 };
assert.equal(tryIncrementCouponUsage(limited), true);
assert.equal(tryIncrementCouponUsage(limited), false);
assert.equal(limited.usedCount, 3);

const open = { usedCount: 99, maxUses: null };
assert.equal(tryIncrementCouponUsage(open), true);
assert.equal(open.usedCount, 100);

console.log('coupon-increment.check: ok');
