'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, Inbox, UserRound, Wallet } from 'lucide-react';
import { apiAuth, getStoredAccessToken, loginUrl } from '@/lib/auth-client';
import { EditorialEmpty, EditorialIconButton } from '@/components/editorial/editorial-ui';

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
      router.replace(loginUrl('/admin/editorial/payments'));
      return;
    }
    void load().catch(() => router.replace(loginUrl('/admin/editorial/payments')));
  }, [router]);

  async function release(id: string) {
    await apiAuth(`/editorial/writer-payments/${id}/release`, { method: 'POST' });
    setMsg('Released');
    await load();
  }

  return (
    <main className="blog-page">
      <p className="blog-overline">Editorial</p>
      <h1 className="blog-h1 mt-gs-2">Payments</h1>
      {msg ? <p className="blog-banner blog-banner--success mt-gs-4 text-sm">{msg}</p> : null}
      <ul className="editorial-panel mt-gs-6">
        {rows.map((p) => (
          <li key={p.id} className="editorial-row text-sm">
            <p className="font-display text-lg leading-snug">{p.article.title}</p>
            <p className="editorial-meta">
              <span>
                <Wallet aria-hidden />
                {formatInr(p.amountPaise)}
              </span>
              <span>{p.status}</span>
              <span>
                <UserRound aria-hidden />
                {p.writer.displayName ?? p.writer.email}
              </span>
            </p>
            {canRelease && p.status === 'PENDING' ? (
              <EditorialIconButton
                className="mt-gs-3"
                label="Release"
                icon={Banknote}
                onClick={() => void release(p.id)}
              />
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? (
          <EditorialEmpty icon={Inbox}>No writer payments yet.</EditorialEmpty>
        ) : null}
      </ul>
    </main>
  );
}
