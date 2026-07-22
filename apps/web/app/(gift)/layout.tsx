'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { GiftNav } from '@/components/gift-nav';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.has(pathname);

  return (
    <div data-theme="gift" className="clay-shell min-h-screen text-foreground">
      {isAuthPage ? (
        <header className="px-gs-4 py-gs-4 sm:px-gs-6">
          <div className="mx-auto max-w-md">
            <Link href="/gift" className="font-display text-lg tracking-tight text-primary">
              Inabiya
            </Link>
          </div>
        </header>
      ) : (
        <header className="clay-nav relative sticky top-0 z-30 px-gs-3 py-gs-3 sm:px-gs-6 sm:py-gs-4 md:px-gs-6">
          <div className="relative mx-auto flex max-w-5xl items-center justify-between gap-gs-3">
            <Link
              href="/gift"
              className="font-display shrink-0 text-lg tracking-tight text-primary"
            >
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
      {children}
    </div>
  );
}
