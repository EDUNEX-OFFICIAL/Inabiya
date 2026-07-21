'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { apiUrl } from '@/lib/api-base';
import { formatInr } from '@/lib/catalog';

const MIN_Q = 2;
const MAX_Q = 120;

type Suggestion = {
  id: string;
  slug: string;
  title: string;
  fromPricePaise: number;
};

type Props = {
  /** Full-width field (mobile drawer). Desktop uses a compact fixed width. */
  defaultExpanded?: boolean;
  className?: string;
  onNavigate?: () => void;
  /** Fired when the search field gains focus (closes mega menus, etc.). */
  onExpand?: () => void;
};

function clampQuery(raw: string): string {
  return raw.slice(0, MAX_Q);
}

export function GiftSearch({
  defaultExpanded = false,
  className = '',
  onNavigate,
  onExpand,
}: Props) {
  const router = useRouter();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openList, setOpenList] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (debounced.length < MIN_Q) {
      setItems([]);
      setError(null);
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    fetch(
      apiUrl(
        `/catalog/products?q=${encodeURIComponent(debounced)}&sort=newest`,
      ),
      { signal: controller.signal },
    )
      .then(async (res) => {
        if (!res.ok) throw new Error('Search failed');
        return res.json() as Promise<Suggestion[]>;
      })
      .then((rows) => {
        setItems(
          (Array.isArray(rows) ? rows : []).slice(0, 6).map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            fromPricePaise:
              typeof p.fromPricePaise === 'number' && Number.isFinite(p.fromPricePaise)
                ? p.fromPricePaise
                : 0,
          })),
        );
        setOpenList(true);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setItems([]);
        setError('Could not search right now.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [debounced]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenList(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setOpenList(false);
      inputRef.current?.blur();
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function clearQuery() {
    setQuery('');
    setItems([]);
    setOpenList(false);
    setError(null);
    inputRef.current?.focus();
  }

  function goToResults() {
    const q = query.trim();
    if (q.length < MIN_Q) return;
    setOpenList(false);
    onNavigate?.();
    router.push(`/gift/products?q=${encodeURIComponent(clampQuery(q))}`);
  }

  const showPanel = openList && (debounced.length >= MIN_Q || busy || error);
  const showSeeAll = !busy && !error && debounced.length >= MIN_Q;

  return (
    <div
      ref={rootRef}
      className={`relative shrink-0 ${defaultExpanded ? 'w-full' : 'w-[14rem] lg:w-[16rem]'} ${className}`}
    >
      <form
        className="flex w-full min-w-0 items-center gap-gs-1 overflow-hidden rounded-pill border border-border-subtle bg-white px-gs-2 shadow-sm"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
      >
        <Search className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        <label htmlFor={inputId} className="sr-only">
          Search gifts
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={query}
          maxLength={MAX_Q}
          onChange={(e) => {
            setQuery(clampQuery(e.target.value));
            setOpenList(true);
          }}
          onFocus={() => {
            onExpand?.();
            setOpenList(true);
          }}
          placeholder="Search gifts…"
          className="min-w-0 flex-1 bg-transparent py-gs-2 text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button
          type="button"
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-pill hover:bg-surface-soft ${
            query ? '' : 'invisible pointer-events-none'
          }`}
          aria-label="Clear search"
          tabIndex={query ? 0 : -1}
          onClick={clearQuery}
        >
          <X className="h-4 w-4" />
        </button>
      </form>

      {showPanel ? (
        <div
          className="absolute left-0 right-0 z-40 mt-gs-2 w-full overflow-hidden rounded-control border border-border-subtle bg-white p-gs-2 shadow-clay"
          role="listbox"
          aria-label="Gift search suggestions"
        >
          {busy ? <p className="gift-muted px-gs-2 py-gs-2">Searching…</p> : null}
          {error ? <p className="px-gs-2 py-gs-2 text-sm text-danger">{error}</p> : null}
          {!busy && !error && debounced.length >= MIN_Q && items.length === 0 ? (
            <p className="gift-muted break-all px-gs-2 py-gs-2">
              No gifts match “{debounced}”.
            </p>
          ) : null}
          {items.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto">
              {items.map((p) => (
                <li key={p.id} role="option" aria-selected="false">
                  <Link
                    href={`/gift/products/${p.slug}`}
                    className="flex items-baseline justify-between gap-gs-3 rounded-lg px-gs-2 py-gs-2 hover:bg-surface-soft"
                    onClick={() => {
                      setOpenList(false);
                      onNavigate?.();
                    }}
                  >
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="shrink-0 text-xs font-semibold text-primary">
                      {formatInr(p.fromPricePaise)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {showSeeAll ? (
            <Link
              href={`/gift/products?q=${encodeURIComponent(debounced)}`}
              className="mt-gs-1 block rounded-lg px-gs-2 py-gs-2 text-sm font-medium text-primary hover:bg-surface-soft"
              onClick={() => {
                setOpenList(false);
                onNavigate?.();
              }}
            >
              See all results →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
