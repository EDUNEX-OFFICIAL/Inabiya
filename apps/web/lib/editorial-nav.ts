/**
 * Editorial CMS IA (Phase 15 E0) — nav + landing.
 * Blog Creative (`blog`) + compact. Not Soft Gift ops chrome.
 */

export const EDITORIAL_ROLES = [
  'CONTENT_ADMIN',
  'WRITER',
  'SEO_EDITOR',
  'MEDICAL_REVIEWER',
  'FINANCE',
  'SUPER_ADMIN',
] as const;

export type EditorialRole = (typeof EDITORIAL_ROLES)[number];

export type EditorialNavItem = {
  id: string;
  label: string;
  href: string;
  roles: EditorialRole[];
  match?: 'exact' | 'prefix';
  /** Open public journal in the same tab */
  external?: boolean;
};

export const EDITORIAL_NAV: EditorialNavItem[] = [
  {
    id: 'queue',
    label: 'Queue',
    href: '/admin/editorial',
    roles: ['CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'SUPER_ADMIN'],
    match: 'exact',
  },
  {
    id: 'new',
    label: 'New',
    href: '/admin/editorial/articles/new',
    roles: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
    match: 'prefix',
  },
  {
    id: 'writer',
    label: 'Writer',
    href: '/admin/editorial/writer',
    roles: ['WRITER'],
    match: 'prefix',
  },
  {
    id: 'categories',
    label: 'Categories',
    href: '/admin/editorial/categories',
    roles: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
    match: 'prefix',
  },
  {
    id: 'specialists',
    label: 'Specialists',
    href: '/admin/editorial/specialists',
    roles: ['CONTENT_ADMIN', 'SUPER_ADMIN'],
    match: 'prefix',
  },
  {
    id: 'payments',
    label: 'Payments',
    href: '/admin/editorial/payments',
    roles: ['FINANCE', 'CONTENT_ADMIN', 'SUPER_ADMIN'],
    match: 'prefix',
  },
  {
    id: 'journal',
    label: 'Journal',
    href: '/blog',
    roles: [...EDITORIAL_ROLES],
    match: 'exact',
    external: true,
  },
];

export function canAccessEditorial(roles: string[]): boolean {
  return roles.some((r) => (EDITORIAL_ROLES as readonly string[]).includes(r));
}

/** Assignment fee on queue/article — Payments roles only (not writer/SEO/medical). */
export function canSeeWriterFee(roles: string[]): boolean {
  return roles.some((r) => r === 'CONTENT_ADMIN' || r === 'SUPER_ADMIN' || r === 'FINANCE');
}

export function filterEditorialNav(roles: string[]): EditorialNavItem[] {
  return EDITORIAL_NAV.filter((item) => item.roles.some((r) => roles.includes(r)));
}

export function defaultEditorialLanding(roles: string[]): string {
  const hasDesk = roles.some((r) =>
    ['CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'SUPER_ADMIN'].includes(r),
  );
  if (roles.includes('FINANCE') && !hasDesk) {
    return '/admin/editorial/payments';
  }
  return '/admin/editorial';
}

export function isEditorialNavActive(pathname: string, item: EditorialNavItem): boolean {
  if (item.external) return false;
  if (item.match === 'exact') return pathname === item.href;
  if (pathname === item.href) return true;
  return pathname.startsWith(`${item.href}/`);
}

/** Mobile tab bar: Queue, Writer, Journal + More. `new` is a FAB, not a tab. */
export const EDITORIAL_BOTTOM_TAB_IDS = ['queue', 'writer', 'journal'] as const;
export const EDITORIAL_BOTTOM_MORE_IDS = ['payments', 'categories', 'specialists'] as const;

export function splitEditorialBottomNav(items: EditorialNavItem[]): {
  tabs: EditorialNavItem[];
  more: EditorialNavItem[];
  fab: EditorialNavItem | null;
} {
  const byId = new Map(items.map((item) => [item.id, item]));
  const tabs = EDITORIAL_BOTTOM_TAB_IDS.map((id) => byId.get(id)).filter(
    (item): item is EditorialNavItem => Boolean(item),
  );
  const more: EditorialNavItem[] = [];
  for (const id of EDITORIAL_BOTTOM_MORE_IDS) {
    const hit = byId.get(id);
    if (hit) more.push(hit);
  }
  for (const item of items) {
    if (item.id === 'new') continue;
    if (tabs.some((t) => t.id === item.id)) continue;
    if (more.some((m) => m.id === item.id)) continue;
    more.push(item);
  }
  return { tabs, more, fab: byId.get('new') ?? null };
}

export const ARTICLE_STATUS_LABEL: Record<string, string> = {
  ASSIGNED: 'Assigned',
  DRAFT: 'Draft',
  SEO_REVIEW: 'SEO',
  MEDICAL_REVIEW: 'Medical',
  CHANGES_REQUESTED: 'Changes',
  APPROVED: 'Approved',
  SCHEDULED: 'Scheduled',
  PUBLISHED: 'Published',
};

export type EditorialQueueAction = 'edit' | 'preview' | 'live' | 'hide' | 'draft' | 'delete';

/** Queue row actions. Hide = off Journal; Draft = writing pipeline; Delete = unpublished only. */
export function editorialQueueActions(status: string, isOps: boolean): EditorialQueueAction[] {
  const out: EditorialQueueAction[] = ['edit', 'preview'];
  if (status === 'PUBLISHED') out.push('live');
  if (!isOps) return out;
  if (status === 'PUBLISHED' || status === 'SCHEDULED') out.push('hide');
  if (status !== 'DRAFT' && status !== 'ASSIGNED') out.push('draft');
  if (status !== 'PUBLISHED' && status !== 'SCHEDULED') out.push('delete');
  return out;
}
