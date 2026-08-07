'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LifeBuoy, RefreshCw } from 'lucide-react';
import { apiAuth, getStoredAccessToken, getStoredUser } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type Customer360 = {
  profile: {
    id: string;
    email: string;
    displayName: string | null;
    isActive: boolean;
    createdAt: string;
  };
  orderCount: number;
  ltvPaise: number;
  segments: string[];
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalPaise: number;
    createdAt: string;
  }>;
  addresses: Array<{
    id: string;
    label: string | null;
    fullName: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
  }>;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    authorEmail: string | null;
    orderId: string;
    orderNumber: string;
  }>;
  inquiries: Array<{
    id: string;
    type: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
};

function accountTone(isActive: boolean): string {
  return isActive
    ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80'
    : 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
}

function statusLabel(status: string): string {
  if (status === 'PENDING_PAYMENT') return 'Pending pay';
  if (status === 'PAID') return 'Paid';
  if (status === 'PROCESSING') return 'Processing';
  if (status === 'SHIPPED') return 'Shipped';
  if (status === 'DELIVERED') return 'Delivered';
  if (status === 'CANCELLED') return 'Cancelled';
  if (status === 'PAYMENT_FAILED') return 'Pay failed';
  if (status === 'RETURNED') return 'Returned';
  return status;
}

function statusTone(status: string): string {
  if (status === 'PAID' || status === 'DELIVERED') {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  }
  if (status === 'PROCESSING') {
    return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  }
  if (status === 'SHIPPED') {
    return 'bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_28%,transparent)]';
  }
  if (status === 'PAYMENT_FAILED' || status === 'CANCELLED') {
    return 'bg-red-50 text-red-800 ring-1 ring-red-200/80';
  }
  if (status === 'RETURNED') {
    return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
  }
  return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
}

function inquiryTone(status: string): string {
  const s = status.toUpperCase();
  if (s === 'CLOSED' || s === 'RESOLVED' || s === 'DONE') {
    return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80';
  }
  if (s === 'OPEN' || s === 'NEW' || s === 'PENDING') {
    return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/80';
  }
  return 'bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200/80';
}

export default function AdminCustomerDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<Customer360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState<string[]>(() => getStoredUser()?.roles ?? []);
  const canSuspend = roles.includes('COMMERCE_ADMIN') || roles.includes('SUPER_ADMIN');

  const load = useCallback(
    async (opts?: { soft?: boolean }) => {
      setError(null);
      if (opts?.soft) setRefreshing(true);
      else setLoading(true);
      try {
        const me = await apiAuth<{ roles: string[] }>('/auth/me');
        setRoles(me.roles ?? []);
        const next = await apiAuth<Customer360>(`/admin/commerce/customers/${params.id}`);
        setData(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load customer');
        if (!opts?.soft) setData(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [params.id],
  );

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [load, router]);

  async function toggleActive() {
    if (!data || !canSuspend) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const nextActive = !data.profile.isActive;
    try {
      await apiAuth(`/admin/commerce/customers/${params.id}/status`, {
        method: 'PATCH',
        json: { isActive: nextActive },
      });
      await load({ soft: true });
      setNotice(nextActive ? 'Customer reactivated' : 'Customer suspended');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="clay-panel space-y-3 p-4" aria-busy="true" aria-label="Loading customer">
          <div className="h-7 w-56 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="h-4 w-40 animate-pulse rounded bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)]" />
          <div className="mt-4 h-28 animate-pulse rounded-lg bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-2xl">
        <OpsPageHeader
          title="Customer"
          actions={
            <Link href="/admin/commerce/customers" className="clay-btn-ghost min-h-10 text-sm">
              Customers
            </Link>
          }
        />
        <div className="clay-panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-sm opacity-70">{error ?? 'Customer not found.'}</p>
          <Link href="/admin/commerce/customers" className="clay-btn-secondary text-sm">
            Back to customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <OpsPageHeader
        title={data.profile.email}
        actions={
          <>
            <Link
              href="/admin/commerce/customers"
              className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
            >
              <ArrowLeft className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Customers
            </Link>
            <div className="hidden sm:block">
              <Link
                href="/admin/commerce/support"
                className="clay-btn-ghost inline-flex min-h-10 items-center gap-1.5 text-sm"
              >
                <LifeBuoy className="h-3.5 w-3.5 opacity-70" aria-hidden />
                Support
              </Link>
            </div>
            <button
              type="button"
              className="clay-btn-secondary inline-flex min-h-10 items-center gap-1.5 text-sm"
              disabled={loading || refreshing || busy}
              onClick={() => void load({ soft: true })}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 opacity-70 ${refreshing ? 'animate-spin' : ''}`}
                aria-hidden
              />
              Refresh
            </button>
            {canSuspend ? (
              <button
                type="button"
                className={`min-h-10 text-sm disabled:opacity-50 ${
                  data.profile.isActive
                    ? 'clay-btn-secondary border-red-300 text-red-700'
                    : 'clay-btn'
                }`}
                disabled={busy}
                onClick={() => void toggleActive()}
              >
                {data.profile.isActive ? 'Suspend' : 'Reactivate'}
              </button>
            ) : null}
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${accountTone(data.profile.isActive)}`}
        >
          {data.profile.isActive ? 'Active' : 'Suspended'}
        </span>
        <span className="text-xs tabular-nums text-[var(--muted-foreground)]">
          {data.orderCount} orders · LTV {formatInr(data.ltvPaise)}
        </span>
        {data.profile.displayName ? (
          <span className="text-xs text-[var(--muted-foreground)]">{data.profile.displayName}</span>
        ) : null}
        {data.segments.map((s) => (
          <span
            key={s}
            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-neutral-700 ring-1 ring-neutral-200/80"
          >
            {s}
          </span>
        ))}
      </div>

      {notice ? (
        <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      <div
        className={`space-y-4 ${refreshing ? 'opacity-70 transition-opacity' : ''}`}
        aria-busy={refreshing}
      >
        <section className="clay-panel p-3 text-sm sm:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Profile
          </h2>
          <dl className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[11px] text-[var(--muted-foreground)]">Email</dt>
              <dd className="break-words font-medium">{data.profile.email}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[var(--muted-foreground)]">Joined</dt>
              <dd>{new Date(data.profile.createdAt).toLocaleDateString('en-IN')}</dd>
            </div>
          </dl>
        </section>

        <section className="clay-panel p-3 text-sm sm:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Addresses
          </h2>
          {data.addresses.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">No saved addresses.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.addresses.map((a) => (
                <li
                  key={a.id}
                  className="rounded-lg border border-[var(--border-subtle)] p-2.5"
                >
                  <p className="font-medium">
                    {a.fullName}
                    {a.isDefault ? (
                      <span className="ml-1.5 rounded-full bg-[color-mix(in_srgb,var(--primary)_12%,white)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--primary)]">
                        Default
                      </span>
                    ) : null}
                    {a.label ? (
                      <span className="ml-1.5 text-xs font-normal text-[var(--muted-foreground)]">
                        {a.label}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{a.phone}</p>
                  <p className="mt-1 text-[var(--muted-foreground)]">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ''}
                  </p>
                  <p className="text-[var(--muted-foreground)]">
                    {a.city}, {a.state} {a.postalCode} · {a.country}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="clay-panel p-3 text-sm sm:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Orders
          </h2>
          {data.orders.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">No orders.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
              {data.orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  <Link
                    href={`/admin/commerce/orders/${o.id}`}
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {o.orderNumber}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${statusTone(o.status)}`}
                    >
                      {statusLabel(o.status)}
                    </span>
                    <span className="tabular-nums text-xs text-[var(--muted-foreground)]">
                      {formatInr(o.totalPaise)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="clay-panel p-3 text-sm sm:p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
            Notes
          </h2>
          {data.notes.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">No notes yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_92%,white)] p-2.5"
                >
                  <p className="break-words">{n.body}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    <Link
                      href={`/admin/commerce/orders/${n.orderId}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {n.orderNumber}
                    </Link>
                    {' · '}
                    {n.authorEmail ?? 'staff'} · {new Date(n.createdAt).toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="clay-panel p-3 text-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
              Gifting inquiries
            </h2>
            <Link
              href="/admin/commerce/gifting-inquiries"
              className="text-xs font-medium text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            >
              All inquiries
            </Link>
          </div>
          {data.inquiries.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">None for this email.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {data.inquiries.map((i) => (
                <li
                  key={i.id}
                  className="rounded-lg border border-[var(--border-subtle)] p-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{i.type}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none ${inquiryTone(i.status)}`}
                    >
                      {i.status}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-3 text-[var(--muted-foreground)]">{i.message}</p>
                  <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                    {new Date(i.createdAt).toLocaleString('en-IN')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
