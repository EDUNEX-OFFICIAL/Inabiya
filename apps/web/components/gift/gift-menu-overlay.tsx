'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLenis } from 'lenis/react';
import { BookOpen, LogOut, Package, UserRound, X } from 'lucide-react';
import { GiftSearch } from '@/components/gift/gift-search';
import { getGiftCollection } from '@/lib/gift-collections';
import { cn } from '@/lib/utils';

export type GiftMenuLink = { href: string; label: string };

type TileTone = 'blush' | 'sky' | 'mint' | 'lavender' | 'soft';

type TileLook = {
  src: string;
  tone: TileTone;
};

const PHOTO_POOL = [
  '/gift/media/baby-soft-gift.jpg',
  '/gift/media/baby-clothes.jpg',
  '/gift/media/baby-blocks.jpg',
  '/gift/media/wooden-rattle-set.webp',
  '/gift/media/personalised-name-blanket.webp',
  '/gift/media/baby-cues.jpg',
] as const;

const TONES: TileTone[] = ['blush', 'sky', 'mint', 'lavender', 'soft'];

const FEATURED_SHOP = new Set([
  '/gift/build-your-box',
  '/gift/collections/ready-hampers',
  '/gift/hampers',
]);

function hashPick(s: string, n: number) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}

function collectionSlug(href: string): string | null {
  const m = href.match(/\/gift\/collections\/([^/?#]+)/);
  return m?.[1] ?? null;
}

const MENU_PHOTO: Record<string, TileLook> = {
  'build-your-box': { src: '/gift/media/baby-soft-gift.jpg', tone: 'blush' },
  'ready-hampers': { src: '/gift/media/baby-cues.jpg', tone: 'lavender' },
  hampers: { src: '/gift/media/baby-cues.jpg', tone: 'lavender' },
  'for-baby-girl': { src: '/gift/media/baby-girl-soft.jpg', tone: 'blush' },
  'for-baby-boy': { src: '/gift/media/boy.jpg', tone: 'sky' },
  'for-expecting-mom': { src: '/gift/media/baby-mom.jpg', tone: 'mint' },
  'unisex-gifts': { src: '/gift/media/personalised-name-blanket.webp', tone: 'soft' },
  'welcome-baby': { src: '/gift/media/baby-boy-soft.jpg', tone: 'soft' },
  'baby-shower': { src: '/gift/media/baby-clothes.jpg', tone: 'blush' },
  'naming-ceremony': { src: '/gift/media/wooden-rattle-set.webp', tone: 'lavender' },
  'first-birthday': { src: '/gift/media/train-toy.jpg', tone: 'sky' },
  newborn: { src: '/gift/media/girl.jpg', tone: 'soft' },
  infant: { src: '/gift/media/baby-blocks.jpg', tone: 'mint' },
  toddler: { src: '/gift/media/train-toy.jpg', tone: 'sky' },
  bestsellers: { src: '/gift/media/baby-cues.jpg', tone: 'lavender' },
  'editors-picks': { src: '/gift/media/personalised-name-blanket.webp', tone: 'blush' },
  'new-arrivals': { src: '/gift/media/baby-soft-gift.jpg', tone: 'mint' },
  'on-sale': { src: '/gift/media/baby-clothes.jpg', tone: 'blush' },
};

function lookFor(href: string, label = ''): TileLook {
  if (href.includes('/gift/build-your-box')) return MENU_PHOTO['build-your-box']!;

  const slug = collectionSlug(href);
  if (slug && MENU_PHOTO[slug]) return MENU_PHOTO[slug]!;
  if (slug) {
    const col = getGiftCollection(slug);
    if (col) {
      const tone: TileTone =
        col.accent === 'sky' ? 'sky' : col.accent === 'pink' ? 'blush' : 'soft';
      return { src: col.heroImageUrl, tone };
    }
  }

  const key = `${href} ${label}`.toLowerCase();
  if (/girl/.test(key)) return MENU_PHOTO['for-baby-girl']!;
  if (/boy/.test(key)) return MENU_PHOTO['for-baby-boy']!;
  if (/mom|expect/.test(key)) return MENU_PHOTO['for-expecting-mom']!;
  if (/shower/.test(key)) return MENU_PHOTO['baby-shower']!;
  if (/newborn|welcome/.test(key)) return MENU_PHOTO['welcome-baby']!;
  if (/birthday|toddler|train/.test(key)) return MENU_PHOTO['first-birthday']!;
  if (/hamper|ready/.test(key)) return MENU_PHOTO['ready-hampers']!;

  const i = hashPick(href, PHOTO_POOL.length);
  return { src: PHOTO_POOL[i]!, tone: TONES[i % TONES.length]! };
}

type Props = {
  open: boolean;
  onClose: () => void;
  shopLinks: GiftMenuLink[];
  forWhomLinks: GiftMenuLink[];
  signedIn: boolean;
  accountLabel: string;
  onSignOut: () => void;
};

function GiftBow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 28" aria-hidden>
      <path
        fill="currentColor"
        d="M24 12c4.5-8 14-10 18-4 2 3 .6 7.4-4 9.2C33 19.4 27.5 17 24 14c-3.5 3-9 5.4-14 3.2C5.6 15.4 4.2 11 6.2 8c4-6 13.5-4 17.8 4z"
        opacity="0.92"
      />
      <circle cx="24" cy="14" r="4.2" fill="currentColor" />
      <path
        fill="currentColor"
        d="M22.2 16.5 20 26h3.2l1.4-8.2h-2.4zm3.6 0 2.2 9.5h-3.2l-1.4-8.2h2.4z"
        opacity="0.85"
      />
    </svg>
  );
}

function HamperCard({
  href,
  label,
  src,
  tone,
  featured,
  onNavigate,
}: {
  href: string;
  label: string;
  src: string;
  tone: TileTone;
  featured?: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn('gift-menu__tile', `gift-menu__tile--${tone}`, featured && 'gift-menu__tile--hamper')}
    >
      <span className="gift-menu__tile-media">
        <Image
          src={src}
          alt=""
          fill
          sizes={featured ? '(max-width: 640px) 50vw, 280px' : '(max-width: 640px) 45vw, 180px'}
          className="object-cover"
        />
      </span>
      <span className="gift-menu__tile-label">{label}</span>
    </Link>
  );
}

export function GiftMenuOverlay({
  open,
  onClose,
  shopLinks,
  forWhomLinks,
  signedIn,
  accountLabel,
  onSignOut,
}: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) onClose();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.classList.add('gift-menu-open');
    html.style.overflow = 'hidden';
    lenis?.stop();

    const main = document.querySelector<HTMLElement>('[data-theme="gift"] .flex-1');
    const inerted: HTMLElement[] = [];
    if (main) {
      let el: HTMLElement | null = main;
      while (el) {
        el.inert = true;
        inerted.push(el);
        el = el.nextElementSibling as HTMLElement | null;
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      html.classList.remove('gift-menu-open');
      html.style.overflow = prevOverflow;
      lenis?.start();
      inerted.forEach((n) => {
        n.inert = false;
      });
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, lenis]);

  if (!mounted || !open) return null;

  const featuredShop = shopLinks.filter((l) => FEATURED_SHOP.has(l.href)).slice(0, 2);
  const moreShop = shopLinks.filter((l) => !FEATURED_SHOP.has(l.href));
  const shopTiles = featuredShop.length ? moreShop : shopLinks;
  const shopHrefs = new Set(shopLinks.map((l) => l.href));
  const whomTiles = forWhomLinks.filter((l) => !shopHrefs.has(l.href));

  return createPortal(
    <div
      id="gift-mobile-menu"
      className="gift-menu"
      data-theme="gift"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-lenis-prevent
    >
      <div className="gift-menu__tissue gift-doodle" aria-hidden />
      <div className="gift-menu__lid">
        <span className="gift-menu__lid-spacer" aria-hidden />
        <GiftBow className="gift-menu__bow" />
        <button type="button" className="gift-menu__close" onClick={onClose} aria-label="Close menu">
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="gift-menu__body">
        <h2 id={titleId} className="sr-only">
          Shop
        </h2>

        <div className="gift-menu__search">
          <GiftSearch defaultExpanded onNavigate={onClose} />
        </div>

        {featuredShop.length ? (
          <section className="gift-menu__section" aria-label="Shop">
            <p className="gift-overline">Shop</p>
            <div className="gift-menu__hamper-grid">
              {featuredShop.map((l) => {
                const look = lookFor(l.href, l.label);
                return (
                  <HamperCard
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    src={look.src}
                    tone={look.tone}
                    featured
                    onNavigate={onClose}
                  />
                );
              })}
            </div>
            {shopTiles.length ? (
              <div className="gift-menu__whom-grid">
                {shopTiles.map((l) => {
                  const look = lookFor(l.href, l.label);
                  return (
                    <HamperCard
                      key={l.href}
                      href={l.href}
                      label={l.label}
                      src={look.src}
                      tone={look.tone}
                      onNavigate={onClose}
                    />
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : shopTiles.length ? (
          <section className="gift-menu__section" aria-label="Shop">
            <p className="gift-overline">Shop</p>
            <div className="gift-menu__whom-grid">
              {shopTiles.map((l) => {
                const look = lookFor(l.href, l.label);
                return (
                  <HamperCard
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    src={look.src}
                    tone={look.tone}
                    onNavigate={onClose}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        {whomTiles.length ? (
          <section className="gift-menu__section" aria-label="For whom">
            <p className="gift-overline">For whom</p>
            <div className="gift-menu__whom-grid">
              {whomTiles.map((l) => {
                const look = lookFor(l.href, l.label);
                return (
                  <HamperCard
                    key={l.href}
                    href={l.href}
                    label={l.label}
                    src={look.src}
                    tone={look.tone}
                    onNavigate={onClose}
                  />
                );
              })}
            </div>
          </section>
        ) : null}

        <Link href="/articles" className="gift-menu__journal" onClick={onClose}>
          <BookOpen className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          <span>Journal</span>
        </Link>

        <div className="gift-menu__account">
          {signedIn ? (
            <>
              <ul className="gift-menu__account-row">
                <li>
                  <Link href="/account" className="gift-menu__account-link" onClick={onClose}>
                    <UserRound className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    <span className="min-w-0 truncate">{accountLabel}</span>
                  </Link>
                </li>
                <li>
                  <Link href="/orders" className="gift-menu__account-link" onClick={onClose}>
                    <Package className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    Orders
                  </Link>
                </li>
              </ul>
              <button type="button" className="gift-menu__signout" onClick={onSignOut}>
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login?next=/gift" className="clay-btn w-full justify-center" onClick={onClose}>
              Sign in
            </Link>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
