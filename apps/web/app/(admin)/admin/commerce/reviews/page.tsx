'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type ReviewRow = {
  id: string;
  rating: number;
  headline: string | null;
  body: string;
  status: string;
  customerEmail: string;
  product: { slug: string; title: string };
  createdAt: string;
};

export default function AdminReviewsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | ''>('PENDING');

  async function load(status: string) {
    const q = status ? `?status=${status}` : '';
    const data = await apiAuth<ReviewRow[]>(`/admin/commerce/reviews${q}`);
    setRows(data);
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load(filter).catch(() => router.replace('/admin/commerce'));
  }, [filter, router]);

  async function moderate(id: string, status: 'APPROVED' | 'REJECTED') {
    await apiAuth(`/admin/commerce/reviews/${id}`, {
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
      <h1 className="text-2xl font-semibold mt-4">Reviews</h1>
      <div className="mt-3 flex gap-2 text-sm">
        {(['PENDING', 'APPROVED', 'REJECTED', ''] as const).map((s) => (
          <button
            key={s || 'ALL'}
            type="button"
            className={`rounded border px-2 py-1 ${filter === s ? 'bg-neutral-100' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s || 'ALL'}
          </button>
        ))}
      </div>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            <p className="font-medium">
              {r.rating}★ {r.product.title} — {r.status}
            </p>
            <p className="opacity-80 mt-1">{r.headline ? `${r.headline}: ` : ''}{r.body}</p>
            <p className="text-xs opacity-60 mt-1">{r.customerEmail}</p>
            {r.status === 'PENDING' ? (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="rounded border px-2 py-1 text-green-700"
                  onClick={() => void moderate(r.id, 'APPROVED')}
                >
                  Approve
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
        {rows.length === 0 ? <li className="text-sm opacity-70">No reviews.</li> : null}
      </ul>
    </main>
  );
}
