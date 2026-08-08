'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { CollectionSmartBuilder } from '@/components/commerce-ops/collection-smart-builder';
import {
  EMPTY_COLLECTION_FORM,
  EMPTY_SMART,
  conditionPlainLabel,
  detailToForm,
  formToCollectionBody,
  slugifyCollection,
  toggleProductSlug,
  type CollectionDetail,
  type CollectionFormState,
  type CollectionProduct,
} from '@/lib/collection-admin';

type ProductOpt = { slug: string; title: string };

export default function CollectionEditPage() {
  const params = useParams();
  const id = String(params.id ?? '');
  const router = useRouter();
  const [form, setForm] = useState<CollectionFormState>(EMPTY_COLLECTION_FORM);
  const [products, setProducts] = useState<CollectionProduct[]>([]);
  const [productsSource, setProductsSource] = useState<'manual' | 'smart'>('manual');
  const [productOptions, setProductOptions] = useState<ProductOpt[]>([]);
  const [slugDirty, setSlugDirty] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, productsPage] = await Promise.all([
        apiAuth<CollectionDetail>(`/admin/catalog/collections/${id}`),
        apiAuth<{ items: Array<{ slug: string; title: string }> }>(
          '/admin/catalog/products?limit=50&sort=title_asc',
        ),
      ]);
      const assigned = (detail.products ?? []).map((p) => p.slug);
      setForm(detailToForm(detail, assigned));
      setProducts(detail.products ?? []);
      setProductsSource(detail.productsSource ?? (detail.membershipMode === 'SMART' ? 'smart' : 'manual'));
      setProductOptions((productsPage.items ?? []).map((p) => ({ slug: p.slug, title: p.title })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl(`/admin/commerce/collections/${id}`));
      return;
    }
    void load();
  }, [router, load, id]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = formToCollectionBody(form);
      await apiAuth(`/admin/catalog/collections/${id}`, {
        method: 'PATCH',
        json: {
          ...body,
          description: body.description ?? null,
        },
      });
      setNotice('Saved');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-sm opacity-70">Loading collection…</p>;
  }

  return (
    <div className="mx-auto max-w-5xl">
      <OpsPageHeader
        title={form.title || 'Collection'}
        description={
          form.membershipMode === 'SMART'
            ? 'Smart — products match conditions automatically'
            : 'Hand-picked — you choose products'
        }
        actions={
          <>
            <Link
              href="/admin/commerce/collections"
              className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Collections
            </Link>
            {form.slug ? (
              <Link
                href={`/gift/collections/${form.slug}`}
                target="_blank"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                View storefront
                <ExternalLink className="h-3.5 w-3.5 opacity-60" />
              </Link>
            ) : null}
          </>
        }
      />

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

      <form onSubmit={(e) => void onSave(e)} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <section className="clay-panel space-y-4 p-4 sm:p-5">
            <h2 className="font-display text-base">Details</h2>
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
                <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
                  Description
                </span>
                <textarea
                  className="clay-input min-h-20 w-full text-sm"
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
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
                  Sort order
                </span>
                <input
                  type="number"
                  className="clay-input min-h-10 w-full text-sm"
                  value={form.sortOrder}
                  onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                />
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-[var(--muted-foreground)]">Accent</span>
                <select
                  className="clay-input min-h-10 w-full text-sm"
                  value={form.accent}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      accent: e.target.value as 'pink' | 'sky' | 'neutral',
                    }))
                  }
                >
                  <option value="neutral">Neutral</option>
                  <option value="pink">Pink</option>
                  <option value="sky">Sky</option>
                </select>
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
                  Overline
                </span>
                <input
                  className="clay-input min-h-10 w-full text-sm"
                  value={form.overline}
                  onChange={(e) => setForm((f) => ({ ...f, overline: e.target.value }))}
                />
              </label>
              <label className="block text-xs sm:col-span-2">
                <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
                  Hero image URL
                </span>
                <input
                  className="clay-input min-h-10 w-full text-sm"
                  value={form.heroImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, heroImageUrl: e.target.value }))}
                />
              </label>
              <label className="block text-xs sm:col-span-2">
                <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
                  Related slugs
                </span>
                <input
                  className="clay-input min-h-10 w-full font-mono text-sm"
                  value={form.relatedSlugs}
                  onChange={(e) => setForm((f) => ({ ...f, relatedSlugs: e.target.value }))}
                  placeholder="for-baby-boy, newborn"
                />
              </label>
            </div>
          </section>

          <section className="clay-panel space-y-4 p-4 sm:p-5">
            <h2 className="font-display text-base">How products are added</h2>
            <div className="flex flex-wrap gap-2">
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
              <>
                <CollectionSmartBuilder
                  rules={form.smartRules}
                  onChange={(smartRules) => setForm((f) => ({ ...f, smartRules }))}
                />
                {form.smartRules.conditions.length > 0 ? (
                  <ul className="space-y-1 text-xs text-[var(--muted-foreground)]">
                    {form.smartRules.conditions.map((c, i) => (
                      <li key={i}>• {conditionPlainLabel(c)}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : (
              <div>
                <p className="mb-2 text-xs font-medium text-[var(--muted-foreground)]">
                  Select products
                </p>
                <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-[var(--border-subtle)] p-2">
                  {productOptions.length === 0 ? (
                    <span className="text-xs opacity-50">No products</span>
                  ) : (
                    productOptions.map((p) => {
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
                    })
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="clay-panel space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-base">Products in this collection</h2>
              <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
                {products.length}
                {productsSource === 'smart' ? ' matching now' : ' assigned'}
              </span>
            </div>
            {productsSource === 'smart' ? (
              <p className="text-xs text-[var(--muted-foreground)]">
                Live from Smart conditions — change tags on a product to add/remove it.
              </p>
            ) : null}
            {products.length === 0 ? (
              <p className="rounded-lg border border-dashed border-[var(--border-subtle)] px-3 py-8 text-center text-sm opacity-60">
                {form.membershipMode === 'SMART'
                  ? 'No published products match these conditions yet.'
                  : 'No products assigned yet.'}
              </p>
            ) : (
              <ul className="divide-y divide-[var(--border-subtle)] rounded-xl border border-[var(--border-subtle)]">
                {products.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="font-mono text-[11px] opacity-55">{p.slug}</p>
                    </div>
                    <div className="flex shrink-0 gap-3 text-xs">
                      <Link
                        href={`/admin/commerce/products/${p.id}`}
                        className="text-[var(--primary)] underline-offset-2 hover:underline"
                      >
                        Edit product
                      </Link>
                      <Link
                        href={`/gift/products/${p.slug}`}
                        target="_blank"
                        className="opacity-70 underline-offset-2 hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {products.length >= 200 ? (
              <p className="text-[11px] text-[var(--muted-foreground)]">Showing first 200</p>
            ) : null}
          </section>

          <section className="clay-panel space-y-3 p-4 sm:p-5">
            <h2 className="font-display text-base">SEO</h2>
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-[var(--muted-foreground)]">SEO title</span>
              <input
                className="clay-input min-h-10 w-full text-sm"
                value={form.seoTitle}
                onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
                maxLength={200}
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium text-[var(--muted-foreground)]">
                SEO description
              </span>
              <textarea
                className="clay-input min-h-16 w-full text-sm"
                value={form.seoDescription}
                onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
                maxLength={500}
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={form.robotsIndex}
                onChange={(e) => setForm((f) => ({ ...f, robotsIndex: e.target.checked }))}
              />
              <span className="font-medium text-[var(--muted-foreground)]">Allow search index</span>
            </label>
          </section>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <div className="clay-panel space-y-3 p-4">
            <button type="submit" className="clay-btn w-full min-h-10 text-sm" disabled={busy}>
              {busy ? 'Saving…' : 'Save collection'}
            </button>
            <Link
              href="/admin/commerce/collections"
              className="clay-btn-secondary flex min-h-10 w-full items-center justify-center text-sm"
            >
              Back to list
            </Link>
          </div>
        </aside>
      </form>
    </div>
  );
}
