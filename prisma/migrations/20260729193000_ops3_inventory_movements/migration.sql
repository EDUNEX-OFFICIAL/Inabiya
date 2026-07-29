-- OPS-3 inventory movement ledger
CREATE TYPE "InventoryMovementReason" AS ENUM (
  'RECEIVE',
  'DAMAGE',
  'RECOUNT',
  'CORRECTION',
  'RESERVE',
  'RELEASE',
  'COMMIT',
  'RESTOCK'
);

CREATE TABLE "inventory_movements" (
  "id" UUID NOT NULL,
  "variant_id" UUID NOT NULL,
  "inventory_id" UUID NOT NULL,
  "delta_on_hand" INTEGER NOT NULL,
  "reason" "InventoryMovementReason" NOT NULL,
  "note" TEXT,
  "actor_id" UUID,
  "on_hand_after" INTEGER NOT NULL,
  "reserved_after" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inventory_movements_variant_id_created_at_idx" ON "inventory_movements"("variant_id", "created_at");
CREATE INDEX "inventory_movements_inventory_id_idx" ON "inventory_movements"("inventory_id");

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_inventory_id_fkey"
  FOREIGN KEY ("inventory_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_variant_id_fkey"
  FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inventory_movements"
  ADD CONSTRAINT "inventory_movements_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
