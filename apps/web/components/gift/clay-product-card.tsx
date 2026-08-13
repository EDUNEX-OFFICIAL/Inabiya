'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { collectBrandNames } from '@/lib/brands';
import { formatInr, type CatalogProduct } from '@/lib/catalog';
import { trackEvent } from '@/lib/analytics';
import { ProductLabels } from '@/components/gift/product-labels';
import { ProductBrandLine } from '@/components/gift/product-brand-line';
import { lockPageScroll } from '@/lib/scroll-lock';

type Props = {
  product: CatalogProduct;
  imageHeightClass?: string;
  /** Instant add of default in-stock variant (related row) */
  showQuickAdd?: boolean;
};

type HamperItem = NonNullable<CatalogProduct['hamperItems']>[number];

/** Show all thumbs up to 4; if more than 4, show 3 + “+N”. */
const THUMB_FULL_MAX = 4;
const THUMB_OVERFLOW_VISIBLE = 3;

function overlayLabels(product: CatalogProduct) {
  const labels = product.displayLabels ?? [];
  if (product.isReadyMadeHamper) {
    return labels.filter((l) => l.code !== 'GIFT_SET');
  }
  return labels;
}

function HamperContentsModal({
  open,
  onClose,
  product,
  items,
  itemCount,
}: {
  open: boolean;
  onClose: () => void;
  product: CatalogProduct;
  items: HamperItem[];
  itemCount: number;
}) {
  const dialogTitleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const savings = product.hamperSavingsPaise ?? 0;
  const href = `/gift/products/${product.slug}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const unlock = lockPageScroll();
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      unlock();
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center overflow-hidden overscroll-none p-gs-3 sm:items-center sm:p-gs-5"
      role="presentation"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-foreground/45 backdrop-blur-[2px]" aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className="relative flex max-h-[min(88vh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-clay border border-border-subtle bg-surface shadow-clay-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border-subtle bg-primary/[0.06] px-gs-5 pb-gs-3 pt-gs-4">
          <div className="flex items-start justify-between gap-gs-3">
            <div className="min-w-0">
              <p className="text-caption font-semibold uppercase tracking-[0.1em] text-primary/80">
                Ready-made hamper
              </p>
              <h2 id={dialogTitleId} className="gift-h2 mt-gs-1">
                What’s inside
              </h2>
              <p className="gift-muted mt-gs-1 truncate">
                {product.title}
                {itemCount > 0 ? ` · ${itemCount} items` : ''}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-pill border border-border-subtle bg-surface text-lg leading-none text-foreground/70 hover:bg-surface-soft hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-gs-2 overflow-y-auto overscroll-contain px-gs-4 py-gs-3 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex gap-gs-3 rounded-control border border-border-subtle bg-surface/70 p-gs-3"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-control bg-foreground/5 ring-1 ring-border-subtle sm:size-16">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="gift-media-fallback h-full w-full" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-foreground">
                  {item.title}
                  {item.qty > 1 ? (
                    <span className="ml-gs-1 text-caption font-normal opacity-60">×{item.qty}</span>
                  ) : null}
                </p>
                {item.brandName ? (
                  <p className="mt-gs-1 text-caption text-foreground/55">
                    <span className="font-semibold uppercase tracking-wide">Brand:</span>{' '}
                    {item.brandName}
                  </p>
                ) : null}
                <p className="mt-gs-1 text-body font-semibold text-primary">
                  {formatInr(item.unitPricePaise)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="shrink-0 space-y-gs-3 border-t border-border-subtle bg-foreground/[0.02] px-gs-5 py-gs-4">
          <div className="flex flex-wrap items-end justify-between gap-gs-2">
            <div>
              {product.contentsValuePaise != null &&
              product.contentsValuePaise > product.fromPricePaise ? (
                <p className="text-caption text-foreground/50 line-through">
                  Worth {formatInr(product.contentsValuePaise)}
                </p>
              ) : null}
              <p className="font-display text-h2 font-semibold tracking-tight text-primary">
                {formatInr(product.fromPricePaise)}
              </p>
            </div>
            {savings > 0 ? (
              <span className="rounded-pill bg-[color:var(--danger)]/10 px-gs-3 py-gs-1 text-caption font-semibold text-[color:var(--danger)]">
                Save {formatInr(savings)}
              </span>
            ) : null}
          </div>
          <Link
            href={href}
            className="clay-btn flex w-full !min-h-0 justify-center !px-gs-4 !py-gs-3 text-center text-body"
            onClick={onClose}
          >
            Gift this · {formatInr(product.fromPricePaise)}
          </Link>
          <Link
            href={href}
            className="block text-center text-body font-medium text-foreground/65 underline-offset-2 hover:text-primary hover:underline"
            onClick={onClose}
          >
            View full details
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function HamperThumbStrip({ items }: { items: HamperItem[] }) {
  const overflow = items.length > THUMB_FULL_MAX;
  const visible = overflow
    ? items.slice(0, THUMB_OVERFLOW_VISIBLE)
    : items.slice(0, THUMB_FULL_MAX);
  const more = overflow ? items.length - THUMB_OVERFLOW_VISIBLE : 0;

  return (
    <ul className="flex items-center" aria-hidden>
      {visible.map((item, i) => (
        <li
          key={item.id}
          className="relative size-8 overflow-hidden rounded-pill border-2 border-surface bg-white/70 shadow-sm"
          style={{ marginLeft: i === 0 ? 0 : -6 }}
        >
          {item.imageUrl ? (
            <Image src={item.imageUrl} alt="" fill sizes="32px" className="object-cover" />
          ) : (
            <div className="gift-media-fallback h-full w-full" />
          )}
        </li>
      ))}
      {more > 0 ? (
        <li
          className="flex size-8 items-center justify-center rounded-pill border-2 border-surface bg-foreground text-caption font-semibold text-background shadow-sm"
          style={{ marginLeft: -6 }}
        >
          +{more}
        </li>
      ) : null}
    </ul>
  );
}

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
  const [contentsOpen, setContentsOpen] = useState(false);

  const hamperItems = product.hamperItems ?? [];
  const isHamper = Boolean(product.isReadyMadeHamper);
  const itemCount = product.hamperItemCount ?? hamperItems.reduce((s, i) => s + i.qty, 0);
  const brands = product.brandNames?.length ? product.brandNames : collectBrandNames(product);
  const labels = overlayLabels(product);
  const href = `/gift/products/${product.slug}`;
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

  return (
    <li className="clay-card flex h-full list-none flex-col overflow-hidden">
      <Link href={href} className="block min-w-0">
        <div className={`relative bg-white/50 ${imageHeightClass} w-full`}>
          {img?.url ? (
            <Image
              src={img.url}
              alt={img.altText ?? product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="gift-media-fallback absolute inset-0" />
          )}
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
              className="max-w-[65%] justify-end"
            />
          </div>
          {showQuickAdd && quickVariant ? (
            <button
              type="button"
              onClick={(e) => void quickAdd(e)}
              disabled={busy}
              className="pointer-events-auto absolute bottom-gs-2 right-gs-2 z-10 rounded-pill bg-white/95 px-gs-3 py-gs-2 text-caption font-semibold text-primary shadow-clay hover:bg-white disabled:opacity-50"
              aria-label={`Quick add ${product.title} to cart`}
            >
              {busy ? '…' : msg === 'Added' ? 'Added ✓' : 'Quick add +'}
            </button>
          ) : null}
        </div>
        <div className="p-gs-4 pb-0">
          <p className="font-medium leading-snug text-foreground">{product.title}</p>
          <ProductBrandLine brands={brands} className="mt-gs-1 !text-caption" />
          <p className="mt-gs-2 text-body font-semibold text-primary">
            {formatInr(product.fromPricePaise)}
            {isHamper && (product.hamperSavingsPaise ?? 0) > 0 ? (
              <span className="ml-gs-2 text-caption font-semibold text-[color:var(--danger)]">
                Save {formatInr(product.hamperSavingsPaise!)}
              </span>
            ) : null}
          </p>
          {isHamper && hamperItems.length > 0 ? (
            <p className="mt-gs-1 line-clamp-2 text-caption opacity-70">
              {hamperItems
                .slice(0, 3)
                .map((i) => i.title)
                .join(', ')}
              {hamperItems.length > 3 ? ` +${hamperItems.length - 3}` : ''}
            </p>
          ) : null}
          {out ? <p className="mt-gs-2 text-caption text-danger">Out of stock</p> : null}
          {msg && msg !== 'Added' ? (
            <p className="mt-gs-1 text-caption text-danger">{msg}</p>
          ) : null}
        </div>
      </Link>

      <div className="mt-auto space-y-gs-2 px-gs-4 pb-gs-4 pt-gs-3">
        {isHamper && hamperItems.length > 0 ? (
          <>
            <HamperThumbStrip items={hamperItems} />
            <button
              type="button"
              className="text-left text-body font-medium text-primary underline-offset-2 hover:underline"
              onClick={() => setContentsOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={contentsOpen}
            >
              What’s inside ({itemCount || hamperItems.length})
            </button>
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

      <HamperContentsModal
        open={contentsOpen}
        onClose={() => setContentsOpen(false)}
        product={product}
        items={hamperItems}
        itemCount={itemCount || hamperItems.length}
      />
    </li>
  );
}
