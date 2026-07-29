'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type ReportId = 'sales' | 'products' | 'inventory' | 'returns' | 'coupons' | 'funnel';

type SalesReport = {
  days: number;
  totals: { orderCount: number; revenuePaise: number; aovPaise: number };
  previous: { orderCount: number; revenuePaise: number; aovPaise: number };
  daily: Array<{ date: string; orders: number; revenuePaise: number }>;
};

type ProductsReport = {
  days: number;
  rows: Array<{ sku: string; title: string; units: number; revenuePaise: number }>;
};

type InventoryReport = {
  threshold: number;
  summary: {
    publishedVariants: number;
    lowStockCount: number;
    onHandUnits: number;
    reservedUnits: number;
    availableUnits: number;
  };
  lowStock: Array<{
    sku: string;
    productTitle: string;
    onHand: number;
    reserved: number;
    available: number;
  }>;
};

type ReturnsReport = {
  days: number;
  byStatus: Array<{ status: string; count: number }>;
  recent: Array<{
    id: string;
    status: string;
    reason: string;
    orderId: string;
    orderNumber: string;
    orderTotalPaise: number;
    createdAt: string;
  }>;
};

type CouponsReport = {
  days: number;
  rows: Array<{
    code: string;
    active: boolean;
    usedCount: number;
    maxUses: number | null;
    windowOrders: number;
    windowDiscountPaise: number;
    windowRevenuePaise: number;
    discountPercent: number | null;
    discountPaise: number | null;
  }>;
};

type Funnel = { days: number; events: Array<{ name: string; count: number }> };

const GALLERY: Array<{ id: ReportId; title: string; blurb: string }> = [
  { id: 'sales', title: 'Sales', blurb: 'Daily revenue & AOV' },
  { id: 'products', title: 'Products', blurb: 'Top SKUs by revenue' },
  { id: 'inventory', title: 'Inventory', blurb: 'Stock & low SKUs' },
  { id: 'returns', title: 'Returns', blurb: 'Status & recent' },
  { id: 'coupons', title: 'Coupons', blurb: 'Usage in window' },
  { id: 'funnel', title: 'Funnel', blurb: 'Storefront events' },
];

function deltaLabel(current: number, previous: number): string {
  const d = current - previous;
  if (previous === 0) return d === 0 ? '±0' : 'new';
  const pct = Math.round((d * 100) / previous);
  const sign = d > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number>>) {
  const escape = (v: string | number) => {
    const s = String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = [header.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join(
    '\n',
  );
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const w = 160;
  const h = 36;
  const pts = values
    .map((v, i) => {
      const x = values.length <= 1 ? 0 : (i / (values.length - 1)) * w;
      const y = h - (v / max) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="opacity-80">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} />
    </svg>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [days, setDays] = useState(7);
  const [active, setActive] = useState<ReportId>('sales');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [products, setProducts] = useState<ProductsReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [returns, setReturns] = useState<ReturnsReport | null>(null);
  const [coupons, setCoupons] = useState<CouponsReport | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, inv, ret, c, f] = await Promise.all([
        apiAuth<SalesReport>(`/admin/commerce/reports/sales?days=${days}`),
        apiAuth<ProductsReport>(`/admin/commerce/reports/products?days=${days}`),
        apiAuth<InventoryReport>('/admin/commerce/reports/inventory'),
        apiAuth<ReturnsReport>(`/admin/commerce/reports/returns?days=${days}`),
        apiAuth<CouponsReport>(`/admin/commerce/reports/coupons?days=${days}`),
        apiAuth<Funnel>(`/admin/commerce/reports/funnel?days=${days}`),
      ]);
      setSales(s);
      setProducts(p);
      setInventory(inv);
      setReturns(ret);
      setCoupons(c);
      setFunnel(f);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/reports');
      return;
    }
    void load();
  }, [router, load]);

  const sparkValues = useMemo(
    () => sales?.daily.map((d) => d.revenuePaise) ?? [],
    [sales],
  );

  function exportSalesCsv() {
    if (!sales) return;
    downloadCsv(
      `inabiya-sales-${days}d.csv`,
      ['date', 'orders', 'revenue_paise', 'revenue_inr_display'],
      [
        ...sales.daily.map((r) => [
          r.date,
          r.orders,
          r.revenuePaise,
          (r.revenuePaise / 100).toFixed(2),
        ]),
        ['TOTAL', sales.totals.orderCount, sales.totals.revenuePaise, ''],
      ],
    );
  }

  return (
    <div>
      <OpsPageHeader
        title="Reports"
        description="Stand-up finance view — money stays integer paise in APIs."
        actions={
          <>
            <Link href="/admin/commerce" className="clay-btn-secondary text-sm">
              Dashboard
            </Link>
            {active === 'sales' ? (
              <button type="button" className="clay-btn text-sm" onClick={exportSalesCsv}>
                Export sales CSV
              </button>
            ) : null}
          </>
        }
      />

      <label className="mb-4 block text-xs sm:max-w-[10rem]">
        Window (days)
        <select
          className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          {[1, 7, 14, 30].map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>

      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActive(g.id)}
            className={`rounded border p-3 text-left text-sm transition ${
              active === g.id
                ? 'border-[color:var(--gift-ink)] bg-[color:var(--gift-cream)]/60'
                : 'border-[color:var(--gift-line)]'
            }`}
          >
            <p className="font-medium">{g.title}</p>
            <p className="mt-1 text-xs opacity-70">{g.blurb}</p>
          </button>
        ))}
      </div>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm opacity-70">Loading…</p> : null}

      {!loading && active === 'sales' && sales ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">Revenue</p>
              <p className="font-display text-2xl">{formatInr(sales.totals.revenuePaise)}</p>
              <p className="text-xs opacity-70">
                vs prev {deltaLabel(sales.totals.revenuePaise, sales.previous.revenuePaise)} ·{' '}
                {formatInr(sales.previous.revenuePaise)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">Orders</p>
              <p className="text-xl font-medium">{sales.totals.orderCount}</p>
              <p className="text-xs opacity-70">
                vs prev {deltaLabel(sales.totals.orderCount, sales.previous.orderCount)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-70">AOV</p>
              <p className="text-xl font-medium">{formatInr(sales.totals.aovPaise)}</p>
            </div>
            {sparkValues.length > 0 ? (
              <div className="ml-auto text-[color:var(--gift-ink)]">
                <Sparkline values={sparkValues} />
              </div>
            ) : null}
          </div>

          <OpsTableScroll>
            <table className="w-full min-w-[20rem] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Orders</th>
                  <th className="py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.daily.map((r) => (
                  <tr key={r.date} className="border-b">
                    <td className="py-1.5 pr-3">{r.date}</td>
                    <td className="py-1.5 pr-3">{r.orders}</td>
                    <td className="py-1.5">{formatInr(r.revenuePaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OpsTableScroll>
        </section>
      ) : null}

      {!loading && active === 'products' && products ? (
        <OpsTableScroll>
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                <th className="py-2 pr-3">SKU</th>
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Units</th>
                <th className="py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 opacity-70">
                    No paid product lines in this window.
                  </td>
                </tr>
              ) : (
                products.rows.map((r) => (
                  <tr key={r.sku} className="border-b">
                    <td className="py-1.5 pr-3 font-mono text-xs">{r.sku}</td>
                    <td className="py-1.5 pr-3">{r.title}</td>
                    <td className="py-1.5 pr-3">{r.units}</td>
                    <td className="py-1.5">{formatInr(r.revenuePaise)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </OpsTableScroll>
      ) : null}

      {!loading && active === 'inventory' && inventory ? (
        <section className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-4">
            <p>
              Variants <strong>{inventory.summary.publishedVariants}</strong>
            </p>
            <p>
              Available <strong>{inventory.summary.availableUnits}</strong>
            </p>
            <p>
              Low stock (≤{inventory.threshold}){' '}
              <strong>{inventory.summary.lowStockCount}</strong>
            </p>
            <Link href="/admin/commerce/inventory?lowStock=1" className="underline">
              Open inventory desk
            </Link>
          </div>
          <OpsTableScroll>
            <table className="w-full min-w-[28rem] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                  <th className="py-2 pr-3">SKU</th>
                  <th className="py-2 pr-3">Product</th>
                  <th className="py-2 pr-3">On hand</th>
                  <th className="py-2">Available</th>
                </tr>
              </thead>
              <tbody>
                {inventory.lowStock.map((r) => (
                  <tr key={r.sku} className="border-b">
                    <td className="py-1.5 pr-3 font-mono text-xs">{r.sku}</td>
                    <td className="py-1.5 pr-3">{r.productTitle}</td>
                    <td className="py-1.5 pr-3">{r.onHand}</td>
                    <td className="py-1.5">{r.available}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </OpsTableScroll>
        </section>
      ) : null}

      {!loading && active === 'returns' && returns ? (
        <section className="space-y-4 text-sm">
          <ul className="flex flex-wrap gap-3">
            {returns.byStatus.map((s) => (
              <li key={s.status} className="rounded border px-2 py-1">
                {s.status}: {s.count}
              </li>
            ))}
          </ul>
          <OpsTableScroll>
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                  <th className="py-2 pr-3">Order</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2">Reason</th>
                </tr>
              </thead>
              <tbody>
                {returns.recent.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 opacity-70">
                      No returns in this window.
                    </td>
                  </tr>
                ) : (
                  returns.recent.map((r) => (
                    <tr key={r.id} className="border-b align-top">
                      <td className="py-1.5 pr-3">
                        <Link href={`/admin/commerce/orders/${r.orderId}`} className="underline">
                          {r.orderNumber}
                        </Link>
                      </td>
                      <td className="py-1.5 pr-3">{r.status}</td>
                      <td className="py-1.5 pr-3">{formatInr(r.orderTotalPaise)}</td>
                      <td className="py-1.5">{r.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </OpsTableScroll>
        </section>
      ) : null}

      {!loading && active === 'coupons' && coupons ? (
        <OpsTableScroll>
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                <th className="py-2 pr-3">Code</th>
                <th className="py-2 pr-3">Lifetime uses</th>
                <th className="py-2 pr-3">Window orders</th>
                <th className="py-2 pr-3">Window discount</th>
                <th className="py-2">Active</th>
              </tr>
            </thead>
            <tbody>
              {coupons.rows.map((c) => (
                <tr key={c.code} className="border-b">
                  <td className="py-1.5 pr-3 font-mono text-xs">{c.code}</td>
                  <td className="py-1.5 pr-3">
                    {c.usedCount}
                    {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="py-1.5 pr-3">{c.windowOrders}</td>
                  <td className="py-1.5 pr-3">{formatInr(c.windowDiscountPaise)}</td>
                  <td className="py-1.5">{c.active ? 'yes' : 'no'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsTableScroll>
      ) : null}

      {!loading && active === 'funnel' && funnel ? (
        <ul className="space-y-2 text-sm">
          {funnel.events.map((e) => (
            <li key={e.name} className="flex justify-between border-b py-2">
              <span>{e.name}</span>
              <span className="font-medium">{e.count}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
