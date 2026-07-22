import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { apiUrl } from '@/lib/api-base';
import { GIFT_CORPORATE_SLUG, GIFT_HOMEPAGE_SLUG } from '@inabiya/validation';
import { marketingPageMetadata, webPageJsonLd, type CmsSeoPage } from '@/lib/cms-seo';


export const dynamic = 'force-dynamic';

type MarketingPage = CmsSeoPage & {
  id: string;
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
  if (params.slug === GIFT_CORPORATE_SLUG) {
    return { title: 'Corporate & bulk gifting | Inabiya' };
  }
  const page = await fetchPage(params.slug);
  if (!page) return { title: 'Page not found', robots: { index: false } };
  return marketingPageMetadata(page);
}

export default async function MarketingPageView({ params }: { params: { slug: string } }) {
  if (params.slug === GIFT_HOMEPAGE_SLUG) {
    redirect('/gift');
  }
  if (params.slug === GIFT_CORPORATE_SLUG) {
    redirect('/gift/corporate');
  }

  const page = await fetchPage(params.slug);
  if (!page) notFound();


  const ld = webPageJsonLd(page);

  return (
    <main className="gift-page max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <MarketingPageBlocks blocks={page.blocks} />
    </main>
  );
}
