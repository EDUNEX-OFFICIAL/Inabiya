/**
 * Run: npx tsx apps/web/lib/gift-nav-ia.check.ts
 */
import assert from 'node:assert/strict';
import { findNavLink, organizeGiftNav, previewForNavLink, splitNavColumns } from './gift-nav-ia';

const shop = [
  { href: '/gift/build-your-box', label: 'Build Your Box' },
  { href: '/gift/collections/ready-hampers', label: 'Ready-made hampers' },
  { href: '/gift/collections/baby-shower', label: 'Baby shower gifts' },
  { href: '/gift/collections/welcome-baby', label: 'Welcome baby gifts' },
  { href: '/gift/collections/naming-ceremony', label: 'Naming ceremony gifts' },
  { href: '/gift/collections/first-birthday', label: 'First birthday gifts' },
  { href: '/gift/collections/bestsellers', label: 'Best sellers' },
  { href: '/gift/collections/editors-picks', label: "Editor's picks" },
  { href: '/gift/collections/new-arrivals', label: 'New arrivals' },
  { href: '/gift/collections/on-sale', label: 'On sale' },
];

const whom = [
  { href: '/gift/collections/for-baby-girl', label: 'Baby Girl' },
  { href: '/gift/collections/for-baby-boy', label: 'Baby Boy' },
  { href: '/gift/collections/for-expecting-mom', label: 'Expecting Mom' },
  { href: '/gift/collections/unisex-gifts', label: 'Unisex' },
  { href: '/gift/collections/newborn', label: 'Newborn' },
  { href: '/gift/collections/infant', label: 'Infant' },
  { href: '/gift/collections/toddler', label: 'Toddler' },
];

const ia = organizeGiftNav(shop, whom);

assert.deepEqual(
  ia.shop.map((g) => g.id),
  ['shop', 'occasion', 'curated'],
);
assert.deepEqual(
  ia.whom.map((g) => g.id),
  ['recipient', 'age'],
);

const shopHrefs = ia.shop.flatMap((g) => g.links.map((l) => l.href));
assert.ok(shopHrefs.includes('/gift/build-your-box'));
assert.ok(shopHrefs.includes('/gift/collections/baby-shower'));
assert.ok(!shopHrefs.some((h) => h.includes('for-baby-girl')));
assert.ok(!shopHrefs.some((h) => h.includes('/newborn')));

const girl = ia.whom[0]?.links.find((l) => l.href.includes('for-baby-girl'));
assert.equal(girl?.label, 'Baby Girl');

const unisex = ia.whom[0]?.links.find((l) => l.href.includes('unisex'));
assert.equal(unisex?.label, 'Unisex');

const [shopLeft, shopRight] = splitNavColumns(ia.shop);
assert.deepEqual(
  shopLeft.map((g) => g.id),
  ['shop', 'curated'],
);
assert.deepEqual(
  shopRight.map((g) => g.id),
  ['occasion'],
);

const byb = findNavLink(ia.shop, '/gift/build-your-box');
assert.ok(byb);
const preview = previewForNavLink(byb, {
  headline: 'Fallback',
  body: 'x',
  ctaHref: '/gift',
  ctaLabel: 'Go',
  imageSrc: '/gift/nav/shop.svg',
});
assert.equal(preview.headline, 'Build Your Box');
assert.equal(preview.ctaHref, '/gift/build-your-box');

const shower = findNavLink(ia.shop, '/gift/collections/baby-shower');
assert.ok(shower);
const showerPreview = previewForNavLink(shower, preview);
assert.equal(showerPreview.headline, 'Baby shower gifts');
assert.match(showerPreview.imageSrc, /gift\/media/);

const bybQuery = organizeGiftNav(
  [{ href: '/gift/build-your-box?recipient=girl', label: 'Build Your Box' }],
  [],
);
assert.equal(bybQuery.shop[0]?.id, 'shop');
assert.ok(bybQuery.shop[0]?.links[0]?.href.includes('build-your-box'));

const cmsPlaced = organizeGiftNav(
  [{ href: '/gift/collections/for-baby-girl', label: 'Girls', group: 'Occasion' }],
  [],
);
assert.equal(cmsPlaced.shop[0]?.id, 'occasion');
assert.equal(cmsPlaced.shop[0]?.links[0]?.label, 'Girls');
assert.equal(cmsPlaced.whom.length, 0);

const cmsStay = organizeGiftNav(
  [{ href: '/gift/collections/for-baby-girl', label: 'Gifts for baby girl' }],
  [{ href: '/gift/collections/for-baby-girl', label: 'Baby Girl' }],
);
assert.ok(cmsStay.shop.some((g) => g.links.some((l) => l.href.includes('for-baby-girl'))));
assert.equal(
  cmsStay.whom[0]?.links.find((l) => l.href.includes('for-baby-girl'))?.label,
  'Baby Girl',
);

const cmsPreview = previewForNavLink(
  {
    href: '/gift/collections/baby-shower',
    label: 'Shower',
    headline: 'CMS headline',
    body: 'CMS body',
    ctaLabel: 'Open',
    imageSrc: '/cms.jpg',
  },
  preview,
);
assert.equal(cmsPreview.headline, 'CMS headline');
assert.equal(cmsPreview.body, 'CMS body');
assert.equal(cmsPreview.ctaLabel, 'Open');
assert.equal(cmsPreview.imageSrc, '/cms.jpg');

console.log('gift-nav-ia.check.ts: ok');
