'use client';

import { Plus, X } from 'lucide-react';
import { opsChipClass } from '@/lib/ops-desk-ui';

type Match = 'all' | 'any';

export function ConditionRowsBuilder<F extends string, O extends string>({
  match,
  conditions,
  onMatchChange,
  onConditionsChange,
  fieldOpts,
  opOptions,
  valueOptions,
  defaultOp,
  defaultValue,
  addField,
  max = 12,
}: {
  match: Match;
  conditions: Array<{ field: F; op: O; value: string }>;
  onMatchChange: (match: Match) => void;
  onConditionsChange: (next: Array<{ field: F; op: O; value: string }>) => void;
  fieldOpts: Array<{ value: F; label: string }>;
  opOptions: (field: F) => Array<{ value: O; label: string }>;
  valueOptions: (field: F) => Array<{ value: string; label: string }> | null;
  defaultOp: (field: F) => O;
  defaultValue: (field: F) => string;
  addField: F;
  max?: number;
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
            className={opsChipClass(match === o.v)}
            onClick={() => onMatchChange(o.v)}
          >
            {o.label}
          </button>
        ))}
      </div>
      {conditions.length ? (
        <ul className="space-y-2">
          {conditions.map((c, i) => {
            const vals = valueOptions(c.field);
            const ops = opOptions(c.field);
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
                    const field = e.target.value as F;
                    const next = [...conditions];
                    next[i] = { field, op: defaultOp(field), value: defaultValue(field) };
                    onConditionsChange(next);
                  }}
                >
                  {fieldOpts.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                {singleOp ? (
                  <span className="px-1 text-xs text-[var(--muted-foreground)]">
                    {ops[0]?.label ?? ''}
                  </span>
                ) : (
                  <select
                    className="clay-input min-h-9 w-full text-sm"
                    value={c.op}
                    onChange={(e) => {
                      const next = [...conditions];
                      next[i] = { ...c, op: e.target.value as O };
                      onConditionsChange(next);
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
                      const next = [...conditions];
                      next[i] = { ...c, value: e.target.value };
                      onConditionsChange(next);
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
                      const next = [...conditions];
                      next[i] = { ...c, value: e.target.value };
                      onConditionsChange(next);
                    }}
                    inputMode={
                      c.field === 'cartQty' ||
                      c.field === 'matchingQty' ||
                      c.field === 'maxSubtotalPaise'
                        ? 'decimal'
                        : undefined
                    }
                  />
                )}
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center justify-self-end rounded-full opacity-60 hover:opacity-100 sm:justify-self-center"
                  aria-label="Remove condition"
                  onClick={() => onConditionsChange(conditions.filter((_, j) => j !== i))}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <button
        type="button"
        className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] disabled:opacity-40"
        disabled={conditions.length >= max}
        onClick={() =>
          onConditionsChange([
            ...conditions,
            { field: addField, op: defaultOp(addField), value: defaultValue(addField) },
          ])
        }
      >
        <Plus className="h-3.5 w-3.5" />
        Add condition
      </button>
    </div>
  );
}
