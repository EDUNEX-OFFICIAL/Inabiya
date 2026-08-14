'use client';

import { useId, useState } from 'react';

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

export function GiftNavLinksEditor({
  heading,
  links,
  onChange,
  groupOptions,
  collections,
}: {
  heading: string;
  links: NavLinkRow[];
  onChange: (next: NavLinkRow[]) => void;
  groupOptions: string[];
  collections: CollectionOpt[];
}) {
  const listId = useId();
  const [pick, setPick] = useState('');

  function patch(i: number, next: Partial<NavLinkRow>) {
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

  function addCollection() {
    const col = collections.find((c) => c.slug === pick);
    if (!col) return;
    const href = `/gift/collections/${col.slug}`;
    if (links.some((l) => l.href === href)) return;
    onChange([...links, { href, label: col.title, group: groupOptions[0] ?? '' }]);
    setPick('');
  }

  return (
    <section className="space-y-3">
      <h2 className="font-medium">{heading}</h2>
      <ul className="space-y-3">
        {links.map((row, i) => (
          <li key={`${row.href}-${i}`} className="rounded border p-3 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block">
                Label
                <input
                  className="mt-1 w-full border rounded px-2 py-1"
                  value={row.label}
                  onChange={(e) => patch(i, { label: e.target.value })}
                />
              </label>
              <label className="block">
                URL
                <input
                  className="mt-1 w-full border rounded px-2 py-1 font-mono text-xs"
                  value={row.href}
                  onChange={(e) => patch(i, { href: e.target.value })}
                />
              </label>
            </div>
            <label className="block">
              Group
              <input
                className="mt-1 w-full border rounded px-2 py-1"
                list={`${listId}-groups`}
                value={row.group ?? ''}
                onChange={(e) => patch(i, { group: e.target.value })}
              />
              <datalist id={`${listId}-groups`}>
                {groupOptions.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
            <details>
              <summary className="cursor-pointer text-xs opacity-70">Preview</summary>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  Headline
                  <input
                    className="mt-1 w-full border rounded px-2 py-1"
                    value={row.headline ?? ''}
                    onChange={(e) => patch(i, { headline: e.target.value })}
                  />
                </label>
                <label className="block sm:col-span-2">
                  Body
                  <input
                    className="mt-1 w-full border rounded px-2 py-1"
                    value={row.body ?? ''}
                    onChange={(e) => patch(i, { body: e.target.value })}
                  />
                </label>
                <label className="block">
                  CTA
                  <input
                    className="mt-1 w-full border rounded px-2 py-1"
                    value={row.ctaLabel ?? ''}
                    onChange={(e) => patch(i, { ctaLabel: e.target.value })}
                  />
                </label>
                <label className="block">
                  Image
                  <input
                    className="mt-1 w-full border rounded px-2 py-1 font-mono text-xs"
                    value={row.imageSrc ?? ''}
                    onChange={(e) => patch(i, { imageSrc: e.target.value })}
                  />
                </label>
              </div>
            </details>
            <div className="flex flex-wrap gap-2">
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
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-2">
        <button
          type="button"
          className="rounded border px-3 py-1.5"
          onClick={() => onChange([...links, emptyRow(groupOptions[0] ?? '')])}
        >
          Add link
        </button>
        {collections.length ? (
          <>
            <label className="min-w-[12rem] flex-1">
              Collection
              <select
                className="mt-1 w-full border rounded px-2 py-1"
                value={pick}
                onChange={(e) => setPick(e.target.value)}
              >
                <option value="">—</option>
                {collections.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="rounded border px-3 py-1.5" onClick={addCollection}>
              Add collection
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}
