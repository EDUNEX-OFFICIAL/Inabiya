/** Pure segment labels for CRM desk (OPS-5). */
export function customerSegments(input: {
  isActive: boolean;
  orderCount: number;
  ltvPaise: number;
}): string[] {
  const segments: string[] = [];
  if (!input.isActive) segments.push('suspended');
  if (input.orderCount === 0) segments.push('new');
  if (input.orderCount >= 2) segments.push('repeat_buyer');
  if (input.ltvPaise >= 1_000_000) segments.push('high_value');
  return segments;
}
