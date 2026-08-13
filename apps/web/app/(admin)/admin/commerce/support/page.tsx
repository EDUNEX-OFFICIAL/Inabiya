'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gift, LifeBuoy, Package, RefreshCw, Search, ShoppingBag, Users, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
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
  products?: Array<{
    id: string;
    slug: string;
    title: string;
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

function statusTone(status: string): string {
  const s = status.toUpperCase();
  if (s === 'DELIVERED' || s === 'CAPTURED' || s === 'ACTIVE') {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  }
  if (s === 'CANCELLED' || s === 'PAYMENT_FAILED' || s === 'SUSPENDED') {
    return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  }
  if (s === 'PROCESSING' || s === 'PAID' || s === 'SHIPPED' || s === 'NEW') {
    return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  }
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function typeLabel(type: string): string {
  if (type === 'corporate') return 'Corporate';
  if (type === 'bulk') return 'Bulk';
  return type;
}

function SupportLookupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';
  const [q, setQ] = useState(urlQ);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [recentInquiries, setRecentInquiries] = useState<Inquiry[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [lookingUp, setLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lookupSeq = useRef(0);
  const autoRan = useRef('');

  const loadRecent = useCallback(async () => {
    setLoadingRecent(true);
    try {
      const rows = await apiAuth<Inquiry[]>('/admin/commerce/gifting-inquiries');
      setRecentInquiries(rows.slice(0, 5));
    } catch {
      setRecentInquiries([]);
    } finally {
      setLoadingRecent(false);
    }
  }, []);

  const runLookup = useCallback(
    async (needleRaw: string) => {
      if (!getStoredAccessToken()) {
        router.replace(loginUrl('/admin/commerce/support'));
        return;
      }
      const needle = needleRaw.trim();
      if (!needle) return;
      const seq = ++lookupSeq.current;
      setLookingUp(true);
      setError(null);
      try {
        const data = await apiAuth<SearchResult>(
          `/admin/commerce/search?q=${encodeURIComponent(needle)}`,
        );
        if (seq !== lookupSeq.current) return;
        setResult(data);
      } catch (err) {
        if (seq !== lookupSeq.current) return;
        setError(err instanceof Error ? err.message : 'Lookup failed');
        setResult(null);
      } finally {
        if (seq === lookupSeq.current) setLookingUp(false);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/support'));
      return;
    }
    void loadRecent();
  }, [router, loadRecent]);

  useEffect(() => {
    setQ(urlQ);
    const trimmed = urlQ.trim();
    if (!trimmed || autoRan.current === trimmed) return;
    autoRan.current = trimmed;
    void runLookup(trimmed);
  }, [urlQ, runLookup]);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    const params = new URLSearchParams();
    params.set('q', trimmed);
    router.replace(`/admin/commerce/support?${params}`);
    autoRan.current = trimmed;
    await runLookup(trimmed);
  }

  const hasHits =
    result &&
    (result.orders.length > 0 ||
      result.customers.length > 0 ||
      (result.products?.length ?? 0) > 0 ||
      (result.inquiries?.length ?? 0) > 0);

  return (
    <div>
      <OpsPageHeader
        title="Support"
        actions={
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin/commerce/customers"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <Users className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Customers
              </Link>
              <Link
                href="/admin/commerce/gifting-inquiries"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                Inquiries
              </Link>
              <Link
                href="/admin/commerce/returns"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                Returns
              </Link>
            </div>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loadingRecent || lookingUp}
              onClick={() => {
                if (result && q.trim()) {
                  void runLookup(q);
                  return;
                }
                setResult(null);
                void loadRecent();
              }}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${loadingRecent || lookingUp ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
          </>
        }
      />

      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 sm:hidden">
        <Link
          href="/admin/commerce/customers"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          <Users className="h-3 w-3 opacity-70" aria-hidden />
          Customers
        </Link>
        <Link
          href="/admin/commerce/gifting-inquiries"
          className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Inquiries
        </Link>
        <Link
          href="/admin/commerce/returns"
          className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          Returns
        </Link>
      </div>

      <form className="mb-3 w-full max-w-xl" role="search" onSubmit={(e) => void lookup(e)}>
        <div className="flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            id="support-q"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Order #, email, phone, or product"
            aria-label="Order number, email, phone, or product"
            autoComplete="off"
            enterKeyHint="search"
            required
          />
          {q ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--primary)] opacity-70 hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:opacity-100"
              aria-label="Clear search"
              onClick={() => {
                setQ('');
                setResult(null);
                setError(null);
                autoRan.current = '';
                router.replace('/admin/commerce/support');
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
          <button
            type="submit"
            className="clay-btn min-h-8 shrink-0 px-3 text-sm"
            disabled={lookingUp}
          >
            {lookingUp ? '…' : 'Lookup'}
          </button>
        </div>
      </form>

      {error ? (
        <div className="gift-banner gift-banner--danger mb-3" role="alert">
          {error}
        </div>
      ) : null}

      {lookingUp ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Looking up">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!lookingUp && result && !hasHits ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <LifeBuoy className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">No matches for this lookup.</p>
        </div>
      ) : null}

      {!lookingUp && result && hasHits ? (
        <div className="space-y-4">
          {result.orders.length > 0 ? (
            <section className="clay-panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 sm:px-4">
                <ShoppingBag className="h-3.5 w-3.5 opacity-50" aria-hidden />
                <h2 className="text-sm font-medium">Orders</h2>
                <span className="text-xs opacity-50">{result.orders.length}</span>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {result.orders.map((o) => (
                  <li key={o.id} className="px-3 py-2.5 sm:px-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/commerce/orders/${o.id}`}
                          className="font-mono text-sm font-medium underline-offset-2 hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {o.customerEmail}
                          {o.phone ? ` · ${o.phone}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(o.status)}`}
                        >
                          {o.status}
                        </span>
                        <span className="tabular-nums text-xs">{formatInr(o.totalPaise)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {result.customers.length > 0 ? (
            <section className="clay-panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 sm:px-4">
                <Users className="h-3.5 w-3.5 opacity-50" aria-hidden />
                <h2 className="text-sm font-medium">Customers</h2>
                <span className="text-xs opacity-50">{result.customers.length}</span>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {result.customers.map((c) => (
                  <li key={c.id} className="px-3 py-2.5 sm:px-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/commerce/customers/${c.id}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {c.email}
                        </Link>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {c.displayName ?? '—'}
                          {c.phone ? ` · ${c.phone}` : ''}
                        </p>
                      </div>
                      {c.isActive === false ? (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusTone('SUSPENDED')}`}
                        >
                          Suspended
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(result.products?.length ?? 0) > 0 ? (
            <section className="clay-panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 sm:px-4">
                <Package className="h-3.5 w-3.5 opacity-50" aria-hidden />
                <h2 className="text-sm font-medium">Products</h2>
                <span className="text-xs opacity-50">{result.products!.length}</span>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {result.products!.map((p) => (
                  <li key={p.id} className="px-3 py-2.5 sm:px-4">
                    <Link
                      href={`/admin/commerce/products/${p.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-foreground)]">
                      {p.slug}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {(result.inquiries?.length ?? 0) > 0 ? (
            <section className="clay-panel overflow-hidden">
              <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] px-3 py-2.5 sm:px-4">
                <Gift className="h-3.5 w-3.5 opacity-50" aria-hidden />
                <h2 className="text-sm font-medium">Inquiries</h2>
                <span className="text-xs opacity-50">{result.inquiries!.length}</span>
              </div>
              <ul className="divide-y divide-[var(--border-subtle)]">
                {result.inquiries!.map((inq) => (
                  <li key={inq.id} className="px-3 py-2.5 sm:px-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/commerce/gifting-inquiries?q=${encodeURIComponent(inq.email)}`}
                          className="font-medium underline-offset-2 hover:underline"
                        >
                          {inq.fullName}
                        </Link>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {typeLabel(inq.type)} · {inq.email}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusTone(inq.status)}`}
                      >
                        {inq.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      ) : null}

      {!result && !lookingUp ? (
        <section className="clay-panel overflow-hidden">
          <div className="border-b border-[var(--border-subtle)] px-3 py-2.5 sm:px-4">
            <h2 className="text-sm font-medium">Recent inquiries</h2>
          </div>
          {loadingRecent ? (
            <div className="space-y-2 p-4" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                />
              ))}
            </div>
          ) : recentInquiries.length === 0 ? (
            <p className="ops-muted px-3 py-6 text-sm sm:px-4">No recent inquiries.</p>
          ) : (
            <ul className="divide-y divide-[var(--border-subtle)]">
              {recentInquiries.map((inq) => (
                <li
                  key={inq.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4"
                >
                  <div className="min-w-0">
                    <Link
                      href="/admin/commerce/gifting-inquiries"
                      className="text-sm font-medium underline-offset-2 hover:underline"
                    >
                      {inq.fullName}
                    </Link>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {typeLabel(inq.type)} · {inq.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${statusTone(inq.status)}`}
                    >
                      {inq.status}
                    </span>
                    <time className="text-[11px] opacity-50" dateTime={inq.createdAt}>
                      {formatWhen(inq.createdAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export default function SupportLookupPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true">
          <div className="h-8 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-32 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <SupportLookupInner />
    </Suspense>
  );
}
