'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FolderOpen, Pencil, Plus, Search, X } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { EditorialEmpty, EditorialIconButton } from '@/components/editorial/editorial-ui';

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

export default function EditorialCategoriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        (row.description?.toLowerCase().includes(q) ?? false),
    );
  }, [rows, query]);

  async function load() {
    setRows(await apiAuth<Category[]>('/editorial/categories'));
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial/categories'));
      return;
    }
    void load().catch(() => router.replace('/admin/editorial'));
  }, [router]);

  async function create() {
    setError(null);
    setMsg(null);
    try {
      await apiAuth('/editorial/categories', {
        method: 'POST',
        json: {
          name: name.trim(),
          slug: (slugTouched ? slug : slugFromName(name)).trim(),
          description: description.trim() || undefined,
        },
      });
      setName('');
      setSlug('');
      setDescription('');
      setSlugTouched(false);
      setMsg('Saved');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  function startEdit(row: Category) {
    setEditingId(row.id);
    setEditName(row.name);
    setEditSlug(row.slug);
    setEditDescription(row.description ?? '');
    setMsg(null);
    setError(null);
  }

  async function saveEdit() {
    if (!editingId) return;
    setError(null);
    setMsg(null);
    try {
      await apiAuth(`/editorial/categories/${editingId}`, {
        method: 'PATCH',
        json: {
          name: editName.trim(),
          slug: editSlug.trim(),
          description: editDescription.trim() || null,
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
          <h1 className="blog-h1 mt-gs-2">Categories</h1>
        </div>
        <div className="editorial-page-head__filters">
          <p className="editorial-page-head__count">
            <FolderOpen aria-hidden />
            {visibleRows.length}
            {query.trim() ? ` / ${rows.length}` : ''}{' '}
            {rows.length === 1 ? 'category' : 'categories'}
          </p>
          {rows.length > 0 ? (
            <div className="editorial-filters editorial-filters--grow">
              <label className="editorial-filters__search">
                <Search aria-hidden />
                <input
                  className="blog-input"
                  type="search"
                  value={query}
                  placeholder="Search name or slug…"
                  aria-label="Search categories"
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
          Add category
        </div>
        <div className="editorial-panel__body">
          <div className="editorial-fields">
            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="category-name">
                Name
              </label>
              <input
                id="category-name"
                className="blog-input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugFromName(e.target.value));
                }}
              />
            </div>
            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="category-slug">
                Slug
              </label>
              <input
                id="category-slug"
                className="blog-input"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
              />
            </div>
            <div className="editorial-field editorial-span">
              <label className="editorial-field__label" htmlFor="category-description">
                Description
              </label>
              <input
                id="category-description"
                className="blog-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="editorial-field">
                      <label className="editorial-field__label" htmlFor={`edit-slug-${row.id}`}>
                        Slug
                      </label>
                      <input
                        id={`edit-slug-${row.id}`}
                        className="blog-input"
                        value={editSlug}
                        onChange={(e) => setEditSlug(e.target.value)}
                      />
                    </div>
                    <div className="editorial-field editorial-span">
                      <label
                        className="editorial-field__label"
                        htmlFor={`edit-description-${row.id}`}
                      >
                        Description
                      </label>
                      <input
                        id={`edit-description-${row.id}`}
                        className="blog-input"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
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
                      <p className="editorial-resource-card__slug">/{row.slug}</p>
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
                  {row.description ? (
                    <p className="editorial-resource-card__desc">{row.description}</p>
                  ) : null}
                </>
              )}
            </article>
          </li>
        ))}
        {visibleRows.length === 0 ? (
          <EditorialEmpty icon={FolderOpen}>
            {query.trim() ? 'No categories match your search.' : 'No categories yet.'}
          </EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
