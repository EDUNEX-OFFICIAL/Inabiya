import assert from 'node:assert/strict';
import {
  adminOrderKeysetAfter,
  decodeAdminOrderCursor,
  encodeAdminOrderCursor,
} from './admin-orders-cursor';

const id = '550e8400-e29b-41d4-a716-446655440000';
const createdAt = new Date('2026-08-01T10:00:00.000Z');
const token = encodeAdminOrderCursor({ createdAt, id });
const round = decodeAdminOrderCursor(token);
assert.equal(round.id, id);
assert.equal(round.createdAt.toISOString(), createdAt.toISOString());
assert.throws(() => decodeAdminOrderCursor('not-a-cursor'), /INVALID_CURSOR/);

const keyset = adminOrderKeysetAfter(round);
assert.ok(Array.isArray(keyset.OR));
assert.equal(keyset.OR.length, 2);

console.log('admin-orders-cursor.check.ts: ok');
