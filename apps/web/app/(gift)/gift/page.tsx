import Link from 'next/link';
import { MarketingPageBlocks } from '@/components/cms/marketing-page-blocks';
import { GiftStorefrontHero } from '@/components/cms/gift-storefront-hero';
import { apiUrl } from '@/lib/api-base';
import { GIFT_HOMEPAGE_SLUG } from '@inabiya/validation';

export const dynamic = 'force-dynamic';

type CmsHomePage = {
  id: string;
  slug: string;
  title: string;
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

function GiftHomeFooter() {
  return (
    <div className="gift-band gift-band--soft">
      <footer className="gift-band-inner grid gap-gs-6 border-t border-border-subtle pt-gs-7 text-sm opacity-80 sm:grid-cols-3">
        <div>
          <p className="font-display text-xl text-foreground">Inabiya</p>
          <p className="mt-gs-2 max-w-xs">
            Thoughtfully personalised baby essentials & gifting.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">Shop</p>
          <ul className="mt-gs-2 space-y-gs-2">
            <li>
              <Link href="/gift/box" className="hover:text-primary">
                Build Your Box
              </Link>
            </li>
            <li>
              <Link href="/gift/products?hamper=1" className="hover:text-primary">
                Ready-Made Hampers
              </Link>
            </li>
            <li>
              <Link href="/gift/products?age=newborn" className="hover:text-primary">
                Shop by Age
              </Link>
            </li>
            <li>
              <Link href="/gift/corporate" className="hover:text-primary">
                Corporate Gifting
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-foreground">Company</p>
          <ul className="mt-gs-2 space-y-gs-2">
            <li>
              <Link href="/articles" className="hover:text-primary">
                Parenting Blog
              </Link>
            </li>
            <li>
              <Link href="/specialists" className="hover:text-primary">
                Our Specialists
              </Link>
            </li>
            <li>
              <a href="mailto:hello@inabiya.in" className="hover:text-primary">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
}

/** Fallback if MarketingPage `home` is missing / unpublished. */
function LegacyGiftHomeFallback() {
  return (
    <main>
      <GiftStorefrontHero
        headline="Little bundles of joy, thoughtfully chosen."
        subcopy="Build a bespoke baby box in gentle steps — or pick a ready-made hamper. Packed with warmth, shipped across India."
        ctaLabel="Build Your Box"
        ctaHref="/gift/box"
        ctaLabel2="Browse Hampers"
        ctaHref2="/gift/products?hamper=1"
      />
      <div className="mx-auto max-w-5xl px-gs-4 py-gs-7 sm:px-gs-6">
        <p className="gift-muted mb-gs-7">
          Homepage CMS is not published yet — showing a minimal fallback. Publish the{' '}
          <code className="text-xs">home</code> marketing page in admin.
        </p>
      </div>
      <GiftHomeFooter />
    </main>
  );
}

export default async function GiftHomePage() {
  const page = await fetchHomepage();

  if (!page?.blocks?.length) {
    return <LegacyGiftHomeFallback />;
  }

  return (
    <main>
      <MarketingPageBlocks blocks={page.blocks} layout="home" />
      <GiftHomeFooter />
    </main>
  );
}
