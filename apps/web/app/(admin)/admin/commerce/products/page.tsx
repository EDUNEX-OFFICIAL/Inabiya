'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ExternalLink, Package, Pencil, Search, Upload, X } from 'lucide-react';
import { apiAuth, clearSession, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type StatusFilter = '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

type AdminProductListResponse = {
  items: CatalogProduct[];
  nextCursor: string | null;
  limit: number;
};

const PAGE_LIMIT = 25;

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

function totalAvailable(p: CatalogProduct): number {
  return p.variants.reduce((s, v) => s + (v.available ?? 0), 0);
}

function tagChips(p: CatalogProduct): string[] {
  const tags = [
    ...(p.recipientTags ?? []),
    ...(p.occasionTags ?? []).slice(0, 2),
    ...(p.storefrontLabels ?? []),
  ];
  return tags.slice(0, 3);
}

function statusLabel(status: string): string {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'DRAFT') return 'Draft';
  return status;
}

function statusTone(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  if (status === 'ARCHIVED') return 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80';
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function primaryMedia(p: CatalogProduct): { url: string; alt: string } | null {
  const img = p.media?.find((m) => (m.kind ?? 'IMAGE') === 'IMAGE' && m.url);
  if (!img?.url) return null;
  return { url: img.url, alt: img.altText?.trim() || p.title };
}

function ProductThumb({ product }: { product: CatalogProduct }) {
  const media = primaryMedia(product);
  if (!media) {
    return (
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[color:var(--muted-foreground)]"
        aria-hidden
      >
        <Package className="h-4 w-4 opacity-50" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin media URLs are arbitrary CDNs
    <img
      src={media.url}
      alt={media.alt}
      width={44}
      height={44}
      className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-[var(--border-subtle)]"
    />
  );
}

function ProductsDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const statusParam = (searchParams.get('status') ?? '') as StatusFilter;
  const cursorParam = searchParams.get('cursor') ?? '';

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT);
  /** Previous page cursors ('' = first page). Enables Prev without bidirectional API. */
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const filterKey = `${qParam}\0${statusParam}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      if (statusParam) params.set('status', statusParam);
      if (cursorParam) params.set('cursor', cursorParam);
      params.set('limit', String(PAGE_LIMIT));
      const data = await apiAuth<AdminProductListResponse>(
        `/admin/catalog/products?${params.toString()}`,
      );
      setProducts(data.items);
      setNextCursor(data.nextCursor);
      setPageLimit(data.limit);
      setSelected({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
      clearSession();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [qParam, statusParam, cursorParam, router]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    setQInput(qParam);
  }, [qParam]);

  // New search/status → drop Prev stack (URL cursor cleared by applyFilters).
  useEffect(() => {
    setCursorStack([]);
  }, [filterKey]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected],
  );
  const allSelected = products.length > 0 && products.every((p) => selected[p.id]);
  const pageIndex = cursorStack.length + 1;
  const canPrev = cursorStack.length > 0 || Boolean(cursorParam);

  const applyFilters = useCallback(
    (nextQ: string, nextStatus: StatusFilter, nextCursor?: string | null) => {
      const params = new URLSearchParams();
      if (nextQ.trim()) params.set('q', nextQ.trim());
      if (nextStatus) params.set('status', nextStatus);
      if (nextCursor) params.set('cursor', nextCursor);
      const qs = params.toString();
      router.replace(`/admin/commerce/products${qs ? `?${qs}` : ''}`);
    },
    [router],
  );

  function clearSearch() {
    setQInput('');
    setCursorStack([]);
    applyFilters('', statusParam);
  }

  function goNext() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, cursorParam]);
    applyFilters(qParam, statusParam, nextCursor);
  }

  function goPrev() {
    if (cursorStack.length === 0) {
      if (!cursorParam) return;
      // Landed with ?cursor= from share/bookmark — jump home for this filter.
      applyFilters(qParam, statusParam);
      return;
    }
    const prev = cursorStack[cursorStack.length - 1] ?? '';
    setCursorStack((s) => s.slice(0, -1));
    applyFilters(qParam, statusParam, prev || null);
  }

  // Debounce URL search so typing doesn't hammer the API on every keystroke.
  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === qParam) return;
    const t = window.setTimeout(() => {
      setCursorStack([]);
      applyFilters(trimmed, statusParam);
    }, 300);
    return () => window.clearTimeout(t);
  }, [qInput, qParam, statusParam, applyFilters]);

  async function publish(id: string) {
    setRowBusy(id);
    setError(null);
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/publish`, {
        method: 'POST',
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: updated.status,
              }
            : p,
        ),
      );
      setNotice('Published');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setRowBusy(null);
    }
  }

  async function unpublish(id: string) {
    setRowBusy(id);
    setError(null);
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/unpublish`, {
        method: 'POST',
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: updated.status,
              }
            : p,
        ),
      );
      setNotice('Moved to draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unpublish failed');
    } finally {
      setRowBusy(null);
    }
  }

  async function bulk(action: 'publish' | 'unpublish') {
    if (!selectedIds.length) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiAuth<{ results: Array<{ id: string; ok: boolean }> }>(
        '/admin/catalog/products/bulk',
        { method: 'POST', json: { ids: selectedIds, action } },
      );
      await load();
      setSelected({});
      const fail = res.results.filter((r) => !r.ok).length;
      if (fail) setError(`Bulk ${action} finished with ${fail} failure(s)`);
      else setNotice(`Bulk ${action} · ${selectedIds.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk failed');
    } finally {
      setBusy(false);
    }
  }

  const filterActive = Boolean(qParam || statusParam);

  return (
    <div>
      <OpsPageHeader
        title="Products"
        actions={
          <>
            <Link
              href="/admin/commerce/import"
              className="clay-btn-ghost hidden min-h-10 items-center gap-1.5 text-sm sm:inline-flex"
            >
              <Upload className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Import
            </Link>
            <Link
              href="/admin/commerce/categories"
              className="clay-btn-ghost hidden min-h-10 text-sm sm:inline-flex"
            >
              Categories
            </Link>
            <Link
              href="/admin/commerce/merchandising"
              className="clay-btn-ghost hidden min-h-10 text-sm sm:inline-flex"
            >
              Merch
            </Link>
            <Link href="/admin/commerce/products/new" className="clay-btn w-full text-sm sm:w-auto">
              New product
            </Link>
          </>
        }
      />

      <form
        className="mb-3 max-w-sm"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(qInput, statusParam);
        }}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--primary)_18%,transparent)] bg-[color-mix(in_srgb,var(--surface-soft)_88%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search title, slug, or SKU"
            aria-label="Search products"
            autoComplete="off"
            enterKeyHint="search"
          />
          {qInput ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--primary)] opacity-70 hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:opacity-100"
              aria-label="Clear search"
              onClick={clearSearch}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </form>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_CHIPS.map((c) => (
            <button
              key={c.value || 'all'}
              type="button"
              className={`min-h-9 shrink-0 rounded-full border px-3 text-xs transition-colors ${
                statusParam === c.value
                  ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]'
                  : 'border-[var(--border-subtle)] opacity-80 hover:opacity-100'
              }`}
              onClick={() => applyFilters(qInput, c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <span className="text-xs opacity-55 sm:ml-auto">
          {loading
            ? 'Loading…'
            : `${products.length} on this page${nextCursor ? ' · more' : ''}`}
        </span>
      </div>

      {selectedIds.length > 0 ? (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/95 px-3 py-2.5 text-sm shadow-sm backdrop-blur">
          <span className="font-medium tabular-nums">{selectedIds.length} selected</span>
          <button
            type="button"
            className="clay-btn min-h-9 px-3 text-xs disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulk('publish')}
          >
            Publish
          </button>
          <button
            type="button"
            className="clay-btn-secondary min-h-9 px-3 text-xs disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulk('unpublish')}
          >
            Unpublish
          </button>
          <button
            type="button"
            className="clay-btn-ghost min-h-9 text-xs sm:ml-auto"
            onClick={() => setSelected({})}
          >
            Clear
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading products">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && products.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Package className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No products match this filter.' : 'No products yet.'}
          </p>
          <Link href="/admin/commerce/products/new" className="clay-btn text-sm">
            New product
          </Link>
        </div>
      ) : null}

      {!loading && products.length > 0 ? (
        <>
          {/* Mobile: product cards — easier to scan like a shopper */}
          <div className="md:hidden">
            <div className="mb-2 flex items-center gap-2 px-0.5">
              <input
                type="checkbox"
                id="catalog-select-all-mobile"
                aria-label="Select all products"
                checked={allSelected}
                onChange={(e) => {
                  const next: Record<string, boolean> = {};
                  for (const p of products) next[p.id] = e.target.checked;
                  setSelected(next);
                }}
              />
              <label htmlFor="catalog-select-all-mobile" className="text-xs opacity-60">
                Select all
              </label>
            </div>
            <ul className="space-y-2">
              {products.map((p) => {
                const avail = totalAvailable(p);
                const chips = tagChips(p);
                const low = avail <= 5;
                return (
                  <li key={p.id} className="clay-panel p-3">
                    <div className="flex gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 shrink-0"
                        aria-label={`Select ${p.title}`}
                        checked={Boolean(selected[p.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                        }
                      />
                      <ProductThumb product={p} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/commerce/products/${p.id}`}
                            className="min-w-0 break-words font-medium leading-snug underline-offset-2 hover:underline"
                          >
                            {p.title}
                          </Link>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusTone(p.status)}`}
                          >
                            {statusLabel(p.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm tabular-nums">
                          {formatInr(p.fromPricePaise)}
                          <span
                            className={`ml-2 text-xs ${low ? 'font-medium text-amber-800' : 'opacity-55'}`}
                          >
                            · {avail} in stock
                          </span>
                        </p>
                        {chips.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {chips.map((t) => (
                              <span
                                key={t}
                                className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 text-[10px] capitalize tracking-wide opacity-80"
                              >
                                {t.toLowerCase().replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link
                            href={`/admin/commerce/products/${p.id}`}
                            className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-2.5 text-xs"
                          >
                            <Pencil className="h-3 w-3" aria-hidden />
                            Edit
                          </Link>
                          {p.status === 'PUBLISHED' ? (
                            <button
                              type="button"
                              className="clay-btn-ghost min-h-9 px-2 text-xs disabled:opacity-50"
                              disabled={rowBusy === p.id}
                              onClick={() => void unpublish(p.id)}
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="clay-btn-ghost min-h-9 px-2 text-xs disabled:opacity-50"
                              disabled={rowBusy === p.id}
                              onClick={() => void publish(p.id)}
                            >
                              Publish
                            </button>
                          )}
                          {p.status === 'PUBLISHED' ? (
                            <Link
                              href={`/gift/products/${p.slug}`}
                              className="clay-btn-ghost inline-flex min-h-9 items-center gap-1 px-2 text-xs"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="h-3 w-3" aria-hidden />
                              Storefront
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop: denser power table */}
          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[48rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          checked={allSelected}
                          onChange={(e) => {
                            const next: Record<string, boolean> = {};
                            for (const p of products) next[p.id] = e.target.checked;
                            setSelected(next);
                          }}
                        />
                      </th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Product</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Stock</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Tags</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">From</th>
                      <th className="px-2 py-2.5 pr-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const avail = totalAvailable(p);
                      const chips = tagChips(p);
                      const low = avail <= 5;
                      const selectedRow = Boolean(selected[p.id]);
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
                            selectedRow
                              ? 'bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]'
                              : 'hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]'
                          }`}
                        >
                          <td className="px-3 py-2.5 align-middle">
                            <input
                              type="checkbox"
                              aria-label={`Select ${p.title}`}
                              checked={selectedRow}
                              onChange={(e) =>
                                setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                              }
                            />
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <div className="flex items-center gap-3">
                              <ProductThumb product={p} />
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/commerce/products/${p.id}`}
                                  className="font-medium underline-offset-2 hover:underline"
                                >
                                  {p.title}
                                </Link>
                                {p.variants[0]?.sku ? (
                                  <p className="mt-0.5 truncate text-[11px] tabular-nums opacity-50">
                                    {p.variants[0].sku}
                                    {p.variants.length > 1
                                      ? ` · +${p.variants.length - 1} variants`
                                      : ''}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(p.status)}`}
                            >
                              {statusLabel(p.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <div className="flex items-baseline gap-2">
                              <span
                                className={`tabular-nums ${low ? 'font-semibold text-amber-800' : ''}`}
                              >
                                {avail}
                              </span>
                              <Link
                                href={`/admin/commerce/inventory?q=${encodeURIComponent(p.variants[0]?.sku ?? p.slug)}`}
                                className="text-[11px] opacity-50 underline-offset-2 hover:opacity-90 hover:underline"
                              >
                                Ledger
                              </Link>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <div className="flex max-w-[12rem] flex-wrap gap-1">
                              {chips.length ? (
                                chips.map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 text-[10px] capitalize tracking-wide opacity-75"
                                  >
                                    {t.toLowerCase().replace(/_/g, ' ')}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs opacity-40">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle whitespace-nowrap tabular-nums">
                            {formatInr(p.fromPricePaise)}
                          </td>
                          <td className="px-2 py-2.5 pr-3 align-middle">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Link
                                href={`/admin/commerce/products/${p.id}`}
                                className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
                              >
                                <Pencil className="h-3 w-3 opacity-70" aria-hidden />
                                Edit
                              </Link>
                              {p.status === 'PUBLISHED' ? (
                                <button
                                  type="button"
                                  className="clay-btn-ghost min-h-8 px-2 text-xs disabled:opacity-50"
                                  disabled={rowBusy === p.id}
                                  onClick={() => void unpublish(p.id)}
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="clay-btn-ghost min-h-8 px-2 text-xs disabled:opacity-50"
                                  disabled={rowBusy === p.id}
                                  onClick={() => void publish(p.id)}
                                >
                                  Publish
                                </button>
                              )}
                              {p.status === 'PUBLISHED' ? (
                                <Link
                                  href={`/gift/products/${p.slug}`}
                                  className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`View ${p.title} on storefront`}
                                >
                                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                                  View
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </OpsTableScroll>
          </div>
        </>
      ) : null}

      {!loading && products.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-xs disabled:opacity-40"
            disabled={!canPrev || loading}
            onClick={goPrev}
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Prev
          </button>
          <span className="tabular-nums text-xs opacity-60">
            Page {pageIndex}
            {pageLimit ? ` · ${pageLimit}/page` : ''}
          </span>
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-xs disabled:opacity-40"
            disabled={!nextCursor || loading}
            onClick={goNext}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <ProductsDeskInner />
    </Suspense>
  );
}
