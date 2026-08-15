import type { Metadata } from 'next';
import Link from 'next/link';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { fetchPublishedCmsPage } from '@/lib/cms-marketing-page';
import { marketingPageMetadata } from '@/lib/cms-seo';
import { marketingPageMergedJsonLd } from '@/lib/seo-json-ld/cms-page';
import { GIFT_CONTACT_SLUG } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

function ContactFallback() {
  return (
    <main className="gift-page max-w-3xl">
      <p className="gift-overline">Hello</p>
      <h1 className="gift-h1 mt-gs-2">We’d love to hear from you</h1>
      <p className="mt-gs-4 max-w-prose text-body opacity-90">
        Questions about an order, personalisation, or corporate gifting? Pick the channel that feels
        easiest.
      </p>

      <ul className="mt-gs-7 space-y-gs-4">
        <li className="clay-panel p-gs-5">
          <p className="font-semibold text-foreground">Email</p>
          <a
            href="mailto:hello@inabiya.in"
            className="mt-gs-2 inline-block text-primary hover:underline"
          >
            hello@inabiya.in
          </a>
        </li>
        <li className="clay-panel p-gs-5">
          <p className="font-semibold text-foreground">WhatsApp</p>
          <a
            href="https://wa.me/919693940330"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-gs-2 inline-block text-primary hover:underline"
          >
            +91 96939 40330
          </a>
        </li>
        <li className="clay-panel p-gs-5">
          <p className="font-semibold text-foreground">Corporate gifting</p>
          <Link href="/gift/corporate" className="clay-btn-secondary mt-gs-3 inline-flex">
            Request a quote
          </Link>
        </li>
      </ul>

      <p className="mt-gs-7 text-body opacity-70">
        Prefer browsing first?{' '}
        <Link href="/gift" className="gift-link">
          Back to gifts
        </Link>
      </p>
    </main>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublishedCmsPage(GIFT_CONTACT_SLUG);
  if (!page) {
    return {
      title: 'Contact Inabiya',
      description: 'Reach Soft Gift support by email or WhatsApp.',
    };
  }
  return marketingPageMetadata(page);
}

export default async function ContactPage() {
  const page = await fetchPublishedCmsPage(GIFT_CONTACT_SLUG);
  if (!page?.blocks?.length) return <ContactFallback />;

  const ld = marketingPageMergedJsonLd(page, page.blocks, page.seoSchemaExtras);
  return (
    <main className="gift-page max-w-3xl">
      <JsonLdScript data={ld} />
      <MarketingPageBlocks blocks={page.blocks} emitFaqJsonLd={false} />
    </main>
  );
}
