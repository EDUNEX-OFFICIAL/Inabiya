import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fetchArticles, type PublicSpecialist } from '@/lib/articles';
import { BLOG_PATH } from '@/lib/blog-paths';

export const dynamic = 'force-dynamic';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

export default async function SpecialistsIndexPage() {
  let specialists: PublicSpecialist[] = [];
  try {
    specialists = await fetchArticles<PublicSpecialist[]>('/blog/specialists');
  } catch {
    specialists = [];
  }

  return (
    <main className="blog-page blog-page--specialist">
      <div className="blog-specialists">
        <header className="blog-specialists__header">
          <p className="blog-specialists__kicker">Specialists</p>
          <h1 className="blog-specialists__title">Meet our specialists</h1>
          <p className="blog-specialists__dek">
            Clinicians and care experts who review Journal pieces for families.
          </p>
        </header>

        {specialists.length > 0 ? (
          <ul className="blog-specialists__grid">
            {specialists.map((s) => {
              return (
                <li key={s.id}>
                  <Link
                    href={`/specialists/${s.slug}`}
                    className="blog-specialists__card"
                    data-testid="specialist-profile"
                  >
                    <span
                      className="blog-specialist__avatar blog-specialist__avatar--md"
                      aria-hidden
                    >
                      {initials(s.name)}
                    </span>
                    <div className="blog-specialists__card-body">
                      <h2 className="blog-specialists__card-name">{s.name}</h2>
                      {s.title ? <p className="blog-specialists__card-title">{s.title}</p> : null}
                      {s.credentials ? (
                        <p className="blog-specialists__card-creds">{s.credentials}</p>
                      ) : null}
                      {s.bio ? <p className="blog-specialists__card-bio">{s.bio}</p> : null}
                      <p className="blog-specialists__card-meta">
                        View profile
                        <ArrowRight
                          className="blog-specialists__card-arrow"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="blog-specialist__empty">No specialists yet.</p>
        )}

        <p className="blog-specialists__back">
          <Link href={BLOG_PATH}>← Parenting journal</Link>
        </p>
      </div>
    </main>
  );
}
