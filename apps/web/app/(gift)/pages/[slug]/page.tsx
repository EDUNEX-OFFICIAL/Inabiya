import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import {
  GIFT_ABOUT_SLUG,
  GIFT_CONTACT_SLUG,
  GIFT_CORPORATE_SLUG,
  GIFT_HOMEPAGE_SLUG,
  GIFT_PRIVACY_SLUG,
} from '@inabiya/validation';
import { marketingPageMetadata } from '@/lib/cms-seo';
import { fetchPublishedCmsPage } from '@/lib/cms-marketing-page';
import { marketingPageMergedJsonLd } from '@/lib/seo-json-ld/cms-page';

export const dynamic = 'force-dynamic';

const DEDICATED_PATH: Record<string, string> = {
  [GIFT_HOMEPAGE_SLUG]: '/',
  [GIFT_CORPORATE_SLUG]: '/corporate',
  [GIFT_ABOUT_SLUG]: '/about',
  [GIFT_CONTACT_SLUG]: '/contact',
  [GIFT_PRIVACY_SLUG]: '/privacy-policy',
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const dedicated = DEDICATED_PATH[params.slug];
  if (dedicated) {
    return { title: 'Inabiya Soft Gift' };
  }
  const page = await fetchPublishedCmsPage(params.slug);
  if (!page) return { title: 'Page not found', robots: { index: false } };
  return marketingPageMetadata(page);
}

export default async function MarketingPageView({ params }: { params: { slug: string } }) {
  const dedicated = DEDICATED_PATH[params.slug];
  if (dedicated) redirect(dedicated);

  const page = await fetchPublishedCmsPage(params.slug);
  if (!page) notFound();

  const ld = marketingPageMergedJsonLd(page, page.blocks, page.seoSchemaExtras);

  return (
    <main className="gift-page max-w-3xl">
      <JsonLdScript data={ld} />
      <MarketingPageBlocks blocks={page.blocks} emitFaqJsonLd={false} />
    </main>
  );
}
