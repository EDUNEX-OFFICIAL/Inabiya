import { apiUrl } from './api-base';
import { getStoredAccessToken, tryRefreshSession } from './auth-client';

const CART_TOKEN_KEY = 'inabiya_cart_token';

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CART_TOKEN_KEY);
}

export function setCartToken(token: string): void {
  localStorage.setItem(CART_TOKEN_KEY, token);
}

export type CartDto = {
  id: string;
  guestToken?: string | null;
  couponCode?: string | null;
  cartCouponCode?: string | null;
  lineCouponCode?: string | null;
  couponCodes?: string[];
  couponLabel?: string | null;
  couponRemoved?: boolean;
  couponRemovedReason?: string | null;
  itemCount: number;
  subtotalPaise: number;
  discountPaise?: number;
  totalPaise?: number;
  lastItemId?: string;
  items: Array<{
    id: string;
    variantId: string;
    productTitle: string;
    productSlug: string;
    imageUrl?: string | null;
    sku: string;
    label: string;
    quantity: number;
    unitPricePaise: number;
    extrasPaise?: number;
    lineTotalPaise: number;
    available: number;
    personalization?: unknown;
    giftExtras?: {
      note?: { label: string; value: string; pricePaise: number };
      wrap?: { id: string; label: string; pricePaise: number };
      ribbon?: { id: string; label: string; pricePaise: number };
    } | null;
  }>;
};

function cartHeaders(token?: string | null): Headers {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Requested-With': 'InabiyaWeb',
  });
  const t = token ?? getCartToken();
  if (t) headers.set('x-cart-token', t);
  return headers;
}

export async function fetchCart(authToken?: string | null): Promise<CartDto> {
  return cartApi<CartDto>('/cart', { authToken: authToken ?? getStoredAccessToken() });
}

export async function cartApi<T>(
  path: string,
  init?: RequestInit & { json?: unknown; authToken?: string | null; _retried?: boolean },
): Promise<T> {
  const headers = cartHeaders(getCartToken());
  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (res.status === 401 && !init?._retried && (init?.authToken || getStoredAccessToken())) {
    const ok = await tryRefreshSession();
    if (ok) {
      return cartApi<T>(path, {
        ...init,
        authToken: getStoredAccessToken(),
        _retried: true,
      });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error?.message === 'string'
        ? data.error.message
        : `Request failed (${res.status})`,
    );
  }
  if ((data as CartDto).guestToken) setCartToken((data as CartDto).guestToken!);
  return data as T;
}

export function formatInr(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function couponCodesOnCart(c: Pick<CartDto, 'couponCodes' | 'couponCode'>): string[] {
  if (c.couponCodes?.length) return c.couponCodes;
  return c.couponCode ? [c.couponCode] : [];
}

export function formatCartCoupons(
  c: Pick<CartDto, 'couponCodes' | 'couponCode' | 'couponLabel'>,
): string | null {
  if (c.couponLabel) return c.couponLabel;
  const codes = couponCodesOnCart(c);
  return codes.length ? codes.join(' + ') : null;
}

export function shippingMethodLabel(method?: string | null): string {
  if (method === 'EXPRESS') return 'Express';
  if (method === 'STANDARD') return 'Standard';
  return method ? method.replaceAll('_', ' ') : '';
}

export function orderStatusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING_PAYMENT: 'Payment pending',
    PAID: 'Paid',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled',
    PAYMENT_FAILED: 'Payment failed',
    RETURNED: 'Returned',
    CAPTURED: 'Paid',
    PENDING: 'Pending',
    FAILED: 'Failed',
    REFUNDED: 'Refunded',
  };
  return map[status] ?? status.replaceAll('_', ' ');
}
