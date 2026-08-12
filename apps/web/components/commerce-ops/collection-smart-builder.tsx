'use client';

import { Plus, X } from 'lucide-react';
import { opsChipClass } from '@/lib/ops-desk-ui';
import {
  SMART_FIELD_OPTS,
  defaultSmartOp,
  defaultSmartValue,
  smartOpOptions,
  smartValueOptions,
  type SmartCondition,
  type SmartRules,
} from '@/lib/collection-admin';

export function CollectionSmartBuilder({
  rules,
  onChange,
}: {
  rules: SmartRules;
  onChange: (next: SmartRules) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_96%,white)] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[var(--muted-foreground)]">Match</span>
        {(
          [
            { v: 'all' as const, label: 'All' },
            { v: 'any' as const, label: 'Any' },
          ] as const
        ).map((o) => (
          <button
            key={o.v}
            type="button"
            className={opsChipClass(rules.match === o.v)}
            onClick={() => onChange({ ...rules, match: o.v })}
          >
            {o.label}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {rules.conditions.map((c, i) => {
          const vals = smartValueOptions(c.field);
          const ops = smartOpOptions(c.field);
          const singleOp = ops.length === 1;
          return (
            <li
              key={i}
              className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7.5rem_minmax(0,1.2fr)_2rem]"
            >
              <select
                className="clay-input min-h-9 w-full text-sm"
                value={c.field}
                onChange={(e) => {
                  const field = e.target.value as SmartCondition['field'];
                  const next = [...rules.conditions];
                  next[i] = { field, op: defaultSmartOp(field), value: defaultSmartValue(field) };
                  onChange({ ...rules, conditions: next });
                }}
              >
                {SMART_FIELD_OPTS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              {singleOp ? (
                <span className="px-1 text-xs text-[var(--muted-foreground)]">{ops[0].label}</span>
              ) : (
                <select
                  className="clay-input min-h-9 w-full text-sm"
                  value={c.op}
                  onChange={(e) => {
                    const next = [...rules.conditions];
                    next[i] = { ...c, op: e.target.value as SmartCondition['op'] };
                    onChange({ ...rules, conditions: next });
                  }}
                >
                  {ops.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
              {vals ? (
                <select
                  className="clay-input min-h-9 w-full text-sm"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...rules.conditions];
                    next[i] = { ...c, value: e.target.value };
                    onChange({ ...rules, conditions: next });
                  }}
                >
                  {vals.map((v) => (
                    <option key={v.value} value={v.value}>
                      {v.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="clay-input min-h-9 w-full text-sm"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...rules.conditions];
                    next[i] = { ...c, value: e.target.value };
                    onChange({ ...rules, conditions: next });
                  }}
                  placeholder={c.field === 'publishedWithinDays' ? 'Days (e.g. 45)' : 'Text'}
                />
              )}
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center justify-self-end rounded-full opacity-60 hover:opacity-100 disabled:opacity-30 sm:justify-self-center"
                aria-label="Remove condition"
                disabled={rules.conditions.length <= 1}
                onClick={() =>
                  onChange({
                    ...rules,
                    conditions: rules.conditions.filter((_, j) => j !== i),
                  })
                }
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)]"
        onClick={() =>
          onChange({
            ...rules,
            conditions: [...rules.conditions, { field: 'recipient', op: 'is', value: 'girl' }],
          })
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add condition
      </button>
    </div>
  );
}
