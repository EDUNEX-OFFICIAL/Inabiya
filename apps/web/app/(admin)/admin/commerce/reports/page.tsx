'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Download,
  LayoutDashboard,
  Package,
  RefreshCw,
  TicketPercent,
} from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';
import {
  CouponsBarChart,
  FunnelBarChart,
  InventoryBarChart,
  ProductsBarChart,
  ReturnsStatusChart,
  SalesTrendChart,
} from '@/components/commerce-ops/reports-charts';

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

const REPORT_CHIPS: Array<{ id: ReportId; label: string }> = [
  { id: 'sales', label: 'Sales' },
  { id: 'products', label: 'Products' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'returns', label: 'Returns' },
  { id: 'coupons', label: 'Coupons' },
  { id: 'funnel', label: 'Funnel' },
];

const DAYS_OPTIONS = [1, 7, 14, 30] as const;
const REPORT_IDS = new Set<ReportId>(REPORT_CHIPS.map((c) => c.id));
const PRODUCT_TOP_OPTIONS = [5, 10, 20] as const;
const SALES_PAGE_SIZE = 10;
const RETURNS_PAGE_SIZE = 8;

type SalesMetric = 'revenue' | 'orders';
type ProductsSort = 'revenue' | 'units';

function parseReport(raw: string | null): ReportId {
  if (raw && REPORT_IDS.has(raw as ReportId)) return raw as ReportId;
  return 'sales';
}

function parseDays(raw: string | null): number {
  const n = Number(raw);
  if (DAYS_OPTIONS.includes(n as (typeof DAYS_OPTIONS)[number])) return n;
  return 7;
}

function parseSalesMetric(raw: string | null): SalesMetric {
  return raw === 'orders' ? 'orders' : 'revenue';
}

function parseProductsTop(raw: string | null): number {
  const n = Number(raw);
  if (PRODUCT_TOP_OPTIONS.includes(n as (typeof PRODUCT_TOP_OPTIONS)[number])) return n;
  return 10;
}

function parseProductsSort(raw: string | null): ProductsSort {
  return raw === 'units' ? 'units' : 'revenue';
}

function deltaLabel(current: number, previous: number): string {
  const d = current - previous;
  if (previous === 0) return d === 0 ? '±0' : 'new';
  const pct = Math.round((d * 100) / previous);
  const sign = d > 0 ? '+' : '';
  return `${sign}${pct}%`;
}

function deltaTone(current: number, previous: number): string {
  const d = current - previous;
  if (d > 0) return 'text-emerald-800';
  if (d < 0) return 'text-red-800';
  return 'text-[var(--muted-foreground)]';
}

function statusLabel(status: string): string {
  if (status === 'REQUESTED') return 'Requested';
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  if (status === 'RECEIVED') return 'Received';
  if (status === 'REFUNDED') return 'Refunded';
  return status;
}

function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (s === 'APPROVED' || s === 'REFUNDED' || s === 'RECEIVED') {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  }
  if (s === 'REJECTED') return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  if (s === 'REQUESTED') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
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

function EmptyPanel({ icon: Icon, message }: { icon: typeof Package; message: string }) {
  return (
    <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon className="h-8 w-8 opacity-30" aria-hidden />
      <p className="text-sm opacity-70">{message}</p>
    </div>
  );
}

function ReportPager({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (next: number) => void;
}) {
  if (total <= pageSize) return null;
  const from = page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
      <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
        {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
          disabled={page <= 0}
          aria-label="Previous page"
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
          Prev
        </button>
        <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-[var(--muted-foreground)]">
          {page + 1} / {pageCount}
        </span>
        <button
          type="button"
          className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
          disabled={page >= pageCount - 1}
          aria-label="Next page"
          onClick={() => onPage(page + 1)}
        >
          Next
          <ChevronRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function ReportsDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const days = parseDays(searchParams.get('days'));
  const active = parseReport(searchParams.get('report'));
  const salesMetric = parseSalesMetric(searchParams.get('metric'));
  const productsTop = parseProductsTop(searchParams.get('top'));
  const productsSort = parseProductsSort(searchParams.get('sort'));
  const couponsActiveOnly = searchParams.get('active') === '1';
  const returnsStatus = searchParams.get('rstatus') ?? '';

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesPage, setSalesPage] = useState(0);
  const [returnsPage, setReturnsPage] = useState(0);

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [products, setProducts] = useState<ProductsReport | null>(null);
  const [inventory, setInventory] = useState<InventoryReport | null>(null);
  const [returns, setReturns] = useState<ReturnsReport | null>(null);
  const [coupons, setCoupons] = useState<CouponsReport | null>(null);
  const [funnel, setFunnel] = useState<Funnel | null>(null);

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);
  /** Cache keyed by report (+ days when day-scoped). Avoids Promise.all of all 6 on every visit. */
  const cacheRef = useRef(new Map<string, unknown>());

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      // defaults omitted from URL for cleanliness
      if (params.get('report') === 'sales') params.delete('report');
      if (params.get('days') === '7') params.delete('days');
      if (params.get('metric') === 'revenue') params.delete('metric');
      if (params.get('top') === '10') params.delete('top');
      if (params.get('sort') === 'revenue') params.delete('sort');
      if (params.get('active') === '0') params.delete('active');
      if (!params.get('rstatus')) params.delete('rstatus');
      const s = params.toString();
      router.replace(s ? `/admin/commerce/reports?${s}` : '/admin/commerce/reports');
    },
    [router, searchParams],
  );

  const cacheKey = useCallback(
    (report: ReportId) => (report === 'inventory' ? 'inventory' : `${report}:${days}`),
    [days],
  );

  const load = useCallback(
    async (opts?: { force?: boolean }) => {
      const seq = ++loadSeq.current;
      setError(null);
      const key = cacheKey(active);
      const force = opts?.force === true;
      const hadCache = cacheRef.current.has(key);
      try {
        if (!force && hadCache) {
          if (!hasLoadedOnce.current) setLoading(true);
          else setRefreshing(true);
          const cached = cacheRef.current.get(key);
          if (seq !== loadSeq.current) return;
          if (active === 'sales') setSales(cached as SalesReport);
          else if (active === 'products') setProducts(cached as ProductsReport);
          else if (active === 'inventory') setInventory(cached as InventoryReport);
          else if (active === 'returns') setReturns(cached as ReturnsReport);
          else if (active === 'coupons') setCoupons(cached as CouponsReport);
          else setFunnel(cached as Funnel);
          hasLoadedOnce.current = true;
          return;
        }

        // Skeleton when first visit or switching to an uncached tab; soft refresh otherwise.
        if (!hasLoadedOnce.current || !hadCache) setLoading(true);
        else setRefreshing(true);

        let data: unknown;
        if (active === 'sales') {
          data = await apiAuth<SalesReport>(`/admin/commerce/reports/sales?days=${days}`);
          if (seq !== loadSeq.current) return;
          setSales(data as SalesReport);
        } else if (active === 'products') {
          data = await apiAuth<ProductsReport>(`/admin/commerce/reports/products?days=${days}`);
          if (seq !== loadSeq.current) return;
          setProducts(data as ProductsReport);
        } else if (active === 'inventory') {
          data = await apiAuth<InventoryReport>('/admin/commerce/reports/inventory');
          if (seq !== loadSeq.current) return;
          setInventory(data as InventoryReport);
        } else if (active === 'returns') {
          data = await apiAuth<ReturnsReport>(`/admin/commerce/reports/returns?days=${days}`);
          if (seq !== loadSeq.current) return;
          setReturns(data as ReturnsReport);
        } else if (active === 'coupons') {
          data = await apiAuth<CouponsReport>(`/admin/commerce/reports/coupons?days=${days}`);
          if (seq !== loadSeq.current) return;
          setCoupons(data as CouponsReport);
        } else {
          data = await apiAuth<Funnel>(`/admin/commerce/reports/funnel?days=${days}`);
          if (seq !== loadSeq.current) return;
          setFunnel(data as Funnel);
        }
        cacheRef.current.set(key, data);
        hasLoadedOnce.current = true;
      } catch (e) {
        if (seq !== loadSeq.current) return;
        setError(e instanceof Error ? e.message : 'Failed to load reports');
      } finally {
        if (seq === loadSeq.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [active, days, cacheKey],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/reports'));
      return;
    }
    void load();
  }, [router, load]);

  const productRows = useMemo(() => {
    if (!products) return [];
    const sorted = [...products.rows].sort((a, b) => {
      if (productsSort === 'units') return b.units - a.units || b.revenuePaise - a.revenuePaise;
      return b.revenuePaise - a.revenuePaise || b.units - a.units;
    });
    return sorted.slice(0, productsTop);
  }, [products, productsSort, productsTop]);

  const couponRows = useMemo(() => {
    if (!coupons) return [];
    const list = couponsActiveOnly ? coupons.rows.filter((c) => c.active) : coupons.rows;
    return [...list].sort((a, b) => b.windowDiscountPaise - a.windowDiscountPaise);
  }, [coupons, couponsActiveOnly]);

  const returnRows = useMemo(() => {
    if (!returns) return [];
    if (!returnsStatus) return returns.recent;
    return returns.recent.filter((r) => r.status === returnsStatus);
  }, [returns, returnsStatus]);

  // Newest first for daily desk list (API may already be ascending for the chart).
  const salesDailyNewestFirst = useMemo(() => {
    if (!sales) return [];
    return [...sales.daily].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [sales]);

  const salesPageCount = Math.max(1, Math.ceil(salesDailyNewestFirst.length / SALES_PAGE_SIZE));
  const salesPageSafe = Math.min(salesPage, salesPageCount - 1);
  const salesPageRows = useMemo(() => {
    const start = salesPageSafe * SALES_PAGE_SIZE;
    return salesDailyNewestFirst.slice(start, start + SALES_PAGE_SIZE);
  }, [salesDailyNewestFirst, salesPageSafe]);

  const returnsPageCount = Math.max(1, Math.ceil(returnRows.length / RETURNS_PAGE_SIZE));
  const returnsPageSafe = Math.min(returnsPage, returnsPageCount - 1);
  const returnsPageRows = useMemo(() => {
    const start = returnsPageSafe * RETURNS_PAGE_SIZE;
    return returnRows.slice(start, start + RETURNS_PAGE_SIZE);
  }, [returnRows, returnsPageSafe]);

  useEffect(() => {
    setSalesPage(0);
  }, [days, sales?.days]);

  useEffect(() => {
    setReturnsPage(0);
  }, [days, returnsStatus, returns?.days]);

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

  const windowLabel = `${days}d`;
  const contentBusy = refreshing && !loading;

  return (
    <div>
      <OpsPageHeader
        title="Reports"
        actions={
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin/commerce"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Dashboard
              </Link>
            </div>
            {active === 'sales' ? (
              <button
                type="button"
                className="clay-btn inline-flex min-h-10 items-center gap-1.5 text-sm disabled:opacity-50"
                disabled={!sales || loading}
                onClick={exportSalesCsv}
              >
                <Download className="h-3.5 w-3.5 opacity-80" aria-hidden />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
            ) : null}
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading || refreshing}
              onClick={() => void load({ force: true })}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${loading || refreshing ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
          role="tablist"
          aria-label="Report"
        >
          {REPORT_CHIPS.map((c) => {
            const selected = active === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={opsChipClass(selected)}
                onClick={() => patchQuery({ report: c.id })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-[var(--muted-foreground)] sm:inline-flex">
          {contentBusy ? (
            <RefreshCw className="h-3 w-3 animate-spin opacity-60" aria-hidden />
          ) : null}
          {windowLabel}
        </span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          className="-mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Window days"
        >
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={days === d}
              className={opsChipClass(days === d)}
              onClick={() => patchQuery({ days: String(d) })}
            >
              {d}d
            </button>
          ))}
        </div>

        {active === 'sales' ? (
          <div className="flex gap-1.5" role="group" aria-label="Sales metric">
            <button
              type="button"
              aria-pressed={salesMetric === 'revenue'}
              className={opsChipClass(salesMetric === 'revenue')}
              onClick={() => patchQuery({ metric: 'revenue' })}
            >
              Revenue
            </button>
            <button
              type="button"
              aria-pressed={salesMetric === 'orders'}
              className={opsChipClass(salesMetric === 'orders')}
              onClick={() => patchQuery({ metric: 'orders' })}
            >
              Orders
            </button>
          </div>
        ) : null}

        {active === 'products' ? (
          <>
            <div className="flex gap-1.5" role="group" aria-label="Top products">
              {PRODUCT_TOP_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={productsTop === n}
                  className={opsChipClass(productsTop === n)}
                  onClick={() => patchQuery({ top: String(n) })}
                >
                  Top {n}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5" role="group" aria-label="Product sort">
              <button
                type="button"
                aria-pressed={productsSort === 'revenue'}
                className={opsChipClass(productsSort === 'revenue')}
                onClick={() => patchQuery({ sort: 'revenue' })}
              >
                By revenue
              </button>
              <button
                type="button"
                aria-pressed={productsSort === 'units'}
                className={opsChipClass(productsSort === 'units')}
                onClick={() => patchQuery({ sort: 'units' })}
              >
                By units
              </button>
            </div>
          </>
        ) : null}

        {active === 'returns' && returns?.byStatus.length ? (
          <div className="flex gap-1.5 overflow-x-auto" role="group" aria-label="Return status">
            <button
              type="button"
              aria-pressed={!returnsStatus}
              className={opsChipClass(!returnsStatus)}
              onClick={() => patchQuery({ rstatus: null })}
            >
              All
            </button>
            {returns.byStatus.map((s) => (
              <button
                key={s.status}
                type="button"
                aria-pressed={returnsStatus === s.status}
                className={opsChipClass(returnsStatus === s.status)}
                onClick={() => patchQuery({ rstatus: s.status })}
              >
                {statusLabel(s.status)}
              </button>
            ))}
          </div>
        ) : null}

        {active === 'coupons' ? (
          <button
            type="button"
            aria-pressed={couponsActiveOnly}
            className={opsChipClass(couponsActiveOnly)}
            onClick={() => patchQuery({ active: couponsActiveOnly ? null : '1' })}
          >
            Active only
          </button>
        ) : null}
      </div>

      <p className="mb-2 text-xs tabular-nums text-[var(--muted-foreground)] sm:hidden">
        {contentBusy ? 'Refreshing… · ' : null}
        {windowLabel}
        {' · '}
        <Link
          href="/admin/commerce"
          className="font-medium underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Dashboard
        </Link>
      </p>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading reports">
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
              />
            ))}
          </div>
          <div className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      ) : null}

      {!loading ? (
        <div
          className={contentBusy ? 'opacity-70 transition-opacity' : undefined}
          aria-busy={contentBusy}
        >
          {active === 'sales' && sales ? (
            <section className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="clay-panel p-3 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Revenue
                  </p>
                  <p className="mt-1 font-display text-2xl tabular-nums">
                    {formatInr(sales.totals.revenuePaise)}
                  </p>
                  <p
                    className={`mt-1 text-xs ${deltaTone(sales.totals.revenuePaise, sales.previous.revenuePaise)}`}
                  >
                    {deltaLabel(sales.totals.revenuePaise, sales.previous.revenuePaise)} vs prev ·{' '}
                    {formatInr(sales.previous.revenuePaise)}
                  </p>
                </div>
                <div className="clay-panel p-3 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Orders
                  </p>
                  <p className="mt-1 text-2xl font-medium tabular-nums">
                    {sales.totals.orderCount}
                  </p>
                  <p
                    className={`mt-1 text-xs ${deltaTone(sales.totals.orderCount, sales.previous.orderCount)}`}
                  >
                    {deltaLabel(sales.totals.orderCount, sales.previous.orderCount)} vs prev
                  </p>
                </div>
                <div className="clay-panel p-3 sm:p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    AOV
                  </p>
                  <p className="mt-1 text-2xl font-medium tabular-nums">
                    {formatInr(sales.totals.aovPaise)}
                  </p>
                </div>
              </div>

              {sales.daily.length === 0 ? (
                <EmptyPanel icon={BarChart3} message="No sales in this window." />
              ) : (
                <>
                  <div className="clay-panel p-3 sm:p-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      {salesMetric === 'revenue' ? 'Revenue trend' : 'Orders trend'}
                    </p>
                    <SalesTrendChart daily={sales.daily} metric={salesMetric} />
                  </div>

                  <div className="md:hidden space-y-2">
                    {salesPageRows.map((r) => (
                      <div
                        key={r.date}
                        className="clay-panel flex items-center justify-between gap-3 p-2.5"
                      >
                        <div>
                          <p className="font-medium tabular-nums">{r.date}</p>
                          <p className="text-xs text-[var(--muted-foreground)]">
                            {r.orders} order{r.orders === 1 ? '' : 's'}
                          </p>
                        </div>
                        <p className="tabular-nums font-medium">{formatInr(r.revenuePaise)}</p>
                      </div>
                    ))}
                    <ReportPager
                      page={salesPageSafe}
                      pageCount={salesPageCount}
                      total={salesDailyNewestFirst.length}
                      pageSize={SALES_PAGE_SIZE}
                      onPage={setSalesPage}
                    />
                  </div>
                  <div className="hidden md:block space-y-2">
                    <OpsTableScroll>
                      <div className="clay-panel overflow-hidden">
                        <table className="w-full min-w-[20rem] border-collapse text-sm">
                          <thead>
                            <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                              <th className="px-3 py-2.5 font-medium">Date</th>
                              <th className="px-2 py-2.5 pr-4 font-medium">Orders</th>
                              <th className="px-2 py-2.5 pr-3 font-medium text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesPageRows.map((r) => (
                              <tr
                                key={r.date}
                                className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                              >
                                <td className="px-3 py-2.5 align-middle tabular-nums">{r.date}</td>
                                <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">
                                  {r.orders}
                                </td>
                                <td className="px-2 py-2.5 pr-3 align-middle text-right tabular-nums">
                                  {formatInr(r.revenuePaise)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </OpsTableScroll>
                    <ReportPager
                      page={salesPageSafe}
                      pageCount={salesPageCount}
                      total={salesDailyNewestFirst.length}
                      pageSize={SALES_PAGE_SIZE}
                      onPage={setSalesPage}
                    />
                  </div>
                </>
              )}
            </section>
          ) : null}

          {active === 'products' && products ? (
            productRows.length === 0 ? (
              <EmptyPanel icon={Package} message="No paid product lines in this window." />
            ) : (
              <section className="space-y-4">
                <div className="clay-panel p-3 sm:p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Top {productRows.length} by {productsSort}
                  </p>
                  <ProductsBarChart rows={productRows} />
                </div>
                <div className="md:hidden space-y-2">
                  {productRows.map((r) => (
                    <div key={r.sku} className="clay-panel p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 font-medium leading-snug">{r.title}</p>
                        <p className="shrink-0 tabular-nums font-medium">
                          {formatInr(r.revenuePaise)}
                        </p>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                        {r.sku}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-[var(--muted-foreground)]">
                        {r.units} units
                      </p>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block">
                  <OpsTableScroll>
                    <div className="clay-panel overflow-hidden">
                      <table className="w-full min-w-[28rem] border-collapse text-sm">
                        <thead>
                          <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                            <th className="px-3 py-2.5 font-medium">SKU</th>
                            <th className="px-2 py-2.5 pr-4 font-medium">Title</th>
                            <th className="px-2 py-2.5 pr-4 font-medium">Units</th>
                            <th className="px-2 py-2.5 pr-3 font-medium text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productRows.map((r) => (
                            <tr
                              key={r.sku}
                              className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                            >
                              <td className="px-3 py-2.5 align-middle font-mono text-xs">
                                {r.sku}
                              </td>
                              <td className="px-2 py-2.5 pr-4 align-middle">{r.title}</td>
                              <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">
                                {r.units}
                              </td>
                              <td className="px-2 py-2.5 pr-3 align-middle text-right tabular-nums">
                                {formatInr(r.revenuePaise)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </OpsTableScroll>
                </div>
              </section>
            )
          ) : null}

          {active === 'inventory' && inventory ? (
            <section className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="clay-panel p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Variants
                  </p>
                  <p className="mt-1 text-xl font-medium tabular-nums">
                    {inventory.summary.publishedVariants}
                  </p>
                </div>
                <div className="clay-panel p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Available
                  </p>
                  <p className="mt-1 text-xl font-medium tabular-nums">
                    {inventory.summary.availableUnits}
                  </p>
                </div>
                <div className="clay-panel p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Low stock
                  </p>
                  <p className="mt-1 text-xl font-medium tabular-nums text-amber-900">
                    {inventory.summary.lowStockCount}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                    ≤{inventory.threshold}
                  </p>
                </div>
                <div className="clay-panel flex flex-col justify-center p-3">
                  <Link
                    href="/admin/commerce/inventory?stock=low"
                    className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
                  >
                    <Package className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    Inventory desk
                  </Link>
                </div>
              </div>

              {inventory.lowStock.length === 0 ? (
                <EmptyPanel icon={Package} message="No low-stock SKUs." />
              ) : (
                <>
                  <div className="clay-panel p-3 sm:p-4">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Low stock available
                    </p>
                    <InventoryBarChart rows={inventory.lowStock} />
                  </div>
                  <div className="md:hidden space-y-2">
                    {inventory.lowStock.map((r) => (
                      <div key={r.sku} className="clay-panel p-2.5">
                        <p className="font-medium leading-snug">{r.productTitle}</p>
                        <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">
                          {r.sku}
                        </p>
                        <p className="mt-1 text-xs tabular-nums text-[var(--muted-foreground)]">
                          On hand {r.onHand} · Available{' '}
                          <span className="font-medium text-amber-900">{r.available}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block">
                    <OpsTableScroll>
                      <div className="clay-panel overflow-hidden">
                        <table className="w-full min-w-[28rem] border-collapse text-sm">
                          <thead>
                            <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                              <th className="px-3 py-2.5 font-medium">SKU</th>
                              <th className="px-2 py-2.5 pr-4 font-medium">Product</th>
                              <th className="px-2 py-2.5 pr-4 font-medium">On hand</th>
                              <th className="px-2 py-2.5 pr-3 font-medium text-right">Available</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inventory.lowStock.map((r) => (
                              <tr
                                key={r.sku}
                                className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                              >
                                <td className="px-3 py-2.5 align-middle font-mono text-xs">
                                  {r.sku}
                                </td>
                                <td className="px-2 py-2.5 pr-4 align-middle">{r.productTitle}</td>
                                <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">
                                  {r.onHand}
                                </td>
                                <td className="px-2 py-2.5 pr-3 align-middle text-right tabular-nums font-medium text-amber-900">
                                  {r.available}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </OpsTableScroll>
                  </div>
                </>
              )}
            </section>
          ) : null}

          {active === 'returns' && returns ? (
            <section className="space-y-4">
              {returns.byStatus.length > 0 ? (
                <div className="clay-panel grid gap-4 p-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:p-4">
                  <ReturnsStatusChart byStatus={returns.byStatus} />
                  <div className="flex flex-wrap content-start gap-1.5 self-center">
                    {returns.byStatus.map((s) => (
                      <span
                        key={s.status}
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(s.status)}`}
                      >
                        {statusLabel(s.status)}
                        <span className="tabular-nums opacity-80">{s.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {returnRows.length === 0 ? (
                <EmptyPanel icon={Package} message="No returns in this window." />
              ) : (
                <>
                  <div className="md:hidden space-y-2">
                    {returnsPageRows.map((r) => (
                      <div key={r.id} className="clay-panel p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/admin/commerce/orders/${r.orderId}`}
                            className="font-medium underline-offset-2 hover:underline"
                          >
                            {r.orderNumber}
                          </Link>
                          <span
                            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(r.status)}`}
                          >
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs tabular-nums text-[var(--muted-foreground)]">
                          {formatInr(r.orderTotalPaise)}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)] line-clamp-2">
                          {r.reason}
                        </p>
                      </div>
                    ))}
                    <ReportPager
                      page={returnsPageSafe}
                      pageCount={returnsPageCount}
                      total={returnRows.length}
                      pageSize={RETURNS_PAGE_SIZE}
                      onPage={setReturnsPage}
                    />
                  </div>
                  <div className="hidden md:block space-y-2">
                    <OpsTableScroll>
                      <div className="clay-panel overflow-hidden">
                        <table className="w-full min-w-[32rem] border-collapse text-sm">
                          <thead>
                            <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                              <th className="px-3 py-2.5 font-medium">Order</th>
                              <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                              <th className="px-2 py-2.5 pr-4 font-medium">Total</th>
                              <th className="px-2 py-2.5 pr-3 font-medium">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {returnsPageRows.map((r) => (
                              <tr
                                key={r.id}
                                className="border-b border-[var(--border-subtle)] align-top transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                              >
                                <td className="px-3 py-2.5">
                                  <Link
                                    href={`/admin/commerce/orders/${r.orderId}`}
                                    className="font-medium underline-offset-2 hover:underline"
                                  >
                                    {r.orderNumber}
                                  </Link>
                                </td>
                                <td className="px-2 py-2.5 pr-4">
                                  <span
                                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(r.status)}`}
                                  >
                                    {statusLabel(r.status)}
                                  </span>
                                </td>
                                <td className="px-2 py-2.5 pr-4 tabular-nums">
                                  {formatInr(r.orderTotalPaise)}
                                </td>
                                <td className="max-w-[14rem] px-2 py-2.5 pr-3 text-[var(--muted-foreground)]">
                                  {r.reason}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </OpsTableScroll>
                    <ReportPager
                      page={returnsPageSafe}
                      pageCount={returnsPageCount}
                      total={returnRows.length}
                      pageSize={RETURNS_PAGE_SIZE}
                      onPage={setReturnsPage}
                    />
                  </div>
                </>
              )}
            </section>
          ) : null}

          {active === 'coupons' && coupons ? (
            couponRows.length === 0 ? (
              <EmptyPanel icon={TicketPercent} message="No coupons in this window." />
            ) : (
              <section className="space-y-4">
                <div className="clay-panel p-3 sm:p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Window discount
                  </p>
                  <CouponsBarChart rows={couponRows} />
                </div>
                <div className="md:hidden space-y-2">
                  {couponRows.map((c) => (
                    <div key={c.code} className="clay-panel p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-mono text-sm font-medium">{c.code}</p>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                            c.active
                              ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                              : 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80'
                          }`}
                        >
                          {c.active ? 'Active' : 'Off'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-[var(--muted-foreground)]">
                        Lifetime {c.usedCount}
                        {c.maxUses != null ? ` / ${c.maxUses}` : ''} · Window {c.windowOrders} ·{' '}
                        {formatInr(c.windowDiscountPaise)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="hidden md:block">
                  <OpsTableScroll>
                    <div className="clay-panel overflow-hidden">
                      <table className="w-full min-w-[36rem] border-collapse text-sm">
                        <thead>
                          <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                            <th className="px-3 py-2.5 font-medium">Code</th>
                            <th className="px-2 py-2.5 pr-4 font-medium">Lifetime</th>
                            <th className="px-2 py-2.5 pr-4 font-medium">Window orders</th>
                            <th className="px-2 py-2.5 pr-4 font-medium">Window discount</th>
                            <th className="px-2 py-2.5 pr-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {couponRows.map((c) => (
                            <tr
                              key={c.code}
                              className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                            >
                              <td className="px-3 py-2.5 align-middle font-mono text-xs">
                                {c.code}
                              </td>
                              <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">
                                {c.usedCount}
                                {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                              </td>
                              <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">
                                {c.windowOrders}
                              </td>
                              <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">
                                {formatInr(c.windowDiscountPaise)}
                              </td>
                              <td className="px-2 py-2.5 pr-3 align-middle">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    c.active
                                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
                                      : 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80'
                                  }`}
                                >
                                  {c.active ? 'Active' : 'Off'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </OpsTableScroll>
                </div>
              </section>
            )
          ) : null}

          {active === 'funnel' && funnel ? (
            funnel.events.length === 0 ? (
              <EmptyPanel icon={BarChart3} message="No funnel events in this window." />
            ) : (
              <section className="space-y-4">
                <div className="clay-panel p-3 sm:p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                    Events
                  </p>
                  <FunnelBarChart events={funnel.events} />
                </div>
                <div className="clay-panel overflow-hidden">
                  <ul className="divide-y divide-[var(--border-subtle)]">
                    {funnel.events.map((e) => (
                      <li
                        key={e.name}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm sm:px-4"
                      >
                        <span className="min-w-0 break-words">{e.name}</span>
                        <span className="shrink-0 tabular-nums font-medium">{e.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading reports">
          <div className="h-6 w-32 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-9 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
              />
            ))}
          </div>
        </div>
      }
    >
      <ReportsDeskInner />
    </Suspense>
  );
}
