import { couponLifecycle, type CouponLifecycle, type CouponScopeKind } from './coupon-lifecycle';

export type CouponConflictSlice = {
  id: string;
  code: string;
  active: boolean;
  startsAt: Date | string | null;
  expiresAt: Date | string | null;
  maxUses: number | null;
  usedCount: number;
  scope: CouponScopeKind;
  productIds: string[];
  collectionIds: string[];
};

/** Open-ended null bounds: null start = -∞, null end = +∞. */
export function schedulesOverlap(
  a: { startsAt: Date | string | null; expiresAt: Date | string | null },
  b: { startsAt: Date | string | null; expiresAt: Date | string | null },
): boolean {
  const aStart = a.startsAt ? new Date(a.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const aEnd = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.POSITIVE_INFINITY;
  const bStart = b.startsAt ? new Date(b.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const bEnd = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.POSITIVE_INFINITY;
  if (Number.isNaN(aStart) || Number.isNaN(aEnd) || Number.isNaN(bStart) || Number.isNaN(bEnd)) {
    return false;
  }
  return aStart <= bEnd && bStart <= aEnd;
}

function idSetsIntersect(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const set = new Set(a);
  return b.some((id) => set.has(id));
}

/** True when both scopes could apply to the same checkout (one-code-per-cart ceiling). */
export function scopesCollide(
  a: { scope: CouponScopeKind; productIds: string[]; collectionIds: string[] },
  b: { scope: CouponScopeKind; productIds: string[]; collectionIds: string[] },
): boolean {
  if (a.scope === 'CART' || b.scope === 'CART') return true;
  if (a.scope === 'PRODUCT' && b.scope === 'PRODUCT') {
    return idSetsIntersect(a.productIds, b.productIds);
  }
  if (a.scope === 'COLLECTION' && b.scope === 'COLLECTION') {
    return idSetsIntersect(a.collectionIds, b.collectionIds);
  }
  // PRODUCT ↔ COLLECTION — a product may sit in the collection
  return true;
}

const CONTENDING: ReadonlySet<CouponLifecycle> = new Set(['active', 'scheduled']);

export function isContendingLifecycle(status: CouponLifecycle): boolean {
  return CONTENDING.has(status);
}

export function couponsConflict(
  a: CouponConflictSlice,
  b: CouponConflictSlice,
  now: Date = new Date(),
): boolean {
  if (a.id === b.id) return false;
  const la = couponLifecycle(a, now);
  const lb = couponLifecycle(b, now);
  if (!isContendingLifecycle(la) || !isContendingLifecycle(lb)) return false;
  if (!schedulesOverlap(a, b)) return false;
  return scopesCollide(a, b);
}

/** Map coupon id → conflicting codes (uppercase), sorted. */
export function buildConflictCodesById(
  peers: CouponConflictSlice[],
  now: Date = new Date(),
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (let i = 0; i < peers.length; i++) {
    for (let j = i + 1; j < peers.length; j++) {
      const left = peers[i]!;
      const right = peers[j]!;
      if (!couponsConflict(left, right, now)) continue;
      const leftList = map.get(left.id) ?? [];
      leftList.push(right.code.toUpperCase());
      map.set(left.id, leftList);
      const rightList = map.get(right.id) ?? [];
      rightList.push(left.code.toUpperCase());
      map.set(right.id, rightList);
    }
  }
  for (const [id, codes] of map) {
    map.set(id, [...new Set(codes)].sort());
  }
  return map;
}
