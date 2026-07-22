import type { MetadataRoute } from 'next';
import { apiUrl } from '@/lib/api-base';
import { defaultPathForCmsSlug, getSiteOrigin } from '@/lib/cms-seo';
import { GIFT_CORPORATE_SLUG, GIFT_HOMEPAGE_SLUG } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

type CmsRow = { slug: string; updatedAt?: string; publishedAt?: string | null };
type ArticleRow = { slug: string; publishedAt?: string | null };
type ProductRow = { slug: string };

async function safeJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(apiUrl(path), { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteOrigin();
  const entries: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: 'weekly', priority: 0.6 },
  ];

  const [cmsPages, articles, products] = await Promise.all([
    safeJson<CmsRow[]>('/cms/pages'),
    safeJson<ArticleRow[]>('/articles'),
    safeJson<ProductRow[]>('/catalog/products?sort=newest'),
  ]);

  for (const row of cmsPages ?? []) {
    const path = defaultPathForCmsSlug(row.slug);
    const lastModified = row.updatedAt || row.publishedAt || undefined;
    entries.push({
      url: `${origin}${path}`,
      lastModified: lastModified ? new Date(lastModified) : undefined,
      changeFrequency: row.slug === GIFT_HOMEPAGE_SLUG ? 'daily' : 'weekly',
      priority: row.slug === GIFT_HOMEPAGE_SLUG ? 1 : row.slug === GIFT_CORPORATE_SLUG ? 0.8 : 0.7,
    });
  }

  for (const a of articles ?? []) {
    if (!a?.slug) continue;
    entries.push({
      url: `${origin}/articles/${a.slug}`,
      lastModified: a.publishedAt ? new Date(a.publishedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.65,
    });
  }

  for (const p of products ?? []) {
    if (!p?.slug) continue;
    entries.push({
      url: `${origin}/gift/products/${p.slug}`,
      changeFrequency: 'weekly',
      priority: 0.75,
    });
  }

  entries.push({
    url: `${origin}/gift/products`,
    changeFrequency: 'daily',
    priority: 0.85,
  });

  return entries;
}
