import { collectionSlugFromHref } from './catalog-collections';
import { getGiftCollection } from './gift-collections';

export type GiftNavLink = {
  href: string;
  label: string;
  group?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  imageSrc?: string;
};

export type GiftNavGroup = {
  id: string;
  title: string;
  links: GiftNavLink[];
};

export type GiftNavPreview = {
  headline: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  imageSrc: string;
};

const FEATURED_HREFS = new Set(['/build-your-box', '/collections/ready-hampers', '/hampers']);

const OCCASION_SLUGS = new Set([
  'welcome-baby',
  'baby-shower',
  'naming-ceremony',
  'first-birthday',
]);

const CURATED_SLUGS = new Set(['bestsellers', 'editors-picks', 'new-arrivals', 'on-sale']);

const AGE_SLUGS = new Set(['newborn', 'infant', 'toddler']);

const BYB_PREVIEW: GiftNavPreview = {
  headline: 'Build Your Box',
  body: 'Pick who, age, and occasion — we curate a gift-ready box.',
  ctaHref: '/build-your-box',
  ctaLabel: 'Start building',
  imageSrc: '/gift/media/baby-soft-gift.jpg',
};

const GROUP_ALIAS: Record<string, { id: string; title: string }> = {
  shop: { id: 'shop', title: 'Shop' },
  occasion: { id: 'occasion', title: 'Occasion' },
  curated: { id: 'curated', title: 'Curated' },
  more: { id: 'more', title: 'More' },
  'for baby': { id: 'recipient', title: 'For baby' },
  recipient: { id: 'recipient', title: 'For baby' },
  'by age': { id: 'age', title: 'By age' },
  age: { id: 'age', title: 'By age' },
};

const SHOP_ORDER = ['shop', 'occasion', 'curated', 'more'];
const WHOM_ORDER = ['recipient', 'age'];

type ShopKind = 'featured' | 'occasion' | 'curated' | 'age' | 'other';

function hrefKey(href: string): string {
  try {
    const u = new URL(href, 'https://inabiya.local');
    return `${u.pathname.replace(/\/$/, '')}${u.search}`;
  } catch {
    return href.split('#')[0] ?? href;
  }
}

function slugOf(href: string): string | null {
  if (href.includes('/build-your-box')) return 'build-your-box';
  return collectionSlugFromHref(href);
}

function classify(href: string): ShopKind {
  const path = (href.split(/[?#]/, 1)[0] ?? href).replace(/\/$/, '') || href;
  if (FEATURED_HREFS.has(path)) return 'featured';
  const slug = slugOf(href);
  if (!slug) return 'other';
  if (slug === 'ready-hampers' || slug === 'hampers') return 'featured';
  if (OCCASION_SLUGS.has(slug)) return 'occasion';
  if (CURATED_SLUGS.has(slug)) return 'curated';
  if (AGE_SLUGS.has(slug)) return 'age';
  return 'other';
}

function groupFromKind(kind: ShopKind, menu: 'shop' | 'whom'): { id: string; title: string } {
  if (menu === 'whom') {
    if (kind === 'age') return { id: 'age', title: 'By age' };
    return { id: 'recipient', title: 'For baby' };
  }
  if (kind === 'featured') return { id: 'shop', title: 'Shop' };
  if (kind === 'occasion') return { id: 'occasion', title: 'Occasion' };
  if (kind === 'curated') return { id: 'curated', title: 'Curated' };
  return { id: 'more', title: 'More' };
}

function resolveGroup(link: GiftNavLink, menu: 'shop' | 'whom'): { id: string; title: string } {
  const raw = (link.group ?? '').trim();
  if (raw) {
    const alias = GROUP_ALIAS[raw.toLowerCase()];
    if (alias) return alias;
    const id = raw.toLowerCase().replace(/\s+/g, '-').slice(0, 40) || 'more';
    return { id, title: raw };
  }
  return groupFromKind(classify(link.href), menu);
}

function organizeMenu(links: GiftNavLink[], menu: 'shop' | 'whom'): GiftNavGroup[] {
  const seen = new Set<string>();
  const buckets = new Map<string, GiftNavGroup>();
  for (const l of links) {
    const key = hrefKey(l.href);
    if (!l.href || seen.has(key)) continue;
    seen.add(key);
    const g = resolveGroup(l, menu);
    let bucket = buckets.get(g.id);
    if (!bucket) {
      bucket = { id: g.id, title: g.title, links: [] };
      buckets.set(g.id, bucket);
    }
    bucket.links.push(l);
  }
  const order = menu === 'shop' ? SHOP_ORDER : WHOM_ORDER;
  const ordered: GiftNavGroup[] = [];
  for (const id of order) {
    const b = buckets.get(id);
    if (b?.links.length) ordered.push(b);
    buckets.delete(id);
  }
  for (const b of buckets.values()) {
    if (b.links.length) ordered.push(b);
  }
  return ordered;
}

const LEFT_GROUP_IDS = new Set(['shop', 'curated', 'recipient']);

/** Shop+Curated | Occasion  —  For baby | By age */
export function splitNavColumns(groups: GiftNavGroup[]): [GiftNavGroup[], GiftNavGroup[]] {
  if (groups.length <= 1) return [groups, []];
  const left = groups.filter((g) => LEFT_GROUP_IDS.has(g.id));
  const right = groups.filter((g) => !LEFT_GROUP_IDS.has(g.id));
  if (left.length && right.length) return [left, right];
  const mid = Math.ceil(groups.length / 2);
  return [groups.slice(0, mid), groups.slice(mid)];
}

/**
 * Group each CMS list in place. Shop vs For Whom is authored — links are not moved
 * between menus.
 */
export function organizeGiftNav(
  shopLinks: GiftNavLink[],
  forWhomLinks: GiftNavLink[],
): { shop: GiftNavGroup[]; whom: GiftNavGroup[] } {
  return {
    shop: organizeMenu(shopLinks, 'shop'),
    whom: organizeMenu(forWhomLinks, 'whom'),
  };
}

export function findNavLink(groups: GiftNavGroup[], href: string): GiftNavLink | undefined {
  const key = hrefKey(href);
  for (const g of groups) {
    const hit = g.links.find((l) => hrefKey(l.href) === key);
    if (hit) return hit;
  }
  return undefined;
}

export function previewForNavLink(link: GiftNavLink, fallback: GiftNavPreview): GiftNavPreview {
  const slug = slugOf(link.href);
  const col = slug ? getGiftCollection(slug) : undefined;
  const byb = link.href.includes('/build-your-box');
  const catalog: GiftNavPreview | null = byb
    ? BYB_PREVIEW
    : col
      ? {
          headline: col.title,
          body: col.blurb,
          ctaHref: link.href,
          ctaLabel: 'Shop',
          imageSrc: col.heroImageUrl,
        }
      : null;
  return {
    headline: link.headline || catalog?.headline || link.label,
    body: link.body || catalog?.body || fallback.body,
    ctaHref: link.href,
    ctaLabel: link.ctaLabel || catalog?.ctaLabel || fallback.ctaLabel || 'Shop',
    imageSrc: link.imageSrc || catalog?.imageSrc || fallback.imageSrc,
  };
}
