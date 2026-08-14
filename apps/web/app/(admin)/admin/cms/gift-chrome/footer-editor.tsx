'use client';

import { useId } from 'react';

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
  }

  return (
    <div className="space-y-2">
      {links.map((row, i) => (
        <div
          key={`${row.href}-${i}`}
          className="grid gap-2 rounded border p-2 sm:grid-cols-[1fr_1fr_auto]"
        >
          <label className="block min-w-0">
            Label
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={row.label}
              onChange={(e) => patch(i, { label: e.target.value })}
            />
          </label>
          <label className="block min-w-0">
            URL
            <input
              className="mt-1 w-full border rounded px-2 py-1 font-mono text-xs"
              value={row.href}
              onChange={(e) => patch(i, { href: e.target.value })}
            />
          </label>
          <div className="flex flex-wrap items-end gap-1">
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => move(i, -1)}
            >
              Up
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => move(i, 1)}
            >
              Down
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => onChange(links.filter((_, idx) => idx !== i))}
            >
              Remove
            </button>
          </div>
          {showNetwork ? (
            <label className="block sm:col-span-2">
              Network
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                value={row.network ?? ''}
                onChange={(e) => patch(i, { network: e.target.value })}
                list={networkListId}
              />
            </label>
          ) : null}
        </div>
      ))}
      <button
        type="button"
        className="rounded border px-3 py-1.5"
        onClick={() => onChange([...links, { label: '', href: '', network: '' }])}
      >
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
    <section className="space-y-3">
      <h2 className="font-medium">Footer columns</h2>
      {columns.map((col, i) => (
        <div key={`col-${i}`} className="space-y-2 rounded border p-3">
          <label className="block">
            Title
            <input
              className="mt-1 w-full border rounded px-2 py-1"
              value={col.title}
              onChange={(e) => patchCol(i, { title: e.target.value })}
            />
          </label>
          <GiftChromeLinkRows links={col.links} onChange={(links) => patchCol(i, { links })} />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => moveCol(i, -1)}
            >
              Up
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => moveCol(i, 1)}
            >
              Down
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs"
              onClick={() => onChange(columns.filter((_, idx) => idx !== i))}
            >
              Remove column
            </button>
          </div>
        </div>
      ))}
      {columns.length < 4 ? (
        <button
          type="button"
          className="rounded border px-3 py-1.5"
          onClick={() => onChange([...columns, { title: '', links: [] }])}
        >
          Add column
        </button>
      ) : null}
    </section>
  );
}

export function GiftFooterLinkListEditor({
  heading,
  links,
  onChange,
  showNetwork,
}: {
  heading: string;
  links: ChromeLinkRow[];
  onChange: (next: ChromeLinkRow[]) => void;
  showNetwork?: boolean;
}) {
  const listId = useId();
  return (
    <section className="space-y-3">
      <h2 className="font-medium">{heading}</h2>
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
    </section>
  );
}
