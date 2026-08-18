'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import {
  applyConsentUpdate,
  marketingConsentGranted,
  readConsentCookie,
  writeConsentCookie,
  type ConsentChoice,
} from '@/lib/consent';
import { cn } from '@/lib/utils';

export function CookieBanner({
  enabled,
  initialConsent,
  theme,
}: {
  enabled: boolean;
  initialConsent: ConsentChoice | null;
  theme: 'gift' | 'blog';
}) {
  const [choice, setChoice] = useState<ConsentChoice | null>(initialConsent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setChoice(readConsentCookie() ?? initialConsent);
    setReady(true);
  }, [initialConsent]);

  const decide = useCallback((next: ConsentChoice) => {
    writeConsentCookie(next);
    applyConsentUpdate(next);
    setChoice(next);
  }, []);

  if (!enabled || !ready || choice) return null;

  const isGift = theme === 'gift';
  const acceptClass = isGift
    ? 'clay-btn min-h-10 flex-1 text-sm'
    : 'blog-btn min-h-10 flex-1 text-sm';
  const rejectClass = isGift
    ? 'clay-btn-secondary min-h-10 flex-1 text-sm'
    : 'blog-btn-secondary min-h-10 flex-1 text-sm';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] p-gs-3 pb-[max(var(--space-3),env(safe-area-inset-bottom))] print:hidden sm:inset-x-auto sm:bottom-gs-6 sm:left-gs-6 sm:right-auto sm:max-w-sm sm:p-0"
      role="region"
      aria-labelledby="inabiya-cookie-title"
    >
      <div
        className={cn(
          'pointer-events-auto mx-auto flex w-full max-w-sm flex-col gap-gs-4 border border-[var(--border-subtle)] bg-[var(--surface)] p-gs-5 sm:mx-0',
          isGift ? 'rounded-clay shadow-clay' : 'rounded-[var(--radius-lg)] shadow-brand',
        )}
      >
        <div>
          <h2
            id="inabiya-cookie-title"
            className="font-display text-h2 font-semibold tracking-tight"
          >
            Cookies
          </h2>
          <p className={cn('mt-gs-2 text-body', isGift ? 'gift-muted' : 'opacity-80')}>
            We use them for analytics and ads.{' '}
            <Link
              href="/privacy-policy"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
          </p>
        </div>
        <div className="flex gap-gs-2">
          <button type="button" className={rejectClass} onClick={() => decide('necessary')}>
            Reject
          </button>
          <button type="button" className={acceptClass} onClick={() => decide('all')}>
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

export function useMarketingConsent(initialConsent: ConsentChoice | null): boolean {
  const [granted, setGranted] = useState(() => marketingConsentGranted(initialConsent));

  useEffect(() => {
    const sync = () => setGranted(marketingConsentGranted(readConsentCookie() ?? initialConsent));
    sync();
    window.addEventListener('inabiya-consent', sync);
    return () => window.removeEventListener('inabiya-consent', sync);
  }, [initialConsent]);

  return granted;
}
