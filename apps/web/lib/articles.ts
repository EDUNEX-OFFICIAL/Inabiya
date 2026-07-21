import { apiUrl } from './api-base';

export type PublicArticleSummary = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  publishedAt: string | null;
  viewCount: number;
  category: { slug: string; name: string } | null;
  specialist: { slug: string; name: string } | null;
  tags: Array<{ slug: string; name: string }>;
};

export type PublicArticleDetail = PublicArticleSummary & {
  body: string;
  seo: {
    title: string;
    description: string | null;
    canonicalPath: string;
    ogImageUrl: string | null;
  };
  authorName: string | null;
};

export type PublicSpecialist = {
  id: string;
  slug: string;
  name: string;
  title: string | null;
  bio: string | null;
  credentials: string | null;
  articles?: Array<{
    id: string;
    title: string;
    slug: string;
    seoDescription: string | null;
    publishedAt: string | null;
  }>;
};

export async function fetchArticles<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Articles fetch failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}
