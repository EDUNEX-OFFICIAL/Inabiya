'use client';

import { Suspense, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { BrandLogo } from '@/components/brand-logo';
import { GiftNav } from '@/components/gift-nav';
import { GiftChromeFooter } from '@/components/cms/gift-chrome-footer';
import { GiftFloatingActions } from '@/components/gift/gift-floating-actions';
import { GiftLenis } from '@/components/gift/gift-lenis';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

function CheckoutLockMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/**
 * Client chrome for Soft Gift: pathname-gated nav/footer + deferred Lenis.
 * Theme shell (`data-theme`) lives on the server layout parent.
 */
export function GiftLayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);
  const isInvoicePage = pathname.includes('/invoice');
  const isCheckoutPage = pathname === '/checkout';
  const showChrome = !isAuthPage && !isInvoicePage && !isCheckoutPage;

  return (
    <GiftLenis>
      {isAuthPage ? (
        <header className="py-gs-4">
          <div className="mx-auto max-w-md px-[var(--gift-pad-x)]">
            <BrandLogo href="/gift" size="md" priority />
          </div>
        </header>
      ) : isInvoicePage ? null : isCheckoutPage ? (
        <header className="clay-nav relative sticky top-0 z-[var(--z-nav)] py-gs-3 print:hidden">
          <div className="gift-shell-width flex min-w-0 items-center justify-between gap-gs-3">
            <BrandLogo kind="chrome" href="/gift" size="md" priority />
            <p className="flex items-center gap-gs-2 text-caption font-medium opacity-70">
              <CheckoutLockMark />
              Secure checkout
            </p>
          </div>
        </header>
      ) : (
        <header className="clay-nav relative sticky top-0 z-[var(--z-nav)] overflow-x-clip py-gs-3 sm:py-gs-4 print:hidden">
          <div className="gift-shell-width relative flex min-w-0 items-center justify-between gap-gs-3">
            <BrandLogo kind="chrome" href="/gift" className="relative z-10" size="md" priority />
            <Suspense
              fallback={<nav className="flex min-w-0 flex-1 justify-end" aria-label="Gift shop" />}
            >
              <GiftNav />
            </Suspense>
          </div>
        </header>
      )}
      <div className="flex-1">{children}</div>
      {showChrome ? <GiftChromeFooter /> : null}
      {showChrome ? <GiftFloatingActions /> : null}
    </GiftLenis>
  );
}
