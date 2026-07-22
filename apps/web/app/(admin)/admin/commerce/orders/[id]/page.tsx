'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  giftMessage: string | null;
  canCancel?: boolean;
  items: Array<{ title: string; label: string; quantity: number; lineTotalPaise: number }>;
  statusHistory: Array<{ status: string; note: string | null; createdAt: string }>;
  paymentVerification: Array<{
    provider: string;
    status: string;
    amountPaise: number;
    verified: boolean;
  }>;
  notes: Array<{ id: string; body: string; authorEmail: string | null; createdAt: string }>;
  customer: { email: string; displayName: string | null };
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<OrderDetail>(`/admin/orders/${params.id}`)
      .then(setOrder)
      .catch(() => router.replace('/admin/commerce/orders'));
  }, [params.id, router]);

  async function setStatus(status: string) {
    await apiAuth(`/admin/orders/${params.id}/status`, { method: 'PATCH', json: { status } });
    const refreshed = await apiAuth<OrderDetail>(`/admin/orders/${params.id}`);
    setOrder(refreshed);
  }

  async function cancelOrder() {
    if (!window.confirm('Cancel order and trigger mock refund + restock?')) return;
    const refreshed = await apiAuth<OrderDetail>(`/admin/orders/${params.id}/cancel`, {
      method: 'POST',
    });
    setOrder(refreshed);
  }

  async function addNote() {
    if (!note.trim()) return;
    await apiAuth(`/admin/orders/${params.id}/notes`, { method: 'POST', json: { body: note } });
    setNote('');
    const refreshed = await apiAuth<OrderDetail>(`/admin/orders/${params.id}`);
    setOrder(refreshed);
  }

  if (!order) return <main className="p-8 text-sm opacity-70">Loading…</main>;

  return (
    <main className="min-h-screen p-8 max-w-2xl">
      <Link href="/admin/commerce/orders" className="text-sm underline opacity-70">
        ← Orders
      </Link>
      <h1 className="text-2xl font-semibold mt-4">{order.orderNumber}</h1>
      <p className="text-sm opacity-70">
        {order.customer.email} · {order.status}
      </p>

      <section className="mt-4 text-sm">
        <h2 className="font-medium">Payment</h2>
        {order.paymentVerification.map((p) => (
          <p key={p.provider + p.status}>
            {p.provider}: {p.status} {p.verified ? '✓' : ''} — {formatInr(p.amountPaise)}
          </p>
        ))}
      </section>

      <ul className="mt-4 space-y-1 text-sm">
        {order.items.map((i, idx) => (
          <li key={idx}>
            {i.title} ({i.label}) × {i.quantity} — {formatInr(i.lineTotalPaise)}
          </li>
        ))}
      </ul>
      <p className="mt-2 font-medium">Total: {formatInr(order.totalPaise)}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === 'PAID' ? (
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={() => void setStatus('PROCESSING')}
          >
            Processing
          </button>
        ) : null}
        {order.status === 'PROCESSING' ? (
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={() => void setStatus('SHIPPED')}
          >
            Shipped
          </button>
        ) : null}
        {order.status === 'SHIPPED' ? (
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={() => void setStatus('DELIVERED')}
          >
            Delivered
          </button>
        ) : null}
        {order.canCancel || order.status === 'PAID' || order.status === 'PROCESSING' ? (
          <button
            type="button"
            className="rounded border border-red-300 px-3 py-1 text-sm text-red-700"
            onClick={() => void cancelOrder()}
          >
            Cancel + refund
          </button>
        ) : null}
      </div>

      <section className="mt-6">
        <h2 className="font-medium text-sm">Internal notes</h2>
        <ul className="mt-2 text-sm space-y-1">
          {order.notes.map((n) => (
            <li key={n.id}>
              {n.body} — {n.authorEmail ?? 'system'}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded border px-2 py-1 text-sm"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={() => void addNote()}
          >
            Add
          </button>
        </div>
      </section>

      <section className="mt-6 text-sm opacity-80">
        <h2 className="font-medium">Timeline</h2>
        <ol className="mt-2 space-y-1">
          {order.statusHistory.map((h, i) => (
            <li key={i}>
              {h.status} — {new Date(h.createdAt).toLocaleString()}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
