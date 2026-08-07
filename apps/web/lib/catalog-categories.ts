import { apiUrl } from './api-base';
import { fetchCatalog } from './catalog';

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sortOrder?: number;
  productCount?: number;
};

export type CategoryOption = { value: string; label: string };

/** Public catalog categories (sorted by sortOrder). */
export async function fetchCatalogCategories(): Promise<CatalogCategory[]> {
  try {
    return await fetchCatalog<CatalogCategory[]>('/catalog/categories');
  } catch {
    return [];
  }
}

/** Browser-side fetch (client components / admin). */
export async function fetchCatalogCategoriesClient(
  path: '/catalog/categories' | '/admin/catalog/categories' = '/catalog/categories',
): Promise<CatalogCategory[]> {
  try {
    const res = await fetch(apiUrl(path), { credentials: 'include' });
    if (!res.ok) return [];
    return (await res.json()) as CatalogCategory[];
  } catch {
    return [];
  }
}

export function categoriesToOptions(cats: CatalogCategory[]): CategoryOption[] {
  return cats.map((c) => ({ value: c.slug, label: c.name }));
}

export function categoryPlpHref(slug: string): string {
  return `/gift/products?category=${encodeURIComponent(slug)}`;
}

export function isCategoryPlpHref(href: string): boolean {
  try {
    const u = new URL(href, 'https://inabiya.local');
    return u.pathname === '/gift/products' && Boolean(u.searchParams.get('category'));
  } catch {
    return href.includes('/gift/products?category=');
  }
}

export function categorySlugFromHref(href: string): string | null {
  try {
    const u = new URL(href, 'https://inabiya.local');
    if (u.pathname !== '/gift/products') return null;
    return u.searchParams.get('category');
  } catch {
    const m = href.match(/[?&]category=([^&]+)/);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

/** Fixed Shop mega links (not catalog categories). */
export const FIXED_SHOP_LINKS: Array<{ href: string; label: string }> = [
  { href: '/gift/build-your-box', label: 'Build Your Box' },
  { href: '/gift/collections/ready-hampers', label: 'Ready-Made Hampers' },
];

/**
 * Merge authored shop links with live catalog categories.
 * Non-category links are kept; `?category=` links are replaced by DB categories.
 */
export function mergeShopLinksWithCategories(
  authored: Array<{ href: string; label: string }> | undefined,
  categories: Array<{ slug: string; name: string }>,
): Array<{ href: string; label: string }> {
  const base =
    authored?.length ? authored : FIXED_SHOP_LINKS;
  const nonCategory = base.filter((l) => !isCategoryPlpHref(l.href));
  const categoryLinks = categories.map((c) => ({
    href: categoryPlpHref(c.slug),
    label: c.name,
  }));
  return [...nonCategory, ...categoryLinks];
}

/**
 * Resolve discovery chip items: when itemsSource is catalogCategories,
 * list comes from catalog; optional manual items supply imageUrl by slug.
 */
export function resolveCatalogCategoryChips(
  categories: Array<{ slug: string; name: string }>,
  mediaHints: Array<{ href?: string; imageUrl?: string; imageAlt?: string }> = [],
): Array<{ label: string; href: string; imageUrl: string; imageAlt: string }> {
  const bySlug = new Map<string, { imageUrl: string; imageAlt: string }>();
  for (const h of mediaHints) {
    const slug = h.href ? categorySlugFromHref(h.href) : null;
    if (!slug) continue;
    bySlug.set(slug, {
      imageUrl: h.imageUrl?.trim() ?? '',
      imageAlt: h.imageAlt?.trim() ?? '',
    });
  }
  return categories.map((c) => {
    const hint = bySlug.get(c.slug);
    return {
      label: c.name,
      href: categoryPlpHref(c.slug),
      imageUrl: hint?.imageUrl ?? '',
      imageAlt: hint?.imageAlt || c.name,
    };
  });
}
