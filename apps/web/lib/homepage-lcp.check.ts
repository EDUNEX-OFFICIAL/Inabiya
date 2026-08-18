/**
 * Homepage LCP preload: library URLs only.
 * Run: npx tsx apps/web/lib/homepage-lcp.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homepageLcpHref } from './homepage-lcp';
import { preferPublicHeroSrc } from './public-hero';

const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
assert.equal(homepageLcpHref([]), null);
assert.equal(
  homepageLcpHref([{ type: 'hero', props: { imageUrl: '/gift/media/baby-soft-gift.jpg' } }]),
  '/gift/media/baby-soft-gift.webp',
);
assert.equal(
  homepageLcpHref([{ type: 'hero', props: { imageUrl: `/api/v1/media/${id}/content` } }]),
  `/api/v1/media/${id}/content?v=web`,
);

assert.equal(
  preferPublicHeroSrc('/gift/media/baby-soft-gift.jpg'),
  '/gift/media/baby-soft-gift.webp',
);
assert.equal(preferPublicHeroSrc('/gift/media/other.jpg'), '/gift/media/other.jpg');

const blocks = readFileSync(join(__dirname, '../components/cms/marketing-page-blocks.tsx'), 'utf8');
assert.match(blocks, /gift-box\.svg[\s\S]{0,220}loading="lazy"/);
assert.match(blocks, /gift-brand-panel__mark-img[\s\S]{0,80}loading="lazy"/);

const chrome = readFileSync(join(__dirname, '../components/gift/gift-layout-chrome.tsx'), 'utf8');
assert.doesNotMatch(chrome, /BrandLogo[\s\S]{0,80}priority/);

const logo = readFileSync(join(__dirname, '../components/brand-logo.tsx'), 'utf8');
assert.match(logo, /fetchPriority=\{priority \? 'high' : 'low'\}/);

console.log('homepage-lcp.check: ok');
