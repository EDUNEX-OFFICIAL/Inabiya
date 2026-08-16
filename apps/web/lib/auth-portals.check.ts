/**
 * Run: npx tsx apps/web/lib/auth-portals.check.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AUTH_PORTALS,
  portalForNextPath,
  portalLoginUrl,
  resolvePortalNext,
  rolesAllowedForPortal,
} from './auth-portals';

assert.equal(portalForNextPath('/admin/cms/pages').id, 'cms');
assert.equal(portalForNextPath('/admin/commerce/orders').id, 'commerce');
assert.equal(portalForNextPath('/admin/editorial').id, 'editorial');
assert.equal(portalForNextPath('/admin/platform/flags').id, 'platform');
assert.equal(portalForNextPath('/creator/studio').id, 'creator');
assert.equal(portalForNextPath('/cart').id, 'customer');
assert.equal(portalForNextPath(null).id, 'customer');

assert.equal(
  portalLoginUrl('/admin/cms/pages'),
  '/admin/cms/login?next=%2Fadmin%2Fcms%2Fpages',
);
assert.equal(
  portalLoginUrl('/admin/commerce'),
  '/admin/commerce/login?next=%2Fadmin%2Fcommerce',
);
assert.equal(portalLoginUrl('/wishlist'), '/login?next=%2Fwishlist');
assert.equal(portalLoginUrl('/creator/brand'), '/creator/login?next=%2Fcreator%2Fbrand');

assert.equal(rolesAllowedForPortal(['CUSTOMER'], AUTH_PORTALS.customer), true);
assert.equal(rolesAllowedForPortal(['COMMERCE_ADMIN'], AUTH_PORTALS.cms), true);
assert.equal(rolesAllowedForPortal(['CONTENT_ADMIN'], AUTH_PORTALS.cms), true);
assert.equal(rolesAllowedForPortal(['SUPPORT'], AUTH_PORTALS.commerce), true);
assert.equal(rolesAllowedForPortal(['CREATOR'], AUTH_PORTALS.creator), true);
assert.equal(rolesAllowedForPortal(['CUSTOMER'], AUTH_PORTALS.platform), false);

assert.equal(portalForNextPath('/pages/preview/abc').id, 'cms');
assert.equal(
  portalLoginUrl('/pages/preview/abc'),
  '/admin/cms/login?next=%2Fpages%2Fpreview%2Fabc',
);

assert.equal(
  resolvePortalNext(AUTH_PORTALS.commerce, '/admin/commerce/orders', ['COMMERCE_ADMIN']),
  '/admin/commerce/orders',
);
assert.equal(
  resolvePortalNext(AUTH_PORTALS.commerce, null, ['SUPPORT']),
  '/admin/commerce/support',
);
assert.equal(
  resolvePortalNext(AUTH_PORTALS.creator, null, ['BRAND']),
  '/creator/brand',
);
assert.equal(resolvePortalNext(AUTH_PORTALS.customer, null, ['CUSTOMER']), '/');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const portalPages: Array<{ file: string; portalId: string; variant: string }> = [
  { file: 'app/(gift)/login/page.tsx', portalId: 'customer', variant: 'gift' },
  { file: 'app/(portals)/admin/commerce/login/page.tsx', portalId: 'commerce', variant: 'ops' },
  { file: 'app/(portals)/admin/cms/login/page.tsx', portalId: 'cms', variant: 'ops' },
  { file: 'app/(portals)/admin/editorial/login/page.tsx', portalId: 'editorial', variant: 'blog' },
  { file: 'app/(portals)/admin/platform/login/page.tsx', portalId: 'platform', variant: 'ops' },
  { file: 'app/(creator)/creator/login/page.tsx', portalId: 'creator', variant: 'creator' },
];

for (const p of portalPages) {
  const src = readFileSync(join(root, p.file), 'utf8');
  assert.match(src, new RegExp(`portalId="${p.portalId}"`));
  assert.match(src, new RegExp(`variant="${p.variant}"`));
  assert.match(src, /PortalLoginForm/);
}

const formSrc = readFileSync(join(root, 'components/auth/portal-login-form.tsx'), 'utf8');
assert.match(formSrc, /blog-btn/);
assert.match(formSrc, /creator-btn/);
assert.match(formSrc, /clay-btn/);
assert.match(formSrc, /auth-shell/);
assert.doesNotMatch(formSrc, /bg-primary px-4/);

assert.match(formSrc, /aria-hidden="true"/);
assert.match(formSrc, /role="alert"/);
assert.match(formSrc, /auth-password-toggle/);

const css = readFileSync(join(root, 'app/globals.css'), 'utf8');
assert.match(css, /\.auth-shell/);
assert.match(css, /auth-shell--gift/);
assert.match(css, /auth-shell--blog/);
assert.match(css, /auth-shell--creator/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /100dvh/);
assert.match(css, /safe-area-inset/);
assert.match(css, /\.auth-form-panel\.blog-card:hover/);

const lenis = readFileSync(join(root, 'components/gift/gift-lenis.tsx'), 'utf8');
assert.match(lenis, /disabled/);

console.log('auth-portals.check.ts ok');
