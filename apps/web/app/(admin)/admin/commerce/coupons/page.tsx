'use client';

import Link from 'next/link';
import { FormEvent, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Search, Tag, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type CouponScope = 'CART' | 'PRODUCT' | 'COLLECTION';
type CouponStatus = 'off' | 'scheduled' | 'active' | 'expired' | 'exhausted';
type BenefitKind = 'percent' | 'fixed';
type StatusFilter = '' | CouponStatus;

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  type: 'PERCENT' | 'FIXED_PAISE';
  discountPercent: number | null;
  discountPaise: number | null;
  minSubtotalPaise: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  scope: CouponScope;
  productIds: string[];
  collectionIds: string[];
  products: Array<{ id: string; title: string; slug: string }>;
  collections: Array<{ id: string; title: string; slug: string }>;
  status: CouponStatus;
  conflictsWith: string[];
};

type CollectionOption = { id: string; slug: string; title: string };
type ProductHit = { id: string; title: string; slug: string };

type AdminCouponsListResponse = {
  items: CouponRow[];
  nextCursor: string | null;
  limit: number;
};

const PAGE_LIMIT = 25;

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'off', label: 'Off' },
  { value: 'expired', label: 'Expired' },
  { value: 'exhausted', label: 'Exhausted' },
];

const SCOPE_CHIPS: Array<{ value: CouponScope; label: string }> = [
  { value: 'CART', label: 'Whole cart' },
  { value: 'PRODUCT', label: 'Products' },
  { value: 'COLLECTION', label: 'Collections' },
];


function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `GIFT-${suffix}`;
}

function statusTone(status: CouponStatus): string {
  if (status === 'active') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  if (status === 'scheduled') return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80';
  if (status === 'expired' || status === 'exhausted') {
    return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  }
  return 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80';
}

function statusLabel(status: CouponStatus): string {
  if (status === 'off') return 'Off';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'active') return 'Active';
  if (status === 'expired') return 'Expired';
  return 'Exhausted';
}

function scopeLabel(scope: CouponScope): string {
  if (scope === 'PRODUCT') return 'Products';
  if (scope === 'COLLECTION') return 'Collections';
  return 'Cart';
}

function scopeTone(scope: CouponScope): string {
  if (scope === 'PRODUCT') {
    return 'bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]';
  }
  if (scope === 'COLLECTION') return 'bg-sky-50 text-sky-900 ring-1 ring-sky-200/80';
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
}

function CouponsDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cursorParam = searchParams.get('cursor') ?? '';

  const [rows, setRows] = useState<CouponRow[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT);
  /** Previous page cursors ('' = first page). Enables Prev without bidirectional API. */
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [qInput, setQInput] = useState('');

  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [benefit, setBenefit] = useState<BenefitKind>('percent');
  const [percent, setPercent] = useState('10');
  const [fixedRupees, setFixedRupees] = useState('100');
  const [minOrderRupees, setMinOrderRupees] = useState('500');
  const [maxUses, setMaxUses] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [scope, setScope] = useState<CouponScope>('CART');
  const [selectedProducts, setSelectedProducts] = useState<ProductHit[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<CollectionOption[]>([]);
  const [productQ, setProductQ] = useState('');
  const [productHits, setProductHits] = useState<ProductHit[]>([]);
  const [productSearching, setProductSearching] = useState(false);

  const [previewSubtotalRupees, setPreviewSubtotalRupees] = useState('1000');
  const [previewResult, setPreviewResult] = useState<string | null>(null);

  const loadSeq = useRef(0);
  const hasLoadedOnce = useRef(false);
  const productSearchSeq = useRef(0);

  const setCursor = useCallback(
    (cursor: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (cursor) params.set('cursor', cursor);
      else params.delete('cursor');
      const qs = params.toString();
      router.replace(`/admin/commerce/coupons${qs ? `?${qs}` : ''}`);
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
      params.set('limit', String(PAGE_LIMIT));
      if (cursorParam) params.set('cursor', cursorParam);
      const data = await apiAuth<AdminCouponsListResponse>(
        `/admin/commerce/coupons?${params.toString()}`,
      );
      if (seq !== loadSeq.current) return;
      setRows(data.items);
      setNextCursor(data.nextCursor);
      setPageLimit(data.limit);
      hasLoadedOnce.current = true;
    } catch (err) {
      if (seq !== loadSeq.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load promotions');
    } finally {
      if (seq === loadSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [cursorParam]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      const qs = searchParams.toString();
      const next = `/admin/commerce/coupons${qs ? `?${qs}` : ''}`;
      router.replace(loginUrl(next));
      return;
    }
    void load();
  }, [router, load, searchParams]);

  useEffect(() => {
    void apiAuth<Array<CollectionOption & { membershipMode?: string }>>('/admin/catalog/collections')
      .then((rows) => setCollections(rows.filter((c) => c.membershipMode !== 'SMART')))
      .catch(() => setCollections([]));
  }, []);

  const pageIndex = cursorStack.length + 1;
  const canPrev = cursorStack.length > 0 || Boolean(cursorParam);

  function goNext() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, cursorParam]);
    setCursor(nextCursor);
  }

  function goPrev() {
    if (cursorStack.length === 0) {
      if (!cursorParam) return;
      setCursor(null);
      return;
    }
    const prev = cursorStack[cursorStack.length - 1] ?? '';
    setCursorStack((s) => s.slice(0, -1));
    setCursor(prev || null);
  }

  useEffect(() => {
    if (scope !== 'PRODUCT') return;
    const q = productQ.trim();
    if (q.length < 2) {
      setProductHits([]);
      return;
    }
    const t = window.setTimeout(() => {
      const seq = ++productSearchSeq.current;
      setProductSearching(true);
      void apiAuth<{ items: ProductHit[] }>(
        `/admin/catalog/products?q=${encodeURIComponent(q)}&limit=8&status=PUBLISHED`,
      )
        .then((res) => {
          if (seq !== productSearchSeq.current) return;
          setProductHits(res.items ?? []);
        })
        .catch(() => {
          if (seq !== productSearchSeq.current) return;
          setProductHits([]);
        })
        .finally(() => {
          if (seq === productSearchSeq.current) setProductSearching(false);
        });
    }, 280);
    return () => window.clearTimeout(t);
  }, [productQ, scope]);

  // v1: status/search filter is client-side on the current page only (not server-wide).
  const filtered = useMemo(() => {
    const q = qInput.trim().toLowerCase();
    return rows.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.code.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        c.products.some((p) => p.title.toLowerCase().includes(q)) ||
        c.collections.some((cat) => cat.title.toLowerCase().includes(q))
      );
    });
  }, [rows, statusFilter, qInput]);

  const filterActive = Boolean(statusFilter || qInput.trim());

  function resetBuilder() {
    setCode('');
    setDescription('');
    setBenefit('percent');
    setPercent('10');
    setFixedRupees('100');
    setMinOrderRupees('500');
    setMaxUses('');
    setStartsAt('');
    setExpiresAt('');
    setScope('CART');
    setSelectedProducts([]);
    setSelectedCollectionIds([]);
    setProductQ('');
    setProductHits([]);
    setPreviewResult(null);
  }

  function buildDraftBody(includeCode: boolean) {
    const minSubtotalPaise = Math.max(0, Math.round(Number(minOrderRupees || '0') * 100));
    const base: Record<string, unknown> = {
      description: description.trim() || undefined,
      minSubtotalPaise,
      maxUses: maxUses.trim() ? Number(maxUses) : undefined,
      startsAt: startsAt || undefined,
      expiresAt: expiresAt || undefined,
      scope,
      productIds: scope === 'PRODUCT' ? selectedProducts.map((p) => p.id) : undefined,
      collectionIds: scope === 'COLLECTION' ? selectedCollectionIds : undefined,
    };
    if (includeCode) base.code = code.trim().toUpperCase();
    if (benefit === 'percent') base.discountPercent = Number(percent);
    else base.discountPaise = Math.round(Number(fixedRupees || '0') * 100);
    return base;
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const created = await apiAuth<{ code: string; conflictsWith?: string[] }>(
        '/admin/commerce/coupons',
        {
          method: 'POST',
          json: { ...buildDraftBody(true), code: code.trim().toUpperCase() },
        },
      );
      setCursorStack([]);
      if (cursorParam) setCursor(null);
      else await load();
      resetBuilder();
      setShowBuilder(false);
      const overlaps = created.conflictsWith ?? [];
      setMsg(
        overlaps.length
          ? `Created · overlaps ${overlaps.slice(0, 4).join(', ')}${overlaps.length > 4 ? '…' : ''}`
          : 'Promotion created',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: CouponRow) {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      await apiAuth(`/admin/commerce/coupons/${encodeURIComponent(c.code)}`, {
        method: 'PATCH',
        json: { active: !c.active },
      });
      await load();
      setMsg(c.active ? `${c.code} deactivated` : `${c.code} activated`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function runPreview(mode: 'draft' | 'code', existingCode?: string) {
    setPreviewResult(null);
    setError(null);
    const subtotalPaise = Math.round(Number(previewSubtotalRupees || '0') * 100);
    try {
      const body =
        mode === 'code' && existingCode
          ? { subtotalPaise, code: existingCode }
          : {
              subtotalPaise,
              ...buildDraftBody(false),
            };
      const res = await apiAuth<{
        ok: boolean;
        message?: string;
        discountPaise?: number;
        totalAfterPaise?: number;
        eligibleSubtotalPaise?: number;
        scope?: CouponScope;
      }>('/admin/commerce/coupons/preview', { method: 'POST', json: body });
      if (!res.ok) {
        setPreviewResult(res.message ?? 'Would not apply');
      } else {
        const scopeBit =
          res.scope && res.scope !== 'CART'
            ? ` · eligible ${formatInr(res.eligibleSubtotalPaise ?? 0)}`
            : '';
        setPreviewResult(
          `Discount ${formatInr(res.discountPaise ?? 0)} → total ${formatInr(res.totalAfterPaise ?? 0)}${scopeBit}`,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    }
  }

  function addProduct(p: ProductHit) {
    setSelectedProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [...prev, p]));
    setProductQ('');
    setProductHits([]);
  }

  function removeProduct(id: string) {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function toggleCategory(id: string) {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilters() {
    setStatusFilter('');
    setQInput('');
  }

  return (
    <div>
      <OpsPageHeader
        title="Promotions"
        actions={
          <>
            <Link href="/admin/commerce/reports?report=coupons" className="clay-btn-ghost min-h-10 text-sm">
              Reports
            </Link>
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
            <button
              type="button"
              className="clay-btn inline-flex min-h-10 items-center gap-1.5 text-sm"
              onClick={() => {
                setShowBuilder((v) => !v);
                setMsg(null);
                setError(null);
              }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {showBuilder ? 'Close' : 'New coupon'}
            </button>
          </>
        }
      />

      {msg ? (
        <p className="gift-banner gift-banner--success mb-3" role="status">
          {msg}
        </p>
      ) : null}
      {error ? (
        <p className="gift-banner gift-banner--danger mb-3" role="alert">
          {error}
        </p>
      ) : null}

      {showBuilder ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="clay-panel mb-5 space-y-4 p-4 text-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg leading-tight">New coupon</h2>
            <button
              type="button"
              className="text-xs opacity-60 underline-offset-2 hover:underline"
              onClick={() => {
                resetBuilder();
                setShowBuilder(false);
              }}
            >
              Cancel
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="min-w-[10rem] flex-1 text-xs">
              Code
              <div className="mt-1 flex gap-2">
                <input
                  className="clay-input min-h-10 flex-1 font-mono text-sm uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  pattern="[A-Za-z0-9_-]{2,40}"
                />
                <button
                  type="button"
                  className="clay-btn-secondary min-h-10 shrink-0 px-3 text-sm"
                  onClick={() => setCode(generateCode())}
                >
                  Generate
                </button>
              </div>
            </label>
          </div>

          <label className="block text-xs">
            Description
            <input
              className="clay-input mt-1 min-h-10 w-full text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Welcome gift off"
              maxLength={200}
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 text-xs font-medium opacity-70">Applies to</legend>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Coupon scope">
              {SCOPE_CHIPS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={scope === s.value}
                  className={opsChipClass(scope === s.value)}
                  onClick={() => setScope(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>

          {scope === 'PRODUCT' ? (
            <div className="space-y-2">
              <label className="block text-xs">
                Products
                <div className="relative mt-1">
                  <div className="flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3">
                    <Search className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
                    <input
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:opacity-50"
                      value={productQ}
                      onChange={(e) => setProductQ(e.target.value)}
                      placeholder="Search published products"
                      aria-label="Search products"
                    />
                    {productSearching ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin opacity-50" aria-hidden />
                    ) : null}
                  </div>
                  {productHits.length > 0 ? (
                    <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] py-1 shadow-md">
                      {productHits.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                            onClick={() => addProduct(p)}
                          >
                            <span className="font-medium">{p.title}</span>
                            <span className="ml-2 font-mono text-[11px] opacity-50">{p.slug}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </label>
              {selectedProducts.length ? (
                <ul className="flex flex-wrap gap-1.5">
                  {selectedProducts.map((p) => (
                    <li
                      key={p.id}
                      className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] px-2 py-0.5 text-xs text-[var(--primary)]"
                    >
                      {p.title}
                      <button
                        type="button"
                        className="rounded-full p-0.5 hover:bg-[color-mix(in_srgb,var(--primary)_20%,transparent)]"
                        aria-label={`Remove ${p.title}`}
                        onClick={() => removeProduct(p.id)}
                      >
                        <X className="h-3 w-3" aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs opacity-55">Select at least one product.</p>
              )}
            </div>
          ) : null}

          {scope === 'COLLECTION' ? (
            <div className="space-y-2">
              <p className="text-xs font-medium opacity-70">Collections</p>
              {collections.length === 0 ? (
                <p className="text-xs opacity-55">No MANUAL collections yet.</p>
              ) : (
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                  {collections.map((cat) => {
                    const on = selectedCollectionIds.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        aria-pressed={on}
                        className={opsChipClass(on)}
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.title}
                      </button>
                    );
                  })}
                </div>
              )}
              {!selectedCollectionIds.length ? (
                <p className="text-xs opacity-55">Select at least one category.</p>
              ) : null}
            </div>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="text-xs font-medium opacity-70">Benefit</legend>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={benefit === 'percent'}
                  onChange={() => setBenefit('percent')}
                />
                Percent off
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={benefit === 'fixed'}
                  onChange={() => setBenefit('fixed')}
                />
                Fixed ₹
              </label>
            </div>
            {benefit === 'percent' ? (
              <label className="block text-xs">
                Percent
                <input
                  className="clay-input mt-1 block w-24 min-h-10 text-sm"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  required
                  inputMode="numeric"
                />
              </label>
            ) : (
              <label className="block text-xs">
                Amount (₹)
                <input
                  className="clay-input mt-1 block w-28 min-h-10 text-sm"
                  value={fixedRupees}
                  onChange={(e) => setFixedRupees(e.target.value)}
                  required
                  inputMode="decimal"
                />
              </label>
            )}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              Min eligible (₹)
              <input
                className="clay-input mt-1 block w-full min-h-10 text-sm"
                value={minOrderRupees}
                onChange={(e) => setMinOrderRupees(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="block text-xs">
              Max uses
              <input
                className="clay-input mt-1 block w-full min-h-10 text-sm"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
                inputMode="numeric"
              />
            </label>
            <label className="block text-xs">
              Starts
              <input
                type="datetime-local"
                className="clay-input mt-1 block w-full min-h-10 text-sm"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>
            <label className="block text-xs">
              Expires
              <input
                type="datetime-local"
                className="clay-input mt-1 block w-full min-h-10 text-sm"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-[var(--border-subtle)] p-3">
            <label className="text-xs">
              Preview subtotal (₹)
              <input
                className="clay-input mt-1 block w-32 min-h-10 text-sm"
                value={previewSubtotalRupees}
                onChange={(e) => setPreviewSubtotalRupees(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <button
              type="button"
              className="clay-btn-secondary min-h-10 px-3 text-sm"
              onClick={() => void runPreview('draft')}
            >
              Preview
            </button>
            {previewResult ? <p className="w-full text-xs opacity-80">{previewResult}</p> : null}
          </div>

          <button type="submit" className="clay-btn w-fit text-sm disabled:opacity-50" disabled={busy}>
            Create promotion
          </button>
        </form>
      ) : null}

      <form
        className="mb-3 w-full max-w-xl"
        role="search"
        onSubmit={(e) => e.preventDefault()}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search code, description, product…"
            aria-label="Search promotions"
            autoComplete="off"
          />
          {qInput ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--primary)] opacity-70 hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:opacity-100"
              aria-label="Clear search"
              onClick={() => setQInput('')}
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
            const active = statusFilter === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => setStatusFilter(c.value)}
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
          {filtered.length}
          {filterActive ? ` · filtered` : ''}
        </span>
        {filterActive ? (
          <button type="button" className="clay-btn-ghost min-h-8 px-2 text-xs" onClick={clearFilters}>
            Clear
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading promotions">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Tag className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No promotions match this filter.' : 'No promotions yet.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          ) : (
            <button
              type="button"
              className="clay-btn text-sm"
              onClick={() => setShowBuilder(true)}
            >
              New coupon
            </button>
          )}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className={refreshing ? 'opacity-70 transition-opacity' : undefined} aria-busy={refreshing}>
          <div className="md:hidden">
            <ul className="space-y-2">
              {filtered.map((c) => (
                <li key={c.id} className="clay-panel p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium">{c.code}</p>
                      {c.description ? (
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{c.description}</p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(c.status)}`}
                    >
                      {statusLabel(c.status)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${scopeTone(c.scope)}`}
                    >
                      {scopeLabel(c.scope)}
                    </span>
                    <span className="tabular-nums text-[var(--foreground)]">
                      {c.discountPercent != null
                        ? `${c.discountPercent}%`
                        : formatInr(c.discountPaise ?? 0)}
                    </span>
                    <span className="tabular-nums">
                      {c.usedCount}
                      {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                    </span>
                    {(c.conflictsWith ?? []).length > 0 ? (
                      <span
                        className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-900"
                        title={(c.conflictsWith ?? []).join(', ')}
                      >
                        Overlaps {(c.conflictsWith ?? []).length}
                      </span>
                    ) : null}
                  </div>
                  {c.scope === 'PRODUCT' && c.products.length ? (
                    <p className="mt-1.5 line-clamp-2 text-[11px] opacity-60">
                      {c.products.map((p) => p.title).join(' · ')}
                    </p>
                  ) : null}
                  {c.scope === 'COLLECTION' && c.collections.length ? (
                    <p className="mt-1.5 line-clamp-2 text-[11px] opacity-60">
                      {c.collections.map((cat) => cat.title).join(' · ')}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="text-xs font-medium text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-40"
                      disabled={busy}
                      onClick={() => void toggle(c)}
                    >
                      {c.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium underline-offset-2 hover:underline"
                      onClick={() => void runPreview('code', c.code)}
                    >
                      Preview
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[52rem] border-collapse text-sm">
                  <thead>
                    <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                      <th className="px-3 py-2.5 font-medium">Code</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Scope</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Benefit</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Schedule</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Usage</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]"
                      >
                        <td className="px-3 py-2.5 align-top">
                          <p className="font-mono text-xs font-medium">{c.code}</p>
                          {c.description ? (
                            <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                              {c.description}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top">
                          <span
                            className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${scopeTone(c.scope)}`}
                          >
                            {scopeLabel(c.scope)}
                          </span>
                          {c.scope === 'PRODUCT' && c.products.length ? (
                            <p className="mt-1 max-w-[10rem] text-[11px] leading-snug opacity-60">
                              {c.products.map((p) => p.title).join(', ')}
                            </p>
                          ) : null}
                          {c.scope === 'COLLECTION' && c.collections.length ? (
                            <p className="mt-1 max-w-[10rem] text-[11px] leading-snug opacity-60">
                              {c.collections.map((cat) => cat.title).join(', ')}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top tabular-nums">
                          {c.discountPercent != null
                            ? `${c.discountPercent}%`
                            : formatInr(c.discountPaise ?? 0)}
                          <p className="text-[11px] opacity-55">
                            min {formatInr(c.minSubtotalPaise)}
                          </p>
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top text-xs opacity-80">
                          {c.startsAt || c.expiresAt ? (
                            <>
                              {c.startsAt ? (
                                <span className="block">
                                  from {new Date(c.startsAt).toLocaleString('en-IN')}
                                </span>
                              ) : null}
                              {c.expiresAt ? (
                                <span className="block">
                                  until {new Date(c.expiresAt).toLocaleString('en-IN')}
                                </span>
                              ) : (
                                <span className="block">no end</span>
                              )}
                            </>
                          ) : (
                            'always'
                          )}
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top tabular-nums">
                          {c.usedCount}
                          {c.maxUses != null ? ` / ${c.maxUses}` : ''}
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(c.status)}`}
                            >
                              {statusLabel(c.status)}
                            </span>
                            {(c.conflictsWith ?? []).length > 0 ? (
                              <span
                                className="inline-block max-w-[11rem] truncate rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900"
                                title={(c.conflictsWith ?? []).join(', ')}
                              >
                                Overlaps {(c.conflictsWith ?? []).slice(0, 2).join(', ')}
                                {(c.conflictsWith ?? []).length > 2
                                  ? ` +${(c.conflictsWith ?? []).length - 2}`
                                  : ''}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 pr-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="text-xs font-medium text-[var(--primary)] underline-offset-2 hover:underline disabled:opacity-40"
                              disabled={busy}
                              onClick={() => void toggle(c)}
                            >
                              {c.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              type="button"
                              className="text-xs font-medium underline-offset-2 hover:underline"
                              onClick={() => void runPreview('code', c.code)}
                            >
                              Preview
                            </button>
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

      {previewResult && !showBuilder ? (
        <p className="mt-3 text-xs opacity-80" role="status">
          {previewResult}
        </p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs tabular-nums text-[var(--muted-foreground)]">
            Page {pageIndex}
            {` · ${rows.length}${nextCursor ? '+' : ''} of up to ${pageLimit}/page`}
            {filterActive ? ' · filtered on this page' : ''}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
              disabled={!canPrev || loading}
              aria-label="Previous page"
              onClick={goPrev}
            >
              <ChevronLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Prev
            </button>
            <button
              type="button"
              className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
              disabled={!nextCursor || loading}
              aria-label="Next page"
              onClick={goNext}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminCouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading promotions">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
            />
          ))}
        </div>
      }
    >
      <CouponsDeskInner />
    </Suspense>
  );
}
