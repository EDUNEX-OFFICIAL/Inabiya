'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type SearchResult = {
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    customerEmail: string;
    customerId?: string;
    phone?: string | null;
  }>;
  customers: Array<{
    id: string;
    email: string;
    displayName: string | null;
    isActive?: boolean;
    phone?: string | null;
  }>;
  inquiries?: Array<{
    id: string;
    type: string;
    email: string;
    fullName: string;
    phone: string | null;
    status: string;
    createdAt: string;
  }>;
};

type Inquiry = {
  id: string;
  type: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: string;
};

export default function SupportLookupPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<Inquiry[]>('/admin/commerce/gifting-inquiries')
      .then((rows) => setRecentInquiries(rows.slice(0, 5)))
      .catch(() => setRecentInquiries([]));
  }, [router]);

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
    <div className="max-w-2xl">
      <OpsPageHeader
        title="Support desk"
        description="Lookup by order #, email, or phone — then open order / customer in under 3 clicks."
        actions={
          <>
            <Link href="/admin/commerce/customers" className="clay-btn-secondary text-sm">
              Customers
            </Link>
            <Link href="/admin/commerce/gifting-inquiries" className="clay-btn-secondary text-sm">
              Inquiries
            </Link>
            <Link href="/admin/commerce/returns" className="clay-btn-secondary text-sm">
              Returns
            </Link>
          </>
        }
      />

      <form
        className="mt-2 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => void lookup(e)}
        aria-label="Support search"
      >
        <label className="sr-only" htmlFor="support-q">
          Order number, email, or phone
        </label>
        <input
          id="support-q"
          className="min-h-10 flex-1 rounded border px-3 py-2 text-sm"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="INB-… / email / phone"
          required
        />
        <button type="submit" className="clay-btn min-h-10 px-3 text-sm">
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
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <Link
                        className="font-medium underline"
                        href={`/admin/commerce/orders/${o.id}`}
                      >
                        {o.orderNumber}
                      </Link>
                      {o.customerId ? (
                        <Link
                          className="underline opacity-80"
                          href={`/admin/commerce/customers/${o.customerId}`}
                        >
                          Customer 360
                        </Link>
                      ) : null}
                    </div>
                    <p className="opacity-70">
                      {o.status} · {formatInr(o.totalPaise)} · {o.customerEmail}
                      {o.phone ? ` · ${o.phone}` : ''}
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
                  <li key={c.id} className="rounded border p-2">
                    <Link className="underline font-medium" href={`/admin/commerce/customers/${c.id}`}>
                      {c.email}
                    </Link>
                    <p className="text-xs opacity-70">
                      {c.displayName ? `${c.displayName} · ` : ''}
                      {c.phone ?? 'no phone'}
                      {c.isActive === false ? ' · suspended' : ''}
                    </p>
                  </li>
                ))
              )}
            </ul>
          </section>
          {result.inquiries && result.inquiries.length > 0 ? (
            <section>
              <h2 className="font-medium">Matching inquiries</h2>
              <ul className="mt-2 space-y-1">
                {result.inquiries.map((i) => (
                  <li key={i.id} className="rounded border p-2">
                    <p className="font-medium">
                      {i.type} · {i.fullName} · {i.status}
                    </p>
                    <p className="text-xs opacity-70">
                      {i.email}
                      {i.phone ? ` · ${i.phone}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href="/admin/commerce/gifting-inquiries"
                className="mt-2 inline-block text-xs underline"
              >
                View all inquiries
              </Link>
            </section>
          ) : null}
        </div>
      ) : (
        <section className="mt-8 rounded border border-[color:var(--gift-line)] p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">Recent inquiries</h2>
            <Link href="/admin/commerce/gifting-inquiries" className="text-xs underline">
              All
            </Link>
          </div>
          <ul className="mt-2 space-y-2">
            {recentInquiries.length === 0 ? (
              <li className="opacity-70">No recent inquiries.</li>
            ) : (
              recentInquiries.map((i) => (
                <li key={i.id} className="border-b py-2">
                  <p className="font-medium">
                    {i.type} · {i.fullName}
                  </p>
                  <p className="text-xs opacity-70">
                    {i.email}
                    {i.phone ? ` · ${i.phone}` : ''} · {i.status}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
