type Props = {
  rating: number | null;
  count: number;
  /** When count is 0, show empty grey stars + invite CTA */
  emptyHref?: string;
  className?: string;
};

export function StarRatingSummary({
  rating,
  count,
  emptyHref = '#reviews',
  className = '',
}: Props) {
  const filled = count > 0 && rating != null ? Math.round(rating) : 0;
  const label =
    count > 0 && rating != null
      ? `${rating.toFixed(1)} out of 5 from ${count} review${count === 1 ? '' : 's'}`
      : 'No reviews yet — be the first to write a review';

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${className}`.trim()}>
      <span className="inline-flex tracking-tight" aria-label={label} role="img">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= filled ? 'text-primary' : 'text-foreground/25'} aria-hidden>
            ★
          </span>
        ))}
      </span>
      {count > 0 && rating != null ? (
        <a href={emptyHref} className="gift-link opacity-80">
          {rating.toFixed(1)} · {count} review{count === 1 ? '' : 's'}
        </a>
      ) : (
        <a href={emptyHref} className="gift-link opacity-70">
          Be the first to write a review
        </a>
      )}
    </p>
  );
}
