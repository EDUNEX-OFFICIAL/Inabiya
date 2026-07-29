'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken, getStoredUser } from '@/lib/auth-client';
import { formatInr } from '@/lib/cart-client';
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

const EXCEPTION_LABEL: Record<string, string> = {
  payment_issue: 'Pay',
  address_risk: 'Addr',
  open_return: 'Return',
  sla_aging: 'SLA',
};

function ExceptionBadges({ exceptions }: { exceptions: string[] }) {
  if (!exceptions.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {exceptions.map((e) => (
        <span
          key={e}
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'board'>('list');
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<OpsSavedView[]>([]);
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const status = searchParams.get('status') ?? '';
  const focus = searchParams.get('focus') ?? '';
  const days = searchParams.get('days') ?? '';
  const payment = searchParams.get('payment') ?? '';
  const q = searchParams.get('q') ?? '';

  const canFulfill =
    getStoredUser()?.roles.some((r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN') ?? false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
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
      const qs = params.toString();
      const data = await apiAuth<AdminOrder[]>(`/admin/orders${qs ? `?${qs}` : ''}`);
      setOrders(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [status, focus, days, payment, q]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [load, router]);

  useEffect(() => {
    setSaved(listSavedViews('/admin/commerce/orders'));
  }, [status, focus, days, payment, q]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected],
  );

  function patchParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === '') params.delete(k);
      else params.set(k, v);
    }
    // focus conflicts with explicit status
    if (patch.status != null || patch.payment != null) params.delete('focus');
    const s = params.toString();
    router.replace(s ? `/admin/commerce/orders?${s}` : '/admin/commerce/orders');
  }

  async function markProcessing(id: string) {
    await apiAuth(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      json: { status: 'PROCESSING' },
    });
    await load();
  }

  async function bulkProcess() {
    if (!selectedIds.length) {
      setBulkMsg('Select at least one order');
      return;
    }
    setBusy(true);
    setBulkMsg(null);
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
      setBulkMsg(
        fail
          ? `Bulk done with ${fail} failure(s)`
          : `Moved ${res.results.length} → PROCESSING`,
      );
    } catch (e) {
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
    const label = [status && `status=${status}`, focus, days && `${days}d`, q && `q=${q}`]
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

  return (
    <div>
      <OpsPageHeader
        title="Order desk"
        description={
          focus === 'failed-payments'
            ? 'Filtered: payment issues'
            : status
              ? `Status: ${status}`
              : 'Daily fulfillment workbench'
        }
        actions={
          <>
            <div className="flex rounded-lg border border-[var(--border-subtle)]" role="group">
              <button
                type="button"
                className={`min-h-10 px-3 text-xs ${view === 'list' ? 'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]' : 'opacity-70'}`}
                onClick={() => setView('list')}
              >
                List
              </button>
              <button
                type="button"
                className={`min-h-10 px-3 text-xs ${view === 'board' ? 'bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]' : 'opacity-70'}`}
                onClick={() => setView('board')}
              >
                Board
              </button>
            </div>
            <button
              type="button"
              className="clay-btn-secondary min-h-10 text-sm"
              disabled={loading}
              onClick={() => void load()}
            >
              Refresh
            </button>
          </>
        }
      />

      <form
        className="mb-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          patchParams({ q: qInput.trim() || null });
        }}
      >
        <input
          className="clay-input min-h-10 flex-1 text-sm"
          placeholder="Search order #, email, tracking…"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          aria-label="Search orders"
        />
        <button type="submit" className="clay-btn min-h-10 text-sm">
          Search
        </button>
      </form>

      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.value || 'all'}
            type="button"
            className={`min-h-9 shrink-0 rounded-full border px-3 text-xs ${
              (c.value === '' && !status && focus !== 'failed-payments') || status === c.value
                ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] text-[var(--primary)]'
                : 'border-[var(--border-subtle)] opacity-80'
            }`}
            onClick={() => patchParams({ status: c.value || null, focus: null })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
        <label className="opacity-70" htmlFor="days-filter">
          Age window
        </label>
        <select
          id="days-filter"
          className="clay-input min-h-9 text-xs"
          value={days}
          onChange={(e) => patchParams({ days: e.target.value || null })}
        >
          <option value="">Any time</option>
          <option value="1">Last 1 day</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
        {(status || focus || q || days || payment) && (
          <button
            type="button"
            className="clay-btn-ghost text-xs"
            onClick={() => {
              setQInput('');
              router.replace('/admin/commerce/orders');
            }}
          >
            Clear filters
          </button>
        )}
        <span className="opacity-50">{loading ? 'Loading…' : `${orders.length} orders`}</span>
        <button type="button" className="clay-btn-ghost text-xs" onClick={pinView}>
          Pin view
        </button>
        {canFulfill && selectedIds.length > 0 ? (
          <button
            type="button"
            className="clay-btn-secondary min-h-9 text-xs disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulkProcess()}
          >
            Bulk → Processing ({selectedIds.length})
          </button>
        ) : null}
      </div>

      {saved.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          {saved.map((v) => (
            <span
              key={v.id}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-2 py-1"
            >
              <Link href={v.href} className="underline">
                {v.label}
              </Link>
              <button
                type="button"
                className="opacity-50 hover:opacity-100"
                aria-label={`Remove ${v.label}`}
                onClick={() => {
                  removeSavedView(v.id);
                  setSaved(listSavedViews('/admin/commerce/orders'));
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {bulkMsg ? <p className="mb-3 text-sm opacity-80">{bulkMsg}</p> : null}

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {view === 'board' ? (
        <div className="grid gap-3 md:grid-cols-3">
          {BOARD_COLS.map((col) => (
            <section key={col} className="clay-panel min-h-[12rem] p-3">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-60">
                {col} · {boardBuckets[col]?.length ?? 0}
              </h2>
              <ul className="space-y-2">
                {(boardBuckets[col] ?? []).map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/admin/commerce/orders/${o.id}`}
                      className="block rounded-md border border-[var(--border-subtle)] p-2 text-sm hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-medium">{o.orderNumber}</span>
                        <ExceptionBadges exceptions={o.exceptions} />
                      </div>
                      <p className="mt-1 truncate text-xs opacity-70">{o.customerEmail}</p>
                      <p className="mt-1 text-xs">
                        {formatInr(o.totalPaise)} · {o.ageHours}h
                      </p>
                    </Link>
                  </li>
                ))}
                {(boardBuckets[col] ?? []).length === 0 ? (
                  <li className="text-xs opacity-50">Empty</li>
                ) : null}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <OpsTableScroll>
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] uppercase tracking-wide opacity-55">
                <th className="py-2 pr-2">
                  {canFulfill ? (
                    <input
                      type="checkbox"
                      aria-label="Select all"
                      checked={
                        orders.length > 0 && orders.every((o) => selected[o.id])
                      }
                      onChange={(e) => {
                        const next: Record<string, boolean> = {};
                        for (const o of orders) next[o.id] = e.target.checked;
                        setSelected(next);
                      }}
                    />
                  ) : null}
                </th>
                <th className="py-2 pr-3">Order</th>
                <th className="py-2 pr-3">Customer</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Pay</th>
                <th className="py-2 pr-3">Flags</th>
                <th className="py-2 pr-3">Age</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b align-top">
                  <td className="py-2 pr-2">
                    {canFulfill ? (
                      <input
                        type="checkbox"
                        aria-label={`Select ${o.orderNumber}`}
                        checked={Boolean(selected[o.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [o.id]: e.target.checked }))
                        }
                      />
                    ) : null}
                  </td>
                  <td className="py-2 pr-3 font-medium">{o.orderNumber}</td>
                  <td className="max-w-[9rem] truncate py-2 pr-3 sm:max-w-[14rem]">
                    {o.customerEmail}
                  </td>
                  <td className="py-2 pr-3">{o.status}</td>
                  <td className="py-2 pr-3 text-xs">{o.paymentStatus}</td>
                  <td className="py-2 pr-3">
                    <ExceptionBadges exceptions={o.exceptions} />
                  </td>
                  <td className="py-2 pr-3 whitespace-nowrap text-xs">{o.ageHours}h</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{formatInr(o.totalPaise)}</td>
                  <td className="whitespace-nowrap py-2">
                    <Link href={`/admin/commerce/orders/${o.id}`} className="mr-3 underline">
                      Open
                    </Link>
                    {canFulfill && o.status === 'PAID' && !o.exceptions.includes('payment_issue') ? (
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void markProcessing(o.id)}
                      >
                        Process
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsTableScroll>
      )}

      {!loading && orders.length === 0 ? (
        <p className="mt-4 text-sm opacity-60">No orders match this filter.</p>
      ) : null}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading order desk…</p>}>
      <OrdersQueueInner />
    </Suspense>
  );
}
