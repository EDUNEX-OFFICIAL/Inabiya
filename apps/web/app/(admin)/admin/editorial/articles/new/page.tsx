'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Stethoscope } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { EditorialCheck, EditorialIconButton } from '@/components/editorial/editorial-ui';
import {
  EditorialSelect,
  type EditorialSelectOption,
} from '@/components/editorial/editorial-select';

type Writer = { id: string; email: string; displayName: string | null };

export default function NewArticlePage() {
  const router = useRouter();
  const [writers, setWriters] = useState<Writer[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [medicalGateRequired, setMedicalGateRequired] = useState(true);
  const [brief, setBrief] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [writerFeeRupees, setWriterFeeRupees] = useState('500');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const writerOptions = useMemo<EditorialSelectOption[]>(
    () => writers.map((w) => ({ value: w.id, label: w.displayName ?? w.email })),
    [writers],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial/articles/new'));
      return;
    }
    apiAuth<Writer[]>('/editorial/writers')
      .then((w) => {
        setWriters(w);
        setAssigneeId(w[0]?.id ?? '');
        setLoaded(true);
      })
      .catch(() => router.replace('/admin/editorial'));
  }, [router]);

  async function create() {
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    const feePaise = rupeesToPaise(writerFeeRupees);
    if (feePaise == null) {
      setError('Writer fee must be a whole rupee amount.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const article = await apiAuth<{ id: string }>('/editorial/articles', {
        method: 'POST',
        json: {
          title: trimmed,
          assigneeId: assigneeId || undefined,
          medicalGateRequired,
          brief: brief.trim() || undefined,
          dueAt: dueAt || undefined,
          writerFeePaise: feePaise,
        },
      });
      router.push(`/admin/editorial/articles/${article.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
      setBusy(false);
    }
  }

  return (
    <main className="blog-page">
      <div>
        <p className="blog-overline">Editorial</p>
        <h1 className="blog-h1 mt-gs-2">New article</h1>
      </div>

      {error ? <p className="blog-banner blog-banner--danger mt-gs-4 text-sm">{error}</p> : null}

      {!loaded ? (
        <p className="mt-gs-6 text-sm opacity-70">Loading…</p>
      ) : (
        <section className="editorial-panel mt-gs-6 p-gs-5">
          <div className="editorial-fields">
            <div className="editorial-field editorial-span">
              <label className="editorial-field__label" htmlFor="new-article-title">
                Title
              </label>
              <input
                id="new-article-title"
                className="blog-input"
                value={title}
                autoFocus
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && title.trim()) void create();
                }}
              />
            </div>

            <div className="editorial-field">
              <span className="editorial-field__label">Writer</span>
              <EditorialSelect
                ariaLabel="Writer"
                value={assigneeId}
                onChange={setAssigneeId}
                options={writerOptions}
                disabled={writers.length === 0}
              />
            </div>

            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="new-article-due">
                Due date
              </label>
              <input
                id="new-article-due"
                type="date"
                className="blog-input"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>

            <div className="editorial-field">
              <label className="editorial-field__label" htmlFor="new-article-fee">
                Writer fee (₹)
              </label>
              <input
                id="new-article-fee"
                type="number"
                min={0}
                step={1}
                inputMode="numeric"
                className="blog-input"
                value={writerFeeRupees}
                onChange={(e) => setWriterFeeRupees(e.target.value)}
              />
            </div>

            <div className="editorial-field">
              <span className="editorial-field__label">Medical review</span>
              <EditorialCheck
                id="new-article-medical-review"
                label=""
                aria-label="Medical review"
                icon={Stethoscope}
                checked={medicalGateRequired}
                onChange={(e) => setMedicalGateRequired(e.target.checked)}
              />
            </div>

            <div className="editorial-field editorial-span">
              <label className="editorial-field__label" htmlFor="new-article-brief">
                Brief
              </label>
              <textarea
                id="new-article-brief"
                className="blog-input min-h-[6rem]"
                value={brief}
                placeholder="Angle, sources, word count…"
                onChange={(e) => setBrief(e.target.value)}
              />
            </div>
          </div>

          <EditorialIconButton
            className="mt-gs-4 w-full sm:w-auto"
            label={busy ? 'Creating…' : 'Create'}
            icon={Plus}
            disabled={
              busy ||
              !title.trim() ||
              writers.length === 0 ||
              rupeesToPaise(writerFeeRupees) == null
            }
            onClick={() => void create()}
          />
        </section>
      )}
    </main>
  );
}

function rupeesToPaise(raw: string): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
  const paise = n * 100;
  if (paise > 10_000_000) return null;
  return paise;
}
