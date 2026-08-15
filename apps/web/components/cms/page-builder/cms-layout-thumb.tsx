import type { HeroLayout } from '../hero-layout';

/** Tiny layout glyph for the inserter / canvas — not storefront chrome. */
export function HeroLayoutThumb({ layout }: { layout: HeroLayout | undefined }) {
  const cell = 'rounded-[2px] bg-[color-mix(in_srgb,var(--foreground)_18%,transparent)]';
  const media = 'rounded-[2px] bg-[color-mix(in_srgb,var(--primary)_45%,white)]';
  return (
    <span
      className="grid h-8 w-11 shrink-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded border border-[var(--border-subtle)] bg-[var(--surface)] p-0.5"
      aria-hidden
    >
      {layout === 'full' ? (
        <span className={`${media} col-span-2 row-span-2`} />
      ) : layout === 'fullText' ? (
        <span className={`${cell} col-span-2 row-span-2`} />
      ) : layout === 'splitMediaCopy' ? (
        <>
          <span className={`${media} row-span-2`} />
          <span className={`${cell} row-span-2`} />
        </>
      ) : layout === 'splitCopyMedia' ? (
        <>
          <span className={`${cell} row-span-2`} />
          <span className={`${media} row-span-2`} />
        </>
      ) : layout === 'splitMedia' ? (
        <>
          <span className={`${media} row-span-2`} />
          <span className={`${media} row-span-2`} />
        </>
      ) : layout === 'splitCopy' ? (
        <>
          <span className={`${cell} row-span-2`} />
          <span className={`${cell} row-span-2`} />
        </>
      ) : (
        <>
          <span className={`${cell} row-span-2`} />
          <span className={`${media} row-span-2`} />
        </>
      )}
    </span>
  );
}
