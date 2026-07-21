'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';

const RECIPIENTS = ['girl', 'boy', 'mom', 'unisex'] as const;
const AGES = ['newborn', 'infant', 'toddler', 'any'] as const;
const OCCASIONS = ['welcome-baby', 'baby-shower', 'naming', 'birthday'] as const;

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function AdminProductEditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recipientTags, setRecipientTags] = useState<string[]>([]);
  const [ageBands, setAgeBands] = useState<string[]>([]);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [isReadyMadeHamper, setIsReadyMadeHamper] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [stock, setStock] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/products');
      return;
    }
    apiAuth<CatalogProduct>(`/admin/catalog/products/${params.id}`)
      .then((p) => {
        setProduct(p);
        setTitle(p.title);
        setDescription(p.description ?? '');
        setRecipientTags(p.recipientTags ?? []);
        setAgeBands(p.ageBands ?? []);
        setOccasionTags(p.occasionTags ?? []);
        setIsReadyMadeHamper(Boolean(p.isReadyMadeHamper));
        setBrandName(p.brandName ?? '');
        const s: Record<string, string> = {};
        for (const v of p.variants) {
          s[v.id] = String(v.onHand ?? v.available);
        }
        setStock(s);
      })
      .catch(() => router.replace('/admin/commerce/products'));
  }, [params.id, router]);

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await apiAuth<CatalogProduct>(`/admin/catalog/products/${params.id}`, {
        method: 'PATCH',
        json: {
          title,
          description,
          recipientTags,
          ageBands,
          occasionTags,
          isReadyMadeHamper,
          brandName: brandName.trim() || null,
        },
      });
      setProduct(updated);
      setMsg('Product saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  async function saveStock(variantId: string) {
    setError(null);
    const onHand = Number(stock[variantId]);
    if (!Number.isFinite(onHand) || onHand < 0) {
      setError('Invalid stock');
      return;
    }
    try {
      await apiAuth(`/admin/catalog/variants/${variantId}/inventory`, {
        method: 'PATCH',
        json: { onHand },
      });
      const refreshed = await apiAuth<CatalogProduct>(`/admin/catalog/products/${params.id}`);
      setProduct(refreshed);
      setMsg('Inventory updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inventory update failed');
    }
  }

  if (!product) {
    return <main className="p-8 text-sm opacity-70">Loading product…</main>;
  }

  return (
    <main className="min-h-screen p-8 max-w-xl">
      <Link href="/admin/commerce/products" className="text-sm underline opacity-70">
        ← Products
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Edit product</h1>
      <p className="text-sm opacity-70 mt-1">
        {product.slug} · {product.status}
        {product.status === 'PUBLISHED' ? (
          <>
            {' '}
            ·{' '}
            <Link href={`/gift/products/${product.slug}`} className="underline">
              View storefront
            </Link>
          </>
        ) : null}
      </p>

      <form onSubmit={(e) => void saveMeta(e)} className="mt-6 space-y-3 text-sm">
        <label className="block">
          Title
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="block">
          Description
          <textarea
            className="mt-1 block w-full rounded border px-2 py-1 min-h-[96px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className="block">
          Brand name
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="e.g. Soft Nest"
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isReadyMadeHamper}
            onChange={(e) => setIsReadyMadeHamper(e.target.checked)}
          />
          Ready-made hamper
        </label>
        <fieldset>
          <legend className="text-xs opacity-70">Recipient tags</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {RECIPIENTS.map((r) => (
              <label key={r} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={recipientTags.includes(r)}
                  onChange={() => setRecipientTags((t) => toggle(t, r))}
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs opacity-70">Age bands</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {AGES.map((a) => (
              <label key={a} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={ageBands.includes(a)}
                  onChange={() => setAgeBands((t) => toggle(t, a))}
                />
                {a}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-xs opacity-70">Occasions</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <label key={o} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={occasionTags.includes(o)}
                  onChange={() => setOccasionTags((t) => toggle(t, o))}
                />
                {o}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="rounded bg-neutral-900 px-3 py-2 text-white">
          Save details
        </button>
      </form>

      <section className="mt-8">
        <h2 className="font-medium text-sm">Inventory (on hand)</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {product.variants.map((v) => (
            <li key={v.id} className="flex flex-wrap items-end gap-2 rounded border p-3">
              <div className="flex-1">
                <p className="font-medium">
                  {v.label} · {v.sku}
                </p>
                <p className="opacity-70">
                  {formatInr(v.pricePaise)} · available {v.available}
                </p>
              </div>
              <label className="text-xs">
                On hand
                <input
                  className="ml-2 w-20 rounded border px-2 py-1"
                  value={stock[v.id] ?? '0'}
                  onChange={(e) => setStock((s) => ({ ...s, [v.id]: e.target.value }))}
                />
              </label>
              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() => void saveStock(v.id)}
              >
                Update
              </button>
            </li>
          ))}
        </ul>
      </section>

      {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
