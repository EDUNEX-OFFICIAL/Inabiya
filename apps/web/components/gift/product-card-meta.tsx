import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ProductCardPrice } from '@/components/gift/product-card-price';
import { ProductCardRating } from '@/components/gift/product-card-rating';

type Props = {
  fromPricePaise: number;
  salePricePaise?: number | null;
  compareAtPaise?: number | null;
  fromPrefix?: boolean;
  rating?: number | null;
  count?: number;
  /** Savings / extra next to the price (left cluster). */
  extra?: ReactNode;
  priceClassName?: string;
  className?: string;
};

/** Price (left) + stars (right) on one row so card bodies don’t stack as tall. */
export function ProductCardMeta({
  fromPricePaise,
  salePricePaise,
  compareAtPaise,
  fromPrefix = false,
  rating,
  count,
  extra,
  priceClassName,
  className = '',
}: Props) {
  return (
    <div className={cn('flex items-baseline justify-between gap-x-gs-2 gap-y-0', className)}>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-gs-2">
        <ProductCardPrice
          fromPricePaise={fromPricePaise}
          salePricePaise={salePricePaise}
          compareAtPaise={compareAtPaise}
          fromPrefix={fromPrefix}
          className={cn('min-w-0 font-semibold', priceClassName)}
        />
        {extra}
      </div>
      <ProductCardRating rating={rating} count={count} className="shrink-0" />
    </div>
  );
}
