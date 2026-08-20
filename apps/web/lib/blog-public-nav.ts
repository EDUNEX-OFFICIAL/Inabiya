/** Public Journal chrome — Blog Creative theme only. */

export type BlogPublicNavItem = {
  id: string;
  label: string;
  href: string;
  match: 'exact' | 'prefix';
  /** Primary CTA styling in nav */
  cta?: boolean;
};

export const BLOG_PUBLIC_NAV: BlogPublicNavItem[] = [
  { id: 'journal', label: 'Journal', href: '/blog', match: 'exact' },
  { id: 'specialists', label: 'Specialists', href: '/specialists', match: 'prefix' },
  { id: 'shop', label: 'Gift Store', href: '/', match: 'prefix', cta: true },
];

export function isBlogNavActive(pathname: string, item: BlogPublicNavItem): boolean {
  if (item.match === 'exact') return pathname === item.href;
  if (pathname === item.href) return true;
  return pathname.startsWith(`${item.href}/`);
}
