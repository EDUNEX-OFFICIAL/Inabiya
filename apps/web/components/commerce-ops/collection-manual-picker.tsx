'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Search, X } from 'lucide-react';
import { apiAuth } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';

export type ManualProductOpt = { slug: string; title: string };

type Hit = { id: string; slug: string; title: string };

/**
 * Hand-picked collection membership: search-to-add + removable chips.
 * Scales past the old “show first 50 as toggles” wall.
 */
export function CollectionManualPicker({
  selectedSlugs,
  knownProducts = [],
  onChange,
}: {
  selectedSlugs: string[];
  /** Titles for already-selected rows (e.g. current collection products). */
  knownProducts?: ManualProductOpt[];
  onChange: (slugs: string[]) => void;
}) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [titles, setTitles] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const p of knownProducts) m[p.slug] = p.title;
    return m;
  });
  const seq = useRef(0);

  useEffect(() => {
    setTitles((prev) => {
      const next = { ...prev };
      for (const p of knownProducts) next[p.slug] = p.title;
      return next;
    });
  }, [knownProducts]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      const n = ++seq.current;
      setSearching(true);
      void apiAuth<{ items: Hit[] }>(
        `/admin/catalog/products?q=${encodeURIComponent(term)}&limit=10&sort=title_asc`,
      )
        .then((res) => {
          if (n !== seq.current) return;
          setHits(res.items ?? []);
        })
        .catch(() => {
          if (n !== seq.current) return;
          setHits([]);
        })
        .finally(() => {
          if (n === seq.current) setSearching(false);
        });
    }, 280);
    return () => window.clearTimeout(t);
  }, [q]);

  function add(p: { slug: string; title: string }) {
    setTitles((prev) => ({ ...prev, [p.slug]: p.title }));
    if (!selectedSlugs.includes(p.slug)) {
      onChange([...selectedSlugs, p.slug]);
    }
    setQ('');
    setHits([]);
  }

  function remove(slug: string) {
    onChange(selectedSlugs.filter((s) => s !== slug));
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3">
          <Search className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:opacity-50"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product name or slug"
            aria-label="Search products to add"
            autoComplete="off"
          />
          {searching ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin opacity-50" aria-hidden />
          ) : null}
        </div>
        {hits.length > 0 ? (
          <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] py-1 shadow-md">
            {hits.map((p) => {
              const on = selectedSlugs.includes(p.slug);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)] disabled:opacity-50"
                    disabled={on}
                    onClick={() => add(p)}
                  >
                    <span className="min-w-0 truncate font-medium">{p.title}</span>
                    <span className="shrink-0 font-mono text-[11px] opacity-50">
                      {on ? 'Added' : p.slug}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

      {selectedSlugs.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-6 text-center text-sm opacity-55">
          No products yet — search above to add
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {selectedSlugs.map((slug) => (
            <li key={slug}>
              <span className={`${opsChipClass(true)} inline-flex max-w-full items-center gap-1.5`}>
                <span className="truncate">{titles[slug] ?? slug}</span>
                <button
                  type="button"
                  className="inline-flex shrink-0 opacity-70 hover:opacity-100"
                  aria-label={`Remove ${titles[slug] ?? slug}`}
                  onClick={() => remove(slug)}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
