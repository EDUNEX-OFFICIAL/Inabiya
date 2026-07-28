import Link from 'next/link';

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="blog" className="blog-shell flex min-h-screen flex-col text-foreground">
      <header className="blog-nav sticky top-0 z-[var(--z-nav)] px-gs-4 py-gs-3 sm:px-gs-6">
        <div className="mx-auto flex w-full max-w-page items-center justify-between gap-gs-3">
          <Link href="/articles" className="font-display text-lg tracking-tight text-foreground">
            Inabiya Journal
          </Link>
          <nav className="flex flex-wrap items-center gap-gs-4 text-sm font-body" aria-label="Journal">
            <Link href="/articles" className="opacity-80 hover:text-primary hover:opacity-100">
              Articles
            </Link>
            <Link href="/specialists" className="opacity-80 hover:text-primary hover:opacity-100">
              Specialists
            </Link>
            <Link href="/gift" className="blog-btn-ghost !min-h-0 !px-gs-3 !py-gs-1 text-xs">
              Shop gifts
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
