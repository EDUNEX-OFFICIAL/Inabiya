import type { Metadata } from 'next';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { GiftStorefrontHero } from '@/components/cms/gift-storefront-hero';
import { JsonLdScript } from '@/components/seo/json-ld-script';
import { apiUrl } from '@/lib/api-base';
import { homepageLcpHref } from '@/lib/homepage-lcp';
import { GIFT_HOMEPAGE_SLUG, type SeoSchemaEntry } from '@inabiya/validation';
import { marketingPageMetadata, type CmsSeoPage } from '@/lib/cms-seo';
import { marketingPageMergedJsonLd } from '@/lib/seo-json-ld/cms-page';
import nextDynamic from 'next/dynamic';

const CategoryCarousel = nextDynamic(() =>
  import('@/components/gift/category-carousel').then((m) => ({ default: m.CategoryCarousel })),
);

export const dynamic = 'force-dynamic';

type CmsHomePage = CmsSeoPage & {
  id: string;
  seoSchemaExtras?: SeoSchemaEntry[] | null;
  blocks: Array<{
    id: string;
    type: string;
    sortOrder: number;
    props: Record<string, unknown>;
  }>;
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

/** Fallback if MarketingPage `home` is missing / unpublished. Footer comes from layout chrome. */
function LegacyGiftHomeFallback() {
  return (
    <main>
      <link
        rel="preload"
        as="image"
        href="/gift/media/baby-soft-gift.webp"
        fetchPriority="high"
      />
      <GiftStorefrontHero
        headline="Little bundles of joy, thoughtfully chosen."
        subcopy="Build a bespoke baby box in gentle steps — or pick a ready-made hamper. Packed with warmth, shipped across India."
        ctaLabel="Build Your Box"
        ctaHref="/build-your-box"
        ctaLabel2="Browse Hampers"
        ctaHref2="/collections/ready-hampers"
      />
      <CategoryCarousel />
      <div className="mx-auto w-full max-w-page px-[var(--gift-pad-x)] py-gs-7">
        <p className="gift-muted mb-gs-7">
          Homepage CMS is not published yet — showing a minimal fallback. Publish the{' '}
          <code className="text-caption">home</code> marketing page in admin.
        </p>
      </div>
    </main>
  );
}

export default async function GiftHomePage() {
  const page = await fetchHomepage();

  if (!page?.blocks?.length) {
    return <LegacyGiftHomeFallback />;
  }

  // Layout owns Soft Gift footer — skip CMS footer blocks on home to avoid double footer.
  const blocks = page.blocks.filter((b) => b.type !== 'footer');
  const lcp = homepageLcpHref(page.blocks);
  const ld = marketingPageMergedJsonLd(
    { ...page, slug: GIFT_HOMEPAGE_SLUG },
    page.blocks,
    page.seoSchemaExtras,
  );

  return (
    <main>
      {lcp ? <link rel="preload" as="image" href={lcp} fetchPriority="high" /> : null}
      <JsonLdScript data={ld} />
      <MarketingPageBlocks blocks={blocks} layout="home" emitFaqJsonLd={false} />
    </main>
  );
}
