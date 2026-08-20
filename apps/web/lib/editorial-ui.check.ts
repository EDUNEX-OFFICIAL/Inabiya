import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  editorialDisplayName,
  editorialInitials,
  editorialRoleLabel,
} from '../components/editorial/editorial-ui';
import { blogPostPath, rewriteLegacyArticlesPath } from './blog-paths';

assert.equal(
  editorialInitials({
    id: '1',
    email: 'ada@inabiya.test',
    displayName: 'Ada Lovelace',
    roles: ['WRITER'],
  }),
  'AL',
);
assert.equal(
  editorialDisplayName({
    id: '1',
    email: 'ada@inabiya.test',
    displayName: null,
    roles: ['WRITER'],
  }),
  'ada',
);
assert.equal(editorialRoleLabel(['CONTENT_ADMIN']), 'Content admin');
assert.equal(editorialRoleLabel(['FINANCE', 'WRITER']), 'Writer');

const queuePage = readFileSync(join(__dirname, '../app/(admin)/admin/editorial/page.tsx'), 'utf8');
assert.match(queuePage, /EditorialSelect/);
assert.doesNotMatch(queuePage, /<select[\s>]/);
assert.doesNotMatch(queuePage, /value: 'OVERDUE'/);
assert.match(queuePage, /editorial-queue-card__actions/);
assert.match(queuePage, /editorial-queue-card__slug/);
assert.match(queuePage, /\/blog\/\{a\.slug\}/);

const selectCss = readFileSync(join(__dirname, '../app/globals.css'), 'utf8');
assert.match(selectCss, /\[data-theme='blog'\]\.editorial-select-menu/);
assert.doesNotMatch(selectCss, /\[data-theme='blog'\] \.editorial-select-menu/);

const selectSrc = readFileSync(
  join(__dirname, '../components/editorial/editorial-select.tsx'),
  'utf8',
);
assert.match(selectSrc, /className=\{`editorial-select-menu fixed/);

const articlePage = readFileSync(
  join(__dirname, '../app/(admin)/admin/editorial/articles/[id]/page.tsx'),
  'utf8',
);
assert.match(articlePage, /EditorialSelect/);
assert.match(articlePage, /editorial-slug/);
assert.match(articlePage, /editorial-slug__prefix">\/blog\//);
assert.doesNotMatch(articlePage, /readOnly/);
assert.match(articlePage, /ProductSeoSchemaField/);
assert.doesNotMatch(articlePage, /SeoSchemaPanel/);
assert.match(articlePage, /SEO_TITLE_HINT = 60/);
assert.match(articlePage, /SEO_DESC_HINT = 160/);
assert.match(articlePage, /EditorialTagField/);
assert.match(articlePage, /saveAll/);
assert.doesNotMatch(articlePage, /saveSeo/);
assert.doesNotMatch(articlePage, /editorial-article__savebar/);
assert.match(articlePage, /className="editorial-article__hero-top"/);
assert.doesNotMatch(
  articlePage,
  /editorial-article__hero">\s*<div className="editorial-article__hero-top"/,
);
assert.match(articlePage, /addComment\('CHANGE_REQUEST'\)/);
assert.match(articlePage, /disabled=\{!comment.trim\(\)\}/);
assert.doesNotMatch(articlePage, /<select[\s>]/);
assert.doesNotMatch(articlePage, /max-w-4xl/);
assert.match(selectCss, /\.blog-page\.editorial-article/);
assert.match(selectCss, /max-width: min\(100%, 96rem\)/);

assert.equal(blogPostPath('sleep-cues'), '/blog/sleep-cues');
assert.equal(rewriteLegacyArticlesPath('/articles/sleep-cues'), '/blog/sleep-cues');
assert.equal(rewriteLegacyArticlesPath('/articles?tag=sleep'), '/blog?tag=sleep');
assert.equal(rewriteLegacyArticlesPath('/blog/sleep-cues'), '/blog/sleep-cues');

console.log('editorial-ui.check: ok');
