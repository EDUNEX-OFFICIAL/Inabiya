/**
 * Card gallery / hamper thumb overflow.
 * Run: npx tsx apps/web/components/gift/card-thumbs.check.ts
 */
import assert from 'node:assert/strict';
import { productCardImages, splitCardThumbs } from './card-thumbs';

assert.deepEqual(splitCardThumbs([]), { visible: [], more: 0 });
assert.deepEqual(splitCardThumbs(['a'], { hideIfSingle: true }), { visible: [], more: 0 });
assert.deepEqual(splitCardThumbs(['a']), { visible: ['a'], more: 0 });
assert.deepEqual(splitCardThumbs(['a', 'b']), { visible: ['a', 'b'], more: 0 });
assert.deepEqual(splitCardThumbs(['a', 'b', 'c', 'd']), {
  visible: ['a', 'b', 'c', 'd'],
  more: 0,
});
assert.deepEqual(splitCardThumbs(['a', 'b', 'c', 'd', 'e']), {
  visible: ['a', 'b', 'c'],
  more: 2,
});
assert.deepEqual(splitCardThumbs(['a', 'b', 'c', 'd', 'e', 'f']), {
  visible: ['a', 'b', 'c'],
  more: 3,
});

assert.deepEqual(
  productCardImages([
    { id: '1', url: '/a.jpg', altText: 'A', kind: 'IMAGE' },
    { id: '2', url: '/v.mp4', altText: null, kind: 'VIDEO' },
    { id: '3', url: '/b.jpg', altText: 'B' },
    { url: '', altText: null, kind: 'IMAGE' },
  ]),
  [
    { id: '1', url: '/a.jpg', altText: 'A' },
    { id: '3', url: '/b.jpg', altText: 'B' },
  ],
);

console.log('card-thumbs.check ok');
