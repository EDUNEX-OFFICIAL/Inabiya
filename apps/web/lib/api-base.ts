/**
 * Browser: same-origin `/api/v1` (Next rewrite → API) unless NEXT_PUBLIC_API_URL is an absolute URL.
 * Server/SSR: API_URL (Docker: http://api:4001) then NEXT_PUBLIC_*, then loopback.
 */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const pub = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
    if (!pub || pub === 'same-origin' || pub === '/') return '';
    return pub;
  }
  const server =
    process.env.API_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    '';
  if (!server || server === 'same-origin' || server === '/') {
    return 'http://127.0.0.1:4001';
  }
  return server;
}

export function apiUrl(path: string): string {
  const base = getApiBase();
  const p = path.startsWith('/') ? path : `/${path}`;
  const withPrefix = p.startsWith('/api/v1') ? p : `/api/v1${p}`;
  return `${base}${withPrefix}`;
}
