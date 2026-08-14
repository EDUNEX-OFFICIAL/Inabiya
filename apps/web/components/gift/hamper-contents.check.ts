/**
 * Hamper card contents copy.
 * Run: npx tsx apps/web/components/gift/hamper-contents.check.ts
 */
import assert from 'node:assert/strict';
import { hamperContentsCount, hamperContentsLabel } from './hamper-contents';

assert.equal(hamperContentsLabel(1), '1 curated item in this set');
assert.equal(hamperContentsLabel(4), '4 curated items in this set');
assert.equal(
  hamperContentsCount({
    id: 'p',
    slug: 'celebrate-naming-hamper',
    title: 'Celebrate Naming Hamper',
    fromPricePaise: 449900,
    hamperItemCount: 4,
    hamperItems: [],
  }),
  4,
);
assert.equal(
  hamperContentsCount({
    id: 'p',
    slug: 'set',
    title: 'Set',
    fromPricePaise: 100,
    hamperItems: [
      {
        id: 'a',
        title: 'A',
        blurb: null,
        imageUrl: null,
        qty: 2,
        unitPricePaise: 50,
        sortOrder: 0,
      },
      {
        id: 'b',
        title: 'B',
        blurb: null,
        imageUrl: null,
        qty: 1,
        unitPricePaise: 50,
        sortOrder: 1,
      },
    ],
  }),
  3,
);

console.log('hamper-contents.check ok');
