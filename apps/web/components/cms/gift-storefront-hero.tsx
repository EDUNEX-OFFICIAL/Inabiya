'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Gift, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';
import { GIFT_HERO_FOUC_CSS, runGiftHeroEntrance } from '@/components/cms/gift-hero-entrance';

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
  const [photoReady, setPhotoReady] = useState(false);

  const markPhotoReady = useCallback(() => {
    setPhotoReady(true);
  }, []);

  useEffect(() => {
    setPhotoReady(false);
  }, [photoSrc]);

  // Don't leave hero permanently hidden if decode stalls
  useEffect(() => {
    if (photoReady) return;
    const t = window.setTimeout(() => setPhotoReady(true), 2200);
    return () => window.clearTimeout(t);
  }, [photoReady, photoSrc]);

  useGSAP(
    () => {
      if (!photoReady) return;
      const root = containerRef.current;
      if (!root) return;

      return runGiftHeroEntrance(root, {
        wash: root.querySelector('.gift-hero-split__wash'),
        frame: root.querySelector('.gift-hero-split__frame'),
        early: root.querySelector('[data-hero-anim="eyebrow"]'),
        title: root.querySelector('[data-hero-anim="headline"]'),
        body: root.querySelector('[data-hero-anim="subcopy"]'),
        primary: root.querySelector('[data-hero-cta="primary"]'),
        secondary: root.querySelector('[data-hero-cta="secondary"]'),
        trust: root.querySelector('[data-hero-anim="trust"]'),
      });
    },
    { scope: containerRef, dependencies: [photoReady, photoSrc] },
  );

  return (
    <section ref={containerRef} className="gift-hero-split relative overflow-hidden">
      {/* In-DOM critical CSS: hides targets before globals.css / GSAP (kills flash→hide→in) */}
      <style dangerouslySetInnerHTML={{ __html: GIFT_HERO_FOUC_CSS }} />
      <div className="gift-hero-split__wash absolute inset-0" aria-hidden />

      <div className="gift-hero-split__grid relative z-10 mx-auto grid w-full max-w-page gap-gs-3 lg:grid-cols-2 lg:items-stretch lg:gap-gs-8">
        <div className="gift-hero-split__copy flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
          <p data-hero-anim="eyebrow" className="gift-hero-split__eyebrow gift-overline">
            {eyebrowText}
          </p>

          <h1
            data-hero-anim="headline"
            className="gift-hero-split__headline gift-h1 mt-gs-2 max-w-3xl text-balance lg:mt-gs-3"
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

          <div className="mt-gs-3 flex w-full max-w-md flex-row items-stretch justify-center gap-gs-2 sm:mt-gs-4 sm:max-w-none sm:w-auto sm:items-center sm:gap-gs-3 lg:justify-start">
            {ctaLabel && ctaHref ? (
              <Link
                data-hero-cta="primary"
                data-testid="hero-cta-primary"
                href={ctaHref}
                className="clay-btn gift-hero-split__cta-primary inline-flex min-h-tap flex-1 items-center justify-center gap-gs-1 whitespace-nowrap px-gs-2 text-caption sm:min-h-0 sm:flex-none sm:gap-gs-2 sm:px-[var(--btn-pad-x)] sm:text-body"
              >
                <Gift className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
                {ctaLabel}
              </Link>
            ) : null}
            {ctaLabel2 && ctaHref2 ? (
              <Link
                data-hero-cta="secondary"
                data-testid="hero-cta-secondary"
                href={ctaHref2}
                className="clay-btn-secondary gift-hero-split__cta-secondary inline-flex min-h-tap flex-1 items-center justify-center gap-gs-1 whitespace-nowrap px-gs-2 text-caption sm:min-h-0 sm:w-auto sm:flex-none sm:gap-gs-2 sm:px-[var(--btn-pad-x)] sm:text-body"
              >
                {ctaLabel2}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
              </Link>
            ) : null}
          </div>

          {trustChips.length ? (
            <ul
              data-hero-anim="trust"
              className="gift-hero-split__trust mt-gs-3 flex w-full list-none flex-row flex-wrap items-start justify-center gap-x-gs-2 gap-y-gs-2 sm:mt-gs-4 sm:gap-x-gs-4 lg:justify-start"
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
              className={`gift-hero-split__photo object-cover${photoReady ? ' gift-hero-split__photo--ready' : ''}`}
              onLoad={markPhotoReady}
              onLoadingComplete={markPhotoReady}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
