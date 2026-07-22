'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct, type ManualStorefrontLabel } from '@/lib/catalog';

const RECIPIENTS = ['girl', 'boy', 'mom', 'unisex'] as const;
const AGES = ['newborn', 'infant', 'toddler', 'any'] as const;
const OCCASIONS = ['welcome-baby', 'baby-shower', 'naming', 'birthday'] as const;
const STOREFRONT_LABELS: Array<{ code: ManualStorefrontLabel; label: string }> = [
  { code: 'BESTSELLER', label: 'Bestseller' },
  { code: 'EDITORS_PICK', label: "Editor's pick" },
  { code: 'GIFT_SET', label: 'Gift set' },
];

function toggleManual(
  list: ManualStorefrontLabel[],
  value: ManualStorefrontLabel,
): ManualStorefrontLabel[] {
  if (list.includes(value)) return list.filter((x) => x !== value);
  if (list.length >= 2) return list;
  return [...list, value];
}

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
  const [storefrontLabels, setStorefrontLabels] = useState<ManualStorefrontLabel[]>([]);
  const [isReadyMadeHamper, setIsReadyMadeHamper] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [stock, setStock] = useState<Record<string, string>>({});
  const [mrpRupees, setMrpRupees] = useState<Record<string, string>>({});
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
        setStorefrontLabels(p.storefrontLabels ?? []);
        setIsReadyMadeHamper(Boolean(p.isReadyMadeHamper));
        setBrandName(p.brandName ?? '');
        const s: Record<string, string> = {};
        const m: Record<string, string> = {};
        for (const v of p.variants) {
          s[v.id] = String(v.onHand ?? v.available);
          m[v.id] =
            v.compareAtPricePaise != null && v.compareAtPricePaise > 0
              ? String(v.compareAtPricePaise / 100)
              : '';
        }
        setStock(s);
        setMrpRupees(m);
      })
      .catch(() => setError('Failed to load product'));
  }, [params.id, router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
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
          storefrontLabels,
        },
      });
      setProduct(updated);
      setStorefrontLabels(updated.storefrontLabels ?? []);
      setMsg('Saved');
    } catch {
      setError('Save failed');
    }
  }

  async function saveStock(variantId: string) {
    setMsg(null);
    setError(null);
    const onHand = Number(stock[variantId] ?? '0');
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
      setMsg('Stock updated');
    } catch {
      setError('Stock update failed');
    }
  }

  async function saveMrp(variantId: string) {
    setMsg(null);
    setError(null);
    const raw = (mrpRupees[variantId] ?? '').trim();
    let compareAtPricePaise: number | null = null;
    if (raw !== '') {
      const rupees = Number(raw);
      if (!Number.isFinite(rupees) || rupees < 0) {
        setError('Invalid MRP');
        return;
      }
      compareAtPricePaise = Math.round(rupees * 100);
    }
    try {
      await apiAuth(`/admin/catalog/variants/${variantId}`, {
        method: 'PATCH',
        json: { compareAtPricePaise },
      });
      const refreshed = await apiAuth<CatalogProduct>(`/admin/catalog/products/${params.id}`);
      setProduct(refreshed);
      const m: Record<string, string> = {};
      for (const v of refreshed.variants) {
        m[v.id] =
          v.compareAtPricePaise != null && v.compareAtPricePaise > 0
            ? String(v.compareAtPricePaise / 100)
            : '';
      }
      setMrpRupees(m);
      setMsg('MRP updated');
    } catch {
      setError('MRP update failed (must be ≥ sale price)');
    }
  }

  if (error && !product) {
    return <p className="p-6 text-red-600">{error}</p>;
  }
  if (!product) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Link href="/admin/commerce/products" className="text-sm underline">
        ← Products
      </Link>
      <h1 className="mt-4 text-xl font-semibold">{product.title}</h1>
      <p className="text-sm opacity-70">{product.slug}</p>

      <form onSubmit={onSave} className="mt-6 space-y-4 text-sm">
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
            className="mt-1 block w-full rounded border px-2 py-1"
            rows={4}
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
          <legend className="text-xs opacity-70">Manual storefront labels (max 2)</legend>
          <p className="mt-1 text-xs opacity-60">
            Auto ribbons: % off (from MRP), New (≤30 days), Low stock (1–5)
          </p>
          <div className="mt-1 flex flex-wrap gap-2">
            {STOREFRONT_LABELS.map(({ code, label }) => (
              <label key={code} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={storefrontLabels.includes(code)}
                  onChange={() => setStorefrontLabels((t) => toggleManual(t, code))}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
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
        <h2 className="font-medium text-sm">Inventory &amp; MRP</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {product.variants.map((v) => (
            <li key={v.id} className="flex flex-wrap items-end gap-2 rounded border p-3">
              <div className="flex-1 min-w-[10rem]">
                <p className="font-medium">
                  {v.label} · {v.sku}
                </p>
                <p className="opacity-70">
                  Sale {formatInr(v.pricePaise)} · available {v.available}
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
                Update stock
              </button>
              <label className="text-xs">
                MRP (₹)
                <input
                  className="ml-2 w-24 rounded border px-2 py-1"
                  value={mrpRupees[v.id] ?? ''}
                  placeholder="optional"
                  onChange={(e) => setMrpRupees((s) => ({ ...s, [v.id]: e.target.value }))}
                />
              </label>
              <button
                type="button"
                className="rounded border px-2 py-1"
                onClick={() => void saveMrp(v.id)}
              >
                Update MRP
              </button>
            </li>
          ))}
        </ul>
      </section>

      {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
