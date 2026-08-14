/** Models `UPDATE inventory_items SET reserved = reserved + qty WHERE (on_hand - reserved) >= qty`. */

export function tryAtomicReserve(row: { onHand: number; reserved: number }, qty: number): boolean {
  if (!Number.isInteger(qty) || qty <= 0) return false;
  if (row.onHand - row.reserved < qty) return false;
  row.reserved += qty;
  return true;
}
