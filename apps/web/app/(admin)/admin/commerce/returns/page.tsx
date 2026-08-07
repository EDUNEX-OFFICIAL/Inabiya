'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, RefreshCw, Search, Settings2, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  adminNote: string | null;
  createdAt: string;
  customerEmail: string;
  customerName?: string | null;
  order: { id: string; orderNumber: string; status: string; totalPaise: number };
};

type StatusFilter = '' | 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REFUNDED', label: 'Refunded' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: '', label: 'All' },
];

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'APPROVED' || raw === 'REJECTED' || raw === 'REFUNDED' || raw === 'REQUESTED') {
    return raw;
  }
  if (raw === 'ALL' || raw === 'all') return '';
  // Default queue: open requests (dashboard deep-link uses REQUESTED)
  if (raw == null || raw === '') return 'REQUESTED';
  return 'REQUESTED';
}

function chipClass(active: boolean): string {
  return `clay-chip min-h-8 shrink-0 cursor-pointer px-2.5 text-xs font-medium transition-colors sm:min-h-9 sm:px-3.5 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,white)] text-[var(--primary)] shadow-sm'
      : 'text-[var(--foreground)] hover:border-[color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,white)]'
  }`;
}

function statusLabel(status: string): string {
  if (status === 'REQUESTED') return 'Requested';
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'REFUNDED') return 'Refunded';
  return status;
}

function statusTone(status: string): string {
  if (status === 'APPROVED' || status === 'REFUNDED') {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  }
  if (status === 'REJECTED') return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  if (status === 'REQUESTED') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function AdminReturnsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get('status'));
  const qParam = searchParams.get('q') ?? '';
  const canMutate =
    getStoredUser()?.roles.some((r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN') ?? false;

  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [windowDays, setWindowDays] = useState(14);
  const [policySaving, setPolicySaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);

  const filterActive = Boolean(qParam || status !== 'REQUESTED');

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'status') continue;
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      if (Object.prototype.hasOwnProperty.call(patch, 'status')) {
        const s = patch.status;
        if (s === '') params.set('status', 'ALL');
        else if (s === 'REQUESTED' || s == null) params.delete('status');
        else params.set('status', s);
      }
      const qs = params.toString();
      router.replace(qs ? `/admin/commerce/returns?${qs}` : '/admin/commerce/returns');
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    setNotice(null);
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    try {
      const q = status ? `?status=${status}` : '';
      const data = await apiAuth<ReturnRow[]>(`/admin/commerce/returns${q}`);
      if (seq !== loadSeq.current) return;
      setRows(data);
      hasLoadedOnce.current = true;
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load returns');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [status]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void apiAuth<{ windowDays: number }>('/admin/commerce/policy/returns')
      .then((p) => setWindowDays(p.windowDays))
      .catch(() => undefined);
    void load();
  }, [router, load]);

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

  const displayed = useMemo(() => {
    const needle = qParam.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const hay = [
        r.order.orderNumber,
        r.customerEmail,
        r.customerName ?? '',
        r.reason,
        r.status,
        r.adminNote ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, qParam]);

  function clearFilters() {
    setQInput('');
    router.replace('/admin/commerce/returns');
  }

  async function savePolicy() {
    setPolicySaving(true);
    setError(null);
    setNotice(null);
    try {
      const p = await apiAuth<{ windowDays: number }>('/admin/commerce/policy/returns', {
        method: 'POST',
        json: { windowDays },
      });
      setWindowDays(p.windowDays);
      setNotice(`Return window saved · ${p.windowDays} days`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save policy');
    } finally {
      setPolicySaving(false);
    }
  }

  async function moderate(id: string, next: 'APPROVED' | 'REJECTED') {
    setActingId(id);
    setError(null);
    setNotice(null);
    try {
      await apiAuth(`/admin/commerce/returns/${id}`, {
        method: 'PATCH',
        json: { status: next },
      });
      const msg =
        next === 'APPROVED' ? 'Return approved · refund queued.' : 'Return rejected.';
      await load();
      setNotice(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Moderation failed');
    } finally {
      setActingId(null);
    }
  }

  const countLabel = loading ? 'Loading…' : `${displayed.length} returns`;

  function rowActions(r: ReturnRow) {
    if (!canMutate || r.status !== 'REQUESTED') return null;
    return (
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="clay-btn-secondary min-h-9 px-3 text-sm text-emerald-800"
          disabled={actingId === r.id}
          onClick={() => void moderate(r.id, 'APPROVED')}
        >
          Approve + refund
        </button>
        <button
          type="button"
          className="clay-btn-secondary min-h-9 px-3 text-sm text-red-800"
          disabled={actingId === r.id}
          onClick={() => void moderate(r.id, 'REJECTED')}
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <div>
      <OpsPageHeader
        title="Returns"
        actions={
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin/commerce/settings"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <Settings2 className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Settings
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

      <section className="clay-panel mb-3 flex flex-wrap items-end gap-3 p-3 sm:p-4">
        <label className="min-w-0 flex-1 sm:flex-none">
          <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            Return window
          </span>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={365}
              className="clay-input w-24 min-h-10"
              value={windowDays}
              onChange={(e) => setWindowDays(Number(e.target.value))}
              aria-label="Return window days"
              disabled={!canMutate}
              readOnly={!canMutate}
            />
            <span className="text-sm text-[var(--muted-foreground)]">days</span>
          </div>
        </label>
        {canMutate ? (
          <button
            type="button"
            className="clay-btn-secondary min-h-10 text-sm"
            disabled={policySaving}
            onClick={() => void savePolicy()}
          >
            {policySaving ? 'Saving…' : 'Save'}
          </button>
        ) : null}
      </section>

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
            placeholder="Search order #, email, reason"
            aria-label="Search returns"
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
          aria-label="Filter by status"
        >
          {STATUS_CHIPS.map((c) => {
            const active = status === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={chipClass(active)}
                onClick={() => patchQuery({ status: c.value })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

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

      <div className="mb-2 flex items-center justify-between gap-2 sm:hidden">
        <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
          {refreshing && !loading ? 'Refreshing… · ' : null}
          {countLabel}
        </p>
        <Link
          href="/admin/commerce/settings"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          <Settings2 className="h-3 w-3 opacity-70" aria-hidden />
          Settings
        </Link>
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
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading returns">
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
            {filterActive ? 'No returns match this filter.' : 'No open return requests.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && displayed.length > 0 ? (
        <div className={refreshing ? 'opacity-70 transition-opacity' : undefined} aria-busy={refreshing}>
          <div className="md:hidden">
            <ul className="space-y-2">
              {displayed.map((r) => (
                <li key={r.id} className="clay-panel p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/commerce/orders/${r.order.id}`}
                        className="font-medium leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                      >
                        {r.order.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {formatInr(r.order.totalPaise)} · {r.customerEmail}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted-foreground)]">{r.reason}</p>
                  <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                    {formatWhen(r.createdAt)}
                  </p>
                  {canMutate && r.status === 'REQUESTED' ? (
                    <div className="mt-2 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2">
                      {rowActions(r)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[48rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 font-medium">Order</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Customer</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Reason</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Total</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-top">
                          <Link
                            href={`/admin/commerce/orders/${r.order.id}`}
                            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                          >
                            {r.order.orderNumber}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {formatWhen(r.createdAt)}
                          </p>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top">
                          <p className="text-[var(--foreground)]">{r.customerEmail}</p>
                          {r.customerName ? (
                            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                              {r.customerName}
                            </p>
                          ) : null}
                        </td>
                        <td className="max-w-xs px-2 py-2.5 pr-4 align-top">
                          <p className="line-clamp-2 text-[var(--muted-foreground)]">{r.reason}</p>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 pr-4 align-top tabular-nums">
                          {formatInr(r.order.totalPaise)}
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(r.status)}`}
                          >
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top">
                          {rowActions(r) ?? (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
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
    </div>
  );
}

export default function AdminReturnsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading returns">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <AdminReturnsInner />
    </Suspense>
  );
}
