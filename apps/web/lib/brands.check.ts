import assert from 'node:assert/strict';
import { collectBrandNames } from '../lib/brands';

assert.deepEqual(collectBrandNames({ brandName: 'Soft Nest' }), ['Soft Nest']);
assert.deepEqual(
  collectBrandNames({
    brandName: 'Inabiya',
    hamperItems: [
      { brandName: 'Chicco' },
      { brandName: 'Soft Nest' },
      { brandName: 'chicco' },
      { brandName: null },
    ],
  }),
  ['Chicco', 'Soft Nest'],
);
assert.deepEqual(collectBrandNames({ brandName: 'A, B', hamperItems: [] }), ['A', 'B']);
console.log('collectBrandNames ok');
