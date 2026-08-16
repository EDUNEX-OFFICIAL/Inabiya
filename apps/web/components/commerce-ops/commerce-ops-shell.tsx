'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from 'react';
import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  FolderTree,
  Gift,
  Keyboard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquareQuote,
  Navigation,
  Package,
  PanelLeftClose,
  Percent,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  Upload,
  Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import {
  apiAuth,
  clearSession,
  getStoredAccessToken,
  getStoredUser,
  loginUrl,
  subscribeAuthChanged,
  type AuthUser,
} from '@/lib/auth-client';
import {
  buildOpsBreadcrumbs,
  canAccessCommerceOps,
  defaultOpsLanding,
  filterNavForRoles,
  groupNavBySection,
  isNavItemActive,
  type OpsNavItem,
} from '@/lib/commerce-ops-nav';

type Props = { children: ReactNode };

type LucideIcon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>;

const SIDEBAR_COLLAPSED_KEY = 'inabiya.ops.sidebarCollapsed';

const NAV_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  orders: ShoppingBag,
  products: Package,
  collections: FolderTree,
  inventory: Boxes,
  import: Upload,
  customers: Users,
  promotions: Percent,
  reports: BarChart3,
  reviews: MessageSquareQuote,
  returns: RotateCcw,
  support: LifeBuoy,
  inquiries: Gift,
  search: Search,
  settings: Settings,
  pages: FileText,
  'gift-chrome': Navigation,
};

function roleLabel(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'Super admin';
  if (roles.includes('COMMERCE_ADMIN')) return 'Commerce admin';
  if (roles.includes('SUPPORT')) return 'Support';
  if (roles.includes('FINANCE')) return 'Finance';
  if (roles.includes('CONTENT_ADMIN')) return 'Content admin';
  return roles[0] ?? '—';
}

function displayNameOf(user: AuthUser): string {
  const name = user.displayName?.trim();
  if (name) return name;
  const local = user.email.split('@')[0] ?? user.email;
  return local;
}

function initialsOf(user: AuthUser): string {
  const base = user.displayName?.trim() || user.email;
  const parts = base.split(/[\s._@-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return base.slice(0, 2).toUpperCase();
}

function signOutTo(portalPath: string) {
  clearSession();
  window.location.href = loginUrl(portalPath);
}

export function CommerceOpsShell({ children }: Props) {
  const pathname = usePathname() ?? '/admin/commerce';
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQ, setPaletteQ] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [chord, setChord] = useState<string | null>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
        setSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebarCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const refreshUser = useCallback(() => {
    const cached = getStoredUser();
    if (cached) setUser(cached);
  }, []);

  const signOut = useCallback(() => {
    signOutTo(pathname.startsWith('/admin/cms') ? '/admin/cms/pages' : pathname);
  }, [pathname]);

  useEffect(() => {
    refreshUser();
    return subscribeAuthChanged(refreshUser);
  }, [refreshUser]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(loginUrl(pathname));
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        setUser(u);
        setReady(true);
      })
      .catch(() => {
        clearSession();
        router.replace(loginUrl(pathname));
      });
  }, [pathname, router]);

  const navItems = useMemo(() => (user ? filterNavForRoles(user.roles) : []), [user]);
  const grouped = useMemo(() => groupNavBySection(navItems), [navItems]);
  const crumbs = useMemo(() => buildOpsBreadcrumbs(pathname), [pathname]);

  const allowedOnPath = useMemo(() => {
    if (!user || !canAccessCommerceOps(user.roles)) return false;
    if (user.roles.includes('SUPER_ADMIN') || user.roles.includes('COMMERCE_ADMIN')) {
      return true;
    }
    return navItems.some((item) => isNavItemActive(pathname, item) || pathname === item.href);
  }, [user, navItems, pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        setPaletteQ('');
        setHelpOpen(false);
        setAccountOpen(false);
        return;
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setMobileNav(false);
        setHelpOpen(false);
        setAccountOpen(false);
        setChord(null);
        return;
      }
      if (typing || paletteOpen || helpOpen) return;

      if (e.key === '[' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleSidebarCollapsed();
        return;
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQ('');
        setAccountOpen(false);
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen(true);
        setAccountOpen(false);
        return;
      }

      const key = e.key.toLowerCase();
      if (chord === 'g') {
        e.preventDefault();
        setChord(null);
        const fullMap: Record<string, string> = {
          d: '/admin/commerce',
          o: '/admin/commerce/orders',
          p: '/admin/commerce/products',
          i: '/admin/commerce/inventory',
          c: '/admin/commerce/customers',
          r: '/admin/commerce/reports',
          s: '/admin/commerce/settings',
          m: '/admin/commerce/import',
          w: '/admin/cms/pages',
        };
        const allowed = new Set(navItems.map((item) => item.href));
        const href = fullMap[key];
        if (href && allowed.has(href)) router.push(href);
        return;
      }
      if (key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setChord('g');
        window.setTimeout(() => setChord(null), 1200);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, helpOpen, chord, router, toggleSidebarCollapsed, navItems]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointer(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [accountOpen]);

  // App-shell: lock document scroll for the whole ops session (main pane scrolls instead)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('ops-shell-lock');
    return () => root.classList.remove('ops-shell-lock');
  }, []);

  // Extra lock while drawers/modals open (overscroll safety)
  useEffect(() => {
    const lock = mobileNav || paletteOpen || helpOpen;
    document.documentElement.classList.toggle('scroll-locked', lock);
    return () => document.documentElement.classList.remove('scroll-locked');
  }, [mobileNav, paletteOpen, helpOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNav(false);
    setAccountOpen(false);
  }, [pathname]);

  const paletteHits = useMemo(() => {
    const q = paletteQ.trim().toLowerCase();
    if (!q) return navItems;
    return navItems.filter(
      (i) => i.label.toLowerCase().includes(q) || i.href.toLowerCase().includes(q),
    );
  }, [navItems, paletteQ]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center px-4 text-sm opacity-70">
        Loading ops shell…
      </div>
    );
  }

  if (!canAccessCommerceOps(user.roles)) {
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-3 px-4 py-8">
        <h1 className="font-display text-2xl">No commerce access</h1>
        <p className="text-sm opacity-80">
          Your account does not have a Commerce Ops role (Commerce Admin, Content Admin, Support,
          Finance, or Super Admin).
        </p>
        <Link href="/" className="clay-btn-secondary w-fit text-sm">
          Back to storefront
        </Link>
      </div>
    );
  }

  if (!allowedOnPath) {
    const landing = defaultOpsLanding(user.roles);
    return (
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-3 px-4 py-8">
        <h1 className="font-display text-2xl">Not available for your role</h1>
        <p className="text-sm opacity-80">
          This area is outside your Commerce Ops permissions ({roleLabel(user.roles)}).
        </p>
        <Link href={landing} className="clay-btn w-fit text-sm">
          Go to your desk
        </Link>
      </div>
    );
  }

  const opsLanding = defaultOpsLanding(user.roles);

  function NavLinks({
    items,
    onNavigate,
    collapsed,
  }: {
    items: OpsNavItem[];
    onNavigate?: () => void;
    collapsed?: boolean;
  }) {
    return (
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          const Icon = NAV_ICONS[item.id] ?? Package;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={`ops-nav-link ${active ? 'ops-nav-link--active' : ''} ${
                  collapsed ? 'ops-nav-link--rail' : ''
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="ops-nav-link__active-bar" aria-hidden />
                <Icon className="ops-nav-link__icon" aria-hidden />
                <span className={`ops-nav-link__label ${collapsed ? 'sr-only' : ''}`}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  function SidebarBody({
    collapsed,
    onNavigate,
    showCollapseToggle,
  }: {
    collapsed: boolean;
    onNavigate?: () => void;
    showCollapseToggle?: boolean;
  }) {
    return (
      <nav className="flex h-full min-h-0 flex-col" aria-label="Commerce ops">
        <div
          className={`shrink-0 border-b border-[var(--border-subtle)] ${
            collapsed ? 'px-2 py-3' : 'px-3 py-3'
          }`}
        >
          <div className={`flex gap-2 ${collapsed ? 'flex-col items-center' : 'items-center'}`}>
            <Link
              href={opsLanding}
              className={`min-w-0 flex-1 ${collapsed ? 'flex justify-center' : ''}`}
              onClick={onNavigate}
              title={collapsed ? 'Inabiya Ops' : undefined}
            >
              {collapsed ? (
                <BrandLogo kind="mark" href={null} size="sm" label="Inabiya Ops" />
              ) : (
                <>
                  <BrandLogo href={null} size="sm" label="Inabiya Ops" />
                  <p className="ops-muted mt-0.5 text-[11px] uppercase tracking-wide">
                    Soft Gift commerce
                  </p>
                </>
              )}
            </Link>
            {showCollapseToggle ? (
              <button
                type="button"
                className="ops-sidebar-toggle"
                onClick={toggleSidebarCollapsed}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!collapsed}
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                ) : (
                  <PanelLeftClose className="h-4 w-4" aria-hidden />
                )}
              </button>
            ) : null}
          </div>
        </div>

        <div
          className={`ops-sidebar-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-3 ${
            collapsed ? 'px-1.5' : 'px-2'
          }`}
        >
          {grouped.map((g) => (
            <div key={g.section} className="mb-4">
              {!collapsed ? (
                <p className="ops-muted mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider">
                  {g.label}
                </p>
              ) : (
                <div
                  className="mx-auto mb-1.5 h-px w-6 bg-[color-mix(in_srgb,var(--foreground)_12%,transparent)]"
                  aria-hidden
                />
              )}
              <NavLinks items={g.items} onNavigate={onNavigate} collapsed={collapsed} />
            </div>
          ))}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'View storefront' : undefined}
            className={`ops-nav-link ops-nav-link--muted mt-1 ${collapsed ? 'ops-nav-link--rail' : ''}`}
            onClick={onNavigate}
          >
            <ExternalLink className="ops-nav-link__icon" aria-hidden />
            <span className={`ops-nav-link__label ${collapsed ? 'sr-only' : ''}`}>
              View storefront
            </span>
          </Link>
        </div>

        <div
          className={`shrink-0 border-t border-[var(--border-subtle)] bg-[var(--surface)] pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
            collapsed ? 'p-2' : 'p-3'
          }`}
        >
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-[11px] font-semibold text-[var(--primary)]"
                title={`${displayNameOf(user!)} · ${roleLabel(user!.roles)}`}
              >
                {initialsOf(user!)}
              </div>
              <button
                type="button"
                className="ops-sidebar-toggle"
                onClick={signOut}
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--foreground)_3%,var(--surface))] p-3">
              <p className="truncate text-sm font-medium leading-tight">{displayNameOf(user!)}</p>
              <p className="ops-muted mt-1 text-[11px]">{roleLabel(user!.roles)}</p>
              <button
                type="button"
                className="clay-btn-secondary mt-3 flex w-full min-h-10 items-center justify-center gap-1.5 text-sm"
                onClick={signOut}
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Sign out
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <div className="ops-shell flex h-[100dvh] max-h-[100dvh] overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <aside
        className={`ops-aside hidden h-full shrink-0 overflow-hidden border-r border-[var(--border-subtle)] bg-[var(--surface)] md:flex md:flex-col ${
          sidebarCollapsed ? 'ops-aside--collapsed' : 'ops-aside--expanded'
        }`}
      >
        <SidebarBody collapsed={sidebarCollapsed} showCollapseToggle />
      </aside>

      {mobileNav ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <aside className="ops-mobile-drawer absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] max-w-full flex-col overflow-hidden bg-[var(--surface)] shadow-lg pt-[env(safe-area-inset-top)]">
            <SidebarBody collapsed={false} onNavigate={() => setMobileNav(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 shrink-0 border-b border-[var(--border-subtle)] bg-[var(--surface)]/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              {/* Plain button — clay-btn-ghost forces display:inline-flex and breaks md:hidden */}
              <button
                type="button"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] md:!hidden"
                onClick={() => setMobileNav(true)}
                aria-label="Open navigation"
                aria-expanded={mobileNav}
              >
                <Menu className="h-4 w-4" aria-hidden />
              </button>

              <button
                type="button"
                className="ops-sidebar-toggle hidden shrink-0 md:inline-flex"
                onClick={toggleSidebarCollapsed}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-expanded={!sidebarCollapsed}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" aria-hidden />
                ) : (
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                )}
              </button>

              <nav
                aria-label="Breadcrumb"
                className="min-w-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <ol className="flex items-center gap-1 whitespace-nowrap text-sm">
                  {crumbs.map((c, i) => (
                    <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                      {i > 0 ? <span className="ops-muted">/</span> : null}
                      {c.href ? (
                        <Link
                          href={c.href}
                          className={`${i === 0 && crumbs.length > 1 ? 'ops-muted' : 'text-[var(--foreground)]'} hover:underline`}
                        >
                          {c.label}
                        </Link>
                      ) : (
                        <span className="max-w-[28vw] truncate font-medium sm:max-w-[14rem]">
                          {c.label}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <button
              type="button"
              className="inline-flex h-9 w-[min(22rem,52vw)] items-center gap-2 rounded-md border border-[var(--border-subtle)] px-3 text-xs hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)] sm:w-72"
              onClick={() => {
                setPaletteOpen(true);
                setPaletteQ('');
                setAccountOpen(false);
              }}
              aria-label="Jump to page"
            >
              <Search className="ops-muted h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="ops-muted min-w-0 flex-1 truncate text-left">Jump to…</span>
              <kbd className="ops-muted hidden shrink-0 rounded border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-medium sm:inline">
                ⌘K
              </kbd>
            </button>

            <div className="flex shrink-0 items-center justify-end">
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary)_18%,transparent)] text-[11px] font-semibold text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_25%,transparent)] transition hover:bg-[color-mix(in_srgb,var(--primary)_26%,transparent)]"
                  onClick={() => setAccountOpen((v) => !v)}
                  aria-label="Account menu"
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  {initialsOf(user)}
                </button>
                {accountOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg"
                  >
                    <div className="border-b border-[var(--border-subtle)] px-3 py-2.5">
                      <p className="truncate text-sm font-medium">{displayNameOf(user)}</p>
                      <p className="ops-muted mt-0.5 truncate text-[11px]">{user.email}</p>
                      <p className="ops-muted mt-1 text-[11px]">{roleLabel(user.roles)}</p>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm opacity-80 hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                      onClick={() => {
                        setAccountOpen(false);
                        setHelpOpen(true);
                      }}
                    >
                      <Keyboard className="h-3.5 w-3.5" aria-hidden />
                      Keyboard shortcuts
                    </button>
                    <Link
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2.5 text-sm opacity-80 hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]"
                      onClick={() => setAccountOpen(false)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      View storefront
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
                      onClick={signOut}
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden />
                      Sign out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <main className="ops-main-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-5">
          {children}
        </main>
      </div>

      {paletteOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-start sm:p-4 sm:pt-[12vh]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Jump to"
            className="flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface)] shadow-lg sm:rounded-lg"
          >
            <input
              autoFocus
              className="clay-input w-full shrink-0 rounded-none border-0 border-b border-[var(--border-subtle)]"
              placeholder="Jump to…"
              value={paletteQ}
              onChange={(e) => setPaletteQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && paletteHits[0]) {
                  setPaletteOpen(false);
                  router.push(paletteHits[0].href);
                }
              }}
            />
            <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1">
              {paletteHits.length === 0 ? (
                <li className="ops-muted px-3 py-2 text-sm">No matches</li>
              ) : (
                paletteHits.map((item) => {
                  const Icon = NAV_ICONS[item.id] ?? Package;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="ops-palette-item flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                        onClick={() => {
                          setPaletteOpen(false);
                          router.push(item.href);
                        }}
                      >
                        <Icon className="ops-muted h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        <span className="ops-muted shrink-0 text-[11px]">
                          {item.href.replace('/admin/commerce', '') || '/'}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <p className="ops-muted shrink-0 border-t border-[var(--border-subtle)] px-3 py-2 text-[11px] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
              Esc closes · Enter opens first · / jump · g then o/p/i… · ? help
              {chord === 'g' ? ' · waiting for chord…' : ''}
            </p>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10"
            aria-label="Dismiss"
            onClick={() => setPaletteOpen(false)}
          />
        </div>
      ) : null}

      {helpOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-start sm:p-4 sm:pt-[12vh]">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            className="w-full max-w-md rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface)] p-4 shadow-lg sm:rounded-lg"
          >
            <h2 className="font-display text-lg">Shortcuts</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              <li>
                <kbd className="rounded border px-1 text-xs">⌘/Ctrl+K</kbd> or{' '}
                <kbd className="rounded border px-1 text-xs">/</kbd> — jump palette
              </li>
              <li>
                <kbd className="rounded border px-1 text-xs">g</kbd> then{' '}
                <kbd className="rounded border px-1 text-xs">o</kbd> orders ·{' '}
                <kbd className="rounded border px-1 text-xs">p</kbd> products ·{' '}
                <kbd className="rounded border px-1 text-xs">i</kbd> inventory
              </li>
              <li>
                <kbd className="rounded border px-1 text-xs">g</kbd>
                <kbd className="rounded border px-1 text-xs">d</kbd> dashboard ·{' '}
                <kbd className="rounded border px-1 text-xs">c</kbd> customers ·{' '}
                <kbd className="rounded border px-1 text-xs">r</kbd> reports
              </li>
              <li>
                <kbd className="rounded border px-1 text-xs">g</kbd>
                <kbd className="rounded border px-1 text-xs">s</kbd> settings ·{' '}
                <kbd className="rounded border px-1 text-xs">m</kbd> import ·{' '}
                <kbd className="rounded border px-1 text-xs">w</kbd> pages ·{' '}
                <kbd className="rounded border px-1 text-xs">?</kbd> this help
              </li>
              <li>
                <kbd className="rounded border px-1 text-xs">[</kbd> — collapse / expand sidebar
              </li>
            </ul>
            <button
              type="button"
              className="clay-btn mt-4 text-sm"
              onClick={() => setHelpOpen(false)}
            >
              Close
            </button>
          </div>
          <button
            type="button"
            className="absolute inset-0 -z-10"
            aria-label="Dismiss"
            onClick={() => setHelpOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
