'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type MarketingPage = {
  id: string;
  slug: string;
  title: string;
  status: string;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Record<string, unknown>;
  }>;
};

export default function MarketingPagePreview({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [page, setPage] = useState<MarketingPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(`/login?next=/pages/preview/${params.id}`);
      return;
    }
    apiAuth<MarketingPage>(`/admin/cms/pages/${params.id}/preview`)
      .then(setPage)
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Preview failed');
      });
  }, [params.id, router]);

  if (error) {
    return (
      <main className="gift-page max-w-3xl">
        <p className="text-sm text-danger">{error}</p>
        <Link href="/admin/cms/pages" className="mt-gs-4 inline-block text-sm underline">
          ← Pages
        </Link>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="gift-page max-w-3xl text-sm opacity-70">
        Loading preview…
      </main>
    );
  }

  return (
    <main className={page.slug === 'home' ? '' : 'gift-page max-w-3xl'}>
      <div className="mb-gs-4 flex flex-wrap items-center justify-between gap-gs-2 px-gs-4 pt-gs-4 text-sm sm:px-gs-6">
        <Link href={`/admin/cms/pages/${page.id}`} className="underline opacity-70">
          ← Edit page
        </Link>
        <span className="opacity-70">
          {page.slug === 'home' ? '/gift' : `/pages/${page.slug}`} · {page.status}
        </span>
      </div>
      <MarketingPageBlocks
        blocks={page.blocks}
        layout={page.slug === 'home' ? 'home' : 'page'}
        previewBanner={`Draft preview · ${page.title} · not public until published`}
      />
    </main>
  );
}
