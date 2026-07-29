/** Pure coupon lifecycle for OPS-6 promotions desk. */
export type CouponLifecycle = 'off' | 'scheduled' | 'active' | 'expired' | 'exhausted';

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
