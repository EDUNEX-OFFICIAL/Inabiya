'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { Gift, HeartHandshake, Package, Truck } from 'lucide-react';
import { formatInr } from '@/lib/catalog';
import { GiftStorefrontHero } from '@/components/cms/gift-storefront-hero';

export type CmsBlockProduct = {
  id: string;
  slug: string;
  title: string;
  fromPricePaise: number;
  media: Array<{ url: string; altText: string | null }>;
  brandName?: string | null;
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
    <div className={`gift-band gift-band--${tone} ${className}`}>
      {toys ? <GiftToysDecor variant={toyVariant} /> : null}
      <div className="gift-band-inner">{children}</div>
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

const USP_ITEMS = [
  { icon: HeartHandshake, label: 'Personalised with care' },
  { icon: Package, label: 'Ready-made hampers' },
  { icon: Gift, label: 'Baby-safe picks' },
  { icon: Truck, label: 'Pan-India shipping' },
] as const;

function UspRow() {
  return (
    <ul className="gift-usp mt-gs-6 list-none border-t border-border-subtle pt-gs-6">
      {USP_ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="gift-usp__item">
          <span className="gift-usp__icon" aria-hidden>
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-foreground opacity-80">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

function HeroBlock({
  props,
  layout,
}: {
  props: Record<string, unknown>;
  layout: 'page' | 'home';
}) {
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
  const inner =
    props.title ? (
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
  const seeAllHref = props.seeAllHref ? String(props.seeAllHref) : null;
  const products = Array.isArray(props.products)
    ? (props.products as CmsBlockProduct[])
    : [];

  const grid = (
    <>
      <div className="mb-gs-6 flex items-end justify-between gap-gs-4">
        {title ? <h2 className="gift-h2">{title}</h2> : <span />}
        {seeAllHref ? (
          <Link href={seeAllHref} className="text-sm font-medium text-primary hover:underline">
            See all
          </Link>
        ) : null}
      </div>
      {products.length === 0 ? (
        <p className="clay-panel px-gs-4 py-gs-6 text-center text-sm opacity-70">
          No published products match this grid yet.
        </p>
      ) : layout === 'home' ? (
        <ul className="grid gap-gs-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="clay-card list-none overflow-hidden">
              <Link href={`/gift/products/${p.slug}`} className="block">
                {p.media[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.media[0].url}
                    alt={p.media[0].altText ?? p.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="gift-media-fallback h-44 w-full" />
                )}
                <div className="p-gs-4">
                  <p className="font-medium leading-snug text-foreground">{p.title}</p>
                  <p className="mt-gs-2 text-sm font-semibold text-primary">
                    {formatInr(p.fromPricePaise)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
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

function BrandStripBlock({ props, home }: { props: Record<string, unknown>; home?: boolean }) {
  const brands = Array.isArray(props.brands) ? props.brands.map(String) : [];
  if (!brands.length && !home) return null;

  const body = (
    <>
      <h2 className="gift-overline">{String(props.title ?? 'Trusted brands we stock')}</h2>
      {brands.length ? (
        <ul className="mt-gs-4 flex flex-wrap gap-gs-2">
          {brands.map((b) => (
            <li key={b} className="clay-chip">
              {b}
            </li>
          ))}
        </ul>
      ) : null}
      {home ? <UspRow /> : null}
    </>
  );

  if (home) {
    return (
      <GiftBand tone="soft" toys>
        {body}
      </GiftBand>
    );
  }
  if (!brands.length) return null;
  return <section>{body}</section>;
}

function RecipientSplitBlock({
  props,
  home,
}: {
  props: Record<string, unknown>;
  home?: boolean;
}) {
  const left = (props.left ?? {}) as Record<string, unknown>;
  const right = (props.right ?? {}) as Record<string, unknown>;
  const cards = [
    { key: 'left', card: left },
    { key: 'right', card: right },
  ] as const;

  const body = (
    <>
      {props.title ? <h2 className="gift-h2">{String(props.title)}</h2> : null}
      {props.subtitle ? (
        <p className="mt-gs-2 text-sm opacity-70">{String(props.subtitle)}</p>
      ) : null}
      <div className="mt-gs-6 grid gap-gs-6 sm:grid-cols-2">
        {cards.map(({ key, card }) => {
          const sky = card.accent === 'sky';
          const accent = sky ? 'sky' : 'pink';
          const pillClass = sky ? 'gift-pill-overlap--sky' : '';
          const waveClass = sky ? 'gift-wave-card--sky' : '';
          const mediaClass = sky ? 'gift-panel-sky' : 'gift-media-fallback';

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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={String(card.imageUrl)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-80"
                      />
                    ) : null}
                    <div className="relative flex min-h-[11rem] flex-col justify-end p-gs-5 pb-gs-8">
                      <p className="text-sm opacity-70">{String(card.eyebrow ?? 'For the little')}</p>
                      <p
                        className={`font-display mt-gs-1 text-4xl ${sky ? 'text-info' : 'text-primary'}`}
                      >
                        {String(card.label ?? '')}
                      </p>
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
              <p
                className={`font-display mt-gs-1 text-4xl ${sky ? 'text-info' : 'text-primary'}`}
              >
                {String(card.label ?? '')}
              </p>
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

function ArticleTeasersBlock({
  props,
  home,
}: {
  props: Record<string, unknown>;
  home?: boolean;
}) {
  const articles = Array.isArray(props.articles)
    ? (props.articles as Array<{ slug: string; title: string }>)
    : [];
  if (!articles.length) return null;

  const body = (
    <>
      <div className="mb-gs-6 flex items-end justify-between gap-gs-4">
        <div>
          {props.overline ? (
            <p className="gift-overline">{String(props.overline)}</p>
          ) : null}
          <h2 className="gift-h2">{String(props.title ?? 'From the parenting journal')}</h2>
        </div>
        <Link href="/articles" className="text-sm font-medium hover:underline">
          All articles →
        </Link>
      </div>
      <ul className="grid gap-gs-3 sm:grid-cols-3">
        {articles.map((a) => (
          <li key={a.slug} className="clay-card p-gs-4">
            <Link href={`/articles/${a.slug}`} className="font-medium hover:underline">
              {a.title}
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

function renderRestBlock(
  b: CmsPageBlock,
  layout: 'page' | 'home',
  productBandIndex: { current: number },
) {
  const home = layout === 'home';
  if (b.type === 'cta') return <CtaBlock key={b.id} props={b.props} home={home} />;
  if (b.type === 'image') return <ImageBlock key={b.id} props={b.props} />;
  if (b.type === 'spacer') return <SpacerBlock key={b.id} props={b.props} />;
  if (b.type === 'productGrid') {
    const tones = ['mint', 'sky'] as const;
    const bandTone = home ? tones[productBandIndex.current++ % 2] : undefined;
    return (
      <ProductGridBlock
        key={b.id}
        props={b.props}
        layout={layout}
        bandTone={bandTone}
      />
    );
  }
  if (b.type === 'brandStrip') {
    return <BrandStripBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'recipientSplit') {
    return <RecipientSplitBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'articleTeasers') {
    return <ArticleTeasersBlock key={b.id} props={b.props} home={home} />;
  }
  if (b.type === 'richText') {
    return <RichTextBlock key={b.id} html={String(b.props.html ?? '')} />;
  }
  return null;
}

export function MarketingPageBlocks({ blocks, previewBanner, layout = 'page' }: Props) {
  if (layout === 'home') {
    const hero = blocks.filter((b) => b.type === 'hero');
    const rest = blocks.filter((b) => b.type !== 'hero');
    const productBandIndex = { current: 0 };
    return (
      <div>
        {previewBanner ? (
          <div className="gift-banner gift-banner--warning sticky top-0 z-10 text-center text-xs font-medium">
            {previewBanner}
          </div>
        ) : null}
        {hero.map((b) => (
          <HeroBlock key={b.id} props={b.props} layout="home" />
        ))}
        <div className="space-y-0">
          {rest.map((b) => renderRestBlock(b, 'home', productBandIndex))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-gs-4">
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
