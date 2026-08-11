import { apiUrl } from './api-base';
import { fetchCatalog } from './catalog';

export type CatalogCollection = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  overline?: string | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  accent?: string;
  sortOrder?: number;
  createdAt?: string;
  membershipMode?: 'MANUAL' | 'SMART';
  smartRules?: {
    match: 'all' | 'any';
    conditions: Array<{ field: string; op: string; value: string }>;
  } | null;
  hideFacets?: string[];
  relatedSlugs?: string[];
  lockedLabel?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalPath?: string | null;
  ogImageUrl?: string | null;
  robotsIndex?: boolean;
  status?: 'DRAFT' | 'PUBLISHED';
  productCount?: number;
};

export type CollectionOption = { value: string; label: string };

/** Public published collections (sorted by sortOrder). */
export async function fetchCatalogCollections(): Promise<CatalogCollection[]> {
  try {
    return await fetchCatalog<CatalogCollection[]>('/catalog/collections');
  } catch {
    return [];
  }
}

export async function fetchCatalogCollectionBySlug(
  slug: string,
): Promise<CatalogCollection | null> {
  try {
    return await fetchCatalog<CatalogCollection>(
      `/catalog/collections/${encodeURIComponent(slug)}`,
    );
  } catch {
    return null;
  }
}

/** Browser-side fetch (client components / admin). */
export async function fetchCatalogCollectionsClient(
  path: '/catalog/collections' | '/admin/catalog/collections' = '/catalog/collections',
): Promise<CatalogCollection[]> {
  try {
    const res = await fetch(apiUrl(path), { credentials: 'include' });
    if (!res.ok) return [];
    return (await res.json()) as CatalogCollection[];
  } catch {
    return [];
  }
}

export function collectionsToOptions(cols: CatalogCollection[]): CollectionOption[] {
  return cols.map((c) => ({ value: c.slug, label: c.title }));
}

export function collectionPlpHref(slug: string): string {
  return `/gift/collections/${encodeURIComponent(slug)}`;
}

export function isCollectionHref(href: string): boolean {
  try {
    const u = new URL(href, 'https://inabiya.local');
    return u.pathname.startsWith('/gift/collections/');
  } catch {
    return href.includes('/gift/collections/');
  }
}

export function collectionSlugFromHref(href: string): string | null {
  try {
    const u = new URL(href, 'https://inabiya.local');
    const m = u.pathname.match(/^\/gift\/collections\/([^/]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    const m = href.match(/\/gift\/collections\/([^/?#]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

export const FIXED_SHOP_LINKS: Array<{ href: string; label: string }> = [
  { href: '/gift/build-your-box', label: 'Build Your Box' },
  { href: '/gift/collections/ready-hampers', label: 'Ready-Made Hampers' },
];

export function mergeShopLinksWithCollections(
  authored: Array<{ href: string; label: string }> | undefined,
  collections: Array<{ slug: string; title: string }>,
): Array<{ href: string; label: string }> {
  const base = authored?.length ? authored : FIXED_SHOP_LINKS;
  const nonAuto = base.filter(
    (l) => !isCollectionHref(l.href) && !l.href.includes('/gift/products?category='),
  );
  const collectionLinks = collections.map((c) => ({
    href: collectionPlpHref(c.slug),
    label: c.title,
  }));
  return [...nonAuto, ...collectionLinks];
}

export function resolveCatalogCollectionChips(
  collections: Array<{ slug: string; title: string; heroImageUrl?: string | null }>,
  mediaHints: Array<{ href?: string; imageUrl?: string; imageAlt?: string }> = [],
): Array<{ label: string; href: string; imageUrl: string; imageAlt: string }> {
  const bySlug = new Map<string, { imageUrl: string; imageAlt: string }>();
  for (const h of mediaHints) {
    const slug = h.href ? collectionSlugFromHref(h.href) : null;
    if (!slug) continue;
    bySlug.set(slug, {
      imageUrl: h.imageUrl ?? '',
      imageAlt: h.imageAlt ?? '',
    });
  }
  return collections.map((c) => {
    const hint = bySlug.get(c.slug);
    return {
      label: c.title,
      href: collectionPlpHref(c.slug),
      imageUrl: hint?.imageUrl || c.heroImageUrl || '/gift/media/baby-soft-gift.jpg',
      imageAlt: hint?.imageAlt || c.title,
    };
  });
}
