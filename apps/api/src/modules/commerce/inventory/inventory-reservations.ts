/**
 * OPS-3 P1 — open inventory holds.
 * Checkout `reserve()` holds stock while order is PENDING_PAYMENT;
 * paid → commit; fail/cancel → release. So drill-down = PENDING_PAYMENT lines only.
 */
export const HOLD_ORDER_STATUSES = ['PENDING_PAYMENT'] as const;

export type HoldOrderStatus = (typeof HOLD_ORDER_STATUSES)[number];

export function isHoldOrderStatus(status: string): status is HoldOrderStatus {
  return (HOLD_ORDER_STATUSES as readonly string[]).includes(status);
}

export function sumHoldQuantity(rows: Array<{ quantity: number }>): number {
  return rows.reduce((sum, r) => sum + r.quantity, 0);
}
