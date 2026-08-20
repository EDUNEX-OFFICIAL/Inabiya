import Link from 'next/link';
import { BlogCoverMedia } from '@/components/blog/blog-cover-media';
import { blogPostPath } from '@/lib/blog-paths';
import type { PublicArticleSummary } from '@/lib/articles';

type Variant = 'hero' | 'card';

type Props = {
  article: PublicArticleSummary;
  variant?: Variant;
  label?: string;
};

function ArticleBody({
  article: a,
  variant,
  label,
}: {
  article: PublicArticleSummary;
  variant: Variant;
  label?: string;
}) {
  const hero = variant === 'hero';
  const date = a.publishedAt
    ? new Date(a.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className={`blog-card__body ${hero ? 'blog-card__body--hero' : ''}`}>
      {label ? <p className="blog-card__label">{label}</p> : null}
      {a.category?.name ? <p className="blog-card__category">{a.category.name}</p> : null}
      <h3 className={`blog-card__title ${hero ? 'blog-card__title--hero' : ''}`}>{a.title}</h3>
      {a.description ? (
        <p className={`blog-card__excerpt ${hero ? 'blog-card__excerpt--hero' : ''}`}>
          {a.description}
        </p>
      ) : null}
      <p className="blog-card__meta">
        {date}
        {a.specialist ? (
          <>
            <span className="blog-card__meta-sep" aria-hidden>
              ·
            </span>
            {a.specialist.name}
          </>
        ) : null}
        <span className="blog-card__meta-sep" aria-hidden>
          ·
        </span>
        {Math.max(1, a.readTimeMinutes || 1)} min read
      </p>
    </div>
  );
}

export function BlogArticleCard({ article: a, variant = 'card', label }: Props) {
  const hero = variant === 'hero';
  const sizes = hero
    ? '(max-width: 1023px) 100vw, 55vw'
    : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw';

  return (
    <li
      className={`blog-card ${hero ? 'blog-card--hero' : 'blog-card--standard'}`}
      data-testid="article-card"
    >
      <Link href={blogPostPath(a.slug)} className="blog-card__link group">
        <BlogCoverMedia
          src={a.imageUrl}
          alt=""
          className={`blog-card__media ${hero ? 'blog-card__media--hero' : ''}`}
          sizes={sizes}
        />
        <ArticleBody article={a} variant={variant} label={label} />
      </Link>
    </li>
  );
}
