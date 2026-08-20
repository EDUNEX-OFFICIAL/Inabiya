'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { apiUrl } from '@/lib/api-base';
import { blogIndexPath, blogPostPath } from '@/lib/blog-paths';

const MIN_Q = 2;
const MAX_Q = 120;

type Suggestion = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
};

type PublicSearchFallbackRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: { name: string } | null;
};

type Props = {
  defaultExpanded?: boolean;
  defaultQuery?: string;
  className?: string;
  onNavigate?: () => void;
  onExpand?: () => void;
};

function clampQuery(raw: string): string {
  return raw.slice(0, MAX_Q);
}

export function BlogSearch({
  defaultExpanded = false,
  defaultQuery = '',
  className = '',
  onNavigate,
  onExpand,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(defaultQuery);
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
    fetch(apiUrl(`/blog/search?q=${encodeURIComponent(debounced)}`), {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (res.ok) return res.json() as Promise<Suggestion[]>;
        // Fallback keeps search usable when typeahead route is unavailable.
        const fallbackRes = await fetch(apiUrl(`/blog?q=${encodeURIComponent(debounced)}`), {
          signal: controller.signal,
        });
        if (!fallbackRes.ok) throw new Error('Search failed');
        const rows = (await fallbackRes.json()) as PublicSearchFallbackRow[];
        return rows.slice(0, 6).map((row) => ({
          id: row.id,
          slug: row.slug,
          title: row.title,
          description: row.description,
          category: row.category?.name ?? null,
        }));
      })
      .then((rows) => {
        setItems(Array.isArray(rows) ? rows.slice(0, 6) : []);
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
    const category = searchParams.get('category')?.trim() || undefined;
    const tag = searchParams.get('tag')?.trim() || undefined;
    const hasActiveUrlQuery = Boolean(searchParams.get('q')?.trim());
    setQuery('');
    setItems([]);
    setOpenList(false);
    setError(null);
    if (hasActiveUrlQuery) {
      onNavigate?.();
      router.push(blogIndexPath({ category, tag }));
    }
    inputRef.current?.focus();
  }

  function goToResults() {
    const q = query.trim();
    if (q.length < MIN_Q) return;
    const category = searchParams.get('category')?.trim() || undefined;
    const tag = searchParams.get('tag')?.trim() || undefined;
    setOpenList(false);
    onNavigate?.();
    router.push(blogIndexPath({ q, category, tag }));
  }

  const showPanel = openList && (debounced.length >= MIN_Q || busy || error);
  const showSeeAll = !busy && !error && debounced.length >= MIN_Q;

  return (
    <div
      ref={rootRef}
      className={`relative shrink-0 ${defaultExpanded ? 'w-full' : 'w-full max-w-[14rem] sm:max-w-[16rem] lg:max-w-[18rem]'} ${className}`}
    >
      <form
        className="blog-search-field flex w-full min-w-0 items-center gap-gs-1 overflow-hidden rounded-pill border border-border-subtle bg-white px-gs-2"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
      >
        <Search className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        <label htmlFor={inputId} className="sr-only">
          Search journal
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
          placeholder="Search journal…"
          className="min-w-0 flex-1 bg-transparent py-gs-2 text-body outline-none [&::-webkit-search-cancel-button]:hidden"
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
          aria-label="Journal search suggestions"
        >
          {busy ? <p className="blog-muted px-gs-2 py-gs-2">Searching…</p> : null}
          {error ? <p className="px-gs-2 py-gs-2 text-body text-danger">{error}</p> : null}
          {!busy && !error && debounced.length >= MIN_Q && items.length === 0 ? (
            <p className="blog-muted break-all px-gs-2 py-gs-2">No articles match “{debounced}”.</p>
          ) : null}
          {items.length > 0 ? (
            <ul className="max-h-72 overflow-y-auto overscroll-contain">
              {items.map((a) => (
                <li key={a.id} role="option" aria-selected="false">
                  <Link
                    href={blogPostPath(a.slug)}
                    className="block rounded-control px-gs-2 py-gs-2 hover:bg-surface-soft"
                    onClick={() => {
                      setOpenList(false);
                      onNavigate?.();
                    }}
                  >
                    <span className="block truncate font-medium">{a.title}</span>
                    {a.category ? (
                      <span className="mt-0.5 block truncate text-caption uppercase tracking-wide text-primary opacity-80">
                        {a.category}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {showSeeAll ? (
            <Link
              href={blogIndexPath({
                q: debounced,
                category: searchParams.get('category')?.trim() || undefined,
                tag: searchParams.get('tag')?.trim() || undefined,
              })}
              className="mt-gs-1 block rounded-control px-gs-2 py-gs-2 text-body font-medium text-primary hover:bg-surface-soft"
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
