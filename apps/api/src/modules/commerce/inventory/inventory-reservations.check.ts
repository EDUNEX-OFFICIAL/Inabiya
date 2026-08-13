import assert from 'node:assert/strict';
import { HOLD_ORDER_STATUSES, isHoldOrderStatus, sumHoldQuantity } from './inventory-reservations';

assert.deepEqual([...HOLD_ORDER_STATUSES], ['PENDING_PAYMENT']);
assert.equal(isHoldOrderStatus('PENDING_PAYMENT'), true);
assert.equal(isHoldOrderStatus('PAID'), false);
assert.equal(isHoldOrderStatus('PROCESSING'), false);
assert.equal(sumHoldQuantity([{ quantity: 2 }, { quantity: 3 }]), 5);
assert.equal(sumHoldQuantity([]), 0);

console.log('inventory-reservations.check: ok');
