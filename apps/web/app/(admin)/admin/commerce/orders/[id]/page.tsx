'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type Address = Record<string, unknown>;

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise: number;
  totalPaise: number;
  couponCode: string | null;
  shippingMethod: string;
  giftMessage: string | null;
  giftWrap: boolean;
  shippingAddress: Address;
  carrier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  ageHours: number;
  canCancel?: boolean;
  canFulfill?: boolean;
  addressRisk?: boolean;
  exceptions: string[];
  allowedNextStatuses: string[];
  openReturnCount: number;
  items: Array<{
    id: string;
    title: string;
    label: string;
    sku: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    personalization: unknown;
  }>;
  statusHistory: Array<{ status: string; note: string | null; createdAt: string }>;
  paymentVerification: Array<{
    provider: string;
    status: string;
    amountPaise: number;
    verified: boolean;
  }>;
  notes: Array<{ id: string; body: string; authorEmail: string | null; createdAt: string }>;
  returns: Array<{ id: string; status: string; reason: string; createdAt: string }>;
  customer: {
    id: string;
    email: string;
    displayName: string | null;
    isActive: boolean;
  };
};

function addrLine(a: Address, keys: string[]): string {
  for (const k of keys) {
    const v = a[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function formatAddress(a: Address | null | undefined): string[] {
  if (!a || typeof a !== 'object') return ['—'];
  const lines = [
    [addrLine(a, ['name', 'fullName']), addrLine(a, ['phone', 'mobile'])].filter(Boolean).join(' · '),
    addrLine(a, ['line1', 'addressLine1']),
    addrLine(a, ['line2', 'addressLine2']),
    [addrLine(a, ['city']), addrLine(a, ['state']), addrLine(a, ['pincode', 'postalCode', 'zip'])]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);
  return lines.length ? lines : ['—'];
}

const EXCEPTION_LABEL: Record<string, string> = {
  payment_issue: 'Payment issue',
  address_risk: 'Address incomplete',
  open_return: 'Open return',
  sla_aging: 'SLA aging',
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

function shippingMethodLabel(method: string): string {
  if (method === 'STANDARD') return 'Standard';
  if (method === 'EXPRESS') return 'Express';
  return method;
}

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState<string[]>(getStoredUser()?.roles ?? []);

  const canMutateStatus = roles.some((r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN');
  const canCancel = roles.some((r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN' || r === 'FINANCE');
  const canNote = roles.some(
    (r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN' || r === 'SUPPORT',
  );

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      setError(null);
      if (opts?.soft) setRefreshing(true);
      else setLoading(true);
      try {
        const me = await apiAuth<{ roles: string[] }>('/auth/me');
        setRoles(me.roles);
        const data = await apiAuth<OrderDetail>(`/admin/orders/${params.id}`);
        setOrder(data);
        setCarrier(data.carrier ?? '');
        setTracking(data.trackingNumber ?? '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load order');
        if (!opts?.soft) setOrder(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.id],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl(`/admin/commerce/orders/${params.id}`));
      return;
    }
    void load();
  }, [load, router]);

  async function setStatus(status: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body: Record<string, string> = { status };
      if (status === 'SHIPPED') {
        if (carrier.trim()) body.carrier = carrier.trim();
        if (tracking.trim()) body.trackingNumber = tracking.trim();
      }
      const refreshed = await apiAuth<OrderDetail>(`/admin/orders/${params.id}/status`, {
        method: 'PATCH',
        json: body,
      });
      setOrder(refreshed);
      setCarrier(refreshed.carrier ?? '');
      setTracking(refreshed.trackingNumber ?? '');
      setNotice(`Status → ${statusLabel(status)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!window.confirm('Cancel order and trigger mock refund + restock?')) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const refreshed = await apiAuth<OrderDetail>(`/admin/orders/${params.id}/cancel`, {
        method: 'POST',
      });
      setOrder(refreshed);
      setNotice('Order cancelled');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiAuth(`/admin/orders/${params.id}/notes`, { method: 'POST', json: { body: note } });
      setNote('');
      await load({ soft: true });
      setNotice('Note added');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Note failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !order) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading case file">
          <div className="h-7 w-48 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="h-28 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
            <div className="h-28 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl">
        <OpsPageHeader
          title="Order"
          actions={
            <Link href="/admin/commerce/orders" className="clay-btn-ghost min-h-10 text-sm">
              Queue
            </Link>
          }
        />
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-sm opacity-70">{error ?? 'Order not found.'}</p>
          <Link href="/admin/commerce/orders" className="clay-btn-secondary text-sm">
            Back to queue
          </Link>
        </div>
      </div>
    );
  }

  const next = order.allowedNextStatuses ?? [];
  const primaryPayment = order.paymentVerification[0];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="print:hidden">
        <OpsPageHeader
          title={order.orderNumber}
          actions={
            <>
              <button
                type="button"
                className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
                onClick={() => window.print()}
              >
                <Printer className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Print
              </button>
              <button
                type="button"
                className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
                disabled={loading || refreshing || busy}
                onClick={() => void load({ soft: true })}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 opacity-70 ${refreshing ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                Refresh
              </button>
              <Link
                href="/admin/commerce/orders"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Queue
              </Link>
            </>
          }
        />

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(order.status)}`}
          >
            {statusLabel(order.status)}
          </span>
          {primaryPayment ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${paymentTone(primaryPayment.status)}`}
            >
              {paymentLabel(primaryPayment.status)}
            </span>
          ) : null}
          <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
            {order.ageHours}h · {formatInr(order.totalPaise)}
          </span>
          <Link
            href={`/admin/commerce/customers/${order.customer.id}`}
            className="truncate text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            {order.customer.email}
          </Link>
        </div>
      </div>

      {/* Print packing summary */}
      <section className="mb-4 hidden print:block">
        <h1 className="text-xl font-bold">Packing slip — {order.orderNumber}</h1>
        <p className="text-sm">{new Date().toLocaleString()}</p>
        <div className="mt-3 text-sm">
          <p className="font-medium">Ship to</p>
          {formatAddress(order.shippingAddress).map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
        <ul className="mt-3 text-sm">
          {order.items.map((i) => (
            <li key={i.id}>
              {i.quantity}× {i.title} ({i.label}) — {i.sku}
            </li>
          ))}
        </ul>
        {order.giftMessage ? <p className="mt-2 text-sm">Gift message: {order.giftMessage}</p> : null}
      </section>

      {error ? (
        <p
          className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 print:hidden"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900 print:hidden"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {order.exceptions?.length ? (
        <div className="mb-4 flex flex-wrap gap-1.5 print:hidden">
          {order.exceptions.map((e) => (
            <span
              key={e}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                e === 'payment_issue'
                  ? 'bg-red-50 text-red-800 ring-1 ring-red-200/80'
                  : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80'
              }`}
            >
              {EXCEPTION_LABEL[e] ?? e}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={`grid gap-4 lg:grid-cols-2 print:hidden ${refreshing ? 'opacity-70 transition-opacity' : ''}`}
        aria-busy={refreshing}
      >
        <section className="clay-panel space-y-2 p-3 text-sm sm:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Customer
          </h2>
          <p>
            <Link
              className="font-medium underline-offset-2 hover:underline"
              href={`/admin/commerce/customers/${order.customer.id}`}
            >
              {order.customer.email}
            </Link>
          </p>
          {order.customer.displayName ? (
            <p className="text-[var(--muted-foreground)]">{order.customer.displayName}</p>
          ) : null}
          <p className="text-xs text-[var(--muted-foreground)]">
            {order.customer.isActive ? 'Active' : 'Suspended'}
          </p>
          <h3 className="pt-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Ship to
          </h3>
          {formatAddress(order.shippingAddress).map((l) => (
            <p key={l} className="break-words">
              {l}
            </p>
          ))}
          <p className="text-xs text-[var(--muted-foreground)]">
            {shippingMethodLabel(order.shippingMethod)}
          </p>
        </section>

        <section className="clay-panel space-y-2 p-3 text-sm sm:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Payment
          </h2>
          <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200/80">
            Provider · MOCK
          </p>
          {order.paymentVerification.map((p) => (
            <div key={p.provider + p.status} className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--muted-foreground)]">{p.provider}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${paymentTone(p.status)}`}
              >
                {paymentLabel(p.status)}
              </span>
              {p.verified ? (
                <span className="text-[10px] font-medium uppercase text-emerald-700">Verified</span>
              ) : null}
              <span className="tabular-nums">{formatInr(p.amountPaise)}</span>
            </div>
          ))}
          <div className="space-y-0.5 border-t border-[var(--border-subtle)] pt-2 text-xs text-[var(--muted-foreground)]">
            <p>Subtotal {formatInr(order.subtotalPaise)}</p>
            {order.discountPaise > 0 ? <p>Discount −{formatInr(order.discountPaise)}</p> : null}
            <p>Shipping {formatInr(order.shippingPaise)}</p>
            {order.taxPaise > 0 ? <p>Tax {formatInr(order.taxPaise)}</p> : null}
            <p className="pt-1 text-sm font-semibold tabular-nums text-[var(--foreground)]">
              Total {formatInr(order.totalPaise)}
            </p>
            {order.couponCode ? <p>Coupon · {order.couponCode}</p> : null}
          </div>
        </section>
      </div>

      <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Lines
        </h2>
        <ul className="mt-2 space-y-3">
          {order.items.map((i) => (
            <li
              key={i.id}
              className="border-b border-[var(--border-subtle)] pb-2.5 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 font-medium break-words">
                  {i.title}{' '}
                  <span className="font-normal text-[var(--muted-foreground)]">({i.label})</span>
                </p>
                <span className="shrink-0 tabular-nums font-medium">{formatInr(i.lineTotalPaise)}</span>
              </div>
              <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                <span className="font-mono">{i.sku}</span> · ×{i.quantity} ·{' '}
                {formatInr(i.unitPricePaise)} ea
              </p>
              {i.personalization ? (
                <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-2 text-[11px]">
                  {JSON.stringify(i.personalization, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
        {order.giftMessage ? (
          <div className="mt-3 rounded-lg border border-[var(--border-subtle)] p-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Gift message
            </p>
            <p className="mt-1 break-words">{order.giftMessage}</p>
          </div>
        ) : null}
        {order.giftWrap ? (
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">Gift wrap</p>
        ) : null}
      </section>

      <section className="clay-panel mt-4 space-y-3 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Fulfillment
        </h2>
        {(order.carrier || order.trackingNumber || next.includes('SHIPPED')) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs text-[var(--muted-foreground)]">
              Carrier
              <input
                className="clay-input mt-1 w-full text-sm text-[var(--foreground)]"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                disabled={!canMutateStatus || busy}
                placeholder="e.g. Delhivery"
              />
            </label>
            <label className="block text-xs text-[var(--muted-foreground)]">
              Tracking / AWB
              <input
                className="clay-input mt-1 w-full text-sm text-[var(--foreground)]"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                disabled={!canMutateStatus || busy}
                placeholder="AWB / tracking #"
              />
            </label>
          </div>
        )}
        {order.shippedAt ? (
          <p className="text-xs text-[var(--muted-foreground)]">
            Shipped {new Date(order.shippedAt).toLocaleString()}
            {order.carrier ? ` · ${order.carrier}` : ''}
            {order.trackingNumber ? ` · ${order.trackingNumber}` : ''}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canMutateStatus && next.includes('PROCESSING') && order.canFulfill !== false ? (
            <button
              type="button"
              className="clay-btn min-h-10 text-sm"
              disabled={busy}
              onClick={() => void setStatus('PROCESSING')}
            >
              Mark processing
            </button>
          ) : null}
          {canMutateStatus && next.includes('SHIPPED') && order.canFulfill !== false ? (
            <button
              type="button"
              className="clay-btn min-h-10 text-sm"
              disabled={busy}
              onClick={() => void setStatus('SHIPPED')}
            >
              Mark shipped
            </button>
          ) : null}
          {canMutateStatus && next.includes('DELIVERED') ? (
            <button
              type="button"
              className="clay-btn min-h-10 text-sm"
              disabled={busy}
              onClick={() => void setStatus('DELIVERED')}
            >
              Mark delivered
            </button>
          ) : null}
          {canCancel && order.canCancel ? (
            <button
              type="button"
              className="clay-btn-secondary min-h-10 border-red-300 text-sm text-red-700"
              disabled={busy}
              onClick={() => void cancelOrder()}
            >
              Cancel + refund
            </button>
          ) : null}
        </div>
        {!order.canFulfill && next.includes('SHIPPED') ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800" role="status">
            Ship blocked until payment is resolved.
          </p>
        ) : null}
      </section>

      {order.returns?.length ? (
        <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Returns
          </h2>
          <ul className="mt-2 space-y-2">
            {order.returns.map((r) => (
              <li key={r.id} className="flex flex-wrap items-baseline gap-2">
                <Link
                  className="font-medium underline-offset-2 hover:underline"
                  href="/admin/commerce/returns?status=REQUESTED"
                >
                  {r.status}
                </Link>
                <span className="text-[var(--muted-foreground)]">{r.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Internal notes
        </h2>
        <ul className="mt-2 space-y-2">
          {order.notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] p-2.5"
            >
              <p className="break-words">{n.body}</p>
              <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                {n.authorEmail ?? 'system'} · {new Date(n.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {order.notes.length === 0 ? (
            <li className="text-xs text-[var(--muted-foreground)]">No notes yet.</li>
          ) : null}
        </ul>
        {canNote ? (
          <form
            className="mt-3 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void addNote();
            }}
          >
            <input
              className="clay-input min-h-10 flex-1 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal note"
              disabled={busy}
              aria-label="Internal note"
            />
            <button
              type="submit"
              className="clay-btn min-h-10 text-sm"
              disabled={busy || !note.trim()}
            >
              Add note
            </button>
          </form>
        ) : null}
      </section>

      <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
          Timeline
        </h2>
        <ol className="mt-3 space-y-3 border-l-2 border-[var(--border-subtle)] pl-3">
          {order.statusHistory.map((h, i) => (
            <li key={`${h.status}-${h.createdAt}-${i}`} className="relative">
              <span
                className="absolute -left-[calc(0.375rem+1px)] top-1.5 h-2 w-2 rounded-full bg-[var(--primary)]"
                aria-hidden
              />
              <span
                className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(h.status)}`}
              >
                {statusLabel(h.status)}
              </span>
              {h.note ? <p className="mt-1 text-xs text-[var(--muted-foreground)]">{h.note}</p> : null}
              <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                {new Date(h.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
