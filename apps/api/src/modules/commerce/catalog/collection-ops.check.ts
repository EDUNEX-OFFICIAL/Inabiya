/**
 * Run: npx tsx apps/api/src/modules/commerce/catalog/collection-ops.check.ts
 */
import assert from 'node:assert/strict';
import { updateCollectionBodySchema, createCollectionBodySchema } from '@inabiya/validation';
import { collectionDeleteBlocked } from './collection-ops';
import {
  applySmartRulesToWhere,
  parseSmartRules,
  smartRulesHideFacets,
} from './collection-smart';

assert.equal(collectionDeleteBlocked('MANUAL', 0), false);
assert.equal(collectionDeleteBlocked('MANUAL', 1), true);
assert.equal(collectionDeleteBlocked('SMART', 12), false);

assert.ok(
  createCollectionBodySchema.safeParse({ slug: 'for-baby-girl', title: 'Gifts for baby girl' })
    .success,
);
assert.ok(
  createCollectionBodySchema.safeParse({
    slug: 'for-baby-girl',
    title: 'Gifts for baby girl',
    membershipMode: 'SMART',
    smartRules: {
      match: 'all',
      conditions: [{ field: 'recipient', op: 'is', value: 'girl' }],
    },
  }).success,
);
assert.equal(
  createCollectionBodySchema.safeParse({
    slug: 'for-baby-girl',
    title: 'Girl',
    membershipMode: 'SMART',
    smartRules: { match: 'all', conditions: [] },
  }).success,
  false,
);

assert.ok(
  updateCollectionBodySchema.safeParse({
    title: 'Toys',
    membershipMode: 'SMART',
    smartRules: {
      match: 'any',
      conditions: [{ field: 'label', op: 'is', value: 'BESTSELLER' }],
    },
  }).success,
);

const rules = parseSmartRules({
  match: 'all',
  conditions: [{ field: 'recipient', op: 'is', value: 'girl' }],
});
const where = applySmartRulesToWhere({ status: 'PUBLISHED' }, rules);
assert.ok(where.AND);
assert.deepEqual(smartRulesHideFacets(rules), ['recipient']);

assert.ok(updateCollectionBodySchema.safeParse({ description: null }).success);
assert.equal(updateCollectionBodySchema.safeParse({}).success, false);

console.log('collection-ops.check.ts: ok');
