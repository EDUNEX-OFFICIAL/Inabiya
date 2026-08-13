'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Package,
  Pin,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/cart-client';
import { opsChipClass, opsRowActionClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';
import {
  listSavedViews,
  removeSavedView,
  saveCurrentView,
  type OpsSavedView,
} from '@/lib/ops-saved-views';

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  customerEmail: string;
  customerName: string | null;
  itemCount: number;
  paymentStatus: string;
  carrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  paidAt: string | null;
  ageHours: number;
  exceptions: string[];
  openReturnCount: number;
};

type AdminOrderListResponse = {
  items: AdminOrder[];
  nextCursor: string | null;
  limit: number;
};

const PAGE_LIMIT = 25;

const STATUS_CHIPS = [
  { value: '', label: 'All' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'PAYMENT_FAILED', label: 'Pay failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

const BOARD_COLS = ['PAID', 'PROCESSING', 'SHIPPED'] as const;

const AGE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: '1', label: 'Last 1 day' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
] as const;

const PAYMENT_OPTIONS = [
  { value: '', label: 'Any payment' },
  { value: 'CAPTURED', label: 'Captured' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
] as const;

const EXCEPTION_LABEL: Record<string, string> = {
  payment_issue: 'Pay',
  address_risk: 'Addr',
  open_return: 'Return',
  sla_aging: 'SLA',
};

function statusLabel(status: string): string {
  if (status === 'PENDING_PAYMENT') return 'Pending pay';
  if (status === 'PAID') return 'Paid';
  if (status === 'PROCESSING') return 'Processing';
  if (status === 'SHIPPED') return 'Shipped';
  if (status === 'DELIVERED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'PAYMENT_FAILED') return 'Pay failed';
  if (status === 'RETURNED') return 'Returned';
  return status;
}

function statusTone(status: string): string {
  if (status === 'PAID' || status === 'DELIVERED') {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  }
  if (status === 'PROCESSING') {
    return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  }
  if (status === 'SHIPPED') {
    return 'bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]';
  }
  if (status === 'PAYMENT_FAILED' || status === 'CANCELLED') {
    return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  }
  if (status === 'RETURNED') {
    return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
  }
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function paymentLabel(status: string): string {
  if (status === 'CAPTURED') return 'Captured';
  if (status === 'FAILED') return 'Failed';
  if (status === 'PENDING') return 'Pending';
  if (status === 'REFUNDED') return 'Refunded';
  return status;
}

function paymentTone(status: string): string {
  if (status === 'CAPTURED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  if (status === 'FAILED') return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  if (status === 'REFUNDED') return 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80';
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function filterSelectClass(): string {
  return 'clay-input min-h-9 w-full min-w-0 text-sm';
}

function ExceptionBadges({ exceptions }: { exceptions: string[] }) {
  if (!exceptions.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {exceptions.map((e) => (
        <span
          key={e}
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none ${
            e === 'payment_issue'
              ? 'bg-red-100 text-red-800'
              : e === 'sla_aging'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]'
          }`}
        >
          {EXCEPTION_LABEL[e] ?? e}
        </span>
      ))}
    </span>
  );
}

function OrdersQueueInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT);
  /** Previous page cursors ('' = first page). Enables Prev without bidirectional API. */
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<OpsSavedView[]>([]);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [bulkOk, setBulkOk] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);

  const status = searchParams.get('status') ?? '';
  const focus = searchParams.get('focus') ?? '';
  const days = searchParams.get('days') ?? '';
  const payment = searchParams.get('payment') ?? '';
  const q = searchParams.get('q') ?? '';
  const cursorParam = searchParams.get('cursor') ?? '';

  const filterKey = [status, focus, days, payment, q].join('\0');

  const canFulfill =
    getStoredUser()?.roles.some((r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN') ?? false;

  const payIssuesActive = focus === 'failed-payments';
  const advancedFilterCount = [days, payIssuesActive ? '' : payment].filter(Boolean).length;
  const filterActive = Boolean(status || focus || q || advancedFilterCount > 0);
  const pageIndex = cursorStack.length + 1;
  const canPrev = cursorStack.length > 0 || Boolean(cursorParam);

  const patchParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      // focus conflicts with explicit status / payment
      if (patch.status != null || patch.payment != null) params.delete('focus');
      if (patch.focus != null && patch.focus !== '') {
        params.delete('status');
        params.delete('payment');
      }
      // Filter changes reset pagination; cursor-only patches keep stack managed by callers.
      const filterKeys = ['status', 'focus', 'days', 'payment', 'q'];
      if (Object.keys(patch).some((k) => filterKeys.includes(k))) {
        params.delete('cursor');
      }
      const s = params.toString();
      router.replace(s ? `/admin/commerce/orders?${s}` : '/admin/commerce/orders');
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
      if (focus === 'failed-payments') {
        params.set('payment', 'FAILED');
      } else {
        if (status) params.set('status', status);
        if (payment) params.set('payment', payment);
      }
      if (days) params.set('days', days);
      if (q) params.set('q', q);
      if (cursorParam) params.set('cursor', cursorParam);
      params.set('limit', String(PAGE_LIMIT));
      const data = await apiAuth<AdminOrderListResponse>(`/admin/orders?${params.toString()}`);
      if (seq !== loadSeq.current) return;
      setOrders(data.items);
      setNextCursor(data.nextCursor);
      setPageLimit(data.limit);
      hasLoadedOnce.current = true;
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [status, focus, days, payment, q, cursorParam]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      const qs = searchParams.toString();
      const next = `/admin/commerce/orders${qs ? `?${qs}` : ''}`;
      router.replace(loginUrl(next));
      return;
    }
    void load();
  }, [load, router, searchParams]);

  useEffect(() => {
    setQInput(q);
  }, [q]);

  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === q) return;
    const t = window.setTimeout(() => {
      setCursorStack([]);
      patchParams({ q: trimmed || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [qInput, q, patchParams]);

  useEffect(() => {
    setSaved(listSavedViews('/admin/commerce/orders'));
  }, [status, focus, days, payment, q]);

  useEffect(() => {
    setSelected({});
  }, [status, focus, days, payment, q, cursorParam]);

  // New filters → drop Prev stack (URL cursor cleared by patchParams).
  useEffect(() => {
    setCursorStack([]);
  }, [filterKey]);

  const selectedIds = useMemo(
    () =>
      Object.entries(selected)
        .filter(([, v]) => v)
        .map(([id]) => id),
    [selected],
  );

  function clearFilters() {
    setQInput('');
    setCursorStack([]);
    router.replace('/admin/commerce/orders');
  }

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointerDown(e: MouseEvent) {
      const el = filtersPanelRef.current;
      if (el && !el.contains(e.target as Node)) setFiltersOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  function goNext() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, cursorParam]);
    patchParams({ cursor: nextCursor });
  }

  function goPrev() {
    if (cursorStack.length === 0) {
      if (!cursorParam) return;
      patchParams({ cursor: null });
      return;
    }
    const prev = cursorStack[cursorStack.length - 1] ?? '';
    setCursorStack((s) => s.slice(0, -1));
    patchParams({ cursor: prev || null });
  }

  async function markProcessing(id: string) {
    setError(null);
    setBulkMsg(null);
    try {
      await apiAuth(`/admin/orders/${id}/status`, {
        method: 'PATCH',
        json: { status: 'PROCESSING' },
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update status');
    }
  }

  async function bulkProcess() {
    if (!selectedIds.length) {
      setBulkOk(false);
      setBulkMsg('Select at least one order');
      return;
    }
    setBusy(true);
    setBulkMsg(null);
    setError(null);
    try {
      const res = await apiAuth<{ results: Array<{ id: string; ok: boolean }> }>(
        '/admin/orders/bulk',
        {
          method: 'POST',
          json: { ids: selectedIds, status: 'PROCESSING' },
        },
      );
      setSelected({});
      await load();
      const fail = res.results.filter((r) => !r.ok).length;
      setBulkOk(fail === 0);
      setBulkMsg(
        fail ? `Bulk done with ${fail} failure(s)` : `Moved ${res.results.length} → PROCESSING`,
      );
    } catch (e) {
      setBulkOk(false);
      setBulkMsg(e instanceof Error ? e.message : 'Bulk failed');
    } finally {
      setBusy(false);
    }
  }

  function pinView() {
    const href =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/admin/commerce/orders';
    const label =
      [status && `status=${status}`, focus, days && `${days}d`, q && `q=${q}`]
        .filter(Boolean)
        .join(' · ') || 'Orders default';
    saveCurrentView(label, href);
    setSaved(listSavedViews('/admin/commerce/orders'));
  }

  const boardBuckets = useMemo(() => {
    const map: Record<string, AdminOrder[]> = {
      PAID: [],
      PROCESSING: [],
      SHIPPED: [],
    };
    for (const o of orders) {
      const bucket = map[o.status];
      if (bucket) bucket.push(o);
    }
    return map;
  }, [orders]);

  const countLabel = loading
    ? 'Loading…'
    : `${orders.length} on this page${nextCursor ? ' · more' : ''}`;

  function canProcess(o: AdminOrder): boolean {
    return canFulfill && o.status === 'PAID' && !o.exceptions.includes('payment_issue');
  }

  function rowActions(o: AdminOrder) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-0.5">
        <Link
          href={`/admin/commerce/orders/${o.id}`}
          className={opsRowActionClass}
          aria-label={`Open order ${o.orderNumber}`}
        >
          Open
        </Link>
        {canProcess(o) ? (
          <button
            type="button"
            className={opsRowActionClass}
            aria-label={`Process order ${o.orderNumber}`}
            onClick={() => void markProcessing(o.id)}
          >
            Process
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <OpsPageHeader
        title="Order desk"
        actions={
          <>
            <div
              className="flex overflow-hidden rounded-lg border border-[var(--border-strong)]"
              role="group"
              aria-label="View mode"
            >
              <button
                type="button"
                aria-pressed={view === 'list'}
                className={`min-h-10 px-3 text-xs font-medium transition-colors ${
                  view === 'list'
                    ? 'bg-[color-mix(in_srgb,var(--primary)_16%,white)] text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]'
                }`}
                onClick={() => setView('list')}
              >
                List
              </button>
              <button
                type="button"
                aria-pressed={view === 'board'}
                className={`min-h-10 border-l border-[var(--border-strong)] px-3 text-xs font-medium transition-colors ${
                  view === 'board'
                    ? 'bg-[color-mix(in_srgb,var(--primary)_16%,white)] text-[var(--primary)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]'
                }`}
                onClick={() => setView('board')}
              >
                Board
              </button>
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
          setCursorStack([]);
          patchParams({ q: qInput.trim() || null });
        }}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search order #, email, tracking"
            aria-label="Search orders"
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
                setCursorStack([]);
                patchParams({ q: null });
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </form>

      <div className="mb-3 flex items-center gap-2">
        <div
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_CHIPS.map((c) => {
            const active =
              c.value === '' ? !status && !payIssuesActive : status === c.value && !payIssuesActive;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => patchParams({ status: c.value || null, focus: null })}
              >
                {c.label}
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={payIssuesActive}
            className={opsChipClass(payIssuesActive)}
            onClick={() =>
              patchParams({
                focus: payIssuesActive ? null : 'failed-payments',
                status: null,
                payment: null,
              })
            }
          >
            Pay issues
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative" ref={filtersPanelRef}>
            <button
              type="button"
              className={`clay-btn-secondary inline-flex min-h-8 items-center gap-1.5 px-2.5 text-xs sm:min-h-9 sm:px-3 sm:text-sm ${
                advancedFilterCount > 0 || filtersOpen
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : ''
              }`}
              aria-expanded={filtersOpen}
              aria-controls="orders-filters-panel"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <ListFilter className="h-3.5 w-3.5 opacity-80" aria-hidden />
              Filters
              {advancedFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold leading-5 text-[var(--primary-foreground)]">
                  {advancedFilterCount}
                </span>
              ) : null}
            </button>

            {filtersOpen ? (
              <div
                id="orders-filters-panel"
                role="dialog"
                aria-label="Order filters"
                className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-lg"
              >
                <div className="grid grid-cols-1 gap-2.5">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Age
                    </span>
                    <select
                      id="days-filter"
                      className={filterSelectClass()}
                      aria-label="Age window"
                      value={days}
                      onChange={(e) => patchParams({ days: e.target.value || null })}
                    >
                      {AGE_OPTIONS.map((o) => (
                        <option key={o.value || 'any-time'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Payment
                    </span>
                    <select
                      className={filterSelectClass()}
                      aria-label="Payment status"
                      value={payIssuesActive ? '' : payment}
                      disabled={payIssuesActive}
                      onChange={(e) =>
                        patchParams({
                          payment: e.target.value || null,
                          focus: null,
                        })
                      }
                    >
                      {PAYMENT_OPTIONS.map((o) => (
                        <option key={o.value || 'any-payment'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {advancedFilterCount > 0 ? (
                  <button
                    type="button"
                    className="clay-btn-ghost mt-3 min-h-8 w-full px-2 text-xs"
                    onClick={() => {
                      clearFilters();
                      setFiltersOpen(false);
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <span className="hidden items-center gap-1.5 text-xs text-[var(--muted-foreground)] sm:inline-flex">
            {refreshing && !loading ? (
              <RefreshCw className="h-3 w-3 animate-spin opacity-60" aria-hidden />
            ) : null}
            {countLabel}
          </span>

          {filterActive && !filtersOpen ? (
            <button
              type="button"
              className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
              onClick={clearFilters}
            >
              Clear
            </button>
          ) : null}

          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            onClick={pinView}
          >
            <Pin className="h-3 w-3 opacity-70" aria-hidden />
            Pin view
          </button>
        </div>
      </div>

      <p className="mb-2 text-xs tabular-nums text-[var(--muted-foreground)] sm:hidden">
        {refreshing && !loading ? 'Refreshing… · ' : null}
        {countLabel}
      </p>

      {canFulfill && selectedIds.length > 0 ? (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/95 px-3 py-2.5 text-sm shadow-sm backdrop-blur">
          <span className="font-medium tabular-nums">{selectedIds.length} selected</span>
          <button
            type="button"
            className="clay-btn-secondary min-h-9 text-xs disabled:opacity-50 sm:text-sm"
            disabled={busy}
            onClick={() => void bulkProcess()}
          >
            Bulk → Processing
          </button>
          <button
            type="button"
            className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            onClick={() => setSelected({})}
          >
            Clear selection
          </button>
        </div>
      ) : null}

      {saved.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {saved.map((v) => (
            <span
              key={v.id}
              className="clay-chip inline-flex min-h-8 items-center gap-1.5 px-2.5 text-xs"
            >
              <Link
                href={v.href}
                className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
              >
                {v.label}
              </Link>
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center rounded-full opacity-50 hover:bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] hover:opacity-100"
                aria-label={`Remove ${v.label}`}
                onClick={() => {
                  removeSavedView(v.id);
                  setSaved(listSavedViews('/admin/commerce/orders'));
                }}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {bulkMsg ? (
        <p
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            bulkOk ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-800'
          }`}
          role={bulkOk ? 'status' : 'alert'}
        >
          {bulkMsg}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading orders">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Package className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No orders match this filter.' : 'No orders yet.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && orders.length > 0 && view === 'board' ? (
        <div
          className={`grid gap-3 md:grid-cols-3 ${refreshing ? 'opacity-70 transition-opacity' : ''}`}
          aria-busy={refreshing}
        >
          {BOARD_COLS.map((col) => (
            <section key={col} className="clay-panel min-h-[12rem] p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                {statusLabel(col)} · {boardBuckets[col]?.length ?? 0}
              </h2>
              <ul className="space-y-2">
                {(boardBuckets[col] ?? []).map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/commerce/orders/${o.id}`}
                      className="block rounded-lg border border-[var(--border-subtle)] p-2.5 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{o.orderNumber}</span>
                        <ExceptionBadges exceptions={o.exceptions} />
                      </div>
                      <p className="mt-1 truncate text-xs text-[var(--muted-foreground)]">
                        {o.customerEmail}
                      </p>
                      <p className="mt-1 text-xs tabular-nums">
                        {formatInr(o.totalPaise)} · {o.ageHours}h
                      </p>
                    </Link>
                  </li>
                ))}
                {(boardBuckets[col] ?? []).length === 0 ? (
                  <li className="text-xs text-[var(--muted-foreground)]">Empty</li>
                ) : null}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {!loading && orders.length > 0 && view === 'list' ? (
        <div
          className={refreshing ? 'opacity-70 transition-opacity' : undefined}
          aria-busy={refreshing}
        >
          <div className="md:hidden">
            <ul className="space-y-2">
              {orders.map((o) => (
                <li key={o.id} className="clay-panel p-2.5">
                  <div className="flex items-start gap-2">
                    {canFulfill ? (
                      <input
                        type="checkbox"
                        className="mt-1"
                        aria-label={`Select ${o.orderNumber}`}
                        checked={Boolean(selected[o.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [o.id]: e.target.checked }))
                        }
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/admin/commerce/orders/${o.id}`}
                          className="font-medium leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <span className="shrink-0 tabular-nums text-sm font-medium">
                          {formatInr(o.totalPaise)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">
                        {o.customerEmail}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(o.status)}`}
                        >
                          {statusLabel(o.status)}
                        </span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${paymentTone(o.paymentStatus)}`}
                        >
                          {paymentLabel(o.paymentStatus)}
                        </span>
                        <ExceptionBadges exceptions={o.exceptions} />
                        <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
                          {o.ageHours}h
                        </span>
                      </div>
                      <div className="mt-2 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2">
                        {rowActions(o)}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[44rem] border-collapse text-sm">
                  <thead>
                    <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                      <th className="px-3 py-2.5 font-medium">
                        {canFulfill ? (
                          <input
                            type="checkbox"
                            aria-label="Select all"
                            checked={orders.length > 0 && orders.every((o) => selected[o.id])}
                            onChange={(e) => {
                              const next: Record<string, boolean> = {};
                              for (const o of orders) next[o.id] = e.target.checked;
                              setSelected(next);
                            }}
                          />
                        ) : null}
                      </th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Order</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Customer</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Pay</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Flags</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Age</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Total</th>
                      <th className="px-2 py-2.5 pr-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-middle">
                          {canFulfill ? (
                            <input
                              type="checkbox"
                              aria-label={`Select ${o.orderNumber}`}
                              checked={Boolean(selected[o.id])}
                              onChange={(e) =>
                                setSelected((prev) => ({
                                  ...prev,
                                  [o.id]: e.target.checked,
                                }))
                              }
                            />
                          ) : null}
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle font-medium">
                          <Link
                            href={`/admin/commerce/orders/${o.id}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {o.orderNumber}
                          </Link>
                        </td>
                        <td className="max-w-[9rem] truncate px-2 py-2.5 pr-4 align-middle sm:max-w-[14rem]">
                          {o.customerEmail}
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(o.status)}`}
                          >
                            {statusLabel(o.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${paymentTone(o.paymentStatus)}`}
                          >
                            {paymentLabel(o.paymentStatus)}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle">
                          <ExceptionBadges exceptions={o.exceptions} />
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 pr-4 align-middle text-xs tabular-nums text-[var(--muted-foreground)]">
                          {o.ageHours}h
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 pr-4 align-middle tabular-nums">
                          {formatInr(o.totalPaise)}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 pr-3 align-middle text-right">
                          {rowActions(o)}
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

      {!loading && orders.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-xs disabled:opacity-40"
            disabled={!canPrev || loading || refreshing}
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
            disabled={!nextCursor || loading || refreshing}
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

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading order desk">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <OrdersQueueInner />
    </Suspense>
  );
}
