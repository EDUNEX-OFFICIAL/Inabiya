import assert from 'node:assert/strict';
import {
  isAllowedStubCommunicationStatus,
  normalizeCommunicationTemplateKey,
} from './customer-communication';

assert.equal(normalizeCommunicationTemplateKey(' Order Confirm '), 'order_confirm');
assert.equal(normalizeCommunicationTemplateKey('SHIP.NOTICE'), 'ship.notice');
assert.equal(isAllowedStubCommunicationStatus('LOGGED'), true);
assert.equal(isAllowedStubCommunicationStatus('SKIPPED'), true);
assert.equal(isAllowedStubCommunicationStatus('SENT'), false);

console.log('customer-communication.check: ok');
