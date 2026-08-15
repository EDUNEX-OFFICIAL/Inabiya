import Link from 'next/link';
import { GiftStorefrontHero } from '@/components/cms/gift-storefront-hero';
import { HeroMedia } from '@/components/cms/hero-media';
import { safeHrefOrHash } from '@inabiya/validation';
import type { HeroLayout } from '@/components/cms/hero-layout';
import { parseHeroLayout } from '@/components/cms/hero-layout';
import {
  flexJustifyClass,
  headlineTypeClass,
  inkTextClass,
  overlayWashClass,
  padClass,
  parseSectionStyle,
  textAlignClass,
  type SectionAlign,
  type SectionHeadline,
  type SectionInk,
} from '@/components/cms/section-style';

const DEFAULT_HERO_IMAGE = '/gift/media/baby-soft-gift.jpg';

function href(raw: unknown, fallback = '/gift'): string {
  const s = typeof raw === 'string' && raw.trim() ? raw.trim() : fallback;
  return safeHrefOrHash(s);
}

function str(props: Record<string, unknown>, key: string): string {
  const v = props[key];
  return typeof v === 'string' ? v : '';
}

export function resolvePublicHeroLayout(
  props: Record<string, unknown>,
  pageLayout: 'page' | 'home',
): HeroLayout | 'legacyPanel' {
  const parsed = parseHeroLayout(typeof props.layout === 'string' ? props.layout : undefined);
  if (parsed) return parsed;
  if (pageLayout === 'home' || props.variant === 'storefront' || !props.variant) {
    return 'splitCopyMedia';
  }
  return 'legacyPanel';
}

function CopyStack({
  eyebrow,
  headline,
  subcopy,
  ctaLabel,
  ctaHref,
  ctaLabel2,
  ctaHref2,
  align,
  headlineSize,
  ink,
}: {
  eyebrow?: string;
  headline: string;
  subcopy?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabel2?: string;
  ctaHref2?: string;
  align?: SectionAlign;
  headlineSize?: SectionHeadline;
  ink?: SectionInk;
}) {
  return (
    <div className={textAlignClass(align)}>
      {eyebrow ? <p className="gift-overline">{eyebrow}</p> : null}
      {headline ? (
        <h1
          className={`${headlineTypeClass(headlineSize)} ${inkTextClass(ink)} mt-gs-2 text-balance`}
        >
          {headline}
        </h1>
      ) : null}
      {subcopy ? (
        <p
          className={`gift-body mt-gs-3 max-w-prose ${ink === 'blush' ? inkTextClass(ink) : 'gift-muted'} ${align === 'end' ? 'ml-auto' : align === 'center' ? 'mx-auto' : ''}`}
        >
          {subcopy}
        </p>
      ) : null}
      {ctaLabel && ctaHref ? (
        <div className={`mt-gs-5 flex flex-wrap gap-gs-3 ${flexJustifyClass(align)}`}>
          <Link href={href(ctaHref)} className="clay-btn">
            {ctaLabel}
          </Link>
          {ctaLabel2 && ctaHref2 ? (
            <Link href={href(ctaHref2)} className="clay-btn-secondary">
              {ctaLabel2}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function FramePhoto({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-control shadow-clay sm:aspect-[4/3]">
      <HeroMedia src={src} alt={alt} sizes="(max-width: 768px) 100vw, 50vw" />
    </div>
  );
}

export function CmsHeroByLayout({
  props,
  pageLayout,
}: {
  props: Record<string, unknown>;
  pageLayout: 'page' | 'home';
}) {
  const layout = resolvePublicHeroLayout(props, pageLayout);
  const headline = str(props, 'headline');
  const subcopy = str(props, 'subcopy') || undefined;
  const eyebrow = str(props, 'eyebrow') || undefined;
  const ctaLabel = str(props, 'ctaLabel') || undefined;
  const ctaHref = str(props, 'ctaHref') || undefined;
  const ctaLabel2 = str(props, 'ctaLabel2') || undefined;
  const ctaHref2 = str(props, 'ctaHref2') || undefined;
  const imageUrl = str(props, 'imageUrl');
  const imageUrl2 = str(props, 'imageUrl2');
  const headline2 = str(props, 'headline2');
  const subcopy2 = str(props, 'subcopy2');
  const style = parseSectionStyle(props);
  const copyStyle = {
    align: style.align,
    headlineSize: style.headlineSize,
    ink: style.ink,
  };

  if (layout === 'splitCopyMedia' || layout === 'splitMediaCopy') {
    return (
      <GiftStorefrontHero
        headline={headline}
        subcopy={subcopy}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        ctaLabel2={ctaLabel2}
        ctaHref2={ctaHref2}
        trustLine={str(props, 'trustLine') || undefined}
        eyebrow={eyebrow}
        imageUrl={imageUrl || undefined}
        accentWord={str(props, 'accentWord') || undefined}
        mediaSide={layout === 'splitMediaCopy' ? 'left' : 'right'}
        style={style}
      />
    );
  }

  if (layout === 'full') {
    const photo = imageUrl.trim() || DEFAULT_HERO_IMAGE;
    const height =
      style.pad === 'sm'
        ? 'min-h-[min(52vh,28rem)]'
        : style.pad === 'lg'
          ? 'min-h-[min(86vh,44rem)]'
          : 'min-h-[min(70vh,36rem)]';
    const vAlign =
      style.valign === 'start'
        ? 'items-start'
        : style.valign === 'end'
          ? 'items-end'
          : 'items-center';
    const hAlign =
      style.align === 'start'
        ? 'justify-start'
        : style.align === 'end'
          ? 'justify-end'
          : 'justify-center';
    return (
      <section className={`relative overflow-hidden ${height}`}>
        <HeroMedia
          src={photo}
          alt={headline}
          fallback={DEFAULT_HERO_IMAGE}
          priority
          sizes="100vw"
        />
        <div className={`absolute inset-0 ${overlayWashClass(style.overlay)}`} aria-hidden />
        <div
          className={`relative z-10 mx-auto flex ${height} max-w-3xl ${vAlign} ${hAlign} px-gs-6 py-gs-8`}
        >
          <CopyStack
            eyebrow={eyebrow}
            headline={headline}
            subcopy={subcopy}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaLabel2={ctaLabel2}
            ctaHref2={ctaHref2}
            headlineSize={style.headlineSize}
            ink={style.ink}
            align={style.align ?? 'center'}
          />
        </div>
      </section>
    );
  }

  if (layout === 'fullText') {
    return (
      <section className={`gift-section ${padClass(style.pad)}`}>
        <div className="mx-auto max-w-3xl">
          <CopyStack
            eyebrow={eyebrow}
            headline={headline}
            subcopy={subcopy}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            ctaLabel2={ctaLabel2}
            ctaHref2={ctaHref2}
            {...copyStyle}
          />
        </div>
      </section>
    );
  }

  if (layout === 'splitMedia') {
    return (
      <section className={`gift-section ${padClass(style.pad)} ${textAlignClass(style.align)}`}>
        <div className="grid gap-gs-4 md:grid-cols-2 md:gap-gs-6">
          <div>
            <FramePhoto src={imageUrl.trim() || DEFAULT_HERO_IMAGE} alt={headline || 'Gift'} />
            {headline ? (
              <p
                className={`${headlineTypeClass(style.headlineSize, 'h2')} ${inkTextClass(style.ink)} mt-gs-3`}
              >
                {headline}
              </p>
            ) : null}
            {ctaLabel && ctaHref ? (
              <Link href={href(ctaHref)} className="clay-btn mt-gs-3 inline-flex">
                {ctaLabel}
              </Link>
            ) : null}
          </div>
          <div>
            <FramePhoto
              src={imageUrl2.trim() || DEFAULT_HERO_IMAGE}
              alt={headline2 || headline || 'Gift'}
            />
            {headline2 ? (
              <p
                className={`${headlineTypeClass(style.headlineSize, 'h2')} ${inkTextClass(style.ink)} mt-gs-3`}
              >
                {headline2}
              </p>
            ) : null}
            {ctaLabel2 && ctaHref2 ? (
              <Link href={href(ctaHref2)} className="clay-btn-secondary mt-gs-3 inline-flex">
                {ctaLabel2}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (layout === 'splitCopy') {
    return (
      <section className={`gift-section ${padClass(style.pad)}`}>
        <div className="grid gap-gs-6 md:grid-cols-2">
          <CopyStack
            headline={headline}
            subcopy={subcopy}
            ctaLabel={ctaLabel}
            ctaHref={ctaHref}
            {...copyStyle}
          />
          <CopyStack
            headline={headline2 || headline}
            subcopy={subcopy2}
            ctaLabel={ctaLabel2}
            ctaHref={ctaHref2}
            {...copyStyle}
          />
        </div>
      </section>
    );
  }

  return null;
}
