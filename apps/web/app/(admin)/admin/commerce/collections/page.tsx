'use client';

import Link from 'next/link';
import { FormEvent, Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Pencil, Search, Trash2, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
  membershipMode: 'MANUAL' | 'RULES';
  productCount: number;
  accent?: string;
  overline?: string | null;
  lockedLabel?: string | null;
  rules?: Record<string, unknown> | null;
  relatedSlugs?: string[];
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
};

type CollectionForm = {
  title: string;
  slug: string;
  description: string;
  sortOrder: string;
  status: 'DRAFT' | 'PUBLISHED';
  membershipMode: 'MANUAL' | 'RULES';
  overline: string;
  lockedLabel: string;
  accent: 'pink' | 'sky' | 'neutral';
  heroImageUrl: string;
  heroImageAlt: string;
  rulesJson: string;
  relatedSlugs: string;
};

const EMPTY_FORM: CollectionForm = {
  title: '',
  slug: '',
  description: '',
  sortOrder: '0',
  status: 'DRAFT',
  membershipMode: 'RULES',
  overline: '',
  lockedLabel: '',
  accent: 'neutral',
  heroImageUrl: '',
  heroImageAlt: '',
  rulesJson: '{}',
  relatedSlugs: '',
};

type StockFilter = '' | 'used' | 'empty';
type ModeFilter = '' | 'MANUAL' | 'RULES';
type StatusFilter = '' | 'DRAFT' | 'PUBLISHED';
type SortFilter = 'sort' | 'name_asc' | 'name_desc' | 'products_desc';

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

function formToBody(form: CollectionForm) {
  let rules: Record<string, unknown> | null = null;
  if (form.membershipMode === 'RULES') {
    try {
      rules = JSON.parse(form.rulesJson || '{}') as Record<string, unknown>;
    } catch {
      throw new Error('Rules must be valid JSON');
    }
  }
  return {
    title: form.title.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || undefined,
    sortOrder: parseSortOrder(form.sortOrder),
    status: form.status,
    membershipMode: form.membershipMode,
    overline: form.overline.trim() || undefined,
    lockedLabel: form.lockedLabel.trim() || undefined,
    accent: form.accent,
    heroImageUrl: form.heroImageUrl.trim() || undefined,
    heroImageAlt: form.heroImageAlt.trim() || undefined,
    rules,
    relatedSlugs: form.relatedSlugs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

function CollectionFields({
  form,
  onChange,
  slugDirty,
  onSlugDirty,
  idPrefix,
}: {
  form: CollectionForm;
  onChange: (next: CollectionForm) => void;
  slugDirty: boolean;
  onSlugDirty: (v: boolean) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Title</span>
        <input
          id={`${idPrefix}-title`}
          className="clay-input min-h-10 w-full text-sm"
          value={form.title}
          onChange={(e) => {
            const title = e.target.value;
            onChange({
              ...form,
              title,
              slug: slugDirty ? form.slug : slugify(title),
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
          className="clay-input min-h-10 w-full text-sm"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Mode</span>
        <select
          className="clay-input min-h-10 w-full text-sm"
          value={form.membershipMode}
          onChange={(e) =>
            onChange({ ...form, membershipMode: e.target.value as 'MANUAL' | 'RULES' })
          }
        >
          <option value="RULES">Rules (auto)</option>
          <option value="MANUAL">Manual products</option>
        </select>
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Status</span>
        <select
          className="clay-input min-h-10 w-full text-sm"
          value={form.status}
          onChange={(e) => onChange({ ...form, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
        >
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Sort order</span>
        <input
          type="number"
          className="clay-input min-h-10 w-full text-sm"
          value={form.sortOrder}
          onChange={(e) => onChange({ ...form, sortOrder: e.target.value })}
        />
      </label>
      <label className="block text-xs">
        <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Accent</span>
        <select
          className="clay-input min-h-10 w-full text-sm"
          value={form.accent}
          onChange={(e) =>
            onChange({ ...form, accent: e.target.value as 'pink' | 'sky' | 'neutral' })
          }
        >
          <option value="neutral">Neutral</option>
          <option value="pink">Pink</option>
          <option value="sky">Sky</option>
        </select>
      </label>
      {form.membershipMode === 'RULES' ? (
        <label className="block text-xs sm:col-span-2">
          <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Rules JSON</span>
          <textarea
            className="clay-input min-h-20 w-full font-mono text-xs"
            value={form.rulesJson}
            onChange={(e) => onChange({ ...form, rulesJson: e.target.value })}
          />
        </label>
      ) : null}
    </div>
  );
}

function ProductCount({ c }: { c: CollectionRow }) {
  if (c.membershipMode === 'RULES') {
    return <span className="text-[var(--muted-foreground)]">Rules</span>;
  }
  if (c.productCount <= 0) {
    return <span className="tabular-nums text-[var(--muted-foreground)]">0</span>;
  }
  return (
    <Link
      href={`/admin/commerce/products?collection=${encodeURIComponent(c.slug)}`}
      className="tabular-nums font-medium text-[var(--primary)] underline-offset-2 hover:underline"
    >
      {c.productCount}
    </Link>
  );
}

export default function CollectionsDeskPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [stock, setStock] = useState<StockFilter>('');
  const [mode, setMode] = useState<ModeFilter>('');
  const [status, setStatus] = useState<StatusFilter>('');
  const [sort, setSort] = useState<SortFilter>('sort');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CollectionForm>(EMPTY_FORM);
  const [slugDirty, setSlugDirty] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CollectionForm>(EMPTY_FORM);
  const [editSlugDirty, setEditSlugDirty] = useState(true);
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
    if (stock === 'used') list = list.filter((c) => c.membershipMode === 'MANUAL' && c.productCount > 0);
    if (stock === 'empty') list = list.filter((c) => c.membershipMode === 'MANUAL' && c.productCount === 0);
    if (mode) list = list.filter((c) => c.membershipMode === mode);
    if (status) list = list.filter((c) => c.status === status);

    const next = [...list];
    next.sort((a, b) => {
      if (sort === 'name_asc') return a.title.localeCompare(b.title);
      if (sort === 'name_desc') return b.title.localeCompare(a.title);
      if (sort === 'products_desc') return b.productCount - a.productCount || a.title.localeCompare(b.title);
      return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
    });
    return next;
  }, [rows, q, stock, mode, status, sort]);

  function rowToForm(c: CollectionRow): CollectionForm {
    return {
      title: c.title,
      slug: c.slug,
      description: c.description ?? '',
      sortOrder: String(c.sortOrder),
      status: c.status,
      membershipMode: c.membershipMode,
      overline: c.overline ?? '',
      lockedLabel: c.lockedLabel ?? '',
      accent: (c.accent as 'pink' | 'sky' | 'neutral') || 'neutral',
      heroImageUrl: c.heroImageUrl ?? '',
      heroImageAlt: c.heroImageAlt ?? '',
      rulesJson: JSON.stringify(c.rules ?? {}, null, 2),
      relatedSlugs: (c.relatedSlugs ?? []).join(', '),
    };
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await apiAuth('/admin/catalog/collections', {
        method: 'POST',
        json: formToBody(createForm),
      });
      setCreateOpen(false);
      setCreateForm(EMPTY_FORM);
      setSlugDirty(false);
      setNotice('Collection created');
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
      const body = formToBody(editForm);
      await apiAuth(`/admin/catalog/collections/${editingId}`, {
        method: 'PATCH',
        json: {
          ...body,
          description: body.description ?? null,
        },
      });
      setEditingId(null);
      setNotice('Collection updated');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setBusy(false);
    }
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
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/admin/commerce/products" className="clay-btn-ghost min-h-10 text-sm">
                Products
              </Link>
            </div>
            <button
              type="button"
              className="clay-btn shrink-0 text-sm"
              onClick={() => {
                setCreateOpen(true);
                setCreateForm(EMPTY_FORM);
                setSlugDirty(false);
                setEditingId(null);
              }}
            >
              New collection
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
            className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:opacity-50"
            type="search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search title or slug"
            aria-label="Search collections"
          />
          {qInput ? (
            <button
              type="button"
              className="inline-flex h-6 w-6 items-center justify-center rounded-full opacity-70"
              aria-label="Clear search"
              onClick={() => {
                setQInput('');
                setQ('');
              }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['', 'RULES', 'MANUAL'] as ModeFilter[]).map((v) => (
          <button
            key={v || 'all-mode'}
            type="button"
            aria-pressed={mode === v}
            className={opsChipClass(mode === v)}
            onClick={() => setMode(v)}
          >
            {v === '' ? 'All modes' : v === 'RULES' ? 'Rules' : 'Manual'}
          </button>
        ))}
        {(['', 'PUBLISHED', 'DRAFT'] as StatusFilter[]).map((v) => (
          <button
            key={v || 'all-status'}
            type="button"
            aria-pressed={status === v}
            className={opsChipClass(status === v)}
            onClick={() => setStatus(v)}
          >
            {v === '' ? 'Any status' : v === 'PUBLISHED' ? 'Published' : 'Draft'}
          </button>
        ))}
        <span className="text-xs text-[var(--muted-foreground)]">
          {loading ? 'Loading…' : `${filtered.length} of ${rows.length}`}
        </span>
      </div>

      {createOpen ? (
        <form onSubmit={(e) => void onCreate(e)} className="clay-panel mb-4 max-w-xl space-y-3 p-4">
          <p className="text-sm font-medium">New collection</p>
          <CollectionFields
            form={createForm}
            onChange={setCreateForm}
            slugDirty={slugDirty}
            onSlugDirty={setSlugDirty}
            idPrefix="create"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="clay-btn min-h-10 text-sm" disabled={busy}>
              Create collection
            </button>
            <button
              type="button"
              className="clay-btn-secondary min-h-10 text-sm"
              onClick={() => setCreateOpen(false)}
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

      {!loading && filtered.length === 0 ? (
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <FolderOpen className="h-8 w-8 opacity-30" />
          <p className="text-sm opacity-70">No collections yet.</p>
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="hidden md:block">
          <OpsTableScroll>
            <div className="clay-panel overflow-hidden">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-left text-[11px] uppercase tracking-wide opacity-55">
                    <th className="px-3 py-2.5 font-medium">Title</th>
                    <th className="px-2 py-2.5 font-medium">Slug</th>
                    <th className="px-2 py-2.5 font-medium">Mode</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Products</th>
                    <th className="px-2 py-2.5 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const expanded = editingId === c.id || confirmDeleteId === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr className="border-b border-[var(--border-subtle)]">
                          <td className="px-3 py-2.5 font-medium">{c.title}</td>
                          <td className="px-2 py-2.5 font-mono text-xs opacity-70">{c.slug}</td>
                          <td className="px-2 py-2.5 text-xs">{c.membershipMode}</td>
                          <td className="px-2 py-2.5 text-xs">{c.status}</td>
                          <td className="px-2 py-2.5">
                            <ProductCount c={c} />
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex justify-end gap-3 text-sm">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 underline-offset-2 hover:underline"
                                onClick={() => {
                                  setEditingId(c.id);
                                  setEditForm(rowToForm(c));
                                  setEditSlugDirty(true);
                                  setConfirmDeleteId(null);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5 opacity-60" />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 text-red-700 underline-offset-2 hover:underline disabled:opacity-40"
                                disabled={c.membershipMode === 'MANUAL' && c.productCount > 0}
                                onClick={() => setConfirmDeleteId(c.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 opacity-60" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr className="border-b border-[var(--border-subtle)]">
                            <td colSpan={6} className="bg-[color-mix(in_srgb,var(--foreground)_2%,transparent)] px-3 py-3">
                              {editingId === c.id ? (
                                <form onSubmit={(e) => void onSaveEdit(e)} className="max-w-xl space-y-3">
                                  <CollectionFields
                                    form={editForm}
                                    onChange={setEditForm}
                                    slugDirty={editSlugDirty}
                                    onSlugDirty={setEditSlugDirty}
                                    idPrefix={`edit-${c.id}`}
                                  />
                                  <div className="flex gap-2">
                                    <button type="submit" className="clay-btn min-h-10 text-sm" disabled={busy}>
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      className="clay-btn-secondary min-h-10 text-sm"
                                      onClick={() => setEditingId(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </form>
                              ) : null}
                              {confirmDeleteId === c.id ? (
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
                              ) : null}
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
      ) : null}

      {/* Mobile cards */}
      {!loading && filtered.length > 0 ? (
        <ul className="space-y-2 md:hidden">
          {filtered.map((c) => (
            <li key={c.id} className="clay-panel p-2.5">
              <p className="font-medium">{c.title}</p>
              <p className="font-mono text-xs opacity-60">{c.slug}</p>
              <p className="mt-1 text-xs opacity-70">
                {c.membershipMode} · {c.status}
              </p>
              <div className="mt-2 flex gap-3 text-sm">
                <button
                  type="button"
                  className="underline-offset-2 hover:underline"
                  onClick={() => {
                    setEditingId(c.id);
                    setEditForm(rowToForm(c));
                  }}
                >
                  Edit
                </button>
                <Link
                  href={`/gift/collections/${c.slug}`}
                  className="underline-offset-2 hover:underline"
                  target="_blank"
                >
                  View
                </Link>
              </div>
              {editingId === c.id ? (
                <form onSubmit={(e) => void onSaveEdit(e)} className="mt-3 space-y-3 border-t pt-3">
                  <CollectionFields
                    form={editForm}
                    onChange={setEditForm}
                    slugDirty={editSlugDirty}
                    onSlugDirty={setEditSlugDirty}
                    idPrefix={`m-edit-${c.id}`}
                  />
                  <button type="submit" className="clay-btn min-h-10 text-sm" disabled={busy}>
                    Save
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
