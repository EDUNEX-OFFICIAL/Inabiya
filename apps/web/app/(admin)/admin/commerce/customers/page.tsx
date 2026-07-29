'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';
import { OpsTableScroll } from '@/components/commerce-ops/ops-table-scroll';

type CustomerRow = {
  id: string;
  email: string;
  displayName: string | null;
  isActive: boolean;
  orderCount: number;
  ltvPaise: number;
  phone: string | null;
  segments: string[];
  createdAt: string;
};

type StatusFilter = '' | 'active' | 'suspended';

function CustomersDeskInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const statusParam = (searchParams.get('status') ?? '') as StatusFilter;

  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [qInput, setQInput] = useState(qParam);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (qParam) params.set('q', qParam);
      if (statusParam) params.set('status', statusParam);
      const qs = params.toString();
      const data = await apiAuth<CustomerRow[]>(
        `/admin/commerce/customers${qs ? `?${qs}` : ''}`,
      );
      setRows(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [qParam, statusParam]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load();
  }, [router, load]);

  useEffect(() => {
    setQInput(qParam);
  }, [qParam]);

  function applyFilters(nextQ: string, nextStatus: StatusFilter) {
    const params = new URLSearchParams();
    if (nextQ.trim()) params.set('q', nextQ.trim());
    if (nextStatus) params.set('status', nextStatus);
    const qs = params.toString();
    router.push(`/admin/commerce/customers${qs ? `?${qs}` : ''}`);
  }

  return (
    <div>
      <OpsPageHeader
        title="Customers"
        description="Search by email, name, phone, or order — LTV in paise (display INR)."
        actions={
          <Link href="/admin/commerce/support" className="clay-btn-secondary text-sm">
            Support desk
          </Link>
        }
      />

      <form
        className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(qInput, statusParam);
        }}
      >
        <label className="min-w-0 flex-1 text-xs sm:max-w-xs">
          Search
          <input
            className="mt-1 block w-full min-h-10 rounded border px-2 py-1 text-sm"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="email, phone, order #"
          />
        </label>
        <label className="text-xs">
          Status
          <select
            className="mt-1 block min-h-10 rounded border px-2 py-1 text-sm"
            value={statusParam}
            onChange={(e) => applyFilters(qInput, e.target.value as StatusFilter)}
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <button type="submit" className="clay-btn-secondary min-h-10 px-3 text-sm">
          Apply
        </button>
      </form>

      {error ? <p className="mb-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm opacity-70">Loading…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="rounded border border-dashed p-6 text-sm opacity-70">No customers match.</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <OpsTableScroll>
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide opacity-70">
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Orders</th>
                <th className="py-2 pr-4">LTV</th>
                <th className="py-2">Segments</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b align-top">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/commerce/customers/${c.id}`}
                      className="font-medium underline-offset-2 hover:underline"
                    >
                      {c.email}
                    </Link>
                    <p className="text-xs opacity-60">
                      {c.displayName ? `${c.displayName} · ` : ''}
                      {c.phone ?? 'no phone'}
                    </p>
                  </td>
                  <td className="py-2 pr-4">
                    <span
                      className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                        c.isActive
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-red-100 text-red-900'
                      }`}
                    >
                      {c.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{c.orderCount}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{formatInr(c.ltvPaise)}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {c.segments.length ? (
                        c.segments.map((s) => (
                          <span
                            key={s}
                            className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide"
                          >
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs opacity-50">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </OpsTableScroll>
      ) : null}
    </div>
  );
}

export default function AdminCustomersPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading customers…</p>}>
      <CustomersDeskInner />
    </Suspense>
  );
}
