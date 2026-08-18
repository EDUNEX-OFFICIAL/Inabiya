/**
 * Run: npx tsx packages/validation/src/google-tracking.check.ts
 */
import assert from 'node:assert/strict';
import { googleTrackingBodySchema, normalizeGoogleTracking } from './google-tracking';

assert.equal(
  googleTrackingBodySchema.parse({ gtmContainerId: 'gtm-abc12' }).gtmContainerId,
  'GTM-ABC12',
);
assert.equal(
  googleTrackingBodySchema.parse({ ga4MeasurementId: 'g-xyz9' }).ga4MeasurementId,
  'G-XYZ9',
);
assert.equal(googleTrackingBodySchema.parse({ googleAdsId: 'aw-123456' }).googleAdsId, 'AW-123456');
assert.equal(
  googleTrackingBodySchema.parse({ googleSiteVerification: 'Ab_cd-EF12' }).googleSiteVerification,
  'Ab_cd-EF12',
);
assert.equal(googleTrackingBodySchema.parse({ gtmContainerId: '' }).gtmContainerId, undefined);
assert.equal(googleTrackingBodySchema.parse({ gtmContainerId: '  ' }).gtmContainerId, undefined);

assert.throws(() => googleTrackingBodySchema.parse({ gtmContainerId: 'GTM-' }));
assert.throws(() => googleTrackingBodySchema.parse({ ga4MeasurementId: 'UA-123' }));
assert.throws(() => googleTrackingBodySchema.parse({ googleAdsId: 'AW-abc' }));
assert.throws(() => googleTrackingBodySchema.parse({ googleSiteVerification: 'short' }));
assert.equal(
  googleTrackingBodySchema.parse({ metaPixelId: '1234567890' }).metaPixelId,
  '1234567890',
);
assert.throws(() => googleTrackingBodySchema.parse({ metaPixelId: 'GTM-X' }));
assert.throws(() => googleTrackingBodySchema.parse({ metaPixelId: '12' }));

const cleared = normalizeGoogleTracking({
  gtmContainerId: '',
  ga4MeasurementId: 'G-OKAY1',
  googleAdsId: null,
});
assert.deepEqual(cleared, { ga4MeasurementId: 'G-OKAY1' });
assert.deepEqual(normalizeGoogleTracking({ gtmContainerId: 'not-valid' }), {});

console.log('google-tracking.check: ok');
