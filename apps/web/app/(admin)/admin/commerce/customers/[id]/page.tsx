'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<{
    profile: { id: string; email: string; displayName: string | null; isActive: boolean };
    orders: Array<{ id: string; orderNumber: string; status: string; totalPaise: number }>;
  } | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<NonNullable<typeof data>>(`/admin/commerce/customers/${params.id}`)
      .then(setData)
      .catch(() => router.replace('/admin/commerce/customers'));
  }, [params.id, router]);

  async function toggleActive() {
    if (!data) return;
    await apiAuth(`/admin/commerce/customers/${params.id}/status`, {
      method: 'PATCH',
      json: { isActive: !data.profile.isActive },
    });
    setData(await apiAuth(`/admin/commerce/customers/${params.id}`));
  }

  if (!data) return <main className="p-8 text-sm opacity-70">Loading…</main>;

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/commerce/customers" className="text-sm underline opacity-70">
        ← Customers
      </Link>
      <h1 className="text-2xl font-semibold mt-4">{data.profile.email}</h1>
      <p className="text-sm opacity-70">{data.profile.isActive ? 'Active' : 'Suspended'}</p>
      <button type="button" className="mt-2 text-sm underline" onClick={() => void toggleActive()}>
        {data.profile.isActive ? 'Suspend' : 'Reactivate'}
      </button>
      <h2 className="font-medium mt-6">Orders</h2>
      <ul className="mt-2 text-sm space-y-1">
        {data.orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/commerce/orders/${o.id}`} className="underline">
              {o.orderNumber}
            </Link>{' '}
            — {o.status} — {formatInr(o.totalPaise)}
          </li>
        ))}
      </ul>
    </main>
  );
}
