'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, clearSession, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type StatusFilter = '' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

function totalAvailable(p: CatalogProduct): number {
  return p.variants.reduce((s, v) => s + (v.available ?? 0), 0);
}

function tagChips(p: CatalogProduct): string[] {
  const tags = [
    ...(p.recipientTags ?? []),
    ...(p.occasionTags ?? []).slice(0, 2),
    ...(p.storefrontLabels ?? []),
  ];
  return tags.slice(0, 4);
}

function statusTone(status: string): string {
  if (status === 'PUBLISHED') return 'bg-emerald-100 text-emerald-900';
  if (status === 'ARCHIVED') return 'bg-neutral-200 text-neutral-700';
  return 'bg-amber-100 text-amber-900';
}

function ProductsDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const statusParam = (searchParams.get('status') ?? '') as StatusFilter;

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      if (statusParam) params.set('status', statusParam);
      const qs = params.toString();
      const data = await apiAuth<CatalogProduct[]>(
        `/admin/catalog/products${qs ? `?${qs}` : ''}`,
      );
      setProducts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load products');
      clearSession();
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [qParam, statusParam, router]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    setQInput(qParam);
  }, [qParam]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected],
  );
  const allSelected = products.length > 0 && products.every((p) => selected[p.id]);

  function applyFilters(nextQ: string, nextStatus: StatusFilter) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextStatus) params.set('status', nextStatus);
    const qs = params.toString();
    router.push(`/admin/commerce/products${qs ? `?${qs}` : ''}`);
  }

  async function publish(id: string) {
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/publish`, {
        method: 'POST',
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    }
  }

  async function unpublish(id: string) {
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/unpublish`, {
        method: 'POST',
      });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unpublish failed');
    }
  }

  async function bulk(action: 'publish' | 'unpublish') {
    if (!selectedIds.length) {
      setError('Select at least one product');
      return;
    }
    setBusy(true);
    try {
      const res = await apiAuth<{ results: Array<{ id: string; ok: boolean }> }>(
        '/admin/catalog/products/bulk',
        { method: 'POST', json: { ids: selectedIds, action } },
      );
      await load();
      setSelected({});
      setError(
        res.results.some((r) => !r.ok)
          ? 'Bulk completed with some failures'
          : `Bulk ${action} ok (${selectedIds.length})`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bulk failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Catalog desk"
        description="Search, status, stock & tags — bulk publish without leaving the queue."
        actions={
          <>
            <Link href="/admin/commerce/import" className="clay-btn-secondary text-sm">
              CSV import
            </Link>
            <Link href="/admin/commerce/categories" className="clay-btn-secondary text-sm">
              Categories
            </Link>
            <Link href="/admin/commerce/merchandising" className="clay-btn-secondary text-sm">
              Merchandising
            </Link>
            <Link href="/admin/commerce/products/new" className="clay-btn text-sm">
              New product
            </Link>
          </>
        }
      />

      <form
        className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(qInput, statusParam);
        }}
      >
        <label className="min-w-0 flex-1 text-xs sm:max-w-xs">
          Search title / slug / SKU
          <input
            className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="e.g. hamper or SKU"
          />
        </label>
        <label className="text-xs">
          Status
          <select
            className="mt-1 block min-h-10 rounded border px-2 py-1 text-sm"
            value={statusParam}
            onChange={(e) => applyFilters(qInput, e.target.value as StatusFilter)}
          >
            <option value="">All</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <button type="submit" className="clay-btn-secondary min-h-10 px-3 text-sm">
          Apply
        </button>
        {(qParam || statusParam) && (
          <button
            type="button"
            className="min-h-10 px-2 text-sm underline"
            onClick={() => applyFilters('', '')}
          >
            Clear
          </button>
        )}
      </form>

      {selectedIds.length > 0 ? (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 rounded border border-[color:var(--gift-line)] bg-[color:var(--gift-cream)]/95 px-3 py-2 text-sm backdrop-blur">
          <span className="font-medium">{selectedIds.length} selected</span>
          <button
            type="button"
            className="clay-btn-secondary min-h-10 px-3 py-1 disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulk('publish')}
          >
            Bulk publish
          </button>
          <button
            type="button"
            className="clay-btn-secondary min-h-10 px-3 py-1 disabled:opacity-50"
            disabled={busy}
            onClick={() => void bulk('unpublish')}
          >
            Bulk unpublish
          </button>
          <button
            type="button"
            className="min-h-10 px-2 underline"
            onClick={() => setSelected({})}
          >
            Clear selection
          </button>
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-2 text-sm">
          <button
            type="button"
            className="clay-btn-secondary min-h-10 px-3 py-1"
            onClick={() => void bulk('publish')}
          >
            Bulk publish
          </button>
          <button
            type="button"
            className="clay-btn-secondary min-h-10 px-3 py-1"
            onClick={() => void bulk('unpublish')}
          >
            Bulk unpublish
          </button>
        </div>
      )}

      {error ? <p className="mb-4 text-sm opacity-80">{error}</p> : null}
      {loading ? <p className="text-sm opacity-70">Loading…</p> : null}

      {!loading && products.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-sm opacity-70">
          No products match this filter.{' '}
          <Link href="/admin/commerce/products/new" className="underline">
            Create one
          </Link>
          .
        </p>
      ) : null}

      {!loading && products.length > 0 ? (
        <OpsTableScroll>
          <table className="w-full min-w-[44rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                <th className="py-2 pr-2">
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
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Stock</th>
                <th className="py-2 pr-4">Tags</th>
                <th className="py-2 pr-4">From</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const avail = totalAvailable(p);
                const chips = tagChips(p);
                return (
                  <tr key={p.id} className="border-b align-top">
                    <td className="py-2 pr-2">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.title}`}
                        checked={Boolean(selected[p.id])}
                        onChange={(e) =>
                          setSelected((prev) => ({ ...prev, [p.id]: e.target.checked }))
                        }
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/admin/commerce/products/${p.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs opacity-60">{p.slug}</p>
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${statusTone(p.status)}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className={avail <= 5 ? 'font-medium text-amber-800' : ''}>
                        {avail}
                      </span>
                      <Link
                        href={`/admin/commerce/inventory?q=${encodeURIComponent(p.variants[0]?.sku ?? p.slug)}`}
                        className="ml-2 text-xs underline opacity-70"
                      >
                        Ledger
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex max-w-[10rem] flex-wrap gap-1">
                        {chips.length ? (
                          chips.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs opacity-50">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatInr(p.fromPricePaise)}</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <Link href={`/admin/commerce/products/${p.id}`} className="underline">
                          Edit
                        </Link>
                        {p.status === 'PUBLISHED' ? (
                          <button
                            type="button"
                            className="underline"
                            onClick={() => void unpublish(p.id)}
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="underline"
                            onClick={() => void publish(p.id)}
                          >
                            Publish
                          </button>
                        )}
                        {p.status === 'PUBLISHED' ? (
                          <Link href={`/gift/products/${p.slug}`} className="underline">
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
        </OpsTableScroll>
      ) : null}
    </div>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading catalog…</p>}>
      <ProductsDeskInner />
    </Suspense>
  );
}
