'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Building2, Package, Sparkles } from 'lucide-react';

const TRUST = [
  { label: 'Dedicated quote', Icon: Building2 },
  { label: 'Personalised options', Icon: Sparkles },
  { label: 'Pan-India delivery', Icon: Package },
] as const;

export function CorporateHero() {
  const containerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const targets = containerRef.current?.querySelectorAll(
        '[data-hero-anim], [data-hero-cta], .gift-hero-split__frame, .gift-hero-split__wash',
      );

      if (reduced) {
        if (targets?.length) gsap.set(targets, { clearProps: 'all', opacity: 1, y: 0, scale: 1 });
        return;
      }

      const wash = containerRef.current?.querySelector('.gift-hero-split__wash');
      const frame = containerRef.current?.querySelector('.gift-hero-split__frame');
      const brand = containerRef.current?.querySelector('[data-hero-anim="brand"]');
      const title = containerRef.current?.querySelector('[data-hero-anim="headline"]');
      const body = containerRef.current?.querySelector('[data-hero-anim="subcopy"]');
      const primary = containerRef.current?.querySelector('[data-hero-cta="primary"]');
      const secondary = containerRef.current?.querySelector('[data-hero-cta="secondary"]');
      const trust = containerRef.current?.querySelector('[data-hero-anim="trust"]');

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (wash) tl.from(wash, { opacity: 0, duration: 1.1 }, 0);
      if (frame) tl.from(frame, { opacity: 0, y: 22, scale: 1.03, duration: 1.2 }, 0.15);
      if (brand) tl.from(brand, { opacity: 0, y: 10, duration: 0.7 }, 0.4);
      if (title) tl.from(title, { opacity: 0, y: 28, duration: 1.05 }, 0.55);
      if (body) tl.from(body, { opacity: 0, y: 16, duration: 0.85 }, 0.85);
      if (primary) tl.from(primary, { opacity: 0, y: 14, duration: 0.75 }, 1.1);
      if (secondary) tl.from(secondary, { opacity: 0, y: 12, duration: 0.7 }, 1.3);
      if (trust) tl.from(trust, { opacity: 0, y: 10, duration: 0.7 }, 1.5);
    },
    { scope: containerRef },
  );

  return (
    <section ref={containerRef} className="gift-hero-split relative overflow-hidden">
      <div className="gift-hero-split__wash absolute inset-0" aria-hidden />

      <div className="gift-hero-split__grid relative z-10 mx-auto grid max-w-6xl items-center gap-gs-6 lg:grid-cols-2 lg:gap-gs-8">
        <div className="gift-hero-split__copy flex flex-col text-left">
          <p data-hero-anim="brand" className="gift-display text-primary sm:text-5xl">
            Inabiya
          </p>
          <p className="gift-overline mt-gs-3">Teams · events · bulk orders</p>

          <h1
            data-hero-anim="headline"
            className="gift-hero-split__headline gift-h1 mt-gs-3 max-w-xl text-balance sm:text-5xl"
          >
            Corporate &amp; bulk <em className="gift-hero-split__accent">gifting</em>
          </h1>

          <p
            data-hero-anim="subcopy"
            className="gift-hero-split__sub gift-body mt-gs-4 max-w-md sm:mt-gs-5"
          >
            Soft Gift hampers for clients, employees, and celebrations — share quantity and
            occasion; we reply with clear pricing.
          </p>

          <div className="mt-gs-6 flex w-full flex-col gap-gs-3 sm:w-auto sm:flex-row sm:flex-wrap">
            <a
              data-hero-cta="primary"
              href="#inquiry"
              className="clay-btn gift-hero-split__cta-primary inline-flex w-full items-center justify-center gap-gs-2 sm:w-auto"
            >
              Request a quote
            </a>
            <Link
              data-hero-cta="secondary"
              href="/gift"
              className="clay-btn-secondary inline-flex w-full items-center justify-center gap-gs-2 sm:w-auto"
            >
              Browse shop
              <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            </Link>
          </div>

          <ul
            data-hero-anim="trust"
            className="gift-hero-split__trust mt-gs-6 flex list-none flex-col gap-gs-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-gs-5"
          >
            {TRUST.map(({ label, Icon }) => (
              <li key={label} className="gift-hero-split__trust-item">
                <span className="gift-hero-split__trust-icon" aria-hidden>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="gift-hero-split__media">
          <div className="gift-hero-split__frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gift/media/gift-box.svg"
              alt="Inabiya Soft Gift box"
              className="gift-hero-split__photo gift-hero-split__photo--contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
