/** Clone-track index → real media index (first/last clones wrap). */
export function realIndex(pos: number, n: number, multi: boolean): number {
  if (!multi || n === 0) return 0;
  if (pos === 0) return n - 1;
  if (pos === n + 1) return 0;
  return Math.min(Math.max(pos - 1, 0), n - 1);
}
