'use client';

import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api-base';
import {
  GiftStorefrontFooter,
  type GiftFooterProps,
} from '@/components/cms/gift-storefront-footer';
import { NewsletterForm } from '@/components/gift/newsletter-form';

type GiftChrome = {
  footer?: GiftFooterProps & { showNewsletter?: boolean };
};

/** Layout-owned Soft Gift footer from gift.chrome (skips auth/invoice via parent). */
export function GiftChromeFooter() {
  const [footer, setFooter] = useState<(GiftFooterProps & { showNewsletter?: boolean }) | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    void fetch(apiUrl('/catalog/gift-chrome'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GiftChrome | null) => {
        if (!cancelled) {
          const next = data?.footer ?? { showNewsletter: true };
          setFooter((prev) =>
            prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setFooter({ showNewsletter: true });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const props = footer ?? {};
  const showNewsletter = props.showNewsletter !== false;

  return (
    <div className="print:hidden">
      <GiftStorefrontFooter
        {...props}
        showNewsletter={showNewsletter}
        newsletterSlot={
          showNewsletter ? (
            <NewsletterForm compact title={props.newsletterTitle} hint={props.newsletterHint} />
          ) : undefined
        }
      />
    </div>
  );
}
