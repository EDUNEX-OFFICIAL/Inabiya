'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { EditorialIconButton } from '@/components/editorial/editorial-ui';

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
      router.replace(loginUrl('/admin/editorial/articles/new'));
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
    <main className="blog-page">
      <p className="blog-overline">Editorial</p>
      <h1 className="blog-h1 mt-gs-2">New</h1>
      <div className="editorial-panel mt-gs-6 max-w-xl p-gs-5">
      <div className="editorial-fields">
      <label className="editorial-span block text-sm">
        Title
        <input className="blog-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block text-sm">
        Writer
        <select className="blog-input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
          {writers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.displayName ?? w.email}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Due date
        <input
          type="date"
          className="blog-input"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
        />
      </label>
      <label className="editorial-span flex items-center gap-gs-2 text-sm">
        <input
          type="checkbox"
          checked={medicalGateRequired}
          onChange={(e) => setMedicalGateRequired(e.target.checked)}
        />
        Medical gate
      </label>
      <label className="editorial-span block text-sm">
        Brief
        <textarea
          className="blog-input min-h-[80px]"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
      </label>
      </div>
      <EditorialIconButton
        className="mt-gs-4 w-full sm:w-auto"
        label="Create"
        icon={Plus}
        onClick={() => void create()}
      />
      {error ? <p className="blog-banner blog-banner--danger mt-gs-3 text-sm">{error}</p> : null}
      </div>
    </main>
  );
}
