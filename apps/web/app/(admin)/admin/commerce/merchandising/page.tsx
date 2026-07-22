'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type CmsPageRow = {
  id: string;
  slug: string;
  title: string;
  isHomepage?: boolean;
};

export default function MerchandisingPage() {
  const router = useRouter();
  const [slugs, setSlugs] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [homePageId, setHomePageId] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<{ featuredSlugs: string[]; heroTitle: string; heroSubtitle: string }>(
      '/admin/commerce/storefront',
    )
      .then((c) => {
        setSlugs(c.featuredSlugs.join(', '));
        setHeroTitle(c.heroTitle);
      })
      .catch(() => router.replace('/login'));

    apiAuth<CmsPageRow[]>('/admin/cms/pages')
      .then((pages) => {
        const home = pages.find((p) => p.slug === 'home' || p.isHomepage);
        setHomePageId(home?.id ?? null);
      })
      .catch(() => {
        /* optional — KV form still works */
      });
  }, [router]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    await apiAuth('/admin/commerce/storefront', {
      method: 'POST',
      json: {
        featuredSlugs: slugs
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        heroTitle,
      },
    });
    setMessage(
      'Saved legacy KV (featured slugs) — Soft Gift /gift homepage uses Marketing page blocks, not this form.',
    );
  }

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Dashboard
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Homepage CMS</h1>

      {homePageId ? (
        <p className="mt-4 rounded border border-neutral-900 bg-neutral-50 p-3 text-sm">
          <Link href={`/admin/cms/pages/${homePageId}`} className="font-medium underline">
            Edit Soft Gift homepage (block builder)
          </Link>
          <span className="mt-1 block text-xs opacity-70">
            Homepage blocks are primary — use the page builder for layout and content.
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm opacity-70">
          Soft Gift homepage page not found yet — create slug <code>home</code> under{' '}
          <Link href="/admin/cms/pages" className="underline">
            Marketing pages
          </Link>
          .
        </p>
      )}

      <p className="mt-6 text-xs opacity-70">
        Legacy sync for featured slugs (until fully migrated). Homepage blocks are primary.
      </p>
      <form onSubmit={onSave} className="mt-3 space-y-3 text-sm">
        <label className="block">
          Featured slugs (comma-separated)
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={slugs}
            onChange={(e) => setSlugs(e.target.value)}
          />
        </label>
        <label className="block">
          Hero title
          <input
            className="mt-1 block w-full rounded border px-2 py-1"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
          />
        </label>
        <button type="submit" className="rounded border px-3 py-1">
          Save
        </button>
      </form>
      {message ? <p className="mt-3 text-green-700 text-sm">{message}</p> : null}
    </main>
  );
}
