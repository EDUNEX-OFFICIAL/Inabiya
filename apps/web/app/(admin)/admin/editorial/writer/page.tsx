'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Inbox } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { ARTICLE_STATUS_LABEL } from '@/lib/editorial-nav';
import { EditorialEmpty } from '@/components/editorial/editorial-ui';

type ArticleRow = {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
};

export default function WriterDashboardPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ArticleRow[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial/writer'));
      return;
    }
    apiAuth<ArticleRow[]>('/editorial/articles?mine=1')
      .then(setRows)
      .catch(() => router.replace(loginUrl('/admin/editorial/writer')));
  }, [router]);

  return (
    <main className="blog-page">
      <p className="blog-overline">Editorial</p>
      <h1 className="blog-h1 mt-gs-2">Writer</h1>
      <ul className="editorial-panel mt-gs-6">
        {rows.map((a) => (
          <li key={a.id}>
            <Link href={`/admin/editorial/articles/${a.id}`} className="editorial-row text-sm">
              <p className="font-display text-lg leading-snug">{a.title}</p>
              <p className="mt-gs-1 text-xs opacity-60">
                {ARTICLE_STATUS_LABEL[a.status] ?? a.status}
              </p>
            </Link>
          </li>
        ))}
        {rows.length === 0 ? <EditorialEmpty icon={Inbox}>No assignments.</EditorialEmpty> : null}
      </ul>
    </main>
  );
}
