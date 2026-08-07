/**
 * Smoke: seoSchemaExtras Zod — valid preset, forbidden Product override, size, FAQ conflict.
 * Run: pnpm exec tsx scripts/smoke-seo-schema-extras.ts
 */
import {
  parseSeoSchemaExtras,
  seoSchemaExtrasSchema,
  SEO_SCHEMA_EXTRAS_MAX_BYTES,
} from '../packages/validation/src/index.ts';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const orgId = '11111111-1111-4111-8111-111111111111';
const howToId = '22222222-2222-4222-8222-222222222222';
const badId = '33333333-3333-4333-8333-333333333333';
const faqId = '44444444-4444-4444-8444-444444444444';

const valid = seoSchemaExtrasSchema.safeParse([
  {
    id: orgId,
    enabled: true,
    mode: 'preset',
    preset: 'Organization',
    fields: { name: 'Inabiya Soft Gift', url: 'https://example.com' },
  },
  {
    id: howToId,
    enabled: true,
    mode: 'preset',
    preset: 'HowTo',
    fields: {
      name: 'Pack a gift',
      steps: [{ name: 'Choose', text: 'Pick items' }],
    },
  },
]);
assert(valid.success, `valid preset failed: ${JSON.stringify(valid.error?.issues)}`);

const forbidden = seoSchemaExtrasSchema.safeParse([
  {
    id: badId,
    enabled: true,
    mode: 'custom',
    json: { '@type': 'Product', name: 'Fake', offers: { price: '1' } },
  },
]);
assert(!forbidden.success, 'expected Product custom override to fail');

const oversized = seoSchemaExtrasSchema.safeParse([
  {
    id: orgId,
    enabled: true,
    mode: 'custom',
    json: {
      '@type': 'Organization',
      name: 'x'.repeat(SEO_SCHEMA_EXTRAS_MAX_BYTES),
    },
  },
]);
assert(!oversized.success, 'expected oversized payload to fail');

let faqConflictOk = false;
try {
  parseSeoSchemaExtras(
    [
      {
        id: faqId,
        enabled: true,
        mode: 'preset',
        preset: 'FAQPage',
        fields: { items: [{ question: 'Q?', answerText: 'A' }] },
      },
    ],
    { hasSystemFaq: true },
  );
} catch {
  faqConflictOk = true;
}
assert(faqConflictOk, 'expected FAQ conflict when hasSystemFaq');

const faqAllowed = parseSeoSchemaExtras(
  [
    {
      id: faqId,
      enabled: true,
      mode: 'preset',
      preset: 'FAQPage',
      fields: { items: [{ question: 'Q?', answerText: 'A' }] },
    },
  ],
  { hasSystemFaq: false },
);
assert(faqAllowed?.length === 1, 'FAQ should be allowed without system FAQ');

console.log('PASS seoSchemaExtras smoke');
