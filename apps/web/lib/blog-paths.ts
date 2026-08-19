/** Public journal (site + public API). Editorial desk stays `/admin/editorial/articles`. */

export const BLOG_PATH = '/blog';
export const BLOG_API = '/blog';

export function blogPostPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

export function blogIndexPath(opts?: { category?: string; tag?: string }): string {
  const p = new URLSearchParams();
  if (opts?.category) p.set('category', opts.category);
  if (opts?.tag) p.set('tag', opts.tag);
  const q = p.toString();
  return q ? `${BLOG_PATH}?${q}` : BLOG_PATH;
}

/** Stored CMS / SEO `/articles…` → current public `/blog…`. */
export function rewriteLegacyArticlesPath(href: string): string {
  if (
    href === '/articles' ||
    href.startsWith('/articles/') ||
    href.startsWith('/articles?') ||
    href.startsWith('/articles#')
  ) {
    return `${BLOG_PATH}${href.slice('/articles'.length)}`;
  }
  return href;
}

export function articleCanonicalPath(slug: string, stored?: string | null): string {
  const raw = stored?.trim();
  if (!raw) return blogPostPath(slug);
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return rewriteLegacyArticlesPath(path);
}
