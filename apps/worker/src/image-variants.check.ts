/**
 * Sharp web/thumb/lqip pipeline.
 * Run: npx tsx apps/worker/src/image-variants.check.ts
 */
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {
  BLUR_MAX_CHARS,
  THUMB_MAX_PX,
  WEB_MAX_PX,
  buildImageVariants,
  shouldSkipVariants,
  variantStorageKey,
} from './image-variants';

assert.equal(shouldSkipVariants('image/gif'), true);
assert.equal(shouldSkipVariants('image/svg+xml'), true);
assert.equal(shouldSkipVariants('application/pdf'), true);
assert.equal(shouldSkipVariants('image/jpeg'), false);
assert.equal(variantStorageKey('media/2026-08-18/abc.jpg', 'web'), 'media/2026-08-18/abc-web.webp');

async function main() {
  const png = await sharp({
    create: { width: 2000, height: 1000, channels: 3, background: { r: 200, g: 80, b: 120 } },
  })
    .png()
    .toBuffer();

  const built = await buildImageVariants(png);
  assert.equal(built.width, 2000);
  assert.equal(built.height, 1000);
  const webMeta = await sharp(built.web).metadata();
  assert.ok((webMeta.width ?? 0) <= WEB_MAX_PX);
  assert.equal(webMeta.format, 'webp');
  const thumbMeta = await sharp(built.thumb).metadata();
  assert.ok((thumbMeta.width ?? 0) <= THUMB_MAX_PX);
  assert.equal(thumbMeta.format, 'webp');
  assert.ok(built.blurDataUrl?.startsWith('data:image/jpeg;base64,'));
  assert.ok((built.blurDataUrl?.length ?? 0) <= BLUR_MAX_CHARS);
  assert.ok(built.web.length < png.length);
  console.log('image-variants.check ok');
}

void main();
