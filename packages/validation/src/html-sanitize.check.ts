/**
 * Run: npx tsx packages/validation/src/html-sanitize.check.ts
 */
import assert from 'node:assert/strict';
import { isProbablyHtml, normalizeArticleBody, sanitizeArticleHtml } from './html-sanitize';
import { isSafeStorefrontHref, safeHrefOrHash, safeNextPath } from './safe-href';

const stripped = sanitizeArticleHtml('<img/onerror=alert(1) src=/gift/x.jpg>');
assert.equal(stripped.includes('onerror'), false);
assert.equal(stripped.includes('alert'), false);

const jsHref = sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>');
assert.equal(jsHref.toLowerCase().includes('javascript'), false);

const entityJs = sanitizeArticleHtml('<a href="javascript&#58;alert(1)">x</a>');
assert.equal(entityJs.toLowerCase().includes('javascript'), false);
assert.equal(/alert/i.test(entityJs), false);

const protoRel = sanitizeArticleHtml('<a href="//evil.example/phish">x</a>');
assert.equal(protoRel.includes('evil.example'), false);

const okLink = sanitizeArticleHtml('<a href="/gift/products">Shop</a>');
assert.match(okLink, /href="\/gift\/products"/);

assert.equal(isSafeStorefrontHref('/gift'), true);
assert.equal(isSafeStorefrontHref('/gift#faq'), true);
assert.equal(isSafeStorefrontHref('https://wa.me/919693940330'), true);
assert.equal(isSafeStorefrontHref('mailto:hello@inabiya.in'), true);
assert.equal(isSafeStorefrontHref('javascript:alert(1)'), false);
assert.equal(isSafeStorefrontHref('//evil.example'), false);
assert.equal(safeHrefOrHash('javascript:alert(1)'), '#');

assert.equal(safeNextPath('/gift/cart'), '/gift/cart');
assert.equal(safeNextPath('//evil.example'), null);
assert.equal(safeNextPath('/\\evil.example'), null);
assert.equal(safeNextPath('https://evil.example'), null);

assert.equal(isProbablyHtml('<p>x</p>'), true);
assert.match(normalizeArticleBody('hello\n\nworld'), /<p>hello<\/p>/);

console.log('html-sanitize.check.ts ok');
