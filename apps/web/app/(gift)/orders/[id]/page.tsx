'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/cart-client';

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  subtotalPaise: number;
  discountPaise: number;
  shippingPaise: number;
  giftMessage: string | null;
  items: Array<{ title: string; label: string; quantity: number; lineTotalPaise: number }>;
  statusHistory: Array<{ status: string; createdAt: string; note: string | null }>;
};

type Eligibility = {
  eligible: boolean;
  reason: string | null;
  windowDays: number;
  daysLeft: number | null;
  existing: Array<{ id: string; status: string; reason: string; createdAt: string }>;
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const search = useSearchParams();
  const placed = search.get('placed') === '1';
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnMsg, setReturnMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<OrderDetail>(`/orders/me/${params.id}`)
      .then((o) => {
        setOrder(o);
        return apiAuth<Eligibility>(`/returns/eligibility/${params.id}`);
      })
      .then(setEligibility)
      .catch(() => router.replace('/orders'));
  }, [params.id, router]);

  async function submitReturn() {
    try {
      await apiAuth(`/returns/orders/${params.id}`, {
        method: 'POST',
        json: { reason: returnReason },
      });
      setReturnMsg('Return requested — waiting for review.');
      const e = await apiAuth<Eligibility>(`/returns/eligibility/${params.id}`);
      setEligibility(e);
    } catch (err) {
      setReturnMsg(err instanceof Error ? err.message : 'Return failed');
    }
  }

  if (!order) {
    return <main className="gift-page text-sm opacity-70">Loading order…</main>;
  }

  const steps = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] as const;
  const statusIndex = steps.indexOf(order.status as (typeof steps)[number]);
  const special =
    order.status === 'CANCELLED' ||
    order.status === 'PAYMENT_FAILED' ||
    order.status === 'RETURNED';

  return (
    <main className="gift-page max-w-lg">
      {placed ? (
        <p
          className="gift-banner gift-banner--success mb-gs-4"
          role="status"
        >
          Thank you! Your order was placed successfully.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-gs-3 text-sm">
        <Link href="/orders" className="gift-link">
          ← All orders
        </Link>
        <Link href="/account" className="gift-link">
          Account
        </Link>
      </div>
      <h1 className="gift-h1 mt-gs-4">{order.orderNumber}</h1>
      <p className="mt-gs-1 text-sm opacity-70">Status: {order.status}</p>

      <section className="clay-panel mt-gs-6 p-gs-5" aria-label="Order tracking">
        <h2 className="font-display text-xl">Tracking</h2>
        {special ? (
          <p className="gift-banner gift-banner--warning mt-gs-3">
            {order.status}
          </p>
        ) : (
          <ol className="mt-gs-4 space-y-gs-3">
            {steps.map((step, i) => {
              const done = statusIndex >= i;
              const current = statusIndex === i;
              return (
                <li
                  key={step}
                  className={`flex items-center gap-gs-3 text-sm ${done ? '' : 'opacity-40'}`}
                >
                  <span
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                      done
                        ? 'border-primary bg-primary text-white shadow-clay'
                        : 'border-border-strong'
                    }`}
                    aria-hidden
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className={current ? 'font-medium' : ''}>{step.replaceAll('_', ' ')}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <ul className="mt-gs-6 space-y-gs-3 text-sm">
        {order.items.map((item, i) => (
          <li key={i} className="clay-card flex justify-between gap-gs-4 p-gs-4">
            <span>
              {item.title} ({item.label}) × {item.quantity}
            </span>
            <span className="shrink-0 font-medium text-primary">
              {formatInr(item.lineTotalPaise)}
            </span>
          </li>
        ))}
      </ul>

      <div className="clay-panel mt-gs-4 space-y-gs-1 p-gs-5 text-sm">
        <p>Subtotal: {formatInr(order.subtotalPaise)}</p>
        {order.discountPaise > 0 ? <p>Discount: −{formatInr(order.discountPaise)}</p> : null}
        <p>Shipping: {formatInr(order.shippingPaise)}</p>
        <p className="pt-gs-2 text-lg font-semibold">Total: {formatInr(order.totalPaise)}</p>
      </div>

      {order.giftMessage ? (
        <p className="clay-card mt-gs-4 p-gs-4 text-sm">
          <strong>Gift message:</strong> {order.giftMessage}
        </p>
      ) : null}

      <h2 className="font-display mt-gs-6 mb-gs-3 text-xl">Timeline</h2>
      <ol className="space-y-gs-2 text-sm opacity-80">
        {order.statusHistory.map((h, i) => (
          <li key={i} className="clay-chip !block w-full !rounded-control py-gs-2">
            {h.status} — {new Date(h.createdAt).toLocaleString()}
            {h.note ? ` (${h.note})` : ''}
          </li>
        ))}
      </ol>

      <section className="clay-panel mt-gs-6 p-gs-5 text-sm">
        <h2 className="font-display text-xl">Return</h2>
        {eligibility ? (
          <>
            <p className="mt-gs-2 opacity-70">
              Window: {eligibility.windowDays} days after delivery
              {eligibility.daysLeft != null ? ` · ${eligibility.daysLeft} days left` : ''}
            </p>
            {eligibility.existing.length > 0 ? (
              <ul className="mt-gs-2 space-y-gs-1">
                {eligibility.existing.map((r) => (
                  <li key={r.id}>
                    {r.status}: {r.reason}
                  </li>
                ))}
              </ul>
            ) : null}
            {eligibility.eligible ? (
              <div className="mt-gs-4">
                <textarea
                  className="clay-input min-h-[72px]"
                  placeholder="Why are you returning?"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
                <button type="button" className="clay-btn mt-gs-3" onClick={() => void submitReturn()}>
                  Request return
                </button>
              </div>
            ) : (
              <p className="mt-gs-2 opacity-70">{eligibility.reason}</p>
            )}
          </>
        ) : null}
        {returnMsg ? <p className="mt-gs-2 opacity-80">{returnMsg}</p> : null}
      </section>
    </main>
  );
}
