'use client';

import Link from 'next/link';
import { useState, type MouseEvent } from 'react';
import { Check, Gift, Loader2, ShoppingBag } from 'lucide-react';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { trackEvent } from '@/lib/analytics';
import { ProductLabels } from '@/components/gift/product-labels';
import { ProductBrandLine } from '@/components/gift/product-brand-line';
import { ProductCardMeta } from '@/components/gift/product-card-meta';
import { ProductCardWishlist } from '@/components/gift/product-card-wishlist';
import { GiftResponsiveButton, GiftResponsiveLink } from '@/components/gift/gift-responsive-cta';
import { HamperContentsTrigger } from '@/components/gift/hamper-contents-modal';
import {
  ProductCardGallery,
  ProductCardHero,
  ProductCardThumbs,
} from '@/components/gift/product-card-hero';
import type { CmsBlockProduct } from '@/components/cms/marketing-page-types';

type Props = {
  product: CmsBlockProduct;
  featured?: boolean;
  /** When true (hamper grid), skip redundant “Ready-made hamper” chip. */
  hideHamperChip?: boolean;
};

/** Homepage / CMS product card with optional quick-add (client island). */
export function HomeProductCard({ product, featured = false, hideHamperChip = false }: Props) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const canQuickAdd =
    Boolean(product.quickAddVariantId) && (product.available == null || product.available > 0);

  async function quickAdd(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product.quickAddVariantId || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await cartApi('/cart/items', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: { variantId: product.quickAddVariantId, quantity: 1 },
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
    <ProductCardGallery media={product.media} title={product.title}>
      <div
        className={`group clay-card relative overflow-hidden ${
          featured
            ? 'sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]'
            : 'flex h-full flex-col'
        }`}
      >
        <ProductCardHero
          href={`/products/${product.slug}`}
          sizes={
            featured
              ? '(max-width: 640px) 100vw, 55vw'
              : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
          }
          className={featured ? 'aspect-[4/3] sm:aspect-auto sm:min-h-[16rem]' : 'aspect-[4/3]'}
          imageClassName="transition duration-500 group-hover:scale-[1.03]"
          linkTestId={`home-product-media-${product.slug}`}
        >
          <div className="pointer-events-none absolute inset-x-gs-2 top-gs-2 z-10 flex items-start justify-between gap-gs-2">
            <div className="min-w-0 shrink">
              {product.isReadyMadeHamper && (product.hamperItemCount ?? 0) > 0 ? (
                <span className="inline-block rounded-pill bg-foreground/85 px-gs-2 py-gs-1 text-caption font-semibold text-background">
                  {product.hamperItemCount} items
                </span>
              ) : null}
            </div>
            <ProductLabels
              labels={
                product.isReadyMadeHamper
                  ? (product.displayLabels ?? []).filter((l) => l.code !== 'GIFT_SET')
                  : product.displayLabels
              }
              placement="inline"
              max={1}
              className="max-w-[85%] justify-end"
            />
          </div>
          <ProductCardWishlist
            variantId={product.wishlistVariantId ?? product.quickAddVariantId}
            productTitle={product.title}
          />
        </ProductCardHero>
        <div
          className={`gift-cta-host flex min-w-0 flex-col p-gs-4 ${
            featured ? 'justify-center sm:p-gs-6' : 'flex-1'
          }`}
        >
          <div className="flex min-w-0 flex-col gap-gs-1">
            {product.isReadyMadeHamper && !hideHamperChip ? (
              <span className="clay-chip w-fit text-caption">Ready-made hamper</span>
            ) : null}
            <Link
              href={`/products/${product.slug}`}
              className={`line-clamp-2 font-medium leading-snug text-foreground transition-colors hover:text-primary ${
                featured ? 'gift-h2' : ''
              }`}
            >
              {product.title}
            </Link>
            <ProductBrandLine
              brands={
                product.brandNames?.length
                  ? product.brandNames
                  : product.brandName
                    ? [product.brandName]
                    : []
              }
              className="min-w-0 truncate !text-[0.625rem] sm:!text-caption"
            />
            <ProductCardMeta
              fromPricePaise={product.fromPricePaise}
              salePricePaise={product.salePricePaise}
              compareAtPaise={product.fromCompareAtPaise}
              fromPrefix
              rating={product.averageRating}
              count={product.reviewCount}
              className={featured ? 'mt-gs-1' : ''}
              priceClassName={featured ? 'text-h2 text-foreground' : 'text-body text-foreground'}
            />
            {product.isReadyMadeHamper ? (
              <HamperContentsTrigger
                product={product}
                variantId={canQuickAdd ? product.quickAddVariantId : null}
              />
            ) : null}
            <ProductCardThumbs className={featured ? 'mt-gs-2' : 'mt-gs-1'} />
          </div>
          <div
            className={`flex flex-nowrap items-center gap-gs-2 ${
              featured ? 'mt-gs-4' : 'mt-auto pt-gs-3'
            }`}
          >
            <GiftResponsiveLink
              href={`/products/${product.slug}`}
              label="View gift"
              icon={Gift}
              labelFrom={canQuickAdd ? 'container' : 'always'}
              className="min-w-0 flex-1 shrink text-body sm:!min-h-0 sm:!px-gs-4 sm:!py-gs-2"
              data-testid={`home-product-view-${product.slug}`}
            />
            {canQuickAdd ? (
              <GiftResponsiveButton
                onClick={(e) => void quickAdd(e)}
                disabled={busy}
                label={busy ? 'Adding…' : msg === 'Added' ? 'Added' : 'Add to cart'}
                icon={busy ? Loader2 : msg === 'Added' ? Check : ShoppingBag}
                variant="secondary"
                className={`min-w-0 flex-1 shrink text-body sm:!min-h-0 sm:!px-gs-4 sm:!py-gs-2 disabled:opacity-50 ${
                  busy ? '[&_svg]:animate-spin motion-reduce:[&_svg]:animate-none' : ''
                }`}
                aria-label={
                  busy
                    ? `Adding ${product.title} to cart`
                    : msg === 'Added'
                      ? `${product.title} added to cart`
                      : `Add ${product.title} to cart`
                }
                data-testid={`home-product-add-${product.slug}`}
              />
            ) : null}
          </div>
          {msg && msg !== 'Added' ? (
            <p className="mt-gs-2 text-caption text-danger">{msg}</p>
          ) : null}
        </div>
      </div>
    </ProductCardGallery>
  );
}
