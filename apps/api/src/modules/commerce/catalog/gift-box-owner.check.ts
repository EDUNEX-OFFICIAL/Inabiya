import assert from 'node:assert/strict';
import { giftBoxAccessWhere, giftBoxOwnerWhere } from './gift-box-owner';

assert.deepEqual(giftBoxOwnerWhere({ userId: 'u1', guestToken: 'g1' }), { userId: 'u1' });
assert.deepEqual(giftBoxOwnerWhere({ guestToken: ' g1 ' }), { guestToken: 'g1' });
assert.equal(giftBoxOwnerWhere({}), null);
assert.equal(giftBoxOwnerWhere({ guestToken: '   ' }), null);
assert.equal(giftBoxOwnerWhere({ guestToken: 'x'.repeat(81) }), null);

assert.deepEqual(giftBoxAccessWhere('box', { userId: 'u1' }), { id: 'box', userId: 'u1' });
assert.deepEqual(giftBoxAccessWhere('box', { guestToken: 'g1' }), { id: 'box', guestToken: 'g1' });
assert.equal(giftBoxAccessWhere('box', {}), null);

console.log('gift-box-owner checks ok');
