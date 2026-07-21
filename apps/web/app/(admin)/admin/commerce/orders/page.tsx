'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/cart-client';

type AdminOrder = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  customerEmail: string;
  itemCount: number;
  createdAt: string;
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<AdminOrder[]>('/admin/orders')
      .then(setOrders)
      .catch(() => router.replace('/login'));
  }, [router]);

  async function markProcessing(id: string) {
    const updated = await apiAuth<{ id: string; status: string }>(`/admin/orders/${id}/status`, {
      method: 'PATCH',
      json: { status: 'PROCESSING' },
    });
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: updated.status } : o)));
  }

  return (
    <main className="min-h-screen p-8">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Commerce admin
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Orders</h1>
      <table className="mt-6 w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 pr-4">Order</th>
            <th className="py-2 pr-4">Customer</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Total</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="py-2 pr-4">{o.orderNumber}</td>
              <td className="py-2 pr-4">{o.customerEmail}</td>
              <td className="py-2 pr-4">{o.status}</td>
              <td className="py-2 pr-4">{formatInr(o.totalPaise)}</td>
                <td className="py-2">
                  <Link href={`/admin/commerce/orders/${o.id}`} className="underline mr-3">
                    View
                  </Link>
                  {o.status === 'PAID' ? (
                  <button type="button" className="underline" onClick={() => void markProcessing(o.id)}>
                    Mark processing
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
