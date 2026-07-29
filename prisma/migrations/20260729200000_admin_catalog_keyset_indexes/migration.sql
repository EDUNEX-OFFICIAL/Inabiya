-- Admin catalog desk keyset pagination (updated_at DESC, id DESC)
CREATE INDEX IF NOT EXISTS "products_updated_at_id_idx" ON "products" ("updated_at", "id");
CREATE INDEX IF NOT EXISTS "products_status_updated_at_id_idx" ON "products" ("status", "updated_at", "id");
