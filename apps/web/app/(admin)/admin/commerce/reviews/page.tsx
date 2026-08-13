'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageSquareQuote, RefreshCw, Search, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser, loginUrl } from '@/lib/auth-client';
import { opsChipClass, opsRowActionClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type ReviewRow = {
  id: string;
  rating: number;
  headline: string | null;
  body: string;
  status: string;
  customerEmail: string;
  customerName?: string | null;
  product: { slug: string; title: string };
  createdAt: string;
};

type ReviewsListResponse = {
  items: ReviewRow[];
  nextCursor: string | null;
  limit: number;
};

type StatusFilter = '' | 'PENDING' | 'APPROVED' | 'REJECTED';

const PAGE_LIMIT = 25;

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'APPROVED' || raw === 'REJECTED' || raw === 'PENDING') return raw;
  // Default: all statuses (approved/rejected stay visible after moderation)
  return '';
}

function statusLabel(status: string): string {
  if (status === 'PENDING') return 'Pending';
  if (status === 'APPROVED') return 'Approved';
  if (status === 'REJECTED') return 'Rejected';
  return status;
}

function statusTone(status: string): string {
  if (status === 'APPROVED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  if (status === 'REJECTED') return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  if (status === 'PENDING') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
}

function stars(rating: number): string {
  return `${'★'.repeat(Math.max(0, Math.min(5, rating)))}${'☆'.repeat(Math.max(0, 5 - rating))}`;
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

function ReviewsDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = parseStatus(searchParams.get('status'));
  const qParam = searchParams.get('q') ?? '';
  const cursorParam = searchParams.get('cursor') ?? '';
  const canModerate =
    getStoredUser()?.roles.some((r) => r === 'COMMERCE_ADMIN' || r === 'SUPER_ADMIN') ?? false;

  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);
  const filterKey = `${qParam}\0${status}`;
  const filterActive = Boolean(qParam || status);
  const pageIndex = cursorStack.length + 1;
  const canPrev = cursorStack.length > 0 || Boolean(cursorParam);

  const patchQuery = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === '') params.delete(k);
        else params.set(k, v);
      }
      if (Object.keys(patch).some((k) => k === 'q' || k === 'status')) {
        params.delete('cursor');
      }
      const qs = params.toString();
      router.replace(qs ? `/admin/commerce/reviews?${qs}` : '/admin/commerce/reviews');
    },
    [router, searchParams],
  );

  useEffect(() => {
    setCursorStack([]);
  }, [filterKey]);

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setError(null);
    setNotice(null);
    if (!hasLoadedOnce.current) setLoading(true);
    else setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      if (status) params.set('status', status);
      if (cursorParam) params.set('cursor', cursorParam);
      params.set('limit', String(PAGE_LIMIT));
      const data = await apiAuth<ReviewsListResponse>(
        `/admin/commerce/reviews?${params.toString()}`,
      );
      if (seq !== loadSeq.current) return;
      setRows(data.items ?? []);
      setNextCursor(data.nextCursor);
      hasLoadedOnce.current = true;
    } catch (e) {
      if (seq !== loadSeq.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [qParam, status, cursorParam]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/reviews'));
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
    setCursorStack([]);
    router.replace('/admin/commerce/reviews');
  }

  function goNext() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, cursorParam]);
    patchQuery({ cursor: nextCursor });
  }

  function goPrev() {
    if (cursorStack.length === 0) {
      if (!cursorParam) return;
      patchQuery({ cursor: null });
      return;
    }
    const prev = cursorStack[cursorStack.length - 1] ?? '';
    setCursorStack((s) => s.slice(0, -1));
    patchQuery({ cursor: prev || null });
  }

  async function moderate(id: string, next: 'APPROVED' | 'REJECTED') {
    setActingId(id);
    setError(null);
    setNotice(null);
    try {
      await apiAuth(`/admin/commerce/reviews/${id}`, {
        method: 'PATCH',
        json: { status: next },
      });
      const msg = next === 'APPROVED' ? 'Review approved.' : 'Review rejected.';
      await load();
      setNotice(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Moderation failed');
    } finally {
      setActingId(null);
    }
  }

  const countLabel = loading
    ? 'Loading…'
    : `${rows.length} on this page${nextCursor ? ' · more' : ''}`;

  function rowActions(r: ReviewRow) {
    if (!canModerate || r.status !== 'PENDING') return null;
    return (
      <div className="flex flex-wrap justify-end gap-0.5">
        <button
          type="button"
          className={`${opsRowActionClass} text-emerald-800`}
          disabled={actingId === r.id}
          aria-label={`Approve review ${r.id}`}
          onClick={() => void moderate(r.id, 'APPROVED')}
        >
          Approve
        </button>
        <button
          type="button"
          className={`${opsRowActionClass} text-red-800`}
          disabled={actingId === r.id}
          aria-label={`Reject review ${r.id}`}
          onClick={() => void moderate(r.id, 'REJECTED')}
        >
          Reject
        </button>
      </div>
    );
  }

  return (
    <div>
      <OpsPageHeader
        title="Reviews"
        actions={
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
            placeholder="Search product, email, text"
            aria-label="Search reviews"
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

      <div className="mb-3 flex items-center gap-2">
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
                onClick={() => patchQuery({ status: c.value })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
      </div>

      <div className="mb-2 flex items-center justify-between gap-2 sm:hidden">
        <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
          {refreshing && !loading ? 'Refreshing… · ' : null}
          {countLabel}
        </p>
      </div>

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading reviews">
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
          <MessageSquareQuote className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No reviews match this filter.' : 'No reviews yet.'}
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
              {rows.map((r) => (
                <li key={r.id} className="clay-panel p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/commerce/products?q=${encodeURIComponent(r.product.slug)}`}
                        className="font-medium leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                      >
                        {r.product.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        {stars(r.rating)} · {r.customerEmail}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                  </div>
                  {r.headline ? (
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{r.headline}</p>
                  ) : null}
                  <p className="mt-1 line-clamp-3 text-sm text-[var(--muted-foreground)]">{r.body}</p>
                  <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                    {formatWhen(r.createdAt)}
                  </p>
                  {canModerate && r.status === 'PENDING' ? (
                    <div className="mt-2 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2">
                      {rowActions(r)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[48rem] border-collapse text-sm">
                  <thead>
                    <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                      <th className="px-3 py-2.5 font-medium">Product</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Rating</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Review</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Customer</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-top">
                          <Link
                            href={`/admin/commerce/products?q=${encodeURIComponent(r.product.slug)}`}
                            className="font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
                          >
                            {r.product.title}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                            {formatWhen(r.createdAt)}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-2 py-2.5 pr-4 align-top tabular-nums text-[var(--foreground)]">
                          {r.rating}/5
                        </td>
                        <td className="max-w-xs px-2 py-2.5 pr-4 align-top">
                          {r.headline ? (
                            <p className="font-medium text-[var(--foreground)]">{r.headline}</p>
                          ) : null}
                          <p className="mt-0.5 line-clamp-2 text-[var(--muted-foreground)]">{r.body}</p>
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top">
                          <p className="text-[var(--foreground)]">{r.customerEmail}</p>
                          {r.customerName ? (
                            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                              {r.customerName}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-2 py-2.5 pr-4 align-top">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(r.status)}`}
                          >
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top">
                          {rowActions(r) ?? (
                            <span className="text-xs text-[var(--muted-foreground)]">—</span>
                          )}
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

      {!loading && rows.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs tabular-nums text-[var(--muted-foreground)]">Page {pageIndex}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-sm disabled:opacity-40"
              disabled={!canPrev || loading || refreshing}
              onClick={goPrev}
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Prev
            </button>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-sm disabled:opacity-40"
              disabled={!nextCursor || loading || refreshing}
              onClick={goNext}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading reviews">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-3 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <ReviewsDeskInner />
    </Suspense>
  );
}
