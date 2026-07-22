'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, type MouseEvent, type ReactNode } from 'react';
import { Gift, HeartHandshake, Package, Truck } from 'lucide-react';
import { formatInr, type StorefrontDisplayLabel } from '@/lib/catalog';
import { cartApi } from '@/lib/cart-client';
import { getStoredAccessToken } from '@/lib/auth-client';
import { trackEvent } from '@/lib/analytics';
import { GiftStorefrontHero } from '@/components/cms/gift-storefront-hero';
import { FaqAccordion, faqPageJsonLd } from '@/components/gift/faq-accordion';
import { ProductLabels } from '@/components/gift/product-labels';
import { GiftHomeMotion } from '@/components/cms/gift-home-motion';

export type CmsBlockProduct = {
  id: string;
  slug: string;
  title: string;
  fromPricePaise: number;
  media: Array<{ url: string; altText: string | null }>;
  brandName?: string | null;
  isReadyMadeHamper?: boolean;
  displayLabels?: StorefrontDisplayLabel[];
  quickAddVariantId?: string | null;
  available?: number;
};

export type CmsPageBlock = {
  id: string;
  type: string;
  sortOrder: number;
  props: Record<string, unknown>;
};

type Props = {
  blocks: CmsPageBlock[];
  /** When set, show a draft ribbon (preview mode). */
  previewBanner?: string | null;
  /** Soft Gift storefront homepage layout (full-bleed hero, clay product cards). */
  layout?: 'page' | 'home';
};

function GiftToysDecor({ variant = 'default' }: { variant?: 'default' | 'sky' | 'mint' }) {
  const cls =
    variant === 'sky'
      ? 'gift-toys gift-toys--sky'
      : variant === 'mint'
        ? 'gift-toys gift-toys--mint'
        : 'gift-toys';
  return (
    <div className={cls} aria-hidden>
      {/* Rattle */}
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="24" cy="24" r="12" />
        <circle cx="24" cy="24" r="5" />
        <path d="M32.5 32.5 L48 52" strokeLinecap="round" />
        <circle cx="50" cy="54" r="4" />
      </svg>
      {/* Teddy outline */}
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="20" cy="18" r="7" />
        <circle cx="44" cy="18" r="7" />
        <circle cx="32" cy="28" r="14" />
        <ellipse cx="32" cy="48" rx="16" ry="12" />
        <circle cx="26" cy="26" r="2" fill="currentColor" stroke="none" />
        <circle cx="38" cy="26" r="2" fill="currentColor" stroke="none" />
        <path d="M28 34 Q32 38 36 34" strokeLinecap="round" />
      </svg>
      {/* Duck */}
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="34" cy="38" rx="16" ry="12" />
        <circle cx="44" cy="24" r="9" />
        <path d="M50 22 L58 20 L50 26 Z" />
        <circle cx="47" cy="22" r="1.5" fill="currentColor" stroke="none" />
        <path d="M22 42 Q14 48 20 52" strokeLinecap="round" />
      </svg>
      {/* Blocks / star toy */}
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="10" y="28" width="20" height="20" rx="3" />
        <rect x="28" y="14" width="20" height="20" rx="3" />
        <path d="M48 40l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" />
      </svg>
    </div>
  );
}

function GiftBand({
  tone,
  children,
  className = '',
  toys = false,
}: {
  tone: 'blush' | 'mint' | 'sky' | 'lavender' | 'soft';
  children: ReactNode;
  className?: string;
  toys?: boolean;
}) {
  const toyVariant = tone === 'sky' ? 'sky' : tone === 'mint' ? 'mint' : 'default';
  return (
    <div className={`gift-band gift-band--${tone} ${className}`} data-gift-reveal="">
      {toys ? <GiftToysDecor variant={toyVariant} /> : null}
      <div className="gift-band-inner">{children}</div>
    </div>
  );
}

function GiftSectionHeader({
  overline,
  title,
  subtitle,
  actionHref,
  actionLabel,
}: {
  overline?: string | null;
  title?: string | null;
  subtitle?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
}) {
  if (!title && !subtitle && !overline && !actionHref) return null;
  return (
    <div className="mb-gs-6 flex flex-col gap-gs-4 sm:mb-gs-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 max-w-2xl">
        {overline ? <p className="gift-overline">{overline}</p> : null}
        {title ? (
          <h2 className={`gift-h2 ${overline ? 'mt-gs-2' : ''} leading-tight`}>{title}</h2>
        ) : null}
        {subtitle ? (
          <p className="mt-gs-3 max-w-prose text-sm leading-relaxed text-foreground/75 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="clay-btn-secondary shrink-0 self-start text-sm sm:self-auto"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

function WaveAccent({ accent }: { accent: 'pink' | 'sky' | 'mint' | 'lavender' }) {
  const mod =
    accent === 'sky'
      ? 'gift-wave-card--sky'
      : accent === 'mint'
        ? 'gift-wave-card--mint'
        : accent === 'lavender'
          ? 'gift-wave-card--lavender'
          : '';
  return (
    <svg
      className={`gift-wave-card__wave ${mod}`}
      viewBox="0 0 400 28"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d="M0 14 Q25 0 50 14 T100 14 T150 14 T200 14 T250 14 T300 14 T350 14 T400 14 V28 H0 Z" />
      <path d="M0 18 Q25 8 50 18 T100 18 T150 18 T200 18 T250 18 T300 18 T350 18 T400 18 V28 H0 Z" />
    </svg>
  );
}

const USP_ICON_MAP = {
  heart: HeartHandshake,
  package: Package,
  gift: Gift,
  truck: Truck,
} as const;

const DEFAULT_USP_ITEMS = [
  { icon: 'heart' as const, label: 'Personalised with care' },
  { icon: 'package' as const, label: 'Ready-made hampers' },
  { icon: 'gift' as const, label: 'Baby-safe picks' },
  { icon: 'truck' as const, label: 'Pan-India shipping' },
];

function UspRow({ items }: { items?: Array<{ label: string; icon?: keyof typeof USP_ICON_MAP }> }) {
  const rows =
    items?.length && items.some((i) => i.label.trim())
      ? items
          .filter((i) => i.label.trim())
          .map((i, idx) => ({
            label: i.label.trim(),
            icon: (i.icon ??
              DEFAULT_USP_ITEMS[idx % DEFAULT_USP_ITEMS.length]?.icon ??
              'heart') as keyof typeof USP_ICON_MAP,
          }))
      : DEFAULT_USP_ITEMS;

  return (
    <ul className="gift-usp list-none">
      {rows.map(({ icon, label }) => {
        const Icon = USP_ICON_MAP[icon] ?? HeartHandshake;
        return (
          <li key={label} className="gift-usp__item">
            <span className="gift-usp__icon" aria-hidden>
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="gift-usp__label">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}

function HeroBlock({ props, layout }: { props: Record<string, unknown>; layout: 'page' | 'home' }) {
  const storefront = props.variant === 'storefront' || layout === 'home';

  if (storefront) {
    return (
      <GiftStorefrontHero
        headline={String(props.headline ?? '')}
        subcopy={props.subcopy ? String(props.subcopy) : undefined}
        ctaLabel={props.ctaLabel ? String(props.ctaLabel) : undefined}
        ctaHref={props.ctaHref ? String(props.ctaHref) : undefined}
        ctaLabel2={props.ctaLabel2 ? String(props.ctaLabel2) : undefined}
        ctaHref2={props.ctaHref2 ? String(props.ctaHref2) : undefined}
        trustLine={props.trustLine ? String(props.trustLine) : undefined}
        eyebrow={props.eyebrow ? String(props.eyebrow) : undefined}
        imageUrl={props.imageUrl ? String(props.imageUrl) : undefined}
      />
    );
  }

  return (
    <section className="clay-panel relative overflow-hidden px-gs-6 py-gs-7 sm:px-gs-7">
      <div
        className="gift-media-fallback pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div className="relative">
        {props.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={String(props.imageUrl)}
            alt=""
            className="mb-gs-6 h-52 w-full rounded-control object-cover shadow-clay"
          />
        ) : null}
        <p className="gift-h2 tracking-tight text-primary sm:text-3xl">Inabiya</p>
        <h1 className="gift-h1 mt-gs-2 leading-tight">{String(props.headline ?? '')}</h1>
        {props.subcopy ? (
          <p className="mt-gs-4 max-w-prose text-base opacity-80">{String(props.subcopy)}</p>
        ) : null}
        <div className="mt-gs-6 flex flex-wrap gap-gs-3">
          {props.ctaLabel && props.ctaHref ? (
            <Link href={String(props.ctaHref)} className="clay-btn">
              {String(props.ctaLabel)}
            </Link>
          ) : null}
          {props.ctaLabel2 && props.ctaHref2 ? (
            <Link href={String(props.ctaHref2)} className="clay-btn-secondary">
              {String(props.ctaLabel2)}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CtaBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const secondary = props.variant === 'secondary';
  const inner = props.title ? (
    <>
      <h2 className="gift-h2">{String(props.title)}</h2>
      {props.body ? (
        <p className="mt-gs-3 max-w-prose text-sm opacity-80">{String(props.body)}</p>
      ) : null}
      <Link
        href={String(props.href ?? '/gift')}
        className={`mt-gs-6 ${secondary ? 'clay-btn-secondary' : 'clay-btn'}`}
      >
        {String(props.label ?? 'Continue')}
      </Link>
    </>
  ) : (
    <div className="flex justify-center py-gs-2">
      <Link
        href={String(props.href ?? '/gift')}
        className={secondary ? 'clay-btn-secondary' : 'clay-btn'}
      >
        {String(props.label ?? 'Continue')}
      </Link>
    </div>
  );

  if (home) {
    return (
      <GiftBand tone="lavender" className="relative overflow-hidden" toys>
        <div className="gift-doodle absolute inset-0 opacity-60" aria-hidden />
        <div className="relative clay-panel p-gs-6 sm:p-gs-7">{inner}</div>
      </GiftBand>
    );
  }

  if (props.title) {
    return <section className="clay-panel p-gs-6 sm:p-gs-7">{inner}</section>;
  }
  return <section className="flex justify-center py-gs-6">{inner}</section>;
}

function ImageBlock({ props }: { props: Record<string, unknown> }) {
  const url = String(props.url ?? '');
  if (!url) return null;
  return (
    <figure className="py-gs-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={String(props.alt ?? '')}
        className="max-h-[32rem] w-full rounded-clay object-cover shadow-clay"
      />
      {props.caption ? (
        <figcaption className="mt-gs-3 text-center text-sm opacity-70">
          {String(props.caption)}
        </figcaption>
      ) : null}
    </figure>
  );
}

function SpacerBlock({ props }: { props: Record<string, unknown> }) {
  const size = String(props.size ?? 'md');
  const h = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-24' : 'h-14';
  return <div className={h} aria-hidden />;
}

function HomeProductCard({
  product,
  featured = false,
}: {
  product: CmsBlockProduct;
  featured?: boolean;
}) {
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
        <Link href={`/gift/products/${product.slug}`} className="absolute inset-0 block">
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
        {product.displayLabels?.length ? (
          <ProductLabels labels={product.displayLabels} placement="overlay" />
        ) : null}
        {canQuickAdd ? (
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
      <Link
        href={`/gift/products/${product.slug}`}
        className={`flex flex-col justify-center p-gs-4 ${featured ? 'sm:p-gs-6' : ''}`}
      >
        <div className="flex flex-wrap items-center gap-gs-2">
          {product.brandName ? (
            <span className="clay-chip text-xs">{product.brandName}</span>
          ) : null}
          {product.isReadyMadeHamper ? (
            <span className="clay-chip text-xs">Ready-made hamper</span>
          ) : null}
        </div>
        <p
          className={`font-medium leading-snug text-foreground transition-colors group-hover:text-primary ${
            featured ? 'mt-gs-3 font-display text-2xl sm:text-3xl' : 'mt-gs-2'
          }`}
        >
          {product.title}
        </p>
        <p
          className={`font-semibold text-primary ${featured ? 'mt-gs-3 text-lg' : 'mt-gs-2 text-sm'}`}
        >
          From {formatInr(product.fromPricePaise)}
        </p>
        <p className="mt-gs-3 text-sm font-medium text-primary opacity-90">
          {featured ? 'Explore this gift →' : 'View gift →'}
        </p>
        {msg && msg !== 'Added' ? <p className="mt-gs-1 text-xs text-danger">{msg}</p> : null}
      </Link>
    </div>
  );
}

function ProductGridBlock({
  props,
  layout,
  bandTone,
}: {
  props: Record<string, unknown>;
  layout: 'page' | 'home';
  bandTone?: 'mint' | 'sky';
}) {
  const title = props.title ? String(props.title) : null;
  const overline = props.overline ? String(props.overline) : null;
  const subtitle = props.subtitle ? String(props.subtitle) : null;
  const seeAllHref = props.seeAllHref ? String(props.seeAllHref) : null;
  const seeAllLabel = props.seeAllLabel ? String(props.seeAllLabel) : 'See all';
  const products = Array.isArray(props.products) ? (props.products as CmsBlockProduct[]) : [];
  const home = layout === 'home';
  // Featured row only when enough remain for a balanced grid (avoids one full-width giant card).
  const featured = home && products.length >= 3 ? products[0] : null;
  const rest = featured ? products.slice(1) : products;
  const restCols =
    rest.length <= 1
      ? 'sm:grid-cols-1 sm:max-w-md'
      : rest.length === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  const grid = (
    <>
      <GiftSectionHeader
        overline={overline ?? (home && props.hamper === true ? 'Hampers' : home ? 'Gifts' : null)}
        title={title}
        subtitle={
          subtitle ??
          (home && props.hamper === true
            ? 'Complete boxes, ready to wrap — less planning, more delight.'
            : home
              ? 'Hand-picked favourites parents keep coming back for.'
              : null)
        }
        actionHref={seeAllHref}
        actionLabel={seeAllHref ? seeAllLabel : null}
      />
      {products.length === 0 ? (
        <p className="clay-panel px-gs-4 py-gs-6 text-center text-sm opacity-70">
          No published products match this grid yet.
        </p>
      ) : home ? (
        <div className="gift-stack">
          {featured ? <HomeProductCard product={featured} featured /> : null}
          {rest.length > 0 ? (
            <ul className={`grid gap-gs-5 ${restCols}`}>
              {rest.map((p) => (
                <li key={p.id} className="min-w-0 list-none">
                  <HomeProductCard product={p} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-gs-5 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="clay-card overflow-hidden">
              {p.media[0]?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.media[0].url}
                  alt={p.media[0].altText ?? p.title}
                  className="h-44 w-full object-cover"
                />
              ) : (
                <div className="gift-media-fallback h-44" />
              )}
              <div className="p-gs-4">
                <Link
                  href={`/gift/products/${p.slug}`}
                  className="font-medium text-foreground hover:text-primary"
                >
                  {p.title}
                </Link>
                <p className="mt-gs-1 text-sm font-semibold text-primary">
                  {formatInr(p.fromPricePaise)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (layout === 'home' && bandTone) {
    return (
      <GiftBand tone={bandTone} toys>
        {grid}
      </GiftBand>
    );
  }
  return <section className="py-gs-2">{grid}</section>;
}

/** Local wordmark tiles — swap for brand-approved logos when licensed. */
const BRAND_LOGO_BY_NAME: Record<string, string> = {
  'The Moms Co.': '/gift/brands/the-moms-co.svg',
  Inabiya: '/gift/brands/inabiya.svg',
  Chicco: '/gift/brands/chicco.svg',
  Mamaearth: '/gift/brands/mamaearth.svg',
  'Soft Nest': '/gift/brands/soft-nest.svg',
};

const DEFAULT_HOME_BRANDS = [
  'The Moms Co.',
  'Inabiya',
  'Chicco',
  'Mamaearth',
  'Soft Nest',
] as const;

type BrandItem = { name: string; logoUrl: string | null };

function normalizeBrands(raw: unknown): BrandItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return DEFAULT_HOME_BRANDS.map((name) => ({
      name,
      logoUrl: BRAND_LOGO_BY_NAME[name] ?? null,
    }));
  }
  return raw
    .map((entry): BrandItem | null => {
      if (typeof entry === 'string' && entry.trim()) {
        const name = entry.trim();
        return { name, logoUrl: BRAND_LOGO_BY_NAME[name] ?? null };
      }
      if (entry && typeof entry === 'object' && 'name' in entry) {
        const name = String((entry as { name: unknown }).name).trim();
        if (!name) return null;
        const custom =
          typeof (entry as { logoUrl?: unknown }).logoUrl === 'string'
            ? String((entry as { logoUrl: string }).logoUrl)
            : null;
        return { name, logoUrl: custom ?? BRAND_LOGO_BY_NAME[name] ?? null };
      }
      return null;
    })
    .filter((b): b is BrandItem => Boolean(b));
}

/** Seamless infinite brand strip — duplicated track, CSS translate -50%. */
function BrandMarquee({
  brands,
  title,
  subtitle,
}: {
  brands: unknown;
  title: string;
  subtitle?: string;
}) {
  const base = normalizeBrands(brands);
  const loop = base.length >= 8 ? base : [...base, ...base, ...(base.length < 5 ? base : [])];
  const sub = subtitle?.trim() || 'Curated partners for gentle, baby-safe gifting';

  return (
    <div className="gift-brand-strip">
      <div className="gift-brand-strip__head">
        <h2 className="gift-brand-strip__title">{title}</h2>
        <p className="gift-brand-strip__sub">{sub}</p>
      </div>
      <div className="gift-brand-marquee" role="region" aria-label={title} tabIndex={0}>
        <div className="gift-brand-marquee__track">
          {[0, 1].map((copy) => (
            <ul
              key={copy}
              className="gift-brand-marquee__group"
              aria-hidden={copy === 1 ? true : undefined}
            >
              {loop.map((brand, i) => (
                <li key={`${copy}-${brand.name}-${i}`} className="gift-brand-marquee__tile">
                  {brand.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="gift-brand-marquee__logo"
                      width={160}
                      height={40}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="gift-brand-marquee__fallback">{brand.name}</span>
                  )}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}

function parseUsps(raw: unknown): Array<{ label: string; icon?: keyof typeof USP_ICON_MAP }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ label: string; icon?: keyof typeof USP_ICON_MAP }> = [];
  for (const u of raw) {
    if (!u || typeof u !== 'object') continue;
    const label = String((u as { label?: unknown }).label ?? '').trim();
    if (!label) continue;
    const iconRaw = (u as { icon?: unknown }).icon;
    const icon =
      iconRaw === 'heart' || iconRaw === 'package' || iconRaw === 'gift' || iconRaw === 'truck'
        ? iconRaw
        : undefined;
    out.push({ label, icon });
  }
  return out;
}

function BrandStripBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const brands = props.brands;
  const hasBrands = Array.isArray(brands) && brands.length > 0;
  if (!hasBrands && !home) return null;

  const title = String(props.title ?? 'Trusted brands we stock');
  const subtitle = props.subtitle ? String(props.subtitle) : undefined;
  const usps = parseUsps(props.usps);
  const showUsps = props.showUsps !== false && home;

  const body = (
    <>
      {showUsps ? <UspRow items={usps} /> : null}
      <BrandMarquee
        brands={hasBrands ? brands : DEFAULT_HOME_BRANDS}
        title={title}
        subtitle={subtitle}
      />
    </>
  );

  if (home) {
    return (
      <GiftBand tone="soft" toys>
        {body}
      </GiftBand>
    );
  }
  return <section className="gift-section py-gs-6">{body}</section>;
}

function RecipientSplitBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const left = (props.left ?? {}) as Record<string, unknown>;
  const right = (props.right ?? {}) as Record<string, unknown>;
  const cards = [
    { key: 'left', card: left, index: '01' },
    { key: 'right', card: right, index: '02' },
  ] as const;

  const body = (
    <>
      <GiftSectionHeader
        overline={home ? 'Start here' : null}
        title={props.title ? String(props.title) : null}
        subtitle={
          props.subtitle
            ? String(props.subtitle)
            : home
              ? 'Soft palettes for little ones — unisex-safe picks are woven into both.'
              : null
        }
      />
      <div className="grid gap-gs-6 sm:grid-cols-2">
        {cards.map(({ key, card, index }) => {
          const sky = card.accent === 'sky';
          const accent = sky ? 'sky' : 'pink';
          const pillClass = sky ? 'gift-pill-overlap--sky' : '';
          const waveClass = sky ? 'gift-wave-card--sky' : '';
          const mediaClass = sky ? 'gift-panel-sky' : 'gift-media-fallback';
          const blurb = card.blurb ? String(card.blurb) : null;

          if (home) {
            return (
              <Link
                key={key}
                href={String(card.href ?? '/gift/products')}
                className="group relative block pb-gs-5 transition hover:-translate-y-0.5"
              >
                <div className={`gift-wave-card shadow-clay ${waveClass}`}>
                  <div className={`gift-wave-card__media ${mediaClass}`}>
                    {card.imageUrl ? (
                      <Image
                        src={String(card.imageUrl)}
                        alt={String(
                          card.imageAlt || `Shop gifts for ${String(card.label ?? 'baby')}`,
                        )}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover opacity-85 transition duration-500 group-hover:scale-[1.03]"
                      />
                    ) : null}
                    <div className="relative flex min-h-[13rem] flex-col justify-end p-gs-5 pb-gs-8 sm:min-h-[15rem]">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-60">
                        {index}
                      </p>
                      <p className="mt-gs-2 text-sm opacity-75">
                        {String(card.eyebrow ?? 'For the little')}
                      </p>
                      <p
                        className={`font-display mt-gs-1 text-4xl capitalize sm:text-5xl ${
                          sky ? 'text-info' : 'text-primary'
                        }`}
                      >
                        {String(card.label ?? '')}
                      </p>
                      {blurb ? (
                        <p className="mt-gs-3 max-w-[18rem] text-sm leading-relaxed opacity-80">
                          {blurb}
                        </p>
                      ) : null}
                    </div>
                    <WaveAccent accent={accent} />
                  </div>
                </div>
                <span className={`gift-pill-overlap ${pillClass}`}>
                  {String(card.cta ?? 'Shop →')}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={key}
              href={String(card.href ?? '/gift/products')}
              className={`${sky ? 'gift-panel-sky ' : ''}clay-panel block overflow-hidden p-gs-6 transition hover:-translate-y-0.5`}
            >
              <p className="text-sm opacity-70">{String(card.eyebrow ?? 'For the little')}</p>
              <p className={`font-display mt-gs-1 text-4xl ${sky ? 'text-info' : 'text-primary'}`}>
                {String(card.label ?? '')}
              </p>
              {blurb ? <p className="mt-gs-3 text-sm opacity-75">{blurb}</p> : null}
              <p className="mt-gs-4 text-sm font-medium text-foreground">
                {String(card.cta ?? 'Shop →')}
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );

  if (home) {
    return (
      <GiftBand tone="blush" toys>
        {body}
      </GiftBand>
    );
  }
  return <section>{body}</section>;
}

type ArticleTeaser = {
  slug: string;
  title: string;
  description?: string | null;
  publishedAt?: string | Date | null;
  imageUrl?: string | null;
  category?: { name: string; slug?: string } | null;
  specialist?: { name: string; slug?: string } | null;
};

function formatArticleDate(value: string | Date | null | undefined) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function ArticleTeaserMeta({ article }: { article: ArticleTeaser }) {
  const parts = [
    formatArticleDate(article.publishedAt),
    article.category?.name,
    article.specialist?.name,
  ].filter(Boolean);
  if (!parts.length) return null;
  return <p className="mt-gs-3 text-xs opacity-60 sm:text-sm">{parts.join(' · ')}</p>;
}

function ArticleTeasersBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const articles = Array.isArray(props.articles) ? (props.articles as ArticleTeaser[]) : [];
  if (!articles.length) {
    if (props.showEmptyPlaceholder === true) {
      const body = (
        <p className="clay-panel px-gs-4 py-gs-6 text-center text-sm opacity-70">
          Journal stories are on the way — check back soon.
        </p>
      );
      if (home) {
        return (
          <GiftBand tone="blush" toys>
            {body}
          </GiftBand>
        );
      }
      return <section>{body}</section>;
    }
    return null;
  }

  const seeAllHref = props.seeAllHref ? String(props.seeAllHref) : '/articles';
  const seeAllLabel = props.seeAllLabel ? String(props.seeAllLabel) : 'All articles →';
  const featured = articles.length === 1;

  const body = (
    <>
      <GiftSectionHeader
        overline={props.overline ? String(props.overline) : home ? 'Journal' : null}
        title={String(props.title ?? 'From the parenting journal')}
        subtitle={
          props.subtitle
            ? String(props.subtitle)
            : home
              ? 'Gentle reads from specialists — gifting, newborn care, and early parenthood.'
              : null
        }
        actionHref={seeAllHref}
        actionLabel={seeAllLabel}
      />
      <ul className={featured ? 'grid gap-gs-4' : 'grid gap-gs-4 sm:grid-cols-2 lg:grid-cols-3'}>
        {articles.map((a) => (
          <li key={a.slug} className="min-w-0">
            <Link
              href={`/articles/${a.slug}`}
              className={`group clay-panel block w-full overflow-hidden transition hover:-translate-y-0.5 ${
                featured ? 'sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]' : ''
              }`}
            >
              <div
                className={`relative gift-media-fallback overflow-hidden ${
                  featured ? 'aspect-[16/9] sm:aspect-auto sm:min-h-[14rem]' : 'aspect-[16/9]'
                }`}
              >
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={String(a.imageUrl)}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end p-gs-5">
                    <p className="font-display text-3xl text-primary/35 sm:text-4xl">Journal</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-gs-5 sm:p-gs-6">
                {a.category?.name ? (
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                    {a.category.name}
                  </p>
                ) : null}
                <h3
                  className={`font-display transition-colors group-hover:text-primary ${
                    featured ? 'mt-gs-2 text-2xl sm:text-3xl' : 'mt-gs-2 text-xl sm:text-2xl'
                  }`}
                >
                  {a.title}
                </h3>
                {a.description ? (
                  <p className="mt-gs-2 line-clamp-2 text-sm opacity-75 sm:text-base">
                    {a.description}
                  </p>
                ) : null}
                <ArticleTeaserMeta article={a} />
                <p className="mt-gs-4 text-sm font-medium text-primary">Read article →</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (home) {
    return (
      <GiftBand tone="blush" toys>
        {body}
      </GiftBand>
    );
  }
  return <section>{body}</section>;
}

/** Client-only sanitize — isomorphic-dompurify breaks Node SSR in Docker. */
function RichTextBlock({ html }: { html: string }) {
  const [safe, setSafe] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void import('@/lib/article-html').then(({ sanitizeArticleHtml }) => {
      if (!cancelled) setSafe(sanitizeArticleHtml(html));
    });
    return () => {
      cancelled = true;
    };
  }, [html]);

  if (safe === null) {
    return (
      <section className="mx-auto max-w-prose py-gs-6 text-sm opacity-50" aria-busy>
        …
      </section>
    );
  }

  return (
    <section
      className="prose prose-sm mx-auto max-w-prose py-gs-6 prose-headings:font-display prose-a:text-primary"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function SaleStripBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const text = String(props.text ?? '').trim();
  if (!text) return null;

  const ctaLabel = props.ctaLabel ? String(props.ctaLabel) : '';
  const ctaHref = props.ctaHref ? String(props.ctaHref) : '';
  const rawTone = String(props.tone ?? 'blush');
  const tone = (
    rawTone === 'mint' || rawTone === 'sky' || rawTone === 'soft' ? rawTone : 'blush'
  ) as 'blush' | 'mint' | 'sky' | 'soft';

  const inner = (
    <div className="flex flex-col items-start justify-between gap-gs-3 sm:flex-row sm:items-center">
      <p className="font-display text-lg leading-snug sm:text-xl">{text}</p>
      {ctaLabel && ctaHref ? (
        <Link href={ctaHref} className="clay-btn-secondary shrink-0 text-sm">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  if (home) {
    return <GiftBand tone={tone}>{inner}</GiftBand>;
  }

  return (
    <section className={`gift-band gift-band--${tone}`}>
      <div className="gift-band-inner">{inner}</div>
    </section>
  );
}

type FaqItem = { question: string; answerHtml: string };

function parseFaqItems(raw: unknown): FaqItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row) => ({
      question: String(row.question ?? '').trim(),
      answerHtml: String(row.answerHtml ?? '').trim(),
    }))
    .filter((row) => row.question && row.answerHtml)
    .slice(0, 20);
}

function FaqAnswer({ html }: { html: string }) {
  const [safe, setSafe] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import('@/lib/article-html').then(({ sanitizeArticleHtml }) => {
      if (!cancelled) setSafe(sanitizeArticleHtml(html));
    });
    return () => {
      cancelled = true;
    };
  }, [html]);
  if (safe === null) return <p className="text-sm opacity-50">…</p>;
  return (
    <div
      className="prose prose-sm max-w-none prose-a:text-primary"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function FaqBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const title =
    String(props.title ?? 'Frequently asked questions').trim() || 'Frequently asked questions';
  const items = parseFaqItems(props.items);
  if (items.length === 0) return null;

  return (
    <FaqAccordion
      id="faq"
      title={title}
      home={home}
      items={items.map((item) => ({
        question: item.question,
        answer: <FaqAnswer html={item.answerHtml} />,
      }))}
    />
  );
}

function collectFaqJsonLd(blocks: CmsPageBlock[]): Record<string, unknown> | null {
  const rows: Array<{ question: string; answerText: string }> = [];
  for (const b of blocks) {
    if (b.type !== 'faq') continue;
    for (const item of parseFaqItems(b.props.items)) {
      const text = item.answerHtml
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\s+/g, ' ')
        .trim();
      if (!text) continue;
      rows.push({ question: item.question, answerText: text });
    }
  }
  return faqPageJsonLd(rows);
}

function FaqJsonLd({ blocks }: { blocks: CmsPageBlock[] }) {
  const data = collectFaqJsonLd(blocks);
  if (!data) return null;
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}

function DiscoveryChipsBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const items = Array.isArray(props.items)
    ? (props.items as Array<{ label?: string; href?: string }>)
        .map((i) => ({
          label: String(i.label ?? '').trim(),
          href: String(i.href ?? '').trim(),
        }))
        .filter((i) => i.label && i.href)
    : [];
  if (!items.length) return null;

  const body = (
    <>
      <GiftSectionHeader
        overline={props.overline ? String(props.overline) : home ? 'Discover' : null}
        title={props.title ? String(props.title) : 'Shop by moment'}
        subtitle={
          props.subtitle
            ? String(props.subtitle)
            : home
              ? 'Jump into age bands and occasions — filters open on the gift shop.'
              : null
        }
      />
      <ul className="flex flex-wrap gap-gs-2">
        {items.map((item) => (
          <li key={`${item.label}-${item.href}`}>
            <Link href={item.href} className="clay-chip inline-flex text-sm hover:bg-primary/10">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (home) {
    return (
      <GiftBand tone="soft" toys>
        {body}
      </GiftBand>
    );
  }
  return <section className="py-gs-4">{body}</section>;
}

function BuildYourBoxTeaserBlock({
  props,
  home,
}: {
  props: Record<string, unknown>;
  home?: boolean;
}) {
  const title = String(props.title ?? 'Build Your Box').trim();
  const body = props.body ? String(props.body) : null;
  const ctaLabel = String(props.ctaLabel ?? 'Build your box');
  const ctaHref = String(props.ctaHref ?? '/gift/build-your-box');
  const steps = Array.isArray(props.steps)
    ? (props.steps as Array<{ title?: string; body?: string }>)
        .map((s) => ({
          title: String(s.title ?? '').trim(),
          body: s.body ? String(s.body) : '',
        }))
        .filter((s) => s.title)
        .slice(0, 4)
    : [];

  const inner = (
    <div className="grid gap-gs-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
      <div>
        <GiftSectionHeader
          overline={props.overline ? String(props.overline) : 'Personalised'}
          title={title}
          subtitle={body}
        />
        {steps.length ? (
          <ol className="mt-gs-2 space-y-gs-4">
            {steps.map((step, i) => (
              <li key={`${step.title}-${i}`} className="flex gap-gs-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-foreground">{step.title}</p>
                  {step.body ? <p className="mt-gs-1 text-sm opacity-75">{step.body}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        <Link href={ctaHref} className="clay-btn mt-gs-6 inline-flex">
          {ctaLabel}
        </Link>
      </div>
      {props.imageUrl ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-clay shadow-clay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={String(props.imageUrl)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="gift-media-fallback relative flex aspect-[4/3] items-end rounded-clay p-gs-6 shadow-clay">
          <p className="font-display text-3xl text-primary/40">Your box, your way</p>
        </div>
      )}
    </div>
  );

  if (home) {
    return (
      <GiftBand tone="lavender" toys>
        {inner}
      </GiftBand>
    );
  }
  return <section className="py-gs-4">{inner}</section>;
}

function renderRestBlock(
  b: CmsPageBlock,
  layout: 'page' | 'home',
  productBandIndex: { current: number },
) {
  const home = layout === 'home';
  if (b.type === 'footer') {
    // Soft Gift layout owns global chrome footer — avoid double footers on home/CMS pages.
    return null;
  }
  if (b.type === 'cta') return <CtaBlock key={b.id} props={b.props} home={home} />;
  if (b.type === 'image') return <ImageBlock key={b.id} props={b.props} />;
  if (b.type === 'spacer') return <SpacerBlock key={b.id} props={b.props} />;
  if (b.type === 'productGrid') {
    const tones = ['mint', 'sky'] as const;
    const bandTone = home ? tones[productBandIndex.current++ % 2] : undefined;
    return <ProductGridBlock key={b.id} props={b.props} layout={layout} bandTone={bandTone} />;
  }
  if (b.type === 'brandStrip') {
    return <BrandStripBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'recipientSplit') {
    return <RecipientSplitBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'discoveryChips') {
    return <DiscoveryChipsBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'buildYourBoxTeaser') {
    return <BuildYourBoxTeaserBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'articleTeasers') {
    return <ArticleTeasersBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'saleStrip') {
    return <SaleStripBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'faq') {
    return <FaqBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'richText') {
    return <RichTextBlock key={b.id} html={String(b.props.html ?? '')} />;
  }
  return null;
}

export function MarketingPageBlocks({ blocks, previewBanner, layout = 'page' }: Props) {
  if (layout === 'home') {
    const hero = blocks.filter((b) => b.type === 'hero');
    const rest = blocks.filter((b) => b.type !== 'hero' && b.type !== 'footer');
    const productBandIndex = { current: 0 };
    return (
      <div>
        <FaqJsonLd blocks={blocks} />
        {previewBanner ? (
          <div className="gift-banner gift-banner--warning sticky top-0 z-10 text-center text-xs font-medium">
            {previewBanner}
          </div>
        ) : null}
        {hero.map((b) => (
          <HeroBlock key={b.id} props={b.props} layout="home" />
        ))}
        <GiftHomeMotion>
          <div className="space-y-0">
            {rest.map((b) => renderRestBlock(b, 'home', productBandIndex))}
          </div>
        </GiftHomeMotion>
      </div>
    );
  }

  return (
    <div className="space-y-gs-4">
      <FaqJsonLd blocks={blocks} />
      {previewBanner ? (
        <div className="gift-banner gift-banner--warning sticky top-0 z-10 mb-gs-4 text-center text-xs font-medium">
          {previewBanner}
        </div>
      ) : null}
      {blocks.map((b) => {
        if (b.type === 'hero') {
          return <HeroBlock key={b.id} props={b.props} layout={layout} />;
        }
        return renderRestBlock(b, 'page', { current: 0 });
      })}
    </div>
  );
}
