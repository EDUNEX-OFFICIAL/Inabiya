'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct, type ManualStorefrontLabel } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

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
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalPath, setCanonicalPath] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [faqDraft, setFaqDraft] = useState('');
  const [seoSectionsDraft, setSeoSectionsDraft] = useState('');
  const [hamperItemsDraft, setHamperItemsDraft] = useState('');
  const [mediaDraft, setMediaDraft] = useState('');
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
        setSeoTitle(p.seoTitle ?? '');
        setSeoDescription(p.seoDescription ?? '');
        setCanonicalPath(p.canonicalPath ?? '');
        setOgImageUrl(p.ogImageUrl ?? '');
        setRobotsIndex(p.robotsIndex !== false);
        setFaqDraft(
          p.faqItems?.length
            ? JSON.stringify(p.faqItems, null, 2)
            : '[\n  { "question": "", "answerText": "" }\n]',
        );
        setSeoSectionsDraft(
          p.seoSections?.length
            ? JSON.stringify(p.seoSections, null, 2)
            : '[\n  { "heading": "", "bodyText": "" }\n]',
        );
        setHamperItemsDraft(
          p.hamperItems?.length
            ? JSON.stringify(
                p.hamperItems.map((h) => ({
                  title: h.title,
                  blurb: h.blurb ?? undefined,
                  brandName: h.brandName ?? undefined,
                  imageUrl: h.imageUrl ?? undefined,
                  qty: h.qty,
                  unitPricePaise: h.unitPricePaise,
                  sortOrder: h.sortOrder,
                })),
                null,
                2,
              )
            : '[\n  { "title": "", "qty": 1, "unitPricePaise": 0, "imageUrl": "/gift/media/baby-soft-gift.jpg" }\n]',
        );
        setMediaDraft(
          p.media?.length
            ? JSON.stringify(
                p.media.map((m, i) => ({
                  url: m.url,
                  altText: m.altText ?? undefined,
                  kind: m.kind ?? 'IMAGE',
                  posterUrl: m.posterUrl ?? undefined,
                  sortOrder: m.sortOrder ?? i,
                })),
                null,
                2,
              )
            : '[\n  { "url": "/gift/media/baby-soft-gift.jpg", "kind": "IMAGE" }\n]',
        );
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
    let faqItems: Array<{ question: string; answerText: string }> | null = null;
    let seoSections: Array<{ heading: string; bodyText: string }> | null = null;
    let hamperItems:
      | Array<{
          title: string;
          blurb?: string;
          imageUrl?: string;
          qty: number;
          unitPricePaise: number;
          sortOrder?: number;
        }>
      | null = null;
    let media:
      | Array<{
          url: string;
          altText?: string;
          kind?: 'IMAGE' | 'VIDEO';
          posterUrl?: string;
          sortOrder?: number;
        }>
      | undefined = undefined;
    try {
      const parsed = JSON.parse(faqDraft) as unknown;
      if (parsed === null) {
        faqItems = null;
      } else if (!Array.isArray(parsed)) {
        setError('FAQ JSON must be an array');
        return;
      } else {
        const cleaned = parsed
          .filter((row): row is { question?: unknown; answerText?: unknown } => !!row && typeof row === 'object')
          .map((row) => ({
            question: String(row.question ?? '').trim(),
            answerText: String(row.answerText ?? '').trim(),
          }))
          .filter((row) => row.question && row.answerText);
        faqItems = cleaned.length ? cleaned : null;
      }
    } catch {
      setError('FAQ JSON is invalid');
      return;
    }
    try {
      const parsed = JSON.parse(seoSectionsDraft) as unknown;
      if (!Array.isArray(parsed)) {
        setError('SEO sections JSON must be an array');
        return;
      }
      const cleaned = parsed
        .filter((row): row is { heading?: unknown; bodyText?: unknown } => !!row && typeof row === 'object')
        .map((row) => ({
          heading: String(row.heading ?? '').trim(),
          bodyText: String(row.bodyText ?? '').trim(),
        }))
        .filter((row) => row.heading && row.bodyText);
      seoSections = cleaned.length ? cleaned : null;
    } catch {
      setError('SEO sections JSON is invalid');
      return;
    }
    try {
      const parsed = JSON.parse(hamperItemsDraft) as unknown;
      if (!Array.isArray(parsed)) {
        setError('Hamper items JSON must be an array');
        return;
      }
      const cleaned = parsed
        .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
        .map((row, i) => ({
          title: String(row.title ?? '').trim(),
          blurb: row.blurb != null && String(row.blurb).trim() ? String(row.blurb).trim() : undefined,
          brandName:
            row.brandName != null && String(row.brandName).trim()
              ? String(row.brandName).trim()
              : undefined,
          imageUrl:
            row.imageUrl != null && String(row.imageUrl).trim()
              ? String(row.imageUrl).trim()
              : undefined,
          qty: Math.max(1, Number(row.qty) || 1),
          unitPricePaise: Math.max(0, Math.round(Number(row.unitPricePaise) || 0)),
          sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : i,
        }))
        .filter((row) => row.title);
      hamperItems = isReadyMadeHamper ? (cleaned.length ? cleaned : []) : null;
    } catch {
      setError('Hamper items JSON is invalid');
      return;
    }
    try {
      const parsed = JSON.parse(mediaDraft) as unknown;
      if (!Array.isArray(parsed)) {
        setError('Media JSON must be an array');
        return;
      }
      media = parsed
        .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
        .map((row, i) => ({
          url: String(row.url ?? '').trim(),
          altText: row.altText != null ? String(row.altText).trim() : undefined,
          kind: row.kind === 'VIDEO' ? ('VIDEO' as const) : ('IMAGE' as const),
          posterUrl:
            row.posterUrl != null && String(row.posterUrl).trim()
              ? String(row.posterUrl).trim()
              : undefined,
          sortOrder: Number.isFinite(Number(row.sortOrder)) ? Number(row.sortOrder) : i,
        }))
        .filter((row) => row.url);
    } catch {
      setError('Media JSON is invalid');
      return;
    }
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
          seoTitle: seoTitle.trim() || null,
          seoDescription: seoDescription.trim() || null,
          canonicalPath: canonicalPath.trim() || null,
          ogImageUrl: ogImageUrl.trim() || null,
          robotsIndex,
          faqItems,
          seoSections,
          hamperItems,
          media,
        },
      });
      setProduct(updated);
      setStorefrontLabels(updated.storefrontLabels ?? []);
      setSeoTitle(updated.seoTitle ?? '');
      setSeoDescription(updated.seoDescription ?? '');
      setCanonicalPath(updated.canonicalPath ?? '');
      setOgImageUrl(updated.ogImageUrl ?? '');
      setRobotsIndex(updated.robotsIndex !== false);
      setFaqDraft(
        updated.faqItems?.length
          ? JSON.stringify(updated.faqItems, null, 2)
          : '[\n  { "question": "", "answerText": "" }\n]',
      );
      setSeoSectionsDraft(
        updated.seoSections?.length
          ? JSON.stringify(updated.seoSections, null, 2)
          : '[\n  { "heading": "", "bodyText": "" }\n]',
      );
      setHamperItemsDraft(
        updated.hamperItems?.length
          ? JSON.stringify(
              updated.hamperItems.map((h) => ({
                title: h.title,
                blurb: h.blurb ?? undefined,
                brandName: h.brandName ?? undefined,
                imageUrl: h.imageUrl ?? undefined,
                qty: h.qty,
                unitPricePaise: h.unitPricePaise,
                sortOrder: h.sortOrder,
              })),
              null,
              2,
            )
          : '[]',
      );
      setMediaDraft(
        updated.media?.length
          ? JSON.stringify(
              updated.media.map((m, i) => ({
                url: m.url,
                altText: m.altText ?? undefined,
                kind: m.kind ?? 'IMAGE',
                posterUrl: m.posterUrl ?? undefined,
                sortOrder: m.sortOrder ?? i,
              })),
              null,
              2,
            )
          : '[]',
      );
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

  async function setPublish(action: 'publish' | 'unpublish') {
    setError(null);
    setMsg(null);
    try {
      const updated = await apiAuth<CatalogProduct>(
        `/admin/catalog/products/${params.id}/${action}`,
        { method: 'POST' },
      );
      setProduct(updated);
      setMsg(action === 'publish' ? 'Published' : 'Unpublished (draft)');
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    }
  }

  if (error && !product) {
    return <p className="p-6 text-red-600">{error}</p>;
  }
  if (!product) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <OpsPageHeader
        title={product.title}
        description={`${product.slug} · ${product.status}`}
        actions={
          <>
            <Link href="/admin/commerce/products" className="clay-btn-secondary text-sm">
              ← Catalog
            </Link>
            {product.status === 'PUBLISHED' ? (
              <>
                <Link
                  href={`/gift/products/${product.slug}`}
                  className="clay-btn-secondary text-sm"
                  target="_blank"
                >
                  View PDP
                </Link>
                <button
                  type="button"
                  className="clay-btn-secondary text-sm"
                  onClick={() => void setPublish('unpublish')}
                >
                  Unpublish
                </button>
              </>
            ) : (
              <button
                type="button"
                className="clay-btn text-sm"
                onClick={() => void setPublish('publish')}
              >
                Publish
              </button>
            )}
          </>
        }
      />

      <form onSubmit={onSave} className="mt-2 space-y-6 text-sm">
        <section className="space-y-3 rounded border border-[color:var(--gift-line)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Basics</h2>
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
            <span className="mt-1 block text-xs opacity-60">
              Single-SKU brand. For hampers, set brandName per hamper item — PDP shows BRANDS: a, b, c.
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isReadyMadeHamper}
              onChange={(e) => setIsReadyMadeHamper(e.target.checked)}
            />
            Ready-made hamper
          </label>
        </section>

        <section className="space-y-3 rounded border border-[color:var(--gift-line)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">SEO</h2>
          <fieldset className="space-y-2">
          <legend className="sr-only">SEO (PDP)</legend>
          <label className="block text-sm">
            SEO title
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="Defaults to product title"
            />
          </label>
          <label className="block text-sm">
            SEO description
            <textarea
              className="mt-1 block w-full rounded border px-2 py-1"
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Canonical path
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={canonicalPath}
              onChange={(e) => setCanonicalPath(e.target.value)}
              placeholder={`/gift/products/${product?.slug ?? 'slug'}`}
            />
          </label>
          <label className="block text-sm">
            OG image URL
            <input
              className="mt-1 block w-full rounded border px-2 py-1"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="https://…"
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
        </fieldset>
          <label className="block text-sm">
            Product FAQs (JSON array)
            <textarea
              className="mt-1 block w-full rounded border px-2 py-1 font-mono text-xs"
              rows={8}
              value={faqDraft}
              onChange={(e) => setFaqDraft(e.target.value)}
              spellCheck={false}
            />
            <span className="mt-1 block text-xs opacity-60">
              Empty questions are dropped. Clear all → leave empty array / blanks to use PDP fallbacks.
            </span>
          </label>
          <label className="block text-sm">
            SEO sections (JSON — heading + bodyText)
            <textarea
              className="mt-1 block w-full rounded border px-2 py-1 font-mono text-xs"
              rows={8}
              value={seoSectionsDraft}
              onChange={(e) => setSeoSectionsDraft(e.target.value)}
              spellCheck={false}
            />
          </label>
        </section>

        <section className="space-y-3 rounded border border-[color:var(--gift-line)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">Media</h2>
          <label className="block text-sm">
            Gallery media (JSON — url, kind IMAGE|VIDEO, posterUrl)
            <textarea
              className="mt-1 block w-full rounded border px-2 py-1 font-mono text-xs"
              rows={8}
              value={mediaDraft}
              onChange={(e) => setMediaDraft(e.target.value)}
              spellCheck={false}
            />
          </label>
          {isReadyMadeHamper ? (
            <label className="block text-sm">
              Hamper contents (JSON — title, brandName, qty, unitPricePaise, imageUrl)
              <textarea
                className="mt-1 block w-full rounded border px-2 py-1 font-mono text-xs"
                rows={10}
                value={hamperItemsDraft}
                onChange={(e) => setHamperItemsDraft(e.target.value)}
                spellCheck={false}
              />
              <span className="mt-1 block text-xs opacity-60">
                Display BOM for What’s Inside + savings. Optional brandName per item. Prices in paise
                (₹100 = 10000).
              </span>
            </label>
          ) : null}
        </section>

        <section className="space-y-3 rounded border border-[color:var(--gift-line)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
            Tags &amp; merchandising
          </h2>
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
        </section>

        <button type="submit" className="clay-btn px-3 py-2 text-sm">
          Save details
        </button>
      </form>

      <section className="mt-8 space-y-3 rounded border border-[color:var(--gift-line)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-medium uppercase tracking-wide opacity-70">
            Variants · inventory &amp; MRP
          </h2>
          <Link
            href={`/admin/commerce/inventory?q=${encodeURIComponent(product.variants[0]?.sku ?? product.slug)}`}
            className="text-xs underline"
          >
            Open inventory desk
          </Link>
        </div>
        <ul className="space-y-3 text-sm">
          {product.variants.map((v) => (
            <li key={v.id} className="flex flex-wrap items-end gap-2 rounded border p-3">
              <div className="flex-1 min-w-[10rem]">
                <p className="font-medium">
                  {v.label} · {v.sku}
                </p>
                <p className="opacity-70">
                  Sale {formatInr(v.pricePaise)} · available {v.available}
                  {v.onHand != null ? ` · on hand ${v.onHand}` : ''}
                </p>
                <Link
                  href={`/admin/commerce/inventory?q=${encodeURIComponent(v.sku)}`}
                  className="text-xs underline opacity-70"
                >
                  Ledger / adjust
                </Link>
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
