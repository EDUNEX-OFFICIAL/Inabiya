import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { fetchPublishedCmsPage } from '@/lib/cms-marketing-page';
import { marketingPageMetadata } from '@/lib/cms-seo';
import { marketingPageMergedJsonLd } from '@/lib/seo-json-ld/cms-page';
import { GIFT_ABOUT_SLUG } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

function AboutFallback() {
  return (
    <main className="gift-page max-w-3xl">
      <p className="gift-overline">Our story</p>
      <h1 className="gift-h1 mt-gs-2">Gifts that feel like a warm hug</h1>
      <p className="mt-gs-4 text-body leading-relaxed opacity-90">
        Inabiya is built for new parents and the people who love them — curated baby-safe brands,
        personalised keepsakes, and ready-made hampers that arrive with care.
      </p>
      <p className="mt-gs-4 text-body leading-relaxed opacity-90">
        We believe gifting should be gentle: fewer decisions, clearer choices, and boxes you would
        be proud to unwrap. From Build Your Box to corporate bulk orders, every path stays soft,
        thoughtful, and India-ready.
      </p>
      <div className="mt-gs-7 flex flex-wrap gap-gs-3">
        <Link href="/gift" className="clay-btn">
          Shop gifts
        </Link>
        <Link href="/contact" className="clay-btn-secondary">
          Contact us
        </Link>
      </div>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublishedCmsPage(GIFT_ABOUT_SLUG);
  if (!page) {
    return {
      title: 'About Inabiya',
      description: 'Thoughtfully personalised baby essentials and Soft Gift gifting across India.',
    };
  }
  return marketingPageMetadata(page);
}

export default async function AboutPage() {
  const page = await fetchPublishedCmsPage(GIFT_ABOUT_SLUG);
  if (!page?.blocks?.length) return <AboutFallback />;

  const ld = marketingPageMergedJsonLd(page, page.blocks, page.seoSchemaExtras);
  return (
    <main className="gift-page max-w-3xl">
      <JsonLdScript data={ld} />
      <MarketingPageBlocks blocks={page.blocks} emitFaqJsonLd={false} />
    </main>
  );
}
