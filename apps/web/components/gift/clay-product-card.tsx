'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { trackEvent } from '@/lib/analytics';
import { ProductLabels } from '@/components/gift/product-labels';

type Props = {
  product: CatalogProduct;
  imageHeightClass?: string;
  /** Instant add of default in-stock variant (related row) */
  showQuickAdd?: boolean;
};

export function ClayProductCard({
  product,
  imageHeightClass = 'h-44',
  showQuickAdd = false,
}: Props) {
  const img = product.media[0];
  const out = product.variants.length > 0 && product.variants.every((v) => v.available <= 0);
  const quickVariant = product.variants.find((v) => v.available > 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function quickAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!quickVariant || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await cartApi('/cart/items', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: { variantId: quickVariant.id, quantity: 1 },
      });
      trackEvent('add_to_cart', { productId: product.id });
      setMsg('Added');
    } catch {
      setMsg('Couldn’t add');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="clay-card overflow-hidden list-none">
      <Link href={`/gift/products/${product.slug}`} className="block">
        <div className="relative bg-white/50">
          {img?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.url}
              alt={img.altText ?? product.title}
              className={`${imageHeightClass} w-full object-cover`}
            />
          ) : (
            <div className={`${imageHeightClass} w-full gift-media-fallback`} />
          )}
          <ProductLabels labels={product.displayLabels} placement="overlay" />
          {showQuickAdd && quickVariant ? (
            <button
              type="button"
              onClick={(e) => void quickAdd(e)}
              disabled={busy}
              className="absolute bottom-gs-2 right-gs-2 z-10 rounded-full bg-white/95 px-gs-3 py-1.5 text-xs font-semibold text-primary shadow-clay hover:bg-white disabled:opacity-50"
              aria-label={`Quick add ${product.title} to cart`}
            >
              {busy ? '…' : msg === 'Added' ? 'Added ✓' : 'Quick add +'}
            </button>
          ) : null}
        </div>
        <div className="p-gs-4">
          <p className="font-medium leading-snug text-foreground">{product.title}</p>
          <p className="mt-gs-2 text-sm font-semibold text-primary">
            {formatInr(product.fromPricePaise)}
          </p>
          {product.isReadyMadeHamper ? (
            <p className="mt-gs-1 text-xs opacity-70">Ready-made hamper</p>
          ) : null}
          {out ? <p className="mt-gs-2 text-xs text-danger">Out of stock</p> : null}
          {msg && msg !== 'Added' ? <p className="mt-gs-1 text-xs text-danger">{msg}</p> : null}
        </div>
      </Link>
    </li>
  );
}
