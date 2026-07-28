import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchArticles, type PublicArticleDetail } from '@/lib/articles';
import { ArticleBody } from '@/components/editorial/article-body';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<PublicArticleDetail | null> {
  try {
    return await fetchArticles<PublicArticleDetail>(`/articles/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await load(params.slug);
  if (!article) return { title: 'Article' };
  return {
    title: article.seo.title,
    description: article.seo.description ?? undefined,
    alternates: { canonical: article.seo.canonicalPath },
    openGraph: {
      title: article.seo.title,
      description: article.seo.description ?? undefined,
      images: article.seo.ogImageUrl ? [article.seo.ogImageUrl] : undefined,
      type: 'article',
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await load(params.slug);
  if (!article) notFound();

  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <main className="blog-page max-w-3xl">
      <article>
        <Link href="/articles" className="text-sm text-primary hover:underline">
          ← Articles
        </Link>

        {article.category ? (
          <p className="mt-gs-6 blog-overline">{article.category.name}</p>
        ) : null}

        <h1 className="blog-h1 mt-gs-3 text-balance">{article.title}</h1>

        <p className="mt-gs-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm opacity-60">
          {publishedLabel ? <span>{publishedLabel}</span> : null}
          {article.specialist ? (
            <>
              <span aria-hidden>·</span>
              <Link
                href={`/specialists/${article.specialist.slug}`}
                className="underline hover:text-primary"
              >
                {article.specialist.name}
              </Link>
            </>
          ) : null}
          {article.authorName ? (
            <>
              <span aria-hidden>·</span>
              <span>{article.authorName}</span>
            </>
          ) : null}
        </p>

        {article.seo.ogImageUrl ? (
          <div className="relative mt-gs-6 aspect-[16/10] overflow-hidden rounded-clay border border-border-subtle bg-surface-soft">
            {/* eslint-disable-next-line @next/next/no-img-element -- editorial covers may be SVG */}
            <img
              src={article.seo.ogImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : null}

        <div className="blog-card blog-prose mt-gs-6 p-gs-5 sm:p-gs-7">
          <ArticleBody body={article.body} />
        </div>

        {article.tags.length > 0 ? (
          <ul className="mt-gs-6 flex flex-wrap gap-gs-2 text-sm">
            {article.tags.map((t) => (
              <li key={t.slug}>
                <Link href={`/articles?tag=${t.slug}`} className="blog-chip hover:text-primary">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <aside className="blog-card mt-gs-7 p-gs-5 sm:p-gs-6">
          <p className="blog-overline">Looking for a newborn gift?</p>
          <p className="blog-muted mt-gs-3 text-sm leading-relaxed sm:text-base">
            Soft, practical pieces for the first weeks — or build a box for someone living the
            newborn nights too.
          </p>
          <div className="mt-gs-5 flex flex-wrap gap-gs-3">
            <Link href="/gift/products?age=newborn" className="blog-btn">
              Shop newborn
            </Link>
            <Link href="/gift/build-your-box" className="blog-btn-secondary">
              Build Your Box
            </Link>
          </div>
        </aside>
      </article>
    </main>
  );
}
