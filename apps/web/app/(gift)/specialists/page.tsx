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
    <main className="gift-page max-w-2xl">
      <p className="gift-overline">Inabiya</p>
      <h1 className="gift-h1 mt-gs-2">Specialists</h1>
      <p className="gift-muted mt-gs-3 max-w-xl">
        Editorial experts who review and attribute guidance — not Creator Collective profiles.
      </p>
      <ul className="mt-gs-7 space-y-gs-6">
        {specialists.map((s) => (
          <li key={s.id}>
            <Link href={`/specialists/${s.slug}`} className="group block">
              <h2 className="gift-h2 group-hover:text-primary">{s.name}</h2>
              {s.title ? <p className="gift-muted mt-gs-1">{s.title}</p> : null}
            </Link>
          </li>
        ))}
        {specialists.length === 0 ? (
          <li className="gift-muted">No specialists yet.</li>
        ) : null}
      </ul>
      <p className="mt-gs-7 text-sm">
        <Link href="/articles" className="gift-link underline">
          ← Articles
        </Link>
      </p>
    </main>
  );
}
