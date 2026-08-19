import assert from 'node:assert/strict';
import { ArticleStatus } from '@prisma/client';
import { allowedArticleTransitions, canEditArticleBody, publishBlockReason } from './editorial-transitions';

const writer = { id: 'w1', roles: ['WRITER'] };
const seo = { id: 's1', roles: ['SEO_EDITOR'] };
const med = { id: 'm1', roles: ['MEDICAL_REVIEWER'] };
const content = { id: 'c1', roles: ['CONTENT_ADMIN'] };
const otherWriter = { id: 'w2', roles: ['WRITER'] };

assert.deepEqual(allowedArticleTransitions(ArticleStatus.ASSIGNED, true, writer, 'w1'), [
  ArticleStatus.DRAFT,
]);
assert.deepEqual(allowedArticleTransitions(ArticleStatus.ASSIGNED, true, otherWriter, 'w1'), []);
assert.ok(
  !allowedArticleTransitions(ArticleStatus.DRAFT, true, writer, 'w1').includes(
    ArticleStatus.PUBLISHED,
  ),
);
assert.ok(
  !allowedArticleTransitions(ArticleStatus.APPROVED, true, writer, 'w1').includes(
    ArticleStatus.PUBLISHED,
  ),
);

assert.deepEqual(allowedArticleTransitions(ArticleStatus.SEO_REVIEW, true, seo, 'w1'), [
  ArticleStatus.CHANGES_REQUESTED,
  ArticleStatus.MEDICAL_REVIEW,
]);
assert.ok(
  !allowedArticleTransitions(ArticleStatus.SEO_REVIEW, true, seo, 'w1').includes(
    ArticleStatus.APPROVED,
  ),
);
assert.deepEqual(allowedArticleTransitions(ArticleStatus.SEO_REVIEW, false, seo, 'w1'), [
  ArticleStatus.CHANGES_REQUESTED,
  ArticleStatus.APPROVED,
]);

assert.deepEqual(allowedArticleTransitions(ArticleStatus.MEDICAL_REVIEW, true, med, 'w1'), [
  ArticleStatus.CHANGES_REQUESTED,
  ArticleStatus.APPROVED,
]);
assert.deepEqual(allowedArticleTransitions(ArticleStatus.MEDICAL_REVIEW, true, content, 'w1'), []);

assert.equal(canEditArticleBody(ArticleStatus.PUBLISHED, content, 'w1'), true);
assert.equal(canEditArticleBody(ArticleStatus.PUBLISHED, writer, 'w1'), false);
assert.equal(canEditArticleBody(ArticleStatus.DRAFT, writer, 'w1'), true);
assert.equal(canEditArticleBody(ArticleStatus.SEO_REVIEW, writer, 'w1'), false);

assert.equal(
  publishBlockReason({
    status: ArticleStatus.DRAFT,
    medicalGateRequired: true,
    statusHistory: [],
  }),
  'NOT_APPROVED',
);
assert.equal(
  publishBlockReason({
    status: ArticleStatus.APPROVED,
    medicalGateRequired: true,
    statusHistory: [{ status: ArticleStatus.SEO_REVIEW }],
  }),
  'MEDICAL_GATE_REQUIRED',
);
assert.equal(
  publishBlockReason({
    status: ArticleStatus.APPROVED,
    medicalGateRequired: true,
    statusHistory: [{ status: ArticleStatus.MEDICAL_REVIEW }],
  }),
  null,
);

console.log('editorial-transitions.check: ok');
