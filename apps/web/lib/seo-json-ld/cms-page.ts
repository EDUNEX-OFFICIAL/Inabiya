import type { SeoSchemaEntry } from '@inabiya/validation';
import type { CmsPageBlock } from '@/components/cms/marketing-page-types';
import { webPageJsonLd, type CmsSeoPage } from '@/lib/cms-seo';
import { mergeSeoJsonLdWithExtras } from '@/lib/seo-json-ld';
import { collectCmsFaqJsonLd } from '@/lib/seo-json-ld/cms-faq';

export function marketingPageMergedJsonLd(
  page: CmsSeoPage,
  blocks: CmsPageBlock[],
  extras?: SeoSchemaEntry[] | null,
) {
  return mergeSeoJsonLdWithExtras([webPageJsonLd(page), collectCmsFaqJsonLd(blocks)], extras);
}
