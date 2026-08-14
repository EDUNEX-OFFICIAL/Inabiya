import { apiUrl } from './api-base';

export function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export type ManualStorefrontLabel = 'BESTSELLER' | 'EDITORS_PICK' | 'GIFT_SET';

export type StorefrontDisplayLabel = {
  code: string;
  text: string;
  tone: 'sale' | 'new' | 'stock' | 'manual';
};

export type CatalogHamperItem = {
  id: string;
  title: string;
  blurb: string | null;
  brandName?: string | null;
  imageUrl: string | null;
  qty: number;
  unitPricePaise: number;
  sortOrder: number;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  fromPricePaise: number;
  /** Discounted price matching the % off badge (anchor variant). */
  salePricePaise?: number | null;
  /** MRP of the sale anchor — strikethrough on cards when set. */
  fromCompareAtPaise?: number | null;
  averageRating?: number | null;
  reviewCount?: number;
  recipientTags?: string[];
  ageBands?: string[];
  occasionTags?: string[];
  isReadyMadeHamper?: boolean;
  brandName?: string | null;
  /** Resolved unique brands (hamper item brands, else product brand). */
  brandNames?: string[];
  /** Manual admin presets only */
  storefrontLabels?: ManualStorefrontLabel[];
  /** Resolved hybrid ribbons (max 2) for PLP/PDP */
  displayLabels?: StorefrontDisplayLabel[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  ogImageUrl?: string | null;
  robotsIndex?: boolean;
  faqItems?: Array<{ question: string; answerText: string }> | null;
  seoSections?: Array<{ heading: string; bodyText: string }> | null;
  seoSchemaExtras?: import('@inabiya/validation').SeoSchemaEntry[] | null;
  hamperItems?: CatalogHamperItem[];
  hamperItemCount?: number;
  contentsValuePaise?: number;
  hamperSavingsPaise?: number;
  media: Array<{
    url: string;
    altText: string | null;
    kind?: 'IMAGE' | 'VIDEO';
    posterUrl?: string | null;
    sortOrder?: number;
    id?: string;
  }>;
  collections: Array<{ slug: string; title: string }>;
  variants: Array<{
    id: string;
    sku: string;
    label: string;
    pricePaise: number;
    compareAtPricePaise?: number | null;
    available: number;
    onHand?: number;
    giftBoxEligible: boolean;
  }>;
  personalization: Array<{
    key: string;
    label: string;
    type: string;
    maxLength: number | null;
    options: unknown;
    required: boolean;
  }>;
};

export async function fetchCatalog<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Catalog fetch failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

/** Browser fetch of a published product (no Next `revalidate`). */
export async function fetchPublishedProductClient(slug: string): Promise<CatalogProduct> {
  const res = await fetch(apiUrl(`/catalog/products/${encodeURIComponent(slug)}`));
  if (!res.ok) {
    throw new Error(`Catalog fetch failed (${res.status})`);
  }
  return res.json() as Promise<CatalogProduct>;
}
