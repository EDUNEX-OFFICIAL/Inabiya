'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CreditCard,
  LayoutGrid,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Tag,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { apiAuth, type AuthUser } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { canMutateCommerceFinance } from '@/lib/commerce-ops-nav';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type RangeDays = 1 | 7 | 30;

type AlertPrefs = {
  failedPayments: boolean;
  awaitingProcess: boolean;
  pendingShip: boolean;
  openReturns: boolean;
  lowStock: boolean;
};

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
  previous: {
    orderCount: number;
    revenuePaise: number;
    aovPaise: number;
  };
  daily: Array<{ date: string; orders: number; revenuePaise: number }>;
  aging: {
    hours: number;
    awaitingProcess: number;
    pendingShip: number;
    fulfillment: number;
  };
  alertPrefs: AlertPrefs;
  recentAudit: Array<{
    id: string;
    action: string;
    resource: string | null;
    resourceId: string | null;
    createdAt: string;
    actorEmail: string | null;
  }>;
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

const AUTO_REFRESH_MS = 60_000;

type AlertTone = 'ok' | 'warn' | 'danger';

type AttentionItem = {
  id: keyof AlertPrefs;
  title: string;
  count: number;
  aging?: number;
  href: string;
  tone: AlertTone;
  icon: LucideIcon;
  priority: number;
};

function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  return `${Math.floor(ms / 3_600_000)}h ago`;
}

function deltaLabel(current: number, previous: number): string {
  const d = current - previous;
  if (previous === 0) return d === 0 ? '±0' : 'new';
  const pct = Math.round((d * 100) / previous);
  const sign = d > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

function deltaTone(current: number, previous: number): 'up' | 'down' | 'flat' {
  if (previous === 0) return current === 0 ? 'flat' : 'up';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'flat';
}

export default function CommerceAdminPage() {
  const [range, setRange] = useState<RangeDays>(7);
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [canFinance, setCanFinance] = useState(false);

  const load = useCallback(async (days: RangeDays, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const u = await apiAuth<AuthUser>('/auth/me');
      setCanFinance(canMutateCommerceFinance(u.roles));
      if (!u.roles.includes('COMMERCE_ADMIN') && !u.roles.includes('SUPER_ADMIN')) {
        setError('Dashboard requires Commerce Admin.');
        setDash(null);
        return;
      }
      const d = await apiAuth<Dashboard>(`/admin/commerce/dashboard?range=${days}`);
      setDash(d);
      setNowTick(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      if (!silent) setDash(null);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void load(range, true);
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [autoRefresh, load, range]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 15_000);
    return () => window.clearInterval(id);
  }, []);

  const attention = useMemo((): AttentionItem[] => {
    if (!dash) return [];
    const prefs = dash.alertPrefs;
    const items: AttentionItem[] = [
      {
        id: 'failedPayments',
        title: 'Failed payments',
        count: dash.alerts.failedPayments,
        href: '/admin/commerce/orders?focus=failed-payments',
        tone: dash.alerts.failedPayments > 0 ? 'danger' : 'ok',
        icon: CreditCard,
        priority: dash.alerts.failedPayments > 0 ? 0 : 90,
      },
      {
        id: 'awaitingProcess',
        title: 'Awaiting process',
        count: dash.alerts.awaitingProcess,
        aging: dash.aging.awaitingProcess,
        href: '/admin/commerce/orders?status=PAID',
        tone: dash.alerts.awaitingProcess > 0 ? 'warn' : 'ok',
        icon: Package,
        priority: dash.aging.awaitingProcess > 0 ? 0 : dash.alerts.awaitingProcess > 0 ? 1 : 91,
      },
      {
        id: 'pendingShip',
        title: 'Ready to ship',
        count: dash.alerts.pendingShip,
        aging: dash.aging.pendingShip,
        href: '/admin/commerce/orders?status=PROCESSING',
        tone: dash.alerts.pendingShip > 0 ? 'warn' : 'ok',
        icon: Truck,
        priority: dash.aging.pendingShip > 0 ? 0 : dash.alerts.pendingShip > 0 ? 2 : 92,
      },
      {
        id: 'openReturns',
        title: 'Open returns',
        count: dash.alerts.openReturns,
        href: '/admin/commerce/returns?status=REQUESTED',
        tone: dash.alerts.openReturns > 0 ? 'warn' : 'ok',
        icon: RotateCcw,
        priority: dash.alerts.openReturns > 0 ? 3 : 93,
      },
      {
        id: 'lowStock',
        title: 'Low stock SKUs',
        count: dash.alerts.lowStock.length,
        href: '/admin/commerce/inventory?stock=low',
        tone: dash.alerts.lowStock.length > 0 ? 'warn' : 'ok',
        icon: AlertTriangle,
        priority: dash.alerts.lowStock.length > 0 ? 4 : 94,
      },
    ];
    return items
      .filter((a) => prefs[a.id] !== false)
      .sort(
        (a, b) => a.priority - b.priority || (b.aging ?? 0) - (a.aging ?? 0) || b.count - a.count,
      );
  }, [dash]);

  const openAttention = useMemo(() => attention.filter((a) => a.count > 0), [attention]);
  const attentionTotal = useMemo(
    () => openAttention.reduce((sum, a) => sum + a.count, 0),
    [openAttention],
  );

  const staleLabel = useMemo(() => {
    if (!dash) return null;
    const ageMs = nowTick - new Date(dash.generatedAt).getTime();
    if (ageMs < 45_000) return relativeAge(dash.generatedAt);
    return `stale · ${relativeAge(dash.generatedAt)}`;
  }, [dash, nowTick]);

  if (error && !dash) {
    return (
      <div>
        <OpsPageHeader title="Dashboard" />
        <div className="gift-banner gift-banner--danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <OpsPageHeader
        title="Dashboard"
        description={
          dash
            ? openAttention.length > 0
              ? `${attentionTotal} open · ${staleLabel}`
              : `All clear · ${staleLabel}`
            : undefined
        }
        actions={
          <>
            <div
              className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
              role="group"
              aria-label="Date range"
            >
              {RANGES.map((r) => {
                const active = range === r.days;
                return (
                  <button
                    key={r.days}
                    type="button"
                    className={opsChipClass(active)}
                    aria-pressed={active}
                    onClick={() => setRange(r.days)}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={`clay-btn-ghost min-h-10 px-3 text-xs ${autoRefresh ? 'text-[var(--primary)]' : 'ops-muted'}`}
              aria-pressed={autoRefresh}
              onClick={() => setAutoRefresh((v) => !v)}
            >
              {autoRefresh ? 'Auto 60s' : 'Auto off'}
            </button>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading}
              onClick={() => void load(range)}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${loading ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      {loading && !dash ? <DashboardSkeleton /> : null}

      {dash ? (
        <>
          <section className="clay-panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="font-display text-lg leading-tight">Needs attention</h2>
                {openAttention.length > 0 ? (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--warning)_18%,transparent)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--warning)]">
                    {openAttention.length}
                  </span>
                ) : (
                  <span className="rounded-full bg-[color-mix(in_srgb,var(--success)_16%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--success)]">
                    Clear
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {dash.aging.fulfillment > 0 ? (
                  <span className="text-[11px] font-medium text-[var(--warning)]">
                    {dash.aging.fulfillment} over {dash.aging.hours}h
                  </span>
                ) : null}
                <Link
                  href="/admin/commerce/settings"
                  className="ops-muted text-xs font-medium underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                >
                  Alert prefs
                </Link>
              </div>
            </div>

            {attention.length === 0 ? (
              <div className="gift-banner gift-banner--info m-3 sm:m-4" role="status">
                No alert types enabled.
              </div>
            ) : openAttention.length === 0 ? (
              <div className="gift-banner gift-banner--success m-3 sm:m-4" role="status">
                Nothing waiting — store is clear.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {openAttention.map((item) => (
                  <li key={item.id}>
                    <AlertRow item={item} slaHours={dash.aging.hours} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg">Business pulse</h2>
              {range !== 1 ? (
                <p className="ops-muted text-xs">
                  Today · {dash.kpis.ordersToday} orders · {formatInr(dash.kpis.todayRevenuePaise)}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2 sm:gap-3 lg:grid-cols-12">
              <Link
                href="/admin/commerce/reports"
                className="clay-panel group relative block overflow-hidden p-4 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_2%,var(--surface))] lg:col-span-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="ops-muted text-[11px] font-semibold uppercase tracking-wide">
                      {range === 1 ? 'Revenue today' : `Revenue · ${range}d`}
                    </p>
                    <p className="mt-2 break-words font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                      {formatInr(dash.kpis.revenuePaise)}
                    </p>
                    <DeltaBadge
                      current={dash.kpis.revenuePaise}
                      previous={dash.previous.revenuePaise}
                    />
                  </div>
                  <Sparkline values={dash.daily.map((d) => d.revenuePaise)} />
                </div>
              </Link>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:col-span-7 lg:grid-cols-3">
                <Kpi
                  label={range === 1 ? 'Orders today' : `Orders · ${range}d`}
                  value={String(dash.kpis.orderCount)}
                  href="/admin/commerce/orders"
                  icon={ShoppingBag}
                  delta={deltaLabel(dash.kpis.orderCount, dash.previous.orderCount)}
                  deltaTone={deltaTone(dash.kpis.orderCount, dash.previous.orderCount)}
                />
                <Kpi
                  label="AOV"
                  value={formatInr(dash.kpis.aovPaise)}
                  href="/admin/commerce/reports"
                  icon={Tag}
                  delta={deltaLabel(dash.kpis.aovPaise, dash.previous.aovPaise)}
                  deltaTone={deltaTone(dash.kpis.aovPaise, dash.previous.aovPaise)}
                />
                <Kpi
                  label="Open fulfillments"
                  value={String(dash.kpis.pendingFulfillment)}
                  href="/admin/commerce/orders?status=PAID,PROCESSING"
                  icon={Truck}
                  emphasize={dash.kpis.pendingFulfillment > 0}
                  hint={
                    dash.aging.fulfillment > 0
                      ? `${dash.aging.fulfillment} over ${dash.aging.hours}h`
                      : undefined
                  }
                />
              </div>
            </div>
          </section>

          {dash.alertPrefs.lowStock && dash.alerts.lowStock.length > 0 ? (
            <section className="clay-panel overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-3 sm:px-4">
                <h2 className="font-display text-lg">Low stock</h2>
                <Link
                  href="/admin/commerce/inventory?stock=low"
                  className="text-xs font-medium text-[var(--primary)] underline-offset-2 hover:underline"
                >
                  Inventory
                </Link>
              </div>
              <OpsTableScroll>
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <thead>
                    <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                      <th className="px-3 py-2.5 pr-3 sm:px-4">SKU</th>
                      <th className="py-2.5 pr-3">Product</th>
                      <th className="py-2.5 pr-3 sm:pr-4">Avail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dash.alerts.lowStock.slice(0, 8).map((row) => (
                      <tr
                        key={row.sku}
                        className="border-b border-[var(--border-subtle)] last:border-0"
                      >
                        <td className="px-3 py-2.5 pr-3 font-mono text-xs sm:px-4">{row.sku}</td>
                        <td className="py-2.5 pr-3">
                          <Link
                            className="font-medium underline-offset-2 hover:underline"
                            href={`/admin/commerce/products/${row.productId}`}
                          >
                            {row.productTitle}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-3 sm:pr-4">
                          <span className="rounded-md bg-[var(--warning-bg)] px-1.5 py-0.5 text-[var(--warning)] tabular-nums">
                            {row.available}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </OpsTableScroll>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 font-display text-lg">Quick actions</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {canFinance ? (
                <QuickAction
                  href="/admin/commerce/products/new"
                  label="New product"
                  icon={Plus}
                  primary
                />
              ) : null}
              {canFinance ? (
                <QuickAction href="/admin/commerce/coupons" label="Create coupon" icon={Tag} />
              ) : (
                <QuickAction href="/admin/commerce/coupons" label="Promotions" icon={Tag} />
              )}
              <QuickAction href="/admin/commerce/orders" label="Orders queue" icon={ShoppingBag} />
              <QuickAction
                href="/admin/commerce/merchandising"
                label="Merchandising"
                icon={LayoutGrid}
              />
            </div>
          </section>

          <section className="clay-panel overflow-hidden">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-3 sm:px-4">
              <h2 className="font-display text-lg">Recent activity</h2>
              <Link
                href="/admin/commerce/settings?tab=audit"
                className="text-xs font-medium text-[var(--primary)] underline-offset-2 hover:underline"
              >
                Audit log
              </Link>
            </div>
            {dash.recentAudit.length === 0 ? (
              <p className="ops-muted px-3 py-4 text-sm sm:px-4">No privileged actions yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)]">
                {dash.recentAudit.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2.5 text-sm sm:px-4"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-xs">{row.action}</p>
                      <p className="ops-muted mt-0.5 text-[11px]">
                        {row.actorEmail ?? 'system'}
                        {row.resource ? ` · ${row.resource}` : ''}
                      </p>
                    </div>
                    <time className="ops-muted shrink-0 text-[11px]" dateTime={row.createdAt}>
                      {relativeAge(row.createdAt)}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading dashboard">
      <div className="clay-panel h-40 animate-pulse bg-[color-mix(in_srgb,var(--foreground)_4%,var(--surface))]" />
      <div className="grid gap-2 sm:gap-3 lg:grid-cols-12">
        <div className="clay-panel h-28 animate-pulse lg:col-span-5" />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:col-span-7 lg:grid-cols-3">
          <div className="clay-panel h-24 animate-pulse" />
          <div className="clay-panel h-24 animate-pulse" />
          <div className="clay-panel h-24 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const w = 120;
  const h = 40;
  const pts = values
    .map((v, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden
      className="shrink-0 text-[var(--primary)] opacity-80"
    >
      <polyline fill="none" stroke="currentColor" strokeWidth="1.75" points={pts} />
    </svg>
  );
}

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  const label = deltaLabel(current, previous);
  const tone = deltaTone(current, previous);
  const toneClass =
    tone === 'up'
      ? 'text-[var(--success)]'
      : tone === 'down'
        ? 'text-[var(--danger)]'
        : 'ops-muted';
  return <p className={`mt-2 text-xs font-semibold tabular-nums ${toneClass}`}>{label} vs prior</p>;
}

function Kpi({
  label,
  value,
  href,
  icon: Icon,
  emphasize,
  delta,
  deltaTone: tone,
  hint,
}: {
  label: string;
  value: string;
  href?: string;
  icon?: LucideIcon;
  emphasize?: boolean;
  delta?: string;
  deltaTone?: 'up' | 'down' | 'flat';
  hint?: string;
}) {
  const deltaClass =
    tone === 'up'
      ? 'text-[var(--success)]'
      : tone === 'down'
        ? 'text-[var(--danger)]'
        : 'ops-muted';
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="ops-muted text-[10px] font-semibold uppercase tracking-wide sm:text-[11px]">
          {label}
        </p>
        {Icon ? <Icon className="ops-muted h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      </div>
      <p
        className={`mt-2 break-words text-lg font-semibold tabular-nums sm:text-xl ${
          emphasize ? 'text-[var(--warning)]' : ''
        }`}
      >
        {value}
      </p>
      {delta ? (
        <p className={`mt-1 text-[11px] font-semibold tabular-nums ${deltaClass}`}>
          {delta} vs prior
        </p>
      ) : null}
      {hint ? <p className="mt-1 text-[11px] text-[var(--warning)]">{hint}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="clay-panel block p-3 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_2%,var(--surface))] sm:p-3.5"
      >
        {inner}
      </Link>
    );
  }
  return <div className="clay-panel p-3 sm:p-3.5">{inner}</div>;
}

function AlertRow({ item, slaHours }: { item: AttentionItem; slaHours: number }) {
  const Icon = item.icon;
  const toneBar =
    item.tone === 'danger'
      ? 'bg-[var(--danger)]'
      : item.tone === 'warn'
        ? 'bg-[var(--warning)]'
        : 'bg-[var(--border-subtle)]';
  const countClass =
    item.tone === 'danger'
      ? 'text-[var(--danger)]'
      : item.tone === 'warn'
        ? 'text-[var(--warning)]'
        : 'ops-muted';

  return (
    <Link
      href={item.href}
      className="flex min-h-12 items-center gap-3 px-3 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_4%,transparent)] sm:px-4"
    >
      <span className={`h-8 w-1.5 shrink-0 rounded-full ${toneBar}`} aria-hidden />
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          item.tone === 'danger'
            ? 'bg-[var(--danger-bg)] text-[var(--danger)]'
            : item.tone === 'warn'
              ? 'bg-[var(--warning-bg)] text-[var(--warning)]'
              : 'bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[var(--muted-foreground)]'
        }`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-snug">{item.title}</span>
        {item.aging && item.aging > 0 ? (
          <span className="mt-0.5 block text-[11px] font-medium text-[var(--warning)]">
            {item.aging} over {slaHours}h
          </span>
        ) : null}
      </span>
      <span className={`text-xl font-semibold tabular-nums ${countClass}`}>{item.count}</span>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
  primary,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${
        primary ? 'clay-btn' : 'clay-btn-secondary'
      } flex min-h-12 flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center text-xs sm:min-h-14 sm:text-sm`}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
      {label}
    </Link>
  );
}
