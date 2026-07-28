-- Soft Gift leftovers Wave 2: idempotent commerce invoice snapshots
CREATE TABLE IF NOT EXISTS "commerce_invoices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "order_id" UUID NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "issued_at" TIMESTAMP(3) NOT NULL,
  "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commerce_invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "commerce_invoices_order_id_key" ON "commerce_invoices"("order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "commerce_invoices_invoice_number_key" ON "commerce_invoices"("invoice_number");

DO $$ BEGIN
  ALTER TABLE "commerce_invoices"
    ADD CONSTRAINT "commerce_invoices_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
