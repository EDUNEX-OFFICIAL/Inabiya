/** Shared Soft Gift ops desk chip styles (filter / tab toggles). */
export function opsChipClass(active: boolean): string {
  return `clay-chip min-h-8 shrink-0 cursor-pointer px-2.5 text-xs font-medium transition-colors sm:min-h-9 sm:px-3.5 sm:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] ${
    active
      ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_16%,white)] text-[var(--primary)] shadow-sm'
      : 'text-[var(--foreground)] hover:border-[color-mix(in_srgb,var(--primary)_32%,transparent)] hover:bg-[color-mix(in_srgb,var(--primary)_6%,white)]'
  }`;
}
