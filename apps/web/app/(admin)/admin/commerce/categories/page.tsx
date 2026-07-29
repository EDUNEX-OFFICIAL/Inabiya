'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export default function CategoriesDeskPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await apiAuth<Category[]>('/admin/catalog/categories');
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    try {
      await apiAuth('/admin/catalog/categories', {
        method: 'POST',
        json: {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
        },
      });
      setName('');
      setSlug('');
      setDescription('');
      setMsg('Category created');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    }
  }

  return (
    <div>
      <OpsPageHeader
        title="Categories"
        description="Organize catalog collections for PLP filters and merchandising."
        actions={
          <Link href="/admin/commerce/products" className="clay-btn-secondary text-sm">
            ← Products
          </Link>
        }
      />

      <form
        onSubmit={onCreate}
        className="mb-6 grid max-w-xl gap-3 rounded border border-[color:var(--gift-line)] p-4 text-sm"
      >
        <p className="text-xs font-medium uppercase tracking-wide opacity-70">New category</p>
        <label className="block text-xs">
          Name
          <input
            className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, ''),
                );
              }
            }}
            required
          />
        </label>
        <label className="block text-xs">
          Slug
          <input
            className="mt-1 block w-full min-h-10 rounded border px-2 py-1 font-mono text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            required
          />
        </label>
        <label className="block text-xs">
          Description (optional)
          <input
            className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <button type="submit" className="clay-btn w-fit text-sm">
          Create category
        </button>
      </form>

      {msg ? <p className="mb-3 text-sm text-emerald-800">{msg}</p> : null}
      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm opacity-70">Loading…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm opacity-70">No categories yet — create one above.</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <OpsTableScroll>
          <table className="w-full min-w-[28rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Slug</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{c.slug}</td>
                  <td className="py-2 opacity-70">{c.description ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsTableScroll>
      ) : null}
    </div>
  );
}
