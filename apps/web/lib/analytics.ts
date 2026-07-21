/** Lightweight funnel event tracker for Soft Gift storefront. */
import { apiUrl } from './api-base';

const SESSION_KEY = 'inabiya_analytics_sid';

export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function trackEvent(
  name: 'view_plp' | 'view_pdp' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  extra?: { productId?: string; orderId?: string; path?: string },
): void {
  if (typeof window === 'undefined') return;
  const body = {
    name,
    sessionId: getAnalyticsSessionId(),
    path: extra?.path ?? window.location.pathname,
    productId: extra?.productId,
    orderId: extra?.orderId,
  };
  void fetch(apiUrl('/analytics/track'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
}
