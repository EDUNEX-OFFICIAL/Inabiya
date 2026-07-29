/** Soft / rule-based gift collections — pretty URLs over catalog filters. */

export type CollectionFacet =
  | 'recipient'
  | 'age'
  | 'occasion'
  | 'category'
  | 'hamper'
  | 'onSale'
  | 'budget';

export type CollectionBaseFilters = {
  recipient?: string;
  age?: string;
  occasion?: string;
  hamper?: string;
  storefrontLabel?: string;
  onSale?: string;
  /** Default sort when URL has none */
  sort?: string;
};

export type GiftCollection = {
  slug: string;
  title: string;
  overline: string;
  blurb: string;
  heroImageUrl: string;
  heroImageAlt: string;
  accent: 'pink' | 'sky' | 'neutral';
  baseFilters: CollectionBaseFilters;
  /** Facets locked by this collection identity */
  hideFacets: CollectionFacet[];
  relatedSlugs: string[];
  lockedLabel: string;
};

const MEDIA = {
  girl: '/gift/media/baby-girl-soft.jpg',
  boy: '/gift/media/train-toy.jpg',
  mom: '/gift/media/baby-mom.jpg',
  feet: '/gift/media/baby-boy-soft.jpg',
  blanket: '/gift/media/personalised-name-blanket.webp',
  train: '/gift/media/train-toy.jpg',
  hamper: '/gift/media/baby-soft-gift.jpg',
  cues: '/gift/media/baby-cues.jpg',
} as const;

export const GIFT_COLLECTIONS: GiftCollection[] = [
  {
    slug: 'for-baby-girl',
    title: 'Gifts for baby girl',
    overline: 'Shop by baby',
    blurb: 'Blush ribbons, gentle pastels, and unisex-safe picks for her.',
    heroImageUrl: MEDIA.girl,
    heroImageAlt: 'Baby girl with soft toys',
    accent: 'pink',
    baseFilters: { recipient: 'girl' },
    hideFacets: ['recipient'],
    relatedSlugs: ['for-baby-boy', 'unisex-gifts', 'newborn'],
    lockedLabel: 'Baby girl',
  },
  {
    slug: 'for-baby-boy',
    title: 'Gifts for baby boy',
    overline: 'Shop by baby',
    blurb: 'Sky ribbons, soft brights, and unisex-safe picks for him.',
    heroImageUrl: MEDIA.boy,
    heroImageAlt: 'Wooden train set for little boys',
    accent: 'sky',
    baseFilters: { recipient: 'boy' },
    hideFacets: ['recipient'],
    relatedSlugs: ['for-baby-girl', 'unisex-gifts', 'newborn'],
    lockedLabel: 'Baby boy',
  },
  {
    slug: 'for-expecting-mom',
    title: 'For expecting & new moms',
    overline: 'Shop by baby',
    blurb: 'Calm kits, care oils, and thoughtful gifts for her too.',
    heroImageUrl: MEDIA.mom,
    heroImageAlt: 'Care gifts for new moms',
    accent: 'neutral',
    baseFilters: { recipient: 'mom' },
    hideFacets: ['recipient'],
    relatedSlugs: ['baby-shower', 'welcome-baby', 'ready-hampers'],
    lockedLabel: 'Expecting mom',
  },
  {
    slug: 'unisex-gifts',
    title: 'Unisex baby gifts',
    overline: 'Shop by baby',
    blurb: 'Gender-neutral essentials that work for any little one.',
    heroImageUrl: MEDIA.blanket,
    heroImageAlt: 'Unisex baby keepsakes',
    accent: 'neutral',
    baseFilters: { recipient: 'unisex' },
    hideFacets: ['recipient'],
    relatedSlugs: ['for-baby-girl', 'for-baby-boy', 'newborn'],
    lockedLabel: 'Unisex',
  },
  {
    slug: 'welcome-baby',
    title: 'Welcome baby gifts',
    overline: 'Shop by occasion',
    blurb: 'First-hello hampers and soft essentials for the newborn days.',
    heroImageUrl: MEDIA.feet,
    heroImageAlt: 'Welcome baby',
    accent: 'pink',
    baseFilters: { occasion: 'welcome-baby' },
    hideFacets: ['occasion'],
    relatedSlugs: ['baby-shower', 'newborn', 'ready-hampers'],
    lockedLabel: 'Welcome baby',
  },
  {
    slug: 'baby-shower',
    title: 'Baby shower gifts',
    overline: 'Shop by occasion',
    blurb: 'Celebrate the bump with ready-to-gift sets and keepsakes.',
    heroImageUrl: MEDIA.girl,
    heroImageAlt: 'Baby shower',
    accent: 'pink',
    baseFilters: { occasion: 'baby-shower' },
    hideFacets: ['occasion'],
    relatedSlugs: ['welcome-baby', 'for-expecting-mom', 'naming-ceremony'],
    lockedLabel: 'Baby shower',
  },
  {
    slug: 'naming-ceremony',
    title: 'Naming ceremony gifts',
    overline: 'Shop by occasion',
    blurb: 'Personalised blankets, memory cards, and celebration-ready picks.',
    heroImageUrl: MEDIA.blanket,
    heroImageAlt: 'Naming ceremony',
    accent: 'neutral',
    baseFilters: { occasion: 'naming' },
    hideFacets: ['occasion'],
    relatedSlugs: ['welcome-baby', 'first-birthday', 'unisex-gifts'],
    lockedLabel: 'Naming',
  },
  {
    slug: 'first-birthday',
    title: 'First birthday gifts',
    overline: 'Shop by occasion',
    blurb: 'Toys, soft wear, and keepsakes for turning one.',
    heroImageUrl: MEDIA.train,
    heroImageAlt: 'Birthday',
    accent: 'sky',
    baseFilters: { occasion: 'birthday' },
    hideFacets: ['occasion'],
    relatedSlugs: ['toddler', 'infant', 'bestsellers'],
    lockedLabel: 'Birthday',
  },
  {
    slug: 'newborn',
    title: 'Newborn essentials',
    overline: 'Shop by age',
    blurb: 'Gentle, newborn-safe gifts for the first weeks.',
    heroImageUrl: MEDIA.feet,
    heroImageAlt: 'Newborn',
    accent: 'pink',
    baseFilters: { age: 'newborn' },
    hideFacets: ['age'],
    relatedSlugs: ['infant', 'welcome-baby', 'ready-hampers'],
    lockedLabel: 'Newborn',
  },
  {
    slug: 'infant',
    title: 'Infant gifts',
    overline: 'Shop by age',
    blurb: 'Playful and practical picks for the infant months.',
    heroImageUrl: MEDIA.girl,
    heroImageAlt: 'Infant',
    accent: 'neutral',
    baseFilters: { age: 'infant' },
    hideFacets: ['age'],
    relatedSlugs: ['newborn', 'toddler', 'first-birthday'],
    lockedLabel: 'Infant',
  },
  {
    slug: 'toddler',
    title: 'Toddler gifts',
    overline: 'Shop by age',
    blurb: 'Curious toys and soft wear for toddling explorers.',
    heroImageUrl: MEDIA.train,
    heroImageAlt: 'Toddler',
    accent: 'sky',
    baseFilters: { age: 'toddler' },
    hideFacets: ['age'],
    relatedSlugs: ['infant', 'first-birthday', 'bestsellers'],
    lockedLabel: 'Toddler',
  },
  {
    slug: 'ready-hampers',
    title: 'Ready-made hampers',
    overline: 'Curated',
    blurb: 'Pre-styled gift sets — ready when you need them.',
    heroImageUrl: MEDIA.hamper,
    heroImageAlt: 'Ready-made hamper',
    accent: 'neutral',
    baseFilters: { hamper: '1' },
    hideFacets: ['hamper'],
    relatedSlugs: ['bestsellers', 'welcome-baby', 'for-expecting-mom'],
    lockedLabel: 'Hampers',
  },
  {
    slug: 'bestsellers',
    title: 'Best sellers',
    overline: 'Curated',
    blurb: 'The gifts families reorder and recommend.',
    heroImageUrl: MEDIA.cues,
    heroImageAlt: 'Best sellers',
    accent: 'pink',
    baseFilters: { storefrontLabel: 'BESTSELLER' },
    hideFacets: [],
    relatedSlugs: ['editors-picks', 'new-arrivals', 'ready-hampers'],
    lockedLabel: 'Best sellers',
  },
  {
    slug: 'editors-picks',
    title: "Editor's picks",
    overline: 'Curated',
    blurb: 'Hand-chosen favourites from the Soft Gift edit.',
    heroImageUrl: MEDIA.blanket,
    heroImageAlt: "Editor's picks",
    accent: 'neutral',
    baseFilters: { storefrontLabel: 'EDITORS_PICK' },
    hideFacets: [],
    relatedSlugs: ['bestsellers', 'new-arrivals', 'unisex-gifts'],
    lockedLabel: "Editor's picks",
  },
  {
    slug: 'new-arrivals',
    title: 'New arrivals',
    overline: 'Curated',
    blurb: 'Fresh finds for the nursery and the gift pile.',
    heroImageUrl: MEDIA.hamper,
    heroImageAlt: 'New arrivals',
    accent: 'sky',
    baseFilters: { sort: 'newest' },
    hideFacets: [],
    relatedSlugs: ['bestsellers', 'on-sale', 'ready-hampers'],
    lockedLabel: 'New arrivals',
  },
  {
    slug: 'on-sale',
    title: 'On sale',
    overline: 'Curated',
    blurb: 'Limited-time soft savings on thoughtful gifts.',
    heroImageUrl: MEDIA.cues,
    heroImageAlt: 'On sale',
    accent: 'pink',
    baseFilters: { onSale: '1' },
    hideFacets: ['onSale'],
    relatedSlugs: ['bestsellers', 'ready-hampers', 'new-arrivals'],
    lockedLabel: 'On sale',
  },
];

const bySlug = new Map(GIFT_COLLECTIONS.map((c) => [c.slug, c]));

export function getGiftCollection(slug: string): GiftCollection | undefined {
  return bySlug.get(slug);
}

export function allGiftCollectionSlugs(): string[] {
  return GIFT_COLLECTIONS.map((c) => c.slug);
}

export const COLLECTION_CATEGORIES = [
  { value: 'clothing', label: 'Clothing' },
  { value: 'bath-skin', label: 'Bath & Skin' },
  { value: 'toys', label: 'Toys' },
  { value: 'mom-care', label: 'Mom Care' },
  { value: 'keepsakes', label: 'Keepsakes' },
] as const;

export const COLLECTION_AGES = [
  { value: 'newborn', label: 'Newborn' },
  { value: 'infant', label: 'Infant' },
  { value: 'toddler', label: 'Toddler' },
] as const;

export const COLLECTION_OCCASIONS = [
  { value: 'welcome-baby', label: 'Welcome baby' },
  { value: 'baby-shower', label: 'Baby shower' },
  { value: 'naming', label: 'Naming' },
  { value: 'birthday', label: 'Birthday' },
] as const;

export const COLLECTION_RECIPIENTS = [
  { value: 'girl', label: 'Girl' },
  { value: 'boy', label: 'Boy' },
  { value: 'mom', label: 'Mom' },
  { value: 'unisex', label: 'Unisex' },
] as const;

export const COLLECTION_BUDGETS = [
  { value: '150000', label: 'Under ₹1,500' },
  { value: '300000', label: 'Under ₹3,000' },
] as const;

export const COLLECTION_SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

export type CollectionRefine = {
  recipient?: string;
  age?: string;
  occasion?: string;
  category?: string;
  hamper?: string;
  onSale?: string;
  maxPricePaise?: string;
  sort?: string;
};

/** Merge collection base with URL refine; base keys always win. */
export function mergeCollectionCatalogQuery(
  collection: GiftCollection,
  refine: CollectionRefine,
): Record<string, string> {
  const base = collection.baseFilters;
  const out: Record<string, string> = {};

  const sort =
    refine.sort && COLLECTION_SORTS.some((s) => s.value === refine.sort)
      ? refine.sort
      : base.sort ?? 'newest';
  out.sort = sort;

  const recipient = base.recipient ?? refine.recipient;
  const age = base.age ?? refine.age;
  const occasion = base.occasion ?? refine.occasion;
  const hamper = base.hamper ?? refine.hamper;
  const onSale = base.onSale ?? refine.onSale;
  const storefrontLabel = base.storefrontLabel;
  const category = refine.category;
  const maxPricePaise = refine.maxPricePaise;

  if (recipient) out.recipient = recipient;
  if (age) out.age = age;
  if (occasion) out.occasion = occasion;
  if (hamper) out.hamper = hamper;
  if (onSale) out.onSale = onSale;
  if (storefrontLabel) out.storefrontLabel = storefrontLabel;
  if (category) out.category = category;
  if (maxPricePaise) out.maxPricePaise = maxPricePaise;

  return out;
}

/** Refine-only params for building collection URLs (excludes locked base keys). */
export function refineParamsForUrl(
  collection: GiftCollection,
  refine: CollectionRefine,
): Record<string, string | undefined> {
  const base = collection.baseFilters;
  return {
    recipient: base.recipient ? undefined : refine.recipient,
    age: base.age ? undefined : refine.age,
    occasion: base.occasion ? undefined : refine.occasion,
    hamper: base.hamper ? undefined : refine.hamper,
    onSale: base.onSale ? undefined : refine.onSale,
    category: refine.category,
    maxPricePaise: refine.maxPricePaise,
    sort: refine.sort && refine.sort !== (base.sort ?? 'newest') ? refine.sort : undefined,
  };
}

export function collectionHref(
  slug: string,
  params: Record<string, string | undefined> = {},
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const q = qs.toString();
  return q ? `/gift/collections/${slug}?${q}` : `/gift/collections/${slug}`;
}

/** Active refine count for badge — excludes sort. */
export function countActiveRefines(
  collection: GiftCollection,
  refine: CollectionRefine,
): number {
  const p = refineParamsForUrl(collection, refine);
  const { sort: _sort, ...rest } = p;
  return Object.values(rest).filter(Boolean).length;
}

export type ActiveRefineChip = {
  key: string;
  label: string;
  /** URL with this refine removed */
  clearHref: string;
};

export function listActiveRefineChips(
  collection: GiftCollection,
  refine: CollectionRefine,
): ActiveRefineChip[] {
  const chips: ActiveRefineChip[] = [];
  const without = (patch: Partial<CollectionRefine>) =>
    collectionHref(collection.slug, refineParamsForUrl(collection, { ...refine, ...patch }));

  if (refine.category) {
    const label =
      COLLECTION_CATEGORIES.find((c) => c.value === refine.category)?.label ?? refine.category;
    chips.push({ key: 'category', label, clearHref: without({ category: undefined }) });
  }
  if (refine.age && !collection.baseFilters.age) {
    const label = COLLECTION_AGES.find((a) => a.value === refine.age)?.label ?? refine.age;
    chips.push({ key: 'age', label: `Age: ${label}`, clearHref: without({ age: undefined }) });
  }
  if (refine.occasion && !collection.baseFilters.occasion) {
    const label =
      COLLECTION_OCCASIONS.find((o) => o.value === refine.occasion)?.label ?? refine.occasion;
    chips.push({ key: 'occasion', label, clearHref: without({ occasion: undefined }) });
  }
  if (refine.recipient && !collection.baseFilters.recipient) {
    const label =
      COLLECTION_RECIPIENTS.find((r) => r.value === refine.recipient)?.label ?? refine.recipient;
    chips.push({ key: 'recipient', label, clearHref: without({ recipient: undefined }) });
  }
  if (refine.hamper === '1' && !collection.baseFilters.hamper) {
    chips.push({ key: 'hamper', label: 'Ready hampers', clearHref: without({ hamper: undefined }) });
  }
  if (refine.onSale === '1' && !collection.baseFilters.onSale) {
    chips.push({ key: 'onSale', label: 'On sale', clearHref: without({ onSale: undefined }) });
  }
  if (refine.maxPricePaise) {
    const label =
      COLLECTION_BUDGETS.find((b) => b.value === refine.maxPricePaise)?.label ??
      `Under ₹${Math.round(Number(refine.maxPricePaise) / 100)}`;
    chips.push({
      key: 'budget',
      label,
      clearHref: without({ maxPricePaise: undefined }),
    });
  }
  return chips;
}

export function bybHrefForCollection(collection: GiftCollection): string {
  const qs = new URLSearchParams();
  if (collection.baseFilters.recipient) qs.set('recipient', collection.baseFilters.recipient);
  if (collection.baseFilters.age) qs.set('age', collection.baseFilters.age);
  if (collection.baseFilters.occasion) qs.set('occasion', collection.baseFilters.occasion);
  const q = qs.toString();
  return q ? `/gift/build-your-box?${q}` : '/gift/build-your-box';
}

export function collectionBreadcrumb(collection: GiftCollection): {
  parentLabel: string;
  parentHref: string;
} {
  const over = collection.overline.toLowerCase();
  if (over.includes('occasion')) {
    return { parentLabel: 'Shop by occasion', parentHref: '/gift/collections/welcome-baby' };
  }
  if (over.includes('age')) {
    return { parentLabel: 'Shop by age', parentHref: '/gift/collections/newborn' };
  }
  if (over.includes('curated')) {
    return { parentLabel: 'Shop', parentHref: '/gift/products' };
  }
  return { parentLabel: 'Shop by baby', parentHref: '/gift/collections/for-baby-girl' };
}
