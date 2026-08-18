'use client';

import Script from 'next/script';
import type { GoogleTracking } from '@inabiya/validation';
import { marketingConsentGranted, type ConsentChoice } from '@/lib/consent';

type AdsCfg = { id: string | null; label: string | null };

function adsJson(t: GoogleTracking): string {
  const cfg: AdsCfg = {
    id: t.googleAdsId ?? null,
    label: t.googleAdsPurchaseLabel ?? null,
  };
  return JSON.stringify(cfg);
}

function hasLoader(t: GoogleTracking): boolean {
  return Boolean(t.gtmContainerId || t.ga4MeasurementId || t.googleAdsId);
}

export function GoogleTags({
  tracking,
  enabled,
  initialConsent,
}: {
  tracking: GoogleTracking;
  enabled: boolean;
  initialConsent: ConsentChoice | null;
}) {
  if (!enabled || !hasLoader(tracking)) return null;

  const gtm = tracking.gtmContainerId;
  const ga4 = tracking.ga4MeasurementId;
  const ads = tracking.googleAdsId;
  const adsCfg = adsJson(tracking);
  const noscript = marketingConsentGranted(initialConsent);

  if (gtm) {
    return (
      <>
        <Script id="inabiya-gtm" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
window.__inabiyaGoogleAds = ${adsCfg};
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtm}');
`}</Script>
        {noscript ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtm}`}
              height={0}
              width={0}
              style={{ display: 'none', visibility: 'hidden' }}
              title=""
            />
          </noscript>
        ) : null}
      </>
    );
  }

  const firstId = ga4 || ads;
  if (!firstId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${firstId}`}
        strategy="afterInteractive"
      />
      <Script id="inabiya-gtag" strategy="afterInteractive">{`
window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){dataLayer.push(arguments);};
gtag('js', new Date());
${ga4 ? `gtag('config', '${ga4}');` : ''}
${ads ? `gtag('config', '${ads}');` : ''}
window.__inabiyaGoogleAds = ${adsCfg};
`}</Script>
    </>
  );
}
