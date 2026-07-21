import Link from 'next/link';
import { fetchArticles, type PublicArticleSummary } from '@/lib/articles';
import { NewsletterForm } from './newsletter-form';

export const dynamic = 'force-dynamic';

export default async function ArticlesIndexPage({
  searchParams,
}: {
  searchParams?: { category?: string; tag?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams?.category) params.set('category', searchParams.category);
  if (searchParams?.tag) params.set('tag', searchParams.tag);
  const q = params.toString() ? `?${params}` : '';

  let articles: PublicArticleSummary[] = [];
  try {
    articles = await fetchArticles<PublicArticleSummary[]>(`/articles${q}`);
  } catch {
    articles = [];
  }

  return (
    <main>
      <section className="relative overflow-hidden px-gs-4 pb-gs-7 pt-gs-8 sm:px-gs-6 sm:pb-gs-8 sm:pt-gs-8">
        <div
          className="absolute inset-0 bg-gradient-to-br from-[var(--inabiya-blush)] via-[var(--inabiya-soft)] to-[var(--inabiya-sky)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-3xl">
          <p className="gift-overline">
            Inabiya Journal
          </p>
          <h1 className="font-display mt-gs-3 text-4xl leading-tight sm:text-5xl md:text-6xl">
            Articles
          </h1>
          <p className="mt-gs-4 max-w-xl text-base opacity-80 sm:text-lg">
            Soft, trusted guidance for gifting and early parenthood.
          </p>
          <Link href="/gift" className="clay-btn-secondary mt-gs-6 inline-flex">
            Shop gifts
          </Link>
        </div>
      </section>

      <section className="gift-page max-w-3xl !pt-gs-6">
        <h2 className="gift-h2 sm:text-3xl">Latest</h2>
        <ul className="mt-gs-6 space-y-gs-4">
          {articles.map((a) => (
            <li key={a.id} className="clay-card p-gs-5 sm:p-gs-6">
              <Link href={`/articles/${a.slug}`} className="group block">
                <h3 className="font-display text-xl transition-colors group-hover:text-primary sm:text-2xl">
                  {a.title}
                </h3>
                {a.description ? (
                  <p className="mt-gs-2 text-sm opacity-75 sm:text-base">{a.description}</p>
                ) : null}
                <p className="mt-gs-3 text-xs opacity-60 sm:text-sm">
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}
                  {a.specialist ? ` · ${a.specialist.name}` : ''}
                  {a.category ? ` · ${a.category.name}` : ''}
                </p>
              </Link>
            </li>
          ))}
          {articles.length === 0 ? (
            <li className="clay-panel p-gs-6 text-sm opacity-70">No published articles yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="gift-page max-w-3xl !pt-gs-1">
        <div className="clay-panel p-gs-6 sm:p-gs-6">
          <h2 className="gift-h2">Stay in touch</h2>
          <p className="mt-gs-2 text-sm opacity-75">Occasional notes — no spam.</p>
          <div className="mt-gs-4">
            <NewsletterForm />
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
