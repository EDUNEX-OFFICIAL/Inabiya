/**
 * Media library URL helpers.
 * Run: npx tsx apps/web/lib/media-url.check.ts
 */
import assert from 'node:assert/strict';
import {
  isMediaLibraryUrl,
  mediaVariantUrl,
  parseMediaAssetId,
  variantFromSizes,
} from './media-url';

const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const src = `/api/v1/media/${id}/content`;

assert.equal(parseMediaAssetId(src), id);
assert.equal(parseMediaAssetId(`${src}?v=web`), id);
assert.equal(parseMediaAssetId('https://images.unsplash.com/photo-x'), null);
assert.equal(isMediaLibraryUrl(src), true);
assert.equal(mediaVariantUrl(src, 'web'), `${src}?v=web`);
assert.equal(mediaVariantUrl(src, 'thumb'), `${src}?v=thumb`);
assert.equal(variantFromSizes('32px'), 'thumb');
assert.equal(variantFromSizes('80px'), 'thumb');
assert.equal(variantFromSizes('(max-width: 1024px) 100vw, 50vw'), 'web');

console.log('media-url.check ok');
