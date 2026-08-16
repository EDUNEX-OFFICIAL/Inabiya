import assert from 'node:assert/strict';
import {
  buildOpsBreadcrumbs,
  canAccessCommerceOps,
  canMutateCommerceFinance,
  COMMERCE_OPS_NAV,
  defaultOpsLanding,
  filterNavForRoles,
  isNavItemActive,
} from './commerce-ops-nav';

// Support must not see Promotions / Settings / Products
const supportNav = filterNavForRoles(['SUPPORT']);
assert.ok(!supportNav.some((i) => i.id === 'promotions'));
assert.ok(!supportNav.some((i) => i.id === 'settings'));
assert.ok(!supportNav.some((i) => i.id === 'products'));
assert.ok(!supportNav.some((i) => i.id === 'collections'));
assert.ok(COMMERCE_OPS_NAV.some((i) => i.id === 'collections'));
assert.ok(!COMMERCE_OPS_NAV.some((i) => i.id === 'categories'));
assert.ok(!COMMERCE_OPS_NAV.some((i) => i.id === 'merchandising'));
assert.ok(!supportNav.some((i) => i.id === 'import'));
assert.ok(!supportNav.some((i) => i.id === 'suppliers'));
assert.ok(!supportNav.some((i) => i.id === 'purchase-orders'));
assert.ok(COMMERCE_OPS_NAV.some((i) => i.id === 'suppliers'));
assert.ok(COMMERCE_OPS_NAV.some((i) => i.id === 'purchase-orders'));
assert.ok(supportNav.some((i) => i.id === 'support'));
assert.ok(supportNav.some((i) => i.id === 'orders'));

const financeNav = filterNavForRoles(['FINANCE']);
assert.ok(financeNav.some((i) => i.id === 'reports'));
assert.ok(financeNav.some((i) => i.id === 'promotions'));
assert.ok(!financeNav.some((i) => i.id === 'products'));

assert.equal(canMutateCommerceFinance(['COMMERCE_ADMIN']), false);
assert.equal(canMutateCommerceFinance(['CUSTOMER']), false);
assert.equal(canMutateCommerceFinance(['FINANCE']), true);
assert.equal(canMutateCommerceFinance(['SUPER_ADMIN']), true);

const adminNav = filterNavForRoles(['COMMERCE_ADMIN']);
assert.equal(adminNav.length, filterNavForRoles(['SUPER_ADMIN']).length);

assert.equal(canAccessCommerceOps(['WRITER']), false);
assert.equal(canAccessCommerceOps(['SUPPORT']), true);
assert.equal(canAccessCommerceOps(['CONTENT_ADMIN']), true);
assert.equal(defaultOpsLanding(['SUPPORT']), '/admin/commerce/support');
assert.equal(defaultOpsLanding(['FINANCE']), '/admin/commerce/reports');
assert.equal(defaultOpsLanding(['CONTENT_ADMIN']), '/admin/cms/pages');

const contentNav = filterNavForRoles(['CONTENT_ADMIN']);
assert.ok(contentNav.some((i) => i.id === 'pages'));
assert.ok(!contentNav.some((i) => i.id === 'orders'));
assert.ok(!contentNav.some((i) => i.id === 'gift-chrome'));
assert.ok(COMMERCE_OPS_NAV.some((i) => i.id === 'gift-chrome'));

assert.equal(
  isNavItemActive('/admin/commerce', {
    id: 'd',
    label: 'D',
    href: '/admin/commerce',
    roles: ['COMMERCE_ADMIN'],
    match: 'exact',
  }),
  true,
);
assert.equal(
  isNavItemActive('/admin/commerce/orders', {
    id: 'd',
    label: 'D',
    href: '/admin/commerce',
    roles: ['COMMERCE_ADMIN'],
    match: 'exact',
  }),
  false,
);
assert.equal(
  isNavItemActive('/admin/commerce/orders/abc', {
    id: 'o',
    label: 'O',
    href: '/admin/commerce/orders',
    roles: ['COMMERCE_ADMIN'],
    match: 'prefix',
  }),
  true,
);

const crumbs = buildOpsBreadcrumbs('/admin/commerce/orders/xyz');
assert.equal(crumbs[0]?.label, 'Commerce Ops');
assert.equal(crumbs[1]?.label, 'Orders');
assert.equal(crumbs.at(-1)?.href, undefined);

const dashCrumb = buildOpsBreadcrumbs('/admin/commerce');
assert.equal(dashCrumb.length, 1);
assert.equal(dashCrumb[0]?.label, 'Dashboard');

const cmsList = buildOpsBreadcrumbs('/admin/cms/pages');
assert.equal(cmsList.length, 1);
assert.equal(cmsList[0]?.label, 'Pages');

const cmsEdit = buildOpsBreadcrumbs('/admin/cms/pages/abc');
assert.equal(cmsEdit[0]?.label, 'Soft Gift CMS');
assert.equal(cmsEdit[0]?.href, '/admin/cms/pages');
assert.equal(cmsEdit[1]?.label, 'Pages');
assert.equal(cmsEdit.at(-1)?.label, 'Edit');

const cmsChrome = buildOpsBreadcrumbs('/admin/cms/gift-chrome');
assert.equal(cmsChrome[0]?.label, 'Soft Gift CMS');
assert.equal(cmsChrome.at(-1)?.label, 'Nav & footer');

console.log('commerce-ops-nav.check: ok');
