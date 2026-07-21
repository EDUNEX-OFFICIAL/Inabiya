import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchArticles, type PublicSpecialist } from '@/lib/articles';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<PublicSpecialist | null> {
  try {
    return await fetchArticles<PublicSpecialist>(`/articles/specialists/${slug}`);
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
    <main className="gift-page max-w-2xl">
      <Link href="/specialists" className="gift-link text-sm underline">
        ← Specialists
      </Link>
      <h1 className="gift-h1 mt-gs-6">{s.name}</h1>
      {s.title ? <p className="mt-gs-2 font-body text-lg opacity-80">{s.title}</p> : null}
      {s.credentials ? (
        <p className="mt-gs-1 text-sm opacity-60 font-body">{s.credentials}</p>
      ) : null}
      {s.bio ? <p className="mt-gs-6 font-body leading-relaxed opacity-90">{s.bio}</p> : null}

      <section className="mt-gs-7">
        <h2 className="gift-h2">Articles</h2>
        <ul className="mt-gs-4 space-y-gs-4">
          {(s.articles ?? []).map((a) => (
            <li key={a.id}>
              <Link href={`/articles/${a.slug}`} className="underline font-body">
                {a.title}
              </Link>
              {a.seoDescription ? (
                <p className="mt-gs-1 text-sm opacity-70">{a.seoDescription}</p>
              ) : null}
            </li>
          ))}
          {(s.articles ?? []).length === 0 ? (
            <li className="text-sm opacity-70">No published articles yet.</li>
          ) : null}
        </ul>
      </section>
    </main>
  );
}
