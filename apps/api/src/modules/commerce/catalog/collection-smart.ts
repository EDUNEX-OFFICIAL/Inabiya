/**
 * Shopify-like smart collection conditions → Prisma where fragments.
 */
import type { Prisma } from '@prisma/client';
import type { SmartCondition, SmartRules } from '@inabiya/validation';
import { smartRulesSchema } from '@inabiya/validation';

export function parseSmartRules(raw: unknown): SmartRules {
  const parsed = smartRulesSchema.safeParse(raw ?? { match: 'all', conditions: [] });
  if (parsed.success) return parsed.data;
  return { match: 'all', conditions: [] };
}

function conditionToWhere(c: SmartCondition): Prisma.ProductWhereInput | null {
  const { field, op, value } = c;

  if (field === 'recipient') {
    const tags =
      value === 'girl' || value === 'boy'
        ? { hasSome: [value, 'unisex'] }
        : { has: value };
    if (op === 'is') return { recipientTags: tags };
    if (op === 'is_not') {
      return value === 'girl' || value === 'boy'
        ? { NOT: { recipientTags: { hasSome: [value, 'unisex'] } } }
        : { NOT: { recipientTags: { has: value } } };
    }
  }

  if (field === 'age') {
    if (op === 'is') {
      return value === 'any'
        ? { ageBands: { has: 'any' } }
        : { ageBands: { hasSome: [value, 'any'] } };
    }
    if (op === 'is_not') {
      return value === 'any'
        ? { NOT: { ageBands: { has: 'any' } } }
        : { NOT: { ageBands: { hasSome: [value, 'any'] } } };
    }
  }

  if (field === 'occasion') {
    if (op === 'is') return { occasionTags: { has: value } };
    if (op === 'is_not') return { NOT: { occasionTags: { has: value } } };
  }

  if (field === 'hamper') {
    const yes = value === 'yes' || value === '1' || value === 'true';
    if (op === 'is' || op === 'is_not') {
      const want = op === 'is' ? yes : !yes;
      return { isReadyMadeHamper: want };
    }
  }

  if (field === 'label') {
    if (op === 'is') return { storefrontLabels: { has: value } };
    if (op === 'is_not') return { NOT: { storefrontLabels: { has: value } } };
  }

  if (field === 'onSale') {
    const yes = value === 'yes' || value === '1' || value === 'true';
    const saleFilter: Prisma.ProductWhereInput = {
      variants: { some: { compareAtPricePaise: { not: null } } },
    };
    if (op === 'is') return yes ? saleFilter : { NOT: saleFilter };
    if (op === 'is_not') return yes ? { NOT: saleFilter } : saleFilter;
  }

  if (field === 'titleContains') {
    if (op === 'contains' || op === 'is') {
      return { title: { contains: value, mode: 'insensitive' } };
    }
    if (op === 'is_not') {
      return { NOT: { title: { contains: value, mode: 'insensitive' } } };
    }
  }

  if (field === 'publishedWithinDays') {
    const days = Number.parseInt(value, 10);
    if (!Number.isFinite(days) || days <= 0) return null;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    if (op === 'within' || op === 'is') return { publishedAt: { gte: since } };
    if (op === 'is_not') return { OR: [{ publishedAt: null }, { publishedAt: { lt: since } }] };
  }

  return null;
}

/** Apply smart rules onto an existing product where (AND with publish filters). */
export function applySmartRulesToWhere(
  base: Prisma.ProductWhereInput,
  rules: SmartRules,
): Prisma.ProductWhereInput {
  const parts = rules.conditions
    .map(conditionToWhere)
    .filter((w): w is Prisma.ProductWhereInput => w != null);
  if (!parts.length) return base;
  if (rules.match === 'any') {
    return { AND: [base, { OR: parts }] };
  }
  return { AND: [base, ...parts] };
}

/** True when SMART list needs post-filter for real compare-at > price sale. */
export function smartRulesNeedOnSalePostFilter(rules: SmartRules): boolean {
  return rules.conditions.some((c) => {
    if (c.field !== 'onSale') return false;
    const yes = c.value === 'yes' || c.value === '1' || c.value === 'true';
    return (c.op === 'is' && yes) || (c.op === 'is_not' && !yes);
  });
}

/** Facets locked by SMART "is" conditions when match=all (storefront hide). */
export function smartRulesHideFacets(
  rules: SmartRules,
): Array<'recipient' | 'age' | 'occasion' | 'hamper' | 'onSale'> {
  if (rules.match !== 'all') return [];
  const out: Array<'recipient' | 'age' | 'occasion' | 'hamper' | 'onSale'> = [];
  for (const c of rules.conditions) {
    if (c.op !== 'is') continue;
    if (c.field === 'recipient') out.push('recipient');
    if (c.field === 'age') out.push('age');
    if (c.field === 'occasion') out.push('occasion');
    if (c.field === 'hamper') out.push('hamper');
    if (c.field === 'onSale') out.push('onSale');
  }
  return [...new Set(out)];
}
