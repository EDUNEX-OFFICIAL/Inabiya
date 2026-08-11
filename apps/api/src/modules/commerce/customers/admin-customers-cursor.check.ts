import assert from 'node:assert/strict';
import {
  adminCustomerKeysetAfter,
  decodeAdminCustomerCursor,
  encodeAdminCustomerCursor,
} from './admin-customers-cursor';

const id = '11111111-1111-4111-8111-111111111111';
const createdAt = new Date('2026-08-11T10:00:00.000Z');
const token = encodeAdminCustomerCursor({ createdAt, id });
const decoded = decodeAdminCustomerCursor(token);
assert.equal(decoded.id, id);
assert.equal(decoded.createdAt.toISOString(), createdAt.toISOString());

const clause = adminCustomerKeysetAfter(decoded);
assert.ok(Array.isArray(clause.OR));
assert.equal(clause.OR.length, 2);

console.log('admin-customers-cursor.check: ok');
