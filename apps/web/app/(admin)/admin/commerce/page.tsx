'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiAuth, getStoredUser, type AuthUser } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type RangeDays = 1 | 7 | 30;

type Dashboard = {
  rangeDays: number;
  generatedAt: string;
  kpis: {
    orderCount: number;
    revenuePaise: number;
    aovPaise: number;
    ordersToday: number;
    todayRevenuePaise: number;
    pendingFulfillment: number;
    pendingShip: number;
    awaitingProcess: number;
  };
  alerts: {
    failedPayments: number;
    openReturns: number;
    pendingFulfillment: number;
    pendingShip: number;
    awaitingProcess: number;
    lowStock: Array<{
      sku: string;
      productTitle: string;
      productId: string;
      available: number;
    }>;
  };
};

const RANGES: Array<{ days: RangeDays; label: string }> = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}

export default function CommerceAdminPage() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [range, setRange] = useState<RangeDays>(7);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (days: RangeDays) => {
    setLoading(true);
    setError(null);
    try {
      const u = await apiAuth<AuthUser>('/auth/me');
      setUser(u);
      if (!u.roles.includes('COMMERCE_ADMIN') && !u.roles.includes('SUPER_ADMIN')) {
        setError('Dashboard requires Commerce Admin.');
        setDash(null);
        return;
      }
      const d = await apiAuth<Dashboard>(`/admin/commerce/dashboard?range=${days}`);
      setDash(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      setDash(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  if (error && !dash) {
    return (
      <div>
        <OpsPageHeader title="Command center" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OpsPageHeader
        title="Command center"
        description={
          user
            ? `${user.email}${dash ? ` · updated ${relativeAge(dash.generatedAt)}` : ''}`
            : undefined
        }
        actions={
          <>
            <div
              className="flex w-full max-w-full overflow-x-auto rounded-lg border border-[var(--border-subtle)] sm:w-auto"
              role="group"
              aria-label="Date range"
            >
              {RANGES.map((r) => (
                <button
                  key={r.days}
                  type="button"
                  className={`min-h-10 flex-1 whitespace-nowrap px-3 text-xs font-medium sm:flex-none ${
                    range === r.days
                      ? 'bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] text-[var(--primary)]'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-pressed={range === r.days}
                  onClick={() => setRange(r.days)}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="clay-btn-secondary min-h-10 text-sm"
              disabled={loading}
              onClick={() => void load(range)}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </>
        }
      />

      {loading && !dash ? <p className="text-sm opacity-70">Loading command center…</p> : null}

      {dash ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            <Kpi
              label={range === 1 ? 'Orders today' : `Orders (${range}d)`}
              value={String(dash.kpis.orderCount)}
            />
            <Kpi label={range === 1 ? 'Revenue today' : `Revenue (${range}d)`} value={formatInr(dash.kpis.revenuePaise)} />
            <Kpi label="AOV" value={formatInr(dash.kpis.aovPaise)} />
            <Kpi
              label="Open fulfillments"
              value={String(dash.kpis.pendingFulfillment)}
              href="/admin/commerce/orders?status=PAID,PROCESSING"
            />
          </div>

          {range !== 1 ? (
            <p className="text-xs opacity-55">
              Calendar today: {dash.kpis.ordersToday} orders · {formatInr(dash.kpis.todayRevenuePaise)}
            </p>
          ) : null}

          <section className="clay-panel p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg">Needs attention</h2>
              <span className="text-[11px] opacity-50">Tap a card to open the queue</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <AlertCard
                title="Awaiting process"
                count={dash.alerts.awaitingProcess}
                href="/admin/commerce/orders?status=PAID"
                tone={dash.alerts.awaitingProcess > 0 ? 'warn' : 'ok'}
              />
              <AlertCard
                title="Ready to ship"
                count={dash.alerts.pendingShip}
                href="/admin/commerce/orders?status=PROCESSING"
                tone={dash.alerts.pendingShip > 0 ? 'warn' : 'ok'}
              />
              <AlertCard
                title="Failed payments"
                count={dash.alerts.failedPayments}
                href="/admin/commerce/orders?focus=failed-payments"
                tone={dash.alerts.failedPayments > 0 ? 'danger' : 'ok'}
              />
              <AlertCard
                title="Open returns"
                count={dash.alerts.openReturns}
                href="/admin/commerce/returns?status=REQUESTED"
                tone={dash.alerts.openReturns > 0 ? 'warn' : 'ok'}
              />
              <AlertCard
                title="Low stock SKUs"
                count={dash.alerts.lowStock.length}
                href="/admin/commerce/inventory?lowStock=1"
                tone={dash.alerts.lowStock.length > 0 ? 'warn' : 'ok'}
              />
            </div>
          </section>

          {dash.alerts.lowStock.length > 0 ? (
            <section>
              <h2 className="mb-2 font-medium text-sm">Low stock (sample)</h2>
              <OpsTableScroll>
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="py-2 pr-3">SKU</th>
                      <th className="py-2 pr-3">Product</th>
                      <th className="py-2">Avail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.alerts.lowStock.slice(0, 8).map((row) => (
                      <tr key={row.sku} className="border-b">
                        <td className="py-2 pr-3 font-mono text-xs">{row.sku}</td>
                        <td className="py-2 pr-3">
                          <Link
                            className="underline underline-offset-2"
                            href={`/admin/commerce/products/${row.productId}`}
                          >
                            {row.productTitle}
                          </Link>
                        </td>
                        <td className="py-2">{row.available}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </OpsTableScroll>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 font-medium text-sm">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <QuickAction href="/admin/commerce/products/new" label="New product" />
              <QuickAction href="/admin/commerce/coupons" label="Create coupon" />
              <QuickAction href="/admin/commerce/orders" label="Orders queue" />
              <QuickAction href="/admin/commerce/merchandising" label="Merchandising" />
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <>
      <p className="text-[10px] uppercase tracking-wide opacity-55 sm:text-[11px]">{label}</p>
      <p className="mt-1 break-words text-lg font-semibold sm:text-xl">{value}</p>
    </>
  );
  if (href) {
    return (
      <Link href={href} className="clay-panel block p-3 transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }
  return <div className="clay-panel p-3">{inner}</div>;
}

function AlertCard({
  title,
  count,
  href,
  tone,
}: {
  title: string;
  count: number;
  href: string;
  tone: 'ok' | 'warn' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50'
      : tone === 'warn'
        ? 'border-amber-200 bg-amber-50'
        : 'border-[var(--border-subtle)] bg-[var(--surface)]';
  return (
    <Link
      href={href}
      className={`flex min-h-[4.5rem] items-center justify-between gap-3 rounded-lg border px-3 py-3 text-sm ${toneClass}`}
    >
      <span className="font-medium">{title}</span>
      <span className="text-xl font-semibold tabular-nums">{count}</span>
    </Link>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="clay-btn-secondary flex min-h-11 items-center justify-center px-2 text-center text-xs sm:text-sm"
    >
      {label}
    </Link>
  );
}
