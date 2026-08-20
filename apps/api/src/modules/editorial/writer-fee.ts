/** Assignment fee in paise. Env `WRITER_FEE_PAISE` is the create default only. */
export const WRITER_FEE_PAISE_MAX = 10_000_000;
export const WRITER_FEE_PAISE_FALLBACK = 50_000;

export function defaultWriterFeePaise(): number {
  const n = Number(process.env.WRITER_FEE_PAISE ?? WRITER_FEE_PAISE_FALLBACK);
  if (!Number.isInteger(n) || n < 0 || n > WRITER_FEE_PAISE_MAX) {
    return WRITER_FEE_PAISE_FALLBACK;
  }
  return n;
}

export function writerFeeForPayment(articleFeePaise: number): number {
  if (!Number.isInteger(articleFeePaise) || articleFeePaise < 0) {
    return defaultWriterFeePaise();
  }
  return Math.min(articleFeePaise, WRITER_FEE_PAISE_MAX);
}

/** Who may read assignment fee — same as Payments nav, not writers/SEO/medical. */
export const WRITER_FEE_VIEW_ROLES = ['CONTENT_ADMIN', 'SUPER_ADMIN', 'FINANCE'] as const;

export function canSeeWriterFee(roles: string[]): boolean {
  return roles.some((r) => (WRITER_FEE_VIEW_ROLES as readonly string[]).includes(r));
}
