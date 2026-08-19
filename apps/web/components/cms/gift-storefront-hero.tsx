'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { ArrowRight, Gift, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';
import { runGiftHeroEntrance } from '@/components/cms/gift-hero-entrance';
import { HeroMedia } from '@/components/cms/hero-media';
import { GiftResponsiveLink } from '@/components/gift/gift-responsive-cta';
import { preferPublicHeroSrc } from '@/lib/public-hero';
import { parseTrustChips, trustIconKind } from '@/components/cms/parse-trust-line';
import type { SectionStyle } from '@/components/cms/section-style';

const DEFAULT_HERO_IMAGE = '/gift/media/baby-soft-gift.webp';

const TRUST_ICONS = {
  shield: ShieldCheck,
  truck: Truck,
  heart: HeartHandshake,
} as const;

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
  /** Which column the photo sits in. Default right (current storefront). */
  mediaSide?: 'left' | 'right';
  style?: SectionStyle;
};

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
      <Link
        href="/#faq"
        className="underline-offset-2 hover:underline"
        data-testid="hero-trust-shipping"
      >
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
  mediaSide = 'right',
  style,
}: GiftStorefrontHeroProps) {
  const containerRef = useRef<HTMLElement>(null);
  const photoSrc = preferPublicHeroSrc(imageUrl?.trim() || DEFAULT_HERO_IMAGE);
  const trustChips = parseTrustChips(trustLine);
  const eyebrowText = eyebrow?.trim();
  const accent = accentWord?.trim() || undefined;
  const [photoReady, setPhotoReady] = useState(false);
  const enteredSrc = useRef<string | null>(null);

  const markPhotoReady = useCallback(() => {
    setPhotoReady(true);
  }, []);

  const prevPhotoSrc = useRef(photoSrc);
  useEffect(() => {
    if (prevPhotoSrc.current === photoSrc) return;
    prevPhotoSrc.current = photoSrc;
    setPhotoReady(false);
    enteredSrc.current = null;
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
      if (enteredSrc.current === photoSrc && root.hasAttribute('data-hero-ready')) return;
      enteredSrc.current = photoSrc;

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
    <section
      ref={containerRef}
      className={`gift-hero-split relative overflow-x-clip ${
        style?.pad === 'sm' ? 'is-pad-sm' : style?.pad === 'lg' ? 'is-pad-lg' : ''
      }`}
    >
      <div className="gift-hero-split__wash absolute inset-0" aria-hidden />

      <div className="gift-hero-split__grid relative z-10 mx-auto grid w-full gap-gs-3 lg:grid-cols-2 lg:items-stretch lg:gap-gs-8">
        <div
          className={`gift-hero-split__copy flex flex-col ${
            style?.align === 'start'
              ? 'is-align-start items-start text-left'
              : style?.align === 'end'
                ? 'is-align-end items-end text-right'
                : style?.align === 'center'
                  ? 'is-align-center items-center text-center'
                  : 'items-center text-center lg:items-start lg:text-left'
          } ${
            style?.valign === 'start'
              ? 'justify-start'
              : style?.valign === 'end'
                ? 'justify-end'
                : 'justify-center'
          } ${mediaSide === 'left' ? 'order-2' : 'order-1'}`}
        >
          {eyebrowText ? (
            <p data-hero-anim="eyebrow" className="gift-hero-split__eyebrow gift-overline">
              {eyebrowText}
            </p>
          ) : null}

          <h1
            data-hero-anim="headline"
            className={`gift-hero-split__headline gift-h1 mt-gs-2 max-w-3xl text-balance lg:mt-gs-3${
              style?.headlineSize === 'h1'
                ? ' is-size-h1'
                : style?.headlineSize === 'h2'
                  ? ' is-size-h2'
                  : ''
            }${style?.ink === 'blush' ? ' is-ink-blush' : style?.ink === 'muted' ? ' is-ink-muted' : ''}`}
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

          <div
            className={`mt-gs-3 flex w-full max-w-md flex-row flex-wrap items-center gap-gs-2 sm:mt-gs-4 sm:max-w-none sm:w-auto sm:gap-gs-3 ${
              style?.align === 'start'
                ? 'justify-start'
                : style?.align === 'end'
                  ? 'justify-end'
                  : style?.align === 'center'
                    ? 'justify-center'
                    : 'justify-center lg:justify-start'
            }`}
          >
            {ctaLabel && ctaHref ? (
              <GiftResponsiveLink
                data-hero-cta="primary"
                data-testid="hero-cta-primary"
                href={ctaHref}
                label={ctaLabel}
                icon={Gift}
                labelFrom="always"
                className="gift-hero-split__cta-primary gift-hero-split__cta"
              />
            ) : null}
            {ctaLabel2 && ctaHref2 ? (
              <GiftResponsiveLink
                data-hero-cta="secondary"
                data-testid="hero-cta-secondary"
                href={ctaHref2}
                label={ctaLabel2}
                icon={ArrowRight}
                iconPosition="end"
                variant="secondary"
                labelFrom="always"
                className="gift-hero-split__cta-secondary gift-hero-split__cta"
              />
            ) : null}
          </div>

          {trustChips.length ? (
            <ul
              data-hero-anim="trust"
              className="gift-hero-split__trust mt-gs-3 flex w-full list-none flex-row flex-wrap items-start justify-center gap-x-gs-2 gap-y-gs-2 overflow-visible sm:mt-gs-4 sm:gap-x-gs-4 lg:justify-start"
            >
              {trustChips.map((chip, i) => {
                const Icon = TRUST_ICONS[chip.icon] ?? TRUST_ICONS[trustIconKind(chip.label, i)];
                return (
                  <li key={`${chip.label}-${i}`} className="gift-hero-split__trust-item">
                    <span className="gift-hero-split__trust-icon" aria-hidden>
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <TrustChipLabel label={chip.label} />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>

        <div className={`gift-hero-split__media ${mediaSide === 'left' ? 'order-1' : 'order-2'}`}>
          <div className="gift-hero-split__frame relative">
            <HeroMedia
              src={photoSrc}
              alt={headline}
              fallback={DEFAULT_HERO_IMAGE}
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className={`gift-hero-split__photo${photoReady ? ' gift-hero-split__photo--ready' : ''}`}
              onReady={markPhotoReady}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
