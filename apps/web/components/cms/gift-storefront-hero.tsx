'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef, type ReactNode } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Gift, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';

const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1635874714425-c342060a4c58?w=900&q=85';

const DEFAULT_TRUST = [
  'Baby-safe brands',
  'Free shipping over ₹2,000',
  'Curated for new parents',
] as const;

const TRUST_ICONS = [ShieldCheck, Truck, HeartHandshake] as const;

export type GiftStorefrontHeroProps = {
  headline: string;
  subcopy?: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaLabel2?: string;
  ctaHref2?: string;
  /** Middot/pipe/newline separated chips from CMS */
  trustLine?: string;
  eyebrow?: string;
  imageUrl?: string;
};

function parseTrustChips(trustLine?: string): string[] {
  if (!trustLine?.trim()) return [...DEFAULT_TRUST];
  return trustLine
    .split(/\s*[·|•\n]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/** Soft Gift: italic pink accent on a key word (e.g. joy) when present. */
function AccentHeadline({ text }: { text: string }) {
  const parts = text.split(/(\bjoy\b)/i);
  const nodes: ReactNode[] = parts.map((part, i) =>
    /^joy$/i.test(part) ? (
      <em key={i} className="gift-hero-split__accent">
        {part}
      </em>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
  return <>{nodes}</>;
}

export function GiftStorefrontHero({
  headline,
  subcopy,
  ctaLabel,
  ctaHref,
  ctaLabel2,
  ctaHref2,
  trustLine,
  eyebrow,
  imageUrl,
}: GiftStorefrontHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const photoSrc = imageUrl?.trim() || DEFAULT_HERO_IMAGE;
  const trustChips = parseTrustChips(trustLine);
  const eyebrowText = eyebrow?.trim() || 'Personalised baby gifting';

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
      const eyebrowEl = containerRef.current?.querySelector('[data-hero-anim="eyebrow"]');
      const title = containerRef.current?.querySelector('[data-hero-anim="headline"]');
      const body = containerRef.current?.querySelector('[data-hero-anim="subcopy"]');
      const primary = containerRef.current?.querySelector('[data-hero-cta="primary"]');
      const secondary = containerRef.current?.querySelector('[data-hero-cta="secondary"]');
      const trust = containerRef.current?.querySelector('[data-hero-anim="trust"]');

      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      if (wash) tl.from(wash, { opacity: 0, duration: 1.1 }, 0);
      if (frame) tl.from(frame, { opacity: 0, y: 22, scale: 1.03, duration: 1.2 }, 0.15);
      if (eyebrowEl) tl.from(eyebrowEl, { opacity: 0, y: 10, duration: 0.7 }, 0.4);
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
      <div className="gift-hero-split__svg absolute inset-0" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gift/gifting-bg.svg"
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      <div className="gift-hero-split__grid relative z-10 mx-auto grid max-w-6xl items-center gap-gs-6 px-gs-4 py-gs-7 sm:px-gs-6 sm:py-gs-8 lg:grid-cols-2 lg:gap-gs-8 lg:py-gs-8">
        <div className="gift-hero-split__copy order-2 flex flex-col text-left lg:order-1">
          <p data-hero-anim="eyebrow" className="gift-hero-split__eyebrow gift-overline">
            {eyebrowText}
          </p>

          <h1
            data-hero-anim="headline"
            className="gift-hero-split__headline gift-h1 mt-gs-4 max-w-xl text-balance sm:text-5xl md:text-6xl"
          >
            <AccentHeadline text={headline} />
          </h1>

          {subcopy ? (
            <p
              data-hero-anim="subcopy"
              className="gift-hero-split__sub gift-body mt-gs-4 max-w-md sm:mt-gs-5"
            >
              {subcopy}
            </p>
          ) : null}

          <div className="mt-gs-6 flex w-full flex-col gap-gs-3 sm:w-auto sm:flex-row sm:flex-wrap">
            {ctaLabel && ctaHref ? (
              <Link
                data-hero-cta="primary"
                href={ctaHref}
                className="clay-btn gift-hero-split__cta-primary inline-flex w-full items-center justify-center gap-gs-2 sm:w-auto"
              >
                <Gift className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                {ctaLabel}
              </Link>
            ) : null}
            {ctaLabel2 && ctaHref2 ? (
              <Link
                data-hero-cta="secondary"
                href={ctaHref2}
                className="clay-btn-secondary gift-hero-split__cta-secondary inline-flex w-full items-center justify-center gap-gs-2 sm:w-auto"
              >
                {ctaLabel2}
                <ArrowRight className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              </Link>
            ) : null}
          </div>

          {trustChips.length ? (
            <ul
              data-hero-anim="trust"
              className="gift-hero-split__trust mt-gs-6 flex list-none flex-col gap-gs-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-gs-5"
            >
              {trustChips.map((label, i) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length] ?? ShieldCheck;
                return (
                  <li key={`${label}-${i}`} className="gift-hero-split__trust-item">
                    <span className="gift-hero-split__trust-icon" aria-hidden>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="gift-hero-split__media order-1 lg:order-2">
          <div className="gift-hero-split__frame relative">
            <Image
              src={photoSrc}
              alt={headline}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="gift-hero-split__photo object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
