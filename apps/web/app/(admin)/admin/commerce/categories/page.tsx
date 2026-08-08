'use client';

import Link from 'next/link';
import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Pencil, Search, Trash2, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  productCount: number;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
};

const EMPTY_FORM: CategoryForm = {
  name: '',
  slug: '',
  description: '',
  sortOrder: '0',
};

type StockFilter = '' | 'used' | 'empty';
type SortFilter = 'sort' | 'name_asc' | 'name_desc' | 'products_desc' | 'products_asc';

const STOCK_CHIPS: Array<{ value: StockFilter; label: string }> = [
  { value: '', label: 'All' },
  { value: 'used', label: 'With products' },
  { value: 'empty', label: 'Empty' },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: 'sort', label: 'Sort order' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'products_desc', label: 'Most products' },
  { value: 'products_asc', label: 'Fewest products' },
];


function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseSortOrder(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function CategoryFields({
  form,
  onChange,
  slugDirty,
  onSlugDirty,
  idPrefix,
}: {
  form: CategoryForm;
  onChange: (next: CategoryForm) => void;
  slugDirty: boolean;
  onSlugDirty: (v: boolean) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Name</span>
        <input
          id={`${idPrefix}-name`}
          className="clay-input min-h-10 w-full text-sm"
          value={form.name}
          onChange={(e) => {
            const name = e.target.value;
            onChange({
              ...form,
              name,
              slug: slugDirty ? form.slug : slugify(name),
            });
          }}
          required
          autoComplete="off"
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Slug</span>
        <input
          id={`${idPrefix}-slug`}
          className="clay-input min-h-10 w-full font-mono text-sm"
          value={form.slug}
          onChange={(e) => {
            onSlugDirty(true);
            onChange({ ...form, slug: e.target.value });
          }}
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          required
          autoComplete="off"
        />
      </label>
      <label className="block text-xs sm:col-span-2">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Description</span>
        <input
          id={`${idPrefix}-description`}
          className="clay-input min-h-10 w-full text-sm"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          autoComplete="off"
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Sort order</span>
        <input
          id={`${idPrefix}-sort`}
          type="number"
          className="clay-input min-h-10 w-full text-sm"
          value={form.sortOrder}
          onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
        />
      </label>
    </div>
  );
}

function ProductCount({ c }: { c: Category }) {
  if (c.productCount <= 0) {
    return <span className="tabular-nums text-[var(--muted-foreground)]">0</span>;
  }
  return (
    <Link
      href={`/admin/commerce/products?category=${encodeURIComponent(c.slug)}`}
      className="tabular-nums font-medium text-[var(--primary)] underline-offset-2 hover:underline"
    >
      {c.productCount}
    </Link>
  );
}

export default function CategoriesDeskPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>([]);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [stock, setStock] = useState<StockFilter>('');
  const [sort, setSort] = useState<SortFilter>('sort');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>(EMPTY_FORM);
  const [slugDirty, setSlugDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(EMPTY_FORM);
  const [editSlugDirty, setEditSlugDirty] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiAuth<Category[]>('/admin/catalog/categories');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/categories'));
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    const t = window.setTimeout(() => setQ(qInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [qInput]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    let list = rows;
    if (needle) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(needle) ||
          c.slug.toLowerCase().includes(needle) ||
          (c.description ?? '').toLowerCase().includes(needle),
      );
    }
    if (stock === 'used') list = list.filter((c) => c.productCount > 0);
    if (stock === 'empty') list = list.filter((c) => c.productCount === 0);

    const next = [...list];
    next.sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'name_desc') return b.name.localeCompare(a.name);
      if (sort === 'products_desc') return b.productCount - a.productCount || a.name.localeCompare(b.name);
      if (sort === 'products_asc') return a.productCount - b.productCount || a.name.localeCompare(b.name);
      // default: API sortOrder then name
      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    });
    return next;
  }, [rows, q, stock, sort]);

  const filterActive = Boolean(q || stock || sort !== 'sort');

  function clearFilters() {
    setQInput('');
    setQ('');
    setStock('');
    setSort('sort');
  }

  function openCreate() {
    setCreateOpen(true);
    setCreateForm(EMPTY_FORM);
    setSlugDirty(false);
    setEditingId(null);
    setConfirmDeleteId(null);
    setError(null);
    setNotice(null);
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      sortOrder: String(c.sortOrder),
    });
    setEditSlugDirty(true);
    setCreateOpen(false);
    setConfirmDeleteId(null);
    setError(null);
    setNotice(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(EMPTY_FORM);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiAuth('/admin/catalog/categories', {
        method: 'POST',
        json: {
          name: createForm.name.trim(),
          slug: createForm.slug.trim(),
          description: createForm.description.trim() || undefined,
          sortOrder: parseSortOrder(createForm.sortOrder),
        },
      });
      setCreateForm(EMPTY_FORM);
      setSlugDirty(false);
      setCreateOpen(false);
      setNotice('Category created');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiAuth(`/admin/catalog/categories/${editingId}`, {
        method: 'PATCH',
        json: {
          name: editForm.name.trim(),
          slug: editForm.slug.trim(),
          description: editForm.description.trim() || null,
          sortOrder: parseSortOrder(editForm.sortOrder),
        },
      });
      setEditingId(null);
      setNotice('Category updated');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    const row = rows.find((c) => c.id === id);
    if (row && row.productCount > 0) {
      setError('Unassign products from this category before deleting.');
      setConfirmDeleteId(null);
      return;
    }
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiAuth(`/admin/catalog/categories/${id}`, { method: 'DELETE' });
      setConfirmDeleteId(null);
      if (editingId === id) setEditingId(null);
      setNotice('Category deleted');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setBusy(false);
    }
  }

  function rowActions(c: Category) {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-1 font-medium text-[var(--foreground)] underline-offset-2 hover:underline"
          onClick={() => startEdit(c)}
        >
          <Pencil className="h-3.5 w-3.5 opacity-60" aria-hidden />
          Edit
        </button>
        <button
          type="button"
          className="inline-flex min-h-10 items-center gap-1 font-medium text-red-700 underline-offset-2 hover:underline disabled:opacity-40"
          disabled={c.productCount > 0}
          title={c.productCount > 0 ? 'Unassign products first' : undefined}
          onClick={() => {
            setConfirmDeleteId(c.id);
            setEditingId(null);
            setError(null);
          }}
        >
          <Trash2 className="h-3.5 w-3.5 opacity-60" aria-hidden />
          Delete
        </button>
      </div>
    );
  }

  function editPanel(c: Category) {
    if (editingId !== c.id) return null;
    return (
      <form onSubmit={(e) => void onSaveEdit(e)} className="clay-panel max-w-xl space-y-3 p-3">
        <CategoryFields
          form={editForm}
          onChange={setEditForm}
          slugDirty={editSlugDirty}
          onSlugDirty={setEditSlugDirty}
          idPrefix={`edit-${c.id}`}
        />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="clay-btn min-h-10 text-sm disabled:opacity-50" disabled={busy}>
            Save
          </button>
          <button
            type="button"
            className="clay-btn-secondary min-h-10 text-sm"
            onClick={cancelEdit}
            disabled={busy}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  function deleteConfirm(c: Category) {
    if (confirmDeleteId !== c.id) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-[var(--muted-foreground)]">Delete {c.name}?</span>
        <button
          type="button"
          className="clay-btn min-h-9 bg-red-600 px-3 text-xs text-white disabled:opacity-50"
          disabled={busy || c.productCount > 0}
          onClick={() => void onDelete(c.id)}
        >
          Delete
        </button>
        <button
          type="button"
          className="clay-btn-ghost min-h-9 text-xs"
          onClick={() => setConfirmDeleteId(null)}
          disabled={busy}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <OpsPageHeader
        title="Categories"
        actions={
          <>
            {/* clay-btn-ghost sets display:inline-flex — wrap so Tailwind hidden wins on mobile */}
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/admin/commerce/products" className="clay-btn-ghost min-h-10 text-sm">
                Products
              </Link>
            </div>
            <button type="button" className="clay-btn shrink-0 text-sm" onClick={openCreate}>
              New category
            </button>
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
            placeholder="Search name, slug, or description"
            aria-label="Search categories"
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
                setQ('');
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
          aria-label="Filter by products"
        >
          {STOCK_CHIPS.map((c) => {
            const active = stock === c.value;
            return (
              <button
                key={c.value || 'all'}
                type="button"
                aria-pressed={active}
                className={opsChipClass(active)}
                onClick={() => setStock(c.value)}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        <label className="flex shrink-0 items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <span className="hidden sm:inline">Sort</span>
          <select
            className="clay-input min-h-8 max-w-[11rem] py-1 text-xs sm:min-h-9 sm:text-sm"
            aria-label="Sort categories"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortFilter)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <span className="hidden text-xs text-[var(--muted-foreground)] sm:inline">
          {loading ? 'Loading…' : `${filtered.length} of ${rows.length}`}
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

      {createOpen ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="clay-panel mb-4 max-w-xl space-y-3 p-4"
        >
          <p className="text-sm font-medium">New category</p>
          <CategoryFields
            form={createForm}
            onChange={setCreateForm}
            slugDirty={slugDirty}
            onSlugDirty={setSlugDirty}
            idPrefix="create"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="clay-btn min-h-10 text-sm disabled:opacity-50" disabled={busy}>
              Create category
            </button>
            <button
              type="button"
              className="clay-btn-secondary min-h-10 text-sm"
              onClick={() => setCreateOpen(false)}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
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
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading categories">
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
          <FolderOpen className="h-8 w-8 opacity-30" aria-hidden />
          <p className="text-sm opacity-70">
            {filterActive ? 'No categories match this filter.' : 'No categories yet.'}
          </p>
          {!filterActive ? (
            <button type="button" className="clay-btn text-sm" onClick={openCreate}>
              New category
            </button>
          ) : (
            <button type="button" className="clay-btn-secondary text-sm" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <>
          <div className="md:hidden">
            <p className="mb-2 px-0.5 text-xs tabular-nums text-[var(--muted-foreground)]">
              {filtered.length}
              {filterActive ? ` of ${rows.length}` : ''} shown
            </p>
            <ul className="space-y-2">
              {filtered.map((c) => (
                <li key={c.id} className="clay-panel p-2.5">
                  <p className="font-medium leading-snug text-[var(--foreground)]">{c.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-[var(--muted-foreground)]">{c.slug}</p>
                  {c.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">
                      {c.description}
                    </p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                    <span className="inline-flex items-center gap-1">
                      Products · <ProductCount c={c} />
                    </span>
                    <span className="tabular-nums">Sort · {c.sortOrder}</span>
                  </div>
                  <div className="mt-2">{rowActions(c)}</div>
                  {editingId === c.id || confirmDeleteId === c.id ? (
                    <div className="mt-3 space-y-3 border-t border-[var(--border-subtle)] pt-3">
                      {editPanel(c)}
                      {deleteConfirm(c)}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block">
            <OpsTableScroll>
              <div className="clay-panel overflow-hidden">
                <table className="w-full min-w-[36rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)] text-left text-[11px] uppercase tracking-wide opacity-55">
                      <th className="px-3 py-2.5 font-medium">Name</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Slug</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Products</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Sort</th>
                      <th className="px-2 py-2.5 pr-4 font-medium">Description</th>
                      <th className="px-2 py-2.5 pr-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => {
                      const expanded = editingId === c.id || confirmDeleteId === c.id;
                      return (
                        <Fragment key={c.id}>
                          <tr className="border-b border-[var(--border-subtle)] transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_3%,transparent)]">
                            <td className="px-3 py-2.5 align-middle font-medium">{c.name}</td>
                            <td className="px-2 py-2.5 pr-4 align-middle font-mono text-xs text-[var(--muted-foreground)]">
                              {c.slug}
                            </td>
                            <td className="px-2 py-2.5 pr-4 align-middle">
                              <ProductCount c={c} />
                            </td>
                            <td className="px-2 py-2.5 pr-4 align-middle tabular-nums text-[var(--muted-foreground)]">
                              {c.sortOrder}
                            </td>
                            <td className="max-w-[14rem] px-2 py-2.5 pr-4 align-middle text-[var(--muted-foreground)]">
                              <span className="line-clamp-2">{c.description ?? '—'}</span>
                            </td>
                            <td className="px-2 py-2.5 pr-3 align-middle">
                              <div className="flex justify-end">{rowActions(c)}</div>
                            </td>
                          </tr>
                          {expanded ? (
                            <tr className="border-b border-[var(--border-subtle)] last:border-0">
                              <td
                                colSpan={6}
                                className="bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] px-3 py-3"
                              >
                                <div className="space-y-3">
                                  {editPanel(c)}
                                  {deleteConfirm(c)}
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </OpsTableScroll>
          </div>
        </>
      ) : null}
    </div>
  );
}
