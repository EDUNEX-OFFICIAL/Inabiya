/**
 * Pure helpers for catalog collection admin ops (unit-checked).
 */

/** MANUAL delete is blocked while products still link to the collection. RULES always deletable. */
export function collectionDeleteBlocked(
  membershipMode: 'MANUAL' | 'RULES',
  productCount: number,
): boolean {
  if (membershipMode === 'RULES') return false;
  return productCount > 0;
}
