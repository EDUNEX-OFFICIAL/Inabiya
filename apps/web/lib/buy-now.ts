const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseBuyNowVariantId(raw: string | null | undefined): string | undefined {
  const v = raw?.trim();
  if (!v || !UUID_RE.test(v)) return undefined;
  return v;
}

export function buyNowCheckoutPath(variantId: string): string {
  return `/checkout?buyNow=${encodeURIComponent(variantId)}`;
}

export function buyNowCartItems<T extends { variantId: string }>(
  items: T[],
  buyNowVariantId: string | undefined,
): T[] {
  if (!buyNowVariantId) return items;
  return items.filter((i) => i.variantId === buyNowVariantId);
}
