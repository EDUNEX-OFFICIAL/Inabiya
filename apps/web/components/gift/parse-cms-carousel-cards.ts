export type CarouselCategory = string;

export type CarouselHoverMedia =
  { type: 'image'; src: string } | { type: 'video'; src: string; poster?: string };

export type CarouselCardData = {
  id: string;
  category: CarouselCategory;
  kicker: string;
  title: string;
  description: string;
  image?: string;
  hoverMedia?: CarouselHoverMedia;
  gradient: string;
  accent: string;
  href: string;
};

const VIDEO_EXT = /\.(mp4|webm|ogg)(\?|$)/i;

export function parseCmsCarouselCards(raw: unknown): CarouselCardData[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Record<string, unknown> => !!row && typeof row === 'object')
    .map((row, i) => {
      const imageUrl = String(row.imageUrl ?? row.image ?? '').trim();
      const hoverVideoUrl = String(row.hoverVideoUrl ?? '').trim();
      const hoverImageUrl = String(row.hoverImageUrl ?? '').trim();
      const hoverSrc = hoverVideoUrl || hoverImageUrl;
      const hoverIsVideo = Boolean(hoverVideoUrl) || VIDEO_EXT.test(hoverImageUrl);
      const gradient = String(row.gradient ?? '').trim();
      const accent = String(row.accent ?? '').trim();
      return {
        id: String(row.id ?? '').trim() || `card-${i + 1}`,
        category: String(row.category ?? '').trim() || 'Explore',
        kicker: String(row.kicker ?? '').trim(),
        title: String(row.title ?? '').trim(),
        description: String(row.description ?? '').trim(),
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(hoverSrc
          ? {
              hoverMedia: hoverIsVideo
                ? {
                    type: 'video' as const,
                    src: hoverSrc,
                    ...(imageUrl ? { poster: imageUrl } : {}),
                  }
                : { type: 'image' as const, src: hoverSrc },
            }
          : {}),
        gradient: /^linear-gradient\(/i.test(gradient)
          ? gradient
          : 'linear-gradient(150deg,#FF6B9D 0%,#FFB5D0 55%,#FFE0EC 100%)',
        accent: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(accent) ? accent : '#7C1D3C',
        href: String(row.href ?? '/').trim() || '/',
      };
    })
    .filter((row) => row.kicker && row.title && row.href)
    .slice(0, 8);
}
