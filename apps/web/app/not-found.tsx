import Link from 'next/link';

export default function NotFound() {
  return (
    <div data-theme="gift" className="clay-shell min-h-screen text-foreground">
      <header className="clay-nav px-gs-4 py-gs-4 sm:px-gs-6">
        <Link href="/gift" className="font-display text-lg text-primary">
          Inabiya
        </Link>
      </header>
      <main className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center overflow-hidden px-gs-4 py-gs-8 text-center sm:px-gs-6">
        <div className="gift-doodle pointer-events-none absolute inset-0 opacity-50" aria-hidden />
        <p className="gift-overline relative">404</p>
        <h1 className="gift-display relative mt-gs-3 text-primary">
          This gift got lost in the wrap
        </h1>
        <p className="relative mt-gs-4 max-w-md text-body opacity-80">
          The page you wanted isn’t here — maybe it toddled off. Let’s find something lovely
          instead.
        </p>
        <div className="relative mt-gs-7 flex flex-wrap justify-center gap-gs-3">
          <Link href="/gift" className="clay-btn">
            Soft Gift home
          </Link>
          <Link href="/gift/products" className="clay-btn-secondary">
            Browse gifts
          </Link>
        </div>
      </main>
    </div>
  );
}
