import assert from 'node:assert/strict';
import {
  adminCouponKeysetAfter,
  decodeAdminCouponCursor,
  encodeAdminCouponCursor,
} from './admin-coupons-cursor';

const createdAt = new Date('2026-08-08T10:00:00.000Z');
const id = '11111111-1111-4111-8111-111111111111';
const token = encodeAdminCouponCursor({ createdAt, id });
const round = decodeAdminCouponCursor(token);
assert.equal(round.id, id);
assert.equal(round.createdAt.toISOString(), createdAt.toISOString());

const after = adminCouponKeysetAfter(round);
assert.ok(Array.isArray(after.OR) && after.OR.length === 2);

assert.throws(() => decodeAdminCouponCursor('not-a-cursor'), /INVALID_CURSOR/);

console.log('admin-coupons-cursor.check: ok');
