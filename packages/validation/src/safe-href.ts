import { z } from 'zod';

/** Same-origin path, in-page hash, or https/mailto/tel. No protocol-relative, javascript, or data. */
export function isSafeStorefrontHref(raw: string): boolean {
  const s = raw.trim();
  if (!s || s.length > 500) return false;
  if (s.startsWith('#') && /^#[\w.-]*$/.test(s)) return true;
  if (s.startsWith('/') && !s.startsWith('//') && !s.includes('..')) {
    return /^\/[\w./@%~+\-?&=#]*$/i.test(s);
  }
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'mailto:' || u.protocol === 'tel:';
  } catch {
    return false;
  }
}

/** Unsafe or empty stored hrefs render as a no-op hash. */
export function safeHrefOrHash(raw: string | null | undefined): string {
  if (!raw?.trim()) return '#';
  return isSafeStorefrontHref(raw) ? raw.trim() : '#';
}

export const safeStorefrontHrefSchema = z.string().min(1).max(500).refine(isSafeStorefrontHref, {
  message: 'Href must be a same-origin path or https/mailto/tel.',
});

export const optionalSafeStorefrontHrefSchema = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z
    .string()
    .max(500)
    .refine(isSafeStorefrontHref, {
      message: 'Href must be a same-origin path or https/mailto/tel.',
    })
    .optional(),
);

/** Login/register `next` — same-origin path only, no protocol-relative or `..`. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s.startsWith('/') || s.startsWith('//') || s.includes('..')) return null;
  if (!/^\/[A-Za-z0-9._~/\-?&=#%]*$/.test(s)) return null;
  return s;
}
