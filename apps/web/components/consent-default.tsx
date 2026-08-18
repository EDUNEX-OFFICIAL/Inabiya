import { consentDefaultPayload, type ConsentChoice } from '@/lib/consent';

export function ConsentDefault({ choice }: { choice: ConsentChoice | null }) {
  const html = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('consent','default',${JSON.stringify(consentDefaultPayload(choice))});`;
  return <script id="inabiya-consent-default" dangerouslySetInnerHTML={{ __html: html }} />;
}
