'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { ArticleBody } from '@/components/editorial/article-body';
import { ARTICLE_STATUS_LABEL } from '@/lib/editorial-nav';

type Preview = { title: string; slug: string; body: string; status: string; internal: boolean };

export default function ArticlePreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial'));
      return;
    }
    apiAuth<Preview>(`/editorial/articles/${params.id}/preview`)
      .then(setPreview)
      .catch(() => router.replace('/admin/editorial'));
  }, [params.id, router]);

  if (!preview) return <main className="blog-page text-sm opacity-70">Loading preview…</main>;

  return (
    <main className="blog-page max-w-3xl">
      <Link href={`/admin/editorial/articles/${params.id}`} className="text-sm text-primary hover:underline">
        ← Editor
      </Link>
      <p className="blog-overline mt-gs-4">Internal preview</p>
      <h1 className="blog-h1 mt-gs-2">{preview.title}</h1>
      <p className="mt-gs-1 text-sm opacity-60">
        /{preview.slug} · {ARTICLE_STATUS_LABEL[preview.status] ?? preview.status}
      </p>
      <div className="editorial-panel blog-prose mt-gs-6 p-gs-5">
        <ArticleBody body={preview.body} />
      </div>
    </main>
  );
}
