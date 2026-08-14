/** Buy Now checks out one variant line; the rest of the cart stays. */

export function selectBuyNowItems<T extends { variantId: string }>(
  items: T[],
  buyNowVariantId: string | undefined,
): T[] {
  if (!buyNowVariantId) return items;
  return items.filter((i) => i.variantId === buyNowVariantId);
}

export function convertCartAfterBuyNow(remainingItemCount: number): boolean {
  return remainingItemCount === 0;
}
