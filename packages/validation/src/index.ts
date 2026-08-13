import { z } from 'zod';

/** Shared health/version response shapes */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export const readyResponseSchema = z.object({
  status: z.enum(['ready', 'degraded']),
  checks: z.object({
    database: z.boolean(),
    redis: z.boolean(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ReadyResponse = z.infer<typeof readyResponseSchema>;

/** Phase 1 — email/password auth */
export const registerBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(120).optional(),
});

export const loginBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(128),
});

export const updateProfileBodySchema = z.object({
  displayName: z.string().trim().min(1).max(120),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const forgotPasswordBodySchema = z.object({
  email: z.string().email().max(320),
});

export const resetPasswordBodySchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8).max(128),
});

export const testSendMailBodySchema = z.object({
  to: z.string().email().max(320),
  subject: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(5000),
});

export const mediaListQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const updateMediaBodySchema = z.object({
  altText: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(200).nullable().optional(),
  ),
  originalName: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().trim().max(255).nullable().optional(),
  ),
});

export type UpdateMediaBody = z.infer<typeof updateMediaBodySchema>;

export const upsertFeatureFlagBodySchema = z.object({
  enabled: z.boolean(),
  description: z.string().trim().max(500).nullable().optional(),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>;
export type TestSendMailBody = z.infer<typeof testSendMailBodySchema>;
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
export type UpsertFeatureFlagBody = z.infer<typeof upsertFeatureFlagBodySchema>;

/** Product gallery / hamper / OG URLs — absolute http(s) or same-origin public path. */
const productAssetUrlSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (s) =>
      /^https?:\/\//i.test(s) || (s.startsWith('/') && !s.startsWith('//') && !s.includes('..')),
    'Must be http(s) URL or same-origin path',
  );

export const productMediaInputSchema = z.object({
  url: productAssetUrlSchema,
  altText: z.string().max(200).optional(),
  kind: z.enum(['IMAGE', 'VIDEO']).optional(),
  posterUrl: productAssetUrlSchema.optional(),
  sortOrder: z.number().int().optional(),
});

const emptySeoToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

/** Phase 2 — catalog admin + storefront queries */
export const createProductBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  /** Collection membership via ProductCollection joins. */
  collectionSlugs: z.array(z.string()).optional(),
  recipientTags: z.array(z.enum(['girl', 'boy', 'mom', 'unisex'])).optional(),
  ageBands: z.array(z.enum(['newborn', 'infant', 'toddler', 'any'])).optional(),
  occasionTags: z.array(z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday'])).optional(),
  isReadyMadeHamper: z.boolean().optional(),
  brandName: z.string().max(120).optional(),
  storefrontLabels: z
    .array(z.enum(['BESTSELLER', 'EDITORS_PICK', 'GIFT_SET']))
    .max(2)
    .optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1).max(64),
        label: z.string().min(1).max(120),
        pricePaise: z.number().int().min(0),
        compareAtPricePaise: z.number().int().min(0).nullable().optional(),
        onHand: z.number().int().min(0).default(0),
        giftBoxEligible: z.boolean().optional(),
      }),
    )
    .min(1),
  media: z.array(productMediaInputSchema).max(24).optional(),
  seoTitle: z.preprocess(emptySeoToNull, z.string().max(200).nullable().optional()),
  seoDescription: z.preprocess(emptySeoToNull, z.string().max(500).nullable().optional()),
  canonicalPath: z.preprocess(emptySeoToNull, z.string().max(300).nullable().optional()),
  ogImageUrl: z.preprocess(emptySeoToNull, productAssetUrlSchema.nullable().optional()),
  robotsIndex: z.boolean().optional(),
  personalization: z
    .array(
      z.object({
        key: z.string().min(1).max(64),
        label: z.string().min(1).max(120),
        type: z.enum(['TEXT', 'SELECT']).optional(),
        maxLength: z.number().int().positive().optional(),
        options: z.array(z.string()).optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
});

export const productFaqItemSchema = z.object({
  question: z.string().min(1).max(300),
  answerText: z.string().min(1).max(4000),
});

export const productSeoSectionSchema = z.object({
  /** Empty when body is a single rich-text HTML document. */
  heading: z.string().max(200).optional().default(''),
  bodyText: z.string().min(1).max(50000),
});

export const productHamperItemSchema = z.object({
  title: z.string().min(1).max(200),
  blurb: z.string().max(400).optional(),
  brandName: z.string().max(120).optional(),
  imageUrl: productAssetUrlSchema.optional(),
  qty: z.number().int().min(1).max(99).default(1),
  unitPricePaise: z.number().int().min(0),
  sortOrder: z.number().int().min(0).optional(),
});

/** Schema.org admin extras — guided presets + custom JSON-LD */
export const SEO_SCHEMA_PRESETS = [
  'HowTo',
  'Organization',
  'BreadcrumbList',
  'Person',
  'ImageObject',
  'FAQPage',
  'ItemList',
] as const;

export type SeoSchemaPreset = (typeof SEO_SCHEMA_PRESETS)[number];

export const SEO_SCHEMA_EXTRAS_MAX_ENTRIES = 8;
export const SEO_SCHEMA_EXTRAS_MAX_BYTES = 24_000;

/** Types that must come from verified system builders — never admin custom/preset overrides. */
export const SEO_SCHEMA_FORBIDDEN_OVERRIDE_TYPES = [
  'Product',
  'Offer',
  'AggregateOffer',
  'AggregateRating',
  'Article',
  'BlogPosting',
] as const;

const seoHowToFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  steps: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        text: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
});

const seoOrganizationFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(500).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  description: z.string().trim().max(1000).optional(),
});

const seoBreadcrumbFieldsSchema = z.object({
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        url: z.string().trim().min(1).max(500),
      }),
    )
    .min(1)
    .max(20),
});

const seoPersonFieldsSchema = z.object({
  name: z.string().trim().min(1).max(200),
  jobTitle: z.string().trim().max(200).optional(),
  url: z.string().trim().url().max(500).optional(),
  imageUrl: z.string().trim().max(500).optional(),
});

const seoImageObjectFieldsSchema = z.object({
  url: z.string().trim().min(1).max(500),
  caption: z.string().trim().max(300).optional(),
  width: z.number().int().positive().max(10_000).optional(),
  height: z.number().int().positive().max(10_000).optional(),
});

const seoFaqPageFieldsSchema = z.object({
  items: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(300),
        answerText: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(20),
});

const seoItemListFieldsSchema = z.object({
  name: z.string().trim().max(200).optional(),
  items: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        url: z.string().trim().min(1).max(500),
      }),
    )
    .min(1)
    .max(40),
});

export const seoSchemaPresetFieldsSchemas = {
  HowTo: seoHowToFieldsSchema,
  Organization: seoOrganizationFieldsSchema,
  BreadcrumbList: seoBreadcrumbFieldsSchema,
  Person: seoPersonFieldsSchema,
  ImageObject: seoImageObjectFieldsSchema,
  FAQPage: seoFaqPageFieldsSchema,
  ItemList: seoItemListFieldsSchema,
} as const;

const seoSchemaCustomJsonSchema = z
  .record(z.unknown())
  .refine((obj) => Object.keys(obj).length > 0, { message: 'Custom JSON cannot be empty' })
  .refine(
    (obj) => {
      const types = collectSeoJsonTypes(obj);
      return types.length > 0;
    },
    { message: 'Custom JSON must include @type' },
  );

const seoSchemaPresetEntrySchema = z.discriminatedUnion('preset', [
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('HowTo'),
    fields: seoHowToFieldsSchema,
  }),
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('Organization'),
    fields: seoOrganizationFieldsSchema,
  }),
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('BreadcrumbList'),
    fields: seoBreadcrumbFieldsSchema,
  }),
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('Person'),
    fields: seoPersonFieldsSchema,
  }),
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('ImageObject'),
    fields: seoImageObjectFieldsSchema,
  }),
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('FAQPage'),
    fields: seoFaqPageFieldsSchema,
  }),
  z.object({
    id: z.string().uuid(),
    enabled: z.boolean(),
    mode: z.literal('preset'),
    preset: z.literal('ItemList'),
    fields: seoItemListFieldsSchema,
  }),
]);

const seoSchemaCustomEntrySchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
  mode: z.literal('custom'),
  json: seoSchemaCustomJsonSchema,
});

/** Full JSON-LD document that replaces system auto schema (Product PDP manual mode). */
const seoSchemaReplaceJsonSchema = z.record(z.unknown()).refine(
  (obj) => {
    if (Array.isArray(obj['@graph']) && obj['@graph'].length > 0) return true;
    return collectSeoJsonTypes(obj).length > 0;
  },
  { message: 'Manual schema needs @graph or @type' },
);

const seoSchemaReplaceEntrySchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
  mode: z.literal('replace'),
  json: seoSchemaReplaceJsonSchema,
});

export const seoSchemaEntrySchema = z.union([
  seoSchemaPresetEntrySchema,
  seoSchemaCustomEntrySchema,
  seoSchemaReplaceEntrySchema,
]);

export type SeoSchemaEntry = z.infer<typeof seoSchemaEntrySchema>;

function collectSeoJsonTypes(node: unknown, out: string[] = []): string[] {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node)) {
    for (const item of node) collectSeoJsonTypes(item, out);
    return out;
  }
  const obj = node as Record<string, unknown>;
  const typeVal = obj['@type'];
  if (typeof typeVal === 'string') out.push(typeVal);
  else if (Array.isArray(typeVal)) {
    for (const t of typeVal) if (typeof t === 'string') out.push(t);
  }
  if (Array.isArray(obj['@graph'])) {
    for (const g of obj['@graph']) collectSeoJsonTypes(g, out);
  }
  return out;
}

export function collectSeoSchemaEntryTypes(entry: SeoSchemaEntry): string[] {
  if (entry.mode === 'preset') return [entry.preset];
  return collectSeoJsonTypes(entry.json);
}

export type SeoSchemaExtrasParseOptions = {
  /** When true, FAQPage extras are rejected (system FAQ already emits FAQPage). */
  hasSystemFaq?: boolean;
};

function refineSeoSchemaExtras(
  entries: SeoSchemaEntry[],
  ctx: z.RefinementCtx,
  opts?: SeoSchemaExtrasParseOptions,
) {
  const serialized = JSON.stringify(entries);
  if (serialized.length > SEO_SCHEMA_EXTRAS_MAX_BYTES) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Schema extras exceed ${SEO_SCHEMA_EXTRAS_MAX_BYTES} bytes`,
    });
  }
  const replaceCount = entries.filter((e) => e.mode === 'replace').length;
  if (replaceCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only one manual schema replace entry is allowed',
    });
  }
  if (replaceCount === 1 && entries.length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Manual replace schema cannot be mixed with extras',
    });
  }
  const forbidden = new Set<string>(SEO_SCHEMA_FORBIDDEN_OVERRIDE_TYPES);
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    // Replace mode intentionally owns Product/FAQPage (and other) types.
    if (entry.mode === 'replace') continue;
    const types = collectSeoSchemaEntryTypes(entry);
    for (const t of types) {
      if (forbidden.has(t)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i],
          message: `${t} must come from system data — remove from custom/preset schema`,
        });
      }
      if (opts?.hasSystemFaq && t === 'FAQPage') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [i],
          message: 'FAQ schema is already generated from page FAQs — edit FAQ content instead',
        });
      }
    }
  }
}

export const seoSchemaExtrasSchema = z
  .array(seoSchemaEntrySchema)
  .max(SEO_SCHEMA_EXTRAS_MAX_ENTRIES)
  .superRefine((entries, ctx) => refineSeoSchemaExtras(entries, ctx));

/** Optional/nullable field for update bodies. */
export const seoSchemaExtrasNullableSchema = z.preprocess(
  (v) => v,
  z
    .array(seoSchemaEntrySchema)
    .max(SEO_SCHEMA_EXTRAS_MAX_ENTRIES)
    .nullable()
    .optional()
    .superRefine((entries, ctx) => {
      if (!entries) return;
      refineSeoSchemaExtras(entries, ctx);
    }),
);

/**
 * Parse extras with surface-specific conflict rules (e.g. system FAQ present).
 * Use in services after Zod body parse when `hasSystemFaq` matters.
 */
export function parseSeoSchemaExtras(
  raw: unknown,
  opts?: SeoSchemaExtrasParseOptions,
): SeoSchemaEntry[] | null {
  if (raw === null) return null;
  if (raw === undefined) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: 'seoSchemaExtras is required when calling parseSeoSchemaExtras',
        path: [],
      },
    ]);
  }
  const base = seoSchemaExtrasSchema.parse(raw);
  if (opts?.hasSystemFaq) {
    return z
      .array(seoSchemaEntrySchema)
      .max(SEO_SCHEMA_EXTRAS_MAX_ENTRIES)
      .superRefine((entries, ctx) => refineSeoSchemaExtras(entries, ctx, opts))
      .parse(base);
  }
  return base;
}

export type SeoSchemaExtras = z.infer<typeof seoSchemaExtrasSchema>;

export const updateProductBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  collectionSlugs: z.array(z.string()).optional(),
  recipientTags: z.array(z.enum(['girl', 'boy', 'mom', 'unisex'])).optional(),
  ageBands: z.array(z.enum(['newborn', 'infant', 'toddler', 'any'])).optional(),
  occasionTags: z.array(z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday'])).optional(),
  isReadyMadeHamper: z.boolean().optional(),
  brandName: z.string().max(120).nullable().optional(),
  storefrontLabels: z
    .array(z.enum(['BESTSELLER', 'EDITORS_PICK', 'GIFT_SET']))
    .max(2)
    .optional(),
  seoTitle: z.preprocess(emptySeoToNull, z.string().max(200).nullable().optional()),
  seoDescription: z.preprocess(emptySeoToNull, z.string().max(500).nullable().optional()),
  canonicalPath: z.preprocess(emptySeoToNull, z.string().max(300).nullable().optional()),
  ogImageUrl: z.preprocess(emptySeoToNull, productAssetUrlSchema.nullable().optional()),
  robotsIndex: z.boolean().optional(),
  faqItems: z.array(productFaqItemSchema).max(20).nullable().optional(),
  seoSections: z.array(productSeoSectionSchema).max(12).nullable().optional(),
  /** Admin Schema.org extras (presets + custom JSON-LD). Null clears. */
  seoSchemaExtras: seoSchemaExtrasNullableSchema,
  /** Replace display BOM when provided (null clears). */
  hamperItems: z.array(productHamperItemSchema).max(40).nullable().optional(),
  /** Replace media gallery when provided. */
  media: z.array(productMediaInputSchema).max(24).optional(),
});

export const updateInventoryBodySchema = z.object({
  onHand: z.number().int().min(0),
});

/** OPS-3 — relative stock adjust with reason */
export const inventoryAdjustBodySchema = z.object({
  delta: z
    .number()
    .int()
    .refine((n) => n !== 0, { message: 'delta must be non-zero' }),
  reason: z.enum(['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION']),
  note: z.string().trim().max(500).optional(),
});

export const inventoryImportRowSchema = z.object({
  sku: z.string().trim().min(1).max(80),
  delta: z
    .number()
    .int()
    .refine((n) => n !== 0, { message: 'delta must be non-zero' }),
  reason: z.enum(['RECEIVE', 'DAMAGE', 'RECOUNT', 'CORRECTION']),
  note: z.string().trim().max(500).optional(),
});

export const inventoryImportBodySchema = z.object({
  dryRun: z.boolean().default(true),
  rows: z.array(inventoryImportRowSchema).min(1).max(500),
});

/** OPS-9 P1 — product create CSV (integer paise) */
export const productImportRowSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  title: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(64),
  pricePaise: z.number().int().min(0),
  onHand: z.number().int().min(0).default(0),
  description: z.string().trim().max(5000).optional(),
  compareAtPaise: z.number().int().min(0).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  imageUrl: productAssetUrlSchema.optional(),
  label: z.string().trim().min(1).max(120).default('Default'),
});

export const productImportBodySchema = z.object({
  dryRun: z.boolean().default(true),
  rows: z.array(productImportRowSchema).min(1).max(100),
});

export type ProductImportBody = z.infer<typeof productImportBodySchema>;
export type ProductImportRow = z.infer<typeof productImportRowSchema>;

/** OPS-10 — procurement */
export const createSupplierBodySchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/i, 'code must be alphanumeric with hyphens')
    .transform((s) => s.toUpperCase()),
  name: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(320).optional(),
  phone: z.string().trim().min(8).max(20).optional(),
  city: z.string().trim().min(1).max(80).optional(),
  state: z.string().trim().min(2).max(40).optional(),
  gstin: z.string().trim().min(10).max(20).optional(),
  notes: z.string().trim().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export const updateSupplierBodySchema = createSupplierBodySchema
  .partial()
  .refine((b) => Object.keys(b).length > 0, { message: 'At least one field required' });

export const purchaseOrderLineInputSchema = z.object({
  variantId: z.string().uuid(),
  quantityOrdered: z.number().int().min(1).max(100_000),
  unitCostPaise: z.number().int().min(0),
});

export const createPurchaseOrderBodySchema = z.object({
  supplierId: z.string().uuid(),
  notes: z.string().trim().max(1000).optional(),
  lines: z.array(purchaseOrderLineInputSchema).min(1).max(100),
});

export const adminPurchaseOrdersQuerySchema = z.object({
  status: z.enum(['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED']).optional(),
  supplierId: z.string().uuid().optional(),
  q: z.string().trim().min(1).max(80).optional(),
});

export const adminSuppliersQuerySchema = z.object({
  q: z.string().trim().min(1).max(80).optional(),
  active: z.enum(['1', '0', 'true', 'false']).optional(),
});

export type CreateSupplierBody = z.infer<typeof createSupplierBodySchema>;
export type UpdateSupplierBody = z.infer<typeof updateSupplierBodySchema>;
export type CreatePurchaseOrderBody = z.infer<typeof createPurchaseOrderBodySchema>;
export type AdminPurchaseOrdersQuery = z.infer<typeof adminPurchaseOrdersQuerySchema>;
export type AdminSuppliersQuery = z.infer<typeof adminSuppliersQuerySchema>;

export const bulkOrdersBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED']),
  carrier: z.string().trim().min(1).max(80).optional(),
  trackingNumber: z.string().trim().min(1).max(120).optional(),
  note: z.string().trim().min(1).max(500).optional(),
});

export type InventoryAdjustBody = z.infer<typeof inventoryAdjustBodySchema>;
export type InventoryImportBody = z.infer<typeof inventoryImportBodySchema>;
export type BulkOrdersBody = z.infer<typeof bulkOrdersBodySchema>;

export const adminInventoryQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  lowStock: z
    .union([z.literal('1'), z.literal('true'), z.literal('0'), z.literal('false')])
    .optional(),
  threshold: z.coerce.number().int().min(0).max(100).optional(),
});

export type AdminInventoryQuery = z.infer<typeof adminInventoryQuerySchema>;

/** Admin: set/clear MRP (compare-at) on a variant */
export const updateVariantBodySchema = z.object({
  compareAtPricePaise: z.number().int().min(0).nullable(),
});

const collectionSlugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** Shopify-like smart collection condition (admin builder — no freeform JSON). */
export const smartConditionFieldSchema = z.enum([
  'recipient',
  'age',
  'occasion',
  'hamper',
  'label',
  'onSale',
  'titleContains',
  'publishedWithinDays',
]);

export const smartConditionOpSchema = z.enum(['is', 'is_not', 'contains', 'within']);

export const smartConditionSchema = z.object({
  field: smartConditionFieldSchema,
  op: smartConditionOpSchema,
  value: z.string().min(1).max(120),
});

export const smartRulesSchema = z.object({
  /** Shopify: products must match all / any conditions */
  match: z.enum(['all', 'any']).default('all'),
  conditions: z.array(smartConditionSchema).max(12),
});

export const createCollectionBodySchema = z
  .object({
    slug: collectionSlugSchema,
    title: z.string().min(1).max(160),
    description: z.string().max(1000).optional(),
    overline: z.string().max(80).optional(),
    heroImageUrl: z.string().max(500).optional(),
    heroImageAlt: z.string().max(200).optional(),
    accent: z.enum(['pink', 'sky', 'neutral']).optional(),
    sortOrder: z.number().int().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    membershipMode: z.enum(['MANUAL', 'SMART']).optional(),
    smartRules: smartRulesSchema.nullable().optional(),
    relatedSlugs: z.array(collectionSlugSchema).max(12).optional(),
    lockedLabel: z.string().max(80).optional(),
    /** MANUAL only: product slugs to assign. */
    productSlugs: z.array(z.string().max(120)).max(200).optional(),
    seoTitle: z.preprocess(emptySeoToNull, z.string().max(200).nullable().optional()),
    seoDescription: z.preprocess(emptySeoToNull, z.string().max(500).nullable().optional()),
    canonicalPath: z.preprocess(emptySeoToNull, z.string().max(300).nullable().optional()),
    ogImageUrl: z.preprocess(emptySeoToNull, productAssetUrlSchema.nullable().optional()),
    robotsIndex: z.boolean().optional(),
  })
  .superRefine((b, ctx) => {
    const mode = b.membershipMode ?? 'MANUAL';
    if (mode === 'SMART') {
      if (!b.smartRules?.conditions?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Smart collections need at least one condition.',
          path: ['smartRules'],
        });
      }
      if (b.productSlugs?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Smart collections cannot assign productSlugs.',
          path: ['productSlugs'],
        });
      }
    }
  });

/** Admin: partial update for catalog collections desk. */
export const updateCollectionBodySchema = z
  .object({
    slug: collectionSlugSchema.optional(),
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(1000).nullable().optional(),
    overline: z.string().max(80).nullable().optional(),
    heroImageUrl: z.string().max(500).nullable().optional(),
    heroImageAlt: z.string().max(200).nullable().optional(),
    accent: z.enum(['pink', 'sky', 'neutral']).optional(),
    sortOrder: z.number().int().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
    membershipMode: z.enum(['MANUAL', 'SMART']).optional(),
    smartRules: smartRulesSchema.nullable().optional(),
    relatedSlugs: z.array(collectionSlugSchema).max(12).optional(),
    lockedLabel: z.string().max(80).nullable().optional(),
    productSlugs: z.array(z.string().max(120)).max(200).optional(),
    seoTitle: z.preprocess(emptySeoToNull, z.string().max(200).nullable().optional()),
    seoDescription: z.preprocess(emptySeoToNull, z.string().max(500).nullable().optional()),
    canonicalPath: z.preprocess(emptySeoToNull, z.string().max(300).nullable().optional()),
    ogImageUrl: z.preprocess(emptySeoToNull, productAssetUrlSchema.nullable().optional()),
    robotsIndex: z.boolean().optional(),
  })
  .refine(
    (b) =>
      b.slug !== undefined ||
      b.title !== undefined ||
      b.description !== undefined ||
      b.overline !== undefined ||
      b.heroImageUrl !== undefined ||
      b.heroImageAlt !== undefined ||
      b.accent !== undefined ||
      b.sortOrder !== undefined ||
      b.status !== undefined ||
      b.membershipMode !== undefined ||
      b.smartRules !== undefined ||
      b.relatedSlugs !== undefined ||
      b.lockedLabel !== undefined ||
      b.productSlugs !== undefined ||
      b.seoTitle !== undefined ||
      b.seoDescription !== undefined ||
      b.canonicalPath !== undefined ||
      b.ogImageUrl !== undefined ||
      b.robotsIndex !== undefined,
    { message: 'At least one field is required' },
  );

export const catalogListQuerySchema = z.object({
  q: z.string().max(120).optional(),
  collection: z.string().max(80).optional(),
  recipient: z.enum(['girl', 'boy', 'mom', 'unisex']).optional(),
  age: z.enum(['newborn', 'infant', 'toddler', 'any']).optional(),
  occasion: z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday']).optional(),
  hamper: z.enum(['0', '1']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
  /** Manual storefront ribbon filter (homepage merchandising / PLP). */
  storefrontLabel: z.enum(['BESTSELLER', 'EDITORS_PICK', 'GIFT_SET']).optional(),
  /** Any variant with compareAtPricePaise > pricePaise. */
  onSale: z.enum(['0', '1']).optional(),
  /** ISO date — products published on/after (New Arrivals). */
  publishedSince: z.string().datetime().optional(),
  /** Max from-price in paise (budget chips on collection PLP). */
  maxPricePaise: z.coerce.number().int().positive().max(10_000_000).optional(),
});

export const wishlistAddBodySchema = z.object({
  variantId: z.string().uuid(),
});

export const giftBoxCreateBodySchema = z.object({
  name: z.string().min(1).max(120).optional(),
  budgetPaise: z.number().int().min(0).optional(),
  recipient: z.enum(['girl', 'boy', 'mom', 'unisex']).nullable().optional(),
  ageBand: z.enum(['newborn', 'infant', 'toddler', 'any']).nullable().optional(),
  occasion: z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday']).nullable().optional(),
  collectionSlugs: z.array(z.string().max(80)).max(12).optional(),
  wizardStep: z.number().int().min(1).max(6).optional(),
});

export const giftBoxAddItemBodySchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
  personalization: z.record(z.string()).optional(),
});

export const giftingInquiryBodySchema = z.object({
  type: z.enum(['corporate', 'bulk']),
  fullName: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(8).max(20).optional(),
  company: z.string().max(160).optional(),
  message: z.string().min(1).max(2000),
  estimatedQty: z.number().int().min(1).max(100000).optional(),
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
export type UpdateVariantBody = z.infer<typeof updateVariantBodySchema>;
export type CreateCollectionBody = z.infer<typeof createCollectionBodySchema>;
export type UpdateCollectionBody = z.infer<typeof updateCollectionBodySchema>;
export type SmartRules = z.infer<typeof smartRulesSchema>;
export type SmartCondition = z.infer<typeof smartConditionSchema>;
export type GiftingInquiryBody = z.infer<typeof giftingInquiryBodySchema>;

/** Phase 3 — cart, checkout, orders */
export const addressBodySchema = z.object({
  label: z.string().max(40).optional(),
  fullName: z.string().min(1).max(120),
  phone: z.string().min(8).max(20),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(3).max(12),
  country: z.string().length(2).default('IN'),
  isDefault: z.boolean().optional(),
});

export const cartAddItemBodySchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99).default(1),
  personalization: z.record(z.string()).optional(),
});

export const cartUpdateItemBodySchema = z.object({
  quantity: z.number().int().min(1).max(99),
});

export const cartCouponBodySchema = z.object({
  code: z.string().min(1).max(40),
});

export const checkoutPreviewBodySchema = z.object({
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']),
  couponCode: z.string().max(40).optional(),
});

export const checkoutPlaceOrderBodySchema = z.object({
  shippingMethod: z.enum(['STANDARD', 'EXPRESS']),
  shippingAddress: addressBodySchema,
  billingAddress: addressBodySchema.optional(),
  giftMessage: z.string().max(500).optional(),
  giftWrap: z.boolean().optional(),
  couponCode: z.string().max(40).optional(),
  saveAddress: z.boolean().optional(),
});

export const mockPaymentWebhookBodySchema = z.object({
  eventId: z.string().min(1).max(120),
  paymentId: z.string().uuid(),
  status: z.enum(['CAPTURED', 'FAILED']),
});

export type AddressBody = z.infer<typeof addressBodySchema>;
export type CheckoutPlaceOrderBody = z.infer<typeof checkoutPlaceOrderBodySchema>;

/** Phase 4 — commerce ops */
export const orderNoteBodySchema = z.object({
  body: z.string().min(1).max(2000),
});

export const adminOrderStatusSchema = z.object({
  status: z.enum(['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  carrier: z.string().trim().min(1).max(80).optional(),
  trackingNumber: z.string().trim().min(1).max(120).optional(),
  note: z.string().trim().min(1).max(500).optional(),
});

export const adminOrdersQuerySchema = z.object({
  status: z.string().max(120).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
  payment: z.enum(['FAILED', 'CAPTURED', 'PENDING', 'REFUNDED']).optional(),
  /** Opaque keyset cursor from previous page `nextCursor`. */
  cursor: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export type AdminOrderStatusBody = z.infer<typeof adminOrderStatusSchema>;
export type AdminOrdersQuery = z.infer<typeof adminOrdersQuerySchema>;

const couponUuidList = z.array(z.string().uuid()).max(50);

export const createCouponBodySchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/i),
    description: z.string().max(200).optional(),
    discountPaise: z.number().int().min(1).optional(),
    discountPercent: z.number().int().min(1).max(100).optional(),
    minSubtotalPaise: z.number().int().min(0).optional(),
    maxUses: z.number().int().min(1).optional(),
    active: z.boolean().optional(),
    /** ISO or datetime-local string */
    startsAt: z.string().trim().min(1).max(40).optional(),
    expiresAt: z.string().trim().min(1).max(40).optional(),
    /** CART (default) | PRODUCT | COLLECTION — COLLECTION matches MANUAL joins only. */
    scope: z.enum(['CART', 'PRODUCT', 'COLLECTION']).optional().default('CART'),
    productIds: couponUuidList.optional(),
    collectionIds: couponUuidList.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.discountPaise == null && v.discountPercent == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide discountPaise or discountPercent.',
        path: ['discountPaise'],
      });
    }
    const scope = v.scope ?? 'CART';
    if (scope === 'PRODUCT' && !v.productIds?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one product for a product coupon.',
        path: ['productIds'],
      });
    }
    if (scope === 'COLLECTION' && !v.collectionIds?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select at least one collection for a collection coupon.',
        path: ['collectionIds'],
      });
    }
  });

export const couponActiveBodySchema = z.object({
  active: z.boolean(),
});

const couponPreviewLineSchema = z.object({
  productId: z.string().uuid(),
  collectionIds: couponUuidList.default([]),
  lineTotalPaise: z.number().int().min(0),
});

export const couponPreviewBodySchema = z.object({
  subtotalPaise: z.number().int().min(0),
  code: z.string().trim().min(2).max(40).optional(),
  discountPaise: z.number().int().min(1).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  minSubtotalPaise: z.number().int().min(0).optional(),
  scope: z.enum(['CART', 'PRODUCT', 'COLLECTION']).optional(),
  productIds: couponUuidList.optional(),
  collectionIds: couponUuidList.optional(),
  /** Optional cart lines — when omitted, scoped drafts use subtotalPaise as eligible. */
  lines: z.array(couponPreviewLineSchema).max(100).optional(),
});

export type CreateCouponBody = z.infer<typeof createCouponBodySchema>;
export type CouponActiveBody = z.infer<typeof couponActiveBodySchema>;
export type CouponPreviewBody = z.infer<typeof couponPreviewBodySchema>;

/** Admin promotions list — keyset cursor (createdAt DESC). */
export const adminCouponsQuerySchema = z.object({
  cursor: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export type AdminCouponsQuery = z.infer<typeof adminCouponsQuerySchema>;

export const adminReportsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;

export const adminSearchQuerySchema = z.object({
  q: z.string().min(1).max(120),
});

export const storefrontConfigBodySchema = z.object({
  featuredSlugs: z.array(z.string().min(1).max(120)).max(12),
  heroTitle: z.string().max(120).optional(),
  heroSubtitle: z.string().max(300).optional(),
});

export const customerStatusBodySchema = z.object({
  isActive: z.boolean(),
});

export const adminCustomersQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['active', 'suspended']).optional(),
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export type AdminCustomersQuery = z.infer<typeof adminCustomersQuerySchema>;

/** OPS-5 P1 — internal communication log (no provider send) */
export const customerCommunicationBodySchema = z.object({
  channel: z.enum(['EMAIL', 'SMS', 'INTERNAL', 'SYSTEM']),
  templateKey: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9][a-z0-9._-]*$/i, 'templateKey must be alphanumeric with ._-'),
  subject: z.string().trim().min(1).max(200).optional(),
  /** Log-only stub: SENT/FAILED reserved for future providers */
  status: z.enum(['LOGGED', 'SKIPPED']).default('LOGGED'),
});

export type CustomerCommunicationBody = z.infer<typeof customerCommunicationBodySchema>;

/** Phase 5 — reviews */
export const createReviewBodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  headline: z.string().trim().min(1).max(120).optional(),
  body: z.string().trim().min(10).max(4000),
});

export const moderateReviewBodySchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  moderationNote: z.string().trim().max(500).optional(),
});

/** Admin reviews desk — keyset cursor (createdAt DESC). */
export const adminReviewsQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  cursor: z.string().trim().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;
export type ModerateReviewBody = z.infer<typeof moderateReviewBodySchema>;
export type AdminReviewsQuery = z.infer<typeof adminReviewsQuerySchema>;

/** Phase 5 — returns */
export const createReturnBodySchema = z.object({
  reason: z.string().trim().min(5).max(1000),
});

export const moderateReturnBodySchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  adminNote: z.string().trim().max(500).optional(),
});

export const returnPolicyBodySchema = z.object({
  windowDays: z.number().int().min(1).max(365),
});

export const dashboardAlertPrefsSchema = z.object({
  failedPayments: z.boolean(),
  awaitingProcess: z.boolean(),
  pendingShip: z.boolean(),
  openReturns: z.boolean(),
  lowStock: z.boolean(),
});

export const pdpTrustCueIconSchema = z.enum(['lock', 'returns', 'gift']);

export const pdpTrustCueSchema = z.object({
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(200),
  icon: pdpTrustCueIconSchema,
});

export const pdpTrustCuesSchema = z.array(pdpTrustCueSchema).min(1).max(6);

export const commercePolicyBodySchema = z
  .object({
    returnWindowDays: z.number().int().min(1).max(365).optional(),
    lowStockThreshold: z.number().int().min(0).max(1000).optional(),
    shippingDisplayCopy: z.string().trim().min(1).max(500).optional(),
    dashboardAlertPrefs: dashboardAlertPrefsSchema.optional(),
    trustCues: pdpTrustCuesSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.returnWindowDays == null &&
      v.lowStockThreshold == null &&
      v.shippingDisplayCopy == null &&
      v.dashboardAlertPrefs == null &&
      v.trustCues == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide at least one policy field.',
      });
    }
  });

export const adminAuditQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  resource: z.string().trim().min(1).max(120).optional(),
  resourceId: z.string().trim().min(1).max(80).optional(),
  actorId: z.string().uuid().optional(),
  from: z.string().trim().min(1).max(40).optional(),
  to: z.string().trim().min(1).max(40).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export type CommercePolicyBody = z.infer<typeof commercePolicyBodySchema>;
export type DashboardAlertPrefs = z.infer<typeof dashboardAlertPrefsSchema>;
export type PdpTrustCue = z.infer<typeof pdpTrustCueSchema>;
export type AdminAuditQuery = z.infer<typeof adminAuditQuerySchema>;

export type CreateReturnBody = z.infer<typeof createReturnBodySchema>;
export type ModerateReturnBody = z.infer<typeof moderateReturnBodySchema>;

/** HTTP(S), media library content path, or same-origin public asset path (jpg/png/webp/gif/avif/svg…). */
export const cmsMediaUrlSchema = z
  .string()
  .min(1)
  .max(500)
  .refine(
    (s) => {
      if (
        /^\/api\/v1\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/content$/i.test(
          s,
        )
      ) {
        return true;
      }
      // Same-origin static / public paths (e.g. /gift/media/gift-box.svg) — no // or ..
      if (s.startsWith('/') && !s.startsWith('//') && !s.includes('..') && s.length <= 500) {
        return /^\/[\w./@%~+-]+$/i.test(s);
      }
      try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    {
      message:
        'Must be http(s) URL, /api/v1/media/{id}/content, or a same-origin path like /gift/media/…',
    },
  );

/** Phase 6 — editorial */
export const createArticleBodySchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .optional(),
  assigneeId: z.string().uuid().optional(),
  medicalGateRequired: z.boolean().optional(),
  dueAt: z.string().min(8).max(40).optional(),
  brief: z.string().trim().max(2000).optional(),
});

export const updateArticleBodySchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  body: z.string().max(200_000).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueAt: z.string().min(8).max(40).nullable().optional(),
  /** Cover / OG image — media library, https, or same-origin /gift/media/… (incl. SVG). */
  ogImageUrl: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    cmsMediaUrlSchema.nullable().optional(),
  ),
  /** Admin Schema.org extras (presets + custom JSON-LD). Null clears. */
  seoSchemaExtras: seoSchemaExtrasNullableSchema,
});

export const articleTransitionBodySchema = z.object({
  status: z.enum([
    'ASSIGNED',
    'DRAFT',
    'SEO_REVIEW',
    'MEDICAL_REVIEW',
    'CHANGES_REQUESTED',
    'APPROVED',
  ]),
  note: z.string().trim().max(1000).optional(),
});

export const articleCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
  kind: z.enum(['COMMENT', 'CHANGE_REQUEST']).optional(),
});

export type CreateArticleBody = z.infer<typeof createArticleBodySchema>;
export type UpdateArticleBody = z.infer<typeof updateArticleBodySchema>;
export type ArticleTransitionBody = z.infer<typeof articleTransitionBodySchema>;
export type ArticleCommentBody = z.infer<typeof articleCommentBodySchema>;

/** Phase 7 — publishing */
export const scheduleArticleBodySchema = z.object({
  scheduledAt: z.string().min(8).max(40),
  seoTitle: z.string().trim().min(3).max(120).optional(),
  seoDescription: z.string().trim().min(10).max(320).optional(),
  categorySlug: z.string().min(2).max(80).optional(),
  tagSlugs: z.array(z.string().min(2).max(80)).max(12).optional(),
  specialistSlug: z.string().min(2).max(80).optional(),
  ogImageUrl: cmsMediaUrlSchema.optional(),
});

export const publishArticleBodySchema = z.object({
  seoTitle: z.string().trim().min(3).max(120).optional(),
  seoDescription: z.string().trim().min(10).max(320).optional(),
  categorySlug: z.string().min(2).max(80).optional(),
  tagSlugs: z.array(z.string().min(2).max(80)).max(12).optional(),
  specialistSlug: z.string().min(2).max(80).optional(),
  ogImageUrl: cmsMediaUrlSchema.optional(),
});

export const newsletterSignupBodySchema = z.object({
  email: z.string().email().max(320),
});

export const createSpecialistBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(2).max(120),
  title: z.string().max(160).optional(),
  bio: z.string().max(4000).optional(),
  credentials: z.string().max(500).optional(),
});

export const createEditorialCategoryBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
});

export type ScheduleArticleBody = z.infer<typeof scheduleArticleBodySchema>;
export type PublishArticleBody = z.infer<typeof publishArticleBodySchema>;
export type NewsletterSignupBody = z.infer<typeof newsletterSignupBodySchema>;
export type CreateSpecialistBody = z.infer<typeof createSpecialistBodySchema>;
export type CreateEditorialCategoryBody = z.infer<typeof createEditorialCategoryBodySchema>;

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

/** Leftovers closeout */
export const trackAnalyticsBodySchema = z.object({
  name: z.enum(['view_plp', 'view_pdp', 'add_to_cart', 'begin_checkout', 'purchase']),
  sessionId: z.string().min(8).max(80).optional(),
  path: z.string().max(300).optional(),
  productId: z.string().uuid().optional(),
  orderId: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const bulkProductsBodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(['publish', 'unpublish']),
});

export const adminCatalogListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  /** Available stock vs policy threshold (onHand − reserved). */
  stock: z.enum(['low', 'out', 'in']).optional(),
  /** Ready-made hamper only when `1`. */
  hamper: z.enum(['0', '1']).optional(),
  storefrontLabel: z.enum(['BESTSELLER', 'EDITORS_PICK', 'GIFT_SET']).optional(),
  recipient: z.enum(['girl', 'boy', 'mom', 'unisex']).optional(),
  occasion: z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday']).optional(),
  /** Collection slug (join membership filter on admin desk). */
  collection: z.string().trim().min(1).max(80).optional(),
  sort: z
    .enum(['updated', 'title_asc', 'title_desc', 'created', 'price_asc', 'price_desc'])
    .optional()
    .default('updated'),
  /** Opaque keyset cursor from previous page `nextCursor`. */
  cursor: z.string().trim().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(25),
});

export type TrackAnalyticsBody = z.infer<typeof trackAnalyticsBodySchema>;
export type BulkProductsBody = z.infer<typeof bulkProductsBodySchema>;
export type AdminCatalogListQuery = z.infer<typeof adminCatalogListQuerySchema>;

/** Phase 8 — Creator Collective */
const slugSchema = z
  .string()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const upsertCreatorProfileBodySchema = z.object({
  slug: slugSchema,
  displayName: z.string().trim().min(2).max(120),
  bio: z.string().max(4000).optional(),
  niches: z.array(z.string().min(1).max(40)).max(12).optional(),
  portfolioUrl: z.string().url().max(500).optional(),
});

export const upsertBrandProfileBodySchema = z.object({
  slug: slugSchema,
  companyName: z.string().trim().min(2).max(160),
  bio: z.string().max(4000).optional(),
  websiteUrl: z.string().url().max(500).optional(),
});

export const createCampaignBodySchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: slugSchema.optional(),
  brief: z.string().trim().min(10).max(20_000),
  budgetPaise: z.number().int().min(1000).max(100_000_000),
});

export const submitProposalBodySchema = z.object({
  pitch: z.string().trim().min(20).max(10_000),
  bidPaise: z.number().int().min(1000).max(100_000_000),
});

export const campaignMessageBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export const submitDeliverableBodySchema = z.object({
  title: z.string().trim().min(2).max(200),
  url: z.string().url().max(500).optional(),
  notes: z.string().max(4000).optional(),
});

export const reviewDeliverableBodySchema = z.object({
  status: z.enum(['APPROVED', 'CHANGES_REQUESTED']),
  notes: z.string().max(2000).optional(),
});

export const campaignRatingBodySchema = z.object({
  score: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type UpsertCreatorProfileBody = z.infer<typeof upsertCreatorProfileBodySchema>;
export type UpsertBrandProfileBody = z.infer<typeof upsertBrandProfileBodySchema>;
export type CreateCampaignBody = z.infer<typeof createCampaignBodySchema>;
export type SubmitProposalBody = z.infer<typeof submitProposalBodySchema>;
export type CampaignMessageBody = z.infer<typeof campaignMessageBodySchema>;
export type SubmitDeliverableBody = z.infer<typeof submitDeliverableBodySchema>;
export type ReviewDeliverableBody = z.infer<typeof reviewDeliverableBodySchema>;
export type CampaignRatingBody = z.infer<typeof campaignRatingBodySchema>;

/** Soft Gift storefront homepage — reserved MarketingPage.slug (Phase 11D). */
export const GIFT_HOMEPAGE_SLUG = 'home';

/** Reserved MarketingPage.slug for Soft Gift corporate landing. */
export const GIFT_CORPORATE_SLUG = 'corporate-gifting';

/** Phase 11 — Marketing page builder */
export const pageBlockTypeSchema = z.enum([
  'hero',
  'richText',
  'image',
  'productGrid',
  'cta',
  'spacer',
  'brandStrip',
  'recipientSplit',
  'discoveryChips',
  'buildYourBoxTeaser',
  'articleTeasers',
  'footer',
  'saleStrip',
  'faq',
  'exclusiveOffers',
  'testimonials',
]);

const heroPropsSchema = z.object({
  headline: z.string().min(1).max(200),
  subcopy: z.string().max(1000).optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
  ctaLabel2: z.string().max(80).optional(),
  ctaHref2: z.string().max(500).optional(),
  /** Pipe/middot-separated trust chips, e.g. "A · B · C" */
  trustLine: z.string().max(400).optional(),
  eyebrow: z.string().max(80).optional(),
  imageUrl: cmsMediaUrlSchema.optional(),
  variant: z.enum(['panel', 'storefront']).optional(),
});

const richTextPropsSchema = z.object({
  html: z.string().min(1).max(50_000),
});

const imagePropsSchema = z.object({
  url: cmsMediaUrlSchema,
  alt: z.string().min(1).max(200),
  caption: z.string().max(300).optional(),
});

export const productGridSourceSchema = z.enum([
  'auto',
  'manual',
  'bestsellers',
  'editors',
  'new',
  'on_sale',
]);

const productGridPropsSchema = z.object({
  title: z.string().max(120).optional(),
  overline: z.string().max(80).optional(),
  subtitle: z.string().max(300).optional(),
  /** Resolution mode — see CmsPagesService.resolveProductGridProps. */
  source: productGridSourceSchema.optional(),
  productSlugs: z.array(z.string().max(120)).max(24).optional(),
  collection: z.string().max(80).optional(),
  occasion: z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday']).optional(),
  age: z.enum(['newborn', 'infant', 'toddler', 'any']).optional(),
  recipient: z.enum(['girl', 'boy', 'mom', 'unisex']).optional(),
  hamper: z.boolean().optional(),
  /** Days window when source=new (default 30). */
  newWithinDays: z.number().int().min(1).max(90).optional(),
  limit: z.number().int().min(1).max(24).optional(),
  seeAllHref: z.string().max(500).optional(),
  seeAllLabel: z.string().max(80).optional(),
});

const ctaPropsSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
  variant: z.enum(['primary', 'secondary']).optional(),
  title: z.string().max(120).optional(),
  body: z.string().max(500).optional(),
});

const spacerPropsSchema = z.object({
  size: z.enum(['sm', 'md', 'lg']).default('md'),
});

const brandEntrySchema = z.union([
  z.string().max(80),
  z.object({
    name: z.string().min(1).max(80),
    logoUrl: z.string().max(500).optional(),
  }),
]);

const uspItemSchema = z.object({
  label: z.string().min(1).max(80),
  icon: z.enum(['heart', 'package', 'gift', 'truck', 'shield', 'sparkles']).optional(),
  body: z.string().max(200).optional(),
});

const brandStripPropsSchema = z.object({
  title: z.string().max(120).optional(),
  subtitle: z.string().max(200).optional(),
  brands: z.array(brandEntrySchema).max(24).optional(),
  /** When set, replaces hardcoded USP row under Soft Gift home brand band */
  usps: z.array(uspItemSchema).max(8).optional(),
  showUsps: z.boolean().optional(),
});

const recipientCardSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1).max(500),
  eyebrow: z.string().max(80).optional(),
  blurb: z.string().max(200).optional(),
  cta: z.string().max(80).optional(),
  accent: z.enum(['pink', 'sky']).optional(),
  imageUrl: cmsMediaUrlSchema.optional(),
  imageAlt: z.string().max(200).optional(),
});

const recipientSplitPropsSchema = z.object({
  title: z.string().max(120).optional(),
  subtitle: z.string().max(300).optional(),
  left: recipientCardSchema,
  right: recipientCardSchema,
});

const articleTeasersPropsSchema = z.object({
  overline: z.string().max(80).optional(),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(300).optional(),
  limit: z.number().int().min(1).max(12).optional(),
  seeAllHref: z.string().max(500).optional(),
  seeAllLabel: z.string().max(80).optional(),
  /** Default: hide section when no published articles */
  showEmptyPlaceholder: z.boolean().optional(),
});

const discoveryChipSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1).max(500),
  imageUrl: cmsMediaUrlSchema.optional(),
  imageAlt: z.string().max(200).optional(),
});

const discoveryChipsPropsSchema = z.object({
  overline: z.string().max(80).optional(),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(300).optional(),
  seeAllHref: z.string().max(500).optional(),
  seeAllLabel: z.string().max(80).optional(),
  items: z.array(discoveryChipSchema).min(1).max(8),
});

const buildYourBoxStepSchema = z.object({
  title: z.string().min(1).max(80),
  body: z.string().max(200).optional(),
});

const buildYourBoxTeaserPropsSchema = z.object({
  overline: z.string().max(80).optional(),
  title: z.string().min(1).max(120),
  body: z.string().max(400).optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
  /** Visual for the right panel — JPEG/PNG/WebP/GIF/AVIF/SVG via URL, media library, or /public path. */
  imageUrl: cmsMediaUrlSchema.optional(),
  imageAlt: z.string().max(200).optional(),
  /** How the media fills the right panel. SVG defaults to contain in the storefront. */
  imageFit: z.enum(['contain', 'cover']).optional(),
  steps: z.array(buildYourBoxStepSchema).min(1).max(6).optional(),
});

const footerLinkSchema = z.object({
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(500),
});

const footerColumnSchema = z.object({
  title: z.string().min(1).max(80),
  links: z.array(footerLinkSchema).max(12),
});

const footerSocialLinkSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1).max(500),
  network: z.string().max(40).optional(),
});

const footerPropsSchema = z.object({
  brandName: z.string().max(80).optional(),
  tagline: z.string().max(300).optional(),
  columns: z.array(footerColumnSchema).max(4).optional(),
  socialLinks: z.array(footerSocialLinkSchema).max(8).optional(),
  showNewsletter: z.boolean().optional(),
});

const saleStripPropsSchema = z.object({
  text: z.string().min(1).max(200),
  ctaLabel: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
  tone: z.enum(['blush', 'mint', 'sky', 'soft']).optional(),
});

const faqItemSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answerHtml: z.string().trim().min(1).max(10_000),
});

const faqPropsSchema = z.object({
  title: z.string().max(120).optional(),
  items: z.array(faqItemSchema).min(1).max(20),
});

const exclusiveOfferCardSchema = z.object({
  tag: z.string().min(1).max(60),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(120).optional(),
  body: z.string().max(400).optional(),
  ctaLabel: z.string().min(1).max(80),
  ctaHref: z.string().min(1).max(500),
  tone: z.enum(['blush', 'sky', 'lavender']).optional(),
  icon: z.enum(['heart', 'briefcase', 'box']).optional(),
});

const exclusiveOffersPropsSchema = z.object({
  overline: z.string().max(80).optional(),
  title: z.string().max(160).optional(),
  subtitle: z.string().max(200).optional(),
  cards: z.array(exclusiveOfferCardSchema).min(1).max(3),
});

const testimonialItemSchema = z.object({
  quote: z.string().min(1).max(500),
  author: z.string().min(1).max(80),
  role: z.string().max(120).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

const testimonialsPropsSchema = z.object({
  title: z.string().max(160).optional(),
  subtitle: z.string().max(300).optional(),
  items: z.array(testimonialItemSchema).min(1).max(6),
});

const countdownPropsSchema = z.object({
  endsAt: z
    .string()
    .min(1)
    .refine((s) => !Number.isNaN(Date.parse(s)), 'endsAt must be a valid ISO datetime'),
  title: z.string().max(160).optional(),
  expiredLabel: z.string().max(160).optional(),
  ctaLabel: z.string().max(80).optional(),
  ctaHref: z.string().max(500).optional(),
});

export const pageBlockInputSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), props: heroPropsSchema }),
  z.object({ type: z.literal('richText'), props: richTextPropsSchema }),
  z.object({ type: z.literal('image'), props: imagePropsSchema }),
  z.object({ type: z.literal('productGrid'), props: productGridPropsSchema }),
  z.object({ type: z.literal('cta'), props: ctaPropsSchema }),
  z.object({ type: z.literal('spacer'), props: spacerPropsSchema }),
  z.object({ type: z.literal('brandStrip'), props: brandStripPropsSchema }),
  z.object({ type: z.literal('recipientSplit'), props: recipientSplitPropsSchema }),
  z.object({ type: z.literal('discoveryChips'), props: discoveryChipsPropsSchema }),
  z.object({ type: z.literal('buildYourBoxTeaser'), props: buildYourBoxTeaserPropsSchema }),
  z.object({ type: z.literal('articleTeasers'), props: articleTeasersPropsSchema }),
  z.object({ type: z.literal('footer'), props: footerPropsSchema }),
  z.object({ type: z.literal('saleStrip'), props: saleStripPropsSchema }),
  z.object({ type: z.literal('faq'), props: faqPropsSchema }),
  z.object({ type: z.literal('exclusiveOffers'), props: exclusiveOffersPropsSchema }),
  z.object({ type: z.literal('testimonials'), props: testimonialsPropsSchema }),
  z.object({ type: z.literal('countdown'), props: countdownPropsSchema }),
]);

/** Empty string → null so admin “clear field” does not fail path/URL regex. */
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

const marketingCanonicalPathSchema = z
  .string()
  .max(500)
  .regex(/^(\/|https?:\/\/)/, 'Must be a path or absolute URL');

export const createMarketingPageBodySchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(200),
  seoTitle: z.preprocess(emptyToUndefined, z.string().max(200).optional()),
  seoDescription: z.preprocess(emptyToUndefined, z.string().max(500).optional()),
  canonicalPath: z.preprocess(emptyToUndefined, marketingCanonicalPathSchema.optional()),
  ogImageUrl: z.preprocess(emptyToUndefined, cmsMediaUrlSchema.optional()),
  robotsIndex: z.boolean().optional(),
  blocks: z.array(pageBlockInputSchema).max(50).optional(),
});

export const updateMarketingPageBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  seoTitle: z.preprocess(emptyToNull, z.string().max(200).nullable().optional()),
  seoDescription: z.preprocess(emptyToNull, z.string().max(500).nullable().optional()),
  canonicalPath: z.preprocess(emptyToNull, marketingCanonicalPathSchema.nullable().optional()),
  ogImageUrl: z.preprocess(emptyToNull, cmsMediaUrlSchema.nullable().optional()),
  robotsIndex: z.boolean().optional(),
  blocks: z.array(pageBlockInputSchema).max(50).optional(),
  /** Admin Schema.org extras (presets + custom JSON-LD). Null clears. */
  seoSchemaExtras: seoSchemaExtrasNullableSchema,
});

export type PageBlockInput = z.infer<typeof pageBlockInputSchema>;
export type CreateMarketingPageBody = z.infer<typeof createMarketingPageBodySchema>;
export type UpdateMarketingPageBody = z.infer<typeof updateMarketingPageBodySchema>;

const giftNavLinkSchema = z.object({
  href: z.string().min(1).max(500),
  label: z.string().min(1).max(80),
});

const giftMegaPanelSchema = z.object({
  headline: z.string().max(120).optional(),
  body: z.string().max(300).optional(),
  ctaHref: z.string().max(500).optional(),
  ctaLabel: z.string().max(80).optional(),
  imageSrc: z.string().max(500).optional(),
});

/** Soft Gift global chrome (nav + default footer) — CommerceSetting JSON */
export const giftChromeBodySchema = z.object({
  shopLinks: z.array(giftNavLinkSchema).max(16).optional(),
  forWhomLinks: z.array(giftNavLinkSchema).max(16).optional(),
  shopMega: giftMegaPanelSchema.optional(),
  forWhomMega: giftMegaPanelSchema.optional(),
  footer: footerPropsSchema.optional(),
});

export type GiftChromeBody = z.infer<typeof giftChromeBodySchema>;
