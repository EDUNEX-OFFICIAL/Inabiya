const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseBuyNowVariantId(raw: string | null | undefined): string | undefined {
  const v = raw?.trim();
  if (!v || !UUID_RE.test(v)) return undefined;
  return v;
}

export function buyNowCheckoutPath(variantId: string, itemId?: string): string {
  const params = new URLSearchParams({ buyNow: variantId });
  if (itemId) params.set('buyNowItem', itemId);
  return `/checkout?${params.toString()}`;
}

export function buyNowCartItems<T extends { variantId: string; id?: string }>(
  items: T[],
  buyNowVariantId: string | undefined,
  buyNowItemId?: string,
): T[] {
  if (buyNowItemId) return items.filter((i) => i.id === buyNowItemId);
  if (!buyNowVariantId) return items;
  return items.filter((i) => i.variantId === buyNowVariantId);
}
