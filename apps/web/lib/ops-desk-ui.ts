/** Shared Soft Gift ops desk chip styles (filter / tab toggles). */
export function opsChipClass(active: boolean): string {
  // `clay-chip--active` beats compact `.clay-chip` CSS (Tailwind utilities alone lose specificity).
  return `clay-chip min-h-8 shrink-0 cursor-pointer px-2.5 text-xs font-medium transition-colors sm:min-h-9 sm:px-3.5 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? 'clay-chip--active'
      : 'hover:border-[color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,white)]'
  }`;
}

/** Dense table/card row actions — borderless (not clay-btn).
 * Use this for Edit / View / Publish / Adjust / Approve / etc. inside desk rows.
 * Do NOT use `clay-btn` / `clay-btn-ghost` / `clay-btn-secondary` for row actions —
 * those are for page headers, filters, and form footers only.
 */
export const opsRowActionClass =
  'inline-flex min-h-9 min-w-9 items-center justify-center gap-1 rounded-full px-2.5 text-xs font-medium text-[var(--foreground)] underline-offset-2 hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] disabled:opacity-40 sm:min-h-10 sm:min-w-10 sm:gap-1.5 sm:px-3 sm:text-sm';
