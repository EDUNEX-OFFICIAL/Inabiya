'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type Inquiry = {
  id: string;
  type: string;
  fullName: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  estimatedQty: number | null;
  status: string;
  createdAt: string;
};

export default function AdminGiftingInquiriesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inquiry[]>([]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login?next=/admin/commerce/gifting-inquiries');
      return;
    }
    apiAuth<Inquiry[]>('/admin/commerce/gifting-inquiries')
      .then(setRows)
      .catch(() => setRows([]));
  }, [router]);

  return (
    <main className="min-h-screen p-8 max-w-3xl">
      <Link href="/admin/commerce" className="text-sm underline opacity-70">
        ← Commerce
      </Link>
      <h1 className="text-2xl font-semibold mt-4">Gifting inquiries</h1>
      <p className="text-sm opacity-70 mt-1">Corporate / bulk leads (Phase 10D).</p>
      <ul className="mt-6 space-y-4 text-sm">
        {rows.length === 0 ? (
          <li className="opacity-70">No inquiries yet.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="rounded border p-4">
              <p className="font-medium">
                {r.type} · {r.fullName} · {r.email}
              </p>
              <p className="opacity-70 text-xs mt-1">
                {r.company ?? '—'} · qty {r.estimatedQty ?? '—'} · {r.status} ·{' '}
                {new Date(r.createdAt).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{r.message}</p>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
