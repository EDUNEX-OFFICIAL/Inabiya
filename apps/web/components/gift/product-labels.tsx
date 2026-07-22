import type { StorefrontDisplayLabel } from '@/lib/catalog';

type Props = {
  labels?: StorefrontDisplayLabel[] | null;
  /** Overlay on media vs inline in buy box */
  placement?: 'overlay' | 'inline';
  className?: string;
};

function toneClass(tone: StorefrontDisplayLabel['tone']): string {
  switch (tone) {
    case 'sale':
      return 'rounded-full bg-[color:var(--danger)] px-gs-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm sm:text-xs';
    case 'new':
      return 'rounded-full bg-primary px-gs-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm sm:text-xs';
    case 'stock':
      return 'rounded-full border border-foreground/20 bg-white/95 px-gs-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm sm:text-xs';
    case 'manual':
    default:
      return 'rounded-full bg-foreground px-gs-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-background shadow-sm sm:text-xs';
  }
}

export function ProductLabels({ labels, placement = 'inline', className = '' }: Props) {
  const list = labels ?? [];
  if (list.length === 0) return null;

  return (
    <ul
      className={`flex flex-wrap gap-gs-2 ${
        placement === 'overlay' ? 'pointer-events-none absolute left-gs-3 top-gs-3 z-10' : ''
      } ${className}`.trim()}
      aria-label="Product labels"
    >
      {list.map((label) => (
        <li key={label.code} className={toneClass(label.tone)}>
          {label.text}
        </li>
      ))}
    </ul>
  );
}
