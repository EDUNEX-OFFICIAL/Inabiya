import assert from 'node:assert/strict';
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
    ctaHref: '/gift/build-your-box',
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
    ctaHref: '/gift/products',
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
assert.equal(testimonialProps.ctaHref, '/gift/products');
assert.equal(testimonialProps.items.length, 12);

console.log('cms-page-model.check: ok');
