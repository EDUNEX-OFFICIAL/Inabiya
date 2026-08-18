'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Hides marketplace chrome on `/creator/login` so auth shell is full-bleed. */
export function CreatorChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/creator/login';

  return (
    <>
      {isLogin ? null : (
        <header className="creator-nav px-gs-4 py-gs-4 sm:px-gs-6">
          <div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-gs-3">
            <Link href="/creator" className="font-display text-xl text-primary">
              Creator Collective
            </Link>
            <nav className="flex flex-wrap gap-gs-4 text-sm font-body" aria-label="Creator">
              <Link href="/creator/marketplace" className="opacity-80 hover:opacity-100">
                Marketplace
              </Link>
              <Link href="/creator/brand" className="opacity-80 hover:opacity-100">
                Brand
              </Link>
              <Link href="/creator/studio" className="opacity-80 hover:opacity-100">
                Creator studio
              </Link>
              <Link
                href="/creator/login"
                className="creator-btn-ghost !min-h-0 !px-gs-3 !py-gs-1 text-xs"
              >
                Sign in
              </Link>
            </nav>
          </div>
        </header>
      )}
      {children}
    </>
  );
}
