import type { CouponEligibility, CouponMatchRules } from '@inabiya/validation';
import {
  parseCouponEligibility,
  parseCouponMatchRules,
} from './coupon-conditions';
import { couponLifecycle, couponLayer, type CouponLifecycle, type CouponScopeKind } from './coupon-lifecycle';

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
  minSubtotalPaise?: number;
  eligibility?: unknown;
  matchRules?: unknown;
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

/** True when both scopes could apply to the same checkout on the same layer. */
export function scopesCollide(
  a: { scope: CouponScopeKind; productIds: string[]; collectionIds: string[] },
  b: { scope: CouponScopeKind; productIds: string[]; collectionIds: string[] },
): boolean {
  if (couponLayer(a.scope) !== couponLayer(b.scope)) return false;
  if (a.scope === 'CART' || b.scope === 'CART') return true;
  if (a.scope === 'PRODUCT' && b.scope === 'PRODUCT') {
    return idSetsIntersect(a.productIds, b.productIds);
  }
  if (a.scope === 'COLLECTION' && b.scope === 'COLLECTION') {
    return idSetsIntersect(a.collectionIds, b.collectionIds);
  }
  // PRODUCT ↔ COLLECTION / MATCHING — a line may satisfy both (same layer).
  return true;
}

function yesValue(value: string): boolean {
  return value === 'yes' || value === '1' || value === 'true';
}

/** When match=any with several conditions, we cannot force a single gate. */
function canForceAll(rules: { match: 'all' | 'any'; conditions: unknown[] }): boolean {
  return rules.match === 'all' || rules.conditions.length === 1;
}

function forcedCustomer(rules: CouponEligibility): 'first' | 'returning' | null {
  if (!canForceAll(rules)) return null;
  let kind: 'first' | 'returning' | null = null;
  for (const c of rules.conditions) {
    let next: 'first' | 'returning' | null = null;
    if (c.field === 'firstOrder') {
      const want = c.op === 'is_not' ? !yesValue(c.value) : yesValue(c.value);
      next = want ? 'first' : 'returning';
    } else if (c.field === 'returningCustomer') {
      const want = c.op === 'is_not' ? !yesValue(c.value) : yesValue(c.value);
      next = want ? 'returning' : 'first';
    }
    if (!next) continue;
    if (kind && kind !== next) return null;
    kind = next;
  }
  return kind;
}

function forcedShipping(rules: CouponEligibility): 'STANDARD' | 'EXPRESS' | null {
  if (!canForceAll(rules)) return null;
  const conds = rules.conditions.filter((c) => c.field === 'shippingMethod');
  if (conds.length !== 1) return null;
  const c = conds[0]!;
  if (c.value !== 'STANDARD' && c.value !== 'EXPRESS') return null;
  if (c.op === 'is') return c.value;
  if (c.op === 'is_not') return c.value === 'STANDARD' ? 'EXPRESS' : 'STANDARD';
  return null;
}

function cartQtyBounds(rules: CouponEligibility): { min: number; max: number } {
  let min = 0;
  let max = Number.POSITIVE_INFINITY;
  if (!canForceAll(rules)) return { min, max };
  for (const c of rules.conditions) {
    if (c.field !== 'cartQty') continue;
    const n = Number.parseInt(c.value, 10);
    if (!Number.isInteger(n)) continue;
    if (c.op === 'gte' || c.op === 'is') min = Math.max(min, n);
    if (c.op === 'lte' || c.op === 'is') max = Math.min(max, n);
  }
  return { min, max };
}

function maxEligiblePaise(c: CouponConflictSlice, rules: CouponEligibility): number {
  let max = Number.POSITIVE_INFINITY;
  if (!canForceAll(rules)) return max;
  for (const cond of rules.conditions) {
    if (cond.field !== 'maxSubtotalPaise') continue;
    const n = Number.parseInt(cond.value, 10);
    if (!Number.isInteger(n) || n < 1) continue;
    if (cond.op === 'lte' || cond.op === 'is') max = Math.min(max, n);
  }
  return max;
}

function boundsExclusive(
  a: { min: number; max: number },
  b: { min: number; max: number },
): boolean {
  return a.max < b.min || b.max < a.min;
}

function forcedMatchBool(
  rules: CouponMatchRules,
  field: 'hamper' | 'onSale',
): boolean | null {
  if (!canForceAll(rules)) return null;
  const conds = rules.conditions.filter((c) => c.field === field);
  if (conds.length !== 1) return null;
  const c = conds[0]!;
  const yes = yesValue(c.value);
  if (c.op === 'is') return yes;
  if (c.op === 'is_not') return !yes;
  return null;
}

/** True when eligibility/match gates can never both pass on one checkout. */
export function gatesExclusive(a: CouponConflictSlice, b: CouponConflictSlice): boolean {
  const ea = parseCouponEligibility(a.eligibility);
  const eb = parseCouponEligibility(b.eligibility);

  const ca = forcedCustomer(ea);
  const cb = forcedCustomer(eb);
  if (ca && cb && ca !== cb) return true;

  const sa = forcedShipping(ea);
  const sb = forcedShipping(eb);
  if (sa && sb && sa !== sb) return true;

  if (boundsExclusive(cartQtyBounds(ea), cartQtyBounds(eb))) return true;

  const aMin = a.minSubtotalPaise ?? 0;
  const bMin = b.minSubtotalPaise ?? 0;
  if (aMin > maxEligiblePaise(b, eb) || bMin > maxEligiblePaise(a, ea)) return true;

  if (a.scope === 'MATCHING' && b.scope === 'MATCHING') {
    const ma = parseCouponMatchRules(a.matchRules);
    const mb = parseCouponMatchRules(b.matchRules);
    if (ma && mb) {
      for (const field of ['hamper', 'onSale'] as const) {
        const fa = forcedMatchBool(ma, field);
        const fb = forcedMatchBool(mb, field);
        if (fa != null && fb != null && fa !== fb) return true;
      }
    }
  }

  return false;
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
  if (!scopesCollide(a, b)) return false;
  if (gatesExclusive(a, b)) return false;
  return true;
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

const PEER_SELECT = {
  id: true,
  code: true,
  active: true,
  startsAt: true,
  expiresAt: true,
  maxUses: true,
  usedCount: true,
  scope: true,
  productIds: true,
  collectionIds: true,
  minSubtotalPaise: true,
  eligibility: true,
  matchRules: true,
} as const;

export const couponConflictPeerSelect = PEER_SELECT;

export function toCouponConflictSlice(
  c: {
    id: string;
    code: string;
    active: boolean;
    startsAt: Date | string | null;
    expiresAt: Date | string | null;
    maxUses: number | null;
    usedCount: number;
    scope: string;
    productIds: string[];
    collectionIds: string[];
    minSubtotalPaise?: number;
    eligibility?: unknown;
    matchRules?: unknown;
  },
): CouponConflictSlice {
  return {
    id: c.id,
    code: c.code,
    active: c.active,
    startsAt: c.startsAt,
    expiresAt: c.expiresAt,
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    scope: c.scope as CouponScopeKind,
    productIds: c.productIds,
    collectionIds: c.collectionIds,
    minSubtotalPaise: c.minSubtotalPaise ?? 0,
    eligibility: c.eligibility,
    matchRules: c.matchRules,
  };
}
