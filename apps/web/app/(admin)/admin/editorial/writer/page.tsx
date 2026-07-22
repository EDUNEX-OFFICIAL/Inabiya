'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

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
      router.replace('/login');
      return;
    }
    apiAuth<ArticleRow[]>('/editorial/articles?mine=1')
      .then(setRows)
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <main className="min-h-screen p-8 max-w-2xl">
      <Link href="/admin/editorial" className="text-sm underline opacity-70">
        ← Editorial
      </Link>
      <h1 className="font-display text-3xl mt-4">Writer queue</h1>
      <p className="text-sm opacity-70 mt-1">Assignments assigned to you.</p>
      <ul className="mt-6 space-y-2">
        {rows.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            <Link
              href={`/admin/editorial/articles/${a.id}`}
              className="font-medium hover:underline"
            >
              {a.title}
            </Link>
            <p className="opacity-70 mt-1">{a.status}</p>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-sm opacity-70">No assignments.</li> : null}
      </ul>
    </main>
  );
}
