import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BlogCoverMedia } from '@/components/blog/blog-cover-media';
import { fetchArticles, type PublicArticleDetail } from '@/lib/articles';
import { ArticleBody } from '@/components/editorial/article-body';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { getSiteOrigin } from '@/lib/cms-seo';
import { BLOG_API, BLOG_PATH, blogIndexPath } from '@/lib/blog-paths';
import { articleJsonLd, breadcrumbJsonLd, mergeSeoJsonLdWithExtras } from '@/lib/seo-json-ld';

export const dynamic = 'force-dynamic';

async function load(slug: string): Promise<PublicArticleDetail | null> {
  try {
    return await fetchArticles<PublicArticleDetail>(`${BLOG_API}/${slug}`);
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

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const article = await load(params.slug);
  if (!article) notFound();

  const publishedLabel = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  const coverSrc = article.seo.ogImageUrl || article.imageUrl;
  const bylineName = article.specialist?.name ?? article.authorName;
  const readMins = Math.max(1, article.readTimeMinutes || 1);
  const dek = article.description?.trim() || article.seo.description?.trim() || null;

  const origin = getSiteOrigin();
  const canonicalPath = article.seo.canonicalPath.startsWith('/')
    ? article.seo.canonicalPath
    : `/${article.seo.canonicalPath}`;
  const ld = mergeSeoJsonLdWithExtras(
    [
      articleJsonLd({
        headline: article.seo.title,
        description: article.seo.description,
        slug: article.slug,
        canonicalPath,
        imageUrl: article.seo.ogImageUrl,
        datePublished: article.publishedAt,
        authorName: article.authorName ?? article.specialist?.name ?? null,
        siteOrigin: origin,
      }),
      breadcrumbJsonLd([
        { name: 'Journal', url: `${origin}${BLOG_PATH}` },
        ...(article.category
          ? [
              {
                name: article.category.name,
                url: `${origin}${blogIndexPath({ category: article.category.slug })}`,
              },
            ]
          : []),
        {
          name: article.seo.title,
          url: `${origin}${canonicalPath}`,
        },
      ]),
    ],
    article.seoSchemaExtras,
  );

  return (
    <main className="blog-page blog-page--article">
      <JsonLdScript data={ld} />
      <article className="blog-article">
        <header className="blog-article__header">
          <nav className="blog-article__crumb" aria-label="Breadcrumb">
            <Link href={BLOG_PATH}>Journal</Link>
            {article.category ? (
              <>
                <span className="blog-article__crumb-sep" aria-hidden>
                  /
                </span>
                <Link href={blogIndexPath({ category: article.category.slug })}>
                  {article.category.name}
                </Link>
              </>
            ) : null}
          </nav>

          <h1 className="blog-article__title">{article.title}</h1>

          {dek ? <p className="blog-article__dek">{dek}</p> : null}

          <div className="blog-article__byline">
            {bylineName ? (
              <div className="blog-article__author">
                <span className="blog-article__avatar" aria-hidden>
                  {initials(bylineName)}
                </span>
                <div className="blog-article__author-text">
                  {article.specialist ? (
                    <Link
                      href={`/specialists/${article.specialist.slug}`}
                      className="blog-article__author-name"
                    >
                      {article.specialist.name}
                    </Link>
                  ) : (
                    <span className="blog-article__author-name">{article.authorName}</span>
                  )}
                  {article.specialist && article.authorName ? (
                    <span className="blog-article__author-role">{article.authorName}</span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <ul className="blog-article__meta">
              {publishedLabel ? <li>{publishedLabel}</li> : null}
              <li>{readMins} min read</li>
            </ul>
          </div>
        </header>

        {coverSrc ? (
          <figure className="blog-article__cover">
            <BlogCoverMedia
              src={coverSrc}
              alt=""
              className="blog-article__cover-media"
              sizes="(max-width: 768px) 100vw, 48rem"
              priority
            />
          </figure>
        ) : null}

        <div className="blog-article__body blog-prose">
          <ArticleBody body={article.body} />
        </div>

        {article.tags.length > 0 ? (
          <ul className="blog-article__tags">
            {article.tags.map((t) => (
              <li key={t.slug}>
                <Link href={blogIndexPath({ tag: t.slug })} className="blog-chip">
                  {t.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        {article.specialist ? (
          <aside className="blog-article__specialist">
            <span className="blog-article__avatar blog-article__avatar--lg" aria-hidden>
              {initials(article.specialist.name)}
            </span>
            <div>
              <p className="blog-article__specialist-label">Reviewed by</p>
              <Link
                href={`/specialists/${article.specialist.slug}`}
                className="blog-article__specialist-name"
              >
                {article.specialist.name}
              </Link>
            </div>
          </aside>
        ) : null}

        <aside className="blog-article__cta">
          <p className="blog-overline">Looking for a newborn gift?</p>
          <p className="blog-article__cta-body">
            Soft, practical pieces for the first weeks — or build a box for someone living the
            newborn nights too.
          </p>
          <div className="blog-article__cta-actions">
            <Link href="/collections/newborn" className="blog-btn">
              Shop newborn
            </Link>
            <Link href="/build-your-box" className="blog-btn-secondary">
              Build Your Box
            </Link>
          </div>
        </aside>
      </article>
    </main>
  );
}
