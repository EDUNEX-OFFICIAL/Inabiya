/**
 * Run: npx tsx apps/web/lib/consent.check.ts
 */
import assert from 'node:assert/strict';
import { consentDefaultPayload, marketingConsentGranted, parseConsentValue } from './consent';

assert.equal(parseConsentValue('all'), 'all');
assert.equal(parseConsentValue('necessary'), 'necessary');
assert.equal(parseConsentValue('granted'), null);
assert.equal(parseConsentValue(''), null);
assert.equal(parseConsentValue(undefined), null);
assert.equal(marketingConsentGranted('all'), true);
assert.equal(marketingConsentGranted('necessary'), false);
assert.equal(marketingConsentGranted(null), false);
assert.equal(consentDefaultPayload('all').ad_storage, 'granted');
assert.equal(consentDefaultPayload(null).ad_storage, 'denied');
assert.equal(consentDefaultPayload('necessary').analytics_storage, 'denied');

console.log('consent.check: ok');
