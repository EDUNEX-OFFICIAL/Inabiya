import assert from 'node:assert/strict';

/** Mirrors reports UI delta helper — integer percent. */
function deltaLabel(current: number, previous: number): string {
  const d = current - previous;
  if (previous === 0) return d === 0 ? '±0' : 'new';
  const pct = Math.round((d * 100) / previous);
  const sign = d > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

assert.equal(deltaLabel(110, 100), '+10%');
assert.equal(deltaLabel(90, 100), '-10%');
assert.equal(deltaLabel(50, 0), 'new');
assert.equal(deltaLabel(0, 0), '±0');

console.log('reports-delta.check: ok');
