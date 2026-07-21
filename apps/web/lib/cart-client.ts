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
  couponRemoved?: boolean;
  couponRemovedReason?: string | null;
  itemCount: number;
  subtotalPaise: number;
  discountPaise?: number;
  totalPaise?: number;
  items: Array<{
    id: string;
    variantId: string;
    productTitle: string;
    productSlug: string;
    sku: string;
    label: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    available: number;
  }>;
};

function cartHeaders(token?: string | null, auth?: string | null): Headers {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (auth) headers.set('Authorization', `Bearer ${auth}`);
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
  const headers = cartHeaders(getCartToken(), init?.authToken ?? getStoredAccessToken());
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
      typeof data?.error?.message === 'string' ? data.error.message : `Request failed (${res.status})`,
    );
  }
  if ((data as CartDto).guestToken) setCartToken((data as CartDto).guestToken!);
  return data as T;
}

export { formatInr } from './catalog';
