import assert from 'node:assert/strict';
import { tryAtomicReserve } from './inventory-reserve-atomic';

const lastUnit = { onHand: 1, reserved: 0 };
assert.equal(tryAtomicReserve(lastUnit, 1), true);
assert.equal(tryAtomicReserve(lastUnit, 1), false);
assert.equal(lastUnit.reserved, 1);

const shared = { onHand: 1, reserved: 0 };
const raced = [tryAtomicReserve(shared, 1), tryAtomicReserve(shared, 1)];
assert.equal(raced.filter(Boolean).length, 1);
assert.equal(shared.reserved, 1);

console.log('inventory-reserve.check: ok');
