'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Gift, LifeBuoy, RefreshCw, Search, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type Inquiry = {
  id: string;
  type: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  estimatedQty: number | null;
  status: string;
  createdAt: string;
};

type TypeFilter = '' | 'corporate' | 'bulk';
type StatusFilter = '' | 'NEW';

const TYPE_CHIPS: Array<{ value: TypeFilter; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'bulk', label: 'Bulk' },
];

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All status' },
  { value: 'NEW', label: 'New' },
];

function parseType(raw: string | null): TypeFilter {
  if (raw === 'corporate' || raw === 'bulk') return raw;
  return '';
}

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'NEW') return raw;
  return '';
}


function typeLabel(type: string): string {
  if (type === 'corporate') return 'Corporate';
  if (type === 'bulk') return 'Bulk';
  return type;
}

function statusTone(status: string): string {
  if (status === 'NEW') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function InquiriesDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const type = parseType(searchParams.get('type'));
  const status = parseStatus(searchParams.get('status'));

  const [rows, setRows] = useState<Inquiry[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);

  const filterActive = Boolean(qParam || type || status);

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      const s = params.toString();
      router.replace(s ? `/admin/commerce/gifting-inquiries?${s}` : '/admin/commerce/gifting-inquiries');
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await apiAuth<Inquiry[]>('/admin/commerce/gifting-inquiries');
      if (seq !== loadSeq.current) return;
      setRows(data);
      hasLoadedOnce.current = true;
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load inquiries');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/gifting-inquiries'));
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

  const displayed = useMemo(() => {
    const needle = qParam.trim().toLowerCase();
    return rows.filter((r) => {
      if (type && r.type !== type) return false;
      if (status && r.status !== status) return false;
      if (!needle) return true;
      const hay = [
        r.fullName,
        r.email,
        r.phone ?? '',
        r.company ?? '',
        r.message,
        r.type,
        r.status,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, qParam, type, status]);

  function clearFilters() {
    setQInput('');
    router.replace('/admin/commerce/gifting-inquiries');
  }

  const countLabel = loading ? 'Loading…' : `${displayed.length} inquiries`;

  return (
    <div>
      <OpsPageHeader
        title="Gifting inquiries"
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
            placeholder="Search name, email, company, message"
            aria-label="Search inquiries"
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
          aria-label="Filter inquiries"
        >
          {TYPE_CHIPS.map((c) => {
            const active = type === c.value;
            return (
              <button
                key={c.value || 'all-type'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => patchQuery({ type: c.value || null })}
              >
                {c.label}
              </button>
            );
          })}
          {STATUS_CHIPS.filter((c) => c.value).map((c) => {
            const active = status === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => patchQuery({ status: active ? null : c.value })}
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
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading inquiries">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && displayed.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Gift className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No inquiries match this filter.' : 'No inquiries yet.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && displayed.length > 0 ? (
        <div className={refreshing ? 'opacity-70 transition-opacity' : undefined} aria-busy={refreshing}>
          <div className="md:hidden">
            <ul className="space-y-2">
              {displayed.map((r) => {
                const open = expanded[r.id];
                return (
                  <li key={r.id} className="clay-panel p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{r.fullName}</p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {typeLabel(r.type)} · {r.email}
                          {r.phone ? ` · ${r.phone}` : ''}
                        </p>
                      </div>
                      <span
                        className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                      {r.company ?? '—'} · qty {r.estimatedQty ?? '—'} · {formatWhen(r.createdAt)}
                    </p>
                    <p className={`mt-2 text-sm text-[var(--muted-foreground)] ${open ? '' : 'line-clamp-3'}`}>
                      {r.message}
                    </p>
                    {r.message.length > 120 ? (
                      <button
                        type="button"
                        className="mt-1 text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                        onClick={() => setExpanded((prev) => ({ ...prev, [r.id]: !open }))}
                      >
                        {open ? 'Less' : 'More'}
                      </button>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2">
                      <Link
                        href={`/admin/commerce/customers?q=${encodeURIComponent(r.email)}`}
                        className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                      >
                        Find customer
                      </Link>
                      <Link
                        href="/admin/commerce/support"
                        className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
                      >
                        Support
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[52rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 font-medium">Lead</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Type</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Company</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Qty</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Message</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Links</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayed.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-top">
                          <p className="font-medium text-[var(--foreground)]">{r.fullName}</p>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {r.email}
                            {r.phone ? ` · ${r.phone}` : ''}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {formatWhen(r.createdAt)}
                          </p>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top">{typeLabel(r.type)}</td>
                        <td className="px-2 py-2.5 pr-4 align-top text-[var(--muted-foreground)]">
                          {r.company ?? '—'}
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top tabular-nums">
                          {r.estimatedQty ?? '—'}
                        </td>
                        <td className="max-w-xs px-2 py-2.5 pr-4 align-top">
                          <p className="line-clamp-2 text-[var(--muted-foreground)]">{r.message}</p>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(r.status)}`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top">
                          <Link
                            href={`/admin/commerce/customers?q=${encodeURIComponent(r.email)}`}
                            className="text-xs font-medium underline-offset-2 hover:underline"
                          >
                            Customer
                          </Link>
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

export default function AdminGiftingInquiriesPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading inquiries">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <InquiriesDeskInner />
    </Suspense>
  );
}
