'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { ProductMediaField } from '@/components/commerce-ops/product-media-field';

function slugifyTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

type CreateMode = 'draft' | 'publish';

export default function NewProductPage() {
  const router = useRouter();
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [label, setLabel] = useState('Default');
  const [priceInr, setPriceInr] = useState('');
  const [onHand, setOnHand] = useState('10');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalPath, setCanonicalPath] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<CreateMode | null>(null);

  function onTitleChange(next: string) {
    setTitle(next);
    if (!slugTouched) setSlug(slugifyTitle(next));
  }

  async function createProduct(mode: CreateMode) {
    setBusy(mode);
    setError(null);
    try {
      const pricePaise = Math.round(Number(priceInr) * 100);
      if (!Number.isFinite(pricePaise) || pricePaise < 0) {
        throw new Error('Invalid price');
      }
      if (!slug.trim() || !title.trim() || !sku.trim()) {
        throw new Error('Title, slug, and SKU are required');
      }
      const alt = imageAlt.trim() || title.trim();
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
          media: imageUrl.trim()
            ? [{ url: imageUrl.trim(), altText: alt, kind: 'IMAGE' as const }]
            : undefined,
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          canonicalPath: canonicalPath.trim() || null,
          ogImageUrl: null,
          robotsIndex,
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
      if (mode === 'publish') {
        await apiAuth(`/admin/catalog/products/${product.id}/publish`, { method: 'POST' });
      }
      router.push(`/admin/commerce/products/${product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await createProduct('draft');
  }

  return (
    <div className="w-full max-w-2xl">
      <Link href="/admin/commerce/products" className="clay-btn-ghost text-sm">
        ← Products
      </Link>

      <div className="mt-4">
        <OpsPageHeader title="New product" />
      </div>

      <form onSubmit={onSubmit} className="mt-2 space-y-5">
        <section className="clay-panel space-y-3 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Basics</h2>
          <label className="block text-sm">
            Title
            <input
              className="clay-input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="block text-sm">
            Slug (kebab-case)
            <input
              className="clay-input font-mono text-sm"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              title="lowercase kebab-case"
            />
          </label>
          <label className="block text-sm">
            Description
            <textarea
              className="clay-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
        </section>

        <section className="clay-panel space-y-3 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
            Pricing &amp; stock
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              SKU
              <input
                className="clay-input"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm">
              Variant label
              <input
                className="clay-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Price (₹)
              <input
                className="clay-input"
                value={priceInr}
                onChange={(e) => setPriceInr(e.target.value)}
                inputMode="decimal"
                required
              />
            </label>
            <label className="block text-sm">
              Stock on hand
              <input
                className="clay-input"
                value={onHand}
                onChange={(e) => setOnHand(e.target.value)}
                inputMode="numeric"
              />
            </label>
          </div>
        </section>

        <section className="clay-panel space-y-3 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Media</h2>
          <ProductMediaField
            url={imageUrl}
            altText={imageAlt}
            onUrlChange={setImageUrl}
            onAltChange={setImageAlt}
            altPlaceholder={title || 'Product name'}
            label="Primary image"
          />
        </section>

        <section className="clay-panel space-y-3 p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">SEO</h2>
          <label className="block text-sm">
            SEO title
            <input
              className="clay-input"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={200}
              placeholder={title || 'SEO title'}
            />
            <span className="mt-1 block text-[11px] opacity-50">
              {(seoTitle || title).length}/200
            </span>
          </label>
          <label className="block text-sm">
            SEO description
            <textarea
              className="clay-input"
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={500}
              placeholder="SEO description"
            />
            <span className="mt-1 block text-[11px] opacity-50">
              {seoDescription.length}/500
            </span>
          </label>
          <label className="block text-sm">
            Canonical path
            <input
              className="clay-input font-mono text-sm"
              value={canonicalPath}
              onChange={(e) => setCanonicalPath(e.target.value)}
              placeholder={slug ? `/gift/products/${slug}` : '/gift/products/…'}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={robotsIndex}
              onChange={(e) => setRobotsIndex(e.target.checked)}
            />
            Allow search indexing
          </label>
        </section>

        {error ? (
          <div className="gift-banner gift-banner--danger" role="alert">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-[color:var(--gift-line)] pt-4 pb-8 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="submit"
            disabled={busy !== null}
            className="clay-btn-secondary text-sm disabled:opacity-60"
          >
            {busy === 'draft' ? 'Saving draft…' : 'Save as draft'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            className="clay-btn text-sm disabled:opacity-60"
            onClick={() => void createProduct('publish')}
          >
            {busy === 'publish' ? 'Publishing…' : 'Create & publish'}
          </button>
          <Link href="/admin/commerce/products" className="clay-btn-ghost text-sm sm:ml-1">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
