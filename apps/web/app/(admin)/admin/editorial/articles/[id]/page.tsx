'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { apiUrl } from '@/lib/api-base';
import { ArticleEditor } from '@/components/editorial/article-editor';
import { sanitizeArticleHtml, normalizeArticleBody } from '@/lib/article-html';

type ArticleDetail = {
  id: string;
  title: string;
  slug: string;
  body: string;
  status: string;
  medicalGateRequired: boolean;
  dueAt: string | null;
  canEditBody: boolean;
  allowedTransitions: string[];
  assignee: { email: string; displayName: string | null } | null;
  comments: Array<{ id: string; kind: string; body: string; authorName: string; createdAt: string }>;
  statusHistory: Array<{ status: string; note: string | null; actorEmail: string | null; createdAt: string }>;
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

export default function ArticleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [body, setBody] = useState('');
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [specialistSlug, setSpecialistSlug] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [editorKey, setEditorKey] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [dirty, setDirty] = useState(false);
  const [isContent, setIsContent] = useState(false);

  async function load() {
    const me = await apiAuth<{ roles: string[] }>('/auth/me');
    setIsContent(me.roles.includes('CONTENT_ADMIN') || me.roles.includes('SUPER_ADMIN'));
    const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}`);
    setArticle(a);
    setBody(a.body);
    setTitle(a.title);
    setSeoTitle(a.title);
    const [cats, specs] = await Promise.all([
      fetch(apiUrl('/articles/categories')).then((r) => r.json() as Promise<Category[]>),
      fetch(apiUrl('/articles/specialists')).then((r) =>
        r.json() as Promise<Specialist[]>,
      ),
    ]);
    setCategories(cats);
    setSpecialists(specs);
    setEditorKey((k) => k + 1);
    setDirty(false);
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load().catch(() => router.replace('/admin/editorial'));
  }, [params.id, router]);

  // Auto-save every 30s when dirty + editable
  useEffect(() => {
    if (!article?.canEditBody || !dirty) return;
    const t = setInterval(() => {
      void (async () => {
        try {
          const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}`, {
            method: 'PATCH',
            json: { title, body: sanitizeArticleHtml(normalizeArticleBody(body)) },
          });
          setArticle(a);
          setLastSavedAt(new Date());
          setDirty(false);
          setMsg('Auto-saved');
        } catch {
          setMsg('Auto-save failed');
        }
      })();
    }, 30_000);
    return () => clearInterval(t);
  }, [article?.canEditBody, dirty, title, body, params.id, article]);

  async function save() {
    const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}`, {
      method: 'PATCH',
      json: { title, body: sanitizeArticleHtml(normalizeArticleBody(body)) },
    });
    setArticle(a);
    setLastSavedAt(new Date());
    setDirty(false);
    setMsg('Saved');
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
    const a = await apiAuth<ArticleDetail>(`/editorial/articles/${params.id}/comments`, {
      method: 'POST',
      json: { body: comment, kind },
    });
    setArticle(a);
    setComment('');
  }

  function publishPayload() {
    return {
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      categorySlug: categorySlug || undefined,
      specialistSlug: specialistSlug || undefined,
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
    return <main className="p-8 text-sm opacity-70">Loading…</main>;
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl">
      <Link href="/admin/editorial" className="text-sm underline opacity-70">
        ← Editorial
      </Link>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <Link href={`/admin/editorial/articles/${params.id}/preview`} className="underline">
          Internal preview
        </Link>
      </div>
      <p className="mt-4 text-sm opacity-70">
        {article.status}
        {article.medicalGateRequired ? ' · medical gate' : ''}
        {article.assignee ? ` · ${article.assignee.displayName ?? article.assignee.email}` : ''}
        {article.dueAt ? ` · due ${new Date(article.dueAt).toLocaleDateString()}` : ''}
      </p>

      <label className="mt-4 block text-sm">
        Title
        <input
          className="mt-1 w-full rounded border px-2 py-1"
          value={title}
          disabled={!article.canEditBody}
          onChange={(e) => {
            setTitle(e.target.value);
            setDirty(true);
          }}
        />
      </label>
      <div className="mt-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span>Body</span>
          <span className="text-xs opacity-60">
            {dirty ? 'Unsaved changes' : null}
            {lastSavedAt ? ` · Saved ${lastSavedAt.toLocaleTimeString()}` : null}
            {article.canEditBody ? ' · auto-saves every 30s' : null}
          </span>
        </div>
        <div className="mt-1">
          {!article.canEditBody ? (
            <p className="mb-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
              Body is <strong>read-only</strong> in status <strong>{article.status}</strong> — TipTap
              toolbar (Bold, headings, image URL, …) only appears when the article is{' '}
              <strong>ASSIGNED</strong>, <strong>DRAFT</strong>, or <strong>CHANGES_REQUESTED</strong>{' '}
              and you are allowed to edit. Ask Content Admin to send it back for changes if you need
              to edit.
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
        </div>
      </div>
      {article.canEditBody ? (
        <button type="button" className="mt-2 rounded border px-3 py-1 text-sm" onClick={() => void save()}>
          Save draft
        </button>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {article.allowedTransitions.map((s) => (
          <button
            key={s}
            type="button"
            className="rounded border px-3 py-1 text-sm"
            onClick={() => void transition(s)}
          >
            → {s}
          </button>
        ))}
      </div>

      {isContent && (article.status === 'APPROVED' || article.status === 'SCHEDULED') ? (
        <section className="mt-8 rounded border p-4 text-sm space-y-3">
          <h2 className="font-medium">Publish (Phase 7)</h2>
          <p className="opacity-70">
            Public URL after publish:{' '}
            <Link href={`/articles/${article.slug}`} className="underline">
              /articles/{article.slug}
            </Link>
          </p>
          <label className="block">
            SEO title
            <input
              className="mt-1 w-full rounded border px-2 py-1"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
            />
          </label>
          <label className="block">
            SEO description
            <textarea
              className="mt-1 w-full rounded border px-2 py-1 min-h-[60px]"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
            />
          </label>
          <label className="block">
            Category
            <select
              className="mt-1 w-full rounded border px-2 py-1"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Specialist
            <select
              className="mt-1 w-full rounded border px-2 py-1"
              value={specialistSlug}
              onChange={(e) => setSpecialistSlug(e.target.value)}
            >
              <option value="">—</option>
              {specialists.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 items-end">
            <button
              type="button"
              className="rounded border px-3 py-1"
              onClick={() => void publishNow()}
            >
              Publish now
            </button>
            <label>
              Schedule
              <input
                type="datetime-local"
                className="mt-1 block rounded border px-2 py-1"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="rounded border px-3 py-1"
              onClick={() => void schedule()}
            >
              Schedule
            </button>
          </div>
        </section>
      ) : null}

      {article.status === 'PUBLISHED' ? (
        <p className="mt-4 text-sm">
          Live:{' '}
          <Link href={`/articles/${article.slug}`} className="underline">
            /articles/{article.slug}
          </Link>
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="font-medium text-sm">Comments / change requests</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {article.comments.map((c) => (
            <li key={c.id} className="rounded border p-2">
              <span className="text-xs opacity-60">
                {c.kind} · {c.authorName}
              </span>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="rounded border px-2 py-1 text-sm min-h-[60px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="button" className="rounded border px-2 py-1 text-sm" onClick={() => void addComment()}>
              Comment
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-sm"
              onClick={() => void addComment('CHANGE_REQUEST')}
            >
              Change request
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 text-sm opacity-80">
        <h2 className="font-medium">Revisions</h2>
        <ul className="mt-2 space-y-2">
          {(article.revisions ?? []).length === 0 ? (
            <li className="opacity-60">No revisions yet — saved on each body/title change.</li>
          ) : (
            article.revisions.map((r) => (
              <li key={r.id} className="rounded border p-2">
                <p className="text-xs opacity-60">
                  {new Date(r.createdAt).toLocaleString()} · {r.actorName ?? 'unknown'}
                </p>
                <p className="font-medium">{r.title}</p>
                <p className="opacity-70 whitespace-pre-wrap">{r.bodyPreview}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-8 text-sm opacity-80">
        <h2 className="font-medium">Status timeline</h2>
        <ol className="mt-2 space-y-1">
          {article.statusHistory.map((h, i) => (
            <li key={i}>
              {h.status} — {new Date(h.createdAt).toLocaleString()}
              {h.note ? ` (${h.note})` : ''}
            </li>
          ))}
        </ol>
      </section>
      {msg ? <p className="mt-4 text-sm text-green-700">{msg}</p> : null}
    </main>
  );
}
