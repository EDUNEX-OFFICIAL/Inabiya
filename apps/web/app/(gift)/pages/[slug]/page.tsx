import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { apiUrl } from '@/lib/api-base';
import { GIFT_HOMEPAGE_SLUG } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

type MarketingPage = {
  id: string;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Record<string, unknown>;
  }>;
};

async function fetchPage(slug: string): Promise<MarketingPage | null> {
  try {
    const res = await fetch(apiUrl(`/cms/pages/${encodeURIComponent(slug)}`), {
      cache: 'no-store',
    });
    if (res.status === 404 || !res.ok) return null;
    return (await res.json()) as MarketingPage;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  if (params.slug === GIFT_HOMEPAGE_SLUG) {
    return { title: 'Inabiya Soft Gift' };
  }
  const page = await fetchPage(params.slug);
  if (!page) return { title: 'Page not found' };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription || undefined,
    openGraph: {
      title: page.seoTitle || page.title,
      description: page.seoDescription || undefined,
      type: 'website',
    },
  };
}

export default async function MarketingPageView({
  params,
}: {
  params: { slug: string };
}) {
  if (params.slug === GIFT_HOMEPAGE_SLUG) {
    redirect('/gift');
  }

  const page = await fetchPage(params.slug);
  if (!page) notFound();

  return (
    <main className="gift-page max-w-3xl">
      <MarketingPageBlocks blocks={page.blocks} />
    </main>
  );
}
