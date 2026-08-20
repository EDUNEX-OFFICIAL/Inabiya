import Link from 'next/link';
import { BlogArticleCard } from '@/components/blog/blog-article-card';
import { BlogCoverMedia } from '@/components/blog/blog-cover-media';
import { BlogSearch } from '@/components/blog/blog-search';
import { BlogSortControl } from '@/components/blog/blog-sort-control';
import { fetchArticles, type PublicArticleSummary } from '@/lib/articles';
import { BLOG_API, blogIndexPath } from '@/lib/blog-paths';
import { NewsletterForm } from './newsletter-form';

export const dynamic = 'force-dynamic';

type Category = { slug: string; name: string };

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams?: { category?: string; tag?: string; q?: string; sort?: 'newest' | 'oldest' };
}) {
  const params = new URLSearchParams();
  if (searchParams?.category) params.set('category', searchParams.category);
  if (searchParams?.tag) params.set('tag', searchParams.tag);
  if (searchParams?.q?.trim()) params.set('q', searchParams.q.trim());
  const q = params.toString() ? `?${params}` : '';

  let articles: PublicArticleSummary[] = [];
  let categories: Category[] = [];
  try {
    const [list, cats] = await Promise.all([
      fetchArticles<PublicArticleSummary[]>(`${BLOG_API}${q}`),
      fetchArticles<Category[]>(`${BLOG_API}/categories`),
    ]);
    articles = list;
    categories = cats;
  } catch {
    articles = [];
  }

  const searchQuery = searchParams?.q?.trim() ?? '';
  const hasFilters = Boolean(searchParams?.category || searchParams?.tag);
  const sort = searchParams?.sort === 'oldest' ? 'oldest' : 'newest';
  const sortedArticles = [...articles].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return sort === 'oldest' ? ta - tb : tb - ta;
  });
  const [featured, ...rest] = sortedArticles;
  const showFeatured = !searchQuery && !hasFilters && sort === 'newest' && featured;
  const featuredDate = featured?.publishedAt
    ? new Date(featured.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const featuredAuthor = featured?.specialist?.name ?? 'Inabiya Editorial';

  return (
    <main>
      {showFeatured ? (
        <section className="blog-home-hero-wrap">
          <div className="blog-home-hero">
            <BlogCoverMedia
              src={featured.imageUrl}
              alt={featured.title}
              className="blog-home-hero__media"
              sizes="100vw"
              priority
            />
            <div className="blog-home-hero__overlay" />
            <div className="blog-home-hero__content">
              <div className="blog-home-hero__bottom">
                <div className="blog-home-hero__left">
                  <div className="blog-home-hero__meta">
                    <span className="blog-overline">Journal</span>
                    <span className="blog-home-hero__latest">Latest</span>
                  </div>
                  {featured.category?.name ? (
                    <p className="blog-card__category mt-gs-3">{featured.category.name}</p>
                  ) : null}
                  <h1 className="blog-home-hero__title mt-gs-2">{featured.title}</h1>
                  {featured.description ? (
                    <p className="blog-home-hero__desc mt-gs-2">{featured.description}</p>
                  ) : null}
                </div>

                <div className="blog-home-hero__right">
                  <div className="blog-home-hero__author">
                    <span className="blog-home-hero__author-avatar" aria-hidden>
                      {featuredAuthor.charAt(0).toUpperCase()}
                    </span>
                    <span>{featuredAuthor}</span>
                  </div>
                  <p className="blog-home-hero__byline">
                    {featuredDate}
                    <span aria-hidden> · </span>
                    {Math.max(1, featured.readTimeMinutes || 1)} min read
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="blog-band">
          <div className="blog-band-inner">
            <p className="blog-overline">Journal</p>
            <h1 className="blog-h1 mt-gs-3">Parenting journal</h1>
          </div>
        </section>
      )}

      <section className="blog-page !pt-gs-5">
        <h2 className="blog-h2 sm:text-3xl">
          {searchQuery ? `Results for “${searchQuery}”` : 'Blog'}
        </h2>
        <div className="blog-browse-row mt-gs-4" aria-label="Browse journal">
          <BlogSearch
            defaultQuery={searchQuery}
            defaultExpanded
            className="blog-browse-row__search max-w-none"
          />
        </div>

        <div className="blog-feed-tools mt-gs-4">
          {categories.length > 0 ? (
            <div className="blog-filters">
              <ul className="blog-filters__track">
                <li>
                  <Link
                    href={blogIndexPath({
                      q: searchQuery || undefined,
                      sort,
                    })}
                    className={`blog-chip ${!searchParams?.category ? 'blog-chip--active' : ''}`}
                  >
                    All
                  </Link>
                </li>
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={blogIndexPath({
                        category: c.slug,
                        tag: searchParams?.tag,
                        q: searchQuery || undefined,
                        sort,
                      })}
                      className={`blog-chip ${searchParams?.category === c.slug ? 'blog-chip--active' : ''}`}
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div />
          )}

          <BlogSortControl
            currentSort={sort}
            q={searchQuery}
            category={searchParams?.category}
            tag={searchParams?.tag}
          />
        </div>
      </section>

      <section className="blog-page blog-page--wide !pt-gs-6">
        <ul className="blog-feed-grid">
          {sortedArticles.map((a) => (
            <BlogArticleCard key={a.id} article={a} />
          ))}
          {sortedArticles.length === 0 ? (
            <li className="blog-card blog-feed-empty p-gs-6 text-sm opacity-70">
              {searchQuery ? `No articles match “${searchQuery}”.` : 'No published articles yet.'}
            </li>
          ) : null}
        </ul>
      </section>

      <section className="blog-page !pt-gs-4">
        <div className="blog-card blog-cta-panel p-gs-6 sm:p-gs-7">
          <div className="grid gap-gs-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-center">
            <div>
              <h2 className="blog-h2">Stay in touch</h2>
              <p className="mt-gs-2 text-sm opacity-75">Occasional notes — no spam.</p>
              <p className="mt-gs-6 text-sm">
                <Link href="/specialists" className="text-primary hover:underline">
                  Meet our specialists →
                </Link>
              </p>
            </div>
            <NewsletterForm compact hideTitle />
          </div>
        </div>
      </section>
    </main>
  );
}
