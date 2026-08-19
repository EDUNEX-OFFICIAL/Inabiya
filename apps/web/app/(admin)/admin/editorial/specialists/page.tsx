'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Pencil, Plus, Stethoscope, X } from 'lucide-react';
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
      <p className="blog-overline">Editorial</p>
      <h1 className="blog-h1 mt-gs-2">Specialists</h1>

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
          <label className="block text-sm">
            Title
            <input className="blog-input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm">
            Credentials
            <input
              className="blog-input"
              value={credentials}
              onChange={(e) => setCredentials(e.target.value)}
            />
          </label>
          <label className="editorial-span block text-sm">
            Bio
            <textarea className="blog-input min-h-[80px]" value={bio} onChange={(e) => setBio(e.target.value)} />
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
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </label>
                <label className="block">
                  Slug
                  <input
                    className="blog-input"
                    value={edit.slug}
                    onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
                  />
                </label>
                <label className="block">
                  Title
                  <input
                    className="blog-input"
                    value={edit.title}
                    onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                  />
                </label>
                <label className="block">
                  Credentials
                  <input
                    className="blog-input"
                    value={edit.credentials}
                    onChange={(e) => setEdit({ ...edit, credentials: e.target.value })}
                  />
                </label>
                <label className="block">
                  Bio
                  <textarea
                    className="blog-input min-h-[80px]"
                    value={edit.bio}
                    onChange={(e) => setEdit({ ...edit, bio: e.target.value })}
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
                <p className="mt-gs-1 opacity-70">
                  {row.title ? `${row.title} · ` : ''}
                  <Link href={`/specialists/${row.slug}`} className="text-primary hover:underline">
                    /specialists/{row.slug}
                  </Link>
                </p>
                {row.credentials ? <p className="mt-gs-1 opacity-70">{row.credentials}</p> : null}
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
          <EditorialEmpty icon={Stethoscope}>No specialists yet.</EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
