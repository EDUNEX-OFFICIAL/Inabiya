/** Pure coupon eligibility + line-match helpers (Shopify-like conditions). */
import {
  couponEligibilitySchema,
  couponMatchRulesSchema,
  type CouponEligibility,
  type CouponMatchRules,
} from '@inabiya/validation';

export type CouponCartLine = {
  productId: string;
  /** MANUAL collection membership IDs only (v1). */
  collectionIds: string[];
  lineTotalPaise: number;
  quantity?: number;
  onSale?: boolean;
  recipientTags?: string[];
  ageBands?: string[];
  occasionTags?: string[];
  isReadyMadeHamper?: boolean;
  storefrontLabels?: string[];
  brandName?: string | null;
  title?: string;
};

export type CouponEligibilityContext = {
  cartQty: number;
  matchingQty: number;
  eligibleSubtotalPaise: number;
  paidOrderCount: number;
  shippingMethod?: 'STANDARD' | 'EXPRESS' | null;
  linesUnknown?: boolean;
};

const EMPTY_ELIGIBILITY: CouponEligibility = { match: 'all', conditions: [] };

export function parseCouponMatchRules(raw: unknown): CouponMatchRules | null {
  if (raw == null) return null;
  const parsed = couponMatchRulesSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function parseCouponEligibility(raw: unknown): CouponEligibility {
  if (raw == null) return EMPTY_ELIGIBILITY;
  const parsed = couponEligibilitySchema.safeParse(raw);
  return parsed.success ? parsed.data : EMPTY_ELIGIBILITY;
}

function yesValue(value: string): boolean {
  return value === 'yes' || value === '1' || value === 'true';
}

function tagHit(tags: string[] | undefined, value: string, withUnisex: boolean): boolean {
  const list = tags ?? [];
  if (withUnisex && (value === 'girl' || value === 'boy')) {
    return list.includes(value) || list.includes('unisex');
  }
  return list.includes(value);
}

function lineMatchesCondition(
  line: CouponCartLine,
  field: string,
  op: string,
  value: string,
): boolean {
  if (field === 'recipient') {
    const hit = tagHit(line.recipientTags, value, true);
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'age') {
    const tags = line.ageBands ?? [];
    const hit =
      value === 'any' ? tags.includes('any') : tags.includes(value) || tags.includes('any');
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'occasion') {
    const hit = (line.occasionTags ?? []).includes(value);
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'hamper') {
    const want = yesValue(value);
    const isHamper = line.isReadyMadeHamper === true;
    const hit = isHamper === want;
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'label') {
    const hit = (line.storefrontLabels ?? []).includes(value);
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'onSale') {
    const want = yesValue(value);
    const hit = (line.onSale === true) === want;
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'brand') {
    const name = (line.brandName ?? '').toLowerCase();
    const needle = value.trim().toLowerCase();
    if (!needle) return false;
    const hit = op === 'contains' ? name.includes(needle) : name === needle;
    return op === 'is_not' ? !hit : hit;
  }
  if (field === 'titleContains') {
    const title = (line.title ?? '').toLowerCase();
    const needle = value.trim().toLowerCase();
    if (!needle) return false;
    const hit = title.includes(needle);
    return op === 'is_not' ? !hit : hit;
  }
  return false;
}

export function lineMatchesRules(line: CouponCartLine, rules: CouponMatchRules): boolean {
  if (!rules.conditions.length) return false;
  const hits = rules.conditions.map((c) => lineMatchesCondition(line, c.field, c.op, c.value));
  return rules.match === 'any' ? hits.some(Boolean) : hits.every(Boolean);
}

export function matchingLines(
  lines: CouponCartLine[],
  rules: CouponMatchRules | null,
): CouponCartLine[] {
  if (!rules) return [];
  return lines.filter((l) => lineMatchesRules(l, rules));
}

function cmpInt(actual: number, op: string, raw: string): boolean {
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n)) return false;
  if (op === 'gte') return actual >= n;
  if (op === 'lte') return actual <= n;
  if (op === 'is') return actual === n;
  return false;
}

function customerFlag(actual: boolean, op: string, value: string): boolean {
  const want = yesValue(value);
  const hit = actual === want;
  return op === 'is_not' ? !hit : hit;
}

function eligibilityConditionHolds(
  c: CouponEligibility['conditions'][number],
  ctx: CouponEligibilityContext,
): boolean {
  if (c.field === 'cartQty') {
    if (ctx.linesUnknown) return true;
    return cmpInt(ctx.cartQty, c.op, c.value);
  }
  if (c.field === 'matchingQty') {
    if (ctx.linesUnknown) return true;
    return cmpInt(ctx.matchingQty, c.op, c.value);
  }
  if (c.field === 'maxSubtotalPaise') return cmpInt(ctx.eligibleSubtotalPaise, c.op, c.value);
  if (c.field === 'firstOrder') return customerFlag(ctx.paidOrderCount === 0, c.op, c.value);
  if (c.field === 'returningCustomer') return customerFlag(ctx.paidOrderCount > 0, c.op, c.value);
  if (c.field === 'shippingMethod') {
    if (ctx.shippingMethod == null) return true;
    const hit = ctx.shippingMethod === c.value;
    return c.op === 'is_not' ? !hit : hit;
  }
  return false;
}

export function eligibilitySatisfied(
  rules: CouponEligibility,
  ctx: CouponEligibilityContext,
): boolean {
  if (!rules.conditions.length) return true;
  const hits = rules.conditions.map((c) => eligibilityConditionHolds(c, ctx));
  return rules.match === 'any' ? hits.some(Boolean) : hits.every(Boolean);
}

export function eligibilityNeedsCustomer(rules: CouponEligibility): boolean {
  return rules.conditions.some((c) => c.field === 'firstOrder' || c.field === 'returningCustomer');
}
