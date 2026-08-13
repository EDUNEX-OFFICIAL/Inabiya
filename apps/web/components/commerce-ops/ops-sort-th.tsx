'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type Align = 'left' | 'right';

type Props = {
  label: string;
  /** When set, heading is a sort control. */
  onSort?: () => void;
  active?: boolean;
  direction?: 'asc' | 'desc';
  align?: Align;
  className?: string;
};

const thBase =
  'py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]';

/**
 * Ops desk table heading — static or click-to-sort (Shopify-style).
 * Sortable: hover shows affordance; active column uses foreground + arrow.
 */
export function OpsSortTh({
  label,
  onSort,
  active = false,
  direction = 'asc',
  align = 'left',
  className = 'px-2 pr-4',
}: Props) {
  const alignClass = align === 'right' ? 'text-right' : 'text-left';

  if (!onSort) {
    return (
      <th scope="col" className={`${thBase} ${alignClass} ${className}`}>
        {label}
      </th>
    );
  }

  const ariaSort = active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <th scope="col" aria-sort={ariaSort} className={`${thBase} ${alignClass} ${className}`}>
      <button
        type="button"
        onClick={onSort}
        className={`group inline-flex max-w-full items-center gap-1 rounded-md py-0.5 transition-colors hover:text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
          align === 'right' ? 'ml-auto flex-row-reverse' : ''
        } ${active ? 'text-[var(--foreground)]' : ''}`}
      >
        <span className="truncate">{label}</span>
        {active ? (
          direction === 'asc' ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          )
        ) : (
          <ArrowUpDown
            className="h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-45 group-focus-visible:opacity-45"
            aria-hidden
          />
        )}
      </button>
    </th>
  );
}
