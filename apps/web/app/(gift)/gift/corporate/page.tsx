import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPageBlocks, type CmsPageBlock } from '@/components/cms/marketing-page-blocks';
import { CorporateInquiryForm } from './corporate-inquiry-form';
import { CorporateHero } from './corporate-hero';
import { apiUrl } from '@/lib/api-base';
import { GIFT_CORPORATE_SLUG } from '@inabiya/validation';
import { marketingPageMetadata, webPageJsonLd, type CmsSeoPage } from '@/lib/cms-seo';

export const dynamic = 'force-dynamic';

type CmsPage = CmsSeoPage & {
  id: string;
  blocks: CmsPageBlock[];
};

async function fetchCorporatePage(): Promise<CmsPage | null> {
  try {
    const res = await fetch(apiUrl(`/cms/pages/${GIFT_CORPORATE_SLUG}`), {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as CmsPage;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchCorporatePage();
  if (!page) {
    return {
      title: 'Corporate & bulk gifting | Inabiya',
      description: 'Request a quote for Soft Gift corporate and bulk gifting.',
    };
  }
  return marketingPageMetadata({ ...page, slug: GIFT_CORPORATE_SLUG });
}

export default async function CorporateGiftingPage() {
  const cms = await fetchCorporatePage();
  const ld = cms ? webPageJsonLd({ ...cms, slug: GIFT_CORPORATE_SLUG }) : null;
  const blocks = (cms?.blocks ?? []).filter((b) => b.type !== 'footer');

  return (
    <main>
      {ld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ) : null}
      {blocks.length ? (
        <MarketingPageBlocks blocks={blocks} layout="home" />
      ) : (
        <CorporateHero />
      )}

      <section className="gift-band gift-band--soft" id="inquiry">
        <div className="gift-band-inner mx-auto max-w-lg">
          {!blocks.length ? (
            <div className="mb-gs-5">
              <Link href="/gift" className="gift-link text-body">
                ← Gift home
              </Link>
              <p className="gift-overline mt-gs-4">Quote</p>
              <h2 className="gift-h2 mt-gs-2">Tell us what you need</h2>
              <p className="gift-muted mt-gs-2">
                Share your needs — we will follow up with pricing.
              </p>
            </div>
          ) : (
            <div className="mb-gs-5">
              <p className="gift-overline">Quote</p>
              <h2 className="gift-h2 mt-gs-2">Request a corporate quote</h2>
            </div>
          )}
          <CorporateInquiryForm />
        </div>
      </section>
    </main>
  );
}
