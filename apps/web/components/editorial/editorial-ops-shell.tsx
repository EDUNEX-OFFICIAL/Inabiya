'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ComponentType,
  type ReactNode,
  type SVGProps,
  type TouchEvent,
} from 'react';
import {
  BookOpen,
  Ellipsis,
  FolderOpen,
  Inbox,
  LogOut,
  Newspaper,
  PenLine,
  Plus,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import {
  editorialDisplayName,
  editorialInitials,
  editorialRoleLabel,
} from '@/components/editorial/editorial-ui';
import {
  apiAuth,
  clearSession,
  getStoredAccessToken,
  loginUrl,
  type AuthUser,
} from '@/lib/auth-client';
import {
  canAccessEditorial,
  defaultEditorialLanding,
  filterEditorialNav,
  isEditorialNavActive,
  splitEditorialBottomNav,
  type EditorialNavItem,
} from '@/lib/editorial-nav';

type Props = { children: ReactNode };
type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const NAV_ICONS: Record<string, LucideIcon> = {
  queue: Inbox,
  new: Plus,
  writer: PenLine,
  categories: FolderOpen,
  specialists: Stethoscope,
  payments: Wallet,
  journal: Newspaper,
};

const SWIPE_CLOSE_PX = 80;

export function EditorialOpsShell({ children }: Props) {
  const pathname = usePathname() ?? '/admin/editorial';
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [dragY, setDragY] = useState(0);
  const accountRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const dragging = useRef(false);
  const dragYRef = useRef(0);

  useEffect(() => {
    setAccountOpen(false);
    setMoreOpen(false);
    setDragY(0);
  }, [pathname]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointer(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setAccountOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [accountOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMore();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl(pathname));
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        if (!canAccessEditorial(u.roles)) {
          throw new Error('Editorial role required');
        }
        setUser(u);
        if (pathname === '/admin/editorial' && defaultEditorialLanding(u.roles) !== pathname) {
          router.replace(defaultEditorialLanding(u.roles));
        }
      })
      .catch(() => router.replace(loginUrl(pathname)));
  }, [pathname, router]);

  function closeMore() {
    setMoreOpen(false);
    setDragY(0);
    dragYRef.current = 0;
    dragging.current = false;
  }

  function onSheetTouchStart(e: TouchEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-drawer-handle]')) return;
    dragging.current = true;
    startY.current = e.touches[0]?.clientY ?? 0;
    dragYRef.current = 0;
  }

  function onSheetTouchMove(e: TouchEvent) {
    if (!dragging.current) return;
    const y = e.touches[0]?.clientY ?? startY.current;
    const dy = Math.max(0, y - startY.current);
    dragYRef.current = dy;
    setDragY(dy);
  }

  function onSheetTouchEnd() {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragYRef.current > SWIPE_CLOSE_PX) {
      closeMore();
      return;
    }
    dragYRef.current = 0;
    setDragY(0);
  }

  if (!user) {
    return <div className="blog-page text-sm opacity-70">Loading editorial…</div>;
  }

  const nav = filterEditorialNav(user.roles);
  const { tabs, more, fab } = splitEditorialBottomNav(nav);
  const moreActive = more.some((item) => isEditorialNavActive(pathname, item));
  const tabSlots = tabs.length + (more.length ? 1 : 0);

  function signOut() {
    clearSession();
    window.location.href = loginUrl('/admin/editorial');
  }

  function NavIcon({ item }: { item: EditorialNavItem }) {
    const Icon = NAV_ICONS[item.id] ?? BookOpen;
    return <Icon className="editorial-nav-icon" strokeWidth={1.75} aria-hidden />;
  }

  return (
    <div className="blog-shell editorial-shell flex min-h-screen flex-col">
      <header className="blog-nav editorial-header sticky top-0">
        <div className="editorial-desk-bar">
          <BrandLogo kind="chrome" href="/admin/editorial" size="sm" label="Editorial" />

          <nav className="editorial-desk-nav" aria-label="Editorial">
            {nav.map((item) => {
              const active = isEditorialNavActive(pathname, item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`editorial-bar-link${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  title={item.label}
                >
                  <NavIcon item={item} />
                  <span className="editorial-bar-link__label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="relative ml-auto shrink-0" ref={accountRef}>
            <button
              type="button"
              className="editorial-avatar"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              aria-haspopup="menu"
              onClick={() => {
                closeMore();
                setAccountOpen((v) => !v);
              }}
            >
              {editorialInitials(user)}
            </button>
            {accountOpen ? (
              <div role="menu" className="editorial-account-menu">
                <div className="editorial-account-menu__meta">
                  <p className="truncate font-medium">{editorialDisplayName(user)}</p>
                  <p className="mt-gs-1 truncate text-xs opacity-60">{user.email}</p>
                  <p className="mt-gs-1 text-xs opacity-60">{editorialRoleLabel(user.roles)}</p>
                </div>
                <Link
                  href="/blog"
                  role="menuitem"
                  className="editorial-account-menu__item"
                  onClick={() => setAccountOpen(false)}
                >
                  <Newspaper className="h-4 w-4 shrink-0" aria-hidden />
                  Journal
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="editorial-account-menu__item editorial-account-menu__item--danger"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      {fab && !isEditorialNavActive(pathname, fab) ? (
        <Link href={fab.href} className="editorial-fab" aria-label={fab.label} title={fab.label}>
          <Plus className="h-6 w-6" strokeWidth={2} aria-hidden />
        </Link>
      ) : null}

      <nav
        className="editorial-tabbar"
        aria-label="Editorial"
        style={{ '--editorial-tabs': tabSlots } as CSSProperties}
        data-tabs={tabSlots}
      >
        {tabs.map((item) => {
          const active = isEditorialNavActive(pathname, item);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`editorial-tab${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              <NavIcon item={item} />
              <span className="editorial-tab__label">{item.label}</span>
            </Link>
          );
        })}
        {more.length ? (
          <button
            type="button"
            className={`editorial-tab editorial-tab--more${moreActive || moreOpen ? ' is-active' : ''}`}
            aria-label="More"
            aria-expanded={moreOpen}
            aria-controls="editorial-more-drawer"
            aria-haspopup="dialog"
            onClick={() => {
              setAccountOpen(false);
              setDragY(0);
              setMoreOpen((v) => !v);
            }}
          >
            <Ellipsis className="editorial-nav-icon" strokeWidth={1.75} aria-hidden />
            <span className="editorial-tab__label">More</span>
          </button>
        ) : null}
      </nav>

      <div
        className={`editorial-sheet-root lg:!hidden ${moreOpen ? 'is-open' : ''}`}
        aria-hidden={!moreOpen}
      >
        <button
          type="button"
          className="editorial-sheet-overlay"
          tabIndex={moreOpen ? 0 : -1}
          aria-label="Close"
          onClick={closeMore}
        />
        <div
          id="editorial-more-drawer"
          className="editorial-sheet"
          role="dialog"
          aria-modal={moreOpen}
          aria-label="More"
          style={
            moreOpen && dragY > 0
              ? { transform: `translateY(${dragY}px)`, transition: 'none' }
              : undefined
          }
          onTouchStart={onSheetTouchStart}
          onTouchMove={onSheetTouchMove}
          onTouchEnd={onSheetTouchEnd}
          onTouchCancel={onSheetTouchEnd}
        >
          <div className="editorial-sheet__handle" data-drawer-handle>
            <span />
          </div>
          <nav className="editorial-sheet__nav" aria-label="More">
            {more.map((item) => {
              const active = isEditorialNavActive(pathname, item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`editorial-sheet__item${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMore}
                >
                  <NavIcon item={item} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
