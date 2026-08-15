import Link from 'next/link';
import { HeroMedia } from '@/components/cms/hero-media';
import {
  parseCustomSectionLayout,
  type CustomSectionLayout,
} from '@/components/cms/custom-section-layout';
import {
  flexJustifyClass,
  headlineTypeClass,
  inkTextClass,
  overlayWashClass,
  padClass,
  parseSectionStyle,
  textAlignClass,
} from '@/components/cms/section-style';
import { sanitizeArticleHtml } from '@/lib/article-html';
import { safeHrefOrHash } from '@inabiya/validation';

function str(props: Record<string, unknown>, key: string): string {
  const v = props[key];
  return typeof v === 'string' ? v.trim() : '';
}

function href(raw: string, fallback = '/gift'): string {
  return safeHrefOrHash(raw.trim() || fallback);
}

const BG_BAND: Record<string, string> = {
  blush: 'gift-band gift-band--blush',
  mint: 'gift-band gift-band--mint',
  sky: 'gift-band gift-band--sky',
  lavender: 'gift-band gift-band--lavender',
  soft: 'gift-band gift-band--soft',
  surface: 'bg-[var(--surface)]',
};

function heightClass(minHeight: string): string {
  if (minHeight === 'sm') return 'min-h-40';
  if (minHeight === 'md') return 'min-h-64';
  if (minHeight === 'lg') return 'min-h-[min(70vh,32rem)]';
  return '';
}

function radiusClass(radius: string): string {
  if (radius === 'control') return 'overflow-hidden rounded-control';
  if (radius === 'clay') return 'overflow-hidden rounded-clay';
  return '';
}

function widthClass(width: string): string {
  if (width === 'full') return 'w-full';
  if (width === 'narrow') return 'mx-auto max-w-3xl px-gs-6';
  return 'mx-auto max-w-7xl px-gs-6';
}

function Html({ html }: { html: string }) {
  if (!html) return null;
  const safe = sanitizeArticleHtml(html);
  if (!safe || safe === '<p></p>') return null;
  return (
    <div
      className="prose prose-sm mt-gs-3 max-w-prose prose-headings:font-display prose-a:text-primary"
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}

function Copy({
  overline,
  title,
  body,
  ctaLabel,
  ctaHref,
  ctaLabel2,
  ctaHref2,
  align,
  headlineSize,
  ink,
}: {
  overline?: string;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabel2?: string;
  ctaHref2?: string;
  align?: 'start' | 'center' | 'end';
  headlineSize?: 'h2' | 'h1' | 'display';
  ink?: 'default' | 'muted' | 'blush';
}) {
  if (!overline && !title && !body && !ctaLabel) return null;
  return (
    <div className={textAlignClass(align)}>
      {overline ? <p className="gift-overline">{overline}</p> : null}
      {title ? (
        <h2
          className={`${headlineTypeClass(headlineSize, 'h2')} ${inkTextClass(ink)} text-balance`}
        >
          {title}
        </h2>
      ) : null}
      {body ? <Html html={body} /> : null}
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

function Frame({ src, alt }: { src: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-control shadow-clay">
      <HeroMedia src={src} alt={alt} sizes="(max-width: 768px) 100vw, 50vw" />
    </div>
  );
}

function Col({
  title,
  body,
  imageUrl,
  ctaLabel,
  ctaHref,
  headlineSize,
  ink,
  align,
}: {
  title?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  headlineSize?: 'h2' | 'h1' | 'display';
  ink?: 'default' | 'muted' | 'blush';
  align?: 'start' | 'center' | 'end';
}) {
  if (!title && !body && !imageUrl && !ctaLabel) return null;
  return (
    <div className="flex flex-col gap-gs-3">
      {imageUrl ? <Frame src={imageUrl} alt={title || ''} /> : null}
      <Copy
        title={title}
        body={body}
        ctaLabel={ctaLabel}
        ctaHref={ctaHref}
        headlineSize={headlineSize}
        ink={ink}
        align={align}
      />
    </div>
  );
}

export function CustomSectionBlock({ props }: { props: Record<string, unknown> }) {
  const layout: CustomSectionLayout = parseCustomSectionLayout(str(props, 'layout')) ?? 'stack';
  const style = parseSectionStyle(props);
  const bg = str(props, 'bg');
  const bgImageUrl = str(props, 'bgImageUrl');
  const width = str(props, 'width') || 'page';
  const minHeight = str(props, 'minHeight');
  const radius = str(props, 'radius');
  const overline = str(props, 'overline');
  const title = str(props, 'title');
  const body = str(props, 'body');
  const title2 = str(props, 'title2');
  const body2 = str(props, 'body2');
  const title3 = str(props, 'title3');
  const body3 = str(props, 'body3');
  const imageUrl = str(props, 'imageUrl');
  const imageUrl2 = str(props, 'imageUrl2');
  const imageUrl3 = str(props, 'imageUrl3');
  const ctaLabel = str(props, 'ctaLabel');
  const ctaHref = str(props, 'ctaHref');
  const ctaLabel2 = str(props, 'ctaLabel2');
  const ctaHref2 = str(props, 'ctaHref2');

  const copyProps = {
    overline,
    title,
    body,
    ctaLabel,
    ctaHref,
    ctaLabel2,
    ctaHref2,
    align: style.align,
    headlineSize: style.headlineSize,
    ink: style.ink,
  };

  const inner =
    layout === 'split' || layout === 'splitReverse' ? (
      <div className="grid items-center gap-gs-6 md:grid-cols-2">
        <div className={layout === 'splitReverse' ? 'md:order-2' : ''}>
          <Copy {...copyProps} />
        </div>
        <Frame src={imageUrl} alt={title || ''} />
      </div>
    ) : layout === 'two' ? (
      <div className="grid gap-gs-6 md:grid-cols-2">
        <Col
          title={title}
          body={body}
          imageUrl={imageUrl}
          ctaLabel={ctaLabel}
          ctaHref={ctaHref}
          headlineSize={style.headlineSize}
          ink={style.ink}
          align={style.align}
        />
        <Col
          title={title2}
          body={body2}
          imageUrl={imageUrl2}
          ctaLabel={ctaLabel2}
          ctaHref={ctaHref2}
          headlineSize={style.headlineSize}
          ink={style.ink}
          align={style.align}
        />
      </div>
    ) : layout === 'three' ? (
      <div className="grid gap-gs-5 md:grid-cols-3">
        <Col
          title={title}
          body={body}
          imageUrl={imageUrl}
          headlineSize={style.headlineSize}
          ink={style.ink}
          align={style.align}
        />
        <Col
          title={title2}
          body={body2}
          imageUrl={imageUrl2}
          headlineSize={style.headlineSize}
          ink={style.ink}
          align={style.align}
        />
        <Col
          title={title3}
          body={body3}
          imageUrl={imageUrl3}
          headlineSize={style.headlineSize}
          ink={style.ink}
          align={style.align}
        />
      </div>
    ) : (
      <div className="flex flex-col gap-gs-4">
        <Copy {...copyProps} />
        {imageUrl && layout === 'stack' ? <Frame src={imageUrl} alt={title || ''} /> : null}
      </div>
    );

  if (layout === 'bleed') {
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
      <section
        className={`relative overflow-hidden ${heightClass(minHeight || 'md')} ${radiusClass(radius)}`}
      >
        {imageUrl || bgImageUrl ? (
          <HeroMedia
            src={imageUrl || bgImageUrl}
            alt={title || ''}
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--surface)]" aria-hidden />
        )}
        <div className={`absolute inset-0 ${overlayWashClass(style.overlay)}`} aria-hidden />
        <div
          className={`relative z-10 mx-auto flex ${heightClass(minHeight || 'md')} max-w-3xl ${vAlign} ${hAlign} px-gs-6 py-gs-8`}
        >
          <Copy {...copyProps} align={style.align ?? 'center'} />
        </div>
      </section>
    );
  }

  const band = BG_BAND[bg] ?? '';
  const shell = [
    band || 'gift-section',
    widthClass(width),
    padClass(style.pad) || 'py-gs-6',
    heightClass(minHeight),
    radiusClass(radius),
    'relative overflow-hidden',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={shell}>
      {bgImageUrl ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <HeroMedia src={bgImageUrl} alt="" sizes="100vw" />
          <div className={`absolute inset-0 ${overlayWashClass(style.overlay ?? 'soft')}`} />
        </div>
      ) : null}
      <div className="relative z-10">{inner}</div>
    </section>
  );
}
