'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { formatInr } from '@/lib/catalog';

type SearchResult = {
  orders: Array<{ id: string; orderNumber: string; customerEmail: string; totalPaise: number }>;
  customers: Array<{ id: string; email: string }>;
  products: Array<{ id: string; slug: string; title: string }>;
};

export default function AdminSearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    const data = await apiAuth<SearchResult>(`/admin/commerce/search?q=${encodeURIComponent(q)}`);
    setResult(data);
  }

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">← Dashboard</Link>
      <h1 className="text-2xl font-semibold mt-4">Search</h1>
      <form onSubmit={onSearch} className="mt-4 flex gap-2">
        <input className="flex-1 rounded border px-2 py-1 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order, email, product…" />
        <button type="submit" className="rounded border px-3 py-1 text-sm">Go</button>
      </form>
      {result ? (
        <div className="mt-6 text-sm space-y-4">
          <div>
            <h2 className="font-medium">Orders</h2>
            {result.orders.map((o) => (
              <p key={o.id}>
                <Link href={`/admin/commerce/orders/${o.id}`} className="underline">{o.orderNumber}</Link>
                {' '}— {o.customerEmail} — {formatInr(o.totalPaise)}
              </p>
            ))}
          </div>
          <div>
            <h2 className="font-medium">Customers</h2>
            {result.customers.map((c) => (
              <p key={c.id}>
                <Link href={`/admin/commerce/customers/${c.id}`} className="underline">{c.email}</Link>
              </p>
            ))}
          </div>
          <div>
            <h2 className="font-medium">Products</h2>
            {result.products.map((p) => (
              <p key={p.id}>
                <Link href={`/gift/products/${p.slug}`} className="underline">{p.title}</Link>
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </main>
  );
}
