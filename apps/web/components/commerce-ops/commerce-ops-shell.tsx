'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  apiAuth,
  clearSession,
  getStoredAccessToken,
  getStoredUser,
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

function roleChip(roles: string[]): string {
  if (roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
  if (roles.includes('COMMERCE_ADMIN')) return 'COMMERCE_ADMIN';
  if (roles.includes('SUPPORT')) return 'SUPPORT';
  if (roles.includes('FINANCE')) return 'FINANCE';
  return roles[0] ?? '—';
}

function roleChipShort(roles: string[]): string {
  const full = roleChip(roles);
  if (full === 'COMMERCE_ADMIN') return 'COMMERCE';
  if (full === 'SUPER_ADMIN') return 'SUPER';
  return full;
}

export function CommerceOpsShell({ children }: Props) {
  const pathname = usePathname() ?? '/admin/commerce';
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQ, setPaletteQ] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [chord, setChord] = useState<string | null>(null);

  const refreshUser = useCallback(() => {
    const cached = getStoredUser();
    if (cached) setUser(cached);
  }, []);

  useEffect(() => {
    refreshUser();
    return subscribeAuthChanged(refreshUser);
  }, [refreshUser]);

  useEffect(() => {
    if (!getStoredAccessToken()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    apiAuth<AuthUser>('/auth/me')
      .then((u) => {
        setUser(u);
        setReady(true);
      })
      .catch(() => {
        clearSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
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
        return;
      }
      if (e.key === 'Escape') {
        setPaletteOpen(false);
        setMobileNav(false);
        setHelpOpen(false);
        setChord(null);
        return;
      }
      if (typing || paletteOpen || helpOpen) return;

      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQ('');
        return;
      }
      if (e.key === '?' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      const key = e.key.toLowerCase();
      if (chord === 'g') {
        e.preventDefault();
        setChord(null);
        const map: Record<string, string> = {
          d: '/admin/commerce',
          o: '/admin/commerce/orders',
          p: '/admin/commerce/products',
          i: '/admin/commerce/inventory',
          c: '/admin/commerce/customers',
          r: '/admin/commerce/reports',
          s: '/admin/commerce/settings',
          m: '/admin/commerce/import',
        };
        if (map[key]) router.push(map[key]);
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
  }, [paletteOpen, helpOpen, chord, router]);

  // Lock body scroll when drawers open (mobile nav / command palette)
  useEffect(() => {
    const lock = mobileNav || paletteOpen;
    document.documentElement.classList.toggle('scroll-locked', lock);
    return () => document.documentElement.classList.remove('scroll-locked');
  }, [mobileNav, paletteOpen]);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNav(false);
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
          Your account does not have a Commerce Ops role (Commerce Admin, Support, Finance, or Super
          Admin).
        </p>
        <Link href="/gift" className="clay-btn-secondary w-fit text-sm">
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
          This area is outside your Commerce Ops permissions ({roleChip(user.roles)}).
        </p>
        <Link href={landing} className="clay-btn w-fit text-sm">
          Go to your desk
        </Link>
      </div>
    );
  }

  function NavLinks({ items, onNavigate }: { items: OpsNavItem[]; onNavigate?: () => void }) {
    return (
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isNavItemActive(pathname, item);
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={`block min-h-11 rounded-md px-2.5 py-2.5 text-sm transition-colors md:min-h-0 md:py-1.5 ${
                  active
                    ? 'bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] font-medium text-[var(--primary)]'
                    : 'text-[var(--foreground)]/80 hover:bg-[color-mix(in_srgb,var(--foreground)_5%,transparent)]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    );
  }

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="Commerce ops">
      <div className="flex items-start justify-between gap-2 border-b border-[var(--border-subtle)] px-3 py-3">
        <div className="min-w-0">
          <Link
            href="/admin/commerce"
            className="font-display text-lg leading-tight text-[var(--foreground)]"
            onClick={() => setMobileNav(false)}
          >
            Inabiya Ops
          </Link>
          <p className="mt-0.5 text-[11px] uppercase tracking-wide opacity-55">Soft Gift commerce</p>
        </div>
        <button
          type="button"
          className="clay-btn-ghost shrink-0 px-2 py-1 text-xs md:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {grouped.map((g) => (
          <div key={g.section} className="mb-4">
            <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider opacity-45">
              {g.label}
            </p>
            <NavLinks items={g.items} onNavigate={() => setMobileNav(false)} />
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--border-subtle)] px-3 py-3 text-xs opacity-70">
        <Link href="/gift" className="underline-offset-2 hover:underline">
          View storefront
        </Link>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <aside className="sticky top-0 hidden h-[100dvh] w-56 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--surface)] md:block lg:w-60">
        {sidebar}
      </aside>

      {mobileNav ? (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,88vw)] max-w-full flex-col bg-[var(--surface)] shadow-lg pt-[env(safe-area-inset-top)]">
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-[var(--surface)]/95 pt-[env(safe-area-inset-top)] backdrop-blur-sm">
          <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
            <button
              type="button"
              className="clay-btn-ghost shrink-0 px-2.5 py-2 text-sm md:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open navigation"
              aria-expanded={mobileNav}
            >
              Menu
            </button>

            <nav
              aria-label="Breadcrumb"
              className="min-w-0 flex-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              <ol className="flex items-center gap-1 whitespace-nowrap text-sm">
                {crumbs.map((c, i) => (
                  <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                    {i > 0 ? <span className="opacity-40">/</span> : null}
                    {c.href ? (
                      <Link href={c.href} className="opacity-70 hover:opacity-100 hover:underline">
                        {c.label}
                      </Link>
                    ) : (
                      <span className="max-w-[40vw] truncate font-medium sm:max-w-none">{c.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="clay-btn-ghost px-2 py-1.5 text-xs"
                onClick={() => {
                  setPaletteOpen(true);
                  setPaletteQ('');
                }}
                aria-label="Jump to page"
              >
                <span className="sm:hidden">Jump</span>
                <span className="hidden sm:inline">Jump ⌘K</span>
              </button>
              <button
                type="button"
                className="clay-btn-ghost px-2 py-1.5 text-xs"
                onClick={() => setHelpOpen(true)}
                aria-label="Keyboard shortcuts"
                title="Shortcuts (?)"
              >
                ?
              </button>
              <button
                type="button"
                className="clay-btn-ghost px-2 py-1.5 text-xs"
                onClick={() => {
                  clearSession();
                  window.location.href = '/login';
                }}
              >
                Out
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-subtle)]/70 px-3 py-1.5 sm:px-4">
            <span
              className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900"
              title="Payments adapter mode"
            >
              <span className="sm:hidden">Mock pay</span>
              <span className="hidden sm:inline">Payments: mock</span>
            </span>
            <span
              className="clay-chip max-w-[9rem] truncate text-[11px] sm:max-w-[14rem]"
              title={user.email}
            >
              <span className="sm:hidden">{roleChipShort(user.roles)}</span>
              <span className="hidden sm:inline">{roleChip(user.roles)}</span>
            </span>
            <span className="hidden truncate text-[11px] opacity-55 sm:inline max-w-[12rem]">
              {user.email}
            </span>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden px-3 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-5">
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
                <li className="px-3 py-2 text-sm opacity-60">No matches</li>
              ) : (
                paletteHits.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]"
                      onClick={() => {
                        setPaletteOpen(false);
                        router.push(item.href);
                      }}
                    >
                      <span>{item.label}</span>
                      <span className="shrink-0 text-[11px] opacity-45">
                        {item.href.replace('/admin/commerce', '') || '/'}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <p className="shrink-0 border-t border-[var(--border-subtle)] px-3 py-2 text-[11px] opacity-50 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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
                <kbd className="rounded border px-1 text-xs">?</kbd> this help
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
