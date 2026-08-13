'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, type MouseEvent } from 'react';
import { Check, Gift, Loader2, ShoppingBag } from 'lucide-react';
import { formatInr } from '@/lib/catalog';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { trackEvent } from '@/lib/analytics';
import { ProductLabels } from '@/components/gift/product-labels';
import { ProductBrandLine } from '@/components/gift/product-brand-line';
import { GiftResponsiveButton, GiftResponsiveLink } from '@/components/gift/gift-responsive-cta';
import type { CmsBlockProduct } from '@/components/cms/marketing-page-types';

type Props = {
  product: CmsBlockProduct;
  featured?: boolean;
  /** When true (hamper grid), skip redundant “Ready-made hamper” chip. */
  hideHamperChip?: boolean;
};

/** Homepage / CMS product card with optional quick-add (client island). */
export function HomeProductCard({ product, featured = false, hideHamperChip = false }: Props) {
  const img = product.media[0];
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
    <div
      className={`group clay-card relative overflow-hidden ${
        featured ? 'sm:grid sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]' : ''
      }`}
    >
      <div
        className={`relative overflow-hidden bg-white/40 ${
          featured ? 'aspect-[4/3] sm:aspect-auto sm:min-h-[16rem]' : 'aspect-[4/3]'
        }`}
      >
        <Link
          href={`/gift/products/${product.slug}`}
          className="absolute inset-0 block"
          data-testid={`home-product-media-${product.slug}`}
        >
          {img?.url ? (
            <Image
              src={img.url}
              alt={img.altText ?? product.title}
              fill
              sizes={
                featured
                  ? '(max-width: 640px) 100vw, 55vw'
                  : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
              }
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="gift-media-fallback absolute inset-0" />
          )}
        </Link>
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
            className="max-w-[65%] justify-end"
          />
        </div>
      </div>
      <div
        className={`gift-cta-host flex min-w-0 flex-col justify-center p-gs-4 ${featured ? 'sm:p-gs-6' : ''}`}
      >
        {product.isReadyMadeHamper && !hideHamperChip ? (
          <span className="clay-chip w-fit text-caption">Ready-made hamper</span>
        ) : null}
        <Link
          href={`/gift/products/${product.slug}`}
          className={`font-medium leading-snug text-foreground transition-colors hover:text-primary ${
            product.isReadyMadeHamper && !hideHamperChip
              ? featured
                ? 'mt-gs-3 gift-h2'
                : 'mt-gs-2'
              : featured
                ? 'gift-h2'
                : ''
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
          className={`!text-caption ${featured ? 'mt-gs-2' : 'mt-gs-1'}`}
        />
        <p
          className={`font-semibold text-foreground ${
            featured ? 'mt-gs-3 text-h2' : 'mt-gs-2 text-body'
          }`}
        >
          From {formatInr(product.fromPricePaise)}
        </p>
        {product.isReadyMadeHamper && (product.hamperItemCount ?? 0) > 0 ? (
          <p className={`text-caption opacity-70 ${featured ? 'mt-gs-2' : 'mt-gs-1'}`}>
            {product.hamperItemCount} curated items in this set
          </p>
        ) : null}
        <div className="mt-gs-4 flex flex-nowrap items-center gap-gs-2">
          <GiftResponsiveLink
            href={`/gift/products/${product.slug}`}
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
        {msg && msg !== 'Added' ? <p className="mt-gs-2 text-caption text-danger">{msg}</p> : null}
      </div>
    </div>
  );
}
