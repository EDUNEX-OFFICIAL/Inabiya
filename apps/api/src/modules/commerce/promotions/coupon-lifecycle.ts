/** Pure coupon lifecycle + eligible-subtotal helpers for promotions desk. */
import type { CouponMatchRules } from '@inabiya/validation';
import {
  lineMatchesRules,
  type CouponCartLine,
} from './coupon-conditions';

export type { CouponCartLine } from './coupon-conditions';

export type CouponLifecycle = 'off' | 'scheduled' | 'active' | 'expired' | 'exhausted';

export type CouponScopeKind = 'CART' | 'PRODUCT' | 'COLLECTION' | 'MATCHING';

export type CouponLayer = 'cart' | 'line';

export function couponLayer(scope: CouponScopeKind): CouponLayer {
  return scope === 'CART' ? 'cart' : 'line';
}

export function formatCouponLabel(
  lineCode: string | null | undefined,
  cartCode: string | null | undefined,
): string | null {
  const parts = [lineCode, cartCode].filter((c): c is string => Boolean(c?.trim()));
  return parts.length ? parts.join(' + ') : null;
}

export function nestedDiscountPaise(
  subtotalPaise: number,
  lineDiscountPaise: number,
  cartDiscountPaise: number,
): number {
  const n = Math.max(0, lineDiscountPaise) + Math.max(0, cartDiscountPaise);
  return Math.min(n, Math.max(0, subtotalPaise));
}

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
  maxDiscountPaise?: number | null;
}): number {
  let discount = 0;
  if (input.discountPaise != null) discount = input.discountPaise;
  else if (input.discountPercent != null) {
    discount = Math.floor((input.subtotalPaise * input.discountPercent) / 100);
  }
  if (input.maxDiscountPaise != null) {
    discount = Math.min(discount, input.maxDiscountPaise);
  }
  return Math.min(Math.max(0, discount), input.subtotalPaise);
}

export function scopeMatchingLines(input: {
  scope: CouponScopeKind;
  productIds: string[];
  collectionIds: string[];
  matchRules?: CouponMatchRules | null;
  lines: CouponCartLine[];
}): CouponCartLine[] {
  if (input.scope === 'CART') return input.lines;
  if (input.scope === 'PRODUCT') {
    const set = new Set(input.productIds);
    return input.lines.filter((l) => set.has(l.productId));
  }
  if (input.scope === 'COLLECTION') {
    const cols = new Set(input.collectionIds);
    return input.lines.filter((l) => l.collectionIds.some((id) => cols.has(id)));
  }
  if (!input.matchRules) return [];
  return input.lines.filter((l) => lineMatchesRules(l, input.matchRules!));
}

/** Eligible line total for PRODUCT / COLLECTION / MATCHING; CART returns cartSubtotal.
 * When `lines` is omitted (null/undefined), scoped coupons treat cartSubtotal as eligible
 * except MATCHING (needs line attributes) which yields 0.
 * An explicit empty `lines` array yields 0. */
export function eligibleSubtotalPaise(input: {
  scope: CouponScopeKind;
  productIds: string[];
  collectionIds: string[];
  cartSubtotalPaise: number;
  lines?: CouponCartLine[] | null;
  matchRules?: CouponMatchRules | null;
}): number {
  if (input.scope === 'CART') return input.cartSubtotalPaise;
  if (input.lines == null) {
    return input.scope === 'MATCHING' ? 0 : input.cartSubtotalPaise;
  }
  return scopeMatchingLines({
    scope: input.scope,
    productIds: input.productIds,
    collectionIds: input.collectionIds,
    matchRules: input.matchRules,
    lines: input.lines,
  }).reduce((s, l) => s + l.lineTotalPaise, 0);
}

export function matchingQtyFromLines(lines: CouponCartLine[]): number {
  return lines.reduce((s, l) => s + (l.quantity ?? 0), 0);
}
