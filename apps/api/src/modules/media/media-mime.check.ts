import assert from 'node:assert/strict';
import {
  validateMediaUpload,
  sniffMediaMime,
  sanitizeContentDispositionFilename,
  MAX_MEDIA_BYTES,
} from './media-mime';

assert.equal(validateMediaUpload('image/png', 100).ok, true);
assert.equal(validateMediaUpload('application/pdf', 1024).ok, true);
assert.equal(validateMediaUpload('image/svg+xml', 100).ok, false);
assert.equal(validateMediaUpload('image/avif', 100).ok, true);
assert.equal(validateMediaUpload('application/x-msdownload', 100).ok, false);
assert.equal(validateMediaUpload('image/jpeg', 0).ok, false);
assert.equal(validateMediaUpload('image/jpeg', MAX_MEDIA_BYTES + 1).ok, false);
assert.equal(
  (validateMediaUpload('text/html', 10) as { code: string }).code,
  'MEDIA_MIME_REJECTED',
);

const htmlAsJpeg = Buffer.from('<!DOCTYPE html><html><script>x</script></html>');
const mismatch = validateMediaUpload('image/jpeg', htmlAsJpeg.length, htmlAsJpeg);
assert.equal(mismatch.ok, false);
assert.equal((mismatch as { code: string }).code, 'MEDIA_MIME_MISMATCH');

const jpegMagic = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
assert.equal(sniffMediaMime(jpegMagic), 'image/jpeg');
assert.equal(validateMediaUpload('image/jpeg', jpegMagic.length, jpegMagic).ok, true);

assert.equal(sanitizeContentDispositionFilename('hi.png'), 'hi.png');
assert.equal(sanitizeContentDispositionFilename('a\r\nfilename="x".png'), 'afilename=x.png');

console.log('media-mime checks ok');
