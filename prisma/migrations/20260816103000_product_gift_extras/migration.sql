-- Per-product gift choices are priced/configured in Product.gift_options.
-- Cart and order rows keep immutable server-calculated fulfillment snapshots.
ALTER TABLE "products"
  ADD COLUMN "gift_options" JSONB;

ALTER TABLE "cart_items"
  ADD COLUMN "gift_extras" JSONB,
  ADD COLUMN "extras_paise" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "order_items"
  ADD COLUMN "gift_extras" JSONB,
  ADD COLUMN "extras_paise" INTEGER NOT NULL DEFAULT 0;

-- A customer may buy one variant for different recipients with different notes/wraps.
ALTER TABLE "cart_items"
  DROP CONSTRAINT IF EXISTS "cart_items_cart_id_variant_id_key";

CREATE INDEX "cart_items_cart_id_variant_id_idx" ON "cart_items"("cart_id", "variant_id");
