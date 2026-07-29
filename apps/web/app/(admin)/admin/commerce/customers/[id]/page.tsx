'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiAuth,
  getStoredAccessToken,
  getStoredUser,
} from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type Customer360 = {
  profile: {
    id: string;
    email: string;
    displayName: string | null;
    isActive: boolean;
    createdAt: string;
  };
  orderCount: number;
  ltvPaise: number;
  segments: string[];
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    createdAt: string;
  }>;
  addresses: Array<{
    id: string;
    label: string | null;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorEmail: string | null;
    orderId: string;
    orderNumber: string;
  }>;
  inquiries: Array<{
    id: string;
    type: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
};

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<Customer360 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState<string[]>(() => getStoredUser()?.roles ?? []);
  const canSuspend =
    roles.includes('COMMERCE_ADMIN') || roles.includes('SUPER_ADMIN');

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<{ roles: string[] }>('/auth/me')
      .then((me) => setRoles(me.roles ?? []))
      .catch(() => {
        /* keep stored roles */
      });
    apiAuth<Customer360>(`/admin/commerce/customers/${params.id}`)
      .then(setData)
      .catch(() => router.replace('/admin/commerce/customers'));
  }, [params.id, router]);

  async function toggleActive() {
    if (!data || !canSuspend) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await apiAuth(`/admin/commerce/customers/${params.id}/status`, {
        method: 'PATCH',
        json: { isActive: !data.profile.isActive },
      });
      setData(await apiAuth<Customer360>(`/admin/commerce/customers/${params.id}`));
      setMsg(data.profile.isActive ? 'Customer suspended' : 'Customer reactivated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="text-sm opacity-70">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <OpsPageHeader
        title={data.profile.email}
        description={`${data.profile.displayName ?? 'Customer'} · ${data.orderCount} orders · LTV ${formatInr(data.ltvPaise)}`}
        actions={
          <>
            <Link href="/admin/commerce/customers" className="clay-btn-secondary text-sm">
              ← Customers
            </Link>
            <Link href="/admin/commerce/support" className="clay-btn-secondary text-sm">
              Support
            </Link>
            {canSuspend ? (
              <button
                type="button"
                className="clay-btn text-sm disabled:opacity-50"
                disabled={busy}
                onClick={() => void toggleActive()}
              >
                {data.profile.isActive ? 'Suspend' : 'Reactivate'}
              </button>
            ) : null}
          </>
        }
      />

      {msg ? <p className="mb-3 text-sm text-emerald-800">{msg}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}

      <section className="mb-4 flex flex-wrap gap-2 text-sm">
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            data.profile.isActive
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-red-100 text-red-900'
          }`}
        >
          {data.profile.isActive ? 'Active' : 'Suspended'}
        </span>
        {data.segments.map((s) => (
          <span
            key={s}
            className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] uppercase tracking-wide"
          >
            {s}
          </span>
        ))}
      </section>

      <section className="mb-6 rounded border border-[color:var(--gift-line)] p-4 text-sm">
        <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Profile</h2>
        <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs opacity-60">Email</dt>
            <dd>{data.profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs opacity-60">Joined</dt>
            <dd>{new Date(data.profile.createdAt).toLocaleDateString('en-IN')}</dd>
          </div>
        </dl>
      </section>

      <section className="mb-6 rounded border border-[color:var(--gift-line)] p-4 text-sm">
        <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Addresses</h2>
        {data.addresses.length === 0 ? (
          <p className="mt-2 opacity-70">No saved addresses.</p>
        ) : (
          <ul className="mt-2 space-y-3">
            {data.addresses.map((a) => (
              <li key={a.id} className="rounded border p-3">
                <p className="font-medium">
                  {a.fullName}
                  {a.isDefault ? ' · default' : ''}
                  {a.label ? ` · ${a.label}` : ''}
                </p>
                <p className="opacity-70">{a.phone}</p>
                <p className="opacity-80">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ''}
                </p>
                <p className="opacity-80">
                  {a.city}, {a.state} {a.postalCode} · {a.country}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-6 rounded border border-[color:var(--gift-line)] p-4 text-sm">
        <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Orders</h2>
        <ul className="mt-2 space-y-2">
          {data.orders.length === 0 ? (
            <li className="opacity-70">No orders.</li>
          ) : (
            data.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap justify-between gap-2 border-b py-2">
                <Link href={`/admin/commerce/orders/${o.id}`} className="underline">
                  {o.orderNumber}
                </Link>
                <span className="opacity-70">
                  {o.status} · {formatInr(o.totalPaise)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mb-6 rounded border border-[color:var(--gift-line)] p-4 text-sm">
        <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
          Notes (from orders)
        </h2>
        <p className="mt-1 text-xs opacity-60">
          Add notes on the order case file — they appear here for the customer 360.
        </p>
        <ul className="mt-2 space-y-2">
          {data.notes.length === 0 ? (
            <li className="opacity-70">No notes yet.</li>
          ) : (
            data.notes.map((n) => (
              <li key={n.id} className="rounded border p-2">
                <p>{n.body}</p>
                <p className="mt-1 text-xs opacity-60">
                  <Link href={`/admin/commerce/orders/${n.orderId}`} className="underline">
                    {n.orderNumber}
                  </Link>
                  {' · '}
                  {n.authorEmail ?? 'staff'} · {new Date(n.createdAt).toLocaleString('en-IN')}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mb-6 rounded border border-[color:var(--gift-line)] p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
            Gifting inquiries
          </h2>
          <Link href="/admin/commerce/gifting-inquiries" className="text-xs underline">
            All inquiries
          </Link>
        </div>
        <ul className="mt-2 space-y-2">
          {data.inquiries.length === 0 ? (
            <li className="opacity-70">None for this email.</li>
          ) : (
            data.inquiries.map((i) => (
              <li key={i.id} className="rounded border p-2">
                <p className="font-medium">
                  {i.type} · {i.status}
                </p>
                <p className="mt-1 line-clamp-3 opacity-80">{i.message}</p>
                <p className="mt-1 text-xs opacity-60">
                  {new Date(i.createdAt).toLocaleString('en-IN')}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
