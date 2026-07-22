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

/** Phase 2 — catalog admin + storefront queries */
export const createProductBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase kebab-case'),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  categorySlugs: z.array(z.string()).optional(),
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
  media: z
    .array(
      z.object({
        url: z.string().url(),
        altText: z.string().max(200).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .optional(),
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

export const updateProductBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  categorySlugs: z.array(z.string()).optional(),
  recipientTags: z.array(z.enum(['girl', 'boy', 'mom', 'unisex'])).optional(),
  ageBands: z.array(z.enum(['newborn', 'infant', 'toddler', 'any'])).optional(),
  occasionTags: z.array(z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday'])).optional(),
  isReadyMadeHamper: z.boolean().optional(),
  brandName: z.string().max(120).nullable().optional(),
  storefrontLabels: z
    .array(z.enum(['BESTSELLER', 'EDITORS_PICK', 'GIFT_SET']))
    .max(2)
    .optional(),
});

export const updateInventoryBodySchema = z.object({
  onHand: z.number().int().min(0),
});

/** Admin: set/clear MRP (compare-at) on a variant */
export const updateVariantBodySchema = z.object({
  compareAtPricePaise: z.number().int().min(0).nullable(),
});

export const createCategoryBodySchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
});

export const catalogListQuerySchema = z.object({
  q: z.string().max(120).optional(),
  category: z.string().max(80).optional(),
  recipient: z.enum(['girl', 'boy', 'mom', 'unisex']).optional(),
  age: z.enum(['newborn', 'infant', 'toddler', 'any']).optional(),
  occasion: z.enum(['welcome-baby', 'baby-shower', 'naming', 'birthday']).optional(),
  hamper: z.enum(['0', '1']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
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
  categorySlugs: z.array(z.string().max(80)).max(12).optional(),
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
export type CreateCategoryBody = z.infer<typeof createCategoryBodySchema>;
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
});

export const createCouponBodySchema = z.object({
  code: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/i),
  description: z.string().max(200).optional(),
  discountPaise: z.number().int().min(0).optional(),
  discountPercent: z.number().int().min(1).max(100).optional(),
  minSubtotalPaise: z.number().int().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
});

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

export type CreateCouponBody = z.infer<typeof createCouponBodySchema>;
export type CreateReviewBody = z.infer<typeof createReviewBodySchema>;
export type ModerateReviewBody = z.infer<typeof moderateReviewBodySchema>;

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

export type CreateReturnBody = z.infer<typeof createReturnBodySchema>;
export type ModerateReturnBody = z.infer<typeof moderateReturnBodySchema>;

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
  ogImageUrl: z.string().url().max(500).optional(),
});

export const publishArticleBodySchema = z.object({
  seoTitle: z.string().trim().min(3).max(120).optional(),
  seoDescription: z.string().trim().min(10).max(320).optional(),
  categorySlug: z.string().min(2).max(80).optional(),
  tagSlugs: z.array(z.string().min(2).max(80)).max(12).optional(),
  specialistSlug: z.string().min(2).max(80).optional(),
  ogImageUrl: z.string().url().max(500).optional(),
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

export type TrackAnalyticsBody = z.infer<typeof trackAnalyticsBodySchema>;
export type BulkProductsBody = z.infer<typeof bulkProductsBodySchema>;

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

/** HTTP(S) or same-origin media content path from Media library. */
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
      try {
        const u = new URL(s);
        return u.protocol === 'http:' || u.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Must be http(s) URL or /api/v1/media/{id}/content' },
  );

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

const productGridPropsSchema = z.object({
  title: z.string().max(120).optional(),
  overline: z.string().max(80).optional(),
  subtitle: z.string().max(300).optional(),
  productSlugs: z.array(z.string().max(120)).max(24).optional(),
  category: z.string().max(80).optional(),
  hamper: z.boolean().optional(),
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
  icon: z.enum(['heart', 'package', 'gift', 'truck']).optional(),
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
});

const discoveryChipsPropsSchema = z.object({
  overline: z.string().max(80).optional(),
  title: z.string().max(120).optional(),
  subtitle: z.string().max(300).optional(),
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
  imageUrl: cmsMediaUrlSchema.optional(),
  steps: z.array(buildYourBoxStepSchema).min(1).max(4).optional(),
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
