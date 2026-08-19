'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, FolderOpen, Pencil, Plus, X } from 'lucide-react';
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
      <p className="blog-overline">Editorial</p>
      <h1 className="blog-h1 mt-gs-2">Categories</h1>

      <section className="editorial-panel mt-gs-6 p-gs-5">
        <h2 className="font-medium">New</h2>
        <div className="editorial-fields mt-gs-3">
          <label className="block text-sm">
            Name
            <input
              className="blog-input"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugFromName(e.target.value));
              }}
            />
          </label>
          <label className="block text-sm">
            Slug
            <input
              className="blog-input"
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </label>
          <label className="editorial-span block text-sm">
            Description
            <input
              className="blog-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </div>
        <EditorialIconButton
          className="mt-gs-4 w-full sm:w-auto"
          label="Create"
          icon={Plus}
          onClick={() => void create()}
        />
      </section>

      {error ? <p className="blog-banner blog-banner--danger mt-gs-4 text-sm">{error}</p> : null}
      {msg ? <p className="blog-banner blog-banner--success mt-gs-4 text-sm">{msg}</p> : null}

      <ul className="editorial-panel mt-gs-6">
        {rows.map((row) => (
          <li key={row.id} className="editorial-row text-sm">
            {editingId === row.id ? (
              <div className="space-y-gs-3">
                <label className="block">
                  Name
                  <input
                    className="blog-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </label>
                <label className="block">
                  Slug
                  <input
                    className="blog-input"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                  />
                </label>
                <label className="block">
                  Description
                  <input
                    className="blog-input"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap gap-gs-2">
                  <EditorialIconButton label="Save" icon={Check} onClick={() => void saveEdit()} />
                  <EditorialIconButton
                    label="Cancel"
                    icon={X}
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="font-medium">{row.name}</p>
                <p className="mt-gs-1 opacity-70">/{row.slug}</p>
                {row.description ? <p className="mt-gs-1 opacity-70">{row.description}</p> : null}
                <EditorialIconButton
                  className="mt-gs-3"
                  label="Edit"
                  icon={Pencil}
                  variant="secondary"
                  onClick={() => startEdit(row)}
                />
              </>
            )}
          </li>
        ))}
        {rows.length === 0 ? (
          <EditorialEmpty icon={FolderOpen}>No categories yet.</EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
