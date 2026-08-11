'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Building2, Package, Sparkles } from 'lucide-react';
import { GIFT_HERO_FOUC_CSS, runGiftHeroEntrance } from '@/components/cms/gift-hero-entrance';

const TRUST = [
  { label: 'Dedicated quote', Icon: Building2 },
  { label: 'Personalised options', Icon: Sparkles },
  { label: 'Pan-India delivery', Icon: Package },
] as const;

export function CorporateHero() {
  const containerRef = useRef<HTMLElement>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const markPhotoReady = useCallback(() => setPhotoReady(true), []);

  useEffect(() => {
    if (photoReady) return;
    const t = window.setTimeout(() => setPhotoReady(true), 1200);
    return () => window.clearTimeout(t);
  }, [photoReady]);

  useGSAP(
    () => {
      if (!photoReady) return;
      const root = containerRef.current;
      if (!root) return;

      return runGiftHeroEntrance(root, {
        wash: root.querySelector('.gift-hero-split__wash'),
        frame: root.querySelector('.gift-hero-split__frame'),
        early: root.querySelector('[data-hero-anim="brand"]'),
        title: root.querySelector('[data-hero-anim="headline"]'),
        body: root.querySelector('[data-hero-anim="subcopy"]'),
        primary: root.querySelector('[data-hero-cta="primary"]'),
        secondary: root.querySelector('[data-hero-cta="secondary"]'),
        trust: root.querySelector('[data-hero-anim="trust"]'),
      });
    },
    { scope: containerRef, dependencies: [photoReady] },
  );

  return (
    <section ref={containerRef} className="gift-hero-split relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: GIFT_HERO_FOUC_CSS }} />
      <div className="gift-hero-split__wash absolute inset-0" aria-hidden />

      <div className="gift-hero-split__grid relative z-10 mx-auto grid w-full items-center gap-gs-6 lg:grid-cols-2 lg:gap-gs-8">
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
              className={`gift-hero-split__photo gift-hero-split__photo--contain${photoReady ? ' gift-hero-split__photo--ready' : ''}`}
              onLoad={markPhotoReady}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
