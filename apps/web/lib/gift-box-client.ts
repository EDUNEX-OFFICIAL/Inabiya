import { apiUrl } from './api-base';
import { getStoredAccessToken, tryRefreshSession } from './auth-client';
import { getCartToken, setCartToken, type CartDto } from './cart-client';

const GIFT_BOX_TOKEN_KEY = 'inabiya_gift_box_token';

export function getGiftBoxToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(GIFT_BOX_TOKEN_KEY);
}

export function setGiftBoxToken(token: string): void {
  localStorage.setItem(GIFT_BOX_TOKEN_KEY, token);
}

export type GiftBoxDto = {
  id: string;
  name: string;
  guestToken?: string | null;
  budgetPaise: number | null;
  recipient: string | null;
  ageBand: string | null;
  occasion: string | null;
  collectionSlugs: string[];
  wizardStep: number;
  subtotalPaise: number;
  remainingBudgetPaise: number | null;
  overBudgetPaise?: number;
  brandNames?: string[];
  items: Array<{
    id: string;
    productTitle: string;
    productSlug?: string;
    label: string;
    quantity: number;
    lineTotalPaise: number;
    brandName?: string | null;
    imageUrl?: string | null;
  }>;
};

type GiftBoxPayload = GiftBoxDto & { cart?: CartDto; box?: GiftBoxDto };

function giftBoxHeaders(auth?: string | null): Headers {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (auth) headers.set('Authorization', `Bearer ${auth}`);
  const t = getGiftBoxToken();
  if (t) headers.set('x-gift-box-token', t);
  const cartToken = getCartToken();
  if (cartToken) headers.set('x-cart-token', cartToken);
  return headers;
}

function rememberTokens(data: GiftBoxPayload): void {
  const boxToken = data.guestToken ?? data.box?.guestToken;
  if (boxToken) setGiftBoxToken(boxToken);
  const cartToken = data.cart?.guestToken;
  if (cartToken) setCartToken(cartToken);
}

export async function giftBoxApi<T>(
  path: string,
  init?: RequestInit & { json?: unknown; authToken?: string | null; _retried?: boolean },
): Promise<T> {
  const headers = giftBoxHeaders(init?.authToken ?? getStoredAccessToken());
  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (res.status === 401 && !init?._retried) {
    const hadAuth = Boolean(init?.authToken || getStoredAccessToken());
    if (hadAuth) {
      const ok = await tryRefreshSession();
      if (ok) {
        return giftBoxApi<T>(path, {
          ...init,
          authToken: getStoredAccessToken(),
          _retried: true,
        });
      }
    }
    return giftBoxApi<T>(path, {
      ...init,
      authToken: null,
      _retried: true,
    });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error?.message === 'string'
        ? data.error.message
        : `Request failed (${res.status})`,
    );
  }
  rememberTokens(data as GiftBoxPayload);
  return data as T;
}
