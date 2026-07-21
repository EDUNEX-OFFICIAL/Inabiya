'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/cart-client';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  itemCount: number;
  createdAt: string;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<Order[]>('/orders/me').then(setOrders).catch(() => router.replace('/login'));
  }, [router]);

  return (
    <main className="gift-page max-w-lg">
      <h1 className="gift-h1">Your orders</h1>
      <Link href="/account" className="mt-gs-2 inline-block gift-link text-sm">
        ← Account
      </Link>
      <ul className="mt-gs-6 space-y-gs-3">
        {orders.length === 0 ? (
          <li className="clay-panel p-gs-6 text-sm opacity-80">
            No orders yet.{' '}
            <Link href="/gift/products" className="font-medium text-primary">
              Browse gifts
            </Link>
          </li>
        ) : (
          orders.map((o) => (
            <li key={o.id} className="clay-card p-gs-5 text-sm">
              <Link
                href={`/orders/${o.id}`}
                className="font-medium hover:text-primary"
              >
                {o.orderNumber}
              </Link>
              <p className="mt-gs-1 opacity-70">
                {o.status} · {formatInr(o.totalPaise)} · {o.itemCount} items
              </p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
