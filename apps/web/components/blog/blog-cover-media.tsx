import Image from 'next/image';

function isSvg(url: string): boolean {
  return /\.svg(\?|#|$)/i.test(url);
}

type Props = {
  src?: string | null;
  alt?: string;
  /** Extra class on the media frame (e.g. aspect / hero). */
  className?: string;
  /** next/image sizes hint for raster covers. */
  sizes?: string;
  priority?: boolean;
};

/**
 * Editorial cover — same `ogImageUrl` / `imageUrl` everywhere (card, hero, post).
 * SVGs use a forced cover technique; rasters use next/image fill.
 */
export function BlogCoverMedia({
  src,
  alt = '',
  className = '',
  sizes = '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw',
  priority = false,
}: Props) {
  const url = src?.trim() || '';
  if (!url) {
    return (
      <div className={`blog-cover ${className}`.trim()}>
        <div className="blog-media-fallback absolute inset-0" aria-hidden />
      </div>
    );
  }

  if (isSvg(url)) {
    return (
      <div className={`blog-cover blog-cover--svg ${className}`.trim()}>
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG covers need forced cover sizing */}
        <img src={url} alt={alt} className="blog-cover__svg" decoding="async" />
      </div>
    );
  }

  return (
    <div className={`blog-cover ${className}`.trim()}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="blog-cover__img"
      />
    </div>
  );
}
