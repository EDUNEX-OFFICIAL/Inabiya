/**
 * Homepage FAQ split layout — copy left, accordion right; PDP stays stacked.
 * Run: npx tsx apps/web/components/gift/faq-accordion.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');
const faqCssStart = css.indexOf("[data-theme='gift'] .gift-faq {");
assert.ok(faqCssStart >= 0, 'gift-faq shell missing');
const faqCss = css.slice(faqCssStart, faqCssStart + 2800);
assert.match(faqCss, /grid-template-columns:\s*minmax\(16rem,\s*0\.85fr\)/);
assert.match(faqCss, /gift-faq__copy[\s\S]*position:\s*sticky/);
assert.match(css, /\[data-theme='gift'\] \.gift-faq-item__icon--open/);

const accordion = readFileSync(join(__dirname, 'faq-accordion.tsx'), 'utf8');
assert.match(accordion, /home \? \(\s*<div className="gift-faq__copy">/);
assert.match(accordion, /className=\{\s*`gift-h1 /);
assert.match(accordion, /home\s*\?\s*'gift-faq'/);
assert.doesNotMatch(accordion, /mx-auto max-w-3xl px-gs-4 py-gs-6/);

const blocks = readFileSync(join(__dirname, '../cms/marketing-page-blocks.tsx'), 'utf8');
assert.match(blocks, /function FaqBlock[\s\S]*GiftBand tone="mint"/);
assert.match(blocks, /home \? 'Help' : ''/);

console.log('faq-accordion.check.ts ok');
