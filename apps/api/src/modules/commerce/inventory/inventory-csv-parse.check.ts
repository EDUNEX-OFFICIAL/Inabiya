import assert from 'node:assert/strict';

/** Mirrors apps/web/lib/parse-inventory-csv.ts header+row rules. */
function parse(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const parseErrors: Array<{ row: number; message: string }> = [];
  const rows: Array<{ sku: string; delta: number; reason: string }> = [];
  let start = 0;
  if (lines[0]?.toLowerCase().startsWith('sku,')) start = 1;
  const REASONS = new Set(['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION']);
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i]!.split(',');
    const sku = parts[0]?.trim() ?? '';
    const delta = Number(parts[1]?.trim());
    const reason = (parts[2]?.trim() ?? '').toUpperCase();
    if (!sku || !Number.isInteger(delta) || delta === 0 || !REASONS.has(reason)) {
      parseErrors.push({ row: i + 1, message: 'bad' });
      continue;
    }
    rows.push({ sku, delta, reason });
  }
  return { rows, parseErrors };
}

const sample = `sku,delta,reason,note
ABC-1,10,RECEIVE,restock
bad,x,RECEIVE
XYZ,-2,DAMAGE
`;

const r = parse(sample);
assert.equal(r.rows.length, 2);
assert.equal(r.parseErrors.length, 1);
assert.equal(r.rows[0]?.sku, 'ABC-1');
assert.equal(r.rows[1]?.delta, -2);

console.log('inventory-csv-parse.check: ok');
