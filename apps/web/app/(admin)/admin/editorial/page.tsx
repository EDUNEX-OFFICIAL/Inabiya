'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, clearSession, getStoredAccessToken, type AuthUser } from '@/lib/auth-client';

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  medicalGateRequired: boolean;
  dueAt: string | null;
  overdue: boolean;
  assignee: { email: string; displayName: string | null } | null;
  updatedAt: string;
};

type Turnaround = {
  byStatus: Array<{ status: string; count: number }>;
  avgHoursToApprove: number | null;
  overdueCount: number;
  approvedSample: number;
};

const STATUSES = [
  '',
  'ASSIGNED',
  'DRAFT',
  'SEO_REVIEW',
  'MEDICAL_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
] as const;

export default function EditorialAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [status, setStatus] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [stats, setStats] = useState<Turnaround | null>(null);

  const load = useCallback(async (u: AuthUser, st: string, overdue: boolean) => {
    const params = new URLSearchParams();
    const isOps = u.roles.includes('CONTENT_ADMIN') || u.roles.includes('SUPER_ADMIN');
    const isWriterOnly =
      u.roles.includes('WRITER') &&
      !isOps &&
      !u.roles.includes('SEO_EDITOR') &&
      !u.roles.includes('MEDICAL_REVIEWER');
    if (isWriterOnly) {
      params.set('mine', '1');
    }
    if (st) params.set('status', st);
    if (overdue) params.set('overdue', '1');
    const q = params.toString() ? `?${params}` : '';
    setRows(await apiAuth<ArticleRow[]>(`/editorial/articles${q}`));
    if (isOps) {
      setStats(await apiAuth<Turnaround>('/editorial/analytics/turnaround'));
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then(async (u) => {
        const editorial = [
          'CONTENT_ADMIN',
          'WRITER',
          'SEO_EDITOR',
          'MEDICAL_REVIEWER',
          'FINANCE',
          'SUPER_ADMIN',
        ];
        if (!u.roles.some((r) => editorial.includes(r))) {
          throw new Error('Editorial role required');
        }
        setUser(u);
        if (
          u.roles.includes('FINANCE') &&
          !u.roles.some((r) =>
            ['CONTENT_ADMIN', 'WRITER', 'SEO_EDITOR', 'MEDICAL_REVIEWER', 'SUPER_ADMIN'].includes(
              r,
            ),
          )
        ) {
          router.replace('/admin/editorial/payments');
          return;
        }
        await load(u, status, overdueOnly);
      })
      .catch(() => router.replace('/login'));
  }, [router, load, status, overdueOnly]);

  if (!user) {
    return <main className="p-8 text-sm opacity-70">Loading editorial…</main>;
  }

  const isContent = user.roles.includes('CONTENT_ADMIN') || user.roles.includes('SUPER_ADMIN');

  return (
    <main className="min-h-screen p-8 bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Editorial</h1>
          <p className="mt-1 text-sm opacity-70">
            {user.email} · {user.roles.join(', ')}
          </p>
        </div>
        <button
          type="button"
          className="rounded border px-3 py-1.5 text-sm"
          onClick={() => {
            clearSession();
            window.location.href = '/login';
          }}
        >
          Log out
        </button>
      </div>
      {user.roles.includes('SEO_EDITOR') && !isContent ? (
        <p className="mt-2 text-sm text-amber-800">
          SEO queue — showing articles in SEO_REVIEW (change status filter to see others).
        </p>
      ) : null}
      {user.roles.includes('MEDICAL_REVIEWER') && !isContent ? (
        <p className="mt-2 text-sm text-amber-800">
          Medical queue — showing MEDICAL_REVIEW. Only MEDICAL_REVIEWER can approve past the medical
          gate.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        {isContent ? (
          <Link href="/admin/editorial/articles/new" className="rounded border px-3 py-1">
            New assignment
          </Link>
        ) : null}
        <Link href="/admin/editorial/writer" className="rounded border px-3 py-1">
          Writer queue
        </Link>
        {isContent || user.roles.includes('FINANCE') ? (
          <Link href="/admin/editorial/payments" className="rounded border px-3 py-1">
            Writer payments
          </Link>
        ) : null}
        <Link href="/articles" className="rounded border px-3 py-1">
          Public articles
        </Link>
      </div>

      {stats ? (
        <section className="mt-6 rounded border p-4 text-sm max-w-2xl">
          <h2 className="font-medium">Turnaround</h2>
          <p className="mt-1 opacity-80">
            Avg hours to approve: {stats.avgHoursToApprove ?? '—'} · Overdue: {stats.overdueCount} ·
            Approved sample: {stats.approvedSample}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {stats.byStatus.map((s) => (
              <li key={s.status} className="rounded bg-neutral-100 px-2 py-0.5 text-xs">
                {s.status}: {s.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3 text-sm items-center">
        <label>
          Status{' '}
          <select
            className="rounded border px-2 py-1"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s || 'ALL'} value={s}>
                {s || 'ALL'}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
          />
          Overdue only
        </label>
      </div>

      <ul className="mt-4 space-y-2 max-w-2xl">
        {rows.map((a) => (
          <li key={a.id} className="rounded border p-3 text-sm">
            <Link
              href={`/admin/editorial/articles/${a.id}`}
              className="font-medium hover:underline"
            >
              {a.title}
            </Link>
            <p className="opacity-70 mt-1">
              {a.status}
              {a.medicalGateRequired ? ' · medical gate' : ''}
              {a.assignee ? ` · ${a.assignee.displayName ?? a.assignee.email}` : ' · unassigned'}
              {a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ''}
              {a.overdue ? ' · OVERDUE' : ''}
            </p>
          </li>
        ))}
        {rows.length === 0 ? <li className="text-sm opacity-70">No articles yet.</li> : null}
      </ul>
    </main>
  );
}
