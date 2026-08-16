'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { slugifyTitle } from '@/components/cms/page-builder/cms-page-model';

export default function AdminCmsNewPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/cms/pages/new'));
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
                subcopy: '',
                ctaLabel: 'Shop gifts',
                ctaHref: '/',
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
    <div className="mx-auto max-w-lg">
      <OpsPageHeader title="New page" />
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 text-sm">
        <label className="block">
          Title
          <input
            required
            className="clay-input mt-1 block w-full"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugifyTitle(e.target.value));
            }}
          />
        </label>
        <label className="block">
          Slug
          <input
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            className="clay-input mt-1 block w-full font-mono text-xs"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </label>
        {error ? <p className="text-red-600">{error}</p> : null}
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="clay-btn text-sm disabled:opacity-50">
            {busy ? 'Creating…' : 'Create'}
          </button>
          <Link href="/admin/cms/pages" className="clay-btn-ghost text-sm">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
