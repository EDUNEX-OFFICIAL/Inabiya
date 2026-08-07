/**
 * Pure helpers for catalog category admin ops (unit-checked).
 */

/** Delete is blocked while products still link to the category. */
export function categoryDeleteBlocked(productCount: number): boolean {
  return productCount > 0;
}
