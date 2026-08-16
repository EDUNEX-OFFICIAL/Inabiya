/**
 * Collection PLP: nested filter scroll + custom sort (no native <select>).
 * Run: npx tsx apps/web/components/gift/collection-plp.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const filters = readFileSync(join(__dirname, 'collection-filters.tsx'), 'utf8');
assert.match(filters, /data-lenis-prevent/);
assert.match(filters, /gift-facet-scroll/);
assert.match(filters, /overscroll-contain/);
assert.match(filters, /onToggle=/);
assert.match(filters, /useState\(defaultOpen\)/);
assert.match(filters, /facetKey/);
assert.match(filters, />\s*Apply\s*</);
assert.match(filters, /disabled=\{!dirty\}/);
assert.doesNotMatch(filters, /apply immediately/);

const toolbar = readFileSync(join(__dirname, 'collection-results-toolbar.tsx'), 'utf8');
assert.match(toolbar, /GiftSelect/);
assert.doesNotMatch(toolbar, /<select[\s>]/);

const lenis = readFileSync(join(__dirname, 'gift-lenis-inner.tsx'), 'utf8');
assert.match(lenis, /allowNestedScroll:\s*true/);

const css = readFileSync(join(__dirname, '../../app/globals.css'), 'utf8');
assert.doesNotMatch(css, /\[data-theme='gift'\] \*::-webkit-scrollbar/);
assert.match(css, /\[data-theme='gift'\] \.gift-facet-scroll/);

const giftSelect = readFileSync(join(__dirname, 'gift-select.tsx'), 'utf8');
assert.match(giftSelect, /role="listbox"/);
assert.match(giftSelect, /aria-haspopup="listbox"/);
assert.match(giftSelect, /createPortal/);
assert.match(giftSelect, /--z-overlay/);

console.log('collection-plp.check.ts ok');
