/**
 * Web-ready Inabiya brand paths under `/brand/*`.
 * Masters live in repo `/public/brand-assets/` (design archive).
 *
 * Copies are unmodified (no crop / no trim). Scale in CSS with object-contain.
 */

export const BRAND_NAME = 'Inabiya';
export const BRAND_TAGLINE = 'Curated with love, for little ones';

/** Full lockup master (wordmark + tagline) — SVG viewBox 6000×2240. */
export const BRAND_LOCKUP_WIDTH = 6000;
export const BRAND_LOCKUP_HEIGHT = 2240;
/** Letter-b mark master — Untitled-1 / white-B / black-B, 1347×1953. */
export const BRAND_MARK_WIDTH = 1347;
export const BRAND_MARK_HEIGHT = 1953;

export const brandAssets = {
  /** Full plum lockup SVG (LOGO.svg as-is) — light nav */
  logoSvg: '/brand/logo.svg',
  /** Full plum lockup PNG (LOGO.png as-is) */
  wordmarkColor: '/brand/wordmark-color.png',
  /** Full black lockup on light */
  wordmarkOnLight: '/brand/wordmark-on-light.png',
  /** Full white lockup on dark (footer) */
  wordmarkOnDark: '/brand/wordmark-on-dark.png',
  /** Same full lockup files (uncropped masters) */
  lockupColor: '/brand/lockup-color.png',
  lockupOnLight: '/brand/lockup-on-light.png',
  lockupOnDark: '/brand/lockup-on-dark.png',
  /** Letter-b mark (Untitled-1.png as-is) */
  markColor: '/brand/mark-color.png',
  markOnLight: '/brand/mark-on-light.png',
  markOnDark: '/brand/mark-on-dark.png',
  /** White letter-b mark on plum — tab / PWA / apple */
  icon192: '/brand/icon-192.png',
  icon512: '/brand/icon-512.png',
  appleTouchIcon: '/brand/apple-touch-icon.png',
  favicon: '/brand/favicon.ico',
  faviconSvg: '/brand/favicon.svg',
  lockupSquare600: '/brand/lockup-square-600.png',
  lockupSquare1080: '/brand/lockup-square-1080.png',
} as const;

export type BrandWordmarkVariant = 'color' | 'onLight' | 'onDark';
export type BrandMarkVariant = 'color' | 'onLight' | 'onDark';

export function brandWordmarkSrc(variant: BrandWordmarkVariant = 'color'): string {
  switch (variant) {
    case 'onLight':
      return brandAssets.wordmarkOnLight;
    case 'onDark':
      return brandAssets.wordmarkOnDark;
    default:
      return brandAssets.logoSvg;
  }
}

export function brandMarkSrc(variant: BrandMarkVariant = 'color'): string {
  switch (variant) {
    case 'onLight':
      return brandAssets.markOnLight;
    case 'onDark':
      return brandAssets.markOnDark;
    default:
      return brandAssets.markColor;
  }
}

/** Absolute logo URL for JSON-LD / Open Graph (requires public site origin). */
export function brandLogoAbsoluteUrl(siteOrigin: string): string {
  const base = siteOrigin.replace(/\/$/, '');
  return `${base}${brandAssets.lockupSquare1080}`;
}
