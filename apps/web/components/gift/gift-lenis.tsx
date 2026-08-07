'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';

/**
 * Soft Gift–only smooth scroll. Loads Lenis + GSAP ScrollTrigger sync
 * after mount (skipped when prefers-reduced-motion) so the layout shell
 * stays free of that weight on first paint.
 */
export function GiftLenis({ children }: { children: ReactNode }) {
  const [Inner, setInner] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
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
  }, []);

  if (!Inner) {
    return <>{children}</>;
  }

  return <Inner>{children}</Inner>;
}
