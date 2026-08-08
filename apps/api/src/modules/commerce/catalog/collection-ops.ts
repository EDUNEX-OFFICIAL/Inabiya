/**
 * Pure helpers for catalog collection admin ops (unit-checked).
 */

/** MANUAL delete blocked while products still link. SMART always deletable. */
export function collectionDeleteBlocked(
  membershipMode: 'MANUAL' | 'SMART',
  productCount: number,
): boolean {
  if (membershipMode === 'SMART') return false;
  return productCount > 0;
}
