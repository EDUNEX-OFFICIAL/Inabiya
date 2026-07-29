/**
 * Hamper savings: contents value − sell price (paise, never negative).
 * Run: npx tsx apps/api/src/modules/commerce/catalog/hamper-savings.check.ts
 */
import assert from 'node:assert/strict';

function hamperSavingsPaise(contentsValuePaise: number, fromPricePaise: number): number {
  return Math.max(0, contentsValuePaise - fromPricePaise);
}

assert.equal(hamperSavingsPaise(329600, 399900), 0);
assert.equal(hamperSavingsPaise(499900, 399900), 100000);
assert.equal(hamperSavingsPaise(0, 100), 0);

console.log('hamper-savings.check ok');
