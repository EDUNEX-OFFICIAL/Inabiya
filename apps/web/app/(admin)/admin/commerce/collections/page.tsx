'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, FolderOpen, Pencil, Search, Trash2, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

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

const actionBtnClass =
  'inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--foreground)] underline-offset-2 hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]';

export default function CollectionsDeskPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<ModeFilter>('');
  const [status, setStatus] = useState<StatusFilter>('');
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
    if (mode) list = list.filter((c) => c.membershipMode === mode);
    if (status) list = list.filter((c) => c.status === status);
    return [...list].sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return ta - tb || a.title.localeCompare(b.title);
    });
  }, [rows, q, mode, status]);

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
        {(['', 'MANUAL', 'SMART'] as ModeFilter[]).map((v) => (
          <button
            key={v || 'all-mode'}
            type="button"
            aria-pressed={mode === v}
            className={opsChipClass(mode === v)}
            onClick={() => setMode(v)}
          >
            {v === '' ? 'All types' : v === 'SMART' ? 'Smart' : 'Hand-picked'}
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
          <Link href="/admin/commerce/collections/new" className="clay-btn text-sm">
            New collection
          </Link>
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="hidden md:block">
          <OpsTableScroll>
            <div className="clay-panel overflow-hidden">
              <table className="w-full min-w-[40rem] border-collapse text-sm">
                <thead>
                  <tr className="ops-th border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3.5%,transparent)] text-left">
                    <th className="px-3 py-2.5 font-medium">Title</th>
                    <th className="px-2 py-2.5 font-medium">Slug</th>
                    <th className="px-2 py-2.5 font-medium">Type</th>
                    <th className="px-2 py-2.5 font-medium">Status</th>
                    <th className="px-2 py-2.5 font-medium">Products</th>
                    <th className="px-2 py-2.5 text-right font-medium">Actions</th>
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
                          <div className="flex justify-end gap-1">
                            <Link
                              href={`/admin/commerce/collections/${c.id}`}
                              className={actionBtnClass}
                              aria-label={`Edit ${c.title}`}
                            >
                              <Pencil className="h-4 w-4 opacity-70" aria-hidden />
                              <span className="hidden sm:inline">Edit</span>
                            </Link>
                            <Link
                              href={`/gift/collections/${c.slug}`}
                              target="_blank"
                              className={actionBtnClass}
                              aria-label={`View ${c.title} storefront`}
                            >
                              <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
                              <span className="hidden sm:inline">View</span>
                            </Link>
                            <button
                              type="button"
                              className={`${actionBtnClass} text-red-700 disabled:opacity-40`}
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
                <div className="flex shrink-0 flex-col gap-1">
                  <Link
                    href={`/admin/commerce/collections/${c.id}`}
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_96%,white)]"
                    aria-label={`Edit ${c.title}`}
                  >
                    <Pencil className="h-4 w-4 opacity-70" aria-hidden />
                  </Link>
                  <Link
                    href={`/gift/collections/${c.slug}`}
                    target="_blank"
                    className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_96%,white)]"
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
