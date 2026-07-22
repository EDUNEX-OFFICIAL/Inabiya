'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/creator';

type CreatorProfile = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
};

type ProposalRow = {
  id: string;
  pitch: string;
  bidPaise: number;
  status: string;
  campaign: { id: string; title: string; slug: string; status: string; budgetPaise: number };
};

export default function CreatorStudioPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [rows, setRows] = useState<ProposalRow[]>([]);
  const [displayName, setDisplayName] = useState('Anya Creates');
  const [slug, setSlug] = useState('anya-creates');
  const [deliverableTitle, setDeliverableTitle] = useState('Final reel');
  const [deliverableUrl, setDeliverableUrl] = useState('https://example.com/deliverable');
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const profiles = await apiAuth<{ creator: CreatorProfile | null }>('/creator/me/profiles');
    setProfile(profiles.creator);
    if (profiles.creator) {
      setDisplayName(profiles.creator.displayName);
      setSlug(profiles.creator.slug);
      setRows(await apiAuth<ProposalRow[]>('/creator/proposals/mine'));
    }
  }

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace('/login');
      return;
    }
    void load().catch(() => router.replace('/login'));
  }, [router]);

  async function saveProfile() {
    await apiAuth('/creator/me/creator-profile', {
      method: 'POST',
      json: {
        slug,
        displayName,
        bio: 'Creator on Inabiya Collective.',
        niches: ['newborn', 'lifestyle'],
      },
    });
    setMsg('Creator profile saved');
    await load();
  }

  async function submitDeliverable(campaignId: string) {
    await apiAuth(`/creator/campaigns/${campaignId}/deliverables`, {
      method: 'POST',
      json: { title: deliverableTitle, url: deliverableUrl },
    });
    setMsg('Deliverable submitted');
    await load();
  }

  return (
    <main className="px-8 py-12 max-w-3xl">
      <h1 className="font-display text-4xl text-[var(--primary)]">Creator studio</h1>
      {msg ? <p className="mt-2 text-sm opacity-70">{msg}</p> : null}

      <section className="mt-8 space-y-3 text-sm font-body">
        <h2 className="font-display text-2xl">Profile</h2>
        <input
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)]"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)]"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <button
          type="button"
          className="rounded bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2"
          onClick={() => void saveProfile().catch((e) => setMsg(String(e.message)))}
        >
          Save creator profile
        </button>
        {profile ? <p className="opacity-60">Signed in as {profile.displayName}</p> : null}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">My proposals</h2>
        <ul className="mt-4 space-y-3 text-sm font-body">
          {rows.map((p) => (
            <li key={p.id} className="border border-[var(--border)] rounded p-3">
              <Link
                href={`/creator/campaigns/${p.campaign.slug}`}
                className="underline font-medium"
              >
                {p.campaign.title}
              </Link>
              <p className="opacity-70 mt-1">
                Bid {formatInr(p.bidPaise)} · proposal {p.status} · campaign {p.campaign.status}
              </p>
              {p.status === 'AWARDED' &&
              (p.campaign.status === 'AWARDED' || p.campaign.status === 'IN_DELIVERY') ? (
                <div className="mt-3 space-y-2">
                  <input
                    className="w-full rounded border px-2 py-1"
                    value={deliverableTitle}
                    onChange={(e) => setDeliverableTitle(e.target.value)}
                  />
                  <input
                    className="w-full rounded border px-2 py-1"
                    value={deliverableUrl}
                    onChange={(e) => setDeliverableUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    onClick={() =>
                      void submitDeliverable(p.campaign.id).catch((e) => setMsg(String(e.message)))
                    }
                  >
                    Submit deliverable
                  </button>
                </div>
              ) : null}
            </li>
          ))}
          {rows.length === 0 ? (
            <li className="opacity-60">
              No proposals —{' '}
              <Link href="/creator/marketplace" className="underline">
                browse marketplace
              </Link>
            </li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
