'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/creator';

type Detail = {
  id: string;
  title: string;
  slug: string;
  status: string;
  budgetPaise: number;
  brief: string;
  proposals: Array<{
    id: string;
    pitch: string;
    bidPaise: number;
    status: string;
    creator: { displayName: string; slug: string };
  }>;
  messages: Array<{ id: string; body: string; sender: { displayName: string | null; email: string } }>;
  deliverables: Array<{ id: string; title: string; status: string; url: string | null }>;
  payment: { id: string; amountPaise: number; status: string } | null;
};

export default function BrandCampaignDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [c, setC] = useState<Detail | null>(null);
  const [msgBody, setMsgBody] = useState('');
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    setC(await apiAuth<Detail>(`/creator/campaigns/${params.id}`));
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load().catch(() => router.replace('/creator/brand'));
  }, [params.id, router]);

  async function award(proposalId: string) {
    await apiAuth(`/creator/campaigns/${params.id}/award/${proposalId}`, { method: 'POST' });
    setNote('Winner awarded');
    await load();
  }

  async function close() {
    await apiAuth(`/creator/campaigns/${params.id}/close`, { method: 'POST' });
    await load();
  }

  async function review(deliverableId: string, status: 'APPROVED' | 'CHANGES_REQUESTED') {
    await apiAuth(`/creator/campaigns/${params.id}/deliverables/${deliverableId}/review`, {
      method: 'POST',
      json: { status },
    });
    await load();
  }

  async function release() {
    await apiAuth(`/creator/campaigns/${params.id}/payment/release`, { method: 'POST' });
    setNote('Payment released');
    await load();
  }

  async function sendMsg() {
    await apiAuth(`/creator/campaigns/${params.id}/messages`, {
      method: 'POST',
      json: { body: msgBody },
    });
    setMsgBody('');
    await load();
  }

  if (!c) return <main className="p-8 text-sm opacity-70">Loading…</main>;

  return (
    <main className="px-8 py-12 max-w-3xl">
      <Link href="/creator/brand" className="text-sm underline opacity-70">
        ← Brand
      </Link>
      <h1 className="font-display text-3xl mt-4 text-[var(--primary)]">{c.title}</h1>
      <p className="text-sm opacity-70 mt-1 font-body">
        {c.status} · {formatInr(c.budgetPaise)} ·{' '}
        <Link href={`/creator/campaigns/${c.slug}`} className="underline">
          public page
        </Link>
      </p>
      {note ? <p className="mt-2 text-sm opacity-70">{note}</p> : null}

      {(c.status === 'OPEN' || c.status === 'REVIEWING') && (
        <button type="button" className="mt-4 rounded border px-3 py-1 text-sm" onClick={() => void close()}>
          Close (reject further bids)
        </button>
      )}

      <section className="mt-8">
        <h2 className="font-display text-xl">Proposals</h2>
        <ul className="mt-3 space-y-3 text-sm font-body">
          {c.proposals.map((p) => (
            <li key={p.id} className="border border-[var(--border)] rounded p-3">
              <p className="font-medium">
                {p.creator.displayName} · {formatInr(p.bidPaise)} · {p.status}
              </p>
              <p className="mt-1 opacity-80 whitespace-pre-wrap">{p.pitch}</p>
              {(c.status === 'OPEN' || c.status === 'REVIEWING') && p.status === 'SUBMITTED' ? (
                <button
                  type="button"
                  className="mt-2 rounded bg-[var(--secondary)] text-white px-3 py-1 text-xs"
                  onClick={() => void award(p.id)}
                >
                  Select winner
                </button>
              ) : null}
            </li>
          ))}
          {c.proposals.length === 0 ? <li className="opacity-60">No proposals yet.</li> : null}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl">Deliverables</h2>
        <ul className="mt-3 space-y-2 text-sm font-body">
          {c.deliverables.map((d) => (
            <li key={d.id} className="border border-[var(--border)] rounded p-3">
              {d.title} · {d.status}
              {d.url ? (
                <a href={d.url} className="ml-2 underline" target="_blank" rel="noreferrer">
                  link
                </a>
              ) : null}
              {d.status === 'SUBMITTED' ? (
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => void review(d.id, 'APPROVED')}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-xs"
                    onClick={() => void review(d.id, 'CHANGES_REQUESTED')}
                  >
                    Request changes
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      {c.payment ? (
        <section className="mt-8 text-sm font-body">
          <h2 className="font-display text-xl">Payment</h2>
          <p className="mt-2">
            {formatInr(c.payment.amountPaise)} · {c.payment.status}
          </p>
          {c.payment.status === 'PENDING' ? (
            <button
              type="button"
              className="mt-2 rounded bg-[var(--primary)] text-[var(--primary-foreground)] px-3 py-1"
              onClick={() => void release()}
            >
              Release payment
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="mt-8 text-sm font-body">
        <h2 className="font-display text-xl">Messages</h2>
        <ul className="mt-2 space-y-2">
          {c.messages.map((m) => (
            <li key={m.id} className="opacity-80">
              <span className="font-medium">{m.sender.displayName ?? m.sender.email}:</span> {m.body}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 rounded border border-[var(--border)] px-2 py-1 bg-[var(--card)]"
            value={msgBody}
            onChange={(e) => setMsgBody(e.target.value)}
          />
          <button type="button" className="rounded border px-3 py-1" onClick={() => void sendMsg()}>
            Send
          </button>
        </div>
      </section>
    </main>
  );
}
