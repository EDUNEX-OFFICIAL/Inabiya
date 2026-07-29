import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ClayProductCard } from '@/components/gift/clay-product-card';
import { CollectionFilters } from '@/components/gift/collection-filters';
import { CollectionResultsToolbar } from '@/components/gift/collection-results-toolbar';
import { TrackView } from '@/components/track-view';
import { fetchCatalog, type CatalogProduct } from '@/lib/catalog';
import {
  bybHrefForCollection,
  collectionBreadcrumb,
  collectionHref,
  getGiftCollection,
  mergeCollectionCatalogQuery,
  type CollectionRefine,
} from '@/lib/gift-collections';

export const dynamic = 'force-dynamic';

type SearchParams = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function parseRefine(sp: SearchParams): CollectionRefine {
  return {
    recipient: first(sp.recipient),
    age: first(sp.age),
    occasion: first(sp.occasion),
    category: first(sp.category),
    hamper: first(sp.hamper),
    onSale: first(sp.onSale),
    maxPricePaise: first(sp.maxPricePaise),
    sort: first(sp.sort),
  };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = getGiftCollection(params.slug);
  if (!collection) return { title: 'Collection' };
  return {
    title: `${collection.title} | Inabiya`,
    description: collection.blurb,
    openGraph: {
      title: collection.title,
      description: collection.blurb,
      images: collection.heroImageUrl ? [{ url: collection.heroImageUrl }] : undefined,
    },
  };
}

export default async function GiftCollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: SearchParams;
}) {
  const collection = getGiftCollection(params.slug);
  if (!collection) notFound();

  const refine = parseRefine(searchParams);
  const catalogQuery = mergeCollectionCatalogQuery(collection, refine);
  const qs = new URLSearchParams(catalogQuery);

  let products: CatalogProduct[] = [];
  try {
    products = await fetchCatalog<CatalogProduct[]>(`/catalog/products?${qs.toString()}`);
  } catch {
    products = [];
  }

  const related = collection.relatedSlugs
    .map((s) => getGiftCollection(s))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const crumb = collectionBreadcrumb(collection);
  const bybHref = bybHrefForCollection(collection);
  const accentWash =
    collection.accent === 'pink'
      ? 'from-[var(--primary)]/30 via-[var(--primary)]/8 to-transparent'
      : collection.accent === 'sky'
        ? 'from-sky-300/40 via-sky-100/20 to-transparent'
        : 'from-foreground/12 via-foreground/[0.04] to-transparent';

  return (
    <main className="gift-page !max-w-none !px-0">
      <TrackView name="view_plp" />

      {/* Full-bleed soft hero */}
      <section
        className="relative overflow-hidden border-b border-foreground/6"
        aria-labelledby="collection-title"
      >
        <div className={`absolute inset-0 bg-gradient-to-r ${accentWash}`} aria-hidden />
        <div className="absolute inset-y-0 right-0 hidden w-[42%] md:block" aria-hidden>
          <Image
            src={collection.heroImageUrl}
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="42vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)]/40 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-page px-gs-4 py-gs-5 sm:px-gs-6 sm:py-gs-6 lg:py-gs-7">
          <nav className="text-sm text-foreground/55" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <li>
                <Link href="/gift" className="gift-link">
                  Gift home
                </Link>
              </li>
              <li aria-hidden className="opacity-40">
                /
              </li>
              <li>
                <Link href={crumb.parentHref} className="gift-link">
                  {crumb.parentLabel}
                </Link>
              </li>
              <li aria-hidden className="opacity-40">
                /
              </li>
              <li className="font-medium text-foreground/80" aria-current="page">
                {collection.lockedLabel}
              </li>
            </ol>
          </nav>

          <div className="mt-gs-4 max-w-xl">
            <p className="gift-overline">{collection.overline}</p>
            <h1 id="collection-title" className="gift-h1 mt-gs-2 text-balance">
              {collection.title}
            </h1>
            <p className="gift-muted mt-gs-2 text-sm sm:text-base">{collection.blurb}</p>
            <div className="mt-gs-4 flex flex-wrap gap-gs-2">
              <Link href={bybHref} className="clay-btn !min-h-0 !px-gs-4 !py-gs-2 text-sm">
                Build a custom box
              </Link>
              <Link href="/gift/products" className="clay-btn-secondary !min-h-0 !px-gs-4 !py-gs-2 text-sm">
                Browse all gifts
              </Link>
            </div>
          </div>

          {/* Mobile hero photo — short strip */}
          <div className="relative mt-gs-5 aspect-[21/9] overflow-hidden rounded-xl md:hidden">
            <Image
              src={collection.heroImageUrl}
              alt={collection.heroImageAlt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-page px-gs-4 py-gs-5 sm:px-gs-6 sm:py-gs-6">
        <div className="flex flex-col gap-gs-5 md:flex-row md:items-start md:gap-gs-7">
          <CollectionFilters collection={collection} refine={refine} />

          <div className="min-w-0 flex-1">
            <CollectionResultsToolbar
              collection={collection}
              refine={refine}
              productCount={products.length}
            />

            {products.length === 0 ? (
              <div className="clay-panel p-gs-6 text-center sm:p-gs-7">
                <p className="font-display text-lg tracking-tight text-foreground">
                  Nothing in this mix yet
                </p>
                <p className="gift-muted mt-gs-2 text-sm">
                  Try clearing filters, or peek at a sibling collection.
                </p>
                <div className="mt-gs-5 flex flex-wrap justify-center gap-gs-2">
                  <Link
                    href={collectionHref(collection.slug)}
                    className="clay-btn inline-flex"
                  >
                    Clear filters
                  </Link>
                  {related.slice(0, 3).map((r) => (
                    <Link
                      key={r.slug}
                      href={collectionHref(r.slug)}
                      className="clay-btn-secondary inline-flex"
                    >
                      {r.lockedLabel}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="grid grid-cols-1 items-stretch gap-gs-4 sm:grid-cols-2 sm:gap-gs-5 xl:grid-cols-3">
                {products.map((p) => (
                  <ClayProductCard key={p.id} product={p} />
                ))}
              </ul>
            )}

            {related.length > 0 ? (
              <section className="mt-gs-8 border-t border-foreground/8 pt-gs-6" aria-labelledby="also-shop">
                <h2 id="also-shop" className="gift-h2">
                  Also shop
                </h2>
                <p className="gift-muted mt-gs-2 text-sm">Nearby collections you might love.</p>
                <div className="mt-gs-4 flex flex-wrap gap-gs-2">
                  {related.map((r) => (
                    <Link key={r.slug} href={collectionHref(r.slug)} className="clay-chip">
                      {r.lockedLabel}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
