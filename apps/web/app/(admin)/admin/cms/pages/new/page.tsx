'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

export default function AdminCmsNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/cms/pages/new');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const page = await apiAuth<{ id: string }>('/admin/cms/pages', {
        method: 'POST',
        json: {
          title,
          slug: slug.trim().toLowerCase(),
          blocks: [
            {
              type: 'hero',
              props: {
                headline: title || 'New page',
                subcopy: 'Edit this page in the CMS.',
                ctaLabel: 'Shop gifts',
                ctaHref: '/gift',
              },
            },
          ],
        },
      });
      router.push(`/admin/cms/pages/${page.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/cms/pages" className="text-sm underline opacity-70">
        ← Pages
      </Link>
      <h1 className="text-2xl font-semibold mt-4">New marketing page</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-3 text-sm">
        <label className="block">
          Title
          <input
            required
            className="mt-1 block w-full rounded border px-2 py-1"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slug) {
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '')
                    .slice(0, 80),
                );
              }
            }}
          />
        </label>
        <label className="block">
          Slug
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="mt-1 block w-full rounded border px-2 py-1"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
        </label>
        {error ? <p className="text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-neutral-900 px-3 py-2 text-white disabled:opacity-50"
        >
          {busy ? 'Creating…' : 'Create'}
        </button>
      </form>
    </main>
  );
}
