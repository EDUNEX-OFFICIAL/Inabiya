export const CONSENT_COOKIE = 'inabiya_consent';
export const CONSENT_EVENT = 'inabiya-consent';
export const CONSENT_MAX_AGE_SEC = 60 * 60 * 24 * 180;

export type ConsentChoice = 'all' | 'necessary';

export const CONSENT_DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500,
} as const;

export const CONSENT_GRANTED = {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  security_storage: 'granted',
} as const;

export function parseConsentValue(raw: string | undefined | null): ConsentChoice | null {
  if (raw === 'all' || raw === 'necessary') return raw;
  return null;
}

export function consentDefaultPayload(choice: ConsentChoice | null) {
  return choice === 'all' ? { ...CONSENT_GRANTED, wait_for_update: 500 } : { ...CONSENT_DENIED };
}

export function marketingConsentGranted(choice: ConsentChoice | null): boolean {
  return choice === 'all';
}

export function readConsentCookie(): ConsentChoice | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === CONSENT_COOKIE) return parseConsentValue(rest.join('='));
  }
  return null;
}

export function writeConsentCookie(choice: ConsentChoice): void {
  if (typeof document === 'undefined') return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=${CONSENT_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function applyConsentUpdate(choice: ConsentChoice): void {
  const gtag = window.gtag;
  if (typeof gtag === 'function') {
    if (choice === 'all') {
      gtag('consent', 'update', CONSENT_GRANTED);
    } else {
      gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        analytics_storage: 'denied',
      });
    }
  }
  window.dispatchEvent(new Event(CONSENT_EVENT));
}
