import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { matchesRazorpaySignature } from './razorpay-signature';

const secret = 'test-secret';
const payload = 'order_test|pay_test';
const signature = createHmac('sha256', secret).update(payload).digest('hex');

assert.equal(matchesRazorpaySignature(payload, signature, secret), true);
assert.equal(matchesRazorpaySignature(payload, '0'.repeat(64), secret), false);
