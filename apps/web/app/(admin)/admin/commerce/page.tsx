'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  apiAuth,
  clearSession,
  getStoredAccessToken,
  type AuthUser,
} from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';

type Dashboard = {
  kpis: {
    orderCount: number;
    revenuePaise: number;
    todayRevenuePaise: number;
    aovPaise: number;
    pendingFulfillment: number;
  };
  alerts: {
    failedPayments: number;
    lowStock: Array<{ sku: string; productTitle: string; available: number }>;
  };
};

export default function CommerceAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        if (!u.roles.includes('COMMERCE_ADMIN') && !u.roles.includes('SUPER_ADMIN')) {
          setError('Commerce Admin role required.');
          return;
        }
        setUser(u);
        return apiAuth<Dashboard>('/admin/commerce/dashboard');
      })
      .then((d) => d && setDash(d))
      .catch(() => {
        clearSession();
        router.replace('/login');
      });
  }, [router]);

  if (error) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-red-600">{error}</p>
        <Link className="underline" href="/login">Sign in</Link>
      </main>
    );
  }

  if (!user || !dash) {
    return <main className="min-h-screen p-8 text-sm opacity-70">Loading ops console…</main>;
  }

  return (
    <main className="min-h-screen p-8 bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Commerce Ops</h1>
          <p className="mt-1 text-sm opacity-80">
            Signed in as {user.email}
            {user.roles.includes('COMMERCE_ADMIN') ? ' (COMMERCE_ADMIN)' : ''}
          </p>
        </div>
        <button
          type="button"
          className="rounded border px-3 py-1.5 text-sm"
          onClick={() => {
            clearSession();
            window.location.href = '/login';
          }}
        >
          Log out
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border p-4">
          <p className="text-xs uppercase opacity-60">Orders</p>
          <p className="text-2xl font-semibold">{dash.kpis.orderCount}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs uppercase opacity-60">Revenue</p>
          <p className="text-2xl font-semibold">{formatInr(dash.kpis.revenuePaise)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs uppercase opacity-60">Today</p>
          <p className="text-2xl font-semibold">{formatInr(dash.kpis.todayRevenuePaise)}</p>
        </div>
        <div className="rounded border p-4">
          <p className="text-xs uppercase opacity-60">AOV</p>
          <p className="text-2xl font-semibold">{formatInr(dash.kpis.aovPaise)}</p>
        </div>
      </div>

      {(dash.alerts.failedPayments > 0 || dash.alerts.lowStock.length > 0) && (
        <section className="mt-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm">
          <h2 className="font-medium">Alerts</h2>
          {dash.alerts.failedPayments > 0 ? (
            <p className="mt-1">Failed payments: {dash.alerts.failedPayments}</p>
          ) : null}
          {dash.alerts.lowStock.length > 0 ? (
            <p className="mt-1">Low stock SKUs: {dash.alerts.lowStock.length}</p>
          ) : null}
          <p className="mt-1 opacity-70">Pending fulfillment: {dash.kpis.pendingFulfillment}</p>
        </section>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
        {(
          [
            ['Products', '/admin/commerce/products'],
            ['Orders', '/admin/commerce/orders'],
            ['Reviews', '/admin/commerce/reviews'],
            ['Returns', '/admin/commerce/returns'],
            ['Reports', '/admin/commerce/reports'],
            ['Support', '/admin/commerce/support'],
            ['Customers', '/admin/commerce/customers'],
            ['Coupons', '/admin/commerce/coupons'],
            ['Homepage', '/admin/commerce/merchandising'],
            ['Pages', '/admin/cms/pages'],
            ['Inquiries', '/admin/commerce/gifting-inquiries'],
            ['Search', '/admin/commerce/search'],
            ['Storefront', '/gift'],
          ] as const
        ).map(([label, href]) => (
          <Link key={href} href={href} className="rounded border p-3 text-sm hover:bg-neutral-50">
            {label}
          </Link>
        ))}
      </div>
    </main>
  );
}
