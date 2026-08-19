import assert from 'node:assert/strict';
import { ARTICLE_TAG_MAX, articleTagName, articleTagSlug } from './article-tags';

assert.equal(articleTagSlug('Sleep Training'), 'sleep-training');
assert.equal(articleTagSlug('  Newborn!  '), 'newborn');
assert.equal(articleTagSlug('a'), 'a');
assert.equal(articleTagName('Sleep Training', 'sleep-training'), 'Sleep Training');
assert.equal(articleTagName('sleep-training', 'sleep-training'), 'sleep training');
assert.equal(ARTICLE_TAG_MAX, 12);

console.log('article-tags.check: ok');
