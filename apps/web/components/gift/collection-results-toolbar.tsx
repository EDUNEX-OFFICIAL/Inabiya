'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { GiftSelect } from '@/components/gift/gift-select';
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
    <div className="relative z-[var(--z-overlay)] mb-gs-4 space-y-gs-3">
      <div className="flex flex-wrap items-center justify-between gap-gs-3">
        <p className="text-body font-medium text-foreground/75" aria-live="polite">
          {productCount === 0
            ? 'No gifts match'
            : `${productCount} gift${productCount === 1 ? '' : 's'}`}
          {chips.length > 0 ? (
            <span className="font-normal text-foreground/45"> · filtered</span>
          ) : null}
        </p>
        <div className="flex items-center gap-gs-2">
          <span className="hidden text-caption font-medium uppercase tracking-wide text-foreground/55 sm:inline">
            Sort
          </span>
          <GiftSelect
            variant="pill"
            ariaLabel="Sort products"
            value={currentSort}
            options={COLLECTION_SORTS}
            onChange={(sort) => {
              router.push(
                collectionHref(
                  collection.slug,
                  refineParamsForUrl(collection, { ...refine, sort }),
                ),
              );
            }}
          />
        </div>
      </div>

      {chips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-gs-2" aria-label="Active filters">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.clearHref}
              className="inline-flex items-center gap-gs-1 rounded-pill bg-primary/12 px-gs-3 py-gs-1 text-caption font-medium text-primary"
            >
              {chip.label}
              <X className="size-3.5 opacity-70" aria-hidden />
              <span className="sr-only">Remove {chip.label}</span>
            </Link>
          ))}
          <Link href={clearAllHref} className="gift-link text-caption">
            Clear all
          </Link>
        </div>
      ) : null}
    </div>
  );
}
