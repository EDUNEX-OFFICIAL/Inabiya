/**
 * Map Collection.rules JSON → catalog list filters / Prisma fragments.
 */
import type { Prisma } from '@prisma/client';
import type { CollectionRules } from '@inabiya/validation';

export type CollectionRulesJson = CollectionRules | null | undefined;

export function parseCollectionRules(raw: unknown): CollectionRules {
  if (!raw || typeof raw !== 'object') return {};
  return raw as CollectionRules;
}

/** Apply RULES filters onto an existing ProductWhereInput (mutates/returns merged). */
export function applyCollectionRulesToWhere(
  where: Prisma.ProductWhereInput,
  rules: CollectionRules,
): Prisma.ProductWhereInput {
  const next: Prisma.ProductWhereInput = { ...where };

  if (rules.recipient === 'girl' || rules.recipient === 'boy') {
    next.recipientTags = { hasSome: [rules.recipient, 'unisex'] };
  } else if (rules.recipient) {
    next.recipientTags = { has: rules.recipient };
  }

  if (rules.age && rules.age !== 'any') {
    next.ageBands = { hasSome: [rules.age, 'any'] };
  } else if (rules.age === 'any') {
    next.ageBands = { has: 'any' };
  }

  if (rules.occasion) {
    next.occasionTags = { has: rules.occasion };
  }

  if (rules.hamper === '1') {
    next.isReadyMadeHamper = true;
  }

  if (rules.storefrontLabel) {
    next.storefrontLabels = { has: rules.storefrontLabel };
  }

  if (rules.onSale === '1') {
    next.variants = {
      some: {
        AND: [
          { compareAtPricePaise: { not: null } },
          // compareAt > price — Prisma can't express column compare easily; use filter in app or raw.
          // Approximate: compareAtPricePaise is set (storefront also checks > price).
          { compareAtPricePaise: { gt: 0 } },
        ],
      },
    };
  }

  return next;
}

export function rulesDefaultSort(
  rules: CollectionRules,
): 'newest' | 'price_asc' | 'price_desc' | undefined {
  return rules.sort;
}
