import Link from 'next/link';
import { fetchCreator, formatInr, type MarketplaceCampaign } from '@/lib/creator';

export const dynamic = 'force-dynamic';

export default async function MarketplacePage() {
  let rows: MarketplaceCampaign[] = [];
  try {
    rows = await fetchCreator<MarketplaceCampaign[]>('/creator/marketplace');
  } catch {
    rows = [];
  }

  return (
    <main className="px-8 py-12 max-w-3xl">
      <h1 className="font-display text-4xl text-[var(--primary)]">Marketplace</h1>
      <p className="mt-2 opacity-75 font-body">Open campaigns seeking creator proposals.</p>
      <ul className="mt-10 space-y-8">
        {rows.map((c) => (
          <li key={c.id}>
            <Link href={`/creator/campaigns/${c.slug}`} className="group block">
              <h2 className="font-display text-2xl group-hover:text-[var(--secondary)]">
                {c.title}
              </h2>
              <p className="mt-2 font-body opacity-80 line-clamp-2">{c.brief}</p>
              <p className="mt-2 text-sm opacity-60 font-body">
                {c.brand.companyName} · budget {formatInr(c.budgetPaise)} · {c._count.proposals}{' '}
                proposals · {c.status}
              </p>
            </Link>
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="text-sm opacity-70">No open campaigns yet — brands can publish from dashboard.</li>
        ) : null}
      </ul>
    </main>
  );
}
