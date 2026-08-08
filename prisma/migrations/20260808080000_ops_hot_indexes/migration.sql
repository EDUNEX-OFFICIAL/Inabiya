-- CreateIndex
CREATE INDEX "orders_created_at_id_idx" ON "orders"("created_at", "id");

-- CreateIndex
CREATE INDEX "orders_paid_at_idx" ON "orders"("paid_at");

-- CreateIndex
CREATE INDEX "orders_status_paid_at_idx" ON "orders"("status", "paid_at");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "inventory_items_on_hand_idx" ON "inventory_items"("on_hand");
