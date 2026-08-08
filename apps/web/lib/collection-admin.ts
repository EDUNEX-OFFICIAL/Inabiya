/** Shared types + helpers for Soft Gift collection admin forms. */

export type SmartCondition = {
  field:
    | 'recipient'
    | 'age'
    | 'occasion'
    | 'hamper'
    | 'label'
    | 'onSale'
    | 'titleContains'
    | 'publishedWithinDays';
  op: 'is' | 'is_not' | 'contains' | 'within';
  value: string;
};

export type SmartRules = { match: 'all' | 'any'; conditions: SmartCondition[] };

export type CollectionProduct = {
  id: string;
  slug: string;
  title: string;
  status?: string;
  sortOrder?: number;
};

export type CollectionDetail = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  status: 'DRAFT' | 'PUBLISHED';
  membershipMode: 'MANUAL' | 'SMART';
  smartRules?: SmartRules | null;
  productCount: number;
  accent?: string;
  overline?: string | null;
  lockedLabel?: string | null;
  relatedSlugs?: string[];
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  ogImageUrl?: string | null;
  robotsIndex?: boolean;
  products?: CollectionProduct[];
  productsSource?: 'manual' | 'smart';
};

export type CollectionFormState = {
  title: string;
  slug: string;
  description: string;
  sortOrder: string;
  status: 'DRAFT' | 'PUBLISHED';
  membershipMode: 'MANUAL' | 'SMART';
  smartRules: SmartRules;
  overline: string;
  lockedLabel: string;
  accent: 'pink' | 'sky' | 'neutral';
  heroImageUrl: string;
  heroImageAlt: string;
  relatedSlugs: string;
  productSlugs: string[];
  seoTitle: string;
  seoDescription: string;
  canonicalPath: string;
  ogImageUrl: string;
  robotsIndex: boolean;
};

export const EMPTY_SMART: SmartRules = {
  match: 'all',
  conditions: [{ field: 'recipient', op: 'is', value: 'girl' }],
};

export const EMPTY_COLLECTION_FORM: CollectionFormState = {
  title: '',
  slug: '',
  description: '',
  sortOrder: '0',
  status: 'DRAFT',
  membershipMode: 'MANUAL',
  smartRules: EMPTY_SMART,
  overline: '',
  lockedLabel: '',
  accent: 'neutral',
  heroImageUrl: '',
  heroImageAlt: '',
  relatedSlugs: '',
  productSlugs: [],
  seoTitle: '',
  seoDescription: '',
  canonicalPath: '',
  ogImageUrl: '',
  robotsIndex: true,
};

export const SMART_FIELD_OPTS: Array<{ value: SmartCondition['field']; label: string }> = [
  { value: 'recipient', label: 'Recipient' },
  { value: 'age', label: 'Age' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'hamper', label: 'Ready-made hamper' },
  { value: 'label', label: 'Storefront label' },
  { value: 'onSale', label: 'On sale' },
  { value: 'titleContains', label: 'Title' },
  { value: 'publishedWithinDays', label: 'Published' },
];

export function defaultSmartOp(field: SmartCondition['field']): SmartCondition['op'] {
  if (field === 'titleContains') return 'contains';
  if (field === 'publishedWithinDays') return 'within';
  return 'is';
}

export function defaultSmartValue(field: SmartCondition['field']): string {
  switch (field) {
    case 'recipient':
      return 'girl';
    case 'age':
      return 'newborn';
    case 'occasion':
      return 'welcome-baby';
    case 'hamper':
    case 'onSale':
      return 'yes';
    case 'label':
      return 'BESTSELLER';
    case 'titleContains':
      return '';
    case 'publishedWithinDays':
      return '45';
  }
}

export function smartValueOptions(
  field: SmartCondition['field'],
): Array<{ value: string; label: string }> | null {
  switch (field) {
    case 'recipient':
      return [
        { value: 'girl', label: 'Baby girl' },
        { value: 'boy', label: 'Baby boy' },
        { value: 'mom', label: 'Expecting / new mom' },
        { value: 'unisex', label: 'Unisex' },
      ];
    case 'age':
      return [
        { value: 'newborn', label: 'Newborn' },
        { value: 'infant', label: 'Infant' },
        { value: 'toddler', label: 'Toddler' },
        { value: 'any', label: 'Any age' },
      ];
    case 'occasion':
      return [
        { value: 'welcome-baby', label: 'Welcome baby' },
        { value: 'baby-shower', label: 'Baby shower' },
        { value: 'naming', label: 'Naming ceremony' },
        { value: 'birthday', label: 'Birthday' },
      ];
    case 'hamper':
    case 'onSale':
      return [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ];
    case 'label':
      return [
        { value: 'BESTSELLER', label: 'Bestseller' },
        { value: 'EDITORS_PICK', label: "Editor's pick" },
        { value: 'GIFT_SET', label: 'Gift set' },
      ];
    default:
      return null;
  }
}

export function smartOpOptions(
  field: SmartCondition['field'],
): Array<{ value: SmartCondition['op']; label: string }> {
  if (field === 'titleContains') return [{ value: 'contains', label: 'contains' }];
  if (field === 'publishedWithinDays') return [{ value: 'within', label: 'within last (days)' }];
  return [
    { value: 'is', label: 'is' },
    { value: 'is_not', label: 'is not' },
  ];
}

export function slugifyCollection(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseCollectionSortOrder(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

export function toggleProductSlug(list: string[], slug: string): string[] {
  return list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
}

export function detailToForm(
  c: CollectionDetail,
  productSlugs: string[] = [],
): CollectionFormState {
  return {
    title: c.title,
    slug: c.slug,
    description: c.description ?? '',
    sortOrder: String(c.sortOrder),
    status: c.status,
    membershipMode: c.membershipMode,
    smartRules: c.smartRules?.conditions?.length ? c.smartRules : EMPTY_SMART,
    overline: c.overline ?? '',
    lockedLabel: c.lockedLabel ?? '',
    accent: (c.accent as 'pink' | 'sky' | 'neutral') || 'neutral',
    heroImageUrl: c.heroImageUrl ?? '',
    heroImageAlt: c.heroImageAlt ?? '',
    relatedSlugs: (c.relatedSlugs ?? []).join(', '),
    productSlugs,
    seoTitle: c.seoTitle ?? '',
    seoDescription: c.seoDescription ?? '',
    canonicalPath: c.canonicalPath ?? '',
    ogImageUrl: c.ogImageUrl ?? '',
    robotsIndex: c.robotsIndex ?? true,
  };
}

export function formToCollectionBody(form: CollectionFormState) {
  const base = {
    title: form.title.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || undefined,
    sortOrder: parseCollectionSortOrder(form.sortOrder),
    status: form.status,
    membershipMode: form.membershipMode,
    overline: form.overline.trim() || undefined,
    lockedLabel: form.lockedLabel.trim() || undefined,
    accent: form.accent,
    heroImageUrl: form.heroImageUrl.trim() || undefined,
    heroImageAlt: form.heroImageAlt.trim() || undefined,
    relatedSlugs: form.relatedSlugs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    seoTitle: form.seoTitle.trim() || null,
    seoDescription: form.seoDescription.trim() || null,
    canonicalPath: form.canonicalPath.trim() || null,
    ogImageUrl: form.ogImageUrl.trim() || null,
    robotsIndex: form.robotsIndex,
  };
  if (form.membershipMode === 'SMART') {
    return {
      ...base,
      smartRules: {
        match: form.smartRules.match,
        conditions: form.smartRules.conditions.filter((c) => c.value.trim()),
      },
      productSlugs: undefined,
    };
  }
  return {
    ...base,
    smartRules: null,
    productSlugs: form.productSlugs,
  };
}

export function conditionPlainLabel(c: SmartCondition): string {
  const field = SMART_FIELD_OPTS.find((f) => f.value === c.field)?.label ?? c.field;
  const ops = smartOpOptions(c.field);
  const op = ops.find((o) => o.value === c.op)?.label ?? c.op;
  const vals = smartValueOptions(c.field);
  const value = vals?.find((v) => v.value === c.value)?.label ?? c.value;
  return `${field} ${op} ${value}`;
}
