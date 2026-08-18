/**
 * Run: npx tsx apps/web/lib/tracking-ids.check.ts
 */
import assert from 'node:assert/strict';
import { paiseToInrString } from './analytics';

assert.equal(paiseToInrString(0), '0.00');
assert.equal(paiseToInrString(1), '0.01');
assert.equal(paiseToInrString(99), '0.99');
assert.equal(paiseToInrString(100), '1.00');
assert.equal(paiseToInrString(12345), '123.45');
assert.equal(paiseToInrString(-250), '-2.50');

console.log('tracking-ids.check: ok');
