'use client';

import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Light one-shot scroll reveal for Soft Gift homepage bands. */
export function GiftHomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const nodes = root.current?.querySelectorAll<HTMLElement>('[data-gift-reveal]');
      if (!nodes?.length) return;

      const markReady = () => {
        nodes.forEach((el) => el.setAttribute('data-reveal-ready', ''));
      };

      if (reduced) {
        markReady();
        gsap.set(nodes, { clearProps: 'all', opacity: 1, y: 0 });
        return;
      }

      // Own opacity before unlocking CSS hide (gsap.from after paint = FOUC).
      gsap.set(nodes, { opacity: 0, y: 28, visibility: 'visible' });
      markReady();

      nodes.forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power2.out',
          clearProps: 'opacity,visibility,transform',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        });
      });
    },
    { scope: root },
  );

  return <div ref={root}>{children}</div>;
}
