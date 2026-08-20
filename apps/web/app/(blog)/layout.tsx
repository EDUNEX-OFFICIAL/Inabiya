import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { BlogFooter } from '@/components/blog/blog-footer';
import { BlogNav } from '@/components/blog/blog-nav';
import { ConsentDefault } from '@/components/consent-default';
import { CookieBanner } from '@/components/cookie-banner';
import { GoogleTags } from '@/components/google-tags';
import { MetaPixel } from '@/components/meta-pixel';
import { ThemeFontShell } from '@/components/theme-font-shell';
import { CONSENT_COOKIE, parseConsentValue } from '@/lib/consent';
import { fetchStorefrontTracking } from '@/lib/storefront-tracking';

export async function generateMetadata(): Promise<Metadata> {
  const tracking = await fetchStorefrontTracking();
  if (!tracking.googleSiteVerification) return {};
  return { verification: { google: tracking.googleSiteVerification } };
}

export default async function BlogLayout({ children }: { children: React.ReactNode }) {
  const tracking = await fetchStorefrontTracking();
  const consent = parseConsentValue(cookies().get(CONSENT_COOKIE)?.value);
  return (
    <ThemeFontShell theme="blog" className="blog-shell flex min-h-screen flex-col text-foreground">
      <ConsentDefault choice={consent} />
      <GoogleTags tracking={tracking} enabled initialConsent={consent} />
      <MetaPixel pixelId={tracking.metaPixelId} enabled initialConsent={consent} />
      <header className="clay-nav sticky top-0 z-[var(--z-nav)] overflow-x-clip py-gs-3 sm:py-gs-4 print:hidden">
        <BlogNav />
      </header>
      <div className="flex-1">{children}</div>
      <BlogFooter />
      <CookieBanner enabled initialConsent={consent} theme="blog" />
    </ThemeFontShell>
  );
}
