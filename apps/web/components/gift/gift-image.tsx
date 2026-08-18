'use client';

import Image, { type ImageProps } from 'next/image';
import { isMediaLibraryUrl, mediaVariantUrl, variantFromSizes } from '@/lib/media-url';

type Props = Omit<ImageProps, 'src'> & {
  src: string;
  blurDataUrl?: string | null;
  /** Adjacent carousel slides — fetch now, but not LCP. */
  eager?: boolean;
};

function skipOptimizer(src: string): boolean {
  if (isMediaLibraryUrl(src)) return true;
  const path = src.split('?')[0] ?? src;
  return path.startsWith('/') && /\.(webp|avif)$/i.test(path);
}

/**
 * Storefront image: library URLs use web/thumb variants (already compressed).
 * `priority` is the LCP preload (one per page). Everything else is lazy unless `eager`.
 */
export function GiftImage({ src, sizes, blurDataUrl, priority, eager, alt, ...rest }: Props) {
  const sizesStr = typeof sizes === 'string' ? sizes : undefined;
  const resolved = isMediaLibraryUrl(src)
    ? mediaVariantUrl(src, variantFromSizes(sizesStr))
    : src;
  const blur = blurDataUrl?.startsWith('data:') ? blurDataUrl : undefined;

  return (
    <Image
      alt={alt}
      {...rest}
      src={resolved}
      sizes={sizes}
      unoptimized={skipOptimizer(src)}
      {...(priority
        ? { priority: true, fetchPriority: 'high' as const }
        : {
            loading: eager ? ('eager' as const) : ('lazy' as const),
            fetchPriority: 'auto' as const,
          })}
      {...(blur ? { placeholder: 'blur' as const, blurDataURL: blur } : {})}
    />
  );
}
