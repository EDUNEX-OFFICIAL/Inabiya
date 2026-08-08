'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LifeBuoy, RefreshCw, Search, Users, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type CustomerRow = {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  orderCount: number;
  ltvPaise: number;
  phone: string | null;
  segments: string[];
  createdAt: string;
};

type StatusFilter = '' | 'active' | 'suspended';

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'active' || raw === 'suspended') return raw;
  return '';
}


function accountTone(isActive: boolean): string {
  return isActive
    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
    : 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
}

function CustomersDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const status = parseStatus(searchParams.get('status'));

  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);

  const filterActive = Boolean(qParam || status);

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      const s = params.toString();
      router.replace(s ? `/admin/commerce/customers?${s}` : '/admin/commerce/customers');
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      if (status) params.set('status', status);
      const qs = params.toString();
      const data = await apiAuth<CustomerRow[]>(
        `/admin/commerce/customers${qs ? `?${qs}` : ''}`,
      );
      if (seq !== loadSeq.current) return;
      setRows(data);
      hasLoadedOnce.current = true;
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [qParam, status]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/customers'));
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    setQInput(qParam);
  }, [qParam]);

  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === qParam) return;
    const t = window.setTimeout(() => {
      patchQuery({ q: trimmed || null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [qInput, qParam, patchQuery]);

  function clearFilters() {
    setQInput('');
    router.replace('/admin/commerce/customers');
  }

  const countLabel = loading ? 'Loading…' : `${rows.length} customers`;

  return (
    <div>
      <OpsPageHeader
        title="Customers"
        actions={
          <>
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin/commerce/support"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <LifeBuoy className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Support
              </Link>
            </div>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading || refreshing}
              onClick={() => void load()}
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

      <form
        className="mb-3 w-full max-w-xl"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          patchQuery({ q: qInput.trim() || null });
        }}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search email, name, phone, order #"
            aria-label="Search customers"
            autoComplete="off"
            enterKeyHint="search"
          />
          {qInput ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--primary)] opacity-70 hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:opacity-100"
              aria-label="Clear search"
              onClick={() => {
                setQInput('');
                patchQuery({ q: null });
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div
          className="-mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2"
          role="group"
          aria-label="Filter by status"
        >
          {STATUS_CHIPS.map((c) => {
            const active = status === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => patchQuery({ status: c.value || null })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-[var(--muted-foreground)] sm:inline-flex">
          {refreshing && !loading ? (
            <RefreshCw className="h-3 w-3 animate-spin opacity-60" aria-hidden />
          ) : null}
          {countLabel}
        </span>

        {filterActive ? (
          <button
            type="button"
            className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            onClick={clearFilters}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="mb-2 flex items-center justify-between gap-2 sm:hidden">
        <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
          {refreshing && !loading ? 'Refreshing… · ' : null}
          {countLabel}
        </p>
        <Link
          href="/admin/commerce/support"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
        >
          <LifeBuoy className="h-3 w-3 opacity-70" aria-hidden />
          Support
        </Link>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading customers">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && rows.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Users className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No customers match this filter.' : 'No customers yet.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className={refreshing ? 'opacity-70 transition-opacity' : undefined} aria-busy={refreshing}>
          <div className="md:hidden">
            <ul className="space-y-2">
              {rows.map((c) => (
                <li key={c.id} className="clay-panel p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/commerce/customers/${c.id}`}
                        className="font-medium leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                      >
                        {c.email}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {c.displayName ? `${c.displayName} · ` : ''}
                        {c.phone ?? 'No phone'}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${accountTone(c.isActive)}`}
                    >
                      {c.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                    <span className="tabular-nums">
                      Orders ·{' '}
                      <span className="font-medium text-[var(--foreground)]">{c.orderCount}</span>
                    </span>
                    <span className="tabular-nums">
                      LTV ·{' '}
                      <span className="font-medium text-[var(--foreground)]">
                        {formatInr(c.ltvPaise)}
                      </span>
                    </span>
                  </div>
                  {c.segments.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.segments.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[40rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 font-medium">Customer</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Orders</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">LTV</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Segments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-middle">
                          <Link
                            href={`/admin/commerce/customers/${c.id}`}
                            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                          >
                            {c.email}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {c.displayName ? `${c.displayName} · ` : ''}
                            {c.phone ?? 'No phone'}
                          </p>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${accountTone(c.isActive)}`}
                          >
                            {c.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-middle tabular-nums">{c.orderCount}</td>
                        <td className="whitespace-nowrap px-2 py-2.5 pr-4 align-middle tabular-nums">
                          {formatInr(c.ltvPaise)}
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-middle">
                          <div className="flex flex-wrap gap-1">
                            {c.segments.length ? (
                              c.segments.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200/80"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-[var(--muted-foreground)]">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </OpsTableScroll>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading customers">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <CustomersDeskInner />
    </Suspense>
  );
}
