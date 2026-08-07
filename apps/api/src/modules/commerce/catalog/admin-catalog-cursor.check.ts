import assert from 'node:assert/strict';
import {
  adminProductKeysetAfter,
  createdKeysetAfter,
  decodeAdminProductCursor,
  decodeCreatedCursor,
  decodePriceCursor,
  decodeTitleCursor,
  encodeAdminListCursor,
  encodeAdminProductCursor,
  priceRankAfter,
  titleKeysetAfter,
} from './admin-catalog-cursor';

const id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const id2 = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
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

const titleTok = encodeAdminListCursor('title_asc', { id, title: 'Alpha Gift' });
const titleCur = decodeTitleCursor('title_asc', titleTok);
assert.equal(titleCur.title, 'Alpha Gift');
assert.equal(titleCur.id, id);
const titleAfter = titleKeysetAfter('title_asc', titleCur);
assert.deepEqual(titleAfter.OR[0], { title: { gt: 'Alpha Gift' } });

const createdAt = new Date('2026-08-01T00:00:00.000Z');
const createdTok = encodeAdminListCursor('created', { id, createdAt });
const createdCur = decodeCreatedCursor(createdTok);
assert.equal(createdCur.id, id);
assert.deepEqual(createdKeysetAfter(createdCur).OR[0], { createdAt: { lt: createdAt } });

const priceTok = encodeAdminListCursor('price_asc', { id, fromPricePaise: 149900 });
const priceCur = decodePriceCursor('price_asc', priceTok);
assert.equal(priceCur.pricePaise, 149900);

const ranked = priceRankAfter(
  'price_asc',
  [
    { id, fromPricePaise: 149900 },
    { id: id2, fromPricePaise: 199900 },
  ],
  priceCur,
);
assert.equal(ranked.length, 1);
assert.equal(ranked[0]?.id, id2);

console.log('admin-catalog-cursor.check.ts: ok');
