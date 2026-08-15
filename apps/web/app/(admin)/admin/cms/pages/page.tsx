'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, ExternalLink, FileText, ListFilter, Pencil, Search, Trash2, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser, loginUrl } from '@/lib/auth-client';
import { opsChipClass, opsRowActionClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';
import { OpsSortTh } from '@/components/commerce-ops/ops-sort-th';
import { duplicateSlug, toEditable, toPayload } from '@/components/cms/page-builder/cms-page-model';
import { defaultPathForCmsSlug } from '@/lib/cms-seo';

type PageRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  blockCount: number;
  isHomepage?: boolean;
};

type StatusFilter = '' | 'DRAFT' | 'PUBLISHED';
type SortFilter = 'updated' | 'title_asc' | 'title_desc' | 'blocks_desc';

const STATUS_CHIPS: Array<{ value: StatusFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'title_asc', label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'blocks_desc', label: 'Most blocks' },
];

function filterSelectClass(): string {
  return 'clay-input min-h-9 w-full min-w-0 text-sm';
}

function statusLabel(status: string): string {
  if (status === 'PUBLISHED') return 'Published';
  if (status === 'DRAFT') return 'Draft';
  return status;
}

function statusTone(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return '—';
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function publicPath(row: PageRow): string {
  return defaultPathForCmsSlug(row.slug);
}

function isLockedHome(row: PageRow): boolean {
  return row.slug === 'home' || Boolean(row.isHomepage);
}

function nextTitleSort(current: SortFilter): SortFilter {
  if (current === 'title_asc') return 'title_desc';
  if (current === 'title_desc') return 'updated';
  return 'title_asc';
}

function PageThumb() {
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] text-[color:var(--muted-foreground)]"
      aria-hidden
    >
      <FileText className="h-4 w-4 opacity-50" />
    </span>
  );
}

export default function AdminCmsPagesListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PageRow[]>([]);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [sort, setSort] = useState<SortFilter>('updated');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersPanelRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiAuth<PageRow[]>('/admin/cms/pages');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/cms/pages'));
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [qInput]);

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

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    const list = rows.filter((r) => {
      if (status && r.status !== status) return false;
      if (!needle) return true;
      return r.title.toLowerCase().includes(needle) || r.slug.toLowerCase().includes(needle);
    });
    const copy = [...list];
    copy.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'title_desc') return b.title.localeCompare(a.title);
      if (sort === 'blocks_desc') return b.blockCount - a.blockCount;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    return copy;
  }, [rows, q, status, sort]);

  const selectedIds = useMemo(
    () => filtered.filter((r) => selected[r.id]).map((r) => r.id),
    [filtered, selected],
  );
  const allSelected = filtered.length > 0 && filtered.every((r) => selected[r.id]);
  const filterActive = Boolean(q || status || sort !== 'updated');
  const advancedFilterCount = sort !== 'updated' ? 1 : 0;

  function clearSearch() {
    setQInput('');
    setQ('');
  }

  function clearAllFilters() {
    setQInput('');
    setQ('');
    setStatus('');
    setSort('updated');
  }

  async function onDuplicate(row: PageRow) {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const full = await apiAuth<{
        title: string;
        blocks: Array<{ id: string; type: string; props: Record<string, unknown> }>;
      }>(`/admin/cms/pages/${row.id}`);
      const created = await apiAuth<{ id: string }>('/admin/cms/pages', {
        method: 'POST',
        json: {
          title: `${full.title} copy`,
          slug: duplicateSlug(row.slug),
          blocks: toPayload(toEditable(full.blocks)),
        },
      });
      router.push(`/admin/cms/pages/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duplicate failed');
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await apiAuth(`/admin/cms/pages/${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      setSelected((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setNotice('Page deleted');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setBusyId(null);
    }
  }

  async function onTogglePublish(row: PageRow) {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const action = row.status === 'PUBLISHED' ? 'unpublish' : 'publish';
      await apiAuth(`/admin/cms/pages/${row.id}/${action}`, { method: 'POST' });
      setNotice(action === 'publish' ? 'Published' : 'Unpublished');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  async function bulk(action: 'publish' | 'unpublish') {
    if (!selectedIds.length) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    let fail = 0;
    for (const id of selectedIds) {
      try {
        await apiAuth(`/admin/cms/pages/${id}/${action}`, { method: 'POST' });
      } catch {
        fail += 1;
      }
    }
    await load();
    setSelected({});
    if (fail) setError(`Bulk ${action} finished with ${fail} failure(s)`);
    else setNotice(`Bulk ${action} · ${selectedIds.length}`);
    setBusy(false);
  }

  const roles = getStoredUser()?.roles ?? [];
  const canEditChrome = roles.includes('COMMERCE_ADMIN') || roles.includes('SUPER_ADMIN');

  function rowActions(r: PageRow, compact = false) {
    const path = publicPath(r);
    const locked = isLockedHome(r);
    const labelClass = compact ? '' : 'hidden sm:inline';
    return (
      <div className="flex flex-wrap items-center gap-0.5">
        <Link
          href={`/admin/cms/pages/${r.id}`}
          className={`${opsRowActionClass} text-[var(--primary)]`}
          aria-label={`Edit ${r.title}`}
        >
          <Pencil className="h-4 w-4 opacity-70" aria-hidden />
          <span className={labelClass}>Edit</span>
        </Link>
        {locked && r.status === 'PUBLISHED' ? null : (
          <button
            type="button"
            className={opsRowActionClass}
            disabled={busyId === r.id}
            onClick={() => void onTogglePublish(r)}
          >
            {r.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
          </button>
        )}
        {r.status === 'PUBLISHED' ? (
          <Link
            href={path}
            className={opsRowActionClass}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${r.title}`}
          >
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            <span className={labelClass}>View</span>
          </Link>
        ) : (
          <Link
            href={`/pages/preview/${r.id}`}
            className={opsRowActionClass}
            target="_blank"
            rel="noreferrer"
            aria-label={`Preview ${r.title}`}
          >
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
            <span className={labelClass}>Preview</span>
          </Link>
        )}
        <button
          type="button"
          className={opsRowActionClass}
          aria-label={`Duplicate ${r.title}`}
          disabled={busyId === r.id}
          onClick={() => void onDuplicate(r)}
        >
          <Copy className="h-3.5 w-3.5 opacity-70" aria-hidden />
          <span className={labelClass}>Duplicate</span>
        </button>
        {locked ? null : confirmDeleteId === r.id ? (
          <span className="inline-flex items-center gap-1 px-1 text-xs">
            <button
              type="button"
              className="font-medium text-red-700 underline"
              disabled={busyId === r.id}
              onClick={() => void onDelete(r.id)}
            >
              Delete
            </button>
            <button type="button" className="opacity-70" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            className={opsRowActionClass}
            aria-label={`Delete ${r.title}`}
            onClick={() => setConfirmDeleteId(r.id)}
          >
            <Trash2 className="h-3.5 w-3.5 opacity-70" aria-hidden />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <OpsPageHeader
        title="Pages"
        actions={
          <>
            {canEditChrome ? (
              <div className="hidden items-center gap-2 sm:flex">
                <Link href="/admin/cms/gift-chrome" className="clay-btn-ghost min-h-10 text-sm">
                  Nav & footer
                </Link>
              </div>
            ) : null}
            <Link href="/admin/cms/pages/new" className="clay-btn shrink-0 text-sm">
              New page
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
            aria-label="Search pages"
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
              aria-controls="cms-pages-filters-panel"
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
                id="cms-pages-filters-panel"
                role="dialog"
                aria-label="Page filters"
                className="absolute right-0 z-30 mt-2 w-[min(100vw-2rem,18rem)] rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] p-3 shadow-lg"
              >
                <label className="block min-w-0">
                  <span className="mb-1 block text-[11px] font-medium text-[var(--muted-foreground)]">
                    Sort
                  </span>
                  <select
                    className={filterSelectClass()}
                    value={sort}
                    aria-label="Sort pages"
                    onChange={(e) => setSort(e.target.value as SortFilter)}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                {advancedFilterCount > 0 ? (
                  <button
                    type="button"
                    className="clay-btn-ghost mt-3 min-h-8 w-full px-2 text-xs"
                    onClick={() => {
                      setSort('updated');
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
            {loading ? 'Loading…' : `${filtered.length} on this page`}
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
        <p
          className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
          role="status"
        >
          {notice}
        </p>
      ) : null}

      {loading ? (
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading pages">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-11 w-11 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
              <div className="h-3 flex-1 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
            </div>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <FileText className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {rows.length === 0 ? 'No pages yet.' : 'No pages match this filter.'}
          </p>
          {rows.length === 0 ? (
            <Link href="/admin/cms/pages/new" className="clay-btn text-sm">
              New page
            </Link>
          ) : (
            <button type="button" className="clay-btn-ghost text-sm" onClick={clearAllFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <>
          <div className="md:hidden">
            <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cms-pages-select-all-mobile"
                  aria-label="Select all pages"
                  checked={allSelected}
                  onChange={(e) => {
                    const next: Record<string, boolean> = {};
                    for (const r of filtered) next[r.id] = e.target.checked;
                    setSelected(next);
                  }}
                />
                <label
                  htmlFor="cms-pages-select-all-mobile"
                  className="text-xs text-[var(--muted-foreground)]"
                >
                  Select all
                </label>
              </div>
              <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                {filtered.length} shown
              </span>
            </div>
            <ul className="space-y-2">
              {filtered.map((r) => {
                const path = publicPath(r);
                const locked = isLockedHome(r);
                return (
                  <li key={r.id} className="clay-panel p-2.5">
                    <div className="flex gap-2.5">
                      <input
                        type="checkbox"
                        className="mt-3 shrink-0"
                        aria-label={`Select ${r.title}`}
                        checked={Boolean(selected[r.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                        }
                      />
                      <PageThumb />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Link
                            href={`/admin/cms/pages/${r.id}`}
                            className="min-w-0 flex-1 text-sm font-semibold leading-snug text-[var(--foreground)] underline-offset-2 hover:underline"
                          >
                            {r.title}
                          </Link>
                          <span
                            className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(r.status)}`}
                          >
                            {statusLabel(r.status)}
                          </span>
                        </div>
                        <p className="mt-0.5 break-all font-mono text-[11px] text-[var(--muted-foreground)]">
                          {path}
                          {locked ? ' · Homepage' : null}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                          {r.blockCount} blocks · {relativeAge(r.updatedAt)}
                        </p>
                        <div className="mt-2 border-t border-[color-mix(in_srgb,var(--foreground)_8%,transparent)] pt-2">
                          {rowActions(r, true)}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <table className="w-full min-w-[44rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)]">
                    <th className="w-10 py-2.5 pl-1 pr-2">
                      <input
                        type="checkbox"
                        aria-label="Select all pages"
                        checked={allSelected}
                        onChange={(e) => {
                          const next: Record<string, boolean> = {};
                          for (const r of filtered) next[r.id] = e.target.checked;
                          setSelected(next);
                        }}
                      />
                    </th>
                    <OpsSortTh
                      label="Page"
                      onSort={() => setSort(nextTitleSort(sort))}
                      active={sort === 'title_asc' || sort === 'title_desc'}
                      direction={sort === 'title_desc' ? 'desc' : 'asc'}
                    />
                    <OpsSortTh label="Status" />
                    <OpsSortTh
                      label="Blocks"
                      align="right"
                      onSort={() =>
                        setSort((s) => (s === 'blocks_desc' ? 'updated' : 'blocks_desc'))
                      }
                      active={sort === 'blocks_desc'}
                      direction="desc"
                    />
                    <OpsSortTh
                      label="Updated"
                      onSort={() => setSort('updated')}
                      active={sort === 'updated'}
                      direction="desc"
                    />
                    <th className="py-2.5 pl-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const path = publicPath(r);
                    const locked = isLockedHome(r);
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-[var(--border-subtle)] last:border-0"
                      >
                        <td className="py-2.5 pl-1 pr-2 align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select ${r.title}`}
                            checked={Boolean(selected[r.id])}
                            onChange={(e) =>
                              setSelected((prev) => ({ ...prev, [r.id]: e.target.checked }))
                            }
                          />
                        </td>
                        <td className="py-2.5 pr-4 align-middle">
                          <div className="flex items-center gap-3">
                            <PageThumb />
                            <div className="min-w-0">
                              <Link
                                href={`/admin/cms/pages/${r.id}`}
                                className="font-medium underline-offset-2 hover:underline"
                              >
                                {r.title}
                              </Link>
                              <p className="ops-muted mt-0.5 break-all font-mono text-[11px]">
                                {path}
                                {locked ? (
                                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900">
                                    Homepage
                                  </span>
                                ) : null}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 align-middle">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${statusTone(r.status)}`}
                          >
                            {statusLabel(r.status)}
                          </span>
                        </td>
                        <td className="ops-muted py-2.5 pr-4 text-right align-middle tabular-nums">
                          {r.blockCount}
                        </td>
                        <td className="ops-muted py-2.5 pr-4 align-middle whitespace-nowrap">
                          {relativeAge(r.updatedAt)}
                        </td>
                        <td className="py-2.5 pl-2 align-middle">
                          <div className="flex justify-end">{rowActions(r)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </OpsTableScroll>
          </div>
        </>
      ) : null}
    </div>
  );
}
