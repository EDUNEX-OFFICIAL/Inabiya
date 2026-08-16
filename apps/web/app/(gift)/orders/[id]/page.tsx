'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, orderStatusLabel, shippingMethodLabel } from '@/lib/cart-client';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';
import { LineThumb } from '@/components/gift/line-thumb';

type Address = {
  fullName?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string | null;
};

type OrderItem = {
  title: string;
  label: string;
  quantity: number;
  lineTotalPaise: number;
  imageUrl?: string | null;
  giftExtras?: {
    note?: { label: string; value: string };
    wrap?: { label: string };
    ribbon?: { label: string };
  } | null;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  taxPaise?: number;
  couponCode?: string | null;
  shippingMethod?: string;
  giftMessage: string | null;
  giftWrap?: boolean;
  invoiceAvailable?: boolean;
  shippingAddress?: Address | null;
  billingAddress?: Address | null;
  payments?: Array<{ status: string; provider: string; amountPaise: number }>;
  items: OrderItem[];
  statusHistory: Array<{ status: string; createdAt: string; note: string | null }>;
  paidAt?: string | null;
};

type Eligibility = {
  eligible: boolean;
  reason: string | null;
  windowDays: number;
  daysLeft: number | null;
  existing: Array<{ id: string; status: string; reason: string; createdAt: string }>;
};

const TRACK_STEPS = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;

function formatAddress(a: Address | null | undefined): string | null {
  if (!a) return null;
  const lines = [
    a.fullName,
    a.line1,
    a.line2,
    [a.city, a.state, a.postalCode].filter(Boolean).join(', '),
    a.phone,
  ].filter(Boolean);
  return lines.length ? lines.join('\n') : null;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<GiftListSkeleton label="Loading order" />}>
      <OrderDetailView params={params} />
    </Suspense>
  );
}

function OrderDetailView({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const placed = search.get('placed') === '1';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnMsg, setReturnMsg] = useState<string | null>(null);
  const [returnBusy, setReturnBusy] = useState(false);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(`/login?next=/orders/${params.id}${placed ? '?placed=1' : ''}`);
      return;
    }
    apiAuth<OrderDetail>(`/orders/me/${params.id}`)
      .then(async (o) => {
        setOrder(o);
        try {
          setEligibility(await apiAuth<Eligibility>(`/returns/eligibility/${params.id}`));
        } catch {
          setEligibility(null);
        }
      })
      .catch(() => {
        if (!getStoredAccessToken()) {
          router.replace(`/login?next=/orders/${params.id}`);
          return;
        }
        router.replace('/orders');
      });
  }, [params.id, placed, router]);

  async function submitReturn() {
    setReturnBusy(true);
    try {
      await apiAuth(`/returns/orders/${params.id}`, {
        method: 'POST',
        json: { reason: returnReason },
      });
      setReturnMsg('Return requested');
      const e = await apiAuth<Eligibility>(`/returns/eligibility/${params.id}`);
      setEligibility(e);
    } catch (err) {
      setReturnMsg(err instanceof Error ? err.message : 'Return failed');
    } finally {
      setReturnBusy(false);
    }
  }

  if (!order) {
    return <GiftListSkeleton label="Loading order" />;
  }

  const special =
    order.status === 'CANCELLED' ||
    order.status === 'PAYMENT_FAILED' ||
    order.status === 'RETURNED';
  const invoiceAvailable =
    order.invoiceAvailable ??
    (Boolean(order.paidAt) ||
      (order.payments?.some((p) => p.status === 'CAPTURED' || p.status === 'REFUNDED') ?? false));
  const shipText = formatAddress(order.shippingAddress);
  const payment = order.payments?.[0];
  const trackIndex = TRACK_STEPS.indexOf(order.status as (typeof TRACK_STEPS)[number]);
  const showPending = order.status === 'PENDING_PAYMENT';

  return (
    <main className="gift-page max-w-3xl">
      {placed ? (
        <header className="checkout-section checkout-section--soft">
          <p className="text-caption font-semibold uppercase tracking-wide text-success">
            Order confirmed
          </p>
          <h1 className="gift-h1 mt-gs-3">Thank you</h1>
          <p className="mt-gs-2 font-medium text-foreground">{order.orderNumber}</p>
          <p className="mt-gs-1 text-body opacity-70">{orderStatusLabel(order.status)}</p>
        </header>
      ) : (
        <>
          <Link href="/orders" className="gift-link text-body">
            ← All orders
          </Link>
          <div className="mt-gs-4 flex flex-wrap items-start justify-between gap-gs-4">
            <div>
              <h1 className="gift-h1">{order.orderNumber}</h1>
              <p className="mt-gs-1 text-body opacity-70">{orderStatusLabel(order.status)}</p>
            </div>
            {invoiceAvailable ? (
              <Link href={`/orders/${order.id}/invoice`} className="clay-btn shrink-0">
                View invoice
              </Link>
            ) : null}
          </div>
        </>
      )}

      <div className="mt-gs-5 flex flex-wrap gap-gs-3">
        <Link href="/products" className="clay-btn">
          Continue shopping
        </Link>
        {placed && invoiceAvailable ? (
          <Link href={`/orders/${order.id}/invoice`} className="clay-btn-secondary">
            View invoice
          </Link>
        ) : null}
        {placed ? (
          <Link href="/orders" className="clay-btn-ghost">
            All orders
          </Link>
        ) : (
          <Link href="/account" className="clay-btn-ghost">
            Account
          </Link>
        )}
      </div>

      <div className="mt-gs-6 grid items-start gap-gs-6 lg:grid-cols-[minmax(0,1fr)_min(22rem,40%)]">
        <div className="space-y-gs-4">
          <section className="checkout-section" aria-label="Order tracking">
            <h2 className="gift-h2">Tracking</h2>
            {special ? (
              <p className="gift-banner gift-banner--warning mt-gs-3">
                {orderStatusLabel(order.status)}
              </p>
            ) : showPending ? (
              <p className="mt-gs-3 text-body opacity-70">Payment pending</p>
            ) : (
              <ol className="mt-gs-4 space-y-gs-3">
                {TRACK_STEPS.map((step, i) => {
                  const done = trackIndex >= i;
                  const current = trackIndex === i;
                  return (
                    <li
                      key={step}
                      className={`flex items-center gap-gs-3 text-body ${done ? '' : 'opacity-40'}`}
                    >
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border text-caption ${
                          done
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border-strong'
                        }`}
                        aria-hidden
                      >
                        {done ? '✓' : i + 1}
                      </span>
                      <span className={current ? 'font-medium' : ''}>{orderStatusLabel(step)}</span>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          {shipText ? (
            <section className="checkout-section">
              <h2 className="gift-h2">Ship to</h2>
              <p className="mt-gs-2 whitespace-pre-line text-body opacity-80">{shipText}</p>
              {order.shippingMethod ? (
                <p className="mt-gs-2 text-caption opacity-60">
                  {shippingMethodLabel(order.shippingMethod)}
                </p>
              ) : null}
            </section>
          ) : null}

          {order.giftMessage || order.giftWrap ? (
            <section className="checkout-section">
              <h2 className="gift-h2">Gift</h2>
              {order.giftWrap ? <p className="mt-gs-2 text-body">Gift wrap</p> : null}
              {order.giftMessage ? (
                <p className="mt-gs-2 text-body opacity-80">{order.giftMessage}</p>
              ) : null}
            </section>
          ) : null}

          {!placed ? (
            <section className="checkout-section text-body">
              <h2 className="gift-h2">Return</h2>
              {eligibility ? (
                <>
                  {eligibility.existing.length > 0 ? (
                    <ul className="mt-gs-3 space-y-gs-1">
                      {eligibility.existing.map((r) => (
                        <li key={r.id}>
                          {orderStatusLabel(r.status)}: {r.reason}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {eligibility.eligible ? (
                    <div className="mt-gs-4">
                      <label className="block text-body">
                        Reason
                        <textarea
                          className="clay-input min-h-[72px]"
                          placeholder="Reason"
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                        />
                      </label>
                      <button
                        type="button"
                        className="clay-btn mt-gs-3 disabled:opacity-60"
                        disabled={returnBusy || !returnReason.trim()}
                        onClick={() => void submitReturn()}
                      >
                        {returnBusy ? 'Sending…' : 'Request return'}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-gs-2 opacity-70">{eligibility.reason}</p>
                  )}
                </>
              ) : null}
              {returnMsg ? <p className="mt-gs-2 opacity-80">{returnMsg}</p> : null}
            </section>
          ) : null}
        </div>

        <aside className="checkout-section checkout-section--soft lg:sticky lg:top-[calc(var(--gift-sticky-offset)+var(--space-4))]">
          <h2 className="gift-h2">Order summary</h2>
          <ul className="mt-gs-4 space-y-gs-3">
            {order.items.map((item, i) => (
              <li key={i} className="flex gap-gs-3 text-body">
                <LineThumb imageUrl={item.imageUrl} quantity={item.quantity} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{item.title}</p>
                  <p className="mt-gs-1 opacity-70">{item.label}</p>
                  {item.giftExtras?.note ? (
                    <p className="mt-gs-1 text-caption opacity-70">
                      {item.giftExtras.note.label}: {item.giftExtras.note.value}
                    </p>
                  ) : null}
                  {item.giftExtras?.wrap ? (
                    <p className="mt-gs-1 text-caption opacity-70">
                      Wrap: {item.giftExtras.wrap.label}
                    </p>
                  ) : null}
                  {item.giftExtras?.ribbon ? (
                    <p className="mt-gs-1 text-caption opacity-70">
                      Ribbon: {item.giftExtras.ribbon.label}
                    </p>
                  ) : null}
                </div>
                <p className="shrink-0 font-medium">{formatInr(item.lineTotalPaise)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-gs-5 space-y-gs-2 text-body">
            <div className="flex justify-between gap-gs-3">
              <dt className="opacity-70">Subtotal</dt>
              <dd>{formatInr(order.subtotalPaise)}</dd>
            </div>
            {order.discountPaise > 0 ? (
              <div className="flex justify-between gap-gs-3 text-success">
                <dt>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</dt>
                <dd>−{formatInr(order.discountPaise)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-gs-3">
              <dt className="opacity-70">Shipping</dt>
              <dd>{order.shippingPaise === 0 ? 'Free' : formatInr(order.shippingPaise)}</dd>
            </div>
            {(order.taxPaise ?? 0) > 0 ? (
              <div className="flex justify-between gap-gs-3">
                <dt className="opacity-70">Tax</dt>
                <dd>{formatInr(order.taxPaise ?? 0)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-gs-3 border-t border-border-subtle pt-gs-3 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="text-primary">{formatInr(order.totalPaise)}</dd>
            </div>
          </dl>
          {payment ? (
            <p className="mt-gs-3 text-caption opacity-60">
              {payment.provider === 'mock' ? 'Mock payment' : payment.provider} ·{' '}
              {orderStatusLabel(payment.status)}
            </p>
          ) : null}
        </aside>
      </div>

      <p className="mt-gs-6 text-body opacity-70">
        <a href="mailto:hello@inabiya.in" className="gift-link">
          hello@inabiya.in
        </a>
      </p>
    </main>
  );
}
