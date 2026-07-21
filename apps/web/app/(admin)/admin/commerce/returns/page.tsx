'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/catalog';

type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  adminNote: string | null;
  createdAt: string;
  customerEmail: string;
  order: { id: string; orderNumber: string; status: string; totalPaise: number };
};

export default function AdminReturnsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [filter, setFilter] = useState<'REQUESTED' | ''>('REQUESTED');
  const [windowDays, setWindowDays] = useState(14);
  const [policyMsg, setPolicyMsg] = useState<string | null>(null);

  async function load(status: string) {
    const q = status ? `?status=${status}` : '';
    setRows(await apiAuth<ReturnRow[]>(`/admin/commerce/returns${q}`));
  }

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
    <main className="min-h-screen p-8 max-w-3xl">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Ops
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Returns</h1>

      <section className="mt-4 rounded border p-4 text-sm">
        <h2 className="font-medium">Return window (customisable)</h2>
        <p className="text-xs opacity-60 mt-1">Days after delivery customers may request a return.</p>
        <div className="mt-2 flex gap-2 items-center">
          <input
            type="number"
            min={1}
            max={365}
            className="w-24 rounded border px-2 py-1"
            value={windowDays}
            onChange={(e) => setWindowDays(Number(e.target.value))}
          />
          <span>days</span>
          <button type="button" className="rounded border px-3 py-1" onClick={() => void savePolicy()}>
            Save
          </button>
        </div>
        {policyMsg ? <p className="mt-2 opacity-80">{policyMsg}</p> : null}
      </section>

      <div className="mt-4 flex gap-2 text-sm">
        <button
          type="button"
          className={`rounded border px-2 py-1 ${filter === 'REQUESTED' ? 'bg-neutral-100' : ''}`}
          onClick={() => setFilter('REQUESTED')}
        >
          REQUESTED
        </button>
        <button
          type="button"
          className={`rounded border px-2 py-1 ${filter === '' ? 'bg-neutral-100' : ''}`}
          onClick={() => setFilter('')}
        >
          ALL
        </button>
      </div>

      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            <p className="font-medium">
              {r.order.orderNumber} — {r.status} — {formatInr(r.order.totalPaise)}
            </p>
            <p className="mt-1 opacity-80">{r.reason}</p>
            <p className="text-xs opacity-60 mt-1">{r.customerEmail}</p>
            {r.status === 'REQUESTED' ? (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-green-700"
                  onClick={() => void moderate(r.id, 'APPROVED')}
                >
                  Approve + refund
                </button>
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-red-700"
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
    </main>
  );
}
