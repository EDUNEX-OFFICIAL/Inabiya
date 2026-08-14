type Props = {
  brands: string[];
  className?: string;
};

/** Proper brand label — not a chip/tag. Single → BRAND:; multi → BRANDS: */
export function ProductBrandLine({ brands, className = '' }: Props) {
  const list = brands.map((b) => b.trim()).filter(Boolean);
  if (list.length === 0) return null;
  const label = list.length === 1 ? 'Brand' : 'Brands';

  const names = list.join(', ');

  return (
    <p className={`text-body leading-snug text-foreground/75 ${className}`.trim()} title={names}>
      <span className="font-semibold uppercase tracking-wide text-foreground/55">{label}:</span>{' '}
      <span className="text-foreground/90">{names}</span>
    </p>
  );
}
