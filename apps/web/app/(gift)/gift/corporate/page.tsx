import Link from 'next/link';
import type { Metadata } from 'next';
import { MarketingPageBlocks, type CmsPageBlock } from '@/components/cms/marketing-page-blocks';
import { CorporateInquiryForm } from './corporate-inquiry-form';
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
  const ld = cms
    ? webPageJsonLd({ ...cms, slug: GIFT_CORPORATE_SLUG })
    : null;

  return (
    <main className="gift-page">
      {ld ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ) : null}
      {cms?.blocks?.length ? (
        <div className="mb-gs-6">
          <MarketingPageBlocks blocks={cms.blocks} layout="page" />
        </div>
      ) : (
        <div className="max-w-lg">
          <Link href="/gift" className="gift-link text-sm">
            ← Gift home
          </Link>
          <h1 className="gift-h1 mt-gs-4">Corporate & bulk gifting</h1>
          <p className="mt-gs-2 text-sm opacity-80">
            Share your needs — we will follow up with pricing. Inquiry form only.
          </p>
        </div>
      )}

      <div className="mx-auto max-w-lg">
        <CorporateInquiryForm />
      </div>
    </main>
  );
}
