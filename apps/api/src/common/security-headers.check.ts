import assert from 'node:assert/strict';
import { shouldNoStore } from './security-headers.middleware';

assert.equal(shouldNoStore('/api/v1/health'), false);
assert.equal(shouldNoStore('/api/v1/ready'), false);
assert.equal(shouldNoStore('/api/v1/cart'), true);
assert.equal(shouldNoStore('/api/v1/media/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/content'), false);
assert.equal(shouldNoStore('/media/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/content'), false);
assert.equal(shouldNoStore('/api/v1/media/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'), true);

console.log('security-headers.check: ok');
