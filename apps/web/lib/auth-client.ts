import { apiUrl } from './api-base';
import { safeNextPath } from '@inabiya/validation';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  roles: string[];
};

export type AuthSession = {
  user: AuthUser;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
};

const ACCESS_KEY = 'inabiya_access_token';
const REFRESH_KEY = 'inabiya_refresh_token';
const USER_KEY = 'inabiya_user';
const AUTH_CHANGED = 'inabiya-auth-changed';

export const CSRF_HEADER = 'X-Requested-With';
export const CSRF_HEADER_VALUE = 'InabiyaWeb';

/** Error from apiAuth / apiAuthUpload with HTTP status (for 401 vs other failures). */
export class ApiClientError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
  }
}

export function isUnauthorizedError(err: unknown): boolean {
  return err instanceof ApiClientError && err.status === 401;
}

/** Soft Gift / ops return path after login. */
export function loginUrl(nextPath: string): string {
  const safe = safeNextPath(nextPath) ?? '/gift';
  return `/login?next=${encodeURIComponent(safe)}`;
}

/** Cookie session: never a real JWT. Truthy when a cached user exists. */
export function getStoredAccessToken(): string | null {
  return getStoredUser() ? 'cookie' : null;
}

export function getStoredRefreshToken(): string | null {
  return null;
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
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  notifyAuthChanged();
}

/** Update cached user (e.g. after profile PATCH) so nav/header re-render. */
export function updateStoredUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChanged();
}

function withCsrf(headers: Headers): Headers {
  headers.set(CSRF_HEADER, CSRF_HEADER_VALUE);
  return headers;
}

let refreshInFlight: Promise<boolean> | null = null;

/** Silent refresh via httpOnly cookie; shared across parallel 401s. */
export async function tryRefreshSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(apiUrl('/auth/refresh'), {
        method: 'POST',
        headers: withCsrf(new Headers({ 'Content-Type': 'application/json' })),
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        clearSession();
        return false;
      }
      const session = (await res.json()) as AuthSession;
      if (session.user) storeSession(session);
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
  const headers = withCsrf(new Headers(init?.headers));
  if (init?.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

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
    throw new ApiClientError(message, res.status);
  }
  return data as T;
}

/**
 * Authenticated multipart upload. Does not set Content-Type so the browser
 * can attach the multipart boundary. Retries once after silent refresh on 401.
 */
export async function apiAuthUpload<T>(
  path: string,
  form: FormData,
  init?: { _retried?: boolean },
): Promise<T> {
  const headers = withCsrf(new Headers());

  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers,
    credentials: 'include',
    body: form,
  });

  if (res.status === 401 && !init?._retried) {
    const ok = await tryRefreshSession();
    if (ok) {
      return apiAuthUpload<T>(path, form, { _retried: true });
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      typeof data?.error?.message === 'string'
        ? data.error.message
        : `Upload failed (${res.status})`;
    throw new ApiClientError(message, res.status);
  }
  return data as T;
}

/** Authenticated binary/HTML download (invoice, etc.). Triggers browser save. */
export async function apiAuthDownload(path: string, fallbackFilename: string): Promise<void> {
  const headers = withCsrf(new Headers());

  let res = await fetch(apiUrl(path), {
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const ok = await tryRefreshSession();
    if (ok) {
      res = await fetch(apiUrl(path), { headers: withCsrf(new Headers()), credentials: 'include' });
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof (data as { error?: { message?: string } })?.error?.message === 'string'
        ? (data as { error: { message: string } }).error.message
        : `Download failed (${res.status})`;
    throw new Error(message);
  }

  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? fallbackFilename;
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
