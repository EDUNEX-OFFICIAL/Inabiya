import assert from 'node:assert/strict';

/** Mirrors reports + dashboard UI delta helper — integer percent. */
export function deltaLabel(current: number, previous: number): string {
  const d = current - previous;
  if (previous === 0) return d === 0 ? '±0' : 'new';
  const pct = Math.round((d * 100) / previous);
  const sign = d > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

export type AlertPrefKey =
  'failedPayments' | 'awaitingProcess' | 'pendingShip' | 'openReturns' | 'lowStock';

export type AlertPrefs = Record<AlertPrefKey, boolean>;

/** Prefer SLA-aging queues ahead of same-tone peers. */
export function attentionPriority(base: number, agingCount: number): number {
  if (agingCount > 0) return Math.max(0, base - 10);
  return base;
}

export function filterAlertsByPrefs<T extends { id: AlertPrefKey }>(
  items: T[],
  prefs: AlertPrefs,
): T[] {
  return items.filter((i) => prefs[i.id] !== false);
}

assert.equal(deltaLabel(112, 100), '+12%');
assert.equal(deltaLabel(90, 100), '-10%');
assert.equal(deltaLabel(50, 0), 'new');
assert.equal(deltaLabel(0, 0), '±0');
assert.equal(attentionPriority(1, 2), 0);
assert.equal(attentionPriority(1, 0), 1);
assert.deepEqual(
  filterAlertsByPrefs(
    [
      { id: 'failedPayments' as const },
      { id: 'lowStock' as const },
      { id: 'openReturns' as const },
    ],
    {
      failedPayments: true,
      awaitingProcess: true,
      pendingShip: true,
      openReturns: false,
      lowStock: true,
    },
  ).map((i) => i.id),
  ['failedPayments', 'lowStock'],
);

console.log('dashboard-command.check: ok');
