'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { formatInr, type CatalogProduct, type ManualStorefrontLabel } from '@/lib/catalog';
import { opsChipClass } from '@/lib/ops-desk-ui';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsIconButton, OpsIconLink } from '@/components/commerce-ops/ops-icon-action';
import {
  ProductGalleryEditor,
  type GalleryItem,
} from '@/components/commerce-ops/product-gallery-editor';
import {
  ProductVideoField,
  type ProductVideoValue,
} from '@/components/commerce-ops/product-video-field';
import { ArticleEditor } from '@/components/editorial/article-editor';
import { isValidProductVideoUrl } from '@/lib/product-video';
import { ProductSeoSchemaField } from '@/components/admin/product-seo-schema-field';
import { htmlToSeoSections, seoSectionsToHtml } from '@/lib/product-page-content';
import { buildProductFaqItems } from '@/lib/product-faq';
import { getSiteOrigin } from '@/lib/cms-seo';
import { productJsonLd } from '@/lib/seo-json-ld';
import { faqPageJsonLd } from '@/components/gift/faq-json-ld';
import type { SeoSchemaEntry } from '@inabiya/validation';
import { History, Package, Trash2, ArrowLeft, ExternalLink, FilePenLine, Plus } from 'lucide-react';

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
    <button type="button" onClick={onClick} aria-pressed={active} className={opsChipClass(active)}>
      {children}
    </button>
  );
}

function Section({
  id,
  title,
  actions,
  defaultOpen = true,
  children,
}: {
  id: string;
  title: string;
  actions?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    function openThis() {
      setOpen(true);
    }
    function syncFromHash() {
      if (typeof window === 'undefined') return;
      if (window.location.hash === `#${id}`) openThis();
    }
    function onOpenSection(e: Event) {
      if ((e as CustomEvent<string>).detail === id) openThis();
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('product-edit-open-section', onOpenSection);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('product-edit-open-section', onOpenSection);
    };
  }, [id]);

  return (
    <details
      id={id}
      className="group/section clay-panel scroll-mt-24"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-x-3 gap-y-2 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
        <h2 className="font-display text-base">{title}</h2>
        <div className="flex shrink-0 items-center gap-2">
          {actions ? (
            <div
              className="flex flex-wrap items-center gap-2"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {actions}
            </div>
          ) : null}
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs opacity-45 transition-transform group-open/section:rotate-180"
            aria-hidden
          >
            ▾
          </span>
        </div>
      </summary>
      <div className="space-y-4 px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </details>
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
  const [collectionSlugs, setCollectionSlugs] = useState<string[]>([]);
  const [collectionOptions, setCollectionOptions] = useState<
    Array<{ slug: string; title: string }>
  >([]);
  const [storefrontLabels, setStorefrontLabels] = useState<ManualStorefrontLabel[]>([]);
  const [isReadyMadeHamper, setIsReadyMadeHamper] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [canonicalPath, setCanonicalPath] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [robotsIndex, setRobotsIndex] = useState(true);
  const [seoSchemaExtras, setSeoSchemaExtras] = useState<SeoSchemaEntry[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [productVideo, setProductVideo] = useState<ProductVideoValue>({
    url: '',
    posterUrl: '',
    altText: '',
  });
  const [faqMode, setFaqMode] = useState<'default' | 'manual'>('default');
  const [faqs, setFaqs] = useState<FaqRow[]>([{ question: '', answerText: '' }]);
  const [pageContentHtml, setPageContentHtml] = useState('');
  const [hamperRows, setHamperRows] = useState<HamperRow[]>([]);
  const [stock, setStock] = useState<Record<string, string>>({});
  const [mrpRupees, setMrpRupees] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const defaultFaqPreview = useMemo(() => {
    if (!product) return [];
    return buildProductFaqItems({
      faqItems: null,
      personalization: product.personalization ?? [],
      isReadyMadeHamper,
      description: description || product.description,
    });
  }, [product, isReadyMadeHamper, description]);

  const schemaAutoNodes = useMemo(() => {
    if (!product) return [];
    const filledFaqs = faqs.filter((f) => f.question.trim() && f.answerText.trim());
    const faqSource = buildProductFaqItems({
      faqItems: faqMode === 'manual' && filledFaqs.length ? filledFaqs : null,
      personalization: product.personalization ?? [],
      isReadyMadeHamper,
      description: description || product.description,
    });
    const variant = product.variants[0];
    const available = product.variants.some(
      (v) => (stock[v.id] ? Number(stock[v.id]) : v.available) > 0,
    );
    const images = gallery.filter((g) => g.url).map((g) => g.url);
    return [
      productJsonLd({
        name: seoTitle.trim() || title || product.title,
        description: seoDescription.trim() || description || product.description,
        slug: product.slug,
        canonicalPath: canonicalPath.trim() || null,
        imageUrls: images,
        brandName: brandName.trim() || product.brandName || null,
        sku: variant?.sku ?? null,
        pricePaise: variant?.pricePaise ?? product.fromPricePaise,
        availability: available ? 'InStock' : 'OutOfStock',
        siteOrigin: getSiteOrigin(),
      }),
      faqPageJsonLd(faqSource),
    ];
  }, [
    product,
    faqs,
    faqMode,
    isReadyMadeHamper,
    description,
    stock,
    gallery,
    seoTitle,
    title,
    seoDescription,
    canonicalPath,
    brandName,
  ]);

  function hydrate(p: CatalogProduct) {
    setProduct(p);
    setTitle(p.title);
    setDescription(p.description ?? '');
    setRecipientTags(p.recipientTags ?? []);
    setAgeBands(p.ageBands ?? []);
    setOccasionTags(p.occasionTags ?? []);
    setCollectionSlugs((p.collections ?? []).map((c) => c.slug));
    setStorefrontLabels(p.storefrontLabels ?? []);
    setIsReadyMadeHamper(Boolean(p.isReadyMadeHamper));
    setBrandName(p.brandName ?? '');
    setSeoTitle(p.seoTitle ?? '');
    setSeoDescription(p.seoDescription ?? '');
    setCanonicalPath(p.canonicalPath ?? '');
    setOgImageUrl(p.ogImageUrl ?? '');
    setRobotsIndex(p.robotsIndex !== false);
    setSeoSchemaExtras((p.seoSchemaExtras ?? []).filter((e) => e.mode === 'replace').slice(0, 1));
    const media = p.media ?? [];
    const video = media.find((m) => m.kind === 'VIDEO');
    setGallery(
      media
        .filter((m) => m.kind !== 'VIDEO')
        .map((m) => ({
          url: m.url,
          altText: m.altText ?? '',
          kind: 'IMAGE' as const,
        })),
    );
    setProductVideo(
      video
        ? {
            url: video.url,
            posterUrl: video.posterUrl ?? '',
            altText: video.altText ?? '',
          }
        : { url: '', posterUrl: '', altText: '' },
    );
    if (p.faqItems?.length) {
      setFaqMode('manual');
      setFaqs(p.faqItems.map((f) => ({ question: f.question, answerText: f.answerText })));
    } else {
      setFaqMode('default');
      setFaqs([{ question: '', answerText: '' }]);
    }
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
      router.replace(loginUrl(`/admin/commerce/products/${params.id}`));
      return;
    }
    apiAuth<CatalogProduct>(`/admin/catalog/products/${params.id}`)
      .then(hydrate)
      .catch(() => setError('Failed to load product'));
    void apiAuth<Array<{ slug: string; title: string; membershipMode?: string }>>(
      '/admin/catalog/collections',
    )
      .then((rows) =>
        setCollectionOptions(
          rows
            .filter((c) => c.membershipMode !== 'SMART')
            .map((c) => ({ slug: c.slug, title: c.title })),
        ),
      )
      .catch(() => setCollectionOptions([]));
  }, [params.id, router]);

  async function onSave(e?: FormEvent) {
    e?.preventDefault();
    setMsg(null);
    setError(null);
    setSaving(true);

    const faqItems =
      faqMode === 'manual'
        ? faqs
            .map((row) => ({
              question: row.question.trim(),
              answerText: row.answerText.trim(),
            }))
            .filter((row) => row.question && row.answerText)
        : [];

    const seoSections = htmlToSeoSections(pageContentHtml);

    const imageMedia = gallery
      .map((row, i) => ({
        url: row.url.trim(),
        altText: row.altText.trim() || undefined,
        kind: 'IMAGE' as const,
        sortOrder: i,
      }))
      .filter((row) => row.url);

    const videoUrl = productVideo.url.trim();
    if (videoUrl && !isValidProductVideoUrl(videoUrl)) {
      setError('Product video: use a YouTube link or a direct video file (.mp4, .webm, …)');
      setSaving(false);
      return;
    }

    const media = [
      ...imageMedia,
      ...(videoUrl
        ? [
            {
              url: videoUrl,
              altText: productVideo.altText.trim() || undefined,
              kind: 'VIDEO' as const,
              posterUrl: productVideo.posterUrl.trim() || undefined,
              sortOrder: imageMedia.length,
            },
          ]
        : []),
    ];

    let hamperItems: Array<{
      title: string;
      blurb?: string;
      brandName?: string;
      imageUrl?: string;
      qty: number;
      unitPricePaise: number;
      sortOrder: number;
    }> | null = null;

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
          collectionSlugs,
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
          seoSchemaExtras: seoSchemaExtras.length ? seoSchemaExtras : null,
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
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="gift-banner gift-banner--danger" role="alert">
          {error}
        </div>
        <OpsIconLink href="/admin/commerce/products" label="Products" icon={ArrowLeft} />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading product">
          <div className="h-7 w-48 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-4 w-64 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="mt-4 h-40 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
        </div>
      </div>
    );
  }

  const primary =
    gallery[0]?.url ?? product.media.find((m) => m.kind !== 'VIDEO')?.url ?? product.media[0]?.url;
  const published = product.status === 'PUBLISHED';

  return (
    <div className="relative mx-auto max-w-4xl pb-28">
      <OpsIconLink
        href="/admin/commerce/products"
        label="Products"
        icon={ArrowLeft}
        labelFrom="sm"
      />

      {/* Hero summary */}
      <div className="clay-panel mt-4 overflow-hidden">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-stretch sm:p-5">
          <div className="aspect-square w-full max-w-[9rem] shrink-0 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] sm:w-36">
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
                published ? `Live · /gift/products/${product.slug}` : `Draft · ${product.slug}`
              }
              actions={
                <>
                  <span
                    className={
                      published
                        ? 'inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80'
                        : 'inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 ring-1 ring-amber-200/80'
                    }
                  >
                    {published ? 'Published' : 'Draft'}
                  </span>
                  {published ? (
                    <>
                      <OpsIconLink
                        href={`/gift/products/${product.slug}`}
                        label="View product"
                        icon={ExternalLink}
                        variant="secondary"
                        target="_blank"
                      />
                      <OpsIconButton
                        label="Move to draft"
                        icon={FilePenLine}
                        variant="secondary"
                        onClick={() => void setPublish('unpublish')}
                      />
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

        <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border-subtle)] px-3 py-2 sm:px-5">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="clay-chip shrink-0 px-3 py-1.5 text-xs opacity-80 hover:opacity-100"
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent('product-edit-open-section', { detail: item.id }),
                );
              }}
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
              className="clay-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block">
            Description
            <textarea
              className="clay-input"
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
                className="clay-input"
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

        <Section id="media" title="Media">
          <div className="space-y-5">
            <ProductGalleryEditor items={gallery} onChange={setGallery} titleHint={title} />
            <ProductVideoField value={productVideo} onChange={setProductVideo} titleHint={title} />
          </div>
        </Section>

        <Section
          id="pricing"
          title="Pricing & stock"
          actions={
            <OpsIconLink
              href={`/admin/commerce/inventory?q=${encodeURIComponent(product.variants[0]?.sku ?? product.slug)}`}
              label="Inventory desk"
              icon={Package}
            />
          }
        >
          <ul className="space-y-4">
            {product.variants.map((v) => (
              <li
                key={v.id}
                className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface-soft)_55%,white)] px-3 py-2.5 sm:px-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium leading-none">
                      {v.label}
                      <span className="ml-2 font-mono text-[11px] font-normal opacity-55">
                        {v.sku}
                      </span>
                    </p>
                  </div>
                  <OpsIconLink
                    href={`/admin/commerce/inventory?q=${encodeURIComponent(v.sku)}`}
                    label="Stock ledger"
                    icon={History}
                  />
                </div>

                <div className="grid divide-y divide-[var(--border-subtle)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="space-y-1 px-3 py-3 sm:px-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide opacity-50">
                      Sale price
                    </p>
                    <p className="text-base font-medium tabular-nums">{formatInr(v.pricePaise)}</p>
                    <p className="text-[11px] opacity-55">
                      Available {v.available}
                      {v.onHand != null ? ` · on hand ${v.onHand}` : ''}
                    </p>
                    <p className="text-[11px] opacity-45">Change in Inventory desk</p>
                  </div>

                  <div className="space-y-2 px-3 py-3 sm:px-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide opacity-50">
                      Stock
                    </p>
                    <label className="block text-xs">
                      On hand qty
                      <input
                        className="clay-input mt-1"
                        value={stock[v.id] ?? '0'}
                        onChange={(e) => setStock((s) => ({ ...s, [v.id]: e.target.value }))}
                        inputMode="numeric"
                      />
                    </label>
                    <button
                      type="button"
                      className="clay-btn-secondary w-full text-sm"
                      onClick={() => void saveStock(v.id)}
                    >
                      Save stock
                    </button>
                  </div>

                  <div className="space-y-2 px-3 py-3 sm:px-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide opacity-50">
                      MRP
                    </p>
                    <label className="block text-xs">
                      Strike price (₹)
                      <input
                        className="clay-input mt-1"
                        value={mrpRupees[v.id] ?? ''}
                        placeholder="Blank = no MRP"
                        onChange={(e) => setMrpRupees((s) => ({ ...s, [v.id]: e.target.value }))}
                        inputMode="decimal"
                      />
                    </label>
                    <button
                      type="button"
                      className="clay-btn-secondary w-full text-sm"
                      onClick={() => void saveMrp(v.id)}
                    >
                      Save MRP
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="discovery" title="Discovery">
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
            <p className="text-xs opacity-70">Collections</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {collectionOptions.length === 0 ? (
                <span className="text-xs opacity-50">No hand-picked collections yet</span>
              ) : (
                collectionOptions.map((c) => (
                  <Chip
                    key={c.slug}
                    active={collectionSlugs.includes(c.slug)}
                    onClick={() => setCollectionSlugs((t) => toggle(t, c.slug))}
                  >
                    {c.title}
                  </Chip>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="text-xs opacity-70">Gift for</p>
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
            <p className="text-xs opacity-70">Age band</p>
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
              className="clay-input"
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
              className="clay-input"
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
              className="clay-input font-mono text-sm"
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
          <label className="block">
            WhatsApp / social share image
            <input
              className="clay-input text-sm"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
              placeholder="Blank = use main product photo"
            />
          </label>
          <ProductSeoSchemaField
            value={seoSchemaExtras}
            onChange={setSeoSchemaExtras}
            autoPreviewNodes={schemaAutoNodes}
            publicUrl={product ? `${getSiteOrigin()}/gift/products/${product.slug}` : null}
          />
        </Section>

        <Section id="faqs" title="FAQs">
          <p className="text-[11px] opacity-55">Questions shown on the product page</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="product-faq-mode"
                checked={faqMode === 'default'}
                onChange={() => {
                  setFaqMode('default');
                  setFaqs([{ question: '', answerText: '' }]);
                }}
              />
              Use defaults
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="product-faq-mode"
                checked={faqMode === 'manual'}
                onChange={() => {
                  setFaqMode('manual');
                  if (!faqs.some((f) => f.question.trim() || f.answerText.trim())) {
                    setFaqs(
                      defaultFaqPreview.length
                        ? defaultFaqPreview.map((f) => ({
                            question: f.question,
                            answerText: f.answerText,
                          }))
                        : [{ question: '', answerText: '' }],
                    );
                  }
                }}
              />
              Custom FAQs
            </label>
          </div>

          {faqMode === 'default' ? (
            <ul className="space-y-2">
              {defaultFaqPreview.map((row, i) => (
                <li
                  key={i}
                  className="rounded-[var(--radius-control)] border border-[var(--border-subtle)] px-3 py-2"
                >
                  <p className="text-sm font-medium">{row.question}</p>
                  <p className="mt-1 text-xs opacity-70">{row.answerText}</p>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <ul className="space-y-3">
                {faqs.map((row, i) => (
                  <li
                    key={i}
                    className="space-y-2 rounded-[var(--radius-control)] border border-[var(--border-subtle)] p-3"
                  >
                    <label className="block text-xs">
                      Question
                      <input
                        className="clay-input text-sm"
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
                        className="clay-input text-sm"
                        rows={2}
                        value={row.answerText}
                        onChange={(e) =>
                          setFaqs((rows) =>
                            rows.map((r, j) =>
                              j === i ? { ...r, answerText: e.target.value } : r,
                            ),
                          )
                        }
                      />
                    </label>
                    <OpsIconButton
                      label="Remove FAQ"
                      icon={Trash2}
                      labelFrom="sm"
                      className="text-[var(--danger)]"
                      onClick={() => setFaqs((rows) => rows.filter((_, j) => j !== i))}
                    />
                  </li>
                ))}
              </ul>
              <OpsIconButton
                label="Add FAQ"
                icon={Plus}
                variant="secondary"
                onClick={() => setFaqs((rows) => [...rows, { question: '', answerText: '' }])}
              />
            </>
          )}
        </Section>

        <Section id="about" title="About this gift">
          <div className="overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,white)]">
            <ArticleEditor
              key={product.id}
              initialContent={pageContentHtml}
              onChange={setPageContentHtml}
              placeholder="About this gift…"
              showImages={false}
              showCode={false}
              showTable={false}
            />
          </div>
        </Section>

        {isReadyMadeHamper ? (
          <Section id="hamper" title="Hamper contents">
            <ul className="space-y-3">
              {hamperRows.map((row, i) => (
                <li key={i} className="clay-panel grid gap-2 p-3 sm:grid-cols-2">
                  <label className="block text-xs sm:col-span-2">
                    Item title
                    <input
                      className="clay-input text-sm"
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
                      className="clay-input text-sm"
                      value={row.brandName}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, brandName: e.target.value } : r)),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs">
                    Qty
                    <input
                      className="clay-input text-sm"
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
                      className="clay-input text-sm"
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
                      className="clay-input text-sm"
                      value={row.imageUrl}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, imageUrl: e.target.value } : r)),
                        )
                      }
                    />
                  </label>
                  <label className="block text-xs sm:col-span-2">
                    Blurb
                    <input
                      className="clay-input text-sm"
                      value={row.blurb}
                      onChange={(e) =>
                        setHamperRows((rows) =>
                          rows.map((r, j) => (j === i ? { ...r, blurb: e.target.value } : r)),
                        )
                      }
                    />
                  </label>
                  <div className="sm:col-span-2">
                    <OpsIconButton
                      label="Remove item"
                      icon={Trash2}
                      className="text-[var(--danger)]"
                      onClick={() => setHamperRows((rows) => rows.filter((_, j) => j !== i))}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <OpsIconButton
              label="Add item"
              icon={Plus}
              variant="secondary"
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
            />
          </Section>
        ) : null}

        {/* Sticky save */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 md:left-56 lg:left-60">
          <div className="clay-panel pointer-events-auto flex w-full max-w-4xl flex-wrap items-center gap-2 px-4 py-3">
            <button
              type="submit"
              disabled={saving}
              className="clay-btn text-sm disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {msg ? (
              <div className="gift-banner gift-banner--success py-1.5 text-sm" role="status">
                {msg}
              </div>
            ) : null}
            {error ? (
              <div className="gift-banner gift-banner--danger py-1.5 text-sm" role="alert">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}
