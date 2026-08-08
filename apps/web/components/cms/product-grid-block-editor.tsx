'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import {
  collectionsToOptions,
  fetchCatalogCollectionsClient,
  type CollectionOption,
} from '@/lib/catalog-collections';

type CatalogLite = { slug: string; title: string };

const SOURCES = [
  { value: 'auto', label: 'Auto (category / hamper / newest)' },
  { value: 'manual', label: 'Manual (pick products)' },
  { value: 'bestsellers', label: 'Best sellers (BESTSELLER label)' },
  { value: 'editors', label: "Editor's picks" },
  { value: 'new', label: 'New arrivals' },
  { value: 'on_sale', label: 'On sale' },
] as const;

const OCCASIONS = ['', 'welcome-baby', 'baby-shower', 'naming', 'birthday'] as const;
const AGES = ['', 'newborn', 'infant', 'toddler', 'any'] as const;
const RECIPIENTS = ['', 'girl', 'boy', 'mom', 'unisex'] as const;

type Props = {
  props: Record<string, string>;
  onChange: (key: string, value: string) => void;
};

export function ProductGridBlockEditor({ props, onChange }: Props) {
  const [catalog, setCatalog] = useState<CatalogLite[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [collectionOptions, setCollectionOptions] = useState<CollectionOption[]>([]);
  const source = props.source || 'auto';
  const selectedSlugs = useMemo(
    () =>
      (props.productSlugs || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    [props.productSlugs],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(apiUrl('/catalog/products?sort=newest'), {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`Catalog ${res.status}`);
        const rows = (await res.json()) as Array<{ slug: string; title: string }>;
        if (!cancelled) {
          setCatalog(rows.map((r) => ({ slug: r.slug, title: r.title })));
          setLoadErr(null);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadErr(e instanceof Error ? e.message : 'Failed to load catalog');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchCatalogCollectionsClient('/admin/catalog/collections').then((rows) => {
      if (!cancelled) setCollectionOptions(collectionsToOptions(rows));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setSlugs(next: string[]) {
    onChange('productSlugs', next.join(', '));
  }

  function addSlug(slug: string) {
    if (!slug || selectedSlugs.includes(slug)) return;
    if (selectedSlugs.length >= 24) return;
    setSlugs([...selectedSlugs, slug]);
  }

  function removeSlug(slug: string) {
    setSlugs(selectedSlugs.filter((s) => s !== slug));
  }

  function moveSlug(slug: string, dir: -1 | 1) {
    const i = selectedSlugs.indexOf(slug);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= selectedSlugs.length) return;
    const next = [...selectedSlugs];
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
    setSlugs(next);
  }

  const available = catalog.filter((p) => !selectedSlugs.includes(p.slug));

  return (
    <div className="space-y-3">
      <label className="block">
        Source
        <select
          className="mt-1 block w-full rounded border px-2 py-1"
          value={source}
          onChange={(e) => onChange('source', e.target.value)}
        >
          {SOURCES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        Overline
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.overline ?? ''}
          onChange={(e) => onChange('overline', e.target.value)}
        />
      </label>
      <label className="block">
        Title
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.title ?? ''}
          onChange={(e) => onChange('title', e.target.value)}
        />
      </label>
      <label className="block">
        Subtitle
        <textarea
          className="mt-1 block w-full rounded border px-2 py-1 min-h-[56px]"
          value={props.subtitle ?? ''}
          onChange={(e) => onChange('subtitle', e.target.value)}
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Collection
          <select
            className="mt-1 block w-full rounded border px-2 py-1"
            value={props.collection ?? ''}
            onChange={(e) => onChange('collection', e.target.value)}
          >
            <option value="">— any —</option>
            {collectionOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Occasion
          <select
            className="mt-1 block w-full rounded border px-2 py-1"
            value={props.occasion ?? ''}
            onChange={(e) => onChange('occasion', e.target.value)}
          >
            {OCCASIONS.map((c) => (
              <option key={c || 'any'} value={c}>
                {c || '— any —'}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Age
          <select
            className="mt-1 block w-full rounded border px-2 py-1"
            value={props.age ?? ''}
            onChange={(e) => onChange('age', e.target.value)}
          >
            {AGES.map((c) => (
              <option key={c || 'any'} value={c}>
                {c || '— any —'}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Recipient
          <select
            className="mt-1 block w-full rounded border px-2 py-1"
            value={props.recipient ?? ''}
            onChange={(e) => onChange('recipient', e.target.value)}
          >
            {RECIPIENTS.map((c) => (
              <option key={c || 'any'} value={c}>
                {c || '— any —'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={props.hamper === 'true'}
          onChange={(e) => onChange('hamper', e.target.checked ? 'true' : 'false')}
        />
        Ready-made hampers only
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          Limit (1–24)
          <input
            type="number"
            min={1}
            max={24}
            className="mt-1 block w-full rounded border px-2 py-1"
            value={props.limit ?? ''}
            onChange={(e) => onChange('limit', e.target.value)}
            placeholder="8"
          />
        </label>
        {source === 'new' ? (
          <label className="block">
            New within days
            <input
              type="number"
              min={1}
              max={90}
              className="mt-1 block w-full rounded border px-2 py-1"
              value={props.newWithinDays ?? '30'}
              onChange={(e) => onChange('newWithinDays', e.target.value)}
            />
          </label>
        ) : (
          <span />
        )}
      </div>

      <label className="block">
        See all href
        <input
          className="mt-1 block w-full rounded border px-2 py-1 font-mono text-xs"
          value={props.seeAllHref ?? ''}
          onChange={(e) => onChange('seeAllHref', e.target.value)}
          placeholder="/gift/products"
        />
      </label>
      <label className="block">
        See all label
        <input
          className="mt-1 block w-full rounded border px-2 py-1"
          value={props.seeAllLabel ?? ''}
          onChange={(e) => onChange('seeAllLabel', e.target.value)}
        />
      </label>

      {source === 'manual' || source === 'auto' ? (
        <div className="rounded border p-2 space-y-2 bg-neutral-50">
          <p className="font-medium text-xs uppercase tracking-wide opacity-70">
            Products {source === 'manual' ? '(required order)' : '(optional override)'}
          </p>
          {loadErr ? <p className="text-xs text-red-600">{loadErr}</p> : null}
          <ul className="space-y-1">
            {selectedSlugs.map((slug) => {
              const title = catalog.find((p) => p.slug === slug)?.title ?? slug;
              return (
                <li
                  key={slug}
                  className="flex items-center gap-1 rounded border bg-white px-2 py-1 text-xs"
                >
                  <span className="flex-1 truncate">
                    {title}{' '}
                    <span className="opacity-50 font-mono">{slug}</span>
                  </span>
                  <button type="button" className="px-1" onClick={() => moveSlug(slug, -1)}>
                    ↑
                  </button>
                  <button type="button" className="px-1" onClick={() => moveSlug(slug, 1)}>
                    ↓
                  </button>
                  <button
                    type="button"
                    className="px-1 text-red-600"
                    onClick={() => removeSlug(slug)}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
          <select
            className="block w-full rounded border px-2 py-1 text-xs"
            value=""
            onChange={(e) => {
              addSlug(e.target.value);
              e.target.value = '';
            }}
          >
            <option value="">+ Add published product…</option>
            {available.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-xs opacity-70">
          Products resolve live from catalog by source (+ optional filters above). Tag products with
          BESTSELLER / EDITOR&apos;S PICK in commerce admin when using those sources.
        </p>
      )}
    </div>
  );
}
