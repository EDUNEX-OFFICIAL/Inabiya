import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BRAND_LOCKUP_HEIGHT,
  BRAND_LOCKUP_WIDTH,
  BRAND_MARK_HEIGHT,
  BRAND_MARK_WIDTH,
  BRAND_NAME,
  brandMarkSrc,
  brandWordmarkSrc,
  type BrandMarkVariant,
  type BrandWordmarkVariant,
} from '@/lib/brand-assets';

type Size = 'sm' | 'md' | 'lg';

/** Display height only — artwork is never cropped (object-contain). */
const WORDMARK_HEIGHT: Record<Size, number> = { sm: 32, md: 40, lg: 56 };
const MARK_HEIGHT: Record<Size, number> = { sm: 32, md: 40, lg: 52 };

type Common = {
  href?: string | null;
  className?: string;
  priority?: boolean;
  /** Accessible name; defaults to brand name */
  label?: string;
  size?: Size;
};

type WordmarkProps = Common & {
  kind?: 'wordmark';
  variant?: BrandWordmarkVariant;
};

type MarkProps = Common & {
  kind: 'mark';
  variant?: BrandMarkVariant;
};

/** Letter-b on small screens; full lockup from `lg`. */
type ChromeProps = Common & {
  kind: 'chrome';
  variant?: BrandWordmarkVariant;
};

export type BrandLogoProps = WordmarkProps | MarkProps | ChromeProps;

function isSvg(src: string): boolean {
  return src.endsWith('.svg');
}

function BrandArt({
  src,
  alt,
  width,
  height,
  displayHeight,
  priority,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  displayHeight: number;
  priority?: boolean;
  className: string;
}) {
  const displayWidth = Math.round((displayHeight * width) / height);
  const imgClass = `h-full w-auto max-w-full object-contain object-left ${className}`;
  if (isSvg(src)) {
    return (
      // SVG lockup — Next/Image does not optimize SVG; keep full viewBox.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={imgClass}
        decoding="async"
        fetchPriority={priority ? 'high' : 'low'}
      />
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={imgClass}
      priority={priority}
      sizes={`${displayWidth}px`}
      style={{ height: displayHeight, width: 'auto' }}
    />
  );
}

function LogoBox({
  kind,
  size,
  className,
  children,
}: {
  kind: 'mark' | 'wordmark';
  size: Size;
  className: string;
  children: ReactNode;
}) {
  const displayHeight = kind === 'mark' ? MARK_HEIGHT[size] : WORDMARK_HEIGHT[size];
  const boxClass =
    kind === 'mark'
      ? `inline-flex shrink-0 items-center justify-center ${className}`
      : `inline-flex shrink-0 items-center ${className}`;
  return (
    <span className={boxClass} style={{ height: displayHeight }}>
      {children}
    </span>
  );
}

/**
 * Inabiya brand mark / full lockup. Artwork is scaled, never cropped.
 */
export function BrandLogo(props: BrandLogoProps) {
  const kind = props.kind ?? 'wordmark';
  const size = props.size ?? 'md';
  const label = props.label ?? BRAND_NAME;
  const className = props.className ?? '';
  const alt = props.href === null ? label : '';
  const variant = props.variant ?? 'color';

  const mark = (
    <LogoBox kind="mark" size={size} className={kind === 'chrome' ? '' : className}>
      <BrandArt
        src={brandMarkSrc(variant)}
        alt={alt}
        width={BRAND_MARK_WIDTH}
        height={BRAND_MARK_HEIGHT}
        displayHeight={MARK_HEIGHT[size]}
        priority={props.priority}
        className=""
      />
    </LogoBox>
  );

  const wordmark = (
    <LogoBox kind="wordmark" size={size} className={kind === 'chrome' ? '' : className}>
      <BrandArt
        src={brandWordmarkSrc(variant)}
        alt={alt}
        width={BRAND_LOCKUP_WIDTH}
        height={BRAND_LOCKUP_HEIGHT}
        displayHeight={WORDMARK_HEIGHT[size]}
        priority={props.priority}
        className=""
      />
    </LogoBox>
  );

  const inner =
    kind === 'mark' ? (
      mark
    ) : kind === 'chrome' ? (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        <span className="lg:hidden">{mark}</span>
        <span className="hidden lg:inline-flex">{wordmark}</span>
      </span>
    ) : (
      wordmark
    );

  if (props.href === null) return inner;
  const href = props.href ?? '/';
  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label={label}>
      {inner}
    </Link>
  );
}
