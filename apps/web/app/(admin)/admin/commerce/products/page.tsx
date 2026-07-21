'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, clearSession, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<CatalogProduct[]>('/admin/catalog/products')
      .then(setProducts)
      .catch(() => {
        clearSession();
        router.replace('/login');
      });
  }, [router]);

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
    const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${id}/unpublish`, {
      method: 'POST',
    });
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }

  async function bulk(action: 'publish' | 'unpublish') {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([id]) => id);
    if (!ids.length) {
      setError('Select at least one product');
      return;
    }
    const res = await apiAuth<{ results: Array<{ id: string; ok: boolean }> }>(
      '/admin/catalog/products/bulk',
      { method: 'POST', json: { ids, action } },
    );
    setProducts(await apiAuth<CatalogProduct[]>('/admin/catalog/products'));
    setSelected({});
    setError(
      res.results.some((r) => !r.ok)
        ? 'Bulk completed with some failures'
        : `Bulk ${action} ok (${ids.length})`,
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/commerce" className="text-sm underline opacity-70">
            ← Commerce admin
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Products</h1>
        </div>
        <Link
          href="/admin/commerce/products/new"
          className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
        >
          New product
        </Link>
      </div>
      <div className="mb-3 flex gap-2 text-sm">
        <button type="button" className="rounded border px-2 py-1" onClick={() => void bulk('publish')}>
          Bulk publish
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1"
          onClick={() => void bulk('unpublish')}
        >
          Bulk unpublish
        </button>
      </div>
      {error ? <p className="text-sm mb-4 opacity-80">{error}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-2"> </th>
              <th className="py-2 pr-4">Title</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">From</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
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
                <td className="py-2 pr-4">{p.title}</td>
                <td className="py-2 pr-4">{p.status}</td>
                <td className="py-2 pr-4">{formatInr(p.fromPricePaise)}</td>
                <td className="py-2">
                  <Link href={`/admin/commerce/products/${p.id}`} className="underline mr-3">
                    Edit
                  </Link>
                  {p.status === 'PUBLISHED' ? (
                    <button
                      type="button"
                      className="underline mr-3"
                      onClick={() => void unpublish(p.id)}
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="underline mr-3"
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
