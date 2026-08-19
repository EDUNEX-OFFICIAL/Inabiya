import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchArticles, type PublicSpecialist } from '@/lib/articles';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<PublicSpecialist | null> {
  try {
    return await fetchArticles<PublicSpecialist>(`/blog/specialists/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const s = await load(params.slug);
  if (!s) return { title: 'Specialist' };
  return {
    title: s.name,
    description: s.bio ?? s.title ?? undefined,
  };
}

export default async function SpecialistPage({ params }: { params: { slug: string } }) {
  const s = await load(params.slug);
  if (!s) notFound();

  return (
    <main className="blog-page max-w-2xl">
      <Link href="/specialists" className="text-sm text-primary hover:underline">
        ← Specialists
      </Link>
      <p className="blog-overline mt-gs-4">Specialist</p>
      <h1 className="blog-h1 mt-gs-2">{s.name}</h1>
      {s.title ? <p className="blog-muted mt-gs-2 text-lg">{s.title}</p> : null}
      {s.credentials ? <p className="mt-gs-1 text-sm opacity-60">{s.credentials}</p> : null}
      {s.bio ? <p className="blog-body mt-gs-6 leading-relaxed">{s.bio}</p> : null}

      <section className="mt-gs-7">
        <h2 className="blog-h2">Articles</h2>
        <ul className="mt-gs-4 space-y-gs-3">
          {(s.articles ?? []).map((a) => (
            <li key={a.id}>
              <Link href={`/blog/${a.slug}`} className="blog-card block p-gs-4">
                <span className="font-medium text-foreground hover:text-primary">{a.title}</span>
                {a.seoDescription ? (
                  <p className="mt-gs-1 text-sm opacity-70">{a.seoDescription}</p>
                ) : null}
              </Link>
            </li>
          ))}
          {(s.articles ?? []).length === 0 ? (
            <li className="blog-card p-gs-5 text-sm opacity-70">No published articles yet.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
