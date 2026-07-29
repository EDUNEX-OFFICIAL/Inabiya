import assert from 'node:assert/strict';
import {
  adminProductKeysetAfter,
  decodeAdminProductCursor,
  encodeAdminProductCursor,
} from './admin-catalog-cursor';

const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const updatedAt = new Date('2026-07-29T12:00:00.000Z');

const token = encodeAdminProductCursor({ updatedAt, id });
assert.ok(token.length > 10);
assert.doesNotMatch(token, /[+/=]/);

const round = decodeAdminProductCursor(token);
assert.equal(round.id, id);
assert.equal(round.updatedAt.toISOString(), updatedAt.toISOString());

assert.throws(() => decodeAdminProductCursor('not-a-cursor'), /INVALID_CURSOR/);
assert.throws(() => decodeAdminProductCursor(Buffer.from('bad').toString('base64url')), /INVALID_CURSOR/);

const keyset = adminProductKeysetAfter(round);
assert.equal(keyset.OR.length, 2);
assert.deepEqual(keyset.OR[0], { updatedAt: { lt: updatedAt } });
assert.deepEqual(keyset.OR[1], {
  AND: [{ updatedAt }, { id: { lt: id } }],
});

console.log('admin-catalog-cursor.check.ts: ok');
