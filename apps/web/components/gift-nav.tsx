'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Heart, LogOut, Package, ShoppingBag, UserRound } from 'lucide-react';
import { GiftMenuOverlay } from '@/components/gift/gift-menu-overlay';
import {
  clearSession,
  getStoredAccessToken,
  getStoredUser,
  subscribeAuthChanged,
} from '@/lib/auth-client';
import { fetchCart } from '@/lib/cart-client';
import { GiftSearch } from '@/components/gift/gift-search';
import { apiUrl } from '@/lib/api-base';
import {
  findNavLink,
  organizeGiftNav,
  previewForNavLink,
  splitNavColumns,
  type GiftNavGroup,
  type GiftNavLink,
  type GiftNavPreview,
} from '@/lib/gift-nav-ia';
import { cn } from '@/lib/utils';
import { safeHrefOrHash } from '@inabiya/validation';

type MegaLink = GiftNavLink;
type MegaCopy = GiftNavPreview;
type GiftTopNavItem = {
  id: string;
  label: string;
  type: 'link' | 'mega';
  href?: string;
  links?: MegaLink[];
  mega?: Partial<MegaCopy>;
};

const DEFAULT_SHOP_LINKS: MegaLink[] = [
  { href: '/build-your-box', label: 'Build Your Box', group: 'Shop' },
  { href: '/collections/ready-hampers', label: 'Ready-Made Hampers', group: 'Shop' },
  { href: '/collections/welcome-baby', label: 'Welcome baby gifts', group: 'Occasion' },
  { href: '/collections/baby-shower', label: 'Baby shower gifts', group: 'Occasion' },
  { href: '/collections/naming-ceremony', label: 'Naming ceremony gifts', group: 'Occasion' },
  { href: '/collections/first-birthday', label: 'First birthday gifts', group: 'Occasion' },
  { href: '/collections/bestsellers', label: 'Best sellers', group: 'Curated' },
  { href: '/collections/editors-picks', label: "Editor's picks", group: 'Curated' },
  { href: '/collections/new-arrivals', label: 'New arrivals', group: 'Curated' },
  { href: '/collections/on-sale', label: 'On sale', group: 'Curated' },
];

const DEFAULT_FOR_WHOM_LINKS: MegaLink[] = [
  { href: '/collections/for-baby-girl', label: 'Baby Girl', group: 'For baby' },
  { href: '/collections/for-baby-boy', label: 'Baby Boy', group: 'For baby' },
  { href: '/collections/for-expecting-mom', label: 'Expecting Mom', group: 'For baby' },
  { href: '/collections/unisex-gifts', label: 'Unisex', group: 'For baby' },
  { href: '/collections/newborn', label: 'Newborn', group: 'By age' },
  { href: '/collections/infant', label: 'Infant', group: 'By age' },
  { href: '/collections/toddler', label: 'Toddler', group: 'By age' },
];

const DEFAULT_SHOP_MEGA: MegaCopy = {
  headline: 'Build or pick a hamper',
  body: 'Guided boxes and ready-made packs — soft, safe, gift-ready.',
  ctaHref: '/build-your-box',
  ctaLabel: 'Start building →',
  imageSrc: '/gift/nav/shop.svg',
};

const DEFAULT_WHOM_MEGA: MegaCopy = {
  headline: 'Gifts by stage',
  body: 'Girl, boy, expecting mom — and newborn through toddler.',
  ctaHref: '/collections/newborn',
  ctaLabel: 'Shop newborn →',
  imageSrc: '/gift/nav/for-whom.svg',
};

const DEFAULT_NAV_ITEMS: GiftTopNavItem[] = [
  {
    id: 'shop',
    label: 'Shop',
    type: 'mega',
    links: DEFAULT_SHOP_LINKS,
    mega: DEFAULT_SHOP_MEGA,
  },
  {
    id: 'for-whom',
    label: 'For Whom',
    type: 'mega',
    links: DEFAULT_FOR_WHOM_LINKS,
    mega: DEFAULT_WHOM_MEGA,
  },
  { id: 'journal', label: 'Journal', type: 'link', href: '/articles' },
];

type MegaKey = string | null;

/** Isolates `useSearchParams` so GiftNav itself can SSR (no empty-nav fallback). */
function GiftNavQuerySync({ onQuery }: { onQuery: (searchKey: string) => void }) {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  useEffect(() => {
    onQuery(searchKey);
  }, [searchKey, onQuery]);
  return null;
}

function navItemsEqual(a: GiftTopNavItem[], b: GiftTopNavItem[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
  groups,
  fallback,
  imageClass,
  onNavigate,
}: {
  groups: GiftNavGroup[];
  fallback: MegaCopy;
  imageClass?: string;
  onNavigate: () => void;
}) {
  const [activeHref, setActiveHref] = useState<string | null>(null);
  const active = activeHref ? findNavLink(groups, activeHref) : undefined;
  const preview = active ? previewForNavLink(active, fallback) : fallback;
  const [colA, colB] = splitNavColumns(groups);
  const columns = colB.length ? [colA, colB] : [colA];

  return (
    <div className="gift-mega__layout">
      <div className={cn('grid min-w-0 gap-gs-4', columns.length > 1 && 'grid-cols-2')}>
        {columns.map((col, i) => (
          <div key={col[0]?.id ?? i} className="grid min-w-0 content-start gap-gs-3">
            {col.map((g) => (
              <div key={g.id} className="min-w-0">
                <p className="gift-overline px-gs-3">{g.title}</p>
                <ul className="mt-gs-1 grid gap-0.5">
                  {g.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={safeHrefOrHash(l.href)}
                        className={cn(
                          'block rounded-control px-gs-3 py-gs-2 font-medium transition-colors hover:bg-surface-soft hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none',
                          activeHref === l.href && 'bg-surface-soft text-primary',
                        )}
                        onMouseEnter={() => setActiveHref(l.href)}
                        onFocus={() => setActiveHref(l.href)}
                        onClick={onNavigate}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
      <aside
        className={cn(
          'flex min-w-0 flex-col overflow-hidden rounded-clay border border-border-subtle',
          imageClass,
        )}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 bg-surface-soft">
          <Image
            src={preview.imageSrc}
            alt=""
            fill
            sizes="280px"
            quality={70}
            className="object-cover"
          />
        </div>
        <div className="flex min-h-[7.5rem] flex-1 flex-col bg-white/90 p-gs-3">
          <p className="line-clamp-2 font-display text-[1.05rem] leading-snug text-foreground">
            {preview.headline}
          </p>
          <p className="mt-gs-1 line-clamp-2 text-caption opacity-75">{preview.body}</p>
          <Link
            href={safeHrefOrHash(preview.ctaHref)}
            className="mt-auto pt-gs-2 inline-flex text-body font-semibold text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={onNavigate}
          >
            {preview.ctaLabel}
          </Link>
        </div>
      </aside>
    </div>
  );
}

function MegaFlyout({
  id,
  label,
  anchorRef,
  open,
  onMouseEnter,
  onMouseLeave,
  children,
}: {
  id: string;
  label: string;
  anchorRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  children: ReactNode;
}) {
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setBox(null);
      return;
    }
    const el = anchorRef.current;
    if (!el) return;
    const sync = () => {
      const r = el.getBoundingClientRect();
      const pad = 8;
      const left = Math.max(pad, r.left);
      const width = Math.min(r.width, Math.max(0, window.innerWidth - left - pad));
      setBox({ top: r.bottom, left, width });
    };
    sync();
    window.addEventListener('resize', sync, { passive: true });
    window.addEventListener('scroll', sync, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
    };
  }, [open, anchorRef]);

  if (!open || !box || box.width < 8) return null;

  return createPortal(
    <div
      id={id}
      data-gift-mega
      data-theme="gift"
      data-lenis-prevent
      role="region"
      aria-label={label}
      className="fixed z-40 pt-gs-2"
      style={{ top: box.top, left: box.left, width: box.width }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="gift-mega gift-mega-scroll clay-panel p-gs-4 shadow-clay-hover sm:p-gs-5">
        {children}
      </div>
    </div>,
    document.body,
  );
}

function MorePanel({ items, onNavigate }: { items: GiftTopNavItem[]; onNavigate: () => void }) {
  return (
    <div className="grid gap-gs-5">
      {items.map((item) =>
        item.type === 'link' ? (
          <Link
            key={item.id}
            href={safeHrefOrHash(item.href ?? '')}
            className="rounded-control px-gs-3 py-gs-2 font-medium hover:bg-surface-soft hover:text-primary"
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        ) : (
          <section
            key={item.id}
            className="grid gap-gs-3 border-t border-border-subtle pt-gs-4 first:border-0 first:pt-0"
          >
            <p className="font-display text-lg">{item.label}</p>
            <MegaPanel
              groups={organizeGiftNav(item.links ?? [], []).shop}
              fallback={{ ...DEFAULT_SHOP_MEGA, ...item.mega }}
              onNavigate={onNavigate}
            />
          </section>
        ),
      )}
    </div>
  );
}

export function GiftNav() {
  const pathname = usePathname();
  const [searchKey, setSearchKey] = useState('');
  const onQuery = useCallback((key: string) => setSearchKey(key), []);
  const [signedIn, setSignedIn] = useState(false);
  const [label, setLabel] = useState('Account');
  const [mega, setMega] = useState<MegaKey>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [navItems, setNavItems] = useState<GiftTopNavItem[]>(DEFAULT_NAV_ITEMS);
  const profileRef = useRef<HTMLDivElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const megaCloseTimer = useRef<number | null>(null);
  const megaOpenTimer = useRef<number | null>(null);
  const fineHover = useRef(false);
  const megaKeyRef = useRef<MegaKey>(null);
  megaKeyRef.current = mega;

  const visibleNavItems = useMemo(() => navItems.slice(0, 3), [navItems]);
  const overflowNavItems = useMemo(() => navItems.slice(3), [navItems]);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl('/catalog/gift-chrome'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.navItems) && data.navItems.length) {
          const next = data.navItems as GiftTopNavItem[];
          setNavItems((prev) => (navItemsEqual(prev, next) ? prev : next));
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
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
      const inTrigger = Boolean(megaRef.current?.contains(t));
      const inFlyout = t instanceof Element && Boolean(t.closest('[data-gift-mega]'));
      if (!inTrigger && !inFlyout) setMega(null);
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
      if (megaCloseTimer.current != null) {
        window.clearTimeout(megaCloseTimer.current);
        megaCloseTimer.current = null;
      }
      if (megaOpenTimer.current != null) {
        window.clearTimeout(megaOpenTimer.current);
        megaOpenTimer.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const hoverMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const desktopMq = window.matchMedia('(min-width: 1024px)');
    const syncHover = () => {
      fineHover.current = hoverMq.matches;
    };
    const onDesktop = () => {
      if (!desktopMq.matches) {
        setMega(null);
        setMenuOpen(false);
      }
    };
    syncHover();
    hoverMq.addEventListener('change', syncHover);
    desktopMq.addEventListener('change', onDesktop);
    return () => {
      hoverMq.removeEventListener('change', syncHover);
      desktopMq.removeEventListener('change', onDesktop);
    };
  }, []);

  function signOut() {
    clearSession();
    window.location.href = '/';
  }

  function clearMegaTimers() {
    if (megaCloseTimer.current != null) {
      window.clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
    if (megaOpenTimer.current != null) {
      window.clearTimeout(megaOpenTimer.current);
      megaOpenTimer.current = null;
    }
  }

  function openMega(key: Exclude<MegaKey, null>) {
    clearMegaTimers();
    setMega(key);
    setProfileOpen(false);
  }

  function scheduleMegaOpen(key: Exclude<MegaKey, null>) {
    if (!fineHover.current) return;
    if (megaCloseTimer.current != null) {
      window.clearTimeout(megaCloseTimer.current);
      megaCloseTimer.current = null;
    }
    if (megaKeyRef.current === key) return;
    if (megaOpenTimer.current != null) {
      window.clearTimeout(megaOpenTimer.current);
    }
    megaOpenTimer.current = window.setTimeout(() => openMega(key), 80);
  }

  function scheduleMegaClose() {
    if (megaOpenTimer.current != null) {
      window.clearTimeout(megaOpenTimer.current);
      megaOpenTimer.current = null;
    }
    if (megaCloseTimer.current != null) {
      window.clearTimeout(megaCloseTimer.current);
    }
    megaCloseTimer.current = window.setTimeout(() => setMega(null), 140);
  }

  function toggleMega(key: Exclude<MegaKey, null>) {
    clearMegaTimers();
    setMega((cur) => (cur === key ? null : key));
    setProfileOpen(false);
  }

  function onMegaTriggerClick(e: ReactMouseEvent<HTMLButtonElement>, key: Exclude<MegaKey, null>) {
    const pointerType = (e.nativeEvent as PointerEvent).pointerType;
    if (pointerType === 'mouse' || (pointerType !== 'touch' && e.detail > 0)) {
      openMega(key);
      return;
    }
    toggleMega(key);
  }

  function onMegaTriggerKey(
    e: ReactKeyboardEvent<HTMLButtonElement>,
    key: Exclude<MegaKey, null>,
    panelId: string,
  ) {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    openMega(key);
    requestAnimationFrame(() => {
      document.querySelector<HTMLAnchorElement>(`#${panelId} a`)?.focus();
    });
  }

  function closeOverlays() {
    clearMegaTimers();
    setMega(null);
    setProfileOpen(false);
  }

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <nav
      className="flex min-w-0 flex-1 items-center justify-end gap-gs-2 text-body"
      aria-label="Gift shop"
    >
      <Suspense fallback={null}>
        <GiftNavQuerySync onQuery={onQuery} />
      </Suspense>
      {/* Desktop primary — lg+ only; md/tablet uses hamburger (search+links overflow at 768) */}
      <div
        className="relative hidden min-w-0 flex-1 items-center justify-end gap-gs-2 lg:flex"
        ref={megaRef}
      >
        <GiftSearch onExpand={closeOverlays} />
        {visibleNavItems.map((item) =>
          item.type === 'link' ? (
            <Link
              key={item.id}
              href={safeHrefOrHash(item.href ?? '')}
              className="shrink-0 rounded-pill px-gs-3 py-gs-2 font-medium opacity-90 transition hover:bg-white/70 hover:text-primary motion-reduce:transition-none"
              onClick={closeOverlays}
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              className="inline-flex shrink-0 items-center gap-gs-1 rounded-pill px-gs-3 py-gs-2 font-medium opacity-90 transition hover:bg-white/70 hover:text-primary motion-reduce:transition-none"
              aria-expanded={mega === item.id}
              aria-haspopup="true"
              aria-controls={`gift-mega-${item.id}`}
              onMouseEnter={() => scheduleMegaOpen(item.id)}
              onMouseLeave={scheduleMegaClose}
              onClick={(e) => onMegaTriggerClick(e, item.id)}
              onKeyDown={(e) => onMegaTriggerKey(e, item.id, `gift-mega-${item.id}`)}
            >
              {item.label}
              <ChevronDown
                className={`gift-nav-chevron h-4 w-4 transition motion-reduce:transition-none ${mega === item.id ? 'rotate-180' : ''}`}
              />
            </button>
          ),
        )}
        {overflowNavItems.length ? (
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-gs-1 rounded-pill px-gs-3 py-gs-2 font-medium opacity-90 transition hover:bg-white/70 hover:text-primary motion-reduce:transition-none"
            aria-expanded={mega === '__more'}
            aria-haspopup="true"
            aria-controls="gift-mega-more"
            onMouseEnter={() => scheduleMegaOpen('__more')}
            onMouseLeave={scheduleMegaClose}
            onClick={(e) => onMegaTriggerClick(e, '__more')}
            onKeyDown={(e) => onMegaTriggerKey(e, '__more', 'gift-mega-more')}
          >
            More
            <ChevronDown
              className={`gift-nav-chevron h-4 w-4 transition motion-reduce:transition-none ${mega === '__more' ? 'rotate-180' : ''}`}
            />
          </button>
        ) : null}
      </div>

      {/* Utilities */}
      <div className="flex shrink-0 items-center gap-gs-1 border-l border-border-subtle pl-gs-2 lg:pl-gs-3">
        {signedIn ? (
          <IconLink href="/wishlist" label="Wishlist" onClick={() => setMenuOpen(false)}>
            <Heart className="h-5 w-5" strokeWidth={1.75} />
          </IconLink>
        ) : null}

        <IconLink href="/cart" label="Cart" onClick={() => setMenuOpen(false)}>
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          {cartCount > 0 ? (
            <span className="absolute right-gs-1 top-gs-1 flex h-4 min-w-4 items-center justify-center rounded-pill bg-primary px-gs-1 text-caption font-semibold text-primary-foreground">
              {cartCount > 99 ? '99+' : cartCount}
            </span>
          ) : null}
        </IconLink>

        <div className="relative hidden lg:block" ref={profileRef}>
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
                      className="flex items-center gap-gs-2 rounded-control px-gs-3 py-gs-2 hover:bg-surface-soft"
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
                      className="flex items-center gap-gs-2 rounded-control px-gs-3 py-gs-2 hover:bg-surface-soft"
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
                      className="flex w-full items-center gap-gs-2 rounded-control px-gs-3 py-gs-2 text-left text-danger hover:bg-danger-bg"
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
            <Link href="/login?next=/" className="clay-btn !min-h-0 !px-gs-4 !py-gs-2 text-caption">
              Sign in
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`inline-flex h-10 w-10 items-center justify-center rounded-pill lg:hidden ${
            menuOpen ? '' : 'hover:bg-white/70 hover:text-primary'
          }`}
          aria-expanded={menuOpen}
          aria-controls="gift-mobile-menu"
          aria-haspopup="dialog"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={`gift-menu-toggle${menuOpen ? ' is-open' : ''}`} aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
      </div>

      {visibleNavItems
        .filter((item) => item.type === 'mega')
        .map((item) => (
          <MegaFlyout
            key={item.id}
            id={`gift-mega-${item.id}`}
            label={item.label}
            anchorRef={megaRef}
            open={mega === item.id}
            onMouseEnter={clearMegaTimers}
            onMouseLeave={scheduleMegaClose}
          >
            <MegaPanel
              groups={organizeGiftNav(item.links ?? [], []).shop}
              fallback={{ ...DEFAULT_SHOP_MEGA, ...item.mega }}
              onNavigate={() => setMega(null)}
            />
          </MegaFlyout>
        ))}
      {overflowNavItems.length ? (
        <MegaFlyout
          id="gift-mega-more"
          label="More"
          anchorRef={megaRef}
          open={mega === '__more'}
          onMouseEnter={clearMegaTimers}
          onMouseLeave={scheduleMegaClose}
        >
          <MorePanel items={overflowNavItems} onNavigate={() => setMega(null)} />
        </MegaFlyout>
      ) : null}
      <GiftMenuOverlay
        open={menuOpen}
        onClose={closeMenu}
        navItems={navItems}
        signedIn={signedIn}
        accountLabel={label}
        onSignOut={signOut}
      />
    </nav>
  );
}
