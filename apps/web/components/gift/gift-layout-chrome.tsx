'use client';

import { Suspense, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GiftNav } from '@/components/gift-nav';
import { GiftChromeFooter } from '@/components/cms/gift-chrome-footer';
import { GiftFloatingActions } from '@/components/gift/gift-floating-actions';
import { GiftLenis } from '@/components/gift/gift-lenis';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

/**
 * Client chrome for Soft Gift: pathname-gated nav/footer + deferred Lenis.
 * Theme shell (`data-theme`) lives on the server layout parent.
 */
export function GiftLayoutChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);
  const isInvoicePage = pathname.includes('/invoice');
  const showChrome = !isAuthPage && !isInvoicePage;

  return (
    <GiftLenis>
      {isAuthPage ? (
        <header className="px-gs-4 py-gs-4 sm:px-gs-6">
          <div className="mx-auto max-w-md">
            <Link href="/gift" className="gift-h2 text-primary">
              Inabiya
            </Link>
          </div>
        </header>
      ) : isInvoicePage ? null : (
        <header className="clay-nav relative sticky top-0 z-30 overflow-x-clip px-gs-4 py-gs-3 sm:px-gs-6 sm:py-gs-4 print:hidden">
          <div className="relative mx-auto flex w-full min-w-0 items-center justify-between gap-gs-3">
            <Link href="/gift" className="gift-h2 relative z-10 shrink-0 text-primary">
              Inabiya
            </Link>
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
