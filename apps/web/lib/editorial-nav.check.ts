import assert from 'node:assert/strict';
import {
  canAccessEditorial,
  canSeeWriterFee,
  defaultEditorialLanding,
  editorialQueueActions,
  filterEditorialNav,
  isEditorialNavActive,
  splitEditorialBottomNav,
  EDITORIAL_NAV,
} from './editorial-nav';

assert.equal(canAccessEditorial(['CUSTOMER']), false);
assert.equal(canAccessEditorial(['WRITER']), true);
assert.equal(canAccessEditorial(['FINANCE']), true);

const writerNav = filterEditorialNav(['WRITER']);
assert.ok(writerNav.some((i) => i.id === 'queue'));
assert.ok(writerNav.some((i) => i.id === 'writer'));
assert.ok(!writerNav.some((i) => i.id === 'new'));
assert.ok(!writerNav.some((i) => i.id === 'payments'));
assert.ok(!writerNav.some((i) => i.id === 'categories'));
assert.ok(!writerNav.some((i) => i.id === 'specialists'));

const seoNav = filterEditorialNav(['SEO_EDITOR']);
assert.ok(seoNav.some((i) => i.id === 'queue'));
assert.ok(!seoNav.some((i) => i.id === 'new'));
assert.ok(!seoNav.some((i) => i.id === 'payments'));

const medNav = filterEditorialNav(['MEDICAL_REVIEWER']);
assert.ok(medNav.some((i) => i.id === 'queue'));
assert.ok(!medNav.some((i) => i.id === 'new'));

const financeNav = filterEditorialNav(['FINANCE']);
assert.ok(financeNav.some((i) => i.id === 'payments'));
assert.ok(!financeNav.some((i) => i.id === 'queue'));
assert.ok(!financeNav.some((i) => i.id === 'new'));
assert.ok(!financeNav.some((i) => i.id === 'categories'));

const contentNav = filterEditorialNav(['CONTENT_ADMIN']);
assert.ok(contentNav.some((i) => i.id === 'new'));
assert.ok(contentNav.some((i) => i.id === 'payments'));
assert.ok(contentNav.some((i) => i.id === 'categories'));
assert.ok(contentNav.some((i) => i.id === 'specialists'));
assert.ok(!contentNav.some((i) => i.id === 'writer'));
assert.equal(contentNav.length, filterEditorialNav(['SUPER_ADMIN']).length);

const superNav = filterEditorialNav(['SUPER_ADMIN']);
assert.ok(!superNav.some((i) => i.id === 'writer'));

assert.equal(canSeeWriterFee(['WRITER']), false);
assert.equal(canSeeWriterFee(['SEO_EDITOR']), false);
assert.equal(canSeeWriterFee(['MEDICAL_REVIEWER']), false);
assert.equal(canSeeWriterFee(['CONTENT_ADMIN']), true);
assert.equal(canSeeWriterFee(['FINANCE']), true);
assert.equal(canSeeWriterFee(['SUPER_ADMIN']), true);

assert.equal(defaultEditorialLanding(['FINANCE']), '/admin/editorial/payments');
assert.equal(defaultEditorialLanding(['WRITER']), '/admin/editorial');
assert.equal(defaultEditorialLanding(['CONTENT_ADMIN']), '/admin/editorial');

assert.equal(
  isEditorialNavActive('/admin/editorial', {
    id: 'queue',
    label: 'Queue',
    href: '/admin/editorial',
    roles: ['CONTENT_ADMIN'],
    match: 'exact',
  }),
  true,
);
assert.equal(
  isEditorialNavActive('/admin/editorial/articles/new', {
    id: 'queue',
    label: 'Queue',
    href: '/admin/editorial',
    roles: ['CONTENT_ADMIN'],
    match: 'exact',
  }),
  false,
);
assert.equal(
  isEditorialNavActive('/admin/editorial/articles/new', {
    id: 'new',
    label: 'New',
    href: '/admin/editorial/articles/new',
    roles: ['CONTENT_ADMIN'],
    match: 'prefix',
  }),
  true,
);

assert.ok(EDITORIAL_NAV.every((i) => i.id !== 'campaigns'));

const contentBottom = splitEditorialBottomNav(filterEditorialNav(['CONTENT_ADMIN']));
assert.deepEqual(
  contentBottom.tabs.map((i) => i.id),
  ['queue', 'journal'],
);
assert.equal(contentBottom.fab?.id, 'new');
assert.deepEqual(
  contentBottom.more.map((i) => i.id),
  ['payments', 'categories', 'specialists'],
);

const writerBottom = splitEditorialBottomNav(filterEditorialNav(['WRITER']));
assert.equal(writerBottom.fab, null);
assert.equal(writerBottom.more.length, 0);
assert.deepEqual(
  writerBottom.tabs.map((i) => i.id),
  ['queue', 'writer', 'journal'],
);

const financeBottom = splitEditorialBottomNav(filterEditorialNav(['FINANCE']));
assert.equal(financeBottom.fab, null);
assert.deepEqual(
  financeBottom.tabs.map((i) => i.id),
  ['journal'],
);
assert.ok(financeBottom.more.some((i) => i.id === 'payments'));

assert.deepEqual(editorialQueueActions('PUBLISHED', true), [
  'edit',
  'preview',
  'live',
  'hide',
  'draft',
]);
assert.deepEqual(editorialQueueActions('SCHEDULED', true), ['edit', 'preview', 'hide', 'draft']);
assert.deepEqual(editorialQueueActions('APPROVED', true), ['edit', 'preview', 'draft', 'delete']);
assert.deepEqual(editorialQueueActions('DRAFT', true), ['edit', 'preview', 'delete']);
assert.deepEqual(editorialQueueActions('PUBLISHED', false), ['edit', 'preview', 'live']);

console.log('editorial-nav.check: ok');
