/**
 * Smoke: product video URL parse (YouTube variants + direct + junk).
 * Run: pnpm exec tsx scripts/smoke-product-video.ts
 */
import {
  parseAmbientVideoUrl,
  parseProductVideoUrl,
  youtubeNocookieAmbientUrl,
  youtubeNocookieEmbedUrl,
  youtubePosterUrl,
} from '../apps/web/lib/product-video.ts';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const watch = parseProductVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
assert(watch?.kind === 'youtube' && watch.id === 'dQw4w9WgXcQ', 'watch?v= failed');

const short = parseProductVideoUrl('https://youtu.be/dQw4w9WgXcQ');
assert(short?.kind === 'youtube' && short.id === 'dQw4w9WgXcQ', 'youtu.be failed');

const shorts = parseProductVideoUrl('https://youtube.com/shorts/dQw4w9WgXcQ');
assert(shorts?.kind === 'youtube' && shorts.id === 'dQw4w9WgXcQ', 'shorts failed');

const embed = parseProductVideoUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
assert(embed?.kind === 'youtube' && embed.id === 'dQw4w9WgXcQ', 'embed failed');

const bare = parseProductVideoUrl('dQw4w9WgXcQ');
assert(bare?.kind === 'youtube' && bare.id === 'dQw4w9WgXcQ', 'bare id failed');

const mp4 = parseProductVideoUrl('/gift/media/welcome-hamper-unbox.mp4');
assert(mp4?.kind === 'direct' && mp4.url.includes('welcome-hamper'), 'direct mp4 failed');

const webm = parseProductVideoUrl('https://cdn.example.com/clip.webm?x=1');
assert(webm?.kind === 'direct', 'webm failed');

const junk = parseProductVideoUrl('https://example.com/page');
assert(junk == null, 'expected unsupported page URL to be null');

const empty = parseProductVideoUrl('  ');
assert(empty == null, 'expected empty to be null');

const nocookie = youtubeNocookieEmbedUrl('dQw4w9WgXcQ');
assert(
  nocookie.startsWith('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ') &&
    nocookie.includes('autoplay=1'),
  'nocookie embed URL unexpected',
);

assert(
  youtubePosterUrl('dQw4w9WgXcQ') === 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  'poster URL unexpected',
);

const ambientYt = parseAmbientVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
assert(ambientYt?.kind === 'youtube' && ambientYt.id === 'dQw4w9WgXcQ', 'ambient youtube failed');

const ambientMp4 = parseAmbientVideoUrl('https://cdn.example.com/hero.mp4');
assert(ambientMp4?.kind === 'direct', 'ambient mp4 failed');

assert(parseAmbientVideoUrl('/gift/media/baby-soft-gift.jpg') == null, 'jpg must not be video');
assert(parseAmbientVideoUrl('dQw4w9WgXcQ') == null, 'bare id must not be hero video');

const ambientEmbed = youtubeNocookieAmbientUrl('dQw4w9WgXcQ');
assert(
  ambientEmbed.includes('mute=1') && ambientEmbed.includes('loop=1'),
  'ambient embed URL unexpected',
);

console.log('smoke-product-video: PASS');
