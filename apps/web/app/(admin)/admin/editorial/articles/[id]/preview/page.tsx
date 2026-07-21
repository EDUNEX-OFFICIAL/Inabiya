'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { ArticleBody } from '@/components/editorial/article-body';

type Preview = { title: string; slug: string; body: string; status: string; internal: boolean };

export default function ArticlePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<Preview>(`/editorial/articles/${params.id}/preview`)
      .then(setPreview)
      .catch(() => router.replace('/admin/editorial'));
  }, [params.id, router]);

  if (!preview) return <main className="p-8 text-sm opacity-70">Loading preview…</main>;

  return (
    <main className="min-h-screen p-8 max-w-2xl">
      <Link href={`/admin/editorial/articles/${params.id}`} className="text-sm underline opacity-70">
        ← Back to editor
      </Link>
      <p className="mt-2 text-xs uppercase tracking-wide text-amber-700">Internal preview · not published</p>
      <h1 className="font-display text-3xl mt-4">{preview.title}</h1>
      <p className="text-sm opacity-60 mt-1">
        /{preview.slug} · {preview.status}
      </p>
      <div className="mt-8 text-[15px]">
        <ArticleBody body={preview.body} />
      </div>
    </main>
  );
}
