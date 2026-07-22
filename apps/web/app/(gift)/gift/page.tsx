import type { Metadata } from 'next';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { GiftStorefrontHero } from '@/components/cms/gift-storefront-hero';
import { GiftStorefrontFooter } from '@/components/cms/gift-storefront-footer';
import { apiUrl } from '@/lib/api-base';
import { GIFT_HOMEPAGE_SLUG } from '@inabiya/validation';
import { marketingPageMetadata, webPageJsonLd, type CmsSeoPage } from '@/lib/cms-seo';

export const dynamic = 'force-dynamic';

type CmsHomePage = CmsSeoPage & {
  id: string;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Record<string, unknown>;
  }>;
};

type GiftChrome = {
  footer?: {
    brandName?: string;
    tagline?: string;
    columns?: Array<{ title: string; links: Array<{ label: string; href: string }> }>;
  };
};

async function fetchHomepage(): Promise<CmsHomePage | null> {
  try {
    const res = await fetch(apiUrl(`/cms/pages/${GIFT_HOMEPAGE_SLUG}`), {
      cache: 'no-store',
    });
    if (res.status === 404 || !res.ok) return null;
    return (await res.json()) as CmsHomePage;
  } catch {
    return null;
  }
}

async function fetchGiftChrome(): Promise<GiftChrome | null> {
  try {
    const res = await fetch(apiUrl('/catalog/gift-chrome'), { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as GiftChrome;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchHomepage();
  if (!page) {
    return {
      title: 'Inabiya Soft Gift',
      description: 'Thoughtfully personalised baby essentials & gifting.',
    };
  }
  return marketingPageMetadata({ ...page, slug: GIFT_HOMEPAGE_SLUG });
}

/** Fallback if MarketingPage `home` is missing / unpublished. */
function LegacyGiftHomeFallback({ chrome }: { chrome: GiftChrome | null }) {
  return (
    <main>
      <GiftStorefrontHero
        headline="Little bundles of joy, thoughtfully chosen."
        subcopy="Build a bespoke baby box in gentle steps — or pick a ready-made hamper. Packed with warmth, shipped across India."
        ctaLabel="Build Your Box"
        ctaHref="/gift/build-your-box"
        ctaLabel2="Browse Hampers"
        ctaHref2="/gift/products?hamper=1"
      />
      <div className="mx-auto max-w-5xl px-gs-4 py-gs-7 sm:px-gs-6">
        <p className="gift-muted mb-gs-7">
          Homepage CMS is not published yet — showing a minimal fallback. Publish the{' '}
          <code className="text-xs">home</code> marketing page in admin.
        </p>
      </div>
      <GiftStorefrontFooter {...(chrome?.footer ?? {})} />
    </main>
  );
}

export default async function GiftHomePage() {
  const [page, chrome] = await Promise.all([fetchHomepage(), fetchGiftChrome()]);

  if (!page?.blocks?.length) {
    return <LegacyGiftHomeFallback chrome={chrome} />;
  }

  const hasFooterBlock = page.blocks.some((b) => b.type === 'footer');
  const ld = webPageJsonLd({ ...page, slug: GIFT_HOMEPAGE_SLUG });

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <MarketingPageBlocks blocks={page.blocks} layout="home" />
      {!hasFooterBlock ? <GiftStorefrontFooter {...(chrome?.footer ?? {})} /> : null}
    </main>
  );
}
