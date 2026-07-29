'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct, type ManualStorefrontLabel } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import {
  ProductGalleryEditor,
  type GalleryItem,
} from '@/components/commerce-ops/product-gallery-editor';
import { ArticleEditor } from '@/components/editorial/article-editor';
import { htmlToSeoSections, seoSectionsToHtml } from '@/lib/product-page-content';

const RECIPIENTS = ['girl', 'boy', 'mom', 'unisex'] as const;
const AGES = ['newborn', 'infant', 'toddler', 'any'] as const;
const OCCASIONS = ['welcome-baby', 'baby-shower', 'naming', 'birthday'] as const;
const STOREFRONT_LABELS: Array<{ code: ManualStorefrontLabel; label: string }> = [
  { code: 'BESTSELLER', label: 'Bestseller' },
  { code: 'EDITORS_PICK', label: "Editor's pick" },
  { code: 'GIFT_SET', label: 'Gift set' },
];

type FaqRow = { question: string; answerText: string };
type HamperRow = {
  title: string;
  blurb: string;
  brandName: string;
  imageUrl: string;
  qty: string;
  unitPriceInr: string;
};

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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-[color:var(--primary)]/15 px-3 py-1.5 text-xs font-medium ring-1 ring-[color:var(--primary)]/40'
          : 'rounded-full bg-white px-3 py-1.5 text-xs ring-1 ring-[color:var(--border-subtle)] hover:bg-[color:var(--surface-soft)]'
      }
    >
      {children}
    </button>
  );
}

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 space-y-4 rounded-xl border border-[color:var(--border-subtle)] bg-white/80 p-4 shadow-sm sm:p-5"
    >
      <div>
        <h2 className="font-display text-base">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs opacity-60">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

const NAV = [
  { id: 'details', label: 'Details' },
  { id: 'media', label: 'Media' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'seo', label: 'SEO' },
] as const;

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
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [faqs, setFaqs] = useState<FaqRow[]>([{ question: '', answerText: '' }]);
  const [pageContentHtml, setPageContentHtml] = useState('');
  const [hamperRows, setHamperRows] = useState<HamperRow[]>([]);
  const [stock, setStock] = useState<Record<string, string>>({});
  const [mrpRupees, setMrpRupees] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function hydrate(p: CatalogProduct) {
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
    setGallery(
      p.media?.length
        ? p.media.map((m) => ({
            url: m.url,
            altText: m.altText ?? '',
            kind: m.kind === 'VIDEO' ? 'VIDEO' : 'IMAGE',
            posterUrl: m.posterUrl ?? undefined,
          }))
        : [],
    );
    setFaqs(
      p.faqItems?.length
        ? p.faqItems.map((f) => ({ question: f.question, answerText: f.answerText }))
        : [{ question: '', answerText: '' }],
    );
    setPageContentHtml(seoSectionsToHtml(p.seoSections ?? null));
    setHamperRows(
      p.hamperItems?.length
        ? p.hamperItems.map((h) => ({
            title: h.title,
            blurb: h.blurb ?? '',
            brandName: h.brandName ?? '',
            imageUrl: h.imageUrl ?? '',
            qty: String(h.qty),
            unitPriceInr: String((h.unitPricePaise / 100).toFixed(h.unitPricePaise % 100 ? 2 : 0)),
          }))
        : [],
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
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/products');
      return;
    }
    apiAuth<CatalogProduct>(`/admin/catalog/products/${params.id}`)
      .then(hydrate)
      .catch(() => setError('Failed to load product'));
  }, [params.id, router]);

  async function onSave(e?: FormEvent) {
    e?.preventDefault();
    setMsg(null);
    setError(null);
    setSaving(true);

    const faqItems = faqs
      .map((row) => ({
        question: row.question.trim(),
        answerText: row.answerText.trim(),
      }))
      .filter((row) => row.question && row.answerText);

    const seoSections = htmlToSeoSections(pageContentHtml);

    const media = gallery
      .map((row, i) => ({
        url: row.url.trim(),
        altText: row.altText.trim() || undefined,
        kind: row.kind,
        posterUrl: row.posterUrl?.trim() || undefined,
        sortOrder: i,
      }))
      .filter((row) => row.url);

    let hamperItems:
      | Array<{
          title: string;
          blurb?: string;
          brandName?: string;
          imageUrl?: string;
          qty: number;
          unitPricePaise: number;
          sortOrder: number;
        }>
      | null = null;

    if (isReadyMadeHamper) {
      hamperItems = hamperRows
        .map((row, i) => ({
          title: row.title.trim(),
          blurb: row.blurb.trim() || undefined,
          brandName: row.brandName.trim() || undefined,
          imageUrl: row.imageUrl.trim() || undefined,
          qty: Math.max(1, Number(row.qty) || 1),
          unitPricePaise: Math.max(0, Math.round(Number(row.unitPriceInr) * 100) || 0),
          sortOrder: i,
        }))
        .filter((row) => row.title);
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
          faqItems: faqItems.length ? faqItems : null,
          seoSections,
          hamperItems,
          media,
        },
      });
      hydrate(updated);
      setMsg('Saved');
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
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
      hydrate(refreshed);
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
      hydrate(refreshed);
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
      hydrate(updated);
      setMsg(
        action === 'publish'
          ? 'Published — now live on Soft Gift'
          : 'Moved to draft — hidden from shoppers',
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    }
  }

  if (error && !product) {
    return <p className="p-6 text-red-600">{error}</p>;
  }
  if (!product) {
    return (
      <div className="p-6 text-sm opacity-70">
        <div className="h-8 w-48 animate-pulse rounded bg-black/5" />
        <div className="mt-4 h-40 animate-pulse rounded-xl bg-black/5" />
      </div>
    );
  }

  const primary = gallery[0]?.url ?? product.media[0]?.url;
  const published = product.status === 'PUBLISHED';

  return (
    <div className="relative mx-auto max-w-4xl pb-28">
      <Link href="/admin/commerce/products" className="text-sm underline opacity-70">
        ← Products
      </Link>

      {/* Hero summary */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--border-subtle)] bg-gradient-to-br from-[color:var(--surface-soft)] to-white">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:p-5">
          <div className="aspect-square w-full max-w-[9rem] shrink-0 overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-white sm:w-36">
            {primary ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primary} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs opacity-40">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <OpsPageHeader
              title={title || product.title}
              description={
                published
                  ? `Live · /gift/products/${product.slug}`
                  : `Draft · ${product.slug}`
              }
              actions={
                <>
                  <span
                    className={
                      published
                        ? 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200'
                        : 'inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200'
                    }
                  >
                    {published ? 'Published' : 'Draft'}
                  </span>
                  {published ? (
                    <>
                      <Link
                        href={`/gift/products/${product.slug}`}
                        className="clay-btn-secondary text-sm"
                        target="_blank"
                        rel="noreferrer"
                      >
                        View product
                      </Link>
                      <button
                        type="button"
                        className="clay-btn-secondary text-sm"
                        onClick={() => void setPublish('unpublish')}
                      >
                        Move to draft
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
            <p className="mt-2 text-xs opacity-60">
              Sale from {formatInr(product.fromPricePaise)}
              {product.variants[0] ? ` · SKU ${product.variants[0].sku}` : ''}
            </p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-[color:var(--border-subtle)] px-3 py-2 sm:px-5">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs opacity-70 hover:bg-white hover:opacity-100"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <form onSubmit={(e) => void onSave(e)} className="mt-5 space-y-5 text-sm">
        <Section id="details" title="Details">
          <label className="block">
            Title
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block">
            Description
            <textarea
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What makes this gift special?"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              Brand name
              <input
                className="mt-1 block w-full rounded-lg border px-3 py-2"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Soft Nest"
              />
            </label>
            <label className="flex items-end gap-2 pb-2">
              <input
                type="checkbox"
                checked={isReadyMadeHamper}
                onChange={(e) => {
                  setIsReadyMadeHamper(e.target.checked);
                  if (e.target.checked && hamperRows.length === 0) {
                    setHamperRows([
                      {
                        title: '',
                        blurb: '',
                        brandName: '',
                        imageUrl: '',
                        qty: '1',
                        unitPriceInr: '0',
                      },
                    ]);
                  }
                }}
              />
              <span>Ready-made hamper</span>
            </label>
          </div>
        </Section>

        <Section
          id="media"
          title="Media"
        >
          <ProductGalleryEditor items={gallery} onChange={setGallery} titleHint={title} />
        </Section>

        <Section
          id="pricing"
          title="Pricing & stock"
        >
          <div className="mb-2 flex justify-end">
            <Link
              href={`/admin/commerce/inventory?q=${encodeURIComponent(product.variants[0]?.sku ?? product.slug)}`}
              className="text-xs underline opacity-70"
            >
              Open inventory desk
            </Link>
          </div>
          <ul className="space-y-3">
            {product.variants.map((v) => (
              <li
                key={v.id}
                className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-soft)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {v.label}{' '}
                      <span className="font-mono text-xs opacity-60">{v.sku}</span>
                    </p>
                    <p className="mt-0.5 text-xs opacity-70">
                      Sale {formatInr(v.pricePaise)} · available {v.available}
                      {v.onHand != null ? ` · on hand ${v.onHand}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/admin/commerce/inventory?q=${encodeURIComponent(v.sku)}`}
                    className="text-xs underline opacity-70"
                  >
                    Ledger
                  </Link>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs">
                      On hand
                      <input
                        className="mt-1 block w-28 rounded-lg border px-2 py-1.5"
                        value={stock[v.id] ?? '0'}
                        onChange={(e) => setStock((s) => ({ ...s, [v.id]: e.target.value }))}
                      />
                    </label>
                    <button
                      type="button"
                      className="clay-btn-secondary text-sm"
                      onClick={() => void saveStock(v.id)}
                    >
                      Update stock
                    </button>
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-xs">
                      MRP (₹)
                      <input
                        className="mt-1 block w-28 rounded-lg border px-2 py-1.5"
                        value={mrpRupees[v.id] ?? ''}
                        placeholder="optional"
                        onChange={(e) =>
                          setMrpRupees((s) => ({ ...s, [v.id]: e.target.value }))
                        }
                      />
                    </label>
                    <button
                      type="button"
                      className="clay-btn-secondary text-sm"
                      onClick={() => void saveMrp(v.id)}
                    >
                      Update MRP
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section
          id="discovery"
          title="Discovery"
        >
          <div>
            <p className="text-xs opacity-70">Storefront labels</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {STOREFRONT_LABELS.map(({ code, label }) => (
                <Chip
                  key={code}
                  active={storefrontLabels.includes(code)}
                  onClick={() => setStorefrontLabels((t) => toggleManual(t, code))}
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs opacity-70">Recipient</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {RECIPIENTS.map((r) => (
                <Chip
                  key={r}
                  active={recipientTags.includes(r)}
                  onClick={() => setRecipientTags((t) => toggle(t, r))}
                >
                  {r}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs opacity-70">Age</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AGES.map((a) => (
                <Chip
                  key={a}
                  active={ageBands.includes(a)}
                  onClick={() => setAgeBands((t) => toggle(t, a))}
                >
                  {a}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs opacity-70">Occasion</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {OCCASIONS.map((o) => (
                <Chip
                  key={o}
                  active={occasionTags.includes(o)}
                  onClick={() => setOccasionTags((t) => toggle(t, o))}
                >
                  {o}
                </Chip>
              ))}
            </div>
          </div>
        </Section>

        <Section id="seo" title="SEO">
          <label className="block">
            SEO title
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder={title || 'Defaults to product title'}
              maxLength={200}
            />
            <span className="mt-1 block text-[11px] opacity-50">
              {(seoTitle || title).length}/200
            </span>
          </label>
          <label className="block">
            SEO description
            <textarea
              className="mt-1 block w-full rounded-lg border px-3 py-2"
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={500}
            />
            <span className="mt-1 block text-[11px] opacity-50">{seoDescription.length}/500</span>
          </label>
          <label className="block">
            Canonical path
            <input
              className="mt-1 block w-full rounded-lg border px-3 py-2 font-mono text-sm"
              value={canonicalPath}
              onChange={(e) => setCanonicalPath(e.target.value)}
              placeholder={`/gift/products/${product.slug}`}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={robotsIndex}
              onChange={(e) => setRobotsIndex(e.target.checked)}
            />
            Allow search indexing
          </label>
          <details className="rounded-lg border border-[color:var(--border-subtle)] p-3">
            <summary className="cursor-pointer text-xs opacity-70">
              Custom share image
            </summary>
            <input
              className="mt-2 block w-full rounded-lg border px-3 py-2 text-sm"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="Share image URL"
            />
          </details>
        </Section>

        <Section id="faqs" title="FAQs">
          <ul className="space-y-3">
            {faqs.map((row, i) => (
              <li key={i} className="space-y-2 rounded-lg border border-[color:var(--border-subtle)] p-3">
                <label className="block text-xs">
                  Question
                  <input
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    value={row.question}
                    onChange={(e) =>
                      setFaqs((rows) =>
                        rows.map((r, j) => (j === i ? { ...r, question: e.target.value } : r)),
                      )
                    }
                  />
                </label>
                <label className="block text-xs">
                  Answer
                  <textarea
                    className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                    rows={2}
                    value={row.answerText}
                    onChange={(e) =>
                      setFaqs((rows) =>
                        rows.map((r, j) => (j === i ? { ...r, answerText: e.target.value } : r)),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-red-700 underline"
                  onClick={() => setFaqs((rows) => rows.filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="clay-btn-secondary text-sm"
            onClick={() => setFaqs((rows) => [...rows, { question: '', answerText: '' }])}
          >
            Add FAQ
          </button>
        </Section>

        <details className="rounded-xl border border-[color:var(--border-subtle)] bg-white/80 p-4" open>
          <summary className="cursor-pointer font-display text-base">
            Product page content
          </summary>
          <div className="mt-3 overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-white">
            <ArticleEditor
              key={product.id}
              initialContent={pageContentHtml}
              onChange={setPageContentHtml}
              placeholder="Content…"
              showImages={false}
              showCode={false}
              showTable={false}
            />
          </div>
        </details>

        {isReadyMadeHamper ? (
          <Section
            id="hamper"
            title="Hamper contents"
          >
            <ul className="space-y-3">
              {hamperRows.map((row, i) => (
                <li
                  key={i}
                  className="grid gap-2 rounded-lg border border-[color:var(--border-subtle)] p-3 sm:grid-cols-2"
                >
                  <label className="block text-xs sm:col-span-2">
                    Item title
                    <input
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      value={row.title}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    Brand
                    <input
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      value={row.brandName}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, brandName: e.target.value } : r,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    Qty
                    <input
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      value={row.qty}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, qty: e.target.value } : r)),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    Unit price (₹)
                    <input
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      value={row.unitPriceInr}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, unitPriceInr: e.target.value } : r,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    Image URL
                    <input
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      value={row.imageUrl}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) =>
                            j === i ? { ...r, imageUrl: e.target.value } : r,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs sm:col-span-2">
                    Blurb
                    <input
                      className="mt-1 block w-full rounded-lg border px-3 py-2 text-sm"
                      value={row.blurb}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, blurb: e.target.value } : r)),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="text-xs text-red-700 underline sm:col-span-2"
                    onClick={() => setHamperRows((rows) => rows.filter((_, j) => j !== i))}
                  >
                    Remove item
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="clay-btn-secondary text-sm"
              onClick={() =>
                setHamperRows((rows) => [
                  ...rows,
                  {
                    title: '',
                    blurb: '',
                    brandName: '',
                    imageUrl: '',
                    qty: '1',
                    unitPriceInr: '0',
                  },
                ])
              }
            >
              Add item
            </button>
          </Section>
        ) : null}

        {/* Sticky save */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 md:left-56 lg:left-60">
          <div className="pointer-events-auto flex w-full max-w-4xl flex-wrap items-center gap-2 rounded-xl border border-[color:var(--border-subtle)] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
            <button type="submit" disabled={saving} className="clay-btn text-sm disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {msg ? <p className="text-sm text-emerald-700">{msg}</p> : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
        </div>
      </form>
    </div>
  );
}
