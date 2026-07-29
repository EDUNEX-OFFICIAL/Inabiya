'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import {
  COLLECTION_SORTS,
  collectionHref,
  listActiveRefineChips,
  refineParamsForUrl,
  type CollectionRefine,
  type GiftCollection,
} from '@/lib/gift-collections';

type Props = {
  collection: GiftCollection;
  refine: CollectionRefine;
  productCount: number;
};

export function CollectionResultsToolbar({ collection, refine, productCount }: Props) {
  const router = useRouter();
  const chips = listActiveRefineChips(collection, refine);
  const currentSort = refine.sort ?? collection.baseFilters.sort ?? 'newest';
  const clearAllHref = collectionHref(
    collection.slug,
    refineParamsForUrl(collection, { sort: refine.sort }),
  );

  return (
    <div className="mb-gs-4 space-y-gs-3">
      <div className="flex flex-wrap items-center justify-between gap-gs-3">
        <p className="text-sm font-medium text-foreground/75" aria-live="polite">
          {productCount === 0
            ? 'No gifts match'
            : `${productCount} gift${productCount === 1 ? '' : 's'}`}
          {chips.length > 0 ? (
            <span className="font-normal text-foreground/45"> · filtered</span>
          ) : null}
        </p>
        <label className="flex items-center gap-gs-2 text-sm">
          <span className="sr-only sm:not-sr-only sm:text-xs sm:font-medium sm:uppercase sm:tracking-wide sm:opacity-55">
            Sort
          </span>
          <select
            className="rounded-full border border-foreground/12 bg-[var(--background)] px-gs-3 py-gs-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            value={currentSort}
            aria-label="Sort products"
            onChange={(e) => {
              const sort = e.target.value;
              router.push(
                collectionHref(
                  collection.slug,
                  refineParamsForUrl(collection, { ...refine, sort }),
                ),
              );
            }}
          >
            {COLLECTION_SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-gs-2" aria-label="Active filters">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.clearHref}
              className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-gs-3 py-1 text-xs font-medium text-primary"
            >
              {chip.label}
              <X className="size-3.5 opacity-70" aria-hidden />
              <span className="sr-only">Remove {chip.label}</span>
            </Link>
          ))}
          <Link href={clearAllHref} className="gift-link text-xs">
            Clear all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
