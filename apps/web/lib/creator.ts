import { apiUrl } from './api-base';

export function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export async function fetchCreator<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { next: { revalidate: 15 } });
  if (!res.ok) throw new Error(`Creator fetch failed (${res.status})`);
  return res.json() as Promise<T>;
}

export type MarketplaceCampaign = {
  id: string;
  title: string;
  slug: string;
  brief: string;
  budgetPaise: number;
  status: string;
  publishedAt: string | null;
  brand: { slug: string; companyName: string };
  _count: { proposals: number };
};
