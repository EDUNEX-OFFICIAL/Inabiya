/** Lightweight funnel event tracker for Soft Gift storefront. */
import { apiUrl } from './api-base';
import { CSRF_HEADER, CSRF_HEADER_VALUE } from './auth-client';

const SESSION_KEY = 'inabiya_analytics_sid';

const DATA_LAYER_EVENT: Record<
  'view_plp' | 'view_pdp' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  string
> = {
  view_plp: 'view_item_list',
  view_pdp: 'view_item',
  add_to_cart: 'add_to_cart',
  begin_checkout: 'begin_checkout',
  purchase: 'purchase',
};

type GtagFn = (...args: unknown[]) => void;

type AnalyticsExtra = {
  productId?: string;
  orderId?: string;
  path?: string;
  valuePaise?: number;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: GtagFn;
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[];
      loaded?: boolean;
      version?: string;
      push?: unknown;
    };
    _fbq?: (...args: unknown[]) => void;
    __inabiyaGoogleAds?: { id: string | null; label: string | null };
  }
}

export function getAnalyticsSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Integer paise → rupee string (`123.45`). No float business math. */
export function paiseToInrString(paise: number): string {
  const n = Math.trunc(paise);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const rupees = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${sign}${rupees}.${String(frac).padStart(2, '0')}`;
}

function pushGoogle(name: keyof typeof DATA_LAYER_EVENT, extra?: AnalyticsExtra): void {
  try {
    const event = DATA_LAYER_EVENT[name];
    const valueInr =
      extra?.valuePaise != null && Number.isFinite(extra.valuePaise)
        ? paiseToInrString(extra.valuePaise)
        : undefined;
    window.dataLayer = window.dataLayer ?? [];
    const row: Record<string, unknown> = { event };
    if (extra?.productId) row.item_id = extra.productId;
    if (extra?.orderId) {
      row.transaction_id = extra.orderId;
      row.orderId = extra.orderId;
    }
    if (valueInr) {
      row.value = valueInr;
      row.currency = 'INR';
    }
    window.dataLayer.push(row);

    const fbq = window.fbq;
    if (typeof fbq === 'function') {
      const metaName =
        name === 'view_pdp'
          ? 'ViewContent'
          : name === 'add_to_cart'
            ? 'AddToCart'
            : name === 'begin_checkout'
              ? 'InitiateCheckout'
              : name === 'purchase'
                ? 'Purchase'
                : null;
      if (metaName) {
        const params: Record<string, unknown> = { currency: 'INR' };
        if (extra?.productId) {
          params.content_ids = [extra.productId];
          params.content_type = 'product';
        }
        if (valueInr) params.value = Number(valueInr);
        fbq('track', metaName, params);
      }
    }

    const gtag = window.gtag;
    if (typeof gtag === 'function') {
      const params: Record<string, unknown> = {};
      if (extra?.productId) params.item_id = extra.productId;
      if (extra?.orderId) params.transaction_id = extra.orderId;
      if (valueInr) {
        params.value = Number(valueInr);
        params.currency = 'INR';
      }
      gtag('event', event, params);
      const ads = window.__inabiyaGoogleAds;
      if (name === 'purchase' && ads?.id && ads.label && extra?.orderId) {
        gtag('event', 'conversion', {
          send_to: `${ads.id}/${ads.label}`,
          value: valueInr ? Number(valueInr) : undefined,
          currency: 'INR',
          transaction_id: extra.orderId,
        });
      }
    }
  } catch {
    /* never block storefront */
  }
}

export function trackEvent(
  name: 'view_plp' | 'view_pdp' | 'add_to_cart' | 'begin_checkout' | 'purchase',
  extra?: AnalyticsExtra,
): void {
  if (typeof window === 'undefined') return;
  const body = {
    name,
    sessionId: getAnalyticsSessionId(),
    path: extra?.path ?? window.location.pathname,
    productId: extra?.productId,
    orderId: extra?.orderId,
    metadata: extra?.valuePaise != null ? { valuePaise: extra.valuePaise } : undefined,
  };
  void fetch(apiUrl('/analytics/track'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', [CSRF_HEADER]: CSRF_HEADER_VALUE },
    credentials: 'include',
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => undefined);
  pushGoogle(name, extra);
}
