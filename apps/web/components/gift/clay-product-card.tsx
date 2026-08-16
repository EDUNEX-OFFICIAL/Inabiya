'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { collectBrandNames } from '@/lib/brands';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { trackEvent } from '@/lib/analytics';
import { ProductLabels } from '@/components/gift/product-labels';
import { ProductBrandLine } from '@/components/gift/product-brand-line';
import { ProductCardMeta } from '@/components/gift/product-card-meta';
import { ProductCardWishlist } from '@/components/gift/product-card-wishlist';
import { HamperContentsTrigger } from '@/components/gift/hamper-contents-modal';
import {
  ProductCardGallery,
  ProductCardHero,
  ProductCardThumbs,
} from '@/components/gift/product-card-hero';
import { CardThumbStrip } from '@/components/gift/card-thumb-strip';

type Props = {
  product: CatalogProduct;
  imageHeightClass?: string;
  /** Instant add of default in-stock variant (related row) */
  showQuickAdd?: boolean;
};

function overlayLabels(product: CatalogProduct) {
  const labels = product.displayLabels ?? [];
  if (product.isReadyMadeHamper) {
    return labels.filter((l) => l.code !== 'GIFT_SET');
  }
  return labels;
}

export function ClayProductCard({
  product,
  imageHeightClass = 'h-44',
  showQuickAdd = false,
}: Props) {
  const out = product.variants.length > 0 && product.variants.every((v) => v.available <= 0);
  const quickVariant = product.variants.find((v) => v.available > 0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const hamperItems = product.hamperItems ?? [];
  const isHamper = Boolean(product.isReadyMadeHamper);
  const itemCount = product.hamperItemCount ?? hamperItems.reduce((s, i) => s + i.qty, 0);
  const brands = product.brandNames?.length ? product.brandNames : collectBrandNames(product);
  const labels = overlayLabels(product);
  const href = `/products/${product.slug}`;
  const ctaLabel = isHamper ? `Gift this · ${formatInr(product.fromPricePaise)}` : 'View details';

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

  const showGalleryThumbs = !(isHamper && hamperItems.some((item) => item.imageUrl));

  return (
    <ProductCardGallery media={product.media} title={product.title}>
      <li className="clay-card flex h-full list-none flex-col overflow-hidden">
        <ProductCardHero
          href={href}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`${imageHeightClass} w-full bg-white/50`}
        >
          <div className="pointer-events-none absolute inset-x-gs-2 top-gs-2 z-10 flex items-start justify-between gap-gs-2">
            <div className="min-w-0 shrink">
              {isHamper && itemCount > 0 ? (
                <span className="inline-block rounded-pill bg-foreground/85 px-gs-2 py-gs-1 text-caption font-semibold text-background">
                  {itemCount} items
                </span>
              ) : null}
            </div>
            <ProductLabels
              labels={labels}
              placement="inline"
              max={2}
              className="max-w-[85%] justify-end"
            />
          </div>
          {showQuickAdd && quickVariant ? (
            <button
              type="button"
              onClick={(e) => void quickAdd(e)}
              disabled={busy}
              className="pointer-events-auto absolute bottom-gs-2 left-gs-2 z-10 rounded-pill bg-white/95 px-gs-3 py-gs-2 text-caption font-semibold text-primary shadow-clay hover:bg-white disabled:opacity-50"
              aria-label={`Quick add ${product.title} to cart`}
            >
              {busy ? '…' : msg === 'Added' ? 'Added ✓' : 'Quick add +'}
            </button>
          ) : null}
          <ProductCardWishlist
            variantId={quickVariant?.id ?? product.variants[0]?.id}
            productTitle={product.title}
          />
        </ProductCardHero>
        <Link href={href} className="block min-w-0">
          <div className="flex flex-col gap-gs-1 p-gs-4 pb-0">
            <p className="line-clamp-2 font-medium leading-snug text-foreground">{product.title}</p>
            <ProductBrandLine
              brands={brands}
              className="min-w-0 truncate !text-[0.625rem] sm:!text-caption"
            />
            <ProductCardMeta
              fromPricePaise={product.fromPricePaise}
              salePricePaise={product.salePricePaise}
              compareAtPaise={product.fromCompareAtPaise}
              rating={product.averageRating}
              count={product.reviewCount}
              extra={
                isHamper && (product.hamperSavingsPaise ?? 0) > 0 ? (
                  <span className="text-caption font-semibold text-[color:var(--danger)]">
                    Save {formatInr(product.hamperSavingsPaise!)}
                  </span>
                ) : null
              }
              priceClassName="text-body text-primary"
            />
            {out ? <p className="text-caption text-danger">Out of stock</p> : null}
            {msg && msg !== 'Added' ? <p className="text-caption text-danger">{msg}</p> : null}
          </div>
        </Link>

        <div className="mt-auto space-y-gs-2 px-gs-4 pb-gs-4 pt-gs-3">
          {showGalleryThumbs ? <ProductCardThumbs /> : null}
          {isHamper ? (
            <>
              <CardThumbStrip
                items={hamperItems.map((item) => ({
                  id: item.id,
                  imageUrl: item.imageUrl,
                  alt: item.title,
                }))}
              />
              <HamperContentsTrigger product={product} variantId={out ? null : quickVariant?.id} />
            </>
          ) : null}

          <Link
            href={href}
            className={`clay-btn w-full !min-h-0 justify-center !px-gs-4 !py-gs-2 text-center text-body ${
              out ? 'pointer-events-none opacity-50' : ''
            }`}
            aria-disabled={out || undefined}
          >
            {out ? 'Out of stock' : ctaLabel}
          </Link>
        </div>
      </li>
    </ProductCardGallery>
  );
}
