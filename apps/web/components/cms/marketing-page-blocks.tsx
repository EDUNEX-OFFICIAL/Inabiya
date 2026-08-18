import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { GiftImage } from '@/components/gift/gift-image';
import dynamic from 'next/dynamic';
import {
  ArrowRight,
  Baby,
  Briefcase,
  Cake,
  Gift,
  Heart,
  LayoutGrid,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  UserRound,
  Wallet,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import {
  parseOfferColumns,
  parseQuoteColumns,
  parseRecipientAccent,
  parseRecipientGrid,
  parseTestimonialsDisplay,
  parseUspColumns,
  RECIPIENT_GRID_MAX,
} from '@/lib/cms-section-layout';
import {
  fetchCatalogCollections,
  isCollectionHref,
  parseHomeCollectionLimit,
  resolveCatalogCollectionChips,
} from '@/lib/catalog-collections';
import { sanitizeArticleHtml } from '@/lib/article-html';
import { safeHrefOrHash } from '@inabiya/validation';
import { CmsHeroByLayout, resolvePublicHeroLayout } from '@/components/cms/gift-hero-layouts';
import { CustomSectionBlock } from '@/components/cms/custom-section-block';
import { sectionShellClass } from '@/components/cms/section-style';
import { FaqAccordion } from '@/components/gift/faq-accordion';
import { collectCmsFaqJsonLd } from '@/lib/seo-json-ld/cms-faq';

export { collectCmsFaqJsonLd } from '@/lib/seo-json-ld/cms-faq';
import { jsonLdToScriptHtml } from '@/components/seo/json-ld-script';
import { GiftHomeMotion } from '@/components/cms/gift-home-motion';
import { HomeProductCard } from '@/components/cms/home-product-card';
import { TestimonialCard, resolveTestimonialDated } from '@/components/cms/gift-testimonial-card';
import { GiftTestimonialMarquee } from '@/components/cms/gift-testimonial-marquee';
import { ProductCardMeta } from '@/components/gift/product-card-meta';
import { ProductCardWishlist } from '@/components/gift/product-card-wishlist';
import { HamperContentsTrigger } from '@/components/gift/hamper-contents-modal';
import {
  ProductCardGallery,
  ProductCardHero,
  ProductCardThumbs,
} from '@/components/gift/product-card-hero';
import { parseCmsCarouselCards } from '@/components/gift/parse-cms-carousel-cards';
import { WhatsappCtaBlock } from '@/components/cms/whatsapp-cta-block';
import type { CmsBlockProduct, CmsPageBlock } from '@/components/cms/marketing-page-types';

const CategoryCarousel = dynamic(() =>
  import('@/components/gift/category-carousel').then((m) => ({ default: m.CategoryCarousel })),
);

export type { CmsBlockProduct, CmsPageBlock } from '@/components/cms/marketing-page-types';

type Props = {
  blocks: CmsPageBlock[];
  /** When set, show a draft ribbon (preview mode). */
  previewBanner?: string | null;
  /** Soft Gift storefront homepage layout (full-bleed hero, clay product cards). */
  layout?: 'page' | 'home';
  /** When false, parent owns FAQ JSON-LD (merged @graph). Default true. */
  emitFaqJsonLd?: boolean;
};

function cmsHref(raw: unknown, fallback = '/'): string {
  const s = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
  return safeHrefOrHash(s);
}

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
  aside,
  actionHref,
  actionLabel,
}: {
  overline?: string | null;
  title?: string | null;
  subtitle?: string | null;
  /** Optional right-rail — prefer real CTAs via actionHref; avoid filler mottos. */
  aside?: string | null;
  actionHref?: string | null;
  actionLabel?: string | null;
}) {
  if (!title && !subtitle && !overline && !actionHref && !aside) return null;
  const showRail = Boolean((aside && aside.trim()) || (actionHref && actionLabel));
  return (
    <div
      className={`mb-gs-5 flex gap-gs-3 sm:mb-gs-6 ${
        showRail ? 'flex-row items-end justify-between sm:gap-gs-6' : 'flex-col'
      }`}
    >
      <div className="min-w-0 max-w-2xl">
        {overline ? <p className="gift-overline">{overline}</p> : null}
        {title ? (
          <h2 className={`gift-h2 ${overline ? 'mt-gs-2' : ''} leading-tight`}>{title}</h2>
        ) : null}
        {subtitle ? <p className="gift-muted mt-gs-2 max-w-prose">{subtitle}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Link href={cmsHref(actionHref)} className="clay-btn-secondary shrink-0 self-end text-body">
          {actionLabel}
        </Link>
      ) : aside && aside.trim() ? (
        <p className="gift-muted shrink-0 self-end sm:max-w-[14rem] sm:text-right">
          {aside.trim()}
        </p>
      ) : null}
    </div>
  );
}

function collectionKicker(overline: string) {
  return overline.replace(/^shop by\s+/i, '').trim() || overline;
}

function CategoryCardDoodle({ n }: { n: number }) {
  const i = n % 4;
  if (i === 0) {
    return (
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden>
        <path d="M16 3.5 19 12h9l-7.2 5.4 2.8 8.6L16 21.2 8.4 26l2.8-8.6L4 12h9z" />
      </svg>
    );
  }
  if (i === 1) {
    return (
      <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden>
        <path d="M16 27s-9-6.2-9-12.2A5.4 5.4 0 0 1 16 11a5.4 5.4 0 0 1 9 3.8C25 20.8 16 27 16 27z" />
      </svg>
    );
  }
  if (i === 2) {
    return (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M8 14c0-3 2.4-5 5-5 3.4 0 3 4 3 7 0-3-.4-7 3-7 2.6 0 5 2 5 5 0 4-8 9-8 9s-8-5-8-9z" />
        <path d="M16 16v10" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden>
      <path
        d="M16 4v6M16 22v6M4 16h6M22 16h6M7.8 7.8l4.2 4.2M20 20l4.2 4.2M7.8 24.2 12 20M20 12l4.2-4.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
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
  heart: Heart,
  package: Package,
  gift: Gift,
  truck: Truck,
  shield: ShieldCheck,
  sparkles: Sparkles,
} as const;

const DEFAULT_USP_ITEMS = [
  {
    icon: 'gift' as const,
    label: 'Personalised gifts',
    body: 'Baby name, Gift note, Ribbon & wrap.',
  },
  {
    icon: 'package' as const,
    label: 'Ready-made hampers',
    body: 'Ready when you need them.',
  },
  {
    icon: 'heart' as const,
    label: 'Made with love',
    body: 'From new-parent friendly brands.',
  },
  {
    icon: 'shield' as const,
    label: 'Trusted quality',
    body: 'Baby-safe, Tested, Thoughtful.',
  },
];

const USP_CARD_TONES = ['pink', 'mint', 'sky', 'lavender'] as const;

function normalizeUspBody(body: string): string {
  return body
    .replace(/\bgift note\b/gi, 'Gift note')
    .replace(/\bribbon\s*&\s*wrap\b/gi, 'Ribbon & wrap')
    .replace(/\bthoughtfull\b/gi, 'Thoughtful')
    .replace(/\btested\b/gi, 'Tested')
    .replace(/\bthoughtful\b/gi, 'Thoughtful');
}

function normalizeUspLabel(label: string): string {
  const clean = label.trim().replace(/[.]+$/, '');
  const fixes: Record<string, string> = {
    'gift note': 'Gift note',
    'ribbon & wrap': 'Ribbon & wrap',
    tested: 'Tested',
    thoughtfull: 'Thoughtful',
    thoughtful: 'Thoughtful',
  };
  return fixes[clean.toLowerCase()] ?? clean;
}

function UspRow({
  items,
  columns = 4,
}: {
  items?: Array<{ label: string; icon?: keyof typeof USP_ICON_MAP; body?: string }>;
  columns?: 2 | 3 | 4;
}) {
  const rows =
    items?.length && items.some((i) => i.label.trim())
      ? items
          .filter((i) => i.label.trim())
          .map((i, idx) => ({
            label: normalizeUspLabel(i.label),
            body: normalizeUspBody(
              i.body?.trim() || DEFAULT_USP_ITEMS[idx % DEFAULT_USP_ITEMS.length]?.body || '',
            ),
            icon: (i.icon ??
              DEFAULT_USP_ITEMS[idx % DEFAULT_USP_ITEMS.length]?.icon ??
              'heart') as keyof typeof USP_ICON_MAP,
          }))
      : DEFAULT_USP_ITEMS;

  return (
    <>
      <GiftSectionHeader
        overline="Why parents choose us"
        title="Thoughtful extras, every order"
        subtitle="Personal notes, ready hampers, and baby-safe picks — so gifting feels easy, not overwhelming."
      />
      <ul className="gift-usp-cards list-none" data-cols={String(columns)}>
        {rows.map(({ icon, label, body }, idx) => {
          const Icon = USP_ICON_MAP[icon] ?? Heart;
          const tone = USP_CARD_TONES[idx % USP_CARD_TONES.length] ?? 'pink';
          const toneClass = {
            pink: 'gift-usp-cards__item gift-usp-cards__item--pink',
            mint: 'gift-usp-cards__item gift-usp-cards__item--mint',
            sky: 'gift-usp-cards__item gift-usp-cards__item--sky',
            lavender: 'gift-usp-cards__item gift-usp-cards__item--lavender',
          }[tone];
          return (
            <li key={label} className={toneClass}>
              <span className="gift-usp-cards__icon" aria-hidden>
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="gift-usp-cards__label">{label}</p>
                {body ? <p className="gift-usp-cards__body">{body}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function HeroBlock({ props, layout }: { props: Record<string, unknown>; layout: 'page' | 'home' }) {
  const resolved = resolvePublicHeroLayout(props, layout);
  if (resolved !== 'legacyPanel') {
    return <CmsHeroByLayout props={props} pageLayout={layout} />;
  }

  return (
    <section className="clay-panel relative overflow-hidden px-gs-6 py-gs-7 sm:px-gs-7">
      <div
        className="gift-media-fallback pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
      />
      <div className="relative">
        {props.imageUrl ? (
          <div className="relative mb-gs-6 h-52 w-full overflow-hidden rounded-control shadow-clay">
            <GiftImage
              src={String(props.imageUrl)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 64rem"
              className="object-cover"
            />
          </div>
        ) : null}
        <BrandLogo href={null} size="lg" className="mb-gs-1" />
        <h1 className="gift-h1 mt-gs-2 leading-tight">{String(props.headline ?? '')}</h1>
        {props.subcopy ? (
          <p className="gift-muted mt-gs-4 max-w-prose">{String(props.subcopy)}</p>
        ) : null}
        <div className="mt-gs-6 flex flex-wrap gap-gs-3">
          {props.ctaLabel && props.ctaHref ? (
            <Link href={cmsHref(props.ctaHref)} className="clay-btn">
              {String(props.ctaLabel)}
            </Link>
          ) : null}
          {props.ctaLabel2 && props.ctaHref2 ? (
            <Link href={cmsHref(props.ctaHref2)} className="clay-btn-secondary">
              {String(props.ctaLabel2)}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const CORPORATE_CTA_HIGHLIGHTS = [
  { label: 'Volume pricing', Icon: Briefcase },
  { label: 'Branded cards', Icon: Sparkles },
  { label: 'PAN-India', Icon: Truck },
] as const;

function CtaBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const secondary = props.variant === 'secondary';
  const href = cmsHref(props.href, '/');
  const isCorporate = String(props.href ?? '').includes('/corporate');
  const highlights = isCorporate ? CORPORATE_CTA_HIGHLIGHTS : [];
  const btnClass = secondary ? 'clay-btn-secondary' : 'clay-btn';

  const copy = props.title ? (
    <>
      {home && isCorporate ? <p className="gift-overline">Teams · events</p> : null}
      <h2 className={`gift-h2 ${home && isCorporate ? 'mt-gs-2' : ''}`}>{String(props.title)}</h2>
      {props.body ? <p className="gift-muted mt-gs-3 max-w-prose">{String(props.body)}</p> : null}
      <Link href={href} className={`mt-gs-6 inline-flex items-center gap-gs-2 ${btnClass}`}>
        {String(props.label ?? 'Continue')}
        <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
      </Link>
    </>
  ) : (
    <div className="flex justify-center py-gs-2">
      <Link href={href} className={btnClass}>
        {String(props.label ?? 'Continue')}
      </Link>
    </div>
  );

  const visual =
    home && props.title ? (
      <div className="gift-cta-split__stage">
        <div className="gift-cta-split__blob" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gift/media/gift-box.svg"
          alt=""
          width={264}
          height={220}
          className="gift-cta-split__photo"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
        />
        {highlights.length ? (
          <ul className="gift-cta-split__chips">
            {highlights.map(({ label, Icon }) => (
              <li key={label} className="gift-cta-split__chip">
                <span className="gift-cta-split__chip-icon" aria-hidden>
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    ) : null;

  const inner = visual ? (
    <div className="gift-cta-split">
      <div className="gift-cta-split__copy">{copy}</div>
      {visual}
    </div>
  ) : (
    copy
  );

  if (home) {
    return (
      <GiftBand tone="lavender" className="relative overflow-hidden" toys={false}>
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
      <div className="relative max-h-[32rem] w-full overflow-hidden rounded-clay shadow-clay">
        <GiftImage
          src={url}
          alt={String(props.alt ?? '')}
          width={1600}
          height={900}
          sizes="(max-width: 768px) 100vw, 64rem"
          className="h-auto max-h-[32rem] w-full object-cover"
        />
      </div>
      {props.caption ? (
        <figcaption className="gift-muted mt-gs-3 text-center">{String(props.caption)}</figcaption>
      ) : null}
    </figure>
  );
}

function SpacerBlock({ props }: { props: Record<string, unknown> }) {
  const size = String(props.size ?? 'md');
  const h = size === 'sm' ? 'h-8' : size === 'lg' ? 'h-24' : 'h-14';
  return <div className={h} aria-hidden />;
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
  const hideHamperChip = props.hamper === true;
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
        <p className="clay-panel px-gs-4 py-gs-6 text-center text-body opacity-70">
          No published products match this grid yet.
        </p>
      ) : home ? (
        <div className="gift-stack">
          {featured ? (
            <HomeProductCard product={featured} featured hideHamperChip={hideHamperChip} />
          ) : null}
          {rest.length > 0 ? (
            <ul className={`grid gap-gs-5 ${restCols}`}>
              {rest.map((p) => (
                <li key={p.id} className="min-w-0 list-none">
                  <HomeProductCard product={p} hideHamperChip={hideHamperChip} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <ul className="grid gap-gs-5 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="clay-card overflow-hidden">
              <ProductCardGallery media={p.media} title={p.title}>
                <ProductCardHero
                  href={`/products/${p.slug}`}
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="h-44 w-full"
                >
                  {p.isReadyMadeHamper && (p.hamperItemCount ?? 0) > 0 ? (
                    <span className="absolute left-gs-2 top-gs-2 rounded-pill bg-foreground/85 px-gs-2 py-gs-1 text-caption font-semibold text-background">
                      {p.hamperItemCount} items
                    </span>
                  ) : null}
                  <ProductCardWishlist
                    variantId={p.wishlistVariantId ?? p.quickAddVariantId}
                    productTitle={p.title}
                  />
                </ProductCardHero>
                <div className="flex flex-col gap-gs-1 p-gs-4">
                  <Link
                    href={`/products/${p.slug}`}
                    className="line-clamp-2 font-medium text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  <ProductCardMeta
                    fromPricePaise={p.fromPricePaise}
                    salePricePaise={p.salePricePaise}
                    compareAtPaise={p.fromCompareAtPaise}
                    rating={p.averageRating}
                    count={p.reviewCount}
                    priceClassName="text-body text-primary"
                  />
                  {p.isReadyMadeHamper ? (
                    <HamperContentsTrigger
                      product={p}
                      variantId={p.available && p.available > 0 ? p.quickAddVariantId : null}
                    />
                  ) : null}
                  <ProductCardThumbs className="mt-gs-1" />
                </div>
              </ProductCardGallery>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (layout === 'home' && bandTone) {
    return (
      <GiftBand tone={bandTone} toys={false}>
        {grid}
      </GiftBand>
    );
  }
  return <section className="py-gs-2">{grid}</section>;
}

/** Soft Gift accent cycle for brand initials (no third-party hex). */
const BRAND_ACCENTS = ['pink', 'mint', 'lavender', 'sky'] as const;

const BRAND_INITIALS: Record<string, string> = {
  Chicco: 'Ch',
  'Johnson’s Baby': 'JB',
  "Johnson's Baby": 'JB',
  Mothercare: 'Mc',
  Pigeon: 'Pi',
  Himalaya: 'Hi',
  'The Moms Co.': 'TM',
  Mamaearth: 'Ma',
  Pampers: 'Pa',
  'Mee Mee': 'MM',
  Sebamed: 'Se',
  Cetaphil: 'Ce',
  'Mother Sparsh': 'MS',
  'Baby Hug': 'BH',
  'Philips Avent': 'PA',
  'Soft Nest': 'SN',
};

const BRAND_LOGO_BY_NAME: Record<string, string> = {
  'The Moms Co.': '/gift/brands/the-moms-co.svg',
  Chicco: '/gift/brands/chicco.svg',
  Mamaearth: '/gift/brands/mamaearth.svg',
  'Soft Nest': '/gift/brands/soft-nest.svg',
};

const DEFAULT_HOME_BRANDS = [
  'The Moms Co.',
  'Chicco',
  'Mamaearth',
  'Soft Nest',
  'Himalaya',
] as const;

type BrandItem = { name: string; logoUrl: string | null };

function brandInitials(name: string) {
  return (
    BRAND_INITIALS[name] ??
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  );
}

function normalizeBrands(raw: unknown): BrandItem[] {
  const mapped = (() => {
    if (!Array.isArray(raw)) {
      return DEFAULT_HOME_BRANDS.map((name) => ({
        name,
        logoUrl: BRAND_LOGO_BY_NAME[name] ?? null,
      }));
    }
    if (raw.length === 0) return [];
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
  })();

  // We are the storefront — don't list ourselves in "brands we stock".
  return mapped.filter((b) => b.name.toLowerCase() !== 'inabiya');
}

/** Dual-row brand pill carousel (seamless marquee; no “+ more”). */
function BrandCarouselRow({
  brands,
  accentsOffset,
  reverse,
}: {
  brands: BrandItem[];
  accentsOffset: number;
  reverse?: boolean;
}) {
  if (!brands.length) return null;

  const renderGroup = (duplicate: boolean) => (
    <ul className="gift-brand-panel__group list-none" aria-hidden={duplicate ? true : undefined}>
      {brands.map((brand, i) => {
        const accent = BRAND_ACCENTS[(accentsOffset + i) % BRAND_ACCENTS.length];
        const initials = brandInitials(brand.name);
        return (
          <li
            key={`${duplicate ? 'dup-' : ''}${brand.name}`}
            className={`gift-brand-panel__pill gift-brand-panel__pill--${accent}`}
          >
            <span className="gift-brand-panel__icon" aria-hidden>
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- brand marks often SVG
                <img
                  src={brand.logoUrl}
                  alt=""
                  className="gift-brand-panel__mark-img"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              ) : (
                initials
              )}
            </span>
            <span className="gift-brand-panel__name">{brand.name}</span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div
      className={`gift-brand-panel__viewport${reverse ? ' gift-brand-panel__viewport--reverse' : ''}`}
    >
      <div className="gift-brand-panel__track">
        {renderGroup(false)}
        {renderGroup(true)}
      </div>
    </div>
  );
}

function BrandPillPanel({ brands, title }: { brands: unknown; title: string }) {
  const items = normalizeBrands(brands);
  if (!items.length) return null;

  const heading = title.trim() || 'Trusted baby & kids brands we stock';
  const mid = Math.ceil(items.length / 2);
  const row1 = items.slice(0, mid);
  const row2 = items.slice(mid);

  return (
    <div className="gift-brand-panel">
      <h2 className="gift-brand-panel__title">{heading}</h2>
      <div className="gift-brand-panel__carousel" role="region" aria-label={heading}>
        <BrandCarouselRow brands={row1} accentsOffset={0} />
        <BrandCarouselRow brands={row2} accentsOffset={row1.length} reverse />
      </div>
    </div>
  );
}

function parseUsps(
  raw: unknown,
): Array<{ label: string; icon?: keyof typeof USP_ICON_MAP; body?: string }> {
  if (!Array.isArray(raw)) return [];
  const out: Array<{ label: string; icon?: keyof typeof USP_ICON_MAP; body?: string }> = [];
  for (const u of raw) {
    if (!u || typeof u !== 'object') continue;
    const label = String((u as { label?: unknown }).label ?? '').trim();
    if (!label) continue;
    const iconRaw = (u as { icon?: unknown }).icon;
    const icon =
      iconRaw === 'heart' ||
      iconRaw === 'package' ||
      iconRaw === 'gift' ||
      iconRaw === 'truck' ||
      iconRaw === 'shield' ||
      iconRaw === 'sparkles'
        ? iconRaw
        : undefined;
    const bodyRaw = (u as { body?: unknown }).body;
    const body = typeof bodyRaw === 'string' && bodyRaw.trim() ? bodyRaw.trim() : undefined;
    out.push({ label, icon, body });
  }
  return out;
}

function BrandStripBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const brands = props.brands;
  const hasBrands = Array.isArray(brands) && brands.length > 0;
  const usps = parseUsps(props.usps);
  const uspsOnly = props.showUsps === true;
  const showUsps = uspsOnly || (props.showUsps !== false && usps.length > 0 && home);
  /** USP-only strips never render a brand pill panel (avoids a second carousel). */
  const showBrands = hasBrands && !uspsOnly;

  if (!showBrands && !showUsps) return null;

  const title = String(props.title ?? 'Trusted baby & kids brands we stock');

  const body = (
    <>
      {showUsps ? <UspRow items={usps} columns={parseUspColumns(props.uspColumns)} /> : null}
      {showBrands ? <BrandPillPanel brands={brands} title={title} /> : null}
    </>
  );

  if (home) {
    return (
      <GiftBand tone="soft" toys={false}>
        {body}
      </GiftBand>
    );
  }
  return <section className="gift-section py-gs-6">{body}</section>;
}

function RecipientSplitBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const grid = parseRecipientGrid(props.grid);
  const rawItems = Array.isArray(props.items) ? props.items : [];
  const fallback = [props.left, props.right];
  const source = rawItems.length >= 2 ? rawItems : fallback;
  const cards = source
    .map((row, i) => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return null;
      const card = row as Record<string, unknown>;
      const label = String(card.label ?? '').trim();
      const href = String(card.href ?? '').trim();
      if (!label || !href) return null;
      const accent = parseRecipientAccent(card.accent, i);
      return {
        key: `${href}-${i}`,
        label,
        href,
        eyebrow: String(card.eyebrow ?? 'For the little'),
        blurb: card.blurb ? String(card.blurb) : '',
        cta: String(card.cta ?? `Shop ${label} gifts →`),
        accent,
        imageUrl: card.imageUrl ? String(card.imageUrl) : '',
        imageAlt: String(card.imageAlt || `Shop gifts for ${label}`),
      };
    })
    .filter((row): row is NonNullable<typeof row> => row != null)
    .slice(0, RECIPIENT_GRID_MAX[grid]);
  if (cards.length < 2) return null;

  const accentClass = {
    pink: 'gift-recipient-card gift-recipient-card--pink',
    sky: 'gift-recipient-card gift-recipient-card--sky',
    mint: 'gift-recipient-card gift-recipient-card--mint',
    lavender: 'gift-recipient-card gift-recipient-card--lavender',
  } as const;
  const sizes =
    grid === '3x2'
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
      : '(max-width: 640px) 100vw, 50vw';

  const body = (
    <>
      <GiftSectionHeader
        overline={home ? 'For every little one' : null}
        title={props.title ? String(props.title) : null}
        subtitle={props.subtitle ? String(props.subtitle) : null}
      />
      <div className="gift-recipient-grid" data-grid={grid}>
        {cards.map((card) => {
          if (home) {
            return (
              <Link
                key={card.key}
                href={cmsHref(card.href, '/products')}
                className={`group ${accentClass[card.accent]}`}
                data-testid={`recipient-${card.label}`}
              >
                <div className="gift-recipient-card__media">
                  {card.imageUrl ? (
                    <GiftImage
                      src={card.imageUrl}
                      alt={card.imageAlt}
                      fill
                      sizes={sizes}
                      className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div
                      className={`h-full w-full ${card.accent === 'sky' ? 'gift-panel-sky' : 'gift-media-fallback'}`}
                    />
                  )}
                  <div className="gift-recipient-card__overlay" aria-hidden />
                  <div className="gift-recipient-card__copy">
                    <p className="gift-recipient-card__eyebrow">{card.eyebrow}</p>
                    <p className="gift-recipient-card__label">{card.label}</p>
                    {card.blurb ? <p className="gift-recipient-card__blurb">{card.blurb}</p> : null}
                    <span className="gift-recipient-card__cta">{card.cta}</span>
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={card.key}
              href={cmsHref(card.href, '/products')}
              className={`${card.accent === 'sky' ? 'gift-panel-sky ' : ''}clay-panel block overflow-hidden p-gs-6 transition hover:-translate-y-px`}
            >
              <p className="gift-muted">{card.eyebrow}</p>
              <p className={`gift-display mt-gs-1 ${card.accent === 'sky' ? 'text-info' : ''}`}>
                {card.label}
              </p>
              {card.blurb ? <p className="gift-muted mt-gs-3">{card.blurb}</p> : null}
              <p className="mt-gs-4 text-body font-medium text-foreground">{card.cta}</p>
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
  return <p className="gift-muted mt-gs-3 text-caption">{parts.join(' · ')}</p>;
}

function ArticleTeasersBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const articles = Array.isArray(props.articles) ? (props.articles as ArticleTeaser[]) : [];
  if (!articles.length) {
    if (props.showEmptyPlaceholder === true) {
      const body = (
        <p className="clay-panel px-gs-4 py-gs-6 text-center text-body opacity-70">
          Journal stories are on the way — check back soon.
        </p>
      );
      if (home) {
        return (
          <GiftBand tone="soft" toys={false}>
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
              className={`group clay-panel block w-full overflow-hidden transition hover:-translate-y-px ${
                featured ? 'sm:grid sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]' : ''
              }`}
            >
              <div
                className={`relative overflow-hidden bg-white ${
                  featured ? 'aspect-[16/9] sm:aspect-auto sm:min-h-[14rem]' : 'aspect-[16/9]'
                }`}
              >
                {a.imageUrl ? (
                  /\.svg(\?|#|$)/i.test(String(a.imageUrl)) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- SVG covers
                    <img
                      src={String(a.imageUrl)}
                      alt={a.title}
                      className="absolute inset-0 h-full w-full object-contain p-gs-3 sm:p-gs-4 transition duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                    />
                  ) : (
                    <GiftImage
                      src={String(a.imageUrl)}
                      alt={a.title}
                      fill
                      sizes={
                        featured
                          ? '(max-width: 640px) 100vw, 50vw'
                          : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'
                      }
                      className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                  )
                ) : (
                  <div className="gift-media-fallback absolute inset-0 flex items-end p-gs-5">
                    <p className="gift-display text-primary/35">Journal</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center p-gs-5 sm:p-gs-6">
                {a.category?.name ? (
                  <p className="text-caption font-medium uppercase tracking-[0.1em] text-primary">
                    {a.category.name}
                  </p>
                ) : null}
                <h3
                  className={`font-display transition-colors group-hover:text-primary ${
                    featured ? 'gift-h2 mt-gs-2' : 'gift-h2 mt-gs-2'
                  }`}
                >
                  {a.title}
                </h3>
                {a.description ? (
                  <p className="gift-muted mt-gs-2 line-clamp-2">{a.description}</p>
                ) : null}
                <ArticleTeaserMeta article={a} />
                <p className="mt-gs-4 text-body font-medium text-primary">Read article →</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );

  if (home) {
    return (
      <GiftBand tone="soft" toys={false}>
        {body}
      </GiftBand>
    );
  }
  return <section>{body}</section>;
}

/** Server-safe allowlist sanitize (no DOMPurify / jsdom). */
function RichTextBlock({ html }: { html: string }) {
  const safe = sanitizeArticleHtml(html);
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
      <p className="gift-h2 leading-snug">{text}</p>
      {ctaLabel && ctaHref ? (
        <Link href={cmsHref(ctaHref)} className="clay-btn-secondary shrink-0 text-body">
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

function FeaturedCarouselBlock({ props }: { props: Record<string, unknown> }) {
  const cards = parseCmsCarouselCards(props.cards);
  if (!cards.length) return null;
  const eyebrow = String(props.eyebrow ?? '').trim();
  const headline = String(props.headline ?? '').trim();
  const accentWord = String(props.accentWord ?? '').trim();
  const subcopy = String(props.subcopy ?? '').trim();
  return (
    <CategoryCarousel
      eyebrow={eyebrow || undefined}
      headline={headline || undefined}
      accentWord={accentWord || undefined}
      subcopy={subcopy || undefined}
      cards={cards}
    />
  );
}

function WhatsappCtaSection({ props }: { props: Record<string, unknown> }) {
  const title = String(props.title ?? '').trim();
  if (!title) return null;
  return (
    <div className="gift-shell-width py-gs-5">
      <WhatsappCtaBlock
        eyebrow={String(props.eyebrow ?? '').trim() || undefined}
        title={title}
        body={String(props.body ?? '').trim() || undefined}
        countryCode={String(props.countryCode ?? '').trim() || undefined}
        placeholder={String(props.placeholder ?? '').trim() || undefined}
        ctaLabel={String(props.ctaLabel ?? '').trim() || undefined}
        disclaimer={String(props.disclaimer ?? '').trim() || undefined}
      />
    </div>
  );
}

function OfferCarouselBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const cards = Array.isArray(props.cards)
    ? (props.cards as Array<Record<string, unknown>>)
        .map((c) => ({
          tag: String(c.tag ?? '').trim(),
          title: String(c.title ?? '').trim(),
          subtitle: c.subtitle ? String(c.subtitle) : '',
          body: c.body ? String(c.body) : '',
          ctaLabel: String(c.ctaLabel ?? '').trim(),
          ctaHref: String(c.ctaHref ?? '').trim(),
          tone:
            c.tone === 'sky' || c.tone === 'lavender' || c.tone === 'blush'
              ? (c.tone as 'sky' | 'lavender' | 'blush')
              : 'blush',
          icon:
            c.icon === 'briefcase' || c.icon === 'box' || c.icon === 'heart'
              ? (c.icon as 'briefcase' | 'box' | 'heart')
              : 'heart',
        }))
        .filter((c) => c.tag && c.title && c.ctaLabel && c.ctaHref)
        .slice(0, 8)
    : [];
  if (!cards.length) return null;

  const iconMap = { heart: Heart, briefcase: Briefcase, box: Package } as const;
  const toneClass = {
    blush: 'gift-offer-card gift-offer-card--blush',
    sky: 'gift-offer-card gift-offer-card--sky',
    lavender: 'gift-offer-card gift-offer-card--lavender',
  } as const;

  const body = (
    <>
      <GiftSectionHeader
        overline={props.overline ? String(props.overline) : 'This week'}
        title={props.title ? String(props.title) : 'Offers in motion'}
        subtitle={props.subtitle ? String(props.subtitle) : null}
      />
      <ul className="gift-offers-carousel list-none">
        {cards.map((card) => {
          const Icon = iconMap[card.icon];
          return (
            <li key={`${card.tag}-${card.title}`} className={toneClass[card.tone]}>
              <div className="gift-offer-card__top">
                <span className="gift-offer-card__icon" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="gift-offer-card__tag">{card.tag}</span>
              </div>
              <p className="gift-offer-card__title">{card.title}</p>
              {card.subtitle ? <p className="gift-offer-card__subtitle">{card.subtitle}</p> : null}
              {card.body ? <p className="gift-offer-card__body">{card.body}</p> : null}
              <Link
                href={cmsHref(card.ctaHref)}
                className="gift-offer-card__cta clay-btn-secondary inline-flex items-center gap-gs-2"
              >
                {card.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (home) {
    return <GiftBand tone="soft">{body}</GiftBand>;
  }
  return <section className="py-gs-4">{body}</section>;
}

function ThinStripBlock({ props }: { props: Record<string, unknown> }) {
  const text = String(props.text ?? '').trim();
  const extra = Array.isArray(props.items)
    ? (props.items as unknown[]).map((row) => String(row ?? '').trim()).filter(Boolean)
    : [];
  const lines = extra.length ? extra : text ? [text] : [];
  if (!lines.length) return null;

  const ctaLabel = props.ctaLabel ? String(props.ctaLabel) : '';
  const ctaHref = props.ctaHref ? String(props.ctaHref) : '';
  const rawTone = String(props.tone ?? 'gold');
  const tone =
    rawTone === 'blush' ||
    rawTone === 'mint' ||
    rawTone === 'sky' ||
    rawTone === 'soft' ||
    rawTone === 'gold'
      ? rawTone
      : 'gold';
  const marquee = props.marquee === true || props.marquee === 'true';
  const loop = marquee && lines.length > 0 ? [...lines, ...lines] : lines;

  return (
    <section className={`gift-thin-strip gift-thin-strip--${tone}`} data-testid="thin-strip">
      <div className="gift-thin-strip__inner">
        <div className={marquee ? 'gift-thin-strip__marquee' : 'gift-thin-strip__static'}>
          {loop.map((line, i) => (
            <span key={`${line}-${i}`} className="gift-thin-strip__item">
              {line}
            </span>
          ))}
        </div>
        {ctaLabel && ctaHref ? (
          <Link href={cmsHref(ctaHref)} className="gift-thin-strip__cta">
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

function CountdownBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const endsAtRaw = String(props.endsAt ?? '').trim();
  const endsAt = endsAtRaw ? new Date(endsAtRaw) : null;
  const title = String(props.title ?? 'Offer ends soon').trim();
  const expiredLabel = String(props.expiredLabel ?? 'This offer has ended').trim();
  const ctaLabel = props.ctaLabel ? String(props.ctaLabel) : '';
  const ctaHref = props.ctaHref ? String(props.ctaHref) : '';
  const valid = endsAt && !Number.isNaN(endsAt.getTime());
  const expired = valid ? endsAt.getTime() <= Date.now() : true;

  let remaining = '';
  if (valid && !expired) {
    const ms = endsAt.getTime() - Date.now();
    const days = Math.floor(ms / 86_400_000);
    const hours = Math.floor((ms % 86_400_000) / 3_600_000);
    const mins = Math.floor((ms % 3_600_000) / 60_000);
    remaining =
      days > 0
        ? `${days}d ${hours}h ${mins}m left`
        : hours > 0
          ? `${hours}h ${mins}m left`
          : `${mins}m left`;
  }

  const inner = (
    <div className="flex flex-col items-start justify-between gap-gs-3 sm:flex-row sm:items-center">
      <div>
        <p className="gift-overline">{expired ? 'Ended' : 'Limited time'}</p>
        <p className="font-display mt-gs-2 text-xl sm:text-2xl">{expired ? expiredLabel : title}</p>
        {!expired && remaining ? (
          <p className="mt-gs-2 text-body font-medium text-primary" suppressHydrationWarning>
            {remaining}
          </p>
        ) : null}
      </div>
      {ctaLabel && ctaHref && !expired ? (
        <Link href={cmsHref(ctaHref)} className="clay-btn shrink-0 text-body">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  if (home) {
    return <GiftBand tone="soft">{inner}</GiftBand>;
  }

  return (
    <section className="gift-band gift-band--soft">
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
  const safe = sanitizeArticleHtml(html);
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
  const overline = String(props.overline ?? '').trim() || (home ? 'Help' : '');
  const items = parseFaqItems(props.items);
  if (items.length === 0) return null;

  const accordion = (
    <FaqAccordion
      id="faq"
      title={title}
      overline={overline || undefined}
      home={home}
      items={items.map((item) => ({
        question: item.question,
        answer: <FaqAnswer html={item.answerHtml} />,
      }))}
    />
  );

  if (home) {
    return (
      <GiftBand tone="mint" toys={false}>
        {accordion}
      </GiftBand>
    );
  }
  return accordion;
}

function FaqJsonLd({ blocks }: { blocks: CmsPageBlock[] }) {
  const data = collectCmsFaqJsonLd(blocks);
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdToScriptHtml(data) }}
    />
  );
}

async function DiscoveryChipsBlock({
  props,
  home,
}: {
  props: Record<string, unknown>;
  home?: boolean;
}) {
  const manualItems = Array.isArray(props.items)
    ? (
        props.items as Array<{
          label?: string;
          href?: string;
          imageUrl?: string;
          imageAlt?: string;
        }>
      )
        .map((i) => ({
          label: String(i.label ?? '').trim(),
          href: String(i.href ?? '').trim(),
          imageUrl: i.imageUrl ? String(i.imageUrl).trim() : '',
          imageAlt: i.imageAlt ? String(i.imageAlt).trim() : '',
          description: '',
          overline: '',
        }))
        .filter((i) => i.label && i.href)
    : [];

  const itemsSource = String(props.itemsSource ?? 'manual');
  const looksLikeCategoryBlock =
    itemsSource === 'catalogCollections' ||
    (manualItems.length > 0 &&
      manualItems.every((i) => isCollectionHref(i.href)) &&
      /categor/i.test(String(props.title ?? 'Shop by collection')));
  let items = manualItems;
  if (looksLikeCategoryBlock) {
    const cols = await fetchCatalogCollections();
    items = resolveCatalogCollectionChips(cols, manualItems);
  }
  if (!items.length) return null;

  const asCards = items.some((i) => i.imageUrl);
  const limit = parseHomeCollectionLimit(props.limit);
  const visible = asCards ? items.slice(0, limit) : items;
  const seeAllHref = props.seeAllHref ? String(props.seeAllHref) : '/products';
  const seeAllLabel = props.seeAllLabel ? String(props.seeAllLabel) : 'See all';
  const showSeeAll = asCards && (items.length > visible.length || Boolean(props.seeAllHref));

  const body = (
    <>
      <GiftSectionHeader
        overline={props.overline ? String(props.overline) : home ? 'Browse the shop' : null}
        title={
          props.title ? String(props.title) : asCards ? 'Shop by collection' : 'Shop by moment'
        }
        subtitle={
          props.subtitle
            ? String(props.subtitle)
            : home && asCards
              ? 'Clothing, care, toys, and mom essentials — curated for gifting.'
              : home && !asCards
                ? 'Jump into age bands and occasions — filters open on the gift shop.'
                : null
        }
        actionHref={showSeeAll ? seeAllHref : null}
        actionLabel={showSeeAll ? seeAllLabel : null}
      />
      {asCards ? (
        <ul className="gift-category-grid list-none">
          {visible.map((item, idx) => {
            const tones = ['pink', 'sky', 'mint', 'lavender'] as const;
            const tone = tones[idx % tones.length] ?? 'pink';
            const kicker = item.overline ? collectionKicker(item.overline) : '';
            return (
              <li key={`${item.label}-${item.href}`}>
                <Link
                  href={cmsHref(item.href)}
                  className={`gift-category-card gift-category-card--${tone} group`}
                  data-testid={`category-${item.label}`}
                >
                  <div className="gift-category-card__sticker">
                    <div className="gift-category-card__media">
                      {item.imageUrl ? (
                        <GiftImage
                          src={item.imageUrl}
                          alt={item.imageAlt || item.label}
                          fill
                          sizes="(max-width: 767px) 50vw, 25vw"
                          className="object-cover object-center transition duration-500 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        />
                      ) : (
                        <div className="gift-media-fallback h-full w-full" />
                      )}
                      {kicker ? (
                        <span className="gift-category-card__chip" aria-hidden>
                          {kicker}
                        </span>
                      ) : null}
                      <span className="gift-category-card__doodle" aria-hidden>
                        <CategoryCardDoodle n={idx} />
                      </span>
                      <WaveAccent accent={tone} />
                    </div>
                    <p className="gift-category-card__label">{item.label}</p>
                    <span className="gift-pill-overlap gift-category-card__cta">
                      <ShoppingBag className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                      Shop
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="flex flex-wrap gap-gs-2">
          {items.map((item) => (
            <li key={`${item.label}-${item.href}`}>
              <Link
                href={cmsHref(item.href)}
                className="clay-chip inline-flex text-body hover:bg-primary/10"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
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
  const title = String(props.title ?? 'Customise a box just for them.').trim();
  const body = props.body ? String(props.body) : null;
  const ctaLabel = String(props.ctaLabel ?? 'Build Your Box');
  const ctaHref = String(props.ctaHref ?? '/build-your-box');
  const overline = String(props.overline ?? '6-step gift builder');
  const steps = Array.isArray(props.steps)
    ? (props.steps as Array<{ title?: string; body?: string }>)
        .map((s) => ({
          title: String(s.title ?? '').trim(),
          body: s.body ? String(s.body) : '',
        }))
        .filter((s) => s.title)
        .slice(0, 6)
    : [];

  const BYB_STEP_ICONS = [UserRound, Baby, Cake, Wallet, LayoutGrid, Gift] as const;

  const inner = (
    <div className="gift-byb-banner">
      <div className="gift-byb-banner__grid">
        <div className="gift-byb-banner__copy">
          <p className="gift-byb-banner__overline">{overline}</p>
          <h2 className="gift-byb-banner__title">{title}</h2>
          {body ? <p className="gift-byb-banner__body">{body}</p> : null}
          <Link
            href={cmsHref(ctaHref)}
            className="gift-byb-banner__cta clay-btn inline-flex items-center gap-gs-2"
            data-testid="byb-cta"
          >
            <Gift className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {ctaLabel}
            <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </Link>
          <ul className="gift-byb-banner__trust list-none">
            <li className="clay-chip">Budget-first</li>
            <li className="clay-chip">Age-appropriate</li>
            <li className="clay-chip">Personalised</li>
          </ul>
        </div>
        {steps.length ? (
          <ol className="gift-byb-steps list-none">
            {steps.map((step, i) => {
              const StepIcon = BYB_STEP_ICONS[i] ?? Gift;
              return (
                <li key={`${step.title}-${i}`} className="gift-byb-steps__item">
                  <div className="gift-byb-steps__meta">
                    <span className="gift-byb-steps__num" aria-hidden>
                      {i + 1}
                    </span>
                    <span className="gift-byb-steps__icon" aria-hidden>
                      <StepIcon className="h-4 w-4" strokeWidth={1.85} />
                    </span>
                  </div>
                  <div>
                    <p className="gift-byb-steps__title">{step.title}</p>
                    {step.body ? <p className="gift-byb-steps__body">{step.body}</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : null}
      </div>
    </div>
  );

  if (home) {
    return (
      <div className="gift-band gift-band--soft" data-gift-reveal="">
        <div className="gift-band-inner">{inner}</div>
      </div>
    );
  }
  return <section className="py-gs-4">{inner}</section>;
}

function ExclusiveOffersBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const cards = Array.isArray(props.cards)
    ? (props.cards as Array<Record<string, unknown>>)
        .map((c) => ({
          tag: String(c.tag ?? '').trim(),
          title: String(c.title ?? '').trim(),
          subtitle: c.subtitle ? String(c.subtitle) : '',
          body: c.body ? String(c.body) : '',
          ctaLabel: String(c.ctaLabel ?? '').trim(),
          ctaHref: String(c.ctaHref ?? '').trim(),
          tone:
            c.tone === 'sky' || c.tone === 'lavender' || c.tone === 'blush'
              ? (c.tone as 'sky' | 'lavender' | 'blush')
              : 'blush',
          icon:
            c.icon === 'briefcase' || c.icon === 'box' || c.icon === 'heart'
              ? (c.icon as 'briefcase' | 'box' | 'heart')
              : 'heart',
        }))
        .filter((c) => c.tag && c.title && c.ctaLabel && c.ctaHref)
        .slice(0, 6)
    : [];
  if (!cards.length) return null;

  const iconMap = { heart: Heart, briefcase: Briefcase, box: Package } as const;
  /* Full class strings so Tailwind keeps tone backgrounds (no dynamic purge). */
  const toneClass = {
    blush: 'gift-offer-card gift-offer-card--blush',
    sky: 'gift-offer-card gift-offer-card--sky',
    lavender: 'gift-offer-card gift-offer-card--lavender',
  } as const;
  const columns = parseOfferColumns(props.columns);

  const body = (
    <>
      <GiftSectionHeader
        overline={props.overline ? String(props.overline) : 'Limited-time benefits'}
        title={props.title ? String(props.title) : 'Exclusive Offers for Every Occasion'}
        subtitle={props.subtitle ? String(props.subtitle) : null}
      />
      <ul className="gift-offers-grid list-none" data-cols={String(columns)}>
        {cards.map((card) => {
          const Icon = iconMap[card.icon];
          return (
            <li key={`${card.tag}-${card.title}`} className={toneClass[card.tone]}>
              <div className="gift-offer-card__top">
                <span className="gift-offer-card__icon" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="gift-offer-card__tag">{card.tag}</span>
              </div>
              <p className="gift-offer-card__title">{card.title}</p>
              {card.subtitle ? <p className="gift-offer-card__subtitle">{card.subtitle}</p> : null}
              {card.body ? <p className="gift-offer-card__body">{card.body}</p> : null}
              <Link
                href={cmsHref(card.ctaHref)}
                className="gift-offer-card__cta clay-btn-secondary inline-flex items-center gap-gs-2"
                data-testid={`offer-cta-${card.tone}`}
              >
                {card.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              </Link>
              <span className="gift-offer-card__watermark" aria-hidden>
                <Icon className="h-full w-full" strokeWidth={1} />
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );

  if (home) {
    return <GiftBand tone="soft">{body}</GiftBand>;
  }
  return <section className="py-gs-4">{body}</section>;
}

function TestimonialsBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const items = Array.isArray(props.items)
    ? (props.items as Array<Record<string, unknown>>)
        .map((row) => ({
          quote: String(row.quote ?? '').trim(),
          author: String(row.author ?? '').trim(),
          role: row.role ? String(row.role) : '',
          rating:
            typeof row.rating === 'number' && row.rating >= 1 && row.rating <= 5 ? row.rating : 5,
          dated: resolveTestimonialDated(
            String(row.author ?? ''),
            String(row.dated ?? row.date ?? ''),
          ),
        }))
        .filter((row) => row.quote && row.author)
        .slice(0, 12)
        .map((row, idx) => ({ ...row, idx }))
    : [];
  if (!items.length) return null;

  const overline = props.overline ? String(props.overline) : 'Parent love';
  const title = props.title ? String(props.title) : 'Loved by new parents across India';
  const subtitle = props.subtitle
    ? String(props.subtitle)
    : 'Honest notes from recent gifts — personal, on-budget, and actually useful.';
  const ctaLabel = typeof props.ctaLabel === 'string' ? props.ctaLabel.trim() : '';
  const ctaHref = typeof props.ctaHref === 'string' ? props.ctaHref.trim() : '';
  const useMarquee = parseTestimonialsDisplay(props.display, items.length) === 'marquee';
  const quoteColumns = parseQuoteColumns(props.quoteColumns);
  const leftCol = items.filter((_, i) => i % 2 === 0);
  const rightCol = items.filter((_, i) => i % 2 === 1);

  const copy = (
    <div className="gift-testimonials__copy">
      {overline ? <p className="gift-overline">{overline}</p> : null}
      {title ? (
        <h2 className={`gift-h1 ${overline ? 'mt-gs-3' : ''} leading-tight`}>{title}</h2>
      ) : null}
      {subtitle ? <p className="gift-body mt-gs-3">{subtitle}</p> : null}
      {ctaLabel && ctaHref ? (
        <Link href={cmsHref(ctaHref)} className="clay-btn mt-gs-5 inline-flex">
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );

  const body = (
    <div
      className={useMarquee ? 'gift-testimonials' : 'gift-testimonials gift-testimonials--static'}
    >
      {copy}
      {useMarquee ? (
        <div className="gift-testimonials__stage">
          <div
            className="gift-testimonials__viewport gift-testimonials__viewport--desktop"
            role="region"
            tabIndex={0}
            aria-label="Parent testimonials"
          >
            <GiftTestimonialMarquee items={leftCol} speed="slow" />
            <GiftTestimonialMarquee items={rightCol} speed="fast" />
          </div>
          <div
            className="gift-testimonials__viewport gift-testimonials__viewport--mobile"
            role="region"
            tabIndex={0}
            aria-label="Parent testimonials"
          >
            <GiftTestimonialMarquee items={items} speed="fast" />
          </div>
        </div>
      ) : (
        <ul className="gift-testimonials-grid list-none" data-cols={String(quoteColumns)}>
          {items.map((item) => (
            <TestimonialCard key={`${item.author}-${item.quote.slice(0, 24)}`} item={item} />
          ))}
        </ul>
      )}
    </div>
  );

  if (home) {
    return (
      <GiftBand tone="blush" toys={false}>
        {body}
      </GiftBand>
    );
  }
  return <section className="py-gs-4">{body}</section>;
}

function wrapStyle(props: Record<string, unknown>, node: ReactNode, key: string) {
  const cls = sectionShellClass(props);
  const headline =
    typeof props.headlineSize === 'string' && props.headlineSize.trim()
      ? props.headlineSize
      : undefined;
  if (!cls && !headline) return <Fragment key={key}>{node}</Fragment>;
  return (
    <div
      key={key}
      className={cls || undefined}
      {...(headline ? { 'data-cms-headline': headline } : {})}
    >
      {node}
    </div>
  );
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
  if (b.type === 'cta') return wrapStyle(b.props, <CtaBlock props={b.props} home={home} />, b.id);
  if (b.type === 'image') return wrapStyle(b.props, <ImageBlock props={b.props} />, b.id);
  if (b.type === 'spacer') return <SpacerBlock key={b.id} props={b.props} />;
  if (b.type === 'productGrid') {
    const tones = ['mint', 'sky'] as const;
    const bandTone = home ? tones[productBandIndex.current++ % 2] : undefined;
    return wrapStyle(
      b.props,
      <ProductGridBlock props={b.props} layout={layout} bandTone={bandTone} />,
      b.id,
    );
  }
  if (b.type === 'brandStrip') {
    return wrapStyle(b.props, <BrandStripBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'recipientSplit') {
    return wrapStyle(b.props, <RecipientSplitBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'discoveryChips') {
    return wrapStyle(b.props, <DiscoveryChipsBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'buildYourBoxTeaser') {
    return wrapStyle(b.props, <BuildYourBoxTeaserBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'articleTeasers') {
    return wrapStyle(b.props, <ArticleTeasersBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'saleStrip') {
    return wrapStyle(b.props, <SaleStripBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'thinStrip') {
    return wrapStyle(b.props, <ThinStripBlock props={b.props} />, b.id);
  }
  if (b.type === 'featuredCarousel') {
    return wrapStyle(b.props, <FeaturedCarouselBlock props={b.props} />, b.id);
  }
  if (b.type === 'whatsappCta') {
    return wrapStyle(b.props, <WhatsappCtaSection props={b.props} />, b.id);
  }
  if (b.type === 'offerCarousel') {
    return wrapStyle(b.props, <OfferCarouselBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'countdown') {
    return wrapStyle(b.props, <CountdownBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'exclusiveOffers') {
    return wrapStyle(b.props, <ExclusiveOffersBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'testimonials') {
    return wrapStyle(b.props, <TestimonialsBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'faq') {
    return wrapStyle(b.props, <FaqBlock props={b.props} home={home} />, b.id);
  }
  if (b.type === 'richText') {
    return wrapStyle(b.props, <RichTextBlock html={String(b.props.html ?? '')} />, b.id);
  }
  if (b.type === 'customSection') {
    return <CustomSectionBlock key={b.id} props={b.props} />;
  }
  return null;
}

export function MarketingPageBlocks({
  blocks,
  previewBanner,
  layout = 'page',
  emitFaqJsonLd = true,
}: Props) {
  if (layout === 'home') {
    const hero = blocks.filter((b) => b.type === 'hero');
    const rest = blocks.filter((b) => b.type !== 'hero' && b.type !== 'footer');
    const productBandIndex = { current: 0 };
    return (
      <div>
        {emitFaqJsonLd ? <FaqJsonLd blocks={blocks} /> : null}
        {previewBanner ? (
          <div className="gift-banner gift-banner--warning sticky top-0 z-10 text-center text-caption font-medium">
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
      {emitFaqJsonLd ? <FaqJsonLd blocks={blocks} /> : null}
      {previewBanner ? (
        <div className="gift-banner gift-banner--warning sticky top-0 z-10 mb-gs-4 text-center text-caption font-medium">
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
