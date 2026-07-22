'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { cartApi } from '@/lib/cart-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { trackEvent } from '@/lib/analytics';
import { apiUrl } from '@/lib/api-base';
import { TrackView } from '@/components/track-view';
import { ClayProductCard } from '@/components/gift/clay-product-card';
import { PdpGallery } from '@/components/gift/pdp-gallery';
import { ProductLabels } from '@/components/gift/product-labels';
import { StarRatingSummary } from '@/components/gift/star-rating-summary';
import { TrustStrip } from '@/components/gift/trust-strip';

function labelTag(value: string): string {
  return value.replaceAll('-', ' ');
}

function selectOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string' && v.length > 0);
}

function missingRequiredPersonalization(
  product: CatalogProduct,
  values: Record<string, string>,
): string | null {
  for (const opt of product.personalization) {
    if (!opt.required) continue;
    const v = (values[opt.key] ?? '').trim();
    if (!v) return `Please fill in ${opt.label}`;
  }
  return null;
}

type ReviewList = {
  averageRating: number | null;
  count: number;
  reviews: Array<{
    id: string;
    rating: number;
    headline: string | null;
    body: string;
    authorName: string;
    verifiedPurchase: boolean;
    createdAt: string;
  }>;
};

type RecentReviews = {
  count: number;
  reviews: Array<{
    id: string;
    rating: number;
    headline: string | null;
    body: string;
    authorName: string;
    verifiedPurchase: boolean;
    productTitle: string;
    productSlug: string;
  }>;
};

const AGE_COPY: Record<string, string> = {
  newborn: 'Perfectly sized for newborns (0–3 months)',
  infant: 'Comfortable fit for infants',
  toddler: 'Sized with toddlers in mind',
  any: 'A lovely fit across ages',
};

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [variantId, setVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [personalization, setPersonalization] = useState<Record<string, string>>({});
  const [personalizeOpen, setPersonalizeOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<Pick<
    ReviewList,
    'averageRating' | 'count'
  > | null>(null);
  const [reviewsPayload, setReviewsPayload] = useState<ReviewList | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProduct(null);
    setError(null);
    setMessage(null);
    setPersonalization({});
    setPersonalizeOpen(false);
    setQuantity(1);
    setVariantId('');
    setReviewSummary(null);
    setReviewsPayload(null);

    fetch(apiUrl(`/catalog/products/${params.slug}`))
      .then((r) => {
        if (!r.ok) throw new Error('Product not found');
        return r.json();
      })
      .then((p: CatalogProduct) => {
        if (cancelled) return;
        setProduct(p);
        setVariantId(p.variants[0]?.id ?? '');
        setQuantity(1);
        if (p.personalization.some((o) => o.required)) setPersonalizeOpen(true);
      })
      .catch(() => {
        if (!cancelled) setError('Product not found');
      });

    fetch(apiUrl(`/catalog/products/${params.slug}/reviews`))
      .then((r) => (r.ok ? r.json() : { averageRating: null, count: 0, reviews: [] }))
      .then((payload: ReviewList) => {
        if (cancelled) return;
        setReviewsPayload(payload);
        setReviewSummary({ averageRating: payload.averageRating, count: payload.count });
      })
      .catch(() => {
        if (!cancelled) {
          setReviewsPayload({ averageRating: null, count: 0, reviews: [] });
          setReviewSummary({ averageRating: null, count: 0 });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  const variant = useMemo(
    () => product?.variants.find((v) => v.id === variantId) ?? product?.variants[0],
    [product, variantId],
  );

  const maxQty = Math.min(99, Math.max(0, variant?.available ?? 0));

  useEffect(() => {
    if (maxQty > 0 && quantity > maxQty) setQuantity(maxQty);
    if (maxQty === 0 && quantity !== 1) setQuantity(1);
  }, [maxQty, quantity]);

  const optionalPersonalization = useMemo(
    () => product?.personalization.filter((o) => !o.required) ?? [],
    [product],
  );
  const requiredPersonalization = useMemo(
    () => product?.personalization.filter((o) => o.required) ?? [],
    [product],
  );

  function personalizationPayload(): Record<string, string> {
    if (!product) return {};
    const out: Record<string, string> = {};
    for (const opt of product.personalization) {
      if (!opt.required && !personalizeOpen) continue;
      const v = (personalization[opt.key] ?? '').trim();
      if (v) out[opt.key] = v;
    }
    return out;
  }

  async function addToCart() {
    if (!product || !variant || variant.available <= 0) return;
    const payload = personalizationPayload();
    const missing = missingRequiredPersonalization(product, {
      ...personalization,
      ...payload,
    });
    if (missing) {
      setError(missing);
      setMessage(null);
      setPersonalizeOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await cartApi('/cart/items', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: { variantId: variant.id, quantity, personalization: payload },
      });
      trackEvent('add_to_cart', { productId: product.id });
      setMessage(quantity > 1 ? `Added ${quantity} to cart` : 'Added to cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function addToWishlist() {
    if (!variant) return;
    if (!getStoredAccessToken()) {
      router.push(`/login?next=/gift/products/${params.slug}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiAuth('/catalog/wishlist', { method: 'POST', json: { variantId: variant.id } });
      setMessage('Saved to wishlist');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function addToBox() {
    if (!product || !variant || variant.available <= 0) return;
    if (!getStoredAccessToken()) {
      router.push(`/login?next=/gift/products/${params.slug}`);
      return;
    }
    const payload = personalizationPayload();
    const missing = missingRequiredPersonalization(product, {
      ...personalization,
      ...payload,
    });
    if (missing) {
      setError(missing);
      setMessage(null);
      setPersonalizeOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const box = await apiAuth<{ id: string }>('/catalog/gift-boxes/active');
      await apiAuth(`/catalog/gift-boxes/${box.id}/items`, {
        method: 'POST',
        json: { variantId: variant.id, quantity, personalization: payload },
      });
      await apiAuth('/catalog/gift-boxes', {
        method: 'POST',
        json: { wizardStep: 6 },
      });
      router.push('/gift/build-your-box?continue=1');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setBusy(false);
    }
  }

  if (error && !product) {
    return (
      <main className="gift-page">
        <p>{error}</p>
        <Link href="/gift/products" className="gift-link mt-gs-3 inline-block text-sm">
          ← All products
        </Link>
      </main>
    );
  }

  if (!product) {
    return <main className="gift-page text-sm opacity-70">Loading…</main>;
  }

  const primaryCategory = product.categories[0];
  const inStock = Boolean(variant && variant.available > 0);
  const showOptionalToggle = optionalPersonalization.length > 0;

  return (
    <main className="gift-page flex flex-col gap-gs-6 sm:gap-gs-7">
      <TrackView name="view_pdp" productId={product.id} />

      <nav
        className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm opacity-75"
        aria-label="Breadcrumb"
      >
        <Link href="/gift" className="gift-link shrink-0">
          Gift
        </Link>
        <span aria-hidden className="shrink-0">
          /
        </span>
        {primaryCategory ? (
          <>
            <Link
              href={`/gift/products?category=${primaryCategory.slug}`}
              className="gift-link max-w-[40vw] truncate sm:max-w-none"
            >
              {primaryCategory.name}
            </Link>
            <span aria-hidden className="shrink-0">
              /
            </span>
          </>
        ) : (
          <>
            <Link href="/gift/products" className="gift-link shrink-0">
              Products
            </Link>
            <span aria-hidden className="shrink-0">
              /
            </span>
          </>
        )}
        <span className="min-w-0 truncate text-foreground opacity-100">{product.title}</span>
      </nav>

      <div className="grid gap-gs-6 lg:grid-cols-2 lg:items-start lg:gap-gs-8">
        <PdpGallery key={product.slug} media={product.media} title={product.title} />

        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-gs-2">
            <ProductLabels labels={product.storefrontLabels} placement="inline" />
            {product.brandName ? (
              <span className="clay-chip text-xs">{product.brandName}</span>
            ) : null}
            {product.isReadyMadeHamper ? (
              <span className="clay-chip text-xs">Ready-made hamper</span>
            ) : null}
          </div>

          <h1 className="gift-h1 mt-gs-3 break-words leading-tight">{product.title}</h1>

          <StarRatingSummary
            className="mt-gs-2"
            rating={reviewSummary?.averageRating ?? null}
            count={reviewSummary?.count ?? 0}
            emptyHref="#reviews"
          />

          {product.description ? (
            <p className="mt-gs-3 line-clamp-3 text-body opacity-90">{product.description}</p>
          ) : null}

          {variant ? (
            <p className="mt-gs-4 font-display text-3xl font-semibold tracking-tight text-primary">
              {formatInr(variant.pricePaise)}
            </p>
          ) : (
            <p className="mt-gs-4 text-sm text-danger">This gift has no buyable options yet.</p>
          )}

          <p className={`mt-gs-2 text-sm font-medium ${inStock ? 'text-success' : 'text-danger'}`}>
            {inStock
              ? variant && variant.available <= 5
                ? `Only ${variant.available} left`
                : 'In stock'
              : 'Out of stock'}
          </p>

          {product.variants.length > 1 ? (
            <fieldset className="mt-gs-4">
              <legend className="text-sm font-medium">Choose option</legend>
              <div className="mt-gs-2 flex flex-wrap gap-gs-2">
                {product.variants.map((v) => {
                  const selected = v.id === variantId;
                  const disabled = v.available <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        setVariantId(v.id);
                        setMessage(null);
                        setError(null);
                      }}
                      className={`max-w-full rounded-full border px-gs-3 py-gs-2 text-left text-sm transition ${
                        selected
                          ? 'border-transparent bg-primary text-white shadow-clay'
                          : 'border-border bg-white/80 hover:border-primary/40'
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      <span className="break-words">
                        {v.label} · {formatInr(v.pricePaise)}
                        {disabled ? ' (sold out)' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {requiredPersonalization.map((opt) => (
            <PersonalizationField
              key={opt.key}
              opt={opt}
              value={personalization[opt.key] ?? ''}
              onChange={(v) => setPersonalization((prev) => ({ ...prev, [opt.key]: v }))}
            />
          ))}

          {showOptionalToggle ? (
            <div className="mt-gs-4 rounded-clay border border-border-subtle bg-white/70 px-gs-4 py-gs-3">
              <label className="flex cursor-pointer items-start gap-gs-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={personalizeOpen}
                  onChange={(e) => {
                    setPersonalizeOpen(e.target.checked);
                    if (!e.target.checked) {
                      setPersonalization((prev) => {
                        const next = { ...prev };
                        for (const o of optionalPersonalization) delete next[o.key];
                        return next;
                      });
                    }
                  }}
                />
                <span>
                  <span className="font-medium text-foreground">
                    Add personalisation
                    {optionalPersonalization[0]?.label
                      ? ` — ${optionalPersonalization[0].label}`
                      : ''}
                  </span>
                  <span className="mt-0.5 block text-xs opacity-65">
                    Stitched or noted with care — included when you fill the field below.
                  </span>
                </span>
              </label>
              {personalizeOpen ? (
                <div className="mt-gs-3 border-t border-border-subtle pt-gs-3">
                  {optionalPersonalization.map((opt) => (
                    <PersonalizationField
                      key={opt.key}
                      opt={opt}
                      value={personalization[opt.key] ?? ''}
                      onChange={(v) => setPersonalization((prev) => ({ ...prev, [opt.key]: v }))}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {inStock ? (
            <div className="mt-gs-4 flex flex-wrap items-center gap-gs-3">
              <span className="text-sm font-medium">Quantity</span>
              <div className="inline-flex items-center rounded-full border border-border bg-white/80">
                <button
                  type="button"
                  className="h-11 w-11 text-lg disabled:opacity-40"
                  disabled={quantity <= 1 || busy}
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center text-sm tabular-nums" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="h-11 w-11 text-lg disabled:opacity-40"
                  disabled={quantity >= maxQty || busy}
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                >
                  +
                </button>
              </div>
              {maxQty <= 5 ? <span className="text-xs opacity-60">Max {maxQty}</span> : null}
            </div>
          ) : null}

          <div className="mt-gs-5 flex flex-col gap-gs-3">
            <div className="flex items-stretch gap-gs-2">
              <button
                type="button"
                disabled={busy || !inStock}
                onClick={() => void addToCart()}
                className="clay-btn min-w-0 flex-1 justify-center disabled:opacity-50"
              >
                {busy ? 'Working…' : 'Add to cart'}
              </button>
              <button
                type="button"
                disabled={busy || !variant}
                onClick={() => void addToWishlist()}
                className="clay-btn-ghost h-auto w-12 shrink-0 rounded-full border border-border px-0 disabled:opacity-50"
                aria-label="Save to wishlist"
                title="Save to wishlist"
              >
                <HeartIcon />
              </button>
            </div>
            {variant?.giftBoxEligible ? (
              <button
                type="button"
                disabled={busy || !inStock}
                onClick={() => void addToBox()}
                className="clay-btn-secondary w-full justify-center disabled:opacity-50"
              >
                Add to gift box
              </button>
            ) : null}
          </div>

          {message ? (
            <p className="mt-gs-3 text-sm text-success" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-gs-3 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <TrustStrip />

      <ProductDetailsBand product={product} />

      <RelatedProducts
        slug={product.slug}
        categorySlug={primaryCategory?.slug}
        recipient={product.recipientTags?.[0]}
      />

      <ReviewsSection
        slug={params.slug}
        initial={reviewsPayload}
        onSummaryChange={setReviewSummary}
      />
    </main>
  );
}

function HeartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function PersonalizationField({
  opt,
  value,
  onChange,
}: {
  opt: CatalogProduct['personalization'][number];
  value: string;
  onChange: (v: string) => void;
}) {
  const choices = selectOptions(opt.options);
  const isSelect = opt.type === 'SELECT' && choices.length > 0;
  return (
    <label className="mt-gs-3 block text-sm first:mt-0">
      <span className="font-medium">
        {opt.label}
        {opt.required ? <span className="text-primary"> *</span> : null}
      </span>
      {isSelect ? (
        <select
          className="clay-input mt-gs-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-required={opt.required}
        >
          <option value="">{opt.required ? 'Select…' : 'Optional'}</option>
          {choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      ) : (
        <input
          className="clay-input mt-gs-1"
          maxLength={opt.maxLength ?? 120}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={opt.required ? 'Required' : 'e.g. Aria'}
          aria-required={opt.required}
        />
      )}
      {opt.maxLength && !isSelect ? (
        <span className="mt-gs-1 block text-xs opacity-55">Up to {opt.maxLength} characters</span>
      ) : null}
    </label>
  );
}

function ProductDetailsBand({ product }: { product: CatalogProduct }) {
  const highlights: Array<{ title: string; body: string }> = [];

  highlights.push({
    title: 'Gift-ready',
    body: 'Curated Soft Gift quality — packed with care for the people you love.',
  });

  const ages = product.ageBands ?? [];
  if (ages.length) {
    highlights.push({
      title: 'Age range',
      body: ages.map((a) => AGE_COPY[a] ?? labelTag(a)).join(' · '),
    });
  }

  if (product.personalization.length > 0) {
    highlights.push({
      title: 'Personalise',
      body: 'Add a name or note so this gift feels uniquely theirs.',
    });
  }

  if (product.isReadyMadeHamper) {
    highlights.push({
      title: 'Ready-made hamper',
      body: 'A complete set — no guesswork, just open and gift.',
    });
  }

  const tags: Array<{ href: string; label: string }> = [];
  for (const c of product.categories) {
    tags.push({ href: `/gift/products?category=${c.slug}`, label: c.name });
  }
  for (const t of product.recipientTags ?? []) {
    tags.push({ href: `/gift/products?recipient=${t}`, label: labelTag(t) });
  }
  for (const t of product.ageBands ?? []) {
    tags.push({ href: `/gift/products?age=${t}`, label: labelTag(t) });
  }
  for (const t of product.occasionTags ?? []) {
    tags.push({ href: `/gift/products?occasion=${t}`, label: labelTag(t) });
  }

  return (
    <section className="grid gap-gs-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-gs-6">
      <div className="min-w-0">
        <h2 className="gift-h2">About this gift</h2>
        <p className="mt-gs-3 text-body leading-relaxed opacity-90">
          {product.description ??
            'A thoughtfully chosen Soft Gift piece — ready to personalise and send with love.'}
        </p>
        <ul className="mt-gs-4 space-y-gs-3" aria-label="Gift highlights">
          {highlights.map((h) => (
            <li
              key={h.title}
              className="flex gap-gs-3 rounded-clay border border-border-subtle bg-white/60 px-gs-4 py-gs-3"
            >
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="min-w-0">
                <p className="text-sm font-medium">{h.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed opacity-75">{h.body}</p>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-w-0 space-y-gs-3">
        <details className="clay-panel group open:shadow-clay" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-gs-3 px-gs-5 py-gs-4 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span>Shipping</span>
            <span className="shrink-0 opacity-50" aria-hidden>
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <div className="border-t border-border-subtle px-gs-5 pb-gs-4 text-sm leading-relaxed opacity-80">
            We prepare Soft Gift orders carefully and ship across India. Standard delivery is
            selected at checkout; express options appear when available for your pincode.
          </div>
        </details>
        <details className="clay-panel group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-gs-3 px-gs-5 py-gs-4 text-sm font-medium marker:content-none [&::-webkit-details-marker]:hidden">
            <span>Returns</span>
            <span className="shrink-0 opacity-50" aria-hidden>
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </summary>
          <div className="border-t border-border-subtle px-gs-5 pb-gs-4 text-sm leading-relaxed opacity-80">
            Returns open for 14 days after delivery. Personalised items may have limited return
            eligibility — see your order page for status and how to request a return.
          </div>
        </details>
        {tags.length > 0 ? (
          <div className="pt-gs-1">
            <p className="text-xs font-medium uppercase tracking-wide opacity-55">Shop similar</p>
            <ul className="mt-gs-2 flex flex-wrap gap-gs-2" aria-label="Browse similar">
              {tags.map((t) => (
                <li key={`${t.href}-${t.label}`}>
                  <Link href={t.href} className="clay-chip text-xs capitalize hover:text-primary">
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

async function fetchRelatedCandidates(qs: URLSearchParams): Promise<CatalogProduct[]> {
  const res = await fetch(apiUrl(`/catalog/products?${qs.toString()}`));
  if (!res.ok) return [];
  const list = (await res.json()) as CatalogProduct[];
  return Array.isArray(list) ? list : [];
}

function RelatedProducts({
  slug,
  categorySlug,
  recipient,
}: {
  slug: string;
  categorySlug?: string;
  recipient?: string;
}) {
  const [items, setItems] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const exclude = (list: CatalogProduct[]) => list.filter((p) => p.slug !== slug).slice(0, 4);

      const attempts: URLSearchParams[] = [];
      if (categorySlug) {
        attempts.push(new URLSearchParams({ sort: 'newest', category: categorySlug }));
      }
      if (recipient) {
        attempts.push(new URLSearchParams({ sort: 'newest', recipient }));
      }
      attempts.push(new URLSearchParams({ sort: 'newest' }));

      for (const qs of attempts) {
        try {
          const list = exclude(await fetchRelatedCandidates(qs));
          if (list.length > 0) {
            if (!cancelled) setItems(list);
            return;
          }
        } catch {
          /* try next tier */
        }
      }
      if (!cancelled) setItems([]);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, categorySlug, recipient]);

  if (items.length === 0) return null;

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-gs-3">
        <h2 className="gift-h2">You may also like</h2>
        {categorySlug ? (
          <Link href={`/gift/products?category=${categorySlug}`} className="gift-link text-sm">
            Browse category
          </Link>
        ) : (
          <Link href="/gift/products" className="gift-link text-sm">
            Browse all
          </Link>
        )}
      </div>
      <ul className="mt-gs-4 grid grid-cols-2 gap-gs-3 sm:gap-gs-4 lg:grid-cols-4">
        {items.map((p) => (
          <ClayProductCard
            key={p.id}
            product={p}
            imageHeightClass="h-36 sm:h-40 lg:h-44"
            showQuickAdd
          />
        ))}
      </ul>
    </section>
  );
}

function ReviewsSection({
  slug,
  initial,
  onSummaryChange,
}: {
  slug: string;
  initial: ReviewList | null;
  onSummaryChange: (s: Pick<ReviewList, 'averageRating' | 'count'>) => void;
}) {
  const [data, setData] = useState<ReviewList | null>(initial);
  const [storeWide, setStoreWide] = useState<RecentReviews | null>(null);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setData(initial);
    setFormOpen(false);
    setFormMsg(null);
  }, [initial, slug]);

  useEffect(() => {
    if (!data || data.count > 0) {
      setStoreWide(null);
      return;
    }
    let cancelled = false;
    fetch(apiUrl('/catalog/reviews/recent'))
      .then((r) => (r.ok ? r.json() : { count: 0, reviews: [] }))
      .then((payload: RecentReviews) => {
        if (!cancelled) setStoreWide(payload);
      })
      .catch(() => {
        if (!cancelled) setStoreWide({ count: 0, reviews: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [data]);

  async function submitReview() {
    if (!getStoredAccessToken()) {
      setFormMsg('Sign in to leave a review');
      return;
    }
    if (!body.trim()) {
      setFormMsg('Please write a short review');
      return;
    }
    setSubmitting(true);
    setFormMsg(null);
    try {
      await apiAuth(`/catalog/products/${slug}/reviews`, {
        method: 'POST',
        json: { rating, headline: headline || undefined, body: body.trim() },
      });
      setFormMsg('Thanks — your review is with us for a quick check before it appears.');
      setBody('');
      setHeadline('');
      onSummaryChange({
        averageRating: data?.averageRating ?? null,
        count: data?.count ?? 0,
      });
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  }

  const count = data?.count ?? 0;
  const avg = data?.averageRating;
  const showStoreWide = count === 0 && (storeWide?.reviews.length ?? 0) > 0;

  return (
    <section id="reviews" className="max-w-3xl scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-gs-3">
        <div className="min-w-0">
          <h2 className="gift-h2">Reviews</h2>
          <p className="mt-gs-1 text-sm opacity-70">
            {count === 0
              ? 'Parents are discovering this gift — share your story after it arrives.'
              : `${avg?.toFixed(1) ?? '—'}★ average · ${count} review${count === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          className="clay-btn-secondary shrink-0 text-sm"
          onClick={() => setFormOpen((o) => !o)}
        >
          {formOpen ? 'Hide form' : 'Write a review'}
        </button>
      </div>

      {count > 0 ? (
        <ul className="mt-gs-5 space-y-gs-3">
          {data?.reviews.map((r) => (
            <li key={r.id} className="clay-card p-gs-4 text-sm">
              <p className="font-medium">
                <span aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}</span>
                <span className="opacity-30" aria-hidden>
                  {'★'.repeat(5 - r.rating)}
                </span>
                {r.headline ? <span className="ml-gs-2 break-words">— {r.headline}</span> : null}
              </p>
              <p className="mt-gs-2 break-words opacity-80">{r.body}</p>
              <p className="mt-gs-2 text-xs opacity-60">
                {r.authorName}
                {r.verifiedPurchase ? ' · Verified purchase' : ''}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {showStoreWide ? (
        <div className="mt-gs-5">
          <h3 className="text-sm font-medium">What parents say about Inabiya gifts</h3>
          <ul className="mt-gs-3 space-y-gs-3">
            {storeWide!.reviews.map((r) => (
              <li key={r.id} className="clay-card p-gs-4 text-sm">
                <p className="font-medium">
                  <span aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}</span>
                  <span className="opacity-30" aria-hidden>
                    {'★'.repeat(5 - r.rating)}
                  </span>
                  {r.headline ? <span className="ml-gs-2">— {r.headline}</span> : null}
                </p>
                <p className="mt-gs-2 break-words opacity-80">{r.body}</p>
                <p className="mt-gs-2 text-xs opacity-60">
                  {r.authorName}
                  {' · '}
                  <Link href={`/gift/products/${r.productSlug}`} className="gift-link">
                    {r.productTitle}
                  </Link>
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {formOpen ? (
        <div className="clay-panel mt-gs-6 p-gs-5">
          <h3 className="text-sm font-medium">Write a review</h3>
          <p className="mt-gs-1 text-xs opacity-60">
            Verified purchasers only. Reviews go to moderation first.
          </p>
          <label className="mt-gs-3 block text-sm">
            Rating
            <select
              className="clay-input"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label className="mt-gs-2 block text-sm">
            Headline
            <input
              className="clay-input"
              value={headline}
              maxLength={80}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </label>
          <label className="mt-gs-2 block text-sm">
            Review
            <textarea
              className="clay-input min-h-[80px]"
              value={body}
              maxLength={2000}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </label>
          <button
            type="button"
            className="clay-btn mt-gs-4 disabled:opacity-50"
            disabled={submitting}
            onClick={() => void submitReview()}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          {formMsg ? <p className="mt-gs-2 text-sm opacity-80">{formMsg}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
