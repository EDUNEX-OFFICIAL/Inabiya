'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, FolderOpen, ListFilter, Pencil, Search, Trash2, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass, opsRowActionClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';
import { OpsSortTh } from '@/components/commerce-ops/ops-sort-th';

type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  createdAt?: string;
  status: 'DRAFT' | 'PUBLISHED';
  membershipMode: 'MANUAL' | 'SMART';
  productCount: number;
};

type ModeFilter = '' | 'MANUAL' | 'SMART';
type StatusFilter = '' | 'DRAFT' | 'PUBLISHED';
type SortFilter = 'created' | 'title_asc' | 'title_desc' | 'products_asc' | 'products_desc';

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
];

const TYPE_OPTIONS: Array<{ value: ModeFilter; label: string }> = [
  { value: '', label: 'Any type' },
  { value: 'MANUAL', label: 'Hand-picked' },
  { value: 'SMART', label: 'Smart' },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: 'created', label: 'Newest created' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'products_desc', label: 'Most products' },
  { value: 'products_asc', label: 'Fewest products' },
];

function filterSelectClass(): string {
  return 'clay-input min-h-9 w-full min-w-0 text-sm';
}

function nextTitleSort(current: SortFilter): SortFilter {
  if (current === 'title_asc') return 'title_desc';
  if (current === 'title_desc') return 'created';
  return 'title_asc';
}

function nextProductsSort(current: SortFilter): SortFilter {
  if (current === 'products_desc') return 'products_asc';
  if (current === 'products_asc') return 'created';
  return 'products_desc';
}

export default function CollectionsDeskPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<ModeFilter>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [sort, setSort] = useState<SortFilter>('created');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAuth<CollectionRow[]>('/admin/catalog/collections');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/collections'));
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [qInput]);

  const advancedFilterCount = [mode].filter(Boolean).length;
  const filterActive = Boolean(q || status || advancedFilterCount > 0 || sort !== 'created');

  useEffect(() => {
    if (!filtersOpen) return;
    function onPointerDown(e: MouseEvent) {
      const el = filtersPanelRef.current;
      if (el && !el.contains(e.target as Node)) setFiltersOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFiltersOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [filtersOpen]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    let list = rows;
    if (needle) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(needle) ||
          c.slug.toLowerCase().includes(needle) ||
          (c.description ?? '').toLowerCase().includes(needle),
      );
    }
    if (mode) list = list.filter((c) => c.membershipMode === mode);
    if (status) list = list.filter((c) => c.status === status);
    return [...list].sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'title_desc') return b.title.localeCompare(a.title);
      if (sort === 'products_desc') {
        return b.productCount - a.productCount || a.title.localeCompare(b.title);
      }
      if (sort === 'products_asc') {
        return a.productCount - b.productCount || a.title.localeCompare(b.title);
      }
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta || a.title.localeCompare(b.title);
    });
  }, [rows, q, mode, status, sort]);

  function clearSearch() {
    setQInput('');
    setQ('');
  }

  function clearAllFilters() {
    setQInput('');
    setQ('');
    setMode('');
    setStatus('');
    setSort('created');
  }

  async function onDelete(id: string) {
    const row = rows.find((c) => c.id === id);
    if (row && row.membershipMode === 'MANUAL' && row.productCount > 0) {
      setError('Unassign products from this collection before deleting.');
      setConfirmDeleteId(null);
      return;
    }
    setBusy(true);
    try {
      await apiAuth(`/admin/catalog/collections/${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      setNotice('Collection deleted');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Collections"
        actions={
          <>
            <Link href="/admin/commerce/products" className="clay-btn-ghost min-h-10 text-sm">
              Products
            </Link>
            <Link href="/admin/commerce/collections/new" className="clay-btn shrink-0 text-sm">
              New collection
            </Link>
          </>
        }
      />

      <form
        className="mb-3 w-full max-w-xl"
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(qInput.trim());
        }}
      >
        <div className="flex min-h-9 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] px-3 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--primary)] opacity-70" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50 [&::-webkit-search-cancel-button]:hidden"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search title or slug"
            aria-label="Search collections"
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
            const active = status === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => setStatus(c.value)}
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
              aria-controls="collections-filters-panel"
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
                id="collections-filters-panel"
                role="dialog"
                aria-label="Collection filters"
                className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-lg"
              >
                <div className="grid grid-cols-1 gap-2.5">
                  <label className="block min-w-0">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Type
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={mode}
                      aria-label="Collection type"
                      onChange={(e) => setMode(e.target.value as ModeFilter)}
                    >
                      {TYPE_OPTIONS.map((o) => (
                        <option key={o.value || 'any-type'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block min-w-0 md:hidden">
                    <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                      Sort
                    </span>
                    <select
                      className={filterSelectClass()}
                      value={sort}
                      aria-label="Sort collections"
                      onChange={(e) => setSort(e.target.value as SortFilter)}
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
            {loading ? 'Loading…' : `${filtered.length} of ${rows.length}`}
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

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <FolderOpen className="h-8 w-8 opacity-30" />
          <p className="text-sm opacity-70">
            {filterActive ? 'No collections match this filter.' : 'No collections yet.'}
          </p>
          {filterActive ? (
            <button type="button" className="clay-btn-ghost text-sm" onClick={clearAllFilters}>
              Clear filters
            </button>
          ) : (
            <Link href="/admin/commerce/collections/new" className="clay-btn text-sm">
              New collection
            </Link>
          )}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="hidden md:block">
          <OpsTableScroll>
            <div className="clay-panel overflow-hidden">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)]">
                    <OpsSortTh
                      label="Title"
                      className="px-3 pr-4"
                      active={sort === 'title_asc' || sort === 'title_desc'}
                      direction={sort === 'title_desc' ? 'desc' : 'asc'}
                      onSort={() => setSort(nextTitleSort(sort))}
                    />
                    <OpsSortTh label="Slug" />
                    <OpsSortTh label="Type" />
                    <OpsSortTh label="Status" />
                    <OpsSortTh
                      label="Products"
                      active={sort === 'products_asc' || sort === 'products_desc'}
                      direction={sort === 'products_asc' ? 'asc' : 'desc'}
                      onSort={() => setSort(nextProductsSort(sort))}
                    />
                    <OpsSortTh label="Actions" align="right" className="pr-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <Fragment key={c.id}>
                      <tr className="border-b border-[var(--border-subtle)]">
                        <td className="px-3 py-2.5 font-medium">
                          <Link
                            href={`/admin/commerce/collections/${c.id}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {c.title}
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-xs opacity-70">{c.slug}</td>
                        <td className="px-2 py-2.5 text-xs">
                          {c.membershipMode === 'SMART' ? 'Smart' : 'Hand-picked'}
                        </td>
                        <td className="px-2 py-2.5 text-xs">{c.status}</td>
                        <td className="px-2 py-2.5 tabular-nums">
                          {c.membershipMode === 'SMART' ? `~${c.productCount}` : c.productCount}
                        </td>
                        <td className="px-2 py-2.5">
                          <div className="flex justify-end gap-0.5">
                            <Link
                              href={`/admin/commerce/collections/${c.id}`}
                              className={opsRowActionClass}
                              aria-label={`Edit ${c.title}`}
                            >
                              <Pencil className="h-4 w-4 opacity-70" aria-hidden />
                              <span className="hidden sm:inline">Edit</span>
                            </Link>
                            <Link
                              href={`/collections/${c.slug}`}
                              target="_blank"
                              className={opsRowActionClass}
                              aria-label={`View ${c.title} storefront`}
                            >
                              <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
                              <span className="hidden sm:inline">View</span>
                            </Link>
                            <button
                              type="button"
                              className={`${opsRowActionClass} text-red-700`}
                              disabled={c.membershipMode === 'MANUAL' && c.productCount > 0}
                              aria-label={`Delete ${c.title}`}
                              onClick={() => setConfirmDeleteId(c.id)}
                            >
                              <Trash2 className="h-4 w-4 opacity-70" aria-hidden />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {confirmDeleteId === c.id ? (
                        <tr className="border-b border-[var(--border-subtle)]">
                          <td
                            colSpan={6}
                            className="bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] px-3 py-3"
                          >
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span>Delete {c.title}?</span>
                              <button
                                type="button"
                                className="clay-btn min-h-9 bg-red-600 px-3 text-xs text-white"
                                disabled={busy}
                                onClick={() => void onDelete(c.id)}
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                className="clay-btn-ghost min-h-9 text-xs"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </OpsTableScroll>
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <ul className="space-y-2 md:hidden">
          {filtered.map((c) => (
            <li key={c.id} className="clay-panel p-3">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/commerce/collections/${c.id}`}
                    className="block text-sm font-semibold leading-snug underline-offset-2 hover:underline"
                  >
                    {c.title}
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-[var(--muted-foreground)]">
                    {c.slug}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] px-2 py-0.5 text-[10px] font-medium">
                      {c.membershipMode === 'SMART' ? 'Smart' : 'Hand-picked'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.status === 'PUBLISHED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-amber-50 text-amber-900'
                      }`}
                    >
                      {c.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[11px] tabular-nums text-[var(--muted-foreground)]">
                      {c.membershipMode === 'SMART' ? `~${c.productCount}` : c.productCount}{' '}
                      products
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5">
                  <Link
                    href={`/admin/commerce/collections/${c.id}`}
                    className={opsRowActionClass}
                    aria-label={`Edit ${c.title}`}
                  >
                    <Pencil className="h-4 w-4 opacity-70" aria-hidden />
                  </Link>
                  <Link
                    href={`/collections/${c.slug}`}
                    target="_blank"
                    className={opsRowActionClass}
                    aria-label={`View ${c.title} storefront`}
                  >
                    <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
