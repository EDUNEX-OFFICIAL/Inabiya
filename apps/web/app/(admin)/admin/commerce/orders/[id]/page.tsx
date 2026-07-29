'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, getStoredUser } from '@/lib/auth-client';
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

const EXCEPTION_COPY: Record<string, string> = {
  payment_issue: 'Payment issue — fulfill blocked until resolved',
  address_risk: 'Shipping address incomplete',
  open_return: 'Open return on this order',
  sla_aging: 'Aging past 24h in fulfillment',
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const load = useCallback(async () => {
    const me = await apiAuth<{ roles: string[] }>('/auth/me');
    setRoles(me.roles);
    const data = await apiAuth<OrderDetail>(`/admin/orders/${params.id}`);
    setOrder(data);
    setCarrier(data.carrier ?? '');
    setTracking(data.trackingNumber ?? '');
  }, [params.id]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    load().catch(() => router.replace('/admin/commerce/orders'));
  }, [load, router]);

  async function setStatus(status: string) {
    setBusy(true);
    setError(null);
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
    try {
      const refreshed = await apiAuth<OrderDetail>(`/admin/orders/${params.id}/cancel`, {
        method: 'POST',
      });
      setOrder(refreshed);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cancel failed');
    } finally {
      setBusy(false);
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await apiAuth(`/admin/orders/${params.id}/notes`, { method: 'POST', json: { body: note } });
      setNote('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Note failed');
    } finally {
      setBusy(false);
    }
  }

  if (!order) {
    return <p className="text-sm opacity-70">Loading case file…</p>;
  }

  const next = order.allowedNextStatuses ?? [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="print:hidden">
        <OpsPageHeader
          title={order.orderNumber}
          description={`${order.customer.email} · ${order.status} · ${order.ageHours}h`}
          actions={
            <>
              <button
                type="button"
                className="clay-btn-secondary min-h-10 text-sm"
                onClick={() => window.print()}
              >
                Print pack slip
              </button>
              <Link href="/admin/commerce/orders" className="clay-btn-ghost min-h-10 text-sm">
                Queue
              </Link>
            </>
          }
        />
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
        <p className="gift-banner gift-banner--danger mb-3 print:hidden text-sm">{error}</p>
      ) : null}

      {order.exceptions?.length ? (
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          {order.exceptions.map((e) => (
            <span
              key={e}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                e === 'payment_issue'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {EXCEPTION_COPY[e] ?? e}
            </span>
          ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 print:hidden">
        <section className="clay-panel space-y-2 p-3 text-sm sm:p-4">
          <h2 className="font-medium">Customer</h2>
          <p>
            <Link className="underline" href={`/admin/commerce/customers/${order.customer.id}`}>
              {order.customer.email}
            </Link>
          </p>
          {order.customer.displayName ? <p>{order.customer.displayName}</p> : null}
          <p className="text-xs opacity-60">
            Account: {order.customer.isActive ? 'active' : 'suspended'}
          </p>
          <h3 className="pt-2 font-medium">Ship to</h3>
          {formatAddress(order.shippingAddress).map((l) => (
            <p key={l} className="break-words">
              {l}
            </p>
          ))}
          <p className="text-xs opacity-60">Method: {order.shippingMethod}</p>
        </section>

        <section className="clay-panel space-y-2 p-3 text-sm sm:p-4">
          <h2 className="font-medium">Payment</h2>
          <p className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-900">
            Provider mode: <strong>MOCK</strong> (dev)
          </p>
          {order.paymentVerification.map((p) => (
            <p key={p.provider + p.status}>
              {p.provider}: {p.status} {p.verified ? '✓' : ''} — {formatInr(p.amountPaise)}
            </p>
          ))}
          <div className="border-t border-[var(--border-subtle)] pt-2 text-xs">
            <p>Subtotal {formatInr(order.subtotalPaise)}</p>
            {order.discountPaise > 0 ? <p>Discount −{formatInr(order.discountPaise)}</p> : null}
            <p>Shipping {formatInr(order.shippingPaise)}</p>
            {order.taxPaise > 0 ? <p>Tax {formatInr(order.taxPaise)}</p> : null}
            <p className="mt-1 text-sm font-semibold">Total {formatInr(order.totalPaise)}</p>
            {order.couponCode ? <p>Coupon: {order.couponCode}</p> : null}
          </div>
        </section>
      </div>

      <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="font-medium">Lines</h2>
        <ul className="mt-2 space-y-3">
          {order.items.map((i) => (
            <li key={i.id} className="border-b border-[var(--border-subtle)] pb-2 last:border-0">
              <p className="font-medium break-words">
                {i.title} ({i.label}) × {i.quantity}
              </p>
              <p className="text-xs opacity-60">
                {i.sku} · {formatInr(i.unitPricePaise)} ea · {formatInr(i.lineTotalPaise)}
              </p>
              {i.personalization ? (
                <pre className="mt-1 overflow-x-auto rounded bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-2 text-[11px]">
                  {JSON.stringify(i.personalization, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
        {order.giftMessage ? (
          <p className="mt-3 rounded border border-[var(--border-subtle)] p-2">
            <span className="text-xs uppercase opacity-55">Gift message</span>
            <br />
            {order.giftMessage}
          </p>
        ) : null}
        {order.giftWrap ? <p className="mt-2 text-xs">Gift wrap requested</p> : null}
      </section>

      <section className="clay-panel mt-4 space-y-3 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="font-medium">Fulfillment actions</h2>
        {(order.carrier || order.trackingNumber || next.includes('SHIPPED')) && (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block text-xs">
              Carrier
              <input
                className="clay-input mt-1 w-full"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                disabled={!canMutateStatus || busy}
                placeholder="e.g. Delhivery"
              />
            </label>
            <label className="block text-xs">
              Tracking / AWB
              <input
                className="clay-input mt-1 w-full"
                value={tracking}
                onChange={(e) => setTracking(e.target.value)}
                disabled={!canMutateStatus || busy}
                placeholder="AWB / tracking #"
              />
            </label>
          </div>
        )}
        {order.shippedAt ? (
          <p className="text-xs opacity-60">
            Shipped at {new Date(order.shippedAt).toLocaleString()}
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
          <p className="text-xs text-red-700">Ship blocked until payment is resolved.</p>
        ) : null}
      </section>

      {order.returns?.length ? (
        <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
          <h2 className="font-medium">Returns</h2>
          <ul className="mt-2 space-y-1">
            {order.returns.map((r) => (
              <li key={r.id}>
                <Link className="underline" href="/admin/commerce/returns?status=REQUESTED">
                  {r.status}
                </Link>{' '}
                — {r.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="font-medium">Internal notes</h2>
        <ul className="mt-2 space-y-2">
          {order.notes.map((n) => (
            <li key={n.id} className="rounded border border-[var(--border-subtle)] p-2">
              <p className="break-words">{n.body}</p>
              <p className="mt-1 text-[11px] opacity-55">
                {n.authorEmail ?? 'system'} · {new Date(n.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {order.notes.length === 0 ? <li className="opacity-60">No notes yet.</li> : null}
        </ul>
        {canNote ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              className="clay-input min-h-10 flex-1 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add internal note…"
              disabled={busy}
            />
            <button
              type="button"
              className="clay-btn min-h-10 text-sm"
              disabled={busy || !note.trim()}
              onClick={() => void addNote()}
            >
              Add note
            </button>
          </div>
        ) : null}
      </section>

      <section className="clay-panel mt-4 p-3 text-sm sm:p-4 print:hidden">
        <h2 className="font-medium">Timeline</h2>
        <ol className="mt-2 space-y-2 border-l-2 border-[var(--border-subtle)] pl-3">
          {order.statusHistory.map((h, i) => (
            <li key={`${h.status}-${h.createdAt}-${i}`}>
              <p className="font-medium">{h.status}</p>
              {h.note ? <p className="text-xs opacity-70">{h.note}</p> : null}
              <p className="text-[11px] opacity-50">{new Date(h.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
