import type { ManualStorefrontLabel } from '../catalog/storefront-display-labels';

export type ProductGridSource =
  | 'auto'
  | 'manual'
  | 'bestsellers'
  | 'editors'
  | 'new'
  | 'on_sale';

export type ProductGridListQuery = {
  category?: string;
  recipient?: string;
  age?: string;
  occasion?: string;
  hamper?: '0' | '1';
  sort?: 'newest' | 'price_asc' | 'price_desc';
  storefrontLabel?: ManualStorefrontLabel;
  onSale?: boolean;
  publishedSince?: Date;
};

export type ProductGridResolution = {
  source: ProductGridSource;
  mode: 'slugs' | 'query';
  slugs: string[];
  query: ProductGridListQuery;
  limit: number;
  newWithinDays?: number;
  category?: string;
  occasion?: string;
  age?: string;
  recipient?: string;
  hamper: boolean;
  title?: string;
  overline?: string;
  subtitle?: string;
  seeAllHref?: string;
  seeAllLabel?: string;
};

const SOURCES = new Set<ProductGridSource>([
  'auto',
  'manual',
  'bestsellers',
  'editors',
  'new',
  'on_sale',
]);

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

/**
 * Pure parse of productGrid CMS props → catalog query / slug mode.
 * Used by CmsPagesService and unit-checked in resolve-product-grid-query.check.ts.
 */
export function parseProductGridResolution(
  props: Record<string, unknown>,
  now: Date = new Date(),
): ProductGridResolution {
  const title = str(props.title);
  const overline = str(props.overline);
  const subtitle = str(props.subtitle);
  const category = str(props.category);
  const occasion = str(props.occasion);
  const age = str(props.age);
  const recipient = str(props.recipient);
  const hamper = props.hamper === true;
  const seeAllHref = str(props.seeAllHref);
  const seeAllLabel = str(props.seeAllLabel);
  const slugs = Array.isArray(props.productSlugs)
    ? props.productSlugs.map(String).map((s) => s.trim()).filter(Boolean)
    : [];

  const rawSource = str(props.source);
  let source: ProductGridSource =
    rawSource && SOURCES.has(rawSource as ProductGridSource)
      ? (rawSource as ProductGridSource)
      : 'auto';

  // Backward compatible: explicit slugs without source ⇒ manual order.
  if (source === 'auto' && slugs.length) {
    source = 'manual';
  }

  const newWithinDays =
    typeof props.newWithinDays === 'number' &&
    props.newWithinDays >= 1 &&
    props.newWithinDays <= 90
      ? Math.floor(props.newWithinDays)
      : source === 'new'
        ? 30
        : undefined;

  const limitRaw =
    typeof props.limit === 'number' && props.limit > 0 ? Math.min(Math.floor(props.limit), 24) : undefined;
  const limit = limitRaw ?? (hamper ? 3 : 8);

  const baseFilters: ProductGridListQuery = {
    ...(category ? { category } : {}),
    ...(occasion ? { occasion } : {}),
    ...(age ? { age } : {}),
    ...(recipient ? { recipient } : {}),
    ...(hamper ? { hamper: '1' as const } : {}),
    sort: 'newest',
  };

  if (source === 'manual') {
    return {
      source,
      mode: 'slugs',
      slugs,
      query: baseFilters,
      limit,
      ...(newWithinDays ? { newWithinDays } : {}),
      ...(category ? { category } : {}),
      ...(occasion ? { occasion } : {}),
      ...(age ? { age } : {}),
      ...(recipient ? { recipient } : {}),
      hamper,
      ...(title ? { title } : {}),
      ...(overline ? { overline } : {}),
      ...(subtitle ? { subtitle } : {}),
      ...(seeAllHref ? { seeAllHref } : {}),
      ...(seeAllLabel ? { seeAllLabel } : {}),
    };
  }

  const query: ProductGridListQuery = { ...baseFilters };

  if (source === 'bestsellers') {
    query.storefrontLabel = 'BESTSELLER';
  } else if (source === 'editors') {
    query.storefrontLabel = 'EDITORS_PICK';
  } else if (source === 'on_sale') {
    query.onSale = true;
  } else if (source === 'new') {
    const days = newWithinDays ?? 30;
    query.publishedSince = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }

  return {
    source,
    mode: 'query',
    slugs: [],
    query,
    limit,
    ...(newWithinDays ? { newWithinDays } : {}),
    ...(category ? { category } : {}),
    ...(occasion ? { occasion } : {}),
    ...(age ? { age } : {}),
    ...(recipient ? { recipient } : {}),
    hamper,
    ...(title ? { title } : {}),
    ...(overline ? { overline } : {}),
    ...(subtitle ? { subtitle } : {}),
    ...(seeAllHref ? { seeAllHref } : {}),
    ...(seeAllLabel ? { seeAllLabel } : {}),
  };
}
