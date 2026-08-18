import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { GiftLayoutChrome } from '@/components/gift/gift-layout-chrome';
import { ConsentDefault } from '@/components/consent-default';
import { ThemeFontShell } from '@/components/theme-font-shell';
import { CONSENT_COOKIE, parseConsentValue } from '@/lib/consent';
import { fetchStorefrontTracking } from '@/lib/storefront-tracking';
import './gift-hero-fouc.css';

export async function generateMetadata(): Promise<Metadata> {
  const tracking = await fetchStorefrontTracking();
  if (!tracking.googleSiteVerification) return {};
  return { verification: { google: tracking.googleSiteVerification } };
}

export default async function GiftLayout({ children }: { children: React.ReactNode }) {
  const tracking = await fetchStorefrontTracking();
  const consent = parseConsentValue(cookies().get(CONSENT_COOKIE)?.value);
  return (
    <ThemeFontShell theme="gift" className="clay-shell flex min-h-screen flex-col text-foreground">
      <ConsentDefault choice={consent} />
      <GiftLayoutChrome tracking={tracking} initialConsent={consent}>
        {children}
      </GiftLayoutChrome>
    </ThemeFontShell>
  );
}
