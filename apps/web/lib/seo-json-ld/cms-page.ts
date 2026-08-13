import type { SeoSchemaEntry } from '@inabiya/validation';
import { collectCmsFaqJsonLd, type CmsPageBlock } from '@/components/cms/marketing-page-blocks';
import { webPageJsonLd, type CmsSeoPage } from '@/lib/cms-seo';
import { mergeSeoJsonLdWithExtras } from '@/lib/seo-json-ld';

export function marketingPageMergedJsonLd(
  page: CmsSeoPage,
  blocks: CmsPageBlock[],
  extras?: SeoSchemaEntry[] | null,
) {
  return mergeSeoJsonLdWithExtras([webPageJsonLd(page), collectCmsFaqJsonLd(blocks)], extras);
}
