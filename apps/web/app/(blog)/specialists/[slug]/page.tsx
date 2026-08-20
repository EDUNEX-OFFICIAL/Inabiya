import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { fetchArticles, type PublicSpecialist } from '@/lib/articles';
import { BLOG_PATH } from '@/lib/blog-paths';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<PublicSpecialist | null> {
  try {
    return await fetchArticles<PublicSpecialist>(`/blog/specialists/${slug}`);
  } catch {
    return null;
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
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

  const articles = s.articles ?? [];
  const articleCount = articles.length;

  return (
    <main className="blog-page blog-page--specialist">
      <article className="blog-specialist">
        <nav className="blog-specialist__crumb" aria-label="Breadcrumb">
          <Link href={BLOG_PATH}>Journal</Link>
          <span className="blog-specialist__crumb-sep" aria-hidden>
            /
          </span>
          <Link href="/specialists">Specialists</Link>
        </nav>

        <header className="blog-specialist__hero">
          <span className="blog-specialist__avatar" aria-hidden>
            {initials(s.name)}
          </span>
          <div className="blog-specialist__intro">
            <p className="blog-specialist__kicker">Specialist</p>
            <h1 className="blog-specialist__name">{s.name}</h1>
            {s.title ? <p className="blog-specialist__title">{s.title}</p> : null}
            {s.credentials ? (
              <ul className="blog-specialist__creds">
                {s.credentials
                  .split(/[,|;]/)
                  .map((c) => c.trim())
                  .filter(Boolean)
                  .map((c) => (
                    <li key={c}>{c}</li>
                  ))}
              </ul>
            ) : null}
          </div>
        </header>

        {s.bio ? <p className="blog-specialist__bio">{s.bio}</p> : null}

        <section
          className="blog-specialist__articles"
          aria-labelledby="specialist-articles-heading"
        >
          <div className="blog-specialist__articles-head">
            <h2 id="specialist-articles-heading" className="blog-specialist__section-title">
              Articles
            </h2>
            {articleCount > 0 ? (
              <p className="blog-specialist__section-meta">
                {articleCount} {articleCount === 1 ? 'piece' : 'pieces'}
              </p>
            ) : null}
          </div>

          {articleCount > 0 ? (
            <ul className="blog-specialist__list">
              {articles.map((a) => {
                const date = a.publishedAt
                  ? new Date(a.publishedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : null;
                return (
                  <li key={a.id}>
                    <Link href={`/blog/${a.slug}`} className="blog-specialist__article">
                      <div className="blog-specialist__article-copy">
                        <h3 className="blog-specialist__article-title">{a.title}</h3>
                        {a.seoDescription ? (
                          <p className="blog-specialist__article-excerpt">{a.seoDescription}</p>
                        ) : null}
                        {date ? <p className="blog-specialist__article-meta">{date}</p> : null}
                      </div>
                      <ArrowRight
                        className="blog-specialist__article-arrow"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="blog-specialist__empty">No published articles yet.</p>
          )}
        </section>

        <aside className="blog-specialist__cta">
          <p className="blog-overline">More from the Journal</p>
          <p className="blog-specialist__cta-body">
            Parenting notes reviewed with care — sleep, newborn weeks, and gentle routines.
          </p>
          <Link href={BLOG_PATH} className="blog-btn">
            Browse Journal
          </Link>
        </aside>
      </article>
    </main>
  );
}
