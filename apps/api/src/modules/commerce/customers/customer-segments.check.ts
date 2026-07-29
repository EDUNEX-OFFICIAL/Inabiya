import assert from 'node:assert/strict';
import { customerSegments } from './customer-segments';

assert.deepEqual(customerSegments({ isActive: true, orderCount: 0, ltvPaise: 0 }), ['new']);
assert.deepEqual(customerSegments({ isActive: false, orderCount: 1, ltvPaise: 100 }), [
  'suspended',
]);
assert.ok(
  customerSegments({ isActive: true, orderCount: 3, ltvPaise: 50_000 }).includes('repeat_buyer'),
);
assert.ok(
  customerSegments({ isActive: true, orderCount: 2, ltvPaise: 1_000_000 }).includes('high_value'),
);

console.log('customer-segments.check: ok');
