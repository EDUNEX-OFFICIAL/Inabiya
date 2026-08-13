import Link from 'next/link';
import { ClayProductCard } from '@/components/gift/clay-product-card';
import { TrackView } from '@/components/track-view';
import { fetchCatalog, type CatalogProduct } from '@/lib/catalog';
import { collectionPlpHref, fetchCatalogCollections } from '@/lib/catalog-collections';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function titleFromFilters(
  sp: {
    recipient?: string;
    age?: string;
    hamper?: string;
    collection?: string;
    occasion?: string;
    q?: string;
    storefrontLabel?: string;
    onSale?: string;
  },
  collectionTitle?: string,
): string {
  if (sp.q) return `Search: “${sp.q}”`;
  if (sp.storefrontLabel === 'BESTSELLER') return 'Best sellers';
  if (sp.storefrontLabel === 'EDITORS_PICK') return "Editor's picks";
  if (sp.onSale === '1') return 'On sale';
  if (sp.hamper === '1') return 'Ready-made hampers';
  if (sp.recipient === 'girl') return 'For baby girl';
  if (sp.recipient === 'boy') return 'For baby boy';
  if (sp.recipient === 'mom') return 'For expecting mom';
  if (sp.age === 'newborn') return 'Shop by age — newborn';
  if (sp.age === 'infant') return 'Shop by age — infant';
  if (sp.age === 'toddler') return 'Shop by age — toddler';
  if (sp.collection) return collectionTitle ? collectionTitle : `Collection: ${sp.collection}`;
  if (sp.occasion) return `Occasion: ${sp.occasion}`;
  return 'All gifts';
}

type FilterDef = {
  href: string;
  label: string;
  match: (sp: {
    recipient?: string;
    age?: string;
    hamper?: string;
    collection?: string;
    q?: string;
    occasion?: string;
  }) => boolean;
};

const BASE_FILTERS: FilterDef[] = [
  {
    href: '/gift/products',
    label: 'All',
    match: (sp) =>
      !sp.recipient && !sp.age && sp.hamper !== '1' && !sp.collection && !sp.q && !sp.occasion,
  },
  {
    href: '/gift/collections/ready-hampers',
    label: 'Hampers',
    match: (sp) => sp.hamper === '1',
  },
  {
    href: '/gift/collections/for-baby-girl',
    label: 'Girl',
    match: (sp) => sp.recipient === 'girl',
  },
  {
    href: '/gift/collections/for-baby-boy',
    label: 'Boy',
    match: (sp) => sp.recipient === 'boy',
  },
  {
    href: '/gift/collections/for-expecting-mom',
    label: 'Mom',
    match: (sp) => sp.recipient === 'mom',
  },
];

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
] as const;

function plpHref(params: Record<string, string | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) qs.set(k, v);
  }
  const q = qs.toString();
  return q ? `/gift/products?${q}` : '/gift/products';
}

export default async function ProductListPage({ searchParams }: { searchParams: SearchParams }) {
  const recipient = first(searchParams.recipient);
  const age = first(searchParams.age);
  const hamper = first(searchParams.hamper);
  const collection = first(searchParams.collection);
  const occasion = first(searchParams.occasion);
  const storefrontLabel = first(searchParams.storefrontLabel);
  const onSale = first(searchParams.onSale);
  const qRaw = first(searchParams.q)?.trim();
  const q = qRaw ? qRaw.slice(0, 120) : undefined;
  const sortRaw = first(searchParams.sort) ?? 'newest';
  const sort = SORTS.some((s) => s.value === sortRaw) ? sortRaw : 'newest';

  const collections = await fetchCatalogCollections();
  const FILTERS: FilterDef[] = [
    ...BASE_FILTERS,
    ...collections.slice(0, 8).map((c) => ({
      href: collectionPlpHref(c.slug),
      label: c.title,
      match: (sp: { collection?: string }) => sp.collection === c.slug,
    })),
  ];

  const filterState = { recipient, age, hamper, collection, q, occasion };

  const qs = new URLSearchParams();
  qs.set('sort', sort);
  if (recipient) qs.set('recipient', recipient);
  if (age) qs.set('age', age);
  if (hamper) qs.set('hamper', hamper);
  if (collection) qs.set('collection', collection);
  if (occasion) qs.set('occasion', occasion);
  if (storefrontLabel) qs.set('storefrontLabel', storefrontLabel);
  if (onSale) qs.set('onSale', onSale);
  if (q) qs.set('q', q);

  let products: CatalogProduct[] = [];
  try {
    products = await fetchCatalog<CatalogProduct[]>(`/catalog/products?${qs.toString()}`);
  } catch {
    products = [];
  }

  const collectionTitle = collection
    ? collections.find((c) => c.slug === collection)?.title
    : undefined;

  const heading = titleFromFilters(
    {
      recipient,
      age,
      hamper,
      collection,
      occasion,
      q,
      storefrontLabel,
      onSale,
    },
    collectionTitle,
  );

  return (
    <main className="gift-page">
      <TrackView name="view_plp" />
      <div className="mb-gs-6">
        <Link href="/gift" className="gift-link text-body">
          ← Gift home
        </Link>
        <p className="gift-overline mt-gs-4">Shop</p>
        <h1 className="gift-h1 mt-gs-2">{heading}</h1>
        <p className="gift-muted mt-gs-2">
          {products.length === 0
            ? 'No matches for these filters yet.'
            : `${products.length} gift${products.length === 1 ? '' : 's'}`}
        </p>

        <div className="-mx-gs-1 mt-gs-4 flex gap-gs-2 overflow-x-auto px-gs-1 pb-gs-1 sm:flex-wrap sm:overflow-visible">
          {FILTERS.map((f) => {
            const active = f.match(filterState);
            const href = f.href.startsWith('/gift/collections/')
              ? f.href
              : f.href === '/gift/products'
                ? plpHref({ sort })
                : plpHref({
                    ...Object.fromEntries(new URL(f.href, 'http://x').searchParams.entries()),
                    sort,
                  });
            return (
              <Link
                key={f.href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'shrink-0 rounded-pill bg-primary px-gs-3 py-gs-2 text-body font-medium text-primary-foreground shadow-clay'
                    : 'clay-chip shrink-0 hover:text-primary'
                }
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-gs-3 flex flex-wrap items-center gap-gs-2" aria-label="Sort products">
          <span className="text-caption font-medium uppercase tracking-wide opacity-55">Sort</span>
          {SORTS.map((s) => {
            const active = sort === s.value;
            return (
              <Link
                key={s.value}
                href={plpHref({
                  recipient,
                  age,
                  hamper,
                  collection,
                  occasion,
                  storefrontLabel,
                  onSale,
                  q,
                  sort: s.value,
                })}
                className={
                  active
                    ? 'rounded-pill bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] px-gs-2 py-1 text-caption font-medium'
                    : 'px-gs-2 py-1 text-caption opacity-60 hover:opacity-100'
                }
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? null : (
        <ul className="grid grid-cols-2 gap-gs-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <li key={p.id}>
              <ClayProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
