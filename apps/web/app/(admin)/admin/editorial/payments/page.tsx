'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';

type PaymentRow = {
  id: string;
  amountPaise: number;
  status: string;
  releasedAt: string | null;
  writer: { email: string; displayName: string | null };
  article: { id: string; title: string; slug: string; status: string };
};

function formatInr(paise: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export default function WriterPaymentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [canRelease, setCanRelease] = useState(false);

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
      router.replace('/login');
      return;
    }
    void load().catch(() => router.replace('/login'));
  }, [router]);

  async function release(id: string) {
    await apiAuth(`/editorial/writer-payments/${id}/release`, { method: 'POST' });
    setMsg('Payment released');
    await load();
  }

  return (
    <main className="min-h-screen p-8 max-w-3xl">
      <Link href="/admin/editorial" className="text-sm underline opacity-70">
        ← Editorial
      </Link>
      <h1 className="font-display text-3xl mt-4">Writer payments</h1>
      {msg ? <p className="mt-2 text-sm opacity-70">{msg}</p> : null}
      <ul className="mt-6 space-y-3">
        {rows.map((p) => (
          <li key={p.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{p.article.title}</p>
            <p className="opacity-70 mt-1">
              {formatInr(p.amountPaise)} · {p.status} · {p.writer.displayName ?? p.writer.email}
            </p>
            {canRelease && p.status === 'PENDING' ? (
              <button
                type="button"
                className="mt-2 rounded border px-3 py-1"
                onClick={() => void release(p.id)}
              >
                Release
              </button>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? <li className="opacity-70">No writer payments yet.</li> : null}
      </ul>
    </main>
  );
}
