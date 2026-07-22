'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type PageRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  blockCount: number;
  isHomepage?: boolean;
};

export default function AdminCmsPagesListPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PageRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/cms/pages');
      return;
    }
    apiAuth<PageRow[]>('/admin/cms/pages')
      .then(setRows)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [router]);

  return (
    <main className="min-h-screen p-8 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/commerce" className="text-sm underline opacity-70">
            ← Commerce
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Marketing pages</h1>
          <p className="mt-1 text-sm opacity-70">
            Soft Gift homepage blocks +{' '}
            <Link href="/admin/cms/gift-chrome" className="underline">
              nav &amp; footer chrome
            </Link>
            .
          </p>
          <p className="text-sm opacity-70">Phase 11B — drag to reorder blocks.</p>
        </div>
        <Link
          href="/admin/cms/pages/new"
          className="rounded bg-neutral-900 px-3 py-2 text-sm text-white"
        >
          New page
        </Link>
      </div>
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      <ul className="mt-6 space-y-2 text-sm">
        {rows.length === 0 ? (
          <li className="opacity-70">No pages yet.</li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border p-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/cms/pages/${r.id}`} className="font-medium underline">
                    {r.title}
                  </Link>
                  {r.slug === 'home' || r.isHomepage ? (
                    <span className="rounded bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                      Homepage
                    </span>
                  ) : null}
                </div>
                <p className="opacity-70 text-xs">
                  /pages/{r.slug} · {r.status} · {r.blockCount} blocks
                </p>
              </div>
              {r.status === 'PUBLISHED' ? (
                <Link href={`/pages/${r.slug}`} className="text-xs underline opacity-80">
                  View
                </Link>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
