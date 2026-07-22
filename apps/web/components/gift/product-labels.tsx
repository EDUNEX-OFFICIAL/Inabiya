type StorefrontLabel = 'NEW' | 'SALE';

const LABEL_COPY: Record<StorefrontLabel, string> = {
  NEW: 'New',
  SALE: 'Sale',
};

type Props = {
  labels?: StorefrontLabel[] | string[] | null;
  /** Overlay on media vs inline in buy box */
  placement?: 'overlay' | 'inline';
  className?: string;
};

export function ProductLabels({ labels, placement = 'inline', className = '' }: Props) {
  const list = (labels ?? []).filter((l): l is StorefrontLabel => l === 'NEW' || l === 'SALE');
  if (list.length === 0) return null;

  return (
    <ul
      className={`flex flex-wrap gap-gs-2 ${
        placement === 'overlay' ? 'pointer-events-none absolute left-gs-3 top-gs-3 z-10' : ''
      } ${className}`.trim()}
      aria-label="Product labels"
    >
      {list.map((code) => (
        <li
          key={code}
          className={
            code === 'SALE'
              ? 'rounded-full bg-[color:var(--danger)] px-gs-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:text-xs'
              : 'rounded-full bg-primary px-gs-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm sm:text-xs'
          }
        >
          {LABEL_COPY[code]}
        </li>
      ))}
    </ul>
  );
}
