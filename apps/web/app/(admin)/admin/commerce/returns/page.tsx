'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';
import { OpsPageHeader } from '@/components/commerce-ops/ops-page-header';

type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  adminNote: string | null;
  createdAt: string;
  customerEmail: string;
  order: { id: string; orderNumber: string; status: string; totalPaise: number };
};

function AdminReturnsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusQ = searchParams.get('status');
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [filter, setFilter] = useState<'REQUESTED' | ''>(
    statusQ === 'REQUESTED' || statusQ === null || statusQ === '' ? 'REQUESTED' : '',
  );
  const [windowDays, setWindowDays] = useState(14);
  const [policyMsg, setPolicyMsg] = useState<string | null>(null);

  async function load(status: string) {
    const q = status ? `?status=${status}` : '';
    setRows(await apiAuth<ReturnRow[]>(`/admin/commerce/returns${q}`));
  }

  useEffect(() => {
    if (statusQ === 'REQUESTED') setFilter('REQUESTED');
    else if (statusQ === 'ALL' || statusQ === '') setFilter('');
  }, [statusQ]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void apiAuth<{ windowDays: number }>('/admin/commerce/policy/returns')
      .then((p) => setWindowDays(p.windowDays))
      .catch(() => undefined);
    void load(filter).catch(() => router.replace('/admin/commerce'));
  }, [filter, router]);

  async function savePolicy() {
    const p = await apiAuth<{ windowDays: number }>('/admin/commerce/policy/returns', {
      method: 'POST',
      json: { windowDays },
    });
    setWindowDays(p.windowDays);
    setPolicyMsg(`Saved — return window is ${p.windowDays} days after delivery.`);
  }

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED') {
    await apiAuth(`/admin/commerce/returns/${id}`, {
      method: 'PATCH',
      json: { status },
    });
    await load(filter);
  }

  return (
    <div className="max-w-3xl">
      <OpsPageHeader title="Returns" description="Moderate return requests and policy window." />

      <section className="clay-panel mt-2 p-3 text-sm sm:p-4">
        <h2 className="font-medium">Return window</h2>
        <p className="mt-1 text-xs opacity-60">Days after delivery customers may request a return.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            max={365}
            className="clay-input w-24"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
          <span>days</span>
          <button type="button" className="clay-btn-secondary min-h-10 text-sm" onClick={() => void savePolicy()}>
            Save
          </button>
        </div>
        {policyMsg ? <p className="mt-2 opacity-80">{policyMsg}</p> : null}
      </section>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <button
          type="button"
          className={`clay-btn-secondary min-h-10 px-3 ${filter === 'REQUESTED' ? 'ring-1 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('REQUESTED')}
        >
          REQUESTED
        </button>
        <button
          type="button"
          className={`clay-btn-secondary min-h-10 px-3 ${filter === '' ? 'ring-1 ring-[var(--primary)]' : ''}`}
          onClick={() => setFilter('')}
        >
          ALL
        </button>
      </div>

      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="clay-panel p-3 text-sm">
            <p className="break-words font-medium">
              {r.order.orderNumber} — {r.status} — {formatInr(r.order.totalPaise)}
            </p>
            <p className="mt-1 opacity-80">{r.reason}</p>
            <p className="mt-1 text-xs opacity-60">{r.customerEmail}</p>
            <p className="mt-1">
              <Link className="underline" href={`/admin/commerce/orders/${r.order.id}`}>
                Open order
              </Link>
            </p>
            {r.status === 'REQUESTED' ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="clay-btn-secondary min-h-10 px-3 text-green-700"
                  onClick={() => void moderate(r.id, 'APPROVED')}
                >
                  Approve + refund
                </button>
                <button
                  type="button"
                  className="clay-btn-secondary min-h-10 px-3 text-red-700"
                  onClick={() => void moderate(r.id, 'REJECTED')}
                >
                  Reject
                </button>
              </div>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? <li className="text-sm opacity-70">No returns.</li> : null}
      </ul>
    </div>
  );
}

export default function AdminReturnsPage() {
  return (
    <Suspense fallback={<p className="text-sm opacity-70">Loading returns…</p>}>
      <AdminReturnsInner />
    </Suspense>
  );
}
