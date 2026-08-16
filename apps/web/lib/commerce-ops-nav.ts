/**
 * Commerce OPS IA (OPS-0) — nav + breadcrumb helpers.
 * Soft Gift dense admin; role-gated items. No fourth theme.
 */

export type OpsRole = 'COMMERCE_ADMIN' | 'SUPER_ADMIN' | 'SUPPORT' | 'FINANCE' | string;

export type OpsNavItem = {
  id: string;
  label: string;
  href: string;
  /** Roles that may see this item (SUPER_ADMIN always sees all). */
  roles: Array<'COMMERCE_ADMIN' | 'SUPPORT' | 'FINANCE' | 'CONTENT_ADMIN'>;
  /** Match active state for nested routes */
  match?: 'exact' | 'prefix';
  /** Sidebar section */
  section?: 'main' | 'catalog' | 'ops' | 'growth' | 'system';
};

export const OPS_SHELL_ROLES = ['COMMERCE_ADMIN', 'SUPER_ADMIN', 'SUPPORT', 'FINANCE'] as const;

export const COMMERCE_OPS_NAV: OpsNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/admin/commerce',
    roles: ['COMMERCE_ADMIN'],
    match: 'exact',
    section: 'main',
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/admin/commerce/orders',
    roles: ['COMMERCE_ADMIN', 'SUPPORT', 'FINANCE'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'products',
    label: 'Products',
    href: '/admin/commerce/products',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'catalog',
  },
  {
    id: 'collections',
    label: 'Collections',
    href: '/admin/commerce/collections',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'catalog',
  },
  {
    id: 'inventory',
    label: 'Inventory',
    href: '/admin/commerce/inventory',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'catalog',
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    href: '/admin/commerce/suppliers',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'catalog',
  },
  {
    id: 'purchase-orders',
    label: 'Purchase orders',
    href: '/admin/commerce/purchase-orders',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'catalog',
  },
  {
    id: 'import',
    label: 'Import',
    href: '/admin/commerce/import',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'catalog',
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/admin/commerce/customers',
    roles: ['COMMERCE_ADMIN', 'SUPPORT'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'promotions',
    label: 'Promotions',
    href: '/admin/commerce/coupons',
    roles: ['COMMERCE_ADMIN', 'FINANCE'],
    match: 'prefix',
    section: 'growth',
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/admin/commerce/reports',
    roles: ['COMMERCE_ADMIN', 'FINANCE'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'reviews',
    label: 'Reviews',
    href: '/admin/commerce/reviews',
    roles: ['COMMERCE_ADMIN', 'SUPPORT'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'returns',
    label: 'Returns',
    href: '/admin/commerce/returns',
    roles: ['COMMERCE_ADMIN', 'SUPPORT', 'FINANCE'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'support',
    label: 'Support',
    href: '/admin/commerce/support',
    roles: ['COMMERCE_ADMIN', 'SUPPORT'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'inquiries',
    label: 'Inquiries',
    href: '/admin/commerce/gifting-inquiries',
    roles: ['COMMERCE_ADMIN', 'SUPPORT'],
    match: 'prefix',
    section: 'ops',
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/admin/commerce/settings',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'system',
  },
  {
    id: 'pages',
    label: 'Pages',
    href: '/admin/cms/pages',
    roles: ['COMMERCE_ADMIN', 'CONTENT_ADMIN'],
    match: 'prefix',
    section: 'growth',
  },
  {
    id: 'gift-chrome',
    label: 'Nav & footer',
    href: '/admin/cms/gift-chrome',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
    section: 'growth',
  },
];

const SECTION_LABELS: Record<string, string> = {
  main: 'Overview',
  catalog: 'Catalog',
  ops: 'Operations',
  growth: 'Growth',
  system: 'System',
};

export function canAccessCommerceOps(roles: string[]): boolean {
  if (roles.includes('SUPER_ADMIN') || roles.includes('CONTENT_ADMIN')) return true;
  return OPS_SHELL_ROLES.some((r) => r !== 'SUPER_ADMIN' && roles.includes(r));
}

/** Coupons, product create/import, compare-at price — API still enforces. */
export function canMutateCommerceFinance(roles: string[]): boolean {
  return roles.includes('SUPER_ADMIN') || roles.includes('FINANCE');
}

export function filterNavForRoles(roles: string[]): OpsNavItem[] {
  if (roles.includes('SUPER_ADMIN')) return [...COMMERCE_OPS_NAV];
  return COMMERCE_OPS_NAV.filter((item) => item.roles.some((r) => roles.includes(r)));
}

export function groupNavBySection(
  items: OpsNavItem[],
): Array<{ section: string; label: string; items: OpsNavItem[] }> {
  const order = ['main', 'catalog', 'ops', 'growth', 'system'];
  const map = new Map<string, OpsNavItem[]>();
  for (const item of items) {
    const key = item.section ?? 'main';
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return order
    .filter((s) => (map.get(s)?.length ?? 0) > 0)
    .map((s) => ({ section: s, label: SECTION_LABELS[s] ?? s, items: map.get(s)! }));
}

export function isNavItemActive(pathname: string, item: OpsNavItem): boolean {
  if (item.match === 'exact') {
    return pathname === item.href;
  }
  if (pathname === item.href) return true;
  return pathname.startsWith(`${item.href}/`);
}

export type BreadcrumbCrumb = { label: string; href?: string };

/** Build breadcrumbs for commerce OPS + CMS routes. */
export function buildOpsBreadcrumbs(pathname: string): BreadcrumbCrumb[] {
  if (pathname.startsWith('/admin/cms')) {
    const crumbs: BreadcrumbCrumb[] = [{ label: 'Soft Gift CMS', href: '/admin/cms/pages' }];
    if (pathname.startsWith('/admin/cms/gift-chrome')) {
      crumbs.push({ label: 'Nav & footer' });
      return crumbs;
    }
    if (pathname === '/admin/cms/pages') {
      return [{ label: 'Pages' }];
    }
    crumbs.push({ label: 'Pages', href: '/admin/cms/pages' });
    if (pathname.endsWith('/new')) {
      crumbs.push({ label: 'New' });
      return crumbs;
    }
    crumbs.push({ label: 'Edit' });
    return crumbs;
  }

  const crumbs: BreadcrumbCrumb[] = [{ label: 'Commerce Ops', href: '/admin/commerce' }];
  if (pathname === '/admin/commerce') {
    return [{ label: 'Dashboard' }];
  }

  const segments = pathname
    .replace(/^\/admin\/commerce\/?/, '')
    .split('/')
    .filter(Boolean);
  if (segments.length === 0) return crumbs;

  const labelMap: Record<string, string> = {
    orders: 'Orders',
    products: 'Products',
    collections: 'Collections',
    inventory: 'Inventory',
    suppliers: 'Suppliers',
    'purchase-orders': 'Purchase orders',
    import: 'Import',
    customers: 'Customers',
    coupons: 'Promotions',
    reports: 'Reports',
    reviews: 'Reviews',
    returns: 'Returns',
    support: 'Support',
    search: 'Support',
    settings: 'Settings',
    'gifting-inquiries': 'Inquiries',
    new: 'New',
  };

  let acc = '/admin/commerce';
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    const isLast = i === segments.length - 1;
    const label = labelMap[seg] ?? (seg.length > 12 ? `${seg.slice(0, 8)}…` : seg);
    crumbs.push(isLast ? { label } : { label, href: acc });
  });

  return crumbs;
}

/** Default landing path after login for a role set. */
export function defaultOpsLanding(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN') || roles.includes('COMMERCE_ADMIN')) {
    return '/admin/commerce';
  }
  if (roles.includes('CONTENT_ADMIN')) return '/admin/cms/pages';
  if (roles.includes('SUPPORT')) return '/admin/commerce/support';
  if (roles.includes('FINANCE')) return '/admin/commerce/reports';
  return '/admin/commerce';
}
