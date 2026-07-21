'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { cartApi } from '@/lib/cart-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { trackEvent } from '@/lib/analytics';
import { apiUrl } from '@/lib/api-base';
import { TrackView } from '@/components/track-view';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [variantId, setVariantId] = useState('');
  const [personalization, setPersonalization] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/catalog/products/${params.slug}`))
      .then((r) => r.json())
      .then((p: CatalogProduct) => {
        setProduct(p);
        setVariantId(p.variants[0]?.id ?? '');
      })
      .catch(() => setError('Product not found'));
  }, [params.slug]);

  async function addToCart() {
    try {
      await cartApi('/cart/items', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: { variantId, quantity: 1, personalization },
      });
      if (product) trackEvent('add_to_cart', { productId: product.id });
      setMessage('Added to cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function addToWishlist() {
    if (!getStoredAccessToken()) {
      router.push(`/login?next=/gift/products/${params.slug}`);
      return;
    }
    try {
      await apiAuth('/catalog/wishlist', { method: 'POST', json: { variantId } });
      setMessage('Added to wishlist');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function addToBox() {
    if (!getStoredAccessToken()) {
      router.push(`/login?next=/gift/products/${params.slug}`);
      return;
    }
    try {
      const box = await apiAuth<{ id: string }>('/catalog/gift-boxes/active');
      await apiAuth(`/catalog/gift-boxes/${box.id}/items`, {
        method: 'POST',
        json: { variantId, quantity: 1, personalization },
      });
      await apiAuth('/catalog/gift-boxes', {
        method: 'POST',
        json: { wizardStep: 6 },
      });
      router.push('/gift/box');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (error && !product) {
    return (
      <main className="gift-page">
        <p>{error}</p>
        <Link href="/gift/products" className="underline">
          Back
        </Link>
      </main>
    );
  }

  if (!product) {
    return <main className="p-gs-6 text-sm opacity-70">Loading…</main>;
  }

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];

  return (
    <main className="gift-page">
      {product ? <TrackView name="view_pdp" productId={product.id} /> : null}
      <Link href="/gift/products" className="gift-link text-sm">
        ← All products
      </Link>
      <div className="mt-gs-6 grid gap-gs-6 lg:grid-cols-2 lg:gap-gs-7">
        <div className="clay-card overflow-hidden">
          {product.media[0]?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.media[0].url}
              alt={product.media[0].altText ?? product.title}
              className="max-h-[320px] w-full object-cover sm:max-h-[480px]"
            />
          ) : (
            <div className="h-56 gift-media-fallback sm:h-80" />
          )}
        </div>
        <div>
          <h1 className="gift-h1 leading-tight">{product.title}</h1>
          <p className="mt-gs-3 text-body opacity-90">{product.description}</p>
          {variant ? (
            <p className="mt-gs-5 text-2xl font-semibold text-primary">
              {formatInr(variant.pricePaise)}
            </p>
          ) : null}

          {product.variants.length > 1 ? (
            <label className="mt-gs-5 block text-sm">
              Variant
              <select
                className="clay-input"
                value={variantId}
                onChange={(e) => setVariantId(e.target.value)}
              >
                {product.variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.available <= 0}>
                    {v.label} — {formatInr(v.pricePaise)}
                    {v.available <= 0 ? ' (out of stock)' : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {product.personalization.map((opt) => (
            <label key={opt.key} className="mt-gs-3 block text-sm">
              {opt.label}
              {opt.required ? ' *' : ''}
              <input
                className="clay-input"
                maxLength={opt.maxLength ?? 120}
                value={personalization[opt.key] ?? ''}
                onChange={(e) =>
                  setPersonalization((prev) => ({ ...prev, [opt.key]: e.target.value }))
                }
              />
            </label>
          ))}

          <div className="mt-gs-6 flex flex-col gap-gs-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!variant || variant.available <= 0}
              onClick={() => void addToCart()}
              className="clay-btn w-full justify-center disabled:opacity-50 sm:w-auto"
            >
              Add to cart
            </button>
            <button
              type="button"
              disabled={!variant || variant.available <= 0}
              onClick={() => void addToBox()}
              className="clay-btn-secondary w-full justify-center disabled:opacity-50 sm:w-auto"
            >
              Add to gift box
            </button>
            <button
              type="button"
              disabled={!variant}
              onClick={() => void addToWishlist()}
              className="clay-btn-ghost w-full justify-center disabled:opacity-50 sm:w-auto"
            >
              Wishlist
            </button>
          </div>
          {message ? <p className="mt-gs-3 text-sm text-success">{message}</p> : null}
          {error ? <p className="mt-gs-3 text-sm text-danger">{error}</p> : null}
        </div>
      </div>

      <ReviewsSection slug={params.slug} />
    </main>
  );
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

function ReviewsSection({ slug }: { slug: string }) {
  const [data, setData] = useState<ReviewList | null>(null);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [formMsg, setFormMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/catalog/products/${slug}/reviews`))
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ averageRating: null, count: 0, reviews: [] }));
  }, [slug]);

  async function submitReview() {
    if (!getStoredAccessToken()) {
      setFormMsg('Sign in to leave a review');
      return;
    }
    try {
      await apiAuth(`/catalog/products/${slug}/reviews`, {
        method: 'POST',
        json: { rating, headline: headline || undefined, body },
      });
      setFormMsg('Thanks — review submitted for moderation.');
      setBody('');
      setHeadline('');
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : 'Could not submit review');
    }
  }

  return (
    <section className="mt-gs-8 max-w-2xl">
      <h2 className="gift-h2">Reviews</h2>
      {data ? (
        <p className="mt-gs-1 text-sm opacity-70">
          {data.count === 0
            ? 'No reviews yet.'
            : `${data.averageRating}★ · ${data.count} review${data.count === 1 ? '' : 's'}`}
        </p>
      ) : null}
      <ul className="mt-gs-4 space-y-gs-3">
        {data?.reviews.map((r) => (
          <li key={r.id} className="clay-card p-gs-4 text-sm">
            <p className="font-medium">
              {r.rating}★ {r.headline ? `— ${r.headline}` : ''}
            </p>
            <p className="mt-gs-1 opacity-80">{r.body}</p>
            <p className="mt-gs-2 text-xs opacity-60">
              {r.authorName}
              {r.verifiedPurchase ? ' · Verified purchase' : ''}
            </p>
          </li>
        ))}
      </ul>

      <div className="clay-panel mt-gs-6 p-gs-5">
        <h3 className="font-medium text-sm">Write a review</h3>
        <p className="text-xs opacity-60 mt-gs-1">
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
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-gs-2 block text-sm">
          Headline
          <input
            className="clay-input"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />
        </label>
        <label className="mt-gs-2 block text-sm">
          Review
          <textarea
            className="clay-input min-h-[80px]"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <button type="button" className="clay-btn mt-gs-4" onClick={() => void submitReview()}>
          Submit
        </button>
        {formMsg ? <p className="mt-gs-2 text-sm opacity-80">{formMsg}</p> : null}
      </div>
    </section>
  );
}
