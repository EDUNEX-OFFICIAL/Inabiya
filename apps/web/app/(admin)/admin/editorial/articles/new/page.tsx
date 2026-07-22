'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type Writer = { id: string; email: string; displayName: string | null };

export default function NewArticlePage() {
  const router = useRouter();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [medicalGateRequired, setMedicalGateRequired] = useState(true);
  const [brief, setBrief] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<Writer[]>('/editorial/writers')
      .then((w) => {
        setWriters(w);
        setAssigneeId(w[0]?.id ?? '');
      })
      .catch(() => router.replace('/admin/editorial'));
  }, [router]);

  async function create() {
    try {
      const article = await apiAuth<{ id: string }>('/editorial/articles', {
        method: 'POST',
        json: {
          title,
          assigneeId: assigneeId || undefined,
          medicalGateRequired,
          brief: brief || undefined,
          dueAt: dueAt || undefined,
        },
      });
      router.push(`/admin/editorial/articles/${article.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  return (
    <main className="min-h-screen p-8 max-w-lg">
      <Link href="/admin/editorial" className="text-sm underline opacity-70">
        ← Editorial
      </Link>
      <h1 className="text-2xl font-semibold mt-4">New assignment</h1>
      <label className="mt-4 block text-sm">
        Title
        <input
          className="mt-1 w-full rounded border px-2 py-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="mt-3 block text-sm">
        Writer
        <select
          className="mt-1 w-full rounded border px-2 py-1"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          {writers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.displayName ?? w.email}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={medicalGateRequired}
          onChange={(e) => setMedicalGateRequired(e.target.checked)}
        />
        Medical gate required
      </label>
      <label className="mt-3 block text-sm">
        Due date
        <input
          type="date"
          className="mt-1 w-full rounded border px-2 py-1"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </label>
      <label className="mt-3 block text-sm">
        Brief
        <textarea
          className="mt-1 w-full rounded border px-2 py-1 min-h-[80px]"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </label>
      <button
        type="button"
        className="mt-4 rounded border px-3 py-1 text-sm"
        onClick={() => void create()}
      >
        Create
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </main>
  );
}
