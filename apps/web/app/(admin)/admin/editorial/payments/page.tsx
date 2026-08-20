'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CheckCircle2, Clock, Inbox, Pencil, UserRound, Wallet } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { EditorialEmpty } from '@/components/editorial/editorial-ui';
import {
  EditorialSelect,
  type EditorialSelectOption,
} from '@/components/editorial/editorial-select';

type PaymentRow = {
  id: string;
  amountPaise: number;
  status: string;
  releasedAt: string | null;
  writer: { email: string; displayName: string | null };
  article: { id: string; title: string; slug: string; status: string };
};

const STATUS_OPTIONS: EditorialSelectOption[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'RELEASED', label: 'Released' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function formatInr(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

function paymentStatusLabel(status: string) {
  if (status === 'PENDING') return 'Pending';
  if (status === 'RELEASED') return 'Released';
  if (status === 'CANCELLED') return 'Cancelled';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

function paymentStatusClass(status: string) {
  if (status === 'PENDING') return 'is-warning';
  if (status === 'RELEASED') return 'is-muted';
  if (status === 'CANCELLED') return 'is-muted';
  return '';
}

export default function WriterPaymentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canRelease, setCanRelease] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'PENDING');
    const released = rows.filter((r) => r.status === 'RELEASED');
    return {
      pendingCount: pending.length,
      pendingTotal: pending.reduce((sum, r) => sum + r.amountPaise, 0),
      releasedCount: released.length,
    };
  }, [rows]);

  const visibleRows = useMemo(
    () => (status ? rows.filter((r) => r.status === status) : rows),
    [rows, status],
  );

  async function load() {
    const me = await apiAuth<{ roles: string[] }>('/auth/me');
    const allowed = ['FINANCE', 'CONTENT_ADMIN', 'SUPER_ADMIN'];
    if (!me.roles.some((r) => allowed.includes(r))) {
      throw new Error('Forbidden');
    }
    setCanRelease(me.roles.includes('FINANCE') || me.roles.includes('SUPER_ADMIN'));
    setRows(await apiAuth<PaymentRow[]>('/editorial/writer-payments'));
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl('/admin/editorial/payments'));
      return;
    }
    void load().catch(() => router.replace(loginUrl('/admin/editorial/payments')));
  }, [router]);

  async function release(id: string) {
    if (busyId) return;
    setBusyId(id);
    setError(null);
    setMsg(null);
    try {
      await apiAuth(`/editorial/writer-payments/${id}/release`, { method: 'POST' });
      setMsg('Released');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusyId(null);
    }
  }

  const emptyMessage =
    status === 'PENDING'
      ? 'No pending payments.'
      : status === 'RELEASED'
        ? 'No released payments.'
        : status === 'CANCELLED'
          ? 'No cancelled payments.'
          : 'No writer payments yet.';

  return (
    <main className="blog-page">
      <div className="editorial-page-head">
        <div>
          <p className="blog-overline">Editorial</p>
          <h1 className="blog-h1 mt-gs-2">Payments</h1>
        </div>
        <div className="editorial-filters">
          <div className="editorial-filters__status">
            Status
            <EditorialSelect
              variant="inline"
              ariaLabel="Filter by payment status"
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>
      </div>

      {error ? <p className="blog-banner blog-banner--danger mt-gs-4 text-sm">{error}</p> : null}
      {msg ? <p className="blog-banner blog-banner--success mt-gs-4 text-sm">{msg}</p> : null}

      <section className="editorial-stats mt-gs-6" aria-label="Payment stats">
        <div className={`editorial-stat${stats.pendingCount > 0 ? ' is-alert' : ''}`}>
          <span className="editorial-stat__lead">
            <span className="editorial-stat__icon">
              <Clock aria-hidden />
            </span>
            <span className="editorial-stat__label">Pending</span>
          </span>
          <p className="editorial-stat__value">{stats.pendingCount}</p>
        </div>
        <div className="editorial-stat">
          <span className="editorial-stat__lead">
            <span className="editorial-stat__icon">
              <Wallet aria-hidden />
            </span>
            <span className="editorial-stat__label">Awaiting release</span>
          </span>
          <p className="editorial-stat__value">{formatInr(stats.pendingTotal)}</p>
        </div>
        <div className="editorial-stat">
          <span className="editorial-stat__lead">
            <span className="editorial-stat__icon">
              <CheckCircle2 aria-hidden />
            </span>
            <span className="editorial-stat__label">Released</span>
          </span>
          <p className="editorial-stat__value">{stats.releasedCount}</p>
        </div>
      </section>

      <ul className="editorial-resource-list mt-gs-6">
        {visibleRows.map((p) => (
          <li key={p.id}>
            <article className="editorial-resource-card">
              <div className="editorial-resource-card__head">
                <div className="editorial-resource-card__id">
                  <Link
                    href={`/admin/editorial/articles/${p.article.id}`}
                    className="editorial-resource-card__title editorial-queue-card__title"
                  >
                    {p.article.title}
                  </Link>
                  <p className="editorial-resource-card__slug">/blog/{p.article.slug}</p>
                  <p className="editorial-meta editorial-resource-card__meta">
                    <span className="editorial-payment-amount">{formatInr(p.amountPaise)}</span>
                    <span>
                      <UserRound aria-hidden />
                      {p.writer.displayName ?? p.writer.email}
                    </span>
                    {p.releasedAt ? (
                      <span>
                        <CheckCircle2 aria-hidden />
                        {new Date(p.releasedAt).toLocaleDateString()}
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-gs-2">
                  <span className={`editorial-status-pill ${paymentStatusClass(p.status)}`.trim()}>
                    {paymentStatusLabel(p.status)}
                  </span>
                  {canRelease && p.status === 'PENDING' ? (
                    <button
                      type="button"
                      className="editorial-queue-action"
                      disabled={busyId === p.id}
                      onClick={() => void release(p.id)}
                    >
                      <Banknote className="h-3.5 w-3.5" aria-hidden />
                      Release
                    </button>
                  ) : (
                    <Link
                      href={`/admin/editorial/articles/${p.article.id}`}
                      className="editorial-queue-action"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Article
                    </Link>
                  )}
                </div>
              </div>
            </article>
          </li>
        ))}
        {visibleRows.length === 0 ? (
          <EditorialEmpty icon={Inbox}>{emptyMessage}</EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
