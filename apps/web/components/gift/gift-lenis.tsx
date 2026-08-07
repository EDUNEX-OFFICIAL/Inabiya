'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ReactLenis, useLenis } from 'lenis/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import 'lenis/dist/lenis.css';

gsap.registerPlugin(ScrollTrigger);

/** Keep GSAP ScrollTrigger in sync while Lenis owns the scroll. */
function GiftLenisScrollSync() {
  useLenis(() => {
    ScrollTrigger.update();
  });

  useEffect(() => {
    ScrollTrigger.refresh();
    return () => {
      ScrollTrigger.refresh();
    };
  }, []);

  return null;
}

/**
 * Soft Gift–only smooth scroll. Skipped when prefers-reduced-motion.
 * Not mounted on blog/creator/admin themes.
 */
export function GiftLenis({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setEnabled(!mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root
      options={{
        duration: 1.05,
        smoothWheel: true,
        touchMultiplier: 1.1,
      }}
    >
      <GiftLenisScrollSync />
      {children}
    </ReactLenis>
  );
}
