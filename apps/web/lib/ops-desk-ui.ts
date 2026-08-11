/** Shared Soft Gift ops desk chip styles (filter / tab toggles). */
export function opsChipClass(active: boolean): string {
  // `clay-chip--active` beats compact `.clay-chip` CSS (Tailwind utilities alone lose specificity).
  return `clay-chip min-h-8 shrink-0 cursor-pointer px-2.5 text-xs font-medium transition-colors sm:min-h-9 sm:px-3.5 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? 'clay-chip--active'
      : 'hover:border-[color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,white)]'
  }`;
}
