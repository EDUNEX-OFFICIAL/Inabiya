import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { fetchPublishedCmsPage } from '@/lib/cms-marketing-page';
import { marketingPageMetadata } from '@/lib/cms-seo';
import { marketingPageMergedJsonLd } from '@/lib/seo-json-ld/cms-page';
import { GIFT_PRIVACY_SLUG } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

function PrivacyFallback() {
  return (
    <main className="gift-page max-w-3xl">
      <p className="gift-overline">Legal</p>
      <h1 className="gift-h1 mt-gs-2">Privacy policy</h1>
      <p className="mt-gs-4 text-body leading-relaxed opacity-90">
        We use account and order details to fulfil gifts and support you. For questions, email{' '}
        <a href="mailto:hello@inabiya.in" className="text-primary hover:underline">
          hello@inabiya.in
        </a>
        .
      </p>
      <p className="mt-gs-7 text-body opacity-70">
        <Link href="/contact" className="gift-link">
          Contact us
        </Link>
      </p>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublishedCmsPage(GIFT_PRIVACY_SLUG);
  if (!page) {
    return {
      title: 'Privacy policy | Inabiya',
      description: 'How Inabiya Soft Gift handles account and order information.',
    };
  }
  return marketingPageMetadata(page);
}

export default async function PrivacyPolicyPage() {
  const page = await fetchPublishedCmsPage(GIFT_PRIVACY_SLUG);
  if (!page?.blocks?.length) return <PrivacyFallback />;

  const ld = marketingPageMergedJsonLd(page, page.blocks, page.seoSchemaExtras);
  return (
    <main className="gift-page max-w-3xl">
      <JsonLdScript data={ld} />
      <MarketingPageBlocks blocks={page.blocks} emitFaqJsonLd={false} />
    </main>
  );
}
