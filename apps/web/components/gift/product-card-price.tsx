import { formatInr } from '@/lib/catalog';

type Props = {
  fromPricePaise: number;
  salePricePaise?: number | null;
  compareAtPaise?: number | null;
  /** Prefix “From” when there is no sale (homepage cards). */
  fromPrefix?: boolean;
  className?: string;
};

/** Current price; strikethrough MRP when a % off offer exists. */
export function ProductCardPrice({
  fromPricePaise,
  salePricePaise,
  compareAtPaise,
  fromPrefix = false,
  className = '',
}: Props) {
  const current =
    compareAtPaise != null && salePricePaise != null && salePricePaise > 0
      ? salePricePaise
      : fromPricePaise;
  const onSale = compareAtPaise != null && compareAtPaise > current;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-gs-2 gap-y-0 ${className}`.trim()}>
      {onSale ? (
        <>
          <span className="font-normal text-foreground/45 line-through">
            {formatInr(compareAtPaise)}
          </span>
          <span>{formatInr(current)}</span>
        </>
      ) : (
        <span>
          {fromPrefix ? 'From ' : ''}
          {formatInr(fromPricePaise)}
        </span>
      )}
    </span>
  );
}
