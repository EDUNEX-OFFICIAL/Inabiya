/**
 * Run: npx tsx apps/api/src/modules/media/media-url.check.ts
 */
import assert from 'node:assert/strict';
import { mediaVariantUrl, parseMediaAssetId, variantFromSizes } from './media-url';

const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
assert.equal(parseMediaAssetId(`/api/v1/media/${id}/content?v=web`), id);
assert.equal(mediaVariantUrl(`/api/v1/media/${id}/content`, 'thumb'), `/api/v1/media/${id}/content?v=thumb`);
assert.equal(variantFromSizes('80px'), 'thumb');
assert.equal(variantFromSizes('(max-width: 1024px) 100vw, 50vw'), 'web');

console.log('media-url.check ok');
