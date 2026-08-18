import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  blockToCmsPreview,
  BLOCK_LABELS,
  PALETTE_INSERTS,
  blockLabel,
  blockSummary,
  createBlockFromInsert,
  duplicateSlug,
  EMPTY_PROPS,
  parseHeroLayout,
  slugifyTitle,
  toEditable,
  toPayload,
  type Block,
} from './cms-page-model';

const hero: Block = {
  clientId: 'b-1',
  type: 'hero',
  props: {
    ...EMPTY_PROPS.hero,
    headline: 'Little bundles of joy',
    ctaLabel: 'Build Your Box',
    ctaHref: '/build-your-box',
    variant: 'storefront',
    layout: 'full',
  },
};

const payload = toPayload([hero]);
assert.equal(payload.length, 1);
assert.equal(payload[0]?.type, 'hero');
assert.equal((payload[0]?.props as { headline: string }).headline, 'Little bundles of joy');
assert.equal((payload[0]?.props as { layout?: string }).layout, 'full');

const round = toEditable([
  { id: 'blk-1', type: 'hero', props: payload[0]!.props as Record<string, unknown> },
]);
assert.equal(round[0]?.props.headline, 'Little bundles of joy');
assert.equal(round[0]?.props.layout, 'full');
assert.equal(blockSummary(hero), 'Full · Little bundles of joy');
assert.equal(blockLabel('hero', 'splitMedia'), 'Hero · Two images');
assert.equal(parseHeroLayout('nope'), undefined);
assert.equal(BLOCK_LABELS.productGrid, 'Product grid');
assert.equal(slugifyTitle('Corporate & bulk gifting'), 'corporate-bulk-gifting');
assert.match(duplicateSlug('welcome-test'), /^welcome-test-copy-\d+$/);

const heroPresets = PALETTE_INSERTS.filter((i) => i.group === 'hero');
assert.equal(heroPresets.length, 6);
const made = createBlockFromInsert(heroPresets[2]!);
assert.equal(made.type, 'hero');
assert.ok(made.props.layout);

const faq: Block = {
  clientId: 'b-2',
  type: 'faq',
  props: {
    ...EMPTY_PROPS.faq,
    itemsJson: 'not-json',
  },
};
assert.throws(() => toPayload([faq]), /FAQ items JSON is invalid/);

const faqOk = toPayload([
  {
    clientId: 'b-faq',
    type: 'faq',
    props: { ...EMPTY_PROPS.faq, overline: 'Help' },
  },
]);
const faqProps = faqOk[0]?.props as { overline?: string; items: unknown[] };
assert.equal(faqProps.overline, 'Help');
assert.equal(faqProps.items.length, 5);

const preview = blockToCmsPreview(hero);
assert.equal(preview.ok, true);
if (preview.ok) {
  assert.equal(preview.block.type, 'hero');
  assert.equal((preview.block.props as { layout?: string }).layout, 'full');
}

const styledHero: Block = {
  ...hero,
  props: { ...hero.props, align: 'end', headlineSize: 'display', ink: 'blush' },
};
const styledPayload = toPayload([styledHero]);
assert.equal((styledPayload[0]?.props as { align?: string }).align, 'end');
assert.equal((styledPayload[0]?.props as { headlineSize?: string }).headlineSize, 'display');
assert.equal((styledPayload[0]?.props as { ink?: string }).ink, 'blush');

const customPresets = PALETTE_INSERTS.filter((i) => i.group === 'custom');
assert.equal(customPresets.length, 6);
const blank = createBlockFromInsert(customPresets[0]!);
assert.equal(blank.type, 'customSection');
assert.equal(blank.props.layout, 'stack');
const customPayload = toPayload([blank]);
assert.equal(customPayload[0]?.type, 'customSection');
assert.equal(blockLabel('customSection', 'three'), 'Custom · Three columns');
assert.equal(blockSummary(blank), 'Blank');

const badPreview = blockToCmsPreview(faq);
assert.equal(badPreview.ok, false);

const testimonialQuotes = Array.from({ length: 14 }, (_, i) => ({
  quote: `Quote ${i + 1} from a parent about their Inabiya gift.`,
  author: `Author ${i + 1}`,
  role: 'Bengaluru',
  rating: 5,
}));
const testimonials: Block = {
  clientId: 'b-t',
  type: 'testimonials',
  props: {
    ...EMPTY_PROPS.testimonials,
    overline: 'Parent love',
    title: 'Loved by new parents across India',
    subtitle: 'Honest notes from recent gifts.',
    ctaLabel: 'Shop gifts',
    ctaHref: '/products',
    itemsJson: JSON.stringify(testimonialQuotes),
  },
};
const testimonialPayload = toPayload([testimonials]);
const testimonialProps = testimonialPayload[0]?.props as {
  overline?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items: unknown[];
};
assert.equal(testimonialProps.overline, 'Parent love');
assert.equal(testimonialProps.ctaLabel, 'Shop gifts');
assert.equal(testimonialProps.ctaHref, '/products');
assert.equal(testimonialProps.items.length, 12);

const featured = toPayload([
  {
    clientId: 'b-fc',
    type: 'featuredCarousel',
    props: { ...EMPTY_PROPS.featuredCarousel },
  },
]);
assert.equal(featured[0]?.type, 'featuredCarousel');
const featuredProps = featured[0]?.props as { headline?: string; cards: unknown[] };
assert.equal(featuredProps.headline, 'A different way to gift');
assert.equal(featuredProps.cards.length, 6);

const wa = toPayload([
  {
    clientId: 'b-wa',
    type: 'whatsappCta',
    props: { ...EMPTY_PROPS.whatsappCta },
  },
]);
assert.equal(wa[0]?.type, 'whatsappCta');
assert.equal((wa[0]?.props as { countryCode?: string }).countryCode, '+91');

const thin = toPayload([
  {
    clientId: 'b-thin',
    type: 'thinStrip',
    props: { ...EMPTY_PROPS.thinStrip },
  },
]);
assert.equal(thin[0]?.type, 'thinStrip');
assert.equal((thin[0]?.props as { marquee?: boolean }).marquee, true);
assert.equal((thin[0]?.props as { items?: string[] }).items?.length, 3);

const offers = toPayload([
  {
    clientId: 'b-oc',
    type: 'offerCarousel',
    props: { ...EMPTY_PROPS.offerCarousel },
  },
]);
assert.equal(offers[0]?.type, 'offerCarousel');
assert.equal((offers[0]?.props as { cards: unknown[] }).cards.length, 4);

const promoTypes = PALETTE_INSERTS.filter((i) => i.group === 'promo').map((i) => i.type);
assert.ok(promoTypes.includes('whatsappCta'));
assert.ok(promoTypes.includes('thinStrip'));
assert.ok(promoTypes.includes('offerCarousel'));
assert.ok(PALETTE_INSERTS.some((i) => i.type === 'featuredCarousel'));

const inspector = readFileSync(join(__dirname, 'cms-block-inspector.tsx'), 'utf8');
assert.match(inspector, /FeaturedCarouselCardsEditor/);
assert.match(inspector, /BrandsRowsEditor/);
assert.match(inspector, /UspsRowsEditor/);
assert.match(inspector, /OfferCardsEditor/);
assert.match(inspector, /FaqItemsEditor/);
assert.match(inspector, /RecipientCardsEditor/);
assert.match(inspector, /uspColumns/);
assert.doesNotMatch(inspector, /INSPECTOR_TEXTAREA_CODE/);

const brandBlock: Block = {
  clientId: 'b-br',
  type: 'brandStrip',
  props: {
    ...EMPTY_PROPS.brandStrip,
    brands:
      "Chicco | /gift/brands/chicco.svg, Johnson's Baby, Mothercare, Pigeon, Himalaya, The Moms Co. | /gift/brands/the-moms-co.svg, Mamaearth | /gift/brands/mamaearth.svg, Pampers, Mee Mee, Sebamed, Cetaphil, Mother Sparsh, Baby Hug, Philips Avent",
    usps: 'gift:Personalised gifts|Baby name & wrap, shield:Trusted quality|Baby-safe',
    uspColumns: '3',
  },
};
const brandPayload = toPayload([brandBlock]);
const brandProps = brandPayload[0]?.props as {
  brands: Array<string | { name: string; logoUrl?: string }>;
  usps: Array<{ label: string; icon?: string; body?: string }>;
  uspColumns?: number;
};
assert.equal(brandProps.brands.length, 14);
assert.equal((brandProps.brands[0] as { name: string }).name, 'Chicco');
assert.equal(brandProps.usps[0]?.icon, 'gift');
assert.equal(brandProps.uspColumns, 3);

const split = toPayload([
  {
    clientId: 'b-rs',
    type: 'recipientSplit',
    props: { ...EMPTY_PROPS.recipientSplit, grid: '2x2' },
  },
]);
const splitProps = split[0]?.props as {
  grid?: string;
  items: unknown[];
  left: { label: string };
  right: { label: string };
};
assert.equal(splitProps.grid, '2x2');
assert.equal(splitProps.items.length, 2);
assert.equal(splitProps.left.label, 'girl');
assert.equal(splitProps.right.label, 'boy');
const splitBack = toEditable([{ id: '1', type: 'recipientSplit', props: splitProps }]);
assert.equal(JSON.parse(splitBack[0]!.props.itemsJson ?? '[]').length, 2);
assert.equal(splitBack[0]?.props.grid, '2x2');

const legacySplit = toEditable([
  {
    id: '2',
    type: 'recipientSplit',
    props: {
      title: 'Shop by baby',
      left: { label: 'girl', href: '/collections/for-baby-girl' },
      right: { label: 'boy', href: '/collections/for-baby-boy' },
    },
  },
]);
assert.equal(JSON.parse(legacySplit[0]!.props.itemsJson ?? '[]').length, 2);
assert.equal(legacySplit[0]?.props.grid, '2x1');

const dense: Block = {
  clientId: 'b-rs4',
  type: 'recipientSplit',
  props: {
    ...EMPTY_PROPS.recipientSplit,
    grid: '2x1',
    itemsJson: JSON.stringify([
      { label: 'girl', href: '/collections/for-baby-girl' },
      { label: 'boy', href: '/collections/for-baby-boy' },
      { label: 'mom', href: '/collections/for-expecting-mom' },
      { label: 'unisex', href: '/collections/unisex-gifts' },
    ]),
  },
};
const densePayload = toPayload([dense]);
const denseProps = densePayload[0]?.props as { items: unknown[]; left: { label: string } };
assert.equal(denseProps.items.length, 4);
assert.equal(denseProps.left.label, 'girl');

console.log('cms-page-model.check: ok');
