import type { CatalogHamperItem, StorefrontDisplayLabel } from '@/lib/catalog';

export type CmsBlockProduct = {
  id: string;
  slug: string;
  title: string;
  fromPricePaise: number;
  /** Discounted price of the % off anchor variant (same as the OFF badge). */
  salePricePaise?: number | null;
  /** MRP of the % off anchor variant — strikethrough when set. */
  fromCompareAtPaise?: number | null;
  averageRating?: number | null;
  reviewCount?: number;
  media: Array<{
    url: string;
    altText: string | null;
    kind?: string | null;
    id?: string | null;
  }>;
  brandName?: string | null;
  brandNames?: string[];
  isReadyMadeHamper?: boolean;
  /** Display BOM count for ready-made hampers */
  hamperItemCount?: number;
  hamperItems?: CatalogHamperItem[];
  contentsValuePaise?: number | null;
  hamperSavingsPaise?: number | null;
  displayLabels?: StorefrontDisplayLabel[];
  quickAddVariantId?: string | null;
  wishlistVariantId?: string | null;
  available?: number;
};

export type CmsPageBlock = {
  id: string;
  type: string;
  sortOrder: number;
  props: Record<string, unknown>;
};
