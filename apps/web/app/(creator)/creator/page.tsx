import Link from 'next/link';

export default function CreatorHomePage() {
  return (
    <main>
      <section className="relative min-h-[70vh] flex flex-col justify-end px-8 pb-16 pt-24 bg-gradient-to-br from-[hsl(40_33%_98%)] via-[hsl(40_30%_94%)] to-[hsl(150_20%_92%)]">
        <p className="font-body text-sm uppercase tracking-[0.2em] text-[var(--secondary)]">
          Inabiya
        </p>
        <h1 className="font-display text-5xl md:text-6xl mt-3 max-w-3xl text-[var(--primary)]">
          Creator Collective
        </h1>
        <p className="mt-4 max-w-xl opacity-80 font-body text-lg">
          Brands brief campaigns. Creators reverse-bid. Deliver, approve, get paid.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/creator/marketplace"
            className="rounded bg-[var(--primary)] text-[var(--primary-foreground)] px-5 py-2.5 text-sm font-body"
          >
            Browse campaigns
          </Link>
          <Link
            href="/creator/brand"
            className="rounded border border-[var(--border)] px-5 py-2.5 text-sm font-body"
          >
            Brand dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
