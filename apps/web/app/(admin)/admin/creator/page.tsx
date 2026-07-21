import Link from 'next/link';

export default function CreatorAdminPage() {
  return (
    <main className="min-h-screen p-8 bg-[var(--background)] text-[var(--foreground)]">
      <h1 className="font-display text-3xl text-[var(--primary)]">Creator Admin</h1>
      <p className="mt-2 opacity-80 font-body">
        Dense ops shell — use public Creator Collective dashboards for the Phase 8 demo path.
      </p>
      <ul className="mt-6 space-y-2 text-sm font-body">
        <li>
          <Link className="underline" href="/creator/marketplace">
            Marketplace
          </Link>
        </li>
        <li>
          <Link className="underline" href="/creator/brand">
            Brand dashboard
          </Link>
        </li>
        <li>
          <Link className="underline" href="/creator/studio">
            Creator studio
          </Link>
        </li>
      </ul>
    </main>
  );
}
