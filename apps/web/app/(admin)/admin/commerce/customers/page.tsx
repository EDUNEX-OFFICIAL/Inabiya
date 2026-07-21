'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

export default function AdminCustomersPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Array<{ id: string; email: string; displayName: string | null; isActive: boolean; _count: { orders: number } }>>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<typeof rows>('/admin/commerce/customers').then(setRows).catch(() => router.replace('/login'));
  }, [router]);

  return (
    <main className="min-h-screen p-8">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">← Dashboard</Link>
      <h1 className="text-2xl font-semibold mt-4">Customers</h1>
      <ul className="mt-6 space-y-2 text-sm">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/admin/commerce/customers/${c.id}`} className="underline">{c.email}</Link>
            {' '}· {c._count.orders} orders · {c.isActive ? 'active' : 'suspended'}
          </li>
        ))}
      </ul>
    </main>
  );
}
