'use client';

import { useEffect, type ReactNode } from 'react';
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

/** Loaded only when GiftLenis enables smooth scroll (see gift-lenis.tsx). */
export function GiftLenisInner({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        duration: 1.05,
        smoothWheel: true,
        touchMultiplier: 1.1,
        // Filter sidebars, search lists, mega menus — native overflow must win.
        allowNestedScroll: true,
      }}
    >
      <GiftLenisScrollSync />
      {children}
    </ReactLenis>
  );
}
