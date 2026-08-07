import type { StorefrontDisplayLabel } from '@/lib/catalog';

export type CmsBlockProduct = {
  id: string;
  slug: string;
  title: string;
  fromPricePaise: number;
  media: Array<{ url: string; altText: string | null }>;
  brandName?: string | null;
  brandNames?: string[];
  isReadyMadeHamper?: boolean;
  /** Display BOM count for ready-made hampers */
  hamperItemCount?: number;
  displayLabels?: StorefrontDisplayLabel[];
  quickAddVariantId?: string | null;
  available?: number;
};

export type CmsPageBlock = {
  id: string;
  type: string;
  sortOrder: number;
  props: Record<string, unknown>;
};
