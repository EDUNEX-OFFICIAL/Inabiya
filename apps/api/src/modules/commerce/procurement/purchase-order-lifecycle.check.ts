import assert from 'node:assert/strict';
import { canTransitionPurchaseOrder } from './purchase-order-lifecycle';

assert.equal(canTransitionPurchaseOrder('DRAFT', 'ORDERED'), true);
assert.equal(canTransitionPurchaseOrder('DRAFT', 'CANCELLED'), true);
assert.equal(canTransitionPurchaseOrder('DRAFT', 'RECEIVED'), false);
assert.equal(canTransitionPurchaseOrder('ORDERED', 'RECEIVED'), true);
assert.equal(canTransitionPurchaseOrder('ORDERED', 'CANCELLED'), true);
assert.equal(canTransitionPurchaseOrder('RECEIVED', 'CANCELLED'), false);
assert.equal(canTransitionPurchaseOrder('CANCELLED', 'ORDERED'), false);

console.log('purchase-order-lifecycle.check: ok');
