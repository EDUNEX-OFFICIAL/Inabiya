'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Check, ExternalLink, Pencil, Plus, Search, Stethoscope, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { EditorialEmpty, EditorialIconButton } from '@/components/editorial/editorial-ui';

type Specialist = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  credentials: string | null;
};

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default function EditorialSpecialistsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Specialist[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [credentials, setCredentials] = useState('');
  const [bio, setBio] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', slug: '', title: '', credentials: '', bio: '' });
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      return (
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        (row.title?.toLowerCase().includes(q) ?? false) ||
        (row.credentials?.toLowerCase().includes(q) ?? false) ||
        (row.bio?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [rows, query]);

  async function load() {
    setRows(await apiAuth<Specialist[]>('/editorial/specialists'));
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial/specialists'));
      return;
    }
    void load().catch(() => router.replace('/admin/editorial'));
  }, [router]);

  async function create() {
    setError(null);
    setMsg(null);
    try {
      await apiAuth('/editorial/specialists', {
        method: 'POST',
        json: {
          name: name.trim(),
          slug: (slugTouched ? slug : slugFromName(name)).trim(),
          title: title.trim() || undefined,
          credentials: credentials.trim() || undefined,
          bio: bio.trim() || undefined,
        },
      });
      setName('');
      setSlug('');
      setTitle('');
      setCredentials('');
      setBio('');
      setSlugTouched(false);
      setMsg('Saved');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  function startEdit(row: Specialist) {
    setEditingId(row.id);
    setEdit({
      name: row.name,
      slug: row.slug,
      title: row.title ?? '',
      credentials: row.credentials ?? '',
      bio: row.bio ?? '',
    });
    setMsg(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    setMsg(null);
    try {
      await apiAuth(`/editorial/specialists/${editingId}`, {
        method: 'PATCH',
        json: {
          name: edit.name.trim(),
          slug: edit.slug.trim(),
          title: edit.title.trim() || null,
          credentials: edit.credentials.trim() || null,
          bio: edit.bio.trim() || null,
        },
      });
      setEditingId(null);
      setMsg('Saved');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <main className="blog-page">
      <div className="editorial-page-head">
        <div>
          <p className="blog-overline">Editorial</p>
          <h1 className="blog-h1 mt-gs-2">Specialists</h1>
        </div>
        <div className="editorial-page-head__filters">
          <p className="editorial-page-head__count">
            <Stethoscope aria-hidden />
            {visibleRows.length}
            {query.trim() ? ` / ${rows.length}` : ''}{' '}
            {rows.length === 1 ? 'specialist' : 'specialists'}
          </p>
          {rows.length > 0 ? (
            <div className="editorial-filters editorial-filters--grow">
              <label className="editorial-filters__search">
                <Search aria-hidden />
                <input
                  className="blog-input"
                  type="search"
                  value={query}
                  placeholder="Search name, title, slug…"
                  aria-label="Search specialists"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      <section className="editorial-panel mt-gs-6">
        <div className="editorial-panel__head">
          <Plus aria-hidden />
          Add specialist
        </div>
        <div className="editorial-panel__body">
          <div className="editorial-fields">
            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="specialist-name">
                Name
              </label>
              <input
                id="specialist-name"
                className="blog-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugFromName(e.target.value));
                }}
              />
            </div>
            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="specialist-slug">
                Slug
              </label>
              <input
                id="specialist-slug"
                className="blog-input"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </div>
            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="specialist-title">
                Title
              </label>
              <input
                id="specialist-title"
                className="blog-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="specialist-credentials">
                Credentials
              </label>
              <input
                id="specialist-credentials"
                className="blog-input"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
              />
            </div>
            <div className="editorial-field editorial-span">
              <label className="editorial-field__label" htmlFor="specialist-bio">
                Bio
              </label>
              <textarea
                id="specialist-bio"
                className="blog-input min-h-[5.5rem]"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
          </div>
          <EditorialIconButton
            className="mt-gs-4 w-full sm:w-auto"
            label="Create"
            icon={Plus}
            onClick={() => void create()}
          />
        </div>
      </section>

      {error ? <p className="blog-banner blog-banner--danger mt-gs-4 text-sm">{error}</p> : null}
      {msg ? <p className="blog-banner blog-banner--success mt-gs-4 text-sm">{msg}</p> : null}

      <ul className="editorial-resource-list mt-gs-6">
        {visibleRows.map((row) => (
          <li key={row.id}>
            <article className="editorial-resource-card">
              {editingId === row.id ? (
                <>
                  <div className="editorial-fields">
                    <div className="editorial-field">
                      <label className="editorial-field__label" htmlFor={`edit-name-${row.id}`}>
                        Name
                      </label>
                      <input
                        id={`edit-name-${row.id}`}
                        className="blog-input"
                        value={edit.name}
                        onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                      />
                    </div>
                    <div className="editorial-field">
                      <label className="editorial-field__label" htmlFor={`edit-slug-${row.id}`}>
                        Slug
                      </label>
                      <input
                        id={`edit-slug-${row.id}`}
                        className="blog-input"
                        value={edit.slug}
                        onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
                      />
                    </div>
                    <div className="editorial-field">
                      <label className="editorial-field__label" htmlFor={`edit-title-${row.id}`}>
                        Title
                      </label>
                      <input
                        id={`edit-title-${row.id}`}
                        className="blog-input"
                        value={edit.title}
                        onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                      />
                    </div>
                    <div className="editorial-field">
                      <label
                        className="editorial-field__label"
                        htmlFor={`edit-credentials-${row.id}`}
                      >
                        Credentials
                      </label>
                      <input
                        id={`edit-credentials-${row.id}`}
                        className="blog-input"
                        value={edit.credentials}
                        onChange={(e) => setEdit({ ...edit, credentials: e.target.value })}
                      />
                    </div>
                    <div className="editorial-field editorial-span">
                      <label className="editorial-field__label" htmlFor={`edit-bio-${row.id}`}>
                        Bio
                      </label>
                      <textarea
                        id={`edit-bio-${row.id}`}
                        className="blog-input min-h-[5.5rem]"
                        value={edit.bio}
                        onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="editorial-resource-card__actions">
                    <EditorialIconButton
                      label="Save"
                      icon={Check}
                      onClick={() => void saveEdit()}
                    />
                    <EditorialIconButton
                      label="Cancel"
                      icon={X}
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="editorial-resource-card__head">
                    <div className="editorial-resource-card__id">
                      <h2 className="editorial-resource-card__title">{row.name}</h2>
                      <p className="editorial-resource-card__slug">
                        <Link href={`/specialists/${row.slug}`}>
                          /specialists/{row.slug}
                          <ExternalLink className="ml-1 inline h-3 w-3 opacity-60" aria-hidden />
                        </Link>
                      </p>
                      <p className="editorial-meta editorial-resource-card__meta">
                        {row.title ? <span>{row.title}</span> : null}
                        {row.credentials ? (
                          <span>
                            <Award aria-hidden />
                            {row.credentials}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="editorial-queue-action"
                      onClick={() => startEdit(row)}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </button>
                  </div>
                  {row.bio ? <p className="editorial-resource-card__desc">{row.bio}</p> : null}
                </>
              )}
            </article>
          </li>
        ))}
        {visibleRows.length === 0 ? (
          <EditorialEmpty icon={Stethoscope}>
            {query.trim() ? 'No specialists match your search.' : 'No specialists yet.'}
          </EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
