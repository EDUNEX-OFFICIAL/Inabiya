/**
 * Run: npx tsx apps/api/src/modules/commerce/catalog/category-ops.check.ts
 */
import assert from 'node:assert/strict';
import { updateCategoryBodySchema } from '@inabiya/validation';
import { categoryDeleteBlocked } from './category-ops';

assert.equal(categoryDeleteBlocked(0), false);
assert.equal(categoryDeleteBlocked(1), true);
assert.equal(categoryDeleteBlocked(12), true);

assert.ok(updateCategoryBodySchema.safeParse({ name: 'Toys' }).success);
assert.ok(updateCategoryBodySchema.safeParse({ slug: 'bath-skin', sortOrder: 2 }).success);
assert.ok(updateCategoryBodySchema.safeParse({ description: null }).success);
assert.equal(updateCategoryBodySchema.safeParse({}).success, false);
assert.equal(updateCategoryBodySchema.safeParse({ slug: 'Bad Slug' }).success, false);

console.log('category-ops.check.ts: ok');
