'use client';

import { useEffect, useRef } from 'react';
import { TestimonialCard, type TestimonialItem } from './gift-testimonial-card';
import { shiftMarqueeOffset, TESTIMONIAL_MARQUEE_PX } from './gift-testimonial-marquee-offset';

export function GiftTestimonialMarquee({
  items,
  speed,
}: {
  items: TestimonialItem[];
  speed: 'fast' | 'slow';
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track || items.length === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const pxPerSec = TESTIMONIAL_MARQUEE_PX[speed];
    let raf = 0;
    let last = performance.now();
    offsetRef.current = 0;
    track.style.transform = 'translate3d(0, 0, 0)';

    const gapOf = () => {
      const style = getComputedStyle(track);
      const raw = style.rowGap && style.rowGap !== 'normal' ? style.rowGap : style.gap;
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : 0;
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (pausedRef.current) return;

      let offset = offsetRef.current + pxPerSec * dt;
      const gap = gapOf();
      let lead = track.firstElementChild as HTMLElement | null;
      while (lead) {
        const stepped = shiftMarqueeOffset(offset, lead.offsetHeight + gap);
        if (!stepped.shift) break;
        track.appendChild(lead);
        offset = stepped.offset;
        lead = track.firstElementChild as HTMLElement | null;
      }
      offsetRef.current = offset;
      track.style.transform = `translate3d(0, ${-offset}px, 0)`;
    };

    const hoverRef = { current: false };
    const offscreenRef = { current: false };
    const syncPaused = () => {
      pausedRef.current = hoverRef.current || offscreenRef.current;
    };

    const pauseHover = () => {
      hoverRef.current = true;
      syncPaused();
    };
    const resumeHover = () => {
      hoverRef.current = false;
      syncPaused();
      last = performance.now();
    };

    viewport.addEventListener('mouseenter', pauseHover);
    viewport.addEventListener('mouseleave', resumeHover);
    viewport.addEventListener('focusin', pauseHover);
    viewport.addEventListener('focusout', resumeHover);

    const io = new IntersectionObserver(
      ([entry]) => {
        offscreenRef.current = !entry?.isIntersecting;
        syncPaused();
        if (entry?.isIntersecting) last = performance.now();
      },
      { threshold: 0.05 },
    );
    io.observe(viewport);

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      viewport.removeEventListener('mouseenter', pauseHover);
      viewport.removeEventListener('mouseleave', resumeHover);
      viewport.removeEventListener('focusin', pauseHover);
      viewport.removeEventListener('focusout', resumeHover);
      track.style.transform = '';
    };
  }, [items, speed]);

  if (!items.length) return null;

  return (
    <div ref={viewportRef} className={`gift-testimonials__col gift-testimonials__col--${speed}`}>
      <ul ref={trackRef} className="gift-testimonials__list list-none" aria-hidden>
        {items.map((item) => (
          <TestimonialCard key={`${item.author}-${item.quote.slice(0, 24)}`} item={item} />
        ))}
        {items.map((item) => (
          <TestimonialCard
            key={`loop-${item.author}-${item.quote.slice(0, 24)}`}
            item={item}
            loopCopy
          />
        ))}
      </ul>
    </div>
  );
}
