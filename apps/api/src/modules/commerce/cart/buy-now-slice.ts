/** Buy Now checks out one cart line; legacy variant selection remains for older URLs. */

export function selectBuyNowItems<T extends { variantId: string; id?: string }>(
  items: T[],
  buyNowVariantId: string | undefined,
  buyNowItemId?: string,
): T[] {
  if (buyNowItemId) return items.filter((i) => i.id === buyNowItemId);
  if (!buyNowVariantId) return items;
  return items.filter((i) => i.variantId === buyNowVariantId);
}

export function convertCartAfterBuyNow(remainingItemCount: number): boolean {
  return remainingItemCount === 0;
}
