import { isMediaLibraryUrl, mediaVariantUrl } from '@/lib/media-url';
import { preferPublicHeroSrc } from '@/lib/public-hero';

/** Preload LCP image. Library variants or same-origin static (WebP skips optimizer). */
export function homepageLcpHref(
  blocks: Array<{ type: string; props: Record<string, unknown> }>,
): string | null {
  const hero = blocks.find((b) => b.type === 'hero');
  if (!hero) return null;
  const raw = typeof hero.props.imageUrl === 'string' ? hero.props.imageUrl.trim() : '';
  const src = preferPublicHeroSrc(raw || '/gift/media/baby-soft-gift.webp');
  if (isMediaLibraryUrl(src)) return mediaVariantUrl(src, 'web');
  if (src.startsWith('/') && !src.includes('unsplash')) return src;
  return null;
}
