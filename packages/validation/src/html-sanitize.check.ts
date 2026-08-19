/**
 * Run: npx tsx packages/validation/src/html-sanitize.check.ts
 */
import assert from 'node:assert/strict';
import { isProbablyHtml, normalizeArticleBody, sanitizeArticleHtml } from './html-sanitize';
import { isSafeStorefrontHref, safeHrefOrHash, safeNextPath } from './safe-href';

const stripped = sanitizeArticleHtml('<img/onerror=alert(1) src=/x.jpg>');
assert.equal(stripped.includes('onerror'), false);
assert.equal(stripped.includes('alert'), false);

const jsHref = sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>');
assert.equal(jsHref.toLowerCase().includes('javascript'), false);

const entityJs = sanitizeArticleHtml('<a href="javascript&#58;alert(1)">x</a>');
assert.equal(entityJs.toLowerCase().includes('javascript'), false);
assert.equal(/alert/i.test(entityJs), false);

const protoRel = sanitizeArticleHtml('<a href="//evil.example/phish">x</a>');
assert.equal(protoRel.includes('evil.example'), false);

const okLink = sanitizeArticleHtml('<a href="/products">Shop</a>');
assert.match(okLink, /href="\/products"/);

assert.equal(isSafeStorefrontHref('/'), true);
assert.equal(isSafeStorefrontHref('/#faq'), true);
assert.equal(isSafeStorefrontHref('https://wa.me/919693940330'), true);
assert.equal(isSafeStorefrontHref('mailto:hello@inabiya.in'), true);
assert.equal(isSafeStorefrontHref('javascript:alert(1)'), false);
assert.equal(isSafeStorefrontHref('//evil.example'), false);
assert.equal(safeHrefOrHash('javascript:alert(1)'), '#');

assert.equal(safeNextPath('/cart'), '/cart');
assert.equal(safeNextPath('//evil.example'), null);
assert.equal(safeNextPath('/\\evil.example'), null);
assert.equal(safeNextPath('https://evil.example'), null);

assert.equal(isProbablyHtml('<p>x</p>'), true);
assert.match(normalizeArticleBody('hello\n\nworld'), /<p>hello<\/p>/);

const fromDivs = sanitizeArticleHtml('<div>One</div><div>Two</div>');
assert.match(fromDivs, /<p>One<\/p>/);
assert.match(fromDivs, /<p>Two<\/p>/);

const fromH1 = sanitizeArticleHtml('<h1>About</h1><p>Body</p>');
assert.match(fromH1, /<h2>About<\/h2>/);

const aligned = sanitizeArticleHtml('<p style="text-align:center">Hi</p>');
assert.match(aligned, /text-align:\s*center/);
const droppedStyle = sanitizeArticleHtml('<p style="color:red;text-align:left">Hi</p>');
assert.equal(/color/i.test(droppedStyle), false);
assert.match(droppedStyle, /text-align:\s*left/);

console.log('html-sanitize.check.ts ok');
