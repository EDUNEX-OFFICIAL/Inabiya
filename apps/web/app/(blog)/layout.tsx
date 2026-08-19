import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand-logo';
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
      <header className="blog-nav sticky top-0 z-[var(--z-nav)] px-gs-4 py-gs-3 sm:px-gs-6">
        <div className="mx-auto flex w-full max-w-page items-center justify-between gap-gs-3">
          <BrandLogo kind="chrome" href="/blog" size="sm" label="Inabiya Journal" />
          <nav
            className="flex flex-wrap items-center gap-gs-4 text-sm font-body"
            aria-label="Journal"
          >
            <Link href="/blog" className="opacity-80 hover:text-primary hover:opacity-100">
              Journal
            </Link>
            <Link href="/specialists" className="opacity-80 hover:text-primary hover:opacity-100">
              Specialists
            </Link>
            <Link href="/" className="blog-btn-ghost !min-h-0 !px-gs-3 !py-gs-1 text-xs">
              Shop gifts
            </Link>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-border-subtle px-gs-4 py-gs-6 sm:px-gs-6">
        <div className="mx-auto flex w-full max-w-page flex-wrap items-center justify-between gap-gs-3 text-sm">
          <p className="opacity-70">Inabiya Journal</p>
          <nav className="flex flex-wrap gap-gs-4" aria-label="Journal footer">
            <Link href="/blog" className="hover:text-primary">
              Journal
            </Link>
            <Link href="/specialists" className="hover:text-primary">
              Specialists
            </Link>
            <Link href="/" className="hover:text-primary">
              Shop
            </Link>
          </nav>
        </div>
      </footer>
      <CookieBanner enabled initialConsent={consent} theme="blog" />
    </ThemeFontShell>
  );
}
