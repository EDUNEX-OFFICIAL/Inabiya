'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  applyConsentUpdate,
  marketingConsentGranted,
  readConsentCookie,
  writeConsentCookie,
  type ConsentChoice,
} from '@/lib/consent';

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

  const acceptClass = theme === 'blog' ? 'blog-btn min-h-10 text-sm' : 'clay-btn min-h-10 text-sm';
  const rejectClass =
    theme === 'blog'
      ? 'blog-btn-secondary min-h-10 text-sm'
      : 'clay-btn-secondary min-h-10 text-sm';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] p-gs-3 print:hidden"
      role="region"
      aria-label="Cookies"
    >
      <div
        className={
          theme === 'gift'
            ? 'pointer-events-auto mx-auto flex max-w-page flex-col gap-gs-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-gs-4 shadow-clay sm:flex-row sm:items-center sm:justify-between'
            : 'pointer-events-auto mx-auto flex max-w-page flex-col gap-gs-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface)] p-gs-4 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <p className="text-body">Cookies for analytics and ads.</p>
        <div className="flex flex-wrap gap-gs-2">
          <button type="button" className={rejectClass} onClick={() => decide('necessary')}>
            Reject
          </button>
          <button type="button" className={acceptClass} onClick={() => decide('all')}>
            Accept
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
