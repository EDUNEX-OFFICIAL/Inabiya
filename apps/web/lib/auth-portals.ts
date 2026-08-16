import { safeNextPath } from '@inabiya/validation';

export type AuthPortalId =
  | 'customer'
  | 'commerce'
  | 'cms'
  | 'editorial'
  | 'creator'
  | 'platform';

export type AuthPortal = {
  id: AuthPortalId;
  /** Path of this portal's login page */
  loginPath: string;
  /** Default destination after successful login */
  defaultNext: string;
  /** Roles allowed to enter this portal after login */
  allowRoles: readonly string[];
};

export const AUTH_PORTALS: Record<AuthPortalId, AuthPortal> = {
  customer: {
    id: 'customer',
    loginPath: '/login',
    defaultNext: '/',
    /** Empty = any authenticated user may use the storefront portal */
    allowRoles: [],
  },
  commerce: {
    id: 'commerce',
    loginPath: '/admin/commerce/login',
    defaultNext: '/admin/commerce',
    allowRoles: ['COMMERCE_ADMIN', 'SUPPORT', 'FINANCE', 'SUPER_ADMIN'],
  },
  cms: {
    id: 'cms',
    loginPath: '/admin/cms/login',
    defaultNext: '/admin/cms/pages',
    /** Matches Nest `CmsPagesAdminController` @Roles */
    allowRoles: ['CONTENT_ADMIN', 'COMMERCE_ADMIN', 'SUPER_ADMIN'],
  },
  editorial: {
    id: 'editorial',
    loginPath: '/admin/editorial/login',
    defaultNext: '/admin/editorial',
    allowRoles: [
      'WRITER',
      'SEO_EDITOR',
      'MEDICAL_REVIEWER',
      'FINANCE',
      'CONTENT_ADMIN',
      'SUPER_ADMIN',
    ],
  },
  creator: {
    id: 'creator',
    loginPath: '/creator/login',
    defaultNext: '/creator',
    allowRoles: ['CREATOR', 'BRAND', 'SUPER_ADMIN'],
  },
  platform: {
    id: 'platform',
    loginPath: '/admin/platform/login',
    defaultNext: '/admin/platform',
    allowRoles: ['SUPER_ADMIN'],
  },
};

/** Resolve which login portal a return path belongs to. */
export function portalForNextPath(nextPath: string | null | undefined): AuthPortal {
  const safe = safeNextPath(nextPath);
  if (!safe) return AUTH_PORTALS.customer;
  if (safe === '/admin/cms' || safe.startsWith('/admin/cms/')) return AUTH_PORTALS.cms;
  // Soft Gift CMS preview lives under public storefront routes
  if (safe === '/pages/preview' || safe.startsWith('/pages/preview/')) return AUTH_PORTALS.cms;
  if (safe === '/admin/commerce' || safe.startsWith('/admin/commerce/')) {
    return AUTH_PORTALS.commerce;
  }
  if (safe === '/admin/editorial' || safe.startsWith('/admin/editorial/')) {
    return AUTH_PORTALS.editorial;
  }
  if (safe === '/admin/platform' || safe.startsWith('/admin/platform/')) {
    return AUTH_PORTALS.platform;
  }
  if (safe === '/admin/creator' || safe.startsWith('/admin/creator/')) {
    return AUTH_PORTALS.platform;
  }
  if (safe === '/creator' || safe.startsWith('/creator/')) return AUTH_PORTALS.creator;
  return AUTH_PORTALS.customer;
}

/** Portal-aware login URL with safe `next`. */
export function portalLoginUrl(nextPath: string): string {
  const portal = portalForNextPath(nextPath);
  const safe = safeNextPath(nextPath) ?? portal.defaultNext;
  // Never bounce login → login
  if (safe === portal.loginPath || safe.endsWith('/login')) {
    return portal.loginPath;
  }
  return `${portal.loginPath}?next=${encodeURIComponent(safe)}`;
}

export function rolesAllowedForPortal(
  roles: readonly string[],
  portal: AuthPortal,
): boolean {
  if (portal.allowRoles.length === 0) return true;
  return roles.some((r) => portal.allowRoles.includes(r));
}

/** Post-login destination for a portal (honours `next` when safe and in-portal). */
export function resolvePortalNext(
  portal: AuthPortal,
  nextRaw: string | null | undefined,
  roles: readonly string[],
): string {
  const next = safeNextPath(nextRaw);
  if (next && portalForNextPath(next).id === portal.id) {
    return next;
  }
  if (portal.id === 'creator') {
    if (roles.includes('BRAND') && !roles.includes('CREATOR')) return '/creator/brand';
    if (roles.includes('CREATOR')) return '/creator/studio';
  }
  if (portal.id === 'commerce') {
    if (roles.includes('SUPPORT') && !roles.includes('COMMERCE_ADMIN') && !roles.includes('SUPER_ADMIN')) {
      return '/admin/commerce/support';
    }
    if (
      roles.includes('FINANCE') &&
      !roles.includes('COMMERCE_ADMIN') &&
      !roles.includes('SUPER_ADMIN')
    ) {
      return '/admin/commerce/reports';
    }
  }
  return portal.defaultNext;
}
