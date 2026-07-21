'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ChevronDown,
  Heart,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  UserRound,
  X,
} from 'lucide-react';
import {
  clearSession,
  getStoredAccessToken,
  getStoredUser,
  subscribeAuthChanged,
} from '@/lib/auth-client';
import { fetchCart } from '@/lib/cart-client';
import { GiftSearch } from '@/components/gift/gift-search';

type MegaLink = { href: string; label: string };

const SHOP_LINKS: MegaLink[] = [
  { href: '/gift/box', label: 'Build Your Box' },
  { href: '/gift/products?hamper=1', label: 'Ready-Made Hampers' },
  { href: '/gift/products?category=clothing', label: 'Clothing' },
  { href: '/gift/products?category=bath-skin', label: 'Bath & Skin' },
  { href: '/gift/products?category=toys', label: 'Toys' },
  { href: '/gift/products?category=mom-care', label: 'Mom Care' },
  { href: '/gift/products?category=keepsakes', label: 'Keepsakes' },
];

const FOR_WHOM_LINKS: MegaLink[] = [
  { href: '/gift/products?recipient=girl', label: 'Baby Girl' },
  { href: '/gift/products?recipient=boy', label: 'Baby Boy' },
  { href: '/gift/products?recipient=mom', label: 'Expecting Mom' },
  { href: '/gift/products?age=newborn', label: 'Newborn' },
  { href: '/gift/products?age=infant', label: 'Infant' },
  { href: '/gift/products?age=toddler', label: 'Toddler' },
];

type MegaKey = 'shop' | 'forWhom' | null;

function readAuth() {
  const token = getStoredAccessToken();
  const user = getStoredUser();
  let label = 'Account';
  if (user?.displayName) label = user.displayName;
  else if (user?.email) label = user.email.split('@')[0] ?? 'Account';
  return { signedIn: Boolean(token), label };
}

function IconLink({
  href,
  label,
  children,
  onClick,
}: {
  href: string;
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      onClick={onClick}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-pill text-foreground transition hover:bg-white/70 hover:text-primary"
    >
      {children}
    </Link>
  );
}

function MegaPanel({
  links,
  imageSrc,
  imageClass,
  headline,
  body,
  ctaHref,
  ctaLabel,
  onNavigate,
}: {
  links: MegaLink[];
  imageSrc: string;
  imageClass?: string;
  headline: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-gs-4 md:grid-cols-[1fr_minmax(12rem,16rem)]">
      <ul className="grid gap-gs-1 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl px-gs-3 py-gs-2 font-medium hover:bg-surface-soft hover:text-primary"
              onClick={onNavigate}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
      <aside className={`overflow-hidden rounded-clay border border-border-subtle ${imageClass ?? ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="h-28 w-full object-cover sm:h-36"
          width={640}
          height={360}
        />
        <div className="bg-white/90 p-gs-3">
          <p className="font-display text-lg text-foreground">{headline}</p>
          <p className="mt-gs-1 text-xs opacity-75">{body}</p>
          <Link
            href={ctaHref}
            className="mt-gs-3 inline-flex text-sm font-semibold text-primary hover:underline"
            onClick={onNavigate}
          >
            {ctaLabel}
          </Link>
        </div>
      </aside>
    </div>
  );
}

export function GiftNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [signedIn, setSignedIn] = useState(false);
  const [label, setLabel] = useState('Account');
  const [mega, setMega] = useState<MegaKey>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileShopOpen, setMobileShopOpen] = useState(true);
  const [mobileWhomOpen, setMobileWhomOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function sync() {
      const next = readAuth();
      setSignedIn(next.signedIn);
      setLabel(next.label);
    }
    sync();
    return subscribeAuthChanged(sync);
  }, [pathname]);

  // Close overlays on route *or* query change (same-path PLP filters).
  useEffect(() => {
    setMenuOpen(false);
    setMega(null);
    setProfileOpen(false);
  }, [pathname, searchKey]);

  useEffect(() => {
    let cancelled = false;
    fetchCart(getStoredAccessToken())
      .then((c) => {
        if (!cancelled) {
          setCartCount(c.items.reduce((n, i) => n + i.quantity, 0));
        }
      })
      .catch(() => {
        if (!cancelled) setCartCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, searchKey, signedIn]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
      if (megaRef.current && !megaRef.current.contains(t)) setMega(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMega(null);
        setProfileOpen(false);
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function signOut() {
    clearSession();
    window.location.href = '/gift';
  }

  function toggleMega(key: Exclude<MegaKey, null>) {
    setMega((cur) => (cur === key ? null : key));
    setProfileOpen(false);
  }

  function closeOverlays() {
    setMega(null);
    setProfileOpen(false);
  }

  return (
    <nav
      className="flex min-w-0 flex-1 items-center justify-end gap-gs-2 text-sm"
      aria-label="Gift shop"
    >
      {/* Desktop primary — search leftmost of links */}
      <div className="relative hidden min-w-0 flex-1 items-center justify-end gap-gs-2 md:flex" ref={megaRef}>
        <GiftSearch onExpand={closeOverlays} />
        <button
          type="button"
          className="inline-flex items-center gap-gs-1 rounded-full px-gs-3 py-gs-2 font-medium opacity-90 transition hover:bg-white/70 hover:text-primary"
          aria-expanded={mega === 'shop'}
          aria-haspopup="true"
          aria-controls="gift-mega-shop"
          onClick={() => toggleMega('shop')}
        >
          Shop
          <ChevronDown className={`h-4 w-4 transition ${mega === 'shop' ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-gs-1 rounded-full px-gs-3 py-gs-2 font-medium opacity-90 transition hover:bg-white/70 hover:text-primary"
          aria-expanded={mega === 'forWhom'}
          aria-haspopup="true"
          aria-controls="gift-mega-for-whom"
          onClick={() => toggleMega('forWhom')}
        >
          For Whom
          <ChevronDown
            className={`h-4 w-4 transition ${mega === 'forWhom' ? 'rotate-180' : ''}`}
          />
        </button>
        <Link
          href="/articles"
          className="rounded-full px-gs-3 py-gs-2 font-medium opacity-90 transition hover:bg-white/70 hover:text-primary"
          onClick={closeOverlays}
        >
          Journal
        </Link>

        {mega === 'shop' ? (
          <div
            id="gift-mega-shop"
            className="absolute left-0 right-0 top-full z-40 mt-gs-2 max-h-[min(70vh,28rem)] overflow-y-auto clay-panel p-gs-5 shadow-clay-hover"
          >
            <MegaPanel
              links={SHOP_LINKS}
              imageSrc="/gift/nav/shop.svg"
              headline="Build or pick a hamper"
              body="Guided boxes and ready-made packs — soft, safe, gift-ready."
              ctaHref="/gift/box"
              ctaLabel="Start building →"
              onNavigate={() => setMega(null)}
            />
          </div>
        ) : null}
        {mega === 'forWhom' ? (
          <div
            id="gift-mega-for-whom"
            className="absolute left-0 right-0 top-full z-40 mt-gs-2 max-h-[min(70vh,28rem)] overflow-y-auto clay-panel p-gs-5 shadow-clay-hover"
          >
            <MegaPanel
              links={FOR_WHOM_LINKS}
              imageSrc="/gift/nav/for-whom.svg"
              imageClass="gift-panel-sky"
              headline="Gifts by stage"
              body="Girl, boy, expecting mom — and newborn through toddler."
              ctaHref="/gift/products?age=newborn"
              ctaLabel="Shop newborn →"
              onNavigate={() => setMega(null)}
            />
          </div>
        ) : null}
      </div>

      {/* Utilities */}
      <div className="flex shrink-0 items-center gap-gs-1 border-l border-border-subtle pl-gs-2 md:pl-gs-3">
        {signedIn ? (
          <IconLink href="/gift/wishlist" label="Wishlist" onClick={() => setMenuOpen(false)}>
            <Heart className="h-5 w-5" strokeWidth={1.75} />
          </IconLink>
        ) : null}

        <IconLink href="/gift/cart" label="Cart" onClick={() => setMenuOpen(false)}>
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          {cartCount > 0 ? (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </IconLink>

        <div className="relative hidden md:block" ref={profileRef}>
          {signedIn ? (
            <>
              <button
                type="button"
                className="inline-flex h-10 items-center gap-gs-2 rounded-pill px-gs-2 text-foreground transition hover:bg-white/70 hover:text-primary"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setMega(null);
                }}
              >
                <UserRound className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span className="hidden max-w-[7rem] truncate lg:inline">{label}</span>
              </button>
              {profileOpen ? (
                <ul
                  role="menu"
                  className="absolute right-0 z-30 mt-gs-2 min-w-[12rem] rounded-control border border-border-subtle bg-white p-gs-2 shadow-clay"
                >
                  <li role="none">
                    <Link
                      role="menuitem"
                      className="flex items-center gap-gs-2 rounded-lg px-gs-3 py-gs-2 hover:bg-surface-soft"
                      href="/account"
                      onClick={() => setProfileOpen(false)}
                    >
                      <UserRound className="h-4 w-4 opacity-70" />
                      Profile
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      role="menuitem"
                      className="flex items-center gap-gs-2 rounded-lg px-gs-3 py-gs-2 hover:bg-surface-soft"
                      href="/orders"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Package className="h-4 w-4 opacity-70" />
                      Orders
                    </Link>
                  </li>
                  <li role="none" className="my-gs-1 border-t border-border-subtle" />
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-gs-2 rounded-lg px-gs-3 py-gs-2 text-left text-danger hover:bg-danger-bg"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </li>
                </ul>
              ) : null}
            </>
          ) : (
            <Link href="/login?next=/gift" className="clay-btn !min-h-0 !px-gs-4 !py-gs-2 text-xs">
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-pill hover:bg-white/70 hover:text-primary md:hidden"
          aria-expanded={menuOpen}
          aria-controls="gift-mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen ? (
        <div
          id="gift-mobile-menu"
          className="absolute left-gs-3 right-gs-3 top-full z-40 mt-gs-2 max-h-[80vh] overflow-y-auto clay-panel p-gs-4 md:hidden"
        >
          <div className="mb-gs-4 md:hidden">
            <GiftSearch defaultExpanded onNavigate={() => setMenuOpen(false)} />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-gs-3 py-gs-3 font-medium"
            aria-expanded={mobileShopOpen}
            onClick={() => setMobileShopOpen((o) => !o)}
          >
            Shop
            <ChevronDown className={`h-4 w-4 ${mobileShopOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileShopOpen ? (
            <ul className="mb-gs-2 flex flex-col gap-gs-1 border-b border-border-subtle pb-gs-3">
              {SHOP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    className="block rounded-xl px-gs-3 py-gs-2 hover:bg-white/80"
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <button
            type="button"
            className="flex w-full items-center justify-between rounded-xl px-gs-3 py-gs-3 font-medium"
            aria-expanded={mobileWhomOpen}
            onClick={() => setMobileWhomOpen((o) => !o)}
          >
            For Whom
            <ChevronDown className={`h-4 w-4 ${mobileWhomOpen ? 'rotate-180' : ''}`} />
          </button>
          {mobileWhomOpen ? (
            <ul className="mb-gs-2 flex flex-col gap-gs-1 border-b border-border-subtle pb-gs-3">
              {FOR_WHOM_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    className="block rounded-xl px-gs-3 py-gs-2 hover:bg-white/80"
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}

          <Link
            href="/articles"
            className="block rounded-xl px-gs-3 py-gs-3 font-medium hover:bg-white/80"
            onClick={() => setMenuOpen(false)}
          >
            Journal
          </Link>

          <div className="mt-gs-2 border-t border-border-subtle pt-gs-3">
            {signedIn ? (
              <ul className="flex flex-col gap-gs-1">
                <li>
                  <Link
                    className="flex items-center gap-gs-2 rounded-xl px-gs-3 py-gs-3 hover:bg-white/80"
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound className="h-4 w-4" />
                    Profile ({label})
                  </Link>
                </li>
                <li>
                  <Link
                    className="flex items-center gap-gs-2 rounded-xl px-gs-3 py-gs-3 hover:bg-white/80"
                    href="/orders"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    Orders
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-gs-2 rounded-xl px-gs-3 py-gs-3 text-left text-danger hover:bg-danger-bg"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </li>
              </ul>
            ) : (
              <Link
                href="/login?next=/gift"
                className="clay-btn mt-gs-1 w-full justify-center"
                onClick={() => setMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
