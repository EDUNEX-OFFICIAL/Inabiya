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
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await load(params.slug);
  if (!article) notFound();

  return (
    <main className="gift-page max-w-2xl">
      <article>
        <Link href="/articles" className="gift-link text-sm">
          ← Articles
        </Link>
        {article.category ? <p className="mt-gs-6 gift-overline">{article.category.name}</p> : null}
        <h1 className="gift-h1 mt-gs-3 ">{article.title}</h1>
        <p className="mt-gs-4 text-sm opacity-60">
          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ''}
          {article.specialist ? (
            <>
              {' · '}
              <Link
                href={`/specialists/${article.specialist.slug}`}
                className="underline hover:text-primary"
              >
                {article.specialist.name}
              </Link>
            </>
          ) : null}
          {article.authorName ? ` · ${article.authorName}` : ''}
          {` · ${article.viewCount} views`}
        </p>
        <div className="clay-panel mt-gs-6 p-gs-5 text-base sm:p-gs-6 sm:text-lg">
          <ArticleBody body={article.body} />
        </div>
        {article.tags.length > 0 ? (
          <ul className="mt-gs-6 flex flex-wrap gap-gs-2 text-sm">
            {article.tags.map((t) => (
              <li key={t.slug}>
                <Link href={`/articles?tag=${t.slug}`} className="clay-chip hover:text-primary">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-gs-7 flex flex-wrap gap-gs-3">
          <Link href="/gift/products" className="clay-btn">
            Shop gifts
          </Link>
          <Link href="/gift/box" className="clay-btn-secondary">
            Build Your Box
          </Link>
        </div>
      </article>
    </main>
  );
}
