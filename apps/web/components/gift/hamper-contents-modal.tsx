'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { CircleHelp, Loader2, ShoppingBag, X } from 'lucide-react';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { trackEvent } from '@/lib/analytics';
import { lockPageScroll } from '@/lib/scroll-lock';
import { cn } from '@/lib/utils';
import { fetchPublishedProductClient, formatInr, type CatalogHamperItem } from '@/lib/catalog';
import {
  hamperContentsCount,
  hamperContentsLabel,
  type HamperContentsProduct,
} from '@/components/gift/hamper-contents';

const FOCUSABLE =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function HamperContentsModal({
  open,
  onClose,
  product,
  items,
  itemCount,
  contentsValuePaise,
  hamperSavingsPaise,
  loading,
  error,
  variantId,
}: {
  open: boolean;
  onClose: () => void;
  product: HamperContentsProduct;
  items: CatalogHamperItem[];
  itemCount: number;
  contentsValuePaise?: number | null;
  hamperSavingsPaise?: number | null;
  loading: boolean;
  error: string | null;
  variantId?: string | null;
}) {
  const dialogTitleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const href = `/gift/products/${product.slug}`;
  const savings = hamperSavingsPaise ?? 0;
  const worth =
    contentsValuePaise != null && contentsValuePaise > product.fromPricePaise
      ? contentsValuePaise
      : null;
  const canAdd = Boolean(variantId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setBusy(false);
      setMsg(null);
      return;
    }
    const unlock = lockPageScroll();
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const root = panelRef.current;
      if (!root) return;
      const nodes = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled') && el.tabIndex !== -1,
      );
      if (nodes.length === 0) return;
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      unlock();
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  async function addToCart(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!variantId || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      await cartApi('/cart/items', {
        method: 'POST',
        authToken: getStoredAccessToken(),
        json: { variantId, quantity: 1 },
      });
      trackEvent('add_to_cart', { productId: product.id });
      setMsg('Added');
    } catch {
      setMsg('Couldn’t add');
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center overflow-hidden overscroll-none p-gs-3 font-[family-name:var(--font-body),ui-sans-serif,system-ui,sans-serif] text-foreground sm:items-center sm:p-gs-5"
      role="presentation"
      data-theme="gift"
      data-lenis-prevent
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-foreground/45" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        data-testid="hamper-contents-modal"
        className="relative isolate flex max-h-[min(88vh,40rem)] w-full max-w-md flex-col overflow-hidden rounded-clay border border-border-subtle bg-surface shadow-clay-hover"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border-subtle bg-surface-soft px-gs-5 pb-gs-3 pt-gs-4">
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
                {itemCount > 0 ? ` · ${itemCount} item${itemCount === 1 ? '' : 's'}` : ''}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="flex size-9 shrink-0 items-center justify-center rounded-pill border border-border-subtle bg-surface text-foreground/70 hover:bg-surface-soft hover:text-foreground"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>

        <ul className="min-h-0 flex-1 space-y-gs-2 overflow-y-auto overscroll-contain bg-surface px-gs-4 py-gs-3 [scrollbar-gutter:stable] [scrollbar-width:thin]">
          {loading && items.length === 0 ? (
            <li className="flex items-center justify-center gap-gs-2 py-gs-8 text-caption text-foreground/55">
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              Loading
            </li>
          ) : error && items.length === 0 ? (
            <li className="py-gs-8 text-center text-caption text-danger">{error}</li>
          ) : items.length === 0 ? (
            <li className="py-gs-8 text-center text-caption text-foreground/55">
              Contents aren’t listed yet
            </li>
          ) : (
            items.map((item) => (
              <li
                key={item.id}
                className="flex gap-gs-3 rounded-control border border-border-subtle bg-surface-soft p-gs-3"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-control bg-foreground/5 ring-1 ring-border-subtle sm:size-16">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="gift-media-fallback h-full w-full" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug text-foreground">
                    {item.title}
                    {item.qty > 1 ? (
                      <span className="ml-gs-1 text-caption font-normal opacity-60">
                        ×{item.qty}
                      </span>
                    ) : null}
                  </p>
                  {item.brandName ? (
                    <p className="mt-gs-1 text-caption text-foreground/55">
                      <span className="font-semibold uppercase tracking-wide">Brand:</span>{' '}
                      {item.brandName}
                    </p>
                  ) : null}
                  {item.blurb ? (
                    <p className="mt-gs-1 line-clamp-2 text-caption text-foreground/60">
                      {item.blurb}
                    </p>
                  ) : null}
                  <p className="mt-gs-1 text-body font-semibold text-primary">
                    {formatInr(item.unitPricePaise)}
                    {item.qty > 1 ? (
                      <span className="ml-gs-1 text-caption font-normal text-foreground/50">
                        each
                      </span>
                    ) : null}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="shrink-0 space-y-gs-3 border-t border-border-subtle bg-surface px-gs-5 py-gs-4">
          <div className="flex flex-wrap items-end justify-between gap-gs-2">
            <div>
              {worth != null ? (
                <p className="text-caption text-foreground/50 line-through">
                  Worth {formatInr(worth)}
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
          {canAdd ? (
            <button
              type="button"
              className="clay-btn flex w-full !min-h-0 items-center justify-center gap-gs-2 !px-gs-4 !py-gs-3 text-body disabled:opacity-50"
              onClick={(e) => void addToCart(e)}
              disabled={busy}
              aria-label={
                busy
                  ? `Adding ${product.title} to cart`
                  : msg === 'Added'
                    ? `${product.title} added to cart`
                    : `Add ${product.title} to cart`
              }
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
              ) : (
                <ShoppingBag className="size-4" strokeWidth={1.75} aria-hidden />
              )}
              {busy ? 'Adding…' : msg === 'Added' ? 'Added' : 'Add to cart'}
            </button>
          ) : (
            <Link
              href={href}
              className="clay-btn flex w-full !min-h-0 justify-center !px-gs-4 !py-gs-3 text-center text-body"
              onClick={onClose}
            >
              View gift · {formatInr(product.fromPricePaise)}
            </Link>
          )}
          {msg && msg !== 'Added' ? <p className="text-caption text-danger">{msg}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

type TriggerProps = {
  product: HamperContentsProduct;
  /** In-stock variant — enables Add to cart in the modal. */
  variantId?: string | null;
  className?: string;
};

/** Count line + question mark; opens a contents modal (fetch if card payload has no items). */
export function HamperContentsTrigger({ product, variantId, className }: TriggerProps) {
  const count = hamperContentsCount(product);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CatalogHamperItem[]>(product.hamperItems ?? []);
  const [contentsValuePaise, setContentsValuePaise] = useState(product.contentsValuePaise);
  const [hamperSavingsPaise, setHamperSavingsPaise] = useState(product.hamperSavingsPaise);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setItems(product.hamperItems ?? []);
    setContentsValuePaise(product.contentsValuePaise);
    setHamperSavingsPaise(product.hamperSavingsPaise);
  }, [product.hamperItems, product.contentsValuePaise, product.hamperSavingsPaise]);

  if (count <= 0) return null;

  async function openModal(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setError(null);
    if (items.length > 0) return;
    setLoading(true);
    try {
      const full = await fetchPublishedProductClient(product.slug);
      setItems(full.hamperItems ?? []);
      setContentsValuePaise(full.contentsValuePaise);
      setHamperSavingsPaise(full.hamperSavingsPaise);
    } catch {
      setError('Couldn’t load contents');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          'inline-flex max-w-full items-center gap-gs-1 text-left text-caption text-foreground/70',
          className,
        )}
        onClick={(e) => void openModal(e)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`What’s inside ${product.title}`}
        data-testid={`hamper-contents-${product.slug}`}
      >
        <span className="min-w-0">{hamperContentsLabel(count)}</span>
        <span
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-pill border border-border-subtle bg-surface text-foreground/55 hover:border-primary/35 hover:bg-primary/[0.08] hover:text-primary"
          aria-hidden
        >
          <CircleHelp className="size-3.5" strokeWidth={2} />
        </span>
      </button>
      <HamperContentsModal
        open={open}
        onClose={onClose}
        product={product}
        items={items}
        itemCount={count || items.reduce((s, i) => s + i.qty, 0)}
        contentsValuePaise={contentsValuePaise}
        hamperSavingsPaise={hamperSavingsPaise}
        loading={loading}
        error={error}
        variantId={variantId}
      />
    </>
  );
}
