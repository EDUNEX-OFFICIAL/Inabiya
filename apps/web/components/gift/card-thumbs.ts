export const CARD_THUMB_FULL_MAX = 4;
export const CARD_THUMB_OVERFLOW_VISIBLE = 3;

export type CardThumbItem = {
  id: string;
  imageUrl: string | null;
  alt?: string;
};

export type ProductCardImage = {
  id: string;
  url: string;
  altText: string | null;
};

/** Still images only — videos stay off the card strip. */
export function productCardImages(
  media: Array<{
    url?: string | null;
    altText?: string | null;
    kind?: string | null;
    id?: string | null;
  }>,
): ProductCardImage[] {
  const out: ProductCardImage[] = [];
  for (let i = 0; i < media.length; i += 1) {
    const m = media[i]!;
    if (!m.url || m.kind === 'VIDEO') continue;
    out.push({
      id: m.id || `img-${i}`,
      url: m.url,
      altText: m.altText ?? null,
    });
  }
  return out;
}

/**
 * Up to 4 thumbs; more than 4 → 3 visible + leftover count for “+N”.
 * Gallery strips pass `hideIfSingle` so one photo doesn’t duplicate the hero.
 */
export function splitCardThumbs<T>(
  items: T[],
  opts?: { hideIfSingle?: boolean },
): { visible: T[]; more: number } {
  if (items.length === 0) return { visible: [], more: 0 };
  if (opts?.hideIfSingle && items.length <= 1) return { visible: [], more: 0 };
  if (items.length <= CARD_THUMB_FULL_MAX) return { visible: items, more: 0 };
  return {
    visible: items.slice(0, CARD_THUMB_OVERFLOW_VISIBLE),
    more: items.length - CARD_THUMB_OVERFLOW_VISIBLE,
  };
}
