import assert from 'node:assert/strict';
import { parseProductCsv } from './parse-product-csv';

const sample = `slug,title,sku,pricePaise,onHand,description,compareAtPaise,status,imageUrl,label
rose-set,Rose Set,ROSE-1,49900,5,Pretty roses,59900,DRAFT,/api/v1/media/x/content,Default
bad slug,X,S,100,0,,,,DRAFT,,
`;

const parsed = parseProductCsv(sample);
assert.equal(parsed.rows.length, 1);
assert.equal(parsed.rows[0]!.slug, 'rose-set');
assert.equal(parsed.rows[0]!.pricePaise, 49900);
assert.equal(parsed.rows[0]!.compareAtPaise, 59900);
assert.ok(parsed.parseErrors.some((e) => e.message.includes('Invalid slug')));

console.log('parse-product-csv.check: ok');
