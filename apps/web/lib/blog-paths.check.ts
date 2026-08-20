import assert from 'node:assert/strict';
import { blogIndexPath } from './blog-paths';

assert.equal(blogIndexPath(), '/blog');
assert.equal(blogIndexPath({ category: 'sleep' }), '/blog?category=sleep');
assert.equal(blogIndexPath({ q: 'newborn sleep' }), '/blog?q=newborn+sleep');
assert.equal(
  blogIndexPath({ category: 'sleep', tag: 'tips', q: 'cue' }),
  '/blog?category=sleep&tag=tips&q=cue',
);

console.log('blog-paths.check.ts ok');
