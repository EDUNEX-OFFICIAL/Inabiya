'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
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
    giftExtras?: {
      note?: { label: string; value: string; pricePaise?: number };
      wrap?: { label: string; pricePaise?: number };
      ribbon?: { label: string; pricePaise?: number };
    } | null;
    extrasPaise?: number;
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
    [addrLine(a, ['name', 'fullName']), addrLine(a, ['phone', 'mobile'])]
      .filter(Boolean)
      .join(' · '),
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

function statusDot(status: string): string {
  if (status === 'PAID' || status === 'DELIVERED') return 'bg-emerald-500';
  if (status === 'PROCESSING' || status === 'PENDING_PAYMENT') return 'bg-amber-500';
  if (status === 'SHIPPED') return 'bg-[var(--primary)]';
  if (status === 'PAYMENT_FAILED' || status === 'CANCELLED') return 'bg-red-500';
  if (status === 'RETURNED') return 'bg-neutral-400';
  return 'bg-amber-500';
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
  const map: Record<string, string> = {
    STANDARD: 'Standard delivery',
    EXPRESS: 'Express delivery',
    PRIORITY: 'Priority delivery',
  };
  return map[method] ?? method.replaceAll('_', ' ');
}

function formatPersonalization(value: unknown): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${String(v)}`);
}

const PACKING_DATE_FMT: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
      {children}
    </h2>
  );
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
  const canCancel = roles.some(
    (r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN' || r === 'FINANCE',
  );
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
      <div className="mx-auto max-w-5xl">
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading case file">
          <div className="h-7 w-48 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div className="h-40 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
            <div className="h-40 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-5xl">
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
  const showShipFields = Boolean(order.carrier || order.trackingNumber || next.includes('SHIPPED'));

  return (
    <div className="mx-auto max-w-5xl">
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

        <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
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
          </div>
          <span className="hidden h-3 w-px bg-[var(--border-subtle)] sm:block" aria-hidden />
          <span className="text-sm font-semibold tabular-nums">{formatInr(order.totalPaise)}</span>
          <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
            {order.ageHours}h
          </span>
          <Link
            href={`/admin/commerce/customers/${order.customer.id}`}
            className="max-w-full truncate text-xs text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
          >
            {order.customer.email}
          </Link>
        </div>
      </div>

      {/* Print packing slip — screen-hidden, print-only */}
      <section className="packing-slip mb-4 hidden print:block">
        <div className="packing-slip__accent" aria-hidden />
        <header className="packing-slip__header">
          <div>
            <BrandLogo href={null} size="md" />
            <p className="packing-slip__tagline">Thoughtfully personalised baby gifts</p>
          </div>
          <div className="packing-slip__title-block">
            <h1 className="packing-slip__title">Packing slip</h1>
            <p className="packing-slip__document-type">NOT A TAX INVOICE</p>
            <p className="packing-slip__order-number">{order.orderNumber}</p>
            <p className="packing-slip__printed">
              Printed {new Date().toLocaleString('en-IN', PACKING_DATE_FMT)}
            </p>
          </div>
        </header>

        <dl className="packing-slip__meta">
          <div>
            <dt>Status</dt>
            <dd>{statusLabel(order.status)}</dd>
          </div>
          <div>
            <dt>Placed</dt>
            <dd>{new Date(order.createdAt).toLocaleString('en-IN', PACKING_DATE_FMT)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{shippingMethodLabel(order.shippingMethod)}</dd>
          </div>
          <div>
            <dt>Items</dt>
            <dd>
              {order.items.reduce((n, i) => n + i.quantity, 0)} pcs · {order.items.length}{' '}
              {order.items.length === 1 ? 'line' : 'lines'}
            </dd>
          </div>
        </dl>

        <div className="packing-slip__parties">
          <div className="packing-slip__party packing-slip__party--ship">
            <h2>Ship to</h2>
            {formatAddress(order.shippingAddress).map((l) => (
              <p key={l}>{l}</p>
            ))}
          </div>
          <div className="packing-slip__party">
            <h2>Customer</h2>
            <p className="packing-slip__party-name">
              {order.customer.displayName?.trim() || order.customer.email}
            </p>
            {order.customer.displayName?.trim() ? <p>{order.customer.email}</p> : null}
            {order.carrier || order.trackingNumber ? (
              <div className="packing-slip__tracking">
                {order.carrier ? <p>Carrier: {order.carrier}</p> : null}
                {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        <table className="packing-slip__items">
          <thead>
            <tr>
              <th className="packing-slip__col-qty">Qty</th>
              <th>Item</th>
              <th className="packing-slip__col-sku">SKU</th>
              <th className="packing-slip__col-check">✓</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => {
              const personalization = formatPersonalization(i.personalization);
              const extras = [
                i.giftExtras?.note
                  ? `${i.giftExtras.note.label}: ${i.giftExtras.note.value}`
                  : null,
                i.giftExtras?.wrap ? `Wrap: ${i.giftExtras.wrap.label}` : null,
                i.giftExtras?.ribbon ? `Ribbon: ${i.giftExtras.ribbon.label}` : null,
              ].filter(Boolean) as string[];
              return (
                <tr key={i.id}>
                  <td className="packing-slip__col-qty">{i.quantity}</td>
                  <td>
                    <p className="packing-slip__item-title">
                      {i.title} <span>({i.label})</span>
                    </p>
                    {personalization.length || extras.length ? (
                      <ul className="packing-slip__item-notes">
                        {personalization.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                        {extras.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </td>
                  <td className="packing-slip__col-sku">{i.sku}</td>
                  <td className="packing-slip__col-check">
                    <span className="packing-slip__check-box" aria-hidden />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {order.giftMessage || order.giftWrap ? (
          <div className="packing-slip__gift">
            {order.giftWrap ? <p className="packing-slip__gift-flag">Gift wrap</p> : null}
            {order.giftMessage ? (
              <>
                <h2>Gift message</h2>
                <p>{order.giftMessage}</p>
              </>
            ) : null}
          </div>
        ) : null}

        <footer className="packing-slip__footer">
          <p>Internal fulfilment document · No commercial or tax value</p>
        </footer>
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
        <div className="mb-3 flex flex-wrap gap-1.5 print:hidden">
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
        className={`grid gap-3 print:hidden lg:grid-cols-[minmax(0,1fr)_18.5rem] lg:items-start lg:gap-4 ${
          refreshing ? 'opacity-70 transition-opacity' : ''
        }`}
        aria-busy={refreshing}
      >
        {/* Main column */}
        <div className="min-w-0 space-y-3">
          <section className="clay-panel p-3 text-sm sm:p-4">
            <div className="flex items-baseline justify-between gap-2">
              <SectionTitle>Lines</SectionTitle>
              <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
                {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
              </span>
            </div>
            <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
              {order.items.map((i) => (
                <li
                  key={i.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-0.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-medium leading-snug">
                      {i.title}{' '}
                      <span className="font-normal text-[var(--muted-foreground)]">
                        ({i.label})
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                      <span className="font-mono">{i.sku}</span>
                      <span className="mx-1.5 text-[var(--border-strong)]">·</span>×{i.quantity}
                      <span className="mx-1.5 text-[var(--border-strong)]">·</span>
                      {formatInr(i.unitPricePaise)} ea
                    </p>
                  </div>
                  <p className="self-start text-right text-sm font-semibold tabular-nums">
                    {formatInr(i.lineTotalPaise)}
                  </p>
                  {i.personalization ? (
                    <pre className="col-span-2 mt-1.5 overflow-x-auto rounded-md bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] p-2 text-[11px]">
                      {JSON.stringify(i.personalization, null, 2)}
                    </pre>
                  ) : null}
                  {i.giftExtras?.note || i.giftExtras?.wrap || i.giftExtras?.ribbon ? (
                    <div className="col-span-2 mt-1.5 rounded-md bg-[color-mix(in_srgb,var(--primary)_7%,transparent)] p-2 text-[11px]">
                      {i.giftExtras.note ? (
                        <p>
                          {i.giftExtras.note.label}: {i.giftExtras.note.value}
                          {i.giftExtras.note.pricePaise
                            ? ` · ${formatInr(i.giftExtras.note.pricePaise)}`
                            : ''}
                        </p>
                      ) : null}
                      {i.giftExtras.wrap ? (
                        <p>
                          Wrap: {i.giftExtras.wrap.label}
                          {i.giftExtras.wrap.pricePaise
                            ? ` · ${formatInr(i.giftExtras.wrap.pricePaise)}`
                            : ''}
                        </p>
                      ) : null}
                      {i.giftExtras.ribbon ? (
                        <p>
                          Ribbon: {i.giftExtras.ribbon.label}
                          {i.giftExtras.ribbon.pricePaise
                            ? ` · ${formatInr(i.giftExtras.ribbon.pricePaise)}`
                            : ''}
                        </p>
                      ) : null}
                      {(i.extrasPaise ?? 0) > 0 ? (
                        <p className="mt-1 font-medium">
                          Extras total: {formatInr(i.extrasPaise!)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
            {order.giftMessage ? (
              <div className="mt-2 rounded-md border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_2.5%,transparent)] px-2.5 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                  Gift message
                </p>
                <p className="mt-0.5 break-words leading-snug">{order.giftMessage}</p>
              </div>
            ) : null}
            {order.giftWrap ? (
              <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">Gift wrap</p>
            ) : null}
          </section>

          {order.returns?.length ? (
            <section className="clay-panel p-3 text-sm sm:p-4">
              <SectionTitle>Returns</SectionTitle>
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

          <section className="clay-panel p-3 text-sm sm:p-4">
            <SectionTitle>Internal notes</SectionTitle>
            <ul className="mt-2 space-y-2">
              {order.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-md border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-2.5 py-2"
                >
                  <p className="break-words leading-snug">{n.body}</p>
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
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void addNote();
                }}
              >
                <input
                  className="clay-input min-h-10 min-w-0 flex-1 text-sm"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add internal note"
                  disabled={busy}
                  aria-label="Internal note"
                />
                <button
                  type="submit"
                  className="clay-btn min-h-10 shrink-0 text-sm"
                  disabled={busy || !note.trim()}
                >
                  Add note
                </button>
              </form>
            ) : null}
          </section>

          <section className="clay-panel p-3 text-sm sm:p-4">
            <SectionTitle>Timeline</SectionTitle>
            <ol className="mt-3 space-y-0">
              {order.statusHistory.map((h, i) => (
                <li
                  key={`${h.status}-${h.createdAt}-${i}`}
                  className="relative grid grid-cols-[0.75rem_minmax(0,1fr)] gap-x-3 pb-4 last:pb-0"
                >
                  <span className="relative flex justify-center" aria-hidden>
                    {i < order.statusHistory.length - 1 ? (
                      <span className="absolute top-2 bottom-[-0.25rem] w-px bg-[var(--border-subtle)]" />
                    ) : null}
                    <span
                      className={`relative z-[1] mt-1 h-2 w-2 rounded-full ${statusDot(h.status)}`}
                    />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(h.status)}`}
                      >
                        {statusLabel(h.status)}
                      </span>
                      <time
                        className="text-[11px] tabular-nums text-[var(--muted-foreground)]"
                        dateTime={h.createdAt}
                      >
                        {new Date(h.createdAt).toLocaleString()}
                      </time>
                    </div>
                    {h.note ? (
                      <p className="mt-1 text-xs leading-snug text-[var(--muted-foreground)]">
                        {h.note}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Sticky rail — actions + context first */}
        <aside className="space-y-3 lg:sticky lg:top-3">
          <section className="clay-panel space-y-3 p-3 text-sm sm:p-4">
            <SectionTitle>Fulfillment</SectionTitle>
            {showShipFields ? (
              <div className="grid gap-2">
                <label className="block text-[11px] text-[var(--muted-foreground)]">
                  Carrier
                  <input
                    className="clay-input mt-1 w-full text-sm text-[var(--foreground)]"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    disabled={!canMutateStatus || busy}
                    placeholder="e.g. Delhivery"
                  />
                </label>
                <label className="block text-[11px] text-[var(--muted-foreground)]">
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
            ) : null}
            {order.shippedAt ? (
              <p className="text-[11px] leading-snug text-[var(--muted-foreground)]">
                Shipped {new Date(order.shippedAt).toLocaleString()}
                {order.carrier ? ` · ${order.carrier}` : ''}
                {order.trackingNumber ? ` · ${order.trackingNumber}` : ''}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              {canMutateStatus && next.includes('PROCESSING') && order.canFulfill !== false ? (
                <button
                  type="button"
                  className="clay-btn min-h-10 w-full text-sm"
                  disabled={busy}
                  onClick={() => void setStatus('PROCESSING')}
                >
                  Mark processing
                </button>
              ) : null}
              {canMutateStatus && next.includes('SHIPPED') && order.canFulfill !== false ? (
                <button
                  type="button"
                  className="clay-btn min-h-10 w-full text-sm"
                  disabled={busy}
                  onClick={() => void setStatus('SHIPPED')}
                >
                  Mark shipped
                </button>
              ) : null}
              {canMutateStatus && next.includes('DELIVERED') ? (
                <button
                  type="button"
                  className="clay-btn min-h-10 w-full text-sm"
                  disabled={busy}
                  onClick={() => void setStatus('DELIVERED')}
                >
                  Mark delivered
                </button>
              ) : null}
              {canCancel && order.canCancel ? (
                <button
                  type="button"
                  className="clay-btn-secondary min-h-10 w-full border-red-300 text-sm text-red-700"
                  disabled={busy}
                  onClick={() => void cancelOrder()}
                >
                  Cancel + refund
                </button>
              ) : null}
            </div>
            {!order.canFulfill && next.includes('SHIPPED') ? (
              <p className="rounded-md bg-red-50 px-2.5 py-2 text-xs text-red-800" role="status">
                Ship blocked until payment is resolved.
              </p>
            ) : null}
          </section>

          <section className="clay-panel space-y-2.5 p-3 text-sm sm:p-4">
            <SectionTitle>Customer</SectionTitle>
            <div>
              <Link
                className="break-words font-medium underline-offset-2 hover:underline"
                href={`/admin/commerce/customers/${order.customer.id}`}
              >
                {order.customer.email}
              </Link>
              {order.customer.displayName ? (
                <p className="mt-0.5 text-[var(--muted-foreground)]">
                  {order.customer.displayName}
                </p>
              ) : null}
              <p className="mt-1">
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                    order.customer.isActive
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                      : 'bg-red-50 text-red-800 ring-1 ring-red-200/80'
                  }`}
                >
                  {order.customer.isActive ? 'Active' : 'Suspended'}
                </span>
              </p>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
                Ship to
              </p>
              <div className="mt-1 space-y-0.5">
                {formatAddress(order.shippingAddress).map((l) => (
                  <p key={l} className="break-words leading-snug">
                    {l}
                  </p>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--muted-foreground)]">
                {shippingMethodLabel(order.shippingMethod)}
              </p>
            </div>
          </section>

          <section className="clay-panel space-y-2.5 p-3 text-sm sm:p-4">
            <SectionTitle>Payment</SectionTitle>
            <p className="rounded-md bg-amber-50 px-2.5 py-1.5 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200/80">
              Provider · MOCK
            </p>
            {order.paymentVerification.map((p) => (
              <div
                key={p.provider + p.status}
                className="flex flex-wrap items-center gap-x-2 gap-y-1"
              >
                <span className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                  {p.provider}
                </span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${paymentTone(p.status)}`}
                >
                  {paymentLabel(p.status)}
                </span>
                {p.verified ? (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    Verified
                  </span>
                ) : null}
                <span className="ml-auto tabular-nums font-medium">{formatInr(p.amountPaise)}</span>
              </div>
            ))}
            <dl className="space-y-1 border-t border-[var(--border-subtle)] pt-2.5 text-[12px]">
              <div className="flex justify-between gap-3 text-[var(--muted-foreground)]">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatInr(order.subtotalPaise)}</dd>
              </div>
              {order.discountPaise > 0 ? (
                <div className="flex justify-between gap-3 text-[var(--muted-foreground)]">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">−{formatInr(order.discountPaise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 text-[var(--muted-foreground)]">
                <dt>Shipping</dt>
                <dd className="tabular-nums">{formatInr(order.shippingPaise)}</dd>
              </div>
              {order.taxPaise > 0 ? (
                <div className="flex justify-between gap-3 text-[var(--muted-foreground)]">
                  <dt>Tax</dt>
                  <dd className="tabular-nums">{formatInr(order.taxPaise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 pt-1 text-sm font-semibold text-[var(--foreground)]">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatInr(order.totalPaise)}</dd>
              </div>
              {order.couponCode ? (
                <div className="flex justify-between gap-3 pt-0.5 text-[11px] text-[var(--muted-foreground)]">
                  <dt>Coupon</dt>
                  <dd>{order.couponCode}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
