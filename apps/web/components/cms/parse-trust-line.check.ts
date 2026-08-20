/**
 * Run: npx tsx apps/web/components/cms/parse-trust-line.check.ts
 */
import assert from 'node:assert/strict';
import {
  parseTrustLine,
  parseTrustChips,
  parseTrustChipDrafts,
  serializeTrustChips,
  serializeTrustLine,
  trustIconKind,
  defaultHeroTrustLine,
} from './parse-trust-line';

assert.deepEqual(parseTrustLine(undefined), []);
assert.deepEqual(parseTrustLine(''), []);
assert.deepEqual(parseTrustLine('   '), []);
assert.deepEqual(
  parseTrustLine('Baby-safe brands · Free shipping over ₹2,000 · PAN-India delivery'),
  ['Baby-safe brands', 'Free shipping over ₹2,000', 'PAN-India delivery'],
);
assert.deepEqual(parseTrustLine('A\nB\nC'), ['A', 'B', 'C']);
assert.equal(serializeTrustLine([' A ', '', 'B']).includes('A'), true);

assert.equal(trustIconKind('Baby-safe brands', 0), 'shield');
assert.equal(trustIconKind('Free shipping over ₹2,000', 0), 'truck');
assert.equal(trustIconKind('PAN-India delivery', 0), 'heart');
assert.equal(
  trustIconKind('Free shipping over ₹2,000', 0),
  trustIconKind('Free shipping over ₹2,000', 2),
);

const prefixed = parseTrustChips('truck:Free shipping over ₹2,000\nheart:PAN-India delivery');
assert.equal(prefixed[0]?.icon, 'truck');
assert.equal(prefixed[0]?.label, 'Free shipping over ₹2,000');
assert.equal(prefixed[1]?.icon, 'heart');

const drafts = parseTrustChipDrafts('shield:Baby-safe brands\ntruck:');
assert.equal(drafts.length, 2);
assert.equal(drafts[1]?.label, '');

const round = serializeTrustChips(drafts);
assert.match(round, /truck:/);

assert.match(defaultHeroTrustLine(), /Baby-safe brands/);
assert.match(defaultHeroTrustLine(), /PAN-India delivery/);

console.log('parse-trust-line.check.ts ok');
