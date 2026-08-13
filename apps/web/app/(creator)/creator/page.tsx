import Link from 'next/link';

export default function CreatorHomePage() {
  return (
    <main>
      <section className="creator-page flex min-h-[70vh] flex-col justify-end !pb-gs-8 !pt-gs-8">
        <p className="creator-overline">Inabiya</p>
        <h1 className="creator-display mt-gs-3 max-w-3xl text-primary">Creator Collective</h1>
        <p className="creator-body mt-gs-4 max-w-xl text-lg">
          Brands brief campaigns. Creators reverse-bid. Deliver, approve, get paid.
        </p>
        <div className="mt-gs-6 flex flex-wrap gap-gs-3">
          <Link
            href="/creator/marketplace"
            className="creator-btn"
            data-testid="browse-campaigns-btn"
          >
            Browse campaigns
          </Link>
          <Link href="/creator/brand" className="creator-btn-ghost">
            Brand dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
