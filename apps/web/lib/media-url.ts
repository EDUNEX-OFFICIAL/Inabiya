const MEDIA_CONTENT =
  /\/api\/v1\/media\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\/content/i;

export type MediaVariant = 'web' | 'thumb' | 'original';

export function parseMediaAssetId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(MEDIA_CONTENT);
  return m?.[1] ?? null;
}

export function isMediaLibraryUrl(url: string): boolean {
  return parseMediaAssetId(url) != null;
}

export function mediaVariantUrl(url: string, variant: MediaVariant): string {
  const id = parseMediaAssetId(url);
  if (!id) return url;
  const base = `/api/v1/media/${id}/content`;
  if (variant === 'web') return `${base}?v=web`;
  if (variant === 'thumb') return `${base}?v=thumb`;
  return `${base}?v=original`;
}

/** Thumb when `sizes` is only small pixel widths (strips, line items). */
export function variantFromSizes(sizes: string | undefined): MediaVariant {
  if (!sizes) return 'web';
  const px = [...sizes.matchAll(/(\d+)px/g)].map((m) => Number(m[1]));
  if (px.length > 0 && Math.max(...px) <= 256) return 'thumb';
  return 'web';
}
