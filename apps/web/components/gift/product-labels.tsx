import type { StorefrontDisplayLabel } from '@/lib/catalog';

type Props = {
  labels?: StorefrontDisplayLabel[] | null;
  /** Overlay on media vs inline in buy box */
  placement?: 'overlay' | 'inline';
  /** Cap ribbons (homepage cards use 1 to avoid badge stacks). */
  max?: number;
  className?: string;
};

function toneClass(tone: StorefrontDisplayLabel['tone']): string {
  const base =
    'rounded-pill px-gs-2 py-gs-1 text-caption font-semibold uppercase tracking-wide shadow-sm';
  switch (tone) {
    case 'sale':
      return `${base} bg-[color:var(--danger)] text-white`;
    case 'new':
      return `${base} bg-primary text-primary-foreground`;
    case 'stock':
      return `${base} border border-foreground/20 bg-white/95 text-foreground`;
    case 'manual':
    default:
      return `${base} bg-foreground text-background`;
  }
}

export function ProductLabels({ labels, placement = 'inline', max, className = '' }: Props) {
  const list = max != null ? (labels ?? []).slice(0, Math.max(0, max)) : (labels ?? []);
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
