import Link from 'next/link';
import { fetchArticles, type PublicSpecialist } from '@/lib/articles';

export const dynamic = 'force-dynamic';

export default async function SpecialistsIndexPage() {
  let specialists: PublicSpecialist[] = [];
  try {
    specialists = await fetchArticles<PublicSpecialist[]>('/articles/specialists');
  } catch {
    specialists = [];
  }

  return (
    <main className="blog-page max-w-2xl">
      <p className="blog-overline">Specialists</p>
      <h1 className="blog-h1 mt-gs-2">Meet our specialists</h1>
      <p className="blog-muted mt-gs-3 max-w-xl">
        Editorial experts who review and attribute guidance — not Creator Collective profiles.
      </p>
      <ul className="mt-gs-7 space-y-gs-4">
        {specialists.map((s) => (
          <li key={s.id}>
            <Link
              href={`/specialists/${s.slug}`}
              className="blog-card group block p-gs-5"
              data-testid="specialist-profile"
            >
              <h2 className="blog-h2 text-xl group-hover:text-primary sm:text-2xl">{s.name}</h2>
              {s.title ? <p className="blog-muted mt-gs-1">{s.title}</p> : null}
              <p className="mt-gs-3 text-sm font-medium text-primary opacity-90">View profile →</p>
            </Link>
          </li>
        ))}
        {specialists.length === 0 ? (
          <li className="blog-card p-gs-6 text-sm opacity-70">No specialists yet.</li>
        ) : null}
      </ul>
      <p className="mt-gs-7 text-sm">
        <Link href="/articles" className="text-primary hover:underline">
          ← Parenting journal
        </Link>
      </p>
    </main>
  );
}
