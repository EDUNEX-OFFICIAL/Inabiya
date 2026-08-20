'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import { BlogNavIcon } from '@/components/blog/blog-nav-icon';
import { BLOG_PUBLIC_NAV, isBlogNavActive } from '@/lib/blog-public-nav';
import { cn } from '@/lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  pathname: string;
};

export function BlogMenuDrawer({ open, onClose, pathname }: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);

  const navLinks = BLOG_PUBLIC_NAV.filter((item) => !item.cta);
  const ctaLinks = BLOG_PUBLIC_NAV.filter((item) => item.cta);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (mq.matches) onClose();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.classList.add('blog-menu-open');
    html.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      html.classList.remove('blog-menu-open');
      html.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div data-theme="blog" className="blog-drawer-portal">
      <div className="blog-drawer-root">
        <button
          type="button"
          className="blog-drawer-backdrop"
          aria-label="Close menu"
          onClick={onClose}
        />
        <aside
          className="blog-drawer"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id="blog-mobile-menu"
        >
          <div className="blog-drawer__header">
            <div>
              <p className="blog-drawer__overline">Inabiya</p>
              <p id={titleId} className="blog-drawer__title font-display">
                Blogs
              </p>
            </div>
            <button
              type="button"
              className="blog-drawer__close"
              aria-label="Close menu"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="blog-drawer__body">
            <nav aria-label="Blogs">
              <ul className="blog-drawer__list">
                {navLinks.map((item) => {
                  const active = isBlogNavActive(pathname, item);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn('blog-drawer__link', active && 'blog-drawer__link--active')}
                        aria-current={active ? 'page' : undefined}
                      >
                        <span className="blog-drawer__link-main">
                          <BlogNavIcon id={item.id} />
                          <span>{item.label}</span>
                        </span>
                        <ChevronRight className="blog-drawer__chevron" aria-hidden />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {ctaLinks.length > 0 ? (
            <div className="blog-drawer__footer">
              {ctaLinks.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={onClose}
                  className="blog-gift-store-cta blog-gift-store-cta--block"
                >
                  <BlogNavIcon id={item.id} />
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </div>,
    document.body,
  );
}
