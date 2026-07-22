import assert from 'node:assert/strict';
import {
  buildGiftBoxProductWhere,
  REC_FILTER_TIERS,
} from './gift-box-recommendations';

const prefs = {
  recipient: 'girl',
  ageBand: 'newborn',
  occasion: 'welcome-baby',
  categorySlugs: ['clothing'],
};

const full = buildGiftBoxProductWhere(prefs, 'full');
assert.ok(full.categories);
assert.ok(full.occasionTags);
assert.ok(full.ageBands);
assert.deepEqual(full.recipientTags, { hasSome: ['girl', 'unisex'] });

const noCat = buildGiftBoxProductWhere(prefs, 'noCategory');
assert.equal(noCat.categories, undefined);
assert.ok(noCat.occasionTags);

const noOcc = buildGiftBoxProductWhere(prefs, 'noOccasion');
assert.equal(noOcc.occasionTags, undefined);
assert.ok(noOcc.ageBands);

const noAge = buildGiftBoxProductWhere(prefs, 'noAge');
assert.equal(noAge.ageBands, undefined);
assert.ok(noAge.recipientTags);

const budgetOnly = buildGiftBoxProductWhere(prefs, 'budgetOnly');
assert.equal(budgetOnly.recipientTags, undefined);
assert.equal(budgetOnly.ageBands, undefined);
assert.equal(budgetOnly.occasionTags, undefined);
assert.equal(budgetOnly.categories, undefined);
assert.deepEqual(budgetOnly.variants, { some: { giftBoxEligible: true } });

// ageBand `any` must not require products tagged `any`
const anyAge = buildGiftBoxProductWhere({ ...prefs, ageBand: 'any' }, 'full');
assert.equal(anyAge.ageBands, undefined);

assert.equal(REC_FILTER_TIERS.length, 5);
assert.equal(REC_FILTER_TIERS[0], 'full');
assert.equal(REC_FILTER_TIERS[4], 'budgetOnly');

console.log('gift-box-recommendations checks ok');
