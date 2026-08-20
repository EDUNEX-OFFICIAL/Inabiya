import assert from 'node:assert/strict';
import { buildArticleTimeline } from './article-timeline';

const at = '2026-08-20T10:00:00.000Z';
const later = '2026-08-20T11:00:00.000Z';
const items = buildArticleTimeline({
  statusHistory: [
    {
      status: 'SEO_REVIEW',
      note: 'Ready',
      createdAt: later,
      actor: { displayName: 'Test Writer', email: 'writer@test.inabiya' },
    },
    {
      status: 'ASSIGNED',
      note: null,
      createdAt: at,
      actor: { displayName: 'Content', email: 'content@test.inabiya' },
    },
  ],
  comments: [
    {
      kind: 'CHANGE_REQUEST',
      body: 'Add intro',
      createdAt: '2026-08-20T10:30:00.000Z',
      author: { displayName: 'SEO', email: 'seo@test.inabiya' },
    },
  ],
  revisions: [
    {
      source: 'AUTO',
      createdAt: '2026-08-20T10:10:00.000Z',
      actor: { displayName: 'Test Writer', email: 'w@x' },
    },
    {
      source: 'MANUAL',
      createdAt: '2026-08-20T10:20:00.000Z',
      actor: { displayName: 'Test Writer', email: 'w@x' },
    },
  ],
  payment: {
    status: 'PENDING',
    amountPaise: 75000,
    createdAt: '2026-08-20T12:00:00.000Z',
    releasedAt: null,
  },
  includePayment: true,
});

assert.equal(items[0].status, 'ASSIGNED');
assert.equal(items[0].actorName, 'Content');
assert.equal(
  items.some((i) => i.kind === 'edit'),
  true,
);
assert.equal(
  items.some((i) => i.kind === 'edit' && i.at.includes('10:10')),
  false,
);
assert.equal(
  items.some((i) => i.kind === 'change_request' && i.detail === 'Add intro'),
  true,
);
assert.equal(items[items.length - 1].kind, 'payment');
assert.equal(items[items.length - 1].amountPaise, 75000);

const hiddenPay = buildArticleTimeline({
  statusHistory: [],
  comments: [],
  revisions: [],
  payment: {
    status: 'PENDING',
    amountPaise: 50000,
    createdAt: at,
    releasedAt: null,
  },
  includePayment: false,
});
assert.equal(hiddenPay.length, 0);

console.log('article-timeline.check: ok');
