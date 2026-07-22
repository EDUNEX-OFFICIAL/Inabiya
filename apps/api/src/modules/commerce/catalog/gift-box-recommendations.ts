import { Prisma, ProductStatus } from '@prisma/client';

export type GiftBoxRecPrefs = {
  recipient: string | null;
  ageBand: string | null;
  occasion: string | null;
  categorySlugs: string[];
};

/** Progressive relax tiers — drop filters until suggestions can appear. */
export type RecFilterTier = 'full' | 'noCategory' | 'noOccasion' | 'noAge' | 'budgetOnly';

export const REC_FILTER_TIERS: RecFilterTier[] = [
  'full',
  'noCategory',
  'noOccasion',
  'noAge',
  'budgetOnly',
];

export function buildGiftBoxProductWhere(
  prefs: GiftBoxRecPrefs,
  tier: RecFilterTier,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {
    status: ProductStatus.PUBLISHED,
    variants: { some: { giftBoxEligible: true } },
  };

  if (tier === 'budgetOnly') return where;

  if (prefs.recipient === 'girl' || prefs.recipient === 'boy') {
    where.recipientTags = { hasSome: [prefs.recipient, 'unisex'] };
  } else if (prefs.recipient) {
    where.recipientTags = { has: prefs.recipient };
  }

  if (tier === 'noAge') return where;

  // `any` means no age constraint — do not require products tagged exactly `any`.
  if (prefs.ageBand && prefs.ageBand !== 'any') {
    where.ageBands = { hasSome: [prefs.ageBand, 'any'] };
  }

  if (tier === 'noOccasion') return where;

  if (prefs.occasion) where.occasionTags = { has: prefs.occasion };

  if (tier === 'noCategory') return where;

  if (prefs.categorySlugs.length) {
    where.categories = {
      some: { category: { slug: { in: prefs.categorySlugs } } },
    };
  }

  return where;
}
