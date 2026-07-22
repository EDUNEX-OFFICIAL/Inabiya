import assert from 'node:assert/strict';
import { validateMediaUpload, MAX_MEDIA_BYTES } from './media-mime';

assert.equal(validateMediaUpload('image/png', 100).ok, true);
assert.equal(validateMediaUpload('application/pdf', 1024).ok, true);
assert.equal(validateMediaUpload('image/svg+xml', 100).ok, false);
assert.equal(validateMediaUpload('application/x-msdownload', 100).ok, false);
assert.equal(validateMediaUpload('image/jpeg', 0).ok, false);
assert.equal(validateMediaUpload('image/jpeg', MAX_MEDIA_BYTES + 1).ok, false);
assert.equal((validateMediaUpload('text/html', 10) as { code: string }).code, 'MEDIA_MIME_REJECTED');

console.log('media-mime checks ok');
