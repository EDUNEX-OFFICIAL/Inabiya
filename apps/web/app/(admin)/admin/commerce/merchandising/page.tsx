'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

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
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
    setMessage(null);
    try {
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
        'Saved legacy featured slugs. Soft Gift /gift homepage uses Marketing page blocks as primary.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    }
  }

  return (
    <div className="max-w-xl">
      <OpsPageHeader
        title="Merchandising"
        description="Homepage pins & featured products — preview storefront after changes."
        actions={
          <>
            <Link href="/gift" className="clay-btn-secondary text-sm" target="_blank">
              Preview /gift
            </Link>
            <Link href="/admin/commerce/products" className="clay-btn-secondary text-sm">
              Catalog
            </Link>
          </>
        }
      />

      <section className="mb-6 rounded border border-[color:var(--gift-line)] bg-[color:var(--gift-cream)]/40 p-4 text-sm">
        <h2 className="font-medium">Homepage (primary)</h2>
        {homePageId ? (
          <p className="mt-2">
            <Link href={`/admin/cms/pages/${homePageId}`} className="font-medium underline">
              Edit Soft Gift homepage (block builder)
            </Link>
            <span className="mt-1 block text-xs opacity-70">
              Layout & content live in CMS blocks — this is the source of truth for /gift.
            </span>
          </p>
        ) : (
          <p className="mt-2 opacity-70">
            Soft Gift homepage not found — create slug <code>home</code> under{' '}
            <Link href="/admin/cms/pages" className="underline">
              Marketing pages
            </Link>
            .
          </p>
        )}
      </section>

      <section className="rounded border border-[color:var(--gift-line)] p-4">
        <h2 className="text-sm font-medium">Legacy featured pins</h2>
        <p className="mt-1 text-xs opacity-70">
          Comma-separated product slugs for featured carousels until fully migrated to blocks.
        </p>
        <form onSubmit={onSave} className="mt-3 space-y-3 text-sm">
          <label className="block text-xs">
            Featured slugs
            <input
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
              value={slugs}
              onChange={(e) => setSlugs(e.target.value)}
              placeholder="welcome-hamper, soft-blanket"
            />
          </label>
          <label className="block text-xs">
            Hero title (legacy)
            <input
              className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
            />
          </label>
          <button type="submit" className="clay-btn text-sm">
            Save pins
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-800">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </div>
  );
}
