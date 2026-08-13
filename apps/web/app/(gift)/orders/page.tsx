'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, orderStatusLabel } from '@/lib/cart-client';
import { GiftListSkeleton } from '@/components/gift/gift-skeletons';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalPaise: number;
  itemCount: number;
  createdAt: string;
  invoiceAvailable?: boolean;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/orders');
      return;
    }
    apiAuth<Order[]>('/orders/me')
      .then(setOrders)
      .catch(() => router.replace('/login?next=/orders'));
  }, [router]);

  if (!orders) {
    return <GiftListSkeleton label="Loading orders" />;
  }

  return (
    <main className="gift-page max-w-lg">
      <Link href="/account" className="gift-link text-body">
        ← Account
      </Link>
      <h1 className="gift-h1 mt-gs-4">Your orders</h1>
      <ul className="mt-gs-6 space-y-gs-3">
        {orders.length === 0 ? (
          <li className="checkout-section text-center">
            <p className="text-body opacity-80">No orders yet</p>
            <Link href="/gift/products" className="clay-btn mt-gs-5 inline-flex">
              Browse gifts
            </Link>
          </li>
        ) : (
          orders.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="checkout-section block text-body hover:border-primary"
              >
                <span className="font-medium">{o.orderNumber}</span>
                <span className="mt-gs-1 block opacity-70">
                  {orderStatusLabel(o.status)} · {formatInr(o.totalPaise)} · {o.itemCount}{' '}
                  {o.itemCount === 1 ? 'item' : 'items'}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
