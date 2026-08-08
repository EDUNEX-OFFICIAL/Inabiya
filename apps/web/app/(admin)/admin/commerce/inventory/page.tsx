'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { History, Package, Pencil, RefreshCw, Search, Upload, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type InventoryRow = {
  inventoryId: string;
  variantId: string;
  sku: string;
  label: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productStatus: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStock: boolean;
};

type Movement = {
  id: string;
  deltaOnHand: number;
  reason: string;
  note: string | null;
  onHandAfter: number;
  reservedAfter: number;
  actorEmail: string | null;
  createdAt: string;
};

type StockFilter = '' | 'low' | 'out';
type SortFilter = 'available_asc' | 'available_desc' | 'sku' | 'product';

const REASONS = ['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION'] as const;

const STOCK_CHIPS: Array<{ value: StockFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: 'available_asc', label: 'Available ↑' },
  { value: 'available_desc', label: 'Available ↓' },
  { value: 'sku', label: 'SKU' },
  { value: 'product', label: 'Product A–Z' },
];

const SORT_VALUES = new Set<SortFilter>(SORT_OPTIONS.map((o) => o.value));

function parseSort(raw: string | null): SortFilter {
  if (raw && SORT_VALUES.has(raw as SortFilter)) return raw as SortFilter;
  return 'available_asc';
}

function parseStock(raw: string | null, legacyLow: string | null): StockFilter {
  if (raw === 'low' || raw === 'out') return raw;
  if (legacyLow === '1') return 'low';
  return '';
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

function reasonLabel(reason: string): string {
  if (reason === 'RECEIVE') return 'Receive';
  if (reason === 'DAMAGE') return 'Damage';
  if (reason === 'RECOUNT') return 'Recount';
  if (reason === 'CORRECTION') return 'Correction';
  return reason;
}

function InventoryDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const stock = parseStock(searchParams.get('stock'), searchParams.get('lowStock'));
  const sort = parseSort(searchParams.get('sort'));

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [adjustFor, setAdjustFor] = useState<InventoryRow | null>(null);
  const [delta, setDelta] = useState('1');
  const [reason, setReason] = useState<(typeof REASONS)[number]>('RECEIVE');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const [historyFor, setHistoryFor] = useState<InventoryRow | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadSeq = useRef(0);
  const historySeq = useRef(0);
  const hasLoadedOnce = useRef(false);

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      if ('stock' in patch || 'lowStock' in patch) {
        params.delete('lowStock');
      }
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'lowStock') continue;
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      const s = params.toString();
      router.replace(s ? `/admin/commerce/inventory?${s}` : '/admin/commerce/inventory');
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      // Low uses API filter; Out loads full (≤200) then client-filters
      if (stock === 'low') params.set('lowStock', '1');
      const qs = params.toString();
      const data = await apiAuth<InventoryRow[]>(
        `/admin/commerce/inventory${qs ? `?${qs}` : ''}`,
      );
      if (seq !== loadSeq.current) return;
      setRows(data);
      hasLoadedOnce.current = true;
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [qParam, stock]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/inventory'));
      return;
    }
    void load();
  }, [load, router]);

  useEffect(() => {
    setQInput(qParam);
  }, [qParam]);

  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === qParam) return;
    const t = window.setTimeout(() => {
      patchQuery({ q: trimmed || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [qInput, qParam, patchQuery]);

  // Esc closes topmost dialog
  useEffect(() => {
    if (!adjustFor && !historyFor) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (busy) return;
      if (adjustFor) {
        setAdjustFor(null);
        setAdjustError(null);
        return;
      }
      if (historyFor) {
        historySeq.current += 1;
        setHistoryFor(null);
        setHistoryError(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [adjustFor, historyFor, busy]);

  const displayed = useMemo(() => {
    let list = rows;
    if (stock === 'out') list = list.filter((r) => r.available <= 0);

    const next = [...list];
    next.sort((a, b) => {
      if (sort === 'available_desc') {
        return b.available - a.available || a.sku.localeCompare(b.sku);
      }
      if (sort === 'sku') return a.sku.localeCompare(b.sku);
      if (sort === 'product') {
        return a.productTitle.localeCompare(b.productTitle) || a.sku.localeCompare(b.sku);
      }
      return a.available - b.available || a.sku.localeCompare(b.sku);
    });
    return next;
  }, [rows, stock, sort]);

  const filterActive = Boolean(qParam || stock || sort !== 'available_asc');
  // "N of M" only meaningful when client filters a larger fetched set (Out)
  const showSubsetCount = stock === 'out' && displayed.length !== rows.length;

  function clearFilters() {
    setQInput('');
    router.replace('/admin/commerce/inventory');
  }

  const deltaNum = Number(delta);
  const deltaValid = Number.isInteger(deltaNum) && deltaNum !== 0;
  // Matches API: available = onHand − reserved; block when available would go negative
  const previewAvailable = adjustFor && deltaValid ? adjustFor.available + deltaNum : null;
  const previewBlocked = previewAvailable != null && previewAvailable < 0;

  async function submitAdjust() {
    if (!adjustFor) return;
    if (!deltaValid) {
      setAdjustError('Delta must be a non-zero integer.');
      return;
    }
    if (previewBlocked) {
      setAdjustError('Available cannot go negative.');
      return;
    }
    setBusy(true);
    setAdjustError(null);
    setError(null);
    setNotice(null);
    const variantId = adjustFor.variantId;
    const sku = adjustFor.sku;
    try {
      await apiAuth(`/admin/commerce/inventory/${variantId}/adjust`, {
        method: 'POST',
        json: { delta: deltaNum, reason, note: note.trim() || undefined },
      });
      setAdjustFor(null);
      setDelta('1');
      setNote('');
      setReason('RECEIVE');
      setNotice(`Adjusted ${sku}`);
      await load();
      if (historyFor?.variantId === variantId) {
        const seq = ++historySeq.current;
        setHistoryLoading(true);
        setHistoryError(null);
        try {
          const next = await apiAuth<Movement[]>(
            `/admin/commerce/inventory/${variantId}/movements`,
          );
          if (seq === historySeq.current) setMovements(next);
        } catch (e) {
          if (seq === historySeq.current) {
            setHistoryError(e instanceof Error ? e.message : 'History failed');
          }
        } finally {
          if (seq === historySeq.current) setHistoryLoading(false);
        }
      }
    } catch (e) {
      setAdjustError(e instanceof Error ? e.message : 'Adjust failed');
    } finally {
      setBusy(false);
    }
  }

  async function openHistory(row: InventoryRow) {
    const seq = ++historySeq.current;
    setHistoryFor(row);
    setMovements([]);
    setHistoryLoading(true);
    setHistoryError(null);
    setError(null);
    try {
      const data = await apiAuth<Movement[]>(
        `/admin/commerce/inventory/${row.variantId}/movements`,
      );
      if (seq !== historySeq.current) return;
      setMovements(data);
    } catch (e) {
      if (seq !== historySeq.current) return;
      setHistoryError(e instanceof Error ? e.message : 'History failed');
      setMovements([]);
    } finally {
      if (seq === historySeq.current) setHistoryLoading(false);
    }
  }

  function openAdjust(row: InventoryRow) {
    setAdjustFor(row);
    setDelta(row.lowStock || row.available <= 0 ? '10' : '1');
    setReason('RECEIVE');
    setNote('');
    setAdjustError(null);
    setError(null);
  }

  function closeAdjust() {
    if (busy) return;
    setAdjustFor(null);
    setAdjustError(null);
  }

  function closeHistory() {
    historySeq.current += 1;
    setHistoryFor(null);
    setHistoryError(null);
    setHistoryLoading(false);
  }

  function rowActions(r: InventoryRow) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-1 font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          onClick={() => openAdjust(r)}
        >
          <Pencil className="h-3.5 w-3.5 opacity-60" aria-hidden />
          Adjust
        </button>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-1 font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          onClick={() => void openHistory(r)}
        >
          <History className="h-3.5 w-3.5 opacity-60" aria-hidden />
          History
        </button>
      </div>
    );
  }

  function stockMeta(r: InventoryRow) {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
        <span className="tabular-nums">
          On hand · <span className="font-medium text-[var(--foreground)]">{r.onHand}</span>
        </span>
        <span className="tabular-nums">Reserved · {r.reserved}</span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          Available ·{' '}
          <span
            className={`font-medium ${r.lowStock || r.available <= 0 ? 'text-amber-900' : 'text-[var(--foreground)]'}`}
          >
            {r.available}
          </span>
          {r.lowStock ? (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-900">
              Low
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  const countLabel = loading
    ? 'Loading…'
    : showSubsetCount
      ? `${displayed.length} of ${rows.length}`
      : `${displayed.length} SKUs`;

  return (
    <div>
      <OpsPageHeader
        title="Inventory"
        actions={
          <>
            {/* clay-btn-ghost sets display:inline-flex — wrap so Tailwind hidden wins on mobile */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin/commerce/import"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <Upload className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Import
              </Link>
            </div>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading || refreshing}
              onClick={() => void load()}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${loading || refreshing ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      <form
        className="mb-3 w-full max-w-xl"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          patchQuery({ q: qInput.trim() || null });
        }}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search SKU, label, product"
            aria-label="Search inventory"
            autoComplete="off"
            enterKeyHint="search"
          />
          {qInput ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--primary)] opacity-70 hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:opacity-100"
              aria-label="Clear search"
              onClick={() => {
                setQInput('');
                patchQuery({ q: null });
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
          role="group"
          aria-label="Filter by stock"
        >
          {STOCK_CHIPS.map((c) => {
            const active = stock === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => patchQuery({ stock: c.value || null })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <span className="hidden sm:inline">Sort</span>
          <select
            className="clay-input min-h-8 max-w-[11rem] py-1 text-xs sm:min-h-9 sm:text-sm"
            aria-label="Sort inventory"
            value={sort}
            onChange={(e) =>
              patchQuery({
                sort: e.target.value === 'available_asc' ? null : e.target.value,
              })
            }
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <span className="hidden items-center gap-1.5 text-xs text-[var(--muted-foreground)] sm:inline-flex">
          {refreshing && !loading ? (
            <RefreshCw className="h-3 w-3 animate-spin opacity-60" aria-hidden />
          ) : null}
          {countLabel}
        </span>
        {filterActive ? (
          <button
            type="button"
            className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            onClick={clearFilters}
          >
            Clear
          </button>
        ) : null}
      </div>

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
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading inventory">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && displayed.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Package className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No inventory rows match this filter.' : 'No inventory rows yet.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : (
            <Link href="/admin/commerce/products" className="clay-btn text-sm">
              Products
            </Link>
          )}
        </div>
      ) : null}

      {!loading && displayed.length > 0 ? (
        <div className={refreshing ? 'opacity-70 transition-opacity' : undefined} aria-busy={refreshing}>
          <div className="md:hidden">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
                {showSubsetCount ? `${displayed.length} of ${rows.length}` : displayed.length} shown
              </p>
              <Link
                href="/admin/commerce/import"
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline sm:hidden"
              >
                <Upload className="h-3 w-3 opacity-70" aria-hidden />
                Import
              </Link>
            </div>
            <ul className="space-y-2">
              {displayed.map((r) => (
                <li key={r.variantId} className="clay-panel p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/commerce/products/${r.productId}`}
                        className="font-medium leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                      >
                        {r.productTitle}
                      </Link>
                      <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">{r.sku}</p>
                    </div>
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(r.productStatus)}`}
                    >
                      {statusLabel(r.productStatus)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{r.label}</p>
                  <div className="mt-2">{stockMeta(r)}</div>
                  <div className="mt-2 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2">
                    {rowActions(r)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 font-medium">SKU</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Product</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">On hand</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Reserved</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Available</th>
                      <th className="px-2 py-2.5 pr-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((r) => (
                      <tr
                        key={r.variantId}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-middle font-mono text-xs">{r.sku}</td>
                        <td className="max-w-[14rem] px-2 py-2.5 pr-4 align-middle">
                          <Link
                            href={`/admin/commerce/products/${r.productId}`}
                            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                          >
                            {r.productTitle}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {r.label} ·{' '}
                            <span
                              className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusTone(r.productStatus)}`}
                            >
                              {statusLabel(r.productStatus)}
                            </span>
                          </p>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">{r.onHand}</td>
                        <td className="px-2 py-2.5 pr-4 align-middle tabular-nums text-[var(--muted-foreground)]">
                          {r.reserved}
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle">
                          <span
                            className={`tabular-nums font-medium ${r.lowStock || r.available <= 0 ? 'text-amber-900' : ''}`}
                          >
                            {r.available}
                          </span>
                          {r.lowStock ? (
                            <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-900">
                              Low
                            </span>
                          ) : null}
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-middle">
                          <div className="flex justify-end">{rowActions(r)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OpsTableScroll>
          </div>
        </div>
      ) : null}

      {adjustFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Dismiss"
            onClick={closeAdjust}
          />
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="adjust-stock-title"
            className="clay-panel relative z-10 w-full max-w-md rounded-t-2xl p-4 shadow-lg sm:rounded-2xl"
            onSubmit={(e) => {
              e.preventDefault();
              void submitAdjust();
            }}
          >
            <h2 id="adjust-stock-title" className="font-display text-lg">
              Adjust — {adjustFor.sku}
            </h2>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{adjustFor.productTitle}</p>
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
              <span className="tabular-nums">
                On hand · <span className="font-medium text-[var(--foreground)]">{adjustFor.onHand}</span>
              </span>
              <span className="tabular-nums">Reserved · {adjustFor.reserved}</span>
              <span className="tabular-nums">
                Available ·{' '}
                <span className="font-medium text-[var(--foreground)]">{adjustFor.available}</span>
              </span>
            </div>

            <label className="mt-4 block text-xs">
              <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Delta</span>
              <input
                className="clay-input min-h-10 w-full text-sm"
                type="number"
                step={1}
                value={delta}
                onChange={(e) => {
                  setDelta(e.target.value);
                  setAdjustError(null);
                }}
                autoFocus
              />
            </label>

            {previewAvailable != null ? (
              <p
                className={`mt-1.5 text-xs tabular-nums ${
                  previewBlocked ? 'font-medium text-red-700' : 'text-[var(--muted-foreground)]'
                }`}
              >
                Available after · {previewAvailable}
                {previewBlocked ? ' (blocked)' : ''}
              </p>
            ) : null}

            <label className="mt-3 block text-xs">
              <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Reason</span>
              <select
                className="clay-input min-h-10 w-full text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value as (typeof REASONS)[number])}
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {reasonLabel(r)}
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-3 block text-xs">
              <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Note</span>
              <input
                className="clay-input min-h-10 w-full text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                placeholder="Optional"
                autoComplete="off"
              />
            </label>

            {adjustError ? (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {adjustError}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="submit"
                className="clay-btn min-h-10 text-sm disabled:opacity-50"
                disabled={busy || !deltaValid || previewBlocked}
              >
                {busy ? 'Saving…' : 'Apply'}
              </button>
              <button
                type="button"
                className="clay-btn-secondary min-h-10 text-sm"
                disabled={busy}
                onClick={closeAdjust}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {historyFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Dismiss"
            onClick={closeHistory}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-title"
            className="clay-panel relative z-10 flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl shadow-lg sm:rounded-2xl"
          >
            <div className="border-b border-[var(--border-subtle)] p-4">
              <h2 id="history-title" className="font-display text-lg">
                History — {historyFor.sku}
              </h2>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{historyFor.productTitle}</p>
            </div>
            {historyError ? (
              <p className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {historyError}
              </p>
            ) : null}
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4 text-sm">
              {historyLoading ? (
                <li className="space-y-2" aria-busy="true" aria-label="Loading history">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                    />
                  ))}
                </li>
              ) : null}
              {!historyLoading &&
                movements.map((m) => (
                  <li
                    key={m.id}
                    className="rounded-xl border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] p-2.5"
                  >
                    <p className="font-medium tabular-nums">
                      {m.deltaOnHand > 0 ? '+' : ''}
                      {m.deltaOnHand}
                      <span className="ml-1.5 font-normal text-[var(--muted-foreground)]">
                        · {reasonLabel(m.reason)}
                      </span>
                    </p>
                    {m.note ? (
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{m.note}</p>
                    ) : null}
                    <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                      After · on hand {m.onHandAfter} / reserved {m.reservedAfter} ·{' '}
                      {m.actorEmail ?? 'system'} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              {!historyLoading && !historyError && movements.length === 0 ? (
                <li className="text-[var(--muted-foreground)]">No movements yet.</li>
              ) : null}
            </ul>
            <div className="border-t border-[var(--border-subtle)] p-3">
              <button
                type="button"
                className="clay-btn-secondary min-h-10 w-full text-sm"
                onClick={closeHistory}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading inventory">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
            />
          ))}
        </div>
      }
    >
      <InventoryDeskInner />
    </Suspense>
  );
}
