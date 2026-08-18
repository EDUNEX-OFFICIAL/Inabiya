'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';

/**
 * Soft Gift–only smooth scroll. Loads Lenis + GSAP ScrollTrigger sync
 * after mount (skipped when prefers-reduced-motion) so the layout shell
 * stays free of that weight on first paint.
 *
 * Boot is a *sibling*, never a new parent around `children`. Swapping
 * Fragment → ReactLenis after load remounted navbar + hero (FOUC).
 */
export function GiftLenis({
  children,
  disabled = false,
}: {
  children: ReactNode;
  /** Skip Lenis entirely (auth / forms — avoids scroll hijack). */
  disabled?: boolean;
}) {
  return (
    <>
      <GiftLenisBoot disabled={disabled} />
      {children}
    </>
  );
}

function GiftLenisBoot({ disabled }: { disabled: boolean }) {
  const [Inner, setInner] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (disabled) {
      setInner(null);
      return;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false;

    const load = () => {
      if (mq.matches) {
        setInner(null);
        return;
      }
      void import('./gift-lenis-inner').then((m) => {
        if (!cancelled) setInner(() => m.GiftLenisInner);
      });
    };

    load();
    mq.addEventListener('change', load);
    return () => {
      cancelled = true;
      mq.removeEventListener('change', load);
    };
  }, [disabled]);

  if (!Inner) return null;
  return <Inner />;
}
