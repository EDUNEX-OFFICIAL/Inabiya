-- OPS-4: fulfillment shipping cues on orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "carrier" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipped_at" TIMESTAMP(3);
