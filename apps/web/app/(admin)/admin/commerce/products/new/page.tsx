'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth } from '@/lib/auth-client';

export default function NewProductPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [label, setLabel] = useState('Default');
  const [priceInr, setPriceInr] = useState('');
  const [onHand, setOnHand] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const pricePaise = Math.round(Number(priceInr) * 100);
      if (!Number.isFinite(pricePaise) || pricePaise < 0) {
        throw new Error('Invalid price');
      }
      const product = await apiAuth<{ id: string }>('/admin/catalog/products', {
        method: 'POST',
        json: {
          slug,
          title,
          description: description || undefined,
          variants: [
            {
              sku,
              label,
              pricePaise,
              onHand: Number(onHand) || 0,
            },
          ],
          media: imageUrl ? [{ url: imageUrl, altText: title }] : undefined,
          personalization: [
            {
              key: 'babyName',
              label: 'Baby name',
              type: 'TEXT',
              maxLength: 24,
              required: false,
            },
          ],
        },
      });
      await apiAuth(`/admin/catalog/products/${product.id}/publish`, { method: 'POST' });
      router.push('/admin/commerce/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/commerce/products" className="text-sm underline opacity-70">
        ← Products
      </Link>
      <h1 className="text-2xl font-semibold mt-4">New product</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <label className="text-sm">
          Slug (kebab-case)
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Title
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Description
          <textarea
            className="mt-1 block w-full rounded border px-2 py-1"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>
        <label className="text-sm">
          SKU
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Variant label
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Price (₹)
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={priceInr}
            onChange={(e) => setPriceInr(e.target.value)}
            required
          />
        </label>
        <label className="text-sm">
          Stock on hand
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={onHand}
            onChange={(e) => setOnHand(e.target.value)}
          />
        </label>
        <label className="text-sm">
          Image URL
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://…"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {busy ? 'Creating…' : 'Create & publish'}
        </button>
      </form>
    </main>
  );
}
