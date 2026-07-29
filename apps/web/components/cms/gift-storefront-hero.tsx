'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ArrowRight, Gift, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';

const DEFAULT_HERO_IMAGE = '/gift/media/baby-soft-gift.jpg';

const DEFAULT_TRUST = [
  'Baby-safe brands',
  'Free shipping over ₹2,000',
  'PAN-India delivery',
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
  /** Word to italic-accent in headline when present (CMS-owned). */
  accentWord?: string;
};

function parseTrustChips(trustLine?: string): string[] {
  if (!trustLine?.trim()) return [...DEFAULT_TRUST];
  return trustLine
    .split(/\s*[·|•\n]\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function AccentHeadline({ text, accentWord }: { text: string; accentWord?: string }) {
  const needle = accentWord?.trim();
  if (!needle) return <>{text}</>;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\b${escaped}\\b)`, 'i');
  const parts = text.split(re);
  if (parts.length < 2) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="gift-hero-split__accent">
            {part}
          </em>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function TrustChipLabel({ label }: { label: string }) {
  const shipping = /shipping/i.test(label);
  if (shipping) {
    return (
      <Link href="/gift#faq" className="underline-offset-2 hover:underline" data-testid="hero-trust-shipping">
        {label}
      </Link>
    );
  }
  return <span>{label}</span>;
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
  accentWord,
}: GiftStorefrontHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const photoSrc = imageUrl?.trim() || DEFAULT_HERO_IMAGE;
  const trustChips = parseTrustChips(trustLine);
  const eyebrowText = eyebrow?.trim() || 'Personalised baby gifting';
  const accent = accentWord?.trim() || (/\bjoy\b/i.test(headline) ? 'joy' : undefined);

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

      <div className="gift-hero-split__grid relative z-10 mx-auto grid w-full max-w-page gap-gs-3 lg:grid-cols-2 lg:items-stretch lg:gap-gs-8">
        <div className="gift-hero-split__copy flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
          <p data-hero-anim="eyebrow" className="gift-hero-split__eyebrow gift-overline">
            {eyebrowText}
          </p>

          <h1
            data-hero-anim="headline"
            className="gift-hero-split__headline gift-h1 mt-gs-2 max-w-2xl text-balance lg:mt-gs-3"
          >
            <AccentHeadline text={headline} accentWord={accent} />
          </h1>

          {subcopy ? (
            <p
              data-hero-anim="subcopy"
              className="gift-hero-split__sub gift-body mt-gs-2 max-w-md lg:mt-gs-3"
            >
              {subcopy}
            </p>
          ) : null}

          <div className="mt-gs-3 flex w-full flex-col gap-gs-2 sm:mt-gs-4 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-gs-3 lg:justify-start">
            {ctaLabel && ctaHref ? (
              <Link
                data-hero-cta="primary"
                data-testid="hero-cta-primary"
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
                data-testid="hero-cta-secondary"
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
              className="gift-hero-split__trust mt-gs-3 flex list-none flex-col items-center gap-gs-2 sm:mt-gs-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-gs-4 sm:gap-y-gs-2 lg:items-start lg:justify-start"
            >
              {trustChips.map((label, i) => {
                const Icon = TRUST_ICONS[i % TRUST_ICONS.length] ?? ShieldCheck;
                return (
                  <li key={`${label}-${i}`} className="gift-hero-split__trust-item">
                    <span className="gift-hero-split__trust-icon" aria-hidden>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <TrustChipLabel label={label} />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className="gift-hero-split__media">
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
