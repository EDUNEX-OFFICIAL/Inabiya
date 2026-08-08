/**
 * Run: npx tsx apps/api/src/modules/commerce/catalog/collection-ops.check.ts
 */
import assert from 'node:assert/strict';
import { updateCollectionBodySchema, createCollectionBodySchema } from '@inabiya/validation';
import { collectionDeleteBlocked } from './collection-ops';

assert.equal(collectionDeleteBlocked('MANUAL', 0), false);
assert.equal(collectionDeleteBlocked('MANUAL', 1), true);
assert.equal(collectionDeleteBlocked('RULES', 12), false);

assert.ok(createCollectionBodySchema.safeParse({ slug: 'for-baby-girl', title: 'Gifts for baby girl' }).success);
assert.ok(
  updateCollectionBodySchema.safeParse({
    title: 'Toys',
    membershipMode: 'RULES',
    rules: { recipient: 'girl', hideFacets: ['recipient'] },
  }).success,
);
assert.ok(updateCollectionBodySchema.safeParse({ description: null }).success);
assert.equal(updateCollectionBodySchema.safeParse({}).success, false);
assert.equal(updateCollectionBodySchema.safeParse({ slug: 'Bad Slug' }).success, false);

console.log('collection-ops.check.ts: ok');
