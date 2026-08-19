import Link from 'next/link';
import { fetchArticles, type PublicArticleSummary } from '@/lib/articles';
import { BLOG_API, blogIndexPath, blogPostPath } from '@/lib/blog-paths';
import { NewsletterForm } from './newsletter-form';

export const dynamic = 'force-dynamic';

type Category = { slug: string; name: string };
type Tag = { slug: string; name: string };

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: { category?: string; tag?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams?.category) params.set('category', searchParams.category);
  if (searchParams?.tag) params.set('tag', searchParams.tag);
  const q = params.toString() ? `?${params}` : '';

  let articles: PublicArticleSummary[] = [];
  let categories: Category[] = [];
  let tags: Tag[] = [];
  try {
    const [list, cats, tagRows] = await Promise.all([
      fetchArticles<PublicArticleSummary[]>(`${BLOG_API}${q}`),
      fetchArticles<Category[]>(`${BLOG_API}/categories`),
      fetchArticles<Tag[]>(`${BLOG_API}/tags`).catch(() => [] as Tag[]),
    ]);
    articles = list;
    categories = cats;
    tags = tagRows;
  } catch {
    articles = [];
  }

  return (
    <main>
      <section className="blog-band">
        <div className="blog-band-inner max-w-3xl">
          <p className="blog-overline">Journal</p>
          <h1 className="blog-h1 mt-gs-3">Parenting journal</h1>
          {categories.length > 0 ? (
            <ul className="mt-gs-5 flex flex-wrap gap-gs-2">
              <li>
                <Link
                  href={blogIndexPath({ tag: searchParams?.tag })}
                  className={`blog-chip ${!searchParams?.category ? 'text-primary' : ''}`}
                >
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={blogIndexPath({ category: c.slug, tag: searchParams?.tag })}
                    className={`blog-chip ${searchParams?.category === c.slug ? 'text-primary' : ''}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {tags.length > 0 ? (
            <ul className="mt-gs-3 flex flex-wrap gap-gs-2">
              {tags.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={
                      searchParams?.tag === t.slug
                        ? blogIndexPath({ category: searchParams?.category })
                        : blogIndexPath({ category: searchParams?.category, tag: t.slug })
                    }
                    className={`blog-chip ${searchParams?.tag === t.slug ? 'text-primary' : ''}`}
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="blog-page max-w-3xl !pt-gs-6">
        <h2 className="blog-h2 sm:text-3xl">Latest</h2>
        <ul className="mt-gs-6 space-y-gs-4">
          {articles.map((a) => (
            <li key={a.id} className="blog-card overflow-hidden" data-testid="article-card">
              <Link
                href={blogPostPath(a.slug)}
                className="group block sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
              >
                <div className="relative aspect-[16/9] bg-surface sm:aspect-auto sm:min-h-[9rem]">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt=""
                      className={`absolute inset-0 h-full w-full ${
                        /\.svg(\?|#|$)/i.test(a.imageUrl) ? 'object-contain p-gs-3' : 'object-cover'
                      }`}
                    />
                  ) : (
                    <div className="blog-media-fallback absolute inset-0" />
                  )}
                </div>
                <div className="p-gs-5 sm:p-gs-6">
                  {a.category?.name ? (
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                      {a.category.name}
                    </p>
                  ) : null}
                  <h3 className="font-display mt-gs-2 text-xl transition-colors group-hover:text-primary sm:text-2xl">
                    {a.title}
                  </h3>
                  {a.description ? (
                    <p className="mt-gs-2 text-sm opacity-75 sm:text-base">{a.description}</p>
                  ) : null}
                  <p className="mt-gs-3 text-xs opacity-60 sm:text-sm">
                    {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}
                    {a.specialist ? ` · ${a.specialist.name}` : ''}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {articles.length === 0 ? (
            <li className="blog-card p-gs-6 text-sm opacity-70">No published articles yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="blog-page max-w-3xl !pt-gs-1">
        <div className="blog-card p-gs-6">
          <h2 className="blog-h2">Stay in touch</h2>
          <p className="mt-gs-2 text-sm opacity-75">Occasional notes — no spam.</p>
          <div className="mt-gs-4 max-w-md">
            <NewsletterForm compact hideTitle />
          </div>
          <p className="mt-gs-6 text-sm">
            <Link href="/specialists" className="text-primary hover:underline">
              Meet our specialists →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
