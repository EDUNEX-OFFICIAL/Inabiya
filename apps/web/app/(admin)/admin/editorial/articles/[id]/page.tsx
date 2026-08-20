'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ExternalLink, Eye, MessageSquare, Save, UserRound } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { apiUrl } from '@/lib/api-base';
import { ArticleEditor } from '@/components/editorial/article-editor';
import { CmsMediaField } from '@/components/cms/cms-media-field';
import { ProductSeoSchemaField } from '@/components/admin/product-seo-schema-field';
import { EditorialStatusRail } from '@/components/editorial/editorial-status-rail';
import {
  EditorialSelect,
  type EditorialSelectOption,
} from '@/components/editorial/editorial-select';
import { EditorialTagField, type EditorialTag } from '@/components/editorial/editorial-tag-field';
import { sanitizeArticleHtml, normalizeArticleBody } from '@/lib/article-html';
import { getSiteOrigin } from '@/lib/cms-seo';
import { BLOG_API, BLOG_PATH, blogIndexPath, blogPostPath } from '@/lib/blog-paths';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/seo-json-ld';
import { ARTICLE_STATUS_LABEL } from '@/lib/editorial-nav';
import type { SeoSchemaEntry } from '@inabiya/validation';

type ArticleDetail = {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: string;
  medicalGateRequired: boolean;
  dueAt: string | null;
  publishedAt?: string | null;
  ogImageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoSchemaExtras?: SeoSchemaEntry[] | null;
  canEditBody: boolean;
  allowedTransitions: string[];
  category: { slug: string; name: string } | null;
  specialist: { slug: string; name: string } | null;
  tags: Array<{ slug: string; name: string }>;
  assignee: { email: string; displayName: string | null } | null;
  comments: Array<{
    id: string;
    kind: string;
    body: string;
    authorName: string;
    createdAt: string;
  }>;
  statusHistory: Array<{
    status: string;
    note: string | null;
    actorEmail: string | null;
    createdAt: string;
  }>;
  revisions: Array<{
    id: string;
    title: string;
    bodyPreview: string;
    actorName: string | null;
    createdAt: string;
  }>;
};

type Category = { slug: string; name: string };
type Specialist = { slug: string; name: string };
type ActivityTab = 'comments' | 'revisions' | 'timeline';

/** SERP hint — same as CMS `CmsPageSeoForm` Count (60 / 160). API hard max is 120 / 320. */
const SEO_TITLE_HINT = 60;
const SEO_TITLE_MAX = 120;
const SEO_DESC_HINT = 160;
const SEO_DESC_MAX = 320;

function articleSlugify(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
}

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [slug, setSlug] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [specialistSlug, setSpecialistSlug] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [tags, setTags] = useState<EditorialTag[]>([]);
  const [tagCatalog, setTagCatalog] = useState<EditorialTag[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isContent, setIsContent] = useState(false);
  const [canEditSchema, setCanEditSchema] = useState(false);
  const [seoSchemaExtras, setSeoSchemaExtras] = useState<SeoSchemaEntry[]>([]);
  const [activity, setActivity] = useState<ActivityTab>('comments');

  async function load() {
    const me = await apiAuth<{ roles: string[] }>('/auth/me');
    setIsContent(me.roles.includes('CONTENT_ADMIN') || me.roles.includes('SUPER_ADMIN'));
    setCanEditSchema(
      me.roles.includes('CONTENT_ADMIN') ||
        me.roles.includes('SUPER_ADMIN') ||
        me.roles.includes('SEO_EDITOR'),
    );
    const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}`);
    setArticle(a);
    setBody(a.body);
    setTitle(a.title);
    setSlug(a.slug);
    setSeoTitle(a.seoTitle ?? a.title);
    setSeoDescription(a.seoDescription ?? '');
    setOgImageUrl(a.ogImageUrl ?? '');
    setSeoSchemaExtras((a.seoSchemaExtras ?? []).filter((e) => e.mode === 'replace').slice(0, 1));
    setCategorySlug(a.category?.slug ?? '');
    setSpecialistSlug(a.specialist?.slug ?? '');
    setTags(a.tags ?? []);
    const [cats, specs, tagRows] = await Promise.all([
      fetch(apiUrl(`${BLOG_API}/categories`)).then((r) => r.json() as Promise<Category[]>),
      fetch(apiUrl(`${BLOG_API}/specialists`)).then((r) => r.json() as Promise<Specialist[]>),
      fetch(apiUrl(`${BLOG_API}/tags`))
        .then((r) => r.json() as Promise<EditorialTag[]>)
        .catch(() => []),
    ]);
    setCategories(cats);
    setSpecialists(specs);
    setTagCatalog(tagRows);
    setEditorKey((k) => k + 1);
    setDirty(false);
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial'));
      return;
    }
    void load().catch(() => router.replace('/admin/editorial'));
  }, [params.id, router]);

  useEffect(() => {
    if (!article?.canEditBody || !dirty) return;
    const t = setInterval(() => {
      void (async () => {
        try {
          await saveAll('auto');
        } catch {
          setMsg('Auto-save failed');
        }
      })();
    }, 30_000);
    return () => clearInterval(t);
  }, [article?.canEditBody, dirty, title, body, tags, isContent, params.id, article]);

  const categoryOptions = useMemo<EditorialSelectOption[]>(
    () => [
      { value: '', label: 'None' },
      ...categories.map((c) => ({ value: c.slug, label: c.name })),
    ],
    [categories],
  );
  const specialistOptions = useMemo<EditorialSelectOption[]>(
    () => [
      { value: '', label: 'None' },
      ...specialists.map((s) => ({ value: s.slug, label: s.name })),
    ],
    [specialists],
  );

  const schemaAutoNodes = useMemo(() => {
    if (!article) return [];
    const origin = getSiteOrigin();
    const headline = seoTitle.trim() || title.trim() || article.title;
    return [
      articleJsonLd({
        headline,
        description: seoDescription.trim() || null,
        slug: slug.trim() || article.slug,
        canonicalPath: blogPostPath(slug.trim() || article.slug),
        imageUrl: ogImageUrl.trim() || null,
        datePublished: article.publishedAt ?? null,
        authorName: article.specialist?.name ?? article.assignee?.displayName ?? null,
        siteOrigin: origin,
      }),
      breadcrumbJsonLd([
        { name: 'Journal', url: `${origin}${BLOG_PATH}` },
        ...(article.category
          ? [
              {
                name: article.category.name,
                url: `${origin}${blogIndexPath({ category: article.category.slug })}`,
              },
            ]
          : []),
        {
          name: headline,
          url: `${origin}${blogPostPath(slug.trim() || article.slug)}`,
        },
      ]),
    ];
  }, [article, seoTitle, title, seoDescription, ogImageUrl, slug]);

  function applyArticle(a: ArticleDetail) {
    setArticle(a);
    setSlug(a.slug);
    setOgImageUrl(a.ogImageUrl ?? '');
    setSeoTitle(a.seoTitle ?? a.title);
    setSeoDescription(a.seoDescription ?? '');
    setSeoSchemaExtras((a.seoSchemaExtras ?? []).filter((e) => e.mode === 'replace').slice(0, 1));
    setCategorySlug(a.category?.slug ?? '');
    setSpecialistSlug(a.specialist?.slug ?? '');
    setTags(a.tags ?? []);
    setTagCatalog((prev) => {
      const extra = (a.tags ?? []).filter((t) => !prev.some((p) => p.slug === t.slug));
      return extra.length ? [...prev, ...extra] : prev;
    });
  }

  function persistPayload(): Record<string, unknown> {
    const json: Record<string, unknown> = {};
    if (article?.canEditBody) {
      json.title = title;
      json.body = sanitizeArticleHtml(normalizeArticleBody(body));
    }
    if (isContent) {
      json.tagSlugs = tags.map((t) => t.slug);
      const nextSlug = articleSlugify(slug);
      if (nextSlug.length >= 3) json.slug = nextSlug;
      json.ogImageUrl = ogImageUrl.trim() || null;
      json.categorySlug = categorySlug || null;
      json.specialistSlug = specialistSlug || null;
      const st = seoTitle.trim();
      const sd = seoDescription.trim();
      if (!st || st.length >= 3) json.seoTitle = st || null;
      if (!sd || sd.length >= 10) json.seoDescription = sd || null;
    }
    if (canEditSchema) {
      json.seoSchemaExtras = seoSchemaExtras.length ? seoSchemaExtras : null;
    }
    return json;
  }

  async function saveAll(kind: 'auto' | 'manual' = 'manual') {
    if (saving) return;
    const json = persistPayload();
    if (Object.keys(json).length === 0) return;
    setSaving(true);
    if (kind === 'manual') setMsg(null);
    try {
      const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}`, {
        method: 'PATCH',
        json,
      });
      applyArticle(a);
      setLastSavedAt(new Date());
      setDirty(false);
      setMsg(kind === 'auto' ? 'Auto-saved' : 'Saved');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function transition(status: string) {
    const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}/transition`, {
      method: 'POST',
      json: { status },
    });
    setArticle(a);
    setMsg(`Moved to ${status}`);
  }

  async function addComment(kind?: 'CHANGE_REQUEST') {
    const text = comment.trim();
    if (!text) return;
    try {
      const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}/comments`, {
        method: 'POST',
        json: { body: text, ...(kind ? { kind } : {}) },
      });
      setArticle(a);
      setComment('');
      setMsg(kind === 'CHANGE_REQUEST' ? 'Change requested' : 'Commented');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Request failed');
    }
  }

  function publishPayload() {
    return {
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      categorySlug: categorySlug || undefined,
      specialistSlug: specialistSlug || undefined,
      tagSlugs: tags.map((t) => t.slug),
      ogImageUrl: ogImageUrl.trim() || undefined,
    };
  }

  async function publishNow() {
    await apiAuth(`/editorial/articles/${params.id}/publish`, {
      method: 'POST',
      json: publishPayload(),
    });
    setMsg('Published');
    await load();
  }

  async function schedule() {
    if (!scheduledAt) {
      setMsg('Pick a schedule time');
      return;
    }
    const iso = scheduledAt.length === 16 ? `${scheduledAt}:00` : scheduledAt;
    await apiAuth(`/editorial/articles/${params.id}/schedule`, {
      method: 'POST',
      json: { ...publishPayload(), scheduledAt: new Date(iso).toISOString() },
    });
    setMsg('Scheduled');
    await load();
  }

  if (!article) {
    return <main className="blog-page text-sm opacity-70">Loading…</main>;
  }

  const showPublish =
    (isContent || canEditSchema) &&
    (article.status === 'APPROVED' ||
      article.status === 'SCHEDULED' ||
      article.status === 'PUBLISHED');
  const revisions = article.revisions ?? [];
  const canSave = article.canEditBody || isContent || canEditSchema;
  const saveLabel =
    article.status === 'PUBLISHED' || article.status === 'SCHEDULED' ? 'Save' : 'Save as draft';
  const msgOk =
    msg === 'Saved' ||
    msg === 'Auto-saved' ||
    msg === 'Published' ||
    msg === 'Scheduled' ||
    msg === 'Commented' ||
    msg === 'Change requested' ||
    Boolean(msg?.startsWith('Moved to '));

  return (
    <main className="blog-page editorial-article">
      {msg ? (
        <p
          className={`blog-banner mt-0 text-sm ${msgOk ? 'blog-banner--success' : 'blog-banner--danger'}`}
        >
          {msg}
        </p>
      ) : null}

      <div className="editorial-article__hero-top">
        <span className="editorial-status-pill">
          {ARTICLE_STATUS_LABEL[article.status] ?? article.status}
        </span>
        <div className="editorial-article__links">
          {canSave ? (
            <>
              <span className="editorial-article__save-meta">
                {dirty
                  ? 'Unsaved'
                  : lastSavedAt
                    ? `Saved ${lastSavedAt.toLocaleTimeString()}`
                    : null}
              </span>
              <button
                type="button"
                className="blog-btn"
                disabled={!dirty || saving}
                onClick={() => void saveAll()}
              >
                <Save className="h-4 w-4" aria-hidden />
                {saving ? 'Saving…' : saveLabel}
              </button>
            </>
          ) : null}
          <Link
            href={`/admin/editorial/articles/${params.id}/preview`}
            className="editorial-article__link"
          >
            <Eye className="h-4 w-4" aria-hidden />
            Preview
          </Link>
          {article.status === 'PUBLISHED' ? (
            <Link href={blogPostPath(article.slug)} className="editorial-article__link">
              <ExternalLink className="h-4 w-4" aria-hidden />
              Live
            </Link>
          ) : null}
        </div>
      </div>

      <header className="editorial-article__hero">
        {article.canEditBody ? (
          <input
            className="editorial-article__title"
            value={title}
            aria-label="Title"
            onChange={(e) => {
              setTitle(e.target.value);
              setDirty(true);
            }}
          />
        ) : (
          <h1 className="editorial-article__title">{title}</h1>
        )}
        <p className="editorial-meta">
          {article.medicalGateRequired ? <span>Medical gate</span> : null}
          <span>
            <UserRound aria-hidden />
            {article.assignee
              ? (article.assignee.displayName ?? article.assignee.email)
              : 'Unassigned'}
          </span>
          {article.dueAt ? (
            <span>
              <Calendar aria-hidden />
              {new Date(article.dueAt).toLocaleDateString()}
            </span>
          ) : null}
        </p>
        <EditorialStatusRail
          spread
          status={article.status}
          medicalGate={article.medicalGateRequired}
        />
      </header>

      <div className="editorial-article__layout">
        <div className="editorial-article__main">
          <section className="editorial-panel editorial-article__editor">
            <div className="editorial-article__editor-head">
              <h2 className="editorial-article__section">Body</h2>
            </div>
            {!article.canEditBody ? (
              <p className="blog-banner blog-banner--info mb-gs-3 px-gs-3 py-gs-2 text-xs">
                Read-only
              </p>
            ) : null}
            <ArticleEditor
              key={`${article.id}-${editorKey}`}
              initialContent={body}
              editable={article.canEditBody}
              enableMediaLibrary={article.canEditBody}
              onChange={(html) => {
                setBody(html);
                setDirty(true);
              }}
            />
          </section>

          {isContent ? (
            <section className="editorial-panel editorial-article__card">
              <h2 className="editorial-article__section">Tags</h2>
              <EditorialTagField
                value={tags}
                catalog={tagCatalog}
                onChange={(next) => {
                  setTags(next);
                  setDirty(true);
                }}
              />
            </section>
          ) : null}

          {isContent ? (
            <section className="editorial-panel editorial-article__card editorial-article__seo">
              <h2 className="editorial-article__section">SEO</h2>
              <div className="editorial-field">
                <span className="editorial-field__label">Slug</span>
                <div className="editorial-slug">
                  <span className="editorial-slug__prefix">/blog/</span>
                  <input
                    className="blog-input"
                    value={slug}
                    aria-label="Slug"
                    spellCheck={false}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setDirty(true);
                    }}
                    onBlur={() => {
                      const next = articleSlugify(slug);
                      if (next) setSlug(next);
                    }}
                  />
                </div>
              </div>
              <div className="editorial-field">
                <span className="editorial-field__label">
                  SEO title
                  <SeoCount n={seoTitle.length} max={SEO_TITLE_HINT} />
                </span>
                <input
                  className="blog-input"
                  value={seoTitle}
                  maxLength={SEO_TITLE_MAX}
                  onChange={(e) => {
                    setSeoTitle(e.target.value);
                    setDirty(true);
                  }}
                />
              </div>
              <div className="editorial-field">
                <span className="editorial-field__label">
                  SEO description
                  <SeoCount n={seoDescription.length} max={SEO_DESC_HINT} />
                </span>
                <textarea
                  className="blog-input editorial-article__seo-desc"
                  rows={5}
                  value={seoDescription}
                  maxLength={SEO_DESC_MAX}
                  onChange={(e) => {
                    setSeoDescription(e.target.value);
                    setDirty(true);
                  }}
                />
              </div>
            </section>
          ) : null}

          {showPublish && canEditSchema ? (
            <section className="editorial-panel editorial-article__card">
              <h2 className="editorial-article__section">Schema</h2>
              <ProductSeoSchemaField
                embedded
                radioName="article-schema-mode"
                autoLabel="Auto from article fields"
                manualLabel="Edit JSON yourself"
                emptyPreview="Fill title, SEO & cover to preview"
                value={seoSchemaExtras}
                onChange={(v) => {
                  setSeoSchemaExtras(v);
                  setDirty(true);
                }}
                autoPreviewNodes={schemaAutoNodes}
                publicUrl={`${getSiteOrigin()}${blogPostPath(slug.trim() || article.slug)}`}
              />
            </section>
          ) : null}

          <section className="editorial-panel editorial-article__card">
            <div className="editorial-article__tabs" role="tablist" aria-label="Activity">
              <ActivityTabBtn
                id="comments"
                current={activity}
                count={article.comments.length}
                onSelect={setActivity}
              >
                Comments
              </ActivityTabBtn>
              <ActivityTabBtn
                id="revisions"
                current={activity}
                count={revisions.length}
                onSelect={setActivity}
              >
                Revisions
              </ActivityTabBtn>
              <ActivityTabBtn
                id="timeline"
                current={activity}
                count={article.statusHistory.length}
                onSelect={setActivity}
              >
                Timeline
              </ActivityTabBtn>
            </div>

            {activity === 'comments' ? (
              <div className="editorial-article__tabpanel">
                {article.comments.length === 0 ? (
                  <p className="editorial-article__empty">No comments.</p>
                ) : (
                  <ul className="editorial-article__list">
                    {article.comments.map((c) => (
                      <li key={c.id} className="editorial-article__note">
                        <span className="editorial-article__note-meta">
                          {c.kind} · {c.authorName}
                        </span>
                        <p>{c.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="editorial-field mt-gs-4">
                  <span className="editorial-field__label">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    Comment
                  </span>
                  <textarea
                    className="blog-input min-h-[72px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="editorial-article__actions">
                  <button
                    type="button"
                    className="blog-btn-secondary"
                    disabled={!comment.trim()}
                    onClick={() => void addComment()}
                  >
                    Comment
                  </button>
                  <button
                    type="button"
                    className="blog-btn-ghost"
                    disabled={!comment.trim()}
                    onClick={() => void addComment('CHANGE_REQUEST')}
                  >
                    Change request
                  </button>
                </div>
              </div>
            ) : null}

            {activity === 'revisions' ? (
              <div className="editorial-article__tabpanel">
                {revisions.length === 0 ? (
                  <p className="editorial-article__empty">No revisions yet.</p>
                ) : (
                  <ul className="editorial-article__list">
                    {revisions.map((r) => (
                      <li key={r.id} className="editorial-article__note">
                        <span className="editorial-article__note-meta">
                          {new Date(r.createdAt).toLocaleString()} · {r.actorName ?? 'unknown'}
                        </span>
                        <p className="font-medium">{r.title}</p>
                        <p className="whitespace-pre-wrap opacity-70">{r.bodyPreview}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {activity === 'timeline' ? (
              <div className="editorial-article__tabpanel">
                <ol className="editorial-article__timeline">
                  {article.statusHistory.map((h, i) => (
                    <li key={`${h.status}-${h.createdAt}-${i}`}>
                      <span>{ARTICLE_STATUS_LABEL[h.status] ?? h.status}</span>
                      <time dateTime={h.createdAt}>{new Date(h.createdAt).toLocaleString()}</time>
                      {h.note ? <p>{h.note}</p> : null}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>
        </div>

        {article.allowedTransitions.length > 0 || (showPublish && isContent) ? (
          <aside className="editorial-article__side">
            {article.allowedTransitions.length > 0 ? (
              <section className="editorial-panel editorial-article__card">
                <h2 className="editorial-article__section">Move to</h2>
                <div className="editorial-article__stack">
                  {article.allowedTransitions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="blog-btn-secondary"
                      onClick={() => void transition(s)}
                    >
                      {ARTICLE_STATUS_LABEL[s] ?? s}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            {showPublish && isContent ? (
              <section className="editorial-panel editorial-article__card">
                <h2 className="editorial-article__section">
                  {article.status === 'PUBLISHED' ? 'Cover' : 'Publish'}
                </h2>
                <div className="editorial-field">
                  <span className="editorial-field__label">Cover</span>
                  <CmsMediaField
                    value={ogImageUrl}
                    onChange={(v) => {
                      setOgImageUrl(v);
                      setDirty(true);
                    }}
                  />
                </div>
                <div className="editorial-field">
                  <span className="editorial-field__label">Category</span>
                  <EditorialSelect
                    ariaLabel="Category"
                    value={categorySlug}
                    onChange={(v) => {
                      setCategorySlug(v);
                      setDirty(true);
                    }}
                    options={categoryOptions}
                  />
                </div>
                <div className="editorial-field">
                  <span className="editorial-field__label">Specialist</span>
                  <EditorialSelect
                    ariaLabel="Specialist"
                    value={specialistSlug}
                    onChange={(v) => {
                      setSpecialistSlug(v);
                      setDirty(true);
                    }}
                    options={specialistOptions}
                  />
                </div>
                {article.status !== 'PUBLISHED' ? (
                  <div className="editorial-article__stack">
                    <button type="button" className="blog-btn" onClick={() => void publishNow()}>
                      Publish
                    </button>
                    <div className="editorial-field">
                      <span className="editorial-field__label">Schedule</span>
                      <input
                        type="datetime-local"
                        className="blog-input"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      className="blog-btn-secondary"
                      onClick={() => void schedule()}
                    >
                      Schedule
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
          </aside>
        ) : null}
      </div>
    </main>
  );
}

function SeoCount({ n, max }: { n: number; max: number }) {
  return (
    <span className={`editorial-field__count${n > max ? ' is-over' : ''}`}>
      {n}/{max}
    </span>
  );
}

function ActivityTabBtn({
  id,
  current,
  count,
  onSelect,
  children,
}: {
  id: ActivityTab;
  current: ActivityTab;
  count: number;
  onSelect: (id: ActivityTab) => void;
  children: string;
}) {
  const selected = current === id;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      className={`editorial-article__tab${selected ? ' is-on' : ''}`}
      onClick={() => onSelect(id)}
    >
      {children}
      <span>{count}</span>
    </button>
  );
}
