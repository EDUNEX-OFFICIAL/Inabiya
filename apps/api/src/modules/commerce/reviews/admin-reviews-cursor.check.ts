import assert from 'node:assert/strict';
import {
  adminReviewKeysetAfter,
  decodeAdminReviewCursor,
  encodeAdminReviewCursor,
} from './admin-reviews-cursor';

const id = '11111111-1111-4111-8111-111111111111';
const createdAt = new Date('2026-08-11T10:00:00.000Z');
const token = encodeAdminReviewCursor({ createdAt, id });
const decoded = decodeAdminReviewCursor(token);
assert.equal(decoded.id, id);
assert.equal(decoded.createdAt.toISOString(), createdAt.toISOString());

const clause = adminReviewKeysetAfter(decoded);
assert.ok(Array.isArray(clause.OR));
assert.equal(clause.OR.length, 2);

assert.throws(() => decodeAdminReviewCursor('not-a-cursor'), /INVALID_CURSOR/);

console.log('admin-reviews-cursor.check: ok');
