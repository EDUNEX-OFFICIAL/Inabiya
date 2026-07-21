'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiAuth, getStoredAccessToken } from '@/lib/auth-client';
import { formatInr } from '@/lib/creator';

type BrandProfile = {
  id: string;
  slug: string;
  companyName: string;
  bio: string | null;
};

type CampaignRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  budgetPaise: number;
  _count: { proposals: number };
};

type BrandAnalytics = {
  campaignCount: number;
  byStatus: Array<{ status: string; count: number }>;
  proposalCount: number;
  avgBidPaise: number | null;
  paymentsPending: number;
  paymentsReleased: number;
  releasedPaise: number;
  openBudgetPaise: number;
};

export default function BrandDashboardPage() {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [stats, setStats] = useState<BrandAnalytics | null>(null);
  const [companyName, setCompanyName] = useState('Soft Nest Co');
  const [slug, setSlug] = useState('soft-nest-co');
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [budgetPaise, setBudgetPaise] = useState(100000);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const profiles = await apiAuth<{ brand: BrandProfile | null }>('/creator/me/profiles');
    setBrand(profiles.brand);
    if (profiles.brand) {
      setCompanyName(profiles.brand.companyName);
      setSlug(profiles.brand.slug);
      const [mine, analytics] = await Promise.all([
        apiAuth<CampaignRow[]>('/creator/campaigns/mine'),
        apiAuth<BrandAnalytics>('/creator/analytics/summary'),
      ]);
      setCampaigns(mine);
      setStats(analytics);
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
    await apiAuth('/creator/me/brand-profile', {
      method: 'POST',
      json: { slug, companyName, bio: 'Parenting brand on Creator Collective.' },
    });
    setMsg('Brand profile saved');
    await load();
  }

  async function createCampaign() {
    const c = await apiAuth<CampaignRow>('/creator/campaigns', {
      method: 'POST',
      json: { title, brief, budgetPaise },
    });
    setMsg(`Draft created: ${c.slug}`);
    setTitle('');
    setBrief('');
    await load();
  }

  async function publish(id: string) {
    await apiAuth(`/creator/campaigns/${id}/publish`, { method: 'POST' });
    await load();
  }

  return (
    <main className="px-8 py-12 max-w-3xl">
      <h1 className="font-display text-4xl text-[var(--primary)]">Brand dashboard</h1>
      {msg ? <p className="mt-2 text-sm opacity-70">{msg}</p> : null}

      {stats ? (
        <section className="mt-6 rounded border border-[var(--border)] p-4 text-sm font-body max-w-xl">
          <h2 className="font-display text-xl">Campaign analytics</h2>
          <p className="mt-2 opacity-80">
            {stats.campaignCount} campaigns · {stats.proposalCount} proposals · avg bid{' '}
            {stats.avgBidPaise != null ? formatInr(stats.avgBidPaise) : '—'}
          </p>
          <p className="mt-1 opacity-80">
            Open budget {formatInr(stats.openBudgetPaise)} · payments released{' '}
            {stats.paymentsReleased} ({formatInr(stats.releasedPaise)}) · pending{' '}
            {stats.paymentsPending}
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {stats.byStatus.map((s) => (
              <li key={s.status} className="rounded bg-[var(--muted)] px-2 py-0.5 text-xs">
                {s.status}: {s.count}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 space-y-3 text-sm font-body">
        <h2 className="font-display text-2xl">Profile</h2>
        <input
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)]"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company name"
        />
        <input
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)]"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug"
        />
        <button
          type="button"
          className="rounded bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2"
          onClick={() => void saveProfile().catch((e) => setMsg(String(e.message)))}
        >
          Save brand profile
        </button>
        {brand ? <p className="opacity-60">Active as {brand.companyName}</p> : null}
      </section>

      <section className="mt-12 space-y-3 text-sm font-body">
        <h2 className="font-display text-2xl">New campaign</h2>
        <input
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <textarea
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)] min-h-[100px]"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="Brief (min 10 chars)"
        />
        <input
          type="number"
          className="w-full rounded border border-[var(--border)] px-3 py-2 bg-[var(--card)]"
          value={budgetPaise}
          onChange={(e) => setBudgetPaise(Number(e.target.value))}
        />
        <button
          type="button"
          className="rounded border border-[var(--border)] px-4 py-2"
          onClick={() => void createCampaign().catch((e) => setMsg(String(e.message)))}
        >
          Create draft
        </button>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Your campaigns</h2>
        <ul className="mt-4 space-y-3 text-sm font-body">
          {campaigns.map((c) => (
            <li key={c.id} className="border border-[var(--border)] rounded p-3">
              <Link href={`/creator/brand/campaigns/${c.id}`} className="font-medium underline">
                {c.title}
              </Link>
              <p className="opacity-70 mt-1">
                {c.status} · {formatInr(c.budgetPaise)} · {c._count.proposals} proposals
              </p>
              {c.status === 'DRAFT' ? (
                <button
                  type="button"
                  className="mt-2 rounded border px-3 py-1 text-xs"
                  onClick={() => void publish(c.id)}
                >
                  Publish
                </button>
              ) : null}
            </li>
          ))}
          {campaigns.length === 0 ? <li className="opacity-60">No campaigns yet.</li> : null}
        </ul>
      </section>
    </main>
  );
}
