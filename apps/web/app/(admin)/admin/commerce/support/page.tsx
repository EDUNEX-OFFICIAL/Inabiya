'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';

type SearchResult = {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    customerEmail: string;
  }>;
  customers: Array<{ id: string; email: string; displayName: string | null }>;
};

export default function SupportLookupPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    try {
      const data = await apiAuth<SearchResult>(
        `/admin/commerce/search?q=${encodeURIComponent(q.trim())}`,
      );
      setResult(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Ops
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Support lookup</h1>
      <p className="text-sm opacity-70 mt-1">Search by order number or customer email.</p>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => void lookup(e)}
        aria-label="Support search"
      >
        <label className="sr-only" htmlFor="support-q">
          Order number or email
        </label>
        <input
          id="support-q"
          className="flex-1 rounded border px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="INB-… or email"
          required
        />
        <button type="submit" className="rounded border px-3 py-2 text-sm">
          Lookup
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {result ? (
        <div className="mt-6 space-y-6 text-sm">
          <section>
            <h2 className="font-medium">Orders</h2>
            <ul className="mt-2 space-y-2">
              {result.orders.length === 0 ? (
                <li className="opacity-70">No orders.</li>
              ) : (
                result.orders.map((o) => (
                  <li key={o.id} className="rounded border p-3">
                    <Link className="font-medium underline" href={`/admin/commerce/orders/${o.id}`}>
                      {o.orderNumber}
                    </Link>
                    <p className="opacity-70">
                      {o.status} · {formatInr(o.totalPaise)} · {o.customerEmail}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
          <section>
            <h2 className="font-medium">Customers</h2>
            <ul className="mt-2 space-y-1">
              {result.customers.length === 0 ? (
                <li className="opacity-70">No customers.</li>
              ) : (
                result.customers.map((c) => (
                  <li key={c.id}>
                    <Link className="underline" href={`/admin/commerce/customers/${c.id}`}>
                      {c.email}
                    </Link>
                    {c.displayName ? ` — ${c.displayName}` : ''}
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      ) : null}
    </main>
  );
}
