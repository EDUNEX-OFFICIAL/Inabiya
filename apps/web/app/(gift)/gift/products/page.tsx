import Link from 'next/link';
import { ClayProductCard } from '@/components/gift/clay-product-card';
import { TrackView } from '@/components/track-view';
import { fetchCatalog, type CatalogProduct } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function titleFromFilters(sp: {
  recipient?: string;
  age?: string;
  hamper?: string;
  category?: string;
  occasion?: string;
  q?: string;
}): string {
  if (sp.q) return `Search: “${sp.q}”`;
  if (sp.hamper === '1') return 'Ready-made hampers';
  if (sp.recipient === 'girl') return 'For baby girl';
  if (sp.recipient === 'boy') return 'For baby boy';
  if (sp.recipient === 'mom') return 'For expecting mom';
  if (sp.age === 'newborn') return 'Shop by age — newborn';
  if (sp.age === 'infant') return 'Shop by age — infant';
  if (sp.age === 'toddler') return 'Shop by age — toddler';
  if (sp.category) return `Category: ${sp.category}`;
  if (sp.occasion) return `Occasion: ${sp.occasion}`;
  return 'All gifts';
}

const FILTERS = [
  { href: '/gift/products', label: 'All' },
  { href: '/gift/products?hamper=1', label: 'Hampers' },
  { href: '/gift/products?recipient=girl', label: 'Girl' },
  { href: '/gift/products?recipient=boy', label: 'Boy' },
  { href: '/gift/products?recipient=mom', label: 'Mom' },
  { href: '/gift/products?category=clothing', label: 'Clothing' },
  { href: '/gift/products?category=toys', label: 'Toys' },
] as const;

export default async function ProductListPage({ searchParams }: { searchParams: SearchParams }) {
  const recipient = first(searchParams.recipient);
  const age = first(searchParams.age);
  const hamper = first(searchParams.hamper);
  const category = first(searchParams.category);
  const occasion = first(searchParams.occasion);
  const qRaw = first(searchParams.q)?.trim();
  const q = qRaw ? qRaw.slice(0, 120) : undefined;
  const sort = first(searchParams.sort) ?? 'newest';

  const qs = new URLSearchParams();
  qs.set('sort', sort);
  if (recipient) qs.set('recipient', recipient);
  if (age) qs.set('age', age);
  if (hamper) qs.set('hamper', hamper);
  if (category) qs.set('category', category);
  if (occasion) qs.set('occasion', occasion);
  if (q) qs.set('q', q);

  let products: CatalogProduct[] = [];
  try {
    products = await fetchCatalog<CatalogProduct[]>(`/catalog/products?${qs.toString()}`);
  } catch {
    products = [];
  }

  const heading = titleFromFilters({ recipient, age, hamper, category, occasion, q });

  return (
    <main className="gift-page">
      <TrackView name="view_plp" />
      <div className="mb-gs-6 sm:mb-gs-6">
        <Link href="/gift" className="gift-link text-sm">
          ← Gift home
        </Link>
        <h1 className="gift-h1 mt-gs-3">{heading}</h1>
        <div className="-mx-gs-1 mt-gs-4 flex gap-gs-2 overflow-x-auto px-gs-1 pb-gs-1 sm:mt-gs-5 sm:flex-wrap sm:overflow-visible">
          {FILTERS.map((f) => (
            <Link key={f.href} className="clay-chip shrink-0 hover:text-primary" href={f.href}>
              {f.label}
            </Link>
          ))}
        </div>
      </div>
      {products.length === 0 ? (
        <p className="text-sm opacity-70">No products match these filters.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-gs-4 sm:grid-cols-2 sm:gap-gs-5 lg:grid-cols-3">
          {products.map((p) => (
            <ClayProductCard key={p.id} product={p} />
          ))}
        </ul>
      )}
    </main>
  );
}
