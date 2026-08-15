import { apiUrl } from '@/lib/api-base';
import type { CmsSeoPage } from '@/lib/cms-seo';
import type { SeoSchemaEntry } from '@inabiya/validation';

export type CmsMarketingPage = CmsSeoPage & {
  id: string;
  seoSchemaExtras?: SeoSchemaEntry[] | null;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Record<string, unknown>;
  }>;
};

export async function fetchPublishedCmsPage(slug: string): Promise<CmsMarketingPage | null> {
  try {
    const res = await fetch(apiUrl(`/cms/pages/${encodeURIComponent(slug)}`), {
      cache: 'no-store',
    });
    if (res.status === 404 || !res.ok) return null;
    return (await res.json()) as CmsMarketingPage;
  } catch {
    return null;
  }
}
