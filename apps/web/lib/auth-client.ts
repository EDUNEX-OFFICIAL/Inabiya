import { apiUrl } from './api-base';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
};

export type AuthSession = {
  user: AuthUser;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};

const ACCESS_KEY = 'inabiya_access_token';
const REFRESH_KEY = 'inabiya_refresh_token';
const USER_KEY = 'inabiya_user';
const AUTH_CHANGED = 'inabiya-auth-changed';

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function notifyAuthChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_CHANGED));
}

/** Gift/admin shells stay mounted across soft navigations — subscribe to re-read localStorage. */
export function subscribeAuthChanged(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(AUTH_CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function storeSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_KEY, session.tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, session.tokens.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  notifyAuthChanged();
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChanged();
}

let refreshInFlight: Promise<boolean> | null = null;

/** Silent refresh; shared across parallel 401s. */
export async function tryRefreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        clearSession();
        return false;
      }
      const session = (await res.json()) as AuthSession;
      storeSession(session);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function apiAuth<T>(
  path: string,
  init?: RequestInit & { json?: unknown; _retried?: boolean },
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getStoredAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (res.status === 401 && !init?._retried) {
    const ok = await tryRefreshSession();
    if (ok) {
      return apiAuth<T>(path, { ...init, _retried: true });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error?.message === 'string'
        ? data.error.message
        : `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data as T;
}
