type Props = {
  rating?: number | null;
  count?: number;
  className?: string;
};

/** Compact PLP/home stars + count. No help copy. */
export function ProductCardRating({ rating, count = 0, className = '' }: Props) {
  const filled = count > 0 && rating != null ? Math.round(rating) : 0;
  const label =
    count > 0 && rating != null
      ? `${rating.toFixed(1)} out of 5 from ${count} review${count === 1 ? '' : 's'}`
      : 'No reviews yet';

  return (
    <p
      className={`flex flex-wrap items-center gap-x-gs-2 gap-y-0 text-caption ${className}`.trim()}
    >
      <span className="inline-flex tracking-tight" aria-label={label} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= filled ? 'text-primary' : 'text-foreground/25'} aria-hidden>
            ★
          </span>
        ))}
      </span>
      {count > 0 && rating != null ? (
        <span className="tabular-nums text-foreground/70">
          {rating.toFixed(1)} ({count})
        </span>
      ) : (
        <span className="tabular-nums text-foreground/50">(0)</span>
      )}
    </p>
  );
}
