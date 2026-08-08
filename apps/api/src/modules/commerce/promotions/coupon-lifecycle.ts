/** Pure coupon lifecycle + eligible-subtotal helpers for promotions desk. */
export type CouponLifecycle = 'off' | 'scheduled' | 'active' | 'expired' | 'exhausted';

export type CouponScopeKind = 'CART' | 'PRODUCT' | 'COLLECTION';

export type CouponCartLine = {
  productId: string;
  /** MANUAL collection membership IDs only (v1). */
  collectionIds: string[];
  lineTotalPaise: number;
};

export function couponLifecycle(
  c: {
    active: boolean;
    startsAt: Date | string | null;
    expiresAt: Date | string | null;
    maxUses: number | null;
    usedCount: number;
  },
  now: Date = new Date(),
): CouponLifecycle {
  if (!c.active) return 'off';
  if (c.maxUses != null && c.usedCount >= c.maxUses) return 'exhausted';
  const starts = c.startsAt ? new Date(c.startsAt) : null;
  const ends = c.expiresAt ? new Date(c.expiresAt) : null;
  if (starts && starts > now) return 'scheduled';
  if (ends && ends < now) return 'expired';
  return 'active';
}

export function computeDiscountPaise(input: {
  subtotalPaise: number;
  discountPaise?: number | null;
  discountPercent?: number | null;
}): number {
  let discount = 0;
  if (input.discountPaise != null) discount = input.discountPaise;
  else if (input.discountPercent != null) {
    discount = Math.floor((input.subtotalPaise * input.discountPercent) / 100);
  }
  return Math.min(Math.max(0, discount), input.subtotalPaise);
}

/** Eligible line total for PRODUCT / COLLECTION scopes; CART returns cartSubtotal.
 * When `lines` is omitted (null/undefined), scoped coupons treat cartSubtotal as eligible
 * (admin preview without a cart). An explicit empty `lines` array yields 0. */
export function eligibleSubtotalPaise(input: {
  scope: CouponScopeKind;
  productIds: string[];
  collectionIds: string[];
  cartSubtotalPaise: number;
  lines?: CouponCartLine[] | null;
}): number {
  if (input.scope === 'CART') return input.cartSubtotalPaise;
  if (input.lines == null) return input.cartSubtotalPaise;
  const lines = input.lines;
  if (input.scope === 'PRODUCT') {
    const set = new Set(input.productIds);
    return lines
      .filter((l) => set.has(l.productId))
      .reduce((s, l) => s + l.lineTotalPaise, 0);
  }
  const cols = new Set(input.collectionIds);
  return lines
    .filter((l) => l.collectionIds.some((id) => cols.has(id)))
    .reduce((s, l) => s + l.lineTotalPaise, 0);
}
