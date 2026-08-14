import assert from 'node:assert/strict';
import { CSRF_HEADER_VALUE, csrfHeaderOk } from './csrf-header.interceptor';

assert.equal(csrfHeaderOk({ method: 'GET', path: '/api/v1/auth/me', bearerAuth: false }), true);
assert.equal(
  csrfHeaderOk({
    method: 'POST',
    path: '/api/v1/auth/login',
    headerValue: CSRF_HEADER_VALUE,
    bearerAuth: false,
  }),
  true,
);
assert.equal(
  csrfHeaderOk({ method: 'POST', path: '/api/v1/auth/login', bearerAuth: false }),
  false,
);
assert.equal(
  csrfHeaderOk({
    method: 'POST',
    path: '/api/v1/webhooks/payments/mock',
    bearerAuth: false,
  }),
  true,
);
assert.equal(csrfHeaderOk({ method: 'POST', path: '/api/v1/cart/items', bearerAuth: true }), true);

console.log('csrf-header.check: ok');
