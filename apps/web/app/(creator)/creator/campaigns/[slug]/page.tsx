'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { apiUrl } from '@/lib/api-base';
import { formatInr } from '@/lib/creator';

type PublicCampaign = {
  id: string;
  title: string;
  slug: string;
  brief: string;
  budgetPaise: number;
  status: string;
  brand: { companyName: string; slug: string };
  _count: { proposals: number };
};

export default function CampaignPublicPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<PublicCampaign | null>(null);
  const [pitch, setPitch] = useState('');
  const [bidPaise, setBidPaise] = useState(50000);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl(`/creator/campaigns/by-slug/${params.slug}`))
      .then((r) => {
        if (!r.ok) throw new Error('not found');
        return r.json();
      })
      .then(setCampaign)
      .catch(() => setCampaign(null));
  }, [params.slug]);

  async function propose() {
    if (!getStoredAccessToken()) {
      router.push('/login');
      return;
    }
    if (!campaign) return;
    await apiAuth(`/creator/campaigns/${campaign.id}/proposals`, {
      method: 'POST',
      json: { pitch, bidPaise },
    });
    setMsg('Proposal submitted');
    router.push('/creator/studio');
  }

  if (!campaign) {
    return <main className="p-8 text-sm opacity-70">Loading or not found…</main>;
  }

  return (
    <main className="px-8 py-12 max-w-2xl">
      <Link href="/creator/marketplace" className="text-sm underline opacity-70">
        ← Marketplace
      </Link>
      <p className="mt-6 text-sm uppercase tracking-widest text-[var(--secondary)] font-body">
        {campaign.brand.companyName}
      </p>
      <h1 className="font-display text-4xl mt-2 text-[var(--primary)]">{campaign.title}</h1>
      <p className="mt-2 text-sm opacity-60 font-body">
        Budget {formatInr(campaign.budgetPaise)} · {campaign.status} · {campaign._count.proposals}{' '}
        proposals
      </p>
      <div className="mt-8 font-body whitespace-pre-wrap leading-relaxed opacity-90">
        {campaign.brief}
      </div>

      {(campaign.status === 'OPEN' || campaign.status === 'REVIEWING') && (
        <section className="mt-10 border-t border-[var(--border)] pt-8">
          <h2 className="font-display text-2xl">Submit reverse bid</h2>
          <label className="mt-4 block text-sm font-body">
            Pitch
            <textarea
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2 min-h-[120px]"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
            />
          </label>
          <label className="mt-3 block text-sm font-body">
            Your bid (paise)
            <input
              type="number"
              className="mt-1 w-full rounded border border-[var(--border)] bg-[var(--card)] px-3 py-2"
              value={bidPaise}
              onChange={(e) => setBidPaise(Number(e.target.value))}
            />
            <span className="opacity-60">{formatInr(bidPaise)}</span>
          </label>
          <button
            type="button"
            className="mt-4 rounded bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm"
            onClick={() => void propose().catch((e) => setMsg(String(e.message ?? e)))}
          >
            Submit proposal
          </button>
          {msg ? <p className="mt-2 text-sm opacity-70">{msg}</p> : null}
        </section>
      )}
    </main>
  );
}
