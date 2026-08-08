'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { CollectionSmartBuilder } from '@/components/commerce-ops/collection-smart-builder';
import {
  EMPTY_COLLECTION_FORM,
  EMPTY_SMART,
  formToCollectionBody,
  slugifyCollection,
  toggleProductSlug,
  type CollectionDetail,
  type CollectionFormState,
} from '@/lib/collection-admin';

type ProductOpt = { slug: string; title: string };

export default function NewCollectionPage() {
  const router = useRouter();
  const [form, setForm] = useState<CollectionFormState>(EMPTY_COLLECTION_FORM);
  const [productOptions, setProductOptions] = useState<ProductOpt[]>([]);
  const [slugDirty, setSlugDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/commerce/collections/new'));
      return;
    }
    void apiAuth<{ items: Array<{ slug: string; title: string }> }>(
      '/admin/catalog/products?limit=50&sort=title_asc',
    )
      .then((page) =>
        setProductOptions((page.items ?? []).map((p) => ({ slug: p.slug, title: p.title }))),
      )
      .catch(() => setProductOptions([]));
  }, [router]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await apiAuth<CollectionDetail>('/admin/catalog/collections', {
        method: 'POST',
        json: formToCollectionBody(form),
      });
      router.replace(`/admin/commerce/collections/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <OpsPageHeader
        title="New collection"
        actions={
          <Link
            href="/admin/commerce/collections"
            className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Collections
          </Link>
        }
      />

      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <form onSubmit={(e) => void onCreate(e)} className="clay-panel space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Title</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((f) => ({
                  ...f,
                  title,
                  slug: slugDirty ? f.slug : slugifyCollection(title),
                }));
              }}
              required
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Slug</span>
            <input
              className="clay-input min-h-10 w-full font-mono text-sm"
              value={form.slug}
              onChange={(e) => {
                setSlugDirty(true);
                setForm((f) => ({ ...f, slug: e.target.value }));
              }}
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              required
            />
          </label>
          <label className="block text-xs sm:col-span-2">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Description</span>
            <input
              className="clay-input min-h-10 w-full text-sm"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Status</span>
            <select
              className="clay-input min-h-10 w-full text-sm"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as 'DRAFT' | 'PUBLISHED' }))
              }
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
            How products are added
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={opsChipClass(form.membershipMode === 'MANUAL')}
              onClick={() => setForm((f) => ({ ...f, membershipMode: 'MANUAL' }))}
            >
              Hand-picked
            </button>
            <button
              type="button"
              className={opsChipClass(form.membershipMode === 'SMART')}
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  membershipMode: 'SMART',
                  smartRules: f.smartRules.conditions.length ? f.smartRules : EMPTY_SMART,
                }))
              }
            >
              Smart (auto)
            </button>
          </div>
          {form.membershipMode === 'SMART' ? (
            <CollectionSmartBuilder
              rules={form.smartRules}
              onChange={(smartRules) => setForm((f) => ({ ...f, smartRules }))}
            />
          ) : (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] p-2">
              {productOptions.map((p) => {
                const on = form.productSlugs.includes(p.slug);
                return (
                  <button
                    key={p.slug}
                    type="button"
                    className={opsChipClass(on)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        productSlugs: toggleProductSlug(f.productSlugs, p.slug),
                      }))
                    }
                  >
                    {p.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className="clay-btn min-h-10 text-sm" disabled={busy}>
            {busy ? 'Creating…' : 'Create collection'}
          </button>
          <Link href="/admin/commerce/collections" className="clay-btn-secondary min-h-10 text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
