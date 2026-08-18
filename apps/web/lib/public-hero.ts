/** Public hero JPEG that we ship as a static WebP (skip next/image on LCP). */
export function preferPublicHeroSrc(src: string): string {
  return src.replace(/\/gift\/media\/baby-soft-gift\.jpg$/i, '/gift/media/baby-soft-gift.webp');
}
