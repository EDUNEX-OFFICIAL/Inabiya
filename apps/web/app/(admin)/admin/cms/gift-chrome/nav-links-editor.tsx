'use client';

import { useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';

export type NavLinkRow = {
  href: string;
  label: string;
  group?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  imageSrc?: string;
};

type CollectionOpt = { slug: string; title: string };

const UNGROUPED = '';

export function compactNavLinks(rows: NavLinkRow[]): NavLinkRow[] {
  return rows.flatMap((l) => {
    const href = l.href.trim();
    const label = l.label.trim();
    if (!href || !label) return [];
    const row: NavLinkRow = { href, label };
    const group = l.group?.trim();
    const headline = l.headline?.trim();
    const body = l.body?.trim();
    const ctaLabel = l.ctaLabel?.trim();
    const imageSrc = l.imageSrc?.trim();
    if (group) row.group = group;
    if (headline) row.headline = headline;
    if (body) row.body = body;
    if (ctaLabel) row.ctaLabel = ctaLabel;
    if (imageSrc) row.imageSrc = imageSrc;
    return [row];
  });
}

function emptyRow(group = ''): NavLinkRow {
  return { href: '', label: '', group };
}

function groupKey(row: NavLinkRow): string {
  return row.group?.trim() ?? UNGROUPED;
}

function columnTitle(key: string): string {
  return key || 'Ungrouped';
}

/** Ordered column keys: groupOptions first, then extras from links, then Ungrouped if needed. */
function buildColumnKeys(links: NavLinkRow[], groupOptions: string[]): string[] {
  const seen = new Set<string>();
  const keys: string[] = [];
  for (const g of groupOptions) {
    const k = g.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    keys.push(k);
  }
  for (const row of links) {
    const k = groupKey(row);
    if (k === UNGROUPED || seen.has(k)) continue;
    seen.add(k);
    keys.push(k);
  }
  if (links.some((l) => groupKey(l) === UNGROUPED)) {
    keys.push(UNGROUPED);
  }
  return keys;
}

const INPUT = 'clay-input mt-1 block w-full text-sm';
const BTN_ICON =
  'inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] disabled:opacity-40';

export function GiftNavLinksEditor({
  links,
  onChange,
  groupOptions,
  collections,
}: {
  links: NavLinkRow[];
  onChange: (next: NavLinkRow[]) => void;
  groupOptions: string[];
  collections: CollectionOpt[];
}) {
  const listId = useId();
  const [pick, setPick] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const columns = useMemo(() => {
    const keys = buildColumnKeys(links, groupOptions);
    return keys.map((key) => ({
      key,
      title: columnTitle(key),
      indices: links.map((row, i) => (groupKey(row) === key ? i : -1)).filter((i) => i >= 0),
    }));
  }, [links, groupOptions]);

  function patch(i: number, next: Partial<NavLinkRow>) {
    onChange(links.map((row, idx) => (idx === i ? { ...row, ...next } : row)));
  }

  /** Reorder within the same column only (swap with prev/next sibling in that column). */
  function moveInColumn(flatIndex: number, columnKey: string, dir: -1 | 1) {
    const colIndices = links
      .map((row, i) => (groupKey(row) === columnKey ? i : -1))
      .filter((i) => i >= 0);
    const pos = colIndices.indexOf(flatIndex);
    if (pos < 0) return;
    const targetPos = pos + dir;
    if (targetPos < 0 || targetPos >= colIndices.length) return;
    const j = colIndices[targetPos]!;
    const next = [...links];
    const a = next[flatIndex]!;
    next[flatIndex] = next[j]!;
    next[j] = a;
    onChange(next);
    if (expanded === flatIndex) setExpanded(j);
    else if (expanded === j) setExpanded(flatIndex);
  }

  function addLink(group: string) {
    const next = [...links, emptyRow(group)];
    onChange(next);
    setExpanded(next.length - 1);
  }

  function addCollection() {
    const col = collections.find((c) => c.slug === pick);
    if (!col) return;
    const href = `/gift/collections/${col.slug}`;
    if (links.some((l) => l.href === href)) return;
    const next = [...links, { href, label: col.title, group: groupOptions[0] ?? '' }];
    onChange(next);
    setPick('');
    setExpanded(next.length - 1);
  }

  return (
    <div className="space-y-3">
      {columns.map((col) => (
        <section
          key={col.key || '__ungrouped'}
          className="rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
        >
          <header className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-2">
            <h4 className="text-xs font-semibold tracking-wide text-[var(--muted-foreground)] uppercase">
              {col.title}
              <span className="ml-1.5 font-normal normal-case tabular-nums opacity-70">
                {col.indices.length}
              </span>
            </h4>
            <button
              type="button"
              className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
              onClick={() => addLink(col.key)}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add link
            </button>
          </header>

          {col.indices.length ? (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {col.indices.map((i, pos) => {
                const row = links[i]!;
                const open = expanded === i;
                return (
                  <li key={`${col.key}-${i}`} className="bg-[var(--background)]">
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
                      </button>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          className={BTN_ICON}
                          aria-label="Move up"
                          disabled={pos === 0}
                          onClick={() => moveInColumn(i, col.key, -1)}
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className={BTN_ICON}
                          aria-label="Move down"
                          disabled={pos === col.indices.length - 1}
                          onClick={() => moveInColumn(i, col.key, 1)}
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
                            placeholder="/gift/collections/…"
                          />
                        </label>
                        <label className="block min-w-0 sm:col-span-2 sm:max-w-xs">
                          <span className="text-xs font-medium">Column</span>
                          <input
                            className={INPUT}
                            list={`${listId}-groups`}
                            value={row.group ?? ''}
                            onChange={(e) => patch(i, { group: e.target.value })}
                            placeholder={groupOptions[0] ?? ''}
                          />
                        </label>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>
      ))}

      {!columns.length ? (
        <button
          type="button"
          className="clay-btn-secondary inline-flex min-h-9 items-center gap-1.5 text-sm"
          onClick={() => addLink(groupOptions[0] ?? '')}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Add link
        </button>
      ) : null}

      <datalist id={`${listId}-groups`}>
        {groupOptions.map((g) => (
          <option key={g} value={g} />
        ))}
      </datalist>

      {collections.length ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="min-w-0 flex-1 sm:max-w-xs">
            <span className="text-xs font-medium">From collection</span>
            <select
              className={INPUT}
              value={pick}
              onChange={(e) => setPick(e.target.value)}
              aria-label="Collection"
            >
              <option value="">Choose…</option>
              {collections.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="clay-btn-ghost min-h-9 text-sm disabled:opacity-40"
            disabled={!pick}
            onClick={addCollection}
          >
            Add collection
          </button>
        </div>
      ) : null}
    </div>
  );
}
