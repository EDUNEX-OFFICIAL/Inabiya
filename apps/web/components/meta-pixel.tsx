'use client';

import Script from 'next/script';
import { useMarketingConsent } from '@/components/cookie-banner';
import { marketingConsentGranted, type ConsentChoice } from '@/lib/consent';

export function MetaPixel({
  pixelId,
  enabled,
  initialConsent,
}: {
  pixelId?: string;
  enabled: boolean;
  initialConsent: ConsentChoice | null;
}) {
  const granted = useMarketingConsent(initialConsent);
  if (!enabled || !pixelId || !granted) return null;

  return (
    <>
      <Script id="inabiya-meta-pixel" strategy="afterInteractive">{`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView');
`}</Script>
      {marketingConsentGranted(initialConsent) ? (
        <noscript>
          <img
            height={1}
            width={1}
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>
      ) : null}
    </>
  );
}
