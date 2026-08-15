'use client';

import { useId, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

export type ChromeLinkRow = { label: string; href: string; network?: string };

export type FooterColRow = { title: string; links: ChromeLinkRow[] };

export function compactChromeLinks(rows: ChromeLinkRow[], withNetwork = false): ChromeLinkRow[] {
  return rows.flatMap((l) => {
    const href = l.href.trim();
    const label = l.label.trim();
    if (!href || !label) return [];
    const row: ChromeLinkRow = { href, label };
    const network = l.network?.trim();
    if (withNetwork && network) row.network = network;
    return [row];
  });
}

export function compactFooterColumns(cols: FooterColRow[]): FooterColRow[] {
  return cols
    .map((c) => ({ title: c.title.trim(), links: compactChromeLinks(c.links) }))
    .filter((c) => c.title && c.links.length);
}

const INPUT = 'clay-input mt-1 block w-full text-sm';
const BTN_ICON =
  'inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] disabled:opacity-40';

function GiftChromeLinkRows({
  links,
  onChange,
  showNetwork,
  networkListId,
}: {
  links: ChromeLinkRow[];
  onChange: (next: ChromeLinkRow[]) => void;
  showNetwork?: boolean;
  networkListId?: string;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);

  function patch(i: number, next: Partial<ChromeLinkRow>) {
    onChange(links.map((row, idx) => (idx === i ? { ...row, ...next } : row)));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
    onChange(next);
    if (expanded === i) setExpanded(j);
    else if (expanded === j) setExpanded(i);
  }

  function addLink() {
    const next = [...links, { label: '', href: '', network: '' }];
    onChange(next);
    setExpanded(next.length - 1);
  }

  return (
    <div className="space-y-2">
      {links.length ? (
        <ul className="overflow-hidden rounded-xl border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
          {links.map((row, i) => {
            const open = expanded === i;
            return (
              <li key={`${row.href}-${i}`} className="bg-[var(--background)]">
                <div className="flex items-center gap-1 px-2 py-1.5 sm:px-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                    aria-expanded={open}
                    onClick={() => setExpanded(open ? null : i)}
                  >
                    {open ? (
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
                    )}
                    <span className="min-w-0 truncate text-sm font-medium">
                      {row.label.trim() || 'Untitled'}
                    </span>
                    <span className="hidden min-w-0 truncate font-mono text-xs text-[var(--muted-foreground)] sm:inline">
                      {row.href.trim() || '—'}
                    </span>
                    {showNetwork && row.network?.trim() ? (
                      <span className="hidden shrink-0 rounded-md bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--muted-foreground)] sm:inline">
                        {row.network.trim()}
                      </span>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      className={BTN_ICON}
                      aria-label="Move up"
                      disabled={i === 0}
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={BTN_ICON}
                      aria-label="Move down"
                      disabled={i === links.length - 1}
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="h-4 w-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className={`${BTN_ICON} text-red-700`}
                      aria-label="Remove"
                      onClick={() => {
                        onChange(links.filter((_, idx) => idx !== i));
                        setExpanded((cur) => {
                          if (cur === null) return null;
                          if (cur === i) return null;
                          return cur > i ? cur - 1 : cur;
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                {open ? (
                  <div className="grid gap-2 border-t border-[var(--border-subtle)] px-3 py-3 sm:grid-cols-2">
                    <label className="block min-w-0">
                      <span className="text-xs font-medium">Label</span>
                      <input
                        className={INPUT}
                        value={row.label}
                        onChange={(e) => patch(i, { label: e.target.value })}
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="text-xs font-medium">Link</span>
                      <input
                        className={`${INPUT} font-mono text-xs`}
                        value={row.href}
                        onChange={(e) => patch(i, { href: e.target.value })}
                      />
                    </label>
                    {showNetwork ? (
                      <label className="block min-w-0 sm:col-span-2 sm:max-w-xs">
                        <span className="text-xs font-medium">Icon</span>
                        <input
                          className={INPUT}
                          value={row.network ?? ''}
                          onChange={(e) => patch(i, { network: e.target.value })}
                          list={networkListId}
                          placeholder="instagram"
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      <button
        type="button"
        className="clay-btn-secondary inline-flex min-h-9 items-center gap-1.5 text-sm"
        onClick={addLink}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
        Add link
      </button>
    </div>
  );
}

export function GiftFooterColumnsEditor({
  columns,
  onChange,
}: {
  columns: FooterColRow[];
  onChange: (next: FooterColRow[]) => void;
}) {
  function patchCol(i: number, next: Partial<FooterColRow>) {
    onChange(columns.map((c, idx) => (idx === i ? { ...c, ...next } : c)));
  }

  function moveCol(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= columns.length) return;
    const next = [...columns];
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {columns.map((col, i) => (
        <details
          key={`col-${i}`}
          className="rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
          open={i === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 truncate text-sm font-medium">
              {col.title.trim() || 'Untitled column'}
              <span className="ml-2 font-normal text-[var(--muted-foreground)]">
                · {col.links.length}
              </span>
            </span>
            <span className="flex shrink-0 gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className={BTN_ICON}
                aria-label="Move column up"
                disabled={i === 0}
                onClick={() => moveCol(i, -1)}
              >
                <ArrowUp className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={BTN_ICON}
                aria-label="Move column down"
                disabled={i === columns.length - 1}
                onClick={() => moveCol(i, 1)}
              >
                <ArrowDown className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                className={`${BTN_ICON} text-red-700`}
                aria-label="Remove column"
                onClick={() => onChange(columns.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </span>
          </summary>
          <div className="space-y-3 border-t border-[var(--border-subtle)] bg-[var(--background)] p-3">
            <label className="block max-w-sm">
              <span className="text-xs font-medium">Column title</span>
              <input
                className={INPUT}
                value={col.title}
                onChange={(e) => patchCol(i, { title: e.target.value })}
              />
            </label>
            <GiftChromeLinkRows links={col.links} onChange={(links) => patchCol(i, { links })} />
          </div>
        </details>
      ))}
      {columns.length < 4 ? (
        <button
          type="button"
          className="clay-btn-secondary inline-flex min-h-9 items-center gap-1.5 text-sm"
          onClick={() => onChange([...columns, { title: '', links: [] }])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add column
        </button>
      ) : null}
    </div>
  );
}

export function GiftFooterLinkListEditor({
  links,
  onChange,
  showNetwork,
}: {
  links: ChromeLinkRow[];
  onChange: (next: ChromeLinkRow[]) => void;
  showNetwork?: boolean;
}) {
  const listId = useId();
  return (
    <div className="space-y-3">
      <GiftChromeLinkRows
        links={links}
        onChange={onChange}
        showNetwork={showNetwork}
        networkListId={listId}
      />
      {showNetwork ? (
        <datalist id={listId}>
          <option value="instagram" />
          <option value="facebook" />
          <option value="whatsapp" />
          <option value="mail" />
        </datalist>
      ) : null}
    </div>
  );
}
