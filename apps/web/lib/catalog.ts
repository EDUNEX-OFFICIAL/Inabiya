import { apiUrl } from './api-base';

export function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  fromPricePaise: number;
  recipientTags?: string[];
  ageBands?: string[];
  occasionTags?: string[];
  isReadyMadeHamper?: boolean;
  brandName?: string | null;
  storefrontLabels?: Array<'NEW' | 'SALE'>;
  media: Array<{ url: string; altText: string | null }>;
  categories: Array<{ slug: string; name: string }>;
  variants: Array<{
    id: string;
    sku: string;
    label: string;
    pricePaise: number;
    available: number;
    onHand?: number;
    giftBoxEligible: boolean;
  }>;
  personalization: Array<{
    key: string;
    label: string;
    type: string;
    maxLength: number | null;
    options: unknown;
    required: boolean;
  }>;
};

export async function fetchCatalog<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Catalog fetch failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
