-- OPS-3 P1: reservation drill-down by variant (PENDING_PAYMENT holds)
CREATE INDEX "order_items_variant_id_idx" ON "order_items"("variant_id");
