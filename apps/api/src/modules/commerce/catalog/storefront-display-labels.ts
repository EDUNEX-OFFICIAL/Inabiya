export type ManualStorefrontLabel = 'BESTSELLER' | 'EDITORS_PICK' | 'GIFT_SET';

export type DisplayLabelTone = 'sale' | 'new' | 'stock' | 'manual';

export type StorefrontDisplayLabel = {
  code: string;
  text: string;
  tone: DisplayLabelTone;
};

export type ResolveVariantInput = {
  pricePaise: number;
  compareAtPricePaise: number | null;
  available: number;
};

const MANUAL_COPY: Record<ManualStorefrontLabel, string> = {
  BESTSELLER: 'Bestseller',
  EDITORS_PICK: "Editor's pick",
  GIFT_SET: 'Gift set',
};

const NEW_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const LOW_STOCK_MAX = 5;
const DISPLAY_CAP = 2;

export function isManualStorefrontLabel(v: string): v is ManualStorefrontLabel {
  return v === 'BESTSELLER' || v === 'EDITORS_PICK' || v === 'GIFT_SET';
}

/** Prefer cheapest in-stock variant; else cheapest overall. */
export function pickLabelAnchorVariant(
  variants: ResolveVariantInput[],
): ResolveVariantInput | null {
  if (!variants.length) return null;
  const inStock = variants.filter((v) => v.available > 0);
  const pool = inStock.length ? inStock : variants;
  return pool.reduce((best, v) => (v.pricePaise < best.pricePaise ? v : best));
}

export function percentOff(pricePaise: number, compareAtPricePaise: number): number | null {
  if (compareAtPricePaise <= pricePaise || pricePaise < 0) return null;
  const pct = Math.floor(((compareAtPricePaise - pricePaise) / compareAtPricePaise) * 100);
  return pct >= 1 ? pct : null;
}

/**
 * Hybrid ribbons: PCT_OFF → LOW_STOCK → manuals → NEW. Cap 2.
 * Legacy NEW/SALE stored labels are ignored (not manuals).
 */
export function resolveStorefrontDisplayLabels(input: {
  publishedAt: Date | string | null | undefined;
  storefrontLabels: string[] | null | undefined;
  variants: ResolveVariantInput[];
  now?: Date;
}): StorefrontDisplayLabel[] {
  const out: StorefrontDisplayLabel[] = [];
  const push = (label: StorefrontDisplayLabel) => {
    if (out.length >= DISPLAY_CAP) return;
    if (out.some((x) => x.code === label.code)) return;
    out.push(label);
  };

  const anchor = pickLabelAnchorVariant(input.variants);
  if (anchor?.compareAtPricePaise != null) {
    const pct = percentOff(anchor.pricePaise, anchor.compareAtPricePaise);
    if (pct != null) {
      push({ code: 'PCT_OFF', text: `${pct}% off`, tone: 'sale' });
    }
  }

  if (anchor && anchor.available >= 1 && anchor.available <= LOW_STOCK_MAX) {
    push({ code: 'LOW_STOCK', text: 'Low stock', tone: 'stock' });
  }

  const manuals = (input.storefrontLabels ?? []).filter(isManualStorefrontLabel);
  for (const code of manuals) {
    push({ code, text: MANUAL_COPY[code], tone: 'manual' });
  }

  const publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  const now = input.now ?? new Date();
  if (publishedAt && !Number.isNaN(publishedAt.getTime())) {
    if (now.getTime() - publishedAt.getTime() <= NEW_WINDOW_MS) {
      push({ code: 'NEW', text: 'New', tone: 'new' });
    }
  }

  return out;
}
