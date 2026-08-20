'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { blogIndexPath } from '@/lib/blog-paths';

type Props = {
  currentSort: 'newest' | 'oldest';
  q?: string;
  category?: string;
  tag?: string;
};

export function BlogSortControl({ currentSort, q, category, tag }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="blog-sort-control" aria-label="Sort posts">
      <span className="blog-sort-control__label">Sort by</span>
      <div className="blog-sort-dropdown">
        <button
          type="button"
          className="blog-sort-dropdown__trigger"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{currentSort === 'oldest' ? 'Oldest' : 'Newest'}</span>
          <ChevronDown className={`h-4 w-4 transition ${open ? 'rotate-180' : ''}`} aria-hidden />
        </button>
        {open ? (
          <div className="blog-sort-dropdown__menu" role="menu" aria-label="Sort options">
            <Link
              role="menuitem"
              href={blogIndexPath({
                q: q || undefined,
                category: category || undefined,
                tag: tag || undefined,
                sort: 'newest',
              })}
              className="blog-sort-dropdown__item"
              onClick={() => setOpen(false)}
            >
              <span>Newest</span>
              {currentSort === 'newest' ? <Check className="h-4 w-4" aria-hidden /> : null}
            </Link>
            <Link
              role="menuitem"
              href={blogIndexPath({
                q: q || undefined,
                category: category || undefined,
                tag: tag || undefined,
                sort: 'oldest',
              })}
              className="blog-sort-dropdown__item"
              onClick={() => setOpen(false)}
            >
              <span>Oldest</span>
              {currentSort === 'oldest' ? <Check className="h-4 w-4" aria-hidden /> : null}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
