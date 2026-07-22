import Link from 'next/link';

export default function CreatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-theme="creator"
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
    >
      <header className="border-b border-[var(--border)] px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <Link href="/creator" className="font-display text-xl text-[var(--primary)]">
          Creator Collective
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm font-body">
          <Link href="/creator/marketplace" className="opacity-80 hover:opacity-100">
            Marketplace
          </Link>
          <Link href="/creator/brand" className="opacity-80 hover:opacity-100">
            Brand
          </Link>
          <Link href="/creator/studio" className="opacity-80 hover:opacity-100">
            Creator studio
          </Link>
          <Link href="/login" className="opacity-80 hover:opacity-100">
            Sign in
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
