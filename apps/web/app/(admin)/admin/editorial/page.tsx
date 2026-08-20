'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  ExternalLink,
  Inbox,
  Pencil,
  PenLine,
  Timer,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl, type AuthUser } from '@/lib/auth-client';
import {
  ARTICLE_STATUS_LABEL,
  canSeeWriterFee,
  editorialQueueActions,
  type EditorialQueueAction,
} from '@/lib/editorial-nav';
import { EditorialEmpty } from '@/components/editorial/editorial-ui';
import {
  EditorialSelect,
  type EditorialSelectOption,
} from '@/components/editorial/editorial-select';
import { EditorialStatusRail } from '@/components/editorial/editorial-status-rail';

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  medicalGateRequired: boolean;
  dueAt: string | null;
  writerFeePaise?: number;
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

type WriterOption = { id: string; email: string; displayName: string | null };

const STATUS_OPTIONS: EditorialSelectOption[] = [
  { value: '', label: 'All' },
  { value: 'ASSIGNED', label: ARTICLE_STATUS_LABEL.ASSIGNED ?? 'Assigned' },
  { value: 'DRAFT', label: ARTICLE_STATUS_LABEL.DRAFT ?? 'Draft' },
  { value: 'SEO_REVIEW', label: ARTICLE_STATUS_LABEL.SEO_REVIEW ?? 'SEO' },
  { value: 'MEDICAL_REVIEW', label: ARTICLE_STATUS_LABEL.MEDICAL_REVIEW ?? 'Medical' },
  { value: 'CHANGES_REQUESTED', label: ARTICLE_STATUS_LABEL.CHANGES_REQUESTED ?? 'Changes' },
  { value: 'APPROVED', label: ARTICLE_STATUS_LABEL.APPROVED ?? 'Approved' },
  { value: 'SCHEDULED', label: ARTICLE_STATUS_LABEL.SCHEDULED ?? 'Scheduled' },
  { value: 'PUBLISHED', label: ARTICLE_STATUS_LABEL.PUBLISHED ?? 'Published' },
];

export default function EditorialAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [status, setStatus] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [writers, setWriters] = useState<WriterOption[]>([]);
  const [stats, setStats] = useState<Turnaround | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async (u: AuthUser, st: string, assignee: string) => {
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
    if (isOps && assignee) params.set('assigneeId', assignee);
    const q = params.toString() ? `?${params}` : '';
    setRows(await apiAuth<ArticleRow[]>(`/editorial/articles${q}`));
    if (isOps) {
      setStats(await apiAuth<Turnaround>('/editorial/analytics/turnaround'));
    }
  }, []);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial'));
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
        const isOps = u.roles.includes('CONTENT_ADMIN') || u.roles.includes('SUPER_ADMIN');
        if (isOps) {
          setWriters(await apiAuth<WriterOption[]>('/editorial/writers'));
        }
        await load(u, status, assigneeId);
      })
      .catch(() => router.replace(loginUrl('/admin/editorial')));
  }, [router, load, status, assigneeId]);

  if (!user) {
    return <main className="blog-page text-sm opacity-70">Loading…</main>;
  }

  const actor = user;
  const isOps = actor.roles.includes('CONTENT_ADMIN') || actor.roles.includes('SUPER_ADMIN');
  const published = stats?.byStatus.find((s) => s.status === 'PUBLISHED')?.count ?? 0;
  const avg = stats?.avgHoursToApprove;

  const assigneeOptions: EditorialSelectOption[] = [
    { value: '', label: 'All writers' },
    { value: 'unassigned', label: 'Unassigned' },
    ...writers.map((w) => ({ value: w.id, label: w.displayName ?? w.email })),
  ];

  async function runAction(
    id: string,
    action: Exclude<EditorialQueueAction, 'edit' | 'preview' | 'live'>,
  ) {
    if (busyId) return;
    if (action === 'delete' && confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      setActionError(null);
      return;
    }
    setBusyId(id);
    setActionError(null);
    setConfirmDeleteId(null);
    try {
      if (action === 'hide') {
        await apiAuth(`/editorial/articles/${id}/unpublish`, { method: 'POST', json: {} });
      } else if (action === 'draft') {
        await apiAuth(`/editorial/articles/${id}/return-to-draft`, { method: 'POST', json: {} });
      } else {
        await apiAuth(`/editorial/articles/${id}`, { method: 'DELETE' });
      }
      await load(actor, status, assigneeId);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="blog-page">
      <div className="flex flex-col gap-gs-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="blog-overline">Editorial</p>
          <h1 className="blog-h1 mt-gs-2">Queue</h1>
        </div>
        <div className="editorial-filters">
          <div className="editorial-filters__status">
            Status
            <EditorialSelect
              variant="inline"
              ariaLabel="Filter by workflow status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </div>
          {isOps ? (
            <div className="editorial-filters__status editorial-filters__segment">
              Writer
              <EditorialSelect
                variant="inline"
                ariaLabel="Filter by assigned writer"
                value={assigneeId}
                onChange={setAssigneeId}
                options={assigneeOptions}
              />
            </div>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="blog-banner blog-banner--danger mt-gs-4 text-sm">{actionError}</p>
      ) : null}

      {stats ? (
        <section className="editorial-stats mt-gs-6" aria-label="Queue stats">
          <StatTile
            icon={<Timer className="h-4 w-4" aria-hidden />}
            label="Approve avg"
            value={avg == null ? '—' : `${avg}h`}
          />
          <StatTile
            icon={<Clock className="h-4 w-4" aria-hidden />}
            label="Overdue"
            value={String(stats.overdueCount)}
            alert={stats.overdueCount > 0}
          />
          <StatTile
            icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
            label="Published"
            value={String(published)}
          />
        </section>
      ) : null}

      <ul className="editorial-queue mt-gs-4">
        {rows.map((a) => {
          const actions = editorialQueueActions(a.status, isOps);
          return (
            <li key={a.id}>
              <article className="editorial-queue-card">
                <div className="editorial-queue-card__main">
                  <div className="editorial-queue-card__head">
                    <div className="editorial-queue-card__id">
                      <Link
                        href={`/admin/editorial/articles/${a.id}`}
                        className="editorial-queue-card__title"
                      >
                        {a.title}
                      </Link>
                      <p className="editorial-queue-card__slug">/blog/{a.slug}</p>
                    </div>
                    <span className="editorial-status-pill">
                      {ARTICLE_STATUS_LABEL[a.status] ?? a.status}
                    </span>
                  </div>
                  <EditorialStatusRail
                    spread
                    status={a.status}
                    medicalGate={a.medicalGateRequired}
                  />
                  <p className="editorial-meta">
                    {a.medicalGateRequired ? <span>Medical gate</span> : null}
                    <span>
                      <UserRound aria-hidden />
                      {a.assignee ? (a.assignee.displayName ?? a.assignee.email) : 'Unassigned'}
                    </span>
                    {a.dueAt ? (
                      <span>
                        <Calendar aria-hidden />
                        {new Date(a.dueAt).toLocaleDateString()}
                      </span>
                    ) : null}
                    {canSeeWriterFee(actor.roles) && a.writerFeePaise != null ? (
                      <span>
                        <Wallet aria-hidden />
                        {formatWriterFee(a.writerFeePaise)}
                      </span>
                    ) : null}
                    {a.overdue ? (
                      <span className="editorial-meta__danger">
                        <AlertTriangle aria-hidden />
                        Overdue
                      </span>
                    ) : null}
                  </p>
                  <div className="editorial-queue-card__actions">
                    {actions.map((action) => (
                      <QueueAction
                        key={action}
                        action={action}
                        articleId={a.id}
                        slug={a.slug}
                        busy={busyId === a.id}
                        confirmDelete={confirmDeleteId === a.id}
                        onRun={() => void runAction(a.id, action as 'hide' | 'draft' | 'delete')}
                      />
                    ))}
                  </div>
                </div>
              </article>
            </li>
          );
        })}
        {rows.length === 0 ? <EditorialEmpty icon={Inbox}>No articles yet.</EditorialEmpty> : null}
      </ul>
    </main>
  );
}

function StatTile({
  icon,
  label,
  value,
  alert,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className={`editorial-stat${alert ? ' is-alert' : ''}`}>
      <span className="editorial-stat__lead">
        <span className="editorial-stat__icon">{icon}</span>
        <span className="editorial-stat__label">{label}</span>
      </span>
      <p className="editorial-stat__value">{value}</p>
    </div>
  );
}

function QueueAction({
  action,
  articleId,
  slug,
  busy,
  confirmDelete,
  onRun,
}: {
  action: EditorialQueueAction;
  articleId: string;
  slug: string;
  busy: boolean;
  confirmDelete: boolean;
  onRun: () => void;
}) {
  const cls = `editorial-queue-action${action === 'delete' ? ' is-danger' : ''}`;
  if (action === 'edit') {
    return (
      <Link href={`/admin/editorial/articles/${articleId}`} className={cls}>
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        Edit
      </Link>
    );
  }
  if (action === 'preview') {
    return (
      <Link href={`/admin/editorial/articles/${articleId}/preview`} className={cls}>
        <Eye className="h-3.5 w-3.5" aria-hidden />
        Preview
      </Link>
    );
  }
  if (action === 'live') {
    return (
      <Link href={`/blog/${slug}`} className={cls}>
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        Live
      </Link>
    );
  }
  const label =
    action === 'hide'
      ? 'Hide'
      : action === 'draft'
        ? 'Draft'
        : confirmDelete
          ? 'Delete?'
          : 'Delete';
  const Icon = action === 'delete' ? Trash2 : action === 'hide' ? EyeOff : PenLine;
  return (
    <button type="button" className={cls} disabled={busy} onClick={onRun}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </button>
  );
}

function formatWriterFee(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format((paise ?? 0) / 100);
}
