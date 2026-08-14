import assert from 'node:assert/strict';
import { clientIpFromRequest } from './rate-limit.guard';

assert.equal(
  clientIpFromRequest({
    headers: { 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '10.0.0.9' },
    ip: '127.0.0.1',
  }),
  '10.0.0.9',
);
assert.equal(
  clientIpFromRequest({
    headers: { 'x-forwarded-for': '9.9.9.9' },
    ip: '127.0.0.1',
  }),
  '127.0.0.1',
);
assert.equal(
  clientIpFromRequest({
    headers: { 'x-real-ip': ' 8.8.8.8, 1.1.1.1 ' },
    ip: '127.0.0.1',
  }),
  '8.8.8.8',
);

console.log('rate-limit-ip.check: ok');
