'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { BlogMenuDrawer } from '@/components/blog/blog-menu-drawer';
import { BlogNavIcon } from '@/components/blog/blog-nav-icon';
import { BLOG_PUBLIC_NAV, isBlogNavActive } from '@/lib/blog-public-nav';
import { cn } from '@/lib/utils';

export function BlogNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div className="blog-shell-width relative flex min-w-0 items-center justify-between gap-gs-3">
        <BrandLogo
          kind="wordmark"
          href="/blog"
          size="md"
          className="relative z-10 max-w-[min(100%,11.5rem)] sm:max-w-none"
          label="Inabiya Journal"
        />

        <nav
          className="flex min-w-0 flex-1 items-center justify-end gap-gs-2 text-body"
          aria-label="Journal"
        >
          <div className="hidden items-center gap-gs-2 lg:flex">
            {BLOG_PUBLIC_NAV.filter((item) => !item.cta).map((item) => {
              const active = isBlogNavActive(pathname, item);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn('blog-nav__link', active && 'blog-nav__link--active')}
                  aria-current={active ? 'page' : undefined}
                >
                  <BlogNavIcon id={item.id} />
                  {item.label}
                </Link>
              );
            })}
            {BLOG_PUBLIC_NAV.filter((item) => item.cta).map((item) => (
              <Link key={item.id} href={item.href} className="blog-gift-store-cta">
                <BlogNavIcon id={item.id} />
                {item.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill lg:hidden ${
              menuOpen ? '' : 'hover:bg-surface-soft hover:text-primary'
            }`}
            aria-expanded={menuOpen}
            aria-controls="blog-mobile-menu"
            aria-haspopup="dialog"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`blog-menu-toggle${menuOpen ? ' is-open' : ''}`} aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
        </nav>
      </div>

      <BlogMenuDrawer open={menuOpen} onClose={closeMenu} pathname={pathname} />
    </>
  );
}
