'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ListFilter,
  Package,
  Pencil,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { apiAuth, clearSession, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type StatusFilter = '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
type StockFilter = '' | 'low' | 'out' | 'in';
type HamperFilter = '' | '0' | '1';
type LabelFilter = '' | 'BESTSELLER' | 'EDITORS_PICK' | 'GIFT_SET';
type RecipientFilter = '' | 'girl' | 'boy' | 'mom' | 'unisex';
type OccasionFilter = '' | 'welcome-baby' | 'baby-shower' | 'naming' | 'birthday';
type SortFilter =
  | 'updated'
  | 'title_asc'
  | 'title_desc'
  | 'created'
  | 'price_asc'
  | 'price_desc';

type ProductListFilters = {
  q: string;
  status: StatusFilter;
  stock: StockFilter;
  hamper: HamperFilter;
  storefrontLabel: LabelFilter;
  recipient: RecipientFilter;
  occasion: OccasionFilter;
  category: string;
  sort: SortFilter;
};

type AdminProductListResponse = {
  items: CatalogProduct[];
  nextCursor: string | null;
  limit: number;
};

type CategoryOption = { id: string; slug: string; name: string };

const PAGE_LIMIT = 25;

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const STOCK_OPTIONS: Array<{ value: StockFilter; label: string }> = [
  { value: '', label: 'Any stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
  { value: 'in', label: 'In stock' },
];

const HAMPER_OPTIONS: Array<{ value: HamperFilter; label: string }> = [
  { value: '', label: 'Any type' },
  { value: '1', label: 'Hampers' },
  { value: '0', label: 'Single items' },
];

const LABEL_OPTIONS: Array<{ value: LabelFilter; label: string }> = [
  { value: '', label: 'Any merch' },
  { value: 'BESTSELLER', label: 'Bestseller' },
  { value: 'EDITORS_PICK', label: "Editor's pick" },
  { value: 'GIFT_SET', label: 'Gift set' },
];

const RECIPIENT_OPTIONS: Array<{ value: RecipientFilter; label: string }> = [
  { value: '', label: 'Any recipient' },
  { value: 'girl', label: 'Girl' },
  { value: 'boy', label: 'Boy' },
  { value: 'mom', label: 'Mom' },
  { value: 'unisex', label: 'Unisex' },
];

const OCCASION_OPTIONS: Array<{ value: OccasionFilter; label: string }> = [
  { value: '', label: 'Any occasion' },
  { value: 'welcome-baby', label: 'Welcome baby' },
  { value: 'baby-shower', label: 'Baby shower' },
  { value: 'naming', label: 'Naming' },
  { value: 'birthday', label: 'Birthday' },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Newest created' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

const SORT_VALUES = new Set<SortFilter>(SORT_OPTIONS.map((o) => o.value));

function parseSort(raw: string | null): SortFilter {
  if (raw && SORT_VALUES.has(raw as SortFilter)) return raw as SortFilter;
  return 'updated';
}

function chipClass(active: boolean): string {
  return `clay-chip min-h-8 shrink-0 cursor-pointer px-2.5 text-xs font-medium transition-colors sm:min-h-9 sm:px-3.5 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,white)] text-[var(--primary)] shadow-sm'
      : 'text-[var(--foreground)] hover:border-[color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,white)]'
  }`;
}

function filterSelectClass(): string {
  return 'clay-input min-h-9 w-full min-w-0 text-sm';
}

function formatTagLabel(t: string): string {
  return t.toLowerCase().replace(/_/g, ' ');
}

function totalAvailable(p: CatalogProduct): number {
  return p.variants.reduce((s, v) => s + (v.available ?? 0), 0);
}

function tagChips(p: CatalogProduct): string[] {
  const tags = [
    ...(p.recipientTags ?? []),
    ...(p.occasionTags ?? []).slice(0, 2),
    ...(p.storefrontLabels ?? []),
  ];
  return tags.slice(0, 3);
}

function statusLabel(status: string): string {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'ARCHIVED') return 'Archived';
  if (status === 'DRAFT') return 'Draft';
  return status;
}

function statusTone(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  if (status === 'ARCHIVED') return 'bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80';
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function primaryMedia(p: CatalogProduct): { url: string; alt: string } | null {
  const img = p.media?.find((m) => (m.kind ?? 'IMAGE') === 'IMAGE' && m.url);
  if (!img?.url) return null;
  return { url: img.url, alt: img.altText?.trim() || p.title };
}

function ProductThumb({ product }: { product: CatalogProduct }) {
  const media = primaryMedia(product);
  if (!media) {
    return (
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[color:var(--muted-foreground)]"
        aria-hidden
      >
        <Package className="h-4 w-4 opacity-50" />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- admin media URLs are arbitrary CDNs
    <img
      src={media.url}
      alt={media.alt}
      width={44}
      height={44}
      className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-[var(--border-subtle)]"
    />
  );
}

function ProductsDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters: ProductListFilters = useMemo(
    () => ({
      q: searchParams.get('q') ?? '',
      status: (searchParams.get('status') ?? '') as StatusFilter,
      stock: (searchParams.get('stock') ?? '') as StockFilter,
      hamper: (searchParams.get('hamper') ?? '') as HamperFilter,
      storefrontLabel: (searchParams.get('storefrontLabel') ?? '') as LabelFilter,
      recipient: (searchParams.get('recipient') ?? '') as RecipientFilter,
      occasion: (searchParams.get('occasion') ?? '') as OccasionFilter,
      category: searchParams.get('category') ?? '',
      sort: parseSort(searchParams.get('sort')),
    }),
    [searchParams],
  );
  const cursorParam = searchParams.get('cursor') ?? '';

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState(PAGE_LIMIT);
  /** Previous page cursors ('' = first page). Enables Prev without bidirectional API. */
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qInput, setQInput] = useState(filters.q);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  const filterKey = [
    filters.q,
    filters.status,
    filters.stock,
    filters.hamper,
    filters.storefrontLabel,
    filters.recipient,
    filters.occasion,
    filters.category,
    filters.sort,
  ].join('\0');

  const applyFilters = useCallback(
    (next: Partial<ProductListFilters> & { cursor?: string | null }, base?: ProductListFilters) => {
      const src = base ?? filters;
      const merged: ProductListFilters = {
        q: next.q !== undefined ? next.q : src.q,
        status: next.status !== undefined ? next.status : src.status,
        stock: next.stock !== undefined ? next.stock : src.stock,
        hamper: next.hamper !== undefined ? next.hamper : src.hamper,
        storefrontLabel:
          next.storefrontLabel !== undefined ? next.storefrontLabel : src.storefrontLabel,
        recipient: next.recipient !== undefined ? next.recipient : src.recipient,
        occasion: next.occasion !== undefined ? next.occasion : src.occasion,
        category: next.category !== undefined ? next.category : src.category,
        sort: next.sort !== undefined ? next.sort : src.sort,
      };
      const params = new URLSearchParams();
      if (merged.q.trim()) params.set('q', merged.q.trim());
      if (merged.status) params.set('status', merged.status);
      if (merged.stock) params.set('stock', merged.stock);
      if (merged.hamper) params.set('hamper', merged.hamper);
      if (merged.storefrontLabel) params.set('storefrontLabel', merged.storefrontLabel);
      if (merged.recipient) params.set('recipient', merged.recipient);
      if (merged.occasion) params.set('occasion', merged.occasion);
      if (merged.category) params.set('category', merged.category);
      if (merged.sort && merged.sort !== 'updated') params.set('sort', merged.sort);
      if (next.cursor) params.set('cursor', next.cursor);
      const qs = params.toString();
      router.replace(`/admin/commerce/products${qs ? `?${qs}` : ''}`);
    },
    [filters, router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.q) params.set('q', filters.q);
      if (filters.status) params.set('status', filters.status);
      if (filters.stock) params.set('stock', filters.stock);
      if (filters.hamper) params.set('hamper', filters.hamper);
      if (filters.storefrontLabel) params.set('storefrontLabel', filters.storefrontLabel);
      if (filters.recipient) params.set('recipient', filters.recipient);
      if (filters.occasion) params.set('occasion', filters.occasion);
      if (filters.category) params.set('category', filters.category);
      if (filters.sort && filters.sort !== 'updated') params.set('sort', filters.sort);
      if (cursorParam) params.set('cursor', cursorParam);
      params.set('limit', String(PAGE_LIMIT));
      const data = await apiAuth<AdminProductListResponse>(
        `/admin/catalog/products?${params.toString()}`,
      );
      setProducts(data.items);
      setNextCursor(data.nextCursor);
      setPageLimit(data.limit);
      setSelected({});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
      clearSession();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [filters, cursorParam, router]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    setQInput(filters.q);
  }, [filters.q]);

  useEffect(() => {
    void apiAuth<CategoryOption[]>('/admin/catalog/categories')
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // New filters → drop Prev stack (URL cursor cleared by applyFilters).
  useEffect(() => {
    setCursorStack([]);
  }, [filterKey]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected],
  );
  const allSelected = products.length > 0 && products.every((p) => selected[p.id]);
  const pageIndex = cursorStack.length + 1;
  const canPrev = cursorStack.length > 0 || Boolean(cursorParam);

  function clearSearch() {
    setQInput('');
    setCursorStack([]);
    applyFilters({ q: '', cursor: null });
  }

  function clearAllFilters() {
    setQInput('');
    setCursorStack([]);
    applyFilters({
      q: '',
      status: '',
      stock: '',
      hamper: '',
      storefrontLabel: '',
      recipient: '',
      occasion: '',
      category: '',
      sort: 'updated',
      cursor: null,
    });
  }

  function goNext() {
    if (!nextCursor) return;
    setCursorStack((s) => [...s, cursorParam]);
    applyFilters({ cursor: nextCursor });
  }

  function goPrev() {
    if (cursorStack.length === 0) {
      if (!cursorParam) return;
      applyFilters({ cursor: null });
      return;
    }
    const prev = cursorStack[cursorStack.length - 1] ?? '';
    setCursorStack((s) => s.slice(0, -1));
    applyFilters({ cursor: prev || null });
  }

  // Debounce URL search so typing doesn't hammer the API on every keystroke.
  useEffect(() => {
    const trimmed = qInput.trim();
    if (trimmed === filters.q) return;
    const t = window.setTimeout(() => {
      setCursorStack([]);
      applyFilters({ q: trimmed, cursor: null });
    }, 300);
    return () => window.clearTimeout(t);
  }, [qInput, filters.q, applyFilters]);

  async function publish(id: string) {
    setRowBusy(id);
    setError(null);
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/publish`, {
        method: 'POST',
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: updated.status,
              }
            : p,
        ),
      );
      setNotice('Published');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setRowBusy(null);
    }
  }

  async function unpublish(id: string) {
    setRowBusy(id);
    setError(null);
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/unpublish`, {
        method: 'POST',
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                status: updated.status,
              }
            : p,
        ),
      );
      setNotice('Moved to draft');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unpublish failed');
    } finally {
      setRowBusy(null);
    }
  }

  async function bulk(action: 'publish' | 'unpublish') {
    if (!selectedIds.length) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await apiAuth<{ results: Array<{ id: string; ok: boolean }> }>(
        '/admin/catalog/products/bulk',
        { method: 'POST', json: { ids: selectedIds, action } },
      );
      await load();
      setSelected({});
      const fail = res.results.filter((r) => !r.ok).length;
      if (fail) setError(`Bulk ${action} finished with ${fail} failure(s)`);
      else setNotice(`Bulk ${action} · ${selectedIds.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk failed');
    } finally {
      setBusy(false);
    }
  }

  const advancedFilterCount = [
    filters.stock,
    filters.hamper,
    filters.storefrontLabel,
    filters.recipient,
    filters.occasion,
    filters.category,
    filters.sort !== 'updated' ? filters.sort : '',
  ].filter(Boolean).length;

  const filterActive = Boolean(filters.q || filters.status || advancedFilterCount > 0);

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointerDown(e: MouseEvent) {
      const el = filtersPanelRef.current;
      if (el && !el.contains(e.target as Node)) setFiltersOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  return (
    <div>
      <OpsPageHeader
        title="Products"
        actions={
          <>
            {/* clay-btn-ghost sets display:inline-flex — wrap so Tailwind hidden wins on mobile */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                href="/admin/commerce/import"
                className="clay-btn-ghost min-h-10 items-center gap-1.5 text-sm"
              >
                <Upload className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Import
              </Link>
              <Link href="/admin/commerce/categories" className="clay-btn-ghost min-h-10 text-sm">
                Categories
              </Link>
              <Link href="/admin/commerce/merchandising" className="clay-btn-ghost min-h-10 text-sm">
                Merch
              </Link>
            </div>
            <Link href="/admin/commerce/products/new" className="clay-btn shrink-0 text-sm">
              New product
            </Link>
          </>
        }
      />

      <form
        className="mb-3 w-full max-w-xl"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters({ q: qInput, cursor: null });
        }}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search title, slug, or SKU"
            aria-label="Search products"
            autoComplete="off"
            enterKeyHint="search"
          />
          {qInput ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--primary)] opacity-70 hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:opacity-100"
              aria-label="Clear search"
              onClick={clearSearch}
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
            const active = filters.status === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={chipClass(active)}
                onClick={() => applyFilters({ status: c.value, cursor: null })}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="relative" ref={filtersPanelRef}>
            <button
              type="button"
              className={`clay-btn-secondary inline-flex min-h-8 items-center gap-1.5 px-2.5 text-xs sm:min-h-9 sm:px-3 sm:text-sm ${
                advancedFilterCount > 0 || filtersOpen
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : ''
              }`}
              aria-expanded={filtersOpen}
              aria-controls="products-filters-panel"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <ListFilter className="h-3.5 w-3.5 opacity-80" aria-hidden />
              Filters
              {advancedFilterCount > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold leading-5 text-[var(--primary-foreground)]">
                  {advancedFilterCount}
                </span>
              ) : null}
            </button>

            {filtersOpen ? (
              <div
                id="products-filters-panel"
                role="dialog"
                aria-label="Product filters"
                className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-lg"
              >
                <div className="grid grid-cols-1 gap-2.5">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Stock
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.stock}
                      aria-label="Stock"
                      onChange={(e) =>
                        applyFilters({ stock: e.target.value as StockFilter, cursor: null })
                      }
                    >
                      {STOCK_OPTIONS.map((o) => (
                        <option key={o.value || 'any-stock'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Type
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.hamper}
                      aria-label="Product type"
                      onChange={(e) =>
                        applyFilters({ hamper: e.target.value as HamperFilter, cursor: null })
                      }
                    >
                      {HAMPER_OPTIONS.map((o) => (
                        <option key={o.value || 'any-type'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Merch
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.storefrontLabel}
                      aria-label="Merchandising label"
                      onChange={(e) =>
                        applyFilters({
                          storefrontLabel: e.target.value as LabelFilter,
                          cursor: null,
                        })
                      }
                    >
                      {LABEL_OPTIONS.map((o) => (
                        <option key={o.value || 'any-merch'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Recipient
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.recipient}
                      aria-label="Recipient"
                      onChange={(e) =>
                        applyFilters({
                          recipient: e.target.value as RecipientFilter,
                          cursor: null,
                        })
                      }
                    >
                      {RECIPIENT_OPTIONS.map((o) => (
                        <option key={o.value || 'any-recipient'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Occasion
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.occasion}
                      aria-label="Occasion"
                      onChange={(e) =>
                        applyFilters({
                          occasion: e.target.value as OccasionFilter,
                          cursor: null,
                        })
                      }
                    >
                      {OCCASION_OPTIONS.map((o) => (
                        <option key={o.value || 'any-occasion'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Category
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.category}
                      aria-label="Category"
                      onChange={(e) => applyFilters({ category: e.target.value, cursor: null })}
                    >
                      <option value="">Any category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Sort
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={filters.sort}
                      aria-label="Sort products"
                      onChange={(e) =>
                        applyFilters({ sort: e.target.value as SortFilter, cursor: null })
                      }
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {advancedFilterCount > 0 ? (
                  <button
                    type="button"
                    className="clay-btn-ghost mt-3 min-h-8 w-full px-2 text-xs"
                    onClick={() => {
                      clearAllFilters();
                      setFiltersOpen(false);
                    }}
                  >
                    Clear filters
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
            {loading
              ? 'Loading…'
              : `${products.length} on this page${nextCursor ? ' · more' : ''}`}
          </span>
          {filterActive && !filtersOpen ? (
            <button
              type="button"
              className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
              onClick={clearAllFilters}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)]/95 px-3 py-2.5 text-sm shadow-sm backdrop-blur">
          <span className="font-medium tabular-nums">{selectedIds.length} selected</span>
          <button
            type="button"
            className="clay-btn min-h-9 px-3 text-xs disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulk('publish')}
          >
            Publish
          </button>
          <button
            type="button"
            className="clay-btn-secondary min-h-9 px-3 text-xs disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulk('unpublish')}
          >
            Unpublish
          </button>
          <button
            type="button"
            className="clay-btn-ghost min-h-9 text-xs sm:ml-auto"
            onClick={() => setSelected({})}
          >
            Clear
          </button>
        </div>
      ) : null}

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
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading products">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && products.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <Package className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No products match this filter.' : 'No products yet.'}
          </p>
          <Link href="/admin/commerce/products/new" className="clay-btn text-sm">
            New product
          </Link>
        </div>
      ) : null}

      {!loading && products.length > 0 ? (
        <>
          {/* Mobile: compact cards — title hierarchy, text actions, tags as meta */}
          <div className="md:hidden">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catalog-select-all-mobile"
                  aria-label="Select all products"
                  checked={allSelected}
                  onChange={(e) => {
                    const next: Record<string, boolean> = {};
                    for (const p of products) next[p.id] = e.target.checked;
                    setSelected(next);
                  }}
                />
                <label htmlFor="catalog-select-all-mobile" className="text-xs text-[var(--muted-foreground)]">
                  Select all
                </label>
              </div>
              <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                {products.length}
                {nextCursor ? '+' : ''} shown
              </span>
            </div>
            <ul className="space-y-2">
              {products.map((p) => {
                const avail = totalAvailable(p);
                const chips = tagChips(p);
                const low = avail <= 5;
                const sku = p.variants[0]?.sku;
                return (
                  <li key={p.id} className="clay-panel p-2.5">
                    <div className="flex gap-2.5">
                      <input
                        type="checkbox"
                        className="mt-3 shrink-0"
                        aria-label={`Select ${p.title}`}
                        checked={Boolean(selected[p.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                        }
                      />
                      <ProductThumb product={p} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/admin/commerce/products/${p.id}`}
                            className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                          >
                            {p.title}
                          </Link>
                          <span
                            className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(p.status)}`}
                          >
                            {statusLabel(p.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs tabular-nums text-[var(--muted-foreground)]">
                          <span className="font-medium text-[var(--foreground)]">
                            {formatInr(p.fromPricePaise)}
                          </span>
                          <span className={low ? ' font-medium text-amber-800' : ''}>
                            {' '}
                            · {avail} stock
                          </span>
                          {sku ? <span className="opacity-70"> · {sku}</span> : null}
                        </p>
                        {chips.length ? (
                          <p className="mt-1 truncate text-[11px] capitalize leading-snug text-[var(--muted-foreground)]">
                            {chips.map(formatTagLabel).join(' · ')}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-x-2.5 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2 text-xs">
                          <Link
                            href={`/admin/commerce/products/${p.id}`}
                            className="inline-flex items-center gap-1 font-semibold text-[var(--primary)]"
                          >
                            <Pencil className="h-3 w-3" aria-hidden />
                            Edit
                          </Link>
                          {p.status === 'PUBLISHED' ? (
                            <button
                              type="button"
                              className="text-[var(--muted-foreground)] disabled:opacity-50"
                              disabled={rowBusy === p.id}
                              onClick={() => void unpublish(p.id)}
                            >
                              Unpublish
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="font-medium text-[var(--foreground)] disabled:opacity-50"
                              disabled={rowBusy === p.id}
                              onClick={() => void publish(p.id)}
                            >
                              Publish
                            </button>
                          )}
                          {p.status === 'PUBLISHED' ? (
                            <Link
                              href={`/gift/products/${p.slug}`}
                              className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted-foreground)] hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] hover:text-[var(--foreground)]"
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`View ${p.title} on storefront`}
                            >
                              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Desktop: denser power table */}
          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[48rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select all"
                          checked={allSelected}
                          onChange={(e) => {
                            const next: Record<string, boolean> = {};
                            for (const p of products) next[p.id] = e.target.checked;
                            setSelected(next);
                          }}
                        />
                      </th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Product</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Status</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Stock</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Tags</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">From</th>
                      <th className="px-2 py-2.5 pr-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const avail = totalAvailable(p);
                      const chips = tagChips(p);
                      const low = avail <= 5;
                      const selectedRow = Boolean(selected[p.id]);
                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-[var(--border-subtle)] last:border-0 transition-colors ${
                            selectedRow
                              ? 'bg-[color-mix(in_srgb,var(--primary)_6%,transparent)]'
                              : 'hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]'
                          }`}
                        >
                          <td className="px-3 py-2.5 align-middle">
                            <input
                              type="checkbox"
                              aria-label={`Select ${p.title}`}
                              checked={selectedRow}
                              onChange={(e) =>
                                setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                              }
                            />
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <div className="flex items-center gap-3">
                              <ProductThumb product={p} />
                              <div className="min-w-0">
                                <Link
                                  href={`/admin/commerce/products/${p.id}`}
                                  className="font-medium underline-offset-2 hover:underline"
                                >
                                  {p.title}
                                </Link>
                                {p.variants[0]?.sku ? (
                                  <p className="mt-0.5 truncate text-[11px] tabular-nums opacity-50">
                                    {p.variants[0].sku}
                                    {p.variants.length > 1
                                      ? ` · +${p.variants.length - 1} variants`
                                      : ''}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(p.status)}`}
                            >
                              {statusLabel(p.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <div className="flex items-baseline gap-2">
                              <span
                                className={`tabular-nums ${low ? 'font-semibold text-amber-800' : ''}`}
                              >
                                {avail}
                              </span>
                              <Link
                                href={`/admin/commerce/inventory?q=${encodeURIComponent(p.variants[0]?.sku ?? p.slug)}`}
                                className="text-[11px] opacity-50 underline-offset-2 hover:opacity-90 hover:underline"
                              >
                                Ledger
                              </Link>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle">
                            <div className="flex max-w-[12rem] flex-wrap gap-1">
                              {chips.length ? (
                                chips.map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 text-[10px] capitalize tracking-wide opacity-75"
                                  >
                                    {formatTagLabel(t)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs opacity-40">—</span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2.5 pr-4 align-middle whitespace-nowrap tabular-nums">
                            {formatInr(p.fromPricePaise)}
                          </td>
                          <td className="px-2 py-2.5 pr-3 align-middle">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Link
                                href={`/admin/commerce/products/${p.id}`}
                                className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
                              >
                                <Pencil className="h-3 w-3 opacity-70" aria-hidden />
                                Edit
                              </Link>
                              {p.status === 'PUBLISHED' ? (
                                <button
                                  type="button"
                                  className="clay-btn-ghost min-h-8 px-2 text-xs disabled:opacity-50"
                                  disabled={rowBusy === p.id}
                                  onClick={() => void unpublish(p.id)}
                                >
                                  Unpublish
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="clay-btn-ghost min-h-8 px-2 text-xs disabled:opacity-50"
                                  disabled={rowBusy === p.id}
                                  onClick={() => void publish(p.id)}
                                >
                                  Publish
                                </button>
                              )}
                              {p.status === 'PUBLISHED' ? (
                                <Link
                                  href={`/gift/products/${p.slug}`}
                                  className="clay-btn-ghost inline-flex min-h-8 items-center gap-1 px-2 text-xs"
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`View ${p.title} on storefront`}
                                >
                                  <ExternalLink className="h-3 w-3 opacity-70" aria-hidden />
                                  View
                                </Link>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </OpsTableScroll>
          </div>
        </>
      ) : null}

      {!loading && products.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-xs disabled:opacity-40"
            disabled={!canPrev || loading}
            onClick={goPrev}
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            Prev
          </button>
          <span className="tabular-nums text-xs opacity-60">
            Page {pageIndex}
            {pageLimit ? ` · ${pageLimit}/page` : ''}
          </span>
          <button
            type="button"
            className="clay-btn-secondary inline-flex min-h-9 items-center gap-1 px-3 text-xs disabled:opacity-40"
            disabled={!nextCursor || loading}
            onClick={goNext}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="clay-panel space-y-3 p-4">
          <div className="h-6 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-10 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
        </div>
      }
    >
      <ProductsDeskInner />
    </Suspense>
  );
}
